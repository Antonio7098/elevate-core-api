import { HttpException, HttpStatus, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, LearningBlueprint, Prisma, Question } from '@prisma/client'; // Added LearningBlueprint for return type and Prisma namespace
import axios, { AxiosInstance } from 'axios';
import { CreateLearningBlueprintDto } from './dtos/create-learning-blueprint.dto';
import { UpdateLearningBlueprintDto } from './dtos/update-learning-blueprint.dto';
import { GenerateQuestionsFromBlueprintDto } from './dtos/generate-questions-from-blueprint.dto';
import { GenerateNoteFromBlueprintDto } from './dtos/generate-note-from-blueprint.dto';
import { ChatMessageDto } from './dtos/chat-message.dto';
import { LearningBlueprintResponseDto, QuestionSetResponseDto, NoteResponseDto, ChatResponseMessageDto } from './dtos/responses.dto';

// TODO: Move to environment variables
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1'; // Example URL
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'your-ai-service-api-key'; // Example API Key

@Injectable()
export class AiRAGService {
  private readonly axiosInstance: AxiosInstance;

  constructor(
    private readonly prisma: PrismaClient,
  ) {
    this.axiosInstance = axios.create({
      baseURL: AI_SERVICE_BASE_URL,
      headers: {
        'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
  }
  async createLearningBlueprint(
    dto: CreateLearningBlueprintDto,
    userId: number,
  ): Promise<LearningBlueprintResponseDto> {
    console.log(`AiRAGService: createLearningBlueprint called for user ${userId} with sourceText: "${dto.sourceText.substring(0, 50)}..."`);

    // 1. Call the AI Service's /deconstruct endpoint
    let blueprintJson: any;
    try {
      console.log(`Calling AI service at ${AI_SERVICE_BASE_URL}/deconstruct`);
      const response = await this.axiosInstance.post('/deconstruct', {
        source_text: dto.sourceText, // Assuming AI service expects 'source_text'
      });
      blueprintJson = response.data.blueprint_json; // Assuming AI service returns { blueprint_json: ... }
      console.log('AI service /deconstruct call successful.');
    } catch (error: any) {
      console.error('Error calling AI service /deconstruct:', error.response?.data || error.message);
      // It's important to decide how to handle AI service errors.
      // For now, rethrow or return a specific error DTO.
      throw new Error('Failed to deconstruct text via AI service.');
    }

    // 2. Persist the LearningBlueprint record
    let newBlueprint: LearningBlueprint;
    try {
      newBlueprint = await this.prisma.learningBlueprint.create({
        data: {
          userId: userId,
          sourceText: dto.sourceText,
          blueprintJson: blueprintJson, // Prisma expects a JsonValue, ensure blueprintJson matches
          // folderId is not part of the LearningBlueprint model itself.
          // It's passed in the DTO and can be used when generating associated content.
        },
      });
      console.log(`LearningBlueprint created with ID: ${newBlueprint.id}`);
    } catch (error: any) {
      console.error('Error saving LearningBlueprint to database:', error);
      throw new Error('Failed to save learning blueprint.');
    }

    // 3. Return the created LearningBlueprint object (or a DTO representation)
    return {
      id: newBlueprint.id,
      userId: newBlueprint.userId,
      sourceText: newBlueprint.sourceText,
      blueprintJson: newBlueprint.blueprintJson as any, // Cast if necessary, ensure type compatibility
      // folderId from the original DTO, not from newBlueprint as it's not stored on the model
      folderId: dto.folderId, 
      createdAt: newBlueprint.createdAt,
      updatedAt: newBlueprint.updatedAt,
    };
  }

  async getAllLearningBlueprintsForUser(userId: number): Promise<LearningBlueprintResponseDto[]> {
    console.log(`AiRAGService: getAllLearningBlueprintsForUser called for user ${userId}`);
    const blueprints = await this.prisma.learningBlueprint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Optional: order by creation date
    });
    return blueprints.map(bp => ({
      id: bp.id,
      userId: bp.userId,
      sourceText: bp.sourceText,
      blueprintJson: bp.blueprintJson as any,
      // folderId is not on the blueprint model, so it's not returned here unless we fetch related DTO info
      createdAt: bp.createdAt,
      updatedAt: bp.updatedAt,
    }));
  }

  async getLearningBlueprintById(blueprintId: number, userId: number): Promise<LearningBlueprintResponseDto | null> {
    console.log(`AiRAGService: getLearningBlueprintById called for ID ${blueprintId} by user ${userId}`);
    const blueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint || blueprint.userId !== userId) {
      // If not found or user does not own it, return null (controller will handle 404)
      return null;
    }

    return {
      id: blueprint.id,
      userId: blueprint.userId,
      sourceText: blueprint.sourceText,
      blueprintJson: blueprint.blueprintJson as any,
      createdAt: blueprint.createdAt,
      updatedAt: blueprint.updatedAt,
      // folderId is not on the blueprint model
    };
  }

  async updateLearningBlueprint(
    blueprintId: number,
    userId: number,
    dto: UpdateLearningBlueprintDto,
  ): Promise<LearningBlueprintResponseDto | null> {
    console.log(`AiRAGService: updateLearningBlueprint called for ID ${blueprintId} by user ${userId}`);
    const existingBlueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!existingBlueprint || existingBlueprint.userId !== userId) {
      return null; // Not found or not owned by user
    }

    let blueprintJson = existingBlueprint.blueprintJson;
    let sourceText = existingBlueprint.sourceText;

    if (dto.sourceText && dto.sourceText !== existingBlueprint.sourceText) {
      console.log('New sourceText provided, re-deconstructing with AI service...');
      try {
        const response = await this.axiosInstance.post('/deconstruct', {
          source_text: dto.sourceText,
        });
        blueprintJson = response.data.blueprint_json;
        sourceText = dto.sourceText;
        console.log('AI service /deconstruct call successful for update.');
      } catch (error: any) {
        console.error('Error calling AI service /deconstruct during update:', error.response?.data || error.message);
        throw new Error('Failed to re-deconstruct text via AI service for update.');
      }
    }

    // Only update if there are actual changes to sourceText or blueprintJson
    if (sourceText !== existingBlueprint.sourceText || blueprintJson !== existingBlueprint.blueprintJson) {
      const updatedBlueprint = await this.prisma.learningBlueprint.update({
        where: { id: blueprintId },
        data: {
          sourceText: sourceText,
          blueprintJson: blueprintJson === null ? Prisma.JsonNull : blueprintJson, // Handle explicit null
          // userId is not updated
        },
      });
      return {
        id: updatedBlueprint.id,
        userId: updatedBlueprint.userId,
        sourceText: updatedBlueprint.sourceText,
        blueprintJson: updatedBlueprint.blueprintJson as any,
        createdAt: updatedBlueprint.createdAt,
        updatedAt: updatedBlueprint.updatedAt,
      };
    }
    
    // If no changes were made (e.g., DTO was empty or sourceText was the same), return the existing blueprint data
    return {
      id: existingBlueprint.id,
      userId: existingBlueprint.userId,
      sourceText: existingBlueprint.sourceText,
      blueprintJson: existingBlueprint.blueprintJson as any,
      createdAt: existingBlueprint.createdAt,
      updatedAt: existingBlueprint.updatedAt,
    };
  }

  async deleteLearningBlueprint(blueprintId: number, userId: number): Promise<boolean> {
    console.log(`AiRAGService: deleteLearningBlueprint called for ID ${blueprintId} by user ${userId}`);
    const blueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint || blueprint.userId !== userId) {
      return false; // Not found or not owned by user
    }

    await this.prisma.learningBlueprint.delete({
      where: { id: blueprintId },
    });
    return true;
  }

  async generateQuestionsFromBlueprint(
    blueprintId: number,
    dto: GenerateQuestionsFromBlueprintDto,
    userId: number,
  ): Promise<QuestionSetResponseDto> {
    console.log(`AiRAGService: generateQuestionsFromBlueprint called for blueprintId: ${blueprintId}, userId: ${userId}, dto:`, dto);

    // 1. Fetch the LearningBlueprint and verify ownership
    const learningBlueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!learningBlueprint) {
      throw new NotFoundException(`Learning Blueprint with ID ${blueprintId} not found.`);
    }
    if (learningBlueprint.userId !== userId) {
      throw new ForbiddenException('User does not have access to this Learning Blueprint.');
    }

    // 2. Call the AI Service's /generate/questions endpoint
    let aiServiceResponseData;
    try {
      console.log(`Calling AI service at ${AI_SERVICE_BASE_URL}/generate/questions for blueprint ${blueprintId}`);
      const response = await this.axiosInstance.post('/generate/questions', {
        source_text: learningBlueprint.sourceText,
        blueprint_json: learningBlueprint.blueprintJson,
        question_options: dto.questionOptions || {},
      });
      aiServiceResponseData = response.data;
      console.log('AI service /generate/questions call successful.');
    } catch (error: any) {
      console.error('Error calling AI service /generate/questions:', error.response?.data || error.message);
      throw new HttpException('Failed to generate questions via AI service.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Interface for AI-generated question structure
    interface AiGeneratedQuestion {
      text: string;
      answer?: string;
      total_marks_available?: number;
      marking_criteria?: string;
    }
    const aiGeneratedQuestions: AiGeneratedQuestion[] = aiServiceResponseData.questions || [];

    // Define precise type for QuestionSet including related questions
    type QuestionSetWithQuestions = Prisma.QuestionSetGetPayload<{ include: { questions: true }; }>
    const questionsToCreate = aiGeneratedQuestions.map(q => ({
      text: q.text,
      answer: q.answer,
      totalMarksAvailable: q.total_marks_available,
      markingCriteria: q.marking_criteria,
      questionType: 'SHORT_ANSWER', // Add default questionType to satisfy model
    }));

    try {
      // Step 1: Create the QuestionSet with all scalar foreign keys.
      const newQuestionSet = await this.prisma.questionSet.create({
        data: {
          name: dto.name,
          generatedFromBlueprintId: blueprintId,
          ...(dto.folderId && { folderId: dto.folderId }),
        },
      });

      // Step 2: Prepare and create the related questions, then fetch them to get IDs.
      let createdQuestions: Question[] = [];
      if (questionsToCreate.length > 0) {
        const questionsWithSetId = questionsToCreate.map(q => ({
          ...q,
          questionSetId: newQuestionSet.id,
        }));
        await this.prisma.question.createMany({
          data: questionsWithSetId,
        });
        createdQuestions = await this.prisma.question.findMany({
            where: {
                questionSetId: newQuestionSet.id
            }
        });
      }

      console.log(`New QuestionSet created with ID: ${newQuestionSet.id} and ${createdQuestions.length} questions.`);

      // Step 3: Manually construct the response DTO from the results of our two separate creates.
      return {
        id: newQuestionSet.id,
        name: newQuestionSet.name,
        userId: userId, // Include userId in response even though not stored on QuestionSet
        folderId: dto.folderId ?? undefined,
        generatedFromBlueprintId: blueprintId,
        createdAt: newQuestionSet.createdAt,
        updatedAt: newQuestionSet.updatedAt,
        questions: createdQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          answer: q.answer ?? undefined,
          questionType: q.questionType,
          totalMarksAvailable: q.totalMarksAvailable,
          markingCriteria: q.markingCriteria as any,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        })),
      };
    } catch (error: any) {
      console.error('Error creating question set in DB:', error);
      throw new HttpException('Failed to save generated questions to the database.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateNoteFromBlueprint(
    blueprintId: number,
    dto: GenerateNoteFromBlueprintDto,
    userId: number,
  ): Promise<NoteResponseDto> {
    console.log(`AiRAGService: generateNoteFromBlueprint called for blueprint ${blueprintId}`);

    // 1. Fetch the LearningBlueprint to ensure it exists and belongs to the user
    const learningBlueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!learningBlueprint) {
      throw new NotFoundException(`Learning Blueprint with ID ${blueprintId} not found.`);
    }
    if (learningBlueprint.userId !== userId) {
      throw new ForbiddenException('User does not have access to this Learning Blueprint.');
    }

    // 2. Call the AI Service's /generate/notes endpoint
    let aiServiceResponseData;
    try {
      console.log(`Calling AI service at ${AI_SERVICE_BASE_URL}/generate/notes for blueprint ${blueprintId}`);
      const response = await this.axiosInstance.post('/generate/notes', {
        source_text: learningBlueprint.sourceText,
        blueprint_json: learningBlueprint.blueprintJson,
        note_options: dto.noteOptions || {},
      });
      aiServiceResponseData = response.data;
      console.log('AI service /generate/notes call successful.');
    } catch (error: any) {
      console.error('Error calling AI service /generate/notes:', error.response?.data || error.message);
      throw new HttpException('Failed to generate note via AI service.', HttpStatus.BAD_GATEWAY);
    }

    // 3. Persist the new Note to the database
    try {
      const newNote = await this.prisma.note.create({
        data: {
          userId: userId,
          title: dto.name, // Title comes from the user request
          content: aiServiceResponseData.content || {}, // Assuming AI returns { content: {...} }
          plainText: aiServiceResponseData.plain_text || '', // Assuming AI returns { plain_text: '...' }
          folderId: dto.folderId, // Optional folderId from request
          generatedFromBlueprintId: blueprintId,
        },
      });

      console.log(`New Note created with ID: ${newNote.id}`);

      // 4. Return the complete NoteResponseDto
      return {
        id: newNote.id,
        title: newNote.title,
        content: newNote.content as Record<string, any>,
        plainText: newNote.plainText ?? undefined,
        userId: newNote.userId,
        folderId: newNote.folderId ?? undefined,
        questionSetId: newNote.questionSetId ?? undefined,
        generatedFromBlueprintId: newNote.generatedFromBlueprintId ?? undefined,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
      };
    } catch (error: any) {
      console.error('Error saving Note to database:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(`Database error: ${error.message}`, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to save note to database.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async handleChatMessage(
    dto: ChatMessageDto,
    userId: number,
  ): Promise<ChatResponseMessageDto> {
    console.log(`AiRAGService: handleChatMessage called for user ${userId}`);

    // In a real implementation, we might fetch context from the DB
    // based on dto.context (blueprintId, noteId, etc.) to pass to the AI.
    // For now, we'll pass the context IDs directly to the AI service.

    // 1. Call the AI Service's /chat endpoint
    try {
      console.log(`Calling AI service at ${AI_SERVICE_BASE_URL}/chat`);
      const response = await this.axiosInstance.post('/chat', {
        user_id: userId, // Pass user ID for context retrieval on the AI side
        message_content: dto.messageContent,
        chat_history: dto.chatHistory || [],
        context: dto.context || {},
      });

      console.log('AI service /chat call successful.');
      // Assuming the AI service returns a message in the same format
      return response.data as ChatResponseMessageDto;
    } catch (error: any) {
      console.error('Error calling AI service /chat:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        // Forward the error from the downstream service
        throw new HttpException(
          error.response.data.message || 'An error occurred with the AI service.',
          error.response.status,
        );
      }
      // For other types of errors (e.g., network issues)
      throw new HttpException('Failed to get chat response from AI service.', HttpStatus.BAD_GATEWAY);
    }
  }
}
