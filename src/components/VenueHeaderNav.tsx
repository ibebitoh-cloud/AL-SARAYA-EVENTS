import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Calendar, Building, Ruler, Package, Utensils, Wallet, Images,
  ClipboardList, Users, FileText, CreditCard, Receipt, UserRound, Settings2,
  CalendarDays, PanelRightClose, PanelRightOpen, X, ChevronRight, Menu, Home, Sun, Moon, Maximize2, Minimize2,
} from 'lucide-react';
import { VenueTab, Language } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import { SystemUser } from '../data/systemProfiles';

interface VenueHeaderNavProps {
  currentTab: VenueTab;
  language: Language;
  user: SystemUser;
  onTabChange: (tab: VenueTab) => void;
  onToggleLanguage: () => void;
  onOpenTour: () => void;
  onVisibilityChange: (visible: boolean) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

type NavItem = { id: VenueTab; label: string; icon: typeof LayoutDashboard };

export function VenueHeaderNav({ currentTab, language, user, onTabChange, onToggleLanguage, onOpenTour, onVisibilityChange, theme, onToggleTheme }: VenueHeaderNavProps) {
  const isAr = language === 'ar';
  const [isHidden, setIsHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Browser/device policy can block fullscreen. */ }
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
  const displayName = (isAr ? user.nameAr : user.name) || user.username;
  const displayRole = (isAr ? user.roleAr : user.role) || (isAr ? 'مستخدم النظام' : 'System user');
  const toggleVisibility = () => {
    const nextVisible = isHidden;
    setIsHidden(!isHidden);
    setMobileOpen(false);
    onVisibilityChange(nextVisible);
  };
  const goTo = (tab: VenueTab) => {
    sound.swoosh();
    onTabChange(tab);
    setMobileOpen(false);
    setProfileOpen(false);
  };
  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = currentTab === item.id;
    return <button key={item.id} type="button" onClick={() => goTo(item.id)} aria-current={active ? 'page' : undefined}
      className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-xs font-semibold transition-colors ${active ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
      <Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">{item.label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />}
    </button>;
  };

  return <>
    {/* Full-height control rail anchored to the logical start: right in Arabic, left in English. */}
    <aside dir={isAr ? 'rtl' : 'ltr'} className={`fixed start-0 top-0 z-[60] hidden h-dvh w-64 flex-col border-e border-amber-500/20 bg-slate-950/95 shadow-xl shadow-black/20 backdrop-blur-xl transition-transform duration-200 lg:flex ${isHidden ? (isAr ? 'translate-x-full' : '-translate-x-full') : 'translate-x-0'}`}>
      <div className="border-b border-slate-800 p-3">
        <div className="mb-3 flex items-center justify-between gap-2"><div className="min-w-0"><div className="truncate text-xs font-black text-white">{isAr ? 'شاشات الإدارة' : 'Management screens'}</div><div className="mt-1 truncate text-[10px] text-slate-500">{displayName} · {displayRole}</div></div>
        <button type="button" onClick={toggleVisibility} aria-label={isAr ? 'إخفاء القائمة' : 'Hide navigation'} title={isAr ? 'إخفاء القائمة' : 'Hide navigation'} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-amber-300"><PanelRightClose className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => goTo('dashboard')} title={isAr ? 'الرئيسية' : 'Home'} className="flex h-10 items-center justify-center gap-1 rounded-lg border border-amber-500/25 bg-amber-400/10 text-[10px] font-bold text-amber-300 hover:bg-amber-400/20"><Home className="h-4 w-4" /><span>{isAr ? 'الرئيسية' : 'Home'}</span></button>
          <button type="button" onClick={onToggleTheme} title={theme === 'dark' ? (isAr ? 'الوضع الفاتح' : 'Light mode') : (isAr ? 'الوضع الليلي' : 'Night mode')} className="flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900 text-[10px] font-bold text-slate-300 hover:border-amber-400/40 hover:text-amber-300">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}<span>{theme === 'dark' ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'ليلي' : 'Night')}</span></button>
          <button type="button" onClick={toggleFullscreen} title={isFullscreen ? (isAr ? 'الخروج من ملء الشاشة' : 'Exit fullscreen') : (isAr ? 'ملء الشاشة' : 'Full view')} aria-pressed={isFullscreen} className="flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-400/40 hover:text-amber-300">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3" aria-label={isAr ? 'التنقل بين شاشات الإدارة' : 'Admin navigation'}>{navItems.map(renderNavItem)}</nav>
      <div className="flex items-center gap-2 border-t border-slate-800 p-3">
        <button type="button" onClick={onToggleLanguage} className="flex-1 rounded-lg border border-slate-800 px-3 py-2 text-[11px] font-bold text-slate-300 hover:border-amber-400/40 hover:text-white">{isAr ? 'EN · English' : 'العربية'}</button>
        <button type="button" onClick={onOpenTour} className="rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">{isAr ? 'الجولة' : 'Tour'}</button>
        <button type="button" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen} title={displayName} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-xs font-black text-amber-300"><UserRound className="h-4 w-4" /></button>
      </div>
    </aside>

    {isHidden && <button type="button" onClick={toggleVisibility} title={isAr ? 'إظهار القائمة الجانبية' : 'Show sidebar'} aria-label={isAr ? 'إظهار القائمة الجانبية' : 'Show sidebar'} className="fixed start-0 top-20 z-[60] hidden rounded-e-xl border border-amber-500/25 bg-slate-950/95 p-3 text-amber-300 shadow-lg lg:block"><PanelRightOpen className="h-4 w-4" /></button>}

    {/* Mobile: controls and screen navigation open from the logical start side. */}
    <div className={`fixed ${isAr ? 'end-3' : 'start-3'} top-[76px] z-40 lg:hidden`}>
      <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen} aria-label={isAr ? 'قائمة الشاشات' : 'Open screen navigation'} className="flex h-10 items-center gap-2 rounded-xl border border-amber-500/30 bg-slate-950/95 px-3 text-xs font-bold text-amber-300 shadow-lg backdrop-blur-xl">
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}{isAr ? 'الشاشات' : 'Screens'}
      </button>
    </div>
    {mobileOpen && <><button type="button" aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[60] bg-slate-950/50 lg:hidden" />
      <aside dir={isAr ? 'rtl' : 'ltr'} className="fixed start-0 top-16 z-[65] flex h-[calc(100dvh-4rem)] w-[min(84vw,320px)] flex-col border-e border-amber-500/20 bg-slate-950 shadow-2xl sm:top-[72px] sm:h-[calc(100dvh-72px)] lg:hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div><div className="text-xs font-black text-white">{isAr ? 'شاشات الإدارة' : 'Management screens'}</div><div className="mt-1 text-[10px] text-slate-500">{displayName}</div></div><button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-3 gap-2 border-b border-slate-800 p-3"><button type="button" onClick={() => goTo('dashboard')} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-amber-500/25 bg-amber-400/10 px-2 text-[10px] font-bold text-amber-300"><Home className="h-4 w-4" />{isAr ? 'الرئيسية' : 'Home'}</button><button type="button" onClick={onToggleTheme} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-slate-700 px-2 text-[10px] font-bold text-slate-300">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{isAr ? (theme === 'dark' ? 'فاتح' : 'ليلي') : (theme === 'dark' ? 'Light' : 'Night')}</button><button type="button" onClick={toggleFullscreen} className="flex min-h-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button></div><nav className="flex-1 space-y-1 overflow-y-auto p-3">{navItems.map(renderNavItem)}</nav>
        <div className="flex gap-2 border-t border-slate-800 p-3"><button type="button" onClick={onToggleLanguage} className="flex-1 rounded-lg border border-slate-800 px-3 py-2 text-xs font-bold text-slate-300">{isAr ? 'EN · English' : 'العربية'}</button><button type="button" onClick={onOpenTour} className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">{isAr ? 'الجولة' : 'Tour'}</button></div>
      </aside></>}
    {profileOpen && <div dir={isAr ? 'rtl' : 'ltr'} className="fixed end-5 bottom-20 z-[70] w-64 rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/15 text-sm font-black text-amber-300">{displayName.trim().slice(0,1)}</div><div className="min-w-0"><div className="truncate text-sm font-black text-white">{displayName}</div><div className="mt-1 truncate text-[11px] text-slate-400">{displayRole}</div><div className="mt-1 text-[10px] text-slate-500">@{user.username}</div></div></div></div>}
  </>;
}
