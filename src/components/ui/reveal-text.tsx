import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

// Adapted from the 21st.dev "RevealText" component: letters pop in one by one, a colour
// sweep runs across them once they settle, and hovering (or tapping) a letter fills it
// with a photo. Changes for this app: uses `motion/react` (already installed) instead of
// framer-motion, wraps words onto their own lines so long names fit on phones, always
// lays out left-to-right (the Arabic page is RTL), plays one photo wave for touch
// screens, and honours "reduce motion".

interface RevealTextProps {
  text?: string;
  textColor?: string;
  overlayColor?: string;
  /** Tailwind classes for the letter size; use a clamp() so the text fits narrow screens. */
  fontSize?: string;
  letterDelay?: number;
  overlayDelay?: number;
  overlayDuration?: number;
  springDuration?: number;
  letterImages?: string[];
  className?: string;
}

export function RevealText({
  text = 'STUNNING',
  textColor = 'text-white',
  overlayColor = 'text-amber-300',
  fontSize = 'text-[clamp(3rem,14vw,10rem)]',
  letterDelay = 0.08,
  overlayDelay = 0.05,
  overlayDuration = 0.4,
  springDuration = 600,
  letterImages = [],
  className = '',
}: RevealTextProps) {
  const reduceMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  // After the sweep, one slow wave fills each letter with its photo in turn, so phone
  // visitors (who can't hover) still see the pictures.
  const [waveIndex, setWaveIndex] = useState<number | null>(null);
  const letterCount = text.replace(/\s+/g, '').length;

  useEffect(() => {
    if (reduceMotion) return;
    // Run the colour sweep once the last letter's spring has settled.
    const totalDelay = (letterCount - 1) * letterDelay * 1000 + springDuration;
    const timer = setTimeout(() => setShowOverlay(true), totalDelay);
    let step = -1;
    let wave: ReturnType<typeof setInterval> | undefined;
    const waveStart = setTimeout(() => {
      wave = setInterval(() => {
        step += 1;
        if (step >= letterCount) { clearInterval(wave); setWaveIndex(null); return; }
        setWaveIndex(step);
      }, 260);
    }, totalDelay + 1200);
    return () => { clearTimeout(timer); clearTimeout(waveStart); clearInterval(wave); };
  }, [letterCount, letterDelay, springDuration, reduceMotion]);

  // A running index across all words, so delays and photos continue from word to word.
  let index = -1;
  return (
    <div dir="ltr" className={`relative flex flex-col items-center justify-center leading-[0.95] ${className}`}>
      {text.trim().split(/\s+/).map((word, wordIndex) => (
        <div key={`${word}-${wordIndex}`} className="flex">
          {word.split('').map((letter) => {
            index += 1;
            const i = index;
            const image = letterImages.length ? letterImages[i % letterImages.length] : '';
            const active = (hoveredIndex === i || (hoveredIndex === null && waveIndex !== null && Math.abs(waveIndex - i) <= 1)) && Boolean(image);
            return (
              <motion.span
                key={i}
                onPointerEnter={() => setHoveredIndex(i)}
                onPointerLeave={() => setHoveredIndex(null)}
                onPointerDown={() => setHoveredIndex((current) => (current === i ? null : i))}
                className={`${fontSize} relative cursor-pointer select-none font-black tracking-tighter`}
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * letterDelay, type: 'spring', damping: 12, stiffness: 200, mass: 0.8 }}
              >
                {/* Base text layer */}
                <motion.span className={`absolute inset-0 ${textColor}`} animate={{ opacity: active ? 0 : 1 }} transition={{ duration: 0.15 }}>
                  {letter}
                </motion.span>
                {/* Photo layer: the letter is filled with a picture that slowly pans */}
                <motion.span
                  className="bg-cover bg-no-repeat text-transparent"
                  animate={{ opacity: active ? 1 : 0, backgroundPosition: active ? '80% center' : '20% center' }}
                  transition={{ opacity: { duration: 0.15 }, backgroundPosition: { duration: 3, ease: 'easeInOut' } }}
                  style={{ backgroundImage: image ? `url('${image}')` : undefined, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {letter}
                </motion.span>
                {/* Colour sweep that runs once across the word */}
                {showOverlay && (
                  <motion.span
                    className={`pointer-events-none absolute inset-0 ${overlayColor}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ delay: i * overlayDelay, duration: overlayDuration, times: [0, 0.1, 0.7, 1], ease: 'easeInOut' }}
                  >
                    {letter}
                  </motion.span>
                )}
              </motion.span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
