import { useState } from 'react';
import { Building2, CalendarDays, Users, BriefcaseBusiness, Package, WalletCards, ReceiptText, BarChart3, ShieldCheck, Pencil, Upload, Image as ImageIcon, Save, X } from 'lucide-react';
import { Booking, Employee, Expense, Hall, InventoryItem, PaymentReceipt, ServiceDefinition, Language } from '../types/venueSystem';
import { SYSTEM_USERS } from '../data/systemProfiles';
import { EventLayoutDesigner } from './EventLayoutDesigner';
import { Hall3DProfile } from '../types/venueSystem';
import blackLogo from '../assets/images/logo/Company LOGO - black versoin.png';
import whiteLogo from '../assets/images/logo/Company LOGO - white version.png';

interface CompanyProfile {
  nameEn: string; nameAr: string; taglineEn: string; taglineAr: string;
  businessEn: string; businessAr: string; locationsEn: string; locationsAr: string;
  phone: string; whatsapp: string; instagramUrl: string; tiktokUrl: string; logo: 'black' | 'white';
}
interface Props {
  language: Language; halls: Hall[]; bookings: Booking[]; services: ServiceDefinition[];
  clients: { id: string; name: string }[]; staff: Employee[]; inventory: InventoryItem[];
  payments: PaymentReceipt[]; expenses: Expense[]; companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void; onUpdateHall: (hall: Hall) => void;
}
export function CompanyProfileView({ language, halls, bookings, services, clients, staff, inventory, payments, expenses, companyProfile, onUpdateCompanyProfile, onUpdateHall }: Props) {
  const ar = language === 'ar';
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [draftCompany, setDraftCompany] = useState(companyProfile);
  const [draftHall, setDraftHall] = useState<Hall | null>(null);
  const [editing3DHall, setEditing3DHall] = useState<Hall | null>(null);
  const stats = [
    [Building2, ar ? 'القاعات' : 'Halls', halls.length], [CalendarDays, ar ? 'الحجوزات' : 'Bookings', bookings.length],
    [Users, ar ? 'العملاء' : 'Clients', clients.length], [BriefcaseBusiness, ar ? 'الخدمات' : 'Services', services.length],
    [Users, ar ? 'الموظفون' : 'Staff', staff.length], [Package, ar ? 'المخزون' : 'Inventory', inventory.length],
    [WalletCards, ar ? 'الإيصالات' : 'Receipts', payments.length], [ReceiptText, ar ? 'المصروفات' : 'Expenses', expenses.length],
  ];
  const openCompanyEditor = () => { setDraftCompany(companyProfile); setEditingCompany(true); };
  const openHallEditor = (hall: Hall) => { setDraftHall({ ...hall }); setEditingHall(hall); };
  const saveHall = () => { if (!draftHall) return; onUpdateHall(draftHall); setEditingHall(null); };
  const saveCompany = () => { onUpdateCompanyProfile(draftCompany); setEditingCompany(false); };
  const default3D = (hall: Hall): Hall3DProfile => {
    const width = hall.areaSqMeters && hall.areaSqMeters > 0 ? Math.max(10, Math.round(Math.sqrt(hall.areaSqMeters * 0.66))) : 20;
    const depth = hall.areaSqMeters && hall.areaSqMeters > 0 ? Math.max(10, Math.round(hall.areaSqMeters / width)) : 30;
    const tables = Math.max(4, Math.ceil(hall.capacity / 10));
    const items = [
      { id: 'stage-1', type: 'stage', labelEn: 'Stage', labelAr: 'منصة', x: 50, y: 12, rotation: 0 },
      { id: 'screen-1', type: 'screen', labelEn: 'LED Screen', labelAr: 'شاشة LED', x: 50, y: 6, rotation: 0 },
      { id: 'dance-1', type: 'dance', labelEn: 'Dance Floor', labelAr: 'منصة رقص', x: 50, y: 58, rotation: 0 },
      ...Array.from({ length: Math.min(tables, 12) }, (_, i) => ({ id: `table-${i + 1}`, type: 'table', labelEn: 'Round Table', labelAr: 'طاولة دائرية', x: 20 + (i % 4) * 20, y: 30 + Math.floor(i / 4) * 22, rotation: 0, seats: 10 })),
    ];
    return { width, depth, items };
  };
  const hallDesign = (hall: Hall) => hall.default3D ?? default3D(hall);

  const readPhoto = (file: File) => {
    if (!draftHall || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setDraftHall({ ...draftHall, photoUrl: String(reader.result), photo: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const logoSrc = companyProfile.logo === 'white' ? whiteLogo : blackLogo;
  return (
    <div className="w-full space-y-5 pb-20">
      <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3"><img src={logoSrc} alt="SARAYA EVENT logo" className="h-16 w-32 object-contain" /></div>
            <div><div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em]"><ShieldCheck className="w-4 h-4" /> {ar ? 'الملف الرسمي للشركة' : 'Official Company Profile'}</div><h1 className="mt-2 text-3xl font-black text-white">{ar ? companyProfile.nameAr : companyProfile.nameEn}</h1><p className="mt-1 text-sm text-slate-400">{ar ? companyProfile.taglineAr : companyProfile.taglineEn}</p></div>
          </div>
          <button type="button" onClick={openCompanyEditor} className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-300 flex items-center gap-2"><Pencil className="w-3.5 h-3.5" />{ar ? 'تعديل ملف الشركة' : 'Edit Company Profile'}</button>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">{stats.map(([Icon, label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><Icon className="w-4 h-4 text-amber-400 mb-2" /><div className="text-[10px] text-slate-500">{label as string}</div><div className="mt-1 text-xl font-black text-white">{value as number}</div></div>)}</div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-black text-white">{ar ? 'ملفات القاعات' : 'Hall Profiles'}</h2><p className="mt-1 text-xs text-slate-500">{ar ? 'عدّل اسم كل قاعة وصورتها ووصفها وسعتها من هنا.' : 'Edit each hall name, photo, description and capacity from here.'}</p></div><span className="text-[10px] text-slate-500">{halls.length} {ar ? 'قاعات' : 'halls'}</span></div>
        <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {halls.map((hall) => <div key={hall.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
            <div className="h-32 bg-slate-900">{hall.photoUrl || hall.photo ? <img src={hall.photoUrl || hall.photo} alt={hall.nameEn || hall.name} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-slate-600"><ImageIcon className="w-8 h-8" /></div>}</div>
            <div className="p-3"><div className="text-sm font-black text-white">{ar ? hall.name : (hall.nameEn || hall.name)}</div><div className="mt-1 text-[10px] text-slate-500">{hall.capacity} {ar ? 'ضيف' : 'guests'}</div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => openHallEditor(hall)} className="rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs font-bold text-slate-200 flex items-center justify-center gap-2"><Pencil className="w-3.5 h-3.5" />{ar ? 'تعديل' : 'Edit'}</button><button type="button" onClick={() => setEditing3DHall(hall)} className="rounded-lg border border-amber-500/30 bg-amber-400/10 py-2 text-xs font-bold text-amber-300 flex items-center justify-center gap-2">3D</button></div></div>
          </div>)}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="text-base font-black text-white">{ar ? 'بيانات الشركة' : 'Company Details'}</h2><div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'النشاط' : 'Business'}</span><strong className="text-white">{ar ? companyProfile.businessAr : companyProfile.businessEn}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'المواقع' : 'Locations'}</span><strong className="text-white">{ar ? companyProfile.locationsAr : companyProfile.locationsEn}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'الهاتف' : 'Hotline'}</span><strong className="text-white">{companyProfile.phone}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-slate-500">{ar ? 'واتساب' : 'WhatsApp'}</span><strong className="text-white">{companyProfile.whatsapp}</strong></div>
        </div></div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="text-base font-black text-white">{ar ? 'مستخدمي النظام' : 'System Users'}</h2><div className="mt-4 space-y-2">{SYSTEM_USERS.map(u => <div key={u.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3"><div><div className="text-sm font-bold text-white">{ar ? u.nameAr : u.name}</div><div className="text-[10px] text-slate-500">{ar ? u.roleAr : u.role}</div></div><span className="text-[9px] font-bold text-emerald-400">{ar ? 'نشط' : 'ACTIVE'}</span></div>)}</div></div>
      </section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-400" /><h2 className="text-base font-black text-white">{ar ? 'مركز معلومات الشركة' : 'Company Information Hub'}</h2></div><p className="mt-2 text-xs text-slate-500">{ar ? 'كل المؤشرات مرتبطة مباشرة ببيانات النظام الحالية. تعديلات القاعات وملف الشركة تنعكس على هذا النظام في نفس المتصفح.' : 'All indicators are linked to live system data. Hall and company profile edits are reflected across this system in the same browser.'}</p></section>

      {editingCompany && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setEditingCompany(false)}><div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-black text-white">{ar ? 'تعديل ملف الشركة' : 'Edit Company Profile'}</h2><button type="button" onClick={() => setEditingCompany(false)} className="p-2 rounded-lg bg-slate-800"><X className="w-4 h-4" /></button></div>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">{[
          ['nameEn','Company Name (EN)'],['nameAr','اسم الشركة'],['taglineEn','Tagline (EN)'],['taglineAr','الوصف المختصر بالعربي'],['businessEn','Business (EN)'],['businessAr','النشاط بالعربي'],['locationsEn','Locations (EN)'],['locationsAr','المواقع بالعربي'],['phone','Phone'],['whatsapp','WhatsApp'],['instagramUrl','Instagram profile URL'],['tiktokUrl','TikTok profile URL']
        ].map(([key,label]) => <label key={key} className="text-xs text-slate-400">{label}<input value={draftCompany[key as keyof CompanyProfile] as string} onChange={(e) => setDraftCompany({ ...draftCompany, [key]: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>)}</div>
        <label className="mt-3 flex items-center gap-3 text-xs text-slate-300"><input type="checkbox" checked={draftCompany.logo === 'white'} onChange={(e) => setDraftCompany({ ...draftCompany, logo: e.target.checked ? 'white' : 'black' })} />{ar ? 'استخدام اللوجو الأبيض' : 'Use white logo'}</label>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditingCompany(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white">{ar ? 'إلغاء' : 'Cancel'}</button><button type="button" onClick={saveCompany} className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2"><Save className="w-3.5 h-3.5" />{ar ? 'حفظ' : 'Save'}</button></div>
      </div></div>}

      {editingHall && draftHall && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setEditingHall(null)}><div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-black text-white">{ar ? 'تعديل ملف القاعة' : 'Edit Hall Profile'}</h2><button type="button" onClick={() => setEditingHall(null)} className="p-2 rounded-lg bg-slate-800"><X className="w-4 h-4" /></button></div>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-slate-400">{ar ? 'اسم القاعة' : 'Hall Name (AR)'}<input value={draftHall.name} onChange={(e) => setDraftHall({ ...draftHall, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
          <label className="text-xs text-slate-400">Hall Name (EN)<input value={draftHall.nameEn || ''} onChange={(e) => setDraftHall({ ...draftHall, nameEn: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
          <label className="text-xs text-slate-400">{ar ? 'السعة' : 'Capacity'}<input type="number" min={1} value={draftHall.capacity} onChange={(e) => setDraftHall({ ...draftHall, capacity: Math.max(1, Number(e.target.value) || 1) })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
          <label className="text-xs text-slate-400">{ar ? 'مساحة القاعة م²' : 'Area m²'}<input type="number" min={0} value={draftHall.areaSqMeters || 0} onChange={(e) => setDraftHall({ ...draftHall, areaSqMeters: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
          <label className="text-xs text-slate-400 sm:col-span-2">{ar ? 'وصف القاعة بالعربي' : 'Description AR'}<textarea value={draftHall.description || ''} onChange={(e) => setDraftHall({ ...draftHall, description: e.target.value })} className="mt-1 w-full min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
          <label className="text-xs text-slate-400 sm:col-span-2">Description EN<textarea value={draftHall.descriptionEn || ''} onChange={(e) => setDraftHall({ ...draftHall, descriptionEn: e.target.value })} className="mt-1 w-full min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
          <label className="text-xs text-slate-400 sm:col-span-2">Photo URL<input value={draftHall.photoUrl || ''} onChange={(e) => setDraftHall({ ...draftHall, photoUrl: e.target.value, photo: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
        </div>
        <label className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-xs text-slate-400 cursor-pointer"><Upload className="w-4 h-4" />{ar ? 'أو ارفع صورة من الجهاز' : 'Or upload a photo from your device'}<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f=e.target.files?.[0]; if (f) readPhoto(f); }} /></label>
        <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-44">{draftHall.photoUrl || draftHall.photo ? <img src={draftHall.photoUrl || draftHall.photo} alt="Hall preview" className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-slate-600">{ar ? 'لا توجد صورة' : 'No photo'}</div>}</div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditingHall(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white">{ar ? 'إلغاء' : 'Cancel'}</button><button type="button" onClick={saveHall} className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2"><Save className="w-3.5 h-3.5" />{ar ? 'حفظ القاعة' : 'Save Hall'}</button></div>
      </div></div>}
      {editing3DHall && <div className="fixed inset-0 z-[90] bg-slate-950 p-2 sm:p-4 overflow-auto"><div className="mx-auto max-w-7xl"><div className="mb-2 flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-wider text-amber-400">3D HALL PROFILE</div><div className="text-lg font-black text-white">{ar ? editing3DHall.name : (editing3DHall.nameEn || editing3DHall.name)}</div></div><button type="button" onClick={() => setEditing3DHall(null)} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white">{ar ? 'إغلاق' : 'Close'}</button></div><EventLayoutDesigner language={language} initialDesign={hallDesign(editing3DHall)} onClose={() => setEditing3DHall(null)} onSaveDesign={(design) => { onUpdateHall({ ...editing3DHall, default3D: design }); setEditing3DHall({ ...editing3DHall, default3D: design }); }} /></div></div>}    </div>
  );
}
