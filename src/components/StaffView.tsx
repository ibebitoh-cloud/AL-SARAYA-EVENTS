import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Plus,
  Phone,
  DollarSign,
  Award,
  CreditCard,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Employee, Booking } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface StaffViewProps {
  staff: Employee[];
  bookings: Booking[];
  onAddStaff: (newStaff: Employee) => void;
  onUpdateStaffAttendance: (staffId: string, status: Employee['attendanceStatus']) => void;
}

export function StaffView({
  staff,
  bookings,
  onAddStaff,
  onUpdateStaffAttendance,
}: StaffViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New staff form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('كابتن بوفيه وضيافة');
  const [baseSalary, setBaseSalary] = useState(7000);
  const [wagesType, setWagesType] = useState<Employee['wagesType']>('monthly');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.success();
    const newStaff: Employee = {
      id: `emp-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || '010XXXXXXXX',
      role: role.trim(),
      baseSalary: Number(baseSalary) || 5000,
      wagesType,
      loans: 0,
      bonuses: 0,
      eventsCount: 0,
      attendanceStatus: 'present',
    };

    onAddStaff(newStaff);
    setIsModalOpen(false);
    setName('');
  };

  return (
    <div className="w-full space-y-6 pb-20 text-right">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>فريق العمل والمشرفين والعمال</span>
          </h2>
          <p className="text-xs text-slate-400">
            بيانات الموظفين، الوظائف، الحضور والانصراف، الأجور، السلف، والحوافز
          </p>
        </div>

        <button
          onClick={() => {
            sound.click(650);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة موظف / فني جديد</span>
        </button>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((emp) => {
          const isPresent = emp.attendanceStatus === 'present';
          const netWages = emp.baseSalary + emp.bonuses - emp.loans;

          return (
            <div
              key={emp.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-md"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{emp.name}</h3>
                  <span className="text-xs text-indigo-400 block font-medium">{emp.role}</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{emp.phone}</span>
                  </div>
                </div>

                {/* Attendance Toggle Pill */}
                <button
                  onClick={() => {
                    sound.tick();
                    onUpdateStaffAttendance(
                      emp.id,
                      emp.attendanceStatus === 'present' ? 'absent' : 'present'
                    );
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    isPresent
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {isPresent ? 'حاضر اليوم' : 'غائب'}
                </button>
              </div>

              {/* Financial Ledger (Wages, Loans, Bonuses) */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">الأجر الأساسي</span>
                  <span className="font-bold text-white tabular-nums">
                    {emp.baseSalary.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">
                    {emp.wagesType === 'monthly' ? 'شهري' : 'للمناسبة'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">السلف</span>
                  <span className="font-bold text-rose-400 tabular-nums">
                    {emp.loans.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">مخصومة</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">الحوافز</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    +{emp.bonuses.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">مكافآت</span>
                </div>
              </div>

              {/* Net Wage & Events Participation */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  شارك في <strong className="text-white font-mono">{emp.eventsCount}</strong> مناسبة سابقة
                </span>
                <div className="font-mono text-left">
                  <span className="text-[10px] text-slate-500 block">صافي المستحق:</span>
                  <strong className="text-emerald-400 font-bold">{netWages.toLocaleString()} ج.م</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-right">
            <h3 className="text-base font-bold text-white mb-4">إضافة موظف / فني / مشرف</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الموظف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حسام الدين عبد الرحيم"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">المسمى الوظيفي</label>
                <input
                  type="text"
                  required
                  placeholder="مشرف قاعة / كابتن بوفيه / فني صوت / إضاءة"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الأجر الأساسي</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">طبيعة الأجر</label>
                  <select
                    value={wagesType}
                    onChange={(e) => setWagesType(e.target.value as Employee['wagesType'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="monthly">راتب شهري ثابت</option>
                    <option value="per_event">أجر باليومية / بالمناسبة</option>
                  </select>
                </div>
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  حفظ الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
