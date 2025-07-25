// Main application file
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma'; // Import shared prisma instance
import { authRouter } from './routes/auth'; 
import userRouter from './routes/user.routes';
import folderRouter from './routes/folder.routes';
import aiRouter from './routes/ai.routes';
import reviewRouter from './routes/review.routes';
import standaloneQuestionSetRouter from './routes/standalone-questionset.routes';
import standaloneQuestionRouter from './routes/standalone-question.routes';
import dashboardRouter from './routes/dashboard.routes';
import todaysTasksRoutes from './routes/todaysTasks.routes';
import statsRouter from './routes/stats.routes';
import noteRouter from './routes/note.routes';
import insightCatalystRouter from './routes/insightCatalyst.routes';
import userMemoryRouter from './routes/userMemory.routes';
import learningBlueprintsRouter from './routes/learning-blueprints.routes';
import chatRouter from './routes/chat.routes';
import { aiRagRouter } from './ai-rag/ai-rag.routes';
import { initializeAIAPIClient, shutdownAIAPIClient, getAIAPIClient } from './services/ai-api-client.service';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as swaggerUi from 'swagger-ui-express';
import { SwaggerAppModule } from './swagger.app.module'; // Temporary module for Swagger gen
import { AiRAGController } from './ai-rag/ai-rag.controller'; // For Swagger to find decorators
// Import all DTOs used in AiRAGController for Swagger schema generation
import { CreateLearningBlueprintDto } from './ai-rag/dtos/create-learning-blueprint.dto';
import { GenerateQuestionsFromBlueprintDto } from './ai-rag/dtos/generate-questions-from-blueprint.dto';
import { GenerateNoteFromBlueprintDto } from './ai-rag/dtos/generate-note-from-blueprint.dto';
import { ChatMessageDto } from './ai-rag/dtos/chat-message.dto';
import { LearningBlueprintResponseDto, QuestionSetResponseDto, NoteResponseDto, ChatResponseMessageDto } from './ai-rag/dtos/responses.dto';
import { ChatMessageHistoryItemDto as ChatMessageContentDto } from './ai-rag/dtos/chat-message.dto'; // Nested DTO

// Load environment variables
dotenv.config();

const app = express();

// Initialize AI API Client on application startup
async function initializeApplication() {
  try {
    console.log('🚀 Initializing AI API client...');
    await initializeAIAPIClient();
    
    // Perform health check
    const client = getAIAPIClient();
    if (client) {
      const healthStatus = await client.healthCheck();
      console.log(`✅ AI API client initialized successfully. Status: ${healthStatus.status}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize AI API client:', error);
    console.log('🔄 Application will continue without AI API integration');
  }
}

// Setup graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Received SIGINT. Graceful shutdown...');
  await shutdownAIAPIClient();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM. Graceful shutdown...');
  await shutdownAIAPIClient();
  process.exit(0);
});

// Function to setup Swagger
async function setupSwagger(expressApp: express.Express) {
  try {
    console.log('Setting up Swagger documentation...');
    
    // Create a temporary NestJS application instance just for Swagger generation
    const nestApp = await NestFactory.create(SwaggerAppModule, {
      // Suppress NestJS logger for this temporary instance if desired
      logger: false, // or ['error', 'warn']
    });

    const config = new DocumentBuilder()
      .setTitle('Elevate Core API - RAG Endpoints')
      .setDescription('API documentation for the RAG (Retrieval Augmented Generation) features.')
      .setVersion('1.0')
      .addTag('ai-rag', 'Endpoints related to Learning Blueprints, Question/Note Generation, and Chat')
      .addBearerAuth() // If you use Bearer token auth
      .build();

    const document = SwaggerModule.createDocument(nestApp, config, {
      // Ensure AiRAGController is considered for path generation
      // and all DTOs are included for schema generation
      include: [SwaggerAppModule, AiRAGController], 
      extraModels: [
        CreateLearningBlueprintDto,
        GenerateQuestionsFromBlueprintDto,
        GenerateNoteFromBlueprintDto,
        ChatMessageDto,
        LearningBlueprintResponseDto,
        QuestionSetResponseDto,
        NoteResponseDto,
        ChatResponseMessageDto,
        ChatMessageContentDto, // Ensure nested DTO is included
      ],
    });

    expressApp.use('/api-docs', swaggerUi.serve, swaggerUi.setup(document));

    // Close the temporary NestJS app instance once Swagger setup is complete
    await nestApp.close();
    
    console.log('✅ Swagger documentation setup complete');
  } catch (error) {
    console.error('❌ Swagger setup failed:', error);
    throw error; // Re-throw to be caught by the caller
  }
}

// Only setup Swagger if not in a test environment, as it can interfere with test runners.
if (process.env.NODE_ENV !== 'test') {
  // Setup Swagger asynchronously without blocking server startup
  const swaggerTimeout = setTimeout(() => {
    console.warn('⚠️  Swagger setup is taking too long, continuing without documentation');
  }, 10000); // 10 second timeout

  setupSwagger(app)
    .then(() => {
      clearTimeout(swaggerTimeout);
      console.log('✅ Swagger documentation available at /api-docs');
    })
    .catch(error => {
      clearTimeout(swaggerTimeout);
      console.error('❌ Failed to setup Swagger:', error);
      console.log('Server will continue without Swagger documentation');
    });
}


// Middleware
app.use(cors());
app.use(express.json());

// Import protect middleware
import { protect, AuthRequest } from './middleware/auth.middleware';

// Public auth routes
app.use('/api/auth', authRouter);

// Apply protect middleware to all subsequent /api routes
// This middleware will check for JWT and populate req.user if valid
// or send 401 if not.
app.use('/api', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Type assertion for req to include 'user' property potentially added by 'protect'
  protect(req as AuthRequest, res, next);
});

// Protected Routes (now behind the 'protect' middleware)

app.use('/api/users', userRouter);
app.use('/api/folders', folderRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/todays-tasks', todaysTasksRoutes);
app.use('/api/stats', statsRouter);
app.use('/api/notes', noteRouter);
app.use('/api/insight-catalysts', insightCatalystRouter);
app.use('/api/user/memory', userMemoryRouter);
app.use('/api/learning-blueprints', learningBlueprintsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ai-rag', aiRagRouter);

// Additional standalone routes for direct access
app.use('/api/questionsets', standaloneQuestionSetRouter);
app.use('/api/questions', standaloneQuestionRouter);

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err.stack); // Log the full error
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

export { app, initializeApplication };
export default app;

