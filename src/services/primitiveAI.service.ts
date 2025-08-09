import axios from 'axios';
import prisma from '../lib/prisma';
import { AIAPIClientService } from './ai-api-client.service';

// TODO: Move to environment variables
const AI_SERVICE_URL = process.env.AI_API_BASE_URL || 'http://localhost:8000';

interface CreatePrimitiveFromSourceDto {
  sourceText: string;
  title?: string;
  description?: string;
  subjectArea?: string;
}

interface GeneratePrimitivesFromBlueprintDto {
  blueprintId: number;
  maxPrimitives?: number;
  focusAreas?: string[];
}

interface AIGeneratedPrimitive {
  title: string;
  description: string;
  subjectArea: string;
  criteria: AIGeneratedCriterion[];
  questions: AIGeneratedQuestion[];
}

interface AIGeneratedCriterion {
  title: string;
  description: string;
  weight: number;
  masteryThreshold: 'SURVEY' | 'PROFICIENT' | 'EXPERT';
}

interface AIGeneratedQuestion {
  text: string;
  questionType: string;
  options: string[];
  answer: string;
  criterionMapping?: string[]; // Maps to criterion titles
  difficulty?: number;
  marksAvailable?: number;
}

/**
 * Primitive-centric AI service for generating knowledge primitives and mastery criteria
 * directly from source text or learning blueprints.
 * 
 * This service replaces the old question set-based AI generation with primitive-focused
 * content creation that integrates with the new spaced repetition system.
 */
export class PrimitiveAIService {
  constructor(private aiApiClient: AIAPIClientService) {}

  /**
   * Create knowledge primitives directly from source text
   * This replaces the old createLearningBlueprint + generateQuestionsFromBlueprint flow
   */
  async createPrimitivesFromSource(
    userId: number,
    dto: CreatePrimitiveFromSourceDto
  ): Promise<{ primitives: any[], blueprint?: any }> {
    const { sourceText, title, description, subjectArea } = dto;

    console.log('=== PRIMITIVE AI: DIRECT PRIMITIVE CREATION STARTED ===');
    console.log(`Calling AI service at ${AI_SERVICE_URL}/api/v1/generate-primitives`);

    let aiResponse: any;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/generate-primitives`, {
        source_text: sourceText,
        title: title,
        description: description,
        subject_area: subjectArea,
        max_primitives: 5, // Default limit
        include_questions: true,
        include_criteria: true
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || 'test_api_key_123'}`,
          'Content-Type': 'application/json'
        }
      });
      
      aiResponse = response.data;
      console.log('✅ AI service /generate-primitives call successful');
    } catch (error: any) {
      console.error('❌ AI service /generate-primitives call failed:');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Failed to generate primitives via AI service.');
    }

    // Create primitives and related data in database transaction
    const createdPrimitives = await prisma.$transaction(async (tx) => {
      const primitives = [];

      for (const aiPrimitive of aiResponse.primitives) {
        // 1. Create the knowledge primitive
        const primitive = await tx.knowledgePrimitive.create({
          data: {
            primitiveId: `primitive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: aiPrimitive.title,
            description: aiPrimitive.description,
            primitiveType: aiPrimitive.primitive_type || 'concept',
            difficultyLevel: aiPrimitive.difficulty_level || 'intermediate',
            estimatedTimeMinutes: aiPrimitive.estimated_time_minutes || 10,
            userId: userId,
            blueprintId: 1, // Default blueprint ID - this should be passed in or created
          }
        });

        // 2. Create mastery criteria for this primitive
        const createdCriteria = [];
        for (const aiCriterion of aiPrimitive.criteria || []) {
          const criterion = await tx.masteryCriterion.create({
            data: {
              criterionId: `criterion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              primitiveId: primitive.primitiveId,
              title: aiCriterion.title,
              description: aiCriterion.description,
              weight: aiCriterion.weight || 1.0,
              ueeLevel: aiCriterion.uee_level || 'UNDERSTAND',
              userId: userId,
            }
          });
          createdCriteria.push(criterion);
        }

        // 3. Create questions linked to criteria
        const createdQuestions = [];
        for (const aiQuestion of aiPrimitive.questions || []) {
          // Find the criterion this question maps to
          let linkedCriterion = null;
          if (aiQuestion.criterionMapping && aiQuestion.criterionMapping.length > 0) {
            // Find criterion by title match
            linkedCriterion = createdCriteria.find(c => 
              aiQuestion.criterionMapping.includes(c.title)
            );
          }
          
          // Create a temporary question set for this primitive if it doesn't exist
          let questionSet = await tx.questionSet.findFirst({
            where: {
              title: `${primitive.title} - Generated Questions`,
              userId: userId
            }
          });
          
          if (!questionSet) {
            questionSet = await tx.questionSet.create({
              data: {
                title: `${primitive.title} - Generated Questions`,
                userId: userId,
                generatedFromBlueprintId: 1, // Default blueprint
                isTracked: true
              }
            });
          }
          
          // Create the question
          const question = await tx.question.create({
            data: {
              questionSetId: questionSet.id,
              questionText: aiQuestion.text,
              answerText: aiQuestion.answer,
              marksAvailable: aiQuestion.marksAvailable || 1,
              criterionId: linkedCriterion?.criterionId || null
            }
          });
          
          createdQuestions.push({
            ...question,
            criterionTitle: linkedCriterion?.title || null
          });
        }

        primitives.push({
          ...primitive,
          criteria: createdCriteria,
          questions: createdQuestions
        });
      }

      return primitives;
    });

    console.log(`✅ Created ${createdPrimitives.length} primitives with criteria and questions`);
    return { primitives: createdPrimitives };
  }

  /**
   * Generate primitives from an existing learning blueprint
   * This refactors the old generateQuestionsFromBlueprint to create primitives instead
   */
  async generatePrimitivesFromBlueprint(
    userId: number,
    dto: GeneratePrimitivesFromBlueprintDto
  ): Promise<{ primitives: any[] }> {
    const { blueprintId, maxPrimitives = 5, focusAreas = [] } = dto;

    // 1. Authorize and fetch the blueprint
    const blueprint = await prisma.learningBlueprint.findFirst({
      where: { id: blueprintId, userId },
    });

    if (!blueprint) {
      throw new Error('Learning Blueprint not found or access denied.');
    }

    console.log('=== PRIMITIVE AI: BLUEPRINT-BASED PRIMITIVE GENERATION STARTED ===');

    let aiResponse: any;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/blueprint-to-primitives`, {
        blueprint_json: blueprint.blueprintJson,
        source_text: blueprint.sourceText,
        max_primitives: maxPrimitives,
        focus_areas: focusAreas,
        include_questions: true,
        include_criteria: true
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || 'test_api_key_123'}`,
          'Content-Type': 'application/json'
        }
      });
      
      aiResponse = response.data;
      console.log('✅ AI service /blueprint-to-primitives call successful');
    } catch (error: any) {
      console.error('❌ AI service /blueprint-to-primitives call failed:');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Failed to generate primitives from blueprint via AI service.');
    }

    // Create primitives in database (similar to createPrimitivesFromSource)
    const createdPrimitives = await prisma.$transaction(async (tx) => {
      const primitives = [];

      for (const aiPrimitive of aiResponse.primitives) {
        // Create primitive
        const primitive = await tx.knowledgePrimitive.create({
          data: {
            primitiveId: `primitive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: aiPrimitive.title,
            description: aiPrimitive.description,
            primitiveType: aiPrimitive.primitive_type || 'concept',
            difficultyLevel: aiPrimitive.difficulty_level || 'intermediate',
            estimatedTimeMinutes: aiPrimitive.estimated_time_minutes || 10,
            userId: userId,
            blueprintId: blueprintId,
          }
        });

        // Create criteria
        const createdCriteria = [];
        for (const aiCriterion of aiPrimitive.criteria || []) {
          const criterion = await tx.masteryCriterion.create({
            data: {
              criterionId: `criterion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              primitiveId: primitive.primitiveId,
              title: aiCriterion.title,
              description: aiCriterion.description,
              weight: aiCriterion.weight || 1.0,
              ueeLevel: aiCriterion.uee_level || 'UNDERSTAND',
              userId: userId,
            }
          });
          createdCriteria.push(criterion);
        }

        // Create questions linked to criteria
        const createdQuestions = [];
        for (const aiQuestion of aiPrimitive.questions || []) {
          // Find the criterion this question maps to
          let linkedCriterion = null;
          if (aiQuestion.criterionMapping && aiQuestion.criterionMapping.length > 0) {
            // Find criterion by title match
            linkedCriterion = createdCriteria.find(c => 
              aiQuestion.criterionMapping.includes(c.title)
            );
          }
          
          // Create a temporary question set for this primitive if it doesn't exist
          let questionSet = await tx.questionSet.findFirst({
            where: {
              title: `${primitive.title} - Generated Questions`,
              userId: userId
            }
          });
          
          if (!questionSet) {
            questionSet = await tx.questionSet.create({
              data: {
                title: `${primitive.title} - Generated Questions`,
                userId: userId,
                generatedFromBlueprintId: blueprintId,
                isTracked: true
              }
            });
          }
          
          // Create the question
          const question = await tx.question.create({
            data: {
              questionSetId: questionSet.id,
              questionText: aiQuestion.text,
              answerText: aiQuestion.answer,
              marksAvailable: aiQuestion.marksAvailable || 1,
              criterionId: linkedCriterion?.criterionId || null
            }
          });
          
          createdQuestions.push({
            ...question,
            criterionTitle: linkedCriterion?.title || null
          });
        }

        primitives.push({
          ...primitive,
          criteria: createdCriteria,
          questions: createdQuestions
        });
      }

      return primitives;
    });

    console.log(`✅ Generated ${createdPrimitives.length} primitives from blueprint ${blueprintId}`);
    return { primitives: createdPrimitives };
  }

  /**
   * Enhance existing primitives with additional criteria or questions
   * This allows iterative improvement of primitive content
   */
  async enhancePrimitive(
    userId: number,
    primitiveId: string,
    enhancementType: 'criteria' | 'questions' | 'both' = 'both'
  ): Promise<{ primitive: any }> {
    // 1. Fetch the primitive and verify ownership
    const primitive = await prisma.knowledgePrimitive.findFirst({
      where: { 
        primitiveId: primitiveId, 
        userId: userId 
      },
      include: {
        masteryCriteria: true,
      }
    });

    if (!primitive) {
      throw new Error('Primitive not found or access denied.');
    }

    console.log(`=== PRIMITIVE AI: ENHANCING PRIMITIVE ${primitiveId} ===`);

    let aiResponse: any;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/enhance-primitive`, {
        primitive_id: primitiveId,
        primitive_title: primitive.title,
        primitive_description: primitive.description,
        // Note: sourceText not available in current primitive model
        source_text: '', // TODO: Add sourceText to KnowledgePrimitive model
        existing_criteria: primitive.masteryCriteria.map(c => ({
          title: c.title,
          description: c.description,
          weight: c.weight
        })),
        existing_questions: [], // TODO: Add when schema supports primitive questions
        enhancement_type: enhancementType,
        max_new_criteria: 3,
        max_new_questions: 5
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || 'test_api_key_123'}`,
          'Content-Type': 'application/json'
        }
      });
      
      aiResponse = response.data;
      console.log('✅ AI service /enhance-primitive call successful');
    } catch (error: any) {
      console.error('❌ AI service /enhance-primitive call failed:');
      console.error('Error message:', error.message);
      throw new Error('Failed to enhance primitive via AI service.');
    }

    // Add new criteria and questions
    const updatedPrimitive = await prisma.$transaction(async (tx) => {
      // Add new criteria if requested
      if (enhancementType === 'criteria' || enhancementType === 'both') {
        for (const aiCriterion of aiResponse.new_criteria || []) {
          await tx.masteryCriterion.create({
            data: {
              criterionId: `criterion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              primitiveId: primitiveId,
              title: aiCriterion.title,
              description: aiCriterion.description,
              weight: aiCriterion.weight || 1.0,
              ueeLevel: aiCriterion.uee_level || 'UNDERSTAND',
              userId: userId,
            }
          });
        }
      }

      // Add new questions if requested (placeholder)
      if (enhancementType === 'questions' || enhancementType === 'both') {
        // TODO: Add question creation when schema supports primitive questions
        console.log('Question enhancement requested but schema needs update');
      }

      // Return updated primitive
      return await tx.knowledgePrimitive.findUnique({
        where: { primitiveId: primitiveId },
        include: {
          masteryCriteria: true,
        }
      });
    });

    console.log(`✅ Enhanced primitive ${primitiveId} with new content`);
    return { primitive: updatedPrimitive };
  }
}

export default PrimitiveAIService;
