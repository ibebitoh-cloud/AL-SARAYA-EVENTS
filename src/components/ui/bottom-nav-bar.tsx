import { useEffect, useState, type ComponentType } from 'react';
import { motion } from 'motion/react';

import { cn } from '@/src/lib/utils';

export type BottomNavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string; 'aria-hidden'?: boolean }>;
  onSelect: () => void;
  /** An action such as Book: always drawn in gold and never marked as the current page. */
  highlight?: boolean;
};

type BottomNavBarProps = {
  items: BottomNavItem[];
  /** The section the visitor is on. Leave it undefined when no item matches (the home page). */
  activeId?: string;
  ariaLabel?: string;
  className?: string;
  stickyBottom?: boolean;
  /** light: cream and amber. dark: night blue with gold, for the dark portal theme. */
  tone?: 'light' | 'dark';
};

export function BottomNavBar({ items, activeId, ariaLabel = 'Bottom Navigation', className, stickyBottom = false, tone = 'light' }: BottomNavBarProps) {
  const [current, setCurrent] = useState(activeId);
  // Follow the page when it changes elsewhere (header links, logo, back to home).
  useEffect(() => setCurrent(activeId), [activeId]);
  const dark = tone === 'dark';

  return (
    <motion.nav
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      aria-label={ariaLabel}
      className={cn(
        'flex h-[54px] max-w-[calc(100vw-24px)] items-center gap-0.5 rounded-full border p-1.5 backdrop-blur-md',
        dark ? 'border-amber-400/20 bg-slate-950/95 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)]' : 'border-amber-900/15 bg-[#fff8e4]/95 shadow-[0_12px_32px_-8px_rgba(69,26,3,0.45)]',
        stickyBottom && 'fixed inset-x-0 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 mx-auto w-fit',
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = !item.highlight && current === item.id;

        return (
          <motion.button
            key={item.id}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              if (!item.highlight) setCurrent(item.id);
              item.onSelect();
            }}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            title={item.label}
            className={cn(
              'relative flex h-[42px] min-w-[40px] shrink-0 items-center justify-center rounded-full px-2.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/60',
              item.highlight
                ? 'bg-[linear-gradient(135deg,#E9CF94,#C49A52_55%,#8C6A2E)] text-[#0D0D0F] shadow-[0_4px_12px_-2px_rgba(140,106,46,0.6)]'
                : isActive
                  ? dark ? 'bg-amber-400/15 text-amber-200' : 'bg-amber-600/15 text-amber-950'
                  : dark ? 'text-slate-400 hover:bg-white/5 hover:text-amber-200' : 'text-amber-900/65 hover:bg-amber-900/5 hover:text-amber-950',
            )}
          >
            <Icon size={21} strokeWidth={2} aria-hidden className="shrink-0" />
            {!item.highlight && (
              <motion.span
                initial={false}
                animate={{ width: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                transition={{ width: { type: 'spring', stiffness: 350, damping: 32 }, opacity: { duration: 0.19 } }}
                className="flex max-w-[104px] overflow-hidden"
                aria-hidden
              >
                <span className="select-none truncate ps-1.5 text-xs font-bold leading-[1.9]">{item.label}</span>
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
