import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Prismaモック
vi.mock('@/lib/db', () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

// 有効なルームコード（A-H, J-K, M-N, P-Z, 2-9のみ）
const VALID_CODE = 'ABCD23';
const VALID_CODE_2 = 'HJKMNP';

describe('GET /api/rooms/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('存在するルームの情報を返す', async () => {
    const mockRoom = {
      id: 'test-id',
      code: VALID_CODE,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      _count: { messages: 5 },
    };

    (prisma.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoom);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}`);
    const response = await GET(request, { params: Promise.resolve({ code: VALID_CODE }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.room.code).toBe(VALID_CODE);
    expect(data.data.room.messageCount).toBe(5);
  });

  it('存在しないルームは404を返す', async () => {
    (prisma.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE_2}`);
    const response = await GET(request, { params: Promise.resolve({ code: VALID_CODE_2 }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('期限切れルームは410を返す', async () => {
    const mockRoom = {
      id: 'test-id',
      code: VALID_CODE,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 期限切れ
      _count: { messages: 0 },
    };

    (prisma.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoom);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}`);
    const response = await GET(request, { params: Promise.resolve({ code: VALID_CODE }) });
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error.code).toBe('ROOM_EXPIRED');
  });

  it('無効なコード形式は400を返す', async () => {
    // 小文字、または禁止文字（0, O, 1, I, L）を含むコード
    const invalidCodes = ['invalid', 'ABC123', 'ABCDOE', 'abc'];

    for (const code of invalidCodes) {
      const request = new Request(`http://localhost/api/rooms/${code}`);
      const response = await GET(request, { params: Promise.resolve({ code }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ROOM_CODE');
    }
  });
});
