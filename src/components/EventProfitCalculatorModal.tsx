import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  TrendingUp,
  DollarSign,
  Users,
  Utensils,
  Receipt,
  Layers,
  Sparkles,
  Calculator,
  Percent,
} from 'lucide-react';
import { Booking, Language } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { sound } from '../utils/soundEffects';

interface EventProfitCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onUpdateBookingCosts?: (bookingId: string, updates: Partial<Booking>) => void;
  language?: Language;
}

export function EventProfitCalculatorModal({
  isOpen,
  onClose,
  booking,
  onUpdateBookingCosts,
  language = 'ar',
}: EventProfitCalculatorModalProps) {
  const { isAr, tr, egp } = makeTr(language);
  // Hooks must run before the early return below.
  const [suppliesCost, setSuppliesCost] = useState(booking?.suppliesCost ?? 2500);
  const [directExpenses, setDirectExpenses] = useState(booking?.directExpenses ?? 1200);
  if (!isOpen || !booking) return null;

  // Revenue components
  const basePrice = booking.basePrice;
  const servicesRevenue = booking.services.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalRevenue = basePrice + servicesRevenue;

  // Cost components
  const staffCost = booking.assignedStaff.reduce((acc, s) => acc + s.wage, 0);
  const servicesCost = booking.services.reduce((acc, s) => acc + s.totalCost, 0);

  // Profit calculation formula:
  // {tr('قيمة الحجز + الخدمات الإضافية − تكلفة العمالة − تكلفة الخدمات − المستلزمات − المصروفات المباشرة = ربح المناسبة', 'Hall price + add-on services − staff − service costs − supplies − direct expenses = event profit')}
  const totalCosts = staffCost + servicesCost + suppliesCost + directExpenses;
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const handleSave = () => {
    sound.success();
    if (onUpdateBookingCosts) {
      onUpdateBookingCosts(booking.id, {
        suppliesCost,
        directExpenses,
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-7 text-start"
        >
          {/* Close button */}
          <button
            onClick={() => {
              onClose();
              sound.tick();
              }}
            className="absolute top-5 end-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">
              {tr('حساب ربحية المناسبة الفعلي', 'Event profit')}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            {tr('كود الحجز', 'Booking')}: <span className="font-mono text-indigo-400 font-semibold">{booking.code}</span> · {booking.clientName} ({booking.hallName})
          </p>

          {/* Formula Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 mb-5 font-mono">
            <span className="font-bold text-amber-300 block mb-1">{tr('معادلة الأرباح المعتمدة', 'How profit is calculated')}:</span>
            <span>{tr('قيمة الحجز + الخدمات الإضافية − تكلفة العمالة − تكلفة الخدمات − المستلزمات − المصروفات المباشرة = ربح المناسبة', 'Hall price + add-on services − staff − service costs − supplies − direct expenses = event profit')}</span>
          </div>

          {/* The Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {/* 1. الإيرادات (Revenue) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400">{tr('1. إجمالي الإيرادات (+)', '1. Revenue (+)')}</span>
                <span className="text-sm font-mono font-bold text-white tabular-nums">
                  {egp(totalRevenue)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">{tr('سعر القاعة الأساسي', 'Base hall price')}:</span>
                <span className="font-mono tabular-nums">{egp(basePrice)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">{tr('الخدمات الإضافية', 'Add-on services')} ({booking.services.length}):</span>
                <span className="font-mono tabular-nums">{egp(servicesRevenue)}</span>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                {tr('العربون المدفوع', 'Deposit paid')}: {egp(booking.deposit)} · {tr('المتبقي', 'Balance')}: {egp(booking.remainingAmount)}
              </div>
            </div>

            {/* 2. التكاليف والمصروفات (Costs) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-rose-400">{tr('2. إجمالي التكاليف والمصاريف (−)', '2. Costs (−)')}</span>
                <span className="text-sm font-mono font-bold text-rose-300 tabular-nums">
                  {egp(totalCosts)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">{tr('أجور العمال والمشرفين', 'Staff wages')} ({booking.assignedStaff.length}):</span>
                <span className="font-mono text-rose-300 tabular-nums">{egp(staffCost)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">{tr('تكلفة خامات الخدمات (بوفيه/ديكور)', 'Service materials (buffet / decor)')}:</span>
                <span className="font-mono text-rose-300 tabular-nums">{egp(servicesCost)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">{tr('مستلزمات وتشغيل', 'Supplies & operations')}:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={suppliesCost}
                    onChange={(e) => setSuppliesCost(Number(e.target.value) || 0)}
                    className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-center text-rose-300"
                  />
                  <span>{tr('ج.م', 'EGP')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">{tr('مصروفات مباشرة', 'Direct expenses')}:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={directExpenses}
                    onChange={(e) => setDirectExpenses(Number(e.target.value) || 0)}
                    className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-center text-rose-300"
                  />
                  <span>{tr('ج.م', 'EGP')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Profit Big Outcome Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shadow-xl">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold block">
                {tr('صافي ربح هذه المناسبة', 'Net event profit')}{isAr ? ' (Net Event Profit)' : ''}
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tabular-nums mt-1 flex items-baseline gap-2">
                <span>{netProfit.toLocaleString()}</span>
                <span className="text-sm font-sans font-normal text-slate-400">{tr('جنيه مصري', 'EGP')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block font-mono">{tr('هامش الربح', 'Margin')}</span>
                <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {profitMargin}%
                </span>
              </div>
              <div className="text-center border-r border-slate-800 pr-4">
                <span className="text-[10px] text-slate-400 block font-mono">{tr('حالة التحصيل', 'Collection')}</span>
                <span className="text-xs font-bold text-indigo-300">
                  {booking.remainingAmount === 0 ? tr('مسدد بالكامل', 'Paid in full') : `${tr('متبقي', 'Due')} ${egp(booking.remainingAmount)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {tr('إغلاق', 'Close')}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              {tr('حفظ واعتماد التكاليف', 'Save costs')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
