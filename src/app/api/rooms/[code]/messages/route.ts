import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateRoomCode } from '@/lib/room-code';
import { sseManager } from '@/lib/sse-manager';
import {
  type GetMessagesResponse,
  type CreateMessageResponse,
  ERROR_MESSAGES,
  MAX_MESSAGE_LENGTH,
  DEFAULT_MESSAGE_LIMIT,
  MAX_MESSAGE_LIMIT,
} from '@/types/api';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/[code]/messages
 * メッセージ一覧を取得する
 */
export async function GET(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<GetMessagesResponse>> {
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

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const parsedLimit = parseInt(limitParam || String(DEFAULT_MESSAGE_LIMIT), 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), MAX_MESSAGE_LIMIT)
      : DEFAULT_MESSAGE_LIMIT;

    // メッセージを取得
    const messages = await prisma.message.findMany({
      where: {
        roomId: room.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1, // hasMore判定用に+1
    });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
        hasMore,
      },
    });
  } catch (error) {
    console.error('Failed to get messages:', error);
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

/**
 * POST /api/rooms/[code]/messages
 * メッセージを送信する
 */
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<CreateMessageResponse>> {
  try {
    const { code } = await params;
    const body = await request.json();
    const { content } = body;

    // コンテンツのバリデーション
    if (!content || content.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTENT_EMPTY',
            message: ERROR_MESSAGES.CONTENT_EMPTY,
          },
        },
        { status: 400 }
      );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTENT_TOO_LONG',
            message: ERROR_MESSAGES.CONTENT_TOO_LONG,
          },
        },
        { status: 400 }
      );
    }

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

    // メッセージを作成
    const message = await prisma.message.create({
      data: {
        content,
        roomId: room.id,
      },
    });

    const messageData = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };

    // SSEでブロードキャスト
    sseManager.broadcast(code, 'message', messageData);

    return NextResponse.json(
      {
        success: true,
        data: {
          message: messageData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create message:', error);
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
