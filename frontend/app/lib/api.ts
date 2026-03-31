export interface FeedbackPayload {
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  submitterName?: string;
  submitterEmail?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const submitFeedback = async (payload: FeedbackPayload): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Failed to submit feedback',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Feedback submitted successfully',
      data: data.data,
    };
  } catch (error) {
    console.error('Feedback submission error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
