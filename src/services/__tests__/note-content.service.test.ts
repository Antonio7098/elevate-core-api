import { NoteContentService, ContentType, updateNoteContent, getNoteContentSummary } from '../blueprint-centric/note-content.service';

describe('NoteContentService', () => {
  let service: NoteContentService;

  beforeEach(() => {
    service = new NoteContentService();
  });

  describe('updateContent', () => {
    it('should update from BlockNote content', () => {
      const blocknoteContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello, world!',
                marks: [{ type: 'bold' }]
              }
            ]
          }
        ]
      };

      const result = service.updateContent(blocknoteContent, ContentType.BLOCK_NOTE);

      expect(result.contentType).toBe(ContentType.BLOCK_NOTE);
      expect(result.primaryContent).toEqual(blocknoteContent);
      expect(result.derivedHtml).toBe('<p><strong>Hello, world!</strong></p>');
      expect(result.derivedPlainText).toBe('Hello, world!');
    });

    it('should update from HTML content', () => {
      const htmlContent = '<h1>Title</h1><p>This is <strong>bold</strong> text.</p>';

      const result = service.updateContent(htmlContent, ContentType.HTML);

      expect(result.contentType).toBe(ContentType.BLOCK_NOTE);
      expect(result.derivedHtml).toBe(htmlContent);
      // The HTML parser adds spaces between tags, so we expect "Title This is bold text."
      expect(result.derivedPlainText).toBe('Title This is bold text.');
    });

    it('should update from plain text content', () => {
      const plainText = 'Simple note content';

      const result = service.updateContent(plainText, ContentType.PLAIN_TEXT);

      expect(result.contentType).toBe(ContentType.BLOCK_NOTE);
      expect(result.derivedPlainText).toBe(plainText);
      expect(result.derivedHtml).toBe('<p>Simple note content</p>');
    });

    it('should throw error for invalid BlockNote content', () => {
      const invalidContent = {
        content: [] // Missing 'type' field
      };

      expect(() => {
        service.updateContent(invalidContent, ContentType.BLOCK_NOTE);
      }).toThrow('Invalid BlockNote content structure');
    });

    it('should throw error for unsupported content type', () => {
      const content = 'some content';
      const unsupportedType = 'unsupported' as ContentType;

      expect(() => {
        service.updateContent(content, unsupportedType);
      }).toThrow('Unsupported content type: unsupported');
    });
  });

  describe('getContentSummary', () => {
    it('should return content summary for valid BlockNote content', () => {
      const blocknoteContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is a test note with multiple words.'
              }
            ]
          }
        ]
      };

      const summary = service.getContentSummary(blocknoteContent);

      expect(summary.wordCount).toBe(8);
      // The actual text is "This is a test note with multiple words." which is 40 characters
      expect(summary.characterCount).toBe(40);
      expect(summary.hasImages).toBe(false);
      expect(summary.hasCodeBlocks).toBe(false);
      expect(summary.estimatedReadingTimeMinutes).toBe(1);
    });

    it('should return default values for invalid content', () => {
      const invalidContent = null;

      const summary = service.getContentSummary(invalidContent);

      expect(summary.wordCount).toBe(0);
      expect(summary.characterCount).toBe(0);
      expect(summary.hasImages).toBe(false);
      expect(summary.hasCodeBlocks).toBe(false);
      expect(summary.estimatedReadingTimeMinutes).toBe(0);
    });
  });

  describe('convenience functions', () => {
    it('should work with updateNoteContent convenience function', () => {
      const content = 'Test content';
      const result = updateNoteContent(content, ContentType.PLAIN_TEXT);

      expect(result.contentType).toBe(ContentType.BLOCK_NOTE);
      expect(result.derivedPlainText).toBe(content);
    });

    it('should work with getNoteContentSummary convenience function', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test' }]
          }
        ]
      };

      const summary = getNoteContentSummary(content);
      expect(summary.wordCount).toBe(1);
    });
  });
});
