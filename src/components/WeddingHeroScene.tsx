import { useEffect, useRef } from 'react';

// A soft, live wedding backdrop for the home hero: a few rose petals drifting through
// depth (far ones out of focus), rising gold sparkles, and slow candle-light bokeh.
// Plain canvas with a small perspective projection, so it adds no 3D library to the bundle.

interface Petal { x: number; y: number; z: number; spin: number; spinSpeed: number; tumble: number; tumbleSpeed: number; sway: number; size: number; color: [string, string]; }
interface Light { x: number; y: number; z: number; phase: number; speed: number; }
interface Dust { x: number; y: number; size: number; speed: number; phase: number; }

const PETAL_COLORS: [string, string][] = [
  ['#f9d5dc', '#e8a3b3'], // blush
  ['#fff4ec', '#f1d9c8'], // ivory
  ['#efb3bf', '#d68597'], // dusty rose
];

export function WeddingHeroScene({ reduceMotion = false }: { reduceMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0, height = 0, frame = 0, visible = true;
    let petals: Petal[] = [];
    let lights: Light[] = [];
    let dust: Dust[] = [];
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const newPetal = (anywhere: boolean): Petal => ({
      x: rand(-0.1, 1.1) * width,
      y: anywhere ? rand(0, height) : rand(-0.25, -0.05) * height,
      z: rand(0.25, 1),
      spin: rand(0, Math.PI * 2), spinSpeed: rand(-0.008, 0.008),
      tumble: rand(0, Math.PI * 2), tumbleSpeed: rand(0.008, 0.02),
      sway: rand(0, Math.PI * 2),
      size: rand(6, 10),
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = Math.min(1, (width * height) / (1280 * 800));
      petals = Array.from({ length: Math.round(7 + 9 * density) }, () => newPetal(true));
      dust = Array.from({ length: Math.round(30 + 40 * density) }, () => ({ x: rand(0, width), y: rand(0, height), size: rand(0.6, 1.6), speed: rand(0.1, 0.35), phase: rand(0, Math.PI * 2) }));
      lights = Array.from({ length: Math.round(10 + 10 * density) }, () => ({ x: rand(0, width), y: rand(0, height), z: rand(0.2, 1), phase: rand(0, Math.PI * 2), speed: rand(0.005, 0.015) }));
    };

    const drawPetal = (p: Petal, px: number, py: number) => {
      const s = p.size * (0.5 + p.z * 0.7);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.spin);
      ctx.scale(1, 0.3 + 0.7 * Math.abs(Math.cos(p.tumble))); // tumbling face-on / edge-on
      ctx.globalAlpha = 0.25 + p.z * 0.45;
      // Near petals stay sharp; far ones sit out of focus like a camera's depth of field.
      ctx.filter = p.z < 0.6 ? `blur(${((0.6 - p.z) * 6).toFixed(1)}px)` : 'none';
      const g = ctx.createLinearGradient(-s, -s, s, s);
      g.addColorStop(0, p.color[0]); g.addColorStop(1, p.color[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.3);
      ctx.bezierCurveTo(s * 0.9, -s * 0.8, s * 0.8, s * 0.7, 0, s * 1.1);
      ctx.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.8, -s * 0.6, 0, -s * 1.3);
      ctx.fill();
      ctx.restore();
    };

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      const t = time / 1000;

      // Candle-light bokeh, far layer first.
      for (const l of lights) {
        if (!reduceMotion) { l.phase += l.speed; l.y -= 0.08 * l.z; if (l.y < -40) { l.y = height + 40; l.x = rand(0, width); } }
        const lx = l.x + pointer.x * 30 * l.z, ly = l.y + pointer.y * 20 * l.z;
        const radius = 6 + l.z * 26;
        const alpha = (0.08 + 0.18 * l.z) * (0.6 + 0.4 * Math.sin(l.phase));
        const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
        glow.addColorStop(0, `rgba(255, 214, 140, ${alpha * 0.8})`);
        glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(lx, ly, radius, 0, Math.PI * 2); ctx.fill();
      }

      // Gold sparkles drifting upward, like candle embers.
      for (const d of dust) {
        if (!reduceMotion) { d.y -= d.speed; d.x += Math.sin(t * 0.6 + d.phase) * 0.15; if (d.y < -10) { d.y = height + 10; d.x = rand(0, width); } }
        const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + d.phase);
        ctx.fillStyle = `rgba(255, 226, 160, ${0.25 + 0.55 * twinkle})`;
        ctx.beginPath(); ctx.arc(d.x + pointer.x * 10, d.y + pointer.y * 6, d.size, 0, Math.PI * 2); ctx.fill();
      }

      // Rose petals, sorted so nearer petals draw on top.
      petals.sort((p, q) => p.z - q.z);
      for (const p of petals) {
        if (!reduceMotion) {
          p.y += 0.15 + p.z * 0.35;
          p.sway += 0.008;
          p.x += Math.sin(p.sway) * 0.35 * p.z;
          p.spin += p.spinSpeed;
          p.tumble += p.tumbleSpeed;
          if (p.y > height + 30) Object.assign(p, newPetal(false));
        }
        drawPetal(p, p.x + pointer.x * 40 * p.z, p.y + pointer.y * 25 * p.z);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (time: number) => {
      if (visible && !document.hidden) render(time);
      frame = requestAnimationFrame(loop);
    };

    const onPointer = (event: PointerEvent) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    intersection.observe(canvas);
    if (reduceMotion) render(0);
    else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointer);
    };
  }, [reduceMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
