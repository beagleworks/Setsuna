'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Footer } from './Footer';

interface Section {
  title: string;
  content: string;
  items?: string[];
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  sections: Record<string, Section>;
}

export function LegalPageLayout({ title, lastUpdated, sections }: LegalPageLayoutProps) {
  const t = useTranslations('header');

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-neutral-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-neutral-400 hover:text-white font-mono uppercase tracking-wider text-sm transition-colors duration-100"
          >
            {t('back')}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:py-12">
        <article className="max-w-3xl mx-auto">
          {/* Page Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-wider mb-2">
            {title}
            <span className="text-[#00ff88]">_</span>
          </h1>
          <p className="text-neutral-500 text-sm font-mono mb-8">{lastUpdated}</p>

          {/* Sections */}
          <div className="space-y-8">
            {Object.entries(sections).map(([key, section]) => (
              <section key={key} className="border-l-2 border-neutral-700 pl-4">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3">
                  {section.title}
                </h2>
                <p className="text-neutral-400 leading-relaxed">{section.content}</p>
                {section.items && section.items.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item, index) => (
                      <li key={index} className="text-neutral-400 pl-4 border-l border-neutral-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
