import { useEffect, useState } from 'react';

/** useState that is saved to localStorage, so edits made in the portal survive a page reload. */
export function usePersistentState<T>(key: string, fallback: T, isValid: (saved: unknown) => boolean = (saved) => saved !== null && saved !== undefined) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) || 'null');
      return isValid(saved) ? (saved as T) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (error) { console.warn(`${key} could not be saved locally:`, error); }
  }, [key, value]);
  return [value, setValue] as const;
}

export const isNonEmptyArray = (saved: unknown) => Array.isArray(saved);
