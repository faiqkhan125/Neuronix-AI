"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (!data.user) {
          router.push('/auth/signin');
          return;
        }

        if (data.user.role === 'seller' || data.user.role === 'admin') {
          router.push('/dashboard/seller');
        } else {
          router.push('/dashboard/buyer');
        }
      } catch (err) {
        console.error('Redirect error:', err);
        router.push('/auth/signin');
      }
    };
    checkRole();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
