import { useState } from 'react';
import {
  LayoutDashboard, Calendar, Building, Ruler, Package, Utensils, Wallet, Images,
  ClipboardList, Users, FileText, CreditCard, Receipt, UserRound, MoreHorizontal,
  CalendarDays, Settings2, X, ChevronRight, PanelRightClose, PanelRightOpen,
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
  onVisibilityChange: (visible: boolean) => void;
}

type NavItem = { id: VenueTab; label: string; icon: typeof LayoutDashboard };

export function VenueHeaderNav({ currentTab, language, user, onTabChange, onToggleLanguage, onOpenTour, onVisibilityChange }: VenueHeaderNavProps) {
  const isAr = language === 'ar';
  const t = DICTIONARY[language];
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const toggleVisibility = () => {
    const nextVisible = isHidden;
    setIsHidden(!isHidden);
    setMoreOpen(false);
    setProfileOpen(false);
    onVisibilityChange(nextVisible);
  };

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
          ? `flex min-h-10 min-w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold transition-colors ${active ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`
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
      {/* Admin navigation is integrated directly beneath the brand header */}
      <div className="sticky top-16 sm:top-[72px] z-40 w-full border-b border-amber-500/20 bg-slate-950/95 shadow-md shadow-black/10 backdrop-blur-xl" dir={isAr ? 'rtl' : 'ltr'}>
        {!isHidden ? (
          <div className="mx-auto flex min-h-12 w-full max-w-[1800px] items-center gap-2 px-2 sm:px-4">
            <button type="button" onClick={toggleVisibility} aria-label={isAr ? 'إخفاء شريط التنقل' : 'Hide navigation'} title={isAr ? 'إخفاء شريط التنقل' : 'Hide navigation'} className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-amber-400/40 hover:bg-slate-900 hover:text-amber-300 sm:inline-flex">
              <PanelRightClose className="h-4 w-4" />
            </button>
            <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 [scrollbar-width:thin] lg:flex" aria-label={isAr ? 'التنقل بين شاشات الإدارة' : 'Admin navigation'}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return <button key={item.id} type="button" onClick={() => goTo(item.id)} aria-current={active ? 'page' : undefined} title={item.label} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${active ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <Icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>
                </button>;
              })}
            </nav>
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 lg:hidden" aria-label={isAr ? 'التنقل السريع' : 'Quick navigation'}>
              {mobilePrimary.map((item) => renderNavItem(item, true))}
              <button type="button" onClick={() => { setMoreOpen((open) => !open); setProfileOpen(false); }} aria-expanded={moreOpen} className={`flex min-h-10 min-w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[9px] font-bold transition-colors ${moreOpen || secondaryItems.some((item) => item.id === currentTab) ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                {moreOpen ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}<span>{isAr ? 'المزيد' : 'More'}</span>
              </button>
            </nav>
            <div className="hidden shrink-0 items-center gap-1 border-s border-slate-800 ps-2 lg:flex">
              <button type="button" onClick={onToggleLanguage} className="h-8 rounded-lg border border-slate-800 px-2 text-[11px] font-bold text-slate-300 transition hover:border-amber-400/40 hover:text-white">{isAr ? 'EN' : 'عربي'}</button>
              <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} className="flex h-8 max-w-44 items-center gap-2 rounded-lg px-2 text-start transition hover:bg-slate-900">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[10px] font-black text-amber-300">{displayName.trim().slice(0, 1)}</span>
                <span className="min-w-0 truncate text-[11px] font-semibold text-slate-300">{displayName}</span>
              </button>
              <button type="button" onClick={onOpenTour} title={isAr ? 'جولة تعريفية' : 'Guided tour'} className="h-8 whitespace-nowrap rounded-lg px-2 text-[11px] font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white">{isAr ? 'الجولة' : 'Tour'}</button>
            </div>
            <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label={isAr ? 'الملف الشخصي' : 'Profile'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-amber-300 transition hover:bg-slate-900 lg:hidden">
              <UserRound className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-8 items-center justify-center">
            <button type="button" onClick={toggleVisibility} aria-label={isAr ? 'إظهار شريط التنقل' : 'Show navigation'} title={isAr ? 'إظهار شريط التنقل' : 'Show navigation'} className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-amber-300">
              <PanelRightOpen className="h-3.5 w-3.5" />{isAr ? 'إظهار التنقل' : 'Show navigation'}
            </button>
          </div>
        )}
      </div>

      {profileOpen && (
        <div className="fixed end-3 top-28 z-[70] w-64 rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl sm:end-6" dir={isAr ? 'rtl' : 'ltr'}>
          <ProfileDetails />
          <div className="mt-3 border-t border-slate-800 pt-2 text-[11px] text-slate-400">@{user.username}</div>
        </div>
      )}

      {moreOpen && (
        <>
          <button type="button" aria-label={isAr ? 'إغلاق قائمة التنقل' : 'Close navigation menu'} onClick={() => setMoreOpen(false)} className="fixed inset-0 z-[65] bg-slate-950/35 lg:hidden" />
          <div className="fixed inset-x-2 top-28 bottom-3 z-[70] flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl sm:inset-x-auto sm:end-4 sm:w-72 lg:hidden" dir={isAr ? 'rtl' : 'ltr'}>
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

    </>
  );
}
