'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getDashboardStats,
  getFeedbackList,
  updateFeedbackStatus,
  deleteFeedback,
  retriggerFeedbackAnalysis,
  getWeeklySummary,
  DashboardStats,
  WeeklySummaryResponse,
  Feedback,
} from '@/app/lib/adminApi';
import { getAdminToken, clearAdminAuth } from '@/app/lib/adminAuth';
import StatsBar from '@/app/components/admin/StatsBar';
import FilterBar from '@/app/components/admin/FilterBar';
import FeedbackTable from '@/app/components/admin/FeedbackTable';
import Pagination from '@/app/components/admin/Pagination';
import { 
  LogOut, 
  RefreshCw, 
  TrendingUp, 
  MessageSquare, 
  BarChart3,
  Sparkles 
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [summary, setSummary] = useState<WeeklySummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Filter states
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action states
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});
  const [reanalyzing, setReanalyzing] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  // Initialize token and check authentication on client-side mount
  useEffect(() => {
    const storedToken = getAdminToken();
    setToken(storedToken);
    setIsHydrated(true);

    if (!storedToken) {
      router.push('/admin/login');
    }
  }, [router]);

  // Fetch stats
  const fetchStats = async () => {
    if (!token) return;
    setStatsLoading(true);
    const result = await getDashboardStats(token);
    if (result.success) {
      setStats(result.data || null);
    } else {
      console.error('Failed to fetch stats:', result.message);
    }
    setStatsLoading(false);
  };

  // Fetch feedback
  const fetchFeedback = async () => {
    if (!token) return;
    setFeedbackLoading(true);
    const result = await getFeedbackList(token, {
      page: currentPage,
      limit: 10,
      category: category === 'All' ? undefined : category,
      status: status === 'All' ? undefined : status,
      sortBy,
      search: search || undefined,
    });
    if (result.success && result.data) {
      setFeedbacks(result.data.feedbacks);
      setTotalPages(result.data.pagination.pages);
      setCurrentPage(result.data.pagination.page);
    } else {
      console.error('Failed to fetch feedback:', result.message);
    }
    setFeedbackLoading(false);
  };

  const fetchWeeklySummary = async () => {
    if (!token) return;
    setSummaryLoading(true);
    const result = await getWeeklySummary(token);
    if (result.success && result.data) {
      setSummary(result.data);
    } else {
      console.error('Failed to fetch summary:', result.message);
    }
    setSummaryLoading(false);
  };

  // Fetch data on mount
  useEffect(() => {
    if (token) {
      fetchStats();
      fetchFeedback();
      fetchWeeklySummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Refetch feedback when filters change
  useEffect(() => {
    if (token) {
      setCurrentPage(1);
      fetchFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, sortBy, search, token]);

  // Refetch feedback when page changes
  useEffect(() => {
    if (token && currentPage > 1) {
      fetchFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, token]);

  const handleStatusChange = async (feedbackId: string, newStatus: 'New' | 'In Review' | 'Resolved') => {
    if (!token) return;

    setStatusUpdating((prev) => ({ ...prev, [feedbackId]: true }));

    const result = await updateFeedbackStatus(token, feedbackId, newStatus);

    setStatusUpdating((prev) => ({ ...prev, [feedbackId]: false }));

    if (result.success) {
      setFeedbacks((prev) =>
        prev.map((f) =>
          f._id === feedbackId ? { ...f, status: newStatus } : f
        )
      );
      fetchStats();
    } else {
      alert('Failed to update status: ' + result.message);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!token) return;

    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    setDeleting((prev) => ({ ...prev, [feedbackId]: true }));

    const result = await deleteFeedback(token, feedbackId);

    setDeleting((prev) => ({ ...prev, [feedbackId]: false }));

    if (result.success) {
      setFeedbacks((prev) => prev.filter((f) => f._id !== feedbackId));
      fetchStats();
      fetchWeeklySummary();
    } else {
      alert('Failed to delete feedback: ' + result.message);
    }
  };

  const handleReanalyzeFeedback = async (feedbackId: string) => {
    if (!token) return;

    setReanalyzing((prev) => ({ ...prev, [feedbackId]: true }));
    const result = await retriggerFeedbackAnalysis(token, feedbackId);
    setReanalyzing((prev) => ({ ...prev, [feedbackId]: false }));

    if (!result.success || !result.data) {
      alert('Failed to re-run AI analysis: ' + result.message);
      return;
    }

    setFeedbacks((prev) =>
      prev.map((feedback) =>
        feedback._id === feedbackId ? result.data! : feedback
      )
    );
    fetchStats();
    fetchWeeklySummary();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchFeedback();
  };

  const handleLogout = () => {
    clearAdminAuth();
    router.push('/admin/login');
  };

  // Show loading state until hydration is complete
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-r from-slate-50 to-slate-100">
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-xl">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-r from-slate-50 to-slate-100">
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-xl">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-bold bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  FeedPulse
                </h1>
                <p className="text-xs text-slate-500">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:shadow-md"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <StatsBar stats={stats} loading={statsLoading} />

        {/* Weekly AI Summary */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
          <div className="border-b border-slate-100 bg-linear-to-r from-indigo-50/50 to-purple-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <h2 className="text-base font-semibold text-slate-800">AI Weekly Summary</h2>
              </div>
              <button
                onClick={fetchWeeklySummary}
                disabled={summaryLoading}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
                <span>{summaryLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Top insights from the last 7 days</p>
          </div>
          <div className="p-6">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyzing feedback patterns...</span>
                </div>
              </div>
            ) : (
              <>
                <p className="leading-relaxed text-slate-700">
                  {summary?.summary || 'No feedback data available for the past week.'}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>{summary?.totalCount ?? 0} feedback items analyzed</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          category={category}
          status={status}
          sortBy={sortBy}
          search={search}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onSortChange={setSortBy}
          onSearchChange={setSearch}
          onSearch={handleSearch}
        />

        {/* Feedback Table */}
        <FeedbackTable
          feedbacks={feedbacks}
          loading={feedbackLoading}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteFeedback}
          onReanalyze={handleReanalyzeFeedback}
          statusUpdating={statusUpdating}
          reanalyzing={reanalyzing}
          deleting={deleting}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            loading={feedbackLoading}
          />
        )}
      </main>
    </div>
  );
}