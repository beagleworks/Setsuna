import { NextResponse } from 'next/server';
import { buildClearAuthCookieValue } from '@/lib/admin-auth';
import type { AdminLogoutResponse } from '@/types/admin';

/**
 * POST /api/admin/auth/logout
 * 管理者ログアウト
 */
export async function POST(): Promise<NextResponse<AdminLogoutResponse>> {
  const response = NextResponse.json({
    success: true,
    data: {
      loggedOut: true,
    },
  });
  response.headers.set('Set-Cookie', buildClearAuthCookieValue());

  return response;
}
