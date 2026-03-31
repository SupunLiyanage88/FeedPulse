'use client';

import { Feedback } from '@/app/lib/adminApi';

interface FeedbackTableProps {
  feedbacks: Feedback[];
  loading: boolean;
  onStatusChange: (feedbackId: string, newStatus: 'New' | 'In Review' | 'Resolved') => void;
  onDelete: (feedbackId: string) => void;
  onReanalyze: (feedbackId: string) => void;
  statusUpdating: Record<string, boolean>;
  reanalyzing: Record<string, boolean>;
  deleting: Record<string, boolean>;
}

const getCategoryBadgeColor = (category: string) => {
  const colors: Record<string, string> = {
    'Bug': 'bg-[#ffecef] text-[#a01f31]',
    'Feature Request': 'bg-[#deebf8] text-[#1f4e78]',
    'Improvement': 'bg-[#f0ecfb] text-[#5a3d9b]',
    'Other': 'bg-[#eef3f8] text-[#496b88]',
  };
  return colors[category] || 'bg-[#eef3f8] text-[#496b88]';
};

const getSentimentBadgeColor = (sentiment: string | undefined) => {
  if (!sentiment) return 'bg-[#eef3f8] text-[#5a7893]';
  const colors: Record<string, string> = {
    'Positive': 'bg-[#e8f7ef] text-[#2d7145]',
    'Neutral': 'bg-[#fff4df] text-[#986607]',
    'Negative': 'bg-[#ffecef] text-[#a01f31]',
  };
  return colors[sentiment] || 'bg-[#eef3f8] text-[#5a7893]';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'New': 'bg-[#deebf8] text-[#1f4e78] border-[#bfd6ec]',
    'In Review': 'bg-[#fff4df] text-[#986607] border-[#efd9a7]',
    'Resolved': 'bg-[#e8f7ef] text-[#2d7145] border-[#badfc8]',
  };
  return colors[status] || 'bg-[#eef3f8] text-[#496b88] border-[#c6d8ea]';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function FeedbackTable({
  feedbacks,
  loading,
  onStatusChange,
  onDelete,
  onReanalyze,
  statusUpdating,
  reanalyzing,
  deleting,
}: FeedbackTableProps) {
  if (loading) {
    return (
      <div className="fp-card overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 border-b border-[#d8e7f4] bg-[#edf4fb] p-6"
            />
          ))}
        </div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="fp-card p-10 text-center">
        <p className="text-lg text-[#607f9b]">No feedback found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="fp-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#d5e5f3] bg-[#edf4fb]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#3b5e7e]">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#3b5e7e]">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#3b5e7e]">
                Sentiment
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#3b5e7e]">
                Priority
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#3b5e7e]">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#3b5e7e]">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#3b5e7e]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((feedback) => (
              <tr
                key={feedback._id}
                className="border-b border-[#e1edf8] transition hover:bg-[#f7fbff]"
              >
                {/* Title */}
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#1f4e78]">{feedback.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[#567693]">
                      {feedback.ai_summary || feedback.description}
                    </p>
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(feedback.category)}`}>
                    {feedback.category}
                  </span>
                </td>

                {/* Sentiment */}
                <td className="px-6 py-4">
                  {feedback.ai_sentiment ? (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSentimentBadgeColor(feedback.ai_sentiment)}`}>
                      {feedback.ai_sentiment}
                    </span>
                  ) : (
                    <span className="text-sm text-[#89a2ba]">-</span>
                  )}
                </td>

                {/* Priority */}
                <td className="px-6 py-4">
                  {feedback.ai_priority ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-[#d5e5f3]">
                        <div
                          className="h-2 rounded-full bg-[#2e74b5]"
                          style={{ width: `${(feedback.ai_priority / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-[#355b7a]">
                        {feedback.ai_priority}/10
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#89a2ba]">-</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <select
                    value={feedback.status}
                    onChange={(e) =>
                      onStatusChange(
                        feedback._id,
                        e.target.value as 'New' | 'In Review' | 'Resolved'
                      )
                    }
                    disabled={statusUpdating[feedback._id] || false}
                    className={`rounded-lg border px-3 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2e74b5]/30 disabled:opacity-50 ${getStatusColor(feedback.status)}`}
                  >
                    <option value="New">New</option>
                    <option value="In Review">In Review</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>

                {/* Date */}
                <td className="px-6 py-4">
                  <span className="text-sm text-[#577794]">{formatDate(feedback.createdAt)}</span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex min-w-max items-center gap-3 whitespace-nowrap">
                    <button
                      onClick={() => onReanalyze(feedback._id)}
                      disabled={reanalyzing[feedback._id] || false}
                      className="text-sm font-semibold text-[#2e74b5] hover:text-[#1f4e78] disabled:opacity-50"
                    >
                      {reanalyzing[feedback._id] ? 'Analyzing...' : 'Re-run AI'}
                    </button>
                    <button
                      onClick={() => onDelete(feedback._id)}
                      disabled={deleting[feedback._id] || false}
                      className="text-sm font-semibold text-[#b11f33] hover:text-[#91182a] disabled:opacity-50"
                    >
                      {deleting[feedback._id] ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
