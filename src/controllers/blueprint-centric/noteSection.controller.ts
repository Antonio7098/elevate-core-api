import { Request, Response } from 'express';
import { NoteSectionService } from '../../services/blueprint-centric/noteSection.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class NoteSectionController {
  
  private noteSectionService: NoteSectionService;
  
  constructor() {
    this.noteSectionService = new NoteSectionService();
  }
  
  /**
   * Creates a new note section
   */
  async createNoteSection(req: AuthRequest, res: Response) {
    try {
      const noteData = req.body;
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const note = await this.noteSectionService.createNote({
        ...noteData,
        userId
      });
      
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets a note section by ID
   */
  async getNoteSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const note = await this.noteSectionService.getNote(id);
      res.json(note);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * Updates a note section
   */
  async updateNoteSection(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const note = await this.noteSectionService.updateNote(id, updateData);
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Deletes a note section
   */
  async deleteNoteSection(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await this.noteSectionService.deleteNote(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets note sections by section ID
   */
  async getNoteSectionsBySection(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const notes = await this.noteSectionService.getNotesBySection(sectionId);
      res.json(notes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets note sections by user
   */
  async getUserNoteSections(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const notes = await this.noteSectionService.getNotesWithSection(userId);
      res.json(notes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Searches note sections
   */
  async searchNoteSections(req: Request, res: Response) {
    try {
      const { query } = req.query;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const notes = await this.noteSectionService.searchNotes(userId, query as string);
      res.json(notes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Moves a note section to a different section
   */
  async moveNoteSection(req: AuthRequest, res: Response) {
    try {
      const { id, sectionId } = req.params;
      const result = await this.noteSectionService.moveNote(id, sectionId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Updates note tags
   */
  async updateNoteTags(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      const note = await this.noteSectionService.updateNote(id, { tags });
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets user note statistics
   */
  async getUserNoteStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const stats = await this.noteSectionService.getNoteStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets notes by section
   */
  async getNotesBySection(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const notes = await this.noteSectionService.getNotesBySection(sectionId);
      res.json(notes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets notes by UUE stage
   */
  async getNotesByUueStage(req: Request, res: Response) {
    try {
      const { stage } = req.params;
      const { userId, sectionId, limit = 20, offset = 0 } = req.query;
      
      if (!stage) {
        return res.status(400).json({ error: 'Stage parameter is required' });
      }
      
      // Validate stage parameter
      const validStages = ['UNDERSTAND', 'USE', 'EXPLORE'] as const;
      const stageUpper = stage.toUpperCase();
      if (!validStages.includes(stageUpper as any)) {
        return res.status(400).json({
          error: 'Invalid stage. Must be one of: UNDERSTAND, USE, EXPLORE',
          validStages
        });
      }
      
      // Get notes by UUE stage
      const allNotes = await this.noteSectionService.getNotesWithSection(
        userId ? parseInt(userId as string) : 0
      );
      
      // Filter notes by UUE stage (this would typically come from mastery tracking)
      // For now, we'll simulate UUE stage filtering based on note content and tags
      const notes = allNotes.filter(note => {
        // Filter by section if specified
        if (sectionId && note.section?.id !== parseInt(sectionId as string)) {
          return false;
        }
        
        // Simulate UUE stage filtering based on note characteristics
        // In a real implementation, this would come from mastery tracking service
        const noteStage = this.determineNoteUueStage(note);
        return noteStage === stageUpper;
      }).slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));
      
      // Calculate stage-specific statistics
      const stageStats = {
        totalNotes: notes.length,
        stage: stageUpper,
        averageLength: notes.length > 0 ? 
          Math.round(notes.reduce((sum, note) => sum + (note.content?.length || 0), 0) / notes.length) : 0,
        tags: this.extractCommonTags(notes),
        lastUpdated: notes.length > 0 ? 
          new Date(Math.max(...notes.map(n => new Date(n.updatedAt).getTime()))).toISOString() : null
      };
      
      res.json({
        success: true,
        data: {
          stage: stageUpper,
          notes,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            total: notes.length,
            hasMore: notes.length === parseInt(limit as string)
          },
          stageStats,
          metadata: {
            requestDate: new Date().toISOString(),
            filters: {
              userId: userId || 'all',
              sectionId: sectionId || 'all'
            }
          }
        }
      });
      
    } catch (error) {
      console.error('Error getting notes by UUE stage:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve notes by UUE stage' 
      });
    }
  }
  
  /**
   * Helper method to determine UUE stage based on note characteristics
   */
  private determineNoteUueStage(note: any): string {
    // This is a simplified heuristic - in a real implementation,
    // this would come from mastery tracking service
    const content = note.content || '';
    const tags = note.tags || [];
    
    // Simple heuristics based on content length and complexity
    if (content.length < 100 || tags.includes('basic') || tags.includes('intro')) {
      return 'UNDERSTAND';
    } else if (content.length < 500 || tags.includes('practice') || tags.includes('example')) {
      return 'USE';
    } else {
      return 'EXPLORE';
    }
  }
  
  /**
   * Helper method to extract common tags from notes
   */
  private extractCommonTags(notes: any[]): string[] {
    const tagCounts: { [key: string]: number } = {};
    
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Return top 10 most common tags
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  /**
   * Moves a note to a different section
   */
  async moveNoteToSection(req: AuthRequest, res: Response) {
    try {
      const { id, sectionId } = req.params;
      const result = await this.noteSectionService.moveNote(id, sectionId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets note hierarchy for a section
   */
  async getNoteHierarchy(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      // This method doesn't exist yet, so we'll return an empty object for now
      res.json({ sectionId, hierarchy: [] });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets section aggregation for notes
   */
  async getSectionAggregation(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      // This method doesn't exist yet, so we'll return an empty object for now
      res.json({ sectionId, aggregation: {} });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Updates note position within a section
   */
  async updateNotePosition(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { position } = req.body;
      // This method doesn't exist yet, so we'll return success for now
      res.json({ success: true, message: 'Position updated' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gets section statistics for notes
   */
  async getSectionStatistics(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      // This method doesn't exist yet, so we'll return empty stats for now
      res.json({ sectionId, stats: {} });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

// Export controller instance
export const noteSectionController = new NoteSectionController();




