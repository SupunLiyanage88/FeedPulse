'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAdminToken } from '@/app/lib/adminAuth';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      router.push('/admin/dashboard');
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="fp-card w-full max-w-sm p-8 text-center">
        <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#2e74b5]"></div>
        <p className="mt-4 text-sm font-medium text-[#355b7a]">Redirecting to admin experience...</p>
      </div>
    </div>
  );
}
