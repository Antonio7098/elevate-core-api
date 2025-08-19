import { PrismaClient, UserMemory, CognitiveApproach, ExplanationStyle, InteractionStyle } from '@prisma/client';

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
  async getUserMemory(userId: number): Promise<UserMemory> {
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
      throw new Error('Failed to get user memory');
    }
  }

  /**
   * Update a user's memory record
   */
  async updateUserMemory(userId: number, data: UserMemoryUpdateData): Promise<UserMemory> {
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
      throw new Error('Failed to update user memory');
    }
  }
}

export default UserMemoryService; 