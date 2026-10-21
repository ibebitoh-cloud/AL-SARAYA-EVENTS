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

/** Returns the first active booking that overlaps the requested hall slot, if any. */
export const findBookingConflict = (
  bookings: Booking[],
  request: { hallId?: string; hallName?: string; date: string; startTime: string; endTime: string; ignoreId?: string },
) => {
  if (!request.date) return undefined;
  const [s, e] = slot(request.startTime, request.endTime);
  const hallName = request.hallName?.trim();
  return bookings.find((b) => {
    if (b.status === 'cancelled' || b.id === request.ignoreId || b.date !== request.date) return false;
    const sameHall = request.hallId ? b.hallId === request.hallId : !!hallName && b.hallName.trim() === hallName;
    if (!sameHall) return false;
    const [bs, be] = slot(b.startTime, b.endTime);
    return s < be && bs < e;
  });
};

/** Booking code that is not already used by any existing booking. */
export const uniqueBookingCode = (bookings: Booking[], year = new Date().getFullYear()) => {
  const used = new Set(bookings.map((b) => b.code));
  for (let n = bookings.length + 101; ; n++) {
    const code = `BK-${year}-${n}`;
    if (!used.has(code)) return code;
  }
};
