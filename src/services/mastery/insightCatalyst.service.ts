import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InsightCatalystService {
  async createInsightCatalyst(data: {
    type: string;
    text: string;
    explanation?: string;
    imageUrls?: string[];
    userId: number;
    noteId?: number; // Make noteId optional for backward compatibility
    primitiveId?: string; // Add primitiveId as optional
    questionId?: number;
  }) {
    // Create InsightCatalyst with only the fields that exist in the schema
    // For backward compatibility, if noteId is not provided, we'll need to create a dummy note or handle this differently
    // For now, let's create a minimal note if noteId is not provided
    let actualNoteId = data.noteId;
    if (!actualNoteId) {
      // Create a minimal note for backward compatibility
      const dummyNote = await prisma.note.create({
        data: {
          title: 'Dummy Note for Insight Catalyst',
          content: 'Dummy content',
          userId: data.userId,
          folderId: null,
        },
      });
      actualNoteId = dummyNote.id;
    }
    
    return prisma.insightCatalyst.create({
      data: {
        title: data.type,
        content: data.text,
        userId: data.userId,
        noteId: actualNoteId,
        primitiveId: data.primitiveId || null, // Optional field
      },
    });
  }

  async getInsightCatalysts(userId: number, filters?: { noteId?: number; questionId?: number }) {
    const where: any = { userId };

    if (filters?.noteId) {
      where.noteId = filters.noteId;
    }
    // Note: questionId filtering is not supported as insight catalysts are not directly linked to questions
    // The questionId parameter is ignored for backward compatibility

    const catalysts = await prisma.insightCatalyst.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Add questionId to response for backward compatibility
    return catalysts.map(catalyst => ({
      ...catalyst,
      questionId: filters?.questionId || null,
    }));
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

    // Map the fields to the actual schema fields
    const updateData: any = {};
    if (data.type) updateData.title = data.type;
    if (data.text) updateData.content = data.text;
    if (data.noteId) updateData.noteId = data.noteId;

    return prisma.insightCatalyst.update({
      where: { id },
      data: updateData,
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