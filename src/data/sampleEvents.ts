import type { AssignedStaff, Booking, BookingServiceItem, ContractAgreement, EventType } from '../types/venueSystem';

// Sample events for the demo: 5 coming up and 5 already done, each with its contract.
// They are added once to a browser that already has saved bookings (see mergeSampleEvents).

const SERVICES: Record<string, [string, number, number]> = {
  'srv-1': ['بوفيه مفتوح فاخر (شامل المشاوي والحلويات)', 150, 95],
  'srv-2': ['كوشة عروس ملكية ديزاين حديث بالورد', 9000, 4500],
  'srv-3': ['ديكور سنتربيس وطاولات ورد طبيعي', 350, 180],
  'srv-4': ['شبكة إضاءة متطورة وموفينج هيد وبيمات', 5500, 2000],
  'srv-5': ['صوتيات متكاملة ودي جي احترافي لاين أري', 6000, 2200],
  'srv-6': ['تصوير فيديو 4K وكرين وفوتوغرافي ألبوم جلد', 8500, 3800],
  'srv-7': ['شاشات عرض عملاقة 4K LED جدارية', 7000, 2800],
  'srv-8': ['فريق تنظيم وإشراف وضيافة فندقية (10 أفراد)', 4000, 2000],
};

const HALLS: Record<string, [string, 'arcane' | 'porto']> = {
  'arcane-hall': ['قاعة آركين', 'arcane'],
  'arcane-pool': ['حمام السباحة', 'arcane'],
  'porto-veina': ['قاعة فيينا', 'porto'],
  'porto-roof': ['الروف', 'porto'],
  'porto-garden': ['الحديقة المفتوحة (أوبن إير)', 'porto'],
  'porto-seila': ['قاعة سيلا', 'porto'],
};

const STAFF: AssignedStaff[] = [
  { staffId: 'emp-1', name: 'كابتن محمود عبد العال', role: 'مشرف القاعة', wage: 800 },
  { staffId: 'emp-2', name: 'مروان الشريف', role: 'مهندس صوت ودي جي', wage: 1200 },
  { staffId: 'emp-3', name: 'سارة إبراهيم', role: 'مشرفة استقبال', wage: 600 },
];

interface Seed {
  n: number;
  client: string;
  phone: string;
  nationalId: string;
  type: EventType;
  details: Record<string, string>;
  date: string;
  start: string;
  end: string;
  hallId: string;
  guests: number;
  base: number;
  services: [string, number][];
  done: boolean;
  /** Upcoming only: how much has been paid so far. */
  paid?: number;
  tentative?: boolean;
  signedOn: string;
}

const SEEDS: Seed[] = [
  // Coming up
  { n: 102, client: 'يوسف حسن الشاذلي', phone: '01001234567', nationalId: '29805121401234', type: 'engagement', details: { brideName: 'ملك طارق', groomName: 'يوسف حسن' }, date: '2026-11-07', start: '19:00', end: '23:00', hallId: 'porto-roof', guests: 200, base: 30000, services: [['srv-3', 20], ['srv-5', 1], ['srv-6', 1]], done: false, paid: 35000, signedOn: '2026-10-05' },
  { n: 103, client: 'شركة النيل للتقنية والذكاء الاصطناعي', phone: '01234567890', nationalId: '—', type: 'conference', details: { companyName: 'شركة النيل للتقنية', eventTitle: 'ملتقى الذكاء الاصطناعي 2026', contactPerson: 'م. هالة رضا' }, date: '2026-11-21', start: '09:00', end: '17:00', hallId: 'porto-veina', guests: 300, base: 40000, services: [['srv-7', 1], ['srv-5', 1], ['srv-8', 1]], done: false, paid: 57000, signedOn: '2026-10-12' },
  { n: 104, client: 'عمر مصطفى الجندي', phone: '01112223334', nationalId: '29701011234567', type: 'wedding', details: { brideName: 'نور عادل', groomName: 'عمر مصطفى' }, date: '2026-11-28', start: '19:00', end: '00:00', hallId: 'porto-garden', guests: 480, base: 35000, services: [['srv-1', 480], ['srv-2', 1], ['srv-4', 1], ['srv-6', 1]], done: false, paid: 40000, signedOn: '2026-10-18' },
  { n: 105, client: 'ليلى سامح فؤاد', phone: '01223344556', nationalId: '29903032101234', type: 'birthday', details: { celebrantName: 'سليم', age: '6', theme: 'أزرق وفضي' }, date: '2026-12-05', start: '16:00', end: '20:00', hallId: 'arcane-pool', guests: 120, base: 30000, services: [['srv-3', 12], ['srv-5', 1]], done: false, paid: 10000, tentative: true, signedOn: '' },
  { n: 106, client: 'مازن أشرف القاضي', phone: '01009988776', nationalId: '29606061401111', type: 'wedding', details: { brideName: 'سلمى حاتم', groomName: 'مازن أشرف' }, date: '2026-12-19', start: '19:30', end: '00:30', hallId: 'arcane-hall', guests: 400, base: 40000, services: [['srv-1', 400], ['srv-2', 1], ['srv-5', 1], ['srv-6', 1]], done: false, paid: 50000, signedOn: '2026-10-26' },
  // Done
  { n: 91, client: 'خالد عبد السلام المنشاوي', phone: '01011223344', nationalId: '29408081201234', type: 'engagement', details: { brideName: 'رنا خالد', groomName: 'أدهم سمير' }, date: '2026-09-12', start: '19:00', end: '23:00', hallId: 'porto-seila', guests: 180, base: 30000, services: [['srv-3', 18], ['srv-5', 1]], done: true, signedOn: '2026-08-01' },
  { n: 92, client: 'هبة محمد الشربيني', phone: '01155667788', nationalId: '29210101501234', type: 'wedding', details: { brideName: 'هبة محمد', groomName: 'كريم وائل' }, date: '2026-09-26', start: '19:00', end: '00:00', hallId: 'arcane-hall', guests: 380, base: 40000, services: [['srv-1', 380], ['srv-2', 1], ['srv-6', 1]], done: true, signedOn: '2026-07-20' },
  { n: 93, client: 'المجموعة المصرية للأدوية', phone: '0223456789', nationalId: '—', type: 'corporate', details: { companyName: 'المجموعة المصرية للأدوية', eventTitle: 'الحفل السنوي للموظفين', contactPerson: 'أ. شريف ناجي' }, date: '2026-10-03', start: '18:00', end: '23:00', hallId: 'porto-garden', guests: 350, base: 35000, services: [['srv-1', 350], ['srv-4', 1], ['srv-5', 1], ['srv-8', 1]], done: true, signedOn: '2026-08-25' },
  { n: 94, client: 'ريم عبد الله النجار', phone: '01066554433', nationalId: '29512121701234', type: 'birthday', details: { celebrantName: 'ريم', age: '30', theme: 'أسود وذهبي' }, date: '2026-10-17', start: '20:00', end: '00:00', hallId: 'porto-roof', guests: 90, base: 30000, services: [['srv-3', 9], ['srv-5', 1]], done: true, signedOn: '2026-09-20' },
  { n: 95, client: 'أحمد فتحي البنا', phone: '01277889900', nationalId: '29309091301234', type: 'wedding', details: { brideName: 'دينا سعيد', groomName: 'أحمد فتحي' }, date: '2026-10-24', start: '19:30', end: '00:30', hallId: 'porto-veina', guests: 400, base: 40000, services: [['srv-1', 400], ['srv-2', 1], ['srv-4', 1], ['srv-6', 1]], done: true, signedOn: '2026-08-30' },
];

const line = (bookingN: number, [serviceId, quantity]: [string, number], i: number): BookingServiceItem => {
  const [name, unitPrice, costPrice] = SERVICES[serviceId];
  return { id: `bs-${bookingN}-${i + 1}`, serviceId, name, quantity, unitPrice, costPrice, totalPrice: unitPrice * quantity, totalCost: costPrice * quantity };
};

const toBooking = (s: Seed): Booking => {
  const services = s.services.map((x, i) => line(s.n, x, i));
  const totalPrice = s.base + services.reduce((sum, x) => sum + x.totalPrice, 0);
  const deposit = Math.round(totalPrice * 0.25 / 1000) * 1000;
  const paidAmount = s.done ? totalPrice : Math.min(totalPrice, s.paid ?? deposit);
  const securityDeposit = s.guests >= 300 ? 5000 : 3000;
  const [hallName, locationId] = HALLS[s.hallId];
  return {
    id: `bk-${s.n}`, code: `BK-2026-${s.n}`, clientName: s.client, clientPhone: s.phone, eventType: s.type, eventDetails: s.details,
    date: s.date, startTime: s.start, endTime: s.end, hallId: s.hallId, hallName, locationId, guestCount: s.guests,
    basePrice: s.base, services, totalPrice, deposit, paidAmount, remainingAmount: totalPrice - paidAmount,
    securityDeposit, securityDepositStatus: s.done ? 'refunded' : 'held',
    status: s.done ? 'completed' : s.tentative ? 'tentative' : 'confirmed',
    assignedStaff: STAFF, suppliesCost: Math.round(s.guests * 6), directExpenses: 1000, source: 'staff',
  };
};

export const SAMPLE_BOOKINGS: Booking[] = SEEDS.map(toBooking);

export const SAMPLE_CONTRACTS: ContractAgreement[] = SEEDS.map((s, i) => {
  const b = SAMPLE_BOOKINGS[i];
  return {
    id: `cnt-${s.n}`, contractNumber: `CTR-2026-${s.n}`, bookingCode: b.code, clientName: b.clientName, clientPhone: b.clientPhone,
    clientNationalId: s.nationalId, hallName: b.hallName, date: b.date, timeSlot: `${b.startTime} – ${b.endTime}`,
    totalAmount: b.totalPrice, depositAmount: b.deposit, securityDeposit: b.securityDeposit,
    status: s.done ? 'completed' : s.signedOn ? 'signed' : 'draft', signedDate: s.signedOn || undefined, termsApproved: Boolean(s.signedOn),
  };
});

const FLAG = 'saraya-sample-events-v1';

/**
 * Adds the sample events (or their contracts) to a list saved before they existed. Call
 * markSamplesMerged after the list is saved, so this happens once per browser and anything
 * deleted afterwards stays deleted.
 */
export function mergeSampleEvents<T extends { id: string }>(list: T[], samples: T[], which: 'bookings' | 'contracts'): T[] {
  try {
    if (typeof window === 'undefined' || window.localStorage.getItem(`${FLAG}-${which}`)) return list;
  } catch {
    return list;
  }
  const have = new Set(list.map((x) => x.id));
  return [...list, ...samples.filter((x) => !have.has(x.id))];
}

export function markSamplesMerged(which: 'bookings' | 'contracts') {
  try { window.localStorage.setItem(`${FLAG}-${which}`, '1'); } catch {}
}
