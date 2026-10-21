import { useState } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  Receipt,
  Plus,
  Shield,
  CreditCard,
  Banknote,
  Building,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { PaymentReceipt, Booking, Language } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface PaymentsLedgerViewProps {
  payments: PaymentReceipt[];
  bookings: Booking[];
  onAddPayment: (newPayment: PaymentReceipt) => void;
  onRefundSecurityDeposit: (bookingId: string) => void;
  language?: Language;
}

export function PaymentsLedgerView({
  payments,
  bookings,
  onAddPayment,
  onRefundSecurityDeposit,
  language = 'ar',
}: PaymentsLedgerViewProps) {
  const { tr, egp } = makeTr(language);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(bookings[0]?.id || '');
  const [amount, setAmount] = useState(10000);
  const [method, setMethod] = useState<PaymentReceipt['method']>('cash');
  const [type, setType] = useState<PaymentReceipt['type']>('installment');
  const [notes, setNotes] = useState('');

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  // Totals
  const totalCollected = payments
    .filter((p) => p.type !== 'security_refund')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.type === 'security_refund')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    sound.success();
    const newPayment: PaymentReceipt = {
      id: `rcp-${Date.now()}`,
      receiptNo: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingId: selectedBooking.id,
      bookingCode: selectedBooking.code,
      clientName: selectedBooking.clientName,
      amount: Number(amount) || 1000,
      date: new Date().toISOString().split('T')[0],
      method,
      type,
      notes: notes.trim(),
    };

    onAddPayment(newPayment);
    setIsModalOpen(false);
  };

  const getMethodBadge = (m: PaymentReceipt['method']) => {
    switch (m) {
      case 'cash':
        return { label: tr('نقداً كاش', 'Cash'), icon: Banknote, color: 'text-emerald-400 bg-emerald-500/10' };
      case 'card':
        return { label: tr('بطاقة فيزا', 'Card'), icon: CreditCard, color: 'text-indigo-400 bg-indigo-500/10' };
      case 'transfer':
        return { label: tr('تحويل بنكي', 'Bank transfer'), icon: Building, color: 'text-amber-400 bg-amber-500/10' };
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 text-start">
      {/* Top Banner & KPI summary */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>{tr('سجل المقبوضات والدفعات وسندات القبض', 'Receipts & payments')}</span>
          </h2>
          <p className="text-xs text-slate-400">{tr('إثبات العربونات، الدفعات المتعددة، وتتبع رد التأمينات للعملاء', 'Record deposits and instalments, and track security refunds')}</p>
        </div>

        <button
          onClick={() => {
            sound.click(650);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{tr('إصدار سند قبض / دفعة جديدة', 'New receipt')}</span>
        </button>
      </div>

      {/* Held Security Deposits Refund Station */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          <span>{tr('إدارة التأمينات المحتجزة وقسم رد التأمين', 'Held security deposits & refunds')}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bookings
            .filter((b) => b.securityDepositStatus === 'held' && b.securityDeposit > 0)
            .map((bk) => (
              <div
                key={bk.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{bk.clientName}</span>
                  <span className="text-[11px] text-slate-400">
                    {bk.code} · {bk.hallName}
                  </span>
                  <span className="font-mono text-amber-300 font-bold block mt-1">
                    {tr('التأمين', 'Security')}: {egp(bk.securityDeposit)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    sound.success();
                    onRefundSecurityDeposit(bk.id);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{tr('رد التأمين', 'Refund security')}</span>
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Receipts Ledger List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">{tr('سندات القبض المسجلة', 'Recorded receipts')}</h3>

        <div className="space-y-2">
          {payments.map((p) => {
            const methodInfo = getMethodBadge(p.method);
            const Icon = methodInfo.icon;
            const isRefund = p.type === 'security_refund';

            return (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-xs ${
                      isRefund ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {isRefund ? '−' : '+'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-bold">{p.receiptNo}</span>
                      <span className="font-bold text-white text-sm">{p.clientName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({p.bookingCode})</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {p.notes || (p.type === 'deposit' ? tr('عربون حجز', 'Booking deposit') : p.type === 'security_deposit' ? tr('تأمين قاعة', 'Hall security') : isRefund ? tr('رد تأمين', 'Security refund') : tr('دفعة من الحساب', 'Instalment'))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${methodInfo.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{methodInfo.label}</span>
                  </div>

                  <div className="text-end font-mono">
                    <span
                      className={`text-sm font-bold block tabular-nums ${
                        isRefund ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isRefund ? '− ' : '+ '}{egp(p.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500">{p.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-start">
            <h3 className="text-base font-bold text-white mb-4">{tr('إصدار سند قبض / دفعة نقدية', 'New receipt')}</h3>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('اختر الحجز أو العميل', 'Booking / client')}</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.clientName} ({tr('متبقي', 'due')}: {egp(b.remainingAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('المبلغ المحصل', 'Amount received')}</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('طريقة الدفع', 'Payment method')}</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentReceipt['method'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="cash">{tr('نقداً كاش', 'Cash')}</option>
                    <option value="card">{tr('بطاقة فيزا', 'Card')}</option>
                    <option value="transfer">{tr('تحويل بنكي', 'Bank transfer')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('نوع الحركة', 'Type')}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PaymentReceipt['type'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="installment">{tr('دفعة من الحساب', 'Instalment')}</option>
                  <option value="deposit">{tr('عربون حجز', 'Booking deposit')}</option>
                  <option value="security_deposit">{tr('مبلغ تأمين', 'Security deposit')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('ملاحظات الإيصال', 'Receipt notes')}</label>
                <input
                  type="text"
                  placeholder={tr('رقم الحوالة البنكية أو ملاحظة السداد', 'Transfer reference or payment note')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  {tr('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {tr('تسجيل السند', 'Save receipt')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
