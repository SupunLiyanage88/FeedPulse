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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
