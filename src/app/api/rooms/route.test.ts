import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// 有効なルームコード（A-H, J-K, M-N, P-Z, 2-9のみ）
const VALID_CODE = 'ABCD23';

// Prismaモック
vi.mock('@/lib/db', () => ({
  prisma: {
    room: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// room-codeモック
vi.mock('@/lib/room-code', () => ({
  generateRoomCode: vi.fn(() => VALID_CODE),
}));

import { prisma } from '@/lib/db';

describe('POST /api/rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('新しいルームを作成し、コードを返す', async () => {
    const mockRoom = {
      id: 'test-id',
      code: VALID_CODE,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    (prisma.room.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoom);

    const request = new Request('http://localhost/api/rooms', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.room.code).toBe(VALID_CODE);
    expect(data.data.room.expiresAt).toBeDefined();
  });

  it('expiresAtは24時間後に設定される', async () => {
    const now = new Date();
    vi.setSystemTime(now);

    (prisma.room.create as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }: { data: { code: string; expiresAt: Date } }) => ({
        ...data,
        id: 'test-id',
        createdAt: now,
      })
    );

    const request = new Request('http://localhost/api/rooms', {
      method: 'POST',
    });

    await POST(request);

    const createCall = (prisma.room.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const expiresAt = new Date(createCall.data.expiresAt);
    const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1分以内の誤差を許容
    expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(60000);

    vi.useRealTimers();
  });
});
