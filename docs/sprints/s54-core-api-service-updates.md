# Sprint 54: Core API Service Updates - Blueprint-Centric Transformation

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Replace Existing Services with New Blueprint-Centric Versions
**Overview:** Transform all existing Core API services to use the new blueprint-centric architecture. Replace folder-based logic with section-based organization, update primitive-based tracking with criterion-based mastery, and implement new spaced repetition algorithms.

---

## I. Sprint Goals & Objectives

### Primary Goals:
1. **Replace primitiveSR.service.ts** with new enhancedSpacedRepetition.service.ts
2. **Replace todaysTasks.service.ts** with new enhancedTodaysTasks.service.ts  
3. **Replace recursiveFolder.service.ts** with new sectionHierarchyManager.service.ts
4. **Replace advancedSpacedRepetition.service.ts** with new masteryTracking.service.ts
5. **Replace batchReviewProcessing.service.ts** with new enhancedBatchReview.service.ts

### Success Criteria:
- All 5 core services fully replaced and functional
- New services maintain same API contracts for backward compatibility
- Comprehensive test coverage for all new services
- Performance benchmarks meet targets (<200ms section operations, <500ms mastery calculations)
- All existing endpoints continue to work with new service implementations

---

## I. Planned Tasks & To-Do List (Derived from Service Analysis)

*Instructions for Antonio: Review the comprehensive analysis of what needs to be updated in the Core API. Break down each distinct step or deliverable into a checkable to-do item below. Be specific.*

- [ ] **Task 1:** Replace primitiveSR.service.ts with enhancedSpacedRepetition.service.ts
    - *Sub-task 1.1:* Create new enhancedSpacedRepetition.service.ts with criterion-based logic
    - *Sub-task 1.2:* Implement consecutive interval mastery (2 intervals above threshold, different days)
    - *Sub-task 1.3:* Add progressive failure handling (fail once = back one stage, fail twice = back to start)
    - *Sub-task 1.4:* Implement tracking intensity multipliers (DENSE 0.7×, NORMAL 1×, SPARSE 1.5×)
    - *Sub-task 1.5:* Replace complex UUE multipliers with simple base intervals × tracking intensity
    - *Sub-task 1.6:* Update question selection to use section-based organization instead of folders
- [ ] **Task 2:** Replace todaysTasks.service.ts with enhancedTodaysTasks.service.ts
    - *Sub-task 2.1:* Create new enhancedTodaysTasks.service.ts with section-based logic
    - *Sub-task 2.2:* Replace QuestionSet-based logic with direct criterion-based logic
    - *Sub-task 2.3:* Implement capacity-based bucket filling (Critical → Core → Plus, stop when full)
    - *Sub-task 2.4:* Add UUE stage progression in daily tasks (show next stage questions in plus bucket)
    - *Sub-task 2.5:* Implement infinite "Generate More" functionality for additional questions
    - *Sub-task 2.6:* Add capacity gap analysis with user recommendations
- [ ] **Task 3:** Replace recursiveFolder.service.ts with sectionHierarchyManager.service.ts
    - *Sub-task 3.1:* Create new sectionHierarchyManager.service.ts for blueprint section trees
    - *Sub-task 3.2:* Implement section tree building with O(n) complexity
    - *Sub-task 3.3:* Add section hierarchy validation and circular reference prevention
    - *Sub-task 3.4:* Replace folder-based content aggregation with section-based aggregation
    - *Sub-task 3.5:* Add section depth calculation and ordering logic
    - *Sub-task 3.6:* Implement section movement and reordering operations
- [ ] **Task 4:** Replace advancedSpacedRepetition.service.ts with masteryTracking.service.ts
    - *Sub-task 4.1:* Create new masteryTracking.service.ts for criterion-based mastery
    - *Sub-task 4.2:* Implement user-configurable mastery thresholds (SURVEY 60%, PROFICIENT 80%, EXPERT 95%)
    - *Sub-task 4.3:* Add UUE stage progression validation logic
    - *Sub-task 4.4:* Implement weighted mastery calculations for stage and primitive levels
    - *Sub-task 4.5:* Add mastery threshold customization per section/primitive
    - *Sub-task 4.6:* Replace QuestionSet-based review processing with criterion-based processing
- [ ] **Task 5:** Replace batchReviewProcessing.service.ts with enhancedBatchReview.service.ts
    - *Sub-task 5.1:* Create new enhancedBatchReview.service.ts for criterion-based processing
    - *Sub-task 5.2:* Implement consecutive interval mastery checking in batch operations
    - *Sub-task 5.3:* Add UUE stage progression updates for batch processing
    - *Sub-task 5.4:* Enhance performance metrics for criterion-based operations
    - *Sub-task 5.5:* Add batch validation for mastery threshold requirements
    - *Sub-task 5.6:* Implement optimized database operations for criterion updates
- [ ] **Task 6:** Create new masteryCalculation.service.ts
    - *Sub-task 6.1:* Implement criterion mastery calculation (last 2 attempts average)
    - *Sub-task 6.2:* Add UUE stage mastery calculation (weighted average of criterion mastery)
    - *Sub-task 6.3:* Implement primitive mastery calculation (all stages must be mastered)
    - *Sub-task 6.4:* Add weighted average calculations with criterion importance weights
    - *Sub-task 6.5:* Implement mastery progression tracking and validation
    - *Sub-task 6.6:* Add caching layer for frequently accessed mastery scores
- [ ] **Task 7:** Create new UUE stage progression service
    - *Sub-task 7.1:* Implement stage progression validation logic
    - *Sub-task 7.2:* Add prerequisite checking for stage advancement
    - *Sub-task 7.3:* Create stage unlocking and progression tracking
    - *Sub-task 7.4:* Implement stage transition requirements and validation
    - *Sub-task 7.5:* Add stage progression analytics and reporting
    - *Sub-task 7.6:* Implement stage-based content filtering and recommendations
- [ ] **Task 8:** Update existing service dependencies and injection patterns
    - *Sub-task 8.1:* Update service imports and dependencies throughout the codebase
    - *Sub-task 8.2:* Modify service injection patterns for new services
    - *Sub-task 8.3:* Update service factory patterns and dependency injection
    - *Sub-task 8.4:* Ensure all services use consistent interface patterns
    - *Sub-task 8.5:* Add service health checks and monitoring
    - *Sub-task 8.6:* Implement service error handling and fallback strategies
- [ ] **Task 9:** Comprehensive testing for all new services
    - *Sub-task 9.1:* Create unit tests for all new service methods
    - *Sub-task 9.2:* Add integration tests for service interactions
    - *Sub-task 9.3:* Implement performance tests for section operations and mastery calculations
    - *Sub-task 9.4:* Add load testing for daily task generation and batch processing
    - *Sub-task 9.5:* Create end-to-end tests for complete mastery tracking flow
    - *Sub-task 9.6:* Add regression tests to ensure existing functionality remains intact

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below. If multiple tasks are done in one go, you can summarize them together but reference the task numbers.*

**Regarding Task 1: [Replace primitiveSR.service.ts with enhancedSpacedRepetition.service.ts]**
* **Summary of Implementation:**
    * [Agent describes what was built/changed, key functions created/modified, logic implemented]
* **Key Files Modified/Created:**
    * `src/services/enhancedSpacedRepetition.service.ts`
    * `src/services/primitiveSR.service.ts` (updated to use new service)
* **Notes/Challenges Encountered (if any):**
    * [Agent notes any difficulties, assumptions made, or alternative approaches taken]

**Regarding Task 2: [Replace todaysTasks.service.ts with enhancedTodaysTasks.service.ts]**
* **Summary of Implementation:**
    * [...]
* **Key Files Modified/Created:**
    * [...]
* **Notes/Challenges Encountered (if any):**
    * [...]

**(Agent continues for all completed tasks...)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio after work is done)

**1. Key Accomplishments this Sprint:**
    * [List what was successfully completed and tested]
    * [Highlight major breakthroughs or features implemented]

**2. Deviations from Original Plan/Prompt (if any):**
    * [Describe any tasks that were not completed, or were changed from the initial plan. Explain why.]
    * [Note any features added or removed during the sprint.]

**3. New Issues, Bugs, or Challenges Encountered:**
    * [List any new bugs found, unexpected technical hurdles, or unresolved issues.]

**4. Key Learnings & Decisions Made:**
    * [What did you learn during this sprint? Any important architectural or design decisions made?]

**5. Blockers (if any):**
    * [Is anything preventing progress on the next steps?]

**6. Next Steps Considered / Plan for Next Sprint:**
    * [Briefly outline what seems logical to tackle next based on this sprint's outcome.]

**Sprint Status:** [e.g., Fully Completed, Partially Completed - X tasks remaining, Completed with modifications, Blocked]

---

## IV. Technical Architecture Details

### A. Service Replacement Strategy

#### 1. Enhanced Spaced Repetition Service
```typescript
interface EnhancedSpacedRepetitionService {
  // Simple interval calculation
  calculateNextReviewInterval(
    currentIntervalStep: number,
    isCorrect: boolean,
    trackingIntensity: TrackingIntensity
  ): ReviewSchedule;
  
  // Mastery progression
  processReviewOutcome(userId: number, criterionId: string, isCorrect: boolean): Promise<void>;
  updateCriterionSchedule(userId: number, criterionId: string, nextInterval: ReviewSchedule): Promise<void>;
  
  // Tracking intensity management
  updateTrackingIntensity(userId: number, criterionId: string, intensity: TrackingIntensity): Promise<void>;
}
```

#### 2. Enhanced Today's Tasks Service
```typescript
interface EnhancedTodaysTasksService {
  // Section-based task generation
  generateTodaysTasksForUser(userId: number): Promise<TodaysTasksResponse>;
  getDueSectionsForUser(userId: number): Promise<BlueprintSection[]>;
  
  // UUE stage balancing
  balanceUueStages(tasks: TaskBuckets, userPreferences: UserPreferences): Promise<BalancedTasks>;
  
  // Task categorization
  categorizeTasksByPriority(dueCriteria: MasteryCriterion[]): TaskBuckets;
  generateQuestionTasks(balancedTasks: BalancedTasks, userId: number): Promise<QuestionTasks>;
}
```

### B. Performance Targets

#### 1. Response Time Targets
- **Section Operations**: <200ms
- **Mastery Calculations**: <500ms
- **Daily Task Generation**: <1s
- **Batch Processing**: <2s for 100 items

#### 2. Scalability Targets
- **Maximum Sections per Blueprint**: 1000
- **Maximum Criteria per Section**: 100
- **Batch Processing**: 1000 items per batch
- **Concurrent Users**: 100+ simultaneous operations

---

## V. Dependencies & Risks

### A. Dependencies
- **Sprint 50**: Database schema foundation and BlueprintSection models
- **Sprint 51**: Knowledge graph foundation and RAG integration
- **Sprint 52**: Mastery tracking system design and algorithms
- **Sprint 53**: AI API blueprint-centric updates

### B. Risks & Mitigation
1. **Service Integration Risk**: New services might not integrate well with existing controllers
   - **Mitigation**: Maintain same API contracts, extensive testing, gradual replacement
2. **Performance Risk**: New algorithms could be slower than existing ones
   - **Mitigation**: Performance benchmarks, optimization, caching strategies
3. **Breaking Changes Risk**: Service replacement could break existing functionality
   - **Mitigation**: Comprehensive testing, backward compatibility, rollback strategy

---

## VI. Testing Strategy

### A. Unit Tests
- [ ] All new service methods with mocked dependencies
- [ ] Algorithm logic and edge case handling
- [ ] Data validation and error handling
- [ ] Performance benchmarks for critical operations

### B. Integration Tests
- [ ] Service interactions and dependencies
- [ ] Complete mastery tracking flow
- [ ] Daily task generation with new system
- [ ] Batch processing operations

### C. Performance Tests
- [ ] Section operations with 1000+ sections
- [ ] Mastery calculations with large datasets
- [ ] Daily task generation under load
- [ ] Batch processing performance

---

## VII. Deliverables

### A. Code Deliverables
- [ ] All 5 new enhanced services implemented
- [ ] Service dependencies updated throughout codebase
- [ ] Comprehensive test coverage for all services
- [ ] Performance benchmarks and optimization

### B. Documentation Deliverables
- [ ] Updated service architecture documentation
- [ ] API contract documentation
- [ ] Performance optimization guide
- [ ] Service integration guide

### C. Testing Deliverables
- [ ] Comprehensive test suite
- [ ] Performance benchmarks
- [ ] Integration test reports
- [ ] Load testing results

---

## VIII. Success Metrics

### A. Functional Metrics
- [ ] 100% of core services replaced and functional
- [ ] All existing endpoints continue to work
- [ ] New services meet performance targets
- [ ] Comprehensive test coverage >90%

### B. Performance Metrics
- [ ] Section operations <200ms
- [ ] Mastery calculations <500ms
- [ ] Daily task generation <1s
- [ ] Batch processing <2s for 100 items

### C. Quality Metrics
- [ ] Zero critical bugs in new services
- [ ] All performance targets met
- [ ] Backward compatibility maintained
- [ ] Test coverage >90%

---

## IX. Sprint Retrospective

**Sprint Status:** [To be filled out after completion]

**What Went Well:**
- [List successful implementations and achievements]

**What Could Be Improved:**
- [List areas for improvement and lessons learned]

**Action Items for Next Sprint:**
- [List next steps and future improvements]

**Team Velocity:** [X] story points completed (out of [Y] planned)

