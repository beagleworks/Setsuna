import { NextResponse } from 'next/server';
import { getAuthCookieName } from '@/lib/admin-auth';
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

  // Cookie削除（Max-Age=0で即座に期限切れ）
  const cookieValue = [
    `${getAuthCookieName()}=`,
    'Max-Age=0',
    'Path=/admin',
    'HttpOnly',
    'SameSite=Strict',
  ].join('; ');

  response.headers.set('Set-Cookie', cookieValue);

  return response;
}
