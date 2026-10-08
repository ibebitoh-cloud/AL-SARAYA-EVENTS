import { useEffect, useRef, useState } from 'react';
import {
  Armchair,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  DoorOpen,
  Flower2,
  Monitor,
  Move3d,
  Plus,
  RotateCw,
  Save,
  Presentation,
  ScreenShare,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Hall3DProfile, HallLayoutItem, Language } from '../types/venueSystem';
import { EventLayout3D } from './EventLayout3D';

type LayoutMode = '2d' | '3d' | 'pov';
type EventKind = 'engagement' | 'wedding' | 'conference' | 'summit' | 'birthday' | 'other';
type LocationKind = 'saraya' | 'client' | 'custom';

type LayoutItem = HallLayoutItem;

const ITEM_LIBRARY = [
  { type: 'table', labelEn: 'Round Table', labelAr: 'طاولة دائرية', icon: Users },
  { type: 'chairs', labelEn: 'Chairs', labelAr: 'كراسي', icon: Armchair },
  { type: 'stage', labelEn: 'Stage', labelAr: 'منصة', icon: Presentation },
  { type: 'screen', labelEn: 'LED Screen', labelAr: 'شاشة LED', icon: Monitor },
  { type: 'podium', labelEn: 'Podium', labelAr: 'منصة خطاب', icon: ScreenShare },
  { type: 'dance', labelEn: 'Dance Floor', labelAr: 'منصة رقص', icon: Move3d },
  { type: 'flowers', labelEn: 'Flowers', labelAr: 'زهور وديكور', icon: Flower2 },
  { type: 'buffet', labelEn: 'Buffet', labelAr: 'بوفيه', icon: Sparkles },
  { type: 'registration', labelEn: 'Registration', labelAr: 'تسجيل', icon: DoorOpen },
] as const;

const EVENT_NAMES: Record<EventKind, [string, string]> = {
  engagement: ['Engagement', 'خطوبة'],
  wedding: ['Wedding', 'زفاف'],
  conference: ['Conference', 'مؤتمر'],
  summit: ['Summit', 'قمة'],
  birthday: ['Birthday', 'عيد ميلاد'],
  other: ['Other', 'مناسبة أخرى'],
};

const INITIAL_ITEMS: LayoutItem[] = [
  { id: 'stage-1', type: 'stage', labelEn: 'Stage', labelAr: 'منصة', x: 50, y: 14, rotation: 0 },
  { id: 'screen-1', type: 'screen', labelEn: 'LED Screen', labelAr: 'شاشة LED', x: 50, y: 8, rotation: 0 },
  { id: 'table-1', type: 'table', labelEn: 'Round Table', labelAr: 'طاولة دائرية', x: 28, y: 38, rotation: 0, seats: 10 },
  { id: 'table-2', type: 'table', labelEn: 'Round Table', labelAr: 'طاولة دائرية', x: 72, y: 38, rotation: 0, seats: 10 },
  { id: 'dance-1', type: 'dance', labelEn: 'Dance Floor', labelAr: 'منصة رقص', x: 50, y: 58, rotation: 0 },
];

interface DesignerProps { language: Language; initialDesign?: Hall3DProfile; onSaveDesign?: (design: Hall3DProfile) => void; onClose?: () => void; }

export function EventLayoutDesigner({ language, initialDesign, onSaveDesign, onClose }: DesignerProps) {
  const isAr = language === 'ar';
  const [eventKind, setEventKind] = useState<EventKind>('engagement');
  const [locationKind, setLocationKind] = useState<LocationKind>('client');
  const [guests, setGuests] = useState(250);
  const [width, setWidth] = useState(initialDesign?.width ?? 20);
  const [depth, setDepth] = useState(initialDesign?.depth ?? 30);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('3d');
  const [cameraYaw, setCameraYaw] = useState(0);
  const [items, setItems] = useState<LayoutItem[]>(initialDesign?.items?.length ? initialDesign.items : INITIAL_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>('stage-1');
  const [clientView, setClientView] = useState(false);
  const [saved, setSaved] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [autoBuilderOpen, setAutoBuilderOpen] = useState(false);
  const [autoSelection, setAutoSelection] = useState<Record<string, number>>({ table: 0, stage: 1, screen: 1, podium: 0, dance: 1, flowers: 0, buffet: 0, registration: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; el: HTMLButtonElement; pointerId: number; startClientX: number; startClientY: number; startX: number; startY: number; x: number; y: number; dx: number; dy: number; rotation: number; canvasWidth: number; canvasHeight: number } | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const eventName = EVENT_NAMES[eventKind][isAr ? 1 : 0];

  const tableCount = Math.max(1, Math.ceil(guests / 10));

  const addItem = (type: string) => {
    const source = ITEM_LIBRARY.find((item) => item.type === type);
    if (!source) return;
    const item: LayoutItem = {
      id: `${type}-${Date.now()}`,
      type,
      labelEn: source.labelEn,
      labelAr: source.labelAr,
      x: 50,
      y: 45,
      rotation: 0,
      seats: type === 'table' ? 10 : undefined,
    };
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    setSaved(false);
  };

  const updateSelected = (patch: Partial<LayoutItem>) => {
    if (!selectedId) return;
    setItems((prev) => prev.map((item) => item.id === selectedId ? { ...item, ...patch } : item));
    setSaved(false);
  };

  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    updateSelected({ x: Math.max(5, Math.min(95, selected.x + dx)), y: Math.max(5, Math.min(95, selected.y + dy)) });
  };

  const applyDragTransform = (drag: NonNullable<typeof dragRef.current>) => {
    drag.el.style.transform = `translate3d(${drag.dx}px, ${drag.dy}px, 0) rotate(${drag.rotation}deg)`;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, item: LayoutItem) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    setSelectedId(item.id);
    dragRef.current = {
      id: item.id,
      el: event.currentTarget,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: item.x,
      startY: item.y,
      x: item.x,
      y: item.y,
      dx: 0,
      dy: 0,
      rotation: item.rotation,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
    };

    event.currentTarget.style.transition = 'none';
    event.currentTarget.style.willChange = 'transform';
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
  };

  const updateDragFromPointer = (clientX: number, clientY: number, pointerId: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;

    const dx = clientX - drag.startClientX;
    const dy = clientY - drag.startClientY;
    drag.dx = dx;
    drag.dy = dy;
    drag.x = Math.max(2, Math.min(98, drag.startX + (dx / drag.canvasWidth) * 100));
    drag.y = Math.max(2, Math.min(98, drag.startY + (dy / drag.canvasHeight) * 100));

    applyDragTransform(drag);
  };

  const finishDrag = (clientX: number, clientY: number, pointerId: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;

    updateDragFromPointer(clientX, clientY, pointerId);
    const finalX = drag.x;
    const finalY = drag.y;
    const element = drag.el;
    const originalTransform = `rotate(${drag.rotation}deg)`;

    setItems((prev) => prev.map((item) =>
      item.id === drag.id ? { ...item, x: finalX, y: finalY } : item
    ));
    setSaved(false);

    try { element.releasePointerCapture(drag.pointerId); } catch {}
    element.style.transform = originalTransform;
    element.style.willChange = 'auto';
    dragRef.current = null;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selected || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
      const step = event.shiftKey ? 2.5 : 0.5;
      if (event.key === 'ArrowUp') { event.preventDefault(); nudge(0, -step); }
      if (event.key === 'ArrowDown') { event.preventDefault(); nudge(0, step); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-step, 0); }
      if (event.key === 'ArrowRight') { event.preventDefault(); nudge(step, 0); }
    };

    const onWindowPointerMove = (event: PointerEvent) => updateDragFromPointer(event.clientX, event.clientY, event.pointerId);
    const onWindowPointerUp = (event: PointerEvent) => finishDrag(event.clientX, event.clientY, event.pointerId);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, []);

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    finishDrag(event.clientX, event.clientY, event.pointerId);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy: LayoutItem = { ...selected, id: `${selected.type}-${Date.now()}`, x: Math.min(90, selected.x + 8), y: Math.min(90, selected.y + 6) };
    setItems((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    setSaved(false);
  };

  const deleteSelected = () => {
    if (!selected) return;
    setItems((prev) => prev.filter((item) => item.id !== selected.id));
    setSelectedId(null);
    setSaved(false);
  };

  const buildSelectedLayout = () => {
    const next: LayoutItem[] = [];
    const margin = Math.max(1, Math.min(width, depth) * 0.05);
    const toPercent = (x: number, y: number) => ({ x: Math.max(4, Math.min(96, ((x / width) + 0.5) * 100)), y: Math.max(4, Math.min(96, ((y / depth) + 0.5) * 100)) });
    const add = (type: string, index: number, x: number, y: number) => {
      const source = ITEM_LIBRARY.find((entry) => entry.type === type); if (!source) return;
      const p = toPercent(x, y);
      next.push({ id: 'auto-' + type + '-' + index, type, labelEn: source.labelEn, labelAr: source.labelAr, x: p.x, y: p.y, rotation: 0, seats: type === 'table' ? 10 : undefined });
    };
    const tableQty = autoSelection.table || 0;
    const cols = Math.max(1, Math.min(6, Math.floor((width - margin * 2) / 3.8)));
    for (let i = 0; i < tableQty; i++) { const row = Math.floor(i / cols); const col = i % cols; const x = cols === 1 ? 0 : -((cols - 1) * 3.8) / 2 + col * 3.8; add('table', i + 1, x, -depth / 2 + margin + 4 + row * 3.8); }
    const simple = ['stage','screen','podium','dance','flowers','buffet','registration'];
    simple.forEach((type) => { const qty = autoSelection[type] || 0; for (let i = 0; i < qty; i++) { const x = (i - (qty - 1) / 2) * (type === 'stage' || type === 'screen' ? 8 : 2.5); const y = type === 'dance' ? depth / 2 - margin - 2.5 : -depth / 2 + margin + (type === 'screen' ? 1 : type === 'stage' ? 2 : 5); add(type, i + 1, x, y); } });
    setItems(next); setSelectedId(next[0]?.id ?? null); setSaved(false); setAutoBuilderOpen(false);
  };

  const saveDesign = () => {
    onSaveDesign?.({ width, depth, items });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const itemVisual = (item: LayoutItem) => {
    const common = 'absolute flex items-center justify-center select-none';
    if (item.type === 'table') return `${common} w-14 h-14 rounded-full border-2 border-amber-300/70 bg-amber-200/20 text-amber-100`;
    if (item.type === 'chairs') return `${common} w-7 h-7 rounded-md border border-slate-300/50 bg-slate-300/20 text-slate-200`;
    if (item.type === 'stage') return `${common} w-40 h-12 rounded-lg border-2 border-slate-300/50 bg-slate-400/20 text-white font-bold`;
    if (item.type === 'screen') return `${common} w-32 h-5 rounded border border-sky-300/70 bg-sky-200/25 text-[9px] text-sky-100`;
    if (item.type === 'podium') return `${common} w-10 h-12 rounded border border-slate-300/60 bg-slate-300/20 text-slate-100`;
    if (item.type === 'dance') return `${common} w-28 h-16 rounded-lg border-2 border-amber-200/50 bg-amber-100/10 text-[10px] text-amber-100`;
    if (item.type === 'flowers') return `${common} w-10 h-10 rounded-full border border-pink-200/60 bg-pink-200/15 text-pink-100`;
    if (item.type === 'buffet') return `${common} w-28 h-9 rounded border border-emerald-200/50 bg-emerald-200/10 text-[9px] text-emerald-100`;
    return `${common} w-24 h-9 rounded border border-slate-300/50 bg-slate-300/10 text-[9px] text-slate-100`;
  };

  const title = isAr ? 'مصمم مخطط المناسبة' : 'Event Layout Designer';
  const subtitle = isAr ? 'خطط أي مناسبة في قاعة السرايا أو في موقع العميل خلال دقائق.' : 'Plan any event at a Saraya venue or at the client’s location in minutes.';

  return (
    <section className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {!clientView && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">SARAYA EVENT</div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setLayoutMode('2d')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${layoutMode === '2d' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>{isAr ? 'مخطط 2D' : '2D Plan'}</button>
              <button type="button" onClick={() => setLayoutMode('3d')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${layoutMode === '3d' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>{isAr ? 'منظور 3D' : '3D View'}</button>
              <button type="button" onClick={() => setLayoutMode('pov')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${layoutMode === 'pov' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>{isAr ? 'منظور الشخص' : 'Inside POV'}</button>
              <button type="button" onClick={() => setClientView(true)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white">{isAr ? 'عرض العميل' : 'Client View'}</button>
              <button type="button" onClick={saveDesign} className="px-3 py-2 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />{saved ? (isAr ? 'تم الحفظ' : 'Saved') : (isAr ? 'حفظ التصميم' : 'Save Design')}</button>
            </div>
          </div>
        </div>
      )}

      {clientView ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="p-5 sm:p-7 border-b border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] tracking-wider text-amber-400 font-bold">SARAYA EVENT</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{projectName || eventName}</h2>
              <p className="text-sm text-slate-400 mt-1">{guests} {isAr ? 'ضيف' : 'guests'} · {locationKind === 'client' ? (isAr ? 'موقع العميل' : 'Client Location') : (isAr ? 'قاعة السرايا' : 'Saraya Venue')}</p>
            </div>
            <button type="button" onClick={() => setClientView(false)} className="p-2 rounded-lg bg-slate-800 text-slate-200"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-3 sm:p-6">
            <div className="relative mx-auto max-w-5xl h-[520px] sm:h-[620px] overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950">
              <div className="absolute inset-[7%] border border-white/10 rounded-xl">
                {items.map((item) => (
                  <div key={item.id} className={itemVisual(item)} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `rotate(${item.rotation}deg)` }}>
                    {item.type === 'screen' ? 'LED SCREEN' : item.type === 'stage' ? (isAr ? 'منصة' : 'STAGE') : item.type === 'dance' ? (isAr ? 'رقص' : 'DANCE') : item.type === 'table' ? '10' : item.type === 'chairs' ? '●' : item.type === 'flowers' ? '✿' : item.labelEn}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_220px] gap-3">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="text-xs font-bold text-white mb-3">{isAr ? 'بيانات المناسبة' : 'Event Setup'}</div>
            <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'اسم التصميم' : 'Design Name'}</label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder={isAr ? 'مثال: خطوبة أحمد وسارة' : 'e.g. Ahmed & Sara Engagement'} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-400" />

            <label className="block text-[11px] text-slate-400 mt-3 mb-1">{isAr ? 'نوع المناسبة' : 'Event Type'}</label>
            <select value={eventKind} onChange={(e) => setEventKind(e.target.value as EventKind)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white">
              {Object.entries(EVENT_NAMES).map(([key, value]) => <option key={key} value={key}>{value[isAr ? 1 : 0]}</option>)}
            </select>

            <label className="block text-[11px] text-slate-400 mt-3 mb-1">{isAr ? 'المكان' : 'Location'}</label>
            <select value={locationKind} onChange={(e) => setLocationKind(e.target.value as LocationKind)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white">
              <option value="saraya">{isAr ? 'قاعة السرايا' : 'Saraya Venue'}</option>
              <option value="client">{isAr ? 'موقع العميل' : 'Client Location'}</option>
              <option value="custom">{isAr ? 'مساحة مخصصة' : 'Custom Space'}</option>
            </select>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <label className="text-[11px] text-slate-400">{isAr ? 'الضيوف' : 'Guests'}<input type="number" min={1} max={5000} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(5000, Number(e.target.value) || 1)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white" /></label>
              <label className="text-[11px] text-slate-400">{isAr ? 'العرض م' : 'Width m'}<input type="number" min={3} max={200} value={width} onChange={(e) => setWidth(Math.max(3, Math.min(200, Number(e.target.value) || 3)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white" /></label>
            </div>
            <label className="block text-[11px] text-slate-400 mt-2">{isAr ? 'العمق م' : 'Depth m'}<input type="number" min={3} max={200} value={depth} onChange={(e) => setDepth(Math.max(3, Math.min(200, Number(e.target.value) || 3)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /></label>

            <button type="button" onClick={() => setAutoBuilderOpen(true)} className="mt-3 w-full rounded-lg bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-white">{isAr ? 'إنشاء تخطيط تلقائي' : 'Build Auto Layout'}</button>

            <div className="mt-5 border-t border-slate-800 pt-3">
              <div className="text-xs font-bold text-white mb-2">{isAr ? 'إضافة عناصر' : 'Add Items'}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {ITEM_LIBRARY.map((item) => {
                  const Icon = item.icon;
                  return <button key={item.type} type="button" onClick={() => addItem(item.type)} className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 hover:border-slate-500 text-[10px] text-slate-300 flex items-center gap-1.5 px-2"><Plus className="w-3 h-3 text-amber-400" /><Icon className="w-3.5 h-3.5" /><span className="truncate">{isAr ? item.labelAr : item.labelEn}</span></button>;
                })}
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-2 sm:p-3 min-w-0">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="text-xs font-bold text-white">{isAr ? eventName : eventName} · {width} × {depth}m</div>
              <div className="text-[10px] text-slate-500">{items.length} {isAr ? 'عنصر' : 'items'}</div>
            </div>
            <div className="relative w-full aspect-[4/3] min-h-[420px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              {layoutMode === '2d' ? (
                <div ref={canvasRef} className="absolute inset-[7%] rounded-lg border-2 border-slate-500/80 bg-slate-900 overflow-hidden" style={{ touchAction: 'none' }}>
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(to right, rgba(148,163,184,.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.25) 1px, transparent 1px)', backgroundSize: '8% 10%' }} />
                  <div className="absolute -top-7 start-0 end-0 text-center text-[10px] text-slate-500">{isAr ? 'حدود المكان · الواجهة' : 'SPACE BOUNDARY · FRONT / STAGE SIDE'}</div>
                  {items.map((item) => (
                    <button key={item.id} type="button" onPointerDown={(event) => handlePointerDown(event, item)} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className={`${itemVisual(item)} cursor-grab active:cursor-grabbing touch-none ${selectedId === item.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `rotate(${item.rotation}deg)`, willChange: 'transform', transition: 'none', touchAction: 'none', userSelect: 'none' }}>
                      {item.type === 'screen' ? 'LED' : item.type === 'stage' ? (isAr ? 'منصة' : 'STAGE') : item.type === 'dance' ? (isAr ? 'رقص' : 'DANCE') : item.type === 'table' ? <><span className="relative z-10">{item.seats || 10}</span>{Array.from({ length: item.seats || 10 }, (_, seat) => <span key={seat} className="absolute w-2 h-2 rounded-full bg-slate-200/80" style={{ left: (50 + Math.cos((seat / (item.seats || 10)) * Math.PI * 2) * 68) + '%', top: (50 + Math.sin((seat / (item.seats || 10)) * Math.PI * 2) * 68) + '%' }} />)}</> : item.type === 'chairs' ? '●' : item.type === 'flowers' ? '✿' : item.type === 'buffet' ? (isAr ? 'بوفيه' : 'BUFFET') : item.type === 'podium' ? 'P' : 'REG'}
                    </button>
                  ))}
                </div>
              ) : (
                <EventLayout3D
                  items={items}
                  width={width}
                  depth={depth}
                  language={language}
                  mode={layoutMode === 'pov' ? 'pov' : 'overview'}
                  onSelect={setSelectedId}
                  onMove={(id, x, y) => {
                    setItems((prev) => prev.map((item) => item.id === id ? { ...item, x, y } : item));
                    setSaved(false);
                  }}
                />
              )}            </div>
          </section>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="text-xs font-bold text-white mb-3">{isAr ? 'العنصر المحدد' : 'Selected Item'}</div>
            {selected ? (
              <>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <div className="text-sm font-bold text-white">{isAr ? selected.labelAr : selected.labelEn}</div>
                  {selected.type === 'table' && <div className="text-[10px] text-slate-500 mt-1">{isAr ? '10 مقاعد' : '10 seats'}</div>}
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  <button type="button" onClick={() => nudge(0, -3)} className="p-2 rounded-lg bg-slate-800 text-slate-200 flex justify-center"><ChevronUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => updateSelected({ rotation: selected.rotation + 15 })} className="p-2 rounded-lg bg-slate-800 text-slate-200 flex justify-center"><RotateCw className="w-4 h-4" /></button>
                  <button type="button" onClick={() => nudge(0, 3)} className="p-2 rounded-lg bg-slate-800 text-slate-200 flex justify-center"><ChevronDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => nudge(isAr ? 3 : -3, 0)} className="p-2 rounded-lg bg-slate-800 text-slate-200 flex justify-center"><ChevronLeft className="w-4 h-4" /></button>
                  <button type="button" onClick={() => duplicateSelected()} className="p-2 rounded-lg bg-slate-800 text-slate-200 flex justify-center"><Copy className="w-4 h-4" /></button>
                  <button type="button" onClick={() => nudge(isAr ? -3 : 3, 0)} className="p-2 rounded-lg bg-slate-800 text-slate-200 flex justify-center"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <button type="button" onClick={deleteSelected} className="mt-3 w-full rounded-lg border border-red-900/60 bg-red-950/30 py-2 text-xs font-bold text-red-300 flex items-center justify-center gap-2"><Trash2 className="w-3.5 h-3.5" />{isAr ? 'حذف' : 'Delete'}</button>
              </>
            ) : (
              <div className="text-xs text-slate-500">{isAr ? 'اختر عنصراً من المخطط.' : 'Select an item on the plan.'}</div>
            )}
            <div className="mt-5 border-t border-slate-800 pt-3">
              <div className="text-[10px] text-slate-500">{isAr ? 'ملخص' : 'Summary'}</div>
              <div className="mt-2 text-xs text-slate-300">{guests} {isAr ? 'ضيف' : 'guests'}</div>
              <div className="text-xs text-slate-300">{tableCount} {isAr ? 'طاولة تقريباً' : 'tables approx.'}</div>
              <div className="text-xs text-slate-300">{locationKind === 'client' ? (isAr ? 'موقع العميل' : 'Client location') : (isAr ? 'قاعة السرايا' : 'Saraya venue')}</div>
            </div>
          </aside>
        </div>
      )}
      {autoBuilderOpen && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4" onClick={() => setAutoBuilderOpen(false)}><div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-widest text-amber-400">AUTO LAYOUT BUILDER</div><h2 className="mt-1 text-xl font-black text-white">{isAr ? "اختر ما تحتاجه أولاً" : "Choose what you need first"}</h2><p className="mt-1 text-xs text-slate-500">{isAr ? "يمكنك اختيار أكثر من عنصر وتحديد الكمية لكل عنصر." : "Select multiple elements and set the quantity for each."}</p></div><button type="button" onClick={() => setAutoBuilderOpen(false)} className="p-2 rounded-xl bg-slate-800"><X className="w-4 h-4" /></button></div><div className="mt-5 grid sm:grid-cols-2 gap-2">{ITEM_LIBRARY.map((item) => { const Icon = item.icon; const value = autoSelection[item.type] || 0; return <label key={item.type} className={"flex items-center gap-3 rounded-xl border p-3 cursor-pointer " + (value > 0 ? "border-amber-400/50 bg-amber-400/10" : "border-slate-800 bg-slate-950/60")}><input type="checkbox" checked={value > 0} onChange={(e) => setAutoSelection((prev) => ({ ...prev, [item.type]: e.target.checked ? (item.type === "table" ? Math.max(1, Math.ceil(guests / 10)) : 1) : 0 }))} className="accent-amber-400" /><Icon className="w-4 h-4 text-amber-400" /><span className="flex-1 text-xs font-bold text-white">{isAr ? item.labelAr : item.labelEn}{item.type === "table" && <span className="block text-[9px] font-normal text-slate-500">{isAr ? "كل طاولة معها كراسي" : "chairs included with every table"}</span>}</span>{value > 0 && <input type="number" min={1} max={500} value={value} onChange={(e) => setAutoSelection((prev) => ({ ...prev, [item.type]: Math.max(1, Math.min(500, Number(e.target.value) || 1)) }))} className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white" />}</label>; })}</div><div className="mt-5 flex justify-between"><button type="button" onClick={() => setAutoSelection({ table: 0, stage: 1, screen: 1, podium: 0, dance: 1, flowers: 0, buffet: 0, registration: 0 })} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white">{isAr ? "إعادة ضبط" : "Reset"}</button><button type="button" onClick={buildSelectedLayout} className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black">{isAr ? "إنشاء المخطط" : "Create Layout"}</button></div></div></div>}
    </section>
  );
}
