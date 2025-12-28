import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // /admin パスは next-intl のミドルウェアをスキップ
  if (pathname.startsWith('/admin')) {
    // ログインページ以外は認証チェック（Cookieの存在確認のみ）
    if (!pathname.startsWith('/admin/login')) {
      const token = request.cookies.get('admin_token');
      if (!token?.value) {
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
