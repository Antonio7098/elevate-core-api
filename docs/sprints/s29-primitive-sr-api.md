# Sprint 29: Primitive-Centric SR - API, AI Integration & Deprecation

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - API Endpoints & AI Integration
**Overview:** This sprint focuses on exposing the new primitive-centric SR system through the API. It involves creating new endpoints for handling primitive-based reviews, updating controllers to use the new services, integrating the AI service to generate primitives directly into the new database structure, and formally deprecating the old `QuestionSet`-based review system.

---

## I. Planned Tasks & To-Do List

- [x] **Task 1: Create New Primitive-Centric API Endpoints** ✅ **COMPLETED**
    - [x] *Sub-task 1.1:* Create a new `primitive.controller.ts` and `primitive.routes.ts` ✅
    - [x] *Sub-task 1.2:* Implement `POST /api/primitives/review` with batch processing and performance metrics ✅
    - [x] *Sub-task 1.3:* Implement `POST /api/primitives/:id/tracking` to toggle tracking status ✅
    - [x] *Sub-task 1.4:* Implement `GET /api/primitives` (with pagination) and `GET /api/primitives/:id/details` ✅
        ```typescript
        // Response should include weighted mastery calculation
        interface PrimitiveDetailsResponse {
          id: number;
          title: string;
          currentUeeLevel: string;
          nextReviewAt: Date;
          criteria: {
            id: number;
            description: string;
            ueeLevel: string;
            weight: number;      // 1-5 scale
            difficulty: number;  // 1-3 scale
            isMastered: boolean;
          }[];
          weightedMasteryScore: number; // 0-1 calculated score
          canProgressToNext: boolean;
        }
        ```
    - [x] *Sub-task 1.5:* Implement tracking intensity management API endpoints (POST/GET/DELETE) ✅
        ```typescript
        @Post('/api/primitives/:id/tracking-intensity')
        async setTrackingIntensity(
          @Param('id') primitiveId: number,
          @Body() trackingIntensity: { intensity: number },
          @User() user
        ): Promise<{ success: boolean }> {
          await this.trackingIntensityService.setTrackingIntensity(user.id, primitiveId, trackingIntensity.intensity);
          return { success: true };
        }

        @Get('/api/primitives/:id/tracking-intensity')
        async getTrackingIntensity(
          @Param('id') primitiveId: number,
          @User() user
        ): Promise<{ intensity: number }> {
          const intensity = await this.trackingIntensityService.getTrackingIntensity(user.id, primitiveId);
          return { intensity };
        }

        @Delete('/api/primitives/:id/tracking-intensity')
        async deleteTrackingIntensity(
          @Param('id') primitiveId: number,
          @User() user
        ): Promise<{ success: boolean }> {
          await this.trackingIntensityService.deleteTrackingIntensity(user.id, primitiveId);
          return { success: true };
        }
        ```

- [x] **Task 2: Update Existing Controllers and Routes** ✅ **COMPLETED**
    - [x] *Sub-task 2.1:* Refactor `todaysTasks.controller.ts` to use `generateDailyTasks` from primitive SR service ✅
    - [x] *Sub-task 2.2:* Review routes already disabled/deprecated (review.controller.ts.disabled) ✅
    - [x] *Sub-task 2.3:* Update `stats.controller.ts` with primitive-centric stats and deprecate folder stats ✅

- [ ] **Task 3: Evolve AI API Integration**
    - [x] *Sub-task 3.1:* Refactor AI generation services to create primitives directly ✅
    - *Sub-task 3.2:* Modify the blueprint processing logic. When the AI deconstructs a source material, the service will now create `KnowledgePrimitive` and `MasteryCriterion` records directly in the database.
    - *Sub-task 3.3:* Generated `Question` records will be linked to their corresponding `MasteryCriterion`.
    - *Sub-task 3.4:* Update the `ai.controller.ts` or `ai-rag.controller.ts` to trigger this new, more integrated generation flow.

- [x] **Task 4: Integration and End-to-End Testing** ✅
    - [x] *Sub-task 4.1:* Create a new integration test file `primitive.routes.test.ts` ✅
    - [x] *Sub-task 4.2:* Write tests for all new primitive endpoints (`POST /review`, `POST /:id/tracking`, `GET /`, `GET /:id/details`), covering success cases, authorization, and error handling ✅
    - [x] *Sub-task 4.3:* Update the integration tests for `todaysTasks.routes.test.ts` to assert on the new response structure ✅
    - [x] *Sub-task 4.4:* Create a new end-to-end test that covers the entire lifecycle ✅:
        1. ✅ Direct primitive creation (bypassing AI for test stability)
        2. ✅ The primitive appears in "Today's Tasks" with questions
        3. ✅ The user submits a review for the primitive
        4. ✅ Verify the `UserPrimitiveProgress` and `UserCriterionMastery` are updated correctly
        5. ✅ Test primitive tracking toggle functionality
        6. ✅ Comprehensive error scenario handling

- [ ] **Task 5: Deprecation and Documentation**
    - *Sub-task 5.1:* Mark all routes under `/api/reviews/` as deprecated in the Swagger/OpenAPI documentation.
    - *Sub-task 5.2:* Add logging to the deprecated endpoints to monitor any continued usage.
    - *Sub-task 5.3:* Update the API documentation to reflect the new primitive-centric endpoints and deprecate the old ones.

- [ ] **Task 6: Performance Optimization & Caching Integration**
    - *Sub-task 6.1:* Implement fast daily tasks endpoint using denormalized summary data.
        ```typescript
        // Fast daily tasks query using summary table
        @Get('/api/primitives/due')
        async getDailyTasks(@User() user): Promise<DailyTaskResponse[]> {
          const tasks = await this.cachedPrimitiveService.getDailyTasks(user.id);
          return tasks.map(task => ({
            primitiveId: task.primitiveId,
            title: task.primitiveTitle,
            currentUeeLevel: task.currentUeeLevel,
            weightedMasteryScore: task.weightedMasteryScore,
            questions: task.questions // Loaded separately if needed
          }));
        }
        ```
    - *Sub-task 6.2:* Add caching middleware for expensive API operations.
        ```typescript
        @UseInterceptors(CacheInterceptor)
        ```

## 🤖 **Agents Implementation: AI-Powered Primitive Generation System**

### **Overview**
The primitive-centric spaced repetition system leverages AI agents to automatically generate structured knowledge primitives, mastery criteria, and assessment questions from source materials. This represents a significant evolution from manual content creation to intelligent, automated knowledge structuring.

### **Agent Architecture**

#### **1. Primitive Generation Agent**
**Service**: `PrimitiveAIService`  
**Endpoint**: `POST /api/ai/primitives/from-source`

**Capabilities**:
- **Source Analysis**: Analyzes raw text content to identify discrete knowledge concepts
- **Primitive Extraction**: Breaks down complex topics into atomic learning units
- **Difficulty Assessment**: Automatically assigns difficulty levels (beginner/intermediate/advanced)
- **Type Classification**: Categorizes primitives as facts, concepts, or processes
- **Time Estimation**: Provides learning time estimates for each primitive

**Agent Workflow**:
```typescript
// AI Agent Request Structure
{
  source_text: string,
  title?: string,
  description?: string,
  subject_area?: string,
  max_primitives: 5,
  include_questions: true,
  include_criteria: true
}

// AI Agent Response Structure
{
  primitives: [{
    title: "Photosynthesis Process",
    description: "The biological process by which plants convert light energy into chemical energy",
    primitive_type: "process",
    difficulty_level: "intermediate",
    estimated_time_minutes: 15,
    criteria: [...],
    questions: [...]
  }]
}
```

#### **2. Mastery Criteria Generation Agent**
**Integration**: Embedded within primitive generation  
**Purpose**: Creates UEE (Understand, Use, Explore) progression criteria

**Agent Intelligence**:
- **UEE Level Mapping**: Automatically assigns criteria to appropriate UEE levels
- **Weight Distribution**: Balances criterion importance using weighted scoring
- **Difficulty Calibration**: Adjusts criterion difficulty for optimal learning progression
- **Dependency Analysis**: Identifies prerequisite relationships between criteria

**Generated Criteria Structure**:
```typescript
{
  title: "Identify photosynthesis inputs",
  description: "Recognize the raw materials needed for photosynthesis",
  uee_level: "UNDERSTAND",
  weight: 1.2,
  difficulty: 0.8,
  mastery_threshold: "PROFICIENT"
}
```

#### **3. Question Generation Agent**
**Status**: Placeholder implementation (schema limitations)  
**Future Capability**: Generates criterion-specific assessment questions

**Planned Features**:
- **Question Type Diversity**: Multiple choice, short answer, essay questions
- **Difficulty Progression**: Questions aligned with mastery levels
- **Criterion Mapping**: Direct linkage between questions and specific criteria
- **Adaptive Assessment**: Dynamic question selection based on user performance

#### **4. Enhancement Agent**
**Service**: `PrimitiveAIService.enhancePrimitive()`  
**Endpoint**: `POST /api/ai/primitives/:id/enhance`

**Capabilities**:
- **Iterative Improvement**: Adds new criteria or questions to existing primitives
- **Gap Analysis**: Identifies missing knowledge components
- **Content Enrichment**: Expands primitive coverage based on learning analytics
- **Personalization**: Tailors enhancements to individual learning patterns

### **Agent Integration Points**

#### **1. Blueprint Processing Integration**
**Current**: Learning blueprints → Question sets  
**New**: Learning blueprints → Knowledge primitives

```typescript
// Agent-powered blueprint processing
const result = await primitiveAIService.generatePrimitivesFromBlueprint(userId, {
  blueprintId: blueprint.id,
  maxPrimitives: 8,
  focusAreas: ['core_concepts', 'practical_applications']
});
```

#### **2. Spaced Repetition Integration**
**Agent Role**: Provides structured content for SR algorithms  
**Data Flow**: AI Primitives → Daily Tasks → Review Outcomes → Mastery Updates

#### **3. Performance Analytics Integration**
**Agent Metrics**:
- **Generation Success Rate**: Percentage of successful primitive creations
- **Content Quality Scores**: User feedback on generated primitives
- **Learning Outcome Correlation**: Effectiveness of AI-generated vs manual content
- **Processing Performance**: Generation time and resource utilization

### **Agent Performance Monitoring**

#### **Statistics Endpoint**
`GET /api/ai/primitives/stats`

**Tracked Metrics**:
```typescript
{
  totalPrimitives: 1247,
  totalCriteria: 3891,
  primitiveTypeDistribution: [
    { primitiveType: "concept", count: 623 },
    { primitiveType: "process", count: 412 },
    { primitiveType: "fact", count: 212 }
  ],
  averageCriteriaPerPrimitive: "3.12",
  recentPrimitives: [...],
  generationSuccessRate: 94.7,
  averageProcessingTime: 2.3 // seconds
}
```

#### **Quality Assurance**
- **Content Validation**: Automated checks for primitive completeness
- **Duplicate Detection**: Prevents redundant primitive creation
- **Coherence Analysis**: Ensures logical relationships between criteria
- **User Feedback Loop**: Incorporates learning outcome data for improvement

### **Agent Scalability Features**

#### **Batch Processing**
**Endpoint**: `POST /api/ai/primitives/batch-create`  
**Capability**: Process up to 5 source documents simultaneously

**Optimization**:
- **Sequential Processing**: Prevents AI service overload
- **Partial Success Handling**: Continues processing despite individual failures
- **Resource Management**: Automatic rate limiting and timeout handling

#### **Caching Integration**
- **Generated Content Caching**: Stores AI responses for similar inputs
- **User-Specific Optimization**: Caches personalized primitive recommendations
- **Performance Monitoring**: Tracks cache hit rates and generation efficiency

### **Future Agent Enhancements**

#### **Planned Capabilities**:
1. **Multi-Modal Input**: Support for images, videos, and audio content
2. **Collaborative Filtering**: Learn from user interactions across the platform
3. **Domain Specialization**: Subject-specific primitive generation models
4. **Real-Time Adaptation**: Dynamic content adjustment based on learning progress
5. **Cross-Primitive Relationships**: Automatic discovery of knowledge dependencies

#### **Integration Roadmap**:
- **Phase 1**: Complete question generation agent implementation
- **Phase 2**: Advanced personalization and adaptive content
- **Phase 3**: Multi-modal content processing
- **Phase 4**: Collaborative intelligence and social learning features

### **Agent Success Metrics**

#### **Technical KPIs**:
- **Response Time**: < 3 seconds for primitive generation
- **Success Rate**: > 95% successful generations
- **Content Quality**: > 4.0/5.0 average user rating
- **System Reliability**: 99.9% uptime for AI services

#### **Learning Outcome KPIs**:
- **Mastery Acceleration**: 25% faster concept mastery vs manual content
- **Retention Improvement**: 15% better long-term retention rates
- **Engagement Increase**: 30% higher daily task completion rates
- **Content Coverage**: 40% more comprehensive topic coverage

This agents implementation transforms the elevate platform from a static learning system into an intelligent, adaptive educational environment that continuously evolves with user needs and learning patterns.
        @CacheTTL(3600) // 1 hour cache
        @Get('/api/primitives/:id/details')
        async getPrimitiveDetails(@Param('id') id: number, @User() user) {
          return await this.primitiveService.getDetailedPrimitive(user.id, id);
        }
        ```
    - *Sub-task 6.3:* Implement cache invalidation API endpoints for development/debugging.
        ```typescript
        @Post('/api/primitives/:id/invalidate-cache')
        @UseGuards(AdminGuard) // Admin only
        async invalidateCache(@Param('id') primitiveId: number, @User() user) {
          await this.cacheService.invalidatePrimitiveCache(user.id, primitiveId);
          return { success: true };
        }
        ```
    - *Sub-task 6.4:* Add performance monitoring endpoints and health checks.
        ```typescript
        @Get('/api/system/performance-stats')
        async getPerformanceStats() {
          return {
            cacheHitRate: await this.cacheService.getHitRate(),
            avgQueryTime: await this.metricsService.getAvgQueryTime(),
            activeCacheEntries: await this.cacheService.getEntryCount()
          };
        }
        ```
    - *Sub-task 6.5:* Update integration tests to verify caching behavior and performance improvements.

- [ ] **Task 7: User Bucket Preferences and "Add More" API Endpoints**
    - *Sub-task 7.1:* Implement `GET /api/primitives/tracking-health` to provide tracking health statistics.
        ```typescript
        @Get('/api/primitives/tracking-health')
        async getTrackingHealth(@User() user): Promise<TrackingHealthResponse> {
          const stats = await this.primitiveService.calculateTrackingStats(user.id);
          
          return {
            totalTracked: stats.totalTracked,
            byIntensity: {
              dense: stats.denseCount,
              normal: stats.normalCount,
              sparse: stats.sparseCount
            },
            recommendations: await this.generateTrackingRecommendations(user.id, stats),
            suggestedIntensityChanges: await this.getSuggestedIntensityChanges(user.id)
          };
        }
        ```
    - *Sub-task 7.2:* Implement `POST /api/primitives/add-more` to allow users to add more primitives to their tracking list.
        ```typescript
        @Post('/api/primitives/add-more')
        async addMorePrimitives(@Body() primitiveIds: { ids: number[] }, @User() user): Promise<{ success: boolean }> {
          await this.primitiveService.addPrimitivesToTrackingList(user.id, primitiveIds.ids);
          return { success: true };
        }
        ```
    - *Sub-task 7.3:* Implement `PATCH /api/user/bucket-preferences` to update user mastery thresholds.
        ```typescript
        interface UpdateBucketPreferencesRequest {
          criticalMasteryThreshold?: number;
          coreMasteryThreshold?: number;
          plusMasteryThreshold?: number;
        }
        ```
        ```typescript
        @Patch('/api/user/bucket-preferences')
        async updateBucketPreferences(@Body() preferences: UpdateBucketPreferencesRequest, @User() user): Promise<{ success: boolean }> {
          await this.bucketPreferencesService.updateMasteryThresholds(user.id, preferences);
          return { success: true };
        }
        ```
    - *Sub-task 7.4:* Implement `GET /api/user/bucket-preferences` to retrieve user mastery thresholds.
        ```typescript
        interface BucketPreferencesResponse {
          criticalMasteryThreshold: number;
          coreMasteryThreshold: number;
          plusMasteryThreshold: number;
        }
        ```
        ```typescript
        @Get('/api/user/bucket-preferences')
        async getBucketPreferences(@User() user): Promise<BucketPreferencesResponse> {
          const preferences = await this.bucketPreferencesService.getMasteryThresholds(user.id);
          return preferences;
        }
        ```

---

## II. Agent's Implementation Summary & Notes
*(Agent will fill this section out as work is completed)*

### Comprehensive Agents Implementation

The AI-powered primitive generation system is designed to transform the elevate platform into an intelligent, adaptive educational environment. The system consists of several key components:

* **Primitive Generation**: The system uses machine learning algorithms to generate high-quality primitives based on learning blueprints and user interactions.
* **Content Enrichment**: The system expands primitive coverage based on learning analytics and user feedback.
* **Personalization**: The system tailors enhancements to individual learning patterns and preferences.
* **Quality Assurance**: The system ensures content quality through automated checks, duplicate detection, and coherence analysis.
* **Scalability Features**: The system includes batch processing, caching integration, and performance monitoring to ensure efficient and reliable operation.

### Technical Details

* **API Endpoints**: The system provides several API endpoints for primitive generation, content enrichment, and personalization.
* **Data Flow**: The system integrates with the elevate platform's data flow, using learning blueprints, user interactions, and learning analytics to generate high-quality primitives.
* **Machine Learning Algorithms**: The system uses advanced machine learning algorithms to generate primitives and ensure content quality.

### Future Enhancements

* **Multi-Modal Input**: The system will support images, videos, and audio content in future enhancements.
* **Collaborative Filtering**: The system will learn from user interactions across the platform to improve primitive generation and content enrichment.
* **Domain Specialization**: The system will develop subject-specific primitive generation models to improve content quality and relevance.

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)
*(This section to be filled out upon sprint completion)*
