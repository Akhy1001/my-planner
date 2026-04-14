'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'planner-theme';

function getInitialDark(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'dark';
}

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(getInitialDark);

  // Sync data-theme attribute with state
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggleTheme };
}
