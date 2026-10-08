import { Calendar, Building, Clock, Plus, ArrowRight } from 'lucide-react';
import { Booking, Hall, Language } from '../types/venueSystem';

interface DashboardViewProps {
  bookings: Booking[];
  halls: Hall[];
  language: Language;
  onOpenNewBooking: () => void;
  onNavigateTab: (tab: any) => void;
}

export function DashboardView({
  bookings,
  halls,
  language,
  onOpenNewBooking,
  onNavigateTab,
}: DashboardViewProps) {
  const isAr = language === 'ar';
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
  const confirmedBookings = activeBookings.filter((b) => b.status === 'confirmed');
  const upcoming = [...activeBookings]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="w-full space-y-5 pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {isAr ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isAr ? 'كل ما تحتاجه لإدارة الحجوزات اليومية.' : 'Everything you need for daily booking management.'}
          </p>
        </div>
        <button
          onClick={onOpenNewBooking}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'حجز جديد' : 'New Booking'}
        </button>
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

      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-white">
            {isAr ? 'الحجوزات القادمة' : 'Upcoming Bookings'}
          </h2>
          <button
            onClick={() => onNavigateTab('bookings')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1"
          >
            {isAr ? 'كل الحجوزات' : 'All Bookings'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            {isAr ? 'لا توجد حجوزات حالياً.' : 'No bookings yet.'}
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((booking) => (
              <button
                key={booking.id}
                onClick={() => onNavigateTab('bookings')}
                className="w-full p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-right flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate">{booking.clientName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {booking.hallName} · {booking.guestCount} {isAr ? 'فرد' : 'guests'}
                  </div>
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
