interface MentionedItem {
  type: 'note' | 'question_set' | 'folder' | 'blueprint';
  id: number;
}

interface ChatContext {
  noteId?: number;
  questionSetId?: number;
  blueprintId?: number;
  mentionedItems?: MentionedItem[];
}

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessageDto {
  messageContent: string;
  chatHistory: ChatHistoryMessage[];
  context?: ChatContext;
}
