// Main application file
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma'; // Import shared prisma instance
import { authRouter } from './routes/auth'; 
import userRouter from './routes/user.routes';
import folderRouter from './routes/folder.routes';
import aiRouter from './routes/ai.routes'; // Temporarily disabled - imports AiRAGService
import reviewRouter from './routes/review-minimal'; // Using minimal review router to avoid heavy Prisma queries
import standaloneQuestionSetRouter from './routes/standalone-questionset.routes';
import standaloneQuestionRouter from './routes/standalone-question.routes';
import dashboardRouter from './routes/dashboard.routes';
import todaysTasksRoutes from './routes/todaysTasks.routes';
import statsRouter from './routes/stats.routes';
import noteRouter from './routes/note.routes';
import insightCatalystRouter from './routes/insightCatalyst.routes';
import userMemoryRouter from './routes/userMemory.routes';
import learningBlueprintsRouter from './routes/learning-blueprints.routes'; // Temporarily disabled - imports AiRAGService
import chatRouter from './routes/chat.routes'; // Temporarily disabled - imports AiRAGService
import primitiveRouter from './routes/primitive.routes';
import primitiveSRRouter from './routes/primitiveSR.routes';
import primitiveAIRouter from './routes/primitiveAI.routes';
import blueprintsAliasRouter from './routes/blueprints.routes'; // Temporarily disabled - imports AiRAGService
import { aiRagRouter } from './ai-rag/ai-rag.routes'; // ENABLED - AI RAG service working
import premiumRouter from './routes/premium.routes';
import paymentRouter from './routes/payment.routes';
import stripeWebhookRouter from './routes/stripe-webhook.routes';
// New blueprint-centric route imports
import uueStageProgressionRouter from './routes/uueStageProgression.routes';
import learningPathwaysRouter from './routes/learningPathways.routes';
import masteryThresholdsRouter from './routes/masteryThresholds.routes';
import sectionAnalyticsRouter from './routes/sectionAnalytics.routes';
import studySessionsRouter from './routes/studySessions.routes';
import contentRecommendationsRouter from './routes/contentRecommendations.routes';
import { initializeAIAPIClient, shutdownAIAPIClient, getAIAPIClient } from './services/ai-api-client.service';
import { NestFactory } from '@nestjs/core'; // Temporarily disabled - not used when Swagger is disabled
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as swaggerUi from 'swagger-ui-express';
import { SwaggerAppModule } from './swagger.app.module'; // Temporary module for Swagger gen
import { AiRAGController } from './ai-rag/ai-rag.controller'; // Temporarily disabled - imports AiRAGService
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

// Stripe webhook must be mounted BEFORE express.json() so raw body is available
app.use('/api', stripeWebhookRouter);

async function initializeApplication() {
  try {
    console.log('🚀 Initializing application and AI API client...');
    // Temporarily disable AI API client initialization for debugging
    console.log('⚠️  AI API client initialization temporarily disabled for debugging');
    /*
    await initializeAIAPIClient();
    const client = getAIAPIClient();
    if (client) {
      const healthStatus = await client.healthCheck();
      console.log(`✅ AI API client initialized successfully. Status: ${healthStatus.status}`);
    } else {
      console.log('AI API client not available.');
    }
    */
  } catch (error) {
    console.error('❌ Failed to initialize AI API client:', error);
    console.log('🔄 Application will continue without AI API integration');
  }
}

// Setup graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Received SIGINT. Graceful shutdown...');
  // await shutdownAIAPIClient();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM. Graceful shutdown...');
  // await shutdownAIAPIClient();
  process.exit(0);
});

// Function to setup Swagger - Temporarily disabled
/*
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
*/

// Only setup Swagger if not in a test environment, as it can interfere with test runners.
if (process.env.NODE_ENV !== 'test') {
  // Temporarily disable Swagger to debug hanging issue
  console.log('⚠️  Swagger setup temporarily disabled for debugging');
  /*
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
  */
}

// Emergency test route (before any middleware)
app.get('/ping', (req: express.Request, res: express.Response) => {
  console.log('🔥 PING route hit - Express is working!');
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

// Basic request logging at the top level
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`🌐 [SERVER] INCOMING REQUEST: ${req.method} ${req.url}`);
  console.log(`🌐 [SERVER] Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`🌐 [SERVER] Body: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Import protect middleware
import { protect, AuthRequest } from './middleware/auth.middleware';

// Public auth routes
app.use('/api/auth', authRouter);

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Log all API requests for debugging
app.use('/api', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`🌐 [SERVER] API Request: ${req.method} ${req.path}`);
  next();
});

// Protected Routes (now behind the 'protect' middleware)

app.use('/api/users', userRouter);
app.use('/api/folders', folderRouter);
app.use('/api/ai', aiRouter); // Temporarily disabled for debugging
app.use('/api/reviews', reviewRouter); // Using minimal review router to avoid heavy Prisma queries in spaced repetition service
app.use('/api/dashboard', dashboardRouter);
app.use('/api/todays-tasks', todaysTasksRoutes);
app.use('/api/stats', statsRouter);
app.use('/api/notes', noteRouter);
app.use('/api/insight-catalysts', insightCatalystRouter);
app.use('/api/user/memory', userMemoryRouter);
app.use('/api/learning-blueprints', learningBlueprintsRouter); // Commented out to avoid route conflicts
app.use('/api/blueprints', blueprintsAliasRouter); // Commented out to avoid route conflicts
app.use('/api/chat', chatRouter); // Temporarily disabled for debugging
app.use('/api/primitives', primitiveRouter);
app.use('/api/primitive-sr', primitiveSRRouter);
app.use('/api/ai/primitives', primitiveAIRouter);
app.use('/api/ai-rag', protect, aiRagRouter); // Enable AI-RAG routes with protection
app.use('/api/premium', premiumRouter);
app.use('/api/payments', paymentRouter);

// New blueprint-centric routes
app.use('/api/uue-stage-progression', uueStageProgressionRouter);
app.use('/api/learning-pathways', learningPathwaysRouter);
app.use('/api/mastery-thresholds', masteryThresholdsRouter);
app.use('/api/section-analytics', sectionAnalyticsRouter);
app.use('/api/study-sessions', studySessionsRouter);
app.use('/api/content-recommendations', contentRecommendationsRouter);

// Additional standalone routes for direct access
app.use('/api/question-sets', standaloneQuestionSetRouter);
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

