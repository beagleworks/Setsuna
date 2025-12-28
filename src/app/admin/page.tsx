'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StatsCard } from '@/components/admin/StatsCard';
import type { AdminStats } from '@/types/admin';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error?.message || 'Failed to load stats');
      }
    } catch {
      setError('Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to delete all expired rooms?')) {
      return;
    }

    setIsCleaningUp(true);
    setCleanupResult(null);

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setCleanupResult(`Deleted ${data.data.deletedRooms} expired rooms`);
        // Refresh stats
        fetchStats();
      } else {
        setCleanupResult(`Error: ${data.error?.message}`);
      }
    } catch {
      setCleanupResult('Cleanup failed');
    } finally {
      setIsCleaningUp(false);
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
      <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of Setsuna activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Rooms"
          value={stats?.activeRooms ?? 0}
          description="Currently active"
        />
        <StatsCard
          title="Total Messages"
          value={stats?.totalMessages ?? 0}
          description="All time"
        />
        <StatsCard
          title="Rooms Today"
          value={stats?.roomsCreatedToday ?? 0}
          description="Created today"
        />
        <StatsCard
          title="Messages Today"
          value={stats?.messagesCreatedToday ?? 0}
          description="Sent today"
        />
      </div>

      {/* Daily Stats Chart */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Activity (Last 7 days)</h2>
        <div className="space-y-2">
          {stats?.dailyStats.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="text-sm text-gray-400 w-24">{day.date}</span>
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-4 bg-blue-600 rounded"
                  style={{ width: `${Math.min((day.rooms / 10) * 100, 100)}%`, minWidth: '4px' }}
                />
                <span className="text-xs text-gray-500">{day.rooms} rooms</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-4 bg-green-600 rounded"
                  style={{
                    width: `${Math.min((day.messages / 100) * 100, 100)}%`,
                    minWidth: '4px',
                  }}
                />
                <span className="text-xs text-gray-500">{day.messages} msgs</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Cleanup */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-2">Manual Cleanup</h2>
        <p className="text-gray-400 text-sm mb-4">
          Delete all expired rooms immediately. This runs automatically every hour.
        </p>
        <button
          onClick={handleCleanup}
          disabled={isCleaningUp}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isCleaningUp ? 'Cleaning up...' : 'Run Cleanup Now'}
        </button>
        {cleanupResult && (
          <p
            className={`mt-3 text-sm ${cleanupResult.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}
          >
            {cleanupResult}
          </p>
        )}
      </div>
    </div>
  );
}
