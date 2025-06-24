import { Module } from '@nestjs/common';
import { AiRAGController } from './ai-rag.controller';
import { AiRAGService } from './ai-rag.service';
// If you have a shared AuthModule that exports AuthenticatedGuard, import it here.
// import { AuthModule } from '../auth/auth.module'; 
// import { PrismaModule } from '../prisma/prisma.module'; // Path TBD or PrismaClient might be globally available

@Module({
  imports: [/* PrismaModule, AuthModule */], // PrismaModule path TBD or global, AuthModule TBD
  controllers: [AiRAGController],
  providers: [AiRAGService],
  exports: [AiRAGService], // Export if other modules need to use AiRAGService
})
export class AiRAGModule {}
