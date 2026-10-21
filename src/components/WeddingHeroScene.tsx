import { useEffect, useRef } from 'react';

// A live wedding backdrop for the home hero: two gold rings turning in 3D,
// rose petals tumbling through depth, and soft candle-light bokeh.
// Plain canvas with a small perspective projection, so it adds no 3D library to the bundle.

interface Petal { x: number; y: number; z: number; spin: number; spinSpeed: number; tumble: number; tumbleSpeed: number; sway: number; size: number; color: [string, string]; }
interface Light { x: number; y: number; z: number; phase: number; speed: number; }

const PETAL_COLORS: [string, string][] = [
  ['#f9d5dc', '#e8a3b3'], // blush
  ['#fff4ec', '#f1d9c8'], // ivory
  ['#e7798f', '#b8455f'], // rose
  ['#f6c9a8', '#d99a6c'], // peach-gold
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
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const newPetal = (anywhere: boolean): Petal => ({
      x: rand(-0.1, 1.1) * width,
      y: anywhere ? rand(0, height) : rand(-0.25, -0.05) * height,
      z: rand(0.25, 1),
      spin: rand(0, Math.PI * 2), spinSpeed: rand(-0.02, 0.02),
      tumble: rand(0, Math.PI * 2), tumbleSpeed: rand(0.02, 0.05),
      sway: rand(0, Math.PI * 2),
      size: rand(9, 16),
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = Math.min(1, (width * height) / (1280 * 800));
      petals = Array.from({ length: Math.round(18 + 30 * density) }, () => newPetal(true));
      lights = Array.from({ length: Math.round(14 + 18 * density) }, () => ({ x: rand(0, width), y: rand(0, height), z: rand(0.2, 1), phase: rand(0, Math.PI * 2), speed: rand(0.005, 0.015) }));
    };

    // Draws one wedding ring as a band: a circle rotated in 3D, projected to an ellipse.
    const drawRing = (cx: number, cy: number, r: number, tiltX: number, tiltY: number, roll: number) => {
      const rx = r * Math.abs(Math.cos(tiltY));
      const ry = r * Math.abs(Math.cos(tiltX));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(roll);
      const band = ctx.createLinearGradient(-r, -r, r, r);
      band.addColorStop(0, 'rgba(255, 236, 179, 0.9)');
      band.addColorStop(0.45, 'rgba(212, 160, 60, 0.75)');
      band.addColorStop(0.55, 'rgba(255, 248, 220, 0.95)');
      band.addColorStop(1, 'rgba(176, 124, 40, 0.7)');
      ctx.shadowColor = 'rgba(251, 191, 36, 0.55)';
      ctx.shadowBlur = 24;
      ctx.strokeStyle = band;
      ctx.lineWidth = Math.max(3, r * 0.07);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = Math.max(1, r * 0.015);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(rx - r * 0.02, 1), Math.max(ry - r * 0.02, 1), 0, Math.PI * 1.05, Math.PI * 1.6);
      ctx.stroke();
      ctx.restore();
    };

    const drawPetal = (p: Petal, px: number, py: number) => {
      const s = p.size * (0.45 + p.z * 0.75);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.spin);
      ctx.scale(1, 0.25 + 0.75 * Math.abs(Math.cos(p.tumble))); // tumbling face-on / edge-on
      ctx.globalAlpha = 0.35 + p.z * 0.6;
      const g = ctx.createLinearGradient(0, -s, 0, s);
      g.addColorStop(0, p.color[0]); g.addColorStop(1, p.color[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.bezierCurveTo(s * 1.1, s * 0.4, s * 0.8, -s * 0.9, 0, -s * 0.6);
      ctx.bezierCurveTo(-s * 0.8, -s * 0.9, -s * 1.1, s * 0.4, 0, s);
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
        glow.addColorStop(0, `rgba(255, 214, 140, ${alpha})`);
        glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(lx, ly, radius, 0, Math.PI * 2); ctx.fill();
      }

      // Two interlocked rings slowly turning behind the headline.
      const r = Math.min(width, height) * (width < 640 ? 0.3 : 0.26);
      const cx = width / 2 + pointer.x * 18, cy = height * 0.45 + pointer.y * 12;
      const a = reduceMotion ? 0.6 : t * 0.45;
      ctx.globalAlpha = 0.3;
      drawRing(cx - r * 0.42, cy, r, 0.35 + Math.sin(a) * 0.25 + pointer.y * 0.3, a + pointer.x * 0.4, -0.25);
      drawRing(cx + r * 0.42, cy, r, 0.5 + Math.cos(a * 0.9) * 0.25 + pointer.y * 0.3, -a * 0.9 + 1.2 + pointer.x * 0.4, 0.25);
      ctx.globalAlpha = 1;

      // Rose petals, sorted so nearer petals draw on top.
      petals.sort((p, q) => p.z - q.z);
      for (const p of petals) {
        if (!reduceMotion) {
          p.y += (0.35 + p.z * 0.9);
          p.sway += 0.012;
          p.x += Math.sin(p.sway) * 0.5 * p.z;
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
