import { useEffect, useState } from 'react';
import type { Language } from '../types/venueSystem';
import { useLoadingKind, type LoadingKind } from '../utils/loadingTracker';

// The one loading indicator for the whole app: the gold DALI STUDIO "D" spinning, with a label
// under it. Its styles (.dali-loader*) live in index.html so the same loader can show while the
// app itself is still downloading.

const MARK = '/brand/dali-mark.png';

const LABELS: Record<LoadingKind, { ar: string; en: string }> = {
  load: { ar: 'جارٍ التحميل', en: 'Loading' },
  upload: { ar: 'جارٍ رفع الصور', en: 'Uploading' },
  save: { ar: 'جارٍ الحفظ', en: 'Saving' },
};

export const loadingLabel = (language: Language, kind: LoadingKind = 'load') => LABELS[kind][language];

type Size = 'sm' | 'md' | 'lg';

/** The spinning D with its label underneath, centred in whatever box holds it. */
export function DaliLoader({ language, label, kind = 'load', size = 'md', className = '' }: { language: Language; label?: string; kind?: LoadingKind; size?: Size; className?: string }) {
  const text = label ?? loadingLabel(language, kind);
  return (
    <div className={`dali-loader ${className}`} data-size={size} role="status" aria-live="polite" lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="dali-loader-mark" aria-hidden="true"><img src={MARK} alt="" draggable={false} /></span>
      <span className="dali-loader-label">{text}<span className="dali-loader-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></span>
    </div>
  );
}

/** A full-screen veil with the loader in the middle, for popups and uploads. */
export function DaliLoaderOverlay({ language, label, kind = 'load' }: { language: Language; label?: string; kind?: LoadingKind }) {
  return (
    <div data-dali-ignore className="dali-loader-veil fixed inset-0 z-[95] flex items-center justify-center">
      <DaliLoader language={language} label={label} kind={kind} size="lg" />
    </div>
  );
}

/** Only the spinning D, to sit inside a button while it works. */
export function DaliSpinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return <span className={`dali-spin-icon inline-block shrink-0 ${className}`} aria-hidden="true"><img src={MARK} alt="" draggable={false} /></span>;
}

const MIN_VISIBLE_MS = 900;

/** Shows the overlay while any task from utils/loadingTracker runs, for at least a moment so it never just flickers. */
export function GlobalDaliLoader({ language }: { language: Language }) {
  const kind = useLoadingKind();
  const [shown, setShown] = useState<{ kind: LoadingKind; since: number } | null>(null);
  useEffect(() => {
    if (kind) { setShown((prev) => (prev?.kind === kind ? prev : { kind, since: prev?.since ?? Date.now() })); return; }
    if (!shown) return;
    const timer = window.setTimeout(() => setShown(null), Math.max(0, MIN_VISIBLE_MS - (Date.now() - shown.since)));
    return () => window.clearTimeout(timer);
  }, [kind, shown]);
  return shown ? <DaliLoaderOverlay language={language} kind={shown.kind} /> : null;
}
