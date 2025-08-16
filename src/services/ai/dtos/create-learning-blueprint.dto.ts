import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLearningBlueprintDto {
  @ApiProperty({
    description: 'The source text to generate the learning blueprint from.',
    example: 'The mitochondria is the powerhouse of the cell.',
  })
  @IsNotEmpty()
  @IsString()
  sourceText!: string;

  @ApiPropertyOptional({
    description: 'Optional ID of the folder to associate this learning blueprint with.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  folderId?: number; // Optional properties don't strictly need '!' if undefined is acceptable before validation

  @ApiPropertyOptional({ description: 'Optional display title for the blueprint.' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Optional description for the blueprint.' })
  @IsOptional()
  @IsString()
  description?: string;
}
