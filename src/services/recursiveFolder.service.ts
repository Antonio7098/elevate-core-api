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
        ...q,
        questionSetId: qs.id,
        questionSetName: qs.name
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
        notes: true,
        questionSets: {
          include: {
            notes: true
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

    // Combine folder notes with question set notes
    const notes = [
      ...folder.notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        plainText: note.plainText || undefined,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        questionSetId: undefined,
        questionSetName: undefined
      })),
      ...folder.questionSets.flatMap(qs => 
        qs.notes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          plainText: note.plainText || undefined,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          questionSetId: qs.id,
          questionSetName: qs.name
        }))
      )
    ];

    return {
      id: folder.id,
      name: folder.name,
      notes,
      subfolders: subfolderTrees
    };
  };

  return buildFolderTree(folderId);
}; 