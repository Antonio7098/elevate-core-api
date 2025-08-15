// Learning Pathways System Types
// Sprint 53: Blueprint-Centric Overhaul - Phase 4

export enum PathwayDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum MasteryLevel {
  UNDERSTAND = 'understand',
  USE = 'use',
  EXPLORE = 'explore'
}

export enum PathwayStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused'
}

// Learning Pathway
export interface LearningPathway {
  id: string;
  name: string;
  description: string;
  startPrimitiveId: string;
  endPrimitiveId: string;
  steps: PathwayStep[];
  difficulty: PathwayDifficulty;
  estimatedTimeMinutes: number;
  prerequisites: string[];
  tags: string[];
  status: PathwayStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  progress: {
    completedSteps: number;
    totalSteps: number;
    currentStepIndex: number;
    estimatedCompletionDate?: Date;
  };
}

export interface PathwayStep {
  id: string;
  primitiveId: string;
  order: number;
  masteryLevel: MasteryLevel;
  estimatedTimeMinutes: number;
  questions: QuestionInstance[];
  notes: NoteSection[];
  prerequisites: string[];
  learningObjectives: string[];
  completionCriteria: {
    questionsAnswered: number;
    notesReviewed: number;
    timeSpent: number;
  };
}

export interface QuestionInstance {
  id: string;
  questionFamilyId: string;
  variationId: string;
  difficulty: string;
  estimatedTimeMinutes: number;
  learningObjectives: string[];
  hints: string[];
  explanation: string;
}

export interface NoteSection {
  id: string;
  title: string;
  content: string;
  format: 'bullet' | 'paragraph' | 'mindmap';
  estimatedTimeMinutes: number;
  learningObjectives: string[];
  relatedPrimitives: string[];
}

// Pathway Discovery and Recommendations
export interface PathwayDiscoveryRequest {
  userId: string;
  interests: string[];
  currentKnowledge: string[];
  targetSkills: string[];
  timeAvailable: number; // minutes
  difficulty: PathwayDifficulty;
}

export interface PathwayRecommendation {
  pathway: LearningPathway;
  relevanceScore: number;
  estimatedTimeToComplete: number;
  prerequisitesMet: number;
  prerequisitesTotal: number;
  skillGap: string[];
  confidence: number;
}

export interface PathwayOptimizationRequest {
  pathwayId: string;
  userId: string;
  performanceData: {
    stepId: string;
    timeSpent: number;
    questionsCorrect: number;
    questionsTotal: number;
    difficulty: string;
  }[];
  userPreferences: {
    preferredLearningStyle: string;
    timeConstraints: number;
    difficultyAdjustment: 'easier' | 'same' | 'harder';
  };
}

export interface PathwayOptimizationResponse {
  optimizedPathway: LearningPathway;
  changes: {
    stepId: string;
    changeType: 'added' | 'removed' | 'reordered' | 'modified';
    reason: string;
    impact: 'positive' | 'neutral' | 'negative';
  }[];
  estimatedImprovement: {
    timeReduction: number;
    difficultyAdjustment: string;
    successProbability: number;
  };
}

// Pathway Progress Tracking
export interface PathwayProgressUpdate {
  pathwayId: string;
  stepId: string;
  userId: string;
  action: 'started' | 'completed' | 'paused' | 'resumed';
  timestamp: Date;
  metadata: {
    timeSpent?: number;
    questionsAnswered?: number;
    notesReviewed?: number;
    difficulty?: string;
    userFeedback?: string;
  };
}

export interface PathwayAnalytics {
  pathwayId: string;
  userId: string;
  overallProgress: number; // 0-100
  timeSpent: number; // total minutes
  averageStepTime: number;
  difficultyProgression: {
    stepId: string;
    perceivedDifficulty: string;
    actualTimeSpent: number;
    successRate: number;
  }[];
  learningEfficiency: {
    questionsPerMinute: number;
    notesRetentionRate: number;
    conceptGraspSpeed: number;
  };
  recommendations: {
    nextSteps: string[];
    areasForImprovement: string[];
    optimalLearningTimes: string[];
  };
}


