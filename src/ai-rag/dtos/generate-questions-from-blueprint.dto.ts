import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class GenerateQuestionsFromBlueprintDto {
  @ApiProperty({
    description: 'The name/title for the new Question Set.',
    example: 'Cell Biology Basics',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional parameters for question generation (e.g., difficulty, number of questions).',
    example: { difficulty: 'medium', count: 10 },
  })
  @IsOptional()
  @IsObject()
  questionOptions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Optional ID of the folder to associate this question set with.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  folderId?: number;
}
