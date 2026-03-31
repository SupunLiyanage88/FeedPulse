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
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <section className="fp-soft-card p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e74b5]">Admin access</p>
            <h1 className="mt-3 text-4xl font-bold text-[#173f60]">FeedPulse Control Room</h1>
            <p className="mt-4 text-sm leading-relaxed text-[#365f80] sm:text-base">
              Review trends, sort priorities, and manage your feedback pipeline in one place.
            </p>
            <div className="mt-6 space-y-3 text-sm text-[#244d6f]">
              <p className="fp-card px-4 py-3">Centralized feedback triage with live filters.</p>
              <p className="fp-card px-4 py-3">AI summaries to speed up review decisions.</p>
              <p className="fp-card px-4 py-3">Status tracking from new to resolved.</p>
            </div>
          </section>

          <section className="fp-card p-8 sm:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e74b5]">Sign in</p>
              <h2 className="mt-2 text-3xl font-bold text-[#173f60]">Welcome back</h2>
              <p className="mt-2 text-sm text-[#466786]">Use your admin credentials to open the dashboard.</p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-[#efbfca] bg-[#fff4f7] p-4">
                <p className="text-sm font-semibold text-[#972439]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#1f4e78]">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="fp-input px-4 py-3 text-sm"
                  placeholder="admin@feedpulse.com"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#1f4e78]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fp-input px-4 py-3 text-sm"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="fp-button-primary w-full py-3 text-sm"
              >
                {loading ? 'Signing in...' : 'Sign in to dashboard'}
              </button>
            </form>

            {/* Default Credentials Note */}
            <div className="mt-6 rounded-2xl border border-[#c7dbef] bg-[#eef5fc] p-4">
              <p className="text-xs font-semibold text-[#1f4e78]">
                Default credentials: admin@feedpulse.com / admin123
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
