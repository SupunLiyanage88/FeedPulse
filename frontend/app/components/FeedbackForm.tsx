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
        ? 'text-gray-400'
        : 'text-red-500'
      : 'text-green-600';

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Rate Limit Info */}
        {rateLimitInfo.allowed && rateLimitInfo.remainingSubmissions <= 2 && (
          <div className="rounded-2xl border border-[#efd9a6] bg-[#fff9ec] p-4">
            <p className="text-sm text-[#8a6200]">
              You have {rateLimitInfo.remainingSubmissions} submission
              {rateLimitInfo.remainingSubmissions !== 1 ? 's' : ''} left this hour.
            </p>
          </div>
        )}

        {!rateLimitInfo.allowed && (
          <div className="rounded-2xl border border-[#efbfca] bg-[#fff4f7] p-4">
            <p className="text-sm text-[#972439]">
              You have reached the submission limit (5 per hour). Please try again later.
            </p>
          </div>
        )}

        {/* Success/Error Messages */}
        {submitStatus.type && (
          <div
            className={`rounded-2xl border p-4 ${
              submitStatus.type === 'success'
                ? 'border-[#b6dfc4] bg-[#effbf3]'
                : 'border-[#efbfca] bg-[#fff4f7]'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                submitStatus.type === 'success'
                  ? 'text-[#28683e]'
                  : 'text-[#972439]'
              }`}
            >
              {submitStatus.type === 'success' ? 'Success: ' : 'Error: '}
              {submitStatus.message}
            </p>
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-[#1f4e78]">
            Title <span className="text-[#b11f33]">*</span>
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
            className={`fp-input px-4 py-3 text-sm ${
              errors.title
                ? 'border-[#b11f33] !shadow-[0_0_0_3px_rgba(177,31,51,0.15)]'
                : ''
            }`}
          />
          {errors.title && <p className="text-sm text-[#b11f33]">{errors.title}</p>}
          <p className="text-xs text-[#5f7f9b]">{formData.title.length}/120 characters</p>
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-semibold text-[#1f4e78]">
            Category <span className="text-[#b11f33]">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className="fp-select px-4 py-3 text-sm"
          >
            <option value="Bug">Bug</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Improvement">Improvement</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-semibold text-[#1f4e78]">
            Description <span className="text-[#b11f33]">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Please provide detailed feedback (minimum 20 characters)"
            rows={5}
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className={`fp-textarea resize-none px-4 py-3 text-sm ${
              errors.description
                ? 'border-[#b11f33] !shadow-[0_0_0_3px_rgba(177,31,51,0.15)]'
                : ''
            }`}
          />
          {errors.description && (
            <p className="text-sm text-[#b11f33]">{errors.description}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <p className={`text-xs font-medium ${descriptionStatus}`}>
              {descriptionLength}/20 minimum • {descriptionLength} characters
              {descriptionLength >= 20 && ' ✓'}
            </p>
          </div>
        </div>

        {/* Name Field (Optional) */}
        <div className="space-y-2">
          <label htmlFor="submitterName" className="block text-sm font-semibold text-[#1f4e78]">
            Name <span className="text-[#6888a3]">(optional)</span>
          </label>
          <input
            type="text"
            id="submitterName"
            name="submitterName"
            value={formData.submitterName}
            onChange={handleInputChange}
            placeholder="Your name"
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className="fp-input px-4 py-3 text-sm"
          />
        </div>

        {/* Email Field (Optional) */}
        <div className="space-y-2">
          <label htmlFor="submitterEmail" className="block text-sm font-semibold text-[#1f4e78]">
            Email <span className="text-[#6888a3]">(optional)</span>
          </label>
          <input
            type="email"
            id="submitterEmail"
            name="submitterEmail"
            value={formData.submitterEmail}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            disabled={isSubmitting || !rateLimitInfo.allowed}
            className={`fp-input px-4 py-3 text-sm ${
              errors.submitterEmail
                ? 'border-[#b11f33] !shadow-[0_0_0_3px_rgba(177,31,51,0.15)]'
                : ''
            }`}
          />
          {errors.submitterEmail && (
            <p className="text-sm text-[#b11f33]">{errors.submitterEmail}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !rateLimitInfo.allowed}
          className="fp-button-primary w-full px-4 py-3.5 text-sm"
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
        <p className="text-center text-xs text-[#5f7f9b]">
          No account needed. We value your feedback to improve our service.
        </p>
      </form>
    </div>
  );
}
