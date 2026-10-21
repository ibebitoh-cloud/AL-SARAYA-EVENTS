import { useState } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Zap,
  Droplet,
  Users,
  Sparkles,
  Wrench,
  Shield,
  Volume2,
  ShoppingBag,
  Megaphone,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, Booking, Language } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { sound } from '../utils/soundEffects';

interface ExpensesViewProps {
  expenses: Expense[];
  bookings: Booking[];
  onAddExpense: (newExpense: Expense) => void;
  language?: Language;
}

export function ExpensesView({ expenses, bookings, onAddExpense, language = 'ar' }: ExpensesViewProps) {
  const { tr, egp } = makeTr(language);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New expense form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('electricity');
  const [amount, setAmount] = useState(1500);
  const [paidTo, setPaidTo] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [notes, setNotes] = useState('');

  const categories = [
    { id: 'all', label: tr('جميع المصروفات', 'All expenses') },
    { id: 'electricity', label: tr('كهرباء', 'Electricity') },
    { id: 'water', label: tr('مياه', 'Water') },
    { id: 'labor', label: tr('عمالة', 'Labour') },
    { id: 'cleaning', label: tr('نظافة', 'Cleaning') },
    { id: 'maintenance', label: tr('صيانة', 'Maintenance') },
    { id: 'decor', label: tr('ديكور وزهور', 'Decor & flowers') },
    { id: 'security', label: tr('أمن وحراسة', 'Security') },
    { id: 'sound_lighting', label: tr('صوتيات وإضاءة', 'Sound & lighting') },
    { id: 'event_supplies', label: tr('مشتريات المناسبات', 'Event supplies') },
    { id: 'marketing', label: tr('تسويق وإعلانات', 'Marketing') },
    { id: 'rent', label: tr('إيجار', 'Rent') },
    { id: 'operational', label: tr('تشغيلية وإدارية', 'Operations & admin') },
  ];

  const filteredExpenses = expenses.filter(
    (e) => selectedCategory === 'all' || e.category === selectedCategory
  );

  const totalAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    sound.success();
    const selectedBk = bookings.find((b) => b.id === bookingId);
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      category,
      amount: Number(amount) || 0,
      date: new Date().toISOString().split('T')[0],
      paidTo: paidTo.trim() || tr('جهة خارجية', 'External party'),
      bookingId: bookingId || undefined,
      bookingCode: selectedBk?.code,
      notes: notes.trim(),
    };

    onAddExpense(newExpense);
    setIsModalOpen(false);
    setTitle('');
  };

  return (
    <div className="w-full space-y-6 pb-20 text-start">
      {/* Top Banner & Summary */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-400" />
            <span>{tr('سجل المصروفات العامة والتشغيلية', 'Expenses')}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {tr('تتبع فواتير الكهرباء، المياه، الصيانة، الأجور، ومشتريات المناسبات', 'Track utility bills, maintenance, wages and event supplies')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">{tr('إجمالي المصروفات', 'Total expenses')}: </span>
            <strong className="text-rose-400">{egp(totalAmount)}</strong>
          </div>

          <button
            onClick={() => {
              sound.click(650);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr('تسجيل مصروف جديد', 'New expense')}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              sound.click(500);
              setSelectedCategory(cat.id);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="space-y-2">
        {filteredExpenses.map((exp) => (
          <div
            key={exp.id}
            className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{exp.title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                  {categories.find((c) => c.id === exp.category)?.label || exp.category}
                </span>
                {exp.bookingCode && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 font-mono">
                    {tr('حجز', 'Booking')}: {exp.bookingCode}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {tr('الجهة المستلمة', 'Paid to')}: <strong className="text-slate-300">{exp.paidTo}</strong> · {exp.notes}
              </div>
            </div>

            <div className="text-end font-mono">
              <span className="text-base font-bold text-rose-400 block tabular-nums">
                {egp(exp.amount)}
              </span>
              <span className="text-[10px] text-slate-500">{exp.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-start">
            <h3 className="text-base font-bold text-white mb-4">{tr('تسجيل مصروف أو فاتورة جديدة', 'New expense or bill')}</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('بيان المصروف', 'Description')}</label>
                <input
                  type="text"
                  required
                  placeholder={tr('مثال: فاتورة صيانة دورية للمولد الكهربائي', 'e.g. Generator maintenance bill')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('بند المصروف', 'Category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Expense['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="electricity">{tr('كهرباء', 'Electricity')}</option>
                    <option value="water">{tr('مياه', 'Water')}</option>
                    <option value="labor">{tr('عمالة', 'Labour')}</option>
                    <option value="cleaning">{tr('نظافة', 'Cleaning')}</option>
                    <option value="maintenance">{tr('صيانة', 'Maintenance')}</option>
                    <option value="decor">{tr('ديكور وزهور', 'Decor & flowers')}</option>
                    <option value="security">{tr('أمن وحراسة', 'Security')}</option>
                    <option value="sound_lighting">{tr('صوتيات وإضاءة', 'Sound & lighting')}</option>
                    <option value="event_supplies">{tr('مشتريات المناسبات', 'Event supplies')}</option>
                    <option value="marketing">{tr('تسويق وإعلانات', 'Marketing')}</option>
                    <option value="rent">{tr('إيجار', 'Rent')}</option>
                    <option value="operational">{tr('تشغيلية وإدارية', 'Operations & admin')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('المبلغ (ج.م)', 'Amount (EGP)')}</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('المدفوع له / اسم المورد', 'Paid to / supplier')}</label>
                <input
                  type="text"
                  placeholder={tr('شركة الكهرباء / فني الصيانة / المشتل', 'Electricity company / technician / nursery')}
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('ربط بمناسبة محددة (اختياري)', 'Link to an event (optional)')}</label>
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="">{tr('مصروف عام للمنشأة (غير مخصص)', 'General venue expense (not linked)')}</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.clientName} ({b.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('ملاحظات إضافية', 'Notes')}</label>
                <input
                  type="text"
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  {tr('حفظ المصروف', 'Save expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
