import { useEffect, useState } from 'react';
import { m as motion, AnimatePresence } from 'motion/react';
import { Globe } from 'lucide-react';

/** The spring every "dynamic island" morph on the site uses, so they all move alike. */
export const ISLAND_SPRING = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 } as const;

/**
 * True while any page-level booking button (marked with `data-page-book`) is on screen
 * below the header. The header then hides its own Book button, so there are never two.
 */
export function usePageBookVisible(headerHeight = 80) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const seen = Array.from(document.querySelectorAll<HTMLElement>('[data-page-book]')).some((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.bottom > headerHeight && r.top < window.innerHeight;
      });
      setVisible(seen);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    // Pages mount and unmount as the visitor moves around, so look again now and then.
    const timer = window.setInterval(queue, 700);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.clearInterval(timer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [headerHeight]);
  return visible;
}

/** True until the page has scrolled past `offset` pixels. */
export function useAtPageTop(offset = 24) {
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY <= offset);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);
  return atTop;
}

type LanguageIslandProps = {
  isAr: boolean;
  /** Wide shows the globe and the full language name; compact shows "EN" or "ع". */
  wide: boolean;
  onToggle: () => void;
  className?: string;
};

/**
 * Black and gold language pill that springs between a wide label and a small "EN" / "ع"
 * circle, like Apple's Dynamic Island.
 */
export function LanguageIsland({ isAr, wide, onToggle, className = '' }: LanguageIslandProps) {
  return (
    <motion.button
      layout
      transition={ISLAND_SPRING}
      type="button"
      data-lang-toggle
      data-wide={wide ? 'true' : 'false'}
      onClick={onToggle}
      aria-label={isAr ? 'Switch to English' : 'التحويل للعربية'}
      title={isAr ? 'English' : 'العربية'}
      style={{ borderRadius: 999 }}
      className={`relative inline-flex h-9 shrink-0 items-center justify-center overflow-hidden border border-[#C49A52]/55 bg-[#0D0D0F] text-xs font-bold shadow-[0_6px_18px_-8px_rgba(13,13,15,0.65),inset_0_1px_0_rgba(233,207,148,0.18)] hover:border-[#E9CF94] ${
        wide ? 'gap-1.5 px-3.5' : 'w-9 px-0'
      } ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {wide ? (
          <motion.span
            key="wide"
            layout="position"
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
            transition={{ duration: 0.22 }}
            className="inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-[#E9CF94]" />
            <span className="bg-gradient-to-r from-[#E9CF94] to-[#C49A52] bg-clip-text text-transparent" lang={isAr ? 'en' : 'ar'}>
              {isAr ? 'English' : 'العربية'}
            </span>
          </motion.span>
        ) : (
          <motion.span
            key="compact"
            layout="position"
            initial={{ opacity: 0, scale: 0.6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.6, filter: 'blur(4px)' }}
            transition={{ duration: 0.22 }}
            lang={isAr ? 'en' : 'ar'}
            className={`bg-gradient-to-r from-[#E9CF94] to-[#C49A52] bg-clip-text text-transparent ${isAr ? 'text-[11px] leading-none tracking-wide' : 'pb-0.5 text-[17px] leading-[1.5]'}`}
          >
            {isAr ? 'EN' : 'ع'}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
