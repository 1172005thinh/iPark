'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';
import { useUIStore } from '@/stores/ui-store';
import { useTranslation } from '@/lib/i18n';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/parks', label: 'Parks', icon: ParkIcon },
  { href: '/staffs', label: 'Staffs', icon: StaffIcon },
  { href: '/events', label: 'Events', icon: EventIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { session, logout } = useAuthStore();
  const { setOnline } = useUserStore();
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const handleLogout = () => {
    logout(setOnline);
    window.location.href = '/login';
  };

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: DashboardIcon },
    { href: '/parks', label: t('parks'), icon: ParkIcon },
    { href: '/staffs', label: t('staffs'), icon: StaffIcon },
    { href: '/events', label: t('events'), icon: EventIcon },
    { href: '/settings', label: t('settings'), icon: SettingsIcon },
  ];

  return (
    <aside 
      className={`ip-sidebar flex flex-col justify-between p-4 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } min-h-screen relative`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`absolute -right-4 top-12 flex h-8 w-8 items-center justify-center rounded-2xl border-2 border-white bg-ip-primary text-white shadow-xl transition-all hover:scale-110 active:scale-95 z-[60] ${
          sidebarCollapsed ? 'translate-x-0' : 'translate-x-0'
        }`}
        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Logo */}
      <div>
        <div className={`flex items-center gap-3 px-3 py-4 mb-6 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="relative w-9 h-9 min-w-[2.25rem] rounded-xl overflow-hidden shadow-lg bg-white/10 flex items-center justify-center">
            <Image 
              src="/logo.ico" 
              alt="iPark Logo" 
              fill 
              className="object-contain p-1"
            />
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-bold text-white tracking-tight ip-fade-in">
              iPark
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`ip-sidebar-link ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon />
                {!sidebarCollapsed && <span className="ip-fade-in">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info + Logout */}
      <div className="border-t border-white/10 pt-4 mt-4">
        {session.user && !sidebarCollapsed && (
          <div className="px-3 mb-3 ip-fade-in">
            <p className="text-sm text-white font-medium truncate">
              {session.user.display_name}
            </p>
            <p className="text-xs text-ip-sidebar-text truncate">
              {t(session.user.group as any) || session.user.group}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? t('logout') : undefined}
          className={`ip-sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
        >
          <LogoutIcon />
          {!sidebarCollapsed && <span className="ip-fade-in">{t('logout')}</span>}
        </button>
      </div>
    </aside>
  );
}

/* ─── SVG Icons (inline for zero-dep) ──────────────────────────────── */

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ParkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="6" width="22" height="14" rx="2" />
      <path d="M1 10h22" />
      <path d="M7 6v14" />
      <path d="M17 6v14" />
      <path d="M12 6V4" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EventIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
