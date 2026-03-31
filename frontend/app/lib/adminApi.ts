import { ApiResponse } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Feedback {
  _id: string;
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  status: 'New' | 'In Review' | 'Resolved';
  ai_category?: string;
  ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  submitterName?: string;
  submitterEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalFeedback: number;
  openItems: number;
  averagePriority: number;
  mostCommonTag: string;
}

export interface FeedbackListResponse {
  feedbacks: Feedback[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const adminLogin = async (email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Login failed',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Login successful',
      data: data.data,
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getDashboardStats = async (token: string): Promise<ApiResponse<DashboardStats>> => {
  try {
    const response = await fetch(`${API_URL}/api/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Failed to fetch stats',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Stats fetched successfully',
      data: data.data,
    };
  } catch (error) {
    console.error('Fetch stats error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getFeedbackList = async (
  token: string,
  params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    sortBy?: string;
    search?: string;
  }
): Promise<ApiResponse<FeedbackListResponse>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_URL}/api/admin/feedback?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Failed to fetch feedback',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Feedback fetched successfully',
      data: data.data,
    };
  } catch (error) {
    console.error('Fetch feedback error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const updateFeedbackStatus = async (
  token: string,
  feedbackId: string,
  status: 'New' | 'In Review' | 'Resolved'
): Promise<ApiResponse<Feedback>> => {
  try {
    const response = await fetch(`${API_URL}/api/admin/feedback/${feedbackId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Failed to update status',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Status updated successfully',
      data: data.data,
    };
  } catch (error) {
    console.error('Update status error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const deleteFeedback = async (
  token: string,
  feedbackId: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/admin/feedback/${feedbackId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Failed to delete feedback',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Feedback deleted successfully',
    };
  } catch (error) {
    console.error('Delete feedback error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
