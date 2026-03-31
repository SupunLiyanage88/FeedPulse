const ADMIN_TOKEN_KEY = 'feedpulse_admin_token';
const ADMIN_USER_KEY = 'feedpulse_admin_user';

export interface AdminUser {
  email: string;
  role: string;
}

export const setAdminToken = (token: string, user: AdminUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  }
};

export const getAdminToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  return null;
};

export const getAdminUser = (): AdminUser | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(ADMIN_USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const clearAdminAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }
};

export const isAdminAuthenticated = (): boolean => {
  return getAdminToken() !== null;
};
