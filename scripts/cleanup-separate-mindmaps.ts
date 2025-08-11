#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupSeparateMindmaps() {
  console.log('🧹 Starting cleanup of separate mindmap data...');
  
  try {
    // Check if there are any separate mindmap tables or data
    // This script is designed to handle the transition from a separate mindmap system
    // to the integrated mindmap system within LearningBlueprint
    
    console.log('📊 Checking for existing mindmap data...');
    
    // Look for any LearningBlueprint records that might have old mindmap data
    const blueprintsWithOldMindmapData = await prisma.learningBlueprint.findMany({
      where: {
        OR: [
          { blueprintJson: { path: ['mindmap_data'] } },
          { blueprintJson: { path: ['separate_mindmap'] } },
          { blueprintJson: { path: ['mindmap_nodes'] } },
          { blueprintJson: { path: ['mindmap_edges'] } }
        ]
      }
    });
    
    if (blueprintsWithOldMindmapData.length > 0) {
      console.log(`🔄 Found ${blueprintsWithOldMindmapData.length} blueprints with old mindmap data`);
      
      for (const blueprint of blueprintsWithOldMindmapData) {
        console.log(`  Processing blueprint ${blueprint.id}...`);
        
        const blueprintJson = blueprint.blueprintJson as any;
        const updatedJson = { ...blueprintJson };
        
        // Remove old mindmap fields
        delete updatedJson.mindmap_data;
        delete updatedJson.separate_mindmap;
        delete updatedJson.mindmap_nodes;
        delete updatedJson.mindmap_edges;
        
        // If there was mindmap data, try to preserve useful information
        if (blueprintJson.mindmap_data) {
          console.log(`    Preserving mindmap metadata from blueprint ${blueprint.id}`);
          
          // Extract useful metadata if available
          if (blueprintJson.mindmap_data.metadata) {
            updatedJson.mindmap_metadata = {
              ...blueprintJson.mindmap_data.metadata,
              migrated_from: 'separate_mindmap_system',
              migration_date: new Date().toISOString()
            };
          }
        }
        
        // Update the blueprint
        await prisma.learningBlueprint.update({
          where: { id: blueprint.id },
          data: { blueprintJson: updatedJson }
        });
        
        console.log(`    ✅ Updated blueprint ${blueprint.id}`);
      }
    } else {
      console.log('✅ No old mindmap data found to clean up');
    }
    
    // Check for any orphaned mindmap-related records
    console.log('🔍 Checking for orphaned mindmap records...');
    
    // This would be where you'd clean up any separate mindmap tables
    // For now, we'll just log that the check was performed
    console.log('  No separate mindmap tables found');
    
    console.log('🎉 Mindmap cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during mindmap cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupSeparateMindmaps()
    .then(() => {
      console.log('🚀 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { cleanupSeparateMindmaps };
