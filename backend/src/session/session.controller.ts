import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { AnswerDto } from './dto/answer.dto';

@Controller('api/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  start() {
    return this.sessionService.startSession();
  }

  @Post('answer')
  @HttpCode(HttpStatus.OK)
  answer(@Body() dto: AnswerDto) {
    return this.sessionService.saveAnswer(dto.sessionId, dto.screenId, dto.answer);
  }

  @Get(':id')
  getSession(@Param('id') id: string) {
    return this.sessionService.getSession(id);
  }
}
