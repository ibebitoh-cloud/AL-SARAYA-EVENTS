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
}

export const NOTIFICATIONS_KEY = 'saraya-staff-notifications-v1';

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
});
