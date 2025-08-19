// src/services/ai/primitiveAI.service.ts - TEMPORARILY DISABLED
// TODO: Primitive AI service temporarily disabled due to type mismatches
// This will be properly implemented once the Prisma schema is aligned

// Temporarily disabled - primitive AI service being reworked
// TODO: Re-enable when Prisma schema is properly aligned

export class PrimitiveAIService {
  constructor() {}

  async generatePrimitive(content: string, userId: number): Promise<any> {
    console.log('Primitive AI service temporarily disabled - being reworked');
    return { message: 'Primitive AI service temporarily disabled - being reworked' };
  }

  async generateQuestions(primitiveId: number, userId: number): Promise<any> {
    console.log('Primitive AI service temporarily disabled - being reworked');
    return { message: 'Primitive AI service temporarily disabled - being reworked' };
  }

  async generateNotes(primitiveId: number, userId: number): Promise<any> {
    console.log('Primitive AI service temporarily disabled - being reworked');
    return { message: 'Primitive AI service temporarily disabled - being reworked' };
  }
}
