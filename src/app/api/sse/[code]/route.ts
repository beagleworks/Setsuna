import { prisma } from '@/lib/db';
import { validateRoomCode } from '@/lib/room-code';
import { sseManager } from '@/lib/sse-manager';
import { RateLimiter, getClientIP, createRateLimitHeaders } from '@/lib/rate-limiter';
import { ERROR_MESSAGES } from '@/types/api';

interface RouteParams {
  params: Promise<{ code: string }>;
}

const SSE_RATE_LIMIT_WINDOW_MS = 60000;
const SSE_MAX_CONNECTION_ATTEMPTS_PER_WINDOW = 60;
const SSE_PING_INTERVAL_MS = 30000;

const globalForSseRateLimiter = globalThis as typeof globalThis & {
  sseConnectionRateLimiter?: RateLimiter;
};

function getSseConnectionRateLimiter(): RateLimiter {
  if (!globalForSseRateLimiter.sseConnectionRateLimiter) {
    globalForSseRateLimiter.sseConnectionRateLimiter = new RateLimiter({
      windowMs: SSE_RATE_LIMIT_WINDOW_MS,
      maxRequests: SSE_MAX_CONNECTION_ATTEMPTS_PER_WINDOW,
    });
  }

  return globalForSseRateLimiter.sseConnectionRateLimiter;
}

/**
 * GET /api/sse/[code]
 * SSEストリームを開始する
 */
export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  const { code } = await params;
  const rateLimiter = getSseConnectionRateLimiter();
  const ip = getClientIP(request);
  const rateLimitIdentifier = `sse:${ip}`;

  const rateLimit = rateLimiter.check(rateLimitIdentifier);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...createRateLimitHeaders(rateLimit, SSE_MAX_CONNECTION_ATTEMPTS_PER_WINDOW),
        },
      }
    );
  }
  rateLimiter.increment(rateLimitIdentifier);

  // コード形式のバリデーション
  if (!validateRoomCode(code)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_ROOM_CODE',
          message: ERROR_MESSAGES.INVALID_ROOM_CODE,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // ルームの存在確認
  const room = await prisma.room.findUnique({
    where: { code },
  });

  if (!room) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: ERROR_MESSAGES.ROOM_NOT_FOUND,
        },
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 期限切れチェック
  if (room.expiresAt < new Date()) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'ROOM_EXPIRED',
          message: ERROR_MESSAGES.ROOM_EXPIRED,
        },
      }),
      {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 接続数制限チェック
  if (!sseManager.canConnect(code)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'TOO_MANY_CONNECTIONS',
          message: ERROR_MESSAGES.TOO_MANY_CONNECTIONS,
        },
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // SSEストリームを作成
  let cleanupConnection: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // 接続を追加
      let connectionId: string | null = sseManager.addConnection(code, controller);
      let pingInterval: ReturnType<typeof setInterval> | null = null;
      let isCleanedUp = false;

      const cleanup = () => {
        if (isCleanedUp) {
          return;
        }
        isCleanedUp = true;

        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }

        if (connectionId) {
          sseManager.removeConnection(code, connectionId);
          connectionId = null;
        }

        request.signal.removeEventListener('abort', cleanup);
      };

      cleanupConnection = cleanup;
      request.signal.addEventListener('abort', cleanup);

      // 接続確立イベントを送信
      const connectedEvent = `event: connected\ndata: ${JSON.stringify({
        roomCode: code,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectedEvent));

      // キープアライブ用のping
      pingInterval = setInterval(() => {
        try {
          const pingEvent = `event: ping\ndata: ${JSON.stringify({
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(encoder.encode(pingEvent));
        } catch {
          // 接続が切れている場合はクリーンアップ
          cleanup();
        }
      }, SSE_PING_INTERVAL_MS);
    },
    cancel() {
      cleanupConnection?.();
      cleanupConnection = null;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
