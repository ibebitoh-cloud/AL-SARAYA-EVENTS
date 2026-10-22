import type { Booking } from '../types/venueSystem';

/**
 * Colour groups used only by the booking calendar. They are views of the saved booking status, not new statuses:
 * a booking keeps its status and the calendar works out its colour from it every time it draws.
 */
export type CalendarCategory = 'confirmed' | 'pending' | 'tentative' | 'completed' | 'cancelled';

export interface CalendarCategoryStyle {
  id: CalendarCategory;
  ar: string;
  en: string;
  hintAr: string;
  hintEn: string;
  /** Solid swatch (legend dot, left edge of a booking). */
  dot: string;
  /** Booking chip: tinted background, readable text and a coloured edge. */
  chip: string;
  /** Strong badge for the details panel. */
  badge: string;
}

export const CALENDAR_CATEGORIES: CalendarCategoryStyle[] = [
  { id: 'confirmed', ar: 'مؤكد', en: 'Confirmed', hintAr: 'الحجز مؤكد', hintEn: 'Reservation confirmed', dot: 'bg-red-500', chip: 'border-red-500 bg-red-500/15 text-red-100 hover:bg-red-500/30', badge: 'bg-red-500 text-white' },
  { id: 'pending', ar: 'بانتظار التأكيد', en: 'Pending', hintAr: 'طلب من الموقع لم يراجعه الفريق بعد', hintEn: 'Awaiting confirmation', dot: 'bg-amber-400', chip: 'border-amber-400 bg-amber-400/15 text-amber-100 hover:bg-amber-400/30', badge: 'bg-amber-400 text-slate-950' },
  { id: 'tentative', ar: 'مبدئي / محجوز مؤقتاً', en: 'Tentative / On hold', hintAr: 'محجوز مؤقتاً حتى التأكيد', hintEn: 'Temporarily reserved', dot: 'bg-blue-500', chip: 'border-blue-500 bg-blue-500/15 text-blue-100 hover:bg-blue-500/30', badge: 'bg-blue-500 text-white' },
  { id: 'completed', ar: 'تمت المناسبة', en: 'Completed', hintAr: 'انتهت المناسبة', hintEn: 'Event completed', dot: 'bg-green-500', chip: 'border-green-500 bg-green-500/15 text-green-100 hover:bg-green-500/30', badge: 'bg-green-500 text-white' },
  { id: 'cancelled', ar: 'ملغي', en: 'Cancelled', hintAr: 'حجز ملغي ولا يمنع حجز الموعد', hintEn: 'Cancelled reservation', dot: 'bg-slate-400', chip: 'border-slate-500 bg-slate-500/15 text-slate-300 line-through decoration-slate-500 hover:bg-slate-500/30', badge: 'bg-slate-500 text-white' },
];

const BY_ID = Object.fromEntries(CALENDAR_CATEGORIES.map((c) => [c.id, c])) as Record<CalendarCategory, CalendarCategoryStyle>;

/**
 * Saved status → calendar colour.
 * - confirmed → red, completed → green, cancelled → gray.
 * - tentative from the public website (not yet reviewed by staff) → amber "pending".
 * - tentative entered by staff → blue "on hold".
 * - anything unknown (old or hand-edited data) → amber, so it stands out for someone to review.
 */
export const calendarCategory = (b: Pick<Booking, 'status' | 'source'>): CalendarCategory => {
  switch (b.status) {
    case 'confirmed': return 'confirmed';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    case 'tentative': return b.source === 'website' || b.source === 'website_quick' ? 'pending' : 'tentative';
    default: return 'pending';
  }
};

export const categoryStyle = (b: Pick<Booking, 'status' | 'source'>) => BY_ID[calendarCategory(b)];

/** Local YYYY-MM-DD for a date, matching how bookings store their day. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Monday of the week that holds `d`. */
export const startOfWeek = (d: Date) => {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
};

export const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

/** Venue a booking is shown under. Typed-in venues share no hall id, so their name is the key. */
export const venueKey = (b: Pick<Booking, 'hallId' | 'hallName'>) => (b.hallId && b.hallId !== 'custom-hall' && b.hallId !== 'customer-venue' ? b.hallId : `name:${b.hallName.trim()}`);
