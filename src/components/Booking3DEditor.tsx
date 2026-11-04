import { X } from 'lucide-react';
import type { Booking, Hall, Hall3DProfile, Language } from '../types/venueSystem';
import { EventLayoutDesigner } from './EventLayoutDesigner';
import { bookingDesign, designerKind } from '../data/booking3D';
import { hallDimensions } from '../data/venueModel';
import { isProLicensed } from '../data/proFeatures';

interface Props {
  booking: Booking;
  bookings: Booking[];
  halls: Hall[];
  language: Language;
  /** Staff who may edit bookings; everyone else only looks. */
  canEdit: boolean;
  onSave: (bookingId: string, design: Hall3DProfile) => void;
  onClose: () => void;
}

/** Full-screen 3D of one booking. Opens on the booking's own layout and saves back to the booking. */
export function Booking3DEditor({ booking, bookings, halls, language, canEdit, onSave, onClose }: Props) {
  const isAr = language === 'ar';
  const hall = halls.find((h) => h.id === booking.hallId);
  const pro = isProLicensed();
  return (
    <div className="fixed inset-0 z-[90] overflow-auto bg-slate-950 p-2 sm:p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-wider text-amber-400">{isAr ? '3D الحجز' : 'BOOKING 3D'}</div>
            <div className="truncate text-lg font-black text-white">{booking.code ? `${booking.code} · ` : ''}{booking.clientName} · <span dir="ltr">{booking.date}</span></div>
            {!canEdit && <div className="text-[11px] text-slate-400">{isAr ? 'عرض فقط · التعديل لمن لديه صلاحية تعديل الحجوزات' : 'View only · editing needs the bookings edit right'}</div>}
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white"><X className="me-1 inline h-3.5 w-3.5" />{isAr ? 'إغلاق' : 'Close'}</button>
        </div>
        {hall
          ? <EventLayoutDesigner language={language} halls={halls} bookings={bookings} initialBookingId={booking.id} onSaveBooking3D={canEdit ? onSave : undefined} canSave={canEdit} edition={pro ? 'pro' : 'basic'} onClose={onClose} />
          : <EventLayoutDesigner language={language} initialDesign={bookingDesign(booking, halls)} hallDims={hallDimensions(undefined)} initialEventKind={designerKind(booking.eventType)} contextTitle={isAr ? 'مكان العميل' : 'Client venue'} canSave={canEdit} edition={pro ? 'pro' : 'basic'} onSaveDesign={(design) => onSave(booking.id, design)} onClose={onClose} />}
      </div>
    </div>
  );
}
