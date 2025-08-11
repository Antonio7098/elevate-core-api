import { LearningBlueprint } from '@prisma/client';

// Performance optimization: Cache for expensive operations
interface MindmapCache {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  timestamp: number;
  blueprintHash: string;
}

export interface MindmapNode {
  id: string;
  type: 'section' | 'proposition' | 'entity' | 'process';
  data: {
    label: string;
    description?: string | null;
    difficulty?: string;
    timeEstimate?: number;
    prerequisites?: string[];
    primitiveType?: string;
  };
  position: { x: number; y: number };
  style: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    padding: number;
  };
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
  type: 'prerequisite' | 'relationship' | 'cross_reference';
  data: {
    relationType: string;
    strength: 'weak' | 'medium' | 'strong';
    overlap?: number;
  };
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
}

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

export interface MindmapMetadata {
  centralConcept: string;
  colorScheme: {
    primary: string;
    secondary: string;
    tertiary: string;
    applications: string;
    math: string;
  };
  layoutHints: {
    orientation: 'radial' | 'hierarchical' | 'balanced';
    spacing: 'tight' | 'balanced' | 'sparse';
    grouping: 'thematic' | 'difficulty' | 'temporal';
  };
}

export class MindmapService {
  private cache = new Map<string, MindmapCache>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_NODES_FOR_CROSS_REFERENCES = 100; // Performance threshold

  /**
   * Builds a rich mindmap from blueprint data using all available metadata
   * Now includes performance optimizations for large blueprints
   */
  buildMindmapFromBlueprint(bpJson: any): MindmapData {
    // Check cache first
    const cacheKey = this.generateCacheKey(bpJson);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { nodes: cached.nodes, edges: cached.edges };
    }

    // Determine if we should use simplified mindmap for very large blueprints
    const totalItems = this.countBlueprintItems(bpJson);
    const useSimplified = totalItems > this.MAX_NODES_FOR_CROSS_REFERENCES * 2;
    
    if (useSimplified) {
      console.log(`Blueprint has ${totalItems} items, using simplified mindmap for performance`);
      return this.buildSimplifiedMindmapFromBlueprint(bpJson);
    }

    const nodes: MindmapNode[] = [];
    const edges: MindmapEdge[] = [];

    try {
      // Map sections to nodes with rich metadata
      const sections = bpJson?.sections ?? [];
      sections.forEach((section: any) => {
        if (section?.section_id) {
          const position = section.mindmap_position || this.calculateDefaultPosition(sections.indexOf(section));
          const difficultyColor = this.getDifficultyColor(section.difficulty_level);
          
          nodes.push({
            id: String(section.section_id),
            type: 'section',
            data: {
              label: section.section_name || String(section.section_id),
              description: section.description || null,
              difficulty: section.difficulty_level || 'beginner',
              timeEstimate: section.estimated_time_minutes || 30,
              prerequisites: section.prerequisites || []
            },
            position,
            style: {
              backgroundColor: difficultyColor,
              borderColor: this.adjustColorBrightness(difficultyColor, -20),
              borderWidth: section.difficulty_level === 'advanced' ? 3 : 1,
              borderRadius: 8,
              padding: 10
            }
          });
        }
      });

      // Map knowledge primitives to nodes
      const kp = bpJson?.knowledge_primitives ?? {};
      
      // Key propositions and facts
      this.addPrimitiveNodes(
        kp.key_propositions_and_facts, 
        'proposition', 
        (p: any) => p.statement || p.title || String(p.id), 
        nodes,
        sections.length,
        (p: any) => (Array.isArray(p.supporting_evidence) ? p.supporting_evidence[0] : null)
      );
      
      this.addPrimitiveNodes(
        kp.key_entities_and_definitions, 
        'entity', 
        (p: any) => p.entity || p.title || String(p.id), 
        nodes,
        sections.length,
        (p: any) => p.definition || null
      );
      
      this.addPrimitiveNodes(
        kp.described_processes_and_steps, 
        'process', 
        (p: any) => p.process_name || p.title || String(p.id), 
        nodes,
        sections.length,
        (p: any) => Array.isArray(p.steps) ? p.steps.join(' → ') : null
      );

      // Build edges from multiple sources
      this.buildPrerequisiteEdges(sections, edges);
      this.buildRelationshipEdges(kp, edges);
      
      // Only build cross-references for manageable sizes to maintain performance
      if (nodes.length <= this.MAX_NODES_FOR_CROSS_REFERENCES) {
        this.buildCrossReferenceEdges(sections, kp, edges);
      } else {
        console.warn(`Blueprint has ${nodes.length} nodes, skipping cross-references for performance`);
      }

      // Cache the result
      const result = { nodes, edges };
      this.cache.set(cacheKey, {
        ...result,
        timestamp: Date.now(),
        blueprintHash: cacheKey
      });

      return result;

    } catch (error) {
      console.error('Error building mindmap from blueprint:', error);
      // Return empty arrays if derivation fails
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Generates a cache key based on blueprint content
   */
  private generateCacheKey(bpJson: any): string {
    // Simple hash based on key properties for caching
    const key = JSON.stringify({
      sections: bpJson?.sections?.length || 0,
      knowledgePrimitives: {
        propositions: bpJson?.knowledge_primitives?.key_propositions_and_facts?.length || 0,
        entities: bpJson?.knowledge_primitives?.key_entities_and_definitions?.length || 0,
        processes: bpJson?.knowledge_primitives?.described_processes_and_steps?.length || 0
      },
      lastUpdated: bpJson?.mindmap_metadata?.last_updated || 'unknown'
    });
    return Buffer.from(key).toString('base64').substring(0, 16);
  }

  /**
   * Clears expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Public method to clear the entire cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Mindmap cache cleared');
  }

  /**
   * Gets cache statistics for monitoring
   */
  getCacheStats(): { size: number; hitRate: number } {
    this.cleanupCache(); // Clean expired entries first
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking if needed
    };
  }

  /**
   * Gets performance metrics for the mindmap service
   */
  getPerformanceMetrics(): {
    cacheSize: number;
    maxNodesForCrossReferences: number;
    cacheTTL: number;
    recommendations: string[];
  } {
    const stats = this.getCacheStats();
    const recommendations: string[] = [];
    
    if (stats.size > 100) {
      recommendations.push('Consider reducing cache TTL for memory optimization');
    }
    
    if (this.MAX_NODES_FOR_CROSS_REFERENCES < 50) {
      recommendations.push('Cross-reference threshold may be too low for complex blueprints');
    }
    
    return {
      cacheSize: stats.size,
      maxNodesForCrossReferences: this.MAX_NODES_FOR_CROSS_REFERENCES,
      cacheTTL: this.CACHE_TTL,
      recommendations
    };
  }

  /**
   * Gets detailed statistics for a specific blueprint mindmap
   */
  getBlueprintMindmapStats(bpJson: any): {
    nodeCount: number;
    edgeCount: number;
    complexity: {
      sections: number;
      primitives: number;
      crossReferences: number;
      difficultyDistribution: Record<string, number>;
    };
    performance: {
      estimatedRenderTime: number;
      memoryUsage: number;
      optimizationLevel: 'simple' | 'balanced' | 'complex';
    };
    recommendations: string[];
  } {
    try {
      const sections = bpJson?.sections ?? [];
      const knowledgePrimitives = bpJson?.knowledge_primitives ?? {};
      
      // Count different types of primitives
      const primitiveCounts = {
        propositions: (knowledgePrimitives.key_propositions_and_facts ?? []).length,
        entities: (knowledgePrimitives.key_entities_and_definitions ?? []).length,
        processes: (knowledgePrimitives.described_processes_and_steps ?? []).length,
        applications: (knowledgePrimitives.applications ?? []).length,
        math: (knowledgePrimitives.math ?? []).length
      };
      
      const totalPrimitives = Object.values(primitiveCounts).reduce((sum, count) => sum + count, 0);
      
      // Count cross-references (edges)
      const crossReferenceCount = this.estimateCrossReferenceCount(sections, knowledgePrimitives);
      
      // Calculate difficulty distribution
      const difficultyDistribution: Record<string, number> = {};
      sections.forEach((section: any) => {
        const difficulty = section.difficulty_level || 'beginner';
        difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1;
      });
      
      // Estimate render time based on complexity
      const totalItems = sections.length + totalPrimitives;
      const estimatedRenderTime = totalItems < 50 ? 100 : totalItems < 200 ? 300 : 800;
      
      // Estimate memory usage
      const memoryUsage = totalItems * 2.5; // KB
      
      // Determine optimization level
      let optimizationLevel: 'simple' | 'balanced' | 'complex';
      if (totalItems < 50) {
        optimizationLevel = 'simple';
      } else if (totalItems < 150) {
        optimizationLevel = 'balanced';
      } else {
        optimizationLevel = 'complex';
      }
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (totalItems > 200) {
        recommendations.push('Consider using simplified mindmap view for better performance');
      }
      if (crossReferenceCount > 100) {
        recommendations.push('High cross-reference count may impact rendering performance');
      }
      if (Object.keys(difficultyDistribution).length > 3) {
        recommendations.push('Consider grouping similar difficulty levels for better organization');
      }
      
      return {
        nodeCount: sections.length + totalPrimitives,
        edgeCount: crossReferenceCount,
        complexity: {
          sections: sections.length,
          primitives: totalPrimitives,
          crossReferences: crossReferenceCount,
          difficultyDistribution
        },
        performance: {
          estimatedRenderTime,
          memoryUsage,
          optimizationLevel
        },
        recommendations
      };
    } catch (error) {
      console.error('Error calculating blueprint mindmap stats:', error);
      return {
        nodeCount: 0,
        edgeCount: 0,
        complexity: {
          sections: 0,
          primitives: 0,
          crossReferences: 0,
          difficultyDistribution: {}
        },
        performance: {
          estimatedRenderTime: 0,
          memoryUsage: 0,
          optimizationLevel: 'simple'
        },
        recommendations: ['Unable to calculate statistics due to error']
      };
    }
  }

  /**
   * Estimates the number of cross-references in a blueprint
   */
  private estimateCrossReferenceCount(sections: any[], knowledgePrimitives: any): number {
    try {
      let count = 0;
      
      // Count prerequisite relationships
      sections.forEach((section: any) => {
        if (section.prerequisites && Array.isArray(section.prerequisites)) {
          count += section.prerequisites.length;
        }
      });
      
      // Estimate cross-references based on primitive types
      const primitiveTypes = Object.keys(knowledgePrimitives);
      primitiveTypes.forEach(type => {
        const primitives = knowledgePrimitives[type] || [];
        if (primitives.length > 1) {
          // Estimate cross-references between primitives of the same type
          count += Math.min(primitives.length * 0.3, 20); // Cap at 20 per type
        }
      });
      
      return Math.round(count);
    } catch (error) {
      console.error('Error estimating cross-reference count:', error);
      return 0;
    }
  }

  /**
   * Builds a simplified mindmap for very large blueprints
   * This provides a high-level overview without detailed cross-references
   */
  buildSimplifiedMindmapFromBlueprint(bpJson: any): MindmapData {
    const nodes: MindmapNode[] = [];
    const edges: MindmapEdge[] = [];

    try {
      // Only include sections for simplified view
      const sections = bpJson?.sections ?? [];
      sections.forEach((section: any, index: number) => {
        if (section?.section_id) {
          const position = section.mindmap_position || this.calculateDefaultPosition(index);
          const difficultyColor = this.getDifficultyColor(section.difficulty_level);
          
          nodes.push({
            id: String(section.section_id),
            type: 'section',
            data: {
              label: section.section_name || String(section.section_id),
              description: section.description || null,
              difficulty: section.difficulty_level || 'beginner',
              timeEstimate: section.estimated_time_minutes || 30,
              prerequisites: section.prerequisites || []
            },
            position,
            style: {
              backgroundColor: difficultyColor,
              borderColor: this.adjustColorBrightness(difficultyColor, -20),
              borderWidth: section.difficulty_level === 'advanced' ? 3 : 1,
              borderRadius: 8,
              padding: 10
            }
          });
        }
      });

      // Only include prerequisite edges for simplified view
      this.buildPrerequisiteEdges(sections, edges);

      return { nodes, edges };

    } catch (error) {
      console.error('Error building simplified mindmap from blueprint:', error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Adds primitive nodes to the mindmap
   */
  private addPrimitiveNodes(
    primitives: any[], 
    type: string, 
    getTitle: (p: any) => string, 
    nodes: MindmapNode[],
    sectionCount: number,
    getDesc?: (p: any) => string | null
  ): void {
    primitives?.forEach((primitive: any, index: number) => {
      const id = primitive?.id || primitive?.primitiveId || `${type}_${index}`;
      if (!id) return;
      
      const position = this.calculatePrimitivePosition(type, index, sectionCount);
      
      nodes.push({
        id: String(id),
        type: type as any,
        data: {
          label: getTitle(primitive),
          description: getDesc ? getDesc(primitive) : null,
          primitiveType: primitive?.primitiveType || type,
          difficulty: primitive?.difficulty_level || 'beginner'
        },
        position,
        style: {
          backgroundColor: this.getPrimitiveTypeColor(type),
          borderColor: this.adjustColorBrightness(this.getPrimitiveTypeColor(type), -20),
          borderWidth: 1,
          borderRadius: 6,
          padding: 8
        }
      });
    });
  }

  /**
   * Builds prerequisite edges between sections
   */
  private buildPrerequisiteEdges(sections: any[], edges: MindmapEdge[]): void {
    sections.forEach((section: any) => {
      section.prerequisites?.forEach((prereqId: string) => {
        edges.push({
          id: `prereq_${prereqId}_${section.section_id}`,
          source: String(prereqId),
          target: String(section.section_id),
          type: 'prerequisite',
          data: { 
            relationType: 'prerequisite',
            strength: 'strong'
          },
          style: {
            stroke: '#ef4444',
            strokeWidth: 2,
            strokeDasharray: '5,5'
          }
        });
      });
    });
  }

  /**
   * Builds relationship edges between knowledge primitives
   */
  private buildRelationshipEdges(knowledgePrimitives: any, edges: MindmapEdge[]): void {
    const relationships = knowledgePrimitives.identified_relationships ?? [];
    relationships.forEach((rel: any) => {
      const src = rel?.source_primitive_id;
      const tgt = rel?.target_primitive_id;
      if (!src || !tgt || src === tgt) return;
      
      const id = rel?.id || `${src}->${tgt}`;
      edges.push({
        id: String(id),
        source: String(src),
        target: String(tgt),
        type: 'relationship',
        data: { 
          relationType: rel?.relationship_type || 'custom',
          strength: rel?.strength || 'medium'
        },
        style: {
          stroke: '#3b82f6',
          strokeWidth: 1.5
        }
      });
    });
  }

  /**
   * Builds cross-reference edges between sections and knowledge primitives
   */
  private buildCrossReferenceEdges(sections: any[], knowledgePrimitives: any, edges: MindmapEdge[]): void {
    // Performance optimization: Early termination for large datasets
    const totalItems = sections.length + 
      (knowledgePrimitives.key_propositions_and_facts?.length || 0) +
      (knowledgePrimitives.key_entities_and_definitions?.length || 0) +
      (knowledgePrimitives.described_processes_and_steps?.length || 0);
    
    if (totalItems > this.MAX_NODES_FOR_CROSS_REFERENCES) {
      console.warn(`Skipping cross-references: ${totalItems} items exceed performance threshold`);
      return;
    }

    // This could be enhanced with AI analysis to find semantic connections
    // For now, we'll create basic connections based on shared keywords
    
    const allPrimitives = [
      ...(knowledgePrimitives.key_propositions_and_facts || []),
      ...(knowledgePrimitives.key_entities_and_definitions || []),
      ...(knowledgePrimitives.described_processes_and_steps || [])
    ];

    // Pre-extract keywords for sections to avoid repeated processing
    const sectionKeywords = new Map<string, string[]>();
    sections.forEach((section: any) => {
      const text = `${section.section_name} ${section.description || ''}`;
      sectionKeywords.set(section.section_id, this.extractKeywords(text));
    });

    // Process primitives with early termination
    let edgeCount = 0;
    const maxEdges = Math.min(50, totalItems * 2); // Limit total cross-reference edges

    sections.forEach((section: any) => {
      if (edgeCount >= maxEdges) return; // Early termination
      
      const sectionKeywordsList = sectionKeywords.get(section.section_id) || [];
      
      for (const primitive of allPrimitives) {
        if (edgeCount >= maxEdges) break; // Early termination
        
        const primitiveText = this.getPrimitiveText(primitive);
        const primitiveKeywords = this.extractKeywords(primitiveText);
        
        const overlap = this.calculateKeywordOverlap(sectionKeywordsList, primitiveKeywords);
        if (overlap > 0.3) { // 30% keyword overlap threshold
          edges.push({
            id: `xref_${section.section_id}_${primitive.id || primitive.primitiveId}`,
            source: String(section.section_id),
            target: String(primitive.id || primitive.primitiveId),
            type: 'cross_reference',
            data: { 
              relationType: 'semantic_connection',
              strength: overlap > 0.6 ? 'strong' : overlap > 0.4 ? 'medium' : 'weak',
              overlap: overlap
            },
            style: {
              stroke: '#10b981',
              strokeWidth: overlap > 0.6 ? 2 : 1,
              strokeDasharray: '3,3'
            }
          });
          edgeCount++;
        }
      }
    });

    console.log(`Generated ${edgeCount} cross-reference edges`);
  }

  /**
   * Updates blueprint data with mindmap changes
   */
  updateBlueprintWithMindmap(bpJson: any, nodes: MindmapNode[], edges: MindmapEdge[], metadata?: any): any {
    const updatedJson = { ...bpJson };
    
    // Update section positions and properties
    if (Array.isArray(updatedJson.sections)) {
      nodes.forEach((node) => {
        if (node.type === 'section') {
          const section = updatedJson.sections.find((s: any) => s.section_id === node.id);
          if (section) {
            section.mindmap_position = node.position;
            // Update other properties if provided
            if (node.data?.difficulty) section.difficulty_level = node.data.difficulty;
            if (node.data?.timeEstimate) section.estimated_time_minutes = node.data.timeEstimate;
          }
        }
      });
    }

    // Update mindmap metadata
    if (metadata) {
      updatedJson.mindmap_metadata = {
        ...updatedJson.mindmap_metadata,
        ...metadata,
        last_updated: new Date().toISOString()
      };
    }

    // Update relationships based on edges
    if (Array.isArray(updatedJson.knowledge_primitives?.identified_relationships)) {
      const relationships = updatedJson.knowledge_primitives.identified_relationships;
      edges.forEach((edge) => {
        if (edge.type === 'prerequisite' || edge.data?.relationType === 'prerequisite') {
          // Find or create relationship
          const existingRel = relationships.find((r: any) => 
            r.source_primitive_id === edge.source && r.target_primitive_id === edge.target
          );
          if (!existingRel) {
            relationships.push({
              id: `${edge.source}->${edge.target}`,
              source_primitive_id: edge.source,
              target_primitive_id: edge.target,
              relationship_type: 'prerequisite'
            });
          }
        }
      });
    }

    return updatedJson;
  }

  /**
   * Helper methods for mindmap generation
   */
  private calculateDefaultPosition(index: number): { x: number; y: number } {
    // Arrange sections in a circle around the center
    const radius = 200;
    const angle = (index / 5) * 2 * Math.PI; // 5 sections per circle
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }

  private calculatePrimitivePosition(type: string, index: number, sectionCount: number): { x: number; y: number } {
    // Position primitives around their related sections
    const baseRadius = 300;
    const typeOffset = { proposition: 0, entity: 90, process: 180 }[type] || 0;
    const angle = ((index * 30) + typeOffset) * (Math.PI / 180);
    
    return {
      x: Math.cos(angle) * baseRadius,
      y: Math.sin(angle) * baseRadius
    };
  }

  private getDifficultyColor(difficulty: string): string {
    const colors = {
      beginner: '#10b981',      // Green
      intermediate: '#f59e0b',  // Amber
      advanced: '#ef4444'       // Red
    };
    return colors[difficulty as keyof typeof colors] || colors.beginner;
  }

  private getPrimitiveTypeColor(type: string): string {
    const colors = {
      proposition: '#8b5cf6',   // Purple
      entity: '#06b6d4',        // Cyan
      process: '#f97316'        // Orange
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }

  private adjustColorBrightness(hex: string, percent: number): string {
    // Simple color adjustment for borders
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  getDefaultColorScheme() {
    return {
      primary: '#3b82f6',
      secondary: '#10b981',
      tertiary: '#f59e0b',
      applications: '#8b5cf6',
      math: '#ef4444'
    };
  }

  getDefaultLayoutHints(): MindmapMetadata['layoutHints'] {
    return {
      orientation: 'radial',
      spacing: 'balanced',
      grouping: 'thematic'
    };
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Top 10 keywords
  }

  private getPrimitiveText(primitive: any): string {
    if (primitive.statement) return primitive.statement;
    if (primitive.entity) return primitive.entity;
    if (primitive.process_name) return primitive.process_name;
    if (primitive.title) return primitive.title;
    return String(primitive.id || '');
  }

  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    const intersection = keywords1.filter(k => keywords2.includes(k));
    return intersection.length / Math.max(keywords1.length, keywords2.length);
  }

  /**
   * Counts total items in a blueprint for performance decisions
   */
  private countBlueprintItems(bpJson: any): number {
    const sections = bpJson?.sections?.length || 0;
    const kp = bpJson?.knowledge_primitives ?? {};
    const primitives = 
      (kp.key_propositions_and_facts?.length || 0) +
      (kp.key_entities_and_definitions?.length || 0) +
      (kp.described_processes_and_steps?.length || 0);
    
    return sections + primitives;
  }
}

