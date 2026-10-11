import type { EventPackage, LocationId, PriceBook, PriceEntry, ServiceDefinition } from '../types/venueSystem';

/**
 * Sellable packages. Names/contents are defined here; prices are set per location in the PriceBook
 * (management screen "قوائم الأسعار"). Package prices are per guest.
 */
export const EVENT_PACKAGES: EventPackage[] = [
  {
    id: 'pkg-wedding-silver', nameAr: 'باقة الفرح الفضية', nameEn: 'Silver Wedding', eventTypes: ['wedding'], minGuests: 150,
    includesAr: ['بوفيه عشاء', 'كوشة كلاسيك', 'دي جي وصوتيات', 'تصوير فوتوغرافي'],
    includesEn: ['Dinner buffet', 'Classic kosha', 'DJ & sound', 'Photography'],
  },
  {
    id: 'pkg-wedding-gold', nameAr: 'باقة الفرح الذهبية', nameEn: 'Gold Wedding', eventTypes: ['wedding'], minGuests: 200,
    includesAr: ['بوفيه مفتوح فاخر', 'كوشة ورد طبيعي', 'دي جي + إضاءة موفينج', 'تصوير فيديو وفوتو', 'زفة'],
    includesEn: ['Premium open buffet', 'Fresh-flower kosha', 'DJ + moving-head lights', 'Video & photo', 'Zaffa'],
  },
  {
    id: 'pkg-wedding-platinum', nameAr: 'باقة الفرح البلاتينية', nameEn: 'Platinum Wedding', eventTypes: ['wedding'], minGuests: 250,
    includesAr: ['بوفيه ملكي ومحطات حية', 'كوشة ملكية', 'إضاءة وشاشات LED', 'تصوير 4K وكرين', 'زفة وفريق تنظيم كامل'],
    includesEn: ['Royal buffet & live stations', 'Royal kosha', 'Lighting & LED screens', '4K video & crane', 'Zaffa & full event crew'],
  },
  {
    id: 'pkg-engagement', nameAr: 'باقة الخطوبة', nameEn: 'Engagement Package', eventTypes: ['engagement'], minGuests: 80,
    includesAr: ['ضيافة وحلويات', 'ديكور ورد', 'دي جي', 'تصوير فوتوغرافي'],
    includesEn: ['Hospitality & sweets', 'Floral decor', 'DJ', 'Photography'],
  },
  {
    id: 'pkg-birthday', nameAr: 'باقة عيد الميلاد', nameEn: 'Birthday Package', eventTypes: ['birthday', 'party'], minGuests: 30,
    includesAr: ['ديكور بالونات وثيم', 'تورتة وحلويات', 'دي جي', 'ضيافة'],
    includesEn: ['Balloon & theme decor', 'Cake & sweets', 'DJ', 'Hospitality'],
  },
  {
    id: 'pkg-conference-half', nameAr: 'باقة مؤتمر نصف يوم', nameEn: 'Half-day Conference', eventTypes: ['conference'], minGuests: 30,
    includesAr: ['قاعة مجهزة', 'شاشة عرض وصوتيات', 'استراحة قهوة'],
    includesEn: ['Equipped hall', 'Screen & sound', 'Coffee break'],
  },
  {
    id: 'pkg-conference-full', nameAr: 'باقة مؤتمر يوم كامل', nameEn: 'Full-day Conference', eventTypes: ['conference'], minGuests: 30,
    includesAr: ['قاعة مجهزة', 'شاشة عرض وصوتيات', 'استراحتي قهوة', 'غداء بوفيه'],
    includesEn: ['Equipped hall', 'Screen & sound', 'Two coffee breaks', 'Buffet lunch'],
  },
];

/** Placeholder package prices per guest — the manager sets the real ones per location. */
const ARCANE_PACKAGE_PRICES: Record<string, PriceEntry> = {
  'pkg-wedding-silver': { price: 450, cost: 280 },
  'pkg-wedding-gold': { price: 650, cost: 400 },
  'pkg-wedding-platinum': { price: 900, cost: 560 },
  'pkg-engagement': { price: 350, cost: 210 },
  'pkg-birthday': { price: 300, cost: 180 },
  'pkg-conference-half': { price: 400, cost: 230 },
  'pkg-conference-full': { price: 650, cost: 380 },
};

const roundTo50 = (n: number) => Math.round(n / 50) * 50;

/** Starting price book: Arcane uses the catalogue prices; Porto starts ~10% higher as a placeholder. */
export const buildInitialPriceBook = (services: ServiceDefinition[]): PriceBook => {
  const arcaneServices: Record<string, PriceEntry> = {};
  const portoServices: Record<string, PriceEntry> = {};
  services.forEach((s) => {
    arcaneServices[s.id] = { price: s.defaultPrice, cost: s.defaultCost };
    portoServices[s.id] = { price: s.defaultPrice >= 1000 ? roundTo50(s.defaultPrice * 1.1) : Math.round(s.defaultPrice * 1.1), cost: s.defaultCost };
  });
  const portoPackages: Record<string, PriceEntry> = {};
  Object.entries(ARCANE_PACKAGE_PRICES).forEach(([id, e]) => { portoPackages[id] = { price: roundTo50(e.price * 1.1), cost: e.cost }; });
  return {
    arcane: { packages: { ...ARCANE_PACKAGE_PRICES }, services: arcaneServices },
    porto: { packages: portoPackages, services: portoServices },
  };
};

/** Selling price + cost of a service at a location (falls back to the catalogue default). */
export const servicePriceAt = (book: PriceBook, loc: LocationId, srv: ServiceDefinition): PriceEntry =>
  book[loc]?.services[srv.id] || { price: srv.defaultPrice, cost: srv.defaultCost };

export const packagePriceAt = (book: PriceBook, loc: LocationId, pkgId: string): PriceEntry =>
  book[loc]?.packages[pkgId] || { price: 0, cost: 0 };

export const packagesFor = (eventType: string) => EVENT_PACKAGES.filter((p) => p.eventTypes.includes(eventType as never));

export const formatEGP = (n: number, isAr = true) => `${Math.round(n).toLocaleString(isAr ? 'ar-EG' : 'en-US')} ${isAr ? 'ج.م' : 'EGP'}`;
