import { PrismaClient, LearningBlueprint } from '@prisma/client';

export class AiRAGService {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    console.log('🔧 AiRAGService: Initialized successfully');
  }

  async createLearningBlueprint(
    sourceText: string,
    userId: number,
    title?: string,
    description?: string
  ): Promise<LearningBlueprint> {
    console.log(`🚀 AiRAGService: createLearningBlueprint for user ${userId}`);
    
    // Generate a simple blueprint structure from the source text
    const blueprintJson = this.generateBlueprintFromText(sourceText, title);
    
    // Create the learning blueprint
    const blueprint = await this.prisma.learningBlueprint.create({
      data: {
        userId,
        sourceText,
        title: title || 'Generated Blueprint',
        description: description || 'A blueprint generated from source text',
        blueprintJson
      }
    });

    console.log(`✅ LearningBlueprint created with ID: ${blueprint.id}`);
    return blueprint;
  }

  async generateQuestionsFromBlueprint(
    userId: number,
    blueprintId: number,
    options: { name: string; count?: number }
  ): Promise<any> {
    console.log(`🚀 AiRAGService: generateQuestionsFromBlueprint for blueprint ${blueprintId}`);
    
    // Verify blueprint exists and belongs to user
    const blueprint = await this.prisma.learningBlueprint.findFirst({
      where: { id: blueprintId, userId }
    });
    
    if (!blueprint) {
      throw new Error('Blueprint not found or access denied');
    }

    // Generate mock questions based on the blueprint content
    const questions = this.generateMockQuestions(blueprint.sourceText, options.count || 5);
    
    const questionSet = {
      id: Date.now(),
      name: options.name,
      blueprintId,
      userId,
      questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`✅ Question set generated with ${questions.length} questions`);
    return questionSet;
  }

  async generateNoteFromBlueprint(
    userId: number,
    blueprintId: number,
    options: { title: string }
  ): Promise<any> {
    console.log(`🚀 AiRAGService: generateNoteFromBlueprint for blueprint ${blueprintId}`);
    
    // Verify blueprint exists and belongs to user
    const blueprint = await this.prisma.learningBlueprint.findFirst({
      where: { id: blueprintId, userId }
    });
    
    if (!blueprint) {
      throw new Error('Blueprint not found or access denied');
    }

    // Generate a note based on the blueprint content
    const note = {
      id: Date.now(),
      title: options.title,
      blueprintId,
      userId,
      content: this.generateNoteContent(blueprint.sourceText),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`✅ Note generated successfully`);
    return note;
  }

  private generateBlueprintFromText(sourceText: string, title?: string): any {
    // Simple text analysis to create a basic blueprint structure
    const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = sourceText.split(/\s+/).filter(w => w.length > 3);
    
    const sections = sentences.slice(0, Math.min(5, sentences.length)).map((sentence, index) => ({
      section_id: `s${index + 1}`,
      section_name: `Section ${index + 1}`,
      description: sentence.trim().substring(0, 100) + '...',
      difficulty_level: index === 0 ? 'beginner' : index < 3 ? 'intermediate' : 'advanced',
      estimated_time_minutes: 30 + (index * 15)
    }));

    return {
      title: title || 'Generated Blueprint',
      sections,
      metadata: {
        word_count: words.length,
        sentence_count: sentences.length,
        complexity_score: Math.min(10, Math.max(1, Math.floor(words.length / 100)))
      }
    };
  }

  private generateMockQuestions(sourceText: string, count: number): any[] {
    const questions = [];
    const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i].trim();
      questions.push({
        id: i + 1,
        question: `What is the main idea of: "${sentence.substring(0, 100)}..."?`,
        answer: `The main idea is about ${sentence.split(' ').slice(0, 5).join(' ')}...`,
        difficulty: i < 2 ? 'easy' : i < 4 ? 'medium' : 'hard',
        type: 'multiple_choice'
      });
    }
    
    return questions;
  }

  private generateNoteContent(sourceText: string): string {
    // Create a structured note from the source text
    const paragraphs = sourceText.split(/\n\n+/).filter(p => p.trim().length > 50);
    
    if (paragraphs.length === 0) {
      return `# Summary\n\n${sourceText.substring(0, 200)}...\n\n## Key Points\n\n- Main topic: ${sourceText.split(' ').slice(0, 10).join(' ')}...\n- Important concepts to remember\n- Notes for further study`;
    }
    
    return `# Summary\n\n${paragraphs[0].substring(0, 200)}...\n\n## Key Points\n\n${paragraphs.slice(1, 3).map((p, i) => `${i + 1}. ${p.substring(0, 100)}...`).join('\n')}\n\n## Notes\n\nThis content provides valuable insights for learning and understanding the subject matter.`;
  }
}
