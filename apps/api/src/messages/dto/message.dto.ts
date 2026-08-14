import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { MessageCategory } from '@prisma/client';

export class CreateThreadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsEnum(MessageCategory)
  category!: MessageCategory;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}

export class ReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
