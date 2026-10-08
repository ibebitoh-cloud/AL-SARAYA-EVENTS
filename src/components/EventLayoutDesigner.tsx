import { useRef, useState } from 'react';
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
import { Language } from '../types/venueSystem';
import { EventLayout3D } from './EventLayout3D';

type LayoutMode = '2d' | '3d' | 'pov';
type EventKind = 'engagement' | 'wedding' | 'conference' | 'summit' | 'birthday' | 'other';
type LocationKind = 'saraya' | 'client' | 'custom';

type LayoutItem = {
  id: string;
  type: string;
  labelEn: string;
  labelAr: string;
  x: number;
  y: number;
  rotation: number;
  quantity?: number;
  seats?: number;
};

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

export function EventLayoutDesigner({ language }: { language: Language }) {
  const isAr = language === 'ar';
  const [eventKind, setEventKind] = useState<EventKind>('engagement');
  const [locationKind, setLocationKind] = useState<LocationKind>('client');
  const [guests, setGuests] = useState(250);
  const [width, setWidth] = useState(20);
  const [depth, setDepth] = useState(30);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('3d');
  const [cameraYaw, setCameraYaw] = useState(0);
  const [items, setItems] = useState<LayoutItem[]>(INITIAL_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>('stage-1');
  const [clientView, setClientView] = useState(false);
  const [saved, setSaved] = useState(false);
  const [projectName, setProjectName] = useState('');
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; el: HTMLButtonElement; pointerId: number; offsetX: number; offsetY: number } | null>(null);

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

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, item: LayoutItem) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(item.id);
    const itemRect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id: item.id,
      el: event.currentTarget,
      pointerId: event.pointerId,
      offsetX: event.clientX - (itemRect.left + itemRect.width / 2),
      offsetY: event.clientY - (itemRect.top + itemRect.height / 2),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || drag.pointerId !== event.pointerId) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((event.clientX - drag.offsetX - rect.left) / rect.width) * 100));
    const y = Math.max(3, Math.min(97, ((event.clientY - drag.offsetY - rect.top) / rect.height) * 100));

    drag.el.style.left = `${x}%`;
    drag.el.style.top = `${y}%`;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || drag.pointerId !== event.pointerId) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((event.clientX - drag.offsetX - rect.left) / rect.width) * 100));
    const y = Math.max(3, Math.min(97, ((event.clientY - drag.offsetY - rect.top) / rect.height) * 100));

    setItems((prev) => prev.map((item) => item.id === drag.id ? { ...item, x, y } : item));
    setSaved(false);
    try { drag.el.releasePointerCapture(drag.pointerId); } catch {}
    dragRef.current = null;
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

  const autoLayout = () => {
    // Build in real metres first, then convert to the designer's 0–100% coordinates.
    // This prevents the old layout from placing objects on top of each other or outside
    // a small client space just because the percentage grid was the same size.
    const next: LayoutItem[] = [];
    const margin = Math.max(1.0, Math.min(width, depth) * 0.05);
    const usableW = Math.max(2, width - margin * 2);
    const usableD = Math.max(2, depth - margin * 2);
    const toPercent = (mx: number, mz: number) => ({
      x: Math.max(3, Math.min(97, ((mx / width) + 0.5) * 100)),
      y: Math.max(3, Math.min(97, ((mz / depth) + 0.5) * 100)),
    });
    const add = (base: Omit<LayoutItem, 'x' | 'y'>, mx: number, mz: number) => {
      const p = toPercent(mx, mz);
      next.push({ ...base, ...p });
    };

    const stageW = Math.min(8, usableW * 0.58);
    const stageD = Math.min(3.2, usableD * 0.16);
    const stageZ = -depth / 2 + margin + stageD / 2;
    add({ id: 'stage-auto', type: 'stage', labelEn: 'Stage', labelAr: 'منصة', rotation: 0 }, 0, stageZ);
    add({ id: 'screen-auto', type: 'screen', labelEn: 'LED Screen', labelAr: 'شاشة LED', rotation: 0 }, 0, stageZ + stageD * 0.12);

    if (eventKind === 'conference' || eventKind === 'summit') {
      const chairW = 0.7;
      const chairD = 0.75;
      const gapX = 0.45;
      const gapZ = 0.7;
      const cols = Math.max(1, Math.min(12, Math.floor((usableW + gapX) / (chairW + gapX))));
      const maxRows = Math.max(1, Math.floor((usableD - stageD - 2.0) / (chairD + gapZ)));
      const count = Math.min(guests, cols * maxRows, 180);
      const startX = -((cols - 1) * (chairW + gapX)) / 2;
      const startZ = stageZ + stageD / 2 + 1.6 + chairD / 2;
      add({ id: 'podium-auto', type: 'podium', labelEn: 'Podium', labelAr: 'منصة خطاب', rotation: 0 }, 0, stageZ + stageD / 2 + 0.8);
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        add({ id: `chair-auto-${i}`, type: 'chairs', labelEn: 'Chair', labelAr: 'كرسي', rotation: 0 }, startX + col * (chairW + gapX), startZ + row * (chairD + gapZ));
      }
    } else {
      const tableD = 3.5;
      const tableW = 3.5;
      const aisle = Math.max(1.0, Math.min(1.8, Math.min(width, depth) * 0.07));
      const cols = Math.max(1, Math.min(6, Math.floor((usableW + aisle) / (tableW + aisle))));
      const rows = Math.max(1, Math.min(8, Math.ceil(tableCount / cols)));
      const neededW = cols * tableW + (cols - 1) * aisle;
      const neededD = rows * tableD + (rows - 1) * aisle;
      const scale = Math.min(1, usableW / neededW, Math.max(1, (usableD - stageD - 2) / neededD));
      const spacingW = tableW * scale;
      const spacingD = tableD * scale;
      const gap = aisle * scale;
      const startX = -(cols * spacingW + (cols - 1) * gap) / 2 + spacingW / 2;
      const startZ = stageZ + stageD / 2 + 2 + spacingD / 2;
      const count = Math.min(tableCount, cols * rows);
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        add({ id: `table-auto-${i}`, type: 'table', labelEn: 'Round Table', labelAr: 'طاولة دائرية', rotation: 0, seats: 10 }, startX + col * (spacingW + gap), startZ + row * (spacingD + gap));
      }
      const danceW = Math.min(5.2, usableW * 0.34);
      const danceD = Math.min(3.8, usableD * 0.15);
      const danceZ = depth / 2 - margin - danceD / 2;
      add({ id: 'dance-auto', type: 'dance', labelEn: 'Dance Floor', labelAr: 'منصة رقص', rotation: 0 }, 0, danceZ);
    }

    setItems(next);
    setSelectedId(next[0]?.id ?? null);
    setSaved(false);
  };

  const saveDesign = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const itemVisual = (item: LayoutItem) => {
    const common = 'absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center select-none';
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
                  <div key={item.id} className={itemVisual(item)} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%,-50%) rotate(${item.rotation}deg)` }}>
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

            <button type="button" onClick={autoLayout} className="mt-3 w-full rounded-lg bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-white">{isAr ? 'تخطيط سريع تلقائي' : 'Quick Auto Layout'}</button>

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
                    <button key={item.id} type="button" onPointerDown={(event) => handlePointerDown(event, item)} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className={`${itemVisual(item)} cursor-grab active:cursor-grabbing touch-none ${selectedId === item.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%,-50%) rotate(${item.rotation}deg)`, willChange: 'left, top' }}>
                      {item.type === 'screen' ? 'LED' : item.type === 'stage' ? (isAr ? 'منصة' : 'STAGE') : item.type === 'dance' ? (isAr ? 'رقص' : 'DANCE') : item.type === 'table' ? item.seats : item.type === 'chairs' ? '●' : item.type === 'flowers' ? '✿' : item.type === 'buffet' ? (isAr ? 'بوفيه' : 'BUFFET') : item.type === 'podium' ? 'P' : 'REG'}
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
    </section>
  );
}
