import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import BlueprintSectionService from '../../services/blueprint-centric/blueprintSection.service';
import NoteSectionService from '../../services/blueprint-centric/noteSection.service';
import MasteryCriterionService from '../../services/blueprint-centric/masteryCriterion.service';
import ContentAggregator from '../../services/blueprint-centric/contentAggregator.service';
import SectionHierarchyManager from '../../services/blueprint-centric/sectionHierarchyManager.service';

const prisma = new PrismaClient();
const blueprintSectionService = new BlueprintSectionService(prisma);
const noteSectionService = new NoteSectionService();
const contentAggregator = new ContentAggregator();
const sectionHierarchyManager = new SectionHierarchyManager();

// ============================================================================
// BLUEPRINT SECTION CONTROLLER
// ============================================================================

export class BlueprintSectionController {
  
  /**
   * Creates a new blueprint section
   */
  async createSection(req: Request, res: Response) {
    try {
      const { title, description, blueprintId, parentSectionId, difficulty, estimatedTimeMinutes } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const section = await blueprintSectionService.createSection({
        title,
        description,
        blueprintId,
        parentSectionId,
        difficulty,
        estimatedTimeMinutes,
        userId
      });
      
      res.status(201).json(section);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Gets a blueprint section with its children
   */
  async getSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const section = await blueprintSectionService.getSection(parseInt(id));
      res.json(section);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
  
  /**
   * Updates a blueprint section
   */
  async updateSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const section = await blueprintSectionService.updateSection(parseInt(id), updateData);
      res.json(section);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Deletes a blueprint section
   */
  async deleteSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await blueprintSectionService.deleteSection(parseInt(id));
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Gets the complete section tree for a blueprint
   */
  async getSectionTree(req: Request, res: Response) {
    try {
      const { blueprintId } = req.params;
      const tree = await blueprintSectionService.getSectionTree(parseInt(blueprintId));
      res.json(tree);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Moves a section to a new parent
   */
  async moveSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newParentId } = req.body;
      const section = await blueprintSectionService.moveSection(parseInt(id), parseInt(newParentId));
      res.json(section);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Reorders sections within a blueprint
   */
  async reorderSections(req: Request, res: Response) {
    try {
      const { blueprintId } = req.params;
      const { orderData } = req.body;
      await blueprintSectionService.reorderSections(parseInt(blueprintId), orderData);
      res.status(200).json({ message: 'Sections reordered successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Gets content for a section
   */
  async getSectionContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const content = await blueprintSectionService.getSectionContent(parseInt(id));
      res.json(content);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Gets statistics for a section
   */
  async getSectionStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await blueprintSectionService.getSectionStats(parseInt(id));
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Validates the section hierarchy
   */
  async validateHierarchy(req: Request, res: Response) {
    try {
      const { blueprintId } = req.params;
      const validation = await sectionHierarchyManager.validateHierarchy(parseInt(blueprintId));
      res.json(validation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Optimizes the section hierarchy
   */
  async optimizeHierarchy(req: Request, res: Response) {
    try {
      const { blueprintId } = req.params;
      const optimization = await sectionHierarchyManager.optimizeHierarchy(parseInt(blueprintId));
      res.json(optimization);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Gets UUE stage progression for a section
   */
  async getUueStageProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const progress = await contentAggregator.calculateUueStageProgress(parseInt(id), userId);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Gets content statistics for a user across all blueprints
   */
  async getUserContentStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const stats = await contentAggregator.getUserContentStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default BlueprintSectionController;

// Export controller instance
export const blueprintSectionController = new BlueprintSectionController();
