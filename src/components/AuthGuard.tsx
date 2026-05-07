'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session } = useAuthStore();

  useEffect(() => {
    if (!session.isAuthenticated) {
      router.replace('/login');
    }
  }, [session.isAuthenticated, router]);

  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ip-bg">
        <div className="w-8 h-8 border-3 border-ip-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
