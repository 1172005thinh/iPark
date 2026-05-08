'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

export function ThemeLanguageProvider({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const users = useUserStore((state) => state.users);
  
  // Get the most up-to-date user data from user store if logged in
  const currentUser = session.user 
    ? users.find((u) => u.id === session.user?.id) ?? session.user 
    : null;

  const theme = currentUser?.theme || 'System';
  const language = currentUser?.language || 'English';

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Theme logic
    const applyTheme = (t: string) => {
      root.classList.remove('light', 'dark');
      
      let effectiveTheme = t.toLowerCase();
      if (effectiveTheme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      root.classList.add(effectiveTheme);
      root.style.colorScheme = effectiveTheme;
    };

    applyTheme(theme);

    // Language logic (simplified)
    const langCodeMap: Record<string, string> = {
      'English': 'en',
      'Vietnamese': 'vi',
    };
    root.setAttribute('lang', langCodeMap[language] || 'en');

    // Handle system theme changes if set to System
    if (theme.toLowerCase() === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('System');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, language]);

  return <>{children}</>;
}
