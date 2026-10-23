import { useSyncExternalStore } from 'react';

// App-wide "something is loading" state. Any code can start a task (a photo upload, a save)
// and the spinning Dali D overlay in App shows until every task has finished.

export type LoadingKind = 'load' | 'upload' | 'save';

const tasks = new Map<number, LoadingKind>();
const listeners = new Set<() => void>();
let nextId = 1;
let current: LoadingKind | null = null;

const emit = () => {
  // The newest task decides the label.
  current = tasks.size ? Array.from(tasks.values())[tasks.size - 1] : null;
  listeners.forEach((listener) => listener());
};

/** Starts a loading task and returns the function that ends it. Calling it twice is harmless. */
export const startLoading = (kind: LoadingKind = 'load') => {
  const id = nextId++;
  tasks.set(id, kind);
  emit();
  return () => { if (tasks.delete(id)) emit(); };
};

/** Shows the loader until the promise settles, and passes its result through. */
export const trackLoading = <T,>(promise: Promise<T>, kind: LoadingKind = 'load') => {
  const done = startLoading(kind);
  return promise.finally(done);
};

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

/** The kind of the newest running task, or null when nothing is loading. */
export const useLoadingKind = () => useSyncExternalStore(subscribe, () => current, () => null);
