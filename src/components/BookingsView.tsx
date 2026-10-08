import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Phone,
  User,
  Shield,
  Calculator,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Booking, BookingStatus, EventType } from '../types/venueSystem';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface BookingsViewProps {
  bookings: Booking[];
  onOpenNewBooking: () => void;
  onSelectBookingForProfit: (booking: Booking) => void;
  onSelectBookingForInvoice: (booking: Booking) => void;
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
}

export function BookingsView({
  bookings,
  onOpenNewBooking,
  onSelectBookingForProfit,
  onSelectBookingForInvoice,
  onUpdateBookingStatus,
}: BookingsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clientPhone.includes(searchQuery) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.hallName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesType = eventTypeFilter === 'all' || b.eventType === eventTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return { label: 'مؤكد', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'tentative':
        return { label: 'مبدئي', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'completed':
        return { label: 'مكتمل ومسلّم', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'cancelled':
        return { label: 'ملغي', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    }
  };

  const getEventTypeLabel = (type: EventType) => {
    switch (type) {
      case 'wedding':
        return 'حفل زفاف (فرح)';
      case 'engagement':
        return 'حفل خطوبة';
      case 'birthday':
        return 'عيد ميلاد';
      case 'conference':
        return 'مؤتمر / ندوة';
      case 'party':
        return 'حفلة تخرج / خاصة';
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 text-right">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-full md:max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الحجز، اسم العميل، رقم الهاتف، أو القاعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'confirmed', label: 'مؤكد' },
              { id: 'tentative', label: 'مبدئي' },
              { id: 'completed', label: 'مكتمل' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  sound.click(500);
                  setStatusFilter(st.id);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* New Booking CTA */}
          <button
            onClick={() => {
              sound.click(650);
              onOpenNewBooking();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل حجز جديد</span>
          </button>
        </div>
      </div>

      {/* Bookings List Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.map((bk) => {
          const badge = getStatusBadge(bk.status);
          const isSettled = bk.remainingAmount === 0;

          return (
            <TiltCard
              key={bk.id}
              tiltMax={2}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                {/* Header Lockup */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-indigo-400 font-bold text-sm bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-800/50">
                      {bk.code}
                    </span>
                    <h3 className="text-base font-bold text-white">{bk.clientName}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {getEventTypeLabel(bk.eventType)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span className="font-mono text-slate-300">{bk.clientPhone}</span>
                    </span>
                    <span>·</span>
                    <span>القاعة: <strong className="text-white">{bk.hallName}</strong></span>
                    <span>·</span>
                    <span className="font-mono text-slate-300">{bk.date} ({bk.startTime} - {bk.endTime})</span>
                    <span>·</span>
                    <span>{bk.guestCount} فرد</span>
                  </div>
                </div>

                {/* Right Quick Action Buttons */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={() => {
                      sound.click(600);
                      onSelectBookingForProfit(bk);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>حساب ربح المناسبة</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.click(600);
                      onSelectBookingForInvoice(bk);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>الفاتورة الرسمية</span>
                  </button>
                </div>
              </div>

              {/* Financial & Services Breakdown Row */}
              <div className="mt-4 pt-1 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono">إجمالي الحجز + الخدمات</span>
                  <span className="text-sm font-bold font-mono text-white tabular-nums">
                    {bk.totalPrice.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-slate-500 block">شامل {bk.services.length} خدمات</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono">العربون المسدد</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                    {bk.deposit.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-slate-500 block">عند التعاقد</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono">إجمالي المدفوع</span>
                  <span className="text-sm font-bold font-mono text-emerald-300 tabular-nums">
                    {bk.paidAmount.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round((bk.paidAmount / bk.totalPrice) * 100)}% من القيمة
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono">المتبقي للتحصيل</span>
                  <span
                    className={`text-sm font-bold font-mono tabular-nums ${
                      isSettled ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isSettled ? 'خالص بالكامل' : `${bk.remainingAmount.toLocaleString()} ج.م`}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {isSettled ? 'لا توجد متأخرات' : 'يستحق قبل الموعد'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono">التأمين المحتجز</span>
                  <span className="text-sm font-bold font-mono text-amber-300 tabular-nums">
                    {bk.securityDeposit.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {bk.securityDepositStatus === 'refunded' ? 'تم الرد' : 'محتجز بالخزينة'}
                  </span>
                </div>
              </div>

              {/* Notes Strip */}
              {bk.notes && (
                <div className="mt-3 p-2 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300">
                  ملاحظات: {bk.notes}
                </div>
              )}
            </TiltCard>
          );
        })}

        {filteredBookings.length === 0 && (
          <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-medium text-sm">لا توجد حجوزات مطابقة للبحث</p>
            <p className="text-slate-500 text-xs mt-1">جرّب تغيير فلاتر البحث أو سجّل حجزاً جديداً.</p>
          </div>
        )}
      </div>
    </div>
  );
}
