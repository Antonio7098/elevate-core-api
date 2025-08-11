import { MindmapService, MindmapNode, MindmapEdge } from '../mindmap.service';

describe('MindmapService', () => {
  let mindmapService: MindmapService;

  beforeEach(() => {
    mindmapService = new MindmapService();
  });

  describe('buildMindmapFromBlueprint', () => {
    it('should build mindmap from blueprint with sections', () => {
      const blueprintJson = {
        title: 'Test Blueprint',
        sections: [
          {
            section_id: 'section1',
            section_name: 'Introduction',
            description: 'Basic concepts',
            difficulty_level: 'beginner',
            estimated_time_minutes: 15,
            prerequisites: []
          },
          {
            section_id: 'section2',
            section_name: 'Advanced Topics',
            description: 'Complex concepts',
            difficulty_level: 'advanced',
            estimated_time_minutes: 45,
            prerequisites: ['section1']
          }
        ],
        knowledge_primitives: {
          key_propositions_and_facts: [
            {
              id: 'prop1',
              statement: 'Basic fact',
              primitiveType: 'proposition'
            }
          ],
          key_entities_and_definitions: [
            {
              id: 'entity1',
              entity: 'Test Entity',
              definition: 'A test entity'
            }
          ],
          described_processes_and_steps: [
            {
              id: 'process1',
              process_name: 'Test Process',
              steps: ['Step 1', 'Step 2']
            }
          ],
          identified_relationships: [
            {
              id: 'rel1',
              source_primitive_id: 'prop1',
              target_primitive_id: 'entity1',
              relationship_type: 'supports'
            }
          ]
        }
      };

      const result = mindmapService.buildMindmapFromBlueprint(blueprintJson);

      expect(result.nodes).toHaveLength(5); // 2 sections + 3 primitives
      expect(result.edges).toHaveLength(3); // 1 prerequisite + 1 relationship + 1 cross-reference

      // Check section nodes
      const sectionNodes = result.nodes.filter(n => n.type === 'section');
      expect(sectionNodes).toHaveLength(2);
      
      const introSection = sectionNodes.find(n => n.id === 'section1');
      expect(introSection?.data.difficulty).toBe('beginner');
      expect(introSection?.data.timeEstimate).toBe(15);
      expect(introSection?.style.backgroundColor).toBe('#10b981'); // Green for beginner

      const advancedSection = sectionNodes.find(n => n.id === 'section2');
      expect(advancedSection?.data.difficulty).toBe('advanced');
      expect(advancedSection?.style.borderWidth).toBe(3); // Thicker border for advanced

      // Check primitive nodes
      const primitiveNodes = result.nodes.filter(n => n.type !== 'section');
      expect(primitiveNodes).toHaveLength(3);

      const propositionNode = primitiveNodes.find(n => n.type === 'proposition');
      expect(propositionNode?.style.backgroundColor).toBe('#8b5cf6'); // Purple for propositions

      // Check edges
      const prerequisiteEdge = result.edges.find(e => e.type === 'prerequisite');
      expect(prerequisiteEdge?.source).toBe('section1');
      expect(prerequisiteEdge?.target).toBe('section2');
      expect(prerequisiteEdge?.style.stroke).toBe('#ef4444'); // Red for prerequisites

      const relationshipEdge = result.edges.find(e => e.type === 'relationship');
      expect(relationshipEdge?.source).toBe('prop1');
      expect(relationshipEdge?.target).toBe('entity1');

      // Check cross-reference edge (created due to keyword overlap)
      const crossRefEdge = result.edges.find(e => e.type === 'cross_reference');
      expect(crossRefEdge).toBeDefined();
      expect(crossRefEdge?.source).toBe('section1');
      expect(crossRefEdge?.target).toBe('prop1');
      expect(crossRefEdge?.data.relationType).toBe('semantic_connection');
    });

    it('should handle empty blueprint gracefully', () => {
      const result = mindmapService.buildMindmapFromBlueprint({});
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    it('should handle blueprint with only sections', () => {
      const blueprintJson = {
        sections: [
          { section_id: 'section1', section_name: 'Test' }
        ]
      };

      const result = mindmapService.buildMindmapFromBlueprint(blueprintJson);
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(0);
    });

    it('should calculate positions for nodes without existing positions', () => {
      const blueprintJson = {
        sections: [
          { section_id: 'section1', section_name: 'Test 1' },
          { section_id: 'section2', section_name: 'Test 2' },
          { section_id: 'section3', section_name: 'Test 3' }
        ]
      };

      const result = mindmapService.buildMindmapFromBlueprint(blueprintJson);
      
      // All nodes should have positions
      result.nodes.forEach(node => {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });

      // Positions should be different
      const positions = result.nodes.map(n => `${n.position.x},${n.position.y}`);
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(3);
    });

    it('should preserve existing mindmap positions', () => {
      const blueprintJson = {
        sections: [
          {
            section_id: 'section1',
            section_name: 'Test',
            mindmap_position: { x: 100, y: 200 }
          }
        ]
      };

      const result = mindmapService.buildMindmapFromBlueprint(blueprintJson);
      const node = result.nodes[0];
      expect(node.position.x).toBe(100);
      expect(node.position.y).toBe(200);
    });
  });

  describe('updateBlueprintWithMindmap', () => {
    it('should update section positions and properties', () => {
      const originalBlueprint = {
        sections: [
          {
            section_id: 'section1',
            section_name: 'Test',
            difficulty_level: 'beginner',
            estimated_time_minutes: 30
          }
        ]
      };

      const nodes: MindmapNode[] = [
        {
          id: 'section1',
          type: 'section',
          data: {
            label: 'Updated Test',
            difficulty: 'advanced',
            timeEstimate: 60
          },
          position: { x: 150, y: 250 },
          style: {
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 3,
            borderRadius: 8,
            padding: 10
          }
        }
      ];

      const edges: MindmapEdge[] = [];
      const metadata = { centralConcept: 'Updated Concept' };

      const result = mindmapService.updateBlueprintWithMindmap(
        originalBlueprint,
        nodes,
        edges,
        metadata
      );

      expect(result.sections[0].mindmap_position).toEqual({ x: 150, y: 250 });
      expect(result.sections[0].difficulty_level).toBe('advanced');
      expect(result.sections[0].estimated_time_minutes).toBe(60);
      expect(result.mindmap_metadata.centralConcept).toBe('Updated Concept');
    });

    it('should create new relationships from edges', () => {
      const originalBlueprint = {
        knowledge_primitives: {
          identified_relationships: []
        }
      };

      const nodes: MindmapNode[] = [];
      const edges: MindmapEdge[] = [
        {
          id: 'new_rel',
          source: 'source1',
          target: 'target1',
          type: 'prerequisite',
          data: { relationType: 'prerequisite', strength: 'strong' },
          style: { stroke: '#ef4444', strokeWidth: 2 }
        }
      ];

      const result = mindmapService.updateBlueprintWithMindmap(
        originalBlueprint,
        nodes,
        edges
      );

      expect(result.knowledge_primitives.identified_relationships).toHaveLength(1);
      const newRel = result.knowledge_primitives.identified_relationships[0];
      expect(newRel.source_primitive_id).toBe('source1');
      expect(newRel.target_primitive_id).toBe('target1');
      expect(newRel.relationship_type).toBe('prerequisite');
    });

    it('should not duplicate existing relationships', () => {
      const originalBlueprint = {
        knowledge_primitives: {
          identified_relationships: [
            {
              id: 'existing_rel',
              source_primitive_id: 'source1',
              target_primitive_id: 'target1',
              relationship_type: 'prerequisite'
            }
          ]
        }
      };

      const nodes: MindmapNode[] = [];
      const edges: MindmapEdge[] = [
        {
          id: 'duplicate_rel',
          source: 'source1',
          target: 'target1',
          type: 'prerequisite',
          data: { relationType: 'prerequisite', strength: 'strong' },
          style: { stroke: '#ef4444', strokeWidth: 2 }
        }
      ];

      const result = mindmapService.updateBlueprintWithMindmap(
        originalBlueprint,
        nodes,
        edges
      );

      // Should not add duplicate relationship
      expect(result.knowledge_primitives.identified_relationships).toHaveLength(1);
    });
  });

  describe('helper methods', () => {
    it('should return correct color schemes', () => {
      const colorScheme = mindmapService.getDefaultColorScheme();
      expect(colorScheme.primary).toBe('#3b82f6');
      expect(colorScheme.secondary).toBe('#10b981');
      expect(colorScheme.tertiary).toBe('#f59e0b');
    });

    it('should return correct layout hints', () => {
      const layoutHints = mindmapService.getDefaultLayoutHints();
      expect(layoutHints.orientation).toBe('radial');
      expect(layoutHints.spacing).toBe('balanced');
      expect(layoutHints.grouping).toBe('thematic');
    });
  });

  describe('cross-reference edge building', () => {
    it('should create cross-reference edges based on keyword overlap', () => {
      const blueprintJson = {
        sections: [
          {
            section_id: 'section1',
            section_name: 'Machine Learning Basics',
            description: 'Introduction to machine learning concepts'
          }
        ],
        knowledge_primitives: {
          key_propositions_and_facts: [
            {
              id: 'prop1',
              statement: 'Machine learning is a subset of artificial intelligence'
            }
          ]
        }
      };

      const result = mindmapService.buildMindmapFromBlueprint(blueprintJson);
      
      // Should create cross-reference edge due to "machine learning" keyword overlap
      const crossRefEdge = result.edges.find(e => e.type === 'cross_reference');
      expect(crossRefEdge).toBeDefined();
      expect(crossRefEdge?.source).toBe('section1');
      expect(crossRefEdge?.target).toBe('prop1');
      expect(crossRefEdge?.data.relationType).toBe('semantic_connection');
    });
  });

  describe('performance optimizations', () => {
    it('should use simplified mindmap for very large blueprints', () => {
      // Create a large blueprint that exceeds the threshold
      const largeBlueprint = {
        title: 'Large Blueprint',
        sections: Array.from({ length: 150 }, (_, i) => ({
          section_id: `section${i}`,
          section_name: `Section ${i}`,
          description: `Description for section ${i}`,
          difficulty_level: 'beginner',
          estimated_time_minutes: 30
        })),
        knowledge_primitives: {
          key_propositions_and_facts: Array.from({ length: 100 }, (_, i) => ({
            id: `prop${i}`,
            statement: `Proposition ${i}`
          })),
          key_entities_and_definitions: Array.from({ length: 100 }, (_, i) => ({
            id: `entity${i}`,
            entity: `Entity ${i}`,
            definition: `Definition ${i}`
          })),
          described_processes_and_steps: Array.from({ length: 100 }, (_, i) => ({
            id: `process${i}`,
            process_name: `Process ${i}`,
            steps: ['Step 1', 'Step 2']
          }))
        }
      };

      const result = mindmapService.buildMindmapFromBlueprint(largeBlueprint);
      
      // Should only include sections (no primitives) for simplified view
      expect(result.nodes).toHaveLength(150);
      expect(result.nodes.every(n => n.type === 'section')).toBe(true);
      
      // Should not have cross-reference edges
      expect(result.edges.every(e => e.type !== 'cross_reference')).toBe(true);
    });

    it('should cache results for repeated calls', () => {
      const blueprint = {
        title: 'Test Blueprint',
        sections: [
          {
            section_id: 'section1',
            section_name: 'Introduction',
            difficulty_level: 'beginner'
          }
        ]
      };

      // First call should build the mindmap
      const result1 = mindmapService.buildMindmapFromBlueprint(blueprint);
      expect(result1.nodes).toHaveLength(1);

      // Second call should use cache
      const result2 = mindmapService.buildMindmapFromBlueprint(blueprint);
      expect(result2).toEqual(result1);

      // Verify cache stats
      const stats = mindmapService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should provide performance metrics', () => {
      const metrics = mindmapService.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('maxNodesForCrossReferences');
      expect(metrics).toHaveProperty('cacheTTL');
      expect(metrics).toHaveProperty('recommendations');
      expect(Array.isArray(metrics.recommendations)).toBe(true);
    });

    it('should clear cache when requested', () => {
      const blueprint = {
        title: 'Test Blueprint',
        sections: [{ section_id: 'section1', section_name: 'Test' }]
      };

      // Build mindmap to populate cache
      mindmapService.buildMindmapFromBlueprint(blueprint);
      
      // Verify cache has data
      let stats = mindmapService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // Clear cache
      mindmapService.clearCache();
      
      // Verify cache is empty
      stats = mindmapService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});
