'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RoomHeader, MessageInput, MessageList } from '@/components';
import { useSSE } from '@/hooks';
import { Message, GetRoomResponse, GetMessagesResponse, CreateMessageResponse } from '@/types/api';
import { validateRoomCode } from '@/lib/room-code';

interface RoomData {
  code: string;
  expiresAt: Date;
  messages: Message[];
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'ROOM_NOT_FOUND' | 'ROOM_EXPIRED' | 'GENERIC' | null>(
    null
  );
  const [sending, setSending] = useState(false);

  // ルームデータの取得
  const fetchRoom = useCallback(async () => {
    if (!code || !validateRoomCode(code)) {
      setError('無効なルームコードです');
      setErrorType('GENERIC');
      setLoading(false);
      return;
    }

    try {
      // ルーム情報を取得
      const roomResponse = await fetch(`/api/rooms/${code}`);
      const roomJson = (await roomResponse.json()) as GetRoomResponse;

      if (!roomJson.success || !roomJson.data) {
        if (roomJson.error?.code === 'ROOM_NOT_FOUND') {
          setError('ルームが見つかりません');
          setErrorType('ROOM_NOT_FOUND');
        } else if (roomJson.error?.code === 'ROOM_EXPIRED') {
          setError('このルームは有効期限が切れています');
          setErrorType('ROOM_EXPIRED');
        } else {
          setError(roomJson.error?.message || 'エラーが発生しました');
          setErrorType('GENERIC');
        }
        setLoading(false);
        return;
      }

      // メッセージ一覧を取得
      const messagesResponse = await fetch(`/api/rooms/${code}/messages`);
      const messagesJson = (await messagesResponse.json()) as GetMessagesResponse;

      const messages = messagesJson.success && messagesJson.data ? messagesJson.data.messages : [];

      setRoomData({
        code: roomJson.data.room.code,
        expiresAt: new Date(roomJson.data.room.expiresAt),
        messages,
      });
      setError(null);
    } catch {
      setError('接続エラーが発生しました');
      setErrorType('GENERIC');
    } finally {
      setLoading(false);
    }
  }, [code]);

  // 初期データ取得
  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // SSE接続（新しいメッセージをリアルタイムで受信）
  const {
    isConnected,
    error: sseError,
    reconnect,
  } = useSSE(code || '', {
    onMessage: (message) => {
      setRoomData((prev) => {
        if (!prev) return prev;
        // 重複チェック
        if (prev.messages.some((m) => m.id === message.id)) {
          return prev;
        }
        // 新しいメッセージを先頭に追加
        return {
          ...prev,
          messages: [message, ...prev.messages],
        };
      });
    },
    onConnected: () => {
      // 接続時に最新のメッセージを取得
    },
    onError: () => {
      // エラー処理はsseErrorで表示
    },
  });

  // メッセージ送信
  const handleSendMessage = async (content: string) => {
    if (!code) return;

    setSending(true);
    try {
      const response = await fetch(`/api/rooms/${code}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const json: CreateMessageResponse = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message || 'メッセージの送信に失敗しました');
      }

      // 楽観的更新：送信したメッセージを即座にUIに追加
      const newMessage = json.data.message;
      setRoomData((prev) => {
        if (!prev) return prev;
        // 重複チェック（SSEからも同じメッセージが届く可能性があるため）
        if (prev.messages.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return {
          ...prev,
          messages: [newMessage, ...prev.messages],
        };
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'メッセージの送信に失敗しました';
      throw new Error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center font-mono">
          <div className="text-[#00ff88] text-2xl animate-pulse">[LOADING...]</div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error || !roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 text-[#ff3366]">!</div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2">
            {errorType === 'ROOM_EXPIRED' ? '[期限切れ]' : '[エラー]'}
          </h2>
          <p className="text-neutral-400 mb-6 font-mono">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#00ff88] text-black font-bold uppercase tracking-wider border-2 border-[#00ff88] hover:bg-black hover:text-[#00ff88] transition-colors duration-100"
          >
            新規ルーム作成
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* ヘッダー */}
      <RoomHeader code={roomData.code} expiresAt={roomData.expiresAt.toISOString()} />

      {/* 接続ステータス */}
      {sseError && (
        <div className="bg-[#ffff00]/10 border-b-2 border-[#ffff00] px-4 py-2 text-center">
          <span className="text-[#ffff00] text-sm font-mono">{sseError}</span>
          <button
            onClick={reconnect}
            className="ml-2 text-[#ffff00] underline text-sm font-mono hover:text-white"
          >
            [再接続]
          </button>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* メッセージ入力 */}
          <MessageInput onSubmit={handleSendMessage} disabled={sending} />

          {/* メッセージ一覧 */}
          <MessageList messages={roomData.messages} />
        </div>
      </main>

      {/* 接続インジケーター */}
      <div className="fixed bottom-4 right-4">
        <div
          className={`w-3 h-3 ${isConnected ? 'bg-[#00ff88]' : 'bg-neutral-600'}`}
          title={isConnected ? '接続中' : '切断'}
        />
      </div>
    </div>
  );
}
