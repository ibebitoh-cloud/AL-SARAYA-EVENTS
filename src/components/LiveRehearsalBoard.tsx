import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Volume2,
  Tv,
  Lightbulb,
  Radio,
  Clock,
  Mic,
  Maximize,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RunsheetItem } from '../types/event';
import { sound } from '../utils/soundEffects';

interface LiveRehearsalBoardProps {
  runsheet: RunsheetItem[];
  initialActiveId?: string;
  onCueExecuted: (itemId: string) => void;
}

export function LiveRehearsalBoard({
  runsheet,
  initialActiveId,
  onCueExecuted,
}: LiveRehearsalBoardProps) {
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (initialActiveId) {
      const idx = runsheet.findIndex((item) => item.id === initialActiveId);
      return idx >= 0 ? idx : 2;
    }
    return 2;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180); // 3-min default timer
  const [lightingPreset, setLightingPreset] = useState<'cyber' | 'amber' | 'gold' | 'blackout'>('cyber');
  const [micActive, setMicActive] = useState<boolean>(true);
  const [videoRolling, setVideoRolling] = useState<boolean>(true);

  const activeCue = runsheet[activeIndex] || runsheet[0];
  const nextCue = runsheet[activeIndex + 1];

  // Live rehearsal countdown ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          sound.stageCue();
          // Auto advance cue
          if (activeIndex < runsheet.length - 1) {
            setActiveIndex((curr) => curr + 1);
            return (runsheet[activeIndex + 1]?.durationMinutes || 5) * 60;
          } else {
            setIsPlaying(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, activeIndex, runsheet]);

  const handleNextCue = () => {
    if (activeIndex < runsheet.length - 1) {
      sound.stageCue();
      onCueExecuted(activeCue.id);
      setActiveIndex(activeIndex + 1);
      setSecondsRemaining((runsheet[activeIndex + 1]?.durationMinutes || 5) * 60);
    }
  };

  const handlePrevCue = () => {
    if (activeIndex > 0) {
      sound.click(500);
      setActiveIndex(activeIndex - 1);
      setSecondsRemaining((runsheet[activeIndex - 1]?.durationMinutes || 5) * 60);
    }
  };

  const handleTogglePlay = () => {
    sound.click(700);
    setIsPlaying(!isPlaying);
  };

  const handleTriggerCelebration = () => {
    sound.success();
    try {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#e11d48', '#f59e0b', '#10b981'],
      });
    } catch {
      // Safe fail
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Lighting atmosphere dynamic background style
  const getLightingGlow = () => {
    switch (lightingPreset) {
      case 'amber':
        return 'from-amber-600/30 via-orange-950/40 to-slate-950 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)]';
      case 'gold':
        return 'from-yellow-600/30 via-amber-950/40 to-slate-950 border-yellow-500/40 shadow-[0_0_50px_rgba(234,179,8,0.25)]';
      case 'blackout':
        return 'from-slate-950 via-slate-950 to-slate-950 border-slate-800 shadow-none';
      default:
        return 'from-indigo-600/30 via-violet-950/40 to-slate-950 border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.3)]';
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Live Director Command Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Day-Of Rehearsal & Live Run-of-Show Engine</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                MASTER CONTROL
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time countdown automation, synchronized lighting preview, AV stinger triggers.
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerCelebration}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grand Finale Cue</span>
          </button>
        </div>
      </div>

      {/* Main Rehearsal Stage Simulation Window */}
      <motion.div
        layout
        className={`relative w-full rounded-3xl bg-gradient-to-b border p-6 sm:p-8 transition-all duration-700 overflow-hidden ${getLightingGlow()}`}
      >
        {/* Top Ticker & Stage Lighting Mode Selector - Wrap cleanly on mobile */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">ON AIR:</span>
            <span>Cue {activeIndex + 1}/{runsheet.length}</span>
            <span className="text-slate-500">·</span>
            <span className="text-indigo-300">{activeCue?.category}</span>
          </div>

          {/* Lighting Rig Presets - Flex-wrap without overflow */}
          <div className="flex flex-wrap items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[10px] uppercase font-mono text-slate-400 px-1 hidden sm:inline">Rig:</span>
            <button
              onClick={() => {
                sound.tick();
                setLightingPreset('cyber');
              }}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                lightingPreset === 'cyber' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Indigo
            </button>
            <button
              onClick={() => {
                sound.tick();
                setLightingPreset('amber');
              }}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                lightingPreset === 'amber' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Amber
            </button>
            <button
              onClick={() => {
                sound.tick();
                setLightingPreset('gold');
              }}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                lightingPreset === 'gold' ? 'bg-yellow-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gold
            </button>
            <button
              onClick={() => {
                sound.tick();
                setLightingPreset('blackout');
              }}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                lightingPreset === 'blackout' ? 'bg-slate-800 text-rose-400 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Center Stage Presentation Block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center w-full">
          {/* Main Cue Broadcast Display (2 Cols) */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold">
                CURRENT SEGMENT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeCue?.time} ({activeCue?.durationMinutes}m)
              </span>
            </div>

            <h1 className="text-xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {activeCue?.title}
            </h1>

            <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {activeCue?.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/10">
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                <span>Lead: <strong className="text-white">{activeCue?.leadPerson}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/10">
                <span>Room: <strong className="text-white">{activeCue?.location}</strong></span>
              </div>
            </div>
          </div>

          {/* Master Countdown Clock & Stage Transport Controls */}
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md text-center space-y-3 sm:space-y-4 shadow-2xl w-full">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-mono text-slate-400">
              COUNTDOWN TO NEXT TRANSITION
            </span>

            {/* Responsive Countdown Timer */}
            <div className="text-4xl sm:text-6xl font-mono font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              {formatTimer(secondsRemaining)}
            </div>

            {/* Transport Control Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePrevCue}
                disabled={activeIndex === 0}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white transition-all cursor-pointer"
                title="Previous Cue"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className={`p-4 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-black font-bold'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold'
                }`}
                title={isPlaying ? 'Pause Run-of-Show' : 'Start Run-of-Show'}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              <button
                onClick={handleNextCue}
                disabled={activeIndex === runsheet.length - 1}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all cursor-pointer"
                title="Execute Next Cue"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              {isPlaying ? '● Rehearsal timer ticking' : '⏸ Rehearsal paused on standby'}
            </div>
          </div>
        </div>

        {/* Live Technical AV Dispatch Box */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between text-xs text-sky-400 font-mono font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Feed</span>
              </span>
              <button
                onClick={() => {
                  sound.tick();
                  setMicActive(!micActive);
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${
                  micActive ? 'bg-sky-500/20 text-sky-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {micActive ? 'LIVE' : 'MUTED'}
              </button>
            </div>
            <p className="text-xs text-slate-200">{activeCue?.avCues.audio}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Stage Lighting</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">DMX 512 ACTIVE</span>
            </div>
            <p className="text-xs text-slate-200">{activeCue?.avCues.lighting}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between text-xs text-purple-400 font-mono font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" />
                <span>Video Wall 8K</span>
              </span>
              <button
                onClick={() => {
                  sound.tick();
                  setVideoRolling(!videoRolling);
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${
                  videoRolling ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {videoRolling ? 'STREAMING' : 'STILL'}
              </button>
            </div>
            <p className="text-xs text-slate-200">{activeCue?.avCues.video}</p>
          </div>
        </div>

        {/* Next Up Standby Teaser */}
        {nextCue && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded">
                NEXT ON DECK
              </span>
              <span className="font-semibold text-white">{nextCue.title}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{nextCue.leadPerson}</span>
            </div>
            <span className="text-slate-400 font-mono tabular-nums">{nextCue.time}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
