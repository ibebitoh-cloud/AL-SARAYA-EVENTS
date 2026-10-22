import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Booking, Hall, Language } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { findBookingConflict } from '../utils/bookingRules';
import { sound } from '../utils/soundEffects';

interface CalendarAgendaViewProps {
  bookings: Booking[];
  halls: Hall[];
  onSelectBooking: (booking: Booking) => void;
  onOpenNewBooking: () => void;
  language?: Language;
}

export function CalendarAgendaView({
  bookings,
  halls,
  onSelectBooking,
  onOpenNewBooking,
  language = 'ar',
}: CalendarAgendaViewProps) {
  const { isAr, tr, egp } = makeTr(language);
  const [selectedHallId, setSelectedHallId] = useState<string>('all');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Conflict detector
  const conflicts: { b1: Booking; b2: Booking }[] = [];
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const b1 = bookings[i];
      const b2 = bookings[j];
      if (b2.status === 'cancelled') continue;
      // Custom venues share one hallId, so compare them by name.
      const clash = findBookingConflict([b1], {
        hallId: b2.hallId === 'custom-hall' ? undefined : b2.hallId, hallName: b2.hallName,
        date: b2.date, startTime: b2.startTime, endTime: b2.endTime,
      });
      if (clash) conflicts.push({ b1, b2 });
    }
  }

  // Bookings requiring installment collection
  const pendingCollectionBookings = bookings.filter(
    (b) => b.status === 'confirmed' && b.remainingAmount > 0
  );

  const filteredBookings = bookings.filter(
    (b) => selectedHallId === 'all' || b.hallId === selectedHallId
  );
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d;
  });
  const monthLabel = month.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' });
  const dayNames = isAr ? ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayBookings = (key: string) => filteredBookings.filter((b) => b.date === key);

  return (
    <div className="w-full space-y-6 pb-20 text-start">
      {/* Top Controls & Hall Filter */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white">{tr('أجندة القاعات وجدول المواعيد', 'Hall calendar & schedule')}</h2>
            <p className="text-xs text-slate-400">{tr('متابعة الفترات المحجوزة والمتاحة واكتشاف أي تعارض زمني', 'Track booked and free slots and spot any time clashes')}</p>
          </div>
        </div>

        {/* Hall Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              sound.click(500);
              setSelectedHallId('all');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedHallId === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 bg-slate-950 hover:text-white'
            }`}
          >
            {tr('جميع القاعات', 'All halls')}
          </button>
          {halls.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                sound.click(500);
                setSelectedHallId(h.id);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedHallId === h.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 bg-slate-950 hover:text-white'
              }`}
            >
              {isAr ? h.name : h.nameEn || h.name}
            </button>
          ))}
        </div>
      </div>

      {/* Conflict Warning Box (If any conflict detected) */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-rose-300 font-bold block text-sm">
              {tr(`تعارض في المواعيد (${conflicts.length})`, `Time clashes (${conflicts.length})`)}:
            </strong>
            {conflicts.map((c, idx) => (
              <div key={idx} className="text-rose-300">
                {tr('القاعة', 'Hall')}: <strong>{c.b1.hallName}</strong> · {c.b1.date} · {c.b1.clientName} ({c.b1.startTime}–{c.b1.endTime}) ↔ {c.b2.clientName} ({c.b2.startTime}–{c.b2.endTime})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings Needing Payment Collection Strip */}
      {pendingCollectionBookings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{tr(`حجوزات مؤكدة عليها مبالغ متبقية (${pendingCollectionBookings.length})`, `Confirmed bookings with a balance due (${pendingCollectionBookings.length})`)}</span>
            </span>
            <span className="text-xs font-mono text-amber-400">
              {tr('إجمالي المتبقي', 'Total outstanding')}: {egp(pendingCollectionBookings.reduce((acc, b) => acc + b.remainingAmount, 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {pendingCollectionBookings.slice(0, 3).map((bk) => (
              <div
                key={bk.id}
                onClick={() => onSelectBooking(bk)}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 transition-colors cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{bk.clientName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {tr('تاريخ المناسبة', 'Event date')}: {bk.date}
                  </span>
                </div>
                <div className="text-end font-mono">
                  <span className="text-rose-400 font-bold block">
                    {egp(bk.remainingAmount)}
                  </span>
                  <span className="text-[10px] text-slate-500">{tr('متبقي للتحصيل', 'Balance due')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly calendar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-base font-bold text-white">{tr('التقويم الشهري', 'Monthly calendar')}</h3><p className="text-xs text-slate-400">{tr('مرر المؤشر فوق المناسبة لعرض التفاصيل الكاملة', 'Hover an event to see its full details')}</p></div><div className="flex items-center gap-2"><button aria-label={tr('الشهر السابق', 'Previous month')} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg bg-slate-900 p-2 text-slate-300 hover:text-white"><ChevronRight className="h-4 w-4" /></button><strong className="min-w-32 text-center text-sm text-white">{monthLabel}</strong><button aria-label={tr('الشهر التالي', 'Next month')} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg bg-slate-900 p-2 text-slate-300 hover:text-white"><ChevronLeft className="h-4 w-4" /></button></div></div>
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60"><div className="min-w-[760px]"><div className="grid grid-cols-7 border-b border-slate-800">{dayNames.map((d) => <div key={d} className="p-3 text-center text-xs font-bold text-slate-400">{d}</div>)}</div><div className="grid grid-cols-7">{days.map((d) => { const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const events = dayBookings(key); return <div key={key} onClick={() => setSelectedDay(key)} className={`group relative min-h-28 border-b border-e border-slate-800 p-2 ${d.getMonth() === month.getMonth() ? '' : 'bg-slate-950/40'} ${selectedDay === key ? 'ring-1 ring-inset ring-indigo-400' : ''}`}><button className={`mb-1 text-xs ${d.getMonth() === month.getMonth() ? 'text-slate-200' : 'text-slate-600'}`} onClick={() => setSelectedDay(key)}>{d.getDate()}</button><div className="space-y-1">{events.slice(0,3).map((bk) => <div key={bk.id} className="relative"><button onClick={(e) => { e.stopPropagation(); onSelectBooking(bk); }} className="w-full truncate rounded bg-indigo-500/20 px-1.5 py-1 text-start text-[10px] font-semibold text-indigo-200 hover:bg-indigo-500/40">{bk.startTime} · {bk.clientName}</button><div role="tooltip" className="pointer-events-none absolute start-0 top-full z-30 hidden w-64 rounded-xl border border-indigo-400/40 bg-slate-950 p-3 text-start text-xs text-slate-200 shadow-xl group-hover:block"><strong className="block text-sm text-white">{bk.clientName} · {bk.code}</strong><span className="mt-1 block">{bk.eventType} · {bk.hallName}</span><span className="block">{bk.date} · {bk.startTime}–{bk.endTime}</span><span className="block">{bk.guestCount} {tr('ضيف', 'guests')} · {bk.status}</span><span className="block">{tr('الإجمالي', 'Total')}: {egp(bk.totalPrice)}</span><span className="block">{tr('الهاتف', 'Phone')}: {bk.clientPhone}</span><span className="mt-1 block text-indigo-300">{tr('انقر لفتح تفاصيل الحجز', 'Click to open the booking')}</span></div></div>)}{events.length > 3 && <span className="text-[10px] text-slate-500">+{events.length - 3} {tr('أخرى', 'more')}</span>}</div></div>})}</div></div></div>
        {selectedDay && <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300"><strong>{selectedDay}</strong> · {dayBookings(selectedDay).length} {tr('مناسبة', 'events')}</div>}
      </div>
    </div>
  );
}
