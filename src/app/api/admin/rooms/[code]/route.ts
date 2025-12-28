import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAuth } from '@/lib/admin-auth';
import type { AdminRoomDetailResponse, AdminRoomDeleteResponse } from '@/types/admin';
import { ERROR_MESSAGES } from '@/types/api';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/admin/rooms/[code]
 * ルーム詳細を取得する
 */
export async function GET(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<AdminRoomDetailResponse>> {
  // 認証チェック
  const isAuthenticated = await verifyAdminAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
      },
      { status: 401 }
    );
  }

  try {
    const { code } = await params;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
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

    const now = new Date();

    return NextResponse.json({
      success: true,
      data: {
        room: {
          id: room.id,
          code: room.code,
          createdAt: room.createdAt.toISOString(),
          expiresAt: room.expiresAt.toISOString(),
          messageCount: room._count.messages,
          isExpired: room.expiresAt < now,
          messages: room.messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt.toISOString(),
          })),
        },
      },
    });
  } catch (error) {
    console.error('Failed to get room detail:', error);
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
 * DELETE /api/admin/rooms/[code]
 * ルームを削除する
 */
export async function DELETE(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<AdminRoomDeleteResponse>> {
  // 認証チェック
  const isAuthenticated = await verifyAdminAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
      },
      { status: 401 }
    );
  }

  try {
    const { code } = await params;

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

    // ルームを削除（Cascade deleteでメッセージも削除される）
    await prisma.room.delete({
      where: { code },
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: true,
        code,
      },
    });
  } catch (error) {
    console.error('Failed to delete room:', error);
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
