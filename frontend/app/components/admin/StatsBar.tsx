'use client';

import { DashboardStats } from '@/app/lib/adminApi';

interface StatsBarProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function StatsBar({ stats, loading }: StatsBarProps) {
  const statItems = [
    {
      label: 'Total Feedback',
      value: stats?.totalFeedback ?? 0,
      icon: '📬',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Open Items',
      value: stats?.openItems ?? 0,
      icon: '⏳',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      label: 'Avg. Priority',
      value: stats?.averagePriority ? stats.averagePriority.toFixed(1) : 'N/A',
      icon: '⭐',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      label: 'Top Tag',
      value: stats?.mostCommonTag ?? 'N/A',
      icon: '🏷️',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-lg h-24 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`${item.bgColor} rounded-lg p-6 border border-gray-200`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{item.label}</p>
              <p className={`text-3xl font-bold ${item.textColor} mt-2`}>
                {item.value}
              </p>
            </div>
            <span className="text-2xl">{item.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
