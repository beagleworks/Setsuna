'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="py-4 px-4 border-t border-neutral-800">
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm">
        {/* Copyright */}
        <span className="text-neutral-500">© 2025 びーぐる(Beagle Works)</span>

        {/* Legal Links */}
        <nav className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="text-neutral-500 hover:text-white transition-colors duration-100"
          >
            {t('privacy')}
          </Link>
          <span className="text-neutral-700">|</span>
          <Link
            href="/terms"
            className="text-neutral-500 hover:text-white transition-colors duration-100"
          >
            {t('terms')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
