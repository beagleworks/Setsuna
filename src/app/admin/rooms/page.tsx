'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { AdminRoom } from '@/types/admin';

function AdminRoomsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      });

      const response = await fetch(`/api/admin/rooms?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (data.success) {
        setRooms(data.data.rooms);
        setTotal(data.data.total);
      } else {
        setError(data.error?.message || 'Failed to load rooms');
      }
    } catch {
      setError('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, router]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);
    params.set('page', '1');
    router.push(`/admin/rooms?${params}`);
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete room ${code}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rooms/${code}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        fetchRooms();
      } else {
        alert(data.error?.message || 'Failed to delete room');
      }
    } catch {
      alert('Failed to delete room');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rooms</h1>
        <p className="text-gray-400 mt-1">Manage all rooms</p>
      </div>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by room code..."
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Messages
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : rooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No rooms found
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/rooms/${room.code}`}
                      className="text-blue-400 hover:text-blue-300 font-mono"
                    >
                      {room.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(room.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(room.expiresAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{room.messageCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        room.isExpired
                          ? 'bg-red-900/50 text-red-300'
                          : 'bg-green-900/50 text-green-300'
                      }`}
                    >
                      {room.isExpired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(room.code)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
            rooms
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/rooms?page=${page - 1}${search ? `&search=${search}` : ''}${status !== 'all' ? `&status=${status}` : ''}`}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/rooms?page=${page + 1}${search ? `&search=${search}` : ''}${status !== 'all' ? `&status=${status}` : ''}`}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRoomsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <AdminRoomsContent />
    </Suspense>
  );
}
