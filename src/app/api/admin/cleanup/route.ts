import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAuth } from '@/lib/admin-auth';
import type { AdminCleanupResponse } from '@/types/admin';
import { ERROR_MESSAGES } from '@/types/api';

/**
 * POST /api/admin/cleanup
 * 期限切れルームを手動でクリーンアップする
 */
export async function POST(request: Request): Promise<NextResponse<AdminCleanupResponse>> {
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
