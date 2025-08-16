import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

// Simple structure for individual messages in the history
export class ChatMessageHistoryItemDto {
  @ApiProperty({ example: 'user', description: "Sender of the message ('user' or 'assistant')" })
  @IsString()
  role!: string;

  @ApiProperty({ example: 'What is a cell?', description: 'Content of the message' })
  @IsString()
  content!: string;
}

// Defines the contextual information for a chat message, such as the specific
// resource the user is currently viewing.
export class ChatContextDto {
  @ApiPropertyOptional({
    description: 'Optional ID of the Learning Blueprint to provide context for the chat.',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  blueprintId?: number;

  @ApiPropertyOptional({
    description: 'Optional ID of a Note to provide context for the chat.',
    example: 789,
  })
  @IsOptional()
  @IsNumber()
  noteId?: number;

  @ApiPropertyOptional({
    description: 'Optional ID of the Question Set to provide context for the chat.',
    example: 456,
  })
  @IsOptional()
  @IsNumber()
  questionSetId?: number;
}

export class ChatMessageDto {
  @ApiProperty({
    description: 'The content of the current user message.',
    example: 'Can you explain mitosis in simple terms?',
  })
  @IsNotEmpty()
  @IsString()
  messageContent!: string;

  @ApiPropertyOptional({
    description: 'Optional history of the conversation.',
    type: [ChatMessageHistoryItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageHistoryItemDto)
  chatHistory?: ChatMessageHistoryItemDto[];

  @ApiPropertyOptional({
    description: 'Optional contextual information for the chat message.',
    type: () => ChatContextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChatContextDto)
  context?: ChatContextDto;
}
