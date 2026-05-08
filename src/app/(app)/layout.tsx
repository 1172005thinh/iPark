'use client';

import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useUIStore } from '@/stores/ui-store';

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-ip-bg overflow-hidden">
        <Sidebar />
        <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out p-6 ip-fade-in`}>
          {children}
        </main>
        <NotificationCenter />
      </div>
    </AuthGuard>
  );
}
