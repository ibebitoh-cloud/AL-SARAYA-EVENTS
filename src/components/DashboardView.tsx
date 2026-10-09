import { useMemo, useState } from 'react';
import { Calendar, Building, Clock, ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Booking, Hall, Language } from '../types/venueSystem';

interface DashboardViewProps {
  bookings: Booking[];
  halls: Hall[];
  language: Language;
  onNavigateTab: (tab: any) => void;
}

const EVENT_LABELS: Record<string, [string, string]> = {
  wedding: ['زفاف', 'Wedding'],
  engagement: ['خطوبة', 'Engagement'],
  birthday: ['عيد ميلاد', 'Birthday'],
  conference: ['مؤتمر', 'Conference'],
  party: ['حفلة', 'Party'],
};

const STATUS_LABELS: Record<string, [string, string]> = {
  confirmed: ['مؤكد', 'Confirmed'],
  tentative: ['مبدئي', 'Tentative'],
  completed: ['مكتمل', 'Completed'],
  cancelled: ['ملغي', 'Cancelled'],
};

export function DashboardView({
  bookings,
  halls,
  language,
  onNavigateTab,
}: DashboardViewProps) {
  const isAr = language === 'ar';
  // A booking should appear once on the dashboard even if a duplicate record
  // was accidentally added locally. Booking code is the business-level key.
  const uniqueBookings = useMemo(() => {
    const seen = new Set<string>();
    return bookings.filter((booking) => {
      const key = (booking.code || booking.id || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [bookings]);
  const activeBookings = uniqueBookings.filter((b) => b.status !== 'cancelled');
  const confirmedBookings = activeBookings.filter((b) => b.status === 'confirmed');
  const upcoming = [...activeBookings].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredBooking, setHoveredBooking] = useState<Booking | null>(null);

  const monthTitle = month.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const previousDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
    const cells: { date: Date; current: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ date: new Date(month.getFullYear(), month.getMonth() - 1, previousDays - i), current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(month.getFullYear(), month.getMonth(), d), current: true });
    }
    let next = 1;
    while (cells.length < 42) {
      cells.push({ date: new Date(month.getFullYear(), month.getMonth() + 1, next++), current: false });
    }
    return cells;
  }, [month]);

  const toKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const weekDays = isAr
    ? ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const eventTypeLabel = (type: string) => EVENT_LABELS[type]?.[isAr ? 0 : 1] || type;
  const statusLabel = (status: string) => STATUS_LABELS[status]?.[isAr ? 0 : 1] || status;

  return (
    <div className="w-full space-y-5 pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">{isAr ? 'لوحة التحكم' : 'Dashboard'}</h1>
          <p className="text-xs text-slate-400 mt-1">{isAr ? 'كل ما تحتاجه لإدارة الحجوزات اليومية.' : 'Everything you need for daily booking management.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <Calendar className="w-4 h-4 text-amber-400 mb-2" />
          <div className="text-2xl font-black text-white">{activeBookings.length}</div>
          <div className="text-xs text-slate-400 mt-1">{isAr ? 'إجمالي الحجوزات' : 'Total Bookings'}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <Clock className="w-4 h-4 text-emerald-400 mb-2" />
          <div className="text-2xl font-black text-white">{confirmedBookings.length}</div>
          <div className="text-xs text-slate-400 mt-1">{isAr ? 'حجوزات مؤكدة' : 'Confirmed'}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 col-span-2 lg:col-span-1">
          <Building className="w-4 h-4 text-indigo-400 mb-2" />
          <div className="text-2xl font-black text-white">{halls.length}</div>
          <div className="text-xs text-slate-400 mt-1">{isAr ? 'القاعات' : 'Halls'}</div>
        </div>
      </div>

      <section className="rounded-3xl bg-slate-900/70 border border-slate-800 overflow-visible shadow-2xl">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">{isAr ? 'تقويم الشهر' : 'Monthly Calendar'}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'مرر الماوس على المناسبة للتفاصيل الكاملة' : 'Hover an event for full details'}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700">{isAr ? 'اليوم' : 'Today'}</button>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-2 sm:px-4 pt-3">
          <div className="flex items-center justify-center mb-3">
            <div className="text-lg sm:text-xl font-black text-white tracking-tight">{monthTitle}</div>
          </div>
          <div className="grid grid-cols-7 rounded-t-2xl overflow-visible border border-slate-800">
            {weekDays.map((day) => <div key={day} className="px-1 py-2 text-center text-[10px] sm:text-[11px] font-black text-slate-500 bg-slate-950/80">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 border-l border-t border-slate-800 rounded-b-2xl overflow-visible">
            {calendarDays.map(({ date, current }) => {
              const key = toKey(date);
              const dayBookings = activeBookings.filter((b) => b.date === key);
              const isToday = key === toKey(today);
              return (
                <div key={key} className={`relative min-h-[108px] sm:min-h-[126px] p-1 sm:p-1.5 border-r border-b border-slate-800 ${current ? 'bg-slate-900/45' : 'bg-slate-950/25'}`}>
                  <div className={`flex justify-end ${isAr ? 'justify-start' : ''}`}>
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold ${isToday ? 'bg-amber-400 text-slate-950' : current ? 'text-slate-300' : 'text-slate-600'}`}>{date.getDate()}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="relative"
                        onMouseEnter={() => setHoveredBooking(booking)}
                        onMouseLeave={() => setHoveredBooking(null)}
                        onClick={() => onNavigateTab('bookings')}
                      >
                        <div className="cursor-pointer rounded-lg px-1.5 py-1 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 hover:border-indigo-400/50 transition-colors overflow-hidden">
                          <div className="text-[10px] font-black text-white truncate">{booking.clientName}</div>
                          <div className="text-[9px] text-indigo-200 truncate">{booking.startTime} · {booking.hallName}</div>
                        </div>
                        {hoveredBooking?.id === booking.id && (
                          <div className={`absolute z-[80] top-full mt-2 ${isAr ? 'right-0' : 'left-0'} w-[260px] sm:w-[310px] p-3 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl pointer-events-none`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-black text-white">{booking.clientName}</div>
                                <div className="text-[10px] text-indigo-300 mt-0.5">{eventTypeLabel(booking.eventType)} · {statusLabel(booking.status)}</div>
                              </div>
                              <span className="text-[10px] font-mono text-amber-300">{booking.code}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800"><Clock className="w-3 h-3 inline mr-1 text-amber-400" />{booking.startTime}–{booking.endTime}</div>
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800"><UsersIcon />{booking.guestCount} {isAr ? 'ضيف' : 'guests'}</div>
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 col-span-2"><MapPin className="w-3 h-3 inline mr-1 text-indigo-400" />{booking.hallName}</div>
                            </div>
                            <div className="mt-2 text-[10px] text-slate-300">
                              <span className="text-slate-500">{isAr ? 'الخدمات:' : 'Services:'}</span>{' '}
                              {booking.services.length ? booking.services.map((s) => s.name).join('، ') : (isAr ? 'لا توجد خدمات إضافية' : 'No additional services')}
                            </div>
                            <div className="mt-2 text-[10px] text-slate-500">{booking.clientPhone} · {booking.date}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-4 py-3 text-[10px] text-slate-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-400" />{isAr ? 'المناسبات المحجوزة — اضغط لفتح الحجوزات' : 'Booked events — click to open bookings'}</div>
      </section>

      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-white">{isAr ? 'الحجوزات القادمة' : 'Upcoming Bookings'}</h2>
          <button onClick={() => onNavigateTab('bookings')} className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1">
            {isAr ? 'كل الحجوزات' : 'All Bookings'}<ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {upcoming.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">{isAr ? 'لا توجد حجوزات حالياً.' : 'No bookings yet.'}</div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((booking) => (
              <button key={booking.id} onClick={() => onNavigateTab('bookings')} className="w-full p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-right flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate">{booking.clientName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{booking.hallName} · {booking.guestCount} {isAr ? 'فرد' : 'guests'}</div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-xs font-mono font-bold text-amber-300">{booking.date}</div>
                  <div className="text-[11px] text-slate-500">{booking.startTime}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersIcon() {
  return <span className="inline-flex w-3 h-3 mr-1 items-center justify-center text-emerald-400">•</span>;
}
