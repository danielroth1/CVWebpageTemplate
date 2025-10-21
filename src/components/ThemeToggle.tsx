import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  className={`group relative overflow-hidden inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition-colors shadow-elevate-sm hover:shadow-elevate-md border app-border bg-[var(--color-surface)] backdrop-blur ${className ?? ''}`}
    >
      <span className="relative flex items-center gap-2">
        <span className="w-5 h-5 flex items-center justify-center text-[var(--color-primary)] leading-none transition-transform duration-300 group-hover:rotate-12 drop-shadow-sm" aria-hidden>
          {isDark ? <FaSun /> : <FaMoon />}
        </span>
        <span className="whitespace-nowrap">
          {isDark ? 'Light' : 'Dark'} Mode
        </span>
      </span>
      <span
        aria-hidden
        className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20"
      />
    </button>
  );
};

export default ThemeToggle;
