import { HttpException, HttpStatus, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, LearningBlueprint, Prisma, Question } from '@prisma/client'; 
import axios, { AxiosInstance } from 'axios';
import { getAIAPIClient } from '../services/ai-api-client.service';
import { CreateLearningBlueprintDto } from './dtos/create-learning-blueprint.dto';
import { UpdateLearningBlueprintDto } from './dtos/update-learning-blueprint.dto';
import { GenerateQuestionsFromBlueprintDto } from './dtos/generate-questions-from-blueprint.dto';
import { GenerateNoteFromBlueprintDto } from './dtos/generate-note-from-blueprint.dto';
import { ChatMessageDto } from './dtos/chat-message.dto';
import { LearningBlueprintResponseDto, QuestionSetResponseDto, NoteResponseDto, ChatResponseMessageDto } from './dtos/responses.dto';

// TODO: Move to environment variables
const AI_SERVICE_BASE_URL = process.env.AI_API_BASE_URL?.replace(/\/$/, '') + '/api/v1' || 'http://localhost:8000/api/v1'; // Use AI API port
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'test_api_key_123'; // Dev default matches AI API

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
        source_text: dto.sourceText,
        userId: userId.toString(), // AI service expects userId in payload
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

    // 3. Index the blueprint in the AI API (non-blocking)
    try {
      const aiApiClient = getAIAPIClient();
      console.log(`Indexing blueprint ${newBlueprint.id} with AI API...`);
      const indexingResponse = await aiApiClient.indexBlueprint({
        blueprint_id: newBlueprint.id.toString(),
        blueprint_json: blueprintJson,
        force_reindex: false
      });
      console.log(`Successfully indexed blueprint ${newBlueprint.id} with AI API`);
      
      // Extract and store the source_id (UUID) returned by AI API for proper deletion later
      const sourceId = indexingResponse.source_id || blueprintJson.source_id;
      if (sourceId) {
        console.log(`✅ Storing AI API source_id: ${sourceId} for blueprint ${newBlueprint.id}`);
        await this.prisma.learningBlueprint.update({
          where: { id: newBlueprint.id },
          data: { sourceId: sourceId }
        });
        console.log(`✅ Successfully stored sourceId ${sourceId} for blueprint ${newBlueprint.id}`);
      } else {
        console.warn(`⚠️ No sourceId found in AI API response or blueprintJson for blueprint ${newBlueprint.id}`);
      }
    } catch (error: any) {
      // Non-blocking: log the error but don't fail the blueprint creation
      console.error(`Failed to index blueprint ${newBlueprint.id} with AI API:`, error.message);
      console.log('Blueprint creation completed successfully despite indexing failure');
    }

    // 4. Return the created LearningBlueprint object (or a DTO representation)
    // Note: sourceId will be set asynchronously during indexing, so it may not be available immediately
    const updatedBlueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: newBlueprint.id }
    });
    
    return {
      id: newBlueprint.id,
      userId: newBlueprint.userId,
      sourceText: newBlueprint.sourceText,
      blueprintJson: newBlueprint.blueprintJson as any, // Cast if necessary, ensure type compatibility
      sourceId: updatedBlueprint?.sourceId ?? undefined,
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
      sourceId: blueprint.sourceId ?? undefined,
      createdAt: blueprint.createdAt,
      updatedAt: blueprint.updatedAt,
      // folderId is not on the blueprint model
    };
  }



  async updateLearningBlueprint(
    blueprintId: number,
    dto: UpdateLearningBlueprintDto,
    userId: number,
  ): Promise<LearningBlueprintResponseDto | null> {
    console.log(`AiRAGService: updateLearningBlueprint called for ID ${blueprintId} by user ${userId}`);

    // 1. Check if blueprint exists and belongs to user
    const existingBlueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!existingBlueprint || existingBlueprint.userId !== userId) {
      console.log(`Blueprint ${blueprintId} not found or access denied for user ${userId}`);
      return null;
    }

    // 2. If sourceText is being updated, call AI Service to regenerate blueprint
    let updatedBlueprintJson = existingBlueprint.blueprintJson;
    if (dto.sourceText && dto.sourceText !== existingBlueprint.sourceText) {
      try {
        console.log(`Calling AI service to regenerate blueprint for updated sourceText`);
        const response = await this.axiosInstance.post('/deconstruct', {
          source_text: dto.sourceText,
          userId: userId.toString(), // Include userId for consistency
        }, {
          timeout: 120000 // 2 minute timeout for deconstruct operations
        });
        updatedBlueprintJson = response.data.blueprint_json;
        console.log('AI service /deconstruct call successful for update.');
      } catch (error: any) {
        console.error('Error calling AI service /deconstruct for update:', error.response?.data || error.message);
        console.warn('AI service failed, proceeding with existing blueprint structure');
        // Don't throw error - proceed with update using existing blueprintJson
        console.log('Proceeding with blueprint update despite AI service failure');
      }
    }

    // 3. Update the database record
    let updatedBlueprint: LearningBlueprint;
    try {
      updatedBlueprint = await this.prisma.learningBlueprint.update({
        where: { id: blueprintId },
        data: {
          sourceText: dto.sourceText || existingBlueprint.sourceText,
          blueprintJson: updatedBlueprintJson as any,
          updatedAt: new Date(),
        },
      });
      console.log(`LearningBlueprint ${blueprintId} updated successfully`);
    } catch (error: any) {
      console.error('Error updating LearningBlueprint in database:', error);
      throw new Error('Failed to update learning blueprint.');
    }

    // 4. Sync with AI API (non-blocking)
    try {
      console.log(`\n=== BLUEPRINT SYNC DEBUG START ===`);
      console.log(`Synchronizing blueprint ${blueprintId} update with AI API...`);
      console.log('Raw updatedBlueprintJson type:', typeof updatedBlueprintJson);
      console.log('Raw updatedBlueprintJson value:', JSON.stringify(updatedBlueprintJson, null, 2));
      
      // Ensure blueprintData is a proper object. The database may return blueprintJson as a
      // JSON string (e.g. when using the Prisma Json field with some drivers). If we detect
      // a string, attempt to JSON.parse it. Fallback to an empty object if parsing fails.
      let blueprintData: Record<string, any> = {};
      if (updatedBlueprintJson && typeof updatedBlueprintJson === 'object') {
        blueprintData = updatedBlueprintJson as Record<string, any>;
      } else if (typeof updatedBlueprintJson === 'string') {
        try {
          blueprintData = JSON.parse(updatedBlueprintJson) as Record<string, any>;
        } catch (parseErr) {
          console.warn('Failed to parse blueprintJson string. Proceeding with empty object.', parseErr);
        }
      }

      console.log('Processed blueprintData:', JSON.stringify(blueprintData, null, 2));

      const blueprintPayload = {
        source_id: blueprintId.toString(),
        source_title: blueprintData.source_title || `Blueprint ${blueprintId}`,
        source_type: blueprintData.source_type || 'text',
        source_summary: blueprintData.source_summary || {
          core_thesis_or_main_argument: 'Learning content analysis',
          inferred_purpose: 'Educational material for learning',
        },
        sections: blueprintData.sections || [],
        knowledge_primitives: blueprintData.knowledge_primitives || {
          key_propositions_and_facts: [],
          key_entities_and_definitions: [],
          described_processes_and_steps: [],
          identified_relationships: [],
          implicit_and_open_questions: [],
        },
      };
      
      console.log('Final blueprint payload being sent to AI API:');
      console.log(JSON.stringify(blueprintPayload, null, 2));
      console.log('About to call aiApiClient.updateBlueprint...');
      
      const aiApiClient = getAIAPIClient();
      await aiApiClient.updateBlueprint(blueprintId.toString(), blueprintPayload, 'incremental');
      console.log(`✅ Successfully synchronized blueprint ${blueprintId} update with AI API`);
      console.log(`=== BLUEPRINT SYNC DEBUG END ===\n`);
    } catch (error: any) {
      // Non-blocking: log the error but don't fail the blueprint update
      console.error(`\n❌ BLUEPRINT SYNC ERROR:`);
      console.error(`Failed to sync blueprint ${blueprintId} update with AI API:`, error.message);
      console.error('Full error:', error);
      console.error('Error response data:', error.response?.data);
      console.log('Blueprint update completed successfully despite sync failure\n');
    }

    // 5. Return the updated blueprint
    return {
      id: updatedBlueprint.id,
      userId: updatedBlueprint.userId,
      sourceText: updatedBlueprint.sourceText,
      blueprintJson: updatedBlueprint.blueprintJson as any,
      createdAt: updatedBlueprint.createdAt,
      updatedAt: updatedBlueprint.updatedAt,
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

    // 1. Clean up from AI API first (non-blocking)
    try {
      const aiApiClient = getAIAPIClient();
      console.log(`Cleaning up blueprint ${blueprintId} from AI API...`);
      
      // IMPORTANT: Use the database ID for deletion since that's how nodes are indexed in vector DB
      // The sourceId is used for status checks, but indexing uses the database ID as blueprint_id metadata
      const blueprintIdForDeletion = blueprintId.toString();
      console.log(`Using blueprint ID for deletion: ${blueprintIdForDeletion} (sourceId: ${blueprint.sourceId}, dbId: ${blueprintId})`);
      console.log(`Note: Using database ID for deletion because vector DB nodes are indexed with blueprint_id=${blueprintId}`);
      
      // Attempt deletion with retries until vector DB reports 0 nodes or max attempts reached
      const maxAttempts = 5;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const deleteResult = await aiApiClient.deleteBlueprint(blueprintIdForDeletion);
        console.log(`Deletion attempt ${attempt}/${maxAttempts}:`, deleteResult);

        // After each deletion attempt, check status
        try {
          const status = await aiApiClient.getBlueprintStatus(blueprintIdForDeletion);
          console.log(`Status after deletion attempt ${attempt}:`, status);
          if (!status.is_indexed || status.node_count === 0) {
            console.log('All nodes removed from vector DB.');
            break;
          }
        } catch (statusErr: any) {
          // 404 or not_found means deletion succeeded
          console.log('Blueprint status not found after deletion, assuming success.');
          break;
        }

        if (attempt < maxAttempts) {
          console.log('Nodes still present, retrying deletion after short delay...');
          await new Promise(res => setTimeout(res, 3000));
        } else {
          console.warn('Reached maximum deletion attempts; some nodes may remain in vector DB.');
        }
      }
    } catch (error: any) {
      // Non-blocking: log the error but continue with database deletion
      console.error(`Failed to clean up blueprint ${blueprintId} from AI API:`, error.message);
      console.log('Proceeding with database deletion despite AI API cleanup failure');
    }

    // 2. Delete from database
    try {
      await this.prisma.learningBlueprint.delete({
        where: { id: blueprintId },
      });
      console.log(`Successfully deleted blueprint ${blueprintId} from database`);
      return true;
    } catch (error: any) {
      console.error(`Failed to delete blueprint ${blueprintId} from database:`, error);
      throw new Error('Failed to delete learning blueprint from database.');
    }
  }

  // Task 4: Blueprint Status Management
  async getBlueprintIndexingStatus(blueprintId: number, userId: number): Promise<any> {
    console.log(`AiRAGService: getBlueprintIndexingStatus called for ID ${blueprintId} by user ${userId}`);
    
    // 1. Check if blueprint exists and belongs to user
    const blueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint || blueprint.userId !== userId) {
      throw new NotFoundException('Blueprint not found or access denied');
    }

    // 2. Get indexing status from AI API
    try {
      const aiApiClient = getAIAPIClient();
      const status = await aiApiClient.getBlueprintStatus(blueprintId.toString());
      console.log(`Retrieved indexing status for blueprint ${blueprintId}:`, status);
      return {
        blueprintId: blueprintId,
        indexed: status.indexed || false,
        lastIndexed: status.lastIndexed || null,
        indexingErrors: status.errors || [],
        vectorCount: status.vectorCount || 0,
        status: status.status || 'unknown'
      };
    } catch (error: any) {
      console.error(`Failed to get indexing status for blueprint ${blueprintId}:`, error.message);
      return {
        blueprintId: blueprintId,
        indexed: false,
        lastIndexed: null,
        indexingErrors: [error.message],
        vectorCount: 0,
        status: 'error'
      };
    }
  }

  async reindexBlueprint(blueprintId: number, userId: number): Promise<any> {
    console.log(`AiRAGService: reindexBlueprint called for ID ${blueprintId} by user ${userId}`);
    
    // 1. Check if blueprint exists and belongs to user
    const blueprint = await this.prisma.learningBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint || blueprint.userId !== userId) {
      throw new NotFoundException('Blueprint not found or access denied');
    }

    // 2. Force reindexing via AI API
    try {
      const aiApiClient = getAIAPIClient();
      console.log(`Force reindexing blueprint ${blueprintId} with AI API...`);
      
      // First, delete any existing index
      try {
        await aiApiClient.deleteBlueprint(blueprintId.toString());
        console.log(`Cleaned up existing index for blueprint ${blueprintId}`);
      } catch (cleanupError: any) {
        console.warn(`Cleanup failed for blueprint ${blueprintId}, proceeding with reindex:`, cleanupError.message);
      }

      // Then, reindex with current data
      const result = await aiApiClient.indexBlueprint({
        blueprint_id: blueprintId.toString(),
        blueprint_json: blueprint.blueprintJson as any,
        force_reindex: true,
      });
      
      console.log(`Successfully reindexed blueprint ${blueprintId}`);
      return {
        blueprintId: blueprintId,
        reindexed: true,
        timestamp: new Date().toISOString(),
        result: result
      };
    } catch (error: any) {
      console.error(`Failed to reindex blueprint ${blueprintId}:`, error.message);
      throw new Error(`Reindexing failed: ${error.message}`);
    }
  }

  // RAG Chat Enhancement Helper Methods
  async fetchUserMemoryContext(userId: number, context?: any): Promise<any[]> {
    console.log(`AiRAGService: fetchUserMemoryContext for user ${userId}`);
    
    try {
      // Fetch user memory (note: UserMemory is a single record per user, not multiple memories)
      const userMemory = await this.prisma.userMemory.findUnique({
        where: { userId: userId }
      });

      if (!userMemory) {
        console.log(`No user memory found for user ${userId}`);
        return [];
      }

      // Convert user memory preferences into context for AI
      const memoryContext = {
        id: userMemory.id,
        userId: userMemory.userId,
        cognitiveApproach: userMemory.cognitiveApproach,
        explanationStyles: userMemory.explanationStyles,
        interactionStyle: userMemory.interactionStyle,
        primaryGoal: userMemory.primaryGoal,
        createdAt: userMemory.createdAt,
        updatedAt: userMemory.updatedAt
      };

      return [memoryContext];
    } catch (error: any) {
      console.warn('Failed to fetch user memory context:', error.message);
      return []; // Return empty array if fetch fails
    }
  }

  async fetchBlueprintContextForChat(
    blueprintId: number, 
    userId: number, 
    messageContent: string
  ): Promise<any[]> {
    console.log(`AiRAGService: fetchBlueprintContextForChat for blueprint ${blueprintId}`);
    
    try {
      // 1. Verify user owns the blueprint
      const blueprint = await this.prisma.learningBlueprint.findUnique({
        where: { id: blueprintId }
      });

      if (!blueprint || blueprint.userId !== userId) {
        console.warn(`Blueprint ${blueprintId} not found or access denied for user ${userId}`);
        return [];
      }

      // 2. Try to get relevant context from AI API using RAG retrieval
      try {
        const aiApiClient = getAIAPIClient();
        const relevantContext = await aiApiClient.queryBlueprint({
          blueprintId: blueprintId.toString(),
          query: messageContent,
          maxResults: 5
        });
        
        console.log(`Retrieved ${relevantContext.length} relevant context items from AI API`);
        return relevantContext;
      } catch (aiApiError: any) {
        console.warn('AI API context retrieval failed, using blueprint content:', aiApiError.message);
        
        // 3. Fallback: return the full blueprint content
        return [{
          id: blueprint.id,
          content: blueprint.sourceText,
          metadata: {
            blueprintJson: blueprint.blueprintJson,
            type: 'full_blueprint',
            fallback: true
          }
        }];
      }
    } catch (error: any) {
      console.error('Failed to fetch blueprint context for chat:', error.message);
      return [];
    }
  }

  async fallbackToLegacyChat(
    dto: ChatMessageDto, 
    userId: number, 
    enhancedContext: any
  ): Promise<ChatResponseMessageDto> {
    console.log('AiRAGService: fallbackToLegacyChat called');
    
    try {
      console.log(`Calling legacy AI service at ${AI_SERVICE_BASE_URL}/chat`);
      const response = await this.axiosInstance.post('/chat', {
        user_id: userId,
        message_content: dto.messageContent,
        chat_history: dto.chatHistory || [],
        context: enhancedContext,
      });

      console.log('Legacy AI service /chat call successful.');
      return response.data as ChatResponseMessageDto;
    } catch (error: any) {
      console.error('Legacy AI service /chat failed:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new HttpException(
          error.response.data.message || 'An error occurred with the AI service.',
          error.response.status,
        );
      }
      throw new HttpException('Failed to get chat response from AI service.', HttpStatus.BAD_GATEWAY);
    }
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
          title: dto.name,
          userId: userId,
          generatedFromBlueprintId: blueprintId,
          ...(dto.folderId && { folderId: dto.folderId }),
        },
      });

      // Step 2: Prepare and create the related questions, then fetch them to get IDs.
      let createdQuestions: Question[] = [];
      if (questionsToCreate.length > 0) {
        const questionsWithSetId = questionsToCreate.map(q => ({
          questionSetId: newQuestionSet.id,
          questionText: q.text,
          answerText: q.answer,
          marksAvailable: q.totalMarksAvailable || 1,
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
        name: newQuestionSet.title,
        userId: userId, // Include userId in response even though not stored on QuestionSet
        folderId: dto.folderId ?? undefined,
        generatedFromBlueprintId: blueprintId,
        createdAt: newQuestionSet.createdAt,
        updatedAt: newQuestionSet.updatedAt,
        questions: createdQuestions.map((q) => ({
          id: q.id,
          text: q.questionText,
          answer: q.answerText ?? undefined,
          questionType: 'short-answer',
          totalMarksAvailable: q.marksAvailable,
          markingCriteria: undefined,
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
          title: dto.name,
          content: JSON.stringify(aiServiceResponseData.content || {}),
          folderId: dto.folderId,
          generatedFromBlueprintId: blueprintId,
        },
      });

      console.log(`New Note created with ID: ${newNote.id}`);

      // 4. Return the complete NoteResponseDto
      return {
        id: newNote.id,
        title: newNote.title,
        content: JSON.parse(newNote.content) as Record<string, any>,
        userId: newNote.userId,
        folderId: newNote.folderId ?? undefined,
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

    try {
      // 1. Fetch user memory context for enhanced chat experience
      const userMemoryContext = await this.fetchUserMemoryContext(userId, dto.context);
      console.log(`Fetched user memory context items: ${userMemoryContext.length}`);

      // 2. Fetch relevant blueprint context if specified
      let blueprintContext: any[] = [];
      if (dto.context?.blueprintId) {
        blueprintContext = await this.fetchBlueprintContextForChat(
          dto.context.blueprintId,
          userId,
          dto.messageContent
        );
        console.log(`Fetched blueprint context items: ${blueprintContext.length}`);
      }

      // 3. Prepare enhanced context for AI API
      const enhancedContext = {
        blueprintId: dto.context?.blueprintId,
        noteId: dto.context?.noteId,
        questionSetId: dto.context?.questionSetId,
        userMemory: userMemoryContext,
        blueprintContent: blueprintContext,
        timestamp: new Date().toISOString()
      };

      // 4. Try to use AI API for RAG-enhanced chat first
      try {
        const aiApiClient = getAIAPIClient();
        console.log('Using AI API for RAG-enhanced chat...');
        
        const chatResponse = await aiApiClient.sendChatMessage({
          userId: userId.toString(),
          message: dto.messageContent,
          chatHistory: dto.chatHistory || [],
          context: enhancedContext
        });

        console.log('AI API chat call successful with RAG enhancement');
        return {
          role: 'assistant',
          content: chatResponse.response || chatResponse.content || 'I received your message but couldn\'t generate a proper response.'
        };
      } catch (aiApiError: any) {
        console.warn('AI API chat failed, falling back to AI service:', aiApiError.message);
        
        // 5. Fallback to legacy AI service with enhanced context
        return await this.fallbackToLegacyChat(dto, userId, enhancedContext);
      }
    } catch (error: any) {
      console.error('Error in enhanced chat message handling:', error.message);
      
      // 6. Final fallback to basic chat without context enhancement
      try {
        return await this.fallbackToLegacyChat(dto, userId, {});
      } catch (fallbackError: any) {
        console.error('All chat methods failed:', fallbackError.message);
        throw new HttpException(
          'Unable to process chat message. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }
    }
  }
}
