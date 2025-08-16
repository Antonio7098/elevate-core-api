import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class GenerateNoteFromBlueprintDto {
  @ApiProperty({
    description: 'The name/title for the new Note.',
    example: 'Key Concepts of Cellular Respiration',
  })
  @IsNotEmpty()
  @IsString()
  name!: string; // Definite assignment assertion

  @ApiPropertyOptional({
    description: 'Optional parameters for note generation (e.g., summary length, style).',
    example: { length: 'concise', style: 'bullet_points' },
  })
  @IsOptional()
  @IsObject()
  noteOptions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Optional ID of the folder to associate this note with.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  folderId?: number;
}
