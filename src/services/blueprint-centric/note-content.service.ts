/**
 * Note Content Service
 * Handles consistency between different content formats in NoteSection
 * Uses BlockNote as the single source of truth
 */

export enum ContentType {
  BLOCK_NOTE = 'block_note',
  HTML = 'html',
  PLAIN_TEXT = 'plain_text'
}

export interface ContentUpdate {
  primaryContent: any;
  contentType: ContentType;
  derivedHtml?: string;
  derivedPlainText?: string;
}

export interface ContentSummary {
  wordCount: number;
  characterCount: number;
  hasImages: boolean;
  hasCodeBlocks: boolean;
  estimatedReadingTimeMinutes: number;
}

export class NoteContentService {
  private blocknoteParser: BlockNoteParser;
  private htmlParser: HTMLParser;

  constructor() {
    this.blocknoteParser = new BlockNoteParser();
    this.htmlParser = new HTMLParser();
  }

  /**
   * Update content and return all derived formats
   */
  updateContent(
    content: any,
    contentType: ContentType
  ): ContentUpdate {
    switch (contentType) {
      case ContentType.BLOCK_NOTE:
        return this.updateFromBlockNote(content);
      case ContentType.HTML:
        return this.updateFromHtml(content);
      case ContentType.PLAIN_TEXT:
        return this.updateFromPlainText(content);
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  /**
   * Update from BlockNote content (primary source)
   */
  private updateFromBlockNote(contentBlocks: any): ContentUpdate {
    // Validate BlockNote structure
    if (!this.isValidBlockNote(contentBlocks)) {
      throw new Error('Invalid BlockNote content structure');
    }

    // Generate HTML from BlockNote
    const htmlContent = this.blocknoteParser.toHtml(contentBlocks);

    // Generate plain text from HTML (cleaner than from BlockNote)
    const plainText = this.htmlParser.toPlainText(htmlContent);

    return {
      primaryContent: contentBlocks,
      contentType: ContentType.BLOCK_NOTE,
      derivedHtml: htmlContent,
      derivedPlainText: plainText
    };
  }

  /**
   * Update from HTML content
   */
  private updateFromHtml(htmlContent: string): ContentUpdate {
    try {
      // Parse HTML to BlockNote (if possible)
      const contentBlocks = this.htmlParser.toBlockNote(htmlContent);
      // Generate plain text from HTML
      const plainText = this.htmlParser.toPlainText(htmlContent);

      return {
        primaryContent: contentBlocks,
        contentType: ContentType.BLOCK_NOTE,
        derivedHtml: htmlContent,
        derivedPlainText: plainText
      };
    } catch (error) {
      // If HTML parsing fails, fall back to plain text extraction
      const plainText = this.htmlParser.toPlainText(htmlContent);

      // Create a simple BlockNote structure with the plain text
      const contentBlocks = this.createSimpleBlockNote(plainText);

      return {
        primaryContent: contentBlocks,
        contentType: ContentType.BLOCK_NOTE,
        derivedHtml: htmlContent,
        derivedPlainText: plainText
      };
    }
  }

  /**
   * Update from plain text content
   */
  private updateFromPlainText(plainText: string): ContentUpdate {
    // Create a simple BlockNote structure
    const contentBlocks = this.createSimpleBlockNote(plainText);

    // Generate HTML from BlockNote
    const htmlContent = this.blocknoteParser.toHtml(contentBlocks);

    return {
      primaryContent: contentBlocks,
      contentType: ContentType.BLOCK_NOTE,
      derivedHtml: htmlContent,
      derivedPlainText: plainText
    };
  }

  /**
   * Create a simple BlockNote structure from plain text
   */
  private createSimpleBlockNote(text: string): any {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: text
            }
          ]
        }
      ]
    };
  }

  /**
   * Validate BlockNote content structure
   */
  private isValidBlockNote(content: any): boolean {
    if (typeof content !== 'object' || content === null) {
      return false;
    }

    // Basic validation - check for required fields
    const requiredFields = ['type', 'content'];
    return requiredFields.every(field => field in content);
  }

  /**
   * Get a summary of the content for analytics/display
   */
  getContentSummary(contentBlocks: any): ContentSummary {
    try {
      if (!contentBlocks || typeof contentBlocks !== 'object') {
        return {
          wordCount: 0,
          characterCount: 0,
          hasImages: false,
          hasCodeBlocks: false,
          estimatedReadingTimeMinutes: 0
        };
      }

      const textContent = this.blocknoteParser.toPlainText(contentBlocks);
      const htmlContent = this.blocknoteParser.toHtml(contentBlocks);

      return {
        wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: textContent.length,
        hasImages: this.hasImages(contentBlocks),
        hasCodeBlocks: this.hasCodeBlocks(contentBlocks),
        estimatedReadingTimeMinutes: Math.max(1, Math.floor(textContent.split(/\s+/).filter(word => word.length > 0).length / 200))
      };
    } catch (error) {
      return {
        wordCount: 0,
        characterCount: 0,
        hasImages: false,
        hasCodeBlocks: false,
        estimatedReadingTimeMinutes: 0
      };
    }
  }

  /**
   * Check if content contains images
   */
  private hasImages(contentBlocks: any): boolean {
    const checkForImages = (obj: any): boolean => {
      if (typeof obj === 'object' && obj !== null) {
        if (obj.type === 'image') {
          return true;
        }
        for (const value of Object.values(obj)) {
          if (checkForImages(value)) {
            return true;
          }
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          if (checkForImages(item)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkForImages(contentBlocks);
  }

  /**
   * Check if content contains code blocks
   */
  private hasCodeBlocks(contentBlocks: any): boolean {
    const checkForCode = (obj: any): boolean => {
      if (typeof obj === 'object' && obj !== null) {
        if (['codeBlock', 'code'].includes(obj.type)) {
          return true;
        }
        for (const value of Object.values(obj)) {
          if (checkForCode(value)) {
            return true;
          }
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          if (checkForCode(item)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkForCode(contentBlocks);
  }
}

/**
 * Parser for BlockNote content to other formats
 */
class BlockNoteParser {
  toHtml(contentBlocks: any): string {
    if (!contentBlocks || !contentBlocks.content) {
      return '';
    }

    const htmlParts: string[] = [];
    for (const block of contentBlocks.content) {
      htmlParts.push(this.blockToHtml(block));
    }

    return htmlParts.join('');
  }

  toPlainText(contentBlocks: any): string {
    if (!contentBlocks || !contentBlocks.content) {
      return '';
    }

    const textParts: string[] = [];
    for (const block of contentBlocks.content) {
      textParts.push(this.blockToText(block));
    }

    return textParts.join(' ');
  }

  private blockToHtml(block: any): string {
    const blockType = block.type || '';

    switch (blockType) {
      case 'paragraph':
        const content = this.inlineToHtml(block.content || []);
        return `<p>${content}</p>`;
      case 'heading':
        const level = block.attrs?.level || 1;
        const headingContent = this.inlineToHtml(block.content || []);
        return `<h${level}>${headingContent}</h${level}>`;
      case 'bulletList':
        const bulletItems = (block.content || [])
          .map((item: any) => `<li>${this.blockToHtml(item)}</li>`)
          .join('');
        return `<ul>${bulletItems}</ul>`;
      case 'orderedList':
        const orderedItems = (block.content || [])
          .map((item: any) => `<li>${this.blockToHtml(item)}</li>`)
          .join('');
        return `<ol>${orderedItems}</ol>`;
      case 'listItem':
        const listContent = (block.content || [])
          .map((item: any) => this.blockToHtml(item))
          .join('');
        return listContent;
      case 'codeBlock':
        const code = this.inlineToText(block.content || []);
        return `<pre><code>${code}</code></pre>`;
      case 'blockquote':
        const quoteContent = (block.content || [])
          .map((item: any) => this.blockToHtml(item))
          .join('');
        return `<blockquote>${quoteContent}</blockquote>`;
      case 'horizontalRule':
        return '<hr>';
      case 'image':
        const attrs = block.attrs || {};
        const src = attrs.src || '';
        const alt = attrs.alt || '';
        return `<img src="${src}" alt="${alt}">`;
      default:
        return '';
    }
  }

  private inlineToHtml(content: any[]): string {
    const htmlParts: string[] = [];
    for (const item of content) {
      htmlParts.push(this.inlineItemToHtml(item));
    }
    return htmlParts.join('');
  }

  private inlineItemToHtml(item: any): string {
    const itemType = item.type || '';
    const text = item.text || '';

    if (itemType === 'text') {
      const marks = item.marks || [];
      let htmlText = text;

      // Apply marks
      for (const mark of marks) {
        const markType = mark.type || '';
        switch (markType) {
          case 'bold':
            htmlText = `<strong>${htmlText}</strong>`;
            break;
          case 'italic':
            htmlText = `<em>${htmlText}</em>`;
            break;
          case 'underline':
            htmlText = `<u>${htmlText}</u>`;
            break;
          case 'strike':
            htmlText = `<s>${htmlText}</s>`;
            break;
          case 'code':
            htmlText = `<code>${htmlText}</code>`;
            break;
          case 'link':
            const href = mark.attrs?.href || '';
            htmlText = `<a href="${href}">${htmlText}</a>`;
            break;
        }
      }

      return htmlText;
    }

    return text;
  }

  private blockToText(block: any): string {
    const blockType = block.type || '';

    switch (blockType) {
      case 'paragraph':
      case 'heading':
      case 'listItem':
        return this.inlineToText(block.content || []);
      case 'bulletList':
      case 'orderedList':
        const items = (block.content || [])
          .map((item: any) => this.blockToText(item));
        return items.join(' ');
      case 'codeBlock':
        return this.inlineToText(block.content || []);
      case 'blockquote':
        const content = (block.content || [])
          .map((item: any) => this.blockToText(item));
        return `"${content.join(' ')}"`;
      case 'horizontalRule':
        return '---';
      case 'image':
        const attrs = block.attrs || {};
        const alt = attrs.alt || '';
        return alt ? `[Image: ${alt}]` : '[Image]';
      default:
        return '';
    }
  }

  private inlineToText(content: any[]): string {
    const textParts: string[] = [];
    for (const item of content) {
      textParts.push(this.inlineItemToText(item));
    }
    return textParts.join('');
  }

  private inlineItemToText(item: any): string {
    const itemType = item.type || '';
    const text = item.text || '';

    if (itemType === 'text') {
      return text;
    }

    return text;
  }
}

/**
 * Parser for HTML content to other formats
 */
class HTMLParser {
  toBlockNote(htmlContent: string): any {
    // This is a simplified HTML to BlockNote parser
    // In production, you might want to use a more robust library like cheerio

    // Remove HTML tags and extract text
    const plainText = this.toPlainText(htmlContent);

    // Create a simple BlockNote structure
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: plainText
            }
          ]
        }
      ]
    };
  }

  toPlainText(htmlContent: string): string {
    // Simple HTML tag removal
    // Remove script and style tags
    let content = htmlContent
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '');

    // Replace common HTML entities
    content = content
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    // Add spaces before closing tags to separate content
    content = content.replace(/>/g, '> ');

    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, '');

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return content;
  }
}

// Convenience functions for easy usage
export function updateNoteContent(
  content: any,
  contentType: ContentType
): ContentUpdate {
  const service = new NoteContentService();
  return service.updateContent(content, contentType);
}

export function getNoteContentSummary(contentBlocks: any): ContentSummary {
  const service = new NoteContentService();
  return service.getContentSummary(contentBlocks);
}
