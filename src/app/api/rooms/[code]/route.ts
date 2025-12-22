import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateRoomCode } from '@/lib/room-code';
import { type GetRoomResponse, ERROR_MESSAGES } from '@/types/api';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/[code]
 * ルーム情報を取得する
 */
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<GetRoomResponse>> {
  try {
    const { code } = await params;

    // コード形式のバリデーション
    if (!validateRoomCode(code)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ROOM_CODE',
            message: ERROR_MESSAGES.INVALID_ROOM_CODE,
          },
        },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: ERROR_MESSAGES.ROOM_NOT_FOUND,
          },
        },
        { status: 404 }
      );
    }

    // 期限切れチェック
    if (room.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_EXPIRED',
            message: ERROR_MESSAGES.ROOM_EXPIRED,
          },
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        room: {
          id: room.id,
          code: room.code,
          createdAt: room.createdAt.toISOString(),
          expiresAt: room.expiresAt.toISOString(),
          messageCount: room._count.messages,
        },
      },
    });
  } catch (error) {
    console.error('Failed to get room:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    );
  }
}
