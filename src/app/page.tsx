'use client';

import { RoomCreator, RoomJoiner } from '@/components';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-black">
      {/* ロゴとタイトル */}
      <div className="text-center mb-10 motion-safe:animate-fadeIn">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          SETSUNA<span className="text-[#00ff88]">_</span>
        </h1>
        <p className="mt-3 text-neutral-500 uppercase tracking-wider">[リアルタイムテキスト共有]</p>
      </div>

      {/* カード コンテナ */}
      <div className="w-full max-w-md space-y-6">
        {/* ルーム作成 */}
        <div className="motion-safe:animate-fadeIn" style={{ animationDelay: '50ms' }}>
          <RoomCreator />
        </div>

        {/* 区切り線 */}
        <div
          className="flex items-center gap-4 motion-safe:animate-fadeIn"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex-1 border-t-2 border-neutral-700" />
          <span className="text-sm text-neutral-400 font-mono">{'//OR//'}</span>
          <div className="flex-1 border-t-2 border-neutral-700" />
        </div>

        {/* ルーム参加 */}
        <div className="motion-safe:animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <RoomJoiner />
        </div>
      </div>
    </main>
  );
}
