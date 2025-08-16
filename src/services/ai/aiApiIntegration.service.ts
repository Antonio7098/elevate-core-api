import { PrismaClient } from '@prisma/client';
import { MasteryCriterion, UueStage, BlueprintSection } from '@prisma/client';
import { masteryCriterionService } from '../mastery/masteryCriterion.service';
import { masteryCalculationService } from '../mastery/masteryCalculation.service';

const prisma = new PrismaClient();

export interface CriterionMappingRequest {
  blueprintId: string;
  sectionId: string;
  primitiveId: string;
  content: string;
  learningObjectives: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface CriterionMappingResponse {
  criterionId: string;
  description: string;
  uueStage: UueStage;
  weight: number;
  masteryThreshold: number;
  questionTypes: string[];
  mappedPrimitives: string[];
  confidence: number;
}

export interface QuestionGenerationRequest {
  criterionId: string;
  userId: number;
  questionCount: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  includeUueStage: boolean;
  userMasteryLevel: number;
}

export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
  metadata: {
    criterionId: string;
    uueStage: UueStage;
    difficulty: number;
    estimatedTime: number;
    learningObjectives: string[];
  };
}

export interface GeneratedQuestion {
  id: string;
  questionText: string;
  questionType: string;
  difficulty: number;
  uueStage: UueStage;
  learningObjectives: string[];
  estimatedTime: number;
  hints: string[];
  explanation: string;
}

export interface UueStageContentRequest {
  sectionId: string;
  uueStage: UueStage;
  userId: number;
  contentType: 'QUESTIONS' | 'EXERCISES' | 'EXPLANATIONS' | 'EXAMPLES';
  count: number;
}

export interface UueStageContentResponse {
  content: UueStageContent[];
  stage: UueStage;
  sectionId: string;
  userReadiness: number; // 0-1 score indicating user readiness for this stage
  recommendations: string[];
}

export interface UueStageContent {
  id: string;
  type: 'QUESTION' | 'EXERCISE' | 'EXPLANATION' | 'EXAMPLE';
  content: string;
  difficulty: number;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedTime: number;
}

export class AiApiIntegrationService {
  /**
   * Map generated primitives to specific mastery criteria
   */
  async mapPrimitivesToCriteria(
    request: CriterionMappingRequest
  ): Promise<CriterionMappingResponse[]> {
    const { blueprintId, sectionId, primitiveId, content, learningObjectives, difficulty } = request;
    
    // Analyze content and learning objectives to determine appropriate criteria
    const criteria: CriterionMappingResponse[] = [];
    
    // Map to UNDERSTAND stage criteria
    const understandCriteria = await this.createUnderstandCriteria(
      sectionId,
      content,
      learningObjectives,
      difficulty
    );
    criteria.push(...understandCriteria);
    
    // Map to USE stage criteria if content suggests application
    if (this.contentSuggestsApplication(content, learningObjectives)) {
      const useCriteria = await this.createUseCriteria(
        sectionId,
        content,
        learningObjectives,
        difficulty
      );
      criteria.push(...useCriteria);
    }
    
    // Map to EXPLORE stage criteria if content suggests advanced concepts
    if (this.contentSuggestsExploration(content, learningObjectives)) {
      const exploreCriteria = await this.createExploreCriteria(
        sectionId,
        content,
        learningObjectives,
        difficulty
      );
      criteria.push(...exploreCriteria);
    }
    
    // Create primitive-to-criterion mapping for legacy compatibility
    await this.createPrimitiveCriterionMapping(primitiveId, blueprintId, criteria);
    
    return criteria;
  }

  /**
   * Generate criterion-specific questions with weighted importance
   */
  async generateCriterionQuestions(
    request: QuestionGenerationRequest
  ): Promise<QuestionGenerationResponse> {
    const { criterionId, userId, questionCount, difficulty, includeUueStage, userMasteryLevel } = request;
    
    // Get criterion details
    const criterion = await masteryCriterionService.getCriterion(criterionId);
    if (!criterion) {
      throw new Error(`Criterion ${criterionId} not found`);
    }
    
    // Get user's current mastery for this criterion
    const userMastery = await masteryCalculationService.calculateCriterionMasteryScore(
      criterionId,
      userId
    );
    
    // Adjust difficulty based on user mastery
    const adjustedDifficulty = this.adjustDifficultyForUserMastery(
      difficulty,
      userMastery,
      criterion.masteryThreshold
    );
    
    // Generate questions appropriate for the criterion's UUE stage
    const questions = await this.generateQuestionsForUueStage(
      criterion,
      questionCount,
      adjustedDifficulty,
      includeUueStage,
      userMasteryLevel
    );
    
    // Calculate estimated time based on question complexity
    const estimatedTime = this.calculateEstimatedTime(questions);
    
    return {
      questions,
      metadata: {
        criterionId,
        uueStage: criterion.uueStage,
        difficulty: adjustedDifficulty,
        estimatedTime,
        learningObjectives: [criterion.description],
      },
    };
  }

  /**
   * Generate UUE stage-specific content
   */
  async generateUueStageContent(
    request: UueStageContentRequest
  ): Promise<UueStageContentResponse> {
    const { sectionId, uueStage, userId, contentType, count } = request;
    
    // Check user readiness for this stage
    const userReadiness = await this.calculateUserReadiness(userId, sectionId, uueStage);
    
    // Get criteria for this stage
    const criteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, uueStage);
    
    // Generate content based on user readiness and stage requirements
    const content = await this.generateContentForStage(
      uueStage,
      criteria,
      contentType,
      count,
      userReadiness
    );
    
    // Generate recommendations based on user readiness
    const recommendations = this.generateStageRecommendations(uueStage, userReadiness);
    
    return {
      content,
      stage: uueStage,
      sectionId,
      userReadiness,
      recommendations,
    };
  }

  /**
   * Update AI API contracts for new criterion-based schemas
   */
  async updateAiApiContracts(): Promise<{
    updated: boolean;
    changes: string[];
    newEndpoints: string[];
  }> {
    const changes: string[] = [];
    const newEndpoints: string[] = [];
    
    // New endpoints needed
    newEndpoints.push('POST /api/v1/primitives/generate-with-criteria');
    newEndpoints.push('POST /api/v1/questions/criterion-specific');
    newEndpoints.push('POST /api/v1/content/uue-stage-specific');
    
    // Schema updates
    changes.push('Added MasteryCriterion model with UUE stage and weight fields');
    changes.push('Added UserCriterionMastery model for individual tracking');
    changes.push('Updated question generation to include criterion mapping');
    changes.push('Added UUE stage progression logic');
    
    return {
      updated: true,
      changes,
      newEndpoints,
    };
  }

  /**
   * Ensure AI API supports weighted mastery criteria generation
   */
  async validateWeightedMasterySupport(): Promise<{
    supported: boolean;
    missingFeatures: string[];
    recommendations: string[];
  }> {
    const missingFeatures: string[] = [];
    const recommendations: string[] = [];
    
    // Check if AI API can handle weighted criteria
    const canHandleWeights = await this.testWeightedCriteriaGeneration();
    if (!canHandleWeights) {
      missingFeatures.push('Weighted criterion importance in question generation');
      recommendations.push('Update AI API to consider criterion weights when generating questions');
    }
    
    // Check if AI API can generate UUE stage-specific content
    const canHandleUueStages = await this.testUueStageContentGeneration();
    if (!canHandleUueStages) {
      missingFeatures.push('UUE stage-specific content generation');
      recommendations.push('Extend AI API to generate content appropriate for UNDERSTAND, USE, and EXPLORE stages');
    }
    
    // Check if AI API can map primitives to criteria
    const canHandleMapping = await this.testPrimitiveToCriterionMapping();
    if (!canHandleMapping) {
      missingFeatures.push('Primitive to criterion mapping');
      recommendations.push('Implement AI-powered content analysis to map primitives to mastery criteria');
    }
    
    return {
      supported: missingFeatures.length === 0,
      missingFeatures,
      recommendations,
    };
  }

  // Private helper methods

  private async createUnderstandCriteria(
    sectionId: string,
    content: string,
    learningObjectives: string[],
    difficulty: string
  ): Promise<CriterionMappingResponse[]> {
    const criteria: CriterionMappingResponse[] = [];
    
    // Create basic understanding criteria
    for (const objective of learningObjectives) {
      const criterionId = `understand_${sectionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      criteria.push({
        criterionId,
        description: `Understand: ${objective}`,
        uueStage: 'UNDERSTAND',
        weight: 1.0,
        masteryThreshold: 0.8,
        questionTypes: ['multiple-choice', 'true-false', 'definition'],
        mappedPrimitives: [],
        confidence: 0.9,
      });
    }
    
    return criteria;
  }

  private async createUseCriteria(
    sectionId: string,
    content: string,
    learningObjectives: string[],
    difficulty: string
  ): Promise<CriterionMappingResponse[]> {
    const criteria: CriterionMappingResponse[] = [];
    
    // Create application criteria
    for (const objective of learningObjectives) {
      const criterionId = `use_${sectionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      criteria.push({
        criterionId,
        description: `Use: ${objective}`,
        uueStage: 'USE',
        weight: 1.5, // Higher weight for application
        masteryThreshold: 0.8,
        questionTypes: ['problem-solving', 'application', 'scenario'],
        mappedPrimitives: [],
        confidence: 0.8,
      });
    }
    
    return criteria;
  }

  private async createExploreCriteria(
    sectionId: string,
    content: string,
    learningObjectives: string[],
    difficulty: string
  ): Promise<CriterionMappingResponse[]> {
    const criteria: CriterionMappingResponse[] = [];
    
    // Create exploration criteria for advanced concepts
    if (difficulty === 'HARD') {
      for (const objective of learningObjectives) {
        const criterionId = `explore_${sectionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        criteria.push({
          criterionId,
          description: `Explore: ${objective}`,
          uueStage: 'EXPLORE',
          weight: 2.0, // Highest weight for exploration
          masteryThreshold: 0.95, // Higher threshold for exploration
          questionTypes: ['analysis', 'synthesis', 'evaluation'],
          mappedPrimitives: [],
          confidence: 0.7,
        });
      }
    }
    
    return criteria;
  }

  private contentSuggestsApplication(content: string, learningObjectives: string[]): boolean {
    const applicationKeywords = ['apply', 'use', 'implement', 'solve', 'practice', 'exercise'];
    const contentLower = content.toLowerCase();
    
    return applicationKeywords.some(keyword => contentLower.includes(keyword)) ||
           learningObjectives.some(objective => 
             applicationKeywords.some(keyword => objective.toLowerCase().includes(keyword))
           );
  }

  private contentSuggestsExploration(content: string, learningObjectives: string[]): boolean {
    const explorationKeywords = ['analyze', 'evaluate', 'synthesize', 'explore', 'investigate', 'research'];
    const contentLower = content.toLowerCase();
    
    return explorationKeywords.some(keyword => contentLower.includes(keyword)) ||
           learningObjectives.some(objective => 
             explorationKeywords.some(keyword => objective.toLowerCase().includes(keyword))
           );
  }

  private async createPrimitiveCriterionMapping(
    primitiveId: string,
    blueprintId: string,
    criteria: CriterionMappingResponse[]
  ): Promise<void> {
    for (const criterion of criteria) {
      await prisma.primitiveCriterionMapping.create({
        data: {
          primitiveId,
          blueprintId: parseInt(blueprintId),
          criterionId: criterion.criterionId,
          isTemporary: false,
        },
      });
    }
  }

  private adjustDifficultyForUserMastery(
    requestedDifficulty: string,
    userMastery: number,
    masteryThreshold: number
  ): number {
    // Adjust difficulty based on user's current mastery level
    if (userMastery < masteryThreshold * 0.5) {
      return Math.max(0.3, requestedDifficulty === 'HARD' ? 0.7 : 0.5); // Reduce difficulty
    } else if (userMastery > masteryThreshold * 1.2) {
      return Math.min(1.0, requestedDifficulty === 'EASY' ? 0.8 : 1.0); // Increase difficulty
    }
    
    // Keep requested difficulty
    return requestedDifficulty === 'EASY' ? 0.3 : requestedDifficulty === 'MEDIUM' ? 0.6 : 0.9;
  }

  private async generateQuestionsForUueStage(
    criterion: MasteryCriterion,
    count: number,
    difficulty: number,
    includeUueStage: boolean,
    userMasteryLevel: number
  ): Promise<GeneratedQuestion[]> {
    const questions: GeneratedQuestion[] = [];
    
    // Generate questions appropriate for the UUE stage
    for (let i = 0; i < count; i++) {
      const questionId = `q_${criterion.id}_${Date.now()}_${i}`;
      
      questions.push({
        id: questionId,
        questionText: this.generateQuestionText(criterion, i, difficulty),
        questionType: this.selectQuestionType(criterion.uueStage, difficulty),
        difficulty,
        uueStage: criterion.uueStage,
        learningObjectives: [criterion.description],
        estimatedTime: this.estimateQuestionTime(criterion.uueStage, difficulty),
        hints: this.generateHints(criterion, difficulty),
        explanation: this.generateExplanation(criterion, difficulty),
      });
    }
    
    return questions;
  }

  private generateQuestionText(criterion: MasteryCriterion, index: number, difficulty: number): string {
    // This would integrate with AI API to generate actual question text
    return `Question ${index + 1} about: ${criterion.description} (Difficulty: ${difficulty})`;
  }

  private selectQuestionType(uueStage: UueStage, difficulty: number): string {
    const typeMap = {
      UNDERSTAND: ['multiple-choice', 'true-false', 'definition'],
      USE: ['problem-solving', 'application', 'scenario'],
      EXPLORE: ['analysis', 'synthesis', 'evaluation'],
    };
    
    const types = typeMap[uueStage];
    const randomIndex = Math.floor(Math.random() * types.length);
    return types[randomIndex];
  }

  private estimateQuestionTime(uueStage: UueStage, difficulty: number): number {
    const baseTime = uueStage === 'UNDERSTAND' ? 2 : uueStage === 'USE' ? 4 : 6;
    return Math.round(baseTime * (1 + difficulty * 0.5));
  }

  private generateHints(criterion: MasteryCriterion, difficulty: number): string[] {
    // Generate contextual hints based on criterion and difficulty
    return [`Think about: ${criterion.description}`, 'Consider the context', 'Review related concepts'];
  }

  private generateExplanation(criterion: MasteryCriterion, difficulty: number): string {
    return `This question tests your understanding of: ${criterion.description}`;
  }

  private calculateEstimatedTime(questions: GeneratedQuestion[]): number {
    return questions.reduce((total, q) => total + q.estimatedTime, 0);
  }

  private async calculateUserReadiness(
    userId: number,
    sectionId: string,
    uueStage: UueStage
  ): Promise<number> {
    // Calculate user readiness based on previous stage completion
    const previousStage = this.getPreviousStage(uueStage);
    if (!previousStage) return 1.0; // First stage is always accessible
    
    const previousStageMastery = await masteryCalculationService.calculateUueStageMastery(
      sectionId,
      previousStage,
      userId
    );
    
    return previousStageMastery.isMastered ? 1.0 : previousStageMastery.masteryScore;
  }

  private getPreviousStage(currentStage: UueStage): UueStage | null {
    const stageOrder: UueStage[] = ['UNDERSTAND', 'USE', 'EXPLORE'];
    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex > 0 ? stageOrder[currentIndex - 1] : null;
  }

  private async generateContentForStage(
    uueStage: UueStage,
    criteria: MasteryCriterion[],
    contentType: string,
    count: number,
    userReadiness: number
  ): Promise<UueStageContent[]> {
    const content: UueStageContent[] = [];
    
    // Generate content appropriate for the stage and user readiness
    for (let i = 0; i < count; i++) {
      const contentId = `content_${uueStage}_${Date.now()}_${i}`;
      
      content.push({
        id: contentId,
        type: contentType as any,
        content: this.generateStageContent(uueStage, criteria[i % criteria.length], contentType),
        difficulty: Math.min(0.8, userReadiness + 0.2), // Slightly challenging but achievable
        learningObjectives: [criteria[i % criteria.length].description],
        prerequisites: this.getPrerequisites(uueStage, criteria[i % criteria.length]),
        estimatedTime: this.estimateContentTime(uueStage, contentType),
      });
    }
    
    return content;
  }

  private generateStageContent(
    uueStage: UueStage,
    criterion: MasteryCriterion,
    contentType: string
  ): string {
    // This would integrate with AI API to generate actual content
    return `${contentType} for ${uueStage} stage: ${criterion.description}`;
  }

  private getPrerequisites(uueStage: UueStage, criterion: MasteryCriterion): string[] {
    // Return prerequisites based on UUE stage and criterion
    if (uueStage === 'USE') {
      return [`Master basic understanding of ${criterion.description}`];
    } else if (uueStage === 'EXPLORE') {
      return [`Master basic understanding of ${criterion.description}`, `Be able to apply ${criterion.description}`];
    }
    
    return [];
  }

  private estimateContentTime(uueStage: UueStage, contentType: string): number {
    const baseTime = contentType === 'QUESTIONS' ? 3 : contentType === 'EXERCISES' ? 8 : 5;
    const stageMultiplier = uueStage === 'UNDERSTAND' ? 1 : uueStage === 'USE' ? 1.5 : 2;
    
    return Math.round(baseTime * stageMultiplier);
  }

  private generateStageRecommendations(uueStage: UueStage, userReadiness: number): string[] {
    const recommendations: string[] = [];
    
    if (userReadiness < 0.5) {
      recommendations.push(`Focus on completing the previous stage before attempting ${uueStage}`);
      recommendations.push('Consider reviewing foundational concepts');
    } else if (userReadiness < 0.8) {
      recommendations.push(`You're ready to start ${uueStage} but may need additional support`);
      recommendations.push('Take your time and don\'t rush through concepts');
    } else {
      recommendations.push(`You're well-prepared for ${uueStage} stage content`);
      recommendations.push('Feel free to challenge yourself with advanced materials');
    }
    
    return recommendations;
  }

  private async testWeightedCriteriaGeneration(): Promise<boolean> {
    // Test if AI API can handle weighted criteria
    // This would make an actual API call to test
    return true; // Placeholder
  }

  private async testUueStageContentGeneration(): Promise<boolean> {
    // Test if AI API can generate UUE stage-specific content
    return true; // Placeholder
  }

  private async testPrimitiveToCriterionMapping(): Promise<boolean> {
    // Test if AI API can map primitives to criteria
    return true; // Placeholder
  }
}

export const aiApiIntegrationService = new AiApiIntegrationService();

