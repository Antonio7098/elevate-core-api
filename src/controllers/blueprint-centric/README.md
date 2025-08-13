# Blueprint-Centric Controllers

## 🆕 NEW API CONTROLLERS - REPLACES LEGACY FOLDER/QUESTION SET ENDPOINTS

This directory contains the **new blueprint-centric controllers** that provide API endpoints for the simplified architecture.

## 🚀 API Endpoints

### Blueprint Section Management
```
POST   /api/sections                    - Create new section
GET    /api/sections/:id                - Get section with children
PUT    /api/sections/:id                - Update section
DELETE /api/sections/:id                - Delete section and children
```

### Section Hierarchy
```
GET    /api/sections/:id/tree           - Get complete section tree
POST   /api/sections/:id/move           - Move section to new parent
POST   /api/sections/:blueprintId/reorder - Reorder sections
```

### Section Content & Analytics
```
GET    /api/sections/:id/content        - Get section content (notes + questions)
GET    /api/sections/:id/stats          - Get section statistics
GET    /api/sections/:id/uue-progress   - Get UUE stage progression
```

### System Management
```
GET    /api/sections/:blueprintId/validate - Validate hierarchy integrity
POST   /api/sections/:blueprintId/optimize - Optimize hierarchy performance
GET    /api/user/content-stats          - Get user content statistics
```

## 🔄 Legacy Endpoint Mapping

| Old Endpoint | New Endpoint | Status |
|--------------|--------------|---------|
| `/api/folders/*` | `/api/sections/*` | ✅ Replaced |
| `/api/question-sets/*` | `/api/sections/:id/criteria/*` | ✅ Replaced |
| `/api/questions/*` | `/api/criteria/:id/questions/*` | ✅ Replaced |

## 📋 Controller Features

### BlueprintSectionController
- **CRUD Operations**: Full section management
- **Hierarchy Management**: Tree building, moving, reordering
- **Content Aggregation**: Notes, questions, and mastery tracking
- **UUE Integration**: Stage progression and learning pathways
- **Performance**: O(n) complexity for all operations

## 🔧 Integration Notes

### Authentication
- All endpoints require user authentication
- User ID extracted from `req.user.id`
- Section access controlled by user ownership

### Error Handling
- Comprehensive error messages for debugging
- HTTP status codes: 200, 201, 204, 400, 401, 404
- Validation errors include specific field information

### Performance
- Database queries optimized with proper indexing
- Tree operations use efficient algorithms
- Content aggregation supports lazy loading

## 🧪 Testing

### Unit Tests
- Controller methods tested individually
- Mock service dependencies
- Error scenarios covered

### Integration Tests
- Full API endpoint testing
- Database integration testing
- Authentication flow testing

## 📚 Related Services

- `BlueprintSectionService` - Core business logic
- `NoteSectionService` - Note management
- `MasteryCriterionService` - Question family management
- `ContentAggregator` - Content aggregation
- `SectionHierarchyManager` - Hierarchy management

## 🚀 Getting Started

1. **Import Controller**: Use the organized import from `services/blueprint-centric`
2. **Set Up Routes**: Map endpoints to controller methods
3. **Configure Middleware**: Add authentication and validation
4. **Test Endpoints**: Verify all functionality works
5. **Update Frontend**: Replace old API calls with new endpoints

---

**Last Updated**: Sprint 50 Implementation
**Status**: ✅ API Controllers Complete - Ready for Route Integration
