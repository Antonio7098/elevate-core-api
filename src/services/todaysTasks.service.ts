import prisma from '../lib/prisma';
import { QuestionSet, Question, Prisma } from '@prisma/client';
import { 
  QuestionWithContext, 
  TodaysTasksResponse, 
  DueQuestionSet 
} from '../types/todaysTasks.types';

const UUE_STAGES = ['Understand', 'Use', 'Explore'];

/**
 * Determines the target U-U-E stage based on the current set stage and a pass number.
 * @param currentSetStage - The current U-U-E stage of the question set (e.g., "Understand").
 * @param passNum - The global pass number (0 for current, 1 for next, 2 for next-next).
 * @returns The target U-U-E stage string or null if the pass pushes beyond "Explore".
 */
export const determineTargetUUEStage = (
  currentSetStage: string,
  passNum: number
): string | null => {
  const currentStageIndex = UUE_STAGES.indexOf(currentSetStage);
  if (currentStageIndex === -1) {
    // Default to 'Understand' if currentSetStage is invalid or not set
    // This case should ideally be handled by ensuring currentSetStage is always valid
    const targetIndex = passNum;
    return targetIndex < UUE_STAGES.length ? UUE_STAGES[targetIndex] : null;
  }

  const targetIndex = currentStageIndex + passNum;
  return targetIndex < UUE_STAGES.length ? UUE_STAGES[targetIndex] : null;
};

/**
 * Fetches all question sets for a given user that are due for review (nextReviewAt <= today).
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of DueQuestionSet objects.
 */
export const getDueSetsForUser = async (userId: number): Promise<DueQuestionSet[]> => {
  const today = new Date();
  // today.setHours(0, 0, 0, 0); // Consider if time component of nextReviewAt matters

  const dueSets = await prisma.questionSet.findMany({
    where: {
      folder: {
        userId: userId,
      },
      nextReviewAt: {
        lte: today,
      },
      // Optionally, filter out sets that have no questions, though this might be better handled elsewhere
      // questions: {
      //   some: {},
      // },
    },
    select: {
      id: true,
      name: true,
      currentUUESetStage: true,
      currentTotalMasteryScore: true,
      nextReviewAt: true,
    },
    // orderBy: { // Initial ordering can be done here or later
    //   nextReviewAt: 'asc',
    // },
  });

  // Ensure currentUUESetStage has a default if null/undefined from DB
  return dueSets.map(qs => ({
    ...qs,
    currentUUESetStage: qs.currentUUESetStage || 'Understand',
  }));
};

// Placeholder for the more complex helper function
/**
 * Fetches question(s) for a given questionSetId matching targetUUEFocus, not in excludeQuestionIds.
 * Prioritizes internally (e.g., previously incorrect, then difficulty, then age).
 * Returns one question if fetchAll is false, or all matching if true.
 */
export const getPrioritizedQuestionsFromSet = async (
  questionSetId: number,
  userId: number, // Added userId for fetching user-specific answers
  targetUUEFocus: string,
  excludeQuestionIds: Set<number>,
  fetchAll: boolean = false,
  questionSetName: string
): Promise<QuestionWithContext | QuestionWithContext[] | null> => {
  // TODO: Implement detailed prioritization logic
  // 1. Fetch questions matching questionSetId and targetUUEFocus, not in excludeQuestionIds
  // 2. Include UserQuestionAnswer data for prioritization (last 5 answers, times correct/incorrect)
  // 3. Prioritization criteria:
  //    a. Most recently answered incorrectly
  //    b. Lowest performance on last attempt (if available)
  //    c. Higher difficultyScore
  //    d. Older questions (less recently reviewed within this set/focus)
  //    e. New questions (never answered)
  // 4. If fetchAll, return all sorted. If !fetchAll, return the top one.
  // 5. Format as QuestionWithContext or QuestionWithContext[]
  type QuestionWithSelectedAnswers = Prisma.QuestionGetPayload<{
    select: {
      id: true;
      text: true;
      answer: true;
      uueFocus: true;
      questionType: true;
      currentMasteryScore: true;
      createdAt: true;
      updatedAt: true;
      options: true;
      lastAnswerCorrect: true;
      timesAnsweredCorrectly: true;
      timesAnsweredIncorrectly: true;
      totalMarksAvailable: true;
      markingCriteria: true;
      userAnswers: {
        select: { scoreAchieved: true; answeredAt: true };
        // orderBy and take are runtime modifiers, not part of the payload type structure here
      };
    };
  }>;
  
  const questions = await prisma.question.findMany({
    where: {
      questionSetId,
      uueFocus: targetUUEFocus,
      id: {
        notIn: Array.from(excludeQuestionIds),
      },
    },
    select: {
      id: true,
      text: true,
      answer: true,
      uueFocus: true,
      questionType: true,
      currentMasteryScore: true,
      createdAt: true,
      updatedAt: true,
      options: true,
      lastAnswerCorrect: true,
      timesAnsweredCorrectly: true,
      timesAnsweredIncorrectly: true,
      totalMarksAvailable: true,
      markingCriteria: true,
      difficultyScore: true,
      conceptTags: true,
      userAnswers: { 
        where: { userId },
        select: { scoreAchieved: true, answeredAt: true },
        orderBy: { answeredAt: 'desc' },
        take: 5,
      },
    },
    orderBy: [
      { createdAt: 'asc' }, 
    ],
    take: fetchAll ? undefined : 1,
  });

  if (!questions || questions.length === 0) {
    return null;
  }

  // Prioritization Logic
  const prioritized = questions
    .map(q => {
      const lastAnswer = q.userAnswers.length > 0 ? q.userAnswers[0] : null;
      let priority = 0; // Higher is better priority

      if (lastAnswer) {
        if (lastAnswer.scoreAchieved < 3) priority += 100; // Incorrect/low score
        else if (lastAnswer.scoreAchieved === 3) priority += 50; // Moderately correct
        else priority += 10; // Correct
        priority -= (q.userAnswers.length * 5); // Penalize frequently answered if correct
      } else {
        priority += 200; // New question, high priority
      }
      // priority += (q.difficultyScore || 3) * 10; // Difficulty (default to 3 if null) - Field removed
      
      // Add a small factor for age if needed, e.g., based on q.createdAt or lastAnswer.answeredAt
      // For now, this is a basic prioritization
      return { ...q, calculatedPriority: priority };
    })
    .sort((a, b) => b.calculatedPriority - a.calculatedPriority); // Sort descending by priority

  const questionsWithContext: QuestionWithContext[] = prioritized.map(({ calculatedPriority, ...rest }) => ({
    ...rest,
    conceptTags: rest.conceptTags ?? [],
    difficultyScore: rest.difficultyScore ?? 0,
    questionSetId,
    questionSetName,
    selectedForUUEFocus: targetUUEFocus,
}));

  return fetchAll ? questionsWithContext : questionsWithContext[0];
};


// Main service function - Skeleton
export const generateTodaysTasksForUser = async (
  userId: number,
  // Allow overriding for testing or specific scenarios
  mockToday?: Date 
): Promise<TodaysTasksResponse> => {
  const today = mockToday || new Date();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    // This case should ideally be caught by auth middleware or earlier checks
    // but as a safeguard for the service function itself:
    // Depending on how you want to handle this: throw an error or return empty/error response
    // For now, returning an empty-like structure to avoid unhandled promise rejections if not caught by controller
    return {
      criticalQuestions: [],
      coreQuestions: [],
      plusQuestions: [],
      targetQuestionCount: 0,
      selectedCoreAndCriticalCount: 0,
    };
  }

  const dueSets = await getDueSetsForUser(userId);

  const dailyStudyTimeMinutes = user.dailyStudyTimeMinutes || 30; // Default to 30 mins
  const targetQuestionCount = Math.max(5, Math.floor(dailyStudyTimeMinutes / 1.5)); // At least 5 questions

  const allDueSets = dueSets;

  const todaysCriticalQuestions: QuestionWithContext[] = [];
  const todaysCoreQuestions: QuestionWithContext[] = [];
  const todaysPlusQuestions: QuestionWithContext[] = [];
  const questionsAlreadySelectedForSession = new Set<number>();

  // 1. Categorize due sets
  const threeDaysAgo = new Date(today.valueOf());
  threeDaysAgo.setDate(today.getDate() - 3);

  const criticalDueSets: DueQuestionSet[] = [];
  const regularDueSets: DueQuestionSet[] = [];

  allDueSets.forEach(qs => {
    if (qs.nextReviewAt && qs.nextReviewAt < threeDaysAgo) {
      criticalDueSets.push(qs);
    } else {
      regularDueSets.push(qs);
    }
  });

  // Order criticalDueSets: most overdue first
  criticalDueSets.sort((a, b) => (a.nextReviewAt?.getTime() || 0) - (b.nextReviewAt?.getTime() || 0));
  
  // Order regularDueSets: lowest currentTotalMasteryScore, then oldest nextReviewAt
  regularDueSets.sort((a, b) => {
    const masteryDiff = (a.currentTotalMasteryScore || 0) - (b.currentTotalMasteryScore || 0);
    if (masteryDiff !== 0) return masteryDiff;
    return (a.nextReviewAt?.getTime() || 0) - (b.nextReviewAt?.getTime() || 0);
  });

  // --- Populate todaysCriticalQuestions ---
  for (const questionSet of criticalDueSets) {
    if (todaysCriticalQuestions.length + todaysCoreQuestions.length >= targetQuestionCount) break;

    const stageToFetch = questionSet.currentUUESetStage || 'Understand';
    const fetchedQuestions = await getPrioritizedQuestionsFromSet(
      questionSet.id,
      userId, // Pass userId
      stageToFetch,
      questionsAlreadySelectedForSession,
      true, // fetchAll
      questionSet.name
    );

    if (fetchedQuestions && Array.isArray(fetchedQuestions)) {
      for (const question of fetchedQuestions) {
        if (todaysCriticalQuestions.length + todaysCoreQuestions.length < targetQuestionCount) {
          if (!questionsAlreadySelectedForSession.has(question.id)) {
            todaysCriticalQuestions.push(question);
            questionsAlreadySelectedForSession.add(question.id);
          }
        } else {
          break;
        }
      }
    }
  }
  
  // --- Populate todaysCoreQuestions (Global U-U-E Pass Progression) ---
  const setsThatHaveExhaustedAllQuestions = new Set<number>();
  // Order: regular first, then critical (critical sets already had their current stage processed)
  const setsForCoreConsideration = [...regularDueSets, ...criticalDueSets]; 

  for (let passNum = 0; passNum < UUE_STAGES.length; passNum++) {
    if (todaysCriticalQuestions.length + todaysCoreQuestions.length >= targetQuestionCount) break;
    let questionsAddedInThisGlobalPass = 0;

    for (const questionSet of setsForCoreConsideration) {
      if (todaysCriticalQuestions.length + todaysCoreQuestions.length >= targetQuestionCount) break;
      if (setsThatHaveExhaustedAllQuestions.has(questionSet.id)) continue;

      // If it's a critical set and it's the first pass (passNum === 0),
      // its currentUUESetStage questions were already handled in the critical section.
      // We only consider it for subsequent UUE stages (passNum > 0 for its original stage)
      // or if its currentUUESetStage is different from what passNum=0 would target.
      const isCriticalSet = criticalDueSets.some(cs => cs.id === questionSet.id);
      if (isCriticalSet && passNum === UUE_STAGES.indexOf(questionSet.currentUUESetStage || 'Understand')) {
         // This exact stage for critical sets was handled by the critical questions population.
         // However, critical questions might not have filled the target. 
         // So, we might still want to pick from here if critical didn't pick it.
         // This logic might need refinement: if critical picked ALL questions from this stage, then skip.
         // For now, let's assume critical might not have picked all, so we can still consider it.
      }

      const actualTargetUUEFocus = determineTargetUUEStage(questionSet.currentUUESetStage || 'Understand', passNum);
      if (!actualTargetUUEFocus) {
        setsThatHaveExhaustedAllQuestions.add(questionSet.id);
        continue;
      }

      const question = await getPrioritizedQuestionsFromSet(
        questionSet.id,
        userId, // Pass userId
        actualTargetUUEFocus,
        questionsAlreadySelectedForSession,
        false, // fetchAll = false (fetch one)
        questionSet.name
      );

      if (question && !Array.isArray(question)) {
        if (!questionsAlreadySelectedForSession.has(question.id)){
            todaysCoreQuestions.push(question);
            questionsAlreadySelectedForSession.add(question.id);
            questionsAddedInThisGlobalPass++;
        }
      } else {
        // No question found for this set at this UUE focus for this pass.
        // This could mean the set is exhausted for this specific UUE stage.
        // A more robust check for exhaustion might be needed if getPrioritizedQuestionsFromSet can return null even if questions exist but were already picked.
        // For now, if null is returned, we assume no suitable UNPICKED question for this stage.
      }
       if (todaysCriticalQuestions.length + todaysCoreQuestions.length >= targetQuestionCount) break;
    }
    // If no questions were added in this global pass, and we are below target, 
    // it might mean further passes won't yield more unique questions from available sets.
    // However, some sets might have questions in later UUE stages even if earlier ones are exhausted.
    // if (questionsAddedInThisGlobalPass === 0 && (todaysCriticalQuestions.length + todaysCoreQuestions.length < targetTotalQuestionCount)) {
    //   // console.log(`Breaking global pass ${passNum} as no questions were added.`);
    //   // break; 
    //   // Decided against breaking here, to allow sets to advance through UUE stages even if some passes yield 0 for some sets.
    // }
  }

  // --- Populate todaysPlusQuestions (Simplified) ---
  const remainingCapacityForPlus = Math.max(0, targetQuestionCount - (todaysCriticalQuestions.length + todaysCoreQuestions.length));
  const plusQuestionTarget = Math.min(5, remainingCapacityForPlus > 0 ? 5 : 0); // Target up to 5 plus questions, or less if capacity is low
  
  if (plusQuestionTarget > 0) {
    // Consider sets not fully exhausted, or even new sets not yet due but user wants more
    // For now, let's try to pick from any due set, any UUE stage not yet picked
    const allDueSetsForPlus = [...regularDueSets, ...criticalDueSets].sort(() => 0.5 - Math.random()); // Shuffle for variety

    for (const questionSet of allDueSetsForPlus) {
      if (todaysPlusQuestions.length >= plusQuestionTarget) break;
      if (todaysCriticalQuestions.length + todaysCoreQuestions.length + todaysPlusQuestions.length >= targetQuestionCount + 5) break; // Soft cap on total questions including plus

      for (const uueStage of UUE_STAGES) { // Try all UUE stages
        if (todaysPlusQuestions.length >= plusQuestionTarget) break;
        const question = await getPrioritizedQuestionsFromSet(
          questionSet.id,
          userId, // Pass userId
          uueStage,
          questionsAlreadySelectedForSession,
          false,
          questionSet.name
        );
        if (question && !Array.isArray(question)) {
          if(!questionsAlreadySelectedForSession.has(question.id)){
            todaysPlusQuestions.push(question);
            questionsAlreadySelectedForSession.add(question.id);
            if (todaysPlusQuestions.length >= plusQuestionTarget) break;
          }
        }
      }
    }
  }

  return {
    criticalQuestions: todaysCriticalQuestions,
    coreQuestions: todaysCoreQuestions,
    plusQuestions: todaysPlusQuestions,
    targetQuestionCount,
    selectedCoreAndCriticalCount: todaysCriticalQuestions.length + todaysCoreQuestions.length,
  };
};
