import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FORM_SCHEMA, getScreenById } from '../shared/form-schema';
import {
  buildQuestionPayload,
  evaluateScreen15,
  getBmiFromAnswers,
  resolveNextStep,
  terminalToResult,
} from '../shared/form-engine';
import type { AnswerValue, EligibilityResult, SessionAnswers } from '../shared/types';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async startSession() {
    const session = await this.prisma.session.create({
      data: { status: 'in_progress', currentScreen: 1 },
    });

    const screen = getScreenById(1)!;
    return {
      sessionId: session.id,
      question: buildQuestionPayload(screen, 1, {}),
    };
  }

  async getSession(sessionId: string) {
    const session = await this.loadSession(sessionId);
    const answers = this.answersToMap(session.answers);
    const screen = getScreenById(session.currentScreen)!;

    const response: Record<string, unknown> = {
      sessionId: session.id,
      status: session.status,
      currentScreen: session.currentScreen,
      answers,
      question:
        session.status === 'in_progress'
          ? buildQuestionPayload(screen, session.currentScreen, answers)
          : null,
    };

    if (session.result) {
      response.result = session.result;
    }

    return response;
  }

  async saveAnswer(
    sessionId: string,
    screenId: number,
    answer: unknown,
  ) {
    const session = await this.loadSession(sessionId);

    if (session.status !== 'in_progress') {
      throw new BadRequestException('Session is already completed');
    }

    if (session.currentScreen !== screenId) {
      throw new BadRequestException(
        `Expected screen ${session.currentScreen}, received ${screenId}`,
      );
    }

    const screen = getScreenById(screenId);
    if (!screen) {
      throw new BadRequestException(`Invalid screen id: ${screenId}`);
    }

    const existingAnswers = this.answersToMap(session.answers);
    let normalizedAnswer: AnswerValue;

    if (screen.inputType === 'computed') {
      const bmi = getBmiFromAnswers(existingAnswers);
      if (bmi == null) {
        throw new BadRequestException('Height and weight required before BMI evaluation');
      }
      existingAnswers.bmi = bmi;
      normalizedAnswer = bmi;
    } else if (screen.inputType === 'evaluation') {
      normalizedAnswer = 'complete';
    } else {
      normalizedAnswer = this.normalizeAnswer(screenId, screen.key, answer);
      existingAnswers[screen.key] = normalizedAnswer;
    }

    await this.prisma.answer.upsert({
      where: {
        sessionId_screenId: { sessionId, screenId },
      },
      update: { answer: normalizedAnswer as object },
      create: {
        sessionId,
        screenId,
        answer: normalizedAnswer as object,
      },
    });

    if (screen.inputType === 'computed' && existingAnswers.bmi != null) {
      await this.prisma.answer.upsert({
        where: {
          sessionId_screenId: { sessionId, screenId: 4 },
        },
        update: { answer: existingAnswers.bmi as object },
        create: {
          sessionId,
          screenId: 4,
          answer: existingAnswers.bmi as object,
        },
      });
    }

    if (screen.inputType === 'evaluation') {
      const result = evaluateScreen15(existingAnswers);
      await this.finalizeSession(sessionId, result);
      return { result, status: this.mapStatus(result) };
    }

    const { nextScreenId, terminal, mergedAnswers } = resolveNextStep(
      screenId,
      normalizedAnswer,
      existingAnswers,
    );

    if (terminal) {
      const result = terminalToResult(terminal);
      await this.finalizeSession(sessionId, result, nextScreenId);
      return { result, status: this.mapStatus(result) };
    }

    if (nextScreenId === 15) {
      const screen15 = getScreenById(15)!;
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { currentScreen: 15 },
      });
      return {
        nextQuestion: buildQuestionPayload(screen15, 15, mergedAnswers),
        status: 'in_progress',
      };
    }

    const nextScreen = getScreenById(nextScreenId)!;
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { currentScreen: nextScreenId },
    });

    return {
      nextQuestion: buildQuestionPayload(nextScreen, nextScreenId, mergedAnswers),
      status: 'in_progress',
    };
  }

  private async finalizeSession(
    sessionId: string,
    result: EligibilityResult,
    currentScreen = 15,
  ) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        currentScreen,
        status: result.status === 'ineligible' ? 'ineligible' : 'completed',
        result: result as object,
      },
    });
  }

  private mapStatus(result: EligibilityResult): string {
    if (result.status === 'ineligible') return 'ineligible';
    if (result.status === 'requires_clinical_review') return 'requires_review';
    return 'eligible';
  }

  private normalizeAnswer(
    screenId: number,
    key: string,
    answer: unknown,
  ): AnswerValue {
    const screen = getScreenById(screenId)!;

    if (screen.inputType === 'number' || screen.inputType === 'computed') {
      const num =
        typeof answer === 'number' ? answer : Number(answer);
      if (Number.isNaN(num)) {
        throw new BadRequestException('Answer must be a number');
      }
      return num;
    }

    if (screen.inputType === 'radio') {
      if (typeof answer !== 'string') {
        throw new BadRequestException('Answer must be a string');
      }
      return answer;
    }

    if (screen.inputType === 'checkbox') {
      if (!Array.isArray(answer)) {
        throw new BadRequestException('Answer must be an array');
      }
      return answer.map(String);
    }

    if (screen.inputType === 'evaluation') {
      return 'complete';
    }

    throw new BadRequestException(`Unsupported screen key: ${key}`);
  }

  private answersToMap(
    answers: { screenId: number; answer: unknown }[],
  ): SessionAnswers {
    const map: SessionAnswers = {};
    for (const row of answers) {
      const screen = getScreenById(row.screenId);
      if (!screen) continue;
      map[screen.key] = row.answer as AnswerValue;
    }
    return map;
  }

  private async loadSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { answers: { orderBy: { screenId: 'asc' } } },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }
}
