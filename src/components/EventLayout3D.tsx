import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, Footprints, LayoutGrid, Ruler, RotateCcw, RotateCw, Scan, Sparkles } from 'lucide-react';
import { DaliLoader } from './DaliLoader';
import type { HallDimensions } from '../types/venueSystem';
import { chairPositions, decorStyle, formatM, itemSize, tableFootprint } from '../data/venueModel';

type LayoutItem = {
  id: string;
  type: string;
  labelEn: string;
  labelAr: string;
  x: number;
  y: number;
  rotation: number;
  seats?: number;
  shape?: 'round' | 'rect';
  widthM?: number;
  depthM?: number;
};

export type View3D = 'plan' | '3d' | 'walk';

type Props = {
  items: LayoutItem[];
  width: number;
  depth: number;
  language: 'ar' | 'en';
  /** Starting camera. 'overview' = 3D, 'pov' = walk-through, 'plan' = top-down. */
  mode?: 'overview' | 'pov' | 'plan';
  /** Ceiling, open-air, floor and pool of the hall. Width / depth come from the props above. */
  hall?: Partial<HallDimensions>;
  /** Decor style id (src/data/venueModel.ts). */
  decor?: string;
  /** 'basic' = accurate sizes, Plan + 3D, plain finish. 'pro' = decor styles, walk-through, place settings, chandeliers and lighting. */
  tier?: 'basic' | 'pro';
  /** Customer / presentation view: nothing can be dragged. */
  readOnly?: boolean;
  /** Text tiled over the 3D view only (e.g. DEMO). */
  watermark?: string;
  onSelect?: (id: string | null) => void;
  selectedId?: string | null;
  rotationMode?: boolean;
  onMove?: (id: string, x: number, y: number) => void;
  onRotate?: (id: string, delta?: number) => void;
  onViewChange?: (view: View3D) => void;
};

const THREE_URL = 'three';
const CONTROLS_URL = 'three/addons/controls/OrbitControls.js';
const UTILS_URL = 'three/addons/utils/BufferGeometryUtils.js';

const modeToView = (mode?: Props['mode'], tier: Props['tier'] = 'basic'): View3D => (mode === 'pov' && tier === 'pro' ? 'walk' : mode === 'plan' ? 'plan' : '3d');

export function EventLayout3D({ items, width, depth, language, mode = 'overview', hall, decor, tier = 'basic', readOnly = false, watermark, selectedId, rotationMode = false, onSelect, onMove, onRotate, onViewChange }: Props) {
  const isAr = language === 'ar';
  const hostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<View3D>(() => modeToView(mode, tier));
  const [measure, setMeasure] = useState(true);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const rotationModeRef = useRef(rotationMode);
  rotationModeRef.current = rotationMode;
  const rotateRef = useRef(onRotate);
  rotateRef.current = onRotate;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;
  const viewRef = useRef(view);
  viewRef.current = view;
  const measureRef = useRef(measure);
  measureRef.current = measure;
  const walkInput = useRef({ forward: 0, right: 0 });
  const rotationBarRef = useRef<HTMLDivElement | null>(null);

  const ceilingM = hall?.outdoor ? 0 : hall?.ceilingM ?? 4.5;
  const outdoor = Boolean(hall?.outdoor);
  const floorKind = hall?.floor || (outdoor ? 'terrace' : 'marble');
  const poolKey = hall?.pool ? `${hall.pool.widthM}x${hall.pool.depthM}-${hall.pool.side}` : '';
  const decorId = decorStyle(decor).id;

  useEffect(() => { setView(modeToView(mode, tier)); }, [mode, tier]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    setReady(false);
    setFailed(false);

    const boot = async () => {
      const THREE = await import(/* @vite-ignore */ THREE_URL);
      const { OrbitControls } = await import(/* @vite-ignore */ CONTROLS_URL);
      const { mergeGeometries } = await import(/* @vite-ignore */ UTILS_URL);
      try {
        await Promise.race([
          Promise.all([document.fonts?.load('600 48px "Readex Pro"'), document.fonts?.load('700 48px "Cairo"')]),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch {}
      if (disposed || !hostRef.current) return;

      const W = width;
      const D = depth;
      const pro = tier === 'pro';
      const style = pro ? decorStyle(decorId) : { ...decorStyle('classic_white'), centerpiece: 'none' as const };
      const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
      const host = hostRef.current;
      const scene = new THREE.Scene();
      // Basic keeps the original navy look; Pro uses the brand black and gold.
      const bg = pro ? 0x0d0d0f : 0x08111d;
      scene.background = new THREE.Color(bg);
      const fog = new THREE.Fog(bg, Math.max(W, D) * 2.2, Math.max(W, D) * 4.5);
      scene.fog = fog;

      const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 800);
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
      renderer.shadowMap.enabled = pro;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = outdoor ? 0.95 : 1.05;
      host.replaceChildren(renderer.domElement);
      Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'none' });

      // ── Shared resources (kept for the life of the view; per-item parts are disposed on rebuild) ──
      const disposables: any[] = [];
      const own = <T,>(thing: T): T => { disposables.push(thing); return thing; };
      const std = (color: string | number, roughness = 0.6, metalness = 0, extra: Record<string, unknown> = {}) => own(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }));
      const canvasTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        draw(canvas.getContext('2d')!);
        const tex = own(new THREE.CanvasTexture(canvas));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat[0], repeat[1]); }
        return tex;
      };

      const M: Record<string, any> = {
        linen: std(style.linen, 0.85),
        runner: std(style.runner, 0.5, 0.3),
        chair: std(style.chair, 0.55),
        chairFrame: std(style.chairFrame, 0.35, style.chairFrame === '#C49A52' || style.chairFrame === '#8C6A2E' ? 0.75 : 0.1),
        gold: std('#C49A52', 0.32, 0.85),
        black: std('#151517', 0.5, 0.2),
        ivory: std('#F4F1EA', 0.6),
        plate: std('#FFFFFF', 0.25, 0.05),
        glass: std('#E8F0F2', 0.05, 0.1, { transparent: true, opacity: 0.45 }),
        silver: std('#C9CCD1', 0.25, 0.9),
        flower: std(style.flower, 0.8),
        flowerAccent: std(style.flowerAccent, 0.8),
        leaf: std('#4F6B45', 0.8),
        stage: std(style.stage, 0.45, 0.1),
        backdrop: std(style.backdrop, 0.6, 0.15),
        sofa: std(style.id === 'black_gold' || style.id === 'corporate' ? '#F4F1EA' : '#FFFFFF', 0.7),
        candle: std('#FFF4DC', 0.6, 0, { emissive: new THREE.Color('#FFB347'), emissiveIntensity: 0.9 }),
        warmGlow: std('#FFE2A8', 0.4, 0, { emissive: new THREE.Color('#FFC46B'), emissiveIntensity: 2.2 }),
        lens: std('#FFFFFF', 0.3, 0, { emissive: new THREE.Color(style.uplight), emissiveIntensity: 1.6 }),
        wood: std('#6B4A2E', 0.6),
      };

      if (!pro) {
        // Basic tier: a plain massing model in flat neutral colours, no gold, no textures, no glow.
        Object.assign(M, {
          linen: std('#E8EDF4', 0.6), runner: std('#E8EDF4', 0.6), chair: std('#8A9AB8', 0.7), chairFrame: std('#8A9AB8', 0.7),
          gold: std('#C9A45A', 0.4, 0.35), black: std('#171B22', 0.6), stage: std('#2C79B9', 0.5), backdrop: std('#6E7EA3', 0.6),
          sofa: std('#E8EDF4', 0.6), lens: std('#171B22', 0.6), flower: std('#6E7EA3', 0.7), flowerAccent: std('#6E7EA3', 0.7), leaf: std('#6E7EA3', 0.7),
          silver: std('#6E7EA3', 0.6),
        });
      }
      const ledTexture = canvasTexture(1024, 576, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 1024, 576);
        g.addColorStop(0, '#0D0D0F'); g.addColorStop(0.5, '#2A2116'); g.addColorStop(1, '#0D0D0F');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 576);
        const r = ctx.createRadialGradient(512, 288, 10, 512, 288, 420);
        r.addColorStop(0, 'rgba(233,207,148,.55)'); r.addColorStop(1, 'rgba(233,207,148,0)');
        ctx.fillStyle = r; ctx.fillRect(0, 0, 1024, 576);
        ctx.fillStyle = '#E9CF94'; ctx.font = '600 92px "Readex Pro", "Cairo", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('ELSARAYA', 512, 260);
        ctx.font = '400 40px "Readex Pro", "Cairo", sans-serif'; ctx.fillStyle = '#F4F1EA'; ctx.fillText('EVENTS', 512, 350);
      });
      M.led = pro ? std('#FFFFFF', 0.35, 0, { map: ledTexture, emissive: new THREE.Color('#FFFFFF'), emissiveMap: ledTexture, emissiveIntensity: 0.9 }) : std('#171B22', 0.6);

      const danceTexture = canvasTexture(256, 256, (ctx) => {
        const dark = style.id === 'black_gold' || style.id === 'corporate';
        ctx.fillStyle = dark ? '#111113' : '#F7F5F0'; ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = dark ? 'rgba(196,154,82,.8)' : 'rgba(150,140,125,.55)'; ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 256, 256);
      });
      M.dance = pro ? std('#FFFFFF', 0.12, 0.2, { map: danceTexture }) : std('#6E7EA3', 0.5);

      // ── Floor ──
      const floorTexture = (() => {
        if (floorKind === 'carpet') return canvasTexture(256, 256, (ctx) => {
          ctx.fillStyle = '#2A1E1A'; ctx.fillRect(0, 0, 256, 256);
          ctx.strokeStyle = 'rgba(196,154,82,.28)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(128, 128, 70, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(128, 30); ctx.lineTo(226, 128); ctx.lineTo(128, 226); ctx.lineTo(30, 128); ctx.closePath(); ctx.stroke();
        }, [W / 1.5, D / 1.5]);
        if (floorKind === 'wood' || floorKind === 'deck') return canvasTexture(512, 512, (ctx) => {
          const base = floorKind === 'deck' ? ['#9C7651', '#A88360', '#8F6B48'] : ['#5A3E28', '#654630', '#4E3522'];
          for (let i = 0; i < 8; i++) { ctx.fillStyle = base[i % 3]; ctx.fillRect(0, i * 64, 512, 64); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, i * 64, 512, 2); ctx.fillRect(((i * 197) % 512), i * 64, 2, 64); }
        }, [W / 4, D / 4]);
        if (floorKind === 'grass') return canvasTexture(256, 256, (ctx) => {
          ctx.fillStyle = '#35502C'; ctx.fillRect(0, 0, 256, 256);
          for (let i = 0; i < 1800; i++) { ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90,128,64,.6)' : 'rgba(30,48,24,.6)'; ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 4); }
        }, [W / 2, D / 2]);
        if (floorKind === 'terrace') return canvasTexture(256, 256, (ctx) => {
          ctx.fillStyle = '#8E867A'; ctx.fillRect(0, 0, 256, 256);
          ctx.fillStyle = '#9A9286'; ctx.fillRect(4, 4, 120, 120); ctx.fillRect(132, 132, 120, 120);
          ctx.fillStyle = '#857D71'; ctx.fillRect(132, 4, 120, 120); ctx.fillRect(4, 132, 120, 120);
        }, [W / 1.2, D / 1.2]);
        return canvasTexture(512, 512, (ctx) => {
          ctx.fillStyle = '#E9E4DA'; ctx.fillRect(0, 0, 512, 512);
          ctx.strokeStyle = 'rgba(160,150,135,.35)'; ctx.lineWidth = 2;
          for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * 512, 0); ctx.bezierCurveTo(Math.random() * 512, 170, Math.random() * 512, 340, Math.random() * 512, 512); ctx.stroke(); }
          ctx.strokeStyle = 'rgba(120,110,95,.45)'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, 512, 512); ctx.beginPath(); ctx.moveTo(256, 0); ctx.lineTo(256, 512); ctx.moveTo(0, 256); ctx.lineTo(512, 256); ctx.stroke();
        }, [W / 2.4, D / 2.4]);
      })();
      const basicFloor: Record<string, string> = { marble: '#242B36', carpet: '#242B36', wood: '#242B36', deck: '#2A3340', grass: '#2F4A3F', terrace: '#2A3340' };
      const floorMat = pro
        ? std('#FFFFFF', floorKind === 'marble' ? 0.28 : floorKind === 'carpet' || floorKind === 'grass' ? 0.95 : 0.7, 0, { map: floorTexture })
        : std(basicFloor[floorKind] || '#242B36', 0.82, 0.05);
      const floor = new THREE.Mesh(own(new THREE.BoxGeometry(W, 0.1, D)), floorMat);
      floor.position.y = -0.05;
      floor.receiveShadow = true;
      scene.add(floor);
      // Surroundings so the hall does not float in a void.
      const surround = new THREE.Mesh(own(new THREE.PlaneGeometry(W * 6, D * 6)), std(pro ? (outdoor ? '#151512' : '#121214') : '#0B1524', 1));
      surround.rotation.x = -Math.PI / 2; surround.position.y = -0.11; scene.add(surround);

      // ── Lights ──
      scene.add(pro ? new THREE.HemisphereLight(0xfff1dc, 0x2a2420, outdoor ? 1.1 : 1.5) : new THREE.HemisphereLight(0xcfe5ff, 0x172033, 1.8));
      scene.add(new THREE.AmbientLight(0xffffff, 0.18));
      const key = new THREE.DirectionalLight(0xfff4e6, outdoor ? 1.6 : 2.0);
      key.position.set(W * 0.25, Math.max(W, D) * 1.1, D * 0.35);
      key.castShadow = pro;
      key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
      const half = Math.max(W, D) / 2 + 2;
      Object.assign(key.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: Math.max(W, D) * 3 });
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.02;
      scene.add(key);

      // ── Walls / outdoor edge ──
      const wallGroups: { group: any; nx: number; nz: number; offset: number }[] = [];
      const archGroup = new THREE.Group();
      scene.add(archGroup);
      const washTexture = canvasTexture(64, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 256, 0, 0);
        g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(32, 256, 30, 256, 0, 0, Math.PI * 2); ctx.fill();
      });
      const washMat = own(new THREE.MeshBasicMaterial({ map: washTexture, color: new THREE.Color(style.uplight), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      if (!outdoor) {
        const wallH = Math.max(2.4, ceilingM);
        const wallMat = std(pro ? '#CFC5B4' : '#303846', pro ? 0.9 : 0.7);
        const trimMat = M.gold;
        const panelMat = std('#B8AC97', 0.8);
        const makeWall = (length: number, nx: number, nz: number) => {
          const g = new THREE.Group();
          const wall = new THREE.Mesh(own(new THREE.BoxGeometry(length, wallH, 0.2)), wallMat);
          wall.position.y = wallH / 2; wall.receiveShadow = true; g.add(wall);
          if (pro) {
          const wainscot = new THREE.Mesh(own(new THREE.BoxGeometry(length, 1.0, 0.04)), panelMat);
          wainscot.position.set(0, 0.5, 0.12); g.add(wainscot);
          const trim = new THREE.Mesh(own(new THREE.BoxGeometry(length, 0.04, 0.06)), trimMat);
          trim.position.set(0, 1.0, 0.13); g.add(trim);
          const crown = new THREE.Mesh(own(new THREE.BoxGeometry(length, 0.12, 0.1)), trimMat);
          crown.position.set(0, wallH - 0.06, 0.12); g.add(crown);
          }
          const count = pro ? Math.max(2, Math.floor(length / 4)) : 0;
          const washGeo = own(new THREE.PlaneGeometry(1.4, Math.min(3.2, wallH * 0.75)));
          for (let i = 0; i < count; i++) {
            const wash = new THREE.Mesh(washGeo, washMat);
            wash.position.set(-length / 2 + (length / count) * (i + 0.5), Math.min(3.2, wallH * 0.75) / 2, 0.16);
            g.add(wash);
          }
          g.rotation.y = Math.atan2(-nx, -nz);
          return g;
        };
        const placements: [number, number, number, number, number][] = [
          [W, 0, -1, 0, -D / 2 - 0.1], // front (stage) wall: outward normal −z
          [W, 0, 1, 0, D / 2 + 0.1],
          [D, -1, 0, -W / 2 - 0.1, 0],
          [D, 1, 0, W / 2 + 0.1, 0],
        ];
        placements.forEach(([len, nx, nz, x, z]) => {
          if (!pro) return; // Basic: no walls, just the floor slab.
          const g = makeWall(len + (nx ? 0.4 : 0), nx, nz);
          g.position.set(x, 0, z);
          scene.add(g);
          wallGroups.push({ group: g, nx, nz, offset: nx ? W / 2 : D / 2 });
        });
        // Base outline stays visible when a wall is cut away for the camera.
        const base = new THREE.Mesh(own(new THREE.BoxGeometry(W + 0.4, 0.12, D + 0.4)), std(pro ? '#3A352E' : '#171B22', 0.9));
        base.position.y = -0.07; scene.add(base);
        // Chandeliers hung 1.2 m below the ceiling.
        const ringGeo = own(new THREE.TorusGeometry(0.55, 0.035, 8, 32));
        const bulbGeo = own(new THREE.SphereGeometry(0.07, 10, 8));
        const rodGeo = own(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 6));
        const crystalGeo = own(new THREE.SphereGeometry(0.28, 16, 12));
        const crystalMat = std('#FFF3D6', 0.2, 0.1, { emissive: new THREE.Color('#FFD08A'), emissiveIntensity: 0.7, transparent: true, opacity: 0.9 });
        const spacing = 7;
        const cols = pro ? Math.max(1, Math.round(W / spacing)) : 0;
        const rows = Math.max(1, Math.round(D / spacing));
        for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
          const ch = new THREE.Group();
          const ring = new THREE.Mesh(ringGeo, M.gold); ring.rotation.x = Math.PI / 2; ch.add(ring);
          const crystal = new THREE.Mesh(crystalGeo, crystalMat); crystal.position.y = -0.1; ch.add(crystal);
          for (let b = 0; b < 8; b++) { const bulb = new THREE.Mesh(bulbGeo, M.warmGlow); const a = (b / 8) * Math.PI * 2; bulb.position.set(Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55); ch.add(bulb); }
          const rod = new THREE.Mesh(rodGeo, M.gold); rod.position.y = 0.6; ch.add(rod);
          ch.position.set(-W / 2 + (W / cols) * (c + 0.5), wallH - 1.2, -D / 2 + (D / rows) * (r + 0.5));
          archGroup.add(ch);
        }
      } else {
        // Open-air: hedge (garden), glass railing (roof) or planters (pool deck), plus festoon lights.
        const edge = new THREE.Group();
        if (floorKind === 'grass') {
          const hedgeMat = std('#2F4A2A', 0.95);
          ([[W, 0, -D / 2 - 0.4, 0], [W, 0, D / 2 + 0.4, 0], [D, -W / 2 - 0.4, 0, 1], [D, W / 2 + 0.4, 0, 1]] as const).forEach(([len, x, z, turn]) => {
            const hedge = new THREE.Mesh(own(new THREE.BoxGeometry(len + 0.8, 1.0, 0.6)), hedgeMat);
            hedge.position.set(x, 0.5, z); hedge.rotation.y = turn ? Math.PI / 2 : 0; hedge.castShadow = true; edge.add(hedge);
          });
        } else {
          const glassMat = std('#BFD6DB', 0.05, 0.1, { transparent: true, opacity: 0.22 });
          ([[W, 0, -D / 2 - 0.1, 0], [W, 0, D / 2 + 0.1, 0], [D, -W / 2 - 0.1, 0, 1], [D, W / 2 + 0.1, 0, 1]] as const).forEach(([len, x, z, turn]) => {
            const panel = new THREE.Mesh(own(new THREE.BoxGeometry(len, 1.1, 0.03)), glassMat);
            panel.position.set(x, 0.55, z); panel.rotation.y = turn ? Math.PI / 2 : 0; edge.add(panel);
            const rail = new THREE.Mesh(own(new THREE.BoxGeometry(len, 0.05, 0.08)), M.gold);
            rail.position.set(x, 1.12, z); rail.rotation.y = turn ? Math.PI / 2 : 0; edge.add(rail);
          });
        }
        if (pro) scene.add(edge);
        const poleGeo = own(new THREE.CylinderGeometry(0.05, 0.06, 4.6, 8));
        const strands = pro ? Math.max(2, Math.floor(D / 6)) : 0;
        const bulbs: [number, number, number][] = [];
        for (let s = 0; s < strands; s++) {
          const z = -D / 2 + (D / strands) * (s + 0.5);
          for (const x of [-W / 2 - 0.3, W / 2 + 0.3]) { const pole = new THREE.Mesh(poleGeo, M.black); pole.position.set(x, 2.3, z); archGroup.add(pole); }
          const n = Math.round(W / 0.8);
          for (let i = 0; i <= n; i++) { const t = i / n; bulbs.push([-W / 2 + W * t, 4.5 - Math.sin(t * Math.PI) * 0.9, z]); }
        }
        const bulbMesh = new THREE.InstancedMesh(own(new THREE.SphereGeometry(0.06, 8, 6)), M.warmGlow, bulbs.length);
        const mtx = new THREE.Matrix4();
        bulbs.forEach(([x, y, z], i) => { mtx.makeTranslation(x, y, z); bulbMesh.setMatrixAt(i, mtx); });
        archGroup.add(bulbMesh);
      }

      // ── Pool ──
      if (hall?.pool) {
        const pw = Math.min(hall.pool.widthM, W * 0.5);
        const pd = Math.min(hall.pool.depthM, D * 0.6);
        const px = hall.pool.side === 'left' ? -W / 2 + pw / 2 + 1 : hall.pool.side === 'center' ? 0 : W / 2 - pw / 2 - 1;
        const coping = new THREE.Mesh(own(new THREE.BoxGeometry(pw + 0.6, 0.06, pd + 0.6)), std('#D8D2C6', 0.6));
        coping.position.set(px, 0.01, 0); coping.receiveShadow = true; scene.add(coping);
        const water = new THREE.Mesh(own(new THREE.BoxGeometry(pw, 0.05, pd)), std('#2C8C96', 0.08, 0.1, { transparent: true, opacity: 0.88, emissive: new THREE.Color('#0E4A52'), emissiveIntensity: 0.6 }));
        water.position.set(px, 0.03, 0); scene.add(water);
        scene.userData.pool = { px, pw, pd };
      }

      // ── Labels (constant on-screen size so they stay readable on phones) ──
      const labelSprites: any[] = [];
      const makeLabel = (text: string, px: number, variant: 'item' | 'badge' | 'dim' = 'item') => {
        const fontPx = 56;
        const font = `${variant === 'badge' ? 700 : 600} ${fontPx}px "Readex Pro", "Cairo", sans-serif`;
        const probe = document.createElement('canvas').getContext('2d')!;
        probe.font = font;
        const textW = Math.ceil(probe.measureText(text).width);
        const padX = variant === 'badge' ? 26 : 30;
        const cw = Math.max(variant === 'badge' ? 96 : 120, textW + padX * 2);
        const ch = 96;
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d')!;
        ctx.font = font;
        (ctx as any).direction = isAr ? 'rtl' : 'ltr';
        const radius = variant === 'badge' ? ch / 2 : 22;
        ctx.beginPath();
        ctx.moveTo(radius, 4); ctx.lineTo(cw - radius, 4); ctx.quadraticCurveTo(cw - 4, 4, cw - 4, radius); ctx.lineTo(cw - 4, ch - radius); ctx.quadraticCurveTo(cw - 4, ch - 4, cw - radius, ch - 4); ctx.lineTo(radius, ch - 4); ctx.quadraticCurveTo(4, ch - 4, 4, ch - radius); ctx.lineTo(4, radius); ctx.quadraticCurveTo(4, 4, radius, 4); ctx.closePath();
        ctx.fillStyle = variant === 'dim' ? 'rgba(196,154,82,.95)' : pro ? 'rgba(13,13,15,.86)' : 'rgba(8,17,29,.88)';
        ctx.fill();
        if (pro) { ctx.lineWidth = 4; ctx.strokeStyle = variant === 'dim' ? 'rgba(13,13,15,.6)' : 'rgba(233,207,148,.85)'; ctx.stroke(); }
        ctx.fillStyle = variant === 'dim' ? '#0D0D0F' : variant === 'badge' ? '#E9CF94' : '#F4F1EA';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, cw / 2, ch / 2 + 3);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: false });
        const sprite = new THREE.Sprite(mat);
        sprite.center.set(0.5, 0);
        sprite.renderOrder = 10;
        sprite.userData = { px, aspect: cw / ch, label: true };
        return sprite;
      };
      const scaleLabel = (sprite: any) => {
        const h = Math.max(1, host.clientHeight);
        const s = (sprite.userData.px / h) * 2 * Math.tan((camera.fov * Math.PI) / 360);
        sprite.scale.set(s * sprite.userData.aspect, s, 1);
      };
      const scaleLabels = () => labelSprites.forEach(scaleLabel);

      // ── Measurements: 1 m grid, hall dimension lines, ceiling height ──
      const measureGroup = new THREE.Group();
      scene.add(measureGroup);
      const line = (pts: number[], color: string, opacity: number) => {
        const geo = own(new THREE.BufferGeometry());
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        return new THREE.LineSegments(geo, own(new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })));
      };
      {
        const minor: number[] = [];
        const major: number[] = [];
        for (let x = 0; x <= W + 1e-6; x += 1) (Math.round(x) % 5 === 0 ? major : minor).push(-W / 2 + x, 0.012, -D / 2, -W / 2 + x, 0.012, D / 2);
        for (let z = 0; z <= D + 1e-6; z += 1) (Math.round(z) % 5 === 0 ? major : minor).push(-W / 2, 0.012, -D / 2 + z, W / 2, 0.012, -D / 2 + z);
        measureGroup.add(line(minor, !pro ? '#394352' : floorKind === 'marble' || floorKind === 'terrace' ? '#5A5246' : '#E9CF94', pro ? 0.22 : 0.9));
        measureGroup.add(line(major, pro ? '#C49A52' : '#5C6675', pro ? 0.5 : 0.9));
      }
      if (pro) {
        const off = outdoor ? 1.2 : 0.9;
        const dims: number[] = [
          -W / 2, 0.05, -D / 2 - off, W / 2, 0.05, -D / 2 - off,
          -W / 2, 0.05, -D / 2 - off - 0.3, -W / 2, 0.05, -D / 2 - off + 0.3,
          W / 2, 0.05, -D / 2 - off - 0.3, W / 2, 0.05, -D / 2 - off + 0.3,
          -W / 2 - off, 0.05, -D / 2, -W / 2 - off, 0.05, D / 2,
          -W / 2 - off - 0.3, 0.05, -D / 2, -W / 2 - off + 0.3, 0.05, -D / 2,
          -W / 2 - off - 0.3, 0.05, D / 2, -W / 2 - off + 0.3, 0.05, D / 2,
        ];
        if (!outdoor) dims.push(W / 2 + off, 0, D / 2 + off, W / 2 + off, ceilingM, D / 2 + off, W / 2 + off - 0.3, ceilingM, D / 2 + off, W / 2 + off + 0.3, ceilingM, D / 2 + off);
        measureGroup.add(line(dims, '#E9CF94', 0.95));
        const unit = isAr ? 'م' : 'm';
        const wLabel = makeLabel(`${formatM(W)} ${unit}`, 22, 'dim'); wLabel.position.set(0, 0.1, -D / 2 - off); measureGroup.add(wLabel); labelSprites.push(wLabel);
        const dLabel = makeLabel(`${formatM(D)} ${unit}`, 22, 'dim'); dLabel.position.set(-W / 2 - off, 0.1, 0); measureGroup.add(dLabel); labelSprites.push(dLabel);
        if (!outdoor) { const cLabel = makeLabel(`${isAr ? 'الارتفاع' : 'Ceiling'} ${formatM(ceilingM)} ${unit}`, 20, 'dim'); cLabel.position.set(W / 2 + off, ceilingM / 2, D / 2 + off); measureGroup.add(cLabel); labelSprites.push(cLabel); }
        if (scene.userData.pool) { const p = scene.userData.pool; const pl = makeLabel(`${isAr ? 'حمام السباحة' : 'Pool'} · ${formatM(p.pw)}×${formatM(p.pd)} ${unit}`, 18); pl.position.set(p.px, 0.3, 0); measureGroup.add(pl); labelSprites.push(pl); }
        const front = makeLabel(isAr ? 'الواجهة' : 'FRONT', 16); front.position.set(0, 0.1, -D / 2 - off - 1.2); measureGroup.add(front); labelSprites.push(front);
      }

      // ── Furniture ──
      const tr = (geo: any, x: number, y: number, z: number) => { geo.translate(x, y, z); return geo; };
      const chairFrameGeo = own(mergeGeometries([
        tr(new THREE.BoxGeometry(0.44, 0.03, 0.42), 0, 0.44, 0),
        ...[[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].map(([x, z]) => tr(new THREE.CylinderGeometry(0.014, 0.012, 0.44, 6), x, 0.22, z)),
        ...[-0.19, 0.19].map((x) => tr(new THREE.CylinderGeometry(0.014, 0.014, 0.48, 6), x, 0.69, 0.19)),
        ...[0.62, 0.74, 0.9].map((y) => tr(new THREE.BoxGeometry(0.38, 0.025, 0.02), 0, y, 0.19)),
      ]));
      // Basic tier chair: a seat block and a back slab, nothing else.
      // Basic tier: a chair is a plain cube and a table is an 8-sided block.
      const basicChairGeo = own(tr(new THREE.BoxGeometry(0.4, 0.45, 0.4), 0, 0.225, 0));
      const basicTableGeo = own(new THREE.CylinderGeometry(1, 1, 1, 8));
      const chairCushionGeo = own(tr(new THREE.BoxGeometry(0.42, 0.05, 0.4), 0, 0.48, 0));
      const plateGeo = own(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 20));
      const glassGeo = own(new THREE.CylinderGeometry(0.035, 0.028, 0.14, 10));
      const sphereGeo = own(new THREE.SphereGeometry(1, 14, 10));
      const unitBox = own(new THREE.BoxGeometry(1, 1, 1));
      const unitCyl = own(new THREE.CylinderGeometry(1, 1, 1, 24));

      const itemRoot = new THREE.Group();
      scene.add(itemRoot);
      const tmpM = new THREE.Matrix4();
      const tmpQ = new THREE.Quaternion();
      const tmpS = new THREE.Vector3(1, 1, 1);
      const tmpP = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      const mesh = (parent: any, geo: any, mat: any, pos: [number, number, number], scale?: [number, number, number], shadow = true) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(...pos);
        if (scale) m.scale.set(...scale);
        m.castShadow = shadow; m.receiveShadow = true;
        parent.add(m);
        return m;
      };
      const box = (parent: any, w: number, h: number, d: number, mat: any, x = 0, y = h / 2, z = 0, shadow = true) => mesh(parent, unitBox, mat, [x, y, z], [w, h, d], shadow);
      const cyl = (parent: any, r: number, h: number, mat: any, x = 0, y = h / 2, z = 0, shadow = true) => mesh(parent, unitCyl, mat, [x, y, z], [r, h, r], shadow);
      const ball = (parent: any, r: number, mat: any, x: number, y: number, z: number) => pro && mesh(parent, sphereGeo, mat, [x, y, z], [r, r, r], false);
      const flowerCluster = (parent: any, x: number, y: number, z: number, r: number) => {
        if (!pro) return;
        ball(parent, r, M.flower, x, y, z);
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ball(parent, r * 0.38, i % 2 ? M.flowerAccent : M.leaf, x + Math.cos(a) * r * 0.8, y - r * 0.25, z + Math.sin(a) * r * 0.8); }
      };
      const instanced = (parent: any, geo: any, mat: any, placements: { x: number; y: number; z: number; ry: number }[], shadow = true) => {
        if (!placements.length) return;
        const inst = new THREE.InstancedMesh(geo, mat, placements.length);
        placements.forEach((p, i) => { tmpQ.setFromAxisAngle(up, p.ry); tmpP.set(p.x, p.y, p.z); tmpM.compose(tmpP, tmpQ, tmpS); inst.setMatrixAt(i, tmpM); });
        inst.castShadow = shadow; inst.receiveShadow = true;
        parent.add(inst);
      };
      const addChairs = (parent: any, item: LayoutItem) => {
        const spots = chairPositions(item).map((c) => ({ x: c.x, y: 0, z: c.z, ry: Math.atan2(c.nx, c.nz) }));
        if (!pro) { instanced(parent, basicChairGeo, M.chair, spots, false); return; }
        instanced(parent, chairFrameGeo, M.chairFrame, spots);
        instanced(parent, chairCushionGeo, M.chair, spots);
      };
      const addPlaceSettings = (parent: any, item: LayoutItem, w: number, d: number) => {
        const plates: { x: number; y: number; z: number; ry: number }[] = [];
        const glasses: { x: number; y: number; z: number; ry: number }[] = [];
        chairPositions(item).forEach((c) => {
          const inset = item.shape === 'rect' ? 0.22 : 0.25;
          let px = c.x - c.nx * (0.38 + inset);
          let pz = c.z - c.nz * (0.38 + inset);
          if (item.shape === 'rect') { px = Math.max(-w / 2 + 0.16, Math.min(w / 2 - 0.16, px)); pz = Math.max(-d / 2 + 0.16, Math.min(d / 2 - 0.16, pz)); }
          plates.push({ x: px, y: 0.762, z: pz, ry: 0 });
          const gx = px - c.nz * 0.16 - c.nx * 0.12;
          const gz = pz + c.nx * 0.16 - c.nz * 0.12;
          glasses.push({ x: gx, y: 0.83, z: gz, ry: 0 });
        });
        instanced(parent, plateGeo, M.plate, plates, false);
        instanced(parent, glassGeo, M.glass, glasses, false);
      };
      const addCenterpiece = (parent: any) => {
        if (style.centerpiece === 'tall') {
          cyl(parent, 0.14, 0.02, M.gold, 0, 0.765);
          cyl(parent, 0.025, 0.72, M.gold, 0, 0.76 + 0.36);
          flowerCluster(parent, 0, 1.62, 0, 0.3);
        } else if (style.centerpiece === 'low') {
          flowerCluster(parent, 0, 0.86, 0, 0.18);
          for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) cyl(parent, 0.03, 0.12, M.candle, Math.cos(a) * 0.32, 0.81, Math.sin(a) * 0.32, false);
        } else if (style.centerpiece === 'candles') {
          for (const [x, h] of [[-0.12, 0.3], [0, 0.4], [0.12, 0.25]]) cyl(parent, 0.035, h, M.candle, x, 0.75 + h / 2, 0, false);
        } else {
          cyl(parent, 0.05, 0.22, M.glass, 0, 0.86, 0, false);
        }
      };

      const tableNumbers = new Map<string, number>();
      const buildItem = (item: LayoutItem) => {
        const group = new THREE.Group();
        group.userData.itemId = item.id;
        group.position.set(((item.x - 50) / 100) * W, 0, ((item.y - 50) / 100) * D);
        group.rotation.y = -(item.rotation * Math.PI) / 180;
        const { w, d } = itemSize(item);
        let labelY = 1.6;
        let footprint = { w, d };

        if (item.type === 'table' && !pro) {
          // Basic: plain top on a single leg, plain chairs, no cloth, no settings.
          footprint = tableFootprint(item);
          if (item.shape === 'rect') box(group, w, 0.75, d, M.linen, 0, 0.375, 0, false);
          else mesh(group, basicTableGeo, M.linen, [0, 0.375, 0], [w / 2, 0.75, w / 2], false);
          addChairs(group, item);
          labelY = 1.2;
        } else if (item.type === 'table') {
          footprint = tableFootprint(item);
          if (item.shape === 'rect') {
            box(group, w + 0.04, 0.025, d + 0.04, M.linen, 0, 0.75);
            box(group, w + 0.04, 0.73, d + 0.04, M.linen, 0, 0.365);
            box(group, w * 0.9, 0.006, Math.min(0.32, d * 0.4), M.runner, 0, 0.765, 0, false);
          } else {
            const r = w / 2;
            mesh(group, unitCyl, M.linen, [0, 0.75, 0], [r + 0.02, 0.025, r + 0.02]);
            const skirt = new THREE.Mesh(own(new THREE.CylinderGeometry(r + 0.02, r + 0.09, 0.74, 40, 1, true)), M.linen);
            skirt.position.y = 0.37; skirt.castShadow = true; skirt.receiveShadow = true; group.add(skirt);
            mesh(group, unitCyl, M.runner, [0, 0.766, 0], [r * 0.45, 0.004, r * 0.45], false);
          }
          if (pro) { addPlaceSettings(group, item, w, d); addCenterpiece(group); }
          addChairs(group, item);
          labelY = style.centerpiece === 'tall' ? 2.1 : 1.3;
        } else if (item.type === 'chairs' && !pro) {
          group.add(new THREE.Mesh(basicChairGeo, M.chair));
          labelY = 1.2;
        } else if (item.type === 'chairs') {
          const frame = new THREE.Mesh(chairFrameGeo, M.chairFrame); frame.castShadow = true; group.add(frame);
          const cushion = new THREE.Mesh(chairCushionGeo, M.chair); cushion.castShadow = true; group.add(cushion);
          labelY = 1.2;
        } else if (item.type === 'stage' && !pro) {
          const h = 0.6;
          box(group, w, h, d, M.stage, 0, h / 2, 0, false);
        } else if (item.type === 'stage') {
          const h = 0.6;
          box(group, w, h, d, M.stage, 0, h / 2);
          box(group, w + 0.02, 0.05, d + 0.02, M.gold, 0, h - 0.02);
          box(group, w - 0.4, 0.012, d - 0.4, M.runner, 0, h + 0.006, 0, false);
          for (let s = 1; s <= 2; s++) box(group, 1.6, h * (s / 3), 0.32, M.stage, 0, (h * (s / 3)) / 2, d / 2 + 0.32 * (3 - s) - 0.16);
          const backH = Math.min(3.6, (ceilingM || 6) - h - 0.4);
          box(group, w, backH, 0.15, M.backdrop, 0, h + backH / 2, -d / 2 + 0.08);
          box(group, w + 0.12, 0.12, 0.2, M.gold, 0, h + backH, -d / 2 + 0.08);
          for (const x of [-w / 2, w / 2]) box(group, 0.12, backH, 0.2, M.gold, x, h + backH / 2, -d / 2 + 0.08);
          if (style.id !== 'corporate') {
            // Kosha sofa for the couple and flower arrangements at the corners.
            const sofa = new THREE.Group();
            box(sofa, 2.1, 0.42, 0.85, M.sofa, 0, 0.21);
            box(sofa, 2.1, 0.7, 0.18, M.sofa, 0, 0.6, -0.34);
            for (const x of [-1.0, 1.0]) box(sofa, 0.16, 0.6, 0.85, M.gold, x, 0.3);
            sofa.position.set(0, h, -d / 2 + 1.0);
            group.add(sofa);
            for (const x of [-w / 2 + 0.6, w / 2 - 0.6]) flowerCluster(group, x, h + 0.55, -d / 2 + 0.5, 0.45);
            for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) flowerCluster(group, x, h + 0.25, d / 2 - 0.35, 0.28);
          }
          labelY = h + backH + 0.5;
        } else if (item.type === 'screen' && !pro) {
          const sh = Math.min(w * 9 / 16, (ceilingM || 8) - 1.8);
          box(group, w, 1.4 + sh, 0.12, M.led, 0, (1.4 + sh) / 2, 0, false);
        } else if (item.type === 'screen') {
          const sh = Math.min(w * 9 / 16, (ceilingM || 8) - 1.8);
          const bottom = 1.4;
          box(group, w + 0.12, sh + 0.12, 0.12, M.black, 0, bottom + sh / 2);
          mesh(group, own(new THREE.PlaneGeometry(w, sh)), M.led, [0, bottom + sh / 2, 0.065], undefined, false);
          for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) box(group, 0.08, bottom, 0.08, M.black, x, bottom / 2);
          box(group, w, 0.06, 0.5, M.black, 0, 0.03);
          labelY = bottom + sh + 0.4;
        } else if (item.type === 'podium') {
          box(group, 0.5, 1.05, 0.4, M.black, 0, 0.525);
          const top = box(group, 0.6, 0.04, 0.5, M.gold, 0, 1.1);
          top.rotation.x = -0.25;
          box(group, 0.22, 0.22, 0.01, M.gold, 0, 0.72, 0.205, false);
          labelY = 1.5;
        } else if (item.type === 'dance' && !pro) {
          box(group, w, 0.03, d, M.dance, 0, 0.015, 0, false);
          labelY = 0.4;
        } else if (item.type === 'dance') {
          const floorMesh = mesh(group, unitBox, M.dance.clone(), [0, 0.015, 0], [w, 0.03, d], false);
          const tex = floorMesh.material.map = danceTexture.clone();
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(w / 1.2, d / 1.2); tex.needsUpdate = true;
          floorMesh.material.userData.own = true;
          for (const [x, z, bw, bd] of [[0, -d / 2, w + 0.08, 0.04], [0, d / 2, w + 0.08, 0.04], [-w / 2, 0, 0.04, d], [w / 2, 0, 0.04, d]] as const) box(group, bw, 0.035, bd, M.gold, x, 0.018, z, false);
          labelY = 0.4;
        } else if (item.type === 'flowers') {
          cyl(group, 0.22, 0.04, M.gold, 0, 0.02);
          cyl(group, 0.03, 1.1, M.gold, 0, 0.55);
          flowerCluster(group, 0, 1.3, 0, 0.32);
          labelY = 1.8;
        } else if (item.type === 'buffet' || item.type === 'registration') {
          box(group, w, 0.025, d, M.linen, 0, 0.75);
          box(group, w, 0.73, d, item.type === 'buffet' ? M.linen : M.black, 0, 0.365);
          if (pro) box(group, w, 0.06, 0.01, M.gold, 0, 0.7, d / 2 + 0.005, false);
          if (item.type === 'buffet' && !pro) {
            // Basic: plain counter only.
          } else if (item.type === 'buffet') {
            const lidGeo = own(new THREE.CylinderGeometry(0.17, 0.17, 0.48, 16, 1, false, 0, Math.PI));
            const n = Math.max(1, Math.floor((w - 0.3) / 0.75));
            for (let i = 0; i < n; i++) {
              const x = -w / 2 + 0.15 + ((w - 0.3) / n) * (i + 0.5);
              box(group, 0.55, 0.1, 0.36, M.silver, x, 0.81);
              const lid = mesh(group, lidGeo, M.silver, [x, 0.86, 0]);
              lid.rotation.z = Math.PI / 2;
            }
          } else {
            for (const x of [-w / 4, w / 4]) { const chair = new THREE.Group(); if (pro) chair.add(new THREE.Mesh(chairFrameGeo, M.chairFrame), new THREE.Mesh(chairCushionGeo, M.chair)); else chair.add(new THREE.Mesh(basicChairGeo, M.chair)); chair.position.set(x, 0, -d / 2 - 0.35); chair.rotation.y = Math.PI; group.add(chair); }
          }
          labelY = 1.4;
        } else if (item.type === 'entrance' || item.type === 'exit') {
          const h = Math.min(3, (ceilingM || 6) - 0.3);
          for (const x of [-w / 2, w / 2]) box(group, 0.3, h, 0.3, M.gold, x, h / 2);
          box(group, w + 0.3, 0.3, 0.3, M.gold, 0, h);
          const n = Math.round(w / 0.35);
          for (let i = 0; i <= n; i++) ball(group, 0.16, i % 3 ? M.flower : M.flowerAccent, -w / 2 + (w / n) * i, h + 0.12, 0.05);
          for (const x of [-w / 2, w / 2]) for (let i = 0; i < 6; i++) ball(group, 0.14, i % 2 ? M.leaf : M.flower, x, 0.3 + i * (h / 6), 0.18);
          if (item.type === 'entrance' && pro) box(group, Math.min(1.6, w - 0.6), 0.01, 3, M.runner, 0, 0.006, -1.5, false);
          labelY = h + 0.6;
        } else if (item.type === 'bar') {
          box(group, w, 1.05, d, M.black, 0, 0.525);
          box(group, w + 0.1, 0.05, d + 0.1, M.gold, 0, 1.08);
          const n = Math.max(1, Math.floor(w / 0.8));
          for (let i = 0; i < n; i++) { const x = -w / 2 + (w / n) * (i + 0.5); cyl(group, 0.18, 0.05, M.chair, x, 0.76, d / 2 + 0.45); cyl(group, 0.025, 0.74, M.chairFrame, x, 0.37, d / 2 + 0.45); }
          labelY = 1.6;
        } else if (item.type === 'lounge') {
          if (pro) box(group, w, 0.01, d, M.runner, 0, 0.005, 0, false);
          const sofaW = Math.min(2.2, w - 0.4);
          box(group, sofaW, 0.42, 0.85, M.sofa, 0, 0.21, -d / 2 + 0.45);
          box(group, sofaW, 0.4, 0.18, M.sofa, 0, 0.62, -d / 2 + 0.12);
          for (const x of [-w / 2 + 0.5, w / 2 - 0.5]) { box(group, 0.8, 0.42, 0.8, M.sofa, x, 0.21, d / 2 - 0.55); box(group, 0.8, 0.35, 0.15, M.sofa, x, 0.6, d / 2 - 0.2); }
          cyl(group, 0.45, 0.42, M.gold, 0, 0.21, 0.1);
          flowerCluster(group, 0, 0.55, 0.1, 0.14);
          labelY = 1.3;
        } else if (item.type === 'led_wall') {
          const h = Math.min(3.4, (ceilingM || 8) - 0.6);
          box(group, w, 0.5, 0.6, M.black, 0, 0.25);
          box(group, w + 0.1, h - 0.4, 0.15, M.black, 0, 0.5 + (h - 0.5) / 2);
          mesh(group, own(new THREE.PlaneGeometry(w, h - 0.6)), M.led, [0, 0.5 + (h - 0.5) / 2, 0.08], undefined, false);
          labelY = h + 0.6;
        } else if (item.type === 'truss') {
          const h = Math.min(5, (ceilingM || 6.5) - 0.3);
          const chord = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
            const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
            const m = mesh(group, unitCyl, M.silver, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [0.025, len, 0.025]);
            m.quaternion.setFromUnitVectors(up, new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0).normalize());
          };
          const s = 0.15;
          for (const x of [-w / 2, w / 2]) for (const [dx, dz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) chord(x + dx, 0, dz, x + dx, h, dz);
          for (const [dy, dz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) chord(-w / 2, h + dy, dz, w / 2, h + dy, dz);
          const heads = Math.max(2, Math.floor(w / 1.6));
          for (let i = 0; i < heads; i++) { const x = -w / 2 + (w / heads) * (i + 0.5); box(group, 0.25, 0.3, 0.25, M.black, x, h - 0.35); cyl(group, 0.08, 0.02, M.lens, x, h - 0.51, 0, false); }
          labelY = h + 0.6;
        } else {
          box(group, w, 0.9, d, M.ivory, 0, 0.45);
          labelY = 1.4;
        }

        group.userData.footprint = footprint;
        if (!pro) {
          // Basic: no labels at all.
        } else if (item.type === 'table') {
          const label = makeLabel(String(tableNumbers.get(item.id) || ''), 18, 'badge');
          label.position.set(0, labelY, 0);
          group.add(label); labelSprites.push(label);
        } else if (item.type !== 'chairs') {
          const name = isAr ? item.labelAr : item.labelEn;
          const size = item.type === 'podium' || item.type === 'flowers' ? '' : ` · ${formatM(w)}×${formatM(d)} ${isAr ? 'م' : 'm'}`;
          const label = makeLabel(`${name}${size}`, 18);
          label.position.set(0, labelY, 0);
          group.add(label); labelSprites.push(label);
        }
        return group;
      };

      const disposeObject = (obj: any) => {
        obj.traverse((child: any) => {
          if (child.userData?.label) { child.material.map?.dispose(); child.material.dispose(); }
          if (child.material?.userData?.own) { child.material.map?.dispose(); child.material.dispose(); }
          if (child.isInstancedMesh) child.dispose?.();
        });
      };

      const rebuild = () => {
        while (itemRoot.children.length) { const child = itemRoot.children[0]; itemRoot.remove(child); disposeObject(child); }
        for (let i = labelSprites.length - 1; i >= 0; i--) if (!isInScene(labelSprites[i])) labelSprites.splice(i, 1);
        tableNumbers.clear();
        let n = 0;
        itemsRef.current.forEach((item) => { if (item.type === 'table') tableNumbers.set(item.id, ++n); });
        // Draw floor-level items first so tables sit visually on top of dance floors.
        [...itemsRef.current].sort((a, b) => (a.type === 'dance' ? -1 : 0) - (b.type === 'dance' ? -1 : 0)).forEach((item) => itemRoot.add(buildItem(item)));
        applyMeasure();
        scaleLabels();
      };
      const isInScene = (obj: any) => { let o = obj; while (o) { if (o === scene) return true; o = o.parent; } return false; };
      const applyMeasure = () => {
        const on = !pro || measureRef.current;
        measureGroup.visible = on;
        labelSprites.forEach((s) => { if (!measureGroup.children.includes(s)) s.visible = on; });
      };

      // Selection outline (footprint, including chairs) that follows the selected item.
      const outlineGeo = own(new THREE.BufferGeometry());
      outlineGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5], 3));
      const outline = new THREE.LineLoop(outlineGeo, own(new THREE.LineBasicMaterial({ color: '#E9CF94', depthTest: false })));
      outline.renderOrder = 9;
      outline.visible = false;
      scene.add(outline);

      rebuild();

      // ── Controls ──
      const orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.dampingFactor = 0.08;
      orbit.maxDistance = Math.max(W, D) * 3;
      orbit.minDistance = 2;
      const walk = { active: false, yaw: 0, pitch: 0 };
      const keys = new Set<string>();
      const typing = (e: KeyboardEvent) => ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      const onKeyDown = (e: KeyboardEvent) => { if (walk.active && !typing(e)) { keys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); } };
      const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);

      const fitPlan = () => {
        const aspect = camera.aspect || 1;
        const t = Math.tan((camera.fov * Math.PI) / 360);
        // Leave room for the dimension labels and the toolbars over the canvas.
        const hz = (D / 2 + 3) * 1.18;
        const hx = W / 2 + 3;
        const h = Math.max(hz, hx / aspect) / t;
        camera.position.set(0, h, 0.001 + D * 0.03);
        orbit.target.set(0, 0, D * 0.03);
        orbit.maxDistance = h * 2;
      };
      const applyView = (next: View3D) => {
        walk.active = next === 'walk';
        keys.clear();
        orbit.enabled = !walk.active;
        scene.fog = next === 'plan' ? null : fog;
        if (next === 'plan') {
          camera.fov = 30;
          camera.updateProjectionMatrix();
          orbit.enableRotate = false;
          orbit.minPolarAngle = 0; orbit.maxPolarAngle = 0;
          orbit.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
          orbit.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
          fitPlan();
          orbit.update();
        } else if (next === '3d') {
          camera.fov = 45;
          camera.updateProjectionMatrix();
          orbit.enableRotate = true;
          orbit.minPolarAngle = 0.15; orbit.maxPolarAngle = Math.PI * 0.47;
          orbit.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
          orbit.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
          orbit.maxDistance = Math.max(W, D) * 3;
          const dist = Math.max(W, D) * (camera.aspect < 0.9 ? 1.45 : 0.88);
          camera.position.set(W * 0.42 * (dist / Math.max(W, D)), dist * 0.62, D / 2 + dist * 0.55);
          orbit.target.set(0, 0, -D * 0.04);
          orbit.update();
        } else {
          camera.fov = camera.aspect < 0.9 ? 70 : 62;
          camera.updateProjectionMatrix();
          walk.yaw = 0; walk.pitch = -0.06;
          camera.position.set(0, 1.6, D / 2 - 1.6);
        }
        scaleLabels();
      };

      // ── Picking, dragging and walk-look ──
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      let dragging: { id: string; group: any; offset: any; pointerId: number; mode: 'move' | 'rotate'; startClientX: number; startRotation: number } | null = null;
      let looking: { pointerId: number; x: number; y: number; yaw: number; pitch: number } | null = null;
      let dragRaf = 0;
      let pendingPointer: PointerEvent | null = null;
      const pointer = (e: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };
      const onPointerDown = (e: PointerEvent) => {
        if (walk.active) {
          looking = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, yaw: walk.yaw, pitch: walk.pitch };
          try { renderer.domElement.setPointerCapture(e.pointerId); } catch {}
          return;
        }
        if (readOnlyRef.current) return;
        pointer(e);
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(itemRoot.children, true).filter((h: any) => !h.object.userData?.label);
        if (!hits.length) { selectRef.current?.(null); return; }
        let group = hits[0].object;
        while (group.parent && !group.userData.itemId) group = group.parent;
        if (!group.userData.itemId) return;
        const item = itemsRef.current.find((i) => i.id === group.userData.itemId);
        if (!item) return;
        selectRef.current?.(item.id);
        if (rotationModeRef.current) {
          dragging = { id: item.id, group, offset: null, pointerId: e.pointerId, mode: 'rotate', startClientX: e.clientX, startRotation: group.rotation.y };
        } else {
          const point = new THREE.Vector3();
          if (!raycaster.ray.intersectPlane(floorPlane, point)) return;
          dragging = { id: item.id, group, offset: group.position.clone().sub(point), pointerId: e.pointerId, mode: 'move', startClientX: e.clientX, startRotation: group.rotation.y };
        }
        orbit.enabled = false;
        renderer.domElement.style.cursor = 'grabbing';
        try { renderer.domElement.setPointerCapture(e.pointerId); } catch {}
        e.preventDefault();
      };
      const applyPendingDrag = () => {
        dragRaf = 0;
        if (!dragging || !pendingPointer) return;
        const e = pendingPointer;
        pendingPointer = null;
        if (dragging.mode === 'rotate') {
          dragging.group.rotation.y = dragging.startRotation - ((e.clientX - dragging.startClientX) * 0.6 * Math.PI) / 180;
          return;
        }
        pointer(e);
        raycaster.setFromCamera(mouse, camera);
        const point = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(floorPlane, point)) return;
        const next = point.clone().add(dragging.offset);
        next.x = Math.max(-W / 2 + 0.2, Math.min(W / 2 - 0.2, next.x));
        next.z = Math.max(-D / 2 + 0.2, Math.min(D / 2 - 0.2, next.z));
        dragging.group.position.copy(next);
      };
      const onPointerMove = (e: PointerEvent) => {
        if (looking && e.pointerId === looking.pointerId) {
          walk.yaw = looking.yaw + (e.clientX - looking.x) * 0.005;
          walk.pitch = Math.max(-1.1, Math.min(1.1, looking.pitch + (e.clientY - looking.y) * 0.004));
          return;
        }
        if (!dragging || e.pointerId !== dragging.pointerId) return;
        pendingPointer = e;
        if (!dragRaf) dragRaf = requestAnimationFrame(applyPendingDrag);
        e.preventDefault();
      };
      const onPointerUp = (e?: PointerEvent) => {
        if (looking) { looking = null; return; }
        if (!dragging) return;
        const id = dragging.id;
        if (pendingPointer) applyPendingDrag();
        if (dragging.mode === 'rotate') {
          const delta = -((dragging.group.rotation.y - dragging.startRotation) * 180) / Math.PI;
          if (Math.abs(delta) >= 3) rotateRef.current?.(id, delta);
        } else {
          const p = dragging.group.position;
          moveRef.current?.(id, Math.max(0, Math.min(100, (p.x / W) * 100 + 50)), Math.max(0, Math.min(100, (p.z / D) * 100 + 50)));
        }
        dragging = null;
        pendingPointer = null;
        if (dragRaf) { cancelAnimationFrame(dragRaf); dragRaf = 0; }
        if (e) { try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {} }
        orbit.enabled = !walk.active;
        renderer.domElement.style.cursor = 'grab';
      };
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointercancel', onPointerUp);

      const resize = () => {
        if (!hostRef.current) return;
        const r = hostRef.current.getBoundingClientRect();
        camera.aspect = Math.max(0.1, r.width / Math.max(1, r.height));
        camera.updateProjectionMatrix();
        renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
        if (viewRef.current === 'plan') { fitPlan(); orbit.update(); }
        scaleLabels();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
      applyView(viewRef.current);

      let last = performance.now();
      let raf = 0;
      const look = new THREE.Vector3();
      const projected = new THREE.Vector3();
      const animate = (now: number) => {
        raf = requestAnimationFrame(animate);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (walk.active) {
          let f = walkInput.current.forward;
          let s = walkInput.current.right;
          if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
          if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
          if (keys.has('KeyA') || keys.has('ArrowLeft')) s -= 1;
          if (keys.has('KeyD') || keys.has('ArrowRight')) s += 1;
          const speed = 2.2 * dt;
          const fx = -Math.sin(walk.yaw);
          const fz = -Math.cos(walk.yaw);
          camera.position.x += (fx * f + -fz * s) * speed;
          camera.position.z += (fz * f + fx * s) * speed;
          camera.position.x = Math.max(-W / 2 + 0.4, Math.min(W / 2 - 0.4, camera.position.x));
          camera.position.z = Math.max(-D / 2 + 0.4, Math.min(D / 2 - 0.4, camera.position.z));
          camera.position.y = 1.6;
          look.set(camera.position.x + fx * Math.cos(walk.pitch), 1.6 - Math.sin(walk.pitch), camera.position.z + fz * Math.cos(walk.pitch));
          camera.lookAt(look);
        } else {
          orbit.update();
        }
        // Cut away any wall standing between the camera and the room.
        for (const wg of wallGroups) {
          const outside = wg.nx ? camera.position.x * wg.nx > wg.offset + 0.3 : camera.position.z * wg.nz > wg.offset + 0.3;
          wg.group.visible = viewRef.current === 'plan' ? false : walk.active || !outside;
        }
        archGroup.visible = viewRef.current !== 'plan';
        const selectedGroup = selectedIdRef.current ? itemRoot.children.find((child: any) => child.userData?.itemId === selectedIdRef.current) : null;
        if (selectedGroup && !walk.active) {
          const fp = selectedGroup.userData.footprint || { w: 1, d: 1 };
          outline.visible = true;
          outline.position.set(selectedGroup.position.x, 0.06, selectedGroup.position.z);
          outline.rotation.y = selectedGroup.rotation.y;
          outline.scale.set(fp.w + 0.2, 1, fp.d + 0.2);
        } else outline.visible = false;
        const rotationBar = rotationBarRef.current;
        if (rotationBar && selectedGroup && !walk.active) {
          selectedGroup.getWorldPosition(projected);
          projected.y += 2.2;
          projected.project(camera);
          const bounds = renderer.domElement.getBoundingClientRect();
          const sx = ((projected.x + 1) / 2) * bounds.width;
          const sy = ((1 - projected.y) / 2) * bounds.height;
          const visible = projected.z >= -1 && projected.z <= 1 && sx >= 0 && sx <= bounds.width && sy >= 0 && sy <= bounds.height;
          rotationBar.style.display = visible ? 'flex' : 'none';
          rotationBar.style.left = `${sx}px`;
          rotationBar.style.top = `${sy}px`;
        } else if (rotationBar) rotationBar.style.display = 'none';
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(animate);

      engineRef.current = { rebuild, applyView, applyMeasure };
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        if (dragRaf) cancelAnimationFrame(dragRaf);
        observer.disconnect();
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointercancel', onPointerUp);
        orbit.dispose();
        disposeObject(scene);
        disposables.forEach((d) => d.dispose?.());
        renderer.dispose();
        engineRef.current = null;
      };
    };

    boot().catch(() => { setReady(false); setFailed(true); });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [width, depth, language, ceilingM, outdoor, floorKind, poolKey, decorId, tier]);

  useEffect(() => { engineRef.current?.rebuild?.(); }, [items]);
  useEffect(() => { engineRef.current?.applyView?.(view); onViewChange?.(view); }, [view, ready]);
  useEffect(() => { engineRef.current?.applyMeasure?.(); }, [measure, ready]);

  const holdMove = (forward: number, right: number) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); walkInput.current = { forward, right }; },
    onPointerUp: () => { walkInput.current = { forward: 0, right: 0 }; },
    onPointerLeave: () => { walkInput.current = { forward: 0, right: 0 }; },
    onPointerCancel: () => { walkInput.current = { forward: 0, right: 0 }; },
  });
  const viewButtons: { id: View3D; icon: typeof Box; en: string; ar: string }[] = [
    { id: 'plan', icon: LayoutGrid, en: 'Plan', ar: 'مسقط' },
    { id: '3d', icon: Box, en: '3D', ar: '3D' },
    { id: 'walk', icon: Footprints, en: 'Walk', ar: 'تجوّل' },
  ].filter((b) => tier === 'pro' || b.id !== 'walk') as { id: View3D; icon: typeof Box; en: string; ar: string }[];
  const hint = view === 'walk'
    ? (isAr ? 'اسحب للنظر حولك · الأسهم أو WASD للمشي' : 'Drag to look around · arrows or WASD to walk')
    : view === 'plan'
      ? (isAr ? 'مسقط من أعلى بالمقاس · المربع = 1 م' : 'Top-down plan to scale · 1 square = 1 m')
      : (isAr ? 'اسحب للدوران · إصبعان أو العجلة للتقريب' : 'Drag to orbit · pinch or wheel to zoom');
  const unit = isAr ? 'م' : 'm';

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950" dir={isAr ? 'rtl' : 'ltr'}>
      <div ref={hostRef} data-rotation-ui className="absolute inset-0" />
      {watermark && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {/* Dense tiled text so the whole 3D view is covered and no clean screenshot is possible. */}
        <div className="absolute -inset-full flex flex-col justify-center gap-5" style={{ transform: 'rotate(-24deg)' }}>
          {Array.from({ length: 60 }, (_, row) => (
            <div key={row} className={`flex gap-8 whitespace-nowrap font-black tracking-[0.25em] ${row % 2 ? 'text-lg text-white/25 ps-24' : 'text-xl text-amber-200/35'}`}>
              {Array.from({ length: 14 }, (_, i) => <span key={i}>{row % 2 ? (isAr ? 'يتطلب اشتراك فعّال · غير قابل للاستخدام' : 'ACTIVE SUBSCRIPTION REQUIRED · NOT FOR USE') : watermark}</span>)}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-3 top-16 flex justify-center">
          <div className="max-w-md rounded-xl border border-amber-400/40 bg-[#0D0D0F]/85 px-4 py-2.5 text-center backdrop-blur">
            <div className="text-[11px] font-black tracking-widest text-amber-200">{isAr ? 'معاينة فقط · الاشتراك غير مفعّل' : 'PREVIEW ONLY · SUBSCRIPTION NOT ACTIVE'}</div>
            <div className="mt-1 text-[10px] leading-4 text-slate-300">{isAr ? 'هذا العرض غير قابل للاستخدام مع العملاء بدون اشتراك 3D Studio Pro فعّال. الحفظ والعرض للعميل متوقفان.' : 'This view can’t be used with clients without an active 3D Studio Pro subscription. Saving and client presentation are locked.'}</div>
          </div>
        </div>
      </div>}
      {!readOnly && view !== 'walk' && rotationMode && selectedId && items.some((item) => item.id === selectedId) && <div ref={rotationBarRef} data-rotation-ui className="pointer-events-auto absolute z-20 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full border border-amber-300/70 bg-slate-950/95 p-1 shadow-xl" style={{ left: '50%', top: '50%' }} onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" title={isAr ? 'تدوير عكس عقارب الساعة' : 'Rotate counterclockwise'} aria-label={isAr ? 'تدوير عكس عقارب الساعة' : 'Rotate counterclockwise'} onClick={(event) => { event.stopPropagation(); rotateRef.current?.(selectedId, -15); }} className="flex h-8 w-8 items-center justify-center rounded-full text-amber-200 hover:bg-slate-800"><RotateCcw className="h-4 w-4" /></button>
        <button type="button" title={isAr ? 'تدوير مع عقارب الساعة' : 'Rotate clockwise'} aria-label={isAr ? 'تدوير مع عقارب الساعة' : 'Rotate clockwise'} onClick={(event) => { event.stopPropagation(); rotateRef.current?.(selectedId, 15); }} className="flex h-8 w-8 items-center justify-center rounded-full text-amber-200 hover:bg-slate-800"><RotateCw className="h-4 w-4" /></button>
      </div>}

      <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/85 p-1 backdrop-blur" role="group" aria-label={isAr ? 'طريقة العرض' : 'View'}>
          {viewButtons.map(({ id, icon: Icon, en, ar }) => (
            <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id} className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold ${view === id ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:bg-slate-800'}`}><Icon className="h-3.5 w-3.5" />{isAr ? ar : en}</button>
          ))}
        </div>
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/85 p-1 backdrop-blur">
          <span className={`flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-[10px] font-black tracking-widest ${tier === 'pro' ? 'bg-gradient-to-r from-[#E9CF94] via-[#C49A52] to-[#8C6A2E] text-[#0D0D0F]' : 'bg-[#172033] text-[#CFE5FF]'}`}>{tier === 'pro' ? <><Sparkles className="h-3.5 w-3.5" />PRO</> : (isAr ? 'أساسي' : 'BASIC')}</span>
          {tier === 'pro' && <button type="button" onClick={() => setMeasure((m) => !m)} aria-pressed={measure} title={isAr ? 'المقاسات والأسماء' : 'Measurements & labels'} className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold ${measure ? 'bg-amber-400/15 text-amber-200' : 'text-slate-400 hover:bg-slate-800'}`}><Ruler className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? 'المقاسات' : 'Measurements'}</span></button>}
          <button type="button" onClick={() => engineRef.current?.applyView?.(view)} title={isAr ? 'إعادة ضبط الكاميرا' : 'Reset camera'} aria-label={isAr ? 'إعادة ضبط الكاميرا' : 'Reset camera'} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800"><Scan className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-2 start-2 z-10 max-w-[calc(100%-1rem)] space-y-1">
        {tier === 'pro' && <div className="w-fit rounded-lg border border-slate-700 bg-slate-950/85 px-2.5 py-1.5 text-[10px] font-bold text-amber-200" dir="auto">
          {formatM(width)} × {formatM(depth)} {unit}{!outdoor && ceilingM ? ` · ${isAr ? 'الارتفاع' : 'ceiling'} ${formatM(ceilingM)} ${unit}` : ` · ${isAr ? 'مكان مفتوح' : 'open air'}`} · {formatM(width * depth)} {isAr ? 'م²' : 'm²'}
        </div>}
        <div className="w-fit rounded-lg bg-slate-950/70 px-2.5 py-1 text-[10px] text-slate-300">{hint}</div>
      </div>

      {view === 'walk' && ready && <div className={`absolute bottom-20 sm:bottom-3 z-10 grid grid-cols-3 gap-1 ${isAr ? 'left-3' : 'right-3'}`} dir="ltr" aria-label={isAr ? 'أزرار المشي' : 'Walk controls'}>
        <span />
        <button type="button" {...holdMove(1, 0)} aria-label={isAr ? 'للأمام' : 'Forward'} className="flex h-11 w-11 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-950/85 text-amber-200 active:bg-amber-400 active:text-slate-950"><ArrowUp className="h-5 w-5" /></button>
        <span />
        <button type="button" {...holdMove(0, -1)} aria-label={isAr ? 'يسار' : 'Left'} className="flex h-11 w-11 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-950/85 text-amber-200 active:bg-amber-400 active:text-slate-950"><ArrowLeft className="h-5 w-5" /></button>
        <button type="button" {...holdMove(-1, 0)} aria-label={isAr ? 'للخلف' : 'Back'} className="flex h-11 w-11 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-950/85 text-amber-200 active:bg-amber-400 active:text-slate-950"><ArrowDown className="h-5 w-5" /></button>
        <button type="button" {...holdMove(0, 1)} aria-label={isAr ? 'يمين' : 'Right'} className="flex h-11 w-11 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-950/85 text-amber-200 active:bg-amber-400 active:text-slate-950"><ArrowRight className="h-5 w-5" /></button>
      </div>}

      {!ready && !failed && <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(13,13,15,.9)' }}><DaliLoader language={language} label={isAr ? 'جارٍ تحميل المجسم ثلاثي الأبعاد' : 'Loading 3D view'} /></div>}
      {failed && <div className="absolute inset-0 z-20 flex items-center justify-center p-6 text-center text-xs text-slate-400" style={{ background: 'rgba(13,13,15,.95)' }}>{isAr ? 'تعذّر تحميل العرض ثلاثي الأبعاد على هذا الجهاز.' : 'The 3D view could not load on this device.'}</div>}
    </div>
  );
}
