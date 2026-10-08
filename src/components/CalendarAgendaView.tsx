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
import { Booking, Hall } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface CalendarAgendaViewProps {
  bookings: Booking[];
  halls: Hall[];
  onSelectBooking: (booking: Booking) => void;
  onOpenNewBooking: () => void;
}

export function CalendarAgendaView({
  bookings,
  halls,
  onSelectBooking,
  onOpenNewBooking,
}: CalendarAgendaViewProps) {
  const [selectedHallId, setSelectedHallId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');

  // Conflict detector
  const conflicts: { b1: Booking; b2: Booking }[] = [];
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const b1 = bookings[i];
      const b2 = bookings[j];
      if (
        b1.hallId === b2.hallId &&
        b1.date === b2.date &&
        b1.status !== 'cancelled' &&
        b2.status !== 'cancelled'
      ) {
        if (
          (b1.startTime >= b2.startTime && b1.startTime < b2.endTime) ||
          (b1.endTime > b2.startTime && b1.endTime <= b2.endTime)
        ) {
          conflicts.push({ b1, b2 });
        }
      }
    }
  }

  // Bookings requiring installment collection
  const pendingCollectionBookings = bookings.filter(
    (b) => b.status === 'confirmed' && b.remainingAmount > 0
  );

  const filteredBookings = bookings.filter(
    (b) => selectedHallId === 'all' || b.hallId === selectedHallId
  );

  return (
    <div className="w-full space-y-6 pb-20 text-right">
      {/* Top Controls & Hall Filter */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white">أجندة القاعات وجدول المواعيد</h2>
            <p className="text-xs text-slate-400">متابعة الفترات المحجوزة والمتاحة واكتشاف أي تعارض زمني</p>
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
            جميع القاعات
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
              {h.name}
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
              تحذير تعارض في المواعيد ({conflicts.length} حالات تعارض):
            </strong>
            {conflicts.map((c, idx) => (
              <div key={idx} className="text-rose-300">
                القاعة: <strong>{c.b1.hallName}</strong> بتأريخ {c.b1.date} بين حجز ({c.b1.clientName} من {c.b1.startTime}-{c.b1.endTime}) وحجز ({c.b2.clientName} من {c.b2.startTime}-{c.b2.endTime}).
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
              <span>تنبيه تحصيل: حجوزات مؤكدة تحتاج تحصيل دفعة متبقية ({pendingCollectionBookings.length})</span>
            </span>
            <span className="text-xs font-mono text-amber-400">
              إجمالي المتأخرات: {pendingCollectionBookings.reduce((acc, b) => acc + b.remainingAmount, 0).toLocaleString()} ج.م
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
                    تاريخ المناسبة: {bk.date}
                  </span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-rose-400 font-bold block">
                    {bk.remainingAmount.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-slate-500">متبقي للتحصيل</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Timeline & Slots Breakdown */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">جدول الأيام والمواعيد المحجوزة</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((bk) => (
            <div
              key={bk.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 font-mono text-xs font-bold">
                  {bk.date}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {bk.startTime} - {bk.endTime}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">{bk.clientName}</h4>
                <span className="text-xs text-slate-400 block mt-0.5 font-medium">
                  {bk.hallName} · {bk.guestCount} فرد
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">إجمالي القيمة:</span>
                  <span className="font-mono text-emerald-400 font-bold">{bk.totalPrice.toLocaleString()} ج.م</span>
                </div>

                <button
                  onClick={() => onSelectBooking(bk)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>التفاصيل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
