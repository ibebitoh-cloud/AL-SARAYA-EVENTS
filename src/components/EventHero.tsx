import { useRef, MouseEvent } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { Calendar, Sparkles, Play, Users, DollarSign, ArrowDown, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventDetails } from '../types/event';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface EventHeroProps {
  event: EventDetails;
  onStartRehearsal: () => void;
  onOpenSeating: () => void;
  onScrollToRunsheet: () => void;
}

export function EventHero({
  event,
  onStartRehearsal,
  onOpenSeating,
  onScrollToRunsheet,
}: EventHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll parallax transforms
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 600], [0, 160]);
  const opacityHero = useTransform(scrollY, [0, 500], [1, 0.45]);

  // Differential parallax for metric cards
  const yCard1 = useTransform(scrollY, [0, 500], [0, -15]);
  const yCard2 = useTransform(scrollY, [0, 500], [0, 15]);
  const yCard3 = useTransform(scrollY, [0, 500], [0, -25]);
  const yCard4 = useTransform(scrollY, [0, 500], [0, 20]);

  // Mouse tilt for hero backdrop
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 30, stiffness: 150 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 150 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 35);
    mouseY.set(y * 35);
  };

  const handleTriggerCelebration = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.success();
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#6366f1', '#a855f7', '#fbbf24', '#34d399'],
      });
    } catch {
      // Safe fail
    }
  };

  const completedCuesCount = event.runsheet.filter((i) => i.status === 'completed').length;
  const progressPct = Math.round((completedCuesCount / event.runsheet.length) * 100);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full pt-8 pb-12 overflow-hidden"
    >
      {/* Background Animated Gradient Mesh & Glowing Stars with Parallax */}
      <motion.div
        style={{ y: yBg, x: springX }}
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-radial from-indigo-600/25 via-violet-900/15 to-transparent blur-3xl -z-10"
      />

      <motion.div style={{ opacity: opacityHero }} className="space-y-8">
        {/* Top Breadcrumb & Live Transmission Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 uppercase font-semibold">STAGE DYNAMICS ACTIVE</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{event.venueName}</span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTriggerCelebration}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-indigo-300 hover:text-white hover:border-indigo-500/50 transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulate Confetti Cue</span>
            </motion.button>
          </div>
        </div>

        {/* Hero Headline & Key Badges */}
        <div className="max-w-4xl space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs uppercase tracking-widest font-mono text-indigo-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>FLAGSHIP EVENT PRODUCTION SYSTEM</span>
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mt-1 leading-[1.1] text-balance">
              {event.name}
            </h1>
          </motion.div>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Coordinating stage execution, acoustic engineering, live lighting cues, and guest seating across{' '}
            <strong className="text-white">{event.location}</strong>.
          </p>

          {/* Action CTAs with Tactile Hover/Tap Animations */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.stageCue();
                onStartRehearsal();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-xl shadow-indigo-600/30 transition-shadow cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Rehearsal</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.click(600);
                onOpenSeating();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Interactive Seating Studio</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.click(500);
                onScrollToRunsheet();
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Explore Runsheet Below</span>
            </motion.button>
          </div>
        </div>

        {/* 4 Multi-Layer Parallax Feature Metric Panels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {/* Milestone Progress - Layer Speed 1 */}
          <motion.div style={{ y: yCard1 }}>
            <TiltCard
              tiltMax={5}
              onClick={onScrollToRunsheet}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 cursor-pointer hover:border-indigo-500/40"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Runsheet Progress</span>
                <span className="text-emerald-400 font-semibold">{progressPct}%</span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                {completedCuesCount} / {event.runsheet.length}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">cues</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  className="h-full bg-emerald-400"
                />
              </div>
            </TiltCard>
          </motion.div>

          {/* Date & Countdown - Layer Speed 2 */}
          <motion.div style={{ y: yCard2 }}>
            <TiltCard tiltMax={5} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Event Date</span>
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                {event.date}
              </div>
              <div className="mt-1 text-xs text-indigo-300">
                Doors at 09:00 AM Sharp
              </div>
            </TiltCard>
          </motion.div>

          {/* Seated Guests - Layer Speed 3 */}
          <motion.div style={{ y: yCard3 }}>
            <TiltCard
              tiltMax={5}
              onClick={onOpenSeating}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 cursor-pointer hover:border-indigo-500/40"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Confirmed RSVP</span>
                <Users className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                {event.guests.length} / {event.targetAttendees}
              </div>
              <div className="mt-1 text-xs text-emerald-400">
                {event.tables.length} Active Tables Set
              </div>
            </TiltCard>
          </motion.div>

          {/* Production Budget - Layer Speed 4 */}
          <motion.div style={{ y: yCard4 }}>
            <TiltCard tiltMax={5} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Production Budget</span>
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                ${(event.totalBudget / 1000).toFixed(0)}k USD
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {event.vendors.length} Contracted Vendors
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

