import createMiddleware from 'next-intl/middleware';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);
const ADMIN_COOKIE_NAME = 'admin_token';

async function hasValidAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  const secretKey = process.env.ADMIN_JWT_SECRET;
  if (!secretKey) {
    return false;
  }

  try {
    const secret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // /admin パスは next-intl のミドルウェアをスキップ
  if (pathname.startsWith('/admin')) {
    // ログインページ以外はJWT検証
    if (!pathname.startsWith('/admin/login')) {
      const isAuthenticated = await hasValidAdminToken(request);
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
    return NextResponse.next();
  }

  // 通常のi18nミドルウェア処理
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except:
  // - API routes (/api/*)
  // - Static files (_next/static/*, _next/image/*, favicon.ico, etc.)
  matcher: ['/', '/(ja|en)/:path*', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
