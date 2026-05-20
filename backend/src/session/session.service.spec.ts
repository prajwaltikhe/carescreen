import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('../prisma/prisma.service', () => ({
  PrismaService: vi.fn(),
}));

import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  answer: {
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
};

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(SessionService);
  });

  it('starts a session and returns first question', async () => {
    mockPrisma.session.create.mockResolvedValue({
      id: 'sess-1',
      status: 'in_progress',
      currentScreen: 1,
    });

    const result = await service.startSession();
    expect(result.sessionId).toBe('sess-1');
    expect(result.question.screen.id).toBe(1);
  });

  it('throws when session not found', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(null);
    await expect(service.getSession('missing')).rejects.toThrow(NotFoundException);
  });

  it('saves answer and returns next question', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      status: 'in_progress',
      currentScreen: 1,
      answers: [],
    });
    mockPrisma.answer.upsert.mockResolvedValue({});
    mockPrisma.session.update.mockResolvedValue({});

    const result = await service.saveAnswer('sess-1', 1, 45);
    expect(result.nextQuestion?.screen.id).toBe(2);
    expect(result.status).toBe('in_progress');
  });

  it('returns terminal result for underage', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      status: 'in_progress',
      currentScreen: 1,
      answers: [],
    });
    mockPrisma.answer.upsert.mockResolvedValue({});
    mockPrisma.session.update.mockResolvedValue({});

    const result = await service.saveAnswer('sess-1', 1, 16);
    expect(result.result?.code).toBe('underage');
    expect(result.status).toBe('ineligible');
  });

  it('rejects answer for wrong screen', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      status: 'in_progress',
      currentScreen: 2,
      answers: [{ screenId: 1, answer: 45 }],
    });

    await expect(service.saveAnswer('sess-1', 1, 45)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects answer on completed session', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      status: 'completed',
      currentScreen: 15,
      answers: [],
    });

    await expect(service.saveAnswer('sess-1', 15, 'complete')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('handles BMI computed screen correctly', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      status: 'in_progress',
      currentScreen: 4,
      answers: [
        { screenId: 2, answer: 90 }, // weightKg
        { screenId: 3, answer: 170 }, // heightCm
      ],
    });
    mockPrisma.answer.upsert.mockResolvedValue({});
    mockPrisma.session.update.mockResolvedValue({});

    const result = await service.saveAnswer('sess-1', 4, undefined);
    
    // Should upsert twice: once for BMI (screen 4) and once for the computed value
    expect(mockPrisma.answer.upsert).toHaveBeenCalled();
    expect(result.nextQuestion?.screen.id).toBe(5);
  });

  it('returns session state via getSession', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      status: 'in_progress',
      currentScreen: 5,
      answers: [
        { screenId: 1, answer: 45 },
        { screenId: 2, answer: 90 },
      ],
    });

    const result = await service.getSession('sess-1');
    expect(result.sessionId).toBe('sess-1');
    expect(result.status).toBe('in_progress');
    expect(result.currentScreen).toBe(5);
    expect(result.answers['age']).toBe(45);
    expect(result.answers['weightKg']).toBe(90);
    expect(result.question?.screen.id).toBe(5);
  });

  it('handles evaluation screen (screen 15) and returns final result', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      status: 'in_progress',
      currentScreen: 15,
      answers: [
        { screenId: 1, answer: 45 },
        { screenId: 2, answer: 90 },
        { screenId: 3, answer: 170 },
        { screenId: 4, answer: 31.1 },
        { screenId: 5, answer: 'no' },
        { screenId: 6, answer: ['hypertension'] },
        { screenId: 7, answer: 'no' },
        { screenId: 9, answer: ['normal'] },
        { screenId: 10, answer: [] },
        { screenId: 11, answer: 'no' },
        { screenId: 12, answer: 'monthly' },
        { screenId: 13, answer: 'moderate' },
        { screenId: 14, answer: ['balanced'] },
      ],
    });
    mockPrisma.answer.upsert.mockResolvedValue({});
    mockPrisma.session.update.mockResolvedValue({});

    const result = await service.saveAnswer('sess-1', 15, 'complete');
    
    expect(mockPrisma.session.update).toHaveBeenCalled();
    expect(result.result?.status).toBe('eligible');
    expect(result.status).toBe('eligible');
  });
});
