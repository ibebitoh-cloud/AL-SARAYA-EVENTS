import { useEffect, useRef, useState } from 'react';
import { Armchair, ArrowDown, Users, Video, ArrowLeft, ArrowRight, ArrowUp, Box, Camera, Clapperboard, Crown, DoorOpen, Eye, Footprints, LayoutGrid, Maximize2, Minimize2, Moon, PartyPopper, Ruler, RotateCcw, RotateCw, Scan, Sparkles, Sun } from 'lucide-react';
import { DaliLoader } from './DaliLoader';
import type { HallDimensions } from '../types/venueSystem';
import { chairPositions, decorStyle, formatM, itemSize, tableFootprint } from '../data/venueModel';
import { isLiteMode } from '../utils/liteMode';

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
/** Pro lighting scenes. */
export type Mood3D = 'day' | 'evening' | 'party';
/** Pro camera shots: eye level from the entrance, from the kosha, from a guest table, or high from a corner. */
type Shot3D = 'entrance' | 'stage' | 'guest' | 'aerial';

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
  /** `toggle` = add/remove this item from a multi-selection instead of selecting only it. */
  onSelect?: (id: string | null, toggle?: boolean) => void;
  selectedId?: string | null;
  /** Every selected item (bulk selection). */
  selectedIds?: string[];
  /** Taps add to / remove from the selection. */
  multiSelect?: boolean;
  /** Bulk move: final positions of all items dragged together. */
  onMoveMany?: (moves: { id: string; x: number; y: number }[]) => void;
  rotationMode?: boolean;
  onMove?: (id: string, x: number, y: number) => void;
  onRotate?: (id: string, delta?: number) => void;
  onViewChange?: (view: View3D) => void;
  /** Pro: hall name / event shown on the bottom strip of a saved photo. */
  caption?: string;
  /** Pro: lighting scene to open in (a booking's or hall default's saved scene). Defaults to Evening. */
  initialMood?: Mood3D;
  onMoodChange?: (mood: Mood3D) => void;
};

const THREE_URL = 'three';
const CONTROLS_URL = 'three/addons/controls/OrbitControls.js';
const UTILS_URL = 'three/addons/utils/BufferGeometryUtils.js';
const ROOM_ENV_URL = 'three/addons/environments/RoomEnvironment.js';
const POST_URLS = ['three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js', 'three/addons/postprocessing/UnrealBloomPass.js', 'three/addons/postprocessing/OutputPass.js'];

const modeToView = (mode?: Props['mode'], tier: Props['tier'] = 'basic'): View3D => (mode === 'pov' && tier === 'pro' ? 'walk' : mode === 'plan' ? 'plan' : '3d');

export function EventLayout3D({ items, width, depth, language, mode = 'overview', hall, decor, tier = 'basic', readOnly = false, watermark, caption, selectedId, selectedIds, multiSelect = false, rotationMode = false, onSelect, onMove, onMoveMany, onRotate, onViewChange, initialMood, onMoodChange }: Props) {
  const isAr = language === 'ar';
  const hostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<View3D>(() => modeToView(mode, tier));
  const [measure, setMeasure] = useState(true);
  // Pro always opens in Evening lighting (user request, 2026-11-04); Day and Party are one tap away.
  const [mood, setMood] = useState<Mood3D>(initialMood || 'evening');
  const moodChangeRef = useRef(onMoodChange);
  moodChangeRef.current = onMoodChange;
  const [tour, setTour] = useState(false);
  const [guestsOn, setGuestsOn] = useState(false);
  const guestsRef = useRef(guestsOn);
  guestsRef.current = guestsOn;
  const [photoBusy, setPhotoBusy] = useState(false);
  const [recording, setRecording] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const moodRef = useRef(mood);
  moodRef.current = mood;
  const tourRef = useRef(tour);
  tourRef.current = tour;
  const shotRef = useRef<Shot3D | null>(null);
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
  const moveManyRef = useRef(onMoveMany);
  moveManyRef.current = onMoveMany;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const multiRef = useRef(multiSelect);
  multiRef.current = multiSelect;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;
  const viewRef = useRef(view);
  viewRef.current = view;
  const measureRef = useRef(measure);
  measureRef.current = measure;
  const walkInput = useRef({ forward: 0, right: 0 });
  const stopTourRef = useRef(() => {});
  const rotationBarRef = useRef<HTMLDivElement | null>(null);

  const ceilingM = hall?.outdoor ? 0 : hall?.ceilingM ?? 4.5;
  const outdoor = Boolean(hall?.outdoor);
  const floorKind = hall?.floor || (outdoor ? 'terrace' : 'marble');
  const poolKey = hall?.pool ? `${hall.pool.widthM}x${hall.pool.depthM}-${hall.pool.side}` : '';
  // Custom styles carry their colours in the string, so the full string is the rebuild key.
  const decorId = decor && decor.startsWith('custom:') ? decor : decorStyle(decor).id;

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
      // Lite mode (old tablets such as the 2016 Galaxy Tab A): lower resolution, smaller shadows, no reflections, fewer lights.
      const lite = isLiteMode();
      const host = hostRef.current;
      const scene = new THREE.Scene();
      // Basic keeps the original navy look; Pro uses the brand black and gold.
      const bg = pro ? 0x0d0d0f : 0x08111d;
      scene.background = new THREE.Color(bg);
      const fog = new THREE.Fog(bg, Math.max(W, D) * 2.2, Math.max(W, D) * 4.5);
      scene.fog = fog;

      const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 800);
      const renderer = new THREE.WebGLRenderer({ antialias: !lite, powerPreference: 'high-performance' });
      const basePixelRatio = lite ? 1 : Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
      renderer.setPixelRatio(basePixelRatio);
      renderer.shadowMap.enabled = pro;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = outdoor ? 0.95 : 1.05;
      host.replaceChildren(renderer.domElement);
      // Pro: glow (bloom) on chandeliers, candles, ceiling lights and party beams. Off in lite mode.
      let composer: any = null;
      let bloom: any = null;
      if (pro && !lite) {
        try {
          const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all(POST_URLS.map((u) => import(/* @vite-ignore */ u)));
          // Multisampled target so edges stay smooth with the glow on.
          composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
          composer.addPass(new RenderPass(scene, camera));
          bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.25, 0.45, 3.2);
          composer.addPass(bloom);
          composer.addPass(new OutputPass());
        } catch { composer = null; bloom = null; }
      }
      // Day has no glow, so it renders directly (sharpest, cheapest).
      const draw = () => { if (composer && bloom?.enabled) composer.render(); else renderer.render(scene, camera); };
      // Pro: soft studio reflections so gold, silver, glass and marble look real.
      let envTexture: any = null;
      if (pro && !lite) {
        try {
          const { RoomEnvironment } = await import(/* @vite-ignore */ ROOM_ENV_URL);
          const pmrem = new THREE.PMREMGenerator(renderer);
          const room = new RoomEnvironment();
          envTexture = pmrem.fromScene(room, 0.04).texture;
          scene.environment = envTexture;
          scene.environmentIntensity = 0.45;
          room.traverse?.((o: any) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
          pmrem.dispose();
        } catch { /* Reflections are optional. */ }
      }
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
          silver: std('#6E7EA3', 0.6), warmGlow: std('#E8EDF4', 0.6), candle: std('#E8EDF4', 0.6), wood: std('#8A9AB8', 0.7),
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
      const hemi = pro ? new THREE.HemisphereLight(0xfff1dc, 0x2a2420, outdoor ? 1.1 : 1.5) : new THREE.HemisphereLight(0xcfe5ff, 0x172033, 1.8);
      scene.add(hemi);
      const ambient = new THREE.AmbientLight(0xffffff, 0.18);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xfff4e6, outdoor ? 1.6 : 2.0);
      key.position.set(W * 0.25, Math.max(W, D) * 1.1, D * 0.35);
      key.castShadow = pro;
      const shadowSize = lite ? 512 : coarse ? 1024 : 2048;
      key.shadow.mapSize.set(shadowSize, shadowSize);
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
          if (style.id !== 'corporate') {
            // Pleated drapes along the wall, lit by the uplights.
            const dh = wallH - 0.2;
            const drape = own(new THREE.PlaneGeometry(length, dh, Math.ceil(length * (lite ? 3 : 8)), 1));
            const pos = drape.attributes.position;
            for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, Math.sin(x * Math.PI * 4) * 0.06 + Math.sin(x * 1.3) * 0.02); }
            drape.computeVertexNormals();
            M.drape = M.drape || std(new THREE.Color(style.linen).lerp(new THREE.Color(style.backdrop), 0.3).getStyle(), 0.8, 0, { side: THREE.DoubleSide });
            const curtain = new THREE.Mesh(drape, M.drape);
            curtain.position.set(0, dh / 2 + 0.02, 0.17); curtain.receiveShadow = true; g.add(curtain);
          }
          }
          const count = pro ? Math.max(2, Math.floor(length / 4)) : 0;
          const washGeo = own(new THREE.PlaneGeometry(1.4, Math.min(3.2, wallH * 0.75)));
          for (let i = 0; i < count; i++) {
            const wash = new THREE.Mesh(washGeo, washMat);
            wash.position.set(-length / 2 + (length / count) * (i + 0.5), Math.min(3.2, wallH * 0.75) / 2, 0.26);
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
        const crystalMat = M.crystal = std('#FFF3D6', 0.2, 0.1, { emissive: new THREE.Color('#FFD08A'), emissiveIntensity: 0.7, transparent: true, opacity: 0.9 });
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
        if (pro) {
          // Coffered ceiling with recessed down-lights. Seen from below only (walk-through); from above it is see-through.
          const ceilTex = canvasTexture(256, 256, (ctx) => {
            ctx.fillStyle = '#EFE8DA'; ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#E2D8C5'; ctx.fillRect(14, 14, 228, 228);
            ctx.strokeStyle = 'rgba(196,154,82,.9)'; ctx.lineWidth = 5; ctx.strokeRect(14, 14, 228, 228);
            ctx.strokeStyle = 'rgba(140,106,46,.55)'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, 256, 256);
          }, [W / 3.5, D / 3.5]);
          const glowTex = canvasTexture(256, 256, (ctx) => {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 256);
            for (const [x, y] of [[70, 70], [186, 70], [70, 186], [186, 186]]) {
              const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
              g.addColorStop(0, '#FFF6E0'); g.addColorStop(0.5, '#FFD9A0'); g.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = g; ctx.fillRect(x - 16, y - 16, 32, 32);
            }
          }, [W / 3.5, D / 3.5]);
          M.ceiling = std('#FFFFFF', 0.85, 0, { map: ceilTex, emissive: new THREE.Color('#FFFFFF'), emissiveMap: glowTex, emissiveIntensity: 1.2 });
          const ceiling = new THREE.Mesh(own(new THREE.PlaneGeometry(W + 0.4, D + 0.4)), M.ceiling);
          ceiling.rotation.x = Math.PI / 2;
          ceiling.position.y = wallH;
          archGroup.add(ceiling);
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
        // Pro labels are opaque: with the glow pipeline, see-through dark labels would blend to grey.
        ctx.fillStyle = variant === 'dim' ? (pro ? '#C49A52' : 'rgba(196,154,82,.95)') : pro ? '#0D0D0F' : 'rgba(8,17,29,.88)';
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
      // Pro flowers: domes of real-looking roses with leaves, batched per item into instanced meshes.
      // Lite mode keeps the old simple balls (far fewer triangles for old tablets).
      const richFlowers = pro && !lite;
      const roseGeo = richFlowers ? own((() => {
        const parts: any[] = [];
        const petal = (tilt: number, turn: number, size: number, lift: number) => {
          const g = new THREE.SphereGeometry(1, 5, 3, 0, Math.PI * 2, 0, Math.PI * 0.55);
          g.scale(0.55 * size, 0.62 * size, 0.22 * size);
          g.translate(0, 0.25 * size, 0.2 * size);
          g.rotateX(-tilt);
          g.rotateY(turn);
          g.translate(0, lift, 0);
          return g;
        };
        parts.push(tr(new THREE.SphereGeometry(0.22, 6, 4), 0, 0.42, 0));
        for (let i = 0; i < 3; i++) parts.push(petal(0.25, (i / 3) * Math.PI * 2, 0.6, 0.18));
        for (let i = 0; i < 5; i++) parts.push(petal(0.65, (i / 5) * Math.PI * 2 + 0.5, 0.85, 0.08));
        for (let i = 0; i < 5; i++) parts.push(petal(1.1, (i / 5) * Math.PI * 2 + 0.2, 1, 0));
        const merged = mergeGeometries(parts.map((g) => g.toNonIndexed ? g.toNonIndexed() : g));
        merged.computeVertexNormals();
        return merged;
      })()) : null;
      const leafGeo = richFlowers ? own((() => { const g = new THREE.SphereGeometry(1, 8, 4); g.scale(0.32, 0.05, 0.75); g.translate(0, 0, 0.6); return g; })()) : null;
      let roseBatch: { main: any[]; accent: any[]; leaf: any[] } = { main: [], accent: [], leaf: [] };
      const tmpN = new THREE.Vector3();
      const tmpS2 = new THREE.Vector3();
      const pushOriented = (list: any[], x: number, y: number, z: number, nx: number, ny: number, nz: number, scale: number, spin: number) => {
        tmpN.set(nx, ny, nz).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(up, tmpN);
        q.multiply(new THREE.Quaternion().setFromAxisAngle(up, spin));
        list.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, tmpS2.set(scale, scale, scale).clone()));
      };
      const flushRoses = (parent: any) => {
        const put = (geo: any, mat: any, list: any[]) => {
          if (!list.length) return;
          const inst = new THREE.InstancedMesh(geo, mat, list.length);
          list.forEach((m, i) => inst.setMatrixAt(i, m));
          inst.castShadow = false; inst.receiveShadow = true;
          parent.add(inst);
        };
        if (richFlowers) { put(roseGeo, M.flower, roseBatch.main); put(roseGeo, M.flowerAccent, roseBatch.accent); put(leafGeo, M.leaf, roseBatch.leaf); }
        roseBatch = { main: [], accent: [], leaf: [] };
      };
      /** A single rose (rich mode) or a ball (lite), used along arches. */
      const rose = (parent: any, r: number, mat: any, x: number, y: number, z: number) => {
        if (!pro) return;
        if (!richFlowers) { ball(parent, r, mat, x, y, z); return; }
        if (mat === M.leaf) { pushOriented(roseBatch.leaf, x, y, z, 0.3, 1, 0.6, r * 1.1, x * 7 + y * 3); return; }
        const list = mat === M.flowerAccent ? roseBatch.accent : roseBatch.main;
        pushOriented(list, x, y, z, Math.sin(x * 9 + y) * 0.4, 1, 0.8, r * 1.15, x * 5 + y * 11);
      };
      const flowerCluster = (parent: any, x: number, y: number, z: number, r: number) => {
        if (!pro) return;
        if (!richFlowers) {
          ball(parent, r, M.flower, x, y, z);
          for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ball(parent, r * 0.38, i % 2 ? M.flowerAccent : M.leaf, x + Math.cos(a) * r * 0.8, y - r * 0.25, z + Math.sin(a) * r * 0.8); }
          return;
        }
        // Fibonacci points over a dome; each rose faces outward.
        const n = Math.max(8, Math.min(32, Math.round(r * r * 150)));
        const golden = Math.PI * (3 - Math.sqrt(5));
        const roseSize = r * 0.36;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const ny = 1 - t * 1.15;
          const rad = Math.sqrt(Math.max(0, 1 - ny * ny));
          const a = i * golden;
          const nx = Math.cos(a) * rad, nz = Math.sin(a) * rad;
          const list = (i * 7) % 5 === 0 ? roseBatch.accent : roseBatch.main;
          pushOriented(list, x + nx * r * 0.82, y + ny * r * 0.7, z + nz * r * 0.82, nx, Math.max(0.15, ny), nz, roseSize * (0.85 + ((i * 13) % 7) / 20), a * 3);
        }
        const leaves = Math.max(6, Math.round(n / 3));
        for (let i = 0; i < leaves; i++) {
          const a = (i / leaves) * Math.PI * 2;
          pushOriented(roseBatch.leaf, x + Math.cos(a) * r * 0.55, y - r * 0.35, z + Math.sin(a) * r * 0.55, Math.cos(a), 0.35, Math.sin(a), r * 0.55, a);
        }
      };
      const instanced = (parent: any, geo: any, mat: any, placements: { x: number; y: number; z: number; ry: number }[], shadow = true) => {
        if (!placements.length) return;
        const inst = new THREE.InstancedMesh(geo, mat, placements.length);
        placements.forEach((p, i) => { tmpQ.setFromAxisAngle(up, p.ry); tmpP.set(p.x, p.y, p.z); tmpM.compose(tmpP, tmpQ, tmpS); inst.setMatrixAt(i, tmpM); });
        inst.castShadow = shadow; inst.receiveShadow = true;
        parent.add(inst);
      };
      // Fine table details (Pro, not lite): gold chargers, folded napkins, cutlery, chair sashes with a bow.
      const chargerGeo = own(new THREE.CylinderGeometry(0.17, 0.17, 0.006, 24));
      const napkinGeo = own((() => { const g = new THREE.ConeGeometry(0.06, 0.13, 3); g.rotateY(Math.PI / 6); return g; })());
      const cutleryGeo = own(new THREE.BoxGeometry(0.022, 0.006, 0.19));
      const sashGeo = own(mergeGeometries([
        tr(new THREE.BoxGeometry(0.4, 0.09, 0.012), 0, 0.72, 0.205),
        tr(new THREE.SphereGeometry(0.045, 8, 6), 0, 0.72, 0.215),
        ...[-1, 1].map((sx) => { const g = new THREE.BoxGeometry(0.06, 0.2, 0.01); g.rotateZ(sx * 0.25); g.translate(sx * 0.04, 0.6, 0.215); return g; }),
      ].map((g) => g.index ? g.toNonIndexed() : g)));
      M.napkin = std(style.runner, 0.75);
      M.sash = std(style.runner, 0.55, 0.15);
      const addChairs = (parent: any, item: LayoutItem) => {
        const spots = chairPositions(item).map((c) => ({ x: c.x, y: 0, z: c.z, ry: Math.atan2(c.nx, c.nz) }));
        if (!pro) { instanced(parent, basicChairGeo, M.chair, spots, false); return; }
        instanced(parent, chairFrameGeo, M.chairFrame, spots);
        instanced(parent, chairCushionGeo, M.chair, spots);
        if (richFlowers) instanced(parent, sashGeo, M.sash, spots, false);
      };
      // Seated guests (Pro "Guests" toggle), so clients can feel how full the hall will be.
      const guestTorso = pro ? own(new THREE.CapsuleGeometry(0.17, 0.32, 3, 8)) : null;
      const guestHead = pro ? own(new THREE.SphereGeometry(0.11, 10, 8)) : null;
      const guestLegs = pro ? own(tr(new THREE.BoxGeometry(0.32, 0.14, 0.42), 0, 0, 0)) : null;
      const guestMat = pro ? own(new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.75 })) : null;
      const skinMat = pro ? std('#C8A188', 0.6) : null;
      const OUTFITS = ['#1E2230', '#2B2B2E', '#7A1F3D', '#1F4E5F', '#C9B79C', '#5B3A6E', '#0F3D2E', '#8C6A2E', '#D9D4CC', '#3A3F58'];
      const addGuests = (parent: any, item: LayoutItem) => {
        const spots = chairPositions(item).filter((_, i) => (i * 37 + item.id.length * 11) % 100 < 88);
        if (!spots.length) return;
        const torso = new THREE.InstancedMesh(guestTorso, guestMat, spots.length);
        const legs = new THREE.InstancedMesh(guestLegs, guestMat, spots.length);
        const heads = new THREE.InstancedMesh(guestHead, skinMat, spots.length);
        const col = new THREE.Color();
        spots.forEach((c, i) => {
          const ry = Math.atan2(c.nx, c.nz);
          tmpQ.setFromAxisAngle(up, ry);
          const bx = c.x + c.nx * 0.06, bz = c.z + c.nz * 0.06;
          tmpM.compose(tmpP.set(bx, 0.82, bz), tmpQ, tmpS); torso.setMatrixAt(i, tmpM);
          tmpM.compose(tmpP.set(bx, 1.24, bz), tmpQ, tmpS); heads.setMatrixAt(i, tmpM);
          tmpM.compose(tmpP.set(c.x - c.nx * 0.16, 0.52, c.z - c.nz * 0.16), tmpQ, tmpS); legs.setMatrixAt(i, tmpM);
          col.set(OUTFITS[(i * 7 + item.id.length * 3) % OUTFITS.length]);
          torso.setColorAt(i, col); legs.setColorAt(i, col.multiplyScalar(0.7));
        });
        for (const m of [torso, legs, heads]) { m.castShadow = !lite; m.receiveShadow = true; parent.add(m); }
      };
      const addPlaceSettings = (parent: any, item: LayoutItem, w: number, d: number) => {
        const plates: { x: number; y: number; z: number; ry: number }[] = [];
        const glasses: { x: number; y: number; z: number; ry: number }[] = [];
        const chargers: { x: number; y: number; z: number; ry: number }[] = [];
        const napkins: { x: number; y: number; z: number; ry: number }[] = [];
        const forks: { x: number; y: number; z: number; ry: number }[] = [];
        chairPositions(item).forEach((c) => {
          const inset = item.shape === 'rect' ? 0.22 : 0.25;
          let px = c.x - c.nx * (0.38 + inset);
          let pz = c.z - c.nz * (0.38 + inset);
          if (item.shape === 'rect') { px = Math.max(-w / 2 + 0.16, Math.min(w / 2 - 0.16, px)); pz = Math.max(-d / 2 + 0.16, Math.min(d / 2 - 0.16, pz)); }
          plates.push({ x: px, y: 0.762, z: pz, ry: 0 });
          const gx = px - c.nz * 0.16 - c.nx * 0.12;
          const gz = pz + c.nx * 0.16 - c.nz * 0.12;
          glasses.push({ x: gx, y: 0.83, z: gz, ry: 0 });
          if (richFlowers) {
            const ry = Math.atan2(c.nx, c.nz);
            chargers.push({ x: px, y: 0.757, z: pz, ry: 0 });
            napkins.push({ x: px, y: 0.8, z: pz, ry });
            // Fork on one side of the plate, knife on the other (tangent to the seat).
            forks.push({ x: px - c.nz * 0.2, y: 0.766, z: pz + c.nx * 0.2, ry });
            forks.push({ x: px + c.nz * 0.2, y: 0.766, z: pz - c.nx * 0.2, ry });
            glasses.push({ x: gx - c.nz * 0.09, y: 0.83, z: gz + c.nx * 0.09, ry: 0 });
          }
        });
        instanced(parent, plateGeo, M.plate, plates, false);
        instanced(parent, glassGeo, M.glass, glasses, false);
        if (richFlowers) {
          instanced(parent, chargerGeo, M.gold, chargers, false);
          instanced(parent, napkinGeo, M.napkin, napkins, false);
          instanced(parent, cutleryGeo, M.silver, forks, false);
        }
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

      // ── Pro object resources ──
      M.icing = std('#FBF7EE', 0.55);
      M.champagne = std('#E8C468', 0.15, 0.2, { transparent: true, opacity: 0.85 });
      const coupeGeo = own(mergeGeometries([
        tr(new THREE.CylinderGeometry(0.05, 0.018, 0.035, 14, 1, true), 0, 0.1, 0),
        tr(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6), 0, 0.045, 0),
        tr(new THREE.CylinderGeometry(0.03, 0.03, 0.004, 12), 0, 0.002, 0),
      ].map((g) => g.index ? g.toNonIndexed() : g)));
      const wineGeo = own(tr(new THREE.CylinderGeometry(0.044, 0.02, 0.022, 12), 0, 0.098, 0));
      const domeGeo = own(new THREE.SphereGeometry(0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2));
      const sweetGeo = own(new THREE.SphereGeometry(0.03, 8, 6));
      const bulbGeo2 = own(new THREE.SphereGeometry(0.03, 8, 6));
      const signTexture = canvasTexture(512, 180, (ctx) => {
        ctx.clearRect(0, 0, 512, 180);
        ctx.fillStyle = '#FFF4DE'; ctx.shadowColor = '#FFD08A'; ctx.shadowBlur = 18;
        ctx.font = 'italic 600 110px "Readex Pro", "Cairo", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Forever', 256, 92);
      });
      const sparkMat = own(new THREE.PointsMaterial({ color: '#FFD9A0', size: lite ? 0.06 : 0.045, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      /** Cold-spark fountains, animated in Party lighting. */
      const sparks: { pts: any; pos: Float32Array; vel: Float32Array; life: Float32Array }[] = [];
      const tableNumbers = new Map<string, number>();
      /** Dance floor materials, so Party mode can make them glow. */
      const danceMats: any[] = [];
      // ── Catalogue objects (Basic and Pro). Basic gets the same shapes in the plain massing colours; Pro adds gold, flowers and glow. ──
      const sph = (parent: any, r: number, mat: any, x: number, y: number, z: number, shadow = false) => mesh(parent, sphereGeo, mat, [x, y, z], [r, r, r], shadow);
      /** Many spheres of one material in a single draw call. Each entry is [x, y, z, radius]. */
      const balls = (parent: any, mat: any, pts: number[][], sx = 1, sy = 1) => {
        if (!pts.length) return;
        const inst = new THREE.InstancedMesh(sphereGeo, mat, pts.length);
        pts.forEach(([x, y, z, r], i) => { tmpM.compose(tmpP.set(x, y, z), tmpQ.identity(), tmpS2.set(r * sx, r * sy, r * sx)); inst.setMatrixAt(i, tmpM); });
        inst.castShadow = false; inst.receiveShadow = true;
        parent.add(inst);
      };
      const rod = (parent: any, mat: any, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r = 0.02) => {
        const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
        const m = mesh(parent, unitCyl, mat, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [r, len, r], false);
        m.quaternion.setFromUnitVectors(up, new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0).normalize());
        return m;
      };
      const chairsAt = (parent: any, spots: { x: number; y: number; z: number; ry: number }[]) => {
        if (!pro) { instanced(parent, basicChairGeo, M.chair, spots, false); return; }
        instanced(parent, chairFrameGeo, M.chairFrame, spots);
        instanced(parent, chairCushionGeo, M.chair, spots);
        if (richFlowers) instanced(parent, sashGeo, M.sash, spots, false);
      };
      const counter = (parent: any, w: number, d: number, h = 0.9, mat = M.black) => { box(parent, w, h, d, mat, 0, h / 2); box(parent, w + 0.06, 0.04, d + 0.06, pro ? M.gold : M.ivory, 0, h + 0.02); };
      const neutral = (c: string, r = 0.6, m = 0, extra: Record<string, unknown> = {}) => pro ? std(c, r, m, extra) : std('#8A9AB8', 0.7);
      M.water = pro ? std('#7FC8D8', 0.05, 0.1, { transparent: true, opacity: 0.7 }) : std('#8A9AB8', 0.5);
      M.ice = pro ? std('#E3F6FC', 0.05, 0.05, { transparent: true, opacity: 0.78 }) : std('#E8EDF4', 0.5);
      M.carpet = neutral('#7A1626', 0.95);
      M.trunk = neutral('#5A4330', 0.85);
      M.screenWhite = std(pro ? '#F7F7F5' : '#E8EDF4', 0.6);
      M.velvet = neutral('#5B1A2A', 0.75);
      M.balloonA = pro ? std(style.flower, 0.25, 0.05) : std('#8A9AB8', 0.6);
      M.balloonB = pro ? std(style.flowerAccent, 0.25, 0.05) : std('#E8EDF4', 0.6);
      M.balloonC = pro ? std('#E9CF94', 0.2, 0.6) : std('#6E7EA3', 0.6);
      M.fog = std('#FFFFFF', 1, 0, { transparent: true, opacity: 0.16, depthWrite: false });
      M.neon = pro ? std('#FFFFFF', 0.4, 0, { emissive: new THREE.Color('#FF6FB0'), emissiveIntensity: 2.6 }) : std('#E8EDF4', 0.6);
      const brightKids = ['#F2B544', '#5BB8E8', '#E86A8A', '#7CCB7A', '#B48CE0'];
      const kidMats = brightKids.map((c) => pro ? std(c, 0.5) : std('#8A9AB8', 0.7));
      const textPlane = (text: string, color: string, glow: string, font: string) => canvasTexture(512, 256, (ctx) => {
        ctx.clearRect(0, 0, 512, 256);
        ctx.fillStyle = color; ctx.shadowColor = glow; ctx.shadowBlur = 20;
        ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 132);
      });
      const welcomeTex = pro ? textPlane('Welcome', '#8C6A2E', 'rgba(0,0,0,0)', 'italic 600 112px "Readex Pro", serif') : null;
      const neonTex = pro ? textPlane('Mr & Mrs', '#FFF0F7', '#FF5FA2', '600 120px "Readex Pro", sans-serif') : null;
      const hangTop = () => (outdoor ? 4.2 : Math.max(2.6, ceilingM) - 0.25);

      /** Draws a catalogue object into `group`. Returns the label height, or null if the type is not one of these. */
      const buildExtra = (group: any, item: LayoutItem, w: number, d: number): number | null => {
        switch (item.type) {
          case 'head_table': {
            box(group, w, 0.025, d, M.linen, 0, 0.75); box(group, w, 0.73, d, M.linen, 0, 0.365);
            if (pro) { box(group, w, 0.5, 0.01, M.runner, 0, 0.5, d / 2 + 0.01, false); for (let i = 0; i < 3; i++) flowerCluster(group, -w / 3 + (w / 3) * i, 0.9, d / 2 - 0.2, 0.22); }
            const n = Math.max(1, Math.floor(w / 0.65));
            chairsAt(group, Array.from({ length: n }, (_, i) => ({ x: -w / 2 + (w / n) * (i + 0.5), y: 0, z: -d / 2 - 0.38, ry: Math.PI })));
            return 1.5;
          }
          case 'kids_table': {
            const r = w / 2 - 0.15;
            cyl(group, r, 0.03, kidMats[0], 0, 0.54); cyl(group, 0.05, 0.52, M.ivory, 0, 0.26);
            for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; cyl(group, 0.14, 0.32, kidMats[(i % 4) + 1], Math.cos(a) * (r + 0.22), 0.16, Math.sin(a) * (r + 0.22)); }
            if (pro) balls(group, M.balloonA, [[0, 0.62, 0, 0.06]]);
            return 1.1;
          }
          case 'sofa': case 'armchair': {
            box(group, w, 0.42, d, M.sofa, 0, 0.21); box(group, w, 0.45, 0.18, M.sofa, 0, 0.63, -d / 2 + 0.09);
            for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) box(group, 0.16, 0.62, d, pro ? M.gold : M.sofa, x, 0.31);
            if (pro) { const n = Math.max(1, Math.round((w - 0.3) / 0.6)); for (let i = 0; i < n; i++) box(group, 0.4, 0.34, 0.1, M.runner, -w / 2 + 0.15 + ((w - 0.3) / n) * (i + 0.5), 0.62, -d / 2 + 0.22); }
            return 1.3;
          }
          case 'ottoman': cyl(group, w / 2, 0.42, pro ? M.runner : M.sofa, 0, 0.21); if (pro) cyl(group, w / 2 + 0.005, 0.03, M.gold, 0, 0.03); return 0.9;
          case 'bench': {
            box(group, w, 0.06, d * 0.8, pro ? M.wood : M.sofa, 0, 0.45);
            box(group, w, 0.35, 0.05, pro ? M.wood : M.sofa, 0, 0.7, -d / 2 + 0.03);
            for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) for (const z of [-d * 0.3, d * 0.3]) box(group, 0.05, 0.43, 0.05, M.black, x, 0.215, z);
            return 1.2;
          }
          case 'bar_stool':
            cyl(group, 0.2, 0.02, M.black, 0, 0.01); cyl(group, 0.025, 0.74, pro ? M.silver : M.chairFrame, 0, 0.38);
            cyl(group, 0.19, 0.07, M.chair, 0, 0.78);
            { const ring = new THREE.Mesh(own(new THREE.TorusGeometry(0.15, 0.012, 6, 20)), pro ? M.silver : M.chairFrame); ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; group.add(ring); }
            return 1.2;
          case 'projector_screen': {
            const sh = Math.min(w * 0.6, (ceilingM || 6) - 1.2);
            for (const x of [-w / 2, w / 2]) { box(group, 0.06, sh + 1, 0.06, M.black, x, (sh + 1) / 2); box(group, 0.08, 0.04, d, M.black, x, 0.02); }
            mesh(group, own(new THREE.PlaneGeometry(w - 0.1, sh)), M.screenWhite, [0, 1 + sh / 2 - 0.05, 0.01], undefined, false);
            box(group, w, 0.06, 0.08, M.black, 0, 1 + sh);
            return sh + 1.5;
          }
          case 'tv_stand':
            box(group, 0.7, 0.04, 0.5, M.black, 0, 0.02); box(group, 0.08, 1.3, 0.08, M.black, 0, 0.65);
            box(group, w, w * 0.58, 0.06, M.black, 0, 1.25 + w * 0.29);
            mesh(group, own(new THREE.PlaneGeometry(w - 0.06, w * 0.58 - 0.06)), M.led, [0, 1.25 + w * 0.29, 0.035], undefined, false);
            return 1.25 + w * 0.58 + 0.4;
          case 'mic_stand':
            cyl(group, 0.14, 0.02, M.black, 0, 0.01); cyl(group, 0.012, 1.45, M.silver, 0, 0.73);
            rod(group, M.silver, 0, 1.45, 0, 0, 1.55, 0.18, 0.01); cyl(group, 0.025, 0.12, M.black, 0, 1.58, 0.2);
            return 2;
          case 'speaker':
            box(group, w, 0.9, d, M.black, 0, 0.45); box(group, w * 0.9, 1.1, d * 0.9, M.black, 0, 1.45);
            for (const [yy, rr] of [[0.45, 0.22], [1.25, 0.16], [1.75, 0.08]] as const) { const c = mesh(group, unitCyl, M.silver, [0, yy, d / 2 + 0.005], [rr, 0.01, rr], false); c.rotation.x = Math.PI / 2; }
            return 2.6;
          case 'piano': {
            box(group, w, 0.32, d * 0.55, M.black, 0, 0.82, d * 0.2);
            const tail = mesh(group, unitCyl, M.black, [0, 0.82, -d * 0.1], [w / 2, 0.32, d * 0.42]);
            tail.scale.set(w / 2, 0.32, d * 0.42);
            const lid = box(group, w * 0.95, 0.02, d * 0.8, M.black, 0, 1.25, -d * 0.05); lid.rotation.z = 0.5; lid.position.x = -0.15;
            box(group, w, 0.06, 0.18, M.ivory, 0, 0.96, d / 2 - 0.05); box(group, w, 0.02, 0.07, M.black, 0, 1.0, d / 2 - 0.1, false);
            for (const [x, z] of [[-w / 2 + 0.12, d / 2 - 0.15], [w / 2 - 0.12, d / 2 - 0.15], [0, -d / 2 + 0.2]]) box(group, 0.08, 0.66, 0.08, M.black, x, 0.33, z);
            box(group, 0.9, 0.08, 0.35, M.black, 0, 0.48, d / 2 + 0.35); for (const x of [-0.4, 0.4]) box(group, 0.05, 0.44, 0.3, M.black, x, 0.22, d / 2 + 0.35);
            return 1.9;
          }
          case 'band_riser': {
            const h = 0.4;
            box(group, w, h, d, M.stage, 0, h / 2);
            if (pro) box(group, w + 0.02, 0.04, d + 0.02, M.gold, 0, h - 0.01);
            // Drum kit and two microphones.
            cyl(group, 0.28, 0.35, M.ivory, 0, h + 0.3, -d / 4); for (const x of [-0.5, 0.5]) cyl(group, 0.2, 0.25, M.ivory, x, h + 0.5, -d / 4 + 0.1);
            for (const x of [-0.8, 0.9]) { cyl(group, 0.18, 0.01, M.black, x - 0.2, h + 0.95, -d / 4 + 0.2, false); cyl(group, 0.01, 0.95, M.silver, x - 0.2, h + 0.48, -d / 4 + 0.2); }
            for (const x of [-w / 4, w / 4]) { cyl(group, 0.012, 1.4, M.silver, x, h + 0.7, d / 4); cyl(group, 0.025, 0.1, M.black, x, h + 1.42, d / 4); }
            return h + 1.8;
          }
          case 'round_buffet': {
            const r = w / 2;
            cyl(group, r, 0.88, M.linen, 0, 0.44); cyl(group, r + 0.03, 0.03, pro ? M.gold : M.linen, 0, 0.9);
            if (pro) {
              const lidGeo = own(new THREE.CylinderGeometry(0.15, 0.15, 0.42, 14, 1, false, 0, Math.PI));
              const n = Math.max(4, Math.floor((Math.PI * 2 * (r - 0.3)) / 0.6));
              for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const lid = mesh(group, lidGeo, M.silver, [Math.cos(a) * (r - 0.3), 0.96, Math.sin(a) * (r - 0.3)]); lid.rotation.set(0, -a + Math.PI / 2, Math.PI / 2); }
              cyl(group, 0.04, 0.5, M.gold, 0, 1.15); flowerCluster(group, 0, 1.45, 0, 0.3);
            } else for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; box(group, 0.4, 0.1, 0.3, M.silver, Math.cos(a) * (r - 0.3), 0.95, Math.sin(a) * (r - 0.3)); }
            return 1.9;
          }
          case 'coffee_station': case 'juice_station': case 'water_station': {
            counter(group, w, d, 0.9, item.type === 'coffee_station' ? M.black : M.linen);
            box(group, w, 1.2, 0.05, M.backdrop, 0, 1.5, -d / 2 + 0.03);
            if (item.type === 'coffee_station') {
              box(group, 0.55, 0.45, 0.4, M.silver, -w / 4, 1.15); box(group, 0.4, 0.06, 0.3, M.black, -w / 4, 0.95, 0.05);
              const cups: { x: number; y: number; z: number; ry: number }[] = [];
              for (let i = 0; i < 12; i++) cups.push({ x: w / 8 + (i % 4) * 0.12, y: 0.93, z: -0.1 + Math.floor(i / 4) * 0.12, ry: 0 });
              instanced(group, glassGeo, M.plate, cups, false);
            } else {
              const n = item.type === 'water_station' ? 2 : 3;
              const juice = [style.flowerAccent, '#F2B544', '#E86A3A'];
              for (let i = 0; i < n; i++) {
                const x = -w / 2 + (w / n) * (i + 0.5);
                cyl(group, 0.13, 0.45, M.glass, x, 1.15, 0, false);
                cyl(group, 0.12, 0.32, item.type === 'water_station' ? M.water : (pro ? std(juice[i % 3], 0.2, 0, { transparent: true, opacity: 0.85 }) : M.water), x, 1.08, 0, false);
                cyl(group, 0.14, 0.03, pro ? M.gold : M.silver, x, 1.39);
              }
            }
            if (pro) flowerCluster(group, w / 2 - 0.25, 1.05, 0.1, 0.13);
            return 2.4;
          }
          case 'live_cooking': {
            counter(group, w, d, 0.9, M.silver);
            for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) box(group, 0.06, 2.2, 0.06, M.silver, x, 1.1, -d / 2 + 0.05);
            box(group, w, 0.35, d * 0.9, M.silver, 0, 2.1, 0);
            for (const x of [-w / 4, w / 4]) { cyl(group, 0.18, 0.04, M.black, x, 0.94); cyl(group, 0.16, 0.08, M.silver, x, 1.0); }
            box(group, w * 0.9, 0.04, 0.4, M.wood, 0, 0.93, d / 2 - 0.25);
            return 2.6;
          }
          case 'popcorn_cart': case 'ice_cream_cart': {
            box(group, w, 0.75, d, item.type === 'popcorn_cart' ? kidMats[2] : kidMats[1], 0, 0.55);
            for (const x of [-w / 2 + 0.15, w / 2 - 0.15]) { const wh = mesh(group, unitCyl, M.black, [x, 0.17, d / 2 + 0.02], [0.17, 0.04, 0.17]); wh.rotation.x = Math.PI / 2; }
            if (item.type === 'popcorn_cart') {
              box(group, w * 0.8, 0.6, d * 0.8, M.glass, 0, 1.25, 0, false); balls(group, std('#F6E3B0', 0.8), Array.from({ length: pro ? 30 : 10 }, (_, i) => [((i * 37) % 10) / 10 * w * 0.6 - w * 0.3, 1.02 + ((i * 13) % 5) * 0.03, ((i * 17) % 10) / 10 * d * 0.6 - d * 0.3, 0.05]));
              const roof = mesh(group, own(new THREE.ConeGeometry(Math.max(w, d) * 0.7, 0.3, 4)), kidMats[2], [0, 1.72, 0]); roof.rotation.y = Math.PI / 4;
            } else {
              for (let i = 0; i < 4; i++) cyl(group, 0.1, 0.06, [M.ivory, kidMats[2], kidMats[3], kidMats[0]][i], -w / 2 + 0.25 + i * ((w - 0.5) / 3), 0.96, 0, false);
              cyl(group, 0.02, 1.3, M.silver, 0, 1.6);
              mesh(group, own(new THREE.ConeGeometry(0.9, 0.35, 12)), pro ? M.runner : M.ivory, [0, 2.15, 0]);
            }
            return 2.4;
          }
          case 'potted_plant':
            cyl(group, 0.22, 0.45, pro ? M.gold : M.ivory, 0, 0.225);
            balls(group, M.leaf, [[0, 0.75, 0, 0.3], [0.15, 1.0, 0.05, 0.22], [-0.12, 0.98, -0.06, 0.2], [0, 1.15, 0, 0.16]]);
            return 1.6;
          case 'palm_tree': {
            cyl(group, 0.35, 0.5, pro ? M.gold : M.ivory, 0, 0.25);
            const top = 2.9;
            for (let i = 0; i < 7; i++) cyl(group, 0.09 - i * 0.004, (top - 0.5) / 7 + 0.02, M.trunk, Math.sin(i * 0.4) * 0.05, 0.5 + ((top - 0.5) / 7) * (i + 0.5), 0);
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              const frond = mesh(group, unitBox, M.leaf, [Math.cos(a) * 0.55, top - 0.15, Math.sin(a) * 0.55], [1.2, 0.02, 0.28], false);
              frond.rotation.set(0, -a, -0.45);
            }
            return top + 0.6;
          }
          case 'light_tree': {
            cyl(group, 0.3, 0.4, pro ? M.gold : M.ivory, 0, 0.2);
            cyl(group, 0.07, 1.5, M.trunk, 0, 1.15);
            const blobs = [[0, 2.1, 0, 0.55], [0.4, 1.9, 0.1, 0.4], [-0.38, 1.95, -0.08, 0.42], [0.1, 2.45, -0.2, 0.38], [-0.1, 1.8, 0.35, 0.35]];
            balls(group, pro ? M.flower : M.leaf, blobs);
            if (pro) {
              const n = lite ? 30 : 70; const bulbs: number[][] = [];
              for (let i = 0; i < n; i++) { const b = blobs[i % blobs.length]; const a = i * 2.4, e = ((i * 7) % 10) / 10 - 0.3; bulbs.push([b[0] + Math.cos(a) * b[3] * 0.98, b[1] + e * b[3], b[2] + Math.sin(a) * b[3] * 0.98, 0.025]); }
              balls(group, M.warmGlow, bulbs);
            }
            return 3.2;
          }
          case 'column':
            box(group, w, 0.12, w, pro ? M.gold : M.ivory, 0, 0.06); cyl(group, w * 0.34, 2.1, M.ivory, 0, 1.17);
            box(group, w, 0.12, w, pro ? M.gold : M.ivory, 0, 2.28);
            if (pro) flowerCluster(group, 0, 2.5, 0, 0.3);
            return 3;
          case 'backdrop': {
            const h = Math.min(2.8, (ceilingM || 6) - 0.3);
            box(group, w, h, 0.12, M.backdrop, 0, h / 2);
            for (const x of [-w / 2, w / 2]) box(group, 0.1, 0.06, d, M.black, x, 0.03);
            if (pro) { box(group, w + 0.1, 0.08, 0.16, M.gold, 0, h); for (const x of [-w / 2, w / 2]) box(group, 0.08, h, 0.16, M.gold, x, h / 2); for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) flowerCluster(group, x, h - 0.1, 0.12, 0.3); }
            return h + 0.5;
          }
          case 'balloon_arch': case 'balloons': {
            const pts: [number[][], number[][], number[][]] = [[], [], []];
            if (item.type === 'balloon_arch') {
              const R = w / 2, n = lite ? 26 : 44;
              for (let i = 0; i <= n; i++) {
                const a = Math.PI * (i / n);
                for (let k = 0; k < 3; k++) { const rr = R + (k - 1) * 0.12, r = 0.13 + ((i + k) % 3) * 0.025; pts[(i + k) % 3].push([Math.cos(a) * rr, 0.15 + Math.sin(a) * rr * 0.85, (k - 1) * 0.1, r]); }
              }
              for (const x of [-R, R]) box(group, 0.3, 0.12, 0.3, M.black, x, 0.06);
            } else {
              for (let i = 0; i < 7; i++) { const a = i * 0.9, h = 1.5 + ((i * 3) % 5) * 0.12, x = Math.cos(a) * 0.22, z = Math.sin(a) * 0.22; pts[i % 3].push([x, h, z, 0.18]); rod(group, M.silver, 0, 0.12, 0, x, h - 0.17, z, 0.003); }
              cyl(group, 0.1, 0.12, pro ? M.gold : M.black, 0, 0.06);
            }
            balls(group, M.balloonA, pts[0], 1, 1.12); balls(group, M.balloonB, pts[1], 1, 1.12); balls(group, M.balloonC, pts[2], 1, 1.12);
            return item.type === 'balloon_arch' ? w / 2 + 0.7 : 2.3;
          }
          case 'candelabra': {
            cyl(group, 0.16, 0.04, M.gold, 0, 0.02); cyl(group, 0.025, 1.05, M.gold, 0, 0.55);
            const tips: [number, number][] = [[0, 0]];
            for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; tips.push([Math.cos(a) * 0.24, Math.sin(a) * 0.24]); rod(group, M.gold, 0, 1.0, 0, Math.cos(a) * 0.24, 1.1, Math.sin(a) * 0.24, 0.012); }
            for (const [x, z] of tips) { cyl(group, 0.04, 0.02, M.gold, x, 1.1 + (x || z ? 0 : 0.05)); cyl(group, 0.022, 0.18, M.candle, x, 1.2 + (x || z ? 0 : 0.05), z, false); }
            if (pro) flowerCluster(group, 0, 0.95, 0, 0.12);
            return 1.8;
          }
          case 'lanterns': {
            [[-0.25, 0.7, 0], [0.18, 0.5, 0.1], [0.3, 0.35, -0.15]].forEach(([x, h, z]) => {
              const s = h * 0.45;
              box(group, s, h, s, M.glass, x, h / 2, z, false);
              for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(group, 0.02, h, 0.02, pro ? M.gold : M.black, x + (dx * s) / 2, h / 2, z + (dz * s) / 2, false);
              box(group, s + 0.04, 0.03, s + 0.04, pro ? M.gold : M.black, x, h, z); cyl(group, s * 0.25, h * 0.35, M.candle, x, h * 0.18, z, false);
            });
            return 1.2;
          }
          case 'welcome_sign': {
            for (const [x, z] of [[-0.3, 0.12], [0.3, 0.12]]) rod(group, M.wood, x, 0, z, x * 0.7, 1.6, -0.05, 0.02);
            rod(group, M.wood, 0, 0, -0.35, 0, 1.55, -0.05, 0.02);
            const board = box(group, w * 0.8, w * 1.05, 0.03, M.ivory, 0, 1.05, 0.05); board.rotation.x = -0.12;
            if (welcomeTex) { const sign = mesh(group, own(new THREE.PlaneGeometry(w * 0.72, w * 0.36)), std('#FFFFFF', 0.6, 0, { map: welcomeTex, transparent: true }), [0, 1.12, 0.075], undefined, false); sign.rotation.x = -0.12; box(group, w * 0.84, 0.03, 0.04, M.gold, 0, 1.05 + w * 0.52, 0.0); flowerCluster(group, -w * 0.3, 0.55, 0.12, 0.14); }
            return 2;
          }
          case 'red_carpet':
            box(group, w, 0.012, d, M.carpet, 0, 0.006, 0, false);
            if (pro) for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) box(group, 0.03, 0.014, d, M.gold, x, 0.007, 0, false);
            return 0.5;
          case 'spotlight': {
            for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; rod(group, M.black, Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35, 0, 1.0, 0, 0.015); }
            cyl(group, 0.02, 1.4, M.black, 0, 1.6);
            const head = mesh(group, unitCyl, M.black, [0, 2.35, 0.05], [0.13, 0.35, 0.13]); head.rotation.x = 1.0;
            const lens = mesh(group, unitCyl, M.lens, [0, 2.24, 0.22], [0.1, 0.01, 0.1], false); lens.rotation.x = 1.0;
            return 2.9;
          }
          case 'uplight':
            box(group, 0.24, 0.2, 0.24, M.black, 0, 0.1); cyl(group, 0.09, 0.01, M.lens, 0, 0.205, 0, false);
            return 0.6;
          case 'moving_head': {
            box(group, 0.42, 0.18, 0.42, M.black, 0, 0.09);
            for (const x of [-0.16, 0.16]) box(group, 0.04, 0.3, 0.12, M.black, x, 0.33);
            const headM = mesh(group, unitCyl, M.black, [0, 0.42, 0], [0.13, 0.3, 0.13]); headM.rotation.x = 0.6;
            const lens = mesh(group, unitCyl, M.lens, [0, 0.5, 0.13], [0.1, 0.01, 0.1], false); lens.rotation.x = 0.6;
            return 1;
          }
          case 'string_lights': {
            const h = Math.min(3, (ceilingM || 6) - 0.2);
            box(group, w, 0.05, 0.05, pro ? M.gold : M.black, 0, h);
            for (const x of [-w / 2, w / 2]) box(group, 0.05, h, 0.05, pro ? M.gold : M.black, x, h / 2);
            const strands = Math.max(4, Math.round(w / (lite ? 0.3 : 0.18)));
            const bulbs: number[][] = [];
            for (let i = 0; i < strands; i++) { const x = -w / 2 + (w / strands) * (i + 0.5); rod(group, M.black, x, h, 0, x, 0.3, 0, 0.003); for (let k = 0; k < (lite ? 6 : 12); k++) bulbs.push([x, 0.35 + ((h - 0.4) * k) / (lite ? 6 : 12) + (i % 2) * 0.08, 0.01, 0.022]); }
            balls(group, pro ? M.warmGlow : M.ivory, bulbs);
            return h + 0.4;
          }
          case 'fog_machine':
            box(group, w, 0.28, d, M.black, 0, 0.14); cyl(group, 0.04, 0.12, M.silver, 0, 0.14, d / 2 + 0.05);
            if (pro && !lite) balls(group, M.fog, [[0, 0.25, 0.8, 0.45], [0.3, 0.2, 1.4, 0.55], [-0.35, 0.22, 1.9, 0.6], [0.1, 0.25, 2.5, 0.7]], 1.4, 0.5);
            return 0.8;
          case 'chandelier': case 'crystal_chandelier': {
            const top = hangTop();
            const big = item.type === 'crystal_chandelier' && pro;
            cyl(group, 0.012, 0.6, pro ? M.gold : M.silver, 0, top - 0.3);
            const tiers = big ? [0.95, 0.7, 0.45] : [0.6];
            tiers.forEach((R, t) => {
              const y = top - 0.65 - t * 0.35;
              const ring = new THREE.Mesh(own(new THREE.TorusGeometry(R, 0.03, 8, 40)), pro ? M.gold : M.silver); ring.rotation.x = Math.PI / 2; ring.position.y = y; group.add(ring);
              const n = Math.round(R * (big ? 26 : 10));
              const drops: number[][] = [], bulbs: number[][] = [];
              for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2;
                bulbs.push([Math.cos(a) * R, y + 0.07, Math.sin(a) * R, 0.05]);
                if (big) for (let k = 1; k <= (lite ? 2 : 4); k++) drops.push([Math.cos(a) * R, y - k * 0.09, Math.sin(a) * R, 0.03]);
              }
              balls(group, pro ? M.warmGlow : M.ivory, bulbs);
              if (big) balls(group, M.crystal || M.glass, drops, 1, 1.4);
            });
            if (big) sph(group, 0.22, M.crystal || M.glass, 0, top - 1.45, 0);
            return top - 1.8;
          }
          case 'stanchions': {
            const n = Math.max(2, Math.round(w / 1.3) + 1);
            for (let i = 0; i < n; i++) {
              const x = -w / 2 + (w / (n - 1)) * i;
              cyl(group, 0.15, 0.03, pro ? M.gold : M.silver, x, 0.015); cyl(group, 0.025, 0.95, pro ? M.gold : M.silver, x, 0.5); sph(group, 0.045, pro ? M.gold : M.silver, x, 0.98, 0);
              if (i < n - 1) { const x2 = -w / 2 + (w / (n - 1)) * (i + 1); const mid = (x + x2) / 2; rod(group, M.velvet, x, 0.92, 0, mid, 0.8, 0, 0.02); rod(group, M.velvet, mid, 0.8, 0, x2, 0.92, 0, 0.02); }
            }
            return 1.5;
          }
          case 'cloakroom': {
            counter(group, w, 0.6, 1.0, M.black); box(group, w, 0.04, 0.04, M.silver, 0, 1.75, -d / 2 + 0.2);
            for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) box(group, 0.04, 1.75, 0.04, M.silver, x, 0.875, -d / 2 + 0.2);
            const coats = ['#1E2230', '#7A1F3D', '#3A3F58', '#C9B79C', '#0F3D2E', '#2B2B2E'];
            const n = Math.max(3, Math.floor(w / 0.22));
            for (let i = 0; i < n; i++) box(group, 0.12, 0.9, 0.4, pro ? std(coats[i % coats.length], 0.85) : M.chair, -w / 2 + 0.2 + ((w - 0.4) / (n - 1)) * i, 1.25, -d / 2 + 0.2);
            return 2.3;
          }
          case 'kids_area': {
            const tiles = 4;
            for (let i = 0; i < tiles; i++) for (let j = 0; j < tiles; j++) box(group, w / tiles - 0.02, 0.04, d / tiles - 0.02, kidMats[(i + j) % kidMats.length], -w / 2 + (w / tiles) * (i + 0.5), 0.02, -d / 2 + (d / tiles) * (j + 0.5), false);
            // Low fence, a slide and a ball pit.
            for (const [x, z, fw, fd] of [[0, -d / 2, w, 0.05], [0, d / 2, w * 0.6, 0.05], [-w / 2, 0, 0.05, d], [w / 2, 0, 0.05, d]] as const) box(group, fw, 0.6, fd, M.ivory, x, 0.3, z);
            box(group, 0.8, 1.0, 0.8, kidMats[1], -w / 4, 0.5, -d / 4);
            { const slide = box(group, 0.6, 0.05, 1.6, kidMats[2], -w / 4, 0.55, -d / 4 + 1.05); slide.rotation.x = 0.6; }
            cyl(group, 0.85, 0.4, kidMats[3], w / 4, 0.2, d / 6);
            balls(group, kidMats[0], Array.from({ length: pro ? 40 : 12 }, (_, i) => { const a = i * 2.4, rr = 0.7 * Math.sqrt(((i * 7) % 10) / 10); return [w / 4 + Math.cos(a) * rr, 0.42, d / 6 + Math.sin(a) * rr, 0.07]; }));
            return 1.6;
          }
          case 'arch_gate': {
            const h = Math.min(2.4, (ceilingM || 6) - 1.2), R = w / 2;
            for (const x of [-R, R]) { box(group, 0.36, 0.2, 0.36, pro ? M.gold : M.ivory, x, 0.1); cyl(group, 0.13, h, M.ivory, x, 0.2 + h / 2); }
            const arc = new THREE.Mesh(own(new THREE.TorusGeometry(R, 0.12, 10, 32, Math.PI)), pro ? M.gold : M.ivory);
            arc.position.y = 0.2 + h; arc.castShadow = true; group.add(arc);
            if (pro) { for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); rose(group, 0.13, i % 3 ? M.flower : M.flowerAccent, Math.cos(a) * R, 0.2 + h + Math.sin(a) * R, 0.1); } for (const x of [-R, R]) flowerCluster(group, x, 0.5, 0.25, 0.25); }
            return h + R + 0.7;
          }
        }
        if (!pro) return null;
        switch (item.type) {
          case 'royal_chairs': {
            for (const x of [-0.5, 0.5]) {
              box(group, 0.75, 0.48, 0.7, M.velvet, x, 0.24); box(group, 0.82, 0.05, 0.76, M.gold, x, 0.49);
              box(group, 0.75, 1.0, 0.12, M.velvet, x, 1.0, -0.3); box(group, 0.85, 0.1, 0.16, M.gold, x, 1.53, -0.3);
              sph(group, 0.09, M.gold, x, 1.65, -0.3);
              for (const sx of [-0.4, 0.4]) box(group, 0.07, 0.6, 0.7, M.gold, x + sx, 0.42);
            }
            flowerCluster(group, 0, 0.55, -0.1, 0.18);
            return 2.1;
          }
          case 'ice_sculpture': {
            box(group, w, 0.025, d, M.linen, 0, 0.75); box(group, w, 0.73, d, M.linen, 0, 0.365);
            box(group, 0.6, 0.15, 0.4, M.ice, 0, 0.84);
            const body = sph(group, 0.28, M.ice, 0, 1.1, 0); body.scale.set(0.28, 0.2, 0.18);
            const neck = new THREE.Mesh(own(new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI * 0.9)), M.ice); neck.position.set(0.12, 1.32, 0); neck.rotation.z = -0.3; group.add(neck);
            sph(group, 0.07, M.ice, -0.06, 1.48, 0);
            for (const s of [-1, 1]) { const wing = sph(group, 0.2, M.ice, -0.08, 1.2, s * 0.16); wing.scale.set(0.24, 0.12, 0.05); wing.rotation.z = 0.5; }
            for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; cyl(group, 0.03, 0.1, M.candle, Math.cos(a) * 0.45, 0.82, Math.sin(a) * 0.3, false); }
            return 2;
          }
          case 'floral_pillar': {
            cyl(group, 0.25, 0.08, M.gold, 0, 0.04); cyl(group, 0.12, 1.8, M.ivory, 0, 0.98);
            for (let i = 0; i < (richFlowers ? 18 : 8); i++) { const a = i * 0.9, y = 0.3 + i * (1.5 / (richFlowers ? 18 : 8)); rose(group, 0.1, i % 3 ? M.flower : M.flowerAccent, Math.cos(a) * 0.15, y, Math.sin(a) * 0.15); }
            cyl(group, 0.25, 0.06, M.gold, 0, 1.9); flowerCluster(group, 0, 2.15, 0, 0.32);
            return 2.8;
          }
          case 'floral_swing': {
            const h = 2.5;
            for (const x of [-w / 2, w / 2]) { rod(group, M.gold, x, 0, -d / 2 + 0.1, x, h, 0, 0.04); rod(group, M.gold, x, 0, d / 2 - 0.1, x, h, 0, 0.04); }
            rod(group, M.gold, -w / 2, h, 0, w / 2, h, 0, 0.05);
            for (const x of [-0.6, 0.6]) rod(group, M.ivory, x, h, 0, x, 0.65, 0, 0.012);
            box(group, 1.4, 0.06, 0.5, M.ivory, 0, 0.62); box(group, 1.4, 0.45, 0.05, M.ivory, 0, 0.88, -0.22);
            for (let i = 0; i < 14; i++) rose(group, 0.12, i % 3 ? M.flower : M.flowerAccent, -w / 2 + (w / 13) * i, h + 0.05, 0.05);
            for (const x of [-0.6, 0.6]) for (let k = 0; k < 6; k++) rose(group, 0.08, k % 2 ? M.leaf : M.flower, x, 0.8 + k * 0.28, 0.02);
            return h + 0.6;
          }
          case 'pergola': {
            const h = Math.min(2.6, (ceilingM || 6) - 0.3);
            for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) { box(group, 0.12, h, 0.12, M.ivory, x, h / 2, z); box(group, 0.25, 0.08, 0.25, M.gold, x, 0.04, z); }
            for (const z of [-d / 2, d / 2]) box(group, w + 0.3, 0.12, 0.12, M.ivory, 0, h, z);
            for (let i = 0; i <= 5; i++) box(group, 0.08, 0.08, d + 0.3, M.ivory, -w / 2 + (w / 5) * i, h + 0.1, 0);
            const drape = mesh(group, own(new THREE.PlaneGeometry(w, d)), std(style.linen, 0.85, 0, { side: THREE.DoubleSide, transparent: true, opacity: 0.6 }), [0, h + 0.16, 0], undefined, false); drape.rotation.x = -Math.PI / 2;
            for (let i = 0; i < (richFlowers ? 22 : 10); i++) { const t = i / ((richFlowers ? 22 : 10) - 1); rose(group, 0.13, i % 3 ? M.flower : M.flowerAccent, -w / 2 + w * t, h + 0.05, -d / 2); if (i % 2 === 0) rose(group, 0.11, M.leaf, -w / 2 + w * t, h - 0.08, -d / 2 + 0.05); }
            for (const x of [-w / 2, w / 2]) flowerCluster(group, x, h - 0.1, -d / 2, 0.35);
            return h + 0.7;
          }
          case 'water_fountain': {
            const r = w / 2;
            cyl(group, r, 0.35, M.ivory, 0, 0.175); cyl(group, r - 0.08, 0.02, M.water, 0, 0.34, 0, false);
            cyl(group, 0.12, 0.9, M.ivory, 0, 0.7); cyl(group, r * 0.45, 0.12, M.ivory, 0, 1.15); cyl(group, r * 0.4, 0.02, M.water, 0, 1.21, 0, false);
            cyl(group, 0.06, 0.35, M.ivory, 0, 1.35);
            const jet = mesh(group, own(new THREE.ConeGeometry(0.16, 0.6, 12, 1, true)), M.water, [0, 1.75, 0], undefined, false); jet.rotation.x = Math.PI;
            const fall = new THREE.Mesh(own(new THREE.CylinderGeometry(r * 0.42, r * 0.55, 0.85, 24, 1, true)), M.water); fall.position.y = 0.78; group.add(fall);
            return 2.3;
          }
          case 'neon_sign': {
            for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) { cyl(group, 0.12, 0.02, M.black, x, 0.01); cyl(group, 0.015, 1.6, M.black, x, 0.8); }
            box(group, w, 0.8, 0.02, M.glass, 0, 1.6);
            mesh(group, own(new THREE.PlaneGeometry(w * 0.95, w * 0.475)), std('#FFFFFF', 0.4, 0, { map: neonTex, transparent: true, emissive: new THREE.Color('#FFFFFF'), emissiveMap: neonTex, emissiveIntensity: 2.6 }), [0, 1.6, 0.02], undefined, false);
            return 2.4;
          }
        }
        return null;
      };

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
          floorMesh.material.emissive = new THREE.Color('#000000');
          danceMats.push(floorMesh.material);
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
          for (let i = 0; i <= n; i++) rose(group, 0.16, i % 3 ? M.flower : M.flowerAccent, -w / 2 + (w / n) * i, h + 0.12, 0.05);
          for (const x of [-w / 2, w / 2]) for (let i = 0; i < 6; i++) rose(group, 0.14, i % 2 ? M.leaf : M.flower, x, 0.3 + i * (h / 6), 0.18);
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
        } else if (pro && item.type === 'cake') {
          // Round cake table with a skirt, a four-tier cake with gold bands, cascading roses and candles.
          const r = w / 2;
          mesh(group, unitCyl, M.linen, [0, 0.75, 0], [r, 0.025, r]);
          const skirt = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r + 0.08, 0.74, 40, 1, true)), M.linen);
          skirt.position.y = 0.37; skirt.castShadow = true; group.add(skirt);
          let y = 0.77;
          const tiers = [0.3, 0.24, 0.18, 0.12];
          tiers.forEach((tr2, i) => {
            const th = 0.2 - i * 0.015;
            cyl(group, tr2, th, M.icing, 0, y + th / 2);
            cyl(group, tr2 + 0.004, 0.02, M.gold, 0, y + 0.012, 0, false);
            for (let k = 0; k < 3; k++) { const a = i * 1.3 + k * 0.5; rose(group, 0.05, k % 2 ? M.flowerAccent : M.flower, Math.cos(a) * (tr2 + 0.01), y + th * 0.6, Math.sin(a) * (tr2 + 0.01)); }
            y += th;
          });
          flowerCluster(group, 0, y + 0.06, 0, 0.09);
          for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; cyl(group, 0.025, 0.12, M.candle, Math.cos(a) * (r - 0.12), 0.83, Math.sin(a) * (r - 0.12), false); }
          labelY = y + 0.5;
        } else if (pro && item.type === 'dj') {
          // DJ booth: glowing LED front, decks and a mixer, tall speakers either side.
          box(group, w, 1.0, d, M.black, 0, 0.5);
          mesh(group, own(new THREE.PlaneGeometry(w - 0.1, 0.8)), M.led, [0, 0.5, d / 2 + 0.006], undefined, false);
          box(group, w + 0.06, 0.04, d + 0.06, M.gold, 0, 1.02);
          for (const x of [-w * 0.28, w * 0.28]) { cyl(group, 0.16, 0.03, M.silver, x, 1.06, 0); cyl(group, 0.14, 0.012, M.black, x, 1.08, 0, false); }
          box(group, 0.35, 0.06, 0.3, M.silver, 0, 1.07);
          for (const x of [-w / 2 - 0.45, w / 2 + 0.45]) {
            box(group, 0.5, 1.6, 0.45, M.black, x, 0.8);
            for (const [yy, rr] of [[0.5, 0.17], [1.15, 0.1]] as const) { const cone = mesh(group, unitCyl, M.silver, [x, yy, 0.23], [rr, 0.01, rr], false); cone.rotation.x = Math.PI / 2; }
          }
          labelY = 2;
        } else if (pro && item.type === 'photo_booth') {
          // Flower wall with a glowing sign, plus a ring light on a stand.
          const ph = 2.4;
          box(group, w, ph, 0.14, M.backdrop, 0, ph / 2, 0);
          if (richFlowers) {
            const cols = Math.max(4, Math.round(w / 0.17)), rows = Math.round(ph / 0.17);
            for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
              const list = (i * 3 + j * 5) % 7 === 0 ? roseBatch.accent : roseBatch.main;
              const jitter = ((i * 31 + j * 17) % 10) / 100;
              pushOriented(list, -w / 2 + (w / cols) * (i + 0.5), (ph / rows) * (j + 0.5), 0.1 + jitter, 0, 0.2, 1, 0.075 + jitter * 0.2, i + j);
            }
          } else box(group, w - 0.1, ph - 0.1, 0.02, M.flower, 0, ph / 2, 0.08, false);
          M.sign = M.sign || std('#FFFFFF', 0.4, 0, { map: signTexture, transparent: true, emissive: new THREE.Color('#FFFFFF'), emissiveMap: signTexture, emissiveIntensity: 2.4 });
          mesh(group, own(new THREE.PlaneGeometry(Math.min(2.2, w * 0.7), Math.min(2.2, w * 0.7) * 0.35)), M.sign, [0, ph * 0.62, 0.22], undefined, false);
          const ring = new THREE.Mesh(own(new THREE.TorusGeometry(0.22, 0.025, 8, 32)), M.warmGlow);
          ring.position.set(w / 2 - 0.2, 1.6, d - 0.2); group.add(ring);
          cyl(group, 0.015, 1.5, M.black, w / 2 - 0.2, 0.75, d - 0.2);
          labelY = ph + 0.5;
        } else if (pro && item.type === 'flower_arch') {
          // Round arch ring covered in roses, on a gold base.
          const R = Math.min(1.3, w / 2), cy = R + 0.25;
          const ringMesh = new THREE.Mesh(own(new THREE.TorusGeometry(R, 0.04, 8, 48)), M.gold);
          ringMesh.position.y = cy; ringMesh.castShadow = true; group.add(ringMesh);
          box(group, R * 1.6, 0.08, 0.5, M.gold, 0, 0.04);
          // Roses cover the top and the left side heavily, lighter elsewhere; the bottom stays open.
          const n = richFlowers ? 90 : 24;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            if (Math.sin(a) < -0.8) continue;
            const heavy = Math.sin(a) > 0.1 || Math.cos(a) < -0.5;
            if (!heavy && i % 3) continue;
            for (let k = 0; k < (heavy && richFlowers ? 2 : 1); k++) {
              const rr = R + (k ? 0.09 : -0.02), off = k ? -0.06 : 0.06;
              rose(group, heavy ? 0.21 : 0.17, (i + k) % 4 ? M.flower : M.flowerAccent, Math.cos(a + k * 0.03) * rr, cy + Math.sin(a + k * 0.03) * rr, off);
            }
            if (i % 2 === 0) rose(group, 0.14, M.leaf, Math.cos(a) * (R + 0.12), cy + Math.sin(a) * (R + 0.12), -0.02);
          }
          labelY = cy + R + 0.5;
        } else if (pro && item.type === 'aisle') {
          // Runner with candle lanterns and short flower stands on both sides.
          box(group, Math.max(0.8, w - 0.4), 0.012, d, M.runner, 0, 0.006, 0, false);
          const steps = Math.max(2, Math.floor(d / 1.5));
          for (let i = 0; i <= steps; i++) {
            const z = -d / 2 + (d / steps) * i;
            for (const x of [-w / 2, w / 2]) {
              if (i % 2 === 0) { cyl(group, 0.15, 0.03, M.gold, x, 0.015, z); cyl(group, 0.02, 0.7, M.gold, x, 0.35, z); flowerCluster(group, x, 0.85, z, 0.2); }
              else { cyl(group, 0.1, 0.32, M.glass, x, 0.16, z, false); cyl(group, 0.04, 0.12, M.candle, x, 0.08, z, false); }
            }
          }
          labelY = 1.4;
        } else if (pro && item.type === 'cocktail') {
          // High table in a stretch cover, with a candle.
          cyl(group, w / 2, 0.03, M.linen, 0, 1.08);
          const cover = new THREE.Mesh(own(new THREE.CylinderGeometry(w / 2, w / 2 - 0.05, 1.06, 28, 1, true)), M.linen);
          cover.position.y = 0.53; cover.castShadow = true; group.add(cover);
          cyl(group, w / 2 - 0.02, 0.02, M.runner, 0, 0.54, 0, false);
          cyl(group, 0.06, 0.12, M.glass, 0, 1.16, 0, false); cyl(group, 0.025, 0.08, M.candle, 0, 1.14, 0, false);
          labelY = 1.6;
        } else if (pro && item.type === 'champagne') {
          // Round table and a five-level coupe tower.
          const r = w / 2;
          mesh(group, unitCyl, M.linen, [0, 0.75, 0], [r, 0.025, r]);
          const skirt = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r + 0.06, 0.74, 32, 1, true)), M.linen);
          skirt.position.y = 0.37; group.add(skirt);
          const spots: { x: number; y: number; z: number; ry: number }[] = [];
          const levels = 5, pitch = 0.11;
          for (let L = 0; L < levels; L++) { const n = levels - L; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) spots.push({ x: (i - (n - 1) / 2) * pitch, y: 0.77 + L * 0.11, z: (j - (n - 1) / 2) * pitch, ry: 0 }); }
          instanced(group, coupeGeo, M.glass, spots, false);
          instanced(group, wineGeo, M.champagne, spots, false);
          labelY = 0.77 + levels * 0.11 + 0.5;
        } else if (pro && item.type === 'sweets') {
          // Dessert table: cake stands with glass domes, sweets and a low flower runner.
          box(group, w, 0.025, d, M.linen, 0, 0.75); box(group, w, 0.73, d, M.linen, 0, 0.365);
          box(group, w * 0.92, 0.006, Math.min(0.3, d * 0.4), M.runner, 0, 0.766, 0, false);
          const n = Math.max(3, Math.floor(w / 0.55));
          const sweet: { x: number; y: number; z: number; ry: number }[] = [];
          for (let i = 0; i < n; i++) {
            const x = -w / 2 + (w / n) * (i + 0.5), hh = 0.12 + (i % 2) * 0.12;
            cyl(group, 0.02, hh, M.gold, x, 0.76 + hh / 2); cyl(group, 0.17, 0.015, M.gold, x, 0.77 + hh);
            for (let k = 0; k < 7; k++) { const a = k * 0.9; sweet.push({ x: x + Math.cos(a) * 0.09, y: 0.8 + hh, z: Math.sin(a) * 0.09, ry: 0 }); }
            if (i % 2 === 0) { const dome = new THREE.Mesh(domeGeo, M.glass); dome.position.set(x, 0.775 + hh, 0); group.add(dome); }
          }
          instanced(group, sweetGeo, M.flowerAccent, sweet, false);
          flowerCluster(group, 0, 0.86, 0.18, 0.16);
          labelY = 1.5;
        } else if (pro && item.type === 'sparklers') {
          // Cold spark fountain: the machine, and sparks that fire in Party lighting.
          box(group, 0.36, 0.22, 0.36, M.black, 0, 0.11);
          cyl(group, 0.05, 0.04, M.silver, 0, 0.24);
          const count = lite ? 60 : 160;
          const geo = new THREE.BufferGeometry();
          const posArr = new Float32Array(count * 3);
          geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
          const pts = new THREE.Points(geo, sparkMat);
          pts.position.y = 0.26; pts.frustumCulled = false; pts.visible = false;
          pts.userData.ownGeo = true;
          group.add(pts);
          sparks.push({ pts, pos: posArr, vel: new Float32Array(count * 3), life: new Float32Array(count).map(() => Math.random()) });
          labelY = 0.9;
        } else if (pro && item.type === 'love_letters') {
          // Marquee letters L O V E with glowing bulbs.
          const lh = 1.0, lw = Math.min(0.7, w / 4.4), gap = (w - lw * 4) / 3, t = 0.12, dz = 0.12;
          const bulbs: { x: number; y: number; z: number; ry: number }[] = [];
          const stroke = (x0: number, y0: number, x1: number, y1: number) => {
            const len = Math.hypot(x1 - x0, y1 - y0);
            const m = mesh(group, unitBox, M.gold, [(x0 + x1) / 2, (y0 + y1) / 2, 0], [t, len + t, dz]);
            m.rotation.z = -Math.atan2(x1 - x0, y1 - y0);
            const nb = Math.max(2, Math.round(len / 0.14));
            for (let i = 0; i <= nb; i++) bulbs.push({ x: x0 + ((x1 - x0) * i) / nb, y: y0 + ((y1 - y0) * i) / nb, z: dz / 2 + 0.02, ry: 0 });
          };
          const lx = (k: number) => -w / 2 + k * (lw + gap);
          const b = 0.05;
          // L
          stroke(lx(0), b, lx(0), b + lh); stroke(lx(0), b, lx(0) + lw, b);
          // O
          { const cx = lx(1) + lw / 2, cy = b + lh / 2; const o = new THREE.Mesh(own(new THREE.TorusGeometry(lw / 2 - t / 2, t / 2, 8, 32)), M.gold); o.position.set(cx, cy, 0); o.scale.set(1, lh / lw, 1); o.castShadow = true; group.add(o);
            for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; bulbs.push({ x: cx + Math.cos(a) * (lw / 2 - t / 2), y: cy + Math.sin(a) * (lw / 2 - t / 2) * (lh / lw), z: dz / 2 + 0.02, ry: 0 }); } }
          // V
          stroke(lx(2), b + lh, lx(2) + lw / 2, b); stroke(lx(2) + lw / 2, b, lx(2) + lw, b + lh);
          // E
          stroke(lx(3), b, lx(3), b + lh); stroke(lx(3), b + lh, lx(3) + lw, b + lh); stroke(lx(3), b + lh / 2, lx(3) + lw * 0.8, b + lh / 2); stroke(lx(3), b, lx(3) + lw, b);
          instanced(group, bulbGeo2, M.warmGlow, bulbs, false);
          labelY = lh + 0.6;
        } else if (pro && item.type === 'ceiling_florals') {
          // A cloud of roses hanging from the ceiling with trailing strands.
          const top = outdoor ? 4.2 : Math.max(2.6, ceilingM) - 0.25;
          const r = Math.min(w, d) / 2;
          cyl(group, 0.01, 0.25, M.gold, 0, top + 0.12, 0, false);
          flowerCluster(group, 0, top - r * 0.35, 0, r * 0.55);
          const strands = richFlowers ? 14 : 6;
          for (let i = 0; i < strands; i++) {
            const a = (i / strands) * Math.PI * 2, rr = r * (0.5 + (i % 3) * 0.17);
            const len = 0.6 + (i % 4) * 0.25;
            for (let k = 0; k < 5; k++) rose(group, 0.1, k % 2 ? M.flowerAccent : M.flower, Math.cos(a) * rr, top - r * 0.4 - (len * k) / 5, Math.sin(a) * rr);
          }
          labelY = top - r - 1.2;
        } else if (pro && item.type === 'gift_table') {
          // Gift boxes with ribbons, a guestbook, a lantern and flowers.
          box(group, w, 0.025, d, M.linen, 0, 0.75); box(group, w, 0.73, d, M.linen, 0, 0.365);
          const gifts: [number, number, number, string][] = [[-w * 0.32, 0.28, 0.24, '#F4F1EA'], [-w * 0.18, 0.2, 0.18, style.flowerAccent], [-w * 0.3, 0.16, 0.14, style.runner]];
          gifts.forEach(([x, gw, gh, c], i) => { const gm = std(c, 0.6); box(group, gw, gh, gw, gm, x, 0.762 + gh / 2 + (i === 2 ? 0.24 : 0), i === 2 ? 0.02 : 0); box(group, gw + 0.01, gh + 0.01, 0.03, M.gold, x, 0.762 + gh / 2 + (i === 2 ? 0.24 : 0), i === 2 ? 0.02 : 0, false); });
          box(group, 0.36, 0.03, 0.26, M.ivory, w * 0.12, 0.78); box(group, 0.36, 0.005, 0.02, M.gold, w * 0.12, 0.8, 0.0, false);
          cyl(group, 0.08, 0.3, M.glass, w * 0.36, 0.91, 0, false); cyl(group, 0.03, 0.1, M.candle, w * 0.36, 0.82, 0, false);
          flowerCluster(group, -w * 0.02, 0.88, -0.1, 0.14);
          labelY = 1.5;
        } else {
          const extraY = buildExtra(group, item, w, d);
          if (extraY === null) { box(group, w, 0.9, d, M.ivory, 0, 0.45); labelY = 1.4; } else labelY = extraY;
        }

        if (item.type === 'table' && pro && guestsRef.current) addGuests(group, item);
        flushRoses(group);
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
          if (child.userData?.ownGeo) child.geometry?.dispose?.();
        });
      };

      const rebuild = () => {
        while (itemRoot.children.length) { const child = itemRoot.children[0]; itemRoot.remove(child); disposeObject(child); }
        for (let i = labelSprites.length - 1; i >= 0; i--) if (!isInScene(labelSprites[i])) labelSprites.splice(i, 1);
        tableNumbers.clear();
        danceMats.length = 0;
        sparks.length = 0;
        let n = 0;
        itemsRef.current.forEach((item) => { if (item.type === 'table') tableNumbers.set(item.id, ++n); });
        // Draw floor-level items first so tables sit visually on top of dance floors.
        [...itemsRef.current].sort((a, b) => (a.type === 'dance' ? -1 : 0) - (b.type === 'dance' ? -1 : 0)).forEach((item) => itemRoot.add(buildItem(item)));
        applyMeasure();
        scaleLabels();
        placeRig();
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
      const outlineGroup = new THREE.Group();
      outlineGroup.add(outline);
      scene.add(outlineGroup);
      const outlines = [outline];

      // ── Pro lighting scenes: warm pools of light for Evening, moving colour beams for Party ──
      const lightTop = outdoor ? 4.4 : Math.max(2.4, ceilingM) - 0.3;
      const warmLights: any[] = [];
      const warmCount = !pro ? 0 : lite ? 2 : 4;
      for (let i = 0; i < warmCount; i++) {
        const l = new THREE.PointLight(0xffc27a, 0, Math.max(W, D) * 0.75, 1.6);
        const cx = warmCount === 2 ? 0 : (i % 2 ? 1 : -1) * W / 4;
        const cz = warmCount === 2 ? (i ? 1 : -1) * D / 4 : (i < 2 ? -1 : 1) * D / 4;
        l.position.set(cx, Math.min(lightTop - 0.4, 2.8), cz);
        scene.add(l); warmLights.push(l);
      }
      const partyColors = [0xff3d8b, 0x3db8ff, 0xb05cff, 0xffc43d, 0x3dffb4, 0xff6a3d];
      const beamCount = !pro ? 0 : lite ? 3 : 6;
      const beamGroup = new THREE.Group();
      beamGroup.visible = false;
      scene.add(beamGroup);
      const beamLen = lightTop;
      const beamGeo = own(new THREE.ConeGeometry(1.15, beamLen, 24, 1, true));
      beamGeo.translate(0, -beamLen / 2, 0);
      const beams: { pivot: any; mat: any; phase: number }[] = [];
      for (let i = 0; i < beamCount; i++) {
        const mat = own(new THREE.MeshBasicMaterial({ color: partyColors[i % partyColors.length], transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        const pivot = new THREE.Group();
        const cone = new THREE.Mesh(beamGeo, mat);
        pivot.add(cone);
        const head = new THREE.Mesh(own(new THREE.SphereGeometry(0.12, 10, 8)), own(new THREE.MeshBasicMaterial({ color: partyColors[i % partyColors.length] })));
        pivot.add(head);
        beamGroup.add(pivot);
        beams.push({ pivot, mat, phase: (i / Math.max(1, beamCount)) * Math.PI * 2 });
      }
      const spots: any[] = [];
      if (pro && !lite) for (let i = 0; i < 2; i++) {
        const sp = new THREE.SpotLight(partyColors[i], 0, Math.max(W, D), 0.45, 0.6, 1.2);
        sp.position.set(0, lightTop, 0);
        scene.add(sp); scene.add(sp.target); spots.push(sp);
      }
      const rig = { cx: 0, cz: -D * 0.15, r: 3 };
      const placeRig = () => {
        const dance = itemsRef.current.find((it) => it.type === 'dance');
        if (dance) {
          const { w, d } = itemSize(dance);
          rig.cx = ((dance.x - 50) / 100) * W; rig.cz = ((dance.y - 50) / 100) * D; rig.r = Math.max(1.5, Math.min(w, d) / 2);
        }
        beams.forEach((b, i) => {
          const a = b.phase;
          b.pivot.position.set(rig.cx + Math.cos(a) * (rig.r + 1.2), lightTop, rig.cz + Math.sin(a) * (rig.r + 1.2) * (i % 2 ? 1 : 0.8));
        });
      };
      const MOODS: Record<Mood3D, { hemi: number; amb: number; key: number; env: number; warm: number; glow: number; wash: number; exposure: number; bg: number }> = {
        day: { hemi: envTexture ? (outdoor ? 0.9 : 1.15) : outdoor ? 1.1 : 1.5, amb: 0.18, key: outdoor ? 1.6 : 2.0, env: 0.45, warm: 0, glow: 1, wash: 0.55, exposure: outdoor ? 0.95 : 1.05, bg: 0x0d0d0f },
        evening: { hemi: 0.32, amb: 0.06, key: outdoor ? 0.25 : 0.35, env: 0.12, warm: lite ? 30 : 16, glow: 1.8, wash: 0.95, exposure: 1.05, bg: outdoor ? 0x090c16 : 0x0a0a0c },
        party: { hemi: 0.09, amb: 0.03, key: 0.08, env: 0.05, warm: lite ? 8 : 4, glow: 1.4, wash: 1, exposure: 1.2, bg: outdoor ? 0x07060f : 0x060608 },
      };
      const applyMood = (m: Mood3D) => {
        if (!pro) return;
        const c = MOODS[m];
        hemi.intensity = c.hemi; ambient.intensity = c.amb; key.intensity = c.key;
        if (envTexture) scene.environmentIntensity = c.env;
        warmLights.forEach((l) => { l.intensity = c.warm; });
        M.warmGlow.emissiveIntensity = 2.2 * c.glow;
        M.candle.emissiveIntensity = 0.9 * c.glow;
        if (M.crystal) M.crystal.emissiveIntensity = 0.7 * c.glow;
        if (M.ceiling) M.ceiling.emissiveIntensity = m === 'day' ? 1.2 : m === 'evening' ? 1.6 : 0.8;
        washMat.opacity = c.wash;
        if (m !== 'party') washMat.color.set(style.uplight);
        renderer.toneMappingExposure = c.exposure;
        // Only real light sources glow (bulbs, candles, beams); the threshold sits above anything merely lit.
        if (bloom) { bloom.strength = m === 'day' ? 0.25 : m === 'evening' ? 0.55 : 0.8; bloom.threshold = m === 'day' ? 3.2 : m === 'evening' ? 1.8 : 1.1; bloom.radius = 0.45; bloom.enabled = m !== 'day'; }
        scene.background = new THREE.Color(c.bg);
        fog.color.set(c.bg);
        beamGroup.visible = m === 'party';
        spots.forEach((sp) => { sp.intensity = m === 'party' ? 120 : 0; });
        if (m !== 'party') danceMats.forEach((mat) => { mat.emissive.set('#000000'); mat.emissiveIntensity = 0; });
      };

      rebuild();
      applyMood(moodRef.current);

      // ── Controls ──
      const orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.dampingFactor = 0.08;
      orbit.maxDistance = Math.max(W, D) * 3;
      orbit.minDistance = 2;
      const walk = { active: false, yaw: 0, pitch: 0, height: 1.6, tween: null as null | { t: number; from: { x: number; y: number; z: number; yaw: number; pitch: number }; to: { x: number; y: number; z: number; yaw: number; pitch: number } } };
      orbit.autoRotateSpeed = 0.7;
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
          walk.yaw = 0; walk.pitch = -0.06; walk.height = 1.6; walk.tween = null;
          camera.position.set(0, 1.6, D / 2 - 1.6);
        }
        orbit.autoRotate = next === '3d' && tourRef.current;
        const shot = shotRef.current;
        shotRef.current = null;
        if (shot) goShot(shot, next === 'walk' ? false : true);
        scaleLabels();
      };

      // ── Pro camera shots ──
      const worldOf = (item: LayoutItem) => ({ x: ((item.x - 50) / 100) * W, z: ((item.y - 50) / 100) * D });
      const yawTo = (fx: number, fz: number, tx: number, tz: number) => Math.atan2(-(tx - fx), -(tz - fz));
      const clampIn = (v: number, half: number) => Math.max(-half + 0.5, Math.min(half - 0.5, v));
      const shotPose = (shot: Shot3D) => {
        const list = itemsRef.current;
        const stage = list.find((it) => it.type === 'stage');
        const st = stage ? worldOf(stage) : { x: 0, z: -D / 2 + 3 };
        if (shot === 'stage' && stage) {
          // From the kosha sofa, at seated eye height on the stage, looking out at the guests.
          const { d } = itemSize(stage);
          const r = -(stage.rotation * Math.PI) / 180;
          const lx = 0, lz = -d / 2 + 1.5;
          const x = st.x + lx * Math.cos(r) + lz * Math.sin(r);
          const z = st.z - lx * Math.sin(r) + lz * Math.cos(r);
          const ax = st.x + Math.sin(r) * 10, az = st.z + Math.cos(r) * 10;
          return { x: clampIn(x, W / 2), y: 0.6 + 1.25, z: clampIn(z, D / 2), yaw: yawTo(x, z, ax, az), pitch: 0.12 };
        }
        if (shot === 'guest') {
          // From the far side of a mid-room table, seated, facing the stage.
          const tables = list.filter((it) => it.type === 'table').map((it) => ({ it, p: worldOf(it) }));
          if (tables.length) {
            tables.sort((a, b) => Math.hypot(a.p.x - st.x, a.p.z - st.z) - Math.hypot(b.p.x - st.x, b.p.z - st.z));
            const { it, p } = tables[Math.floor(tables.length * 0.45)];
            // Sit at the side of the table (not behind the centrepiece), towards the middle of the hall.
            const dx = p.x - st.x, dz = p.z - st.z, len = Math.hypot(dx, dz) || 1;
            const off = itemSize(it).w / 2 + 1.15;
            const side = p.x > 0 ? -1 : 1;
            const px = (-dz / len) * side, pz = (dx / len) * side;
            const x = clampIn(p.x + px * off + (dx / len) * 0.3, W / 2), z = clampIn(p.z + pz * off + (dz / len) * 0.3, D / 2);
            return { x, y: 1.3, z, yaw: yawTo(x, z, st.x, st.z), pitch: -0.05 };
          }
        }
        // Entrance (also the fallback): a step inside the entrance arch, looking at the stage.
        const ent = list.find((it) => it.type === 'entrance');
        const e = ent ? worldOf(ent) : { x: 0, z: D / 2 - 1 };
        const dx = st.x - e.x, dz = st.z - e.z, len = Math.hypot(dx, dz) || 1;
        const x = clampIn(e.x + (dx / len) * 1.2, W / 2), z = clampIn(e.z + (dz / len) * 1.2, D / 2);
        return { x, y: 1.65, z, yaw: yawTo(x, z, st.x, st.z), pitch: -0.05 };
      };
      const goShot = (shot: Shot3D, instant = false) => {
        if (shot === 'aerial') {
          const dist = Math.max(W, D) * (camera.aspect < 0.9 ? 1.25 : 0.78);
          camera.position.set(-W * 0.38, dist * 0.8, D * 0.58);
          orbit.target.set(0, 0, -D * 0.06);
          orbit.update();
          return;
        }
        const to = shotPose(shot);
        const from = { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: walk.yaw, pitch: walk.pitch };
        if (instant) { walk.tween = null; Object.assign(walk, { yaw: to.yaw, pitch: to.pitch, height: to.y }); camera.position.set(to.x, to.y, to.z); return; }
        // Turn the short way round.
        let dy = to.yaw - from.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        walk.tween = { t: 0, from, to: { ...to, yaw: from.yaw + dy } };
      };

      // ── Pro HD photo: renders at high resolution and adds an ELSARAYA EVENTS caption strip ──
      const snapshot = async (info: { title: string; detail: string }) => {
        const r = host.getBoundingClientRect();
        const targetW = lite ? 1600 : 2560;
        const ratio = Math.min(3, Math.max(1, targetW / Math.max(1, r.width)));
        renderer.setPixelRatio(ratio);
        renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
        if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(Math.max(1, r.width), Math.max(1, r.height)); }
        const wasVisible = outlineGroup.visible;
        outlineGroup.visible = false;
        draw();
        const shotCanvas = document.createElement('canvas');
        const cw = renderer.domElement.width, chh = renderer.domElement.height;
        const strip = Math.round(cw * 0.06);
        shotCanvas.width = cw; shotCanvas.height = chh + strip;
        const ctx = shotCanvas.getContext('2d')!;
        ctx.drawImage(renderer.domElement, 0, 0);
        outlineGroup.visible = wasVisible;
        renderer.setPixelRatio(basePixelRatio);
        renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
        if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(Math.max(1, r.width), Math.max(1, r.height)); }
        drawStrip(ctx, cw, chh, strip, info);
        return await new Promise<Blob | null>((resolve) => shotCanvas.toBlob(resolve, 'image/jpeg', 0.92));
      };
      const drawStrip = (ctx: CanvasRenderingContext2D, cw: number, chh: number, strip: number, info: { title: string; detail: string }) => {
        const g = ctx.createLinearGradient(0, chh, cw, chh);
        g.addColorStop(0, '#0D0D0F'); g.addColorStop(1, '#17140F');
        ctx.fillStyle = g; ctx.fillRect(0, chh, cw, strip);
        const gold = ctx.createLinearGradient(0, chh, cw, chh);
        gold.addColorStop(0, '#E9CF94'); gold.addColorStop(0.5, '#C49A52'); gold.addColorStop(1, '#8C6A2E');
        ctx.fillStyle = gold; ctx.fillRect(0, chh, cw, Math.max(2, strip * 0.04));
        const pad = strip * 0.45;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#E9CF94';
        ctx.font = `600 ${Math.round(strip * 0.34)}px "Readex Pro", "Cairo", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('ELSARAYA EVENTS', pad, chh + strip * 0.4);
        ctx.fillStyle = '#B9B4AA';
        ctx.font = `400 ${Math.round(strip * 0.2)}px "Readex Pro", "Cairo", sans-serif`;
        ctx.fillText(info.title, pad, chh + strip * 0.74);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#F4F1EA';
        ctx.font = `500 ${Math.round(strip * 0.24)}px "Readex Pro", "Cairo", sans-serif`;
        ctx.fillText(info.detail, cw - pad, chh + strip * 0.5);
      };

      // ── Pro video: records the cinematic tour (with the caption strip) to share with the client ──
      let rec: null | { ctx: CanvasRenderingContext2D; strip: HTMLCanvasElement; h: number } = null;
      const record = (seconds: number, info: { title: string; detail: string }, onProgress: (p: number) => void) => new Promise<{ blob: Blob; type: string } | null>((resolve) => {
        const src = renderer.domElement;
        const scale = Math.min(1, 1280 / Math.max(1, src.width));
        const cw = Math.round(src.width * scale / 2) * 2, chh = Math.round(src.height * scale / 2) * 2;
        const stripH = Math.round(Math.max(48, cw * 0.06) / 2) * 2;
        const out = document.createElement('canvas');
        out.width = cw; out.height = chh + stripH;
        const stripCanvas = document.createElement('canvas');
        stripCanvas.width = cw; stripCanvas.height = chh + stripH;
        drawStrip(stripCanvas.getContext('2d')!, cw, chh, stripH, info);
        const ctx = out.getContext('2d')!;
        const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
        const type = types.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t));
        if (!type || !(out as any).captureStream) { resolve(null); return; }
        const stream = (out as any).captureStream(30);
        const chunks: Blob[] = [];
        const mr = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: lite ? 2_500_000 : 6_000_000 });
        mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        mr.onstop = () => { rec = null; resolve(chunks.length ? { blob: new Blob(chunks, { type: type.split(';')[0] }), type: type.split(';')[0] } : null); };
        rec = { ctx, strip: stripCanvas, h: chh };
        const prevSpeed = orbit.autoRotateSpeed;
        orbit.autoRotateSpeed = 2.4;
        const start = performance.now();
        mr.start(500);
        const tick = () => {
          const p = (performance.now() - start) / (seconds * 1000);
          onProgress(Math.min(1, p));
          if (p >= 1) { orbit.autoRotateSpeed = prevSpeed; mr.stop(); return; }
          window.setTimeout(tick, 200);
        };
        tick();
      });

      // ── Picking, dragging and walk-look ──
      const stopTour = () => stopTourRef.current();
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      let dragging: { id: string; group: any; offset: any; pointerId: number; mode: 'move' | 'rotate'; startClientX: number; startRotation: number; start: any; others: { id: string; group: any; start: any }[] } | null = null;
      let looking: { pointerId: number; x: number; y: number; yaw: number; pitch: number } | null = null;
      let dragRaf = 0;
      let pendingPointer: PointerEvent | null = null;
      const pointer = (e: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };
      const onPointerDown = (e: PointerEvent) => {
        if (tourRef.current) stopTour();
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
        // Bulk selection: Select mode or Shift/Ctrl adds or removes; dragging a selected item moves the whole selection.
        const current = selectedIdsRef.current?.length ? selectedIdsRef.current : selectedIdRef.current ? [selectedIdRef.current] : [];
        const wasSelected = current.includes(item.id);
        const toggle = multiRef.current || e.shiftKey || e.ctrlKey || e.metaKey;
        let groupIds: string[];
        if (toggle) {
          selectRef.current?.(item.id, true);
          if (wasSelected) return;
          groupIds = [...current, item.id];
        } else if (wasSelected && current.length > 1) groupIds = current;
        else { selectRef.current?.(item.id); groupIds = [item.id]; }
        const others = groupIds.filter((id) => id !== item.id).map((id) => itemRoot.children.find((child: any) => child.userData?.itemId === id)).filter(Boolean).map((g: any) => ({ id: g.userData.itemId as string, group: g, start: g.position.clone() }));
        if (rotationModeRef.current && !others.length) {
          dragging = { id: item.id, group, offset: null, pointerId: e.pointerId, mode: 'rotate', startClientX: e.clientX, startRotation: group.rotation.y, start: group.position.clone(), others: [] };
        } else {
          const point = new THREE.Vector3();
          if (!raycaster.ray.intersectPlane(floorPlane, point)) return;
          dragging = { id: item.id, group, offset: group.position.clone().sub(point), pointerId: e.pointerId, mode: 'move', startClientX: e.clientX, startRotation: group.rotation.y, start: group.position.clone(), others };
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
        for (const o of dragging.others) {
          o.group.position.x = Math.max(-W / 2 + 0.2, Math.min(W / 2 - 0.2, o.start.x + next.x - dragging.start.x));
          o.group.position.z = Math.max(-D / 2 + 0.2, Math.min(D / 2 - 0.2, o.start.z + next.z - dragging.start.z));
        }
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
          const pct = (p: any) => ({ x: Math.max(0, Math.min(100, (p.x / W) * 100 + 50)), y: Math.max(0, Math.min(100, (p.z / D) * 100 + 50)) });
          const moved = dragging.group.position.distanceTo(dragging.start) > 0.01;
          if (dragging.others.length) { if (moved) moveManyRef.current?.([{ id, ...pct(dragging.group.position) }, ...dragging.others.map((o) => ({ id: o.id, ...pct(o.group.position) }))]); }
          else if (moved) { const p = pct(dragging.group.position); moveRef.current?.(id, p.x, p.y); }
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
        if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(Math.max(1, r.width), Math.max(1, r.height)); }
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
          if (walk.tween) {
            // Glide to a camera shot.
            const tw = walk.tween;
            tw.t = Math.min(1, tw.t + dt / 1.1);
            const k = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - Math.pow(-2 * tw.t + 2, 2) / 2;
            camera.position.x = tw.from.x + (tw.to.x - tw.from.x) * k;
            camera.position.z = tw.from.z + (tw.to.z - tw.from.z) * k;
            walk.height = tw.from.y + (tw.to.y - tw.from.y) * k;
            walk.yaw = tw.from.yaw + (tw.to.yaw - tw.from.yaw) * k;
            walk.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * k;
            if (tw.t >= 1 || f || s || looking) walk.tween = null;
          } else if (f || s) walk.height += (1.6 - walk.height) * Math.min(1, dt * 3);
          camera.position.y = walk.height;
          const fx2 = -Math.sin(walk.yaw), fz2 = -Math.cos(walk.yaw);
          look.set(camera.position.x + fx2 * Math.cos(walk.pitch), walk.height - Math.sin(walk.pitch), camera.position.z + fz2 * Math.cos(walk.pitch));
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
        if (pro && moodRef.current === 'party') {
          const t = now / 1000;
          beams.forEach((b, i) => {
            b.pivot.rotation.x = Math.sin(t * 0.9 + b.phase) * 0.55;
            b.pivot.rotation.z = Math.cos(t * 0.7 + b.phase * 1.3) * 0.55;
            b.mat.opacity = 0.2 + 0.1 * (0.5 + 0.5 * Math.sin(t * 3 + i));
          });
          washMat.color.setHSL((t * 0.05) % 1, 0.85, 0.6);
          spots.forEach((sp, i) => { sp.target.position.set(rig.cx + Math.sin(t * 0.8 + i * 2) * rig.r, 0, rig.cz + Math.cos(t * 0.6 + i * 2) * rig.r); });
          danceMats.forEach((mat, i) => { mat.emissive.setHSL((t * 0.08 + i * 0.2) % 1, 0.8, 0.5); mat.emissiveIntensity = 0.35 + 0.2 * Math.sin(t * 4); });
        }
        const sparkOn = pro && moodRef.current === 'party';
        for (const sp of sparks) {
          sp.pts.visible = sparkOn;
          if (!sparkOn) continue;
          const n = sp.life.length;
          for (let i = 0; i < n; i++) {
            sp.life[i] -= dt * 0.9;
            const k = i * 3;
            if (sp.life[i] <= 0) {
              sp.life[i] = 0.6 + Math.random() * 0.6;
              sp.pos[k] = 0; sp.pos[k + 1] = 0; sp.pos[k + 2] = 0;
              const a = Math.random() * Math.PI * 2, spread = Math.random() * 0.35;
              sp.vel[k] = Math.cos(a) * spread; sp.vel[k + 1] = 4.2 + Math.random() * 1.6; sp.vel[k + 2] = Math.sin(a) * spread;
            }
            sp.vel[k + 1] -= 6 * dt;
            sp.pos[k] += sp.vel[k] * dt; sp.pos[k + 1] = Math.max(0, sp.pos[k + 1] + sp.vel[k + 1] * dt); sp.pos[k + 2] += sp.vel[k + 2] * dt;
          }
          sp.pts.geometry.attributes.position.needsUpdate = true;
        }
        const selectedGroup = selectedIdRef.current ? itemRoot.children.find((child: any) => child.userData?.itemId === selectedIdRef.current) : null;
        const allSelected = walk.active ? [] : (selectedIdsRef.current?.length ? selectedIdsRef.current : selectedIdRef.current ? [selectedIdRef.current] : []);
        let shown = 0;
        for (const id of allSelected) {
          const g = itemRoot.children.find((child: any) => child.userData?.itemId === id);
          if (!g) continue;
          if (!outlines[shown]) { const extra = new THREE.LineLoop(outlineGeo, outline.material); extra.renderOrder = 9; outlineGroup.add(extra); outlines.push(extra); }
          const o = outlines[shown++];
          const fp = g.userData.footprint || { w: 1, d: 1 };
          o.visible = true;
          o.position.set(g.position.x, 0.06, g.position.z);
          o.rotation.y = g.rotation.y;
          o.scale.set(fp.w + 0.2, 1, fp.d + 0.2);
        }
        for (let i = shown; i < outlines.length; i++) outlines[i].visible = false;
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
        draw();
        if (rec) {
          const c = rec.ctx.canvas;
          rec.ctx.drawImage(renderer.domElement, 0, 0, c.width, rec.h);
          rec.ctx.drawImage(rec.strip, 0, rec.h, c.width, c.height - rec.h, 0, rec.h, c.width, c.height - rec.h);
        }
      };
      raf = requestAnimationFrame(animate);

      // Dev only: lets the screenshot tests point the camera.
      if (import.meta.env.DEV) (window as any).__saraya3d = { camera, orbit, walk, W, D };
      engineRef.current = {
        rebuild, applyView, applyMeasure, applyMood, snapshot, record,
        shot: (shot: Shot3D) => goShot(shot),
        setTour: (on: boolean) => { orbit.autoRotate = on && viewRef.current === '3d'; },
      };
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
        envTexture?.dispose?.();
        bloom?.dispose?.();
        composer?.dispose?.();
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

  useEffect(() => { engineRef.current?.rebuild?.(); }, [items, guestsOn]);
  useEffect(() => { engineRef.current?.applyView?.(view); onViewChange?.(view); }, [view, ready]);
  useEffect(() => { engineRef.current?.applyMeasure?.(); }, [measure, ready]);
  useEffect(() => { engineRef.current?.applyMood?.(mood); }, [mood, ready]);
  useEffect(() => { moodChangeRef.current?.(mood); }, [mood]);
  useEffect(() => { if (initialMood) setMood(initialMood); }, [initialMood]);
  useEffect(() => { engineRef.current?.setTour?.(tour); }, [tour, ready, view]);
  stopTourRef.current = () => setTour(false);
  // Full screen: the browser's real full screen where it works, else the 3D fills the window (older tablets, iPhone).
  const rootRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState<'off' | 'native' | 'window'>('off');
  useEffect(() => {
    const doc = document as Document & { webkitFullscreenElement?: Element };
    const sync = () => { const el = doc.fullscreenElement || doc.webkitFullscreenElement; setFullscreen((f) => el === rootRef.current ? 'native' : f === 'native' ? 'off' : f); };
    document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync); };
  }, []);
  useEffect(() => {
    if (fullscreen !== 'window') return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen('off'); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [fullscreen]);
  const toggleFullscreen = async () => {
    const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    const el = rootRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (fullscreen === 'native') { try { if (doc.exitFullscreen) await doc.exitFullscreen(); else doc.webkitExitFullscreen?.(); } catch {} setFullscreen('off'); return; }
    if (fullscreen === 'window') { setFullscreen('off'); return; }
    try {
      if (el?.requestFullscreen) { await el.requestFullscreen(); setFullscreen('native'); return; }
      if (el?.webkitRequestFullscreen) { el.webkitRequestFullscreen(); setFullscreen('native'); return; }
    } catch {}
    setFullscreen('window');
  };

  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(''), 2600); return () => window.clearTimeout(t); }, [toast]);

  const pro = tier === 'pro';
  const tableCount = items.filter((item) => item.type === 'table').length;
  const seatCount = items.reduce((sum, item) => sum + (item.type === 'table' ? item.seats || 0 : item.type === 'chairs' ? 1 : 0), 0);
  const goShot = (shot: Shot3D) => {
    const target: View3D = shot === 'aerial' ? '3d' : 'walk';
    if (shot !== 'aerial') setTour(false);
    shotRef.current = shot;
    if (view === target) { shotRef.current = null; engineRef.current?.shot?.(shot); } else setView(target);
  };
  const toggleTour = () => {
    const next = !tour;
    setTour(next);
    if (next && view !== '3d') setView('3d');
  };
  const shareInfo = () => ({ title: caption || '3D event design', detail: `${formatM(width)} × ${formatM(depth)} m · ${tableCount} tables · ${seatCount} seats` });
  /** Phones and tablets open the share sheet (WhatsApp, Gallery…); computers download the file. Returns false if sharing was cancelled. */
  const deliver = async (blob: Blob, name: string, type: string, sharedMsg: string, savedMsg: string) => {
    const file = new File([blob], name, { type });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if ((window.matchMedia?.('(pointer: coarse)').matches) && nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: 'ELSARAYA EVENTS' }); setToast(sharedMsg); return; } catch (err) { if ((err as Error)?.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    setToast(savedMsg);
  };
  const stamp = () => new Date().toISOString().slice(0, 10);
  const savePhoto = async () => {
    if (!engineRef.current?.snapshot || photoBusy || watermark) return;
    setPhotoBusy(true);
    try {
      const blob: Blob | null = await engineRef.current.snapshot(shareInfo());
      if (!blob) throw new Error('no image');
      await deliver(blob, `ELSARAYA-3D-${stamp()}.jpg`, 'image/jpeg', isAr ? 'تمت المشاركة' : 'Photo shared', isAr ? 'تم حفظ الصورة بدقة عالية' : 'HD photo saved');
    } catch {
      setToast(isAr ? 'تعذّر حفظ الصورة' : 'The photo could not be saved');
    } finally { setPhotoBusy(false); }
  };
  const VIDEO_SECONDS = 12;
  const saveVideo = async () => {
    if (!engineRef.current?.record || recording !== null || watermark) return;
    setTour(true);
    if (view !== '3d') { setView('3d'); await new Promise((r) => window.setTimeout(r, 400)); }
    setRecording(0);
    try {
      const result = await engineRef.current.record(VIDEO_SECONDS, shareInfo(), (p: number) => setRecording(p));
      if (!result) { setToast(isAr ? 'تسجيل الفيديو غير مدعوم على هذا المتصفح' : 'Video recording isn’t supported in this browser'); return; }
      const ext = result.type.includes('mp4') ? 'mp4' : 'webm';
      await deliver(result.blob, `ELSARAYA-3D-tour-${stamp()}.${ext}`, result.type, isAr ? 'تمت مشاركة الفيديو' : 'Video shared', isAr ? 'تم حفظ فيديو الجولة' : 'Tour video saved');
    } catch {
      setToast(isAr ? 'تعذّر تسجيل الفيديو' : 'The video could not be recorded');
    } finally { setRecording(null); }
  };

  const holdMove = (forward: number, right: number) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); walkInput.current = { forward, right }; },
    onPointerUp: () => { walkInput.current = { forward: 0, right: 0 }; },
    onPointerLeave: () => { walkInput.current = { forward: 0, right: 0 }; },
    onPointerCancel: () => { walkInput.current = { forward: 0, right: 0 }; },
  });
  const moodButtons: { id: Mood3D; icon: typeof Box; en: string; ar: string }[] = [
    { id: 'day', icon: Sun, en: 'Day', ar: 'نهار' },
    { id: 'evening', icon: Moon, en: 'Evening', ar: 'مساء' },
    { id: 'party', icon: PartyPopper, en: 'Party', ar: 'حفلة' },
  ];
  const shotButtons: { id: Shot3D; icon: typeof Box; en: string; ar: string }[] = [
    { id: 'entrance', icon: DoorOpen, en: 'Entrance', ar: 'المدخل' },
    { id: 'stage', icon: Crown, en: 'Kosha', ar: 'الكوشة' },
    { id: 'guest', icon: Armchair, en: 'Guest seat', ar: 'مقعد ضيف' },
    { id: 'aerial', icon: Eye, en: 'Aerial', ar: 'من أعلى' },
  ];
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
    <div ref={rootRef} className={`@container overflow-hidden bg-slate-950 ${fullscreen === 'off' ? 'relative h-full min-h-[420px] rounded-xl border border-slate-700' : fullscreen === 'window' ? 'fixed inset-0 z-[200] h-[100dvh] w-screen' : 'relative h-full w-full'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div ref={hostRef} data-rotation-ui className="absolute inset-0" />
      {watermark && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {/* Dense tiled text so the whole 3D view is covered and no clean screenshot is possible. */}
        <div className="absolute inset-0" style={{ WebkitMaskImage: 'radial-gradient(ellipse 42% 38% at 50% 58%, rgba(0,0,0,.35) 0%, rgba(0,0,0,.35) 55%, #000 100%)', maskImage: 'radial-gradient(ellipse 42% 38% at 50% 58%, rgba(0,0,0,.35) 0%, rgba(0,0,0,.35) 55%, #000 100%)' }}>
        <div className="absolute -inset-full flex flex-col justify-center gap-5" style={{ transform: 'rotate(-24deg)' }}>
          {Array.from({ length: 60 }, (_, row) => (
            <div key={row} className={`flex gap-8 whitespace-nowrap font-black tracking-[0.25em] ${row % 2 ? 'text-lg text-white/25 ps-24' : 'text-xl text-amber-200/35'}`}>
              {Array.from({ length: 14 }, (_, i) => <span key={i}>{row % 2 ? (isAr ? 'يتطلب اشتراك فعّال · غير قابل للاستخدام' : 'ACTIVE SUBSCRIPTION REQUIRED · NOT FOR USE') : watermark}</span>)}
            </div>
          ))}
        </div>
        </div>
        <div className="absolute inset-x-3 top-28 flex justify-center">
          <div className="max-w-md rounded-xl border border-amber-400/40 bg-[#0D0D0F]/85 px-4 py-2.5 text-center backdrop-blur">
            <div className="text-[11px] font-black tracking-widest text-amber-200">{isAr ? 'معاينة فقط · الاشتراك غير مفعّل' : 'PREVIEW ONLY · SUBSCRIPTION NOT ACTIVE'}</div>
            <div className="mt-1 text-[10px] leading-4 text-slate-300">{isAr ? 'هذا العرض غير قابل للاستخدام مع العملاء بدون اشتراك 3D Studio Pro فعّال. الحفظ والعرض للعميل متوقفان.' : 'This view can’t be used with clients without an active 3D Studio Pro subscription. Saving and client presentation are locked.'}</div>
          </div>
        </div>
      </div>}
      {!readOnly && view !== 'walk' && selectedId && (selectedIds?.length ?? 0) <= 1 && items.some((item) => item.id === selectedId) && <div ref={rotationBarRef} data-rotation-ui className="pointer-events-auto absolute z-20 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-full border border-amber-300/70 bg-slate-950/95 p-1 shadow-xl" style={{ left: '50%', top: '50%' }} onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" title={isAr ? 'تدوير 45° لليسار' : 'Rotate 45° left'} aria-label={isAr ? 'تدوير 45° لليسار' : 'Rotate 45° left'} onClick={(event) => { event.stopPropagation(); rotateRef.current?.(selectedId, -45); }} className="flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-black text-amber-200 hover:bg-slate-800"><RotateCcw className="h-3.5 w-3.5" />45</button>
        <button type="button" title={isAr ? 'تدوير 15° لليسار' : 'Rotate 15° left'} aria-label={isAr ? 'تدوير 15° لليسار' : 'Rotate 15° left'} onClick={(event) => { event.stopPropagation(); rotateRef.current?.(selectedId, -15); }} className="flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-black text-amber-200 hover:bg-slate-800"><RotateCcw className="h-3.5 w-3.5" />15</button>
        <span className="min-w-9 text-center text-[10px] font-bold tabular-nums text-white">{((Math.round(items.find((item) => item.id === selectedId)?.rotation ?? 0) % 360) + 360) % 360}°</span>
        <button type="button" title={isAr ? 'تدوير 15° لليمين' : 'Rotate 15° right'} aria-label={isAr ? 'تدوير 15° لليمين' : 'Rotate 15° right'} onClick={(event) => { event.stopPropagation(); rotateRef.current?.(selectedId, 15); }} className="flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-black text-amber-200 hover:bg-slate-800"><RotateCw className="h-3.5 w-3.5" />15</button>
        <button type="button" title={isAr ? 'تدوير 45° لليمين' : 'Rotate 45° right'} aria-label={isAr ? 'تدوير 45° لليمين' : 'Rotate 45° right'} onClick={(event) => { event.stopPropagation(); rotateRef.current?.(selectedId, 45); }} className="flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-black text-amber-200 hover:bg-slate-800"><RotateCw className="h-3.5 w-3.5" />45</button>
        <button type="button" title={isAr ? 'ربع لفة' : 'Quarter turn'} aria-label={isAr ? 'ربع لفة' : 'Quarter turn'} data-quarter onClick={(event) => { event.stopPropagation(); rotateRef.current?.(selectedId, 90); }} className="flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-black text-amber-200 hover:bg-slate-800">+90°</button>
      </div>}

      <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/85 p-1 backdrop-blur" role="group" aria-label={isAr ? 'طريقة العرض' : 'View'}>
          {viewButtons.map(({ id, icon: Icon, en, ar }) => (
            <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id} className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold ${view === id ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:bg-slate-800'}`}><Icon className="h-3.5 w-3.5" />{isAr ? ar : en}</button>
          ))}
        </div>
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/85 p-1 backdrop-blur">
          <span className={`flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-[10px] font-black tracking-widest ${tier === 'pro' ? 'bg-gradient-to-r from-[#E9CF94] via-[#C49A52] to-[#8C6A2E] text-[#0D0D0F]' : 'bg-[#172033] text-[#CFE5FF]'}`}>{tier === 'pro' ? <><Sparkles className="h-3.5 w-3.5" />{isAr ? 'برو' : 'PRO'}</> : (isAr ? 'أساسي' : 'BASIC')}</span>
          {tier === 'pro' && <button type="button" onClick={() => setMeasure((m) => !m)} aria-pressed={measure} title={isAr ? 'المقاسات والأسماء' : 'Measurements & labels'} className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold ${measure ? 'bg-amber-400/15 text-amber-200' : 'text-slate-400 hover:bg-slate-800'}`}><Ruler className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? 'المقاسات' : 'Measurements'}</span></button>}
          <button type="button" onClick={toggleFullscreen} aria-pressed={fullscreen !== 'off'} title={fullscreen !== 'off' ? (isAr ? 'خروج من ملء الشاشة' : 'Exit full screen') : (isAr ? 'ملء الشاشة' : 'Full screen')} aria-label={fullscreen !== 'off' ? (isAr ? 'خروج من ملء الشاشة' : 'Exit full screen') : (isAr ? 'ملء الشاشة' : 'Full screen')} className={`flex h-9 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold ${fullscreen !== 'off' ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:bg-slate-800'}`}>{fullscreen !== 'off' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}<span className="hidden @[520px]:inline">{fullscreen !== 'off' ? (isAr ? 'خروج' : 'Exit') : (isAr ? 'ملء الشاشة' : 'Full screen')}</span></button>
          <button type="button" onClick={() => engineRef.current?.applyView?.(view)} title={isAr ? 'إعادة ضبط الكاميرا' : 'Reset camera'} aria-label={isAr ? 'إعادة ضبط الكاميرا' : 'Reset camera'} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800"><Scan className="h-4 w-4" /></button>
        </div>
        {pro && <div className="flex w-full basis-full justify-start">
        {/* Pro studio bar: lighting scenes, camera shots, cinematic tour and HD photo. Scrolls sideways on phones. */}
        <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-amber-400/30 bg-[#0D0D0F]/85 p-1 backdrop-blur [scrollbar-width:none]" role="toolbar" aria-label={isAr ? 'أدوات برو' : 'Pro tools'}>
          <div className="flex shrink-0 items-center gap-0.5" role="group" aria-label={isAr ? 'الإضاءة' : 'Lighting'}>
            {moodButtons.map(({ id, icon: Icon, en, ar }) => (
              <button key={id} type="button" onClick={() => setMood(id)} aria-pressed={mood === id} title={isAr ? ar : en} className={`flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-bold ${mood === id ? 'bg-gradient-to-r from-[#E9CF94] via-[#C49A52] to-[#8C6A2E] text-[#0D0D0F]' : 'text-slate-200 hover:bg-slate-800'}`}><Icon className="h-3.5 w-3.5" /><span className={mood === id ? '' : 'hidden @lg:inline'}>{isAr ? ar : en}</span></button>
            ))}
          </div>
          <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-700" aria-hidden="true" />
          <div className="flex shrink-0 items-center gap-0.5" role="group" aria-label={isAr ? 'لقطات الكاميرا' : 'Camera shots'}>
            {shotButtons.map(({ id, icon: Icon, en, ar }) => (
              <button key={id} type="button" onClick={() => goShot(id)} title={isAr ? `لقطة: ${ar}` : `Shot: ${en}`} aria-label={isAr ? `لقطة: ${ar}` : `Camera shot: ${en}`} className="flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-slate-200 hover:bg-slate-800"><Icon className="h-3.5 w-3.5 text-amber-200" /><span className="hidden @4xl:inline">{isAr ? ar : en}</span></button>
            ))}
          </div>
          <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-700" aria-hidden="true" />
          <button type="button" onClick={toggleTour} aria-pressed={tour} title={isAr ? 'جولة سينمائية تلقائية' : 'Cinematic auto tour'} className={`flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-bold ${tour ? 'bg-amber-400/20 text-amber-200' : 'text-slate-200 hover:bg-slate-800'}`}><Clapperboard className="h-3.5 w-3.5" /><span className="hidden @md:inline">{isAr ? 'جولة' : 'Tour'}</span></button>
          <button type="button" onClick={() => setGuestsOn((g) => !g)} aria-pressed={guestsOn} title={isAr ? 'إظهار الضيوف على الطاولات' : 'Show seated guests'} className={`flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-bold ${guestsOn ? 'bg-amber-400/20 text-amber-200' : 'text-slate-200 hover:bg-slate-800'}`}><Users className="h-3.5 w-3.5" /><span className="hidden @md:inline">{isAr ? 'الضيوف' : 'Guests'}</span></button>
          <button type="button" onClick={saveVideo} disabled={!ready || recording !== null || Boolean(watermark)} title={watermark ? (isAr ? 'الفيديو يتطلب اشتراك فعّال' : 'Videos need an active subscription') : (isAr ? 'تسجيل فيديو جولة لإرساله للعميل' : 'Record a tour video to send to the client')} className="flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-amber-400/60 px-2.5 text-[11px] font-black text-amber-200 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40"><Video className="h-3.5 w-3.5" />{recording !== null ? `${Math.round(recording * 100)}%` : (isAr ? 'فيديو' : 'Video')}</button>
          <button type="button" onClick={savePhoto} disabled={!ready || photoBusy || Boolean(watermark)} title={watermark ? (isAr ? 'حفظ الصور يتطلب اشتراك فعّال' : 'HD photos need an active subscription') : (isAr ? 'حفظ صورة بدقة عالية لإرسالها للعميل' : 'Save an HD photo to send to the client')} className="flex min-h-8 shrink-0 items-center gap-1 rounded-lg bg-amber-400 px-2.5 text-[11px] font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"><Camera className="h-3.5 w-3.5" />{photoBusy ? '…' : (isAr ? 'صورة HD' : 'HD photo')}</button>
        </div>
      </div>}
      </div>

      {recording !== null && <div className="pointer-events-none absolute inset-x-0 bottom-14 z-30 flex justify-center"><span className="flex items-center gap-2 rounded-full border border-red-400/60 bg-[#0D0D0F]/95 px-4 py-1.5 text-xs font-bold text-white shadow-xl"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />{isAr ? 'جارٍ تسجيل الجولة' : 'Recording tour'} · {Math.max(0, Math.ceil(VIDEO_SECONDS * (1 - recording)))}s</span></div>}
      {toast && <div role="status" className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center"><span className="rounded-full border border-amber-400/50 bg-[#0D0D0F]/95 px-4 py-1.5 text-xs font-bold text-amber-100 shadow-xl">{toast}</span></div>}

      <div className="pointer-events-none absolute bottom-2 start-2 z-10 max-w-[calc(100%-1rem)] space-y-1">
        {tier === 'pro' && <div className="w-fit rounded-lg border border-slate-700 bg-slate-950/85 px-2.5 py-1.5 text-[10px] font-bold text-amber-200" dir="auto">
          {formatM(width)} × {formatM(depth)} {unit}{!outdoor && ceilingM ? ` · ${isAr ? 'الارتفاع' : 'ceiling'} ${formatM(ceilingM)} ${unit}` : ` · ${isAr ? 'مكان مفتوح' : 'open air'}`} · {formatM(width * depth)} {isAr ? 'م²' : 'm²'}
          {tableCount > 0 && <span className="hidden text-slate-300 @md:inline"> · {tableCount} {isAr ? 'طاولة' : 'tables'} · {seatCount} {isAr ? 'مقعد' : 'seats'}</span>}
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
