interface SubmissionRecord {
  timestamp: number;
}

interface RateLimitData {
  submissions: SubmissionRecord[];
}

const RATE_LIMIT_KEY = 'feedpulse_submit_rate_limit';
const MAX_SUBMISSIONS = 5;
const TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export const checkRateLimit = (): {
  allowed: boolean;
  remainingSubmissions: number;
  resetTime?: number;
} => {
  if (typeof window === 'undefined') {
    return { allowed: true, remainingSubmissions: MAX_SUBMISSIONS };
  }

  const now = Date.now();
  const storedData = localStorage.getItem(RATE_LIMIT_KEY);
  
  let data: RateLimitData = { submissions: [] };
  
  if (storedData) {
    try {
      data = JSON.parse(storedData);
    } catch {
      data = { submissions: [] };
    }
  }

  // Remove submissions outside the time window
  data.submissions = data.submissions.filter(
    (record) => now - record.timestamp < TIME_WINDOW_MS
  );

  const submissionsInWindow = data.submissions.length;
  const allowed = submissionsInWindow < MAX_SUBMISSIONS;

  let resetTime: number | undefined;
  if (!allowed && data.submissions.length > 0) {
    // Calculate when the oldest submission will be outside the window
    const oldestSubmission = data.submissions[0];
    resetTime = oldestSubmission.timestamp + TIME_WINDOW_MS;
  }

  return {
    allowed,
    remainingSubmissions: Math.max(0, MAX_SUBMISSIONS - submissionsInWindow),
    resetTime,
  };
};

export const recordSubmission = (): void => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const storedData = localStorage.getItem(RATE_LIMIT_KEY);
  
  let data: RateLimitData = { submissions: [] };
  
  if (storedData) {
    try {
      data = JSON.parse(storedData);
    } catch {
      data = { submissions: [] };
    }
  }

  // Remove submissions outside the time window
  data.submissions = data.submissions.filter(
    (record) => now - record.timestamp < TIME_WINDOW_MS
  );

  // Add new submission
  data.submissions.push({ timestamp: now });

  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
};

export const formatResetTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) return 'now';

  const minutes = Math.ceil(diff / 60000);
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''}`;
};
