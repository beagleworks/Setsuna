import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateRoomCode } from '@/lib/room-code';
import {
  rateLimiter,
  getClientIP,
  createRateLimitHeaders,
  DEFAULT_RATE_LIMIT_MAX_REQUESTS,
} from '@/lib/rate-limiter';
import { ROOM_EXPIRY_HOURS, ERROR_MESSAGES, type CreateRoomResponse } from '@/types/api';

/**
 * POST /api/rooms
 * 新しいルームを作成する
 */
export async function POST(request: Request): Promise<NextResponse<CreateRoomResponse>> {
  try {
    // レート制限チェック
    const ip = getClientIP(request);
    const rateLimit = rateLimiter.check(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          },
        },
        {
          status: 429,
          headers: {
            ...createRateLimitHeaders(rateLimit, DEFAULT_RATE_LIMIT_MAX_REQUESTS),
          },
        }
      );
    }

    rateLimiter.increment(ip);
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
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    );
  }
}
