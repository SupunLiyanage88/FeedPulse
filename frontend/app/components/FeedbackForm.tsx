'use client';

import { useState, useEffect } from 'react';
import { submitFeedback } from '../lib/api';
import { validateFeedbackForm, isFormValid } from '../lib/validation';
import { checkRateLimit, recordSubmission, formatResetTime } from '../lib/rateLimit';

interface FormState {
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  submitterName: string;
  submitterEmail: string;
}

export default function FeedbackForm() {
  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    category: 'Bug',
    submitterName: '',
    submitterEmail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [rateLimitInfo, setRateLimitInfo] = useState<{
    allowed: boolean;
    remainingSubmissions: number;
    resetTime?: number;
  }>({ allowed: true, remainingSubmissions: 5 });

  const [mounted, setMounted] = useState(false);

  // Check rate limit on mount and when component updates
  useEffect(() => {
    setMounted(true);
    const limitInfo = checkRateLimit();
    setRateLimitInfo(limitInfo);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check rate limit
    if (!rateLimitInfo.allowed) {
      const resetTimeStr = rateLimitInfo.resetTime
        ? formatResetTime(rateLimitInfo.resetTime)
        : 'unknown';
      setSubmitStatus({
        type: 'error',
        message: `You've reached the submission limit. Please try again in ${resetTimeStr}.`,
      });
      return;
    }

    // Validate form
    const formErrors = validateFeedbackForm({
      title: formData.title,
      description: formData.description,
      submitterEmail: formData.submitterEmail,
    });

    if (!isFormValid(formErrors)) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await submitFeedback({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        submitterName: formData.submitterName.trim() || undefined,
        submitterEmail: formData.submitterEmail.trim() || undefined,
      });

      if (response.success) {
        // Record successful submission for rate limiting
        recordSubmission();

        // Update rate limit info
        const newLimitInfo = checkRateLimit();
        setRateLimitInfo(newLimitInfo);

        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'Bug',
          submitterName: '',
          submitterEmail: '',
        });
        setErrors({});

        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your feedback! We appreciate your input.',
        });

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: '' });
        }, 5000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.message || 'Failed to submit feedback. Please try again.',
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const descriptionLength = formData.description.length;
  const descriptionStatus =
    descriptionLength < 20
      ? descriptionLength === 0
        ? 'text-gray-400'
        : 'text-red-500'
      : 'text-green-600';

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rate Limit Info */}
        {rateLimitInfo.allowed && rateLimitInfo.remainingSubmissions <= 2 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ You have {rateLimitInfo.remainingSubmissions} submission
              {rateLimitInfo.remainingSubmissions !== 1 ? 's' : ''} left this hour.
            </p>
          </div>
        )}

        {!rateLimitInfo.allowed && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ❌ You've reached the submission limit (5 per hour). Please try again later.
            </p>
          </div>
        )}

        {/* Success/Error Messages */}
        {submitStatus.type && (
          <div
            className={`p-4 rounded-lg border ${
              submitStatus.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                submitStatus.type === 'success'
                  ? 'text-green-800'
                  : 'text-red-800'
              }`}
            >
              {submitStatus.type === 'success' ? '✓ ' : '✕ '}
              {submitStatus.message}
            </p>
          </div>
        )}

        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Subject of your feedback"
            maxLength={120}
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.title
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/120 characters</p>
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="Bug">🐛 Bug</option>
            <option value="Feature Request">✨ Feature Request</option>
            <option value="Improvement">📈 Improvement</option>
            <option value="Other">💭 Other</option>
          </select>
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Please provide detailed feedback (minimum 20 characters)"
            rows={5}
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
              errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description}</p>
          )}
          <div className="flex justify-between items-center mt-2">
            <p className={`text-xs font-medium ${descriptionStatus}`}>
              {descriptionLength}/20 minimum • {descriptionLength} characters
              {descriptionLength >= 20 && ' ✓'}
            </p>
          </div>
        </div>

        {/* Name Field (Optional) */}
        <div>
          <label htmlFor="submitterName" className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            id="submitterName"
            name="submitterName"
            value={formData.submitterName}
            onChange={handleInputChange}
            placeholder="Your name"
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Email Field (Optional) */}
        <div>
          <label htmlFor="submitterEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="email"
            id="submitterEmail"
            name="submitterEmail"
            value={formData.submitterEmail}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.submitterEmail
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {errors.submitterEmail && (
            <p className="text-sm text-red-500 mt-1">{errors.submitterEmail}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !rateLimitInfo.allowed}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isSubmitting || !rateLimitInfo.allowed
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Feedback'
          )}
        </button>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center">
          No account needed. We value your feedback to improve our service.
        </p>
      </form>
    </div>
  );
}
