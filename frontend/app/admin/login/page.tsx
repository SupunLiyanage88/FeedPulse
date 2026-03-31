'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/app/lib/adminApi';
import { setAdminToken } from '@/app/lib/adminAuth';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@feedpulse.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await adminLogin(email, password);
    
    setLoading(false);

    if (result.success && result.data) {
      setAdminToken(result.data.token, result.data.user);
      router.push('/admin/dashboard');
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#f0f7ff] via-white to-[#f0f7ff]">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-[#d4e3f0] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#1f4e78]">Admin Login</h1>
            <p className="mt-1 text-sm text-[#5a7c9a]">Sign in to access the FeedPulse dashboard.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#d4e3f0] px-3 py-2.5 text-sm text-[#1f4e78] outline-none transition focus:border-[#1f4e78] focus:ring-2 focus:ring-[#1f4e78]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="admin@feedpulse.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#d4e3f0] px-3 py-2.5 text-sm text-[#1f4e78] outline-none transition focus:border-[#1f4e78] focus:ring-2 focus:ring-[#1f4e78]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="Enter password"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1f4e78] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f3a5a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-xs text-[#5a7c9a]">
            Demo: admin@feedpulse.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}