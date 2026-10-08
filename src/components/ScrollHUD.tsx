import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useVelocity } from 'motion/react';
import { ArrowDown, ArrowUp, Zap, Sparkles } from 'lucide-react';
import { sound } from '../utils/soundEffects';

interface ScrollHUDProps {
  onJumpToLive?: () => void;
  activePhaseTitle?: string;
}

export function ScrollHUD({ onJumpToLive, activePhaseTitle }: ScrollHUDProps) {
  const { scrollY, scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  const [scrollDir, setScrollDir] = useState<'down' | 'up' | 'idle'>('idle');
  const [velocityMagnitude, setVelocityMagnitude] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let timer: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (Math.abs(delta) > 4) {
        setScrollDir(delta > 0 ? 'down' : 'up');
      }

      lastScrollY = currentScrollY;

      clearTimeout(timer);
      timer = setTimeout(() => {
        setScrollDir('idle');
      }, 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    return smoothVelocity.on('change', (latest) => {
      setVelocityMagnitude(Math.min(100, Math.round(Math.abs(latest) / 15)));
    });
  }, [smoothVelocity]);

  const scrollToTop = () => {
    sound.click(750);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Top Scroll Laser Progress Meter */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-400 to-amber-400 origin-left shadow-[0_0_12px_rgba(99,102,241,0.8)]"
          style={{ scaleX }}
        />
      </div>

      {/* Floating Dynamic Scroll Velocity & Interactive Motion Dock */}
      <motion.aside
        aria-label="Scroll pacing and navigation controls"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center gap-3 p-2 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl shadow-indigo-950/40 backdrop-blur-md select-none"
      >
        {/* Dynamic scroll direction indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-xs font-mono">
          <motion.div
            animate={{
              rotate: scrollDir === 'down' ? 180 : scrollDir === 'up' ? 0 : 0,
              scale: scrollDir !== 'idle' ? [1, 1.25, 1] : 1,
            }}
            transition={{ duration: 0.2 }}
            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
              scrollDir === 'down'
                ? 'bg-amber-500/20 text-amber-400'
                : scrollDir === 'up'
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-slate-700/40 text-slate-400'
            }`}
          >
            {scrollDir === 'down' ? (
              <ArrowDown className="w-3 h-3" />
            ) : scrollDir === 'up' ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
          </motion.div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans">
              {scrollDir === 'down'
                ? 'Advancing'
                : scrollDir === 'up'
                ? 'Ascending'
                : 'Pacing Stable'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-200 tabular-nums font-semibold">
                {velocityMagnitude} <span className="text-[10px] text-slate-400">px/s</span>
              </span>
              {/* Dynamic velocity bar */}
              <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-amber-400"
                  style={{ width: `${Math.min(100, velocityMagnitude)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current phase readout */}
        {activePhaseTitle && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 max-w-44 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
            <span className="truncate">{activePhaseTitle}</span>
          </div>
        )}

        {/* Quick jump actions */}
        {onJumpToLive && (
          <button
            onClick={() => {
              sound.stageCue();
              onJumpToLive();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            title="Jump directly to current active cue"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Active Cue</span>
          </button>
        )}

        <button
          onClick={scrollToTop}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Scroll back to top"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </motion.aside>
    </>
  );
}
