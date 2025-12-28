import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAuth } from '@/lib/admin-auth';
import type { AdminStatsResponse, DailyStat } from '@/types/admin';
import { ERROR_MESSAGES } from '@/types/api';

/**
 * GET /api/admin/stats
 * 統計情報を取得する
 */
export async function GET(request: Request): Promise<NextResponse<AdminStatsResponse>> {
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
    const now = new Date();

    // アクティブルーム数（期限切れでないもの）
    const activeRooms = await prisma.room.count({
      where: {
        expiresAt: { gt: now },
      },
    });

    // 総メッセージ数
    const totalMessages = await prisma.message.count();

    // 今日の開始時刻
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 今日作成されたルーム数
    const roomsCreatedToday = await prisma.room.count({
      where: {
        createdAt: { gte: todayStart },
      },
    });

    // 今日作成されたメッセージ数
    const messagesCreatedToday = await prisma.message.count({
      where: {
        createdAt: { gte: todayStart },
      },
    });

    // 過去7日間の日別統計
    const dailyStats = await getDailyStats(7);

    return NextResponse.json({
      success: true,
      data: {
        activeRooms,
        totalMessages,
        roomsCreatedToday,
        messagesCreatedToday,
        dailyStats,
      },
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
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
 * 過去N日間の日別統計を取得する
 */
async function getDailyStats(days: number): Promise<DailyStat[]> {
  const stats: DailyStat[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [rooms, messages] = await Promise.all([
      prisma.room.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
    ]);

    stats.push({
      date: date.toISOString().split('T')[0],
      rooms,
      messages,
    });
  }

  return stats;
}
