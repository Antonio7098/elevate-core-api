import axios from 'axios';
import prisma from '../lib/prisma';
import {
  ChatMessageDto,
  CreateLearningBlueprintDto,
  GenerateNoteFromBlueprintDto,
  GenerateQuestionsFromBlueprintDto,
} from '../dtos/ai-rag';
import { AIAPIClientService } from './ai-api-client.service';

// TODO: Move to environment variables
const AI_SERVICE_URL = process.env.AI_API_BASE_URL || 'http://localhost:8000';

class AiRAGService {
  constructor(private aiApiClient: AIAPIClientService) {}
  async createLearningBlueprint(
    userId: number,
    dto: CreateLearningBlueprintDto,
  ) {
    const { sourceText } = dto;

    // 1. Call AI Service to deconstruct the source text
    console.log('=== SERVICES AI RAG: BLUEPRINT CREATION STARTED ===');
    console.log(`Calling AI service at ${AI_SERVICE_URL}/api/v1/deconstruct`);
    console.log(`Using API key: ${process.env.AI_SERVICE_API_KEY ? '***' + process.env.AI_SERVICE_API_KEY.slice(-4) : 'undefined'}`);
  
    let blueprintJson: any;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/deconstruct`, {
        source_text: sourceText,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || 'test_api_key_123'}`,
          'Content-Type': 'application/json'
        }
      });
      
      blueprintJson = response.data.blueprint_json;
      console.log('✅ AI service /deconstruct call successful');
    } catch (error: any) {
      console.error('❌ AI service /deconstruct call failed:');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Failed to deconstruct text via AI service.');
    }

    // 2. Save the new LearningBlueprint to the database
    const newBlueprint = await prisma.learningBlueprint.create({
      data: {
        userId,
        sourceText,
        blueprintJson,
      },
    });

    // 3. Index the blueprint in the vector database and store sourceId
    try {
      const indexResponse = await this.aiApiClient.indexBlueprint({
        blueprint_id: newBlueprint.id.toString(),
        blueprint_json: newBlueprint.blueprintJson as Record<string, any>,
        force_reindex: false
      });
      console.log(`✅ Blueprint ${newBlueprint.id} indexed in vector database`);
      
      // Extract and store sourceId
      let sourceId = indexResponse.source_id;
      
      // If not in the response, try to get it from the blueprintJson
      if (!sourceId && newBlueprint.blueprintJson && (newBlueprint.blueprintJson as any).source_id) {
        sourceId = (newBlueprint.blueprintJson as any).source_id;
        console.log(`Using sourceId from blueprintJson: ${sourceId}`);
      }
      
      if (sourceId) {
        await prisma.learningBlueprint.update({
          where: { id: newBlueprint.id },
          data: { sourceId: sourceId }
        });
        console.log(`✅ Stored sourceId ${sourceId} for blueprint ${newBlueprint.id}`);
      } else {
        console.warn(`⚠️ No sourceId found for blueprint ${newBlueprint.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to index blueprint ${newBlueprint.id} in vector database:`, error);
      // Don't throw here - blueprint creation should succeed even if indexing fails
    }

    return newBlueprint;
  }

  async generateQuestionsFromBlueprint(
    userId: number, // Used for authorization
    blueprintId: number,
    dto: GenerateQuestionsFromBlueprintDto,
  ) {
    // 1. Authorize and fetch the blueprint
    const blueprint = await prisma.learningBlueprint.findFirst({
      where: { id: blueprintId, userId },
    });

    if (!blueprint) {
      throw new Error('Learning Blueprint not found or access denied.');
    }

    // 2. Call AI service to generate questions
    const aiServicePayload: any = {
      source_text: blueprint.sourceText,
      blueprint_json: blueprint.blueprintJson,
    };
    if (dto.questionOptions) {
      aiServicePayload.question_options = dto.questionOptions;
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/generate/questions`,
      aiServicePayload,
    );

    const aiQuestions = response.data.questions; // Assuming AI returns { questions: [{questionText, questionType, totalMarksAvailable, answers: [{answerText, isCorrect}]}] }

    // 3. Create QuestionSet and Questions in a transaction
    const questionSetData: any = {
      name: dto.name, // Expecting name on DTO, will require DTO update
      generatedFromBlueprintId: blueprintId,
      questions: {
        create: aiQuestions.map((q: any) => ({
          text: q.questionText, // Prisma model uses 'text'
          questionType: q.questionType,
          totalMarksAvailable: q.totalMarksAvailable || 1,
          options: q.answers?.map((ans: any) => ans.answerText) || [],
          answer: q.answers?.find((ans: any) => ans.isCorrect)?.answerText || null,
          // TODO: Map other potential fields from AI: conceptTags, uueFocus, markingCriteria etc.
        })),
      },
    };

    if (dto.folderId) {
      questionSetData.folder = { connect: { id: dto.folderId } };
    }

    const newQuestionSet = await prisma.questionSet.create({
      data: questionSetData,
      include: {
        questions: true, // Include the created questions
      },
    });

    return newQuestionSet;
  }

  async generateNoteFromBlueprint(
    userId: number,
    blueprintId: number,
    dto: GenerateNoteFromBlueprintDto,
  ) {
    // 1. Authorize and fetch the blueprint
    const blueprint = await prisma.learningBlueprint.findFirst({
      where: { id: blueprintId, userId },
    });

    if (!blueprint) {
      throw new Error('Learning Blueprint not found or access denied.');
    }

    // 2. Call AI service to generate note content
    const aiServicePayload: any = {
      source_text: blueprint.sourceText,
      blueprint_json: blueprint.blueprintJson,
    };
    if (dto.noteOptions) {
      aiServicePayload.note_options = dto.noteOptions;
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/generate/note`,
      aiServicePayload,
    );

    // Assuming AI returns { noteContent: Json, plainTextContent: string }
    const { noteContent, plainTextContent } = response.data;

    // 3. Create Note record in DB
    const noteData: any = {
      title: dto.name, // From DTO
      content: noteContent, // From AI service
      plainText: plainTextContent, // From AI service
      userId: userId, // The user creating the note
      generatedFromBlueprintId: blueprintId,
    };

    if (dto.folderId) {
      noteData.folder = { connect: { id: dto.folderId } };
    }

    const newNote = await prisma.note.create({
      data: noteData,
      include: {
        user: true,
        folder: true,
        generatedFromBlueprint: true,
      },
    });

    return newNote;
  }

  async handleChatMessage(userId: number, dto: ChatMessageDto) {
    const { messageContent, chatHistory, context } = dto;
    const validatedContext: any = {};

    if (context) {
      // Validate noteId
      if (context.noteId) {
        const note = await prisma.note.findFirst({
          where: { id: context.noteId, userId },
        });
        if (note) {
          validatedContext.noteId = note.id;
        }
      }

      // Validate blueprintId
      if (context.blueprintId) {
        const blueprint = await prisma.learningBlueprint.findFirst({
          where: { id: context.blueprintId, userId },
        });
        if (blueprint) {
          validatedContext.blueprintId = blueprint.id;
        }
      }

      // Validate questionSetId
      if (context.questionSetId) {
        const qs = await prisma.questionSet.findUnique({
          where: { id: context.questionSetId },
          include: {
            folder: { select: { userId: true } },
            generatedFromBlueprint: { select: { userId: true } },
          },
        });
        if (qs) {
          const folderOwned = qs.folder && qs.folder.userId === userId;
          const blueprintOwned = qs.generatedFromBlueprint && qs.generatedFromBlueprint.userId === userId;
          // If the question set is not in a folder and not from a blueprint, it's considered accessible if no ownership is defined.
          // However, our schema implies ownership via folder or blueprint.
          // For now, let's assume if it exists and is linked to user via folder or blueprint, it's valid.
          // If it has neither, and we need a user link, this logic might need adjustment based on business rules for unassociated QSets.
          if (folderOwned || blueprintOwned) {
            validatedContext.questionSetId = qs.id;
          } else if (!qs.folderId && !qs.generatedFromBlueprintId) {
            // This case means the QuestionSet has no explicit user link through folder or blueprint.
            // Depending on application rules, this might be a globally accessible QSet or an orphaned one.
            // For now, if it's unlinked, we'll assume it's not user-specific context unless rules state otherwise.
            // To be safe, we only include it if explicitly linked.
          }
        }
      }

      // Validate mentionedItems
      if (context.mentionedItems && context.mentionedItems.length > 0) {
        validatedContext.mentionedItems = [];
        for (const item of context.mentionedItems) {
          let isValid = false;
          switch (item.type) {
            case 'note':
              const note = await prisma.note.findFirst({
                where: { id: item.id, userId },
              });
              if (note) isValid = true;
              break;
            case 'blueprint':
              const blueprint = await prisma.learningBlueprint.findFirst({
                where: { id: item.id, userId },
              });
              if (blueprint) isValid = true;
              break;
            case 'folder':
              const folder = await prisma.folder.findFirst({
                where: { id: item.id, userId },
              });
              if (folder) isValid = true;
              break;
            case 'question_set':
              const qs = await prisma.questionSet.findUnique({
                where: { id: item.id },
                include: {
                  folder: { select: { userId: true } },
                  generatedFromBlueprint: { select: { userId: true } },
                },
              });
              if (qs) {
                const folderOwned = qs.folder && qs.folder.userId === userId;
                const blueprintOwned = qs.generatedFromBlueprint && qs.generatedFromBlueprint.userId === userId;
                if (folderOwned || blueprintOwned) {
                  isValid = true;
                } else if (!qs.folderId && !qs.generatedFromBlueprintId) {
                  // Not explicitly linked to user through folder/blueprint
                }
              }
              break;
          }
          if (isValid) {
            validatedContext.mentionedItems.push({ type: item.type, id: item.id });
          }
        }
      }
    }

    const aiServicePayload = {
      user_id: userId, // Pass userId for AI-side logging or user-specific RAG perhaps
      message_content: messageContent,
      chat_history: chatHistory,
      context: Object.keys(validatedContext).length > 0 ? validatedContext : undefined,
    };

    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/chat/message`,
        aiServicePayload,
      );
      return response.data;
    } catch (error) {
      console.error('Error calling AI chat service:', error);
      // Consider how to handle AI service errors. Re-throw, or return a specific error structure.
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`AI service error: ${error.response.status} ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to get response from AI chat service.');
    }
  }
}

export default AiRAGService;
