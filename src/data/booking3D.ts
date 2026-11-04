import type { Booking, EventType, Hall, Hall3DProfile } from '../types/venueSystem';
import { autoLayout, hallDimensions } from './venueModel';

/** Event types a hall can have its own 3D default for, in the order shown in Company profile → Halls. */
export const DEFAULT_EVENT_TYPES: { id: EventType; en: string; ar: string }[] = [
  { id: 'wedding', en: 'Wedding', ar: 'فرح' },
  { id: 'engagement', en: 'Engagement', ar: 'خطوبة' },
  { id: 'conference', en: 'Conference', ar: 'مؤتمر' },
  { id: 'corporate', en: 'Corporate', ar: 'شركات' },
  { id: 'birthday', en: 'Birthday', ar: 'عيد ميلاد' },
  { id: 'party', en: 'Other event', ar: 'مناسبة أخرى' },
];

/** The 3D designer's own event names. */
export type DesignerEventKind = 'engagement' | 'wedding' | 'conference' | 'summit' | 'birthday' | 'other';
export const designerKind = (type?: EventType | string): DesignerEventKind =>
  type === 'corporate' ? 'summit' : type === 'party' ? 'other' : (['engagement', 'wedding', 'conference', 'birthday'].includes(type || '') ? type as DesignerEventKind : 'wedding');

const clone = (design: Hall3DProfile): Hall3DProfile => JSON.parse(JSON.stringify(design));

/** An automatic layout that fits the hall and guest count, used when nothing was saved. */
export function autoDesign(hall: Hall | undefined, guests: number, eventType?: EventType | string): Hall3DProfile {
  const dims = hallDimensions(hall);
  const kind = designerKind(eventType);
  return { width: dims.widthM, depth: dims.depthM, guests, items: autoLayout({ widthM: dims.widthM, depthM: dims.depthM, guests: Math.max(10, guests), eventKind: kind, pool: dims.pool }).items, mood: 'evening' };
}

/** The hall's default for an event type: its own one, else the hall's main default. */
export function hallDefaultFor(hall: Hall | undefined, eventType?: EventType): { design: Hall3DProfile | null; source: 'event' | 'main' | 'none' } {
  const own = eventType ? hall?.defaults3D?.[eventType] : undefined;
  if (own?.items?.length) return { design: own, source: 'event' };
  if (hall?.default3D?.items?.length) return { design: hall.default3D, source: 'main' };
  return { design: null, source: 'none' };
}

/** The 3D a new booking starts with: a copy of its hall's default for the event type (later changes to the default don't touch it). */
export function starterDesignFor(booking: Pick<Booking, 'hallId' | 'eventType' | 'guestCount'>, halls: Hall[]): Hall3DProfile {
  const hall = halls.find((h) => h.id === booking.hallId);
  const { design } = hallDefaultFor(hall, booking.eventType);
  const base = design ? clone(design) : autoDesign(hall, booking.guestCount || hall?.capacity || 100, booking.eventType);
  return { ...base, guests: booking.guestCount || base.guests, updatedAt: new Date().toISOString() };
}

/** The 3D shown for a booking: its own saved one, or what it would start from. */
export const bookingDesign = (booking: Booking, halls: Hall[]): Hall3DProfile => booking.design3D?.items?.length ? booking.design3D : starterDesignFor(booking, halls);

/** Gives a booking its starter 3D if it has none yet. */
export const withStarter3D = (booking: Booking, halls: Hall[]): Booking => booking.design3D?.items?.length ? booking : { ...booking, design3D: starterDesignFor(booking, halls) };
