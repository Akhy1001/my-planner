'use client';
import { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';

const STORAGE_KEY = 'planner-theme';

function getInitialDark(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'dark';
}

function applyThemeSync(next: boolean) {
  if (typeof document === 'undefined') return;
  const profile = document.documentElement.getAttribute('data-profile');
  if (next) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  } else {
    if (profile === 'anas') {
      document.documentElement.setAttribute('data-theme', 'sand');
    } else if (profile !== 'rose') {
      document.documentElement.removeAttribute('data-theme');
    }
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(getInitialDark);

  // Sync data-theme attribute and dark class with state
  useEffect(() => {
    applyThemeSync(isDark);
  }, [isDark]);

  const toggleTheme = useCallback((event?: React.MouseEvent | { clientX: number; clientY: number }) => {
    const isAppearanceTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (document as any).startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Origin coordinates of the ripple effect
    const defaultX = typeof window !== 'undefined' ? window.innerWidth * 0.12 : 80;
    const defaultY = typeof window !== 'undefined' ? window.innerHeight * 0.88 : 600;
    const x = event && 'clientX' in event && event.clientX ? event.clientX : defaultX;
    const y = event && 'clientY' in event && event.clientY ? event.clientY : defaultY;

    const next = !isDark;

    if (!isAppearanceTransition) {
      // Fallback: smooth transition class
      document.documentElement.classList.add('theme-transition-fallback');
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      applyThemeSync(next);
      setIsDark(next);
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition-fallback');
      }, 700);
      return;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
        applyThemeSync(next);
        setIsDark(next);
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 900,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  }, [isDark]);

  return { isDark, toggleTheme };
}

