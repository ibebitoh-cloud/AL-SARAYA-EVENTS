import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Users,
  Building2,
  CalendarCheck,
  Play,
  Pause,
} from 'lucide-react';
import { Language, Hall } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

const ModelViewer = 'model-viewer' as any;

export interface Table3DItem {
  id: string;
  name: string;
  type: 'round' | 'vip_crescent' | 'cocktail' | 'long';
  seats: number;
  x: number;
  y: number;
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

type ModelCard = {
  id: HallStyleId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  model: string;
  capacity: string;
  area: string;
};

const MODEL_CARDS: ModelCard[] = [
  {
    id: 'hall-1',
    nameAr: 'التجهيز المفتوح — طاولات الضيوف',
    nameEn: 'Open-Air Reception — Guest Tables',
    descriptionAr: 'طاولة استقبال دائرية بتجهيز مفتوح تناسب توزيع طاولات الضيوف في حفلات الزفاف الخارجية.',
    descriptionEn: 'A round banquet table setup suited to open-air wedding reception layouts.',
    model: 'https://cdn.3dassets.dev/assets/35201/v1/model.glb',
    capacity: '8–10',
    area: 'Open Air',
  },
  {
    id: 'hall-2',
    nameAr: 'طاولة العروسين',
    nameEn: 'Bride & Groom Table',
    descriptionAr: 'منطقة جلوس العروس والعريس في مقدمة الحفل، ضمن تصميم استقبال مفتوح بدون أي عناصر دينية.',
    descriptionEn: 'A dedicated bride-and-groom seating concept for the front of an open-air reception, with no religious ceremony elements.',
    model: 'https://cdn.3dassets.dev/assets/35201/v1/model.glb',
    capacity: 'Couple',
    area: 'Open Air',
  },
  {
    id: 'hall-3',
    nameAr: 'ساحة الرقص الرئيسية',
    nameEn: 'Main Wedding Dance Floor',
    descriptionAr: 'أرضية رقص بيضاء بلمسات ذهبية مخصصة للزفة والرقص والاحتفال وسط الحفل.',
    descriptionEn: 'A white dance floor with gold trim for the entrance, first dance and celebration.',
    model: 'https://cdn.3dassets.dev/assets/39405/v1/model.glb',
    capacity: 'Open',
    area: 'Dance Floor',
  },
  {
    id: 'hall-4',
    nameAr: 'جلسة الزفاف الخارجية',
    nameEn: 'Open-Air Wedding Setting',
    descriptionAr: 'أجواء حديقة خارجية مع قوس زفاف وزهور ومكان واضح لوقوف العروسين أمام الضيوف.',
    descriptionEn: 'An outdoor garden wedding setting with a floral arch and a dedicated couple-facing area for guests.',
    model: 'https://cdn.3dassets.dev/assets/39380/v1/model.glb',
    capacity: 'Outdoor',
    area: 'Garden',
  },
];

export function Saraya3DViewer({
  language,
  halls,
  initialHallId = 'hall-1',
  onSelectHallForBooking,
  onOpenBookingModal,
}: Saraya3DViewerProps) {
  const isAr = language === 'ar';
  const [activeHallId, setActiveHallId] = useState<HallStyleId>(
    MODEL_CARDS.some((m) => m.id === initialHallId)
      ? (initialHallId as HallStyleId)
      : 'hall-1'
  );
  const [autoRotate, setAutoRotate] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<HallStyleId>('hall-1');
  const viewersRef = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setSelectedCard(activeHallId);
  }, [activeHallId]);

  const resetViewer = (id: HallStyleId) => {
    const viewer = viewersRef.current[id] as any;
    if (!viewer) return;
    viewer.cameraOrbit = '0deg 75deg 105%';
    viewer.fieldOfView = '35deg';
    viewer.jumpCameraToGoal?.();
    sound.swoosh();
  };

  const toggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    MODEL_CARDS.forEach((card) => {
      const viewer = viewersRef.current[card.id] as any;
      if (viewer) viewer.autoRotate = next;
    });
    sound.tick();
  };

  const focusHall = (id: HallStyleId) => {
    setActiveHallId(id);
    setSelectedCard(id);
    sound.click(700);
    requestAnimationFrame(() => {
      document.getElementById(`saraya-3d-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  };

  const bookSelectedHall = () => {
    const selected = MODEL_CARDS.find((m) => m.id === selectedCard);
    if (!selected) return;
    onSelectHallForBooking?.(selected.id);
    onOpenBookingModal?.();
    sound.chime();
  };

  return (
    <section
      className={`relative w-full rounded-3xl border border-amber-500/25 bg-slate-950/95 overflow-hidden shadow-2xl ${isExpanded ? 'fixed inset-3 z-50 overflow-y-auto' : ''}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_55%)]" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? '4 مشاهد زفاف خارجية ثلاثية الأبعاد' : '4 Real 3D Open-Air Wedding Scenes'}</span>
            </div>
            <h3 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white">
              {isAr ? 'استكشف تصميم الزفاف الخارجي بالكامل' : 'Explore the Open-Air Wedding Setup in Real 3D'}
            </h3>
            <p className="mt-2 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-400">
              {isAr
                ? 'تم استبدال المشاهد السابقة بتصميمات زفاف خارجية تركز على طاولات الضيوف، طاولة العروسين، ساحة الرقص وأجواء الحديقة — بدون كنائس أو أي عناصر دينية.'
                : 'The 3D experience now focuses on open-air wedding layouts: guest tables, bride-and-groom seating, the dance floor and the garden setting — with no churches or religious ceremony elements.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAutoRotate}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                autoRotate
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700'
              }`}
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {autoRotate
                ? (isAr ? 'إيقاف الدوران' : 'Pause Rotation')
                : (isAr ? 'تشغيل الدوران' : 'Auto Rotate')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsExpanded((v) => !v);
                sound.click(600);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isExpanded ? (isAr ? 'تصغير' : 'Exit') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {MODEL_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => focusHall(card.id)}
              className={`p-3 rounded-xl border text-start transition-all ${
                selectedCard === card.id
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  {isAr ? card.nameAr : card.nameEn}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                {card.capacity} {isAr ? 'ضيف' : 'guests'} · {card.area}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-3 sm:p-5 lg:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {MODEL_CARDS.map((card, index) => (
            <motion.article
              id={`saraya-3d-${card.id}`}
              key={card.id}
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group rounded-2xl overflow-hidden border bg-slate-900/80 transition-all ${
                selectedCard === card.id
                  ? 'border-amber-400/70 shadow-[0_0_35px_rgba(212,175,55,0.12)]'
                  : 'border-slate-800'
              }`}
            >
              <div className="relative h-[330px] sm:h-[420px] lg:h-[500px] bg-black">
                <ModelViewer
                  ref={(node: HTMLElement | null) => {
                    viewersRef.current[card.id] = node;
                  }}
                  src={card.model}
                  alt={isAr ? card.nameAr : card.nameEn}
                  camera-controls
                  touch-action="pan-y"
                  auto-rotate={autoRotate}
                  rotation-per-second="8deg"
                  camera-orbit="0deg 75deg 105%"
                  field-of-view="35deg"
                  shadow-intensity="1"
                  exposure="1"
                  environment-image="neutral"
                  interaction-prompt="auto"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  reveal="auto"
                  style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#111827,#020617)' }}
                />

                <div className="absolute top-3 start-3 z-10 pointer-events-none flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white">
                    {isAr ? '3D حقيقي' : 'REAL 3D'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => resetViewer(card.id)}
                  className="absolute top-3 end-3 z-10 p-2 rounded-lg bg-slate-950/80 border border-white/10 text-slate-200 hover:text-white"
                  title={isAr ? 'إعادة زاوية الكاميرا' : 'Reset camera'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-3 start-3 end-3 z-10 pointer-events-none flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-200 bg-slate-950/80 backdrop-blur px-2.5 py-1.5 rounded-lg border border-white/10">
                    {isAr ? 'اسحب للدوران · عجلة للتكبير' : 'Drag to orbit · Scroll to zoom'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-slate-950/80 backdrop-blur px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                    GLB
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                      {isAr ? `المشهد ${index + 1}` : `Scene ${index + 1}`}
                    </div>
                    <h4 className="mt-1 text-base sm:text-lg font-bold text-white">
                      {isAr ? card.nameAr : card.nameEn}
                    </h4>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-xl">
                      {isAr ? card.descriptionAr : card.descriptionEn}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 text-[10px] shrink-0">
                    <div className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-amber-300 mb-1" />
                      {card.capacity} {isAr ? 'سعة' : 'capacity'}
                    </div>
                    <div className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                      {card.area}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCard(card.id);
                    onSelectHallForBooking?.(card.id);
                    onOpenBookingModal?.();
                    sound.chime();
                  }}
                  className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors"
                >
                  <CalendarCheck className="w-4 h-4" />
                  {isAr ? 'احجز هذه القاعة' : 'Book This Venue'}
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-5 text-[10px] text-slate-500">
        {isAr
          ? 'النماذج الحالية من 3DAssets.dev ومخصصة للعرض والتخطيط البصري. يمكن لاحقاً استبدالها بتصميم Saraya الحقيقي مع الحفاظ على نفس الواجهة.'
          : 'The current models are presentation assets from 3DAssets.dev. They can later be replaced by actual Saraya open-air wedding models without changing the viewer UI.'}
      </div>
    </section>
  );
}
