import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { protect } from './middleware/auth.middleware'; // Import the protect middleware
import { AiRAGController } from './ai-rag/ai-rag.controller';
import { AiRAGService } from './ai-rag/ai-rag.service';
import { PrismaClient } from '@prisma/client';

@Module({
  imports: [],
  controllers: [AiRAGController],
  providers: [
    {
      provide: AiRAGService,
      // Provide a mock implementation for AiRAGService.
      // The actual service methods won't be called during Swagger generation,
      // so an empty object or one with mock methods is sufficient.
      useValue: {
        createLearningBlueprint: async () => ({}),
        generateQuestionsFromBlueprint: async () => ({}),
        generateNoteFromBlueprint: async () => ({}),
        handleChatMessage: async () => ({}),
      },
    },
    {
      provide: PrismaClient,
      useValue: {
        // Mock PrismaClient methods as needed for middleware or other services
        // For now, an empty mock is likely sufficient as the service is fully mocked.
      },
    },
  ],
})
export class SwaggerAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(protect) // Apply the Express middleware
      .forRoutes(AiRAGController); // Apply it to all routes in AiRAGController
  }
}
