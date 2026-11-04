import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders its children only once the reader scrolls close to them, so code and photos for
 * the bottom of a long page are not downloaded with the first screen. Until then it holds the
 * space with an empty block (same `id`, so "scroll to section" links still land on it).
 */
export function NearViewport({ children, id, minHeight = 400, margin = '900px' }: { children: ReactNode; id?: string; minHeight?: number; margin?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (near || !ref.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near, margin]);
  if (near) return <>{children}</>;
  return <div ref={ref} id={id} style={{ minHeight }} aria-hidden="true" />;
}
