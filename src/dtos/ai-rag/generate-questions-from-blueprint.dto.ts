export interface GenerateQuestionsFromBlueprintDto {
  name: string;
  questionOptions?: Record<string, any>;
  folderId?: number;
}
