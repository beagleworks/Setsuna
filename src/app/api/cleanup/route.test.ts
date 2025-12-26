import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

// Prismaモック
vi.mock('@/lib/db', () => ({
  prisma: {
    room: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

describe('POST /api/cleanup', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: 'test-secret' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('期限切れルームを削除する', async () => {
    (prisma.room.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 5 });

    const request = new Request('http://localhost/api/cleanup', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deletedRooms).toBe(5);
    expect(data.data.executedAt).toBeDefined();
  });

  it('Vercel Cronヘッダーで認証できる', async () => {
    (prisma.room.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    const request = new Request('http://localhost/api/cleanup', {
      method: 'POST',
      headers: { 'x-vercel-cron': '1' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('認証なしは401を返す', async () => {
    const request = new Request('http://localhost/api/cleanup', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('不正なトークンは401を返す', async () => {
    const request = new Request('http://localhost/api/cleanup', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});
