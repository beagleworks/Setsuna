import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAuth } from '@/lib/admin-auth';
import type { AdminRoomsResponse, AdminRoomsQuery } from '@/types/admin';
import { ADMIN_DEFAULT_PAGE_SIZE, ADMIN_MAX_PAGE_SIZE } from '@/types/admin';
import { ERROR_MESSAGES } from '@/types/api';

/**
 * GET /api/admin/rooms
 * ルーム一覧を取得する
 */
export async function GET(request: Request): Promise<NextResponse<AdminRoomsResponse>> {
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
    const { searchParams } = new URL(request.url);
    const query = parseQuery(searchParams);

    const now = new Date();
    const whereClause = buildWhereClause(query, now);

    // 総件数を取得
    const total = await prisma.room.count({ where: whereClause });

    // ルーム一覧を取得
    const rooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    // レスポンス形式に変換
    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      code: room.code,
      createdAt: room.createdAt.toISOString(),
      expiresAt: room.expiresAt.toISOString(),
      messageCount: room._count.messages,
      isExpired: room.expiresAt < now,
    }));

    return NextResponse.json({
      success: true,
      data: {
        rooms: formattedRooms,
        total,
        page: query.page,
        pageSize: query.pageSize,
      },
    });
  } catch (error) {
    console.error('Failed to get rooms:', error);
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

function parseQuery(searchParams: URLSearchParams): Required<AdminRoomsQuery> {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    ADMIN_MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('pageSize') || String(ADMIN_DEFAULT_PAGE_SIZE), 10))
  );
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') || 'all') as 'all' | 'active' | 'expired';
  const sortBy = (searchParams.get('sortBy') || 'createdAt') as
    | 'createdAt'
    | 'expiresAt'
    | 'messageCount';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  return { page, pageSize, search, status, sortBy, sortOrder };
}

function buildWhereClause(query: Required<AdminRoomsQuery>, now: Date) {
  const where: Record<string, unknown> = {};

  if (query.search) {
    where.code = {
      contains: query.search,
      mode: 'insensitive',
    };
  }

  if (query.status === 'active') {
    where.expiresAt = { gt: now };
  } else if (query.status === 'expired') {
    where.expiresAt = { lte: now };
  }

  return where;
}
