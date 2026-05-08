'use client';

import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto ip-fade-in">{children}</main>
        <NotificationCenter />
      </div>
    </AuthGuard>
  );
}
