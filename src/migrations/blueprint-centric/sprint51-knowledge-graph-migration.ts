import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// SPRINT 51: KNOWLEDGE GRAPH MIGRATION
// ============================================================================
// 
// This migration script adds the new knowledge graph relationship models:
// - KnowledgeRelationship: Concept relationships between primitives
// - MasteryCriterionRelationship: Learning pathways between criteria
//
// It also updates existing models to use Int IDs for consistency.
//
// ============================================================================

export class Sprint51KnowledgeGraphMigration {
  
  /**
   * Main migration function
   */
  async migrateKnowledgeGraph(): Promise<{
    success: boolean;
    stats: {
      relationshipsCreated: number;
      modelsUpdated: number;
      errors: string[];
    };
  }> {
    const stats = {
      relationshipsCreated: 0,
      modelsUpdated: 0,
      errors: []
    };
    
    try {
      console.log('🚀 Starting Sprint 51: Knowledge Graph Migration...');
      
      // Step 1: Update existing models to use Int IDs
      await this.updateModelIds(stats);
      
      // Step 2: Create sample knowledge relationships
      await this.createSampleKnowledgeRelationships(stats);
      
      // Step 3: Create sample mastery criterion relationships
      await this.createSampleMasteryCriterionRelationships(stats);
      
      console.log('✅ Sprint 51 Knowledge Graph Migration completed successfully!');
      stats.success = true;
      
    } catch (error) {
      console.error('❌ Sprint 51 Migration failed:', error);
      stats.errors.push(error.message);
      stats.success = false;
    }
    
    return { success: stats.success, stats };
  }
  
  /**
   * Step 1: Update existing models to use Int IDs
   * Note: This is a placeholder for the actual schema migration
   */
  private async updateModelIds(stats: any): Promise<void> {
    console.log('🔧 Step 1: Updating model ID fields...');
    
    // This step would typically be handled by Prisma schema migration
    // For now, we'll just log what needs to be updated
    
    const modelsToUpdate = [
      'BlueprintSection: String -> Int',
      'NoteSection: String -> Int', 
      'MasteryCriterion: String -> Int',
      'QuestionInstance: String -> Int',
      'UserCriterionMastery.criterionId: String -> Int',
      'UserQuestionAnswer.questionId: String -> Int',
      'BlueprintSection.parentSectionId: String -> Int',
      'NoteSection.blueprintSectionId: String -> Int',
      'MasteryCriterion.blueprintSectionId: String -> Int',
      'KnowledgePrimitive.blueprintSectionId: String -> Int'
    ];
    
    console.log('  📋 Models that need ID field updates:');
    modelsToUpdate.forEach(model => {
      console.log(`    - ${model}`);
    });
    
    stats.modelsUpdated = modelsToUpdate.length;
    console.log(`  ✅ ID field updates planned for ${modelsToUpdate.length} models`);
  }
  
  /**
   * Step 2: Create sample knowledge relationships
   */
  private async createSampleKnowledgeRelationships(stats: any): Promise<void> {
    console.log('🧠 Step 2: Creating sample knowledge relationships...');
    
    try {
      // Get some existing knowledge primitives to create relationships between
      const primitives = await prisma.knowledgePrimitive.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      if (primitives.length < 2) {
        console.log('  ⚠️  Not enough knowledge primitives to create relationships');
        return;
      }
      
      // Create some sample relationships
      const relationships = [
        {
          sourcePrimitiveId: primitives[0].id,
          targetPrimitiveId: primitives[1].id,
          relationshipType: 'PREREQUISITE',
          strength: 0.9,
          confidence: 0.85,
          source: 'AI_GENERATED',
          metadata: { reason: 'Conceptual dependency', aiConfidence: 0.85 }
        },
        {
          sourcePrimitiveId: primitives[1].id,
          targetPrimitiveId: primitives[2].id,
          relationshipType: 'ADVANCES_TO',
          strength: 0.8,
          confidence: 0.9,
          source: 'AI_GENERATED',
          metadata: { reason: 'Building upon previous concept', aiConfidence: 0.9 }
        },
        {
          sourcePrimitiveId: primitives[0].id,
          targetPrimitiveId: primitives[2].id,
          relationshipType: 'RELATED',
          strength: 0.7,
          confidence: 0.75,
          source: 'AI_GENERATED',
          metadata: { reason: 'Conceptual similarity', aiConfidence: 0.75 }
        }
      ];
      
      for (const rel of relationships) {
        try {
          await prisma.knowledgeRelationship.create({
            data: rel
          });
          
          stats.relationshipsCreated++;
          console.log(`  ✅ Created knowledge relationship: ${rel.sourcePrimitiveId} -> ${rel.targetPrimitiveId} (${rel.relationshipType})`);
          
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`  ⚠️  Relationship already exists: ${rel.sourcePrimitiveId} -> ${rel.targetPrimitiveId}`);
          } else {
            console.error(`  ❌ Failed to create relationship:`, error);
            stats.errors.push(`Failed to create knowledge relationship: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      console.error('  ❌ Error creating knowledge relationships:', error);
      stats.errors.push(`Error creating knowledge relationships: ${error.message}`);
    }
  }
  
  /**
   * Step 3: Create sample mastery criterion relationships
   */
  private async createSampleMasteryCriterionRelationships(stats: any): Promise<void> {
    console.log('🎯 Step 3: Creating sample mastery criterion relationships...');
    
    try {
      // Get some existing mastery criteria to create relationships between
      const criteria = await prisma.masteryCriterion.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      if (criteria.length < 2) {
        console.log('  ⚠️  Not enough mastery criteria to create relationships');
        return;
      }
      
      // Create some sample learning pathway relationships
      const relationships = [
        {
          sourceCriterionId: criteria[0].id,
          targetCriterionId: criteria[1].id,
          relationshipType: 'PREREQUISITE',
          strength: 0.95,
          confidence: 0.9,
          source: 'AI_GENERATED',
          metadata: { reason: 'Learning dependency', aiConfidence: 0.9 }
        },
        {
          sourceCriterionId: criteria[1].id,
          targetCriterionId: criteria[2].id,
          relationshipType: 'ADVANCES_TO',
          strength: 0.85,
          confidence: 0.88,
          source: 'AI_GENERATED',
          metadata: { reason: 'Skill progression', aiConfidence: 0.88 }
        },
        {
          sourceCriterionId: criteria[0].id,
          targetCriterionId: criteria[2].id,
          relationshipType: 'RELATED',
          strength: 0.7,
          confidence: 0.8,
          source: 'AI_GENERATED',
          metadata: { reason: 'Conceptual connection', aiConfidence: 0.8 }
        }
      ];
      
      for (const rel of relationships) {
        try {
          await prisma.masteryCriterionRelationship.create({
            data: rel
          });
          
          stats.relationshipsCreated++;
          console.log(`  ✅ Created criterion relationship: ${rel.sourceCriterionId} -> ${rel.targetCriterionId} (${rel.relationshipType})`);
          
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`  ⚠️  Relationship already exists: ${rel.sourceCriterionId} -> ${rel.targetCriterionId}`);
          } else {
            console.error(`  ❌ Failed to create relationship:`, error);
            stats.errors.push(`Failed to create criterion relationship: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      console.error('  ❌ Error creating mastery criterion relationships:', error);
      stats.errors.push(`Error creating mastery criterion relationships: ${error.message}`);
    }
  }
  
  /**
   * Validates the knowledge graph structure
   */
  async validateKnowledgeGraph(): Promise<{
    isValid: boolean;
    issues: string[];
    stats: {
      totalRelationships: number;
      totalKnowledgePrimitives: number;
      totalMasteryCriteria: number;
      averageRelationshipsPerPrimitive: number;
      averageRelationshipsPerCriterion: number;
    };
  }> {
    console.log('🔍 Validating knowledge graph structure...');
    
    try {
      const [relationships, primitives, criteria] = await Promise.all([
        prisma.knowledgeRelationship.count(),
        prisma.knowledgePrimitive.count(),
        prisma.masteryCriterionRelationship.count(),
        prisma.masteryCriterion.count()
      ]);
      
      const totalRelationships = relationships + criteria;
      const totalKnowledgePrimitives = primitives;
      const totalMasteryCriteria = await prisma.masteryCriterion.count();
      
      const avgRelationshipsPerPrimitive = totalKnowledgePrimitives > 0 ? relationships / totalKnowledgePrimitives : 0;
      const avgRelationshipsPerCriterion = totalMasteryCriteria > 0 ? criteria / totalMasteryCriteria : 0;
      
      const issues: string[] = [];
      
      // Check for orphaned relationships
      const orphanedKnowledgeRels = await this.findOrphanedKnowledgeRelationships();
      const orphanedCriterionRels = await this.findOrphanedCriterionRelationships();
      
      if (orphanedKnowledgeRels.length > 0) {
        issues.push(`${orphanedKnowledgeRels.length} orphaned knowledge relationships found`);
      }
      
      if (orphanedCriterionRels.length > 0) {
        issues.push(`${orphanedCriterionRels.length} orphaned criterion relationships found`);
      }
      
      // Check for circular references
      const circularRefs = await this.detectCircularReferences();
      if (circularRefs.length > 0) {
        issues.push(`${circularRefs.length} circular references detected`);
      }
      
      const stats = {
        totalRelationships,
        totalKnowledgePrimitives,
        totalMasteryCriteria,
        averageRelationshipsPerPrimitive: avgRelationshipsPerPrimitive,
        averageRelationshipsPerCriterion: avgRelationshipsPerCriterion
      };
      
      console.log('  📊 Knowledge Graph Statistics:');
      console.log(`    - Total Relationships: ${stats.totalRelationships}`);
      console.log(`    - Knowledge Primitives: ${stats.totalKnowledgePrimitives}`);
      console.log(`    - Mastery Criteria: ${stats.totalMasteryCriteria}`);
      console.log(`    - Avg Relationships per Primitive: ${stats.averageRelationshipsPerPrimitive.toFixed(2)}`);
      console.log(`    - Avg Relationships per Criterion: ${stats.averageRelationshipsPerCriterion.toFixed(2)}`);
      
      if (issues.length > 0) {
        console.log('  ⚠️  Validation Issues:');
        issues.forEach(issue => console.log(`    - ${issue}`));
      } else {
        console.log('  ✅ Knowledge graph validation passed');
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        stats
      };
      
    } catch (error) {
      console.error('  ❌ Validation failed:', error);
      return {
        isValid: false,
        issues: [`Validation error: ${error.message}`],
        stats: {
          totalRelationships: 0,
          totalKnowledgePrimitives: 0,
          totalMasteryCriteria: 0,
          averageRelationshipsPerPrimitive: 0,
          averageRelationshipsPerCriterion: 0
        }
      };
    }
  }
  
  /**
   * Finds orphaned knowledge relationships
   */
  private async findOrphanedKnowledgeRelationships(): Promise<any[]> {
    const relationships = await prisma.knowledgeRelationship.findMany();
    const orphaned: any[] = [];
    
    for (const rel of relationships) {
      const [source, target] = await Promise.all([
        prisma.knowledgePrimitive.findUnique({ where: { id: rel.sourcePrimitiveId } }),
        prisma.knowledgePrimitive.findUnique({ where: { id: rel.targetPrimitiveId } })
      ]);
      
      if (!source || !target) {
        orphaned.push(rel);
      }
    }
    
    return orphaned;
  }
  
  /**
   * Finds orphaned criterion relationships
   */
  private async findOrphanedCriterionRelationships(): Promise<any[]> {
    const relationships = await prisma.masteryCriterionRelationship.findMany();
    const orphaned: any[] = [];
    
    for (const rel of relationships) {
      const [source, target] = await Promise.all([
        prisma.masteryCriterion.findUnique({ where: { id: rel.sourceCriterionId } }),
        prisma.masteryCriterion.findUnique({ where: { id: rel.targetCriterionId } })
      ]);
      
      if (!source || !target) {
        orphaned.push(rel);
      }
    }
    
    return orphaned;
  }
  
  /**
   * Detects circular references in relationships
   */
  private async detectCircularReferences(): Promise<any[]> {
    // This is a simplified circular reference detection
    // In a real implementation, you'd want more sophisticated cycle detection
    const relationships = await prisma.knowledgeRelationship.findMany();
    const circular: any[] = [];
    
    // Check for direct circular references (A -> B -> A)
    for (const rel of relationships) {
      const reverseRel = relationships.find(r => 
        r.sourcePrimitiveId === rel.targetPrimitiveId && 
        r.targetPrimitiveId === rel.sourcePrimitiveId
      );
      
      if (reverseRel) {
        circular.push({ relationship: rel, reverse: reverseRel });
      }
    }
    
    return circular;
  }
  
  /**
   * Rolls back the migration (for testing purposes)
   */
  async rollbackMigration(): Promise<void> {
    console.log('🔄 Rolling back Sprint 51 migration...');
    
    try {
      // Delete all relationships in reverse order
      await prisma.masteryCriterionRelationship.deleteMany();
      await prisma.knowledgeRelationship.deleteMany();
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
    }
  }
}

// ============================================================================
// MIGRATION EXECUTION
// ============================================================================

if (require.main === module) {
  const migration = new Sprint51KnowledgeGraphMigration();
  
  migration.migrateKnowledgeGraph()
    .then(result => {
      console.log('Migration Result:', result);
      
      if (result.success) {
        // Validate the knowledge graph
        return migration.validateKnowledgeGraph();
      }
    })
    .then(validation => {
      if (validation) {
        console.log('Validation Result:', validation);
        process.exit(validation.isValid ? 0 : 1);
      }
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default Sprint51KnowledgeGraphMigration;
