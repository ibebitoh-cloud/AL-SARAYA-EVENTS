import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, CheckCircle2, Shield, Calendar, Phone, MapPin, Receipt } from 'lucide-react';
import { Booking, Language } from '../types/venueSystem';
import { makeTr, eventTypeLabel } from '../utils/tr';
import { sound } from '../utils/soundEffects';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  language?: Language;
  company?: { phone?: string; locationsAr?: string; locationsEn?: string };
}

export function InvoicePrintModal({ isOpen, onClose, booking, language = 'ar', company }: InvoicePrintModalProps) {
  const { isAr, tr, egp } = makeTr(language);
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
          className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-8 text-start my-4"
        >
          {/* Top Actions Bar (Hidden on print) */}
          <div className="print:hidden flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{tr('طباعة الفاتورة / إيصال رسمي', 'Print invoice')}</span>
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
                    {isAr ? 'السرايا للمناسبات' : 'SARAYA EVENTS'}
                  </h1>
                </div>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  {isAr ? 'SARAYA EVENTS · قاعات أفراح ومناسبات وإدارة فعاليات' : 'Wedding halls, events & event management'}
                </p>
                <p className="text-xs text-slate-500 print:text-gray-500 mt-0.5">
                  {(isAr ? company?.locationsAr : company?.locationsEn) || ''}{company?.phone ? ` · ${tr('هاتف', 'Phone')}: ${company.phone}` : ''}
                </p>
              </div>

              <div className="text-end font-mono">
                <span className="text-xs uppercase tracking-widest text-indigo-400 print:text-black font-bold block">
                  {tr('فاتورة حجز', 'Booking invoice')}{isAr ? ' (INVOICE)' : ''}
                </span>
                <span className="text-lg font-bold text-white print:text-black block mt-0.5">
                  #{booking.code}
                </span>
                <span className="text-xs text-slate-400 print:text-gray-600">
                  {tr('التاريخ', 'Date')}: {new Date().toISOString().split('T')[0]}
                </span>
              </div>
            </div>

            {/* Client & Event Info Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 mb-6 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-indigo-400 print:text-black block mb-1">
                  {tr('بيانات العميل', 'Client')}:
                </span>
                <div>{tr('اسم العميل', 'Name')}: <strong className="text-white print:text-black">{booking.clientName}</strong></div>
                <div>{tr('رقم الهاتف', 'Phone')}: <strong className="text-white print:text-black font-mono">{booking.clientPhone}</strong></div>
                {booking.clientAddress && <div>{tr('العنوان', 'Address')}: <span className="text-slate-300 print:text-gray-700">{booking.clientAddress}</span></div>}
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-indigo-400 print:text-black block mb-1">
                  {tr('تفاصيل المناسبة', 'Event')}:
                </span>
                <div>{tr('نوع المناسبة', 'Event type')}: <strong className="text-white print:text-black">{eventTypeLabel(booking.eventType, isAr)}</strong></div>
                <div>{tr('القاعة المحجوزة', 'Hall')}: <strong className="text-white print:text-black">{booking.hallName}</strong></div>
                <div>{tr('تاريخ المناسبة', 'Date')}: <strong className="text-white print:text-black font-mono">{booking.date}</strong> ({booking.startTime} - {booking.endTime})</div>
                <div>{tr('عدد المدعوين', 'Guests')}: <strong className="text-white print:text-black font-mono">{booking.guestCount} {tr('فرد', 'guests')}</strong></div>
              </div>
            </div>

            {/* Itemized Services Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 print:border-gray-300 text-slate-400 print:text-gray-700 font-semibold">
                    <th className="py-2.5 px-3">{tr('البند / الخدمة', 'Item / service')}</th>
                    <th className="py-2.5 px-3">{tr('الكمية', 'Qty')}</th>
                    <th className="py-2.5 px-3">{tr('سعر الوحدة', 'Unit price')}</th>
                    <th className="py-2.5 px-3 text-end">{tr('الإجمالي', 'Total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  <tr>
                    <td className="py-3 px-3">
                      <strong className="text-white print:text-black block">{tr('حجز القاعة الأساسي', 'Hall booking')} ({booking.hallName})</strong>
                      <span className="text-[11px] text-slate-400 print:text-gray-500">{tr('يشمل الاستخدام الكامل للمرافق والتكييف والخدمات الأساسية', 'Includes full use of facilities, air conditioning and basic services')}</span>
                    </td>
                    <td className="py-3 px-3 font-mono">1</td>
                    <td className="py-3 px-3 font-mono">{egp(booking.basePrice)}</td>
                    <td className="py-3 px-3 text-end font-mono font-bold text-white print:text-black">
                      {egp(booking.basePrice)}
                    </td>
                  </tr>

                  {booking.services.map((srv) => (
                    <tr key={srv.id}>
                      <td className="py-3 px-3">
                        <span className="text-slate-200 print:text-black font-medium">{srv.name}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{srv.quantity}</td>
                      <td className="py-3 px-3 font-mono">{egp(srv.unitPrice)}</td>
                      <td className="py-3 px-3 text-end font-mono font-bold text-white print:text-black">
                        {egp(srv.totalPrice)}
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
                  <span>{tr('تأمين القاعة', 'Hall security deposit')}: {egp(booking.securityDeposit)}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {tr('* مبلغ التأمين محتجز ومسترد بالكامل فور انتهاء المناسبة وسلامة أجهزة الصوت والإضاءة والديكورات.', '* The security deposit is fully refunded after the event once sound, lighting and decor are checked.')}
                </p>
              </div>

              {/* Tally Numbers */}
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300 print:text-gray-800">
                  <span>{tr('إجمالي قيمة الحجز', 'Booking total')}:</span>
                  <span className="font-mono font-bold">{egp(booking.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 print:text-green-700">
                  <span>{tr('المدفوع حتى الآن', 'Paid so far')}:</span>
                  <span className="font-mono font-bold">− {egp(booking.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-300 print:text-amber-800">
                  <span>{tr('التأمين (مسترد)', 'Security deposit (refundable)')}:</span>
                  <span className="font-mono font-bold">+ {egp(booking.securityDeposit)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white print:text-black pt-2 border-t border-slate-800 print:border-gray-400">
                  <span>{tr('المبلغ المتبقي للتحصيل', 'Balance due')}:</span>
                  <span className="font-mono text-base text-rose-400 print:text-black">
                    {egp(booking.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 print:border-gray-300 grid grid-cols-2 gap-8 text-center text-xs text-slate-400 print:text-black">
              <div>
                <span className="block mb-6 font-semibold">{tr('توقيع العميل المستلم', 'Client signature')}:</span>
                <div className="w-36 h-0.5 bg-slate-700 print:bg-black mx-auto" />
              </div>
              <div>
                <span className="block mb-6 font-semibold">{tr('ختم وتوقيع إدارة القاعات', 'Management stamp & signature')}:</span>
                <div className="w-36 h-0.5 bg-slate-700 print:bg-black mx-auto" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
