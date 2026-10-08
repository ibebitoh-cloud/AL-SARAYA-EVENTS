import { motion } from 'motion/react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  Shield,
  Sparkles,
  ArrowUpRight,
  Clock,
  Package,
  Plus,
  Compass,
  FileText,
  Utensils,
  Radio,
} from 'lucide-react';
import { Booking, Expense, PaymentReceipt, InventoryItem, Hall, Language } from '../types/venueSystem';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface DashboardViewProps {
  bookings: Booking[];
  expenses: Expense[];
  payments: PaymentReceipt[];
  inventory: InventoryItem[];
  halls: Hall[];
  language: Language;
  onOpenNewBooking: () => void;
  onSelectBookingForProfit: (booking: Booking) => void;
  onSelectBookingForInvoice: (booking: Booking) => void;
  onNavigateTab: (tab: any) => void;
}

export function DashboardView({
  bookings,
  expenses,
  payments,
  inventory,
  halls,
  language,
  onOpenNewBooking,
  onSelectBookingForProfit,
  onSelectBookingForInvoice,
  onNavigateTab,
}: DashboardViewProps) {
  const isAr = language === 'ar';
  const todayStr = '2026-10-10';

  const todayBookings = bookings.filter((b) => b.date === todayStr && b.status !== 'cancelled');
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed');
  const totalRevenueCollected = bookings.reduce((acc, b) => acc + b.paidAmount, 0);
  const totalPendingReceivables = bookings.reduce((acc, b) => acc + b.remainingAmount, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalEventsRevenue = bookings.reduce((acc, b) => acc + b.totalPrice, 0);
  const totalEventsDirectCost = bookings.reduce((acc, b) => {
    const staffCost = b.assignedStaff.reduce((sAcc, s) => sAcc + s.wage, 0);
    const srvCost = b.services.reduce((sAcc, s) => sAcc + s.totalCost, 0);
    return acc + staffCost + srvCost + b.suppliesCost + b.directExpenses;
  }, 0);
  const totalNetProfit = totalEventsRevenue - totalEventsDirectCost - totalExpenses;

  // Alerts
  const lowStockItems = inventory.filter((item) => item.quantity <= item.minThreshold);
  const bookingsWithDueBalance = bookings.filter((b) => b.remainingAmount > 0 && b.status === 'confirmed');

  return (
    <div className={`w-full space-y-6 pb-20 ${isAr ? 'text-right' : 'text-left'}`}>
      {/* 1. Concise Executive Top Row (4 Key Pulse Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Events */}
        <TiltCard tiltMax={4} className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isAr ? '🎉 مناسبات اليوم' : "🎉 Today's Events"}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white tabular-nums">
            {todayBookings.length} {isAr ? 'حفل نشط' : 'Active Events'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'القاعة الملكية الكبرى محجوزة اليوم' : 'The Royal Grand Ballroom is Live'}
          </div>
        </TiltCard>

        {/* Collected Revenue */}
        <TiltCard tiltMax={4} className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isAr ? '💰 إجمالي المحصّل' : '💰 Collected Revenue'}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-400 tabular-nums">
            {totalRevenueCollected.toLocaleString()} <span className="text-xs">{isAr ? 'ج.م' : 'EGP'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'من الحجوزات والعربونات' : 'From deposits & installments'}
          </div>
        </TiltCard>

        {/* Pending Receivables */}
        <TiltCard tiltMax={4} className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isAr ? '💳 متأخرات التحصيل' : '💳 Pending Receivables'}</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-300 tabular-nums">
            {totalPendingReceivables.toLocaleString()} <span className="text-xs">{isAr ? 'ج.م' : 'EGP'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? `${bookingsWithDueBalance.length} حجوزات بانتظار السداد` : `${bookingsWithDueBalance.length} bookings due for payment`}
          </div>
        </TiltCard>

        {/* Net Profit Estimate */}
        <TiltCard tiltMax={4} className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isAr ? '📈 صافي الربح التقديري' : '📈 Net Profit Margin'}</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-indigo-300 tabular-nums">
            {totalNetProfit.toLocaleString()} <span className="text-xs">{isAr ? 'ج.م' : 'EGP'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'بعد خصم الخدمات والعمالة والمصروفات' : 'After all direct costs & labor'}
          </div>
        </TiltCard>
      </div>

      {/* 2. Today's Stage Spotlight Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-slate-900/60 border border-indigo-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'حفل الليلة المباشر · السبت 10 أكتوبر 2026' : 'Tonight Live Gala · Sat, Oct 10, 2026'}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {isAr ? 'زفاف أحمد محمود التهامي · القاعة الملكية الكبرى' : 'Tohamy Royal Wedding · The Royal Grand Ballroom'}
          </h2>
          <p className="text-xs text-slate-300">
            {isAr
              ? 'عدد الحضور: 500 فرد · بدء الاستقبال: 18:00 · بوفيه مفتوح إمبراطوري · 14 فرد عمالة في الخدمة'
              : '500 Guests · Doors Open: 18:00 · Imperial Royal Banquet · 14 Event Crew on Duty'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              sound.click(650);
              onNavigateTab('live_stage');
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-300" />
            <span>{isAr ? 'غرفة التحكم المباشرة' : 'Live Stage Board'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              sound.click(650);
              onNavigateTab('floorplan');
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isAr ? 'مخطط الطاولات' : 'Floor Plan'}</span>
          </motion.button>
        </div>
      </div>

      {/* 3. Launchpad to Dedicated Screens (Less Clutter on Dashboard, Direct Access to Full Screens) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-300">
            {isAr ? 'شاشات المنظومة المتخصصة' : 'Dedicated System Workspaces'}
          </h3>
          <span className="text-[11px] text-slate-500">
            {isAr ? 'اختر الشاشة للاطلاع على كافة التفاصيل' : 'Select a screen for in-depth operations'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'company', labelAr: 'عن الشركة والقاعات', labelEn: 'Company & Halls', icon: Sparkles, color: 'text-amber-400' },
            { id: 'bookings', labelAr: 'إدارة الحجوزات', labelEn: 'All Bookings', icon: Calendar, color: 'text-indigo-400' },
            { id: 'agenda', labelAr: 'الأجندة والتقويم', labelEn: 'Calendar Agenda', icon: Clock, color: 'text-emerald-400' },
            { id: 'catering', labelAr: 'البوفيه والضيافة', labelEn: 'Buffet & Menus', icon: Utensils, color: 'text-pink-400' },
            { id: 'contracts', labelAr: 'العقود والاتفاقيات', labelEn: 'Contracts & Legal', icon: FileText, color: 'text-cyan-400' },
            { id: 'reports', labelAr: 'التقارير وصافي الربح', labelEn: 'Profit Analytics', icon: TrendingUp, color: 'text-violet-400' },
          ].map((screen) => {
            const Icon = screen.icon;
            return (
              <button
                key={screen.id}
                onClick={() => {
                  sound.swoosh();
                  onNavigateTab(screen.id);
                }}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform">
                  <Icon className={`w-5 h-5 ${screen.color}`} />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {isAr ? screen.labelAr : screen.labelEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Urgent Operational Alerts (Stock & Receivables) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Receivables Alert */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>{isAr ? 'حجوزات تتطلب تحصيل دفعات' : 'Pending Customer Receivables'}</span>
            </div>
            <button
              onClick={() => onNavigateTab('payments')}
              className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
            >
              {isAr ? 'فتح الخزينة' : 'Open Treasury'}
            </button>
          </div>

          <div className="space-y-2">
            {bookingsWithDueBalance.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{b.clientName}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{b.hallName} · {b.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-amber-300">{b.remainingAmount.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</div>
                  <div className="text-[10px] text-slate-500">{isAr ? 'متبقي' : 'Due'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <Package className="w-4 h-4" />
              <span>{isAr ? 'تنبيهات نقص المخزون' : 'Inventory Restock Alerts'}</span>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
            >
              {isAr ? 'سجل المخزن' : 'Open Inventory'}
            </button>
          </div>

          <div className="space-y-2">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{isAr ? `الحد الأدنى: ${item.minThreshold} ${item.unit}` : `Min Threshold: ${item.minThreshold}`}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-rose-400">{item.quantity} {item.unit}</div>
                    <div className="text-[10px] text-rose-500 font-semibold">{isAr ? 'أوشك على النفاد' : 'Low Stock'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                {isAr ? 'كافة المستلزمات والمخزون ضمن الحدود الآمنة' : 'All supplies are currently above thresholds.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
