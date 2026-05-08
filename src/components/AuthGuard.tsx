'use client';

import { useEffect, type ReactNode } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppDialog, type DialogTone } from '@/components/dialogs/AppDialog';
import { useAuthStore } from '@/stores/auth-store';
import { useSystemStateStore } from '@/stores/system-state-store';
import { useUserStore } from '@/stores/user-store';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const { getGlobalState } = useSystemStateStore();
  const { getUser } = useUserStore();
  const maintenanceMode = getGlobalState()?.maintenance_mode;

  useEffect(() => {
    if (!session.isAuthenticated || !session.user) {
      router.replace('/login');
    }
  }, [router, session.isAuthenticated, session.user]);

  const guardNotice = getGuardNotice({
    sessionUser: session.user,
    maintenanceMode,
    getUser,
  });

  const handleAcknowledge = () => {
    logout(() => {});
    router.replace('/login');
  };

  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ip-bg">
        <div className="w-8 h-8 border-3 border-ip-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {children}

      <AppDialog
        open={guardNotice !== null}
        onClose={handleAcknowledge}
        title={guardNotice?.title ?? 'Access changed'}
        description={guardNotice?.description}
        icon={
          guardNotice?.tone === 'danger' ? (
            <ShieldAlert size={22} />
          ) : (
            <LogOut size={22} />
          )
        }
        tone={guardNotice?.tone ?? 'warning'}
        size="sm"
        dismissible={false}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAcknowledge}
              className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
            >
              Return to Login
            </button>
          </div>
        }
      />
    </>
  );
}

function getGuardNotice({
  sessionUser,
  maintenanceMode,
  getUser,
}: {
  sessionUser: ReturnType<typeof useAuthStore.getState>['session']['user'];
  maintenanceMode: boolean | undefined;
  getUser: ReturnType<typeof useUserStore.getState>['getUser'];
}): {
  title: string;
  description: string;
  tone: DialogTone;
} | null {
  if (!sessionUser) {
    return null;
  }

  if (maintenanceMode && sessionUser.group !== 'admins') {
    return {
      title: 'Maintenance mode is active',
      description:
        'This area is temporarily unavailable for non-admin users. You will be signed out and returned to login.',
      tone: 'warning',
    };
  }

  const currentUser = getUser(sessionUser.id);

  if (!currentUser) {
    return {
      title: 'Account removed',
      description:
        'Your account no longer exists in the live user store. You will be signed out and returned to login.',
      tone: 'danger',
    };
  }

  if (!currentUser.is_enable) {
    return {
      title: 'Account disabled',
      description:
        'An administrator disabled this account. You will be signed out and returned to login.',
      tone: 'danger',
    };
  }

  if (!currentUser.is_online) {
    return {
      title: 'Session revoked',
      description:
        'Your current access session was revoked. You will be signed out and returned to login.',
      tone: 'warning',
    };
  }

  return null;
}
