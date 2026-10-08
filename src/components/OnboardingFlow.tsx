import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  Users,
  Clock,
  Radio,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Volume2,
  Lightbulb,
  Maximize2,
  DollarSign,
  Utensils,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/soundEffects';

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Step 1 interactive demo state
  const [demoTemplate, setDemoTemplate] = useState<'summit' | 'gala' | 'keynote'>('summit');
  const [demoBudget, setDemoBudget] = useState<number>(185000);

  // Step 2 interactive demo state (guests seated)
  const [seatedCount, setSeatedCount] = useState<number>(3);
  const [activeDietary, setActiveDietary] = useState<string>('Vegan');

  // Step 3 interactive demo state (scroll scrub / lighting)
  const [cueScrubIndex, setCueScrubIndex] = useState<number>(1);
  const [stageLightColor, setStageLightColor] = useState<'indigo' | 'amber' | 'gold'>('indigo');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStep < 3) handleNext();
      if (e.key === 'ArrowLeft' && currentStep > 0) handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    sound.swoosh();
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      if (currentStep === 2) {
        // Trigger celebration confetti on final step
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
      }
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    sound.click(500);
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleFinish = () => {
    sound.success();
    try {
      confetti({
        particleCount: 70,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // Safe fail
    }
    onComplete();
    onClose();
  };

  const steps = [
    {
      title: 'Architect Your Production',
      subtitle: 'Create dynamic events with synchronized budgets and schedule milestones.',
      icon: Calendar,
    },
    {
      title: 'Spatial Seating & VIP Invitations',
      subtitle: 'Interactive 3D table arrangement with door check-in concierge and dietary tracking.',
      icon: Users,
    },
    {
      title: 'Scroll-Driven Runsheet Engine',
      subtitle: 'Execute live cues as you scroll through the event day with synchronized AV lighting.',
      icon: Clock,
    },
    {
      title: 'Production Ready!',
      subtitle: 'You are now ready to orchestrate high-stakes events with zero latency.',
      icon: Sparkles,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden my-auto"
        >
          {/* Background Ambient Glow */}
          <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />

          {/* Close & Skip Button */}
          <button
            onClick={() => {
              sound.tick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-20"
            aria-label="Close Tour"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step Progress Bar & Indicators */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="uppercase tracking-wider text-indigo-400 font-semibold">
                Interactive Onboarding · Step {currentStep + 1} of 4
              </span>
              <button
                onClick={handleFinish}
                className="hover:text-slate-200 transition-colors cursor-pointer text-[11px]"
              >
                Skip Tour →
              </button>
            </div>

            {/* Continuous progress track */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-400 to-emerald-400"
                animate={{ width: `${((currentStep + 1) / 4) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Stepper Node Icons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {steps.map((st, idx) => {
                const Icon = st.icon;
                const isCurrent = idx === currentStep;
                const isPassed = idx < currentStep;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      sound.click(550);
                      setCurrentStep(idx);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : isPassed
                        ? 'text-indigo-300 hover:bg-slate-800/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className="text-xs font-medium truncate hidden sm:inline">
                      {st.title.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Content Slide */}
          <div className="min-h-[310px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* STEP 1: Creating an Event */}
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      <span>1. Architect Your Production Identity</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure high-stakes schedules, venue allocations, and automated financial ceilings. Click below to test live archetype morphing:
                    </p>
                  </div>

                  {/* Interactive Live Archetype Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'summit', label: 'AI Summit 2026', budget: 185000, theme: 'Cyber Sapphire' },
                      { id: 'gala', label: 'Waterfront Gala', budget: 240000, theme: 'Obsidian Velvet' },
                      { id: 'keynote', label: 'Hardware Keynote', budget: 320000, theme: 'Titanium Aurora' },
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          sound.click(600);
                          setDemoTemplate(tpl.id as 'summit' | 'gala' | 'keynote');
                          setDemoBudget(tpl.budget);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          demoTemplate === tpl.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{tpl.label}</span>
                        <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">{tpl.theme}</span>
                      </button>
                    ))}
                  </div>

                  {/* Morphing Event Preview Card */}
                  <motion.div
                    layout
                    className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          {demoTemplate === 'summit'
                            ? 'Global AI & Architecture Summit 2026'
                            : demoTemplate === 'gala'
                            ? 'Lumina Twilight Charity Gala & Auction'
                            : 'Horizon Cybernetic Hardware Keynote'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-400 font-semibold tabular-nums">
                        ${demoBudget.toLocaleString()} USD
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-[9px] uppercase font-mono text-slate-500 block">Venue</span>
                        <span className="text-slate-200">Metropolitan Grand Pavilion</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono text-slate-500 block">Attendance</span>
                        <span className="text-slate-200">480 VIP Attendees</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono text-slate-500 block">Status</span>
                        <span className="text-emerald-400 font-medium">Ready for Runsheet</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* STEP 2: Inviting Guests & 3D Spatial Seating */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <span>2. Spatial Seating & VIP Concierge</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Arrange keynote speakers, press, and sponsors on the isometric venue floor. Test seating guests into Table 1 below:
                    </p>
                  </div>

                  {/* Interactive Mini Seating Arena */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* Simulated Table Ring */}
                    <div className="relative h-44 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-4">
                      {/* Central Table */}
                      <div className="w-24 h-24 rounded-full bg-gradient-to-b from-indigo-900/60 to-slate-900 border-2 border-indigo-400/80 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <span className="text-[10px] font-bold text-white">VIP Table 1</span>
                        <span className="text-[9px] font-mono text-emerald-400 tabular-nums">
                          {seatedCount} / 6 Seated
                        </span>
                      </div>

                      {/* Seat nodes */}
                      {Array.from({ length: 6 }).map((_, seatIdx) => {
                        const angle = (seatIdx / 6) * 2 * Math.PI;
                        const isOccupied = seatIdx < seatedCount;
                        const x = Math.cos(angle) * 58;
                        const y = Math.sin(angle) * 58;

                        return (
                          <motion.div
                            key={seatIdx}
                            animate={{ scale: isOccupied ? [1, 1.3, 1] : 1 }}
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border ${
                              isOccupied
                                ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                                : 'bg-slate-800 border-slate-700'
                            }`}
                            style={{ transform: `translate(${x}px, ${y}px)` }}
                          />
                        );
                      })}
                    </div>

                    {/* Interactive Seat Button & Dietary Tag */}
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">Guest: Dr. Aris Thorne</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                            {activeDietary}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Chief Robotics Scientist · Keynote Lead</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={seatedCount >= 6}
                          onClick={() => {
                            sound.stageCue();
                            setSeatedCount((prev) => Math.min(6, prev + 1));
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Seat Next Guest (+1)</span>
                        </button>

                        <button
                          onClick={() => {
                            sound.tick();
                            setSeatedCount(1);
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Scroll-Driven Runsheet & Live Stage Cues */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-400" />
                      <span>3. Scroll-Driven Runsheet & Cue Runner</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      As you scroll down the timeline, active cue beacons illuminate automatically and trigger synchronized lighting washes. Scrub or click below:
                    </p>
                  </div>

                  {/* Interactive Micro Scrub Runsheet */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    {/* Lighting Rig Simulation Strip */}
                    <div
                      className={`p-3 rounded-xl border transition-all duration-500 flex items-center justify-between ${
                        stageLightColor === 'indigo'
                          ? 'bg-indigo-950/60 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                          : stageLightColor === 'amber'
                          ? 'bg-amber-950/60 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : 'bg-yellow-950/60 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.25)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <Lightbulb className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span className="font-semibold text-white">STAGE LIGHTING:</span>
                        <span className="uppercase text-slate-300">
                          {stageLightColor === 'indigo'
                            ? 'Cyber Indigo Wash'
                            : stageLightColor === 'amber'
                            ? 'Warm Keylight 5600K'
                            : 'Twilight Gold Pinspot'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {(['indigo', 'amber', 'gold'] as const).map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              sound.tick();
                              setStageLightColor(color);
                            }}
                            className={`w-4 h-4 rounded-full border cursor-pointer ${
                              color === 'indigo'
                                ? 'bg-indigo-500 border-indigo-400'
                                : color === 'amber'
                                ? 'bg-amber-500 border-amber-400'
                                : 'bg-yellow-400 border-yellow-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Timeline Cues Scrub */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 0, time: '09:00', title: 'Doors Open', category: 'AV/Tech' },
                        { id: 1, time: '10:00', title: 'Vision Keynote', category: 'Stage' },
                        { id: 2, time: '12:00', title: 'Gala Banquet', category: 'Catering' },
                      ].map((cue) => {
                        const isActive = cueScrubIndex === cue.id;
                        return (
                          <button
                            key={cue.id}
                            onClick={() => {
                              sound.stageCue();
                              setCueScrubIndex(cue.id);
                              setStageLightColor(cue.id === 0 ? 'indigo' : cue.id === 1 ? 'amber' : 'gold');
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isActive
                                ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)] text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="text-[10px] font-mono block text-emerald-400">{cue.time}</span>
                            <span className="text-xs font-bold block mt-0.5">{cue.title}</span>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                              {cue.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Production Ready Victory */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 text-center py-2"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    <Sparkles className="w-8 h-8 text-white animate-spin" />
                  </div>

                  <h3 className="text-2xl font-extrabold text-white">
                    You Are Ready for Event Production!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Test the motion-reactive scroll features, 3D mouse tilt cards, and live day-of cue triggers in the main suite.
                  </p>

                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-left pt-2">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                      <span className="text-indigo-400 font-semibold block">Scroll Laser</span>
                      <span className="text-slate-400">Velocity HUD & Jump</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                      <span className="text-emerald-400 font-semibold block">3D Perspective</span>
                      <span className="text-slate-400">Tilt Cards & Floor</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                      <span className="text-amber-400 font-semibold block">Synthesizer</span>
                      <span className="text-slate-400">Web Audio FX</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Modal Footer Actions */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-102 active:scale-95 cursor-pointer"
              >
                <span>{currentStep === 3 ? 'Launch Command Suite' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
