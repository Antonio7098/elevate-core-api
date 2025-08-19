import { Request, Response } from 'express';
import MasteryCriterionService from '../../services/blueprint-centric/masteryCriterion.service';
import BlueprintCentricService from '../../services/blueprint-centric/blueprintCentric.service';
import { MasteryThreshold, UueStage, getMasteryStats, updateMasteryScore } from '../../services/mastery/masteryTracking.service';
import { MasteryCalculationService } from '../../services/mastery/masteryCalculation.service';
import { enhancedSpacedRepetitionService } from '../../services/mastery/enhancedSpacedRepetition.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const masteryCalculationService = new MasteryCalculationService();
const masteryCriterionService = new MasteryCriterionService();
const blueprintCentricService = new BlueprintCentricService();

// ============================================================================
// MASTERY CRITERION CONTROLLER
// ============================================================================
// 🆕 NEW ARCHITECTURE - Uses criterion-based logic instead of primitive-based
// ============================================================================

export class MasteryCriterionController {
  
  /**
   * POST /api/mastery-criterion
   * Create a new mastery criterion
   */
  async createCriterion(req: Request, res: Response) {
    try {
      const { 
        blueprintSectionId, 
        uueStage, 
        weight, 
        masteryThreshold, 
        description, 
        questionTypes,
        complexityScore,
        assessmentType,
        timeLimit,
        attemptsAllowed
      } = req.body;

      if (!blueprintSectionId || !uueStage || !description) {
        return res.status(400).json({ 
          error: 'Missing required fields: blueprintSectionId, uueStage, description' 
        });
      }

      // Validate UUE stage
      const validStages = ['UNDERSTAND', 'USE', 'EXPLORE'];
      if (!validStages.includes(uueStage)) {
        return res.status(400).json({
          error: 'Invalid UUE stage. Must be one of: UNDERSTAND, USE, EXPLORE'
        });
      }

      const criterion = await masteryCriterionService.createCriterion({
        title: description, // Use description as title since interface requires it
        description,
        weight: weight || 1.0,
        uueStage,
        assessmentType: 'QUESTION_BASED', // Default assessment type
        masteryThreshold: masteryThreshold || 0.8,
        knowledgePrimitiveId: `primitive_${Date.now()}`, // Generate placeholder ID
        blueprintSectionId: blueprintSectionId.toString(), // Convert to string as expected by service
        userId: (req as any).user?.userId || 1
      });

      res.status(201).json({
        success: true,
        data: criterion
      });
    } catch (error) {
      console.error('Error creating mastery criterion:', error);
      res.status(500).json({ error: 'Failed to create mastery criterion' });
    }
  }

  /**
   * GET /api/mastery-criterion/:id
   * Get a mastery criterion by ID
   */
  async getCriterion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Criterion ID is required' });
      }
      
      const criterion = await masteryCriterionService.getCriterion(id);
      if (!criterion) {
        return res.status(404).json({ error: 'Criterion not found' });
      }
      
      res.json({ success: true, data: criterion });
    } catch (error) {
      console.error('Error getting criterion:', error);
      res.status(500).json({ error: 'Failed to get criterion' });
    }
  }

  /**
   * PUT /api/mastery-criterion/:id
   * Update a mastery criterion
   */
  async updateCriterion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Criterion ID is required' });
      }
      
      const updateData = req.body;
      const criterion = await masteryCriterionService.updateCriterion(id, updateData);
      
      res.json({ success: true, data: criterion });
    } catch (error) {
      console.error('Error updating criterion:', error);
      res.status(500).json({ error: 'Failed to update criterion' });
    }
  }

  /**
   * DELETE /api/mastery-criterion/:id
   * Delete a mastery criterion
   */
  async deleteCriterion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Criterion ID is required' });
      }
      
      await masteryCriterionService.deleteCriterion(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting criterion:', error);
      res.status(500).json({ error: 'Failed to delete criterion' });
    }
  }

  /**
   * GET /api/mastery-criterion/section/:sectionId
   * Get criteria by section
   */
  async getCriteriaBySection(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      if (!sectionId) {
        return res.status(400).json({ error: 'Section ID is required' });
      }
      
      // Use the available method from the main service
      const criteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, 'UNDERSTAND' as any);
      res.json({ success: true, data: criteria });
    } catch (error) {
      console.error('Error getting criteria by section:', error);
      res.status(500).json({ error: 'Failed to get criteria by section' });
    }
  }

  /**
   * GET /api/mastery-criterion/stage/:stage
   * Get criteria by UUE stage
   */
  async getCriteriaByUueStage(req: Request, res: Response) {
    try {
      const { stage } = req.params;
      if (!stage) {
        return res.status(400).json({ error: 'UUE stage is required' });
      }
      
      // Use the available method from the main service
      const criteria = await masteryCriterionService.getCriteriaByUueStage("1", stage as any); // Use sectionId "1" as default
      res.json({ success: true, data: criteria });
    } catch (error) {
      console.error('Error getting criteria by stage:', error);
      res.status(500).json({ error: 'Failed to get criteria by stage' });
    }
  }

  /**
   * POST /api/mastery-criterion/:id/review
   * Process a criterion review
   */
  async processCriterionReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId, isCorrect, confidence } = req.body;
      if (!criterionId || isCorrect === undefined) {
        return res.status(400).json({ error: 'Missing required fields: criterionId, isCorrect' });
      }

      // Use the available method from the enhanced spaced repetition service
      const result = await enhancedSpacedRepetitionService.processReviewOutcome({
        userId,
        criterionId,
        isCorrect,
        confidence: confidence || 0.5,
        timeSpentSeconds: 0,
        timestamp: new Date()
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error processing criterion review:', error);
      res.status(500).json({ error: 'Failed to process criterion review' });
    }
  }

  /**
   * GET /api/mastery-criterion/:id/progress
   * Get mastery progress for a criterion
   */
  async getCriterionMasteryProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;
      if (!criterionId) {
        return res.status(400).json({ error: 'Criterion ID is required' });
      }
      
      // Use the available method from the main service
      const progress = await masteryCriterionService.calculateCriterionMastery(criterionId, userId);
      
      if (!progress) {
        return res.status(404).json({ error: 'Mastery progress not found' });
      }
      
      res.json({ success: true, data: progress });
    } catch (error) {
      console.error('Error getting mastery progress:', error);
      res.status(500).json({ error: 'Failed to get mastery progress' });
    }
  }

  /**
   * PUT /api/mastery-criterion/:id/threshold
   * Update mastery threshold for a criterion
   */
  async updateMasteryThreshold(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;
      const { newThreshold } = req.body;
      
      if (!criterionId || !newThreshold) {
        return res.status(400).json({ error: 'Missing required fields: criterionId, newThreshold' });
      }

      // Use the available method from the enhanced spaced repetition service
      const result = await enhancedSpacedRepetitionService.processReviewOutcome({
        userId,
        criterionId,
        isCorrect: false, // No score change, just threshold update
        confidence: 0.0,
        timeSpentSeconds: 0,
        timestamp: new Date()
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error updating mastery threshold:', error);
      res.status(500).json({ error: 'Failed to update mastery threshold' });
    }
  }

  /**
   * GET /api/mastery-criterion/section/:sectionId/progress
   * Get UUE stage progress for a section
   */
  async getSectionUueProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { sectionId } = req.params;
      if (!sectionId) {
        return res.status(400).json({ error: 'Section ID is required' });
      }
      
      // Use the available method from the main service - get criteria for all stages
      const understandCriteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, 'UNDERSTAND' as any);
      const useCriteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, 'USE' as any);
      const exploreCriteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, 'EXPLORE' as any);
      
      const progress = {
        understand: { total: understandCriteria.length, mastered: 0, progress: 0 },
        use: { total: useCriteria.length, mastered: 0, progress: 0 },
        explore: { total: exploreCriteria.length, mastered: 0, progress: 0 }
      };
      
      res.json({ success: true, data: progress });
    } catch (error) {
      console.error('Error getting section UUE progress:', error);
      res.status(500).json({ error: 'Failed to get section UUE progress' });
    }
  }

  /**
   * GET /api/mastery-criterion/user/:userId/stats
   * Get mastery statistics for a user
   */
  async getUserMasteryStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Use the available method from the main service - get criteria for all stages
      const understandCriteria = await masteryCriterionService.getCriteriaByUueStage("1", 'UNDERSTAND' as any);
      const useCriteria = await masteryCriterionService.getCriteriaByUueStage("1", 'USE' as any);
      const exploreCriteria = await masteryCriterionService.getCriteriaByUueStage("1", 'EXPLORE' as any);
      
      const stats = {
        totalCriteria: understandCriteria.length + useCriteria.length + exploreCriteria.length,
        masteredCriteria: 0, // Would need to calculate this from user mastery data
        averageMasteryScore: 0,
        stageBreakdown: {
          understand: understandCriteria.length,
          use: useCriteria.length,
          explore: exploreCriteria.length
        }
      };
      
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error getting user mastery stats:', error);
      res.status(500).json({ error: 'Failed to get user mastery stats' });
    }
  }

  /**
   * GET /api/mastery-criterion/user/:userId/recommendations
   * Get personalized mastery recommendations for a user
   */
  async getUserMasteryRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { limit = 10, focus = 'all' } = req.query;

      // Get user's current mastery state
      const stats = await getMasteryStats(userId);
      
      // Generate personalized recommendations
      const recommendations = this.generatePersonalizedRecommendations(stats, focus as string);

      res.json({
        success: true,
        data: {
          userId,
          recommendations: recommendations.slice(0, parseInt(limit as string)),
          totalRecommendations: recommendations.length,
          focusArea: focus,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating mastery recommendations:', error);
      res.status(500).json({ error: 'Failed to generate mastery recommendations' });
    }
  }

  /**
   * POST /api/mastery-criterion/batch-review
   * Process multiple criterion reviews in batch
   */
  async processBatchReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { reviews } = req.body;

      if (!Array.isArray(reviews) || reviews.length === 0) {
        return res.status(400).json({ error: 'Reviews array is required and must not be empty' });
      }

      const results = [];
      const errors = [];

      // Process each review
      for (const review of reviews) {
        try {
          const result = await updateMasteryScore(
            userId,
            review.criterionId,
            review.performance || 0.8,
            review.isCorrect
          );
          results.push({ ...result, criterionId: review.criterionId });
        } catch (error) {
          errors.push({ criterionId: review.criterionId, error: error.message });
        }
      }

      res.json({
        success: true,
        data: {
          processed: results.length,
          errors: errors.length,
          results,
          errorDetails: errors,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error processing batch review:', error);
      res.status(500).json({ error: 'Failed to process batch review' });
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate mastery level based on score
   */
  private calculateMasteryLevel(score: number): string {
    if (score >= 0.9) return 'EXPERT';
    if (score >= 0.8) return 'PROFICIENT';
    if (score >= 0.6) return 'COMPETENT';
    if (score >= 0.4) return 'LEARNING';
    return 'BEGINNER';
  }

  /**
   * Calculate next review date based on mastery score
   */
  private calculateNextReviewDate(lastReviewDate: Date, masteryScore: number): Date {
    const now = new Date();
    const lastReview = lastReviewDate ? new Date(lastReviewDate) : now;
    
    // Spaced repetition algorithm: longer intervals for higher mastery
    let daysToAdd = 1;
    if (masteryScore >= 0.9) daysToAdd = 30;
    else if (masteryScore >= 0.8) daysToAdd = 14;
    else if (masteryScore >= 0.6) daysToAdd = 7;
    else if (masteryScore >= 0.4) daysToAdd = 3;
    
    const nextReview = new Date(lastReview);
    nextReview.setDate(nextReview.getDate() + daysToAdd);
    
    return nextReview;
  }

  /**
   * Calculate section mastery statistics
   */
  private calculateSectionMasteryStats(criteria: any[]): any {
    if (criteria.length === 0) return {};

    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 1), 0);
    const weightedScore = criteria.reduce((sum, c) => sum + (c.masteryScore || 0) * (c.weight || 1), 0);
    
    return {
      totalCriteria: criteria.length,
      averageWeight: totalWeight / criteria.length,
      weightedMasteryScore: weightedScore / totalWeight,
      masteryDistribution: this.getMasteryDistribution(criteria),
      complexityScore: criteria.reduce((sum, c) => sum + (c.complexityScore || 5), 0) / criteria.length
    };
  }

  /**
   * Calculate stage mastery statistics
   */
  private calculateStageMasteryStats(criteria: any[]): any {
    if (criteria.length === 0) return {};

    return {
      criteriaCount: criteria.length,
      averageComplexity: criteria.reduce((sum, c) => sum + (c.complexityScore || 5), 0) / criteria.length,
      masteryDistribution: this.getMasteryDistribution(criteria),
      sectionCoverage: this.getSectionDistribution(criteria)
    };
  }

  /**
   * Get UUE stage distribution
   */
  private getUueStageDistribution(criteria: any[]): any {
    const distribution = { UNDERSTAND: 0, USE: 0, EXPLORE: 0 };
    criteria.forEach(c => {
      if (distribution[c.uueStage]) {
        distribution[c.uueStage]++;
      }
    });
    return distribution;
  }

  /**
   * Get complexity distribution
   */
  private getComplexityDistribution(criteria: any[]): any {
    const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    criteria.forEach(c => {
      const complexity = c.complexityScore || 5;
      if (complexity <= 3) distribution.LOW++;
      else if (complexity <= 7) distribution.MEDIUM++;
      else distribution.HIGH++;
    });
    return distribution;
  }

  /**
   * Get section distribution
   */
  private getSectionDistribution(criteria: any[]): any {
    const distribution: { [key: string]: number } = {};
    criteria.forEach(c => {
      const sectionId = c.blueprintSectionId;
      distribution[sectionId] = (distribution[sectionId] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get mastery distribution
   */
  private getMasteryDistribution(criteria: any[]): any {
    const distribution = { BEGINNER: 0, LEARNING: 0, COMPETENT: 0, PROFICIENT: 0, EXPERT: 0 };
    criteria.forEach(c => {
      const level = this.calculateMasteryLevel(c.masteryScore || 0);
      distribution[level]++;
    });
    return distribution;
  }

  /**
   * Generate section recommendations
   */
  private generateSectionRecommendations(stageProgress: any, masteryScore: number): string[] {
    const recommendations = [];
    
    if (masteryScore < 0.6) {
      recommendations.push('Focus on foundational concepts in UNDERSTAND stage');
      recommendations.push('Practice with simpler questions to build confidence');
    } else if (masteryScore < 0.8) {
      recommendations.push('Move to USE stage for practical application');
      recommendations.push('Review challenging concepts before advancing');
    } else {
      recommendations.push('Ready for EXPLORE stage - tackle advanced problems');
      recommendations.push('Consider teaching others to reinforce mastery');
    }
    
    return recommendations;
  }

  /**
   * Calculate user mastery analytics
   */
  private calculateUserMasteryAnalytics(stats: any): any {
    return {
      learningVelocity: this.calculateLearningVelocity(stats),
      strengthAreas: this.identifyStrengthAreas(stats),
      improvementAreas: this.identifyImprovementAreas(stats),
      consistencyScore: this.calculateConsistencyScore(stats)
    };
  }

  /**
   * Generate user mastery summary
   */
  private generateUserMasterySummary(stats: any, analytics: any): any {
    return {
      overallProgress: `${Math.round(stats.overallMastery * 100)}%`,
      learningStage: this.determineLearningStage(stats.overallMastery),
      nextMilestone: this.calculateNextMilestone(stats.overallMastery),
      estimatedTimeToGoal: this.estimateTimeToGoal(stats.overallMastery, analytics.learningVelocity)
    };
  }

  /**
   * Generate personalized recommendations
   */
  private generatePersonalizedRecommendations(stats: any, focus: string): any[] {
    const recommendations = [];
    
    if (focus === 'weakest' || focus === 'all') {
      recommendations.push({
        type: 'REVIEW',
        priority: 'HIGH',
        description: 'Review foundational concepts in UNDERSTAND stage',
        estimatedTime: '15 minutes'
      });
    }
    
    if (focus === 'strongest' || focus === 'all') {
      recommendations.push({
        type: 'ADVANCE',
        priority: 'MEDIUM',
        description: 'Move to EXPLORE stage for advanced challenges',
        estimatedTime: '20 minutes'
      });
    }
    
    return recommendations;
  }

  // Additional helper methods for analytics
  private calculateLearningVelocity(stats: any): number {
    // Implementation would calculate rate of improvement over time
    return 0.1; // Placeholder
  }

  private identifyStrengthAreas(stats: any): string[] {
    // Implementation would identify user's strongest areas
    return ['Calculus', 'Algebra']; // Placeholder
  }

  private identifyImprovementAreas(stats: any): string[] {
    // Implementation would identify areas needing improvement
    return ['Geometry', 'Trigonometry']; // Placeholder
  }

  private calculateConsistencyScore(stats: any): number {
    // Implementation would calculate consistency of study habits
    return 0.8; // Placeholder
  }

  private determineLearningStage(mastery: number): string {
    if (mastery >= 0.8) return 'ADVANCED';
    if (mastery >= 0.6) return 'INTERMEDIATE';
    return 'BEGINNER';
  }

  private calculateNextMilestone(mastery: number): string {
    if (mastery < 0.6) return 'Reach 60% mastery (COMPETENT level)';
    if (mastery < 0.8) return 'Reach 80% mastery (PROFICIENT level)';
    return 'Reach 90% mastery (EXPERT level)';
  }

  private estimateTimeToGoal(currentMastery: number, velocity: number): string {
    const targetMastery = 0.9;
    const pointsNeeded = targetMastery - currentMastery;
    const daysEstimated = Math.ceil(pointsNeeded / velocity);
    return `${daysEstimated} days`;
  }

  // ============================================================================
  // MULTI-PRIMITIVE MASTERY CRITERIA ENDPOINTS
  // ============================================================================

  /**
   * POST /api/mastery-criteria/:id/primitives
   * Link a primitive to a mastery criterion
   */
  async linkPrimitiveToCriterion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { primitiveId, relationshipType, weight, strength } = req.body;

      if (!primitiveId) {
        return res.status(400).json({ error: 'Primitive ID is required' });
      }

      const criterionId = parseInt(id);
      if (isNaN(criterionId)) {
        return res.status(400).json({ error: 'Invalid criterion ID' });
      }

      const relationship = await masteryCriterionService.linkPrimitiveToCriterion(
        criterionId,
        primitiveId,
        relationshipType || 'PRIMARY',
        weight || 1.0,
        strength || 0.8
      );

      res.status(201).json({
        success: true,
        data: relationship
      });
    } catch (error) {
      console.error('Error linking primitive to criterion:', error);
      res.status(500).json({ error: 'Failed to link primitive to criterion' });
    }
  }

  /**
   * DELETE /api/mastery-criteria/:id/primitives/:primitiveId
   * Unlink a primitive from a mastery criterion
   */
  async unlinkPrimitiveFromCriterion(req: Request, res: Response) {
    try {
      const { id, primitiveId } = req.params;

      const criterionId = parseInt(id);
      if (isNaN(criterionId)) {
        return res.status(400).json({ error: 'Invalid criterion ID' });
      }

      const success = await masteryCriterionService.unlinkPrimitiveFromCriterion(
        criterionId,
        primitiveId
      );

      if (success) {
        res.json({ success: true, message: 'Primitive unlinked successfully' });
      } else {
        res.status(404).json({ error: 'Primitive relationship not found' });
      }
    } catch (error) {
      console.error('Error unlinking primitive from criterion:', error);
      res.status(500).json({ error: 'Failed to unlink primitive from criterion' });
    }
  }

  /**
   * PUT /api/mastery-criteria/:id/primitives/:primitiveId
   * Update primitive relationship
   */
  async updatePrimitiveRelationship(req: Request, res: Response) {
    try {
      const { id, primitiveId } = req.params;
      const { relationshipType, weight, strength } = req.body;

      const criterionId = parseInt(id);
      if (isNaN(criterionId)) {
        return res.status(400).json({ error: 'Invalid criterion ID' });
      }

      const relationships = [{
        primitiveId,
        relationshipType,
        weight,
        strength
      }];

      const updatedCriterion = await masteryCriterionService.updatePrimitiveRelationships(
        criterionId,
        relationships
      );

      res.json({
        success: true,
        data: updatedCriterion
      });
    } catch (error) {
      console.error('Error updating primitive relationship:', error);
      res.status(500).json({ error: 'Failed to update primitive relationship' });
    }
  }

  /**
   * GET /api/mastery-criteria/:id/primitives
   * Get all primitives linked to a criterion
   */
  async getCriterionPrimitives(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const criterionId = parseInt(id);
      if (isNaN(criterionId)) {
        return res.status(400).json({ error: 'Invalid criterion ID' });
      }

      const criterion = await masteryCriterionService.getCriterionWithPrimitives(criterionId);
      if (!criterion) {
        return res.status(404).json({ error: 'Criterion not found' });
      }

      res.json({
        success: true,
        data: {
          criterionId: criterion.id,
          title: criterion.title,
          primitives: criterion.primitiveRelationships
        }
      });
    } catch (error) {
      console.error('Error getting criterion primitives:', error);
      res.status(500).json({ error: 'Failed to get criterion primitives' });
    }
  }

  /**
   * GET /api/mastery-criteria/:id/relationships
   * Get all relationships for a criterion
   */
  async getCriterionRelationships(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const criterionId = parseInt(id);
      if (isNaN(criterionId)) {
        return res.status(400).json({ error: 'Invalid criterion ID' });
      }

      const criterion = await masteryCriterionService.getCriterionWithPrimitives(criterionId);
      if (!criterion) {
        return res.status(404).json({ error: 'Criterion not found' });
      }

      res.json({
        success: true,
        data: {
          criterionId: criterion.id,
          title: criterion.title,
          relationships: criterion.primitiveRelationships,
          totalRelationships: criterion.primitiveRelationships.length,
          estimatedComplexity: criterion.relationshipComplexity
        }
      });
    } catch (error) {
      console.error('Error getting criterion relationships:', error);
      res.status(500).json({ error: 'Failed to get criterion relationships' });
    }
  }

  /**
   * POST /api/mastery-criteria/validate
   * Validate multi-primitive criterion
   */
  async validateMultiPrimitiveCriterion(req: Request, res: Response) {
    try {
      const { primitives, uueStage } = req.body;

      if (!primitives || !Array.isArray(primitives) || primitives.length === 0) {
        return res.status(400).json({ error: 'Primitives array is required' });
      }

      if (!uueStage || !['UNDERSTAND', 'USE', 'EXPLORE'].includes(uueStage)) {
        return res.status(400).json({ error: 'Valid UUE stage is required' });
      }

      const validationResult = await blueprintCentricService.validatePrimitiveRelationships(
        primitives,
        uueStage
      );

      res.json({
        success: true,
        data: validationResult
      });
    } catch (error) {
      console.error('Error validating multi-primitive criterion:', error);
      res.status(500).json({ error: 'Failed to validate multi-primitive criterion' });
    }
  }

  /**
   * POST /api/mastery-criteria/generate-multi-primitive
   * STUB: AI-powered multi-primitive criteria generation
   */
  async generateMultiPrimitiveCriteria(req: Request, res: Response) {
    try {
      // This is a stub endpoint - will be implemented after AI functionality is available
      res.status(501).json({
        success: false,
        error: 'AI-powered multi-primitive criteria generation not yet implemented',
        message: 'This endpoint will be available in a future sprint when AI functionality is integrated'
      });
    } catch (error) {
      console.error('Error in generateMultiPrimitiveCriteria stub:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Export controller instance
export const masteryCriterionController = new MasteryCriterionController();


