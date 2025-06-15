export enum NoteStyle {
  CONCISE = 'CONCISE',
  THOROUGH = 'THOROUGH',
  EXPLORATIVE = 'EXPLORATIVE'
}

export enum SourceFidelity {
  STRICT = 'STRICT',
  CREATIVE = 'CREATIVE'
}

export enum QuestionScope {
  ESSENCE = 'ESSENCE',
  THOROUGH = 'THOROUGH'
}

export enum QuestionTone {
  ENCOURAGING = 'ENCOURAGING',
  FORMAL = 'FORMAL'
}

export interface GenerateNoteRequest {
  sourceId: string;
  // userId will be derived from the authenticated user (req.user.userId)
  noteStyle: NoteStyle;
  sourceFidelity: SourceFidelity;
}

export interface GenerateQuestionRequest {
  sourceId: string;
  // userId is removed as it should be derived from the authenticated user (AuthRequest)
  questionScope: QuestionScope;
  questionTone: QuestionTone;
  questionCount?: number; // Optional: Number of questions to generate
}
