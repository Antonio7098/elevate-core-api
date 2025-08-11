import prisma from '../lib/prisma';

/**
 * Migration script to remove separate mindmap data from existing blueprints
 * This script cleans up the old approach of storing mindmap data separately
 * and ensures all blueprints use the new dynamic generation approach
 */
async function cleanupSeparateMindmaps() {
  console.log('🧹 Starting cleanup of separate mindmap data...');
  
  try {
    // Get all blueprints that have separate mindmap data
    const blueprintsWithMindmaps = await prisma.learningBlueprint.findMany({
      where: {
        blueprintJson: {
          path: ['mindmap'],
          not: null
        }
      },
      select: {
        id: true,
        blueprintJson: true
      }
    });

    console.log(`📊 Found ${blueprintsWithMindmaps.length} blueprints with separate mindmap data`);

    let cleanedCount = 0;
    let preservedCount = 0;

    for (const blueprint of blueprintsWithMindmaps) {
      const bpJson = blueprint.blueprintJson as any;
      
      if (bpJson.mindmap && typeof bpJson.mindmap === 'object') {
        // Check if the mindmap has useful position data that should be preserved
        const hasUsefulPositions = bpJson.mindmap.nodes?.some((node: any) => 
          node.position && 
          (node.position.x !== 0 || node.position.y !== 0) &&
          node.type === 'section'
        );

        if (hasUsefulPositions) {
          // Preserve useful position data by moving it to sections
          console.log(`📍 Preserving useful position data for blueprint ${blueprint.id}`);
          
          if (Array.isArray(bpJson.sections)) {
            bpJson.mindmap.nodes?.forEach((node: any) => {
              if (node.type === 'section' && node.position) {
                const section = bpJson.sections.find((s: any) => s.section_id === node.id);
                if (section) {
                  section.mindmap_position = node.position;
                  console.log(`  → Moved position for section ${node.id}: (${node.position.x}, ${node.position.y})`);
                }
              }
            });
          }
          
          preservedCount++;
        }

        // Remove the separate mindmap data
        delete bpJson.mindmap;
        console.log(`🗑️  Removed separate mindmap data from blueprint ${blueprint.id}`);
        
        // Update the blueprint
        await prisma.learningBlueprint.update({
          where: { id: blueprint.id },
          data: { blueprintJson: bpJson }
        });
        
        cleanedCount++;
      }
    }

    console.log(`✅ Cleanup completed successfully!`);
    console.log(`   - Cleaned: ${cleanedCount} blueprints`);
    console.log(`   - Preserved positions: ${preservedCount} blueprints`);
    console.log(`   - Total processed: ${blueprintsWithMindmaps.length} blueprints`);

    // Verify cleanup
    const remainingMindmaps = await prisma.learningBlueprint.findMany({
      where: {
        blueprintJson: {
          path: ['mindmap'],
          not: null
        }
      }
    });

    if (remainingMindmaps.length === 0) {
      console.log(`🎉 All separate mindmap data has been successfully removed!`);
    } else {
      console.log(`⚠️  Warning: ${remainingMindmaps.length} blueprints still have mindmap data`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

/**
 * Rollback function to restore mindmap data (if needed)
 * This is kept for safety but should not be needed in normal operation
 */
async function rollbackCleanup() {
  console.log('🔄 Rollback not implemented - this is a destructive migration');
  console.log('   If you need to restore mindmap data, you would need to restore from a backup');
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'cleanup':
      cleanupSeparateMindmaps()
        .then(() => {
          console.log('🎯 Cleanup script completed');
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Cleanup script failed:', error);
          process.exit(1);
        });
      break;
      
    case 'rollback':
      rollbackCleanup()
        .then(() => {
          console.log('🔄 Rollback completed');
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Rollback failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage: npm run cleanup-mindmaps [cleanup|rollback]');
      console.log('');
      console.log('Commands:');
      console.log('  cleanup   - Remove separate mindmap data from blueprints');
      console.log('  rollback  - Rollback the cleanup (not implemented)');
      process.exit(1);
  }
}

export { cleanupSeparateMindmaps, rollbackCleanup };
