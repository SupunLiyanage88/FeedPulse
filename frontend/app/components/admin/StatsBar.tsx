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
      icon: 'TF',
      bgColor: 'bg-[#eaf3fc]',
      textColor: 'text-[#2e74b5]',
    },
    {
      label: 'Open Items',
      value: stats?.openItems ?? 0,
      icon: 'OI',
      bgColor: 'bg-[#fdf4df]',
      textColor: 'text-[#9f6b0c]',
    },
    {
      label: 'Avg. Priority',
      value: stats?.averagePriority ? stats.averagePriority.toFixed(1) : 'N/A',
      icon: 'AP',
      bgColor: 'bg-[#eef0fb]',
      textColor: 'text-[#4e5ea8]',
    },
    {
      label: 'Top Tag',
      value: stats?.mostCommonTag ?? 'N/A',
      icon: 'TT',
      bgColor: 'bg-[#e8f7ef]',
      textColor: 'text-[#2f7a4a]',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-[#d7e6f4] bg-[#eaf2fb]"
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
          className={`rounded-2xl border border-[#d0e1f1] p-5 ${item.bgColor}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-[#4d6e8d]">{item.label}</p>
              <p className={`mt-2 text-3xl font-bold ${item.textColor}`}>
                {item.value}
              </p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#355b7a]">{item.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
