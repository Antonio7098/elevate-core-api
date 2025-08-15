// Sprint 53: AI Integration & Advanced Features Test Suite
// Tests for AI Blueprint Generator and Learning Pathways services

import { AIBlueprintGeneratorService } from '../services/aiBlueprintGenerator.service';
import { LearningPathwaysService } from '../services/learningPathways.service';
import { 
  GenerationStyle,
  GenerationFocus,
  GenerationDifficulty,
  NoteFormat,
  GenerationInstructions
} from '../types/aiGeneration.types';
import { PathwayDifficulty, MasteryLevel } from '../types/learningPathways.types';

describe('Sprint 53: AI Integration & Advanced Features', () => {
  let aiBlueprintGenerator: AIBlueprintGeneratorService;
  let learningPathways: LearningPathwaysService;

  beforeAll(() => {
    aiBlueprintGenerator = new AIBlueprintGeneratorService();
    learningPathways = new LearningPathwaysService();
  });

  describe('AI Blueprint Generator Service', () => {
    const sampleContent = `
      Photosynthesis is the process by which plants convert light energy into chemical energy.
      This process occurs in the chloroplasts of plant cells and involves several key steps:
      1. Light absorption by chlorophyll
      2. Water splitting and oxygen release
      3. Carbon dioxide fixation
      4. Glucose production
      
      The overall equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2
      
      Factors affecting photosynthesis include:
      - Light intensity
      - Carbon dioxide concentration
      - Temperature
      - Water availability
    `;

    const sampleInstructions: GenerationInstructions = {
      style: GenerationStyle.THOROUGH,
      focus: GenerationFocus.UNDERSTAND,
      difficulty: GenerationDifficulty.INTERMEDIATE,
      targetAudience: 'high school biology students',
      customPrompts: ['Include practical examples', 'Focus on environmental factors'],
      includeExamples: true,
      noteFormat: NoteFormat.BULLET
    };

    test('should generate blueprint from content with instructions', async () => {
      const request = {
        content: sampleContent,
        instructions: sampleInstructions,
        userId: 'test-user-123'
      };

      const result = await aiBlueprintGenerator.generateFromContent(request);

      expect(result).toBeDefined();
      expect(result.blueprint).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.primitives).toBeDefined();
      expect(result.questionFamilies).toBeDefined();
      expect(result.generationMetadata).toBeDefined();

      // Validate blueprint structure
      expect(result.blueprint.id).toMatch(/^bp_\d+_[a-z0-9]+$/);
      expect(result.blueprint.name).toContain('Photosynthesis');
      expect(result.blueprint.difficulty).toBe(GenerationDifficulty.INTERMEDIATE);
      expect(result.blueprint.learningObjectives.length).toBeGreaterThan(0);

      // Validate sections
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.sections[0].blueprintId).toBe(result.blueprint.id);
      expect(result.sections[0].order).toBe(1);

      // Validate primitives
      expect(result.primitives.length).toBeGreaterThan(0);
      expect(result.primitives[0].sectionId).toBe(result.sections[0].id);

      // Validate question families
      expect(result.questionFamilies.length).toBeGreaterThan(0);
      expect(result.questionFamilies[0].masteryCriterionId).toBeDefined();

      // Validate metadata
      expect(result.generationMetadata.processingTime).toBeGreaterThan(0);
      expect(result.generationMetadata.modelUsed).toBeDefined();
      expect(result.generationMetadata.confidence).toBeGreaterThan(0);
    });

    test('should handle different generation styles', async () => {
      const conciseInstructions: GenerationInstructions = {
        ...sampleInstructions,
        style: GenerationStyle.CONCISE
      };

      const explorativeInstructions: GenerationInstructions = {
        ...sampleInstructions,
        style: GenerationStyle.EXPLORATIVE
      };

      const conciseResult = await aiBlueprintGenerator.generateFromContent({
        content: sampleContent,
        instructions: conciseInstructions,
        userId: 'test-user-123'
      });

      const explorativeResult = await aiBlueprintGenerator.generateFromContent({
        content: sampleContent,
        instructions: explorativeInstructions,
        userId: 'test-user-123'
      });

      expect(conciseResult.blueprint.name).toBeDefined();
      expect(explorativeResult.blueprint.name).toBeDefined();
    });

    test('should handle different difficulty levels', async () => {
      const beginnerInstructions: GenerationInstructions = {
        ...sampleInstructions,
        difficulty: GenerationDifficulty.BEGINNER
      };

      const advancedInstructions: GenerationInstructions = {
        ...sampleInstructions,
        difficulty: GenerationDifficulty.ADVANCED
      };

      const beginnerResult = await aiBlueprintGenerator.generateFromContent({
        content: sampleContent,
        instructions: beginnerInstructions,
        userId: 'test-user-123'
      });

      const advancedResult = await aiBlueprintGenerator.generateFromContent({
        content: sampleContent,
        instructions: advancedInstructions,
        userId: 'test-user-123'
      });

      expect(beginnerResult.blueprint.difficulty).toBe(GenerationDifficulty.BEGINNER);
      expect(advancedResult.blueprint.difficulty).toBe(GenerationDifficulty.ADVANCED);
    });

    test('should handle different focus areas', async () => {
      const useInstructions: GenerationInstructions = {
        ...sampleInstructions,
        focus: GenerationFocus.USE
      };

      const exploreInstructions: GenerationInstructions = {
        ...sampleInstructions,
        focus: GenerationFocus.EXPLORE
      };

      const useResult = await aiBlueprintGenerator.generateFromContent({
        content: sampleContent,
        instructions: useInstructions,
        userId: 'test-user-123'
      });

      const exploreResult = await aiBlueprintGenerator.generateFromContent({
        content: sampleContent,
        instructions: exploreInstructions,
        userId: 'test-user-123'
      });

      expect(useResult.blueprint).toBeDefined();
      expect(exploreResult.blueprint).toBeDefined();
    });
  });

  describe('Learning Pathways Service', () => {
    test('should create learning pathway', async () => {
      const pathwayRequest = {
        name: 'Photosynthesis Mastery Path',
        description: 'Complete learning path for understanding photosynthesis',
        startPrimitiveId: 'prim_001',
        endPrimitiveId: 'prim_005',
        difficulty: PathwayDifficulty.INTERMEDIATE,
        estimatedTimeMinutes: 120,
        userId: 'test-user-123',
        tags: ['biology', 'photosynthesis', 'science'],
        learningObjectives: ['Understand photosynthesis process', 'Apply knowledge to real scenarios']
      };

      const pathway = await learningPathways.createPathway(pathwayRequest);

      expect(pathway).toBeDefined();
      expect(pathway.id).toMatch(/^path_\d+_[a-z0-9]+$/);
      expect(pathway.name).toBe(pathwayRequest.name);
      expect(pathway.difficulty).toBe(pathwayRequest.difficulty);
      expect(pathway.userId).toBe(pathwayRequest.userId);
      expect(pathway.status).toBe('not_started');
      expect(pathway.progress.completedSteps).toBe(0);
    });

    test('should add steps to pathway', async () => {
      const pathwayId = 'test-pathway-steps-456';
      const steps = [
        {
          primitiveId: 'prim_001',
          order: 1,
          masteryLevel: MasteryLevel.UNDERSTAND,
          estimatedTimeMinutes: 30,
          prerequisites: [],
          learningObjectives: ['Understand basic concepts']
        },
        {
          primitiveId: 'prim_002',
          order: 2,
          masteryLevel: MasteryLevel.USE,
          estimatedTimeMinutes: 45,
          prerequisites: ['prim_001'],
          learningObjectives: ['Apply concepts practically']
        }
      ];

      const updatedPathway = await learningPathways.addPathwaySteps(
        pathwayId,
        steps,
        'test-user-123'
      );

      expect(updatedPathway).toBeDefined();
      expect(updatedPathway.steps.length).toBe(2);
      expect(updatedPathway.progress.totalSteps).toBe(2);
    });

    test('should discover pathways based on interests', async () => {
      const discoveryRequest = {
        userId: 'test-user-123',
        interests: ['biology', 'environmental science'],
        currentKnowledge: ['basic biology', 'chemistry fundamentals'],
        targetSkills: ['scientific analysis', 'critical thinking'],
        timeAvailable: 180,
        difficulty: PathwayDifficulty.INTERMEDIATE
      };

      const recommendations = await learningPathways.discoverPathways(discoveryRequest);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      if (recommendations.length > 0) {
        expect(recommendations[0].pathway).toBeDefined();
        expect(recommendations[0].relevanceScore).toBeGreaterThan(0);
        expect(recommendations[0].confidence).toBeGreaterThan(0);
      }
    });

    test('should get pathway visualization data', async () => {
      const pathwayId = 'test-pathway-123';
      const userId = 'test-user-123';

      const visualization = await learningPathways.getPathwayVisualization(pathwayId, userId);

      expect(visualization).toBeDefined();
      expect(visualization.nodes).toBeDefined();
      expect(visualization.edges).toBeDefined();
      expect(visualization.metadata).toBeDefined();
      expect(visualization.metadata.totalSteps).toBeGreaterThanOrEqual(0);
    });

    test('should get pathway analytics', async () => {
      const pathwayId = 'test-pathway-123';
      const userId = 'test-user-123';

      const analytics = await learningPathways.getPathwayAnalytics(pathwayId, userId);

      expect(analytics).toBeDefined();
      expect(analytics.pathwayId).toBe(pathwayId);
      expect(analytics.userId).toBe(userId);
      expect(analytics.overallProgress).toBeGreaterThanOrEqual(0);
      expect(analytics.overallProgress).toBeLessThanOrEqual(100);
      expect(analytics.timeSpent).toBeGreaterThanOrEqual(0);
      expect(analytics.learningEfficiency).toBeDefined();
    });

    test('should update pathway progress', async () => {
      const progressUpdate = {
        pathwayId: 'test-pathway-123',
        stepId: 'step_001',
        userId: 'test-user-123',
        action: 'completed' as const,
        timestamp: new Date(),
        metadata: {
          timeSpent: 25,
          questionsAnswered: 3,
          notesReviewed: 2,
          difficulty: 'medium'
        }
      };

      // This should not throw an error
      await expect(
        learningPathways.updateProgress(progressUpdate)
      ).resolves.not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should generate blueprint and create pathways', async () => {
      const content = 'Basic introduction to machine learning concepts';
      const instructions: GenerationInstructions = {
        style: GenerationStyle.THOROUGH,
        focus: GenerationFocus.UNDERSTAND,
        difficulty: GenerationDifficulty.BEGINNER,
        targetAudience: 'computer science beginners',
        customPrompts: ['Focus on practical applications'],
        includeExamples: true,
        noteFormat: NoteFormat.BULLET
      };

      // Generate blueprint
      const blueprintResult = await aiBlueprintGenerator.generateFromContent({
        content,
        instructions,
        userId: 'test-user-123'
      });

      expect(blueprintResult.blueprint).toBeDefined();

      // Create pathway for the generated blueprint
      const pathwayRequest = {
        name: `${blueprintResult.blueprint.name} Learning Path`,
        description: blueprintResult.blueprint.description,
        startPrimitiveId: blueprintResult.primitives[0]?.id || 'prim_001',
        endPrimitiveId: blueprintResult.primitives[blueprintResult.primitives.length - 1]?.id || 'prim_002',
        difficulty: PathwayDifficulty.BEGINNER,
        estimatedTimeMinutes: blueprintResult.blueprint.estimatedTimeMinutes,
        userId: 'test-user-123',
        tags: blueprintResult.blueprint.tags,
        learningObjectives: blueprintResult.blueprint.learningObjectives
      };

      const pathway = await learningPathways.createPathway(pathwayRequest);

      expect(pathway).toBeDefined();
      expect(pathway.name).toContain(blueprintResult.blueprint.name);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid generation instructions', async () => {
      const invalidInstructions = {
        style: 'invalid-style',
        focus: 'invalid-focus',
        difficulty: 'invalid-difficulty',
        targetAudience: '',
        customPrompts: 'not-an-array',
        includeExamples: 'not-a-boolean',
        noteFormat: 'invalid-format'
      };

      await expect(
        aiBlueprintGenerator.generateFromContent({
          content: 'Test content',
          instructions: invalidInstructions as any,
          userId: 'test-user-123'
        })
      ).rejects.toThrow();
    });

    test('should handle missing pathway data', async () => {
      await expect(
        learningPathways.getPathway('non-existent-pathway', 'test-user-123')
      ).resolves.toBeNull();
    });
  });

  describe('Performance Tests', () => {
    test('should generate blueprint within reasonable time', async () => {
      const startTime = Date.now();
      
      await aiBlueprintGenerator.generateFromContent({
        content: 'Simple test content for performance testing',
        instructions: {
          style: GenerationStyle.CONCISE,
          focus: GenerationFocus.UNDERSTAND,
          difficulty: GenerationDifficulty.BEGINNER,
          targetAudience: 'test',
          customPrompts: [],
          includeExamples: false,
          noteFormat: NoteFormat.BULLET
        },
        userId: 'test-user-123'
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within 10 seconds (adjust based on expected performance)
      expect(processingTime).toBeLessThan(10000);
    });
  });
});

