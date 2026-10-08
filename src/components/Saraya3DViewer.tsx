import { useState, useRef, MouseEvent, TouchEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Users,
  Compass,
  Eye,
  Sun,
  Moon,
  Flame,
  CheckCircle2,
  Volume2,
  Building,
  Edit3,
  Plus,
  Trash2,
  Save,
  Move,
  Layers,
  Sliders,
  Settings,
  TreePine,
  Tv,
  Music,
} from 'lucide-react';
import { Language, Hall } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

export interface Table3DItem {
  id: string;
  name: string;
  type: 'round' | 'vip_crescent' | 'cocktail' | 'long';
  seats: number;
  x: number; // percentage 10 - 90
  y: number; // percentage 15 - 85
  isVip?: boolean;
}

export type HallStyleId = 'hall-1' | 'hall-2' | 'hall-3' | 'hall-4';

interface Saraya3DViewerProps {
  language: Language;
  halls?: Hall[];
  initialHallId?: string;
  onSelectHallForBooking?: (hallId: string) => void;
  onOpenBookingModal?: () => void;
  isPortalUser?: boolean;
}

type CameraPreset = 'aerial' | 'catwalk' | 'vip_table' | 'stage';
type LightingPreset = 'royal_gold' | 'candlelight' | 'midnight' | 'emerald_garden' | 'corporate_cyan';

// Default architectural configurations for the 4 distinct venues
const DEFAULT_HALL_TABLES: Record<HallStyleId, Table3DItem[]> = {
  // 1. Royal Grand Ballroom: Catwalk in center, dual wing tables
  'hall-1': [
    { id: 'h1-t1', name: 'VIP 1', type: 'vip_crescent', seats: 12, x: 18, y: 30, isVip: true },
    { id: 'h1-t2', name: 'VIP 2', type: 'vip_crescent', seats: 12, x: 82, y: 30, isVip: true },
    { id: 'h1-t3', name: 'T-01', type: 'round', seats: 10, x: 16, y: 46 },
    { id: 'h1-t4', name: 'T-02', type: 'round', seats: 10, x: 84, y: 46 },
    { id: 'h1-t5', name: 'T-03', type: 'round', seats: 10, x: 16, y: 62 },
    { id: 'h1-t6', name: 'T-04', type: 'round', seats: 10, x: 84, y: 62 },
    { id: 'h1-t7', name: 'T-05', type: 'round', seats: 10, x: 16, y: 78 },
    { id: 'h1-t8', name: 'T-06', type: 'round', seats: 10, x: 84, y: 78 },
    { id: 'h1-t9', name: 'T-07', type: 'round', seats: 10, x: 28, y: 54 },
    { id: 'h1-t10', name: 'T-08', type: 'round', seats: 10, x: 72, y: 54 },
    { id: 'h1-t11', name: 'T-09', type: 'round', seats: 10, x: 28, y: 70 },
    { id: 'h1-t12', name: 'T-10', type: 'round', seats: 10, x: 72, y: 70 },
  ],

  // 2. Baron Andalusian Hall: Radial seating wrapping central rosette dance floor
  'hall-2': [
    { id: 'h2-t1', name: 'Majlis VIP 1', type: 'vip_crescent', seats: 10, x: 22, y: 28, isVip: true },
    { id: 'h2-t2', name: 'Majlis VIP 2', type: 'vip_crescent', seats: 10, x: 78, y: 28, isVip: true },
    { id: 'h2-t3', name: 'Andalus 1', type: 'round', seats: 8, x: 16, y: 50 },
    { id: 'h2-t4', name: 'Andalus 2', type: 'round', seats: 8, x: 84, y: 50 },
    { id: 'h2-t5', name: 'Andalus 3', type: 'round', seats: 8, x: 26, y: 70 },
    { id: 'h2-t6', name: 'Andalus 4', type: 'round', seats: 8, x: 74, y: 70 },
    { id: 'h2-t7', name: 'Family 1', type: 'long', seats: 12, x: 50, y: 82, isVip: true },
    { id: 'h2-t8', name: 'Andalus 5', type: 'round', seats: 8, x: 22, y: 85 },
    { id: 'h2-t9', name: 'Andalus 6', type: 'round', seats: 8, x: 78, y: 85 },
  ],

  // 3. Saraya Starlight Garden: Tables around dancing central fountain & lawn
  'hall-3': [
    { id: 'h3-t1', name: 'Garden VIP 1', type: 'round', seats: 10, x: 20, y: 32, isVip: true },
    { id: 'h3-t2', name: 'Garden VIP 2', type: 'round', seats: 10, x: 80, y: 32, isVip: true },
    { id: 'h3-t3', name: 'Gazebo 1', type: 'round', seats: 10, x: 18, y: 65 },
    { id: 'h3-t4', name: 'Gazebo 2', type: 'round', seats: 10, x: 82, y: 65 },
    { id: 'h3-t5', name: 'Lawn Table 1', type: 'round', seats: 8, x: 30, y: 78 },
    { id: 'h3-t6', name: 'Lawn Table 2', type: 'round', seats: 8, x: 70, y: 78 },
    { id: 'h3-t7', name: 'Bar High 1', type: 'cocktail', seats: 4, x: 12, y: 82 },
    { id: 'h3-t8', name: 'Bar High 2', type: 'cocktail', seats: 4, x: 88, y: 82 },
    { id: 'h3-t9', name: 'Fountain Edge', type: 'round', seats: 10, x: 50, y: 82 },
  ],

  // 4. Diplomat Summit: Executive classroom / u-shape facing curved 4K LED
  'hall-4': [
    { id: 'h4-t1', name: 'Executive Row 1', type: 'long', seats: 12, x: 30, y: 32, isVip: true },
    { id: 'h4-t2', name: 'Executive Row 2', type: 'long', seats: 12, x: 70, y: 32, isVip: true },
    { id: 'h4-t3', name: 'Delegates A', type: 'long', seats: 10, x: 30, y: 48 },
    { id: 'h4-t4', name: 'Delegates B', type: 'long', seats: 10, x: 70, y: 48 },
    { id: 'h4-t5', name: 'Diplomat Round 1', type: 'round', seats: 8, x: 18, y: 68 },
    { id: 'h4-t6', name: 'Diplomat Round 2', type: 'round', seats: 8, x: 50, y: 68 },
    { id: 'h4-t7', name: 'Diplomat Round 3', type: 'round', seats: 8, x: 82, y: 68 },
    { id: 'h4-t8', name: 'Press & Media', type: 'long', seats: 10, x: 50, y: 84 },
  ],
};

export function Saraya3DViewer({
  language,
  halls,
  initialHallId = 'hall-1',
  onSelectHallForBooking,
  onOpenBookingModal,
  isPortalUser = false,
}: Saraya3DViewerProps) {
  const isAr = language === 'ar';

  // Active hall style
  const [activeHallId, setActiveHallId] = useState<HallStyleId>(
    (initialHallId as HallStyleId) || 'hall-1'
  );

  // 3D Orbit & Camera state
  const [rotationAngle, setRotationAngle] = useState<number>(22);
  const [pitchAngle, setPitchAngle] = useState<number>(55);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('aerial');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('royal_gold');
  const [activeHotspot, setActiveHotspot] = useState<string | null>('stage');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);

  // EDITABLE 3D STUDIO STATE
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [tablesByHall, setTablesByHall] = useState<Record<HallStyleId, Table3DItem[]>>(() => {
    try {
      const saved = localStorage.getItem('saraya_custom_3d_tables');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read error:', e);
    }
    return DEFAULT_HALL_TABLES;
  });

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [catwalkLength, setCatwalkLength] = useState<number>(22); // meters
  const [hasCatwalk, setHasCatwalk] = useState<boolean>(true);

  // Mouse tilt drag refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Current active hall's tables
  const currentTables = tablesByHall[activeHallId] || DEFAULT_HALL_TABLES[activeHallId];

  // Recalculate total seating capacity dynamically
  const calculatedCapacity = currentTables.reduce((sum, t) => sum + t.seats, 0);

  // Sync catwalk presence with hall style
  useEffect(() => {
    if (activeHallId === 'hall-1') {
      setHasCatwalk(true);
      setLightingPreset('royal_gold');
    } else if (activeHallId === 'hall-2') {
      setHasCatwalk(false);
      setLightingPreset('candlelight');
    } else if (activeHallId === 'hall-3') {
      setHasCatwalk(false);
      setLightingPreset('emerald_garden');
    } else if (activeHallId === 'hall-4') {
      setHasCatwalk(false);
      setLightingPreset('corporate_cyan');
    }
  }, [activeHallId]);

  // Camera preset switcher
  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    sound.click(750);
    if (preset === 'aerial') {
      setPitchAngle(60);
      setRotationAngle(25);
      setZoomLevel(1);
    } else if (preset === 'catwalk') {
      setPitchAngle(35);
      setRotationAngle(0);
      setZoomLevel(1.2);
    } else if (preset === 'vip_table') {
      setPitchAngle(40);
      setRotationAngle(-35);
      setZoomLevel(1.3);
    } else if (preset === 'stage') {
      setPitchAngle(28);
      setRotationAngle(45);
      setZoomLevel(1.25);
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isEditMode) return; // Don't orbit while dragging tables
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsAutoRotate(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || isEditMode) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    startPosRef.current = { x: e.clientX, y: e.clientY };

    setRotationAngle((prev) => (prev + dx * 0.4) % 360);
    setPitchAngle((prev) => Math.min(75, Math.max(20, prev - dy * 0.25)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isEditMode || e.touches.length !== 1) return;
    isDraggingRef.current = true;
    startPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setIsAutoRotate(false);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || isEditMode || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startPosRef.current.x;
    const dy = e.touches[0].clientY - startPosRef.current.y;
    startPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setRotationAngle((prev) => (prev + dx * 0.5) % 360);
    setPitchAngle((prev) => Math.min(75, Math.max(20, prev - dy * 0.3)));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const resetView = () => {
    sound.swoosh();
    applyCameraPreset('aerial');
    setIsAutoRotate(true);
  };

  // EDITABLE STUDIO ACTIONS (FOR PORTAL & DEMO CUSTOMIZATION)
  const handleAddTable = (type: Table3DItem['type']) => {
    sound.pop();
    const newId = `tbl-${Date.now()}`;
    const seats = type === 'vip_crescent' ? 12 : type === 'round' ? 10 : type === 'long' ? 12 : 4;
    const newTable: Table3DItem = {
      id: newId,
      name: `T-${currentTables.length + 1}`,
      type,
      seats,
      x: 50,
      y: 50,
      isVip: type === 'vip_crescent',
    };

    setTablesByHall((prev) => ({
      ...prev,
      [activeHallId]: [...(prev[activeHallId] || []), newTable],
    }));
    setSelectedTableId(newId);
  };

  const handleDeleteTable = (id: string) => {
    sound.tick();
    setTablesByHall((prev) => ({
      ...prev,
      [activeHallId]: (prev[activeHallId] || []).filter((t) => t.id !== id),
    }));
    if (selectedTableId === id) setSelectedTableId(null);
  };

  const handleUpdateTablePosition = (id: string, newX: number, newY: number) => {
    setTablesByHall((prev) => ({
      ...prev,
      [activeHallId]: (prev[activeHallId] || []).map((t) =>
        t.id === id ? { ...t, x: Math.max(8, Math.min(92, newX)), y: Math.max(15, Math.min(88, newY)) } : t
      ),
    }));
  };

  const handleSaveCustomLayout = () => {
    sound.fanfare();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    try {
      localStorage.setItem('saraya_custom_3d_tables', JSON.stringify(tablesByHall));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  };

  const handleResetHallToArchitecturalDefaults = () => {
    sound.swoosh();
    setTablesByHall((prev) => ({
      ...prev,
      [activeHallId]: DEFAULT_HALL_TABLES[activeHallId],
    }));
    try {
      localStorage.setItem('saraya_custom_3d_tables', JSON.stringify({
        ...tablesByHall,
        [activeHallId]: DEFAULT_HALL_TABLES[activeHallId],
      }));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  };

  // Distinct lighting & floor styles for each venue and lighting preset
  const lightingStyles = {
    royal_gold: {
      ambient: 'rgba(212, 175, 55, 0.14)',
      beam: 'rgba(245, 208, 107, 0.3)',
      stageGlow: 'rgba(218, 165, 32, 0.5)',
      bgGrad: 'from-amber-950/20 via-slate-950 to-slate-950',
    },
    candlelight: {
      ambient: 'rgba(255, 140, 0, 0.16)',
      beam: 'rgba(255, 180, 80, 0.35)',
      stageGlow: 'rgba(255, 120, 30, 0.45)',
      bgGrad: 'from-orange-950/20 via-slate-950 to-slate-950',
    },
    midnight: {
      ambient: 'rgba(99, 102, 241, 0.14)',
      beam: 'rgba(129, 140, 248, 0.28)',
      stageGlow: 'rgba(79, 70, 229, 0.5)',
      bgGrad: 'from-indigo-950/25 via-slate-950 to-slate-950',
    },
    emerald_garden: {
      ambient: 'rgba(16, 185, 129, 0.16)',
      beam: 'rgba(52, 211, 153, 0.35)',
      stageGlow: 'rgba(5, 150, 105, 0.5)',
      bgGrad: 'from-emerald-950/25 via-slate-950 to-slate-950',
    },
    corporate_cyan: {
      ambient: 'rgba(6, 182, 212, 0.16)',
      beam: 'rgba(34, 211, 238, 0.35)',
      stageGlow: 'rgba(8, 145, 178, 0.55)',
      bgGrad: 'from-cyan-950/25 via-slate-950 to-slate-950',
    },
  }[lightingPreset];

  // Specific architectural details per hall
  const hallSpecsMeta = {
    'hall-1': {
      titleAr: 'القاعة الملكية الكبرى',
      titleEn: 'The Royal Grand Ballroom',
      subAr: 'ممشى رخام كارارا ناصع بطول 22 متراً، ثريات مورانو الإيطالية، ومنصة كوشة ملكية عرض 16 متراً.',
      subEn: '22m Carrara marble catwalk, Murano crystal chandeliers, and imperial 16m velvet bridal stage.',
      area: '1,250 m²',
      baseCap: '650+',
      floorPattern: 'bg-[radial-gradient(#d4af37_1.5px,transparent_1.5px)] [background-size:24px_24px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900',
    },
    'hall-2': {
      titleAr: 'قاعة البارون الأندلسية',
      titleEn: 'The Baron Andalusian Hall',
      subAr: 'أقواس أندلسية مذهبة، أرضيات موزاييك وزليج مغربي، منصة مجالس VIP، وحلبة رقص دائرية مزخرفة.',
      subEn: 'Gilded Andalusian horseshoe arches, Moroccan mosaic tile rosette, and radial banquet seating.',
      area: '780 m²',
      baseCap: '400',
      floorPattern: 'bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:18px_18px] bg-gradient-to-br from-amber-950/30 via-slate-950 to-amber-950/20',
    },
    'hall-3': {
      titleAr: 'تراس حديقة السرايا المفتوح',
      titleEn: 'The Saraya Starlight Garden & Terrace',
      subAr: 'أرضية عشبية طبيعية وممرات حجرية، نافورة راقصة مضاءة، أشجار زيتون معمرة مع إضاءات متلألئة.',
      subEn: 'Open-air manicured botanical lawn, central illuminated dancing fountain, and fairy-lit olive trees.',
      area: '1,100 m²',
      baseCap: '550',
      floorPattern: 'bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:20px_20px] bg-gradient-to-br from-emerald-950/30 via-slate-950 to-emerald-950/20',
    },
    'hall-4': {
      titleAr: 'قاعة الدبلوماسيين للمؤتمرات',
      titleEn: 'The Diplomat Conference & Summit Hall',
      subAr: 'شاشة عرض LED بانورامية منحنية بدقة 4K، عوازل صوتية 65dB، وترتيبات صفوف تنفيذية مع ميكروفونات.',
      subEn: 'Curved panoramic 4K LED video wall, 65dB acoustic isolation, and executive conference dais.',
      area: '600 m²',
      baseCap: '350',
      floorPattern: 'bg-[radial-gradient(#06b6d4_1.5px,transparent_1.5px)] [background-size:22px_22px] bg-gradient-to-br from-cyan-950/30 via-slate-950 to-slate-950',
    },
  }[activeHallId];

  return (
    <div className={`relative w-full rounded-2xl sm:rounded-3xl border border-amber-500/25 bg-gradient-to-b ${lightingStyles.bgGrad} p-4 sm:p-6 lg:p-8 overflow-hidden shadow-2xl transition-all duration-500 ${isExpanded ? 'fixed inset-3 z-50 overflow-y-auto bg-slate-950/98' : ''}`}>
      {/* Ambient Radial Lighting Glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${lightingStyles.ambient} 0%, transparent 70%)`,
        }}
      />

      {/* TOP BAR: Hall Style Switcher & Mode Actions */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/15 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wide">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'المحاكاة ثلاثية الأبعاد التفاعلية' : 'Interactive 3D Architectural Simulator'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-serif">{isAr ? hallSpecsMeta.titleAr : hallSpecsMeta.titleEn}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
            {isAr ? hallSpecsMeta.titleAr : hallSpecsMeta.titleEn}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isAr ? hallSpecsMeta.subAr : hallSpecsMeta.subEn}
          </p>
        </div>

        {/* Global Controls & Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* EDITABLE 3D STUDIO TOGGLE BUTTON FOR PORTAL / DEMO USERS */}
          <button
            type="button"
            onClick={() => {
              setIsEditMode(!isEditMode);
              sound.click(700);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm ${
              isEditMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/20'
                : 'bg-slate-900/90 text-amber-300 border-amber-500/40 hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>
              {isEditMode
                ? (isAr ? 'إنهاء وضع التعديل' : 'Exit 3D Editor')
                : (isAr ? 'تعديل مخطط وتوزيع 3D (Portal)' : 'Edit 3D Layout (Portal)')}
            </span>
          </button>

          <button
            type="button"
            onClick={resetView}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'ضبط الزاوية' : 'Reset View'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAutoRotate(!isAutoRotate);
              sound.tick();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap ${
              isAutoRotate
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAutoRotate ? (isAr ? 'دوران تلقائي نشط' : 'Auto-Orbit On') : (isAr ? 'دوران تلقائي' : 'Auto-Orbit')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsExpanded(!isExpanded);
              sound.click(600);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors whitespace-nowrap"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isExpanded ? (isAr ? 'تصغير' : 'Exit') : (isAr ? 'تكبير' : 'Fullscreen')}</span>
          </button>
        </div>
      </div>

      {/* HALLS SELECTOR TABS (SWITCHES 3D ARCHITECTURAL STYLES) */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 py-3 border-b border-white/5">
        <span className="text-xs font-semibold text-amber-300 me-1">
          {isAr ? 'اختر نمط القاعة ثلاثية الأبعاد:' : 'Select 3D Hall Architectural Style:'}
        </span>
        {[
          { id: 'hall-1', nameAr: 'القاعة الملكية الكبرى', nameEn: 'Royal Grand Ballroom', icon: Sparkles },
          { id: 'hall-2', nameAr: 'قاعة البارون الأندلسية', nameEn: 'Baron Andalusian', icon: Flame },
          { id: 'hall-3', nameAr: 'تراس حديقة السرايا', nameEn: 'Starlight Garden', icon: TreePine },
          { id: 'hall-4', nameAr: 'قاعة الدبلوماسيين للمؤتمرات', nameEn: 'Diplomat Summit', icon: Tv },
        ].map((h) => {
          const isSelected = activeHallId === h.id;
          const Icon = h.icon;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                sound.click(750);
                setActiveHallId(h.id as HallStyleId);
                setSelectedTableId(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20 scale-102'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isAr ? h.nameAr : h.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* Camera & Lighting Atmosphere Selectors */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 py-3 border-b border-white/5 text-xs">
        {/* Camera Angles */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <span className="px-2 text-slate-400 text-[11px] font-medium hidden sm:inline">
            {isAr ? 'الكاميرا:' : 'Camera:'}
          </span>
          {(['aerial', 'catwalk', 'vip_table', 'stage'] as CameraPreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyCameraPreset(preset)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                cameraPreset === preset
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {preset === 'aerial' && (isAr ? 'علوية' : 'Aerial')}
              {preset === 'catwalk' && (isAr ? 'الممشى' : 'Catwalk')}
              {preset === 'vip_table' && (isAr ? 'طاولات VIP' : 'VIP Tables')}
              {preset === 'stage' && (isAr ? 'المسرح' : 'Stage')}
            </button>
          ))}
        </div>

        {/* Live Metrics: Seating Gauge */}
        <div className="flex items-center gap-3 text-xs bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-slate-300">
          <span className="flex items-center gap-1 text-amber-300">
            <Users className="w-3.5 h-3.5" />
            <span className="font-bold">{calculatedCapacity}</span>
            <span>{isAr ? 'مقعد متاح' : 'Seats'}</span>
          </span>
          <span className="text-slate-600">·</span>
          <span>{currentTables.length} {isAr ? 'طاولة' : 'Tables'}</span>
          <span className="text-slate-600">·</span>
          <span>{hallSpecsMeta.area}</span>
        </div>

        {/* Lighting Atmosphere Presets */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setLightingPreset('royal_gold');
              sound.tick();
            }}
            title={isAr ? 'ذهبي ملكي دافئ' : 'Royal Gold'}
            className={`p-1.5 rounded-lg transition-all ${lightingPreset === 'royal_gold' ? 'bg-amber-400/30 text-amber-300' : 'text-slate-400 hover:text-white'}`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLightingPreset('candlelight');
              sound.tick();
            }}
            title={isAr ? 'شموع دافئة' : 'Candlelight Amber'}
            className={`p-1.5 rounded-lg transition-all ${lightingPreset === 'candlelight' ? 'bg-orange-400/30 text-orange-300' : 'text-slate-400 hover:text-white'}`}
          >
            <Flame className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLightingPreset('midnight');
              sound.tick();
            }}
            title={isAr ? 'سماء منتصف الليل' : 'Midnight Starlight'}
            className={`p-1.5 rounded-lg transition-all ${lightingPreset === 'midnight' ? 'bg-indigo-400/30 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLightingPreset('emerald_garden');
              sound.tick();
            }}
            title={isAr ? 'أجواء الحديقة والزمرد' : 'Emerald Garden'}
            className={`p-1.5 rounded-lg transition-all ${lightingPreset === 'emerald_garden' ? 'bg-emerald-400/30 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
          >
            <TreePine className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLightingPreset('corporate_cyan');
              sound.tick();
            }}
            title={isAr ? 'سايان للمؤتمرات' : 'Corporate Cyan'}
            className={`p-1.5 rounded-lg transition-all ${lightingPreset === 'corporate_cyan' ? 'bg-cyan-400/30 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
          >
            <Tv className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EDIT MODE TOOLBAR (SHOWN WHEN PORTAL USER TOGGLES 3D EDIT MODE) */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-20 my-3 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                <span>{isAr ? 'أدوات التعديل 3D:' : '3D Studio Tools:'}</span>
              </span>
              <button
                type="button"
                onClick={() => handleAddTable('round')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>{isAr ? '+ طاولة دائرية (10 مقاعد)' : '+ Round Table (10p)'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddTable('vip_crescent')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>{isAr ? '+ طاولة VIP ملكية (12 مقعد)' : '+ VIP Crescent (12p)'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddTable('cocktail')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>{isAr ? '+ طاولة موكتيل (4 مقاعد)' : '+ Cocktail (4p)'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddTable('long')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>{isAr ? '+ طاولة مستطيلة (12 مقعد)' : '+ Long Table (12p)'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetHallToArchitecturalDefaults}
                className="px-3 py-1 text-slate-400 hover:text-rose-300 text-xs"
              >
                {isAr ? 'استعادة التوزيع الأصلي' : 'Reset Layout'}
              </button>
              <button
                type="button"
                onClick={handleSaveCustomLayout}
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ المخطط' : 'Save 3D Layout'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D CANVAS VIEWPORT */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative my-4 w-full h-[390px] sm:h-[490px] lg:h-[580px] rounded-2xl bg-slate-950/95 border border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
        style={{
          perspective: 1200,
        }}
      >
        {/* Floating Instruction */}
        <div className="absolute top-4 start-4 z-20 pointer-events-none flex items-center gap-2 text-[11px] text-slate-300 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isEditMode
              ? (isAr ? 'وضع التعديل: انقر على أي طاولة لنقلها أو حذفها' : 'Edit Mode: Click/drag tables to rearrange')
              : (isAr ? 'اسحب للتدوير 360° واستكشاف المعمار' : 'Click & drag to orbit 3D space')}
          </span>
        </div>

        {/* 3D ROOM TRANSFORM CONTAINER */}
        <motion.div
          animate={{
            rotateX: pitchAngle,
            rotateZ: isAutoRotate && !isEditMode ? undefined : rotationAngle,
          }}
          transition={{
            type: 'spring',
            stiffness: 80,
            damping: 20,
          }}
          style={{
            transformStyle: 'preserve-3d',
            scale: zoomLevel,
            ...(isAutoRotate && !isEditMode
              ? {
                  animation: 'spin360 48s linear infinite',
                }
              : {}),
          }}
          className={`relative w-[340px] h-[340px] sm:w-[470px] sm:h-[470px] lg:w-[550px] lg:h-[550px] rounded-3xl border-2 border-amber-500/30 shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex items-center justify-center transition-all duration-700 ${hallSpecsMeta.floorPattern}`}
        >
          {/* PERIMETER WALL / ILLUMINATION WASH */}
          <div
            className="absolute inset-0 rounded-3xl border-4 pointer-events-none transition-colors duration-500"
            style={{
              borderColor: lightingStyles.beam,
              boxShadow: `inset 0 0 50px ${lightingStyles.stageGlow}`,
            }}
          />

          {/* =========================================================================
              HALL 1: GRAND BALLROOM SPECIFIC 3D ARCHITECTURE
              ========================================================================= */}
          {activeHallId === 'hall-1' && (
            <>
              {/* Massive 16m Kosha Stage at Top */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot('stage');
                  sound.chime();
                }}
                className="absolute top-4 w-[76%] h-20 rounded-2xl bg-gradient-to-b from-amber-500/30 via-amber-950/40 to-slate-950 border border-amber-400/60 flex flex-col items-center justify-center cursor-pointer hover:border-amber-300 transition-all shadow-xl group"
                style={{ transform: 'translateZ(20px)' }}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200 group-hover:text-white">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{isAr ? 'منصة الكوشة الملكية (16 متر)' : 'Imperial Kosha Stage (16m)'}</span>
                </div>
                <span className="text-[10px] text-amber-300/80">
                  {isAr ? 'تصميم مخمل عاجي مع جدران ورود هيدرانجيا' : 'Ivory Velvet with Cascading Fresh Floral Wall'}
                </span>
              </div>

              {/* 22-meter Carrara Marble Bridal Runway / Catwalk */}
              {hasCatwalk && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspot('catwalk');
                    sound.tick();
                  }}
                  className="absolute top-24 w-14 sm:w-20 h-48 sm:h-64 bg-gradient-to-b from-amber-50/95 via-amber-100/90 to-amber-200/95 rounded-md shadow-2xl border-x-2 border-amber-400/80 cursor-pointer flex flex-col items-center justify-between py-2 group hover:ring-2 hover:ring-amber-300 transition-all"
                  style={{ transform: 'translateZ(12px)' }}
                >
                  <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest writing-mode-vertical">
                    {isAr ? 'ممشى الزفة' : 'Runway'}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[9px] font-semibold text-slate-900 font-mono">22m</span>
                </div>
              )}

              {/* Suspended Murano Crystal Chandelier */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot('chandelier');
                  sound.chime();
                }}
                className="absolute z-30 w-16 h-16 rounded-full border-2 border-amber-300/70 bg-amber-400/20 backdrop-blur-sm flex items-center justify-center cursor-pointer shadow-[0_0_30px_rgba(212,175,55,0.7)] group hover:scale-110 transition-transform"
                style={{ transform: 'translateZ(70px)' }}
              >
                <Sparkles className="w-6 h-6 text-amber-300 group-hover:rotate-45 transition-transform" />
              </div>
            </>
          )}

          {/* =========================================================================
              HALL 2: BARON ANDALUSIAN HALL SPECIFIC 3D ARCHITECTURE
              ========================================================================= */}
          {activeHallId === 'hall-2' && (
            <>
              {/* Horseshoe Arch Oriental Stage */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot('stage');
                  sound.chime();
                }}
                className="absolute top-4 w-[70%] h-20 rounded-2xl bg-gradient-to-b from-amber-600/30 via-orange-950/40 to-slate-950 border-2 border-amber-500/70 flex flex-col items-center justify-center cursor-pointer hover:border-amber-300 transition-all shadow-xl group"
                style={{ transform: 'translateZ(20px)' }}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200 group-hover:text-white">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>{isAr ? 'مسرح البارون الأندلسي بالأقواس المذهبة' : 'Baron Andalusian Horseshoe Dais'}</span>
                </div>
                <span className="text-[10px] text-amber-300/80">
                  {isAr ? 'زخارف مشربية مذهبة مع فوانيس نحاسية' : 'Gilded Arabesque Lattice & Brass Lanterns'}
                </span>
              </div>

              {/* Central Gilded Rosette Mosaic Dance Floor */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot('dancefloor');
                  sound.chime();
                }}
                className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-amber-400/80 bg-amber-500/20 backdrop-blur flex items-center justify-center cursor-pointer shadow-[0_0_35px_rgba(245,158,11,0.5)] group hover:scale-105 transition-transform"
                style={{ transform: 'translateZ(10px)' }}
              >
                <div className="w-16 h-16 rounded-full border border-amber-300/60 border-dashed animate-spin-slow flex items-center justify-center">
                  <span className="text-[10px] font-bold text-amber-200">
                    {isAr ? 'حلبة الرقص' : 'Dance Floor'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              HALL 3: STARLIGHT GARDEN & TERRACE SPECIFIC 3D ARCHITECTURE
              ========================================================================= */}
          {activeHallId === 'hall-3' && (
            <>
              {/* Open-Air Garden Pergola Archway */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot('stage');
                  sound.chime();
                }}
                className="absolute top-4 w-[74%] h-20 rounded-2xl bg-gradient-to-b from-emerald-600/30 via-emerald-950/40 to-slate-950 border-2 border-emerald-400/70 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 transition-all shadow-xl group"
                style={{ transform: 'translateZ(20px)' }}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-200 group-hover:text-white">
                  <TreePine className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'منصة البرجولا الخشبية والحديقة' : 'Open-Air Botanical Timber Pergola'}</span>
                </div>
                <span className="text-[10px] text-emerald-300/80">
                  {isAr ? 'أقواس خشب أبيض مع زهور الياسمين الطبيعية' : 'White Timber Archway with Fresh Jasmine'}
                </span>
              </div>

              {/* Central Illuminated Dancing Fountain */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot('fountain');
                  sound.chime();
                }}
                className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-emerald-400 bg-emerald-500/25 backdrop-blur flex items-center justify-center cursor-pointer shadow-[0_0_35px_rgba(16,185,129,0.6)] group hover:scale-105 transition-transform"
                style={{ transform: 'translateZ(14px)' }}
              >
                <div className="w-16 h-16 rounded-full border-2 border-cyan-300/70 animate-ping opacity-60" />
                <span className="absolute text-[10px] font-bold text-emerald-100">
                  {isAr ? 'نافورة راقصة' : 'Dancing Fountain'}
                </span>
              </div>
            </>
          )}

          {/* =========================================================================
              HALL 4: DIPLOMAT SUMMIT HALL SPECIFIC 3D ARCHITECTURE
              ========================================================================= */}
          {activeHallId === 'hall-4' && (
            <>
              {/* Curved 4K LED Panoramic Video Wall Stage */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot('stage');
                  sound.chime();
                }}
                className="absolute top-4 w-[84%] h-22 rounded-2xl bg-gradient-to-b from-cyan-600/30 via-cyan-950/40 to-slate-950 border-2 border-cyan-400/80 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-300 transition-all shadow-xl group"
                style={{ transform: 'translateZ(20px)' }}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-200 group-hover:text-white">
                  <Tv className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'شاشة عرض LED بانورامية 4K مع منصة المتحدثين' : 'Curved 4K Panoramic LED Wall & Dais'}</span>
                </div>
                <span className="text-[10px] text-cyan-300/80">
                  {isAr ? 'منصة خطابة رقمية وميكروفونات Shure مع كبائن ترجمة فورية' : 'Digital Podium, Shure Wireless Mics & Translation Windows'}
                </span>
              </div>
            </>
          )}

          {/* =========================================================================
              DYNAMIC 3D TABLES (RENDERED & EDITABLE ACROSS ALL STYLES)
              ========================================================================= */}
          {currentTables.map((table) => {
            const isSelected = selectedTableId === table.id;

            return (
              <div
                key={table.id}
                onClick={(e) => {
                  e.stopPropagation();
                  sound.tick();
                  setSelectedTableId(table.id);
                  setActiveHotspot('table');
                }}
                style={{
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  transform: 'translate(-50%, -50%) translateZ(10px)',
                }}
                className={`absolute flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer select-none shadow-md ${
                  table.type === 'vip_crescent'
                    ? 'w-10 h-7 sm:w-14 sm:h-9 rounded-2xl'
                    : table.type === 'long'
                    ? 'w-14 h-6 sm:w-18 sm:h-7 rounded-lg'
                    : table.type === 'cocktail'
                    ? 'w-6 h-6 sm:w-8 sm:h-8 rounded-full'
                    : 'w-8 h-8 sm:w-11 sm:h-11 rounded-full'
                } ${
                  isSelected
                    ? 'ring-2 ring-white scale-125 z-40 bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                    : table.isVip
                    ? 'bg-amber-500/35 border-2 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                    : 'bg-slate-800/85 border border-slate-600 text-slate-300 hover:scale-110'
                }`}
              >
                <span className="truncate px-1">{table.name}</span>

                {/* Edit Mode Drag Handle */}
                {isEditMode && isSelected && (
                  <div className="absolute -top-6 bg-slate-900 border border-amber-400 text-amber-300 text-[10px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-50">
                    <Move className="w-3 h-3" />
                    <span>{table.seats}p</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.id);
                      }}
                      className="text-rose-400 hover:text-rose-300 ms-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Entrance at Bottom */}
          <div
            className="absolute bottom-2 w-32 h-6 rounded-t-lg bg-slate-800/90 border-t border-x border-amber-400/40 flex items-center justify-center text-[10px] text-amber-300 font-medium"
            style={{ transform: 'translateZ(6px)' }}
          >
            {isAr ? 'بوابة الدخول الرئيسية' : 'Grand Entrance'}
          </div>
        </motion.div>
      </div>

      {/* SELECTED HOTSPOT & ACTION FOOTER */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 items-center">
        {/* Hotspot details card */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {isAr ? hallSpecsMeta.titleAr : hallSpecsMeta.titleEn}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              {isAr
                ? `توزيع ${currentTables.length} طاولة بسعة إجمالية ${calculatedCapacity} مقعد، متطابقة مع المعايير الفندقية ومجهزة للصوت والإضاءة.`
                : `${currentTables.length} tables arranged for ${calculatedCapacity} guests with full acoustic & production clearances.`}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              sound.fanfare();
              if (onSelectHallForBooking) onSelectHallForBooking(activeHallId);
              if (onOpenBookingModal) onOpenBookingModal();
            }}
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] text-center whitespace-nowrap"
          >
            {isAr ? 'احجز مناسبتك في هذه القاعة' : 'Book Event in This Hall'}
          </button>
        </div>
      </div>
    </div>
  );
}
