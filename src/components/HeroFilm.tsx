import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { BRAND_LOGOS } from './BrandLogo';

// A 10-second coded "film" for the home hero, drawn live so no video file has to
// download: a disco laser show on black; the beams sweep over the name, find it,
// and everything around it fades to black so only the white name is left. Then the
// panel flips and the white logo appears. It stays on the logo.
// Colours are inline styles because the light theme rewrites bg-black classes.
const FOUND_AT = 3.6; // s: the name starts to show where the lights hit it
const CONVERGE_AT = 5.2; // s: beams start pulling to the name
const WORD_AT = 6.2; // s: the name is found; the room goes black around it
const FLIP_AT = 8.3; // s: panel flips to the logo
const END_AT = 10;
const COLORS = ['#ff2bd6', '#22e4ff', '#6dff4a', '#8b5cff', '#ffcf3d', '#ff4b4b'];
const BLACK = '#050507';

function drawShow(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dots: { a: number; r: number; s: number; c: string }[]) {
  // Short trails give the beams a hazy, moving look.
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(5,5,7,0.32)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';

  const pull = Math.min(1, Math.max(0, (t - CONVERGE_AT) / (WORD_AT - CONVERGE_AT)));
  const fade = t < WORD_AT ? 1 : Math.max(0, 1 - (t - WORD_AT) / 0.9);
  const cx = w / 2;
  const cy = h / 2;
  const reach = Math.hypot(w, h);

  // Haze glow behind everything, pulsing to a beat.
  const beat = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
  const haze = ctx.createRadialGradient(cx, h * 0.55, 0, cx, h * 0.55, reach * 0.55);
  haze.addColorStop(0, `rgba(140,60,255,${0.08 + 0.06 * beat * fade})`);
  haze.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);

  // Wide soft spotlights from the ceiling.
  for (let i = 0; i < 4; i += 1) {
    const sx = w * (0.15 + i * 0.23);
    const ang = Math.PI / 2 + Math.sin(t * 1.3 + i * 1.7) * 0.55 * (1 - pull);
    const len = reach * 0.9;
    const spread = 0.13;
    const color = COLORS[(i + Math.floor(t * 1.5)) % COLORS.length];
    const g = ctx.createLinearGradient(sx, 0, sx + Math.cos(ang) * len, Math.sin(ang) * len);
    g.addColorStop(0, `${color}55`);
    g.addColorStop(1, `${color}00`);
    ctx.globalAlpha = 0.6 * fade;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, -4);
    ctx.lineTo(sx + Math.cos(ang - spread) * len, Math.sin(ang - spread) * len);
    ctx.lineTo(sx + Math.cos(ang + spread) * len, Math.sin(ang + spread) * len);
    ctx.closePath();
    ctx.fill();
  }

  // Laser fans from the floor; they swing, then all aim at the centre.
  const sources = 6;
  ctx.lineCap = 'round';
  for (let i = 0; i < sources; i += 1) {
    const sx = w * ((i + 0.5) / sources);
    const sy = h + 4;
    const color = COLORS[(i * 2 + Math.floor(t * 2)) % COLORS.length];
    const toCentre = Math.atan2(cy - sy, cx - sx);
    for (let k = -2; k <= 2; k += 1) {
      const swing = -Math.PI / 2 + Math.sin(t * (1.6 + i * 0.25) + i) * 0.9 + k * 0.11;
      const ang = swing + (toCentre - swing) * pull;
      const len = pull > 0 ? reach * (1 - pull * 0.55) : reach;
      ctx.globalAlpha = (0.55 + 0.45 * beat) * fade;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // Mirror-ball sparkles spinning round the room.
  for (const d of dots) {
    const a = d.a + t * d.s;
    const x = cx + Math.cos(a) * d.r * w * (1 - pull * 0.7);
    const y = h * 0.45 + Math.sin(a) * d.r * h * 0.55 * (1 - pull * 0.7);
    ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(t * 6 + d.a * 9))) * fade;
    ctx.fillStyle = d.c;
    ctx.beginPath();
    ctx.arc(x, y, 1.6 + d.r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export function HeroFilm({ word, replayLabel }: { word: string; replayLabel: string }) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<'show' | 'found' | 'word' | 'logo'>(reduceMotion ? 'logo' : 'show');

  useEffect(() => {
    if (reduceMotion) { setPhase('logo'); return; }
    setPhase('show');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dots = Array.from({ length: 70 }, (_, i) => ({ a: Math.random() * Math.PI * 2, r: 0.08 + Math.random() * 0.5, s: (i % 2 ? 1 : -1) * (0.4 + Math.random() * 0.5), c: COLORS[i % COLORS.length] }));
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    };
    size();
    window.addEventListener('resize', size);
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      drawShow(ctx, canvas.clientWidth, canvas.clientHeight, t, dots);
      if (t < FLIP_AT + 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const timers = [window.setTimeout(() => setPhase('found'), FOUND_AT * 1000), window.setTimeout(() => setPhase('word'), WORD_AT * 1000), window.setTimeout(() => setPhase('logo'), FLIP_AT * 1000)];
    return () => { cancelAnimationFrame(frame); timers.forEach(clearTimeout); window.removeEventListener('resize', size); };
  }, [run, reduceMotion]);

  const flipped = phase === 'logo';
  const face = 'absolute inset-0 overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.75)] [backface-visibility:hidden]';

  return (
    <div className="w-full max-w-6xl px-3 [perspective:2000px] sm:px-6">
      <h1 className="sr-only">{word}</h1>
      <motion.div
        className="relative aspect-[4/5] w-full [transform-style:preserve-3d] sm:aspect-[16/8]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.65, 0, 0.35, 1] }}
      >
        {/* Front: the light show, then the white name */}
        <div className={face} style={{ backgroundColor: BLACK }}>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
          {phase !== 'show' && (
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center p-4 text-center text-[clamp(2.6rem,14.5vw,11rem)] font-black uppercase leading-[0.9] tracking-tighter sm:text-[clamp(3rem,12vw,10rem)]"
              style={{ color: '#ffffff', mixBlendMode: phase === 'found' ? 'overlay' : 'normal' }}
              initial={{ opacity: 0, scale: 1.08, filter: 'blur(6px)' }}
              animate={phase === 'found' ? { opacity: 0.35, scale: 1.04, filter: 'blur(2px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: phase === 'found' ? 1.6 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{word.split(/\s+/).map((part) => <span key={part} className="block">{part}</span>)}</span>
            </motion.div>
          )}
        </div>

        {/* Back: the white logo on black */}
        <div className={`${face} flex items-center justify-center [transform:rotateY(180deg)]`} style={{ backgroundColor: BLACK }}>
          <motion.img
            src={BRAND_LOGOS.full.white}
            alt=""
            draggable={false}
            className="w-[58%] max-w-[420px] sm:w-[32%]"
            style={{ filter: 'drop-shadow(0 0 22px rgba(255,255,255,0.25))' }}
            initial={false}
            animate={{ opacity: flipped ? 1 : 0, scale: flipped ? 1 : 0.9 }}
            transition={{ delay: reduceMotion ? 0 : END_AT - FLIP_AT - 1.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
          {flipped && !reduceMotion && (
            <button type="button" onClick={() => setRun((n) => n + 1)} aria-label={replayLabel} title={replayLabel} className="absolute bottom-4 end-4 rounded-full p-2.5 transition hover:opacity-100" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}>
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
