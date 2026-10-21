import type { EventType, LocationId } from '../types/venueSystem';

/**
 * An operation the team prepares before meeting the customer: who, what, where and when.
 * In the meeting the customer only makes choices (package + options); progress is saved here.
 */
export interface PreparedOperation {
  id: string;
  createdAt: string;
  eventType: EventType;
  locationId: LocationId;
  hallId: string;
  guests: number;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  details: Record<string, string>;
  budget: number;
  notes: string;
  packageId: string;
  /** optionId → quantity (1 for options priced per event/guest/table; chosen count for per-piece). */
  selections: Record<string, number>;
  /** Set once the session is saved as a tentative booking. */
  bookingCode?: string;
}

const KEY = 'saraya-prepared-operations-v1';

export const loadPreparedOperations = (): PreparedOperation[] => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export const savePreparedOperations = (ops: PreparedOperation[]) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ops));
  } catch {}
};
