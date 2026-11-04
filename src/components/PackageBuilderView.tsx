import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarCheck2, CalendarDays, ClipboardList, Clock, MapPin, Minus, Pencil, Play, Plus, Search, Sparkles, Trash2, Users } from 'lucide-react';
import { Booking, EventType, Hall, Language, LocationId, PriceBook, ServiceDefinition } from '../types/venueSystem';
import { eventTypeLabel, makeTr } from '../utils/tr';
import { EVENT_TYPES, eventDetailsSummary, eventTypeConfig } from '../data/eventTypes';
import { LOCATIONS, hallLocation, locationName } from '../data/locations';
import { PreparedOperation, loadPreparedOperations, savePreparedOperations } from '../data/preparedOperations';
import { ChoiceSessionView } from './ChoiceSessionView';
import { BookingPlannerView } from './BookingPlannerView';
import { bookingStatusLabel } from '../utils/tr';
import { sound } from '../utils/soundEffects';
import { findBookingConflict } from '../utils/bookingRules';

interface Props {
  language?: Language;
  halls: Hall[];
  services: ServiceDefinition[];
  priceBook: PriceBook;
  existingBookings: Booking[];
  onCreateBooking: (booking: Booking) => void;
  /** Selling-prices-only users: no payments or deposits in the booking view. */
  sellingPricesOnly?: boolean;
}

const card = 'rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6';
const input = 'w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400';

const blankOperation = (halls: Hall[]): PreparedOperation => {
  const cfg = eventTypeConfig('wedding');
  const hall = halls.find((h) => hallLocation(h) === 'arcane');
  return {
    id: `op-${Date.now()}`, createdAt: new Date().toISOString(), eventType: 'wedding', locationId: 'arcane', hallId: hall?.id || '',
    guests: hall?.capacity ? Math.min(cfg.defaultGuests, hall.capacity) : cfg.defaultGuests, date: '',
    startTime: cfg.defaultStart, endTime: cfg.defaultEnd, clientName: '', clientPhone: '', details: {}, budget: 0, notes: '',
    packageId: '', selections: {},
  };
};

/**
 * Event Planner. The team prepares each operation before the meeting (client, type, hall, date, guests);
 * in the meeting the customer only chooses in the choice session. Selling prices only.
 */
export function PackageBuilderView({ language = 'ar', halls, services, priceBook, existingBookings, onCreateBooking, sellingPricesOnly = false }: Props) {
  const { isAr, tr } = makeTr(language);
  const [ops, setOps] = useState<PreparedOperation[]>(loadPreparedOperations);
  const [filter, setFilter] = useState<'all' | 'ready' | 'session' | 'booked'>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<PreparedOperation | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  /** The planner starts by choosing an existing booking; prepared (not yet booked) events are the second tab. */
  const [tab, setTab] = useState<'bookings' | 'prepared'>('bookings');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingQuery, setBookingQuery] = useState('');

  useEffect(() => savePreparedOperations(ops), [ops]);

  const upsert = (op: PreparedOperation) => setOps((prev) => prev.some((o) => o.id === op.id) ? prev.map((o) => o.id === op.id ? op : o) : [op, ...prev]);
  const session = ops.find((o) => o.id === sessionId);

  if (session) {
    return <ChoiceSessionView op={session} hall={halls.find((h) => h.id === session.hallId)} priceBook={priceBook} existingBookings={existingBookings}
      onChange={upsert} onBack={() => setSessionId(null)} onCreateBooking={onCreateBooking} />;
  }

  const plannedBooking = existingBookings.find((b) => b.id === bookingId);
  if (plannedBooking) {
    return <BookingPlannerView booking={plannedBooking} halls={halls} services={services} priceBook={priceBook} language={language} onBack={() => setBookingId(null)} hidePayments={sellingPricesOnly} />;
  }

  if (draft) {
    return <OperationForm language={language} draft={draft} halls={halls} existingBookings={existingBookings}
      onCancel={() => setDraft(null)} onSave={(op) => { sound.success(); upsert(op); setDraft(null); }} />;
  }

  const todayIso = new Date().toISOString().split('T')[0];
  const stage = (op: PreparedOperation) => op.bookingCode ? 'booked' : (Object.keys(op.selections).length || op.packageId) ? 'session' : 'ready';
  const counts = { all: ops.length, ready: ops.filter((o) => stage(o) === 'ready').length, session: ops.filter((o) => stage(o) === 'session').length, booked: ops.filter((o) => stage(o) === 'booked').length };
  const q = query.trim().toLowerCase();
  const visible = ops
    .filter((o) => filter === 'all' || stage(o) === filter)
    .filter((o) => !q || o.clientName.toLowerCase().includes(q) || o.clientPhone.includes(q))
    // Soonest event first; operations without a date at the end.
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const upcoming = existingBookings
    .filter((b) => b.date >= todayIso && b.status !== 'cancelled' && b.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
  const daysUntil = (date: string) => Math.round((new Date(date).getTime() - new Date(todayIso).getTime()) / 86400000);
  const filterLabels: Record<typeof filter, string> = { all: tr('الكل', 'All'), ready: tr('جاهزة للجلسة', 'Ready'), session: tr('جلسة جارية', 'In session'), booked: tr('تم الحجز', 'Booked') };

  return (
    <div className="w-full pb-20 text-start space-y-5">
      <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-white"><Sparkles className="h-5 w-5 text-amber-400" /> {tr('تصميم الحفلة مع العميل', 'Event Planner')}</h2>
          <p className="mt-1 text-xs text-slate-400">{tr('اختر المناسبة أولاً لعرض الحجز كاملاً ونموذج القاعة والخدمات غير المختارة. أو جهّز عملية جديدة قبل المقابلة.', 'Choose the event first to see the full booking, the hall model and the services not picked. Or prepare a new event before the meeting.')}</p>
        </div>
        <button type="button" onClick={() => { sound.click(650); setDraft(blankOperation(halls)); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300"><Plus className="h-4 w-4" /> {tr('تجهيز عملية جديدة', 'Prepare a new event')}</button>
      </div>

      <div className="flex gap-2" role="tablist" data-no-screen-swipe>
        {([['bookings', tr('1. اختر المناسبة', '1. Choose the event'), CalendarCheck2], ['prepared', tr('عمليات قبل الحجز', 'Prepared before booking'), ClipboardList]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition ${tab === id ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-slate-700 text-slate-300 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>
        ))}
      </div>

      {tab === 'bookings' && (() => {
        const bq = bookingQuery.trim().toLowerCase();
        // Only upcoming events are listed; past or completed ones show up only when searched for.
        const list = existingBookings
          .filter((b) => b.status !== 'cancelled')
          .filter((b) => bq ? (b.clientName.toLowerCase().includes(bq) || b.clientPhone.includes(bq) || b.code.toLowerCase().includes(bq)) : (b.date >= todayIso && b.status !== 'completed'))
          .sort((a, b) => { const fa = a.date >= todayIso, fb = b.date >= todayIso; if (fa !== fb) return fa ? -1 : 1; return fa ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date); });
        return (
          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">{tr('المناسبات القادمة فقط. للمناسبات السابقة ابحث بالاسم أو الهاتف أو الكود.', 'Upcoming events only. To find a past event, search by name, phone or code.')}</p>
              <div className="relative">
                <Search className="absolute top-2.5 h-3.5 w-3.5 text-slate-500 start-2.5" />
                <input value={bookingQuery} onChange={(e) => setBookingQuery(e.target.value)} placeholder={tr('بحث بالاسم أو الهاتف أو الكود', 'Search name, phone or code')} className="w-full rounded-full border border-slate-700 bg-slate-950 py-2 text-xs text-white ps-8 pe-3 focus:border-amber-400 focus:outline-none sm:w-64" />
              </div>
            </div>
            {list.length === 0 ? (
              <div className={`${card} py-12 text-center`}>
                <CalendarCheck2 className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-300">{bq ? tr('لا توجد نتائج', 'No matches') : tr('لا توجد مناسبات قادمة', 'No upcoming events')}</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map((b) => {
                  const cfgB = eventTypeConfig(b.eventType);
                  const h = halls.find((x) => x.id === b.hallId);
                  const d = daysUntil(b.date);
                  return (
                    <button key={b.id} type="button" onClick={() => { sound.click(700); setBookingId(b.id); window.scrollTo({ top: 0 }); }} className={`${card} flex flex-col gap-3 text-start transition hover:border-amber-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400`}>
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-base font-black text-white">{cfgB.emoji} {b.clientName}</div>
                          <div className="mt-0.5 text-[11px] text-slate-400"><span className="font-mono">{b.code}</span> · {eventTypeLabel(b.eventType, isAr)}</div>
                        </div>
                        <span className="shrink-0 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300">{bookingStatusLabel(b.status, isAr)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                        <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><CalendarDays className="h-3 w-3" /><span className="font-mono">{b.date}</span>{d >= 0 && <span className="text-amber-300">· {d === 0 ? tr('اليوم', 'Today') : tr(`بعد ${d} يوم`, `in ${d} days`)}</span>}</span>
                        <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><MapPin className="h-3 w-3" />{h ? (isAr ? h.name : h.nameEn || h.name) : b.hallName}</span>
                        <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><Users className="h-3 w-3" />{b.guestCount}</span>
                      </div>
                      <span className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950"><Play className="h-3.5 w-3.5" />{tr('افتح المناسبة', 'Open event')}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {tab === 'prepared' && <>
      {/* Coming up: confirmed and tentative bookings, so the team sees which dates are taken. */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300"><CalendarCheck2 className="h-4 w-4" /> {tr('المناسبات القادمة', 'Coming up')}</h3>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1" data-no-screen-swipe>
            {upcoming.map((b) => {
              const d = daysUntil(b.date);
              return (
                <div key={b.id} className="min-w-[210px] shrink-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-white">{b.date}</span>
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">{d === 0 ? tr('اليوم', 'Today') : tr(`بعد ${d} يوم`, `in ${d} days`)}</span>
                  </div>
                  <div className="mt-2 truncate text-sm font-bold text-slate-100">{b.clientName}</div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-400">{eventTypeLabel(b.eventType, isAr)} · {(() => { const h = halls.find((x) => x.id === b.hallId); return h && !isAr ? h.nameEn || h.name : b.hallName; })()}</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" /><span className="font-mono" dir="ltr">{b.startTime} – {b.endTime}</span>{b.status === 'tentative' && <span className="ms-auto text-amber-300">{tr('مبدئي', 'Tentative')}</span>}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-300"><ClipboardList className="h-4 w-4" /> {tr('العمليات الجاهزة', 'Prepared events')}</h3>
          <div className="flex flex-wrap items-center gap-2" data-no-screen-swipe>
            {(Object.keys(filterLabels) as (typeof filter)[]).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${filter === f ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-slate-700 text-slate-300 hover:text-white'}`}>{filterLabels[f]} <span className="font-mono opacity-70">{counts[f]}</span></button>
            ))}
            <div className="relative">
              <Search className="absolute top-2 h-3.5 w-3.5 text-slate-500 start-2.5" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr('بحث بالاسم أو الهاتف', 'Search name or phone')} className="w-44 rounded-full border border-slate-700 bg-slate-950 py-1.5 text-[11px] text-white ps-8 pe-3 focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
        </div>
        {visible.length === 0 ? (
          <div className={`${card} py-12 text-center`}>
            <ClipboardList className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-300">{ops.length ? tr('لا توجد عمليات هنا', 'Nothing here') : tr('لا توجد عمليات جاهزة بعد', 'No prepared events yet')}</p>
            <p className="mt-1 text-xs text-slate-500">{tr('جهّز العملية قبل موعد المقابلة: بيانات العميل، نوع المناسبة، القاعة والتاريخ.', 'Prepare it before the meeting: client, event type, hall and date.')}</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((op) => {
              const cfg = eventTypeConfig(op.eventType);
              const hall = halls.find((h) => h.id === op.hallId);
              const choices = Object.keys(op.selections).length + (op.packageId ? 1 : 0);
              const past = op.date && op.date < todayIso && !op.bookingCode;
              const status = op.bookingCode ? { label: `${tr('تم الحجز', 'Booked')} ${op.bookingCode}`, cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' }
                : past ? { label: tr('فات موعدها', 'Date passed'), cls: 'border-rose-500/40 bg-rose-500/10 text-rose-300' }
                : choices ? { label: tr(`جلسة جارية · ${choices} اختيار`, `In session · ${choices} picked`), cls: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' }
                : { label: tr('جاهزة للجلسة', 'Ready for session'), cls: 'border-amber-400/40 bg-amber-400/10 text-amber-200' };
              const summary = eventDetailsSummary(op.eventType, op.details, isAr);
              return (
                <article key={op.id} className={`${card} flex flex-col gap-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-black text-white">{cfg.emoji} {op.clientName}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{isAr ? cfg.ar : cfg.en}{summary ? ` · ${summary}` : ''}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.cls}`}>{status.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><CalendarDays className="h-3 w-3" /><span className="font-mono">{op.date || '—'}</span></span>
                    <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><MapPin className="h-3 w-3" />{hall ? (isAr ? hall.name : hall.nameEn || hall.name) : '—'}</span>
                    <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><Users className="h-3 w-3" />{op.guests}</span>
                  </div>
                  {op.notes && <p className="line-clamp-2 text-[11px] text-slate-500">{op.notes}</p>}
                  <div className="mt-auto flex gap-2 pt-1">
                    <button type="button" onClick={() => { sound.click(700); setSessionId(op.id); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-300"><Play className="h-3.5 w-3.5" />{choices ? tr('استكمال الجلسة', 'Continue session') : tr('ابدأ الجلسة مع العميل', 'Start session')}</button>
                    <button type="button" aria-label={tr('تعديل', 'Edit')} onClick={() => setDraft(op)} className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:text-white"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label={tr('حذف', 'Delete')} onClick={() => { if (window.confirm(tr(`حذف عملية ${op.clientName}؟`, `Delete ${op.clientName}?`))) setOps((prev) => prev.filter((o) => o.id !== op.id)); }} className="rounded-xl border border-red-900/60 p-2 text-red-300 hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      </>}
    </div>
  );
}

interface FormProps {
  language: Language;
  draft: PreparedOperation;
  halls: Hall[];
  existingBookings: Booking[];
  onCancel: () => void;
  onSave: (op: PreparedOperation) => void;
}

/** Staff-only preparation form, filled before the customer meeting. */
function OperationForm({ language, draft, halls, existingBookings, onCancel, onSave }: FormProps) {
  const { isAr, tr } = makeTr(language);
  const [op, setOp] = useState(draft);
  const set = (patch: Partial<PreparedOperation>) => setOp((prev) => ({ ...prev, ...patch }));
  const cfg = eventTypeConfig(op.eventType);
  const locHalls = halls.filter((h) => hallLocation(h) === op.locationId);
  const hall = halls.find((h) => h.id === op.hallId);

  const pickType = (t: EventType) => {
    const next = eventTypeConfig(t);
    set({ eventType: t, details: {}, startTime: next.defaultStart, endTime: next.defaultEnd, packageId: '', selections: {},
      guests: hall?.capacity ? Math.min(next.defaultGuests, hall.capacity) : next.defaultGuests });
  };
  const pickLocation = (l: LocationId) => set({ locationId: l, hallId: halls.find((h) => hallLocation(h) === l)?.id || '' });

  const missing = [
    !op.clientName.trim() && tr('اسم العميل', 'Client name'),
    !op.clientPhone.trim() && tr('رقم الهاتف', 'Phone'),
    !op.hallId && tr('القاعة', 'Hall'),
    !op.date && tr('التاريخ', 'Date'),
    ...cfg.fields.filter((f) => f.required && !op.details[f.key]?.trim()).map((f) => isAr ? f.labelAr : f.labelEn),
  ].filter(Boolean) as string[];
  const overCapacity = hall && hall.capacity > 0 && op.guests > hall.capacity;
  const conflict = hall ? findBookingConflict(existingBookings, { hallId: hall.id, date: op.date, startTime: op.startTime, endTime: op.endTime }) : undefined;

  return (
    <div className="w-full pb-20 text-start space-y-5">
      <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="text-lg font-black text-white">{tr('تجهيز عملية قبل المقابلة', 'Prepare an event before the meeting')}</h2>
          <p className="mt-1 text-xs text-slate-400">{tr('هذه البيانات لا تظهر كنموذج أمام العميل — تُجهَّز مسبقاً، وفي الجلسة يختار العميل فقط.', 'The client never sees this form. Fill it in beforehand; in the session the client only makes choices.')}</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white">{tr('إلغاء', 'Cancel')}</button>
      </div>

      <section className={card}>
        <h3 className="mb-3 text-sm font-bold text-amber-300">{tr('1. العميل ونوع المناسبة', '1. Client and event type')}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {EVENT_TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => pickType(t.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${op.eventType === t.id ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'}`}>
              <span className="text-xl">{t.emoji}</span><span>{isAr ? t.ar : t.en}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-400">{tr('اسم العميل', 'Client name')} *<input value={op.clientName} onChange={(e) => set({ clientName: e.target.value })} className={`${input} mt-1`} /></label>
          <label className="text-xs text-slate-400">{tr('رقم الهاتف', 'Phone')} *<input type="tel" value={op.clientPhone} onChange={(e) => set({ clientPhone: e.target.value })} className={`${input} mt-1 font-mono`} /></label>
          {cfg.fields.map((f) => (
            <label key={f.key} className="text-xs text-slate-400">{isAr ? f.labelAr : f.labelEn}{f.required && ' *'}
              <input type={f.type || 'text'} placeholder={isAr ? f.placeholderAr || '' : ''} value={op.details[f.key] || ''} onChange={(e) => set({ details: { ...op.details, [f.key]: e.target.value } })} className={`${input} mt-1`} />
            </label>
          ))}
        </div>
      </section>

      <section className={card}>
        <h3 className="mb-3 text-sm font-bold text-amber-300">{tr('2. المكان والموعد والعدد', '2. Venue, date and guests')}</h3>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {LOCATIONS.map((l) => (
            <button key={l.id} type="button" onClick={() => pickLocation(l.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-bold transition ${op.locationId === l.id ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-slate-700 text-slate-300 hover:text-white'}`}>
              <MapPin className="h-4 w-4" /> {isAr ? l.nameAr : l.nameEn}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {locHalls.map((h) => (
            <button key={h.id} type="button" onClick={() => set({ hallId: h.id })}
              className={`rounded-2xl border p-3 text-start transition ${op.hallId === h.id ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
              <div className="text-sm font-bold text-white">{isAr ? h.name : h.nameEn || h.name}</div>
              <div className="mt-1 text-[11px] text-slate-400">{tr(`حتى ${h.capacity} فرد`, `Up to ${h.capacity} guests`)}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-xs text-slate-400">{tr('عدد المدعوين', 'Guests')}
            <div className="mt-1 flex items-center gap-2">
              <button type="button" aria-label={tr('أقل', 'Fewer')} onClick={() => set({ guests: Math.max(10, op.guests - 10) })} className="rounded-xl border border-slate-700 p-2.5 text-slate-300"><Minus className="h-4 w-4" /></button>
              <input type="number" min={1} value={op.guests} onChange={(e) => set({ guests: Math.max(1, Number(e.target.value) || 1) })} className={`${input} min-w-0 flex-1 text-center font-mono text-lg`} />
              <button type="button" aria-label={tr('أكثر', 'More')} onClick={() => set({ guests: op.guests + 10 })} className="rounded-xl border border-slate-700 p-2.5 text-slate-300"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <label className="text-xs text-slate-400">{tr('التاريخ', 'Date')} *<input type="date" value={op.date} onChange={(e) => set({ date: e.target.value })} className={`${input} mt-1 font-mono`} /></label>
          <label className="text-xs text-slate-400">{tr('من', 'From')}<input type="time" value={op.startTime} onChange={(e) => set({ startTime: e.target.value })} className={`${input} mt-1 font-mono`} /></label>
          <label className="text-xs text-slate-400">{tr('إلى', 'To')}<input type="time" value={op.endTime} onChange={(e) => set({ endTime: e.target.value })} className={`${input} mt-1 font-mono`} /></label>
        </div>
        {overCapacity && <p className="mt-2 flex items-center gap-1 text-xs text-rose-300"><AlertTriangle className="h-3.5 w-3.5" /> {tr(`العدد أكبر من سعة ${hall?.name} (${hall?.capacity} فرد)`, `More guests than ${hall?.nameEn || hall?.name} holds (${hall?.capacity})`)}</p>}
        {conflict && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-rose-300"><AlertTriangle className="h-3.5 w-3.5" /> {tr(`القاعة محجوزة في هذا الموعد (${conflict.startTime} – ${conflict.endTime}) باسم ${conflict.clientName}. اختر موعداً أو قاعة أخرى.`, `The hall is booked then (${conflict.startTime} – ${conflict.endTime}) for ${conflict.clientName}. Pick another time or hall.`)}</p>}
      </section>

      <section className={card}>
        <h3 className="mb-3 text-sm font-bold text-amber-300">{tr('3. ملاحظات للفريق قبل الجلسة', '3. Notes for the team')}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr]">
          <label className="text-xs text-slate-400">{tr('الميزانية المتوقعة (اختياري)', 'Expected budget (optional)')}<input type="number" min={0} value={op.budget || ''} onChange={(e) => set({ budget: Math.max(0, Number(e.target.value) || 0) })} placeholder={tr('ج.م', 'EGP')} className={`${input} mt-1 font-mono`} /></label>
          <label className="text-xs text-slate-400">{tr('ملاحظات (ذوق العميل، طلبات خاصة...)', 'Notes (taste, special requests...)')}<textarea rows={2} value={op.notes} onChange={(e) => set({ notes: e.target.value })} className={`${input} mt-1`} /></label>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">{tr('الميزانية تظهر في عرض السعر كتنبيه فقط إذا تم تجاوزها.', 'The budget only shows in the quote as a warning if it is exceeded.')}</p>
      </section>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-slate-500">{missing.length ? `${tr('مطلوب', 'Needed')}: ${missing.join(' · ')}` : conflict ? tr('يوجد تعارض في موعد القاعة', 'The hall is already booked then') : `${tr('جاهزة', 'Ready')} — ${locationName(op.locationId, isAr)} · ${isAr ? hall?.name : hall?.nameEn || hall?.name}`}</p>
        <button type="button" disabled={missing.length > 0 || !!conflict} onClick={() => onSave(op)} className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40">{tr('حفظ العملية', 'Save')}</button>
      </div>
    </div>
  );
}
