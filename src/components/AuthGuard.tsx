'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useSystemStateStore } from '@/stores/system-state-store';
import { useUserStore } from '@/stores/user-store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const { getGlobalState } = useSystemStateStore();
  const { getUser } = useUserStore();
  const maintenanceMode = getGlobalState()?.maintenance_mode;

  useEffect(() => {
    if (!session.isAuthenticated || !session.user) {
      router.replace('/login');
      return;
    }

    // Maintenance Mode Kick Logic
    if (maintenanceMode && session.user.group !== 'admins') {
      alert("System is under maintenance. You have been logged out.");
      logout(() => {}); // Set online is handled or ignored on forced logout
      router.replace('/login');
      return;
    }

    // Disabled/Offline Kick Logic (Revoke access)
    const currentUser = getUser(session.user.id);
    if (currentUser && (!currentUser.is_enable || !currentUser.is_online)) {
      alert("Your session has been revoked or your account is disabled.");
      logout(() => {});
      router.replace('/login');
    }
  }, [session.isAuthenticated, session.user, maintenanceMode, router, logout, getUser]);

  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ip-bg">
        <div className="w-8 h-8 border-3 border-ip-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
