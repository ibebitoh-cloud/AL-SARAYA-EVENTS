import { useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';

export function ParallaxBackground() {
  const { scrollY } = useScroll();

  // Multi-speed parallax layers
  const yDistant = useTransform(scrollY, [0, 2000], [0, 280]);
  const yMid = useTransform(scrollY, [0, 2000], [0, -180]);
  const yFast = useTransform(scrollY, [0, 2000], [0, -380]);
  const rotateOrbs = useTransform(scrollY, [0, 2000], [0, 60]);
  const scaleMesh = useTransform(scrollY, [0, 1000], [1, 1.15]);

  // Mouse spring parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 30, stiffness: 120 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 120 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set((e.clientX - centerX) * 0.04);
      mouseY.set((e.clientY - centerY) * 0.04);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-20">
      {/* Layer 1: Distant Celestial Grid and Cosmic Indigo Wash */}
      <motion.div
        style={{
          y: yDistant,
          x: springX,
          scale: scaleMesh,
        }}
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[900px] bg-gradient-to-b from-indigo-950/30 via-slate-950 to-transparent rounded-full blur-3xl opacity-70"
      />

      {/* Layer 2: Mid-ground Stage Spotlight Beams (Reverse Scroll Speed) */}
      <motion.div
        style={{
          y: yMid,
          rotate: rotateOrbs,
        }}
        className="absolute top-1/4 right-[5%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-violet-600/10 via-indigo-500/10 to-transparent blur-3xl"
      />

      <motion.div
        style={{
          y: yDistant,
          x: springY,
        }}
        className="absolute top-2/3 left-[3%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/5 via-violet-900/10 to-transparent blur-3xl"
      />

      {/* Layer 3: High-speed Parallax Floating Geometric Accents & Coordinate Rings */}
      <motion.div
        style={{
          y: yFast,
          x: springX,
        }}
        className="absolute top-1/2 right-[12%] hidden lg:flex flex-col items-center gap-2 opacity-25"
      >
        <div className="w-24 h-24 rounded-full border border-dashed border-indigo-500/40 animate-[spin_40s_linear_infinite]" />
        <span className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase">
          STAGE AXIS · DMX 512
        </span>
      </motion.div>

      <motion.div
        style={{
          y: yFast,
          x: springY,
        }}
        className="absolute top-3/4 left-[8%] hidden lg:flex flex-col items-start gap-1 opacity-20"
      >
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
        <span className="text-[9px] font-mono text-slate-400 tracking-wider">
          PARALLAX DEPTH: LAYER 3
        </span>
      </motion.div>
    </div>
  );
}
