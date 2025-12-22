import { prisma } from '@/lib/db';
import { validateRoomCode } from '@/lib/room-code';
import { sseManager } from '@/lib/sse-manager';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/sse/[code]
 * SSEストリームを開始する
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  const { code } = await params;

  // コード形式のバリデーション
  if (!validateRoomCode(code)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_ROOM_CODE',
          message: 'ルームコードの形式が不正です',
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
          message: '指定されたルームは存在しないか、有効期限が切れています',
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
          message: 'ルームの有効期限が切れています',
        },
      }),
      {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // SSEストリームを作成
  const stream = new ReadableStream({
    start(controller) {
      // 接続を追加
      const connectionId = sseManager.addConnection(code, controller);

      // 接続確立イベントを送信
      const encoder = new TextEncoder();
      const connectedEvent = `event: connected\ndata: ${JSON.stringify({
        roomCode: code,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectedEvent));

      // キープアライブ用のping（30秒ごと）
      const pingInterval = setInterval(() => {
        try {
          const pingEvent = `event: ping\ndata: ${JSON.stringify({
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(encoder.encode(pingEvent));
        } catch {
          // 接続が切れている場合
          clearInterval(pingInterval);
          sseManager.removeConnection(code, connectionId);
        }
      }, 30000);

      // クリーンアップ関数を返す（接続終了時に呼ばれる）
      return () => {
        clearInterval(pingInterval);
        sseManager.removeConnection(code, connectionId);
      };
    },
    cancel() {
      // キャンセル時の処理（必要に応じて）
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
