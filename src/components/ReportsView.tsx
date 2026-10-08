import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileBarChart2,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  Shield,
  Utensils,
  Package,
  Users,
  Printer,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Booking, Expense, PaymentReceipt, InventoryItem, Employee } from '../types/venueSystem';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface ReportsViewProps {
  bookings: Booking[];
  expenses: Expense[];
  payments: PaymentReceipt[];
  inventory: InventoryItem[];
  staff: Employee[];
}

export function ReportsView({
  bookings,
  expenses,
  payments,
  inventory,
  staff,
}: ReportsViewProps) {
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Aggregates
  const totalBookingsCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const totalContractedRevenue = bookings.reduce((acc, b) => acc + b.totalPrice, 0);
  const totalCollectedCash = payments
    .filter((p) => p.type !== 'security_refund')
    .reduce((acc, p) => acc + p.amount, 0);
  const totalDebtsReceivables = bookings.reduce((acc, b) => acc + b.remainingAmount, 0);
  const totalHeldSecurity = bookings
    .filter((b) => b.securityDepositStatus === 'held')
    .reduce((acc, b) => acc + b.securityDeposit, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Direct events costs
  const totalEventsDirectCost = bookings.reduce((acc, b) => {
    const staffWage = b.assignedStaff.reduce((sAcc, s) => sAcc + s.wage, 0);
    const srvCost = b.services.reduce((sAcc, s) => sAcc + s.totalCost, 0);
    return acc + staffWage + srvCost + b.suppliesCost + b.directExpenses;
  }, 0);

  const totalStaffWagesPaid = staff.reduce((acc, s) => acc + (s.baseSalary + s.bonuses - s.loans), 0);

  const netProfit = totalContractedRevenue - totalEventsDirectCost - totalExpenses;
  const profitMargin = totalContractedRevenue > 0 ? Math.round((netProfit / totalContractedRevenue) * 100) : 0;

  // Most requested services
  const servicePopularity: Record<string, { name: string; count: number; revenue: number }> = {};
  bookings.forEach((b) => {
    b.services.forEach((s) => {
      if (!servicePopularity[s.name]) {
        servicePopularity[s.name] = { name: s.name, count: 0, revenue: 0 };
      }
      servicePopularity[s.name].count += s.quantity;
      servicePopularity[s.name].revenue += s.totalPrice;
    });
  });

  const topServices = Object.values(servicePopularity).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="w-full space-y-6 pb-20 text-right">
      {/* Top Banner & Print Action */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-indigo-400" />
            <span>التقارير التحليلية الشاملة والأرباح والخسائر</span>
          </h2>
          <p className="text-xs text-slate-400">
            تقرير الإيرادات، المتأخرات، تكلفة المناسبات، الخدمات الأكثر طلباً، وصافي الربح
          </p>
        </div>

        <button
          onClick={() => {
            sound.click(600);
            window.print();
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة تقرير الميزانية</span>
        </button>
      </div>

      {/* Net Profit & Financial Statement Big Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold block">
              قائمة الدخل وصافي أرباح المنشأة (PROFIT & LOSS STATEMENT)
            </span>
            <div className="text-3xl sm:text-5xl font-black font-mono text-white tabular-nums mt-1">
              +{netProfit.toLocaleString()} ج.م
            </div>
            <span className="text-xs text-slate-300 block mt-1">
              هامش صافي الربح: <strong className="text-emerald-400 font-mono text-sm">{profitMargin}%</strong> من إجمالي العقود
            </span>
          </div>

          <div className="text-left font-mono text-xs space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>إجمالي التعاقدات: <strong className="text-white">+{totalContractedRevenue.toLocaleString()} ج.م</strong></div>
            <div>المصاريف المباشرة: <strong className="text-rose-400">−{totalEventsDirectCost.toLocaleString()} ج.م</strong></div>
            <div>المصاريف التشغيلية: <strong className="text-rose-400">−{totalExpenses.toLocaleString()} ج.م</strong></div>
          </div>
        </div>

        {/* 4 Summary Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">المحصل بالخزينة</span>
            <span className="text-base font-bold text-emerald-400 tabular-nums">
              {totalCollectedCash.toLocaleString()} ج.م
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">متأخرات العملاء</span>
            <span className="text-base font-bold text-amber-400 tabular-nums">
              {totalDebtsReceivables.toLocaleString()} ج.م
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">تأمينات محتجزة</span>
            <span className="text-base font-bold text-indigo-300 tabular-nums">
              {totalHeldSecurity.toLocaleString()} ج.م
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">أجور ورواتب العمال</span>
            <span className="text-base font-bold text-rose-300 tabular-nums">
              {totalStaffWagesPaid.toLocaleString()} ج.م
            </span>
          </div>
        </div>
      </div>

      {/* Top Performing Services Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Requested Services Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Utensils className="w-4 h-4 text-indigo-400" />
            <span>أكثر الخدمات الإضافية طلباً ومبيعاتها</span>
          </h3>

          <div className="space-y-2.5">
            {topServices.map((srv, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{srv.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    تم طلبها {srv.count} مرة
                  </span>
                </div>
                <div className="text-left font-mono">
                  <span className="font-bold text-emerald-400 block tabular-nums">
                    {srv.revenue.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-slate-500">إجمالي المبيعات</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings Status Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>توزيع الحجوزات ونسب الإنجاز</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">حجوزات مؤكدة قادمة:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">{confirmedCount} مناسبة</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">مناسبات مكتملة ومسلمة:</span>
              <span className="font-mono text-indigo-400 font-bold text-sm">{completedCount} مناسبة</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">حجوزات ملغاة:</span>
              <span className="font-mono text-rose-400 font-bold text-sm">{cancelledCount} مناسبة</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">إجمالي الحجوزات المسجلة:</span>
              <span className="font-mono text-white font-bold text-sm">{totalBookingsCount} مناسبة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
