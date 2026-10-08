import { ReactNode, useRef, useState, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  tiltMax?: number;
  scaleOnHover?: number;
  glare?: boolean;
}

export function TiltCard({
  children,
  className = '',
  onClick,
  tiltMax = 7,
  scaleOnHover = 1.015,
  glare = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Normalized mouse position (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { damping: 20, stiffness: 200 });
  const mouseYSpring = useSpring(y, { damping: 20, stiffness: 200 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [tiltMax, -tiltMax]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-tiltMax, tiltMax]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseXPos = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseYPos = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseXPos);
    y.set(mouseYPos);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
      }}
      whileHover={{ scale: scaleOnHover }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`relative transform-gpu transition-shadow duration-300 ${className}`}
    >
      {children}

      {glare && isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.08) 0%, transparent 65%)`,
          }}
        />
      )}
    </motion.div>
  );
}
