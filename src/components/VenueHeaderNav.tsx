import { useState } from 'react';
import {
  LayoutDashboard, Calendar, Building, Ruler, Package, Utensils, Wallet, Images,
  ClipboardList, Users, FileText, CreditCard, Receipt, UserRound, MoreHorizontal,
  ChevronDown, CalendarDays, Settings2,
} from 'lucide-react';
import { VenueTab, Language } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import { DICTIONARY } from '../utils/i18n';
import { SystemUser } from '../data/systemProfiles';

interface VenueHeaderNavProps {
  currentTab: VenueTab;
  language: Language;
  user: SystemUser;
  onTabChange: (tab: VenueTab) => void;
  onToggleLanguage: () => void;
  onOpenTour: () => void;
  onOpenPhotoLibrary: () => void;
}

type NavItem = { id: VenueTab; label: string; icon: typeof LayoutDashboard };

export function VenueHeaderNav({
  currentTab,
  language,
  user,
  onTabChange,
  onToggleLanguage,
  onOpenPhotoLibrary,
}: VenueHeaderNavProps) {
  const isAr = language === 'ar';
  const t = DICTIONARY[language];
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: isAr ? 'الرئيسية' : 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: isAr ? 'الحجوزات' : 'Bookings', icon: Calendar },
    { id: 'agenda', label: isAr ? 'التقويم' : 'Calendar', icon: CalendarDays },
    { id: 'company', label: isAr ? 'ملف الشركة' : 'Company', icon: Building },
    { id: 'event_designer', label: isAr ? 'مصمم المناسبات' : 'Designer', icon: Ruler },
    { id: 'inventory', label: isAr ? 'المخزون' : 'Inventory', icon: Package },
    { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: Utensils },
    { id: 'finance', label: isAr ? 'المالية' : 'Finance', icon: Wallet },
    { id: 'floorplan', label: isAr ? 'مخطط القاعة' : 'Floor Plan', icon: Settings2 },
    { id: 'catering', label: isAr ? 'الضيافة' : 'Catering', icon: ClipboardList },
    { id: 'contracts', label: isAr ? 'العقود' : 'Contracts', icon: FileText },
    { id: 'clients', label: isAr ? 'العملاء' : 'Clients', icon: Users },
    { id: 'payments', label: isAr ? 'المدفوعات' : 'Payments', icon: CreditCard },
    { id: 'expenses', label: isAr ? 'المصروفات' : 'Expenses', icon: Receipt },
    { id: 'staff', label: isAr ? 'الموظفون' : 'Staff', icon: Users },
    { id: 'reports', label: isAr ? 'التقارير' : 'Reports', icon: ClipboardList },
  ];
  const desktopPrimary = navItems.slice(0, 8);
  const mobilePrimary = navItems.filter((item) => ['dashboard', 'bookings', 'agenda', 'inventory'].includes(item.id));
  const secondaryItems = navItems.filter((item) => !desktopPrimary.some((primary) => primary.id === item.id));

  const goTo = (tab: VenueTab) => {
    sound.swoosh();
    onTabChange(tab);
    setMoreOpen(false);
    setProfileOpen(false);
  };

  const ProfileDetails = () => (
    <div className="flex min-w-0 items-center gap-3 text-start" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/15 text-sm font-black text-amber-300">
        {(isAr ? user.nameAr : user.name).trim().slice(0, 1)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-black text-white">{isAr ? user.nameAr : user.name}</div>
        <div className="mt-0.5 truncate text-[11px] text-slate-400">{isAr ? user.roleAr : user.role}</div>
        <div className="mt-0.5 truncate text-[10px] text-slate-500">@{user.username}</div>
      </div>
    </div>
  );

  const SidebarItem = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = currentTab === item.id;
    return (
      <button key={item.id} type="button" onClick={() => goTo(item.id)} aria-current={active ? 'page' : undefined}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-xs font-semibold transition-colors ${active ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />}
      </button>
    );
  };

  return (
    <>
      {/* Fixed desktop side panel. Logical start places it on the right in Arabic and left in English. */}
      <aside className="fixed top-[72px] bottom-0 start-0 z-40 hidden w-60 flex-col border-e border-slate-800/90 bg-slate-950/98 shadow-xl backdrop-blur-xl lg:flex xl:w-64"
        aria-label={isAr ? 'التنقل الداخلي' : 'Internal navigation'}>
        <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
          <button type="button" onClick={() => goTo('dashboard')} className="mb-4 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-start">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950"><LayoutDashboard className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block truncate text-xs font-black tracking-[0.16em] text-white">SARAYA</span><span className="mt-1 block truncate text-[10px] text-slate-500">{isAr ? 'إدارة وتشغيل القاعات' : 'Venue Operations'}</span></span>
          </button>
          <button type="button" onClick={onOpenPhotoLibrary} title={isAr ? 'مكتبة الصور' : 'Photo library'} className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2.5 text-[11px] font-bold text-amber-300 hover:bg-slate-800"><Images className="h-4 w-4" />{isAr ? 'مكتبة الصور' : 'Photo Library'}</button>
          <div className="mb-2 mt-5 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">{isAr ? 'مساحات العمل' : 'WORKSPACE'}</div>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-3">
            {desktopPrimary.map((item) => <SidebarItem key={item.id} item={item} />)}
            <div className="my-3 border-t border-slate-800" />
            <div className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">{isAr ? 'المزيد من الشاشات' : 'MORE SCREENS'}</div>
            {secondaryItems.map((item) => <SidebarItem key={item.id} item={item} />)}
          </nav>
        </div>
        <div className="shrink-0 border-t border-slate-800 p-3">
          <button type="button" onClick={onToggleLanguage} className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"><span>{isAr ? 'لغة النظام' : 'Language'}</span><span className="text-amber-300">{isAr ? 'EN' : 'عربي'}</span></button>
          <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-start hover:border-amber-400/40">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-sm font-black text-amber-300">{(isAr ? user.nameAr : user.name).trim().slice(0, 1)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white">{isAr ? user.nameAr : user.name}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{isAr ? 'الملف الشخصي' : 'User profile'}</span></span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 p-3"><ProfileDetails /></div>}
        </div>
      </aside>

      {/* Mobile navigation stays compact and fixed; swipe gestures can change screens. */}
      <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-700/90 bg-slate-950/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl lg:hidden" aria-label={isAr ? 'التنقل الداخلي' : 'Internal navigation'}>
        <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
          {mobilePrimary.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return <button key={item.id} type="button" onClick={() => goTo(item.id)} aria-current={active ? 'page' : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[9px] font-bold ${active ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-900'}`}><Icon className="h-4 w-4 shrink-0" /><span className="max-w-full truncate">{item.label}</span></button>;
          })}
          <div className="relative">
            <button type="button" onClick={() => { setMoreOpen((open) => !open); setProfileOpen(false); }} aria-expanded={moreOpen} className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[9px] font-bold ${moreOpen || secondaryItems.some((item) => item.id === currentTab) ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-900'}`}><MoreHorizontal className="h-4 w-4" /><span>{isAr ? 'المزيد' : 'More'}</span></button>
            {moreOpen && <div className="absolute bottom-full end-0 mb-2 grid max-h-[60vh] min-w-44 gap-1 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">{secondaryItems.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => goTo(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-start text-xs ${currentTab === item.id ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</div>}
          </div>
          <div className="relative">
            <button type="button" onClick={() => { setProfileOpen((open) => !open); setMoreOpen(false); }} aria-expanded={profileOpen} className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[9px] font-bold ${profileOpen ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-900'}`}><UserRound className="h-4 w-4" /><span className="max-w-full truncate">{isAr ? 'حسابي' : 'Profile'}</span></button>
            {profileOpen && <div className="absolute bottom-full end-0 mb-2 w-64 rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-2xl"><ProfileDetails /></div>}
          </div>
        </div>
      </nav>
    </>
  );
}
