import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { routing } from '@/i18n/routing';

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  // Accept-Languageに'ja'または'ja-*'が含まれていれば日本語
  const preferJapanese = acceptLanguage.split(',').some((lang) => {
    const [code] = lang.trim().split(';');
    return code === 'ja' || code.startsWith('ja-');
  });

  const locale = preferJapanese ? 'ja' : routing.defaultLocale;
  redirect(`/${locale}`);
}
