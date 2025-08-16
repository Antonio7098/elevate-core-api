# Sprint 58: Core API Multi-Primitive Mastery Criteria Implementation

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Database schema updates and service layer modifications for multi-primitive mastery criteria
**Overview:** Transform the mastery criteria system from 1:1 primitive relationships to sophisticated many-to-many relationships that enable complex, interconnected learning objectives based on UUE stage complexity.

---

## I. Sprint Goals & Objectives

### Primary Goals:
1. Update database schema to support multi-primitive mastery criteria
2. Modify service layer for enhanced multi-primitive operations
3. Update API endpoints for new data structure
4. Ensure backward compatibility during transition
5. Implement comprehensive testing for new functionality

### Success Criteria:
- Mastery criteria can link to multiple primitives with relationship metadata
- UUE stage complexity progression (UNDERSTAND: 1-2, USE: 2-4, EXPLORE: 4+ primitives)
- Backward compatibility maintained for existing single-primitive criteria
- All existing tests pass with new schema
- New multi-primitive operations work correctly
- Performance remains acceptable with new relationship queries

---

## II. Planned Tasks & To-Do List

### **Task 1: Database Schema Updates**
- [ ] **Sub-task 1.1:** Create new junction table `MasteryCriterionPrimitive`
  - Add fields: `criterionId`, `primitiveId`, `relationshipType`, `weight`, `createdAt`, `updatedAt`
  - Add indexes for performance optimization
  - Add foreign key constraints with cascade delete

- [ ] **Sub-task 1.2:** Update `MasteryCriterion` table with complexity fields
  - Add `complexityLevel` enum field (UNDERSTAND, USE, EXPLORE)
  - Add `estimatedPrimitiveCount` integer field
  - Add `relationshipComplexity` float field for scoring

- [ ] **Sub-task 1.3:** Add new enums for relationship types and complexity levels
  - `PrimitiveRelationshipType`: PRIMARY, SECONDARY, CONTEXTUAL
  - `ComplexityLevel`: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  - `RelationshipStrength`: WEAK, MODERATE, STRONG

- [ ] **Sub-task 1.4:** Create database migration scripts
  - Create migration for new table and fields
  - Add data migration script for existing single-primitive criteria
  - Test migration rollback procedures

- [ ] **Sub-task 1.5:** Update Prisma schema and regenerate client
  - Update schema.prisma with new models and relationships
  - Regenerate Prisma client
  - Update TypeScript types throughout codebase

### **Task 2: Service Layer Updates**
- [ ] **Sub-task 2.1:** Update `MasteryCriterionService` for multi-primitive operations
  - Add `linkPrimitiveToCriterion()` method
  - Add `unlinkPrimitiveFromCriterion()` method
  - Add `getCriterionWithPrimitives()` method
  - Add `updatePrimitiveRelationships()` method

- [ ] **Sub-task 2.2:** Modify `MasteryTrackingService` for enhanced progress tracking
  - Update progress calculation for multi-primitive criteria
  - Add `getMultiPrimitiveProgress()` method
  - Enhance UUE stage progression logic
  - Add relationship strength weighting

- [ ] **Sub-task 2.3:** Update `EnhancedSpacedRepetitionService` for multi-primitive criteria
  - Modify review scheduling for complex criteria
  - Update mastery threshold calculations
  - Enhance progress tracking across multiple primitives
  - Add relationship-based review prioritization

- [ ] **Sub-task 2.4:** Enhance `BlueprintCentricService` for multi-primitive generation
  - Add `generateMultiPrimitiveCriteria()` method
  - Implement relationship validation logic
  - Add complexity scoring algorithms
  - Enhance dependency mapping

### **Task 3: API Endpoint Updates**
- [ ] **Sub-task 3.1:** Update mastery criterion CRUD endpoints
  - Modify `POST /mastery-criteria` to accept primitive arrays
  - Update `PUT /mastery-criteria/:id` for relationship management
  - Add `GET /mastery-criteria/:id/primitives` endpoint
  - Add `POST /mastery-criteria/:id/primitives` for linking

- [ ] **Sub-task 3.2:** Add endpoints for primitive relationship management
  - `POST /mastery-criteria/:id/primitives/:primitiveId` - Link primitive
  - `DELETE /mastery-criteria/:id/primitives/:primitiveId` - Unlink primitive
  - `PUT /mastery-criteria/:id/primitives/:primitiveId` - Update relationship
  - `GET /mastery-criteria/:id/relationships` - Get all relationships

- [ ] **Sub-task 3.3:** Enhance validation endpoints for multi-primitive criteria
  - Add `POST /mastery-criteria/validate` endpoint
  - Implement circular dependency detection
  - Add prerequisite chain validation
  - Add complexity level validation

- [ ] **Sub-task 3.4:** Update progress tracking endpoints
  - Modify `GET /mastery-progress/:criterionId` for multi-primitive
  - Add `GET /mastery-progress/multi-primitive/:criterionId` endpoint
  - Update progress calculation algorithms
  - Add relationship strength weighting

### **Task 4: Testing and Validation**
- [ ] **Sub-task 4.1:** Update existing test suites for new schema
  - Modify unit tests for updated services
  - Update integration tests for new endpoints
  - Ensure all existing functionality still works
  - Add tests for backward compatibility

- [ ] **Sub-task 4.2:** Create tests for multi-primitive operations
  - Test primitive linking/unlinking operations
  - Test relationship validation logic
  - Test complexity scoring algorithms
  - Test UUE stage progression with multiple primitives

- [ ] **Sub-task 4.3:** Test backward compatibility with existing data
  - Verify single-primitive criteria still work
  - Test data migration scripts
  - Ensure existing progress tracking continues to function
  - Validate API responses remain compatible

- [ ] **Sub-task 4.4:** Performance testing for complex queries
  - Test query performance with multiple primitives
  - Optimize database queries for relationship lookups
  - Add database indexes where needed
  - Test bulk operations performance

---

## III. Technical Details

### Database Schema Changes

#### **New Junction Table: MasteryCriterionPrimitive**
```sql
CREATE TABLE "MasteryCriterionPrimitive" (
  "id" SERIAL PRIMARY KEY,
  "criterionId" INTEGER NOT NULL,
  "primitiveId" TEXT NOT NULL,
  "relationshipType" "PrimitiveRelationshipType" NOT NULL DEFAULT 'PRIMARY',
  "weight" FLOAT NOT NULL DEFAULT 1.0,
  "strength" FLOAT NOT NULL DEFAULT 0.8,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  FOREIGN KEY ("criterionId") REFERENCES "MasteryCriterion"("id") ON DELETE CASCADE,
  FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE,
  
  UNIQUE("criterionId", "primitiveId")
);

-- Indexes for performance
CREATE INDEX "idx_mastery_criterion_primitive_criterion" ON "MasteryCriterionPrimitive"("criterionId");
CREATE INDEX "idx_mastery_criterion_primitive_primitive" ON "MasteryCriterionPrimitive"("primitiveId");
CREATE INDEX "idx_mastery_criterion_primitive_type" ON "MasteryCriterionPrimitive"("relationshipType");
```

#### **Updated MasteryCriterion Table**
```sql
ALTER TABLE "MasteryCriterion" 
ADD COLUMN "complexityLevel" "ComplexityLevel" DEFAULT 'INTERMEDIATE',
ADD COLUMN "estimatedPrimitiveCount" INTEGER DEFAULT 1,
ADD COLUMN "relationshipComplexity" FLOAT DEFAULT 1.0,
ADD COLUMN "maxPrimitives" INTEGER DEFAULT 10;

-- Remove the old single primitive relationship
-- ALTER TABLE "MasteryCriterion" DROP COLUMN "knowledgePrimitiveId";
-- Note: This will be done in a separate migration after data migration
```

#### **New Enums**
```sql
CREATE TYPE "PrimitiveRelationshipType" AS ENUM (
  'PRIMARY',      -- Core concept being tested
  'SECONDARY',    -- Supporting concept
  'CONTEXTUAL'    -- Background context
);

CREATE TYPE "ComplexityLevel" AS ENUM (
  'BEGINNER',     -- 1-2 primitives
  'INTERMEDIATE', -- 2-4 primitives  
  'ADVANCED',     -- 4-6 primitives
  'EXPERT'        -- 6+ primitives
);

CREATE TYPE "RelationshipStrength" AS ENUM (
  'WEAK',         -- 0.0-0.3
  'MODERATE',     -- 0.4-0.7
  'STRONG'        -- 0.8-1.0
);
```

### Service Layer Updates

#### **Enhanced MasteryCriterionService**
```typescript
export class MasteryCriterionService {
  // New methods for multi-primitive operations
  async linkPrimitiveToCriterion(
    criterionId: number,
    primitiveId: string,
    relationshipType: PrimitiveRelationshipType = 'PRIMARY',
    weight: number = 1.0
  ): Promise<MasteryCriterionPrimitive> {
    // Implementation for linking primitives to criteria
  }

  async unlinkPrimitiveFromCriterion(
    criterionId: number,
    primitiveId: string
  ): Promise<boolean> {
    // Implementation for unlinking primitives from criteria
  }

  async getCriterionWithPrimitives(
    criterionId: number
  ): Promise<MasteryCriterionWithPrimitives> {
    // Implementation for getting criterion with all linked primitives
  }

  async updatePrimitiveRelationships(
    criterionId: number,
    relationships: PrimitiveRelationshipUpdate[]
  ): Promise<MasteryCriterionWithPrimitives> {
    // Implementation for bulk updating primitive relationships
  }

  async validateMultiPrimitiveCriterion(
    criterion: CreateMasteryCriterionDto
  ): Promise<ValidationResult> {
    // Implementation for validating multi-primitive criteria
  }
}
```

#### **Enhanced MasteryTrackingService**
```typescript
export class MasteryTrackingService {
  // Enhanced progress tracking for multi-primitive criteria
  async getMultiPrimitiveProgress(
    userId: number,
    criterionId: number
  ): Promise<MultiPrimitiveProgress> {
    // Implementation for tracking progress across multiple primitives
  }

  async calculateUueStageProgression(
    userId: number,
    criterionId: number
  ): Promise<StageProgressionResult> {
    // Enhanced UUE stage progression logic
  }

  async getRelationshipStrength(
    criterionId: number,
    primitiveId: string
  ): Promise<number> {
    // Get relationship strength between criterion and primitive
  }
}
```

### API Endpoint Updates

#### **New Endpoints for Multi-Primitive Operations**
```typescript
// Mastery Criterion with Primitives
router.post('/mastery-criteria/:id/primitives', 
  masteryCriterionController.linkPrimitiveToCriterion);

router.delete('/mastery-criteria/:id/primitives/:primitiveId',
  masteryCriterionController.unlinkPrimitiveFromCriterion);

router.put('/mastery-criteria/:id/primitives/:primitiveId',
  masteryCriterionController.updatePrimitiveRelationship);

router.get('/mastery-criteria/:id/primitives',
  masteryCriterionController.getCriterionPrimitives);

// Validation and Analysis
router.post('/mastery-criteria/validate',
  masteryCriterionController.validateMultiPrimitiveCriterion);

router.get('/mastery-criteria/:id/relationships',
  masteryCriterionController.getCriterionRelationships);

// Enhanced Progress Tracking
router.get('/mastery-progress/multi-primitive/:criterionId',
  masteryTrackingController.getMultiPrimitiveProgress);
```

---

## IV. Data Migration Strategy

### **Phase 1: Schema Preparation**
1. Add new tables and fields alongside existing ones
2. Create indexes for performance optimization
3. Ensure backward compatibility during transition

### **Phase 2: Data Migration**
1. Create migration script to populate new junction table
2. Migrate existing single-primitive criteria to new structure
3. Set default relationship types and weights
4. Validate data integrity after migration

### **Phase 3: Service Updates**
1. Update services to handle both old and new models
2. Implement dual-mode operation during transition
3. Add feature flags for gradual rollout
4. Monitor performance and error rates

### **Phase 4: Cleanup**
1. Remove old single-primitive fields after validation
2. Clean up deprecated code paths
3. Update documentation and examples
4. Archive migration scripts

---

## V. Testing Strategy

### **Unit Testing**
- Test all new service methods with mocked dependencies
- Verify relationship validation logic
- Test complexity scoring algorithms
- Validate UUE stage progression rules

### **Integration Testing**
- Test API endpoints with real database
- Verify relationship creation and deletion
- Test backward compatibility
- Validate data migration scripts

### **Performance Testing**
- Test query performance with multiple primitives
- Verify database index effectiveness
- Test bulk operations performance
- Monitor memory usage with complex relationships

### **Backward Compatibility Testing**
- Ensure existing single-primitive criteria work
- Verify progress tracking continues to function
- Test existing API responses remain compatible
- Validate data migration doesn't break existing functionality

---

## VI. Risk Assessment & Mitigation

### **High Risk Items**
1. **Data Migration Complexity**: Complex migration from single to multi-primitive
   - *Mitigation*: Thorough testing, rollback procedures, gradual rollout

2. **Performance Impact**: New relationship queries may be slower
   - *Mitigation*: Database optimization, caching, performance monitoring

3. **Backward Compatibility**: Risk of breaking existing functionality
   - *Mitigation*: Dual-mode operation, comprehensive testing, feature flags

### **Medium Risk Items**
1. **API Changes**: Breaking changes to existing endpoints
   - *Mitigation*: Versioned APIs, deprecation warnings, migration guides

2. **Service Dependencies**: Multiple services need updates
   - *Mitigation*: Incremental updates, dependency injection, interface stability

### **Low Risk Items**
1. **New Features**: Additional functionality doesn't affect existing features
   - *Mitigation*: Feature flags, gradual rollout, user feedback

---

## VII. Success Metrics

### **Functional Metrics**
- [ ] All existing tests pass with new schema
- [ ] New multi-primitive operations work correctly
- [ ] Backward compatibility maintained
- [ ] Data migration completes successfully

### **Performance Metrics**
- [ ] Query performance within 20% of baseline
- [ ] Memory usage remains stable
- [ ] API response times acceptable
- [ ] Database index effectiveness validated

### **Quality Metrics**
- [ ] Code coverage >90% for new functionality
- [ ] No critical bugs in production
- [ ] User acceptance testing passed
- [ ] Documentation updated and accurate

---

## VIII. Dependencies & Blockers

### **Dependencies**
- Prisma schema updates and client regeneration
- Database migration scripts
- Service layer refactoring
- API endpoint updates

### **Blockers**
- None identified at this time

### **External Dependencies**
- Database migration approval
- Performance testing environment
- User acceptance testing participants

---

## IX. Next Steps

### **Immediate Next Steps (Next Sprint)**
1. Implement advanced relationship management features
2. Add performance optimization and caching
3. Implement analytics and reporting features
4. Add user interface for relationship management

### **Future Considerations**
1. AI-powered relationship suggestion engine
2. Advanced analytics for learning path optimization
3. Machine learning for complexity scoring
4. Integration with external learning systems

---

**Sprint Status:** [To be filled out by Antonio after work is done]
**Completion Date:** [To be filled out by Antonio after work is done]
**Notes:** [To be filled out by Antonio after work is done]
