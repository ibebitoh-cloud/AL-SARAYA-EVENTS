import { useEffect, useRef, type ReactNode } from 'react';

// A warm, animated honey backdrop: a slowly shifting amber gradient, soft drifting
// light pools, a faint honeycomb texture, and glowing embers rising on a canvas.
// Children render on top. Motion stops for visitors who prefer reduced motion.

interface HoneyEmberBackgroundProps {
  children?: ReactNode;
  className?: string;
  /** Embers per 100,000 px² of area. */
  density?: number;
}

const CSS = `
.heb{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(135deg,#fff7e0 0%,#fde68a 38%,#fbbf24 72%,#f59e0b 100%);background-size:220% 220%;animation:heb-shift 18s ease-in-out infinite alternate}
.heb-pool{position:absolute;border-radius:9999px;filter:blur(60px);opacity:.55;pointer-events:none;z-index:0}
.heb-pool.a{width:46vmax;height:46vmax;left:-12vmax;top:-14vmax;background:#fffbeb;animation:heb-float-a 22s ease-in-out infinite alternate}
.heb-pool.b{width:38vmax;height:38vmax;right:-10vmax;bottom:-16vmax;background:#d97706;opacity:.35;animation:heb-float-b 26s ease-in-out infinite alternate}
.heb-pool.c{width:28vmax;height:28vmax;left:40%;top:30%;background:#fef3c7;opacity:.4;animation:heb-float-c 30s ease-in-out infinite alternate}
.heb-comb{position:absolute;inset:-60px;z-index:0;pointer-events:none;opacity:.12;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'%3E%3Cpath d='M28 0l28 16v32L28 64 0 48V16zM28 64l28 16v32M28 64L0 80v32' fill='none' stroke='%2378350f' stroke-width='1'/%3E%3C/svg%3E");background-size:56px 97px;animation:heb-comb 60s linear infinite;-webkit-mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%);mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}
.heb-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.heb-content{position:relative;z-index:2}
@keyframes heb-shift{0%{background-position:0% 0%}100%{background-position:100% 100%}}
@keyframes heb-float-a{to{transform:translate(8vmax,6vmax) scale(1.1)}}
@keyframes heb-float-b{to{transform:translate(-7vmax,-5vmax) scale(1.15)}}
@keyframes heb-float-c{to{transform:translate(-10vmax,4vmax) scale(.9)}}
@keyframes heb-comb{to{transform:translate(56px,97px)}}
@media (prefers-reduced-motion: reduce){.heb,.heb-pool,.heb-comb{animation:none!important}}
`;

interface Ember { x: number; y: number; r: number; vy: number; vx: number; phase: number; life: number; }

export function HoneyEmberBackground({ children, className = '', density = 4 }: HoneyEmberBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0, height = 0, frame = 0, visible = true;
    let embers: Ember[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const spawn = (anywhere: boolean): Ember => ({
      x: rand(0, width), y: anywhere ? rand(0, height) : height + rand(0, 40),
      r: rand(1.2, 3.6), vy: rand(0.25, 0.9), vx: rand(-0.15, 0.15), phase: rand(0, Math.PI * 2), life: rand(0.6, 1),
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(140, Math.round((width * height) / 100000 * density));
      embers = Array.from({ length: count }, () => spawn(true));
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      for (const e of embers) {
        if (!reduce) {
          e.y -= e.vy;
          e.x += e.vx + Math.sin(time / 1400 + e.phase) * 0.25;
          if (e.y < -20) Object.assign(e, spawn(false));
        }
        // Embers glow brighter toward the bottom and fade as they rise.
        const rise = Math.max(0, Math.min(1, e.y / height));
        const flicker = 0.65 + 0.35 * Math.sin(time / 260 + e.phase * 3);
        const alpha = e.life * flicker * (0.25 + 0.75 * rise);
        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 5);
        glow.addColorStop(0, `rgba(255, 244, 214, ${alpha})`);
        glow.addColorStop(0.25, `rgba(251, 146, 60, ${alpha * 0.8})`);
        glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = (time: number) => {
      if (visible && !document.hidden) draw(time);
      frame = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);
    if (reduce) draw(0); else frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); };
  }, [density]);

  return (
    <div className={`heb ${className}`}>
      <style>{CSS}</style>
      <div className="heb-pool a" aria-hidden="true" />
      <div className="heb-pool b" aria-hidden="true" />
      <div className="heb-pool c" aria-hidden="true" />
      <div className="heb-comb" aria-hidden="true" />
      <canvas ref={canvasRef} className="heb-canvas" aria-hidden="true" />
      <div className="heb-content h-full w-full">{children}</div>
    </div>
  );
}
