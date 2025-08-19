// Main application file
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma'; // Import shared prisma instance
import { authRouter } from './routes/user/auth'; 
import userRouter from './routes/user/user.routes';

import reviewRouter from './routes/mastery/review.routes'; // Using minimal review router to avoid heavy Prisma queries

import noteRouter from './routes/note.routes';
import userMemoryRouter from './routes/user/userMemory.routes';
import learningBlueprintsRouter from './routes/learning-blueprints.routes'; // Temporarily disabled - imports AiRAGService
import chatRouter from './routes/ai/chat.routes'; // Temporarily disabled - imports AiRAGService
import primitiveRouter from './routes/mastery/primitive.routes';
import primitiveSRRouter from './routes/mastery/primitiveSR.routes';
import primitiveAIRouter from './routes/ai/primitiveAI.routes';
import blueprintsAliasRouter from './routes/blueprints.routes'; // Temporarily disabled - imports AiRAGService
import { aiRagRouter } from './services/ai/ai-rag.routes'; // ENABLED - AI RAG service working
import premiumRouter from './routes/premium.routes';
import paymentRouter from './routes/user/payment.routes';
import stripeWebhookRouter from './routes/stripe-webhook.routes';
// New blueprint-centric route imports
import uueStageProgressionRouter from './routes/mastery/uueStageProgression.routes';
import learningPathwaysRouter from './routes/mastery/learningPathways.routes';
import masteryThresholdsRouter from './routes/mastery/masteryThresholds.routes';
import sectionAnalyticsRouter from './routes/sectionAnalytics.routes';
import studySessionsRouter from './routes/mastery/studySessions.routes';
import contentRecommendationsRouter from './routes/contentRecommendations.routes';
import { initializeAIAPIClient, shutdownAIAPIClient, getAIAPIClient } from './services/ai/ai-api-client.service';
// Swagger temporarily disabled; remove Nest/Swagger imports to avoid build-time module resolution
// import { NestFactory } from '@nestjs/core';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import * as swaggerUi from 'swagger-ui-express';
// AI-RAG imports moved to services/ai directory
// Note: Swagger generation temporarily disabled during reorganization

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
app.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Basic system health
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Database health check
    let databaseHealth: { status: string; responseTime: number; error?: string } = { status: 'unknown', responseTime: 0 };
    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStartTime;
      databaseHealth = { 
        status: 'healthy', 
        responseTime: dbResponseTime 
      };
    } catch (error) {
      databaseHealth = { 
        status: 'unhealthy', 
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
      systemHealth.status = 'degraded';
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryHealth = {
      status: memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    };

    // Performance metrics
    const responseTime = Date.now() - startTime;
    const performanceHealth = {
      status: responseTime < 1000 ? 'healthy' : 'warning', // 1 second threshold
      responseTime,
      loadAverage: process.cpuUsage()
    };

    // Overall health assessment
    const overallHealth = {
      status: systemHealth.status,
      checks: {
        system: systemHealth.status,
        database: databaseHealth.status,
        memory: memoryHealth.status,
        performance: performanceHealth.status
      },
      timestamp: systemHealth.timestamp,
      uptime: systemHealth.uptime,
      version: systemHealth.version,
      environment: systemHealth.environment
    };

    // Set appropriate HTTP status
    const httpStatus = overallHealth.status === 'healthy' ? 200 : 
                      overallHealth.status === 'degraded' ? 503 : 500;

    res.status(httpStatus).json({
      ...overallHealth,
      details: {
        database: databaseHealth,
        memory: memoryHealth,
        performance: performanceHealth
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced health endpoint with detailed metrics
app.get('/health/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Comprehensive system metrics
    const systemMetrics = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      resourceUsage: process.resourceUsage()
    };

    // Database performance metrics
    let dbMetrics = null;
    try {
      const dbStartTime = Date.now();
      const dbResult = await prisma.$queryRaw`SELECT 1 as test`;
      const dbResponseTime = Date.now() - dbStartTime;
      
      dbMetrics = {
        status: 'healthy',
        responseTime: dbResponseTime,
        connectionPool: {
          // Note: Prisma doesn't expose connection pool metrics directly
          // This would need to be implemented with custom monitoring
        }
      };
    } catch (error) {
      dbMetrics = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }

    // Process metrics
    const processMetrics = {
      title: process.title,
      version: process.version,
      versions: process.versions,
      config: process.config,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : undefined
      }
    };

    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      system: systemMetrics,
      database: dbMetrics,
      process: processMetrics
    });

  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Performance metrics endpoint
app.get('/health/performance', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Memory metrics
    const memoryMetrics = {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss
    };

    // CPU metrics
    const cpuMetrics = process.cpuUsage();

    // Resource usage
    const resourceMetrics = process.resourceUsage();

    // Database performance test
    let dbPerformance = null;
    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1 as test`;
      const dbResponseTime = Date.now() - dbStartTime;
      
      dbPerformance = {
        responseTime: dbResponseTime,
        status: dbResponseTime < 100 ? 'excellent' : 
                dbResponseTime < 500 ? 'good' : 
                dbResponseTime < 1000 ? 'acceptable' : 'poor'
      };
    } catch (error) {
      dbPerformance = {
        error: error instanceof Error ? error.message : 'Database test failed',
        status: 'error'
      };
    }

    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      responseTime,
      metrics: {
        memory: memoryMetrics,
        cpu: cpuMetrics,
        resources: resourceMetrics,
        database: dbPerformance
      }
    });

  } catch (error) {
    console.error('Performance metrics failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Performance metrics failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Log all API requests for debugging
app.use('/api', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`🌐 [SERVER] API Request: ${req.method} ${req.path}`);
  next();
});

// Protected Routes (now behind the 'protect' middleware)

app.use('/api/users', userRouter);

app.use('/api/reviews', reviewRouter); // Using minimal review router to avoid heavy Prisma queries in spaced repetition service

app.use('/api/notes', noteRouter);
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

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err.stack); // Log the full error
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

export { app, initializeApplication };
export default app;

