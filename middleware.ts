import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except:
  // - API routes (/api/*)
  // - Static files (_next/static/*, _next/image/*, favicon.ico, etc.)
  matcher: ['/', '/(ja|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
