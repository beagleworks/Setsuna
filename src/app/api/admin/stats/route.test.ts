import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/db';
import * as adminAuth from '@/lib/admin-auth';

// Prismaのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    room: {
      count: vi.fn(),
    },
    message: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
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

describe('GET /api/admin/stats', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      ADMIN_PASSWORD: 'test-admin-password',
      ADMIN_JWT_SECRET: 'test-jwt-secret-key-for-testing-1234567890',
    };

    // デフォルトのモック値を設定
    vi.mocked(prisma.room.count).mockResolvedValue(10);
    vi.mocked(prisma.message.count).mockResolvedValue(100);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    // 認証をデフォルトで成功させる
    vi.mocked(adminAuth.verifyAdminAuth).mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('認証済みで統計情報を返す', async () => {
    const request = new Request('http://localhost/api/admin/stats', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('未認証で401を返す', async () => {
    vi.mocked(adminAuth.verifyAdminAuth).mockResolvedValue(false);

    const request = new Request('http://localhost/api/admin/stats', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('activeRoomsを含む', async () => {
    vi.mocked(prisma.room.count).mockResolvedValueOnce(42);

    const request = new Request('http://localhost/api/admin/stats', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.data.activeRooms).toBe(42);
  });

  it('totalMessagesを含む', async () => {
    vi.mocked(prisma.message.count).mockResolvedValueOnce(1234);

    const request = new Request('http://localhost/api/admin/stats', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.data.totalMessages).toBe(1234);
  });

  it('roomsCreatedTodayを含む', async () => {
    // 2回目のroom.countの呼び出しが今日作成されたルーム
    vi.mocked(prisma.room.count)
      .mockResolvedValueOnce(10) // activeRooms
      .mockResolvedValueOnce(5); // roomsCreatedToday

    const request = new Request('http://localhost/api/admin/stats', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.data.roomsCreatedToday).toBe(5);
  });

  it('dailyStatsを含む', async () => {
    const request = new Request('http://localhost/api/admin/stats', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(Array.isArray(data.data.dailyStats)).toBe(true);
  });
});
