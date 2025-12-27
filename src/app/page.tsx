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

      {/* 説明文 */}
      <p className="text-center text-neutral-400 text-sm md:text-base max-w-md mb-8 motion-safe:animate-fadeIn leading-relaxed">
        6文字のルームコードを共有するだけで、
        <br className="hidden md:inline" />
        複数デバイス間でテキストをリアルタイム同期。
        <br />
        ルームは24時間後に自動削除されます。
      </p>

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
          <span className="text-sm text-neutral-400">または</span>
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
