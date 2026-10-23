import { useState } from 'react';
import type { Booking, Hall, Language, PriceBook, ServiceDefinition } from '../types/venueSystem';
import { RecordEditorModal } from './RecordEditor';
import { BookingServicesEditor } from './BookingServicesEditor';
import { ConflictWarning, makeConflictOverride, overrideReasonOk } from './ConflictWarning';
import { bookingFields } from '../data/recordFields';
import { conflictsForBooking } from '../utils/bookingRules';
import { makeTr } from '../utils/tr';

interface Props {
  booking: Booking;
  bookings: Booking[];
  halls: Hall[];
  services: ServiceDefinition[];
  priceBook?: PriceBook;
  canDiscount: boolean;
  /** CEO, or a role the CEO allowed to save over a double-booking warning. */
  canOverrideConflict: boolean;
  currentUser?: { id: string; name: string } | null;
  language: Language;
  onSave: (booking: Booking) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** Booking edit form shared by the bookings list and the calendar, with the double-booking check. */
export function BookingEditModal({ booking, bookings, halls, services, priceBook, canDiscount, canOverrideConflict, currentUser, language, onSave, onDelete, onClose }: Props) {
  const { tr } = makeTr(language);
  const [reason, setReason] = useState('');
  // The venue name follows the chosen hall, so compare the draft as it will be saved.
  const withHallName = (b: Booking) => ({ ...b, hallName: halls.find((h) => h.id === b.hallId)?.name ?? b.hallName });
  const clashes = (b: Booking) => conflictsForBooking(bookings, withHallName(b));
  // A clash already overridden for the same bookings does not need a new reason.
  const alreadyCleared = (b: Booking, list: Booking[]) => {
    const cleared = new Set((b.conflictOverride?.conflictWithCode || '').split(',').map((c) => c.trim()).filter(Boolean));
    return list.every((c) => cleared.has(c.code));
  };
  return (
    <RecordEditorModal
      title={`${tr('تعديل الحجز', 'Edit booking')} ${booking.code}`}
      fields={bookingFields(halls)}
      value={booking}
      language={language}
      extra={(draft, set) => {
        const list = clashes(draft);
        return (
          <>
            {list.length > 0 && !alreadyCleared(draft, list) && <div className="mt-4"><ConflictWarning conflicts={list} canOverride={canOverrideConflict} reason={reason} onReasonChange={setReason} language={language} halls={halls} /></div>}
            {priceBook && <BookingServicesEditor booking={draft} services={services} priceBook={priceBook} language={language} canDiscount={canDiscount} set={set} />}
          </>
        );
      }}
      validate={(draft) => {
        const list = clashes(draft);
        if (!list.length || alreadyCleared(draft, list)) return undefined;
        if (!canOverrideConflict) return tr('الموعد متعارض مع حجز آخر في نفس القاعة.', 'This time clashes with another booking at the same venue.');
        if (!overrideReasonOk(reason)) return tr('اكتب سبب الحفظ رغم التعارض.', 'Write the reason for saving over the clash.');
        return undefined;
      }}
      onSave={(draft) => {
        const list = clashes(draft);
        onSave(list.length && !alreadyCleared(draft, list) ? { ...draft, conflictOverride: makeConflictOverride(list, reason, currentUser) } : draft);
      }}
      onDelete={onDelete}
      onClose={onClose}
    />
  );
}
