'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          className={`px-2 py-1 uppercase tracking-wider transition-colors duration-100 ${
            locale === loc
              ? 'text-[#00ff88] border-b-2 border-[#00ff88]'
              : 'text-neutral-500 hover:text-white'
          }`}
          aria-current={locale === loc ? 'true' : undefined}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
