import { useCallback, useEffect, useState } from 'react';

type ColorScheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'pawhaven-color-scheme';

function getStoredScheme(): ColorScheme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(STORAGE_KEY) as ColorScheme) || 'system';
}

function applyScheme(scheme: ColorScheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  root.classList.remove('light', 'dark');

  if (scheme === 'dark' || (scheme === 'system' && prefersDark)) {
    root.classList.add('dark');
  } else if (scheme === 'light') {
    root.classList.add('light');
  }
  // system + light preference → no class needed (defaults to light)
}

/**
 * Hook to manage color scheme (light / dark / system).
 * Persists to localStorage and applies .dark / .light classes to <html>.
 */
export function useColorScheme() {
  const [scheme, setSchemeState] = useState<ColorScheme>(getStoredScheme);

  useEffect(() => {
    applyScheme(scheme);
  }, [scheme]);

  // Listen for OS-level preference changes when in "system" mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (scheme === 'system') applyScheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [scheme]);

  const setScheme = useCallback((next: ColorScheme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setSchemeState(next);
  }, []);

  return { scheme, setScheme } as const;
}
