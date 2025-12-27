'use client';

import { useTranslations } from 'next-intl';
import { RoomCreator, RoomJoiner, LanguageSwitcher } from '@/components';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-black relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      {/* Logo and Title */}
      <div className="text-center mb-10 motion-safe:animate-fadeIn">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          {t('title')}
          <span className="text-[#00ff88]">_</span>
        </h1>
        <p className="mt-3 text-neutral-500 uppercase tracking-wider">{t('subtitle')}</p>
      </div>

      {/* Description */}
      <p className="text-center text-neutral-400 text-sm md:text-base max-w-md mb-8 motion-safe:animate-fadeIn leading-relaxed">
        {t('description')}
      </p>

      {/* Card Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Room Creator */}
        <div className="motion-safe:animate-fadeIn" style={{ animationDelay: '50ms' }}>
          <RoomCreator />
        </div>

        {/* Separator */}
        <div
          className="flex items-center gap-4 motion-safe:animate-fadeIn"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex-1 border-t-2 border-neutral-700" />
          <span className="text-sm text-neutral-400">{t('separator')}</span>
          <div className="flex-1 border-t-2 border-neutral-700" />
        </div>

        {/* Room Joiner */}
        <div className="motion-safe:animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <RoomJoiner />
        </div>
      </div>
    </main>
  );
}
