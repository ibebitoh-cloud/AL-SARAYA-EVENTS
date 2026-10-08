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
import { Expense, Booking } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface ExpensesViewProps {
  expenses: Expense[];
  bookings: Booking[];
  onAddExpense: (newExpense: Expense) => void;
}

export function ExpensesView({ expenses, bookings, onAddExpense }: ExpensesViewProps) {
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
    { id: 'all', label: 'جميع المصروفات' },
    { id: 'electricity', label: 'كهرباء' },
    { id: 'water', label: 'مياه' },
    { id: 'labor', label: 'عمالة' },
    { id: 'cleaning', label: 'نظافة' },
    { id: 'maintenance', label: 'صيانة' },
    { id: 'decor', label: 'ديكور وزهور' },
    { id: 'security', label: 'أمن وحراسة' },
    { id: 'sound_lighting', label: 'صوتيات وإضاءة' },
    { id: 'event_supplies', label: 'مشتريات المناسبات' },
    { id: 'marketing', label: 'تسويق وإعلانات' },
    { id: 'rent', label: 'إيجار' },
    { id: 'operational', label: 'تشغيلية وإدارية' },
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
      paidTo: paidTo.trim() || 'جهة خارجية',
      bookingId: bookingId || undefined,
      bookingCode: selectedBk?.code,
      notes: notes.trim(),
    };

    onAddExpense(newExpense);
    setIsModalOpen(false);
    setTitle('');
  };

  return (
    <div className="w-full space-y-6 pb-20 text-right">
      {/* Top Banner & Summary */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-400" />
            <span>سجل المصروفات العامة والتشغيلية</span>
          </h2>
          <p className="text-xs text-slate-400">
            تتبع فواتير الكهرباء، المياه، الصيانة، الأجور، ومشتريات المناسبات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">إجمالي المصروفات: </span>
            <strong className="text-rose-400">{totalAmount.toLocaleString()} ج.م</strong>
          </div>

          <button
            onClick={() => {
              sound.click(650);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل مصروف جديد</span>
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
                    حجز: {exp.bookingCode}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                الجهة المستلمة: <strong className="text-slate-300">{exp.paidTo}</strong> · {exp.notes}
              </div>
            </div>

            <div className="text-left font-mono">
              <span className="text-base font-bold text-rose-400 block tabular-nums">
                {exp.amount.toLocaleString()} ج.م
              </span>
              <span className="text-[10px] text-slate-500">{exp.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-right">
            <h3 className="text-base font-bold text-white mb-4">تسجيل مصروف أو فاتورة جديدة</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">بيان المصروف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة صيانة دورية للمولد الكهربائي"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">بند المصروف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Expense['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="electricity">كهرباء</option>
                    <option value="water">مياه</option>
                    <option value="labor">عمالة</option>
                    <option value="cleaning">نظافة</option>
                    <option value="maintenance">صيانة</option>
                    <option value="decor">ديكور وزهور</option>
                    <option value="security">أمن وحراسة</option>
                    <option value="sound_lighting">صوتيات وإضاءة</option>
                    <option value="event_supplies">مشتريات المناسبات</option>
                    <option value="marketing">تسويق وإعلانات</option>
                    <option value="rent">إيجار</option>
                    <option value="operational">تشغيلية وإدارية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المبلغ (ج.م)</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">المدفوع له / اسم المورد</label>
                <input
                  type="text"
                  placeholder="شركة الكهرباء / فني الصيانة / المشتل"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ربط بمناسبة محددة (اختياري)</label>
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="">مصروف عام للمنشأة (غير مخصص)</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.clientName} ({b.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظات إضافية</label>
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
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
