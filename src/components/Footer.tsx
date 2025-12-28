'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="py-4 px-4 border-t border-neutral-800">
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm">
        {/* Copyright */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">© 2025 びーぐる(Beagle Works)</span>
          <a
            href="https://x.com/beagle_dog_inu"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="text-neutral-500 hover:text-white transition-colors duration-100"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>

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
