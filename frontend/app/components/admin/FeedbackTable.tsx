'use client';

import { Feedback } from '@/app/lib/adminApi';

interface FeedbackTableProps {
  feedbacks: Feedback[];
  loading: boolean;
  onStatusChange: (feedbackId: string, newStatus: 'New' | 'In Review' | 'Resolved') => void;
  onDelete: (feedbackId: string) => void;
  statusUpdating: Record<string, boolean>;
  deleting: Record<string, boolean>;
}

const getCategoryBadgeColor = (category: string) => {
  const colors: Record<string, string> = {
    'Bug': 'bg-red-100 text-red-800',
    'Feature Request': 'bg-blue-100 text-blue-800',
    'Improvement': 'bg-purple-100 text-purple-800',
    'Other': 'bg-gray-100 text-gray-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const getSentimentBadgeColor = (sentiment: string | undefined) => {
  if (!sentiment) return 'bg-gray-100 text-gray-700';
  const colors: Record<string, string> = {
    'Positive': 'bg-green-100 text-green-800',
    'Neutral': 'bg-yellow-100 text-yellow-800',
    'Negative': 'bg-red-100 text-red-800',
  };
  return colors[sentiment] || 'bg-gray-100 text-gray-700';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-700 border-blue-200',
    'In Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Resolved': 'bg-green-50 text-green-700 border-green-200',
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
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
  statusUpdating,
  deleting,
}: FeedbackTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="border-b border-gray-200 p-6 h-24 bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
        <p className="text-gray-500 text-lg">No feedback found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((feedback) => (
              <tr
                key={feedback._id}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                {/* Title */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{feedback.title}</p>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-1">
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
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>

                {/* Priority */}
                <td className="px-6 py-4">
                  {feedback.ai_priority ? (
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(feedback.ai_priority / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-medium text-sm text-gray-700">
                        {feedback.ai_priority}/10
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
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
                    className={`px-3 py-1 rounded-lg text-sm font-medium border outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getStatusColor(feedback.status)}`}
                  >
                    <option value="New">New</option>
                    <option value="In Review">In Review</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>

                {/* Date */}
                <td className="px-6 py-4">
                  <span className="text-gray-600 text-sm">{formatDate(feedback.createdAt)}</span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDelete(feedback._id)}
                    disabled={deleting[feedback._id] || false}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm font-medium"
                  >
                    {deleting[feedback._id] ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
