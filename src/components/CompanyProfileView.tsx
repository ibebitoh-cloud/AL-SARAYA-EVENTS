import { Building2, CalendarDays, Users, BriefcaseBusiness, Package, WalletCards, ReceiptText, BarChart3, ShieldCheck } from 'lucide-react';
import { Booking, Employee, Expense, Hall, InventoryItem, PaymentReceipt, ServiceDefinition, Language } from '../types/venueSystem';
import { SYSTEM_USERS } from '../data/systemProfiles';

interface Props {
  language: Language;
  halls: Hall[];
  bookings: Booking[];
  services: ServiceDefinition[];
  clients: { id: string; name: string }[];
  staff: Employee[];
  inventory: InventoryItem[];
  payments: PaymentReceipt[];
  expenses: Expense[];
}

export function CompanyProfileView({ language, halls, bookings, services, clients, staff, inventory, payments, expenses }: Props) {
  const ar = language === 'ar';
  const stats = [
    [Building2, ar ? 'القاعات' : 'Halls', halls.length],
    [CalendarDays, ar ? 'الحجوزات' : 'Bookings', bookings.length],
    [Users, ar ? 'العملاء' : 'Clients', clients.length],
    [BriefcaseBusiness, ar ? 'الخدمات' : 'Services', services.length],
    [Users, ar ? 'الموظفون' : 'Staff', staff.length],
    [Package, ar ? 'المخزون' : 'Inventory', inventory.length],
    [WalletCards, ar ? 'الإيصالات' : 'Receipts', payments.length],
    [ReceiptText, ar ? 'المصروفات' : 'Expenses', expenses.length],
  ];
  return (
    <div className="w-full space-y-5 pb-20">
      <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em]"><ShieldCheck className="w-4 h-4" /> {ar ? 'الملف الرسمي للشركة' : 'Official Company Profile'}</div>
            <h1 className="mt-2 text-3xl font-black text-white">{ar ? 'السرايا للمناسبات' : 'SARAYA EVENT'}</h1>
            <p className="mt-1 text-sm text-slate-400">{ar ? 'إدارة قاعات الأفراح والمناسبات والخدمات من نظام مركزي واحد' : 'Centralized management of halls, events and services from one system.'}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-300">
            {ar ? 'الملف مرتبط ببيانات النظام الحالية' : 'Linked to live system data'}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(([Icon, label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><Icon className="w-4 h-4 text-amber-400 mb-2" /><div className="text-[10px] text-slate-500">{label as string}</div><div className="mt-1 text-xl font-black text-white">{value as number}</div></div>)}
        </div>
      </section>
      <section className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-base font-black text-white">{ar ? 'بيانات الشركة' : 'Company Details'}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'الاسم التجاري' : 'Trade Name'}</span><strong className="text-white">SARAYA EVENT</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'النشاط' : 'Business'}</span><strong className="text-white">{ar ? 'قاعات أفراح ومناسبات وإدارة فعاليات' : 'Wedding halls, events & event management'}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'المواقع' : 'Locations'}</span><strong className="text-white">{ar ? 'القاهرة الجديدة · الإسكندرية' : 'New Cairo · Alexandria'}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'الهاتف' : 'Hotline'}</span><strong className="text-white">+20 2 2795 0000</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'واتساب' : 'WhatsApp'}</span><strong className="text-white">+20 100 123 4567</strong></div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-base font-black text-white">{ar ? 'مستخدمي النظام' : 'System Users'}</h2>
          <div className="mt-4 space-y-2">{SYSTEM_USERS.map(u => <div key={u.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3"><div><div className="text-sm font-bold text-white">{ar ? u.nameAr : u.name}</div><div className="text-[10px] text-slate-500">{ar ? u.roleAr : u.role}</div></div><span className="text-[9px] font-bold text-emerald-400">{ar ? 'نشط' : 'ACTIVE'}</span></div>)}</div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-400" /><h2 className="text-base font-black text-white">{ar ? 'مركز معلومات الشركة' : 'Company Information Hub'}</h2></div>
        <p className="mt-2 text-xs text-slate-500">{ar ? 'كل مؤشرات الشركة هنا مرتبطة مباشرة بالحجوزات والقاعات والعملاء والخدمات والموظفين والمخزون والإيصالات والمصروفات والتقارير.' : 'Company indicators are connected directly to bookings, halls, clients, services, staff, inventory, receipts, expenses and reports.'}</p>
      </section>
    </div>
  );
}
