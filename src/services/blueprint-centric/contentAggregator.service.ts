import { PrismaClient } from '@prisma/client';
import { BlueprintSectionWithChildren, SectionContent } from './blueprintSection.service';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES
// ============================================================================

export interface AggregatedContent {
  notes: any[];
  questions: any[];
  estimatedTime: number;
  difficulty?: string;
}

export interface MasteryProgress {
  overall: number;
  byStage: Record<string, number>;
  totalCriteria: number;
  masteredCriteria: number;
}

export interface MasteryProgressByStage {
  understand: number;
  use: number;
  explore: number;
}

// ============================================================================
// CONTENT AGGREGATOR SERVICE
// ============================================================================

export class ContentAggregator {
  
  /**
   * Aggregates all content within a section and its children
   * Time Complexity: O(n + m) where n = sections, m = content items
   */
  async aggregateSectionContent(sectionId: number): Promise<SectionContent> {
    const section = await this.getSectionWithChildren(sectionId);
    const content = await this.recursiveContentAggregation(section);
    const masteryProgress = await this.calculateMasteryProgress(sectionId);
    
    return {
      section: section,
      notes: content.notes,
      questions: content.questions,
      masteryCriteria: content.questions, // Using questions as mastery criteria
      masteryProgress: masteryProgress.overall,
      estimatedTime: content.estimatedTime
    };
  }
  
  /**
   * Recursively aggregates content from all child sections
   */
  private async recursiveContentAggregation(section: BlueprintSectionWithChildren): Promise<AggregatedContent> {
    let notes: any[] = [];
    let questions: any[] = [];
    
    // Get direct content
    notes.push(...await this.getNotesBySection(section.id));
    questions.push(...await this.getMasteryCriteriaBySection(section.id));
    
    // Recursively get child content
    for (const child of section.children) {
      const childContent = await this.recursiveContentAggregation(child);
      notes.push(...childContent.notes);
      questions.push(...childContent.questions);
    }
    
    const estimatedTime = this.calculateEstimatedTime({ notes, questions });
    
    return { 
      notes, 
      questions, 
      estimatedTime,
      difficulty: this.calculateAverageDifficulty({ notes, questions })
    };
  }
  
  /**
   * Calculates mastery progress across all content in section
   */
  private async calculateMasteryProgress(sectionId: number): Promise<MasteryProgress> {
    const criteria = await this.getMasteryCriteriaBySection(sectionId);
    const userMasteries = await this.getUserMasteries(criteria.map(c => c.id));
    
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const masteredWeight = userMasteries.reduce((sum, m) => {
      const criterion = criteria.find(c => c.id === m.criterionId);
      return sum + (m.isMastered ? (criterion?.weight || 0) : 0);
    }, 0);
    
    return {
      overall: totalWeight > 0 ? masteredWeight / totalWeight : 0,
      byStage: this.calculateProgressByStage(criteria, userMasteries),
      totalCriteria: criteria.length,
      masteredCriteria: userMasteries.filter(m => m.isMastered).length
    };
  }
  
  /**
   * Calculates UUE stage progression for a section
   * FOUNDATIONAL: Essential for spaced repetition and learning pathways
   */
  async calculateUueStageProgress(sectionId: number, userId: number): Promise<any> {
    const masteryCriteria = await this.getMasteryCriteriaBySection(sectionId);
    const userMasteries = await this.getUserMasteriesForCriteria(
      masteryCriteria.map(mc => mc.id), 
      userId
    );
    
    const stageProgress = {
      understand: { total: 0, mastered: 0, progress: 0 },
      use: { total: 0, mastered: 0, progress: 0 },
      explore: { total: 0, mastered: 0, progress: 0 }
    };
    
    // Calculate progress for each UUE stage
    for (const criterion of masteryCriteria) {
      const mastery = userMasteries.find(m => m.criterionId === criterion.id);
      const stage = criterion.uueStage.toLowerCase() as keyof typeof stageProgress;
      
      stageProgress[stage].total++;
      if (mastery?.isMastered) {
        stageProgress[stage].mastered++;
      }
    }
    
    // Calculate progress percentages
    Object.values(stageProgress).forEach(stage => {
      stage.progress = stage.total > 0 ? stage.mastered / stage.total : 0;
    });
    
    // Determine current stage and progression ability
    const currentStage = this.determineCurrentUueStage(stageProgress);
    const canProgress = this.canProgressToNextStage(stageProgress, currentStage);
    const nextStageRequirements = this.getNextStageRequirements(stageProgress, currentStage);
    
    return {
      ...stageProgress,
      currentStage,
      canProgress,
      nextStageRequirements
    };
  }
  
  /**
   * Aggregates content across multiple sections
   */
  async aggregateMultipleSections(sectionIds: number[]): Promise<{
    totalNotes: number;
    totalQuestions: number;
    totalEstimatedTime: number;
    averageDifficulty: string;
    masteryProgress: MasteryProgress;
    contentBySection: Record<string, AggregatedContent>;
  }> {
    const contentBySection: Record<string, AggregatedContent> = {};
    let totalNotes = 0;
    let totalQuestions = 0;
    let totalEstimatedTime = 0;
    let difficultyScores: number[] = [];
    
    for (const sectionId of sectionIds) {
      const content = await this.recursiveContentAggregation(
        await this.getSectionWithChildren(sectionId)
      );
      
      contentBySection[sectionId.toString()] = content;
      totalNotes += content.notes.length;
      totalQuestions += content.questions.length;
      totalEstimatedTime += content.estimatedTime;
      
      // Convert difficulty to numeric score for averaging
      if (content.difficulty) {
        const difficultyScore = this.difficultyToScore(content.difficulty);
        difficultyScores.push(difficultyScore);
      }
    }
    
    const averageDifficulty = difficultyScores.length > 0 
      ? this.scoreToDifficulty(
          difficultyScores.reduce((sum, score) => sum + score, 0) / difficultyScores.length
        )
      : 'BEGINNER';
    
    // Calculate overall mastery progress
    const allCriteria = await this.getAllMasteryCriteria(sectionIds);
    const userMasteries = await this.getUserMasteries(allCriteria.map(c => c.id));
    
    const totalWeight = allCriteria.reduce((sum, c) => sum + c.weight, 0);
    const masteredWeight = userMasteries.reduce((sum, m) => {
      const criterion = allCriteria.find(c => c.id === m.criterionId);
      return sum + (m.isMastered ? (criterion?.weight || 0) : 0);
    }, 0);
    
    const masteryProgress: MasteryProgress = {
      overall: totalWeight > 0 ? masteredWeight / totalWeight : 0,
      byStage: this.calculateProgressByStage(allCriteria, userMasteries),
      totalCriteria: allCriteria.length,
      masteredCriteria: userMasteries.filter(m => m.isMastered).length
    };
    
    return {
      totalNotes,
      totalQuestions,
      totalEstimatedTime,
      averageDifficulty,
      masteryProgress,
      contentBySection
    };
  }
  
  /**
   * Gets content statistics for a user across all blueprints
   */
  async getUserContentStats(userId: number): Promise<{
    totalSections: number;
    totalNotes: number;
    totalQuestions: number;
    totalEstimatedTime: number;
    masteryProgress: MasteryProgress;
    contentByBlueprint: Record<number, any>;
  }> {
    // Get all blueprint sections for the user
    const sections = await prisma.blueprintSection.findMany({
      where: { userId },
      include: {
        blueprint: {
          select: { id: true, title: true }
        }
      }
    });
    
    const contentByBlueprint: Record<number, any> = {};
    let totalNotes = 0;
    let totalQuestions = 0;
    let totalEstimatedTime = 0;
    
    // Group sections by blueprint
    const sectionsByBlueprint = sections.reduce((acc, section) => {
      if (!acc[section.blueprintId]) {
        acc[section.blueprintId] = [];
      }
      acc[section.blueprintId].push(section);
      return acc;
    }, {} as Record<number, any[]>);
    
    // Aggregate content for each blueprint
    for (const [blueprintId, blueprintSections] of Object.entries(sectionsByBlueprint)) {
      const sectionIds = blueprintSections.map(s => s.id);
      const blueprintContent = await this.aggregateMultipleSections(sectionIds);
      
      contentByBlueprint[parseInt(blueprintId)] = {
        title: blueprintSections[0].blueprint.title,
        sections: blueprintSections.length,
        ...blueprintContent
      };
      
      totalNotes += blueprintContent.totalNotes;
      totalQuestions += blueprintContent.totalQuestions;
      totalEstimatedTime += blueprintContent.totalEstimatedTime;
    }
    
    // Calculate overall mastery progress
    const allCriteria = await this.getAllMasteryCriteriaForUser(userId);
    const userMasteries = await this.getUserMasteries(allCriteria.map(c => c.id));
    
    const totalWeight = allCriteria.reduce((sum, c) => sum + c.weight, 0);
    const masteredWeight = userMasteries.reduce((sum, m) => {
      const criterion = allCriteria.find(c => c.id === m.criterionId);
      return sum + (m.isMastered ? (criterion?.weight || 0) : 0);
    }, 0);
    
    const masteryProgress: MasteryProgress = {
      overall: totalWeight > 0 ? masteredWeight / totalWeight : 0,
      byStage: this.calculateProgressByStage(allCriteria, userMasteries),
      totalCriteria: allCriteria.length,
      masteredCriteria: userMasteries.filter(m => m.isMastered).length
    };
    
    return {
      totalSections: sections.length,
      totalNotes,
      totalQuestions,
      totalEstimatedTime,
      masteryProgress,
      contentByBlueprint
    };
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  /**
   * Gets a section with its children
   */
  private async getSectionWithChildren(sectionId: number): Promise<BlueprintSectionWithChildren> {
    const section = await prisma.blueprintSection.findUnique({
      where: { id: sectionId },
      include: {
        children: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: {
                notes: true,
                knowledgePrimitives: true,
                masteryCriteria: true
              }
            }
          }
        },
        _count: {
          select: {
            notes: true,
            knowledgePrimitives: true,
            masteryCriteria: true
          }
        }
      }
    });
    
    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }
    
    return section as BlueprintSectionWithChildren;
  }
  
  /**
   * Gets notes by section
   */
  private async getNotesBySection(sectionId: number): Promise<any[]> {
    return prisma.noteSection.findMany({
      where: { blueprintSectionId: sectionId },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  /**
   * Gets mastery criteria by section
   */
  private async getMasteryCriteriaBySection(sectionId: number): Promise<any[]> {
    return prisma.masteryCriterion.findMany({
      where: { blueprintSectionId: sectionId }
    });
  }
  
  /**
   * Gets all mastery criteria for multiple sections
   */
  private async getAllMasteryCriteria(sectionIds: number[]): Promise<any[]> {
    return prisma.masteryCriterion.findMany({
      where: {
        blueprintSectionId: { in: sectionIds }
      }
    });
  }
  
  /**
   * Gets all mastery criteria for a user
   */
  private async getAllMasteryCriteriaForUser(userId: number): Promise<any[]> {
    return prisma.masteryCriterion.findMany({
      where: { userId }
    });
  }
  
  /**
   * Gets user masteries for criteria
   */
  private async getUserMasteries(criterionIds: number[]): Promise<any[]> {
    if (criterionIds.length === 0) return [];
    
    return prisma.userCriterionMastery.findMany({
      where: {
        criterionId: { in: criterionIds }
      }
    });
  }
  
  /**
   * Gets user masteries for criteria by user ID
   */
  private async getUserMasteriesForCriteria(criterionIds: number[], userId: number): Promise<any[]> {
    if (criterionIds.length === 0) return [];
    
    return prisma.userCriterionMastery.findMany({
      where: {
        criterionId: { in: criterionIds },
        userId
      }
    });
  }
  
  /**
   * Calculates progress by UUE stage
   */
  private calculateProgressByStage(criteria: any[], userMasteries: any[]): Record<string, number> {
    const stageProgress: Record<string, number> = {};
    
    // Group criteria by UUE stage
    const criteriaByStage = criteria.reduce((acc, criterion) => {
      const stage = criterion.uueStage.toLowerCase();
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(criterion);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Calculate progress for each stage
    for (const [stage, stageCriteria] of Object.entries(criteriaByStage)) {
      const totalWeight = (stageCriteria as any[]).reduce((sum, c) => sum + c.weight, 0);
      const masteredWeight = (stageCriteria as any[]).reduce((sum, c) => {
        const mastery = userMasteries.find(m => m.criterionId === c.id);
        return sum + (mastery?.isMastered ? c.weight : 0);
      }, 0);
      
      stageProgress[stage] = totalWeight > 0 ? masteredWeight / totalWeight : 0;
    }
    
    return stageProgress;
  }
  
  /**
   * Determines current UUE stage based on mastery progress
   */
  private determineCurrentUueStage(stageProgress: any): string {
    if (stageProgress.explore?.progress >= 0.8) return 'EXPLORE';
    if (stageProgress.use?.progress >= 0.8) return 'USE';
    if (stageProgress.understand?.progress >= 0.8) return 'UNDERSTAND';
    return 'UNDERSTAND';
  }
  
  /**
   * Checks if user can progress to next UUE stage
   */
  private canProgressToNextStage(stageProgress: any, currentStage: string): boolean {
    switch (currentStage) {
      case 'UNDERSTAND':
        return stageProgress.understand?.progress >= 0.8;
      case 'USE':
        return stageProgress.use?.progress >= 0.8;
      case 'EXPLORE':
        return stageProgress.explore?.progress >= 0.8;
      default:
        return false;
    }
  }
  
  /**
   * Gets requirements for next UUE stage
   */
  private getNextStageRequirements(stageProgress: any, currentStage: string): string[] {
    const requirements: string[] = [];
    
    switch (currentStage) {
      case 'UNDERSTAND':
        if (stageProgress.understand?.progress < 0.8) {
          requirements.push(`Master ${Math.ceil((0.8 - stageProgress.understand.progress) * stageProgress.understand.total)} more understand criteria`);
        }
        break;
      case 'USE':
        if (stageProgress.use?.progress < 0.8) {
          requirements.push(`Master ${Math.ceil((0.8 - stageProgress.use.progress) * stageProgress.use.total)} more use criteria`);
        }
        break;
      case 'EXPLORE':
        if (stageProgress.explore?.progress < 0.8) {
          requirements.push(`Master ${Math.ceil((0.8 - stageProgress.explore.progress) * stageProgress.explore.total)} more explore criteria`);
        }
        break;
    }
    
    return requirements;
  }
  
  /**
   * Calculates estimated time for content
   */
  private calculateEstimatedTime(content: { notes: any[]; questions: any[] }): number {
    let totalTime = 0;
    
    // Add time for notes (estimate 5 minutes per note)
    totalTime += content.notes.length * 5;
    
    // Add time for mastery criteria (estimate 10 minutes per criterion)
    totalTime += content.questions.length * 10;
    
    return totalTime;
  }
  
  /**
   * Calculates average difficulty for content
   */
  private calculateAverageDifficulty(content: { notes: any[]; questions: any[] }): string {
    // For now, return the most common difficulty
    // In a real implementation, you might want to calculate a weighted average
    const difficulties = content.questions.map(q => q.difficulty || 'MEDIUM');
    
    if (difficulties.length === 0) return 'BEGINNER';
    
    const difficultyCounts = difficulties.reduce((acc, difficulty) => {
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(difficultyCounts).reduce((a, b) => 
      difficultyCounts[a[0]] > difficultyCounts[b[0]] ? a : b
    )[0];
  }
  
  /**
   * Converts difficulty string to numeric score
   */
  private difficultyToScore(difficulty: string): number {
    switch (difficulty.toUpperCase()) {
      case 'BEGINNER': return 1;
      case 'INTERMEDIATE': return 2;
      case 'ADVANCED': return 3;
      default: return 1;
    }
  }
  
  /**
   * Converts numeric score to difficulty string
   */
  private scoreToDifficulty(score: number): string {
    if (score <= 1.5) return 'BEGINNER';
    if (score <= 2.5) return 'INTERMEDIATE';
    return 'ADVANCED';
  }
}

export default ContentAggregator;
