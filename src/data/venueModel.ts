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
  // 3D Studio Pro objects
  cake: { type: 'cake', labelEn: 'Wedding Cake', labelAr: 'تورتة الفرح', widthM: 1.2, depthM: 1.2, heightM: 1.9, resizable: false },
  dj: { type: 'dj', labelEn: 'DJ Booth', labelAr: 'ركن الدي جي', widthM: 2.4, depthM: 1, heightM: 1.2, resizable: true },
  photo_booth: { type: 'photo_booth', labelEn: 'Photo Booth Wall', labelAr: 'ركن التصوير', widthM: 3, depthM: 1.2, heightM: 2.6, resizable: true },
  flower_arch: { type: 'flower_arch', labelEn: 'Floral Ring Arch', labelAr: 'قوس ورد دائري', widthM: 2.6, depthM: 0.8, heightM: 2.8, resizable: false },
  aisle: { type: 'aisle', labelEn: 'Bridal Aisle', labelAr: 'ممر الزفة', widthM: 1.6, depthM: 10, heightM: 1.2, resizable: true },
  cocktail: { type: 'cocktail', labelEn: 'Cocktail Table', labelAr: 'طاولة كوكتيل عالية', widthM: 0.7, depthM: 0.7, heightM: 1.1, resizable: false },
  champagne: { type: 'champagne', labelEn: 'Champagne Tower', labelAr: 'برج كاسات', widthM: 1, depthM: 1, heightM: 1.5, resizable: false },
  sweets: { type: 'sweets', labelEn: 'Sweets Table', labelAr: 'طاولة الحلويات', widthM: 3, depthM: 0.8, heightM: 1.2, resizable: true },
  sparklers: { type: 'sparklers', labelEn: 'Cold Spark Machine', labelAr: 'ماكينة شرار بارد', widthM: 0.4, depthM: 0.4, heightM: 0.3, resizable: false },
  love_letters: { type: 'love_letters', labelEn: 'LOVE Light Letters', labelAr: 'حروف LOVE مضيئة', widthM: 3, depthM: 0.3, heightM: 1.2, resizable: false },
  ceiling_florals: { type: 'ceiling_florals', labelEn: 'Hanging Florals', labelAr: 'ورد معلّق بالسقف', widthM: 2.4, depthM: 2.4, heightM: 1.2, resizable: true },
  gift_table: { type: 'gift_table', labelEn: 'Gift & Guestbook Table', labelAr: 'طاولة الهدايا ودفتر الضيوف', widthM: 1.8, depthM: 0.7, heightM: 0.76, resizable: true },
  // Shared catalogue (Basic and Pro)
  head_table: { type: 'head_table', labelEn: 'Head Table', labelAr: 'طاولة رئيسية', widthM: 6, depthM: 0.9, heightM: 0.75, resizable: true },
  kids_table: { type: 'kids_table', labelEn: 'Kids Table', labelAr: 'طاولة أطفال', widthM: 1.2, depthM: 1.2, heightM: 0.55, resizable: false },
  sofa: { type: 'sofa', labelEn: 'Sofa', labelAr: 'كنبة', widthM: 2.1, depthM: 0.9, heightM: 0.85, resizable: true },
  armchair: { type: 'armchair', labelEn: 'Armchair', labelAr: 'فوتيه', widthM: 0.85, depthM: 0.85, heightM: 0.9, resizable: false },
  ottoman: { type: 'ottoman', labelEn: 'Pouf / Ottoman', labelAr: 'بوف', widthM: 0.55, depthM: 0.55, heightM: 0.42, resizable: false },
  bench: { type: 'bench', labelEn: 'Bench', labelAr: 'بنش', widthM: 1.8, depthM: 0.5, heightM: 0.85, resizable: true },
  bar_stool: { type: 'bar_stool', labelEn: 'Bar Stool', labelAr: 'كرسي بار', widthM: 0.42, depthM: 0.42, heightM: 0.95, resizable: false },
  projector_screen: { type: 'projector_screen', labelEn: 'Projector Screen', labelAr: 'شاشة بروجيكتور', widthM: 3.6, depthM: 0.6, heightM: 3, resizable: true },
  tv_stand: { type: 'tv_stand', labelEn: 'TV on Stand', labelAr: 'شاشة على ستاند', widthM: 1.5, depthM: 0.6, heightM: 2, resizable: false },
  mic_stand: { type: 'mic_stand', labelEn: 'Microphone', labelAr: 'مايك على ستاند', widthM: 0.4, depthM: 0.4, heightM: 1.6, resizable: false },
  speaker: { type: 'speaker', labelEn: 'Speaker Tower', labelAr: 'سماعة كبيرة', widthM: 0.6, depthM: 0.55, heightM: 2.2, resizable: false },
  piano: { type: 'piano', labelEn: 'Grand Piano', labelAr: 'بيانو', widthM: 1.5, depthM: 2, heightM: 1, resizable: false },
  band_riser: { type: 'band_riser', labelEn: 'Band Riser', labelAr: 'منصة الفرقة', widthM: 4, depthM: 3, heightM: 0.4, resizable: true },
  round_buffet: { type: 'round_buffet', labelEn: 'Buffet Island', labelAr: 'بوفيه دائري', widthM: 2.4, depthM: 2.4, heightM: 0.9, resizable: true },
  coffee_station: { type: 'coffee_station', labelEn: 'Coffee Station', labelAr: 'ركن القهوة', widthM: 2.2, depthM: 0.8, heightM: 1.2, resizable: true },
  juice_station: { type: 'juice_station', labelEn: 'Juice Station', labelAr: 'ركن العصائر', widthM: 2, depthM: 0.8, heightM: 1.2, resizable: true },
  water_station: { type: 'water_station', labelEn: 'Water Station', labelAr: 'ركن المياه', widthM: 1.2, depthM: 0.6, heightM: 1.1, resizable: false },
  live_cooking: { type: 'live_cooking', labelEn: 'Live Cooking', labelAr: 'ركن طبخ مباشر', widthM: 3, depthM: 1, heightM: 2.2, resizable: true },
  popcorn_cart: { type: 'popcorn_cart', labelEn: 'Popcorn Cart', labelAr: 'عربية فشار', widthM: 1, depthM: 0.7, heightM: 1.8, resizable: false },
  ice_cream_cart: { type: 'ice_cream_cart', labelEn: 'Ice Cream Cart', labelAr: 'عربية آيس كريم', widthM: 1.4, depthM: 0.8, heightM: 2, resizable: false },
  potted_plant: { type: 'potted_plant', labelEn: 'Potted Plant', labelAr: 'زرعة', widthM: 0.6, depthM: 0.6, heightM: 1.3, resizable: false },
  palm_tree: { type: 'palm_tree', labelEn: 'Palm Tree', labelAr: 'نخلة', widthM: 1.6, depthM: 1.6, heightM: 3.2, resizable: false },
  light_tree: { type: 'light_tree', labelEn: 'Tree with Lights', labelAr: 'شجرة بإضاءة', widthM: 1.6, depthM: 1.6, heightM: 2.8, resizable: false },
  column: { type: 'column', labelEn: 'Decor Column', labelAr: 'عمود ديكور', widthM: 0.5, depthM: 0.5, heightM: 2.4, resizable: false },
  backdrop: { type: 'backdrop', labelEn: 'Backdrop Wall', labelAr: 'خلفية ديكور', widthM: 4, depthM: 0.3, heightM: 2.8, resizable: true },
  balloon_arch: { type: 'balloon_arch', labelEn: 'Balloon Arch', labelAr: 'قوس بالونات', widthM: 3.2, depthM: 0.6, heightM: 2.8, resizable: true },
  balloons: { type: 'balloons', labelEn: 'Balloon Bunch', labelAr: 'باقة بالونات', widthM: 0.8, depthM: 0.8, heightM: 2.2, resizable: false },
  candelabra: { type: 'candelabra', labelEn: 'Candelabra', labelAr: 'شمعدان', widthM: 0.6, depthM: 0.6, heightM: 1.4, resizable: false },
  lanterns: { type: 'lanterns', labelEn: 'Lantern Set', labelAr: 'فوانيس', widthM: 0.9, depthM: 0.6, heightM: 0.7, resizable: false },
  welcome_sign: { type: 'welcome_sign', labelEn: 'Welcome Sign', labelAr: 'لوحة ترحيب', widthM: 0.9, depthM: 0.7, heightM: 1.7, resizable: false },
  red_carpet: { type: 'red_carpet', labelEn: 'Carpet Runner', labelAr: 'سجادة ممر', widthM: 1.5, depthM: 8, heightM: 0.02, resizable: true },
  spotlight: { type: 'spotlight', labelEn: 'Spotlight Stand', labelAr: 'ستاند سبوت لايت', widthM: 0.8, depthM: 0.8, heightM: 2.6, resizable: false },
  uplight: { type: 'uplight', labelEn: 'Uplight', labelAr: 'إضاءة أرضية', widthM: 0.3, depthM: 0.3, heightM: 0.25, resizable: false },
  moving_head: { type: 'moving_head', labelEn: 'Moving Head Light', labelAr: 'موفينج هيد', widthM: 0.5, depthM: 0.5, heightM: 0.6, resizable: false },
  string_lights: { type: 'string_lights', labelEn: 'Fairy Light Curtain', labelAr: 'ستارة إضاءة', widthM: 3, depthM: 0.2, heightM: 3, resizable: true },
  fog_machine: { type: 'fog_machine', labelEn: 'Fog Machine', labelAr: 'ماكينة دخان', widthM: 0.6, depthM: 0.4, heightM: 0.3, resizable: false },
  chandelier: { type: 'chandelier', labelEn: 'Chandelier', labelAr: 'نجفة', widthM: 1.4, depthM: 1.4, heightM: 1, resizable: false },
  stanchions: { type: 'stanchions', labelEn: 'Rope Barriers', labelAr: 'حواجز حبال', widthM: 4, depthM: 0.35, heightM: 1, resizable: true },
  cloakroom: { type: 'cloakroom', labelEn: 'Cloakroom', labelAr: 'غرفة المعاطف', widthM: 3, depthM: 1.6, heightM: 1.8, resizable: true },
  kids_area: { type: 'kids_area', labelEn: 'Kids Play Area', labelAr: 'ركن ألعاب أطفال', widthM: 4, depthM: 4, heightM: 1.2, resizable: true },
  arch_gate: { type: 'arch_gate', labelEn: 'Classic Arch Gate', labelAr: 'بوابة قوس كلاسيك', widthM: 3, depthM: 0.6, heightM: 3.2, resizable: true },
  // More 3D Studio Pro objects
  royal_chairs: { type: 'royal_chairs', labelEn: 'Royal Couple Chairs', labelAr: 'كراسي العروسين الملكية', widthM: 2, depthM: 1, heightM: 1.6, resizable: false },
  ice_sculpture: { type: 'ice_sculpture', labelEn: 'Ice Sculpture', labelAr: 'تمثال ثلج', widthM: 1.2, depthM: 0.8, heightM: 1.8, resizable: false },
  floral_pillar: { type: 'floral_pillar', labelEn: 'Flower Pillar', labelAr: 'عمود ورد', widthM: 0.6, depthM: 0.6, heightM: 2.2, resizable: false },
  floral_swing: { type: 'floral_swing', labelEn: 'Floral Swing', labelAr: 'مرجيحة ورد', widthM: 2.2, depthM: 1.4, heightM: 2.6, resizable: false },
  pergola: { type: 'pergola', labelEn: 'Floral Pergola', labelAr: 'برجولا ورد', widthM: 3, depthM: 3, heightM: 2.8, resizable: true },
  water_fountain: { type: 'water_fountain', labelEn: 'Water Fountain', labelAr: 'نافورة', widthM: 2, depthM: 2, heightM: 1.6, resizable: false },
  crystal_chandelier: { type: 'crystal_chandelier', labelEn: 'Crystal Chandelier', labelAr: 'نجفة كريستال', widthM: 2, depthM: 2, heightM: 1.8, resizable: false },
  neon_sign: { type: 'neon_sign', labelEn: 'Neon Sign', labelAr: 'لافتة نيون', widthM: 1.8, depthM: 0.2, heightM: 0.8, resizable: false },
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

export type DecorStyleId = 'royal_gold' | 'black_gold' | 'classic_white' | 'garden' | 'corporate' | 'custom';

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

/** The colours a planner can set in a custom style. */
export const CUSTOM_DECOR_FIELDS = ['linen', 'runner', 'chair', 'chairFrame', 'flower', 'flowerAccent', 'stage', 'backdrop', 'uplight'] as const;
export type CustomDecor = Pick<DecorStyle, typeof CUSTOM_DECOR_FIELDS[number] | 'centerpiece'>;
const CUSTOM_PREFIX = 'custom:';
const HEX = /^#[0-9a-f]{6}$/i;

/** A custom style is saved in the same `decor` field as "custom:{json}" so plans keep it. */
export const encodeCustomDecor = (custom: CustomDecor) => CUSTOM_PREFIX + JSON.stringify(custom);
export const isCustomDecor = (id?: string | null) => Boolean(id && id.startsWith(CUSTOM_PREFIX));

export const decorStyle = (id?: string | null): DecorStyle => {
  if (id && id.startsWith(CUSTOM_PREFIX)) {
    const base = DECOR_STYLES[0];
    let saved: Partial<CustomDecor> = {};
    try { saved = JSON.parse(id.slice(CUSTOM_PREFIX.length)) || {}; } catch {}
    const style: DecorStyle = { ...base, id: 'custom', en: 'Custom', ar: 'مخصص' };
    CUSTOM_DECOR_FIELDS.forEach((key) => { const v = saved[key]; if (typeof v === 'string' && HEX.test(v)) style[key] = v; });
    if (saved.centerpiece && ['tall', 'low', 'candles', 'none'].includes(saved.centerpiece)) style.centerpiece = saved.centerpiece;
    return style;
  }
  return DECOR_STYLES.find((s) => s.id === id) || DECOR_STYLES[0];
};

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
