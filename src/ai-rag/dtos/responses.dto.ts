import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsObject, IsDate, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'; // For @Type decorator

export class LearningBlueprintResponseDto {
  @ApiProperty({ description: 'ID of the Learning Blueprint.', example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ description: 'User ID associated with the Learning Blueprint.', example: 1 })
  @IsNumber()
  userId!: number;

  @ApiProperty({ description: 'Source text used for the blueprint.' })
  @IsString()
  sourceText!: string;

  @ApiProperty({ description: 'The structured blueprint JSON.' })
  @IsObject()
  blueprintJson!: Record<string, any>; // Or a more specific type if defined

  @ApiPropertyOptional({ description: 'ID of the folder this blueprint might be associated with (passed from request).' })
  @IsNumber()
  folderId?: number;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date) // Ensure transformation from string if necessary
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date) // Ensure transformation from string if necessary
  updatedAt?: Date;
}

export class QuestionInSetResponseDto {
  @ApiProperty({ description: 'ID of the Question.', example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ description: 'Text of the question.' })
  @IsString()
  text!: string;

  @ApiPropertyOptional({ description: 'Answer to the question.' })
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: 'Total marks available for the question.' })
  @IsNumber()
  totalMarksAvailable?: number;

  @ApiPropertyOptional({ description: 'Marking criteria for the question.' })
  @IsString()
  markingCriteria?: string;
}

export class QuestionSetResponseDto {
  @ApiProperty({ description: 'ID of the Question Set.', example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ description: 'Name of the Question Set.', example: 'Cell Biology Basics' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'User ID associated with the Question Set.', example: 1 })
  @IsNumber()
  userId!: number;

  @ApiPropertyOptional({ description: 'ID of the folder this question set might be associated with.' })
  @IsNumber()
  @IsOptional()
  folderId?: number | null;

  @ApiPropertyOptional({ description: 'ID of the Learning Blueprint this question set was generated from.' })
  @IsNumber()
  @IsOptional()
  generatedFromBlueprintId?: number | null;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  @ApiPropertyOptional({ type: () => [QuestionInSetResponseDto], description: 'List of questions in the set.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionInSetResponseDto)
  @IsOptional()
  questions?: QuestionInSetResponseDto[];
}

export class NoteResponseDto {
  @ApiProperty({ description: 'ID of the Note.', example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ description: 'Title of the Note.', example: 'Key Concepts of Cellular Respiration' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Content of the Note (JSON format).', example: { type: 'doc', content: [] } })
  @IsObject() // Assuming content is a JSON object
  content!: Record<string, any>;

  @ApiPropertyOptional({ description: 'Plain text version of the note content.' })
  @IsString()
  @IsOptional()
  plainText?: string;

  @ApiProperty({ description: 'User ID associated with the Note.', example: 1 })
  @IsNumber()
  userId!: number;

  @ApiPropertyOptional({ description: 'ID of the folder this note might be associated with.' })
  @IsNumber()
  @IsOptional()
  folderId?: number | null;

  @ApiPropertyOptional({ description: 'ID of the Question Set this note might be associated with.' })
  @IsNumber()
  @IsOptional()
  questionSetId?: number | null;

  @ApiPropertyOptional({ description: 'ID of the Learning Blueprint this note was generated from.' })
  @IsNumber()
  @IsOptional()
  generatedFromBlueprintId?: number | null;

  @ApiProperty({ description: 'Creation timestamp of the Note.' })
  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp of the Note.' })
  @IsDate()
  @Type(() => Date)
  updatedAt!: Date;
}

export class ChatResponseMessageDto {
  @ApiProperty({ description: "Sender of the message ('assistant').", example: 'assistant' })
  @IsString()
  role!: string;

  @ApiProperty({ description: 'Content of the assistant_s_message.', example: 'Mitosis is a process of cell division...' })
  @IsString()
  content!: string;
}
