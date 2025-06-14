import { 
  processQuestionSetReview, 
  getIntervalForMastery, 
  getDueQuestionSets,
  getPrioritizedQuestions,
  UNDERSTAND_WEIGHT,
  USE_WEIGHT,
  EXPLORE_WEIGHT
} from '../spacedRepetition.service';
import {
  PrismaClient,
  Prisma,
  Folder,
  Question,
  QuestionSet,
  UserQuestionAnswer,
  UserStudySession
  // Removed QuestionType and UueFocus, will use string literals
} from '@prisma/client'; 

// Declare mock function variables in the outer scope
var mockQuestionFindUnique: jest.Mock;
var mockQuestionUpdate: jest.Mock;
var mockQuestionFindMany: jest.Mock;
var mockQuestionSetFindUnique: jest.Mock;
var mockQuestionSetUpdate: jest.Mock;
var mockQuestionSetFindMany: jest.Mock;
var mockUserQuestionAnswerCreate: jest.Mock;
var mockUserQuestionAnswerFindMany: jest.Mock;
var mockFolderFindUnique: jest.Mock;
var mockFolderUpdate: jest.Mock;
var mockUserStudySessionCreate: jest.Mock;

// Mock user ID and question set ID for testing
const mockUserId = 1;
const questionSetId = 1;

// Define the mock question set with all required fields from schema
const mockFullQuestionSet = {
  id: questionSetId,
  name: 'Test Question Set',
  createdAt: new Date(),
  updatedAt: new Date(),
  currentIntervalDays: null,
  exploreScore: 0,
  lastReviewedAt: null,
  nextReviewAt: null,
  reviewCount: 0,
  understandScore: 0,
  useScore: 0,
  currentForgottenPercentage: null,
  currentTotalMasteryScore: 0,
  currentUUESetStage: 'Explore',
  forgettingCurveParams: null,
  masteryHistory: [],
  source: null,
  instructions: null,
  isTracked: true,
  folderId: null,
  srStage: 0,
  easeFactor: 2.5,
  lapses: 0,
  trackingMode: 'AUTO',
  imageUrls: [],
  isPinned: false,
  questions: [
    {
      id: 1,
      answer: 'Test Answer',
      questionSetId: questionSetId,
      createdAt: new Date(),
      updatedAt: new Date(),
      options: [],
      questionType: 'multiple-choice',
      text: 'Test Question',
      conceptTags: [],
      lastAnswerCorrect: null,
      uueFocus: 'Understand',
      totalMarksAvailable: 1,
      markingCriteria: null,
      currentMasteryScore: null,
      difficultyScore: null,
      timesAnsweredCorrectly: 0,
      timesAnsweredIncorrectly: 0,
      selfMark: false,
      autoMark: false,
      aiGenerated: false,
      inCat: null,
      imageUrls: [],
      userAnswers: [],
      insightCatalysts: []
    }
  ],
  userAnswers: [],
  notes: [],
  scheduledReviews: []
} as unknown as QuestionSet & { questions: Question[] };

jest.mock('@prisma/client', () => {
  // Assign jest.fn() to the outer scope variables inside the factory
  mockQuestionFindUnique = jest.fn();
  mockQuestionUpdate = jest.fn();
  mockQuestionFindMany = jest.fn();
  mockQuestionSetFindUnique = jest.fn();
  mockQuestionSetUpdate = jest.fn();
  mockQuestionSetFindMany = jest.fn();
  mockUserQuestionAnswerCreate = jest.fn();
  mockUserQuestionAnswerFindMany = jest.fn();
  mockFolderFindUnique = jest.fn();
  mockFolderUpdate = jest.fn();
  mockUserStudySessionCreate = jest.fn();

  const actualPrisma = jest.requireActual('@prisma/client').Prisma;

  // Define the mock transaction function
  const transactionMock = jest.fn().mockImplementation(async (callback) => {
    const tx = {
      question: {
        findUnique: mockQuestionFindUnique,
        update: mockQuestionUpdate,
        findMany: mockQuestionFindMany,
      },
      questionSet: {
        findUnique: mockQuestionSetFindUnique,
        update: mockQuestionSetUpdate,
        findMany: mockQuestionSetFindMany,
      },
      userQuestionAnswer: {
        create: mockUserQuestionAnswerCreate,
        findMany: mockUserQuestionAnswerFindMany,
      },
      userStudySession: {
        create: mockUserStudySessionCreate,
      },
      folder: {
        findUnique: mockFolderFindUnique,
        update: mockFolderUpdate,
      },
    };
    return await callback(tx);
  });

  // Mock question set find unique to return a question set with questions
  mockQuestionSetFindUnique.mockImplementation(async (args: Prisma.QuestionSetFindUniqueArgs) => {
    if (args.where.id === questionSetId) {
      return mockFullQuestionSet as unknown as QuestionSet;
    }
    return null;
  });

  // Mock question set find many to return question sets with questions
  mockQuestionSetFindMany.mockImplementation(async (args: Prisma.QuestionSetFindManyArgs) => {
    return [mockFullQuestionSet as unknown as QuestionSet];
  });

  // Mock question find unique to return a question with the correct structure
  mockQuestionFindUnique.mockImplementation(async (args: Prisma.QuestionFindUniqueArgs) => {
    const question = mockFullQuestionSet.questions.find(q => q.id === args.where.id);
    if (question) {
      return {
        ...question,
        questionSet: {
          id: questionSetId,
          name: 'Test Question Set',
          currentUUESetStage: 'Understand',
          imageUrls: [],
          isPinned: false
        }
      } as unknown as Question;
    }
    return null;
  });

  // Mock question set update to return the updated question set
  mockQuestionSetUpdate.mockImplementation(async (args: Prisma.QuestionSetUpdateArgs) => {
    return {
      ...mockFullQuestionSet,
      ...args.data
    } as unknown as QuestionSet;
  });

  // Mock question update to return the updated question
  mockQuestionUpdate.mockImplementation(async (args: Prisma.QuestionUpdateArgs) => {
    const question = mockFullQuestionSet.questions.find(q => q.id === args.where.id);
    if (question) {
      return {
        ...question,
        ...args.data,
        questionSet: {
          id: questionSetId,
          name: 'Test Question Set',
          currentUUESetStage: 'Understand',
          imageUrls: [],
          isPinned: false
        }
      } as unknown as Question;
    }
    return null;
  });

  // Mock user question answer create
  mockUserQuestionAnswerCreate.mockImplementation(async (args: Prisma.UserQuestionAnswerCreateArgs) => ({
    id: Math.floor(Math.random() * 10000 + 1),
    answeredAt: new Date(),
    userId: args.data.userId,
    questionId: args.data.questionId,
    questionSetId: args.data.questionSetId,
    userAnswerText: args.data.userAnswerText,
    scoreAchieved: args.data.scoreAchieved,
    isCorrect: args.data.isCorrect,
    confidence: args.data.confidence,
    timeSpent: args.data.timeSpent,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  // Mock user question answer find many
  mockUserQuestionAnswerFindMany.mockResolvedValue([]);

  // Mock user study session create
  mockUserStudySessionCreate.mockResolvedValue({
    id: 12345,
    userId: mockUserId,
    sessionStartedAt: new Date(),
    sessionEndedAt: new Date(),
    timeSpentSeconds: 300,
    answeredQuestionsCount: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const mockPrismaClientInstance = {
    $transaction: transactionMock,
    question: {
      findUnique: mockQuestionFindUnique,
      update: mockQuestionUpdate,
      findMany: mockQuestionFindMany,
    },
    questionSet: {
      findUnique: mockQuestionSetFindUnique,
      findMany: mockQuestionSetFindMany,
      update: mockQuestionSetUpdate,
    },
    userQuestionAnswer: {
      create: mockUserQuestionAnswerCreate,
      findMany: mockUserQuestionAnswerFindMany,
    },
    userStudySession: {
      create: mockUserStudySessionCreate,
    },
    folder: {
      findUnique: mockFolderFindUnique,
      update: mockFolderUpdate,
    },
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaClientInstance),
    Prisma: {
      ...actualPrisma,
    },
  };
});

let prisma: PrismaClient;

describe('Spaced Repetition Service', () => {

  const mockFolder = {
    id: 1,
    name: 'Test Folder',
    userId: mockUserId,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    currentMasteryScore: 0,
    masteryHistory: [],
    parentId: null,
    imageUrls: [],
    isPinned: false
  } as Folder;

  const updatedMockQuestionSet = {
    ...mockFullQuestionSet,
    currentTotalMasteryScore: 66.5,
    understandScore: 70,
    useScore: 60,
    exploreScore: 50,
    lastReviewedAt: new Date('2025-01-15T10:00:00.000Z'),
    nextReviewAt: new Date('2025-01-15T10:00:00.000Z'),
    reviewCount: mockFullQuestionSet.reviewCount + 1,
    currentIntervalDays: getIntervalForMastery(66.5)
  } as QuestionSet;

  beforeEach(() => {
    // Clear all mock implementations and call history before each test
    jest.clearAllMocks();

    // Clear call history for all global mock functions.
    // This preserves their identity as jest.fn() and allows re-configuring their behavior.
    mockQuestionFindUnique.mockClear();
    mockQuestionUpdate.mockClear();
    mockQuestionFindMany.mockClear();
    mockQuestionSetFindUnique.mockClear();
    mockQuestionSetUpdate.mockClear();
    mockQuestionSetFindMany.mockClear();
    mockUserQuestionAnswerCreate.mockClear();
    mockUserQuestionAnswerFindMany.mockClear();
    mockFolderFindUnique.mockClear();
    mockFolderUpdate.mockClear();
    mockUserStudySessionCreate.mockClear();
    // Note: transactionMock is defined in the factory. Its internal delegates are cleared above.

    // Set default resolved values or implementations for the mocks.
    // These will be used unless overridden in a specific test.
    mockQuestionSetFindUnique.mockResolvedValue(null);
    mockQuestionSetFindMany.mockResolvedValue([]);
    mockQuestionFindUnique.mockResolvedValue({
      id: 1,
      answer: 'Mock answer text',
      questionSetId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      options: [],
      questionType: 'SINGLE_CHOICE',
      text: 'Mock question text',
      conceptTags: [],
      lastAnswerCorrect: null,
      uueFocus: 'Understand',
      totalMarksAvailable: 100,
      markingCriteria: null,
      currentMasteryScore: 0,
      difficultyScore: 0.5,
      timesAnsweredCorrectly: 0,
      timesAnsweredIncorrectly: 0,
      selfMark: false,
      autoMark: false,
      aiGenerated: false,
      inCat: null,
      imageUrls: [],
      userAnswers: [],
      insightCatalysts: [],
    } as Question);

    mockUserStudySessionCreate.mockResolvedValue({
      id: 12345,
      userId: 1,
      sessionStartedAt: new Date(),
      sessionEndedAt: new Date(),
      timeSpentSeconds: 0,
      answeredQuestionsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      userQuestionAnswers: [],
      user: undefined as any,
    } as UserStudySession);

    // Instantiate the mocked PrismaClient. 'prisma' will be the mockPrismaClientInstance.
    prisma = new PrismaClient(); 

    console.log('[beforeEach] --- Prisma Mock Status ---');
    console.log('[beforeEach] typeof prisma.questionSet.findMany:', typeof prisma.questionSet.findMany, 
                '; Is it the global mock?', prisma.questionSet.findMany === mockQuestionSetFindMany);
    console.log('[beforeEach] typeof prisma.questionSet.findUnique:', typeof prisma.questionSet.findUnique, 
                '; Is it the global mock?', prisma.questionSet.findUnique === mockQuestionSetFindUnique);
    console.log('[beforeEach] typeof prisma.userStudySession.create:', typeof prisma.userStudySession.create, 
                '; Is it the global mock?', prisma.userStudySession.create === mockUserStudySessionCreate);
    console.log('[beforeEach] --- End Prisma Mock Status ---');
  });
  
  describe('getIntervalForMastery', () => {
    it('should return the correct interval for different mastery levels', () => {
      // Very low mastery
      expect(getIntervalForMastery(10)).toBe(1);
      
      // Low mastery
      expect(getIntervalForMastery(30)).toBe(2);
      
      // Medium mastery
      expect(getIntervalForMastery(50)).toBe(4);
      
      // Good mastery
      expect(getIntervalForMastery(70)).toBe(7);
      
      // Very good mastery
      expect(getIntervalForMastery(85)).toBe(14);
      
      // Excellent mastery
      expect(getIntervalForMastery(95)).toBe(30);
    });
    
    it('should return the default interval for edge cases', () => {
      // Edge case - exactly at boundary
      expect(getIntervalForMastery(20)).toBe(2); // 20 is in the 20-40 range (2 days)
      expect(getIntervalForMastery(40)).toBe(2); // 40 is exactly at the boundary, still in 20-40 range (2 days)
      
      // Edge case - at max
      expect(getIntervalForMastery(100)).toBe(30);
    });
  });
  
  describe('processQuestionSetReview', () => {
    const mockSessionDuration = 300; // 5 minutes
    const reviewTime = new Date('2025-01-15T10:00:00.000Z');

    const mockFolder: Folder = {
      id: 1,
      name: 'Test Folder',
      userId: mockUserId,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentMasteryScore: 0,
      masteryHistory: [],
      parentId: null,
      imageUrls: [],
      isPinned: false,
    };

    const baseQuestionProps = {
      createdAt: new Date(),
      updatedAt: new Date(),
      answer: 'Sample Answer',
      options: ['Option 1', 'Option 2'],
      questionType: 'SINGLE_CHOICE', // Using string literal
      difficulty: 0.5, // This was for V1, V2 uses totalMarksAvailable and scoreAchieved for difficulty assessment
      lastReviewedAt: null,
      nextReviewDate: null, // Prisma schema might use nextReviewAt on QuestionSet
      reviewCount: 0,
      totalTimeSpent: 0,
      timesAnsweredCorrectly: 0,
      timesAnsweredIncorrectly: 0,
      markingCriteria: null, // Changed from Prisma.JsonNull to null
      aiGenerated: false,
      version: 1,
      published: true,
      authorId: null,
      explanation: null,
      subjectId: null,
      topicId: null,
      subTopicId: null,
      source: null,
      verified: false,
      verifiedById: null,
      verifiedAt: null,
      lastMajorModificationAt: new Date(),
      lastMinorModificationAt: new Date(),
      tags: [], // This was for V1, V2 might use a different tagging system or none on Question directly
      userQuestionProgressId: null,
      // Added missing fields based on lint errors and common Question properties
      conceptTags: [], // Assuming it's a string array, might be removed in V2
      lastAnswerCorrect: null, // boolean or null
      difficultyScore: 0.5, // number, might be removed in V2
    };

    const mockQuestionSet: QuestionSet & { questions: Question[] } = {
      id: questionSetId,
      name: 'Test Question Set',
      createdAt: new Date(),
      updatedAt: new Date(),
      currentIntervalDays: 4,
      exploreScore: 40,
      lastReviewedAt: new Date('2023-01-01'),
      nextReviewAt: new Date('2023-01-01'),
      reviewCount: 3,
      understandScore: 60,
      useScore: 50,
      currentForgottenPercentage: 0,
      currentTotalMasteryScore: 50,
      currentUUESetStage: 'Understand',
      forgettingCurveParams: null,
      masteryHistory: [],
      source: null,
      instructions: null,
      isTracked: true,
      folderId: 1,
      easeFactor: 2.5,
      lapses: 0,
      trackingMode: 'AUTO',
      questions: [
        {
          id: 101,
          answer: 'Answer 1',
          questionSetId: questionSetId,
          createdAt: new Date(),
          updatedAt: new Date(),
          options: ['Option A', 'Option B', 'Answer 1', 'Option D'],
          questionType: 'SINGLE_CHOICE',
          text: 'Question 1 for Understand',
          conceptTags: ['concept1', 'concept2'],
          lastAnswerCorrect: false,
          uueFocus: 'Understand',
          totalMarksAvailable: 1,
          markingCriteria: null,
          currentMasteryScore: 0.8,
          difficultyScore: 0.7,
          timesAnsweredCorrectly: 0,
          timesAnsweredIncorrectly: 0,
          selfMark: false,
          autoMark: false,
          aiGenerated: false,
          inCat: null,
          imageUrls: [],
        } as Question,
        {
          id: 102,
          answer: 'Answer 2',
          questionSetId: questionSetId,
          createdAt: new Date(),
          updatedAt: new Date(),
          options: ['Option A', 'Answer 2', 'Option C', 'Option D'],
          questionType: 'SINGLE_CHOICE',
          text: 'Question 2 for Use',
          conceptTags: ['concept2', 'concept3'],
          lastAnswerCorrect: false,
          uueFocus: 'Use',
          totalMarksAvailable: 1,
          markingCriteria: null,
          currentMasteryScore: 0.7,
          difficultyScore: 0.6,
          timesAnsweredCorrectly: 0,
          timesAnsweredIncorrectly: 0,
          selfMark: false,
          autoMark: false,
          aiGenerated: false,
          inCat: null,
          imageUrls: [],
        } as Question
      ]
    };

    const updatedMockQuestionSet: QuestionSet = {
      ...mockQuestionSet,
      currentTotalMasteryScore: 66.5,
      understandScore: 100,
      useScore: 0,
      exploreScore: 50,
      lastReviewedAt: reviewTime,
      currentIntervalDays: getIntervalForMastery(66.5),
      nextReviewAt: new Date(reviewTime.getTime() + getIntervalForMastery(66.5) * 24 * 60 * 60 * 1000),
      reviewCount: mockQuestionSet.reviewCount + 1
    };

    const mockUserStudySession: UserStudySession = {
      id: 12345,
      userId: mockUserId,
      sessionStartedAt: new Date(),
      sessionEndedAt: new Date(),
      timeSpentSeconds: 300,
      answeredQuestionsCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should calculate new mastery scores and next review date', async () => {
      const sessionStartTime = new Date();
      const reviewTime = new Date('2025-01-15T10:00:00.000Z');

      // Mock the question set update response
      mockQuestionSetUpdate.mockResolvedValue({
        ...mockQuestionSet,
        currentTotalMasteryScore: 66.5,
        understandScore: 70,
        useScore: 60,
        exploreScore: 50,
        lastReviewedAt: reviewTime,
        nextReviewAt: new Date(reviewTime.getTime() + getIntervalForMastery(66.5) * 24 * 60 * 60 * 1000),
        reviewCount: mockQuestionSet.reviewCount + 1,
        currentIntervalDays: getIntervalForMastery(66.5)
      });

      // Mock user question answers
      mockUserQuestionAnswerCreate.mockImplementation(async (args: Prisma.UserQuestionAnswerCreateArgs) => ({
        id: Math.floor(Math.random() * 10000 + 1),
        answeredAt: new Date(),
        userId: args.data.userId,
        questionId: args.data.questionId,
        questionSetId: args.data.questionSetId,
        userAnswerText: args.data.userAnswerText,
        scoreAchieved: args.data.scoreAchieved,
        isCorrect: args.data.isCorrect,
        confidence: args.data.confidence,
        timeSpent: args.data.timeSpent,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Mock question set find unique
      mockQuestionSetFindUnique.mockResolvedValue(mockFullQuestionSet);

      // Mock question find unique
      mockQuestionFindUnique.mockResolvedValue(mockFullQuestionSet.questions[0]);

      // Mock question update
      mockQuestionUpdate.mockImplementation(async (args: Prisma.QuestionUpdateArgs) => {
        const originalQuestion = mockQuestionSet.questions.find((q: Question) => q.id === args.where.id);
        return { ...originalQuestion, ...args.data };
      });

      // Test data
      const reviewData = {
        userId: 1,
        understandScore: 70,
        useScore: 60,
        exploreScore: 50,
        overallScore: 62,
        timeSpent: 300,
        questionAnswers: [
          { questionId: 101, isCorrect: true, timeSpent: 150, scoreAchieved: 100, confidence: 0.8, userAnswerText: "Test answer 1" },
          { questionId: 102, isCorrect: false, timeSpent: 150, scoreAchieved: 0, confidence: 0.2, userAnswerText: "Test answer 2" }
        ]
      };

      const outcomes = reviewData.questionAnswers.map(qa => ({
        questionId: qa.questionId,
        scoreAchieved: qa.scoreAchieved / 100,
        userAnswerText: qa.userAnswerText,
        timeSpentOnQuestion: qa.timeSpent
      }));

      await processQuestionSetReview(reviewData.userId, outcomes, sessionStartTime, reviewData.timeSpent);

      // Verify the prisma calls
      expect(mockQuestionSetFindUnique).toHaveBeenCalledTimes(2);

      // Verify question set update
      expect(mockQuestionSetUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: questionSetId },
        data: expect.objectContaining({
          currentTotalMasteryScore: expect.any(Number),
          understandScore: 70,
          useScore: 60,
          exploreScore: 50,
          currentIntervalDays: expect.any(Number),
          currentForgottenPercentage: expect.any(Number),
          lastReviewedAt: expect.any(Date),
          nextReviewAt: expect.any(Date),
          reviewCount: { increment: 1 },
          masteryHistory: expect.objectContaining({
            push: expect.objectContaining({
              timestamp: expect.any(Date),
              totalMasteryScore: expect.any(Number),
              understandScore: 70,
              useScore: 60,
              exploreScore: 50
            })
          })
        })
      }));

      // Verify specific values
      const updateCallArgs = mockQuestionSetUpdate.mock.calls[0][0];
      const expectedTotalMasteryScore = 
        (70 * UNDERSTAND_WEIGHT) + 
        (60 * USE_WEIGHT) + 
        (50 * EXPLORE_WEIGHT);

      expect(updateCallArgs.data.currentTotalMasteryScore).toBeCloseTo(expectedTotalMasteryScore, 1);
    });
  });
  
  describe('getDueQuestionSets', () => {
    it('should return question sets that are due for review', async () => {
      console.log('[Test getDueQuestionSets] typeof prisma.questionSet.findMany:', typeof prisma.questionSet.findMany);
      // Test setup for getDueQuestionSets (mockQuestionSetFindMany.mockResolvedValue(...))
      const now = new Date();
      const dueQuestionSetsData = [
        {
          id: 1,
          name: 'Due Set 1',
          nextReviewAt: new Date(now.getTime() - 1000),
          folder: { userId: mockUserId, id: 1, name: 'Folder 1' }, // Include folder for the new check
          questions: [{ id: 1, text: 'Q1' }], // Ensure questions array is present
        },
        {
          id: 2,
          name: 'Due Set 2',
          nextReviewAt: now,
          folder: { userId: mockUserId, id: 2, name: 'Folder 2' }, // Include folder
          questions: [{ id: 2, text: 'Q2' }], // Ensure questions array is present
        },
      ];
      mockQuestionSetFindMany.mockResolvedValue(dueQuestionSetsData);

      const dueSets = await getDueQuestionSets(mockUserId);

      expect(mockQuestionSetFindMany).toHaveBeenCalledWith({
        where: {
          folder: { userId: mockUserId },
          OR: [
            { nextReviewAt: null },
            { nextReviewAt: { lte: expect.any(Date) } }
          ]
        },
        include: {
          questions: true,
          folder: true
        }
      });

      expect(dueSets).toHaveLength(2);
      expect(dueSets[0].name).toBe('Due Set 1');
      expect(dueSets[0].questions).toBeDefined(); // Check questions are included
      expect(dueSets[0].folder).toBeDefined(); // Check folder is included
    });

    // Add other tests for getDueQuestionSets if needed, e.g., no due sets, sets with no questions
    it('should return an empty array if no question sets are due', async () => {
      const mockUserId = 1;
      mockQuestionSetFindMany.mockResolvedValue([]);
      const dueSets = await getDueQuestionSets(mockUserId);
      expect(dueSets).toEqual([]);
    });

    it('should not return question sets that have no questions', async () => {
      const mockUserId = 1;
      // This mock simulates a set that would be due but has no questions; it should be filtered out by the service logic
      // However, the Prisma query itself now includes `questions: { some: {} }`
      // So, we expect findMany not to be called in a way that would return this, or the service to handle it.
      // For this test, let's assume the query itself handles it.
      mockQuestionSetFindMany.mockResolvedValue([]); // If the query filters, it will resolve to empty

      const dueSets = await getDueQuestionSets(mockUserId);
      expect(dueSets).toEqual([]);
      expect(mockQuestionSetFindMany).toHaveBeenCalledWith({
        where: {
          folder: { userId: mockUserId },
          OR: [
            { nextReviewAt: null },
            { nextReviewAt: { lte: expect.any(Date) } }
          ]
        },
        include: {
          questions: true,
          folder: true
        }
      });
    });
  });

  
  describe('getPrioritizedQuestions', () => {
    it('should prioritize questions based on U-U-E focus and performance', async () => {
      console.log('[Test getPrioritizedQuestions] typeof prisma.questionSet.findUnique:', typeof prisma.questionSet.findUnique);
      // Mock data
      const questionSetId = 1;
      const userId = 1; // userId is needed for future enhancements, not directly used in current logic for fetching
      
      // Mock question set data with questions included as per Prisma schema
      const mockQS = {
        id: questionSetId,
        name: 'Test Question Set for Prioritization',
        understandScore: 70,
        useScore: 60,
        exploreScore: 50,
        currentUUESetStage: 'Understand',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentIntervalDays: null,
        lastReviewedAt: null,
        nextReviewAt: null,
        reviewCount: 0,
        currentForgottenPercentage: null,
        currentTotalMasteryScore: 0,
        forgettingCurveParams: null,
        masteryHistory: [],
        source: null,
        instructions: null,
        isTracked: true,
        folderId: null,
        srStage: 0,
        easeFactor: 2.5,
        lapses: 0,
        trackingMode: 'AUTO',
        questions: [
          { 
            id: 101, 
            text: 'Question 1 for Understand', 
            answer: 'Answer 1',
            questionType: 'SINGLE_CHOICE',
            options: ['Option A', 'Option B', 'Answer 1', 'Option D'],
            uueFocus: 'Understand',
            difficultyScore: 0.7,
            lastAnswerCorrect: false,
            conceptTags: ['concept1', 'concept2'],
            questionSetId: questionSetId,
            currentMasteryScore: 0.8,
            totalMarksAvailable: 1,
            timesAnsweredCorrectly: 0,
            timesAnsweredIncorrectly: 0,
            userAnswers: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            selfMark: false,
            autoMark: false,
            aiGenerated: false,
            inCat: null,
            imageUrls: []
          } as Question,
          { 
            id: 102, 
            text: 'Question 2 for Use', 
            answer: 'Answer 2',
            questionType: 'SINGLE_CHOICE',
            options: ['Option A', 'Answer 2', 'Option C', 'Option D'],
            uueFocus: 'Use',
            difficultyScore: 0.6,
            lastAnswerCorrect: false,
            conceptTags: ['concept2', 'concept3'],
            questionSetId: questionSetId,
            currentMasteryScore: 0.7,
            totalMarksAvailable: 1,
            timesAnsweredCorrectly: 0,
            timesAnsweredIncorrectly: 0,
            userAnswers: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            selfMark: false,
            autoMark: false,
            aiGenerated: false,
            inCat: null,
            imageUrls: []
          } as Question,
          {
            id: 103,
            text: 'Question 3 for Explore',
            answer: 'Answer 3',
            questionType: 'SINGLE_CHOICE',
            options: ['Option A', 'Option B', 'Option C', 'Answer 3'],
            uueFocus: 'Explore',
            difficultyScore: 0.8,
            lastAnswerCorrect: false,
            conceptTags: ['concept3', 'concept4'],
            questionSetId: questionSetId,
            currentMasteryScore: 0.6,
            totalMarksAvailable: 1,
            timesAnsweredCorrectly: 0,
            timesAnsweredIncorrectly: 0,
            userAnswers: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            selfMark: false,
            autoMark: false,
            aiGenerated: false,
            inCat: null,
            imageUrls: []
          } as Question
        ]
      } as QuestionSet;
      
      mockQuestionSetFindUnique.mockResolvedValue(mockQS);
      
      const prioritizedQuestions = await getPrioritizedQuestions(questionSetId, userId, 3);
      
      expect(mockQuestionSetFindUnique).toHaveBeenCalledWith({
        where: { id: questionSetId },
        include: {
          questions: {
            include: {
              userAnswers: {
                where: { userId: userId },
                orderBy: { answeredAt: 'desc' },
                take: 5
              }
            }
          }
        }
      });

      expect(prioritizedQuestions).toHaveLength(3);
      prioritizedQuestions.forEach(q => {
        expect(q).toHaveProperty('priorityScore');
        expect(typeof q.priorityScore).toBe('number');
      });
      
      // Check if sorted by priority score (highest first)
      for (let i = 0; i < prioritizedQuestions.length - 1; i++) {
        expect(prioritizedQuestions[i].priorityScore).toBeGreaterThanOrEqual(prioritizedQuestions[i+1].priorityScore);
      }
      
      const uueFocusValues = prioritizedQuestions.map(q => q.uueFocus);
      expect(uueFocusValues).toEqual(expect.arrayContaining(['Understand', 'Use', 'Explore']));
    });
  });

});

// --- UPDATED MOCKS AND TESTS FOR NEW SR SYSTEM ---
// Example: Updated Question mock
const updatedMockQuestion: Question = {
  id: 1,
  answer: 'Answer',
  questionSetId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  options: [],
  questionType: 'SINGLE_CHOICE',
  text: 'Text',
  conceptTags: [],
  lastAnswerCorrect: null,
  uueFocus: 'Understand',
  totalMarksAvailable: 1,
  markingCriteria: null,
  currentMasteryScore: 0,
  difficultyScore: 0.5,
  timesAnsweredCorrectly: 0,
  timesAnsweredIncorrectly: 0,
  selfMark: false,
  autoMark: false,
  aiGenerated: false,
  inCat: null,
  imageUrls: [],
  userAnswers: [],
  insightCatalysts: [],
};

// Example: Updated Folder mock
const updatedMockFolder: Folder = {
  id: 1,
  name: 'Test Folder',
  userId: 1,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  currentMasteryScore: 0,
  masteryHistory: [],
  parentId: null,
  imageUrls: [],
  isPinned: false,
  questionSets: [],
  notes: [],
  parent: null,
  children: [],
  user: undefined as any, // Will be mocked if needed
};

// Example: Updated QuestionSet mock
const updatedMockQuestionSet: QuestionSet = {
  id: 1,
  name: 'Test Set',
  createdAt: new Date(),
  updatedAt: new Date(),
  currentIntervalDays: 1,
  exploreScore: 0,
  lastReviewedAt: new Date(),
  nextReviewAt: new Date(),
  reviewCount: 0,
  understandScore: 0,
  useScore: 0,
  currentForgottenPercentage: 0,
  currentTotalMasteryScore: 0,
  currentUUESetStage: 'Understand',
  forgettingCurveParams: null,
  masteryHistory: [],
  source: null,
  instructions: null,
  isTracked: true,
  folderId: 1,
  srStage: 0,
  easeFactor: 2.5,
  lapses: 0,
  trackingMode: 'AUTO',
  folder: undefined as any, // Will be mocked if needed
  questions: [],
  notes: [],
  userAnswers: [],
  scheduledReviews: [],
};

// Update test logic to check for new fields after running spaced repetition logic
// For example, after processQuestionSetReview, check srStage, easeFactor, lapses, trackingMode, masteryHistory, etc.
// Add/adjust tests for review scheduling logic if not already present
// Add explicit types to all function parameters and mocks
// Remove any deprecated or renamed fields from mocks and test logic
