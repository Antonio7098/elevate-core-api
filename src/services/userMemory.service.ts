import { PrismaClient, UserMemory, CognitiveApproach, ExplanationStyle, InteractionStyle } from '@prisma/client';
import { AppError } from '../utils/errorHandler';

const prisma = new PrismaClient();

export interface UserMemoryUpdateData {
  cognitiveApproach?: CognitiveApproach | null;
  explanationStyles?: ExplanationStyle[];
  interactionStyle?: InteractionStyle | null;
  primaryGoal?: string | null;
}

export class UserMemoryService {
  /**
   * Get or create a user's memory record
   */
  static async getUserMemory(userId: number): Promise<UserMemory> {
    try {
      // Try to find existing user memory
      let userMemory = await prisma.userMemory.findUnique({
        where: { userId }
      });

      // If no memory exists, create one with default values
      if (!userMemory) {
        userMemory = await prisma.userMemory.create({
          data: {
            userId,
            explanationStyles: [],
            cognitiveApproach: null,
            interactionStyle: null,
            primaryGoal: null
          }
        });
      }

      return userMemory;
    } catch (error) {
      throw new AppError('Failed to get user memory', 500);
    }
  }

  /**
   * Update a user's memory record
   */
  static async updateUserMemory(userId: number, data: UserMemoryUpdateData): Promise<UserMemory> {
    try {
      // First ensure the user memory exists
      await this.getUserMemory(userId);

      // Update the user memory
      const updatedMemory = await prisma.userMemory.update({
        where: { userId },
        data
      });

      return updatedMemory;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user memory', 500);
    }
  }
} 