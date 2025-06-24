import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req, ParseIntPipe, HttpCode, HttpStatus, UsePipes, ValidationPipe, NotFoundException, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { AiRAGService } from './ai-rag.service';
import { CreateLearningBlueprintDto } from './dtos/create-learning-blueprint.dto';
import { GenerateQuestionsFromBlueprintDto } from './dtos/generate-questions-from-blueprint.dto';
import { GenerateNoteFromBlueprintDto } from './dtos/generate-note-from-blueprint.dto';
import { ChatMessageDto } from './dtos/chat-message.dto';
import { LearningBlueprintResponseDto, QuestionSetResponseDto, NoteResponseDto, ChatResponseMessageDto } from './dtos/responses.dto';
// import { AuthenticatedGuard } from '../auth/guards/authenticated.guard'; // Assuming standard auth guard path - TBD
import { UpdateLearningBlueprintDto } from './dtos/update-learning-blueprint.dto';
// import { RequestWithUser } from '../auth/interfaces/request-with-user.interface'; // Assuming this interface - TBD

// Temporary interface until RequestWithUser is sorted out
interface RequestWithUser { user: { userId: number } } // Updated to use userId

@ApiTags('AI RAG')
@ApiBearerAuth() // If using JWT or similar bearer token auth
// @UseGuards(AuthenticatedGuard) // Apply auth guard to all routes in this controller - TBD
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) // Apply validation pipe to all routes
@Controller('ai-rag') // Base path for this controller
export class AiRAGController {
  constructor(private readonly aiRagService: AiRAGService) {}

  @Post('learning-blueprints')
  @ApiOperation({ summary: 'Create a new Learning Blueprint from source text.' })
  @ApiResponse({ status: 201, description: 'Learning Blueprint created successfully.', type: LearningBlueprintResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async createLearningBlueprint(
    @Body() createLearningBlueprintDto: CreateLearningBlueprintDto,
    @Req() req: RequestWithUser,
  ): Promise<LearningBlueprintResponseDto> {
    return this.aiRagService.createLearningBlueprint(createLearningBlueprintDto, req.user.userId);
  }

  @Get('learning-blueprints')
  @ApiOperation({ summary: 'List all Learning Blueprints for the authenticated user.' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved learning blueprints.', type: [LearningBlueprintResponseDto] })
  async getAllLearningBlueprintsForUser(@Req() req: RequestWithUser): Promise<LearningBlueprintResponseDto[]> {
    return this.aiRagService.getAllLearningBlueprintsForUser(req.user.userId);
  }

  @Get('learning-blueprints/:blueprintId')
  @ApiOperation({ summary: 'Get a specific Learning Blueprint by ID.' })
  @ApiParam({ name: 'blueprintId', description: 'ID of the Learning Blueprint to retrieve', type: Number })
  @ApiResponse({ status: 200, description: 'Successfully retrieved learning blueprint.', type: LearningBlueprintResponseDto })
  @ApiResponse({ status: 404, description: 'Learning Blueprint not found or access denied.' })
  async getLearningBlueprintById(
    @Param('blueprintId', ParseIntPipe) blueprintId: number,
    @Req() req: RequestWithUser,
  ): Promise<LearningBlueprintResponseDto> {
    const blueprint = await this.aiRagService.getLearningBlueprintById(blueprintId, req.user.userId);
    if (!blueprint) {
      throw new NotFoundException('Learning Blueprint not found or access denied.');
    }
    return blueprint;
  }

  @Put('learning-blueprints/:blueprintId')
  @ApiOperation({ summary: 'Update an existing Learning Blueprint.' })
  @ApiParam({ name: 'blueprintId', description: 'ID of the Learning Blueprint to update', type: Number })
  @ApiBody({ type: UpdateLearningBlueprintDto })
  @ApiResponse({ status: 200, description: 'Learning Blueprint updated successfully.', type: LearningBlueprintResponseDto })
  @ApiResponse({ status: 404, description: 'Learning Blueprint not found or access denied.' })
  @ApiResponse({ status: 502, description: 'Failed to update blueprint due to AI service error.' })
  async updateLearningBlueprint(
    @Param('blueprintId', ParseIntPipe) blueprintId: number,
    @Body() updateLearningBlueprintDto: UpdateLearningBlueprintDto,
    @Req() req: RequestWithUser, // Assuming user ID will be available on req.user.userId
  ): Promise<LearningBlueprintResponseDto> {
    const updatedBlueprint = await this.aiRagService.updateLearningBlueprint(blueprintId, req.user.userId, updateLearningBlueprintDto);
    if (!updatedBlueprint) {
      throw new NotFoundException('Learning Blueprint not found or access denied for update.');
    }
    return updatedBlueprint;
  }

  @Delete('learning-blueprints/:blueprintId')
  @ApiOperation({ summary: 'Delete a Learning Blueprint.' })
  @ApiParam({ name: 'blueprintId', description: 'ID of the Learning Blueprint to delete', type: Number })
  @ApiResponse({ status: 204, description: 'Learning Blueprint deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Learning Blueprint not found or access denied.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLearningBlueprint(
    @Param('blueprintId', ParseIntPipe) blueprintId: number,
    @Req() req: RequestWithUser, // Assuming user ID will be available on req.user.userId
  ): Promise<void> {
    const success = await this.aiRagService.deleteLearningBlueprint(blueprintId, req.user.userId);
    if (!success) {
      throw new NotFoundException('Learning Blueprint not found or access denied for deletion.');
    }
  }

  @Post('learning-blueprints/:blueprintId/question-sets')
  @ApiOperation({ summary: 'Generate a new Question Set from a Learning Blueprint.' })
  @ApiParam({ name: 'blueprintId', description: 'ID of the Learning Blueprint to generate questions from', type: Number })
  @ApiBody({ type: GenerateQuestionsFromBlueprintDto })
  @ApiResponse({ status: 201, description: 'Question Set generated successfully.', type: QuestionSetResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 404, description: 'Learning Blueprint not found or access denied.' })
  @ApiResponse({ status: 502, description: 'Failed to generate questions due to AI service error.' })
  async generateQuestionsFromBlueprint(
    @Param('blueprintId', ParseIntPipe) blueprintId: number,
    @Body() generateQuestionsDto: GenerateQuestionsFromBlueprintDto,
    @Req() req: RequestWithUser,
  ): Promise<QuestionSetResponseDto> {
    try {
      return await this.aiRagService.generateQuestionsFromBlueprint(blueprintId, generateQuestionsDto, req.user.userId);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      // For any other error, map to a 502 Bad Gateway response.
      console.error('Unhandled error in generateQuestionsFromBlueprint:', error);
      throw new HttpException('Failed to generate question set due to an internal error.', HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('learning-blueprints/:blueprintId/notes')
  @ApiOperation({ summary: 'Generate a new Note from a Learning Blueprint.' })
  @ApiParam({ name: 'blueprintId', description: 'ID of the Learning Blueprint to generate a note from', type: Number })
  @ApiBody({ type: GenerateNoteFromBlueprintDto })
  @ApiResponse({ status: 201, description: 'Note generated successfully.', type: NoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 404, description: 'Learning Blueprint not found or access denied.' })
  @ApiResponse({ status: 502, description: 'Failed to generate note due to AI service error.' })
  async generateNoteFromBlueprint(
    @Param('blueprintId', ParseIntPipe) blueprintId: number,
    @Body() generateNoteDto: GenerateNoteFromBlueprintDto,
    @Req() req: RequestWithUser,
  ): Promise<NoteResponseDto> {
    try {
      return await this.aiRagService.generateNoteFromBlueprint(blueprintId, generateNoteDto, req.user.userId);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      // For any other error, map to a 502 Bad Gateway response.
      console.error('Unhandled error in generateNoteFromBlueprint:', error);
      throw new HttpException('Failed to generate note due to an internal error.', HttpStatus.BAD_GATEWAY);
      throw new HttpException('An unexpected error occurred while generating notes.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('chat/message')
  @ApiOperation({ summary: 'Send a message to the RAG chat assistant.' })
  @ApiResponse({ status: 201, description: 'Chat message processed and response returned.', type: ChatResponseMessageDto })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async handleChatMessage(
    @Body() chatMessageDto: ChatMessageDto,
    @Req() req: RequestWithUser,
  ): Promise<ChatResponseMessageDto> {
    return this.aiRagService.handleChatMessage(chatMessageDto, req.user.userId);
  }
}
