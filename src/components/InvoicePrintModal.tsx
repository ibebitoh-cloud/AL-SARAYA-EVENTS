import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, CheckCircle2, Shield, Calendar, Phone, MapPin, Receipt } from 'lucide-react';
import { Booking } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export function InvoicePrintModal({ isOpen, onClose, booking }: InvoicePrintModalProps) {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    sound.click(600);
    window.print();
  };

  const servicesTotal = booking.services.reduce((acc, s) => acc + s.totalPrice, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-8 text-right my-4"
        >
          {/* Top Actions Bar (Hidden on print) */}
          <div className="print:hidden flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة / إيصال رسمي</span>
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                sound.tick();
                }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Invoice Sheet Document */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 print:bg-white print:text-black print:border-none print:p-0">
            {/* Header Lockup */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 print:border-gray-300 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 print:bg-black" />
                  <h1 className="text-2xl font-black text-white print:text-black">
                    قاعات ومناسبات أورا إيفنت الملكية
                  </h1>
                </div>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  AuraEvent Luxury Ballrooms & Event Management
                </p>
                <p className="text-xs text-slate-500 print:text-gray-500 mt-0.5">
                  سجل تجاري: 489210 · بطاقة ضريبية: 341-890 · هاتف: 01000000000
                </p>
              </div>

              <div className="text-left font-mono">
                <span className="text-xs uppercase tracking-widest text-indigo-400 print:text-black font-bold block">
                  فاتورة حجز رسمية (OFFICIAL INVOICE)
                </span>
                <span className="text-lg font-bold text-white print:text-black block mt-0.5">
                  #{booking.code}
                </span>
                <span className="text-xs text-slate-400 print:text-gray-600">
                  التاريخ: {new Date().toISOString().split('T')[0]}
                </span>
              </div>
            </div>

            {/* Client & Event Info Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 mb-6 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-indigo-400 print:text-black block mb-1">
                  بيانات العميل:
                </span>
                <div>اسم العميل: <strong className="text-white print:text-black">{booking.clientName}</strong></div>
                <div>رقم الهاتف: <strong className="text-white print:text-black font-mono">{booking.clientPhone}</strong></div>
                {booking.clientAddress && <div>العنوان: <span className="text-slate-300 print:text-gray-700">{booking.clientAddress}</span></div>}
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-indigo-400 print:text-black block mb-1">
                  تفاصيل المناسبة:
                </span>
                <div>نوع المناسبة: <strong className="text-white print:text-black">{booking.eventType === 'wedding' ? 'حفل زفاف (فرح)' : booking.eventType === 'engagement' ? 'حفل خطوبة' : booking.eventType === 'birthday' ? 'عيد ميلاد' : booking.eventType === 'conference' ? 'مؤتمر سنوي' : 'حفلة خاصة'}</strong></div>
                <div>القاعة المحجوزة: <strong className="text-white print:text-black">{booking.hallName}</strong></div>
                <div>تاريخ المناسبة: <strong className="text-white print:text-black font-mono">{booking.date}</strong> ({booking.startTime} - {booking.endTime})</div>
                <div>عدد المدعوين: <strong className="text-white print:text-black font-mono">{booking.guestCount} فرد</strong></div>
              </div>
            </div>

            {/* Itemized Services Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 print:border-gray-300 text-slate-400 print:text-gray-700 font-semibold">
                    <th className="py-2.5 px-3">البند / الخدمة</th>
                    <th className="py-2.5 px-3">الكمية</th>
                    <th className="py-2.5 px-3">سعر الوحدة</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  <tr>
                    <td className="py-3 px-3">
                      <strong className="text-white print:text-black block">حجز القاعة الأساسي ({booking.hallName})</strong>
                      <span className="text-[11px] text-slate-400 print:text-gray-500">يشمل الاستخدام الكامل للمرافق والتكييف والخدمات الأساسية</span>
                    </td>
                    <td className="py-3 px-3 font-mono">1</td>
                    <td className="py-3 px-3 font-mono">{booking.basePrice.toLocaleString()} ج.م</td>
                    <td className="py-3 px-3 text-left font-mono font-bold text-white print:text-black">
                      {booking.basePrice.toLocaleString()} ج.م
                    </td>
                  </tr>

                  {booking.services.map((srv) => (
                    <tr key={srv.id}>
                      <td className="py-3 px-3">
                        <span className="text-slate-200 print:text-black font-medium">{srv.name}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{srv.quantity}</td>
                      <td className="py-3 px-3 font-mono">{srv.unitPrice.toLocaleString()} ج.م</td>
                      <td className="py-3 px-3 text-left font-mono font-bold text-white print:text-black">
                        {srv.totalPrice.toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals & Deposit Ledger */}
            <div className="border-t border-slate-800 print:border-gray-300 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* Security Deposit Terms */}
              <div className="text-xs text-slate-400 print:text-gray-600 max-w-sm space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 print:text-black font-semibold">
                  <Shield className="w-4 h-4" />
                  <span>تأمين القاعة: {booking.securityDeposit.toLocaleString()} جنيه</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  * مبلغ التأمين محتجز ومسترد بالكامل فور انتهاء المناسبة وسلامة أجهزة الصوت والإضاءة والديكورات.
                </p>
              </div>

              {/* Tally Numbers */}
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300 print:text-gray-800">
                  <span>إجمالي قيمة الحجز:</span>
                  <span className="font-mono font-bold">{booking.totalPrice.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-emerald-400 print:text-green-700">
                  <span>المدفوع حتى الآن:</span>
                  <span className="font-mono font-bold">− {booking.paidAmount.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-amber-300 print:text-amber-800">
                  <span>التأمين (مسترد):</span>
                  <span className="font-mono font-bold">+ {booking.securityDeposit.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white print:text-black pt-2 border-t border-slate-800 print:border-gray-400">
                  <span>المبلغ المتبقي للتحصيل:</span>
                  <span className="font-mono text-base text-rose-400 print:text-black">
                    {booking.remainingAmount.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 print:border-gray-300 grid grid-cols-2 gap-8 text-center text-xs text-slate-400 print:text-black">
              <div>
                <span className="block mb-6 font-semibold">توقيع العميل المستلم:</span>
                <div className="w-36 h-0.5 bg-slate-700 print:bg-black mx-auto" />
              </div>
              <div>
                <span className="block mb-6 font-semibold">ختم وتوقيع إدارة القاعات:</span>
                <div className="w-36 h-0.5 bg-slate-700 print:bg-black mx-auto" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
