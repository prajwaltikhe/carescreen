import { Allow, IsInt, IsUUID, Max, Min } from 'class-validator';

export class AnswerDto {
  @IsUUID()
  sessionId: string;

  @IsInt()
  @Min(1)
  @Max(15)
  screenId: number;

  @Allow()
  answer: unknown;
}
