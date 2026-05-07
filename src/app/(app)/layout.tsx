'use client';

import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';

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
      </div>
    </AuthGuard>
  );
}
