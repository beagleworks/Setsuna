import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
