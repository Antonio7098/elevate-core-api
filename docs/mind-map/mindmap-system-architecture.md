# Mindmap System Architecture

## Overview

The new mindmap system eliminates data duplication by dynamically generating mindmaps directly from blueprint data instead of storing separate mindmap structures. This approach ensures consistency, reduces storage overhead, and enables real-time updates based on blueprint changes.

## Key Benefits

1. **Single Source of Truth**: All mindmap data is derived from the blueprint structure
2. **Automatic Consistency**: Mindmaps automatically reflect blueprint changes
3. **Reduced Storage**: No duplicate data storage
4. **Rich Metadata**: Leverages all available blueprint information for rich visualizations
5. **Position Persistence**: User-customized positions are preserved in the blueprint structure

## Architecture Components

### 1. MindmapService (`src/services/mindmap.service.ts`)

The core service responsible for:
- Building mindmaps from blueprint data
- Updating blueprint data with mindmap changes
- Managing node positioning and styling
- Building relationships and cross-references

#### Key Methods

- `buildMindmapFromBlueprint(bpJson)`: Generates complete mindmap from blueprint
- `updateBlueprintWithMindmap(bpJson, nodes, edges, metadata)`: Updates blueprint with mindmap changes
- `buildCrossReferenceEdges()`: Creates semantic connections based on keyword overlap

### 2. LearningBlueprintsController (`src/controllers/learning-blueprints.controller.ts`)

Handles HTTP requests and delegates to the MindmapService:
- `GET /api/blueprints/:id/mindmap`: Returns dynamically generated mindmap
- `PUT /api/blueprints/:id/mindmap`: Updates blueprint with mindmap changes

### 3. Data Flow

```
Blueprint JSON → MindmapService → Mindmap Data → Frontend
     ↑                                              ↓
     ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

## Mindmap Data Structure

### Nodes

```typescript
interface MindmapNode {
  id: string;
  type: 'section' | 'proposition' | 'entity' | 'process';
  data: {
    label: string;
    description?: string;
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
```

### Edges

```typescript
interface MindmapEdge {
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
```

## Node Types and Styling

### Sections
- **Beginner**: Green (`#10b981`) with thin border
- **Intermediate**: Amber (`#f59e0b`) with medium border
- **Advanced**: Red (`#ef4444`) with thick border (3px)

### Knowledge Primitives
- **Propositions**: Purple (`#8b5cf6`)
- **Entities**: Cyan (`#06b6d4`)
- **Processes**: Orange (`#f97316`)

### Edge Types
- **Prerequisites**: Red dashed lines (`#ef4444`, `5,5`)
- **Relationships**: Blue solid lines (`#3b82f6`)
- **Cross-references**: Green dotted lines (`#10b981`, `3,3`)

## Positioning Strategy

### Default Section Positioning
Sections are arranged in concentric circles:
- Radius: 200px
- 5 sections per circle
- Angular distribution: `(index / 5) * 2π`

### Primitive Positioning
Primitives are positioned around sections:
- Base radius: 300px
- Type-specific angular offsets:
  - Propositions: 0°
  - Entities: 90°
  - Processes: 180°
- Individual spacing: 30° per primitive

### Position Persistence
User-customized positions are stored in:
```json
{
  "sections": [
    {
      "section_id": "section1",
      "mindmap_position": { "x": 150, "y": 250 }
    }
  ]
}
```

## Relationship Building

### 1. Prerequisites
Directly mapped from `section.prerequisites` arrays

### 2. Knowledge Primitive Relationships
Mapped from `knowledge_primitives.identified_relationships`

### 3. Cross-References
Automatically generated based on keyword overlap:
- Extracts keywords from section names and descriptions
- Extracts keywords from primitive content
- Creates edges when overlap > 30%
- Uses semantic analysis for connection strength

## API Endpoints

### GET `/api/blueprints/:id/mindmap`
Returns a complete mindmap generated from blueprint data.

**Response:**
```json
{
  "blueprintId": "123",
  "version": 1,
  "nodes": [...],
  "edges": [...],
  "metadata": {
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "centralConcept": "Learning Blueprint",
    "colorScheme": {...},
    "layoutHints": {...}
  }
}
```

### PUT `/api/blueprints/:id/mindmap`
Updates blueprint data with mindmap changes.

**Request Body:**
```json
{
  "nodes": [...],
  "edges": [...],
  "metadata": {
    "centralConcept": "Updated Concept"
  }
}
```

## Migration from Old System

### Cleanup Script
Run the migration script to remove old separate mindmap data:

```bash
npm run cleanup-mindmaps cleanup
```

### What Gets Preserved
- User-customized node positions
- Section difficulty levels
- Time estimates
- Prerequisites

### What Gets Removed
- Separate `mindmap` property in `blueprintJson`
- Duplicate node/edge definitions
- Redundant styling information

## Testing

Comprehensive tests are available in `src/services/__tests__/mindmap.service.test.ts`:

```bash
npm test -- mindmap.service.test.ts
```

Test coverage includes:
- Mindmap generation from various blueprint structures
- Position calculation and preservation
- Edge building and relationship mapping
- Cross-reference generation
- Blueprint updates with mindmap changes

## Future Enhancements

### 1. AI-Powered Relationships
- Use embeddings for semantic similarity
- Generate relationships based on content analysis
- Suggest new connections

### 2. Advanced Layout Algorithms
- Force-directed graph layouts
- Hierarchical tree layouts
- User preference-based positioning

### 3. Interactive Features
- Drag-and-drop positioning
- Zoom and pan controls
- Search and filtering

### 4. Performance Optimizations
- Caching for large blueprints
- Lazy loading of node details
- Virtual scrolling for large mindmaps

## Troubleshooting

### Common Issues

1. **Empty Mindmap**: Check if blueprint has sections or knowledge primitives
2. **Missing Positions**: Verify `mindmap_position` data in sections
3. **No Edges**: Ensure prerequisites or relationships are defined
4. **Styling Issues**: Check difficulty levels and primitive types

### Debug Mode
Enable detailed logging in the MindmapService for troubleshooting:

```typescript
// Add to MindmapService constructor
this.debug = process.env.NODE_ENV === 'development';
```

## Performance Considerations

- **Small Blueprints** (< 50 nodes): Real-time generation
- **Medium Blueprints** (50-200 nodes): Consider caching
- **Large Blueprints** (> 200 nodes): Implement lazy loading

## Security

- All mindmap operations require user authentication
- Users can only access their own blueprints
- Input validation prevents malicious data injection
- Position data is sanitized to prevent XSS

## Monitoring

Track mindmap generation performance:
- Generation time per blueprint
- Node/edge counts
- User interaction patterns
- Error rates

## Conclusion

The new mindmap system provides a robust, scalable foundation for visualizing learning blueprints while maintaining data integrity and performance. By eliminating duplication and leveraging existing blueprint structure, it offers a more maintainable and feature-rich solution.
