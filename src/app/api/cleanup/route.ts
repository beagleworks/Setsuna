import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { type CleanupResponse, ERROR_MESSAGES } from '@/types/api';

/**
 * POST /api/cleanup
 * 期限切れのルームを削除する（Vercel Cron Jobs用）
 */
export async function POST(request: Request): Promise<NextResponse<CleanupResponse>> {
  try {
    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    const vercelCron = request.headers.get('x-vercel-cron');

    const isAuthorized =
      vercelCron === '1' || (authHeader && authHeader === `Bearer ${process.env.CRON_SECRET}`);

    if (!isAuthorized) {
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

    // 期限切れルームを削除
    const result = await prisma.room.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedRooms: result.count,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to cleanup expired rooms:', error);
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
