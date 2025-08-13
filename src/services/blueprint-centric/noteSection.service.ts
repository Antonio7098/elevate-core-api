import { PrismaClient, NoteSection } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES
// ============================================================================

export interface CreateNoteData {
  title: string;
  content: string;
  contentBlocks?: any[];
  contentHtml?: string;
  plainText?: string;
  blueprintSectionId: string;
  userId: number;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  contentBlocks?: any[];
  contentHtml?: string;
  plainText?: string;
  contentVersion?: number;
}

export interface NoteVersion {
  id: string;
  content: string;
  contentBlocks?: any[];
  contentHtml?: string;
  plainText?: string;
  contentVersion: number;
  createdAt: Date;
}

export interface NoteWithSection extends NoteSection {
  blueprintSection: {
    id: string;
    title: string;
    depth: number;
  };
}

// ============================================================================
// NOTE SECTION SERVICE
// ============================================================================

export class NoteSectionService {
  
  /**
   * Creates a new note in a blueprint section
   */
  async createNote(data: CreateNoteData): Promise<NoteSection> {
    const { blueprintSectionId, userId, ...noteData } = data;
    
    // Verify the section exists and belongs to the user
    const section = await prisma.blueprintSection.findFirst({
      where: {
        id: blueprintSectionId,
        userId
      }
    });
    
    if (!section) {
      throw new Error(`Section ${blueprintSectionId} not found or access denied`);
    }
    
    return prisma.noteSection.create({
      data: {
        ...noteData,
        blueprintSectionId,
        userId,
        contentVersion: 1
      }
    });
  }
  
  /**
   * Gets a note by ID
   */
  async getNote(id: string): Promise<NoteSection> {
    const note = await prisma.noteSection.findUnique({
      where: { id }
    });
    
    if (!note) {
      throw new Error(`Note ${id} not found`);
    }
    
    return note;
  }
  
  /**
   * Updates a note
   */
  async updateNote(id: string, data: UpdateNoteData): Promise<NoteSection> {
    const existingNote = await this.getNote(id);
    
    // Increment content version if content changed
    const contentChanged = data.content !== undefined || 
                          data.contentBlocks !== undefined ||
                          data.contentHtml !== undefined ||
                          data.plainText !== undefined;
    
    const updateData = {
      ...data,
      contentVersion: contentChanged ? existingNote.contentVersion + 1 : existingNote.contentVersion
    };
    
    return prisma.noteSection.update({
      where: { id },
      data: updateData
    });
  }
  
  /**
   * Deletes a note
   */
  async deleteNote(id: string): Promise<void> {
    await prisma.noteSection.delete({
      where: { id }
    });
  }
  
  /**
   * Gets all notes for a specific section
   */
  async getNotesBySection(sectionId: string): Promise<NoteSection[]> {
    return prisma.noteSection.findMany({
      where: { blueprintSectionId: sectionId },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  /**
   * Gets notes with section information
   */
  async getNotesWithSection(userId: number): Promise<NoteWithSection[]> {
    return prisma.noteSection.findMany({
      where: { userId },
      include: {
        blueprintSection: {
          select: {
            id: true,
            title: true,
            depth: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
  
  /**
   * Moves a note to a different section
   */
  async moveNote(noteId: string, newSectionId: string): Promise<NoteSection> {
    const note = await this.getNote(noteId);
    
    // Verify the new section exists and belongs to the same user
    const newSection = await prisma.blueprintSection.findFirst({
      where: {
        id: newSectionId,
        userId: note.userId
      }
    });
    
    if (!newSection) {
      throw new Error(`Section ${newSectionId} not found or access denied`);
    }
    
    return prisma.noteSection.update({
      where: { id: noteId },
      data: { blueprintSectionId: newSectionId }
    });
  }
  
  /**
   * Updates note content with version tracking
   */
  async updateContent(
    noteId: string, 
    content: string, 
    blocks?: any[],
    html?: string,
    plainText?: string
  ): Promise<NoteSection> {
    const existingNote = await this.getNote(noteId);
    
    return prisma.noteSection.update({
      where: { id: noteId },
      data: {
        content,
        contentBlocks: blocks,
        contentHtml: html,
        plainText: plainText,
        contentVersion: existingNote.contentVersion + 1
      }
    });
  }
  
  /**
   * Gets note history (for future versioning system)
   */
  async getNoteHistory(noteId: string): Promise<NoteVersion[]> {
    // For now, return the current note as a single version
    // In the future, this could implement a proper versioning system
    const note = await this.getNote(noteId);
    
    return [{
      id: note.id,
      content: note.content,
      contentBlocks: note.contentBlocks,
      contentHtml: note.contentHtml,
      plainText: note.plainText,
      contentVersion: note.contentVersion,
      createdAt: note.createdAt
    }];
  }
  
  /**
   * Searches notes by content
   */
  async searchNotes(userId: number, query: string): Promise<NoteSection[]> {
    return prisma.noteSection.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { plainText: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
  
  /**
   * Gets notes by tags (from content blocks)
   */
  async getNotesByTags(userId: number, tags: string[]): Promise<NoteSection[]> {
    // This is a simplified implementation
    // In a real system, you might want to extract tags from contentBlocks
    // and store them separately for efficient querying
    
    const notes = await prisma.noteSection.findMany({
      where: { userId }
    });
    
    return notes.filter(note => {
      if (!note.contentBlocks) return false;
      
      try {
        const blocks = JSON.parse(note.contentBlocks as string);
        const noteTags = this.extractTagsFromBlocks(blocks);
        return tags.some(tag => noteTags.includes(tag));
      } catch {
        return false;
      }
    });
  }
  
  /**
   * Gets note statistics for a user
   */
  async getNoteStats(userId: number): Promise<{
    totalNotes: number;
    notesBySection: Record<string, number>;
    totalContentLength: number;
    averageContentLength: number;
  }> {
    const notes = await prisma.noteSection.findMany({
      where: { userId },
      include: {
        blueprintSection: {
          select: { title: true }
        }
      }
    });
    
    const totalNotes = notes.length;
    const notesBySection: Record<string, number> = {};
    let totalContentLength = 0;
    
    notes.forEach(note => {
      const sectionTitle = note.blueprintSection.title;
      notesBySection[sectionTitle] = (notesBySection[sectionTitle] || 0) + 1;
      totalContentLength += note.content.length;
    });
    
    return {
      totalNotes,
      notesBySection,
      totalContentLength,
      averageContentLength: totalNotes > 0 ? totalContentLength / totalNotes : 0
    };
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  /**
   * Extracts tags from content blocks
   */
  private extractTagsFromBlocks(blocks: any[]): string[] {
    const tags: string[] = [];
    
    const extractTags = (block: any) => {
      if (block.type === 'tag' && block.content) {
        tags.push(block.content);
      }
      
      if (block.content && Array.isArray(block.content)) {
        block.content.forEach(extractTags);
      }
    };
    
    blocks.forEach(extractTags);
    return tags;
  }
}

export default NoteSectionService;
