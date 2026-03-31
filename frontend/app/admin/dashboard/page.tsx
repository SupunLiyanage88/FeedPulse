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

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Check authentication on mount
  useEffect(() => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      router.push('/admin/login');
    } else {
      setToken(adminToken);
      setIsLoading(false);
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
  }, [token]);

  // Refetch feedback when filters change
  useEffect(() => {
    if (token) {
      setCurrentPage(1);
      fetchFeedback();
    }
  }, [category, status, sortBy, search, token]);

  // Refetch feedback when page changes
  useEffect(() => {
    if (token && currentPage > 1) {
      fetchFeedback();
    }
  }, [currentPage, token]);

  const handleStatusChange = async (feedbackId: string, newStatus: 'New' | 'In Review' | 'Resolved') => {
    if (!token) return;

    setStatusUpdating((prev) => ({ ...prev, [feedbackId]: true }));

    const result = await updateFeedbackStatus(token, feedbackId, newStatus);

    setStatusUpdating((prev) => ({ ...prev, [feedbackId]: false }));

    if (result.success) {
      // Update local state
      setFeedbacks((prev) =>
        prev.map((f) =>
          f._id === feedbackId ? { ...f, status: newStatus } : f
        )
      );
      // Refresh stats
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
      // Remove from local state
      setFeedbacks((prev) => prev.filter((f) => f._id !== feedbackId));
      // Refresh stats
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FeedPulse Admin</h1>
              <p className="text-gray-600 text-sm mt-1">Feedback Management Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <StatsBar stats={stats} loading={statsLoading} />

        {/* Weekly AI Summary */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-lg font-semibold text-gray-900">AI Weekly Summary</h2>
            <button
              onClick={fetchWeeklySummary}
              disabled={summaryLoading}
              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {summaryLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">Top 3 themes from the last 7 days of feedback.</p>
          <p className="text-gray-800 leading-relaxed">
            {summaryLoading
              ? 'Generating summary...'
              : summary?.summary || 'No summary available yet.'}
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Feedback items analyzed: {summary?.totalCount ?? 0}
          </p>
        </section>

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
