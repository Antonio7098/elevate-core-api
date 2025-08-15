# Mastery System Architecture

## Overview

The new mastery system implements a blueprint-centric approach to learning that tracks mastery at the criterion level rather than the primitive level. This provides more granular tracking and enables sophisticated UUE stage progression.

## Core Components

### 1. MasteryCriterionService

**Purpose**: Manages individual mastery criteria and handles consecutive interval mastery logic.

**Key Features**:
- **Consecutive Interval Mastery**: Requires 2 consecutive successful attempts on different days
- **Hidden Complexity**: Configurable options for power users while maintaining simple defaults
- **Mastery Thresholds**: User-configurable standards (SURVEY 60%, PROFICIENT 80%, EXPERT 95%)

**Core Methods**:
```typescript
// Process a review and update mastery tracking
processCriterionReview(userId, criterionId, isCorrect, performance, options?)

// Check if criterion meets consecutive interval mastery requirements
checkConsecutiveIntervalMastery(criterionId, userId, options?)

// Get criteria by UUE stage for a section
getCriteriaByUueStage(sectionId, uueStage)
```

### 2. EnhancedSpacedRepetitionService

**Purpose**: Implements the new spaced repetition algorithm with progressive failure handling.

**Key Features**:
- **Progressive Failure Handling**: First failure = back one step, second failure = back to start
- **Tracking Intensity Multipliers**: DENSE (0.7×), NORMAL (1×), SPARSE (1.5×)
- **Simple Base Intervals**: [1, 3, 7, 21, 60, 180] days with intensity adjustments

**Core Methods**:
```typescript
// Calculate next review interval with progressive failure handling
calculateNextReviewInterval(currentStep, isCorrect, trackingIntensity, consecutiveFailures?)

// Process review outcome and update criterion schedule
processReviewOutcome(userId, criterionId, isCorrect, performance?)

// Get due criteria for a user
getDueCriteria(userId, date?)
```

### 3. MasteryCalculationService

**Purpose**: Calculates mastery at criterion, UUE stage, and primitive levels using weighted averages.

**Key Features**:
- **Weighted UUE Stage Mastery**: Stage mastery calculated from weighted average of criterion mastery
- **Complete Primitive Mastery**: All UUE stages must be mastered for primitive completion
- **User-Defined Thresholds**: Personal mastery standards per section/primitive

**Core Methods**:
```typescript
// Calculate UUE stage mastery from weighted average of criterion mastery
calculateUueStageMastery(sectionId, uueStage, userId)

// Calculate primitive mastery (all stages must be mastered)
calculatePrimitiveMastery(sectionId, userId)

// Calculate weighted mastery from criteria and user masteries
calculateWeightedMastery(criteria, userMasteries)
```

### 4. EnhancedTodaysTasksService

**Purpose**: Generates daily tasks using section-based organization and UUE progression.

**Key Features**:
- **Section-Based Organization**: Tasks organized by blueprint sections
- **UUE Stage Progression**: Next stage questions shown in plus bucket
- **Capacity-Based Bucket Filling**: Critical → Core → Plus, stop when full
- **Infinite "Generate More"**: Additional questions on demand

**Core Methods**:
```typescript
// Generate today's tasks for a user using section-based organization
generateTodaysTasksForUser(userId)

// Balance UUE stages in daily tasks
balanceUueStages(taskBuckets, userPrefs, userCapacity)

// Generate infinite "Generate More" questions
generateMoreQuestions(userId, sectionId?, uueStage?, count?)
```

### 5. LegacyCompatibilityService

**Purpose**: Maintains compatibility with existing primitiveSR.service.ts during transition.

**Key Features**:
- **Service Wrapper Pattern**: Delegates to new services while maintaining old interface
- **Graceful Fallback**: Falls back to legacy logic if new system fails
- **Data Migration Utilities**: Maps primitive IDs to criterion IDs

## Data Models

### MasteryCriterion
```typescript
model MasteryCriterion {
  id                    String                @id @default(cuid())
  blueprintSectionId    String                // Links to BlueprintSection
  uueStage              UueStage              @default(UNDERSTAND)
  weight                Float                 @default(1.0) // Importance weight
  masteryThreshold      Float                 @default(0.8) // 0.6, 0.8, or 0.95
  description           String                // Human-readable description
  questionTypes         String[]              // Types of questions
}
```

### UserCriterionMastery
```typescript
model UserCriterionMastery {
  id                    String                @id @default(cuid())
  userId                Int
  masteryCriterionId    String                // Links to MasteryCriterion
  blueprintSectionId    String                // Links to BlueprintSection
  
  // Mastery tracking
  isMastered            Boolean               @default(false)
  masteryScore          Float                 @default(0.0) // 0-1 score
  uueStage              UueStage              @default(UNDERSTAND)
  
  // Consecutive interval tracking
  lastTwoAttempts       Float[]               // Last 2 attempt scores
  consecutiveIntervals  Int                   @default(0)
  
  // Simple SR tracking
  currentIntervalStep   Int                   @default(0)
  nextReviewAt          DateTime?
  trackingIntensity     TrackingIntensity     @default(NORMAL)
}
```

## Algorithm Specifications

### Consecutive Interval Mastery Logic

Mastery requires 2 consecutive intervals above threshold on different days:

```typescript
async checkConsecutiveIntervalMastery(criterionId, userId): Promise<boolean> {
  const userMastery = await getUserCriterionMastery(userId, criterionId);
  const criterion = await getMasteryCriterion(criterionId);
  
  // Must have at least 2 attempts
  if (userMastery.lastTwoAttempts.length < 2) return false;
  
  // Must be on different days
  const lastTwoDates = await getLastTwoAttemptDates(userId, criterionId);
  if (lastTwoDates[0].toDateString() === lastTwoDates[1].toDateString()) return false;
  
  // Both attempts must be above threshold
  const [attempt1, attempt2] = userMastery.lastTwoAttempts;
  const threshold = criterion.masteryThreshold;
  
  return attempt1 >= threshold && attempt2 >= threshold;
}
```

### Weighted UUE Stage Mastery Calculation

Stage mastery calculated from weighted average of criterion mastery:

```typescript
async calculateUueStageMastery(sectionId, uueStage, userId): Promise<UueStageMasteryResult> {
  const criteria = await getCriteriaByUueStage(sectionId, uueStage);
  const userMasteries = await getUserMasteriesForCriteria(criteria.map(c => c.id), userId);
  
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const criterion of criteria) {
    const userMastery = userMasteries.find(m => m.masteryCriterionId === criterion.id);
    if (userMastery) {
      const masteryScore = userMastery.masteryScore;
      const weight = criterion.weight;
      
      totalWeightedScore += masteryScore * weight;
      totalWeight += weight;
    }
  }
  
  const stageMastery = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const isMastered = stageMastery >= 0.8; // 80% threshold
  
  return { stage: uueStage, masteryScore: stageMastery, isMastered, /* ... */ };
}
```

### Progressive Failure Handling

```typescript
calculateNextReviewInterval(currentStep, isCorrect, trackingIntensity, consecutiveFailures): ReviewSchedule {
  let newIntervalStep = currentStep;
  
  if (isCorrect) {
    // Success: move up one step
    newIntervalStep = Math.min(currentStep + 1, this.baseIntervals.length - 1);
  } else {
    // Failure: progressive step back
    if (consecutiveFailures === 0) {
      // First failure: go back one step
      newIntervalStep = Math.max(currentStep - 1, 0);
    } else {
      // Second consecutive failure: go back to start
      newIntervalStep = 0;
    }
  }
  
  // Apply tracking intensity multiplier
  const baseInterval = this.baseIntervals[newIntervalStep];
  const multiplier = this.intensityMultipliers[trackingIntensity];
  const adjustedInterval = Math.round(baseInterval * multiplier);
  
  return { nextReviewAt: new Date(Date.now() + adjustedInterval * 24 * 60 * 60 * 1000), /* ... */ };
}
```

## Daily Task Generation Flow

### 1. Task Categorization
```typescript
categorizeTasksByPriority(dueCriteria, sections): TaskBuckets {
  const critical: DailyTask[] = []; // Overdue by 3+ days or failed multiple times
  const core: DailyTask[] = [];     // Due today/tomorrow or new content
  const plus: DailyTask[] = [];     // Preview/advanced content
  
  for (const criterion of dueCriteria) {
    const priority = determineTaskPriority(criterion);
    const task = createDailyTask(criterion, section);
    
    switch (priority) {
      case 'CRITICAL': critical.push(task); break;
      case 'CORE': core.push(task); break;
      case 'PLUS': plus.push(task); break;
    }
  }
  
  return { critical, core, plus };
}
```

### 2. Capacity-Based Balancing
```typescript
balanceUueStages(taskBuckets, userPrefs, userCapacity): BalancedTasks {
  // Start with critical tasks (always included)
  const balancedCritical = critical.slice();
  let remainingCapacity = userCapacity - calculateEstimatedTime({ critical: balancedCritical, core: [], plus: [] });
  
  // Add core tasks until capacity is filled
  const balancedCore: DailyTask[] = [];
  for (const task of core) {
    if (remainingCapacity >= defaultTaskTimes.CORE) {
      balancedCore.push(task);
      remainingCapacity -= defaultTaskTimes.CORE;
    } else break;
  }
  
  // Add plus tasks (UUE stage progression previews)
  const balancedPlus: DailyTask[] = [];
  for (const task of plus) {
    if (remainingCapacity >= defaultTaskTimes.PLUS) {
      balancedPlus.push(task);
      remainingCapacity -= defaultTaskTimes.PLUS;
    }
  }
  
  return { critical: balancedCritical, core: balancedCore, plus: balancedPlus, overflow: [] };
}
```

## Hidden Complexity with Optional Configuration

The system provides simple defaults while allowing power users to customize:

```typescript
interface MasteryOptions {
  minGapDays?: number;                    // Default: 1 day minimum between attempts
  customThreshold?: number;                // Default: criterion.masteryThreshold
  requireDifferentTimeSlots?: boolean;     // Default: false
  maxAttemptsForMastery?: number;         // Default: unlimited
  allowRetrySameDay?: boolean;            // Default: false
  masteryDecayRate?: number;              // Default: system default
  strictMode?: boolean;                   // Default: false (more lenient for beginners)
}
```

## Legacy Compatibility Strategy

### Service Wrapper Pattern
```typescript
// Keep existing service interface but delegate to new implementation
export const generateDailyTasks = async (userId: number) => {
  // Use new enhanced service internally
  return await enhancedTodaysTasksService.generateTodaysTasksForUser(userId);
};

export const processReviewOutcome = async (userId, primitiveId, blueprintId, isCorrect) => {
  // Map primitiveId to criterionId and use new service
  const criterionId = await mapPrimitiveToCriterion(primitiveId, blueprintId);
  return await enhancedSrService.processReviewOutcome(userId, criterionId, isCorrect);
};
```

### Data Migration Utilities
```typescript
class LegacyDataMigrator {
  async migratePrimitiveProgress(): Promise<void> {
    const oldProgress = await prisma.userPrimitiveProgress.findMany();
    
    for (const progress of oldProgress) {
      const criterion = await findMasteryCriterion(progress.primitiveId, progress.blueprintId);
      
      if (criterion) {
        await prisma.userCriterionMastery.create({
          data: {
            userId: progress.userId,
            masteryCriterionId: criterion.id,
            // Map existing fields to new structure
            masteryScore: calculateLegacyMasteryScore(progress),
            currentIntervalStep: progress.reviewCount,
            // ... other mappings
          },
        });
      }
    }
  }
}
```

## Performance Considerations

### Database Indexing
```sql
-- Critical indexes for performance
CREATE INDEX idx_user_criterion_mastery_user_id ON UserCriterionMastery(userId);
CREATE INDEX idx_user_criterion_mastery_next_review ON UserCriterionMastery(nextReviewAt);
CREATE INDEX idx_user_criterion_mastery_mastery_score ON UserCriterionMastery(masteryScore);
CREATE INDEX idx_mastery_criterion_section_stage ON MasteryCriterion(blueprintSectionId, uueStage);
```

### Caching Strategy
- Redis cache for frequently accessed mastery scores
- Daily mastery calculations in background jobs
- Batch processing for large user bases

## Testing Strategy

### Unit Tests
- [x] MasteryCriterionService tests
- [x] EnhancedSpacedRepetitionService tests
- [x] MasteryCalculationService tests
- [x] Consecutive interval mastery logic tests

### Integration Tests
- [x] Complete mastery tracking flow
- [x] Daily task generation with new system
- [x] UUE stage progression validation

### Performance Tests
- [ ] Daily task generation performance
- [ ] Mastery calculation performance
- [ ] SR algorithm performance

## Future Enhancements

### Forgetting Curve Integration
The system collects rich data that enables sophisticated forgetting curve analysis:

```typescript
interface ForgettingCurveData {
  reviewDates: Date[];
  performanceScores: number[];
  timeBetweenReviews: number[];
  masteryLevels: string[];
  stageTransitionDates: Date[];
  userLearningStyle: LearningStyle;
  trackingIntensity: TrackingIntensity;
  subjectDifficulty: number;
}
```

### Adaptive Learning
Future versions will use ML models to predict optimal review intervals based on individual learning patterns.

## Migration Guide

### Phase 1: Parallel Implementation
1. Deploy new services alongside existing ones
2. Test with development team
3. Create data migration utilities

### Phase 2: Gradual Migration
1. Route subset of users to new system
2. Compare task generation quality
3. Optimize based on real usage

### Phase 3: Full Migration
1. Switch all users to new system
2. Deprecate old services
3. Remove legacy code

## Conclusion

The new mastery system provides a solid foundation for intelligent, personalized learning while maintaining backward compatibility. The system's architecture enables future enhancements like forgetting curve analysis and adaptive learning algorithms.

