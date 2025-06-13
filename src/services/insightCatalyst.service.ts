import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InsightCatalystService {
  async createInsightCatalyst(data: {
    type: string;
    text: string;
    explanation?: string;
    imageUrls?: string[];
    userId: number;
    noteId?: number;
    questionId?: number;
  }) {
    return prisma.insightCatalyst.create({
      data,
    });
  }

  async getInsightCatalysts(userId: number, filters?: { noteId?: number; questionId?: number }) {
    const where: any = { userId };

    if (filters?.noteId) {
      where.noteId = filters.noteId;
    }
    if (filters?.questionId) {
      where.questionId = filters.questionId;
    }

    return prisma.insightCatalyst.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getInsightCatalystById(id: number, userId: number) {
    return prisma.insightCatalyst.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async updateInsightCatalyst(
    id: number,
    userId: number,
    data: {
      type?: string;
      text?: string;
      explanation?: string;
      imageUrls?: string[];
      noteId?: number;
      questionId?: number;
    }
  ) {
    // First verify ownership
    const existing = await this.getInsightCatalystById(id, userId);
    if (!existing) {
      throw new Error('Insight catalyst not found or access denied');
    }

    return prisma.insightCatalyst.update({
      where: { id },
      data,
    });
  }

  async deleteInsightCatalyst(id: number, userId: number) {
    // First verify ownership
    const existing = await this.getInsightCatalystById(id, userId);
    if (!existing) {
      throw new Error('Insight catalyst not found or access denied');
    }

    return prisma.insightCatalyst.delete({
      where: { id },
    });
  }

  async verifyNoteOwnership(noteId: number, userId: number) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });
    return !!note;
  }

  async verifyQuestionOwnership(questionId: number, userId: number) {
    const question = await prisma.question.findFirst({
      where: { 
        id: questionId,
        questionSet: { folder: { userId } }
      },
    });
    return !!question;
  }
} 