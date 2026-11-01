import { useEffect, useRef, useState } from 'react';
import {
  Armchair,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Redo2,
  RotateCcw,
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
import { Hall, Hall3DProfile, HallDimensions, HallLayoutItem, Language, LocationId, SavedHallLayout } from '../types/venueSystem';
import { DECOR_STYLES, TABLE_PRESETS, autoLayout, chairPositions, decorStyle, defaultDecorFor, formatM, hallDimensions, itemSize, itemSpec, seatedCapacity, tableFootprint } from '../data/venueModel';
import { EventLayout3D } from './EventLayout3D';
import { LOCATIONS, hallLocation } from '../data/locations';
import { BrandLogo } from './BrandLogo';

type LayoutMode = '2d' | '3d';
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
const TABLE_SETS = TABLE_PRESETS;

const EVENT_NAMES: Record<EventKind, [string, string]> = {
  engagement: ['Engagement', 'خطوبة'],
  wedding: ['Wedding', 'زفاف'],
  conference: ['Conference', 'مؤتمر'],
  summit: ['Summit', 'قمة'],
  birthday: ['Birthday', 'عيد ميلاد'],
  other: ['Other', 'مناسبة أخرى'],
};

const INITIAL_ITEMS: LayoutItem[] = autoLayout({ widthM: 24, depthM: 32, guests: 120, eventKind: 'engagement' }).items;
/** Starting layout for a hall with no saved design, at its real size. */
const hallStarter = (hall: Hall, guests: number) => { const dims = hallDimensions(hall); return autoLayout({ widthM: dims.widthM, depthM: dims.depthM, guests: Math.min(guests, hall.capacity || guests), eventKind: 'wedding', pool: dims.pool }).items; };

interface DesignerProps { language: Language; initialDesign?: Hall3DProfile; onSaveDesign?: (design: Hall3DProfile) => void; onClose?: () => void; halls?: Hall[]; onUpdateHall?: (hall: Hall) => void; /** Real measurements of the hall being edited when no hall list is passed (Company profile). */ hallDims?: HallDimensions; /** 'basic' = accurate plan + simple 3D. 'pro' = 3D Studio Pro (decor styles, walk-through, rich detail). */ edition?: 'basic' | 'pro'; /** Demo mode turns saving off. */ canSave?: boolean; }

const STORAGE_BASIC = 'saraya-event-layout-design-v1';
const STORAGE_PRO = 'saraya-3d-studio-pro-design-v1';

export function EventLayoutDesigner({ language, initialDesign, onSaveDesign, onClose, halls = [], onUpdateHall, hallDims: fixedHallDims, edition = 'basic', canSave = true }: DesignerProps) {
  const pro = edition === 'pro';
  const storageKey = pro ? STORAGE_PRO : STORAGE_BASIC;
  const isAr = language === 'ar';
  const [locationId, setLocationId] = useState<LocationId>(() => halls[0] ? hallLocation(halls[0]) : 'arcane');
  const locationHalls = halls.filter((hall) => hallLocation(hall) === locationId);
  const [hallId, setHallId] = useState(() => halls.find((hall) => hallLocation(hall) === 'arcane')?.id || halls[0]?.id || '');
  const activeHall = halls.find((hall) => hall.id === hallId);
  const [eventKind, setEventKind] = useState<EventKind>('engagement');
  const [locationKind, setLocationKind] = useState<LocationKind>(halls.length || fixedHallDims ? 'saraya' : 'client');
  const [guests, setGuests] = useState(initialDesign?.guests ?? 250);
  const initialHall = halls.find((hall) => hall.id === (halls.find((entry) => hallLocation(entry) === 'arcane')?.id || halls[0]?.id));
  const [width, setWidth] = useState(fixedHallDims?.widthM ?? (initialHall ? hallDimensions(initialHall).widthM : initialDesign?.width ?? 20));
  const [depth, setDepth] = useState(fixedHallDims?.depthM ?? (initialHall ? hallDimensions(initialHall).depthM : initialDesign?.depth ?? 30));
  const [decor, setDecor] = useState<string>(initialDesign?.decor ?? initialHall?.default3D?.decor ?? 'royal_gold');
  const hallDims = activeHall ? hallDimensions(activeHall) : fixedHallDims;
  const lockedToHall = locationKind === 'saraya' && Boolean(hallDims);
  // ELSARAYA halls always use their real measurements (set by management in Company profile → Halls).
  useEffect(() => { if (lockedToHall && hallDims) { setWidth(hallDims.widthM); setDepth(hallDims.depthM); } }, [lockedToHall, hallDims?.widthM, hallDims?.depthM]);
  const scene3D: Partial<HallDimensions> = lockedToHall && hallDims ? hallDims : { ceilingM: 4.5, outdoor: false, floor: 'marble' };
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('3d');
  const [items, setItems] = useState<LayoutItem[]>(() => {
    if (initialDesign?.items?.length) return initialDesign.items;
    if (halls.length) return initialHall?.default3D?.items?.length ? initialHall.default3D.items : initialHall ? hallStarter(initialHall, initialDesign?.guests ?? 250) : INITIAL_ITEMS;
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      if (stored) {
        const parsed = JSON.parse(stored) as { items?: LayoutItem[]; width?: number; depth?: number; projectName?: string };
        if (Array.isArray(parsed.items) && parsed.items.length) return parsed.items;
      }
    } catch {}
    return INITIAL_ITEMS;
  });
  const [history, setHistory] = useState<LayoutItem[][]>([]);
  const [future, setFuture] = useState<LayoutItem[][]>([]);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const snapToGridRef = useRef(snapToGrid);
  snapToGridRef.current = snapToGrid;
  const dimsRef = useRef({ width, depth });
  dimsRef.current = { width, depth };
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotationMode, setRotationMode] = useState(false);
  const rotationModeRef = useRef(rotationMode);
  rotationModeRef.current = rotationMode;
  const [clientView, setClientView] = useState(false);
  const [saved, setSaved] = useState(false);
  const [projectName, setProjectName] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      return stored ? ((JSON.parse(stored) as { projectName?: string }).projectName || '') : '';
    } catch { return ''; }
  });
  const [autoBuilderOpen, setAutoBuilderOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; el: HTMLButtonElement; pointerId: number; startClientX: number; startClientY: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const rotationDragRef = useRef<{ id: string; el: HTMLButtonElement; pointerId: number; centerX: number; centerY: number; startAngle: number; startRotation: number; rotation: number } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ width, depth, items, projectName }));
    } catch {}
  }, [width, depth, items, projectName]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const eventName = EVENT_NAMES[eventKind][isAr ? 1 : 0];

  const tableItems = items.filter((item) => item.type === 'table');
  const seatTotal = tableItems.reduce((sum, item) => sum + (item.seats ?? 10), 0);
  const tableCount = Math.max(1, Math.ceil(guests / 10));
  const hallSeats = seatedCapacity({ widthM: width, depthM: depth, ceilingM: 0, outdoor: false, floor: 'marble', pool: lockedToHall ? hallDims?.pool : undefined }, eventKind);
  const toMetres = (item: LayoutItem) => ({ x: (item.x / 100) * width, y: (item.y / 100) * depth });
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
      ...(type === 'table' ? { seats: 10, shape: 'round' as const, widthM: 1.8, depthM: 1.8 } : {}),
    };
    commitItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    setSaved(false);
  };

  // Adds `qty` copies of a table set in a grid, spaced by the set's real footprint (table + chairs).
  const addTableSet = (setId: string, qty: number) => {
    const set = TABLE_SETS.find((entry) => entry.id === setId);
    if (!set || qty < 1) return;
    const fp = tableFootprint({ type: 'table', ...set });
    const stepX = fp.w + 1.0;
    const stepY = fp.d + 1.0;
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

  const rotateItem = (id: string, delta: number) => {
    commitItems((prev) => prev.map((item) => item.id === id ? { ...item, rotation: item.rotation + delta } : item));
    setSelectedId(null);
    setRotationMode(false);
  };

  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    updateSelected({ x: Math.max(5, Math.min(95, selected.x + dx)), y: Math.max(5, Math.min(95, selected.y + dy)) });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, item: LayoutItem) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;
    setSelectedId(item.id);
    if (rotationModeRef.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      rotationDragRef.current = {
        id: item.id,
        el: event.currentTarget,
        pointerId: event.pointerId,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        startAngle: Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)),
        startRotation: item.rotation,
        rotation: item.rotation,
      };
      event.currentTarget.style.willChange = 'transform';
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
      return;
    }
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
    };

    event.currentTarget.style.transition = 'none';
    event.currentTarget.style.willChange = 'transform';
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
  };

  const updateDragFromPointer = (clientX: number, clientY: number, pointerId: number) => {
    const rotating = rotationDragRef.current;
    if (rotating && rotating.pointerId === pointerId) {
      const angle = Math.atan2(clientY - rotating.centerY, clientX - rotating.centerX);
      let delta = angle - rotating.startAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      rotating.rotation = rotating.startRotation + delta * (180 / Math.PI);
      rotating.el.style.transform = `translate(-50%, -50%) rotate(${rotating.rotation}deg)`;
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    const dx = clientX - drag.startClientX;
    const dy = clientY - drag.startClientY;
    const rawX = Math.max(2, Math.min(98, drag.startX + (dx / rect.width) * 100));
    const rawY = Math.max(2, Math.min(98, drag.startY + (dy / rect.height) * 100));
    // Snap to the nearest 0.5 m on the real hall grid.
    const snap = (pct: number, size: number) => Math.max(0, Math.min(100, (Math.round(((pct / 100) * size) / 0.5) * 0.5 / size) * 100));
    drag.x = snapToGridRef.current ? snap(rawX, dimsRef.current.width) : rawX;
    drag.y = snapToGridRef.current ? snap(rawY, dimsRef.current.depth) : rawY;

    // Move the element in the same percentage coordinate system used by the canvas,
    // so releasing it does not cause a second snap from a pixel transform.
    drag.el.style.left = `${drag.x}%`;
    drag.el.style.top = `${drag.y}%`;
  };

  const finishDrag = (clientX: number, clientY: number, pointerId: number) => {
    const rotating = rotationDragRef.current;
    if (rotating && rotating.pointerId === pointerId) {
      updateDragFromPointer(clientX, clientY, pointerId);
      const rotation = rotating.rotation;
      try { rotating.el.releasePointerCapture(rotating.pointerId); } catch {}
      rotating.el.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      rotating.el.style.willChange = 'auto';
      rotationDragRef.current = null;
      if (Math.abs(rotation - rotating.startRotation) >= 3) rotateItem(rotating.id, rotation - rotating.startRotation);
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;

    updateDragFromPointer(clientX, clientY, pointerId);
    const finalX = drag.x;
    const finalY = drag.y;
    const element = drag.el;
    commitItems((prev) => prev.map((item) => item.id === drag.id ? { ...item, x: finalX, y: finalY } : item));
    setSaved(false);

    try { element.releasePointerCapture(drag.pointerId); } catch {}
    element.style.left = `${finalX}%`;
    element.style.top = `${finalY}%`;
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
      if (event.key === 'Escape') { setSelectedId(null); setRotationMode(false); }
    };

    const onWindowPointerMove = (event: PointerEvent) => updateDragFromPointer(event.clientX, event.clientY, event.pointerId);
    const onWindowPointerUp = (event: PointerEvent) => finishDrag(event.clientX, event.clientY, event.pointerId);
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (!rotationModeRef.current) return;
      const target = event.target as Element | null;
      if (target?.closest('[data-rotation-ui]')) return;
      setRotationMode(false);
      setSelectedId(null);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);
    document.addEventListener('pointerdown', onDocumentPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
      document.removeEventListener('pointerdown', onDocumentPointerDown);
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

  const [autoTable, setAutoTable] = useState('round180-10');
  const [autoExtras, setAutoExtras] = useState<Record<string, boolean>>({ stage: true, dance: true, screen: false, buffet: false, entrance: true, podium: false, registration: false });
  const autoPreview = autoLayout({ widthM: width, depthM: depth, guests, eventKind, table: TABLE_PRESETS.find((t) => t.id === autoTable), ...autoExtras, pool: lockedToHall ? hallDims?.pool : undefined });
  const buildSelectedLayout = () => {
    commitItems(autoPreview.items); setSelectedId(null); setAutoBuilderOpen(false);
  };

  const saveDesign = () => {
    if (!canSave) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify({ width, depth, items, projectName })); } catch {}
    const design: Hall3DProfile = { width, depth, items, decor, guests };
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
    if (!canSave) return;
    if (!activeHall || !onUpdateHall) { saveDesign(); return; }
    const plan: SavedHallLayout = { id: `layout-${Date.now()}`, name: projectName.trim() || (isAr ? `مخطط ${eventName}` : `${eventName} layout`), eventType: eventKind, updatedAt: new Date().toISOString(), design: { width, depth, items, decor, guests } };
    onUpdateHall({ ...activeHall, savedLayouts: [...(activeHall.savedLayouts || []), plan] });
    setActivePlanId(plan.id); setProjectName(plan.name); setSaved(true); setTimeout(() => setSaved(false), 2200);
  };
  const openSavedPlan = (plan: SavedHallLayout) => { setActivePlanId(plan.id); setProjectName(plan.name); setEventKind((EVENT_NAMES[plan.eventType as EventKind] ? plan.eventType : 'other') as EventKind); if (!lockedToHall) { setWidth(plan.design.width); setDepth(plan.design.depth); } if (plan.design.decor) setDecor(plan.design.decor); if (plan.design.guests) setGuests(plan.design.guests); setItems(plan.design.items); setHistory([]); setFuture([]); setSelectedId(null); setSaved(true); };
  const duplicateSavedPlan = (plan: SavedHallLayout) => { if (!activeHall || !onUpdateHall) return; const copy = { ...plan, id: `layout-${Date.now()}`, name: `${plan.name} ${isAr ? 'نسخة' : 'copy'}`, updatedAt: new Date().toISOString(), design: { ...plan.design, items: plan.design.items.map((item) => ({ ...item, id: `${item.id}-${Date.now()}` })) } }; onUpdateHall({ ...activeHall, savedLayouts: [...(activeHall.savedLayouts || []), copy] }); };
  const deleteSavedPlan = (id: string) => { if (!activeHall || !onUpdateHall) return; onUpdateHall({ ...activeHall, savedLayouts: (activeHall.savedLayouts || []).filter((plan) => plan.id !== id) }); if (activePlanId === id) setActivePlanId(null); };

  // To-scale 2D drawing of one item inside its footprint box (tables include their chairs).
  const tableNumber = new Map<string, number>();
  items.filter((item) => item.type === 'table').forEach((item, index) => tableNumber.set(item.id, index + 1));
  const renderPlanShape = (item: LayoutItem, fp: { w: number; d: number }, size: { w: number; d: number }, number?: number) => {
    const label = isAr ? item.labelAr : item.labelEn;
    if (item.type === 'table') {
      const round = item.shape !== 'rect';
      const tw = (size.w / fp.w) * 100;
      const td = (size.d / fp.d) * 100;
      return <>
        {chairPositions(item).map((c, i) => <span key={i} className="absolute rounded-[2px] border border-amber-100/70 bg-amber-50/25" style={{ left: `${((c.x + fp.w / 2) / fp.w) * 100}%`, top: `${((c.z + fp.d / 2) / fp.d) * 100}%`, width: `${(0.42 / fp.w) * 100}%`, height: `${(0.42 / fp.d) * 100}%`, transform: `translate(-50%, -50%) rotate(${(Math.atan2(c.nz, c.nx) * 180) / Math.PI + 90}deg)` }} />)}
        <span className={`absolute left-1/2 top-1/2 flex items-center justify-center border-2 border-amber-300/80 bg-amber-200/20 text-[9px] font-black leading-none text-amber-100 ${round ? 'rounded-full' : 'rounded-[3px]'}`} style={{ width: `${tw}%`, height: `${td}%`, transform: `translate(-50%, -50%) rotate(${-item.rotation}deg)` }}>{number}</span>
      </>;
    }
    const tone: Record<string, string> = {
      stage: 'border-amber-200/70 bg-amber-100/15 text-amber-50',
      dance: 'border-amber-300/70 text-amber-100',
      screen: 'border-amber-200 bg-amber-200/40 text-slate-950',
      led_wall: 'border-amber-200 bg-amber-200/40 text-slate-950',
      buffet: 'border-emerald-200/60 bg-emerald-200/10 text-emerald-100',
      bar: 'border-stone-300/60 bg-stone-300/10 text-stone-100',
      lounge: 'border-rose-200/60 bg-rose-200/10 text-rose-100',
      entrance: 'border-emerald-200/70 bg-emerald-200/10 text-emerald-100',
      exit: 'border-rose-200/70 bg-rose-200/10 text-rose-100',
      flowers: 'border-rose-200/70 bg-rose-200/20 text-rose-100 rounded-full',
      truss: 'border-dashed border-stone-300/70 text-stone-100',
    };
    const pattern = item.type === 'dance' ? { backgroundImage: 'linear-gradient(45deg, rgba(244,241,234,.14) 25%, transparent 25%, transparent 75%, rgba(244,241,234,.14) 75%), linear-gradient(45deg, rgba(244,241,234,.14) 25%, transparent 25%, transparent 75%, rgba(244,241,234,.14) 75%)', backgroundSize: `${(2.4 / size.w) * 100}% ${(2.4 / size.d) * 100}%`, backgroundPosition: `0 0, ${(1.2 / size.w) * 100}% ${(1.2 / size.d) * 100}%` } : undefined;
    return <span className={`absolute inset-0 flex items-center justify-center overflow-hidden whitespace-nowrap rounded-[3px] border px-0.5 text-[9px] font-bold leading-none ${tone[item.type] || 'border-slate-300/50 bg-slate-300/10 text-slate-100'}`} style={pattern}><span className="truncate" style={{ transform: `rotate(${-item.rotation}deg)` }}>{label}</span></span>;
  };

  const title = pro ? (isAr ? 'استوديو 3D برو' : '3D Studio Pro') : (isAr ? 'مصمم مخطط المناسبة' : 'Event Layout Designer');
  const subtitle = isAr ? 'خطط أي مناسبة في قاعة السرايا أو في موقع العميل خلال دقائق.' : 'Plan any event at an ELSARAYA venue or at the client’s location in minutes.';

  return (
    <section className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {!clientView && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <BrandLogo className="h-6 w-auto" />
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setLayoutMode('2d')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${layoutMode === '2d' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>{isAr ? 'مخطط 2D' : '2D Plan'}</button>
              <button type="button" onClick={() => setLayoutMode('3d')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${layoutMode === '3d' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-300 border-slate-700'}`}>{pro ? (isAr ? '3D والتجوّل' : '3D & Walk') : '3D'}</button>
              <button type="button" onClick={() => setClientView(true)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white">{isAr ? 'عرض العميل' : 'Client View'}</button>
              {activeHall && <button type="button" onClick={saveAsPlan} disabled={!canSave} title={canSave ? undefined : (isAr ? "الحفظ متاح في النسخة الكاملة" : "Saving is in the full version")} className="disabled:cursor-not-allowed disabled:opacity-40 px-3 py-2 rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-200 text-xs font-bold flex items-center gap-1.5"><Files className="w-3.5 h-3.5" />{isAr ? 'حفظ كخطة' : 'Save as Plan'}</button>}
              <button type="button" onClick={saveDesign} disabled={!canSave} title={canSave ? undefined : (isAr ? "الحفظ متاح في النسخة الكاملة" : "Saving is in the full version")} className="disabled:cursor-not-allowed disabled:opacity-40 px-3 py-2 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />{saved ? (isAr ? 'تم الحفظ' : 'Saved') : (isAr ? (activePlanId ? 'تحديث الخطة' : 'حفظ الافتراضي') : (activePlanId ? 'Update Plan' : 'Save Default'))}</button>
            </div>
          </div>
        </div>
      )}

      {!clientView && halls.length > 0 && <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-400/40 bg-slate-950/95 p-3 shadow-xl backdrop-blur"><span className="text-[10px] font-black uppercase tracking-widest text-amber-300">{isAr ? 'الموقع الجاري تعديله' : 'EDITING LOCATION'}</span><select value={locationId} onChange={(e) => { const loc = e.target.value as LocationId; setLocationId(loc); const next = halls.find((hall) => hallLocation(hall) === loc); if (next) { setHallId(next.id); setActivePlanId(null); setProjectName(''); setDecor(next.default3D?.decor ?? 'royal_gold'); setItems(next.default3D?.items?.length ? next.default3D.items : hallStarter(next, guests)); setHistory([]); setFuture([]); } }} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white">{LOCATIONS.map((location) => <option key={location.id} value={location.id}>{isAr ? location.nameAr : location.nameEn}</option>)}</select><select value={hallId} onChange={(e) => { const hall = halls.find((entry) => entry.id === e.target.value); setHallId(e.target.value); setActivePlanId(null); setProjectName(''); if (hall) { setDecor(hall.default3D?.decor ?? 'royal_gold'); setItems(hall.default3D?.items?.length ? hall.default3D.items : hallStarter(hall, guests)); setHistory([]); setFuture([]); } }} className="min-w-40 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white">{locationHalls.map((hall) => <option key={hall.id} value={hall.id}>{isAr ? hall.name : hall.nameEn || hall.name}</option>)}</select><select value={activePlanId || ''} onChange={(e) => { const plan = activeHall?.savedLayouts?.find((entry) => entry.id === e.target.value); if (plan) openSavedPlan(plan); else { setActivePlanId(null); setProjectName(''); if (activeHall?.default3D) { setItems(activeHall.default3D.items); if (activeHall.default3D.decor) setDecor(activeHall.default3D.decor); } } }} className="min-w-36 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white"><option value="">{isAr ? 'التصميم الافتراضي' : 'Default layout'}</option>{(activeHall?.savedLayouts || []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">{activeHall ? (isAr ? activeHall.name : activeHall.nameEn || activeHall.name) : ''}</span><button type="button" disabled={!history.length} onClick={undo} title="Ctrl+Z" className="rounded-lg border border-slate-700 p-2 text-slate-300 disabled:opacity-40"><Undo2 className="h-4 w-4" /></button><button type="button" disabled={!future.length} onClick={redo} title="Ctrl+Y" className="rounded-lg border border-slate-700 p-2 text-slate-300 disabled:opacity-40"><Redo2 className="h-4 w-4" /></button></div>}

      {clientView ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <BrandLogo className="mb-1 h-6 w-auto" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">{projectName || eventName}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                <span className="rounded-full border border-slate-700 px-2.5 py-1">{activeHall && locationKind === 'saraya' ? (isAr ? activeHall.name : activeHall.nameEn || activeHall.name) : locationKind === 'client' ? (isAr ? 'موقع العميل' : 'Client location') : (isAr ? 'مساحة مخصصة' : 'Custom space')}</span>
                <span className="rounded-full border border-slate-700 px-2.5 py-1">{guests} {isAr ? 'ضيف' : 'guests'}</span>
                <span className="rounded-full border border-slate-700 px-2.5 py-1">{tableItems.length} {isAr ? 'طاولة' : 'tables'} · {seatTotal} {isAr ? 'مقعداً' : 'seats'}</span>
                <span className="rounded-full border border-slate-700 px-2.5 py-1" dir="auto">{formatM(width)}×{formatM(depth)} {isAr ? 'م' : 'm'}</span>
                {pro && <span className="rounded-full border border-amber-400/40 px-2.5 py-1 text-amber-200">{isAr ? decorStyle(decor).ar : decorStyle(decor).en}</span>}
              </div>
            </div>
            <button type="button" onClick={() => setClientView(false)} aria-label={isAr ? 'إغلاق' : 'Close'} className="shrink-0 p-2 rounded-lg bg-slate-800 text-slate-200"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-2 sm:p-4">
            <div className="mx-auto h-[70vh] min-h-[440px] max-w-6xl">
              <EventLayout3D items={items} width={width} depth={depth} language={language} hall={scene3D} decor={decor} tier={edition} mode="overview" readOnly />
            </div>
            <p className="mx-auto mt-2 max-w-6xl px-1 text-[11px] leading-5 text-slate-500">{isAr ? 'تصور توضيحي بالمقاسات الحقيقية للقاعة والأثاث؛ الألوان والزهور النهائية يتم اختيارها مع فريق السرايا.' : 'Illustration at the real size of the venue and furniture; final colours and flowers are chosen with the ELSARAYA team.'}</p>
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
              <option value="saraya">{isAr ? 'قاعة السرايا' : 'ELSARAYA Venue'}</option>
              <option value="client">{isAr ? 'موقع العميل' : 'Client Location'}</option>
              <option value="custom">{isAr ? 'مساحة مخصصة' : 'Custom Space'}</option>
            </select>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <label className="text-[11px] text-slate-400">{isAr ? 'الضيوف' : 'Guests'}<input type="number" min={1} max={5000} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(5000, Number(e.target.value) || 1)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white" /></label>
              <label className="text-[11px] text-slate-400">{isAr ? 'العرض م' : 'Width m'}<input type="number" min={3} max={200} step={0.5} value={width} disabled={lockedToHall} onChange={(e) => setWidth(Math.max(3, Math.min(200, Number(e.target.value) || 3)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white disabled:opacity-60" /></label>
            </div>
            <label className="block text-[11px] text-slate-400 mt-2">{isAr ? 'العمق م' : 'Depth m'}<input type="number" min={3} max={200} step={0.5} value={depth} disabled={lockedToHall} onChange={(e) => setDepth(Math.max(3, Math.min(200, Number(e.target.value) || 3)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white disabled:opacity-60" /></label>
            {lockedToHall && hallDims && <p className="mt-1.5 text-[10px] leading-4 text-slate-500">{isAr ? `مقاسات القاعة الحقيقية${hallDims.outdoor ? ' (مكان مفتوح)' : ` · الارتفاع ${formatM(hallDims.ceilingM)} م`}. تعدّلها الإدارة من ملف الشركة ← القاعات.` : `Real hall measurements${hallDims.outdoor ? ' (open air)' : ` · ceiling ${formatM(hallDims.ceilingM)} m`}. Management edits them in Company profile → Halls.`}</p>}
            {pro && <><label className="block text-[11px] text-slate-400 mt-3 mb-1">{isAr ? 'ستايل الديكور' : 'Decor style'}</label>
            <div className="grid grid-cols-1 gap-1">{DECOR_STYLES.map((style) => <button key={style.id} type="button" onClick={() => { setDecor(style.id); setSaved(false); }} aria-pressed={decor === style.id} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-start text-[11px] font-bold ${decor === style.id ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'}`}><span className="flex shrink-0 overflow-hidden rounded-full border border-white/20">{[style.linen, style.chairFrame, style.flowerAccent].map((c, i) => <span key={i} className="h-4 w-2.5" style={{ background: c }} />)}</span>{isAr ? style.ar : style.en}</button>)}</div></>}

            <button type="button" onClick={() => setAutoBuilderOpen(true)} className="mt-3 w-full rounded-lg bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-white">{isAr ? 'إنشاء تخطيط تلقائي' : 'Build Auto Layout'}</button>

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

          <section className="order-first min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-2 sm:p-3 lg:order-none">
            <div className="relative flex flex-wrap items-center justify-between gap-2 px-2 py-2">
              <div className="min-w-0 text-xs font-bold text-white">{activeHall ? `${isAr ? activeHall.name : activeHall.nameEn || activeHall.name} · ` : ''}{eventName} · <span dir="auto">{formatM(width)} × {formatM(depth)} {isAr ? 'م' : 'm'}</span></div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-[10px] text-slate-500">{items.length} {isAr ? 'عنصر' : 'items'} · {items.filter((item) => item.type === 'table').reduce((sum, item) => sum + (item.seats || 10), 0)} {isAr ? 'مقعداً' : 'seats'}</div>
                <button type="button" data-rotation-ui onClick={() => { setRotationMode((active) => !active); setSelectedId(null); }} aria-pressed={rotationMode} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-black ${rotationMode ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-amber-300/60'}`}><RotateCw className="h-3.5 w-3.5" />{isAr ? (rotationMode ? 'وضع التدوير' : 'تدوير') : (rotationMode ? 'Rotate mode on' : 'Rotate')}</button>
                <button type="button" onClick={() => setQuickAddOpen((open) => !open)} aria-expanded={quickAddOpen} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 text-[10px] font-black text-slate-950 hover:bg-amber-300"><Plus className="h-3.5 w-3.5" />{isAr ? 'إضافة عناصر' : 'Add items'}</button>
              </div>
              {quickAddOpen && <div className="absolute end-2 top-full z-50 mt-1 grid w-[min(92vw,360px)] grid-cols-2 gap-1.5 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl sm:grid-cols-3">{ITEM_LIBRARY.map((item) => { const Icon = item.icon; return <button key={item.type} type="button" onClick={() => { addItem(item.type); setQuickAddOpen(false); }} className="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-800 px-2 text-start text-[10px] text-slate-200 hover:border-amber-400/60 hover:bg-slate-900"><Icon className="h-3.5 w-3.5 shrink-0 text-amber-300" /><span className="truncate">{isAr ? item.labelAr : item.labelEn}</span></button>; })}</div>}
            </div>
            <div className="relative h-[62vh] min-h-[460px] w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 lg:h-[72vh] lg:max-h-[860px]">
              {layoutMode === '2d' ? (
                <div className="absolute inset-0 px-8 pb-9 pt-12 sm:px-10">
                  <div className="flex h-full w-full items-center justify-center" style={{ containerType: 'size' }}>
                    <div ref={canvasRef} dir="ltr" className="relative rounded-sm border-2 border-amber-200/60" style={{ width: `min(100cqw, calc(100cqh * ${width / depth}))`, aspectRatio: `${width} / ${depth}`, touchAction: 'none', background: '#16161A' }}>
                      <div className="pointer-events-none absolute inset-0" style={{ opacity: snapToGrid ? 0.9 : 0.6, backgroundImage: 'linear-gradient(to right, rgba(233,207,148,.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(233,207,148,.10) 1px, transparent 1px), linear-gradient(to right, rgba(233,207,148,.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(233,207,148,.28) 1px, transparent 1px)', backgroundSize: `${100 / width}% ${100 / depth}%, ${100 / width}% ${100 / depth}%, ${500 / width}% ${500 / depth}%, ${500 / width}% ${500 / depth}%` }} />
                      {Array.from({ length: Math.floor(width / 5) + 1 }, (_, i) => i * 5).map((m) => <span key={`rx${m}`} className="pointer-events-none absolute -top-4 -translate-x-1/2 text-[9px] tabular-nums text-amber-200/70" style={{ left: `${(m / width) * 100}%` }}>{m}</span>)}
                      {Array.from({ length: Math.floor(depth / 5) + 1 }, (_, i) => i * 5).map((m) => <span key={`rz${m}`} className="pointer-events-none absolute -left-1 -translate-x-full -translate-y-1/2 text-[9px] tabular-nums text-amber-200/70" style={{ top: `${(m / depth) * 100}%` }}>{m}</span>)}
                      <div className="pointer-events-none absolute -top-9 inset-x-0 text-center text-[10px] font-bold text-amber-200">{isAr ? 'الواجهة / الكوشة' : 'FRONT / STAGE SIDE'} · <bdi>{formatM(width)} {isAr ? 'م' : 'm'}</bdi></div>
                      <div className="pointer-events-none absolute -bottom-6 inset-x-0 text-center text-[10px] text-slate-500">{isAr ? `العمق ${formatM(depth)} م · المربع = 1 م` : `Depth ${formatM(depth)} m · 1 square = 1 m`}</div>
                      {lockedToHall && hallDims?.pool && (() => { const pool = hallDims.pool; const pw = Math.min(pool.widthM, width * 0.5); const pd = Math.min(pool.depthM, depth * 0.6); const px = pool.side === 'left' ? pw / 2 + 1 : pool.side === 'center' ? width / 2 : width - pw / 2 - 1; return <div className="pointer-events-none absolute flex items-center justify-center rounded-sm border border-teal-200/60 text-[9px] font-bold text-teal-100" style={{ left: `${((px - pw / 2) / width) * 100}%`, top: `${((depth / 2 - pd / 2) / depth) * 100}%`, width: `${(pw / width) * 100}%`, height: `${(pd / depth) * 100}%`, background: 'rgba(44,140,150,.35)' }}>{isAr ? 'حمام السباحة' : 'Pool'}</div>; })()}
                      {[...items].sort((a, b) => (a.type === 'dance' ? -1 : 0) - (b.type === 'dance' ? -1 : 0)).map((item) => {
                        const isTable = item.type === 'table';
                        const size = itemSize(item);
                        const fp = isTable ? tableFootprint(item) : { w: size.w, d: size.d };
                        return (
                          <button key={item.id} type="button" data-rotation-ui onPointerDown={(event) => handlePointerDown(event, item)} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} title={`${isAr ? item.labelAr : item.labelEn} · ${formatM(size.w)}×${formatM(size.d)} m`} className={`absolute select-none ${rotationMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'} touch-none ${selectedId === item.id ? 'z-10 outline outline-2 outline-offset-2 outline-amber-400' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${(fp.w / width) * 100}%`, height: `${(fp.d / depth) * 100}%`, minWidth: 6, minHeight: 4, transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`, willChange: 'transform', transition: 'none', touchAction: 'none', userSelect: 'none' }}>
                            {renderPlanShape(item, fp, size, tableNumber.get(item.id))}
                          </button>
                        );
                      })}
                      {rotationMode && selected && <div data-rotation-ui className="pointer-events-none absolute z-40" style={{ left: `${selected.x}%`, top: `${selected.y}%`, transform: selected.y < 20 ? 'translate(-50%, 40px)' : 'translate(-50%, calc(-100% - 10px))' }}>
                        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-amber-300/70 bg-slate-950/95 p-1 shadow-xl" onPointerDown={(event) => event.stopPropagation()}>
                          <button type="button" onClick={() => rotateItem(selected.id, -15)} title={isAr ? 'تدوير عكس عقارب الساعة' : 'Rotate counterclockwise'} aria-label={isAr ? 'تدوير عكس عقارب الساعة' : 'Rotate counterclockwise'} className="flex h-8 w-8 items-center justify-center rounded-full text-amber-200 hover:bg-slate-800"><RotateCcw className="h-4 w-4" /></button>
                          <span className="min-w-10 text-center text-[10px] font-bold tabular-nums text-white">{((selected.rotation % 360) + 360) % 360}°</span>
                          <button type="button" onClick={() => rotateItem(selected.id, 15)} title={isAr ? 'تدوير مع عقارب الساعة' : 'Rotate clockwise'} aria-label={isAr ? 'تدوير مع عقارب الساعة' : 'Rotate clockwise'} className="flex h-8 w-8 items-center justify-center rounded-full text-amber-200 hover:bg-slate-800"><RotateCw className="h-4 w-4" /></button>
                        </div>
                      </div>}
                    </div>
                  </div>
                </div>
              ) : (
                <EventLayout3D
                  items={items}
                  width={width}
                  depth={depth}
                  language={language}
                  hall={scene3D}
                  decor={decor}
                  tier={edition}
                  mode="overview"
                  selectedId={selectedId}
                  rotationMode={rotationMode}
                  onSelect={(id) => { setSelectedId(id); if (!id) setRotationMode(false); }}
                  onMove={(id, x, y) => {
                    commitItems((prev) => prev.map((item) => item.id === id ? { ...item, x, y } : item));
                    setSaved(false);
                  }}
                  onRotate={(id, delta = 15) => rotateItem(id, delta)}
                />
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="text-xs font-bold text-white mb-3">{isAr ? 'العنصر المحدد' : 'Selected Item'}</div>
            {selected ? (
              <>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <label className="block text-[10px] text-slate-500">{isAr ? 'اسم العنصر' : 'Item name'}<input value={isAr ? selected.labelAr : selected.labelEn} onChange={(event) => updateSelected(isAr ? { labelAr: event.target.value } : { labelEn: event.target.value })} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-amber-400" /></label>
                  {selected.type === 'table' && <label className="mt-2 block text-[10px] text-slate-500">{isAr ? 'عدد المقاعد' : 'Seats'}<input type="number" min={1} max={40} value={selected.seats || 10} onChange={(event) => updateSelected({ seats: Math.max(1, Math.min(40, Number(event.target.value) || 1)) })} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400" /></label>}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <label className="text-[9px] text-slate-500">{isAr ? 'من اليسار م' : 'From left m'}<input type="number" step={0.1} min={0} max={width} value={toMetres(selected).x.toFixed(1)} onChange={(event) => updateSelected({ x: Math.max(0, Math.min(100, ((Number(event.target.value) || 0) / width) * 100)) })} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-[10px] text-white" /></label>
                  <label className="text-[9px] text-slate-500">{isAr ? 'من الواجهة م' : 'From front m'}<input type="number" step={0.1} min={0} max={depth} value={toMetres(selected).y.toFixed(1)} onChange={(event) => updateSelected({ y: Math.max(0, Math.min(100, ((Number(event.target.value) || 0) / depth) * 100)) })} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-[10px] text-white" /></label>
                  <label className="text-[9px] text-slate-500">{isAr ? 'الزاوية°' : 'Angle°'}<input type="number" value={selected.rotation} onChange={(event) => updateSelected({ rotation: Number(event.target.value) || 0 })} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-[10px] text-white" /></label>
                </div>
                {(() => { const size = itemSize(selected); const spec = itemSpec(selected.type); const round = selected.type === 'table' && selected.shape !== 'rect'; return <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-2">
                  <div className="text-[9px] font-bold text-slate-400">{isAr ? 'المقاس الحقيقي' : 'Real size'}</div>
                  {spec.resizable ? <div className={`mt-1 grid gap-1.5 ${round ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <label className="text-[9px] text-slate-500">{round ? (isAr ? 'القطر م' : 'Diameter m') : (isAr ? 'العرض م' : 'Width m')}<input type="number" step={0.1} min={0.3} max={Math.max(width, depth)} value={size.w} onChange={(event) => { const v = Math.max(0.3, Math.min(Math.max(width, depth), Number(event.target.value) || 0.3)); updateSelected(round ? { widthM: v, depthM: v } : { widthM: v }); }} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10px] text-white" /></label>
                    {!round && <label className="text-[9px] text-slate-500">{isAr ? 'العمق م' : 'Depth m'}<input type="number" step={0.1} min={0.3} max={Math.max(width, depth)} value={size.d} onChange={(event) => updateSelected({ depthM: Math.max(0.3, Math.min(Math.max(width, depth), Number(event.target.value) || 0.3)) })} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10px] text-white" /></label>}
                  </div> : <div className="mt-1 text-[10px] text-slate-300" dir="ltr">{formatM(size.w)} × {formatM(size.d)} m</div>}
                  {selected.type === 'table' && <select value={TABLE_PRESETS.find((t) => t.shape === (selected.shape || 'round') && t.widthM === size.w && t.seats === (selected.seats ?? 10))?.id || ''} onChange={(event) => { const t = TABLE_PRESETS.find((entry) => entry.id === event.target.value); if (t) updateSelected({ shape: t.shape, widthM: t.widthM, depthM: t.depthM, seats: t.seats }); }} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10px] text-white"><option value="">{isAr ? 'مقاس مخصص' : 'Custom size'}</option>{TABLE_PRESETS.map((t) => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.labelEn}</option>)}</select>}
                </div>; })()}
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  <button type="button" onClick={() => nudge(0, -3)} className="p-2 rounded-lg bg-slate-800 text-slate-200 flex justify-center"><ChevronUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => rotateItem(selected.id, 15)} className="p-2 rounded-lg bg-slate-800 text-slate-200 flex justify-center"><RotateCw className="w-4 h-4" /></button>
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
              <button type="button" onClick={() => setSnapToGrid((value) => !value)} className={`mb-3 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-[10px] font-bold ${snapToGrid ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-slate-700 bg-slate-950 text-slate-400'}`}><span className="flex items-center gap-2"><Grid3X3 className="h-3.5 w-3.5" />{isAr ? 'محاذاة كل 0.5 م' : 'Snap every 0.5 m'}</span><span>{snapToGrid ? 'ON' : 'OFF'}</span></button>
              <div className="text-[10px] text-slate-500">{isAr ? 'ملخص' : 'Summary'}</div>
              <div className="mt-2 text-xs text-slate-300">{guests} {isAr ? 'ضيف' : 'guests'} · {tableItems.length} {isAr ? 'طاولة' : 'tables'} · {seatTotal} {isAr ? 'مقعداً' : 'seats'}</div>
              {seatTotal < guests && <div className="mt-1 rounded-md bg-red-500/10 px-2 py-1 text-[10px] text-red-200">{isAr ? `ينقص ${guests - seatTotal} مقعداً` : `${guests - seatTotal} seats short`}</div>}
              <div className="mt-1 text-xs text-slate-300" dir="auto">{formatM(width)}×{formatM(depth)} {isAr ? 'م' : 'm'} = {formatM(width * depth)} {isAr ? 'م²' : 'm²'}</div>
              <div className="text-[10px] text-slate-500">{isAr ? `تتسع لحوالي ${hallSeats} ضيف على طاولات` : `Seats about ${hallSeats} guests at tables`}</div>
              <div className="text-xs text-slate-300">{locationKind === 'client' ? (isAr ? 'موقع العميل' : 'Client location') : locationKind === 'custom' ? (isAr ? 'مساحة مخصصة' : 'Custom space') : (isAr ? 'قاعة السرايا' : 'ELSARAYA venue')}</div>
            </div>
          </aside>
        </div>
      )}
      {autoBuilderOpen && <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: 'rgba(13,13,15,.86)' }} onClick={() => setAutoBuilderOpen(false)}><div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-widest text-amber-400">{isAr ? 'تخطيط تلقائي حسب عدد الضيوف' : 'AUTO LAYOUT BY GUEST COUNT'}</div><h2 className="mt-1 text-xl font-black text-white">{isAr ? 'اختر الطاولات والعناصر' : 'Choose tables and elements'}</h2><p className="mt-1 text-xs text-slate-500">{isAr ? `يتم توزيع الطاولات بمقاساتها الحقيقية مع ممرات 0.8 م بين الكراسي وممر زفة 2.4 م في المنتصف.` : 'Tables are placed at their real size with 0.8 m aisles between chairs and a 2.4 m centre walkway.'}</p></div><button type="button" onClick={() => setAutoBuilderOpen(false)} aria-label={isAr ? 'إغلاق' : 'Close'} className="p-2 rounded-xl bg-slate-800"><X className="w-4 h-4" /></button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-[11px] text-slate-400">{isAr ? 'عدد الضيوف' : 'Guests'}<input type="number" min={1} max={5000} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(5000, Number(e.target.value) || 1)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /></label>
          <label className="text-[11px] text-slate-400">{isAr ? 'نوع الطاولة' : 'Table type'}<select value={autoTable} onChange={(e) => setAutoTable(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white">{TABLE_PRESETS.map((t) => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.labelEn}</option>)}</select></label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{(['stage', 'dance', 'screen', 'buffet', 'entrance', 'podium', 'registration'] as const).map((type) => { const spec = itemSpec(type); const on = Boolean(autoExtras[type]); return <label key={type} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-[11px] font-bold ${on ? 'border-amber-400/50 bg-amber-400/10 text-white' : 'border-slate-800 bg-slate-950/60 text-slate-400'}`}><input type="checkbox" checked={on} onChange={(e) => setAutoExtras((prev) => ({ ...prev, [type]: e.target.checked }))} className="accent-amber-400" /><span><span className="block">{isAr ? spec.labelAr : spec.labelEn}</span><span className="block text-[9px] font-normal text-slate-500" dir="ltr">{formatM(spec.widthM)}×{formatM(spec.depthM)} m</span></span></label>; })}</div>
        <div className={`mt-4 rounded-xl border p-3 text-xs ${autoPreview.tablesPlaced < autoPreview.tablesNeeded ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}>
          {autoPreview.tablesPlaced < autoPreview.tablesNeeded
            ? (isAr ? `المساحة ${formatM(width)}×${formatM(depth)} م تتسع لـ ${autoPreview.tablesPlaced} طاولة فقط من ${autoPreview.tablesNeeded} (${autoPreview.seats} مقعداً). قلّل العناصر أو الضيوف.` : `This ${formatM(width)}×${formatM(depth)} m space fits only ${autoPreview.tablesPlaced} of ${autoPreview.tablesNeeded} tables (${autoPreview.seats} seats). Remove elements or reduce guests.`)
            : (isAr ? `${autoPreview.tablesPlaced} طاولة · ${autoPreview.seats} مقعداً لـ ${guests} ضيف في مساحة ${formatM(width)}×${formatM(depth)} م.` : `${autoPreview.tablesPlaced} tables · ${autoPreview.seats} seats for ${guests} guests in ${formatM(width)}×${formatM(depth)} m.`)}
        </div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setAutoBuilderOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white">{isAr ? 'إلغاء' : 'Cancel'}</button><button type="button" onClick={buildSelectedLayout} className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black">{isAr ? 'إنشاء المخطط' : 'Create Layout'}</button></div>
      </div></div>}
    </section>
  );
}
