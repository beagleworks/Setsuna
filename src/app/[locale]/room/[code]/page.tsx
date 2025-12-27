'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RoomHeader, MessageInput, MessageList } from '@/components';
import { useSSE } from '@/hooks';
import { Link } from '@/i18n/navigation';
import { Message, GetRoomResponse, GetMessagesResponse, CreateMessageResponse } from '@/types/api';
import { validateRoomCode } from '@/lib/room-code';

interface RoomData {
  code: string;
  expiresAt: Date;
  messages: Message[];
}

export default function RoomPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();
  const t = useTranslations('room');

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'ROOM_NOT_FOUND' | 'ROOM_EXPIRED' | 'GENERIC' | null>(
    null
  );
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    if (!code || !validateRoomCode(code)) {
      setError(t('error.invalidCode'));
      setErrorType('GENERIC');
      setLoading(false);
      return;
    }

    try {
      // Fetch room info
      const roomResponse = await fetch(`/api/rooms/${code}`);
      const roomJson = (await roomResponse.json()) as GetRoomResponse;

      if (!roomJson.success || !roomJson.data) {
        if (roomJson.error?.code === 'ROOM_NOT_FOUND') {
          setError(t('error.notFound'));
          setErrorType('ROOM_NOT_FOUND');
        } else if (roomJson.error?.code === 'ROOM_EXPIRED') {
          setError(t('error.expired'));
          setErrorType('ROOM_EXPIRED');
        } else {
          setError(roomJson.error?.message || t('error.generic'));
          setErrorType('GENERIC');
        }
        setLoading(false);
        return;
      }

      // Fetch messages
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
      setError(t('error.connectionError'));
      setErrorType('GENERIC');
    } finally {
      setLoading(false);
    }
  }, [code, t]);

  // Initial data fetch
  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // SSE connection (receive new messages in real-time)
  const {
    isConnected,
    error: sseError,
    reconnect,
  } = useSSE(code || '', {
    onMessage: (message) => {
      setRoomData((prev) => {
        if (!prev) return prev;
        // Duplicate check
        if (prev.messages.some((m) => m.id === message.id)) {
          return prev;
        }
        // Add new message at the beginning
        return {
          ...prev,
          messages: [message, ...prev.messages],
        };
      });
    },
    onConnected: () => {
      // Fetch latest messages on connection
    },
    onError: () => {
      // Error handling via sseError display
    },
  });

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!code) return;

    setSending(true);
    setSendError(null);
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
        throw new Error(json.error?.message || t('error.sendFailed'));
      }

      // Optimistic update: add sent message to UI immediately
      const newMessage = json.data.message;
      setRoomData((prev) => {
        if (!prev) return prev;
        // Duplicate check (same message may arrive via SSE)
        if (prev.messages.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return {
          ...prev,
          messages: [newMessage, ...prev.messages],
        };
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('error.sendFailed');
      setSendError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center font-mono">
          <div className="text-[#00ff88] text-2xl animate-pulse">{t('loading')}</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 text-[#ff3366]">!</div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2">
            {errorType === 'ROOM_EXPIRED' ? t('error.expiredTitle') : t('error.title')}
          </h2>
          <p className="text-neutral-400 mb-6 font-mono">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#00ff88] text-black font-bold uppercase tracking-wider border-2 border-[#00ff88] hover:bg-black hover:text-[#00ff88] transition-colors duration-100"
          >
            {t('button.createNew')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Header */}
      <RoomHeader code={roomData.code} expiresAt={roomData.expiresAt.toISOString()} />

      {/* Connection Status */}
      {sseError && (
        <div className="bg-[#ffff00]/10 border-b-2 border-[#ffff00] px-4 py-2 text-center">
          <span className="text-[#ffff00] text-sm font-mono">{sseError}</span>
          <button
            onClick={reconnect}
            className="ml-2 text-[#ffff00] underline text-sm font-mono hover:text-white"
          >
            {t('button.reconnect')}
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Send Error Display */}
          {sendError && (
            <div
              role="alert"
              className="p-3 bg-[#ff3366]/10 border-2 border-[#ff3366] text-[#ff3366] text-sm font-mono flex items-center justify-between"
            >
              <span>{sendError}</span>
              <button
                onClick={() => setSendError(null)}
                className="ml-2 text-[#ff3366] hover:text-white font-bold"
                aria-label={t('button.closeError')}
              >
                ✕
              </button>
            </div>
          )}

          {/* Message Input */}
          <MessageInput onSubmit={handleSendMessage} disabled={sending} />

          {/* Message List */}
          <MessageList messages={roomData.messages} />
        </div>
      </main>

      {/* Connection Indicator */}
      <div className="fixed bottom-4 right-4">
        <div
          className={`w-3 h-3 ${isConnected ? 'bg-[#00ff88]' : 'bg-neutral-600'}`}
          title={isConnected ? t('status.connected') : t('status.disconnected')}
        />
      </div>
    </div>
  );
}
