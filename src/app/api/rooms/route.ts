import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateRoomCode } from '@/lib/room-code';
import { ROOM_EXPIRY_HOURS, type CreateRoomResponse } from '@/types/api';

/**
 * POST /api/rooms
 * 新しいルームを作成する
 */
export async function POST(): Promise<NextResponse<CreateRoomResponse>> {
  try {
    const code = generateRoomCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ROOM_EXPIRY_HOURS);

    const room = await prisma.room.create({
      data: {
        code,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          room: {
            code: room.code,
            expiresAt: room.expiresAt.toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}
