#!/usr/bin/env ts-node

import { MindmapService, MindmapData } from '../src/services/mindmap.service';

/**
 * Demo script showcasing the Mindmap System functionality
 * This demonstrates how the system converts blueprint data to rich mindmap visualizations
 */

async function demoMindmapSystem() {
  console.log('🧠 Mindmap System Demo\n');
  
  const mindmapService = new MindmapService();
  
  // Sample learning blueprint data
  const sampleBlueprint = {
    title: 'Machine Learning Fundamentals',
    description: 'A comprehensive introduction to machine learning concepts',
    sections: [
      {
        section_id: 'intro',
        section_name: 'Introduction to ML',
        description: 'Basic concepts and definitions of machine learning',
        difficulty_level: 'beginner',
        estimated_time_minutes: 20,
        prerequisites: []
      },
      {
        section_id: 'supervised',
        section_name: 'Supervised Learning',
        description: 'Learning from labeled training data',
        difficulty_level: 'intermediate',
        estimated_time_minutes: 45,
        prerequisites: ['intro']
      },
      {
        section_id: 'unsupervised',
        section_name: 'Unsupervised Learning',
        description: 'Finding patterns in unlabeled data',
        difficulty_level: 'intermediate',
        estimated_time_minutes: 40,
        prerequisites: ['intro']
      },
      {
        section_id: 'neural',
        section_name: 'Neural Networks',
        description: 'Deep learning and neural network architectures',
        difficulty_level: 'advanced',
        estimated_time_minutes: 60,
        prerequisites: ['supervised', 'unsupervised']
      }
    ],
    knowledge_primitives: {
      key_propositions_and_facts: [
        {
          id: 'ml_def',
          statement: 'Machine learning is a subset of artificial intelligence that enables computers to learn without explicit programming',
          primitiveType: 'proposition'
        },
        {
          id: 'supervised_def',
          statement: 'Supervised learning uses labeled training data to learn a mapping from inputs to outputs',
          primitiveType: 'proposition'
        },
        {
          id: 'neural_advantage',
          statement: 'Neural networks can automatically learn hierarchical feature representations',
          primitiveType: 'proposition'
        }
      ],
      key_entities_and_definitions: [
        {
          id: 'algorithm',
          entity: 'Algorithm',
          definition: 'A set of rules or instructions for solving a problem'
        },
        {
          id: 'model',
          entity: 'Model',
          definition: 'A mathematical representation of patterns in data'
        },
        {
          id: 'training',
          entity: 'Training',
          definition: 'The process of learning parameters from data'
        }
      ],
      described_processes_and_steps: [
        {
          id: 'ml_pipeline',
          process_name: 'ML Pipeline',
          steps: ['Data Collection', 'Data Preprocessing', 'Model Training', 'Evaluation', 'Deployment']
        },
        {
          id: 'cross_validation',
          process_name: 'Cross-Validation',
          steps: ['Split Data', 'Train Model', 'Validate', 'Repeat', 'Average Results']
        }
      ],
      identified_relationships: [
        {
          id: 'ml_to_ai',
          source_primitive_id: 'ml_def',
          target_primitive_id: 'algorithm',
          relationship_type: 'uses'
        },
        {
          id: 'supervised_to_model',
          source_primitive_id: 'supervised_def',
          target_primitive_id: 'model',
          relationship_type: 'creates'
        }
      ]
    }
  };

  console.log('📋 Sample Learning Blueprint:');
  console.log(`Title: ${sampleBlueprint.title}`);
  console.log(`Description: ${sampleBlueprint.description}`);
  console.log(`Sections: ${sampleBlueprint.sections.length}`);
  console.log(`Knowledge Primitives: ${Object.keys(sampleBlueprint.knowledge_primitives).length} categories\n`);

  // Build mindmap from blueprint
  console.log('🔨 Building mindmap from blueprint...');
  const mindmapData = mindmapService.buildMindmapFromBlueprint(sampleBlueprint);
  
  console.log(`✅ Generated mindmap with ${mindmapData.nodes.length} nodes and ${mindmapData.edges.length} edges\n`);

  // Display node information
  console.log('📍 Mindmap Nodes:');
  mindmapData.nodes.forEach((node, index) => {
    const typeEmoji = {
      section: '📚',
      proposition: '💡',
      entity: '🔍',
      process: '⚙️'
    }[node.type] || '❓';
    
    console.log(`  ${index + 1}. ${typeEmoji} ${node.data.label} (${node.type})`);
    console.log(`     Position: (${node.position.x.toFixed(0)}, ${node.position.y.toFixed(0)})`);
    console.log(`     Style: ${node.style.backgroundColor} background, ${node.style.borderWidth}px border`);
    if (node.data.difficulty) {
      console.log(`     Difficulty: ${node.data.difficulty}`);
    }
    if (node.data.timeEstimate) {
      console.log(`     Time: ${node.data.timeEstimate} minutes`);
    }
    console.log('');
  });

  // Display edge information
  console.log('🔗 Mindmap Edges:');
  mindmapData.edges.forEach((edge, index) => {
    const typeEmoji = {
      prerequisite: '🔴',
      relationship: '🔵',
      cross_reference: '🟢'
    }[edge.type] || '❓';
    
    const sourceNode = mindmapData.nodes.find(n => n.id === edge.source);
    const targetNode = mindmapData.nodes.find(n => n.id === edge.target);
    
    console.log(`  ${index + 1}. ${typeEmoji} ${edge.type.toUpperCase()}`);
    console.log(`     From: ${sourceNode?.data.label || edge.source}`);
    console.log(`     To: ${targetNode?.data.label || edge.target}`);
    console.log(`     Style: ${edge.style.stroke} stroke, ${edge.style.strokeWidth}px width`);
    if (edge.data.overlap) {
      console.log(`     Overlap: ${(edge.data.overlap * 100).toFixed(1)}%`);
    }
    console.log('');
  });

  // Demonstrate updating blueprint with mindmap changes
  console.log('🔄 Demonstrating blueprint updates...');
  
  // Simulate user moving a node
  const updatedNodes = mindmapData.nodes.map(node => {
    if (node.id === 'intro') {
      return {
        ...node,
        position: { x: 0, y: 0 }, // Move to center
        data: {
          ...node.data,
          difficulty: 'beginner' // Ensure difficulty is set
        }
      };
    }
    return node;
  });

  // Simulate user adding a new relationship
  const newEdge = {
    id: 'user_created_edge',
    source: 'ml_def',
    target: 'training',
    type: 'relationship' as const,
    data: {
      relationType: 'user_defined',
      strength: 'medium' as const
    },
    style: {
      stroke: '#8b5cf6',
      strokeWidth: 2
    }
  };

  const updatedEdges = [...mindmapData.edges, newEdge];

  // Update the blueprint
  const updatedBlueprint = mindmapService.updateBlueprintWithMindmap(
    sampleBlueprint,
    updatedNodes,
    updatedEdges,
    { centralConcept: 'Machine Learning Fundamentals' }
  );

  console.log('✅ Blueprint updated with mindmap changes');
  console.log(`   - Introduction section moved to center (0, 0)`);
  console.log(`   - New relationship edge added between ML definition and training`);
  console.log(`   - Mindmap metadata updated with central concept\n`);

  // Show color scheme and layout hints
  console.log('🎨 Default Color Scheme:');
  const colors = mindmapService.getDefaultColorScheme();
  Object.entries(colors).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  console.log('\n📐 Default Layout Hints:');
  const layout = mindmapService.getDefaultLayoutHints();
  Object.entries(layout).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  console.log('\n🎉 Mindmap System Demo Complete!');
  console.log('\nThis demonstrates:');
  console.log('  • Automatic mindmap generation from blueprint data');
  console.log('  • Intelligent positioning and styling');
  console.log('  • Multiple node and edge types');
  console.log('  • Bidirectional updates between mindmap and blueprint');
  console.log('  • Rich metadata and relationship tracking');
}

// Run the demo if this script is executed directly
if (require.main === module) {
  demoMindmapSystem()
    .then(() => {
      console.log('\n🚀 Demo completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

export { demoMindmapSystem };
