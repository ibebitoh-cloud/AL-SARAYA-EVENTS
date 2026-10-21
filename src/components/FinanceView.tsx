import { Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { Booking, Expense, Language, PaymentReceipt } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { PaymentsLedgerView } from './PaymentsLedgerView';
import { ExpensesView } from './ExpensesView';

interface FinanceViewProps {
  payments: PaymentReceipt[];
  expenses: Expense[];
  bookings: Booking[];
  onAddPayment: (payment: PaymentReceipt) => void;
  onRefundSecurityDeposit: (bookingId: string) => void;
  onAddExpense: (expense: Expense) => void;
  language?: Language;
}

export function FinanceView({ payments, expenses, bookings, onAddPayment, onRefundSecurityDeposit, onAddExpense, language = 'ar' }: FinanceViewProps) {
  const { tr, egp: money } = makeTr(language);
  const collected = payments.filter((p) => p.type !== 'security_refund').reduce((sum, p) => sum + p.amount, 0);
  const refunds = payments.filter((p) => p.type === 'security_refund').reduce((sum, p) => sum + p.amount, 0);
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-400/10 p-3 text-amber-300"><Wallet className="h-5 w-5" /></div>
          <div><h1 className="text-lg font-black text-white">{tr('الإدارة المالية', 'Finance')}</h1><p className="text-xs text-slate-400">{tr('المقبوضات والمصروفات والتأمينات في شاشة واحدة', 'Receipts, expenses and security deposits in one place')}</p></div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex items-center gap-2 text-xs text-emerald-300"><TrendingUp className="h-4 w-4" /> {tr('إجمالي المقبوضات', 'Total received')}</div><div className="mt-2 text-xl font-black text-white">{money(collected)}</div></div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><div className="flex items-center gap-2 text-xs text-rose-300"><TrendingDown className="h-4 w-4" /> {tr('إجمالي المصروفات', 'Total expenses')}</div><div className="mt-2 text-xl font-black text-white">{money(spent)}</div></div>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4"><div className="flex items-center gap-2 text-xs text-indigo-300"><Receipt className="h-4 w-4" /> {tr('صافي الحركة النقدية', 'Net cash flow')}</div><div className="mt-2 text-xl font-black text-white">{money(collected - refunds - spent)}</div><div className="mt-1 text-[10px] text-slate-500">{tr('بعد خصم التأمينات المردودة', 'After security refunds of')}: {money(refunds)}</div></div>
        </div>
      </div>
      <PaymentsLedgerView payments={payments} bookings={bookings} onAddPayment={onAddPayment} onRefundSecurityDeposit={onRefundSecurityDeposit} language={language} />
      <ExpensesView expenses={expenses} bookings={bookings} onAddExpense={onAddExpense} language={language} />
    </div>
  );
}
