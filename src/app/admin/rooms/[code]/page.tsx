'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AdminRoomDetail } from '@/types/admin';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function AdminRoomDetailPage({ params }: PageProps) {
  const { code } = use(params);
  const router = useRouter();
  const [room, setRoom] = useState<AdminRoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/admin/rooms/${code}`);
        const data = await response.json();

        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (data.success) {
          setRoom(data.data.room);
        } else {
          setError(data.error?.message || 'Failed to load room');
        }
      } catch {
        setError('Failed to load room');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [code, router]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete room ${code}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rooms/${code}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        router.push('/admin/rooms');
      } else {
        alert(data.error?.message || 'Failed to delete room');
      }
    } catch {
      alert('Failed to delete room');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/admin/rooms" className="text-blue-400 hover:text-blue-300">
          ← Back to Rooms
        </Link>
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/rooms" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to Rooms
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Room: {room.code}</h1>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
        >
          Delete Room
        </button>
      </div>

      {/* Room Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Created</p>
            <p className="text-white">{new Date(room.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Expires</p>
            <p className="text-white">{new Date(room.expiresAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Messages</p>
            <p className="text-white">{room.messageCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                room.isExpired ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
              }`}
            >
              {room.isExpired ? 'Expired' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Messages ({room.messages.length})</h2>
        </div>
        <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
          {room.messages.length === 0 ? (
            <p className="px-6 py-4 text-gray-400">No messages</p>
          ) : (
            room.messages.map((message) => (
              <div key={message.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <pre className="text-white whitespace-pre-wrap break-words flex-1 font-mono text-sm bg-gray-900 p-3 rounded">
                    {message.content}
                  </pre>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
