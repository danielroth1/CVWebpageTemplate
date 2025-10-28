import { useEffect, useState } from 'react';

// Hook to manage dark/light theme with persistence
export function useTheme() {
  // Simple cookie helpers
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const escaped = name.replace(/[-\\[\]{}()*+?.,^$|#\s]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60; // seconds
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureAttr = isSecure ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secureAttr}`;
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = getCookie('theme');
    if (stored === 'dark' || stored === 'light') return stored as 'dark' | 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setCookie('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, setTheme, toggleTheme };
}
