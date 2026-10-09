import { useState } from 'react';
import {
  LayoutDashboard, Calendar, Building, Ruler, Package, Utensils, Wallet, Images,
  ClipboardList, Users, FileText, CreditCard, Receipt, UserRound, MoreHorizontal,
  CalendarDays, Settings2, X, ChevronRight,
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
}

type NavItem = { id: VenueTab; label: string; icon: typeof LayoutDashboard };

export function VenueHeaderNav({ currentTab, language, user, onTabChange, onToggleLanguage, onOpenTour }: VenueHeaderNavProps) {
  const isAr = language === 'ar';
  const t = DICTIONARY[language];
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: isAr ? 'الحجوزات' : 'Bookings', icon: Calendar },
    { id: 'agenda', label: isAr ? 'التقويم' : 'Calendar', icon: CalendarDays },
    { id: 'photo_library', label: isAr ? 'مكتبة الصور' : 'Photo Library', icon: Images },
    { id: 'inventory', label: isAr ? 'المخزون' : 'Inventory', icon: Package },
    { id: 'company', label: isAr ? 'ملف الشركة' : 'Company', icon: Building },
    { id: 'event_designer', label: isAr ? 'مصمم المناسبات' : 'Event Designer', icon: Ruler },
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

  const mobilePrimary = navItems.filter((item) => ['dashboard', 'bookings', 'agenda', 'photo_library'].includes(item.id));
  const secondaryItems = navItems.filter((item) => !mobilePrimary.some((primary) => primary.id === item.id));
  const goTo = (tab: VenueTab) => {
    sound.swoosh();
    onTabChange(tab);
    setMoreOpen(false);
    setProfileOpen(false);
  };
  const displayName = (isAr ? user.nameAr : user.name) || user.username;
  const displayRole = (isAr ? user.roleAr : user.role) || (isAr ? 'مستخدم النظام' : 'System user');

  const ProfileDetails = () => (
    <div className="flex items-center gap-3 text-start" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/15 text-sm font-black text-amber-300">{displayName.trim().slice(0, 1)}</div>
      <div className="min-w-0"><div className="truncate text-sm font-black text-white">{displayName}</div><div className="mt-0.5 truncate text-[11px] text-slate-400">{displayRole}</div><div className="mt-0.5 text-[10px] text-slate-500">@{user.username}</div></div>
    </div>
  );

  const renderNavItem = (item: NavItem, compact = false) => {
    const Icon = item.icon;
    const active = currentTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => goTo(item.id)}
        aria-current={active ? 'page' : undefined}
        title={compact ? item.label : undefined}
        className={compact
          ? `flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition-colors ${active ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`
          : `flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-xs font-semibold transition-colors ${active ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
      >
        <Icon className={compact ? 'h-4 w-4 shrink-0' : 'h-4 w-4 shrink-0'} />
        <span className={compact ? 'max-w-full truncate' : 'min-w-0 flex-1'}>{item.label}</span>
        {!compact && active && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />}
      </button>
    );
  };

  return (
    <>
      {/* Persistent right-side navigation for desktop and mobile */}
      <aside
        className="fixed right-0 top-16 bottom-0 z-[60] flex w-[4.25rem] flex-col border-l border-slate-800/90 bg-slate-950/97 shadow-2xl shadow-black/20 backdrop-blur-xl sm:top-[72px] lg:w-64"
        dir={isAr ? 'rtl' : 'ltr'}
        aria-label={isAr ? 'التنقل الداخلي' : 'Internal navigation'}
      >
        <div className="hidden border-b border-slate-800 px-4 py-4 lg:block">
          <button type="button" onClick={() => goTo('dashboard')} className="flex w-full items-center gap-2 text-start text-xs font-black tracking-tight text-white" aria-label={isAr ? 'لوحة التحكم' : 'Dashboard'}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
            <span className="truncate">{t.appName}</span>
          </button>
          <p className="mt-1 ps-4 text-[10px] text-slate-500">{isAr ? 'التنقل بين الشاشات' : 'Screen navigation'}</p>
        </div>

        <nav className="hidden flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3 lg:flex">
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="hidden flex-col gap-2 border-t border-slate-800 p-3 lg:flex">
          {profileOpen && <div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><ProfileDetails /></div>}
          <button type="button" onClick={onToggleLanguage} className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:border-amber-400/40 hover:text-white">
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>
          <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} className={`flex min-h-11 items-center gap-2 rounded-xl border px-2 py-2 text-start transition-colors ${profileOpen ? 'border-amber-400/50 bg-slate-800' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-xs font-black text-amber-300">{displayName.trim().slice(0, 1)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold text-white">{displayName}</span><span className="block truncate text-[10px] text-slate-500">{displayRole}</span></span>
          </button>
          <button type="button" onClick={onOpenTour} className="rounded-xl px-3 py-2 text-start text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">{isAr ? 'جولة تعريفية' : 'Guided tour'}</button>
        </div>

        {/* Slim, fixed mobile rail on the right edge */}
        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto overscroll-contain px-1 py-2 lg:hidden">
          {mobilePrimary.map((item) => renderNavItem(item, true))}
          <button type="button" onClick={() => { setMoreOpen((open) => !open); setProfileOpen(false); }} aria-expanded={moreOpen} className={`flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition-colors ${moreOpen || secondaryItems.some((item) => item.id === currentTab) ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
            {moreOpen ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
            <span>{isAr ? 'المزيد' : 'More'}</span>
          </button>
          <button type="button" onClick={() => { setProfileOpen((open) => !open); setMoreOpen(false); }} aria-expanded={profileOpen} className={`flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition-colors ${profileOpen ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
            <UserRound className="h-4 w-4" />
            <span className="max-w-full truncate">{isAr ? 'الملف' : 'Profile'}</span>
          </button>
          <button type="button" onClick={onToggleLanguage} title={isAr ? 'Switch language' : 'تغيير اللغة'} className="mt-auto flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-1 py-2 text-[10px] font-black text-slate-300 hover:border-amber-400/40">{isAr ? 'EN' : 'ع'}</button>
        </nav>
      </aside>

      {moreOpen && (
        <>
          <button type="button" aria-label={isAr ? 'إغلاق قائمة التنقل' : 'Close navigation menu'} onClick={() => setMoreOpen(false)} className="fixed inset-0 z-[65] bg-slate-950/35 lg:hidden" />
          <div className="fixed bottom-3 right-[4.25rem] top-20 z-[70] flex w-[min(17rem,calc(100vw-5rem))] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl lg:hidden" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-3">
              <span className="text-xs font-black text-white">{isAr ? 'كل الشاشات' : 'All screens'}</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label={isAr ? 'إغلاق' : 'Close'} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
              {secondaryItems.map((item) => renderNavItem(item))}
            </nav>
          </div>
        </>
      )}

      {profileOpen && (
        <div className="fixed bottom-4 right-[4.5rem] z-[70] w-64 rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl lg:hidden" dir={isAr ? 'rtl' : 'ltr'}>
          <ProfileDetails />
        </div>
      )}
    </>
  );
}
