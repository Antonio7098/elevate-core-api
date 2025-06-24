import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateLearningBlueprintDto {
  @ApiPropertyOptional({
    description: 'New source text for the Learning Blueprint. If provided, the blueprint will be re-deconstructed by the AI service.',
    example: 'The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration.',
  })
  @IsOptional()
  @IsString()
  @MinLength(10) // Basic validation: ensure sourceText is not too short
  sourceText?: string;

  // folderId is not part of the LearningBlueprint model itself and is typically set during generation of related content,
  // so it's not included here for updating the blueprint directly.
}
