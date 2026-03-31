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
      setErrors(formErrors as Record<string, string>);
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
    } catch {
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
        ? 'text-slate-400'
        : 'text-rose-500'
      : 'text-emerald-600';

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rate Limit Info */}
        {rateLimitInfo.allowed && rateLimitInfo.remainingSubmissions <= 2 && (
          <div className="rounded-xl bg-amber-50/80 p-4 border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              <p className="text-sm text-amber-700">
                You have {rateLimitInfo.remainingSubmissions} submission
                {rateLimitInfo.remainingSubmissions !== 1 ? 's' : ''} left this hour.
              </p>
            </div>
          </div>
        )}

        {!rateLimitInfo.allowed && (
          <div className="rounded-xl bg-rose-50/80 p-4 border border-rose-200">
            <div className="flex items-center gap-2">
              <span className="text-rose-600">🚫</span>
              <p className="text-sm text-rose-700">
                You have reached the submission limit (5 per hour). Please try again later.
              </p>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {submitStatus.type && (
          <div
            className={`rounded-xl p-4 border ${
              submitStatus.type === 'success'
                ? 'bg-emerald-50/80 border-emerald-200'
                : 'bg-rose-50/80 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={submitStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}>
                {submitStatus.type === 'success' ? '✓' : '✗'}
              </span>
              <p
                className={`text-sm font-medium ${
                  submitStatus.type === 'success'
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                {submitStatus.message}
              </p>
            </div>
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="What's your feedback about?"
            maxLength={120}
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
              errors.title
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
            }`}
          />
          {errors.title && <p className="text-sm text-rose-600">{errors.title}</p>}
          <p className="text-xs text-slate-500">{formData.title.length}/120 characters</p>
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-semibold text-slate-700">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
          >
            <option value="Bug">🐛 Bug</option>
            <option value="Feature Request">✨ Feature Request</option>
            <option value="Improvement">⚡ Improvement</option>
            <option value="Other">💬 Other</option>
          </select>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Please provide detailed feedback (minimum 20 characters)"
            rows={5}
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed resize-none ${
              errors.description
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
            }`}
          />
          {errors.description && (
            <p className="text-sm text-rose-600">{errors.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                <div 
                  className={`h-full transition-all duration-300 ${
                    descriptionLength >= 20 ? 'bg-emerald-500' : 'bg-rose-400'
                  }`}
                  style={{ width: `${Math.min((descriptionLength / 20) * 100, 100)}%` }}
                />
              </div>
              <p className={`text-xs font-medium ${descriptionStatus}`}>
                {descriptionLength}/20 minimum
                {descriptionLength >= 20 && ' ✓'}
              </p>
            </div>
          </div>
        </div>

        {/* Name Field (Optional) */}
        <div className="space-y-2">
          <label htmlFor="submitterName" className="block text-sm font-semibold text-slate-700">
            Name <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            id="submitterName"
            name="submitterName"
            value={formData.submitterName}
            onChange={handleInputChange}
            placeholder="Your name"
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Email Field (Optional) */}
        <div className="space-y-2">
          <label htmlFor="submitterEmail" className="block text-sm font-semibold text-slate-700">
            Email <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="email"
            id="submitterEmail"
            name="submitterEmail"
            value={formData.submitterEmail}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
              errors.submitterEmail
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
            }`}
          />
          {errors.submitterEmail && (
            <p className="text-sm text-rose-600">{errors.submitterEmail}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !rateLimitInfo.allowed}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        <p className="text-center text-xs text-slate-500">
          No account needed. We value your feedback to improve our service.
        </p>
      </form>
    </div>
  );
}