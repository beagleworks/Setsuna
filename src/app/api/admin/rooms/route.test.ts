import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/db';
import * as adminAuth from '@/lib/admin-auth';

// Prismaのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    room: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// 認証モジュールのモック
vi.mock('@/lib/admin-auth', async () => {
  const actual = await vi.importActual('@/lib/admin-auth');
  return {
    ...actual,
    verifyAdminAuth: vi.fn(),
  };
});

describe('GET /api/admin/rooms', () => {
  beforeEach(() => {
    vi.mocked(adminAuth.verifyAdminAuth).mockResolvedValue(true);
    vi.mocked(prisma.room.findMany).mockResolvedValue([]);
    vi.mocked(prisma.room.count).mockResolvedValue(0);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('認証済みでルーム一覧を返す', async () => {
    vi.mocked(prisma.room.findMany).mockResolvedValue([
      {
        id: 'room-1',
        code: 'ABC123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        _count: { messages: 5 },
      },
    ] as never);
    vi.mocked(prisma.room.count).mockResolvedValue(1);

    const request = new Request('http://localhost/api/admin/rooms');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.rooms).toHaveLength(1);
  });

  it('未認証で401を返す', async () => {
    vi.mocked(adminAuth.verifyAdminAuth).mockResolvedValue(false);

    const request = new Request('http://localhost/api/admin/rooms');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('ページネーションが機能する', async () => {
    vi.mocked(prisma.room.count).mockResolvedValue(50);

    const request = new Request('http://localhost/api/admin/rooms?page=2&pageSize=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.page).toBe(2);
    expect(data.data.pageSize).toBe(10);
    expect(data.data.total).toBe(50);
  });

  it('検索フィルタが機能する', async () => {
    const request = new Request('http://localhost/api/admin/rooms?search=ABC');
    await GET(request);

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          code: expect.objectContaining({
            contains: 'ABC',
          }),
        }),
      })
    );
  });
});
