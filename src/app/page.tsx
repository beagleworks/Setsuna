'use client';

import { RoomCreator, RoomJoiner } from '@/components';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      {/* ロゴとタイトル */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Setsuna</h1>
        <p className="mt-2 text-gray-500">デバイス間でテキストを共有</p>
      </div>

      {/* カード コンテナ */}
      <div className="w-full max-w-md space-y-6">
        {/* ルーム作成 */}
        <RoomCreator />

        {/* 区切り線 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-sm text-gray-400">または</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* ルーム参加 */}
        <RoomJoiner />
      </div>
    </main>
  );
}
