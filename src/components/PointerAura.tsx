import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export function PointerAura() {
  const [isVisible, setIsVisible] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for fluid latency-free movement
  const springX = useSpring(mouseX, { damping: 28, stiffness: 220 });
  const springY = useSpring(mouseY, { damping: 28, stiffness: 220 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {/* Primary ambient light bloom */}
      <motion.div
        className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-radial from-indigo-500/12 via-violet-600/5 to-transparent blur-2xl"
        style={{
          x: springX,
          y: springY,
        }}
      />
      {/* Core subtle precision pinpoint */}
      <motion.div
        className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-indigo-400/30 blur-xs transition-opacity duration-300"
        style={{
          x: mouseX,
          y: mouseY,
        }}
      />
    </div>
  );
}
