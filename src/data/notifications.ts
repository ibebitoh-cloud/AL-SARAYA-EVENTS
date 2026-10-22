import type { Booking } from '../types/venueSystem';

/**
 * In-app alerts for staff. There is no backend yet, so these live in the browser's local data
 * (and sync between tabs of the same browser). Email or WhatsApp alerts would need a server.
 */
export interface StaffNotification {
  id: string;
  kind: 'new_request';
  bookingId: string;
  bookingCode: string;
  clientName: string;
  clientPhone: string;
  hallName: string;
  date: string;
  createdAt: string;
  /** Portal user ids that have opened or dismissed this alert. */
  readBy: string[];
  /** Portal user ids that cleared this alert from their own list. Clearing never affects other users. */
  clearedBy?: string[];
}

export const NOTIFICATIONS_KEY = 'saraya-staff-notifications-v2';

export const notificationFor = (booking: Booking): StaffNotification => ({
  id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  kind: 'new_request',
  bookingId: booking.id,
  bookingCode: booking.code,
  clientName: booking.clientName,
  clientPhone: booking.clientPhone,
  hallName: booking.hallName,
  date: booking.date,
  createdAt: new Date().toISOString(),
  readBy: [],
  clearedBy: [],
});

/** The alerts one portal user still sees: each user reads and clears their own list. */
export const notificationsForUser = (all: StaffNotification[], userId: string) =>
  all.filter((n) => !(n.clearedBy ?? []).includes(userId));

/** Hide the given alerts (or all of them) for one user only. */
export const clearNotificationsForUser = (all: StaffNotification[], userId: string, ids?: string[]) =>
  all.map((n) => (ids && !ids.includes(n.id)) || (n.clearedBy ?? []).includes(userId) ? n : { ...n, clearedBy: [...(n.clearedBy ?? []), userId] });
