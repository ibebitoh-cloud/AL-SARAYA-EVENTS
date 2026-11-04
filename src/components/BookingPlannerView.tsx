import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, CalendarDays, CheckCircle2, CircleDashed, ClipboardList, Clock, ImageOff, Lock, MapPin, Phone, Users, Wallet } from 'lucide-react';
import type { Booking, Hall, Hall3DProfile, Language, PriceBook, ServiceDefinition } from '../types/venueSystem';
import { bookingStatusLabel, eventTypeLabel, makeTr } from '../utils/tr';
import { eventTypeConfig } from '../data/eventTypes';
import { bookingPriceLocation, locationName, priceLocationName } from '../data/locations';
import { servicePriceAt } from '../data/pricing';
import { bookingTotals } from '../data/recordFields';
import { hallDimensions } from '../data/venueModel';
import { bookingDesign } from '../data/booking3D';
import { Booking3DEditor } from './Booking3DEditor';
import { EventLayout3D } from './EventLayout3D';
import { isProLicensed } from '../data/proFeatures';

interface Props {
  booking: Booking;
  halls: Hall[];
  services: ServiceDefinition[];
  priceBook: PriceBook;
  language: Language;
  onBack: () => void;
  /** Selling-prices-only users: hide deposit, paid, balance and security deposit, as on the Bookings screen. */
  hidePayments?: boolean;
  /** All bookings (for the 3D "Working on" list). */
  bookings?: Booking[];
  /** Saves the booking's own 3D. Left out = the 3D opens view-only. */
  onSaveBooking3D?: (bookingId: string, design: Hall3DProfile) => void;
}

const card = 'rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6';
const statusCls: Record<string, string> = {
  confirmed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  tentative: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  completed: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  cancelled: 'border-slate-600 bg-slate-800 text-slate-400',
};

/**
 * Event Planner for one booking: the full booking, the Basic 3D model of its hall, and the services
 * the client has not picked yet (for reference). Read only: bookings are edited by admin users on the Bookings screen.
 * Selling prices only; costs and wages are never shown here.
 */
export function BookingPlannerView({ booking, halls, services, priceBook, language, onBack, hidePayments = false, bookings = [], onSaveBooking3D }: Props) {
  const [open3D, setOpen3D] = useState(false);
  const { isAr, tr, egp } = makeTr(language);
  const hall = halls.find((h) => h.id === booking.hallId);
  const hallName = hall ? (isAr ? hall.name : hall.nameEn || hall.name) : booking.hallName || tr('مكان العميل', 'Client venue');
  const place = bookingPriceLocation(booking);
  const totals = bookingTotals(booking);
  const cfg = eventTypeConfig(booking.eventType);
  const pickedIds = new Set(booking.services.map((s) => s.serviceId));
  const notPicked = services.filter((s) => !pickedIds.has(s.id));

  const scene = useMemo(() => {
    const dims = hallDimensions(hall);
    const design = bookingDesign(booking, halls);
    return { dims, items: design.items, decor: design.decor, mood: design.mood, own: !!booking.design3D?.items?.length };
  }, [hall, booking, halls]);

  const pro3D = useMemo(() => isProLicensed(), []);
  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const detailFields = cfg.fields.filter((f) => booking.eventDetails?.[f.key]?.trim());
  const row = (label: React.ReactNode, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-3 border-b border-slate-800/70 py-2 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-end text-sm font-semibold text-white">{value || '—'}</span>
    </div>
  );

  return (
    <div className="w-full space-y-5 pb-20 text-start">
      {/* Header */}
      <div className={`${card} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="min-w-0">
          <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200"><BackIcon className="h-3.5 w-3.5" /> {tr('اختيار مناسبة أخرى', 'Choose another event')}</button>
          <h2 className="text-xl font-black text-white">{cfg.emoji} {booking.clientName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-slate-300">{booking.code}</span>
            <span>·</span><span>{eventTypeLabel(booking.eventType, isAr)}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusCls[booking.status] || statusCls.tentative}`}>{bookingStatusLabel(booking.status, isAr)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[340px]">
          <div className="rounded-2xl bg-slate-950/70 p-2.5"><CalendarDays className="mx-auto h-4 w-4 text-amber-300" /><div className="mt-1 whitespace-nowrap font-mono text-[11px] font-bold text-white sm:text-xs">{booking.date}</div></div>
          <div className="rounded-2xl bg-slate-950/70 p-2.5"><Clock className="mx-auto h-4 w-4 text-amber-300" /><div className="mt-1 whitespace-nowrap font-mono text-[11px] font-bold text-white sm:text-xs" dir="ltr">{booking.startTime}–{booking.endTime}</div></div>
          <div className="rounded-2xl bg-slate-950/70 p-2.5"><Users className="mx-auto h-4 w-4 text-amber-300" /><div className="mt-1 font-mono text-xs font-bold text-white">{booking.guestCount}</div></div>
        </div>
      </div>

      {/* Full booking data */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className={card}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-300"><Phone className="h-4 w-4" /> {tr('العميل', 'Client')}</h3>
          {row(tr('الاسم', 'Name'), booking.clientName)}
          {row(tr('الهاتف', 'Phone'), <span className="font-mono" dir="ltr">{booking.clientPhone}</span>)}
          {row(tr('العنوان', 'Address'), booking.clientAddress)}
          {detailFields.map((f) => <div key={f.key}>{row(isAr ? f.labelAr : f.labelEn, booking.eventDetails?.[f.key])}</div>)}
          {booking.clientNotes && <p className="mt-3 rounded-xl bg-slate-950/70 p-3 text-xs leading-5 text-slate-300"><span className="font-bold text-slate-400">{tr('ملاحظات العميل: ', 'Client notes: ')}</span>{booking.clientNotes}</p>}
        </section>

        <section className={card}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-300"><MapPin className="h-4 w-4" /> {tr('المناسبة والمكان', 'Event and venue')}</h3>
          {row(tr('نوع المناسبة', 'Event type'), eventTypeLabel(booking.eventType, isAr))}
          {row(tr('الموقع', 'Location'), booking.hallId ? locationName(booking.locationId || 'arcane', isAr) : priceLocationName('other', isAr))}
          {row(tr('القاعة', 'Hall'), hallName)}
          {row(tr('التاريخ', 'Date'), <span className="font-mono">{booking.date}</span>)}
          {row(tr('الوقت', 'Time'), <span className="font-mono" dir="ltr">{booking.startTime} – {booking.endTime}</span>)}
          {row(tr('عدد المدعوين', 'Guests'), booking.guestCount)}
          {row(tr('الباقة', 'Package'), booking.packageName)}
          {booking.assignedStaff?.length > 0 && row(tr('فريق العمل', 'Team'), booking.assignedStaff.map((s) => s.name).join('، '))}
        </section>

        <section className={`${card} md:col-span-2 xl:col-span-1`}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-300"><Wallet className="h-4 w-4" /> {tr('الحساب', 'Payment')}</h3>
          {row(tr('سعر القاعة', 'Hall price'), egp(booking.basePrice))}
          {row(tr('الخدمات', 'Services'), egp(booking.services.reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0)))}
          {totals.percent > 0 && row(<span className="inline-flex items-center gap-1">{tr('الخصم', 'Discount')} <Lock className="h-3 w-3 text-slate-500" /></span>, `${totals.percent}% (−${egp(totals.discount)})`)}
          {row(tr('الإجمالي', 'Total'), <span className="text-amber-200">{egp(totals.total)}</span>)}
          {!hidePayments && <>
          {row(tr('العربون', 'Deposit'), egp(booking.deposit))}
          {row(tr('المدفوع', 'Paid'), <span className="text-emerald-300">{egp(booking.paidAmount)}</span>)}
          {row(tr('المتبقي', 'Remaining'), <span className="text-rose-300">{egp(booking.remainingAmount)}</span>)}
          {row(tr('التأمين', 'Security deposit'), booking.securityDeposit ? `${egp(booking.securityDeposit)} · ${({ held: tr('محتجز', 'Held'), refunded: tr('تم الرد', 'Refunded'), deducted: tr('مخصوم', 'Deducted') } as Record<string, string>)[booking.securityDepositStatus] || ''}` : '')}
          </>}
        </section>
      </div>

      {booking.notes && <div className={`${card} text-sm text-slate-300`}><span className="font-bold text-amber-300">{tr('ملاحظات الحجز: ', 'Booking notes: ')}</span>{booking.notes}</div>}

      {/* 3D model: Pro when 3D Studio Pro is activated on this device, Basic otherwise. */}
      <section className={card}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-300"><Box className="h-4 w-4" /> {tr('نموذج القاعة ثلاثي الأبعاد', '3D model of the hall')}{pro3D ? <span className="rounded-full bg-gradient-to-r from-[#E9CF94] via-[#C49A52] to-[#8C6A2E] px-2 py-0.5 text-[10px] font-black tracking-widest text-[#0D0D0F]">PRO</span> : <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-black tracking-widest text-slate-300">BASIC</span>}</h3>
          <span className="text-[11px] text-slate-400">{hallName} · {scene.dims.widthM}×{scene.dims.depthM} {tr('م', 'm')} · {booking.guestCount} {tr('فرد', 'guests')}</span>
        </div>
        <div className="h-[340px] overflow-hidden rounded-2xl border border-slate-800 sm:h-[min(420px,62vh)] sm:min-h-[320px]">
          <EventLayout3D items={scene.items} width={scene.dims.widthM} depth={scene.dims.depthM} language={language} hall={scene.dims} decor={pro3D ? scene.decor : undefined} initialMood={scene.mood} tier={pro3D ? 'pro' : 'basic'} mode="overview" readOnly />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">{scene.own ? tr('تصميم 3D الخاص بهذا الحجز.', 'This booking’s own 3D design.') : tr('يبدأ من التصميم الافتراضي للقاعة لهذا النوع من المناسبات.', 'Starts from the hall’s default for this event type.')}</p>
          <button type="button" onClick={() => setOpen3D(true)} className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-200"><Box className="h-3.5 w-3.5" />{onSaveBooking3D ? tr('تعديل 3D', 'Edit 3D') : tr('فتح 3D', 'Open 3D')}</button>
        </div>
        {open3D && <Booking3DEditor booking={booking} bookings={bookings.length ? bookings : [booking]} halls={halls} language={language} canEdit={!!onSaveBooking3D} onSave={(id, design) => onSaveBooking3D?.(id, design)} onClose={() => setOpen3D(false)} />}
      </section>

      {/* Picked services */}
      <section className={card}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {tr(`الخدمات المختارة (${booking.services.length})`, `Services picked (${booking.services.length})`)}</h3>
        {booking.services.length === 0 ? <p className="text-xs text-slate-500">{tr('لم يتم اختيار خدمات بعد.', 'No services picked yet.')}</p> : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {booking.services.map((line) => {
              const srv = services.find((s) => s.id === line.serviceId);
              return (
                <div key={line.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-950">{srv?.photoUrl ? <img src={srv.photoUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-600"><ImageOff className="h-4 w-4" /></div>}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-white">{line.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">{line.quantity} × {egp(line.unitPrice)}</div>
                  </div>
                  <div className="shrink-0 font-mono text-xs font-bold text-emerald-300">{egp(line.totalPrice)}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Services not picked — for reference */}
      <section className="rounded-3xl border-2 border-dashed border-amber-400/50 bg-amber-400/[0.04] p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-black text-amber-200"><CircleDashed className="h-5 w-5" /> {tr(`خدمات لم يتم اختيارها (${notPicked.length})`, `Services not picked (${notPicked.length})`)}</h3>
          <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-bold text-amber-200">{tr('للعرض فقط', 'For reference')} · {priceLocationName(place, isAr)}</span>
        </div>
        <p className="mb-4 text-xs text-slate-400">{tr('خدمات إضافية متاحة يمكن اقتراحها على العميل. الإضافة للحجز تتم من شاشة الحجوزات بواسطة الإدارة.', 'Extra services you can suggest to the client. Admin users add them to the booking on the Bookings screen.')}</p>
        {notPicked.length === 0 ? <p className="text-xs text-slate-500">{tr('كل الخدمات مختارة.', 'Every service is already picked.')}</p> : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
            {notPicked.map((srv) => (
              <div key={srv.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/90">
                <div className="relative h-28 bg-slate-950">
                  {srv.photoUrl ? <img src={srv.photoUrl} alt={srv.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-1 text-[10px] text-slate-500"><ImageOff className="h-5 w-5" />{tr('لا توجد صورة', 'No photo yet')}</div>}
                  <span className="absolute top-2 rounded-full bg-slate-950/85 px-2 py-0.5 text-[10px] font-bold text-amber-200 start-2">{tr('غير مختارة', 'Not picked')}</span>
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 min-h-[2.5rem] text-xs font-bold leading-5 text-white">{srv.name}</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-200">{egp(servicePriceAt(priceBook, place, srv).price)}</span>
                    <span className="text-[10px] text-slate-500">{tr('لكل', 'per')} {srv.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><ClipboardList className="h-3.5 w-3.5" /> {tr('هذه الشاشة للعرض. تعديل الحجز والخصم من شاشة الحجوزات حسب صلاحيات الرئيس التنفيذي.', 'This screen is view only. Booking changes and discounts are made on the Bookings screen, following the CEO’s edit permissions.')}</p>
    </div>
  );
}
