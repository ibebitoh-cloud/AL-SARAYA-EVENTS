import { useEffect, useRef, useState } from 'react';
import {
  Armchair,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Redo2,
  DoorOpen,
  Monitor,
  Move3d,
  Plus,
  RotateCw,
  Save,
  Grid3X3,
  FolderOpen,
  Files,
  Pencil,
  Presentation,
  ScreenShare,
  Sparkles,
  Trash2,
  Undo2,
  Utensils,
  Users,
  X,
} from 'lucide-react';
import { Hall, Hall3DProfile, HallLayoutItem, Language, LocationId, SavedHallLayout } from '../types/venueSystem';
import { EventLayout3D } from './EventLayout3D';
import { LOCATIONS, hallLocation } from '../data/locations';

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
  { type: 'buffet', labelEn: 'Buffet', labelAr: 'بوفيه', icon: Sparkles },
  { type: 'registration', labelEn: 'Registration', labelAr: 'تسجيل', icon: DoorOpen },
  { type: 'entrance', labelEn: 'Entrance Portal', labelAr: 'بوابة دخول كبيرة', icon: DoorOpen },
  { type: 'exit', labelEn: 'Exit Portal', labelAr: 'بوابة خروج كبيرة', icon: DoorOpen },
  { type: 'bar', labelEn: 'Service Bar', labelAr: 'بار ضيافة كبير', icon: Utensils },
  { type: 'lounge', labelEn: 'Lounge Zone', labelAr: 'منطقة جلوس كبيرة', icon: Users },
  { type: 'led_wall', labelEn: 'Large LED Wall', labelAr: 'جدار شاشة LED كبير', icon: Monitor },
  { type: 'truss', labelEn: 'Lighting Truss', labelAr: 'جسر إضاءة كبير', icon: Sparkles },
] as const;

// Ready-made table sets (table + chairs) with real sizes, added in bulk from the designer.
const TABLE_SETS = [6, 8, 10].flatMap((seats) => [
  { id: `round180-${seats}`, shape: 'round' as const, widthM: 1.8, depthM: 1.8, seats, labelEn: `Round 180cm · ${seats} chairs`, labelAr: `طاولة دائرية 180سم · ${seats} كراسي` },
  { id: `rect1x2-${seats}`, shape: 'rect' as const, widthM: 2, depthM: 1, seats, labelEn: `Rect 1×2m · ${seats} chairs`, labelAr: `طاولة مستطيلة 1×2م · ${seats} كراسي` },
]).sort((a, b) => (a.shape === b.shape ? a.seats - b.seats : a.shape === 'round' ? -1 : 1));

// Dot positions (in % of the 2D marker) for the chairs around a table.
const seatDots = (item: HallLayoutItem) => {
  const seats = item.seats || 10;
  if (item.shape !== 'rect') return Array.from({ length: seats }, (_, i) => ({ left: 50 + Math.cos((i / seats) * Math.PI * 2) * 68, top: 50 + Math.sin((i / seats) * Math.PI * 2) * 68 }));
  const ends = seats >= 8 ? 1 : 0;
  const perSide = Math.ceil((seats - ends * 2) / 2);
  const dots: { left: number; top: number }[] = [];
  for (let i = 0; i < perSide; i++) {
    const left = (100 / perSide) * (i + 0.5);
    dots.push({ left, top: 128 });
    if (i < seats - ends * 2 - perSide) dots.push({ left, top: -28 });
  }
  if (ends) dots.push({ left: 112, top: 50 }, { left: -12, top: 50 });
  return dots;
};

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

interface DesignerProps { language: Language; initialDesign?: Hall3DProfile; onSaveDesign?: (design: Hall3DProfile) => void; onClose?: () => void; halls?: Hall[]; onUpdateHall?: (hall: Hall) => void; }

export function EventLayoutDesigner({ language, initialDesign, onSaveDesign, onClose, halls = [], onUpdateHall }: DesignerProps) {
  const isAr = language === 'ar';
  const [locationId, setLocationId] = useState<LocationId>(() => halls[0] ? hallLocation(halls[0]) : 'arcane');
  const locationHalls = halls.filter((hall) => hallLocation(hall) === locationId);
  const [hallId, setHallId] = useState(() => halls.find((hall) => hallLocation(hall) === 'arcane')?.id || halls[0]?.id || '');
  const activeHall = halls.find((hall) => hall.id === hallId);
  const [eventKind, setEventKind] = useState<EventKind>('engagement');
  const [locationKind, setLocationKind] = useState<LocationKind>('client');
  const [guests, setGuests] = useState(250);
  const initialHall = halls.find((hall) => hall.id === (halls.find((entry) => hallLocation(entry) === 'arcane')?.id || halls[0]?.id));
  const [width, setWidth] = useState(initialDesign?.width ?? initialHall?.default3D?.width ?? 20);
  const [depth, setDepth] = useState(initialDesign?.depth ?? initialHall?.default3D?.depth ?? 30);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('3d');
  const [cameraYaw, setCameraYaw] = useState(0);
  const [items, setItems] = useState<LayoutItem[]>(() => {
    if (initialDesign?.items?.length) return initialDesign.items;
    if (halls.length) return initialHall?.default3D?.items?.length ? initialHall.default3D.items : INITIAL_ITEMS;
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('saraya-event-layout-design-v1') : null;
      if (stored) {
        const parsed = JSON.parse(stored) as { items?: LayoutItem[]; width?: number; depth?: number; projectName?: string };
        if (Array.isArray(parsed.items) && parsed.items.length) return parsed.items;
      }
    } catch {}
    return INITIAL_ITEMS;
  });
  const [history, setHistory] = useState<LayoutItem[][]>([]);
  const [future, setFuture] = useState<LayoutItem[][]>([]);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>('stage-1');
  const [clientView, setClientView] = useState(false);
  const [saved, setSaved] = useState(false);
  const [projectName, setProjectName] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('saraya-event-layout-design-v1') : null;
      return stored ? ((JSON.parse(stored) as { projectName?: string }).projectName || '') : '';
    } catch { return ''; }
  });
  const [autoBuilderOpen, setAutoBuilderOpen] = useState(false);
  const [autoSelection, setAutoSelection] = useState<Record<string, number>>({ table: 0, stage: 1, screen: 1, podium: 0, dance: 1, buffet: 0, registration: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; el: HTMLButtonElement; pointerId: number; startClientX: number; startClientY: number; startX: number; startY: number; x: number; y: number; dx: number; dy: number; rotation: number; canvasWidth: number; canvasHeight: number } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('saraya-event-layout-design-v1', JSON.stringify({ width, depth, items, projectName }));
    } catch {}
  }, [width, depth, items, projectName]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const eventName = EVENT_NAMES[eventKind][isAr ? 1 : 0];

  const tableCount = Math.max(1, Math.ceil(guests / 10));
  const commitItems = (next: LayoutItem[] | ((previous: LayoutItem[]) => LayoutItem[])) => {
    setItems((previous) => {
      const resolved = typeof next === 'function' ? next(previous) : next;
      setHistory((stack) => [...stack.slice(-39), previous]);
      setFuture([]);
      return resolved;
    });
    setSaved(false);
  };
  const undo = () => setHistory((stack) => { if (!stack.length) return stack; const previous = stack[stack.length - 1]; setFuture((redoStack) => [items, ...redoStack]); setItems(previous); setSaved(false); return stack.slice(0, -1); });
  const redo = () => setFuture((stack) => { if (!stack.length) return stack; const next = stack[0]; setHistory((undoStack) => [...undoStack, items]); setItems(next); setSaved(false); return stack.slice(1); });

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
    commitItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    setSaved(false);
  };

  // Adds `qty` copies of a table set in a grid, spaced by the set's real footprint (table + chairs).
  const addTableSet = (setId: string, qty: number) => {
    const set = TABLE_SETS.find((entry) => entry.id === setId);
    if (!set || qty < 1) return;
    const stepX = set.widthM + 1.6;
    const stepY = set.depthM + 1.6;
    const cols = Math.max(1, Math.floor((width * 0.9) / stepX));
    const stamp = Date.now();
    // Start the new batch one row below the lowest table already on the plan.
    const tableRows = items.filter((item) => item.type === 'table').map((item) => (item.y / 100 - 0.5) * depth);
    const startY = tableRows.length ? Math.max(...tableRows) + stepY : -depth * 0.2;
    const added: LayoutItem[] = Array.from({ length: qty }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const usedCols = Math.min(cols, qty);
      const xM = (col - (usedCols - 1) / 2) * stepX;
      const yM = startY + row * stepY;
      return {
        id: `table-${set.id}-${stamp}-${i}`,
        type: 'table',
        labelEn: set.labelEn,
        labelAr: set.labelAr,
        x: Math.max(4, Math.min(96, (xM / width + 0.5) * 100)),
        y: Math.max(4, Math.min(96, (yM / depth + 0.5) * 100)),
        rotation: 0,
        seats: set.seats,
        shape: set.shape,
        widthM: set.widthM,
        depthM: set.depthM,
      };
    });
    commitItems((prev) => [...prev, ...added]);
    setSelectedId(added[0].id);
    setSaved(false);
  };
  const [setQty, setSetQty] = useState<Record<string, number>>({});

  const updateSelected = (patch: Partial<LayoutItem>) => {
    if (!selectedId) return;
    commitItems((prev) => prev.map((item) => item.id === selectedId ? { ...item, ...patch } : item));
    setSaved(false);
  };

  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    updateSelected({ x: Math.max(5, Math.min(95, selected.x + dx)), y: Math.max(5, Math.min(95, selected.y + dy)) });
  };

  const applyDragTransform = (drag: NonNullable<typeof dragRef.current>) => {
    drag.el.style.transform = `translate(-50%, -50%) translate3d(${drag.dx}px, ${drag.dy}px, 0) rotate(${drag.rotation}deg)`;
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
    const rawX = Math.max(2, Math.min(98, drag.startX + (dx / drag.canvasWidth) * 100));
    const rawY = Math.max(2, Math.min(98, drag.startY + (dy / drag.canvasHeight) * 100));
    drag.x = snapToGrid ? Math.max(2, Math.min(98, Math.round(rawX / 2) * 2)) : rawX;
    drag.y = snapToGrid ? Math.max(2, Math.min(98, Math.round(rawY / 2) * 2)) : rawY;

    applyDragTransform(drag);
  };

  const finishDrag = (clientX: number, clientY: number, pointerId: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;

    updateDragFromPointer(clientX, clientY, pointerId);
    const finalX = drag.x;
    const finalY = drag.y;
    const element = drag.el;
    const originalTransform = `translate(-50%, -50%) rotate(${drag.rotation}deg)`;

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
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelected(); }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelected(); }
      if (event.key === 'Escape') setSelectedId(null);
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
    commitItems((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    setSaved(false);
  };

  const deleteSelected = () => {
    if (!selected) return;
    commitItems((prev) => prev.filter((item) => item.id !== selected.id));
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
    const simple = ['stage','screen','podium','dance','buffet','registration'];
    simple.forEach((type) => { const qty = autoSelection[type] || 0; for (let i = 0; i < qty; i++) { const x = (i - (qty - 1) / 2) * (type === 'stage' || type === 'screen' ? 8 : 2.5); const y = type === 'dance' ? depth / 2 - margin - 2.5 : -depth / 2 + margin + (type === 'screen' ? 1 : type === 'stage' ? 2 : 5); add(type, i + 1, x, y); } });
    commitItems(next); setSelectedId(next[0]?.id ?? null); setAutoBuilderOpen(false);
  };

  const saveDesign = () => {
    try { window.localStorage.setItem('saraya-event-layout-design-v1', JSON.stringify({ width, depth, items, projectName })); } catch {}
    const design = { width, depth, items };
    onSaveDesign?.(design);
    if (activeHall && onUpdateHall) {
      if (activePlanId) {
        const savedLayouts = (activeHall.savedLayouts || []).map((plan) => plan.id === activePlanId ? { ...plan, name: projectName.trim() || plan.name, eventType: eventKind, updatedAt: new Date().toISOString(), design } : plan);
        onUpdateHall({ ...activeHall, savedLayouts });
      } else onUpdateHall({ ...activeHall, default3D: design });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const saveAsPlan = () => {
    if (!activeHall || !onUpdateHall) { saveDesign(); return; }
    const plan: SavedHallLayout = { id: `layout-${Date.now()}`, name: projectName.trim() || (isAr ? `مخطط ${eventName}` : `${eventName} layout`), eventType: eventKind, updatedAt: new Date().toISOString(), design: { width, depth, items } };
    onUpdateHall({ ...activeHall, savedLayouts: [...(activeHall.savedLayouts || []), plan] });
    setActivePlanId(plan.id); setProjectName(plan.name); setSaved(true); setTimeout(() => setSaved(false), 2200);
  };
  const openSavedPlan = (plan: SavedHallLayout) => { setActivePlanId(plan.id); setProjectName(plan.name); setEventKind((EVENT_NAMES[plan.eventType as EventKind] ? plan.eventType : 'other') as EventKind); setWidth(plan.design.width); setDepth(plan.design.depth); setItems(plan.design.items); setHistory([]); setFuture([]); setSelectedId(null); setSaved(true); };
  const duplicateSavedPlan = (plan: SavedHallLayout) => { if (!activeHall || !onUpdateHall) return; const copy = { ...plan, id: `layout-${Date.now()}`, name: `${plan.name} ${isAr ? 'نسخة' : 'copy'}`, updatedAt: new Date().toISOString(), design: { ...plan.design, items: plan.design.items.map((item) => ({ ...item, id: `${item.id}-${Date.now()}` })) } }; onUpdateHall({ ...activeHall, savedLayouts: [...(activeHall.savedLayouts || []), copy] }); };
  const deleteSavedPlan = (id: string) => { if (!activeHall || !onUpdateHall) return; onUpdateHall({ ...activeHall, savedLayouts: (activeHall.savedLayouts || []).filter((plan) => plan.id !== id) }); if (activePlanId === id) setActivePlanId(null); };

  const itemVisual = (item: LayoutItem) => {
    const common = 'absolute flex items-center justify-center select-none';
    if (item.type === 'table' && item.shape === 'rect') return `${common} w-16 h-8 rounded-md border-2 border-amber-300/70 bg-amber-200/20 text-amber-100`;
    if (item.type === 'table') return `${common} w-14 h-14 rounded-full border-2 border-amber-300/70 bg-amber-200/20 text-amber-100`;
    if (item.type === 'chairs') return `${common} w-7 h-7 rounded-md border border-slate-300/50 bg-slate-300/20 text-slate-200`;
    if (item.type === 'stage') return `${common} w-40 h-12 rounded-lg border-2 border-slate-300/50 bg-slate-400/20 text-white font-bold`;
    if (item.type === 'screen') return `${common} w-32 h-5 rounded border border-sky-300/70 bg-sky-200/25 text-[9px] text-sky-100`;
    if (item.type === 'podium') return `${common} w-10 h-12 rounded border border-slate-300/60 bg-slate-300/20 text-slate-100`;
    if (item.type === 'dance') return `${common} w-28 h-16 rounded-lg border-2 border-amber-200/50 bg-amber-100/10 text-[10px] text-amber-100`;
    if (item.type === 'flowers') return `${common} w-10 h-10 rounded-full border border-pink-200/60 bg-pink-200/15 text-pink-100`;
    if (item.type === 'buffet') return `${common} w-28 h-9 rounded border border-emerald-200/50 bg-emerald-200/10 text-[9px] text-emerald-100`;
    if (item.type === 'entrance' || item.type === 'exit') return `${common} w-32 h-12 rounded-lg border-2 border-emerald-200/60 bg-emerald-200/15 text-[9px] font-bold text-emerald-100`;
    if (item.type === 'bar' || item.type === 'lounge') return `${common} w-40 h-16 rounded-xl border-2 border-pink-200/50 bg-pink-200/10 text-[9px] font-bold text-pink-100`;
    if (item.type === 'led_wall' || item.type === 'truss') return `${common} w-48 h-20 rounded-xl border-2 border-sky-200/60 bg-sky-200/10 text-[9px] font-bold text-sky-100`;
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">SARAYA EVENTS</div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setLayoutMode('2d')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${layoutMode === '2d' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>{isAr ? 'مخطط 2D' : '2D Plan'}</button>
              <button type="button" onClick={() => setLayoutMode('3d')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${layoutMode === '3d' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>{isAr ? 'منظور 3D' : '3D View'}</button>
              <button type="button" onClick={() => setLayoutMode('pov')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${layoutMode === 'pov' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>{isAr ? 'منظور الشخص' : 'Inside POV'}</button>
              <button type="button" onClick={() => setClientView(true)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white">{isAr ? 'عرض العميل' : 'Client View'}</button>
              {activeHall && <button type="button" onClick={saveAsPlan} className="px-3 py-2 rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-200 text-xs font-bold flex items-center gap-1.5"><Files className="w-3.5 h-3.5" />{isAr ? 'حفظ كخطة' : 'Save as Plan'}</button>}
              <button type="button" onClick={saveDesign} className="px-3 py-2 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />{saved ? (isAr ? 'تم الحفظ' : 'Saved') : (isAr ? (activePlanId ? 'تحديث الخطة' : 'حفظ الافتراضي') : (activePlanId ? 'Update Plan' : 'Save Default'))}</button>
            </div>
          </div>
        </div>
      )}

      {!clientView && halls.length > 0 && <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-400/40 bg-slate-950/95 p-3 shadow-xl backdrop-blur"><span className="text-[10px] font-black uppercase tracking-widest text-amber-300">{isAr ? 'الموقع الجاري تعديله' : 'EDITING LOCATION'}</span><select value={locationId} onChange={(e) => { const loc = e.target.value as LocationId; setLocationId(loc); const next = halls.find((hall) => hallLocation(hall) === loc); if (next) { setHallId(next.id); setActivePlanId(null); setProjectName(''); setWidth(next.default3D?.width ?? 20); setDepth(next.default3D?.depth ?? 30); setItems(next.default3D?.items?.length ? next.default3D.items : INITIAL_ITEMS); setHistory([]); setFuture([]); } }} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white">{LOCATIONS.map((location) => <option key={location.id} value={location.id}>{isAr ? location.nameAr : location.nameEn}</option>)}</select><select value={hallId} onChange={(e) => { const hall = halls.find((entry) => entry.id === e.target.value); setHallId(e.target.value); setActivePlanId(null); setProjectName(''); if (hall) { setWidth(hall.default3D?.width ?? 20); setDepth(hall.default3D?.depth ?? 30); setItems(hall.default3D?.items?.length ? hall.default3D.items : INITIAL_ITEMS); setHistory([]); setFuture([]); } }} className="min-w-40 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white">{locationHalls.map((hall) => <option key={hall.id} value={hall.id}>{isAr ? hall.name : hall.nameEn || hall.name}</option>)}</select><select value={activePlanId || ''} onChange={(e) => { const plan = activeHall?.savedLayouts?.find((entry) => entry.id === e.target.value); if (plan) openSavedPlan(plan); else { setActivePlanId(null); setProjectName(''); if (activeHall?.default3D) { setWidth(activeHall.default3D.width); setDepth(activeHall.default3D.depth); setItems(activeHall.default3D.items); } } }} className="min-w-36 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white"><option value="">{isAr ? 'التصميم الافتراضي' : 'Default layout'}</option>{(activeHall?.savedLayouts || []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">{activeHall ? (isAr ? activeHall.name : activeHall.nameEn || activeHall.name) : ''}</span><button type="button" disabled={!history.length} onClick={undo} title="Ctrl+Z" className="rounded-lg border border-slate-700 p-2 text-slate-300 disabled:opacity-40"><Undo2 className="h-4 w-4" /></button><button type="button" disabled={!future.length} onClick={redo} title="Ctrl+Y" className="rounded-lg border border-slate-700 p-2 text-slate-300 disabled:opacity-40"><Redo2 className="h-4 w-4" /></button></div>}

      {clientView ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="p-5 sm:p-7 border-b border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] tracking-wider text-amber-400 font-bold">SARAYA EVENTS</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{projectName || eventName}</h2>
              <p className="text-sm text-slate-400 mt-1">{guests} {isAr ? 'ضيف' : 'guests'} · {locationKind === 'client' ? (isAr ? 'موقع العميل' : 'Client Location') : (isAr ? 'قاعة السرايا' : 'Saraya Venue')}</p>
            </div>
            <button type="button" onClick={() => setClientView(false)} className="p-2 rounded-lg bg-slate-800 text-slate-200"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-3 sm:p-6">
            <div className="relative mx-auto max-w-5xl h-[520px] sm:h-[620px] overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950">
              <div className="absolute inset-[7%] border border-white/10 rounded-xl">
                {items.map((item) => (
                  <div key={item.id} className={itemVisual(item)} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.rotation}deg)` }}>
                    {item.type === 'screen' ? 'LED SCREEN' : item.type === 'stage' ? (isAr ? 'منصة' : 'STAGE') : item.type === 'dance' ? (isAr ? 'رقص' : 'DANCE') : item.type === 'table' ? (item.seats || 10) : item.type === 'chairs' ? '●' : item.type === 'flowers' ? '✿' : item.labelEn}
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
            {activeHall && (activeHall.savedLayouts || []).length > 0 && <div className="mt-3 space-y-1.5"><div className="text-[10px] font-bold text-slate-400">{isAr ? 'الخطط المحفوظة لهذه القاعة' : 'Saved plans for this hall'}</div>{activeHall.savedLayouts?.map((plan) => <div key={plan.id} className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1.5"><button type="button" onClick={() => openSavedPlan(plan)} title={isAr ? 'فتح الخطة' : 'Open plan'} className="min-w-0 flex-1 truncate text-start text-[10px] font-semibold text-slate-200"><FolderOpen className="me-1 inline h-3 w-3 text-amber-300" />{plan.name}</button><button type="button" onClick={() => duplicateSavedPlan(plan)} title={isAr ? 'نسخ' : 'Duplicate'} className="rounded p-1 text-slate-400 hover:text-white"><Copy className="h-3 w-3" /></button><button type="button" onClick={() => { const name = window.prompt(isAr ? 'اسم الخطة الجديد' : 'New plan name', plan.name); if (name?.trim() && activeHall && onUpdateHall) onUpdateHall({ ...activeHall, savedLayouts: (activeHall.savedLayouts || []).map((entry) => entry.id === plan.id ? { ...entry, name: name.trim() } : entry) }); }} title={isAr ? 'إعادة تسمية' : 'Rename'} className="rounded p-1 text-slate-400 hover:text-white"><Pencil className="h-3 w-3" /></button><button type="button" onClick={() => deleteSavedPlan(plan.id)} title={isAr ? 'حذف' : 'Delete'} className="rounded p-1 text-rose-400 hover:text-rose-300"><Trash2 className="h-3 w-3" /></button></div>)}</div>}

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

            <div className="mt-5 border-t border-slate-800 pt-3">
              <div className="text-xs font-bold text-white">{isAr ? 'طاولات جاهزة بالكراسي' : 'Table Sets'}</div>
              <p className="mt-0.5 mb-2 text-[10px] text-slate-500">{isAr ? 'حدد العدد ثم أضف دفعة واحدة' : 'Set a quantity, then add them in bulk'}</p>
              <div className="space-y-1.5">
                {TABLE_SETS.map((set) => (
                  <div key={set.id} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5">
                    <span className={`shrink-0 border border-amber-300/70 bg-amber-200/20 ${set.shape === 'round' ? 'h-4 w-4 rounded-full' : 'h-3 w-5 rounded-sm'}`} />
                    <span className="flex-1 text-[10px] leading-4 text-slate-300">{isAr ? set.labelAr : set.labelEn}</span>
                    <input type="number" min={1} max={100} value={setQty[set.id] ?? 1} onChange={(e) => setSetQty((prev) => ({ ...prev, [set.id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) }))} aria-label={isAr ? 'العدد' : 'Quantity'} className="w-11 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white" />
                    <button type="button" onClick={() => addTableSet(set.id, setQty[set.id] ?? 1)} aria-label={isAr ? 'إضافة' : 'Add'} className="rounded-md bg-amber-400 p-1 text-slate-950 hover:bg-amber-300"><Plus className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-2 sm:p-3 min-w-0">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="text-xs font-bold text-white">{activeHall ? `${isAr ? activeHall.name : activeHall.nameEn || activeHall.name} · ` : ''}{eventName} · {width} × {depth}m</div>
              <div className="text-[10px] text-slate-500">{items.length} {isAr ? 'عنصر' : 'items'} · {items.filter((item) => item.type === 'table').reduce((sum, item) => sum + (item.seats || 10), 0)} {isAr ? 'مقعداً' : 'seats'}</div>
            </div>
            <div className="relative w-full aspect-[4/3] min-h-[420px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              {layoutMode === '2d' ? (
                <div ref={canvasRef} className="absolute inset-[7%] rounded-lg border-2 border-slate-500/80 bg-slate-900 overflow-hidden" style={{ touchAction: 'none' }}>
                  <div className={`absolute inset-0 ${snapToGrid ? 'opacity-45' : 'opacity-20'}`} style={{ backgroundImage: 'linear-gradient(to right, rgba(148,163,184,.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.3) 1px, transparent 1px)', backgroundSize: '4% 4%' }} />
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-cyan-300/20" /><div className="pointer-events-none absolute inset-y-0 start-1/2 border-s border-dashed border-cyan-300/20" />
                  <div className="absolute -top-7 start-0 end-0 text-center text-[10px] text-slate-500">{isAr ? 'حدود المكان · الواجهة' : 'SPACE BOUNDARY · FRONT / STAGE SIDE'}</div>
                  {items.map((item) => (
                    <button key={item.id} type="button" onPointerDown={(event) => handlePointerDown(event, item)} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className={`${itemVisual(item)} cursor-grab active:cursor-grabbing touch-none ${selectedId === item.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`, willChange: 'transform', transition: 'none', touchAction: 'none', userSelect: 'none' }}>
                      {item.type === 'screen' ? 'LED' : item.type === 'stage' ? (isAr ? 'منصة' : 'STAGE') : item.type === 'dance' ? (isAr ? 'رقص' : 'DANCE') : item.type === 'table' ? <><span className="relative z-10">{item.seats || 10}</span>{seatDots(item).map((dot, seat) => <span key={seat} className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-200/80" style={{ left: dot.left + '%', top: dot.top + '%' }} />)}</> : item.type === 'chairs' ? '●' : item.type === 'flowers' ? '✿' : item.type === 'buffet' ? (isAr ? 'بوفيه' : 'BUFFET') : item.type === 'podium' ? 'P' : 'REG'}
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
                    commitItems((prev) => prev.map((item) => item.id === id ? { ...item, x, y } : item));
                    setSaved(false);
                  }}
                  onRotate={(id) => commitItems((prev) => prev.map((item) => item.id === id ? { ...item, rotation: item.rotation + 15 } : item))}
                />
              )}            </div>
          </section>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="text-xs font-bold text-white mb-3">{isAr ? 'العنصر المحدد' : 'Selected Item'}</div>
            {selected ? (
              <>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <div className="text-sm font-bold text-white">{isAr ? selected.labelAr : selected.labelEn}</div>
                  {selected.type === 'table' && <div className="text-[10px] text-slate-500 mt-1">{selected.seats || 10} {isAr ? 'مقاعد' : 'seats'}</div>}
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
              <button type="button" onClick={() => setSnapToGrid((value) => !value)} className={`mb-3 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-[10px] font-bold ${snapToGrid ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-slate-700 bg-slate-950 text-slate-400'}`}><span className="flex items-center gap-2"><Grid3X3 className="h-3.5 w-3.5" />{isAr ? 'محاذاة للشبكة' : 'Snap to grid'}</span><span>{snapToGrid ? 'ON' : 'OFF'}</span></button>
              <div className="text-[10px] text-slate-500">{isAr ? 'ملخص' : 'Summary'}</div>
              <div className="mt-2 text-xs text-slate-300">{guests} {isAr ? 'ضيف' : 'guests'}</div>
              <div className="text-xs text-slate-300">{tableCount} {isAr ? 'طاولة تقريباً' : 'tables approx.'}</div>
              <div className="text-xs text-slate-300">{locationKind === 'client' ? (isAr ? 'موقع العميل' : 'Client location') : (isAr ? 'قاعة السرايا' : 'Saraya venue')}</div>
            </div>
          </aside>
        </div>
      )}
      {autoBuilderOpen && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4" onClick={() => setAutoBuilderOpen(false)}><div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-widest text-amber-400">AUTO LAYOUT BUILDER</div><h2 className="mt-1 text-xl font-black text-white">{isAr ? "اختر ما تحتاجه أولاً" : "Choose what you need first"}</h2><p className="mt-1 text-xs text-slate-500">{isAr ? "يمكنك اختيار أكثر من عنصر وتحديد الكمية لكل عنصر." : "Select multiple elements and set the quantity for each."}</p></div><button type="button" onClick={() => setAutoBuilderOpen(false)} className="p-2 rounded-xl bg-slate-800"><X className="w-4 h-4" /></button></div><div className="mt-5 grid sm:grid-cols-2 gap-2">{ITEM_LIBRARY.map((item) => { const Icon = item.icon; const value = autoSelection[item.type] || 0; return <label key={item.type} className={"flex items-center gap-3 rounded-xl border p-3 cursor-pointer " + (value > 0 ? "border-amber-400/50 bg-amber-400/10" : "border-slate-800 bg-slate-950/60")}><input type="checkbox" checked={value > 0} onChange={(e) => setAutoSelection((prev) => ({ ...prev, [item.type]: e.target.checked ? (item.type === "table" ? Math.max(1, Math.ceil(guests / 10)) : 1) : 0 }))} className="accent-amber-400" /><Icon className="w-4 h-4 text-amber-400" /><span className="flex-1 text-xs font-bold text-white">{isAr ? item.labelAr : item.labelEn}{item.type === "table" && <span className="block text-[9px] font-normal text-slate-500">{isAr ? "كل طاولة معها كراسي" : "chairs included with every table"}</span>}</span>{value > 0 && <input type="number" min={1} max={500} value={value} onChange={(e) => setAutoSelection((prev) => ({ ...prev, [item.type]: Math.max(1, Math.min(500, Number(e.target.value) || 1)) }))} className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white" />}</label>; })}</div><div className="mt-5 flex justify-between"><button type="button" onClick={() => setAutoSelection({ table: 0, stage: 1, screen: 1, podium: 0, dance: 1, buffet: 0, registration: 0 })} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white">{isAr ? "إعادة ضبط" : "Reset"}</button><button type="button" onClick={buildSelectedLayout} className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black">{isAr ? "إنشاء المخطط" : "Create Layout"}</button></div></div></div>}
    </section>
  );
}
