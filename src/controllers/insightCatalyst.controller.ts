import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InsightCatalystService } from '../services/insightCatalyst.service';

const insightCatalystService = new InsightCatalystService();

export const createInsightCatalyst = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, text, explanation, imageUrls, noteId, questionId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    // Verify note ownership if noteId is provided
    if (noteId) {
      const hasAccess = await insightCatalystService.verifyNoteOwnership(noteId, userId);
      if (!hasAccess) {
        res.status(404).json({ message: 'Note not found or access denied' });
        return;
      }
    }

    // Verify question ownership if questionId is provided
    if (questionId) {
      const hasAccess = await insightCatalystService.verifyQuestionOwnership(questionId, userId);
      if (!hasAccess) {
        res.status(404).json({ message: 'Question not found or access denied' });
        return;
      }
    }

    const newInsightCatalyst = await insightCatalystService.createInsightCatalyst({
      type,
      text,
      explanation,
      imageUrls,
      userId,
      noteId: noteId || undefined,
      questionId: questionId || undefined,
    });

    // Return response with questionId for backward compatibility (not stored in DB)
    res.status(201).json({
      ...newInsightCatalyst,
      questionId: questionId || null,
    });
  } catch (error) {
    console.error('--- Create Insight Catalyst Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Create Insight Catalyst Error ---');
    res.status(500).json({ message: 'Failed to create insight catalyst' });
  }
};

export const getInsightCatalysts = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { noteId, questionId } = req.query;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    const filters = {
      noteId: noteId ? parseInt(noteId as string) : undefined,
      questionId: questionId ? parseInt(questionId as string) : undefined,
    };

    const insightCatalysts = await insightCatalystService.getInsightCatalysts(userId, filters);
    res.status(200).json(insightCatalysts);
  } catch (error) {
    console.error('--- Get Insight Catalysts Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Insight Catalysts Error ---');
    res.status(500).json({ message: 'Failed to retrieve insight catalysts' });
  }
};

export const getInsightCatalystById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: catalystId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!catalystId || isNaN(parseInt(catalystId))) {
    res.status(400).json({ message: 'Invalid insight catalyst ID provided' });
    return;
  }

  try {
    const insightCatalyst = await insightCatalystService.getInsightCatalystById(parseInt(catalystId), userId);

    if (!insightCatalyst) {
      res.status(404).json({ message: 'Insight catalyst not found or access denied' });
      return;
    }

    res.status(200).json(insightCatalyst);
  } catch (error) {
    console.error('--- Get Insight Catalyst By ID Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Insight Catalyst By ID Error ---');
    res.status(500).json({ message: 'Failed to retrieve insight catalyst' });
  }
};

export const updateInsightCatalyst = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: catalystId } = req.params;
  const { type, text, explanation, imageUrls, noteId, questionId } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!catalystId || isNaN(parseInt(catalystId))) {
    res.status(400).json({ message: 'Invalid insight catalyst ID provided' });
    return;
  }

  try {
    // Verify note ownership if noteId is provided
    if (noteId) {
      const hasAccess = await insightCatalystService.verifyNoteOwnership(noteId, userId);
      if (!hasAccess) {
        res.status(404).json({ message: 'Note not found or access denied' });
        return;
      }
    }

    // Verify question ownership if questionId is provided
    if (questionId) {
      const hasAccess = await insightCatalystService.verifyQuestionOwnership(questionId, userId);
      if (!hasAccess) {
        res.status(404).json({ message: 'Question not found or access denied' });
        return;
      }
    }

    const updatedCatalyst = await insightCatalystService.updateInsightCatalyst(
      parseInt(catalystId),
      userId,
      {
        type,
        text,
        explanation,
        imageUrls,
        noteId: noteId || undefined,
        questionId: questionId || undefined,
      }
    );

    // Return response with questionId for backward compatibility (not stored in DB)
    res.status(200).json({
      ...updatedCatalyst,
      questionId: questionId || null,
    });
  } catch (error) {
    console.error('--- Update Insight Catalyst Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if (error.message === 'Insight catalyst not found or access denied') {
        res.status(404).json({ message: error.message });
        return;
      }
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Update Insight Catalyst Error ---');
    res.status(500).json({ message: 'Failed to update insight catalyst' });
  }
};

export const deleteInsightCatalyst = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: catalystId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!catalystId || isNaN(parseInt(catalystId))) {
    res.status(400).json({ message: 'Invalid insight catalyst ID provided' });
    return;
  }

  try {
    await insightCatalystService.deleteInsightCatalyst(parseInt(catalystId), userId);
    res.status(204).send();
  } catch (error) {
    console.error('--- Delete Insight Catalyst Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if (error.message === 'Insight catalyst not found or access denied') {
        res.status(404).json({ message: error.message });
        return;
      }
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Delete Insight Catalyst Error ---');
    res.status(500).json({ message: 'Failed to delete insight catalyst' });
  }
}; 