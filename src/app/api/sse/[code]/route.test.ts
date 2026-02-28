import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

const VALID_CODE = 'ABCD23';

vi.mock('@/lib/db', () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/sse-manager', () => ({
  sseManager: {
    canConnect: vi.fn(),
    addConnection: vi.fn(),
    removeConnection: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { sseManager } from '@/lib/sse-manager';

describe('GET /api/sse/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as { sseConnectionRateLimiter?: unknown }).sseConnectionRateLimiter;
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      id: 'room-id',
      code: VALID_CODE,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    } as never);
    vi.mocked(sseManager.canConnect).mockReturnValue(true);
    vi.mocked(sseManager.addConnection).mockReturnValue('conn-1');
  });

  it('ストリームキャンセル時に接続をクリーンアップする', async () => {
    const request = new Request(`http://localhost/api/sse/${VALID_CODE}`);
    const response = await GET(request, { params: Promise.resolve({ code: VALID_CODE }) });

    expect(response.status).toBe(200);
    expect(response.body).toBeTruthy();

    const reader = response.body!.getReader();
    await reader.cancel();

    expect(sseManager.addConnection).toHaveBeenCalledWith(VALID_CODE, expect.any(Object));
    expect(sseManager.removeConnection).toHaveBeenCalledWith(VALID_CODE, 'conn-1');
  });

  it('同一IPの接続試行が上限を超えると429を返す', async () => {
    // ストリームを張らずに試行回数だけ増やすため、ルーム未存在を返す
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null as never);

    let lastResponse: Response | null = null;
    for (let i = 0; i < 61; i++) {
      const request = new Request(`http://localhost/api/sse/${VALID_CODE}`, {
        headers: {
          'x-forwarded-for': '198.51.100.20',
        },
      });
      lastResponse = await GET(request, { params: Promise.resolve({ code: VALID_CODE }) });
    }

    expect(lastResponse).not.toBeNull();
    expect(lastResponse?.status).toBe(429);
    const data = await lastResponse!.json();
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
