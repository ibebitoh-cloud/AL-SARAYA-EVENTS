import type { Booking } from '../types/venueSystem';

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

/** Start/end in minutes; an end at or before the start means the event runs past midnight. */
const slot = (start: string, end: string) => {
  const s = toMinutes(start);
  let e = toMinutes(end);
  if (e <= s) e += 24 * 60;
  return [s, e] as const;
};

type SlotRequest = { hallId?: string; hallName?: string; date: string; startTime: string; endTime: string; ignoreId?: string };

/** Every active booking that overlaps the requested hall slot. Cancelled bookings never count. */
export const findBookingConflicts = (bookings: Booking[], request: SlotRequest) => {
  if (!request.date) return [];
  const [s, e] = slot(request.startTime, request.endTime);
  const hallName = request.hallName?.trim();
  return bookings.filter((b) => {
    if (b.status === 'cancelled' || b.id === request.ignoreId || b.date !== request.date) return false;
    const sameHall = request.hallId ? b.hallId === request.hallId : !!hallName && b.hallName.trim() === hallName;
    if (!sameHall) return false;
    const [bs, be] = slot(b.startTime, b.endTime);
    return s < be && bs < e;
  });
};

/** Returns the first active booking that overlaps the requested hall slot, if any. */
export const findBookingConflict = (bookings: Booking[], request: SlotRequest) => findBookingConflicts(bookings, request)[0];

/** Hall ids that stand for "a venue typed by hand", so those bookings are compared by venue name instead. */
const isNamedVenue = (hallId: string) => !hallId || hallId === 'custom-hall' || hallId === 'customer-venue';

/** Active bookings that clash with this booking (none when the booking itself is cancelled). */
export const conflictsForBooking = (bookings: Booking[], booking: Booking) =>
  booking.status === 'cancelled' ? [] : findBookingConflicts(bookings, {
    hallId: isNamedVenue(booking.hallId) ? undefined : booking.hallId, hallName: booking.hallName,
    date: booking.date, startTime: booking.startTime, endTime: booking.endTime, ignoreId: booking.id,
  });

/** Start and end of a booking in minutes from its day's midnight; the end can pass 24:00. */
export const bookingSlot = (b: Pick<Booking, 'startTime' | 'endTime'>) => slot(b.startTime, b.endTime);

/** Booking code that is not already used by any existing booking. */
export const uniqueBookingCode = (bookings: Booking[], year = new Date().getFullYear()) => {
  const used = new Set(bookings.map((b) => b.code));
  for (let n = bookings.length + 101; ; n++) {
    const code = `BK-${year}-${n}`;
    if (!used.has(code)) return code;
  }
};
