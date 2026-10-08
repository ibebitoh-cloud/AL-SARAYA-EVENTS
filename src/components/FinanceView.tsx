import { Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { Booking, Expense, PaymentReceipt } from '../types/venueSystem';
import { PaymentsLedgerView } from './PaymentsLedgerView';
import { ExpensesView } from './ExpensesView';

interface FinanceViewProps {
  payments: PaymentReceipt[];
  expenses: Expense[];
  bookings: Booking[];
  onAddPayment: (payment: PaymentReceipt) => void;
  onRefundSecurityDeposit: (bookingId: string) => void;
  onAddExpense: (expense: Expense) => void;
}

export function FinanceView({ payments, expenses, bookings, onAddPayment, onRefundSecurityDeposit, onAddExpense }: FinanceViewProps) {
  const collected = payments.filter((p) => p.type !== 'security_refund').reduce((sum, p) => sum + p.amount, 0);
  const refunds = payments.filter((p) => p.type === 'security_refund').reduce((sum, p) => sum + p.amount, 0);
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const money = (value: number) => `${value.toLocaleString()} ج.م`;

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-400/10 p-3 text-amber-300"><Wallet className="h-5 w-5" /></div>
          <div><h1 className="text-lg font-black text-white">الإدارة المالية</h1><p className="text-xs text-slate-400">المقبوضات والمصروفات والتأمينات في شاشة واحدة</p></div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex items-center gap-2 text-xs text-emerald-300"><TrendingUp className="h-4 w-4" /> إجمالي المقبوضات</div><div className="mt-2 text-xl font-black text-white">{money(collected)}</div></div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><div className="flex items-center gap-2 text-xs text-rose-300"><TrendingDown className="h-4 w-4" /> إجمالي المصروفات</div><div className="mt-2 text-xl font-black text-white">{money(spent)}</div></div>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4"><div className="flex items-center gap-2 text-xs text-indigo-300"><Receipt className="h-4 w-4" /> صافي الحركة النقدية</div><div className="mt-2 text-xl font-black text-white">{money(collected - refunds - spent)}</div><div className="mt-1 text-[10px] text-slate-500">بعد خصم رد التأمينات المسجلة: {money(refunds)}</div></div>
        </div>
      </div>
      <PaymentsLedgerView payments={payments} bookings={bookings} onAddPayment={onAddPayment} onRefundSecurityDeposit={onRefundSecurityDeposit} />
      <ExpensesView expenses={expenses} bookings={bookings} onAddExpense={onAddExpense} />
    </div>
  );
}
