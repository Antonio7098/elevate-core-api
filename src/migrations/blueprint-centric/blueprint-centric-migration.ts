import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// BLUEPRINT-CENTRIC MIGRATION SCRIPT
// ============================================================================

export class BlueprintCentricMigration {
  
  /**
   * Main migration function
   */
  async migrateAllData(): Promise<{
    success: boolean;
    stats: {
      blueprintsCreated: number;
      sectionsCreated: number;
      notesMigrated: number;
      questionsMigrated: number;
      errors: string[];
    };
  }> {
    const stats = {
      blueprintsCreated: 0,
      sectionsCreated: 0,
      notesMigrated: 0,
      questionsMigrated: 0,
      errors: []
    };
    
    try {
      console.log('🚀 Starting Blueprint-Centric Migration...');
      
      // Step 1: Create blueprints for existing folders
      await this.migrateFoldersToBlueprints(stats);
      
      // Step 2: Create sections for folder hierarchy
      await this.migrateFolderHierarchyToSections(stats);
      
      // Step 3: Migrate notes to note sections
      await this.migrateNotesToNoteSections(stats);
      
      // Step 4: Migrate question sets to mastery criteria
      await this.migrateQuestionSetsToMasteryCriteria(stats);
      
      // Step 5: Migrate questions to question instances
      await this.migrateQuestionsToQuestionInstances(stats);
      
      // Step 6: Update knowledge primitives with section references
      await this.updateKnowledgePrimitivesWithSections(stats);
      
      console.log('✅ Migration completed successfully!');
      stats.success = true;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      stats.errors.push(error.message);
      stats.success = false;
    }
    
    return { success: stats.success, stats };
  }
  
  /**
   * Step 1: Create blueprints for existing folders
   */
  private async migrateFoldersToBlueprints(stats: any): Promise<void> {
    console.log('📁 Step 1: Creating blueprints for existing folders...');
    
    const folders = await prisma.folder.findMany({
      where: { parentId: null }, // Only root folders
      include: { user: true }
    });
    
    for (const folder of folders) {
      try {
        // Create a blueprint for each root folder
        const blueprint = await prisma.learningBlueprint.create({
          data: {
            sourceText: `Migrated from folder: ${folder.name}`,
            blueprintJson: {
              title: folder.name,
              description: folder.description || `Content migrated from folder: ${folder.name}`,
              sections: []
            },
            title: folder.name,
            description: folder.description || `Content migrated from folder: ${folder.name}`,
            userId: folder.userId,
            folderId: folder.id // Keep reference for now
          }
        });
        
        stats.blueprintsCreated++;
        console.log(`  ✅ Created blueprint for folder: ${folder.name}`);
        
      } catch (error) {
        console.error(`  ❌ Failed to create blueprint for folder ${folder.name}:`, error);
        stats.errors.push(`Failed to create blueprint for folder ${folder.name}: ${error.message}`);
      }
    }
  }
  
  /**
   * Step 2: Create sections for folder hierarchy
   */
  private async migrateFolderHierarchyToSections(stats: any): Promise<void> {
    console.log('📂 Step 2: Creating sections for folder hierarchy...');
    
    const folders = await prisma.folder.findMany({
      include: { user: true }
    });
    
    // Create a map of folder ID to section ID
    const folderToSectionMap = new Map<number, string>();
    
    // First pass: create sections for all folders
    for (const folder of folders) {
      try {
        // Find the blueprint for this folder
        const blueprint = await prisma.learningBlueprint.findFirst({
          where: { folderId: folder.id }
        });
        
        if (!blueprint) {
          // Find blueprint by traversing up the folder hierarchy
          const rootFolder = await this.findRootFolder(folder.id);
          const blueprint = await prisma.learningBlueprint.findFirst({
            where: { folderId: rootFolder.id }
          });
          
          if (!blueprint) {
            throw new Error(`No blueprint found for folder hierarchy starting with ${folder.name}`);
          }
        }
        
        // Create section
        const section = await prisma.blueprintSection.create({
          data: {
            title: folder.name,
            description: folder.description,
            blueprintId: blueprint.id,
            parentSectionId: folder.parentId ? folderToSectionMap.get(folder.parentId) : null,
            depth: await this.calculateFolderDepth(folder.id),
            orderIndex: await this.getNextOrderIndex(blueprint.id, folder.parentId ? folderToSectionMap.get(folder.parentId) : null),
            difficulty: this.mapFolderDifficulty(folder),
            userId: folder.userId
          }
        });
        
        folderToSectionMap.set(folder.id, section.id);
        stats.sectionsCreated++;
        console.log(`  ✅ Created section for folder: ${folder.name}`);
        
      } catch (error) {
        console.error(`  ❌ Failed to create section for folder ${folder.name}:`, error);
        stats.errors.push(`Failed to create section for folder ${folder.name}: ${error.message}`);
      }
    }
  }
  
  /**
   * Step 3: Migrate notes to note sections
   */
  private async migrateNotesToNoteSections(stats: any): Promise<void> {
    console.log('📝 Step 3: Migrating notes to note sections...');
    
    const notes = await prisma.note.findMany({
      include: { folder: true }
    });
    
    for (const note of notes) {
      try {
        if (!note.folder) {
          console.log(`  ⚠️  Note ${note.title} has no folder, skipping...`);
          continue;
        }
        
        // Find the section for this folder
        const section = await prisma.blueprintSection.findFirst({
          where: { title: note.folder.name }
        });
        
        if (!section) {
          console.log(`  ⚠️  No section found for folder ${note.folder.name}, skipping note ${note.title}...`);
          continue;
        }
        
        // Create note section
        await prisma.noteSection.create({
          data: {
            title: note.title,
            content: note.content,
            contentBlocks: note.contentBlocks,
            contentHtml: note.contentHtml,
            plainText: note.plainText,
            contentVersion: note.contentVersion,
            blueprintSectionId: section.id,
            userId: note.userId
          }
        });
        
        stats.notesMigrated++;
        console.log(`  ✅ Migrated note: ${note.title}`);
        
      } catch (error) {
        console.error(`  ❌ Failed to migrate note ${note.title}:`, error);
        stats.errors.push(`Failed to migrate note ${note.title}: ${error.message}`);
      }
    }
  }
  
  /**
   * Step 4: Migrate question sets to mastery criteria
   */
  private async migrateQuestionSetsToMasteryCriteria(stats: any): Promise<void> {
    console.log('❓ Step 4: Migrating question sets to mastery criteria...');
    
    const questionSets = await prisma.questionSet.findMany({
      include: { folder: true }
    });
    
    for (const questionSet of questionSets) {
      try {
        if (!questionSet.folder) {
          console.log(`  ⚠️  Question set ${questionSet.title} has no folder, skipping...`);
          continue;
        }
        
        // Find the section for this folder
        const section = await prisma.blueprintSection.findFirst({
          where: { title: questionSet.folder.name }
        });
        
        if (!section) {
          console.log(`  ⚠️  No section found for folder ${questionSet.folder.name}, skipping question set ${questionSet.title}...`);
          continue;
        }
        
        // Create mastery criterion for this question set
        const masteryCriterion = await prisma.masteryCriterion.create({
          data: {
            title: questionSet.title,
            description: `Migrated from question set: ${questionSet.title}`,
            weight: 1.0,
            uueStage: 'UNDERSTAND', // Default to UNDERSTAND stage
            assessmentType: 'QUESTION_BASED',
            masteryThreshold: 0.8,
            knowledgePrimitiveId: 'migrated', // Placeholder
            blueprintSectionId: section.id,
            userId: questionSet.userId
          }
        });
        
        console.log(`  ✅ Created mastery criterion for question set: ${questionSet.title}`);
        
        // Store mapping for question migration
        (questionSet as any).masteryCriterionId = masteryCriterion.id;
        
      } catch (error) {
        console.error(`  ❌ Failed to migrate question set ${questionSet.title}:`, error);
        stats.errors.push(`Failed to migrate question set ${questionSet.title}: ${error.message}`);
      }
    }
  }
  
  /**
   * Step 5: Migrate questions to question instances
   */
  private async migrateQuestionsToQuestionInstances(stats: any): Promise<void> {
    console.log('🔍 Step 5: Migrating questions to question instances...');
    
    const questions = await prisma.question.findMany({
      include: { questionSet: true }
    });
    
    for (const question of questions) {
      try {
        if (!question.questionSet) {
          console.log(`  ⚠️  Question has no question set, skipping...`);
          continue;
        }
        
        // Find the mastery criterion for this question set
        const masteryCriterion = await prisma.masteryCriterion.findFirst({
          where: { title: question.questionSet.title }
        });
        
        if (!masteryCriterion) {
          console.log(`  ⚠️  No mastery criterion found for question set ${question.questionSet.title}, skipping question...`);
          continue;
        }
        
        // Create question instance
        await prisma.questionInstance.create({
          data: {
            questionText: question.questionText,
            answer: question.answerText || 'Answer not provided',
            difficulty: this.mapQuestionDifficulty(question),
            masteryCriterionId: masteryCriterion.id,
            userId: question.questionSet.userId
          }
        });
        
        stats.questionsMigrated++;
        console.log(`  ✅ Migrated question: ${question.questionText.substring(0, 50)}...`);
        
      } catch (error) {
        console.error(`  ❌ Failed to migrate question:`, error);
        stats.errors.push(`Failed to migrate question: ${error.message}`);
      }
    }
  }
  
  /**
   * Step 6: Update knowledge primitives with section references
   */
  private async updateKnowledgePrimitivesWithSections(stats: any): Promise<void> {
    console.log('🧠 Step 6: Updating knowledge primitives with section references...');
    
    const knowledgePrimitives = await prisma.knowledgePrimitive.findMany();
    
    for (const primitive of knowledgePrimitives) {
      try {
        // Find a section that might be related to this primitive
        // This is a simplified approach - in a real migration you might want more sophisticated logic
        const relatedSection = await prisma.blueprintSection.findFirst({
          where: {
            title: { contains: primitive.title.substring(0, 10) }
          }
        });
        
        if (relatedSection) {
          await prisma.knowledgePrimitive.update({
            where: { id: primitive.id },
            data: { blueprintSectionId: relatedSection.id }
          });
          
          console.log(`  ✅ Updated knowledge primitive ${primitive.title} with section reference`);
        }
        
      } catch (error) {
        console.error(`  ❌ Failed to update knowledge primitive ${primitive.title}:`, error);
        stats.errors.push(`Failed to update knowledge primitive ${primitive.title}: ${error.message}`);
      }
    }
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  /**
   * Finds the root folder by traversing up the hierarchy
   */
  private async findRootFolder(folderId: number): Promise<any> {
    let currentFolder = await prisma.folder.findUnique({
      where: { id: folderId }
    });
    
    while (currentFolder?.parentId) {
      currentFolder = await prisma.folder.findUnique({
        where: { id: currentFolder.parentId }
      });
    }
    
    return currentFolder;
  }
  
  /**
   * Calculates the depth of a folder in the hierarchy
   */
  private async calculateFolderDepth(folderId: number): Promise<number> {
    let depth = 0;
    let currentFolder = await prisma.folder.findUnique({
      where: { id: folderId }
    });
    
    while (currentFolder?.parentId) {
      depth++;
      currentFolder = await prisma.folder.findUnique({
        where: { id: currentFolder.parentId }
      });
    }
    
    return depth;
  }
  
  /**
   * Gets the next order index for a section
   */
  private async getNextOrderIndex(blueprintId: number, parentSectionId?: string): Promise<number> {
    const maxOrder = await prisma.blueprintSection.aggregate({
      where: {
        blueprintId,
        parentSectionId
      },
      _max: {
        orderIndex: true
      }
    });
    
    return (maxOrder._max.orderIndex || 0) + 1;
  }
  
  /**
   * Maps folder properties to section difficulty
   */
  private mapFolderDifficulty(folder: any): string {
    // This is a simplified mapping - you might want more sophisticated logic
    if (folder.currentMasteryScore && folder.currentMasteryScore > 0.7) {
      return 'ADVANCED';
    } else if (folder.currentMasteryScore && folder.currentMasteryScore > 0.4) {
      return 'INTERMEDIATE';
    } else {
      return 'BEGINNER';
    }
  }
  
  /**
   * Maps question properties to question difficulty
   */
  private mapQuestionDifficulty(question: any): string {
    // This is a simplified mapping - you might want more sophisticated logic
    if (question.marksAvailable > 2) {
      return 'HARD';
    } else if (question.marksAvailable > 1) {
      return 'MEDIUM';
    } else {
      return 'EASY';
    }
  }
  
  /**
   * Rolls back the migration (for testing purposes)
   */
  async rollbackMigration(): Promise<void> {
    console.log('🔄 Rolling back migration...');
    
    try {
      // Delete all new data in reverse order
      await prisma.questionInstance.deleteMany();
      await prisma.masteryCriterion.deleteMany();
      await prisma.noteSection.deleteMany();
      await prisma.blueprintSection.deleteMany();
      await prisma.learningBlueprint.deleteMany({
        where: { sourceText: { contains: 'Migrated from folder:' } }
      });
      
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
  const migration = new BlueprintCentricMigration();
  
  migration.migrateAllData()
    .then(result => {
      console.log('Migration Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default BlueprintCentricMigration;
