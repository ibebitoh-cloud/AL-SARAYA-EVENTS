import { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  X,
  Pencil,
  FileText,
  ShieldCheck,
  Clock,
  MapPin,
  Users,
  Phone,
} from 'lucide-react';
import type { Booking, BookingStatus, Hall, Language, PriceBook, ServiceDefinition } from '../types/venueSystem';
import { makeTr, eventTypeLabel, bookingStatusLabel } from '../utils/tr';
import { bookingSlot, conflictsForBooking } from '../utils/bookingRules';
import { CALENDAR_CATEGORIES, type CalendarCategory, addDays, calendarCategory, categoryStyle, dayKey, startOfWeek, venueKey } from '../data/bookingCalendar';
import { EVENT_TYPES, eventDetailsSummary, eventTypeConfig } from '../data/eventTypes';
import { ConflictWarning, makeConflictOverride, overrideReasonOk } from './ConflictWarning';
import { BookingEditModal } from './BookingEditModal';
import { sound } from '../utils/soundEffects';

interface CalendarAgendaViewProps {
  bookings: Booking[];
  halls: Hall[];
  /** Opens the booking's invoice / full record. */
  onSelectBooking: (booking: Booking) => void;
  onOpenNewBooking?: () => void;
  language?: Language;
  /** Given only when the user may edit bookings. */
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  services?: ServiceDefinition[];
  priceBook?: PriceBook;
  canDiscount?: boolean;
  canOverrideConflict?: boolean;
  currentUser?: { id: string; name: string } | null;
  /** Selling-prices-only staff: no balances or payment strip. */
  hideFinancials?: boolean;
}

type View = 'month' | 'week';

const HOUR_PX = 44;
const STATUS_ACTIONS: BookingStatus[] = ['tentative', 'confirmed', 'completed', 'cancelled'];

const selectCls = 'rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none';

export function CalendarAgendaView({
  bookings,
  halls,
  onSelectBooking,
  onOpenNewBooking,
  language = 'ar',
  onEditBooking,
  onDeleteBooking,
  services = [],
  priceBook,
  canDiscount = false,
  canOverrideConflict = false,
  currentUser,
  hideFinancials = false,
}: CalendarAgendaViewProps) {
  const { isAr, tr, egp } = makeTr(language);
  const locale = isAr ? 'ar-EG' : 'en-GB';
  const today = dayKey(new Date());
  const [view, setView] = useState<View>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [hidden, setHidden] = useState<Set<CalendarCategory>>(() => new Set());
  const [editing, setEditing] = useState<Booking | null>(null);
  // A status change that would create a clash waits here for an override reason.
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const hallLabel = (h: Hall) => (isAr ? h.name : h.nameEn || h.name);
  const venueOptions = useMemo(() => {
    const list = halls.map((h) => ({ key: h.id, label: hallLabel(h) }));
    const seen = new Set(list.map((v) => v.key));
    bookings.forEach((b) => { const k = venueKey(b); if (!seen.has(k) && b.hallName.trim()) { seen.add(k); list.push({ key: k, label: b.hallName }); } });
    return list;
  }, [halls, bookings, isAr]); // eslint-disable-line react-hooks/exhaustive-deps
  const venueName = (b: Booking) => { const h = halls.find((x) => x.id === b.hallId); return h ? hallLabel(h) : b.hallName; };

  const filtered = bookings.filter((b) =>
    (venueFilter === 'all' || venueKey(b) === venueFilter)
    && (typeFilter === 'all' || b.eventType === typeFilter)
    && !hidden.has(calendarCategory(b)));
  const byDay = (key: string) => filtered.filter((b) => b.date === key).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Clashes are checked against all bookings, not just the filtered ones, so a filter never hides a real double booking.
  const clashMap = useMemo(() => {
    const m = new Map<string, Booking[]>();
    bookings.forEach((b) => { const c = conflictsForBooking(bookings, b); if (c.length) m.set(b.id, c); });
    return m;
  }, [bookings]);
  const clashPairs = useMemo(() => {
    const pairs: [Booking, Booking][] = [];
    bookings.forEach((b) => (clashMap.get(b.id) || []).forEach((o) => { if (b.id < o.id) pairs.push([b, o]); }));
    return pairs.sort((a, b) => a[0].date.localeCompare(b[0].date));
  }, [bookings, clashMap]);

  const counts = CALENDAR_CATEGORIES.map((c) => ({ ...c, count: bookings.filter((b) => calendarCategory(b) === c.id).length }));
  const pendingCollection = hideFinancials ? [] : bookings.filter((b) => b.status === 'confirmed' && b.remainingAmount > 0);

  // Month grid: 6 weeks starting on the Monday on or before the 1st.
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weekStart = startOfWeek(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayNames = isAr ? ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periodLabel = view === 'month'
    ? anchor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : `${weekDays[0].toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const move = (dir: 1 | -1) => {
    sound.click(500);
    setAnchor((a) => view === 'month' ? new Date(a.getFullYear(), a.getMonth() + dir, 1) : addDays(a, 7 * dir));
  };
  const goToday = () => { setAnchor(new Date()); setSelectedDay(today); };
  const pickDay = (d: Date) => { setSelectedDay(dayKey(d)); setAnchor(d); };

  const selected = selectedId ? bookings.find((b) => b.id === selectedId) || null : null;
  const openBooking = (b: Booking) => { sound.click(650); setSelectedId(b.id); setSelectedDay(b.date); setPendingStatus(null); setOverrideReason(''); };

  // Changing status can turn a cancelled booking back into an active one, which may clash.
  const statusClashes = (b: Booking, status: BookingStatus) => conflictsForBooking(bookings, { ...b, status });
  const applyStatus = (b: Booking, status: BookingStatus) => {
    if (!onEditBooking || b.status === status) return;
    const clashes = statusClashes(b, status);
    if (clashes.length && b.status === 'cancelled') { setPendingStatus(status); setOverrideReason(''); return; }
    sound.success();
    onEditBooking({ ...b, status });
  };
  const confirmPendingStatus = (b: Booking) => {
    if (!onEditBooking || !pendingStatus) return;
    const clashes = statusClashes(b, pendingStatus);
    if (!canOverrideConflict || !overrideReasonOk(overrideReason)) return;
    onEditBooking({ ...b, status: pendingStatus, conflictOverride: makeConflictOverride(clashes, overrideReason, currentUser) });
    setPendingStatus(null); setOverrideReason('');
  };

  const typeTag = (b: Booking) => { const cfg = eventTypeConfig(b.eventType); return `${cfg.emoji} ${eventTypeLabel(b.eventType, isAr)}`; };

  const chip = (b: Booking, compact = false) => {
    const st = categoryStyle(b);
    const clash = clashMap.has(b.id);
    return (
      <button
        key={b.id}
        type="button"
        onClick={(e) => { e.stopPropagation(); openBooking(b); }}
        title={`${b.code} · ${b.clientName} · ${eventTypeLabel(b.eventType, isAr)} · ${isAr ? st.ar : st.en}`}
        className={`flex w-full items-center gap-1 truncate rounded-md border-s-4 px-1.5 py-1 text-start text-[10px] font-semibold transition ${st.chip} ${selectedId === b.id ? 'ring-2 ring-amber-300' : ''}`}
      >
        {clash && <AlertTriangle aria-label={tr('تعارض', 'Clash')} className="h-3 w-3 shrink-0 text-rose-300" />}
        <span dir="ltr" className="shrink-0 font-mono">{b.startTime}</span>
        {compact ? <span aria-label={eventTypeLabel(b.eventType, isAr)} className="shrink-0">{eventTypeConfig(b.eventType).emoji}</span> : <span className="shrink-0 opacity-90">{typeTag(b)}</span>}
        <span className="truncate opacity-80">· {b.clientName}</span>
      </button>
    );
  };

  // Week view: each day is a column on an hour grid; bookings that overlap in time sit side by side.
  const weekBookings = weekDays.map((d) => byDay(dayKey(d)));
  const allSlots = weekBookings.flat().map(bookingSlot);
  const firstHour = Math.min(9, ...allSlots.map(([s]) => Math.floor(s / 60)));
  const lastHour = Math.min(30, Math.max(24, ...allSlots.map(([, e]) => Math.ceil(e / 60))));
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);
  const layoutDay = (list: Booking[]) => {
    const lanes: number[] = [];
    const placed = list.map((b) => {
      const [s, e] = bookingSlot(b);
      let lane = lanes.findIndex((end) => end <= s);
      if (lane === -1) { lane = lanes.length; lanes.push(e); } else lanes[lane] = e;
      return { b, s, e, lane };
    });
    return { placed, laneCount: Math.max(1, lanes.length) };
  };

  return (
    <div className="w-full space-y-5 pb-20 text-start">
      {/* Title and period navigation */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-amber-300" />
          <div>
            <h2 className="text-base font-bold text-white">{tr('تقويم الحجوزات', 'Booking calendar')}</h2>
            <p className="text-xs text-slate-400">{tr('اللون يوضح حالة الحجز، والعلامة توضح نوع المناسبة', 'Colour shows the booking status; the label shows the event type')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label={tr('طريقة العرض', 'View')} className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
            {(['month', 'week'] as View[]).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} type="button" onClick={() => { sound.click(500); setView(v); if (v === 'week') setAnchor(new Date(`${selectedDay}T12:00:00`)); }} className={`rounded-lg px-3 py-1.5 font-semibold ${view === v ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                {v === 'month' ? tr('شهر', 'Month') : tr('أسبوع', 'Week')}
              </button>
            ))}
          </div>
          <button type="button" onClick={goToday} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white">{tr('اليوم', 'Today')}</button>
          <div className="flex items-center gap-1">
            <button type="button" aria-label={view === 'month' ? tr('الشهر السابق', 'Previous month') : tr('الأسبوع السابق', 'Previous week')} onClick={() => move(-1)} className="rounded-lg bg-slate-950 p-2 text-slate-300 hover:text-white"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
            <strong className="min-w-36 text-center text-sm text-white">{periodLabel}</strong>
            <button type="button" aria-label={view === 'month' ? tr('الشهر التالي', 'Next month') : tr('الأسبوع التالي', 'Next week')} onClick={() => move(1)} className="rounded-lg bg-slate-950 p-2 text-slate-300 hover:text-white"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
          </div>
          {onOpenNewBooking && <button type="button" onClick={onOpenNewBooking} className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-300"><Plus className="h-3.5 w-3.5" />{tr('حجز جديد', 'New booking')}</button>}
        </div>
      </div>

      {/* Filters: venue, event type, and the status colours (which double as the legend) */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-end">
          <label className="text-[11px] text-slate-400">{tr('القاعة / المكان', 'Venue')}
            <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className={`${selectCls} mt-1 block w-full lg:w-56`}>
              <option value="all">{tr('كل الأماكن', 'All venues')}</option>
              {venueOptions.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
            </select>
          </label>
          <label className="text-[11px] text-slate-400">{tr('نوع المناسبة', 'Event type')}
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${selectCls} mt-1 block w-full lg:w-56`}>
              <option value="all">{tr('كل الأنواع', 'All types')}</option>
              {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.emoji} {eventTypeLabel(t.id, isAr)}</option>)}
            </select>
          </label>
          {(venueFilter !== 'all' || typeFilter !== 'all' || hidden.size > 0) && (
            <button type="button" onClick={() => { setVenueFilter('all'); setTypeFilter('all'); setHidden(new Set()); }} className="self-end rounded-xl px-3 py-2 text-xs text-slate-400 underline-offset-2 hover:text-white hover:underline">{tr('إزالة الفلاتر', 'Clear filters')}</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2" aria-label={tr('الحالات', 'Statuses')}>
          {counts.map((c) => {
            const on = !hidden.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                title={isAr ? c.hintAr : c.hintEn}
                onClick={() => setHidden((prev) => { const next = new Set(prev); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next; })}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-800 bg-transparent text-slate-500 line-through'}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${c.dot} ${on ? '' : 'opacity-40'}`} />
                {isAr ? c.ar : c.en}
                <span className="font-mono text-[10px] text-slate-400">{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Double bookings that already exist */}
      {clashPairs.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs text-rose-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div className="space-y-1">
            <strong className="block text-sm font-bold text-rose-300">{tr(`حجوزات متعارضة (${clashPairs.length})`, `Double bookings (${clashPairs.length})`)}</strong>
            {clashPairs.map(([a, b]) => {
              const override = a.conflictOverride || b.conflictOverride;
              return (
                <button key={`${a.id}-${b.id}`} type="button" onClick={() => openBooking(a)} className="block text-start hover:underline">
                  <span dir="ltr" className="font-mono">{a.date}</span> · {venueName(a)} · {a.clientName} (<span dir="ltr">{a.startTime}–{a.endTime}</span>) ↔ {b.clientName} (<span dir="ltr">{b.startTime}–{b.endTime}</span>)
                  {override && <span className="ms-1 text-amber-200">· {tr('تم التجاوز', 'overridden')}: {override.reason}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {pendingCollection.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-600/40 bg-amber-950/30 p-3 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-amber-300"><AlertCircle className="h-4 w-4 text-amber-400" />{tr(`حجوزات مؤكدة عليها مبالغ متبقية (${pendingCollection.length})`, `Confirmed bookings with a balance due (${pendingCollection.length})`)}</span>
          <span className="font-mono text-amber-400">{tr('إجمالي المتبقي', 'Total outstanding')}: {egp(pendingCollection.reduce((acc, b) => acc + b.remainingAmount, 0))}</span>
        </div>
      )}

      <div className={`grid gap-5 ${view === 'month' ? 'xl:grid-cols-[minmax(0,1fr)_20rem]' : ''}`}>
        <div className="min-w-0 space-y-4">
          {view === 'month' ? (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="grid grid-cols-7 border-b border-slate-800">
                {dayNames.map((d) => <div key={d} className="p-2 text-center text-[10px] font-bold text-slate-400 sm:text-xs">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((d) => {
                  const key = dayKey(d);
                  const events = byDay(key);
                  const inMonth = d.getMonth() === anchor.getMonth();
                  return (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      aria-label={`${d.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}: ${events.length}`}
                      onClick={() => pickDay(d)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickDay(d); } }}
                      className={`min-h-16 cursor-pointer border-b border-e border-slate-800 p-1 sm:min-h-28 sm:p-1.5 ${inMonth ? '' : 'bg-slate-950/50'} ${selectedDay === key ? 'bg-amber-400/5 ring-1 ring-inset ring-amber-300' : 'hover:bg-slate-800/40'}`}
                    >
                      <span className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${key === today ? 'bg-amber-400 font-black text-slate-950' : inMonth ? 'text-slate-200' : 'text-slate-600'}`}>{d.getDate()}</span>
                      {/* Phones: coloured dots only; the day's list opens below the calendar. */}
                      <div className="flex flex-wrap gap-0.5 sm:hidden">
                        {events.slice(0, 6).map((b) => <span key={b.id} className={`h-2 w-2 rounded-full ${categoryStyle(b).dot}`} />)}
                      </div>
                      <div className="hidden space-y-1 sm:block">
                        {events.slice(0, 3).map((b) => chip(b, true))}
                        {events.length > 3 && <span className="block text-[10px] text-slate-400">+{events.length - 3} {tr('أخرى', 'more')}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60" data-no-screen-swipe>
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] border-b border-slate-800">
                  <span />
                  {weekDays.map((d, i) => {
                    const key = dayKey(d);
                    return (
                      <button key={key} type="button" onClick={() => setSelectedDay(key)} className={`p-2 text-center text-xs ${selectedDay === key ? 'text-amber-300' : 'text-slate-400'}`}>
                        <span className="block font-bold">{dayNames[i]}</span>
                        <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${key === today ? 'bg-amber-400 font-black text-slate-950' : 'text-slate-200'}`}>{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))]">
                  <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                    {hours.map((h, i) => <span key={h} dir="ltr" className="absolute inset-x-0 -translate-y-1/2 text-center font-mono text-[10px] text-slate-500" style={{ top: i * HOUR_PX }}>{i === 0 ? '' : `${String(h % 24).padStart(2, '0')}:00`}</span>)}
                  </div>
                  {weekDays.map((d, i) => {
                    const { placed, laneCount } = layoutDay(weekBookings[i]);
                    const key = dayKey(d);
                    return (
                      <div key={key} onClick={() => setSelectedDay(key)} className={`relative border-s border-slate-800 ${selectedDay === key ? 'bg-amber-400/5' : ''}`} style={{ height: hours.length * HOUR_PX }}>
                        {hours.map((h, j) => <div key={h} className="absolute inset-x-0 border-t border-slate-800/70" style={{ top: j * HOUR_PX }} />)}
                        {placed.map(({ b, s, e, lane }) => {
                          const st = categoryStyle(b);
                          const top = (s / 60 - firstHour) * HOUR_PX;
                          const height = Math.max(22, ((Math.min(e, lastHour * 60) - s) / 60) * HOUR_PX - 2);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={(ev) => { ev.stopPropagation(); openBooking(b); }}
                              title={`${b.code} · ${b.clientName} · ${isAr ? st.ar : st.en}`}
                              className={`absolute overflow-hidden rounded-md border-s-4 p-1 text-start text-[10px] leading-tight ${st.chip} ${clashMap.has(b.id) ? 'outline outline-2 outline-rose-400' : ''} ${selectedId === b.id ? 'ring-2 ring-amber-300' : ''}`}
                              style={{ top, height, insetInlineStart: `calc(${(lane / laneCount) * 100}% + 2px)`, width: `calc(${100 / laneCount}% - 4px)` }}
                            >
                              <span dir="ltr" className="block font-mono font-bold">{b.startTime}–{b.endTime}</span>
                              <span className="block truncate font-semibold">{typeTag(b)}</span>
                              <span className="block truncate opacity-80">{b.clientName}</span>
                              <span className="block truncate opacity-70">{venueName(b)}</span>
                              {clashMap.has(b.id) && laneCount < 3 && <span className="mt-0.5 flex items-center gap-0.5 font-bold text-rose-200"><AlertTriangle className="h-3 w-3" />{tr('تعارض', 'Clash')}</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* The chosen day's bookings as a list (the main view on phones) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <h3 className="mb-2 text-sm font-bold text-white">{new Date(`${selectedDay}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            {byDay(selectedDay).length === 0
              ? <p className="text-xs text-slate-500">{tr('لا توجد حجوزات في هذا اليوم.', 'No bookings on this day.')}</p>
              : <div className="space-y-1.5">{byDay(selectedDay).map((b) => {
                  const st = categoryStyle(b);
                  return (
                    <button key={b.id} type="button" onClick={() => openBooking(b)} className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-s-4 px-3 py-2 text-start text-xs ${st.chip} ${selectedId === b.id ? 'ring-2 ring-amber-300' : ''}`}>
                      <span dir="ltr" className="font-mono font-bold">{b.startTime}–{b.endTime}</span>
                      <span className="font-semibold">{typeTag(b)}</span>
                      <span>{b.clientName}</span>
                      <span className="opacity-75">{venueName(b)}</span>
                      <span className={`ms-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${st.badge}`}>{isAr ? st.ar : st.en}</span>
                      {clashMap.has(b.id) && <AlertTriangle aria-label={tr('تعارض', 'Clash')} className="h-3.5 w-3.5 text-rose-300" />}
                    </button>
                  );
                })}</div>}
          </div>
        </div>

        {/* Booking details and actions */}
        <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900/80 p-4 xl:sticky xl:top-24">
          {!selected ? (
            <p className="py-6 text-center text-xs text-slate-500">{tr('اختر حجزاً من التقويم لعرض تفاصيله.', 'Pick a booking on the calendar to see its details.')}</p>
          ) : (() => {
            const st = categoryStyle(selected);
            const clashes = clashMap.get(selected.id) || [];
            const summary = eventDetailsSummary(selected.eventType, selected.eventDetails, isAr);
            return (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.badge}`}>{isAr ? st.ar : st.en}</span>
                    <h3 className="mt-2 text-base font-black text-white">{selected.clientName}</h3>
                    <p className="font-mono text-[11px] text-slate-500">{selected.code}</p>
                  </div>
                  <button type="button" aria-label={tr('إغلاق', 'Close')} onClick={() => setSelectedId(null)} className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </div>
                <p className="text-sm font-semibold text-white">{typeTag(selected)}</p>
                {summary && <p className="text-slate-400">{summary}</p>}
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5 text-slate-500" /><span dir="ltr" className="font-mono">{selected.date}</span></li>
                  <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-500" /><span dir="ltr" className="font-mono">{selected.startTime}–{selected.endTime}</span></li>
                  <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-500" />{venueName(selected)}</li>
                  <li className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-slate-500" />{selected.guestCount} {tr('ضيف', 'guests')}</li>
                  {selected.clientPhone && <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-500" /><a dir="ltr" href={`tel:${selected.clientPhone}`} className="font-mono hover:text-white">{selected.clientPhone}</a></li>}
                  <li className="text-slate-500">{tr('الحالة المحفوظة', 'Saved status')}: {bookingStatusLabel(selected.status, isAr)}{selected.source?.startsWith('website') ? ` · ${tr('طلب من الموقع', 'website request')}` : ''}</li>
                  {selected.source !== 'website_quick' && <li>{tr('الإجمالي', 'Total')}: <span className="font-mono text-white">{egp(selected.totalPrice)}</span></li>}
                </ul>

                {clashes.length > 0 && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-2.5 text-rose-200">
                    <strong className="flex items-center gap-1.5 text-rose-300"><AlertTriangle className="h-3.5 w-3.5" />{tr('يتعارض مع', 'Clashes with')}</strong>
                    {clashes.map((c) => <button key={c.id} type="button" onClick={() => openBooking(c)} className="block text-start hover:underline"><span className="font-mono">{c.code}</span> · {c.clientName} · <span dir="ltr">{c.startTime}–{c.endTime}</span></button>)}
                  </div>
                )}
                {selected.conflictOverride && (
                  <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-2.5 text-amber-100">
                    <strong className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />{tr('تم الحفظ رغم التعارض', 'Saved over a clash')}</strong>
                    <span className="block">{tr('السبب', 'Reason')}: {selected.conflictOverride.reason}</span>
                    <span className="block text-amber-200/70">{selected.conflictOverride.byName} · {new Date(selected.conflictOverride.at).toLocaleString(locale)} · {selected.conflictOverride.conflictWithCode}</span>
                  </div>
                )}

                {onEditBooking && (
                  <div>
                    <p className="mb-1.5 text-[11px] text-slate-500">{tr('تغيير الحالة', 'Change status')}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STATUS_ACTIONS.map((s) => {
                        const look = categoryStyle({ status: s, source: selected.source });
                        const current = selected.status === s;
                        return (
                          <button key={s} type="button" disabled={current} onClick={() => applyStatus(selected, s)} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold ${current ? 'border-amber-300 bg-slate-800 text-white' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white'}`}>
                            <span className={`h-2 w-2 rounded-full ${look.dot}`} />{bookingStatusLabel(s, isAr)}
                          </button>
                        );
                      })}
                    </div>
                    {pendingStatus && (
                      <div className="mt-2 space-y-2">
                        <ConflictWarning conflicts={statusClashes(selected, pendingStatus)} canOverride={canOverrideConflict} reason={overrideReason} onReasonChange={setOverrideReason} language={language} halls={halls} />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setPendingStatus(null); setOverrideReason(''); }} className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-bold text-white">{tr('إلغاء', 'Cancel')}</button>
                          {canOverrideConflict && <button type="button" disabled={!overrideReasonOk(overrideReason)} onClick={() => confirmPendingStatus(selected)} className="flex-1 rounded-lg bg-rose-500 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40">{tr('حفظ رغم التعارض', 'Save anyway')}</button>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => onSelectBooking(selected)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[11px] font-bold text-slate-200 hover:text-white"><FileText className="h-3.5 w-3.5" />{tr('فتح الحجز', 'Open booking')}</button>
                  {onEditBooking && <button type="button" onClick={() => setEditing(selected)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-[11px] font-black text-slate-950 hover:bg-amber-300"><Pencil className="h-3.5 w-3.5" />{tr('تعديل', 'Edit')}</button>}
                </div>
              </div>
            );
          })()}
        </aside>
      </div>

      {editing && onEditBooking && (
        <BookingEditModal
          booking={editing}
          bookings={bookings}
          halls={halls}
          services={services}
          priceBook={priceBook}
          canDiscount={canDiscount}
          canOverrideConflict={canOverrideConflict}
          currentUser={currentUser}
          language={language}
          onClose={() => setEditing(null)}
          onSave={(b) => { onEditBooking(b); setEditing(null); }}
          onDelete={onDeleteBooking ? () => { onDeleteBooking(editing.id); setEditing(null); setSelectedId(null); } : undefined}
        />
      )}
    </div>
  );
}
