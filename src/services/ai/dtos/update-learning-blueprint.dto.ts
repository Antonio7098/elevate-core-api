import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsNumber } from 'class-validator';

export class UpdateLearningBlueprintDto {
  @ApiPropertyOptional({
    description: 'New source text for the Learning Blueprint. If provided, the blueprint will be re-deconstructed by the AI service.',
    example: 'The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration.',
  })
  @IsOptional()
  @IsString()
  @MinLength(10) // Basic validation: ensure sourceText is not too short
  sourceText?: string;

  @ApiPropertyOptional({ description: 'Optional display title for the blueprint.' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Optional description for the blueprint.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Associate with a folder.' })
  @IsOptional()
  @IsNumber()
  folderId?: number;
}
