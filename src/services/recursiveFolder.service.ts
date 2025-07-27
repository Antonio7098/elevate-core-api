import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FolderWithQuestions {
  id: number;
  name: string;
  questions: {
    id: number;
    text: string;
    answer: string | null;
    questionType: string;
    currentMasteryScore: number | null;
    options: string[];
    lastAnswerCorrect: boolean | null;
    timesAnsweredCorrectly: number;
    timesAnsweredIncorrectly: number;
    totalMarksAvailable: number;
    markingCriteria: any | null;
    difficultyScore: number | null;
    conceptTags: string[];
    imageUrls: string[];
    selfMark: boolean;
    autoMark: boolean;
    aiGenerated: boolean;
    inCat: string | null;
    questionSetId: number;
    questionSetName: string;
  }[];
  subfolders: FolderWithQuestions[];
}

export const getAllQuestionsInFolderTree = async (folderId: number, userId: number): Promise<FolderWithQuestions> => {
  // First verify the folder exists and belongs to the user
  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId
    }
  });

  if (!folder) {
    throw new Error('Folder not found or access denied');
  }

  // Recursive function to build the folder tree with questions
  const buildFolderTree = async (currentFolderId: number): Promise<FolderWithQuestions> => {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      include: {
        questionSets: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!folder) {
      throw new Error(`Folder ${currentFolderId} not found`);
    }

    // Get all subfolders
    const subfolders = await prisma.folder.findMany({
      where: {
        parentId: currentFolderId,
        userId
      }
    });

    // Recursively build subfolder trees
    const subfolderTrees = await Promise.all(
      subfolders.map(subfolder => buildFolderTree(subfolder.id))
    );

    // Transform questions to include questionSet info
    const questions = folder.questionSets.flatMap(qs => 
      qs.questions.map(q => ({
        id: q.id,
        text: q.questionText || '',
        answer: q.answerText,
        questionType: 'multiple_choice', // Default value
        currentMasteryScore: null,
        options: [],
        lastAnswerCorrect: null,
        timesAnsweredCorrectly: 0,
        timesAnsweredIncorrectly: 0,
        totalMarksAvailable: q.marksAvailable || 0,
        markingCriteria: null,
        difficultyScore: null,
        conceptTags: [],
        imageUrls: [],
        selfMark: false,
        autoMark: true,
        aiGenerated: false,
        inCat: null,
        questionSetId: qs.id,
        questionSetName: qs.title
      }))
    );

    return {
      id: folder.id,
      name: folder.name,
      questions,
      subfolders: subfolderTrees
    };
  };

  return buildFolderTree(folderId);
};

interface FolderWithNotes {
  id: number;
  name: string;
  notes: {
    id: number;
    title: string;
    content: any;
    plainText?: string;
    createdAt: Date;
    updatedAt: Date;
    questionSetId?: number;
    questionSetName?: string;
  }[];
  subfolders: FolderWithNotes[];
}

export const getAllNotesInFolderTree = async (folderId: number, userId: number): Promise<FolderWithNotes> => {
  // First verify the folder exists and belongs to the user
  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId
    }
  });

  if (!folder) {
    throw new Error('Folder not found or access denied');
  }

  // Recursive function to build the folder tree with notes
  const buildFolderTree = async (currentFolderId: number): Promise<FolderWithNotes> => {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      include: {
        questionSets: true
      }
    });

    if (!folder) {
      throw new Error(`Folder ${currentFolderId} not found`);
    }

    // Get all subfolders
    const subfolders = await prisma.folder.findMany({
      where: {
        parentId: currentFolderId,
        userId
      }
    });

    // Recursively build subfolder trees
    const subfolderTrees = await Promise.all(
      subfolders.map(subfolder => buildFolderTree(subfolder.id))
    );

    // For now, return empty notes array since the schema doesn't include notes relation
    const notes: any[] = [];

    return {
      id: folder.id,
      name: folder.name,
      notes,
      subfolders: subfolderTrees
    };
  };

  return buildFolderTree(folderId);
}; 