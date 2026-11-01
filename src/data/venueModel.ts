import type { Hall, HallDimensions, HallFloor, HallLayoutItem } from '../types/venueSystem';

/**
 * One place for every real-world measurement the 2D plan and the 3D model use.
 * All sizes are in metres. Change a number here and every plan, 3D view and auto layout follows.
 *
 * Coordinates: a layout item's x / y are percentages of the hall's width / depth (0–100),
 * with y = 0 at the front (stage / kosha wall) and y = 100 at the back (entrance).
 */

// ─── Halls ────────────────────────────────────────────────────────────────────────────────

/**
 * Starting measurements for each ELSARAYA venue. These are ASSUMPTIONS sized from each hall's
 * capacity (about 2.2 m² per seated guest including stage, dance floor and aisles).
 * The CEO (or anyone given "Company profile & venues" edit rights) can replace them per hall in
 * Company profile → Halls; saved values on the hall always win over these defaults.
 */
export const HALL_DEFAULTS: Record<string, HallDimensions> = {
  'arcane-hall': { widthM: 26, depthM: 38, ceilingM: 5, outdoor: false, floor: 'marble' },
  'porto-veina': { widthM: 26, depthM: 38, ceilingM: 5, outdoor: false, floor: 'marble' },
  'porto-seila': { widthM: 26, depthM: 32, ceilingM: 4.5, outdoor: false, floor: 'carpet' },
  'arcane-pool': { widthM: 30, depthM: 38, ceilingM: 0, outdoor: true, floor: 'deck', pool: { widthM: 8, depthM: 16, side: 'right' } },
  'porto-roof': { widthM: 26, depthM: 28, ceilingM: 0, outdoor: true, floor: 'terrace' },
  'porto-garden': { widthM: 32, depthM: 42, ceilingM: 0, outdoor: true, floor: 'grass' },
};

/** Square metres per seated guest, used only when a hall has no measurements at all. */
export const AREA_PER_GUEST_M2 = 2.2;

export const FLOOR_OPTIONS: { id: HallFloor; en: string; ar: string }[] = [
  { id: 'marble', en: 'Marble', ar: 'رخام' },
  { id: 'carpet', en: 'Carpet', ar: 'موكيت' },
  { id: 'wood', en: 'Wood', ar: 'خشب' },
  { id: 'deck', en: 'Pool deck', ar: 'أرضية حمام سباحة' },
  { id: 'terrace', en: 'Terrace tiles', ar: 'بلاط تراس' },
  { id: 'grass', en: 'Grass', ar: 'نجيل' },
];

const round1 = (n: number) => Math.round(n * 10) / 10;

/** The hall's real measurements: saved values first, then the defaults above, then an estimate from area / capacity. */
export function hallDimensions(hall?: Hall | null): HallDimensions {
  const fallback = (): HallDimensions => {
    const area = hall?.areaSqMeters && hall.areaSqMeters > 0 ? hall.areaSqMeters : Math.max(120, (hall?.capacity || 200) * AREA_PER_GUEST_M2);
    const widthM = Math.max(10, Math.round(Math.sqrt(area * 0.75)));
    return { widthM, depthM: Math.max(10, Math.round(area / widthM)), ceilingM: 4.5, outdoor: false, floor: 'marble' };
  };
  const base = (hall && HALL_DEFAULTS[hall.id]) || fallback();
  const saved = hall?.dimensions || {};
  const pick = (value: number | undefined, def: number, min: number) => (typeof value === 'number' && value >= min ? value : def);
  const outdoor = typeof saved.outdoor === 'boolean' ? saved.outdoor : base.outdoor;
  return {
    widthM: round1(pick(saved.widthM, base.widthM, 3)),
    depthM: round1(pick(saved.depthM, base.depthM, 3)),
    ceilingM: outdoor ? 0 : round1(pick(saved.ceilingM, base.ceilingM || 4.5, 2.4)),
    outdoor,
    floor: saved.floor || base.floor,
    pool: saved.pool === null ? undefined : saved.pool || base.pool,
  };
}

// ─── Items ────────────────────────────────────────────────────────────────────────────────

export interface ItemSpec {
  type: string;
  labelEn: string;
  labelAr: string;
  /** Footprint along the item's own width (left–right) and depth (front–back), and its height. */
  widthM: number;
  depthM: number;
  heightM: number;
  /** Staff may change width / depth for this item (stage, dance floor, buffet...). */
  resizable: boolean;
}

export const ITEM_SPECS: Record<string, ItemSpec> = {
  table: { type: 'table', labelEn: 'Round Table', labelAr: 'طاولة دائرية', widthM: 1.8, depthM: 1.8, heightM: 0.75, resizable: true },
  chairs: { type: 'chairs', labelEn: 'Chair', labelAr: 'كرسي', widthM: 0.45, depthM: 0.5, heightM: 0.92, resizable: false },
  stage: { type: 'stage', labelEn: 'Stage / Kosha', labelAr: 'منصة / كوشة', widthM: 8, depthM: 4, heightM: 0.6, resizable: true },
  screen: { type: 'screen', labelEn: 'LED Screen', labelAr: 'شاشة LED', widthM: 4, depthM: 0.4, heightM: 3.5, resizable: true },
  podium: { type: 'podium', labelEn: 'Podium', labelAr: 'منصة خطاب', widthM: 0.6, depthM: 0.5, heightM: 1.15, resizable: false },
  dance: { type: 'dance', labelEn: 'Dance Floor', labelAr: 'ساحة الرقص', widthM: 7.2, depthM: 7.2, heightM: 0.03, resizable: true },
  flowers: { type: 'flowers', labelEn: 'Flower Stand', labelAr: 'ستاند ورد', widthM: 0.6, depthM: 0.6, heightM: 1.5, resizable: false },
  buffet: { type: 'buffet', labelEn: 'Buffet', labelAr: 'بوفيه', widthM: 6, depthM: 0.9, heightM: 0.76, resizable: true },
  registration: { type: 'registration', labelEn: 'Registration', labelAr: 'تسجيل', widthM: 2.4, depthM: 0.75, heightM: 0.76, resizable: true },
  entrance: { type: 'entrance', labelEn: 'Entrance Arch', labelAr: 'بوابة الدخول', widthM: 3.6, depthM: 1, heightM: 3, resizable: true },
  exit: { type: 'exit', labelEn: 'Exit Arch', labelAr: 'بوابة الخروج', widthM: 3.6, depthM: 1, heightM: 3, resizable: true },
  bar: { type: 'bar', labelEn: 'Service Bar', labelAr: 'بار ضيافة', widthM: 4, depthM: 0.8, heightM: 1.1, resizable: true },
  lounge: { type: 'lounge', labelEn: 'Lounge', labelAr: 'منطقة جلوس', widthM: 3.2, depthM: 2.6, heightM: 0.8, resizable: true },
  led_wall: { type: 'led_wall', labelEn: 'LED Wall', labelAr: 'جدار LED', widthM: 6, depthM: 0.4, heightM: 3.4, resizable: true },
  truss: { type: 'truss', labelEn: 'Lighting Truss', labelAr: 'جسر إضاءة', widthM: 10, depthM: 0.4, heightM: 5, resizable: true },
};

export const itemSpec = (type: string): ItemSpec => ITEM_SPECS[type] || { type, labelEn: type, labelAr: type, widthM: 2.4, depthM: 0.9, heightM: 1, resizable: true };

/** Real width / depth of an item in metres (its own axes, before rotation). Round tables use widthM as the diameter. */
export function itemSize(item: Pick<HallLayoutItem, 'type' | 'widthM' | 'depthM' | 'shape'>): { w: number; d: number; h: number } {
  const spec = itemSpec(item.type);
  if (item.type === 'table') {
    if (item.shape === 'rect') return { w: item.widthM ?? 1.8, d: item.depthM ?? 0.9, h: spec.heightM };
    const dia = item.widthM ?? spec.widthM;
    return { w: dia, d: dia, h: spec.heightM };
  }
  return { w: item.widthM ?? spec.widthM, d: item.depthM ?? spec.depthM, h: spec.heightM };
}

/** Chairs sit this far out from the table edge (seat centre), and take this much room behind them. */
export const CHAIR_OFFSET_M = 0.38;
export const CHAIR_ZONE_M = 0.6;

/** Space a table needs including its chairs (diameter for round, width × depth for rectangular). */
export function tableFootprint(item: Pick<HallLayoutItem, 'type' | 'widthM' | 'depthM' | 'shape' | 'seats'>) {
  const { w, d } = itemSize(item);
  if (item.shape === 'rect') {
    const ends = (item.seats || 6) >= 8 ? 1 : 0;
    return { w: w + (ends ? CHAIR_ZONE_M * 2 : 0), d: d + CHAIR_ZONE_M * 2 };
  }
  return { w: w + CHAIR_ZONE_M * 2, d: d + CHAIR_ZONE_M * 2 };
}

/** Where each chair goes around a table, in metres from the table centre, and which way it faces (outward normal). */
export function chairPositions(item: Pick<HallLayoutItem, 'widthM' | 'depthM' | 'shape' | 'seats' | 'type'>) {
  const { w, d } = itemSize({ ...item, type: 'table' });
  const seats = Math.max(0, item.seats ?? (item.shape === 'rect' ? 6 : 10));
  const out: { x: number; z: number; nx: number; nz: number }[] = [];
  if (item.shape === 'rect') {
    const ends = seats >= 8 ? 1 : 0;
    const sideSeats = seats - ends * 2;
    const front = Math.ceil(sideSeats / 2);
    const back = sideSeats - front;
    for (let i = 0; i < front; i++) out.push({ x: -w / 2 + (w / front) * (i + 0.5), z: d / 2 + CHAIR_OFFSET_M, nx: 0, nz: 1 });
    for (let i = 0; i < back; i++) out.push({ x: -w / 2 + (w / back) * (i + 0.5), z: -d / 2 - CHAIR_OFFSET_M, nx: 0, nz: -1 });
    if (ends) out.push({ x: w / 2 + CHAIR_OFFSET_M, z: 0, nx: 1, nz: 0 }, { x: -w / 2 - CHAIR_OFFSET_M, z: 0, nx: -1, nz: 0 });
    return out;
  }
  const r = w / 2 + CHAIR_OFFSET_M;
  for (let i = 0; i < seats; i++) {
    const a = (i / Math.max(1, seats)) * Math.PI * 2 - Math.PI / 2;
    out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, nx: Math.cos(a), nz: Math.sin(a) });
  }
  return out;
}

/** Standard banquet tables and how many guests sit at each comfortably. */
export const TABLE_PRESETS = [
  { id: 'round150-8', shape: 'round' as const, widthM: 1.5, depthM: 1.5, seats: 8, labelEn: 'Round Ø150 cm · 8 guests', labelAr: 'دائرية Ø150 سم · 8 أفراد' },
  { id: 'round180-10', shape: 'round' as const, widthM: 1.8, depthM: 1.8, seats: 10, labelEn: 'Round Ø180 cm · 10 guests', labelAr: 'دائرية Ø180 سم · 10 أفراد' },
  { id: 'round180-12', shape: 'round' as const, widthM: 1.8, depthM: 1.8, seats: 12, labelEn: 'Round Ø180 cm · 12 guests', labelAr: 'دائرية Ø180 سم · 12 فرد' },
  { id: 'rect180-6', shape: 'rect' as const, widthM: 1.8, depthM: 0.9, seats: 6, labelEn: 'Rect 180×90 cm · 6 guests', labelAr: 'مستطيلة 180×90 سم · 6 أفراد' },
  { id: 'rect240-8', shape: 'rect' as const, widthM: 2.4, depthM: 1, seats: 8, labelEn: 'Rect 240×100 cm · 8 guests', labelAr: 'مستطيلة 240×100 سم · 8 أفراد' },
];

/** Clear walkway between the backs of chairs at neighbouring tables (about 0.8 m keeps a comfortable path for guests and waiters). */
export const AISLE_M = 0.8;
/** Clear space kept along every wall. */
export const WALL_MARGIN_M = 0.9;

// ─── Decor styles ─────────────────────────────────────────────────────────────────────────

export type DecorStyleId = 'royal_gold' | 'black_gold' | 'classic_white' | 'garden' | 'corporate';

export interface DecorStyle {
  id: DecorStyleId;
  en: string;
  ar: string;
  linen: string;
  runner: string;
  chair: string;
  chairFrame: string;
  centerpiece: 'tall' | 'low' | 'candles' | 'none';
  flower: string;
  flowerAccent: string;
  stage: string;
  backdrop: string;
  uplight: string;
}

export const DECOR_STYLES: DecorStyle[] = [
  { id: 'royal_gold', en: 'Royal gold', ar: 'ذهبي ملكي', linen: '#F4F1EA', runner: '#C49A52', chair: '#F4F1EA', chairFrame: '#C49A52', centerpiece: 'tall', flower: '#F7EEE6', flowerAccent: '#E9C9B5', stage: '#F4F1EA', backdrop: '#E9CF94', uplight: '#F3B65A' },
  { id: 'black_gold', en: 'Black & gold', ar: 'أسود وذهبي', linen: '#151517', runner: '#C49A52', chair: '#151517', chairFrame: '#C49A52', centerpiece: 'tall', flower: '#FFFFFF', flowerAccent: '#E9CF94', stage: '#151517', backdrop: '#1E1E21', uplight: '#E9CF94' },
  { id: 'classic_white', en: 'Classic white', ar: 'أبيض كلاسيك', linen: '#FFFFFF', runner: '#D9D4CA', chair: '#FFFFFF', chairFrame: '#E6E2DA', centerpiece: 'low', flower: '#FFFFFF', flowerAccent: '#9FB88F', stage: '#FFFFFF', backdrop: '#F4F1EA', uplight: '#FFE7C2' },
  { id: 'garden', en: 'Garden', ar: 'جاردن', linen: '#EFE9DD', runner: '#7E9670', chair: '#B58A5A', chairFrame: '#8C6A2E', centerpiece: 'low', flower: '#F2E3D5', flowerAccent: '#6F8F5E', stage: '#EFE9DD', backdrop: '#6F8F5E', uplight: '#FFC977' },
  { id: 'corporate', en: 'Corporate', ar: 'رسمي (مؤتمرات)', linen: '#1A1A1D', runner: '#2A2A2E', chair: '#202023', chairFrame: '#3A3A3E', centerpiece: 'none', flower: '#FFFFFF', flowerAccent: '#C49A52', stage: '#1A1A1D', backdrop: '#0D0D0F', uplight: '#FFFFFF' },
];

export const decorStyle = (id?: string | null) => DECOR_STYLES.find((s) => s.id === id) || DECOR_STYLES[0];

export const defaultDecorFor = (eventKind?: string): DecorStyleId => (eventKind === 'conference' || eventKind === 'summit' ? 'corporate' : 'royal_gold');

// ─── Auto layout ──────────────────────────────────────────────────────────────────────────

export interface AutoLayoutOptions {
  widthM: number;
  depthM: number;
  guests: number;
  eventKind?: string;
  table?: { shape: 'round' | 'rect'; widthM: number; depthM: number; seats: number };
  stage?: boolean;
  dance?: boolean;
  screen?: boolean;
  buffet?: boolean;
  entrance?: boolean;
  podium?: boolean;
  registration?: boolean;
  pool?: HallDimensions['pool'];
}

export interface AutoLayoutResult {
  items: HallLayoutItem[];
  tablesNeeded: number;
  tablesPlaced: number;
  seats: number;
}

type Rect = { x0: number; x1: number; z0: number; z1: number };
const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;

/** A capacity-based starting layout: stage at the front, dance floor before it, tables filling the rest with real aisles. */
export function autoLayout(opts: AutoLayoutOptions): AutoLayoutResult {
  const W = opts.widthM;
  const D = opts.depthM;
  const kind = opts.eventKind || 'wedding';
  const isConference = kind === 'conference' || kind === 'summit';
  const isWedding = kind === 'wedding' || kind === 'engagement';
  const table = opts.table || TABLE_PRESETS[1];
  const items: HallLayoutItem[] = [];
  const obstacles: Rect[] = [];
  const toPct = (x: number, z: number) => ({ x: ((x / W) + 0.5) * 100, y: ((z / D) + 0.5) * 100 });
  const add = (type: string, x: number, z: number, extra: Partial<HallLayoutItem> = {}, keepClear = 0.8) => {
    const spec = itemSpec(type);
    const item: HallLayoutItem = { id: `auto-${type}-${items.length + 1}`, type, labelEn: spec.labelEn, labelAr: spec.labelAr, rotation: 0, ...toPct(x, z), ...extra };
    items.push(item);
    const { w, d } = itemSize(item);
    const turned = Math.abs(((item.rotation % 180) + 180) % 180 - 90) < 1;
    const hw = (turned ? d : w) / 2 + keepClear;
    const hd = (turned ? w : d) / 2 + keepClear;
    obstacles.push({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd });
    return item;
  };

  const front = -D / 2 + WALL_MARGIN_M * 0.5;
  let cursor = front;
  const wantStage = opts.stage ?? true;
  if (wantStage) {
    const stageW = Math.min(itemSpec('stage').widthM, W * 0.45);
    const stageD = Math.min(itemSpec('stage').depthM, D * 0.18);
    if (opts.screen ?? isConference) {
      add('screen', 0, cursor + 0.2, { widthM: Math.min(4, stageW * 0.6) }, 0.2);
    }
    add('stage', 0, cursor + 0.4 + stageD / 2, { widthM: stageW, depthM: stageD, labelEn: isConference ? 'Stage' : 'Kosha / Stage', labelAr: isConference ? 'منصة' : 'الكوشة' }, 1.2);
    if (opts.podium ?? isConference) add('podium', stageW / 2 - 0.8, cursor + 0.4 + stageD / 2, {}, 0);
    cursor += 0.4 + stageD + 1.2;
  }
  if (opts.dance ?? !isConference) {
    const size = Math.min(itemSpec('dance').widthM, W * 0.4, D * 0.25);
    add('dance', 0, cursor + size / 2, { widthM: size, depthM: size }, 1);
    cursor += size + 1;
  }
  if (opts.entrance ?? true) {
    add('entrance', 0, D / 2 - 0.9, { rotation: 0 }, 1.2);
  }
  if (opts.buffet ?? false) {
    const len = Math.min(itemSpec('buffet').widthM, D * 0.35);
    add('buffet', W / 2 - WALL_MARGIN_M * 0.5 - 0.45, D * 0.15, { widthM: len, rotation: 90 }, 1.4);
  }
  if (opts.registration ?? isConference) {
    add('registration', -W / 2 + 2.4, D / 2 - 1.6, {}, 1);
  }
  if (opts.pool) {
    const pw = Math.min(opts.pool.widthM, W * 0.5);
    const pd = Math.min(opts.pool.depthM, D * 0.6);
    const px = opts.pool.side === 'left' ? -W / 2 + pw / 2 + 1 : opts.pool.side === 'center' ? 0 : W / 2 - pw / 2 - 1;
    obstacles.push({ x0: px - pw / 2 - 1.2, x1: px + pw / 2 + 1.2, z0: -pd / 2 - 1.2, z1: pd / 2 + 1.2 });
  }
  // Keep a 2.4 m walkway from the entrance to the dance floor / stage (the zaffa walk).
  const walkway = isWedding || isConference ? 1.2 : 0;

  const tableItem = { type: 'table', shape: table.shape, widthM: table.widthM, depthM: table.depthM, seats: table.seats } as const;
  const fp = tableFootprint(tableItem);
  const pitchX = fp.w + AISLE_M;
  const pitchZ = fp.d + AISLE_M;
  const tablesNeeded = Math.max(0, Math.ceil(opts.guests / Math.max(1, table.seats)));
  const usableX0 = -W / 2 + WALL_MARGIN_M + fp.w / 2;
  const usableX1 = W / 2 - WALL_MARGIN_M - fp.w / 2;
  const usableZ0 = front + (wantStage ? 0.4 + 1.2 : 0) + fp.d / 2;
  const usableZ1 = D / 2 - WALL_MARGIN_M - fp.d / 2;
  // Columns: either centred on the room, or split either side of the centre walkway.
  const xs: number[] = [];
  if (walkway) {
    for (let x = walkway + fp.w / 2; x <= usableX1 + 1e-6; x += pitchX) xs.push(x, -x);
  } else {
    const cols = Math.max(1, Math.floor((usableX1 - usableX0) / pitchX) + 1);
    const spanX = (cols - 1) * pitchX;
    for (let c = 0; c < cols; c++) xs.push(-spanX / 2 + c * pitchX);
  }
  const rows = Math.max(1, Math.floor((usableZ1 - usableZ0) / pitchZ) + 1);
  const candidates: { x: number; z: number; dist: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (const x of xs) {
      const z = usableZ0 + r * pitchZ;
      const box: Rect = { x0: x - fp.w / 2, x1: x + fp.w / 2, z0: z - fp.d / 2, z1: z + fp.d / 2 };
      if (obstacles.some((o) => overlaps(o, box))) continue;
      candidates.push({ x, z, dist: Math.hypot(x * 0.6, z - front) });
    }
  }
  const chosen = candidates.sort((a, b) => a.dist - b.dist).slice(0, tablesNeeded).sort((a, b) => (a.z - b.z) || (a.x - b.x));
  chosen.forEach((p, i) => {
    items.push({
      id: `auto-table-${i + 1}`, type: 'table', labelEn: `Table ${i + 1}`, labelAr: `طاولة ${i + 1}`, rotation: 0,
      seats: table.seats, shape: table.shape, widthM: table.widthM, depthM: table.depthM, ...toPct(p.x, p.z),
    });
  });
  return { items, tablesNeeded, tablesPlaced: chosen.length, seats: chosen.length * table.seats };
}

/** Number of guests the hall seats at banquet tables with the standard aisles (used for warnings). */
export const seatedCapacity = (dims: HallDimensions, eventKind = 'wedding') =>
  autoLayout({ widthM: dims.widthM, depthM: dims.depthM, guests: 5000, eventKind, pool: dims.pool }).seats;

export const formatM = (n: number) => (Math.round(n * 100) / 100).toString();
