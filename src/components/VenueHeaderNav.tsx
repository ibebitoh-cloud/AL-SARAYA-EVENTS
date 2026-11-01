import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Calendar, Building, Ruler, Package, Utensils, Wallet, Images,
  ClipboardList, Users, FileText, CreditCard, Receipt, UserRound, Settings2,
  CalendarDays, Sparkles, Tags, Globe2, ShieldCheck, X, ChevronLeft, ChevronRight, Home, Sun, Moon, Maximize2, Minimize2, LogOut, Compass,
} from 'lucide-react';
import { VenueTab, Language } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import { SystemUser, canAccess } from '../data/systemProfiles';
import { BrandLogo } from './BrandLogo';
import { DaliCredit, DaliMark } from './DaliCredit';

interface VenueHeaderNavProps {
  currentTab: VenueTab;
  language: Language;
  user: SystemUser;
  onTabChange: (tab: VenueTab) => void;
  onToggleLanguage: () => void;
  onOpenTour: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onGoToWebsite: () => void;
  onLogout: () => void;
  /** Notification bell, shown in the sidebar header and the mobile top bar. */
  notificationBell?: ReactNode;
}

type NavItem = { id: VenueTab; label: string; icon: typeof LayoutDashboard };

/**
 * The side menu has three sizes. It is pinned to the start side: right in Arabic, left in English.
 * - full: logo, group titles and full labels.
 * - compact: icon with a short label under it.
 * - rail: icons only (labels show as tooltips).
 * On phones, full opens over the page and closes back to the last small size.
 */
export type PortalNavMode = 'full' | 'compact' | 'rail';
const NAV_MODE_KEY = 'saraya-portal-nav-mode';
const WIDTHS = { desktop: { full: 256, compact: 96, rail: 64 }, phone: { compact: 76, rail: 56 } } as const;
const readMode = (): PortalNavMode => {
  try { const v = window.localStorage.getItem(NAV_MODE_KEY); return v === 'compact' || v === 'rail' || v === 'full' ? v : 'full'; } catch { return 'full'; }
};
const useIsDesktop = () => {
  const query = '(min-width: 1024px)';
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatch(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return match;
};

export function VenueHeaderNav({ currentTab, language, user, onTabChange, onToggleLanguage, onOpenTour, theme, onToggleTheme, onGoToWebsite, onLogout, notificationBell }: VenueHeaderNavProps) {
  const isAr = language === 'ar';
  const dark = theme === 'dark';
  const isDesktop = useIsDesktop();
  const [savedMode, setSavedMode] = useState<PortalNavMode>(readMode);
  // The last small size, so a phone can close the full menu back to it.
  const [lastSmall, setLastSmall] = useState<'compact' | 'rail'>(() => (readMode() === 'compact' ? 'compact' : 'rail'));
  const [phoneFullOpen, setPhoneFullOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  // What is drawn as the pinned bar. Phones never pin the full menu: it opens over the page instead.
  const pinnedMode: PortalNavMode = isDesktop ? savedMode : (savedMode === 'full' ? lastSmall : savedMode);
  const pinnedWidth = isDesktop ? WIDTHS.desktop[pinnedMode] : WIDTHS.phone[pinnedMode === 'compact' ? 'compact' : 'rail'];
  const setMode = (mode: PortalNavMode) => {
    sound.click(600);
    setProfileOpen(false);
    if (mode !== 'full') setLastSmall(mode);
    if (!isDesktop && mode === 'full') { setPhoneFullOpen(true); return; }
    setPhoneFullOpen(false);
    setSavedMode(mode);
    try { window.localStorage.setItem(NAV_MODE_KEY, mode); } catch { /* storage may be blocked */ }
  };
  // The page content reads this width to sit beside the menu.
  useEffect(() => {
    document.documentElement.style.setProperty('--portal-nav-w', `${pinnedWidth}px`);
  }, [pinnedWidth]);
  useEffect(() => () => { document.documentElement.style.setProperty('--portal-nav-w', '0px'); }, []);
  useEffect(() => { if (isDesktop) setPhoneFullOpen(false); }, [isDesktop]);
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
  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: isAr ? 'الحجوزات' : 'Bookings', icon: Calendar },
    { id: 'agenda', label: isAr ? 'التقويم' : 'Calendar', icon: CalendarDays },
    { id: 'clients', label: isAr ? 'العملاء' : 'Clients', icon: Users },
    { id: 'package_builder', label: isAr ? 'تخطيط المناسبة' : 'Event Planner', icon: Sparkles },
    { id: 'event_designer', label: isAr ? 'مصمم المناسبات' : 'Event Designer', icon: Ruler },
    { id: 'photo_library', label: isAr ? 'مكتبة الصور' : 'Photo Library', icon: Images },
    { id: 'contracts', label: isAr ? 'العقود' : 'Contracts', icon: FileText },
    { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: Utensils },
    { id: 'catering', label: isAr ? 'الضيافة' : 'Catering', icon: ClipboardList },
    { id: 'inventory', label: isAr ? 'المخزون' : 'Inventory', icon: Package },
    { id: 'staff', label: isAr ? 'الموظفون' : 'Staff', icon: Users },
    { id: 'finance', label: isAr ? 'المالية' : 'Finance', icon: Wallet },
    { id: 'payments', label: isAr ? 'المدفوعات' : 'Payments', icon: CreditCard },
    { id: 'expenses', label: isAr ? 'المصروفات' : 'Expenses', icon: Receipt },
    { id: 'reports', label: isAr ? 'التقارير' : 'Reports', icon: ClipboardList },
    { id: 'price_lists', label: isAr ? 'قوائم الأسعار' : 'Price Lists', icon: Tags },
    { id: 'company', label: isAr ? 'ملف الشركة' : 'Company', icon: Building },
    { id: 'site_content', label: isAr ? 'محتوى الموقع' : 'Website Content', icon: Globe2 },
    { id: 'permissions', label: isAr ? 'صلاحيات التعديل' : 'Edit Permissions', icon: ShieldCheck },
  ];
  // Only show the screens this user is allowed to open.
  const navItems = allNavItems.filter((item) => item.id === 'permissions' ? user.role === 'ceo' : canAccess(user, item.id));
  const groupedItems = [
    { title: isAr ? 'نظرة عامة' : 'Overview', ids: ['dashboard'] },
    { title: isAr ? 'الحجوزات والعملاء' : 'Bookings & Clients', ids: ['bookings', 'agenda', 'clients', 'contracts'] },
    { title: isAr ? 'تخطيط وتجهيز المناسبة' : 'Event Planning', ids: ['package_builder', 'event_designer', 'photo_library', 'services', 'catering'] },
    { title: isAr ? 'التشغيل والمالية' : 'Operations & Finance', ids: ['inventory', 'staff', 'finance', 'payments', 'expenses', 'reports'] },
    { title: isAr ? 'الإعدادات' : 'Setup', ids: ['price_lists', 'company', 'site_content', 'permissions'] },
  ].map((group) => ({ ...group, items: navItems.filter((item) => group.ids.includes(item.id)) })).filter((group) => group.items.length);
  const displayName = (isAr ? user.nameAr : user.name) || user.username;
  const displayRole = (isAr ? user.roleAr : user.role) || (isAr ? 'مستخدم النظام' : 'System user');
  const goTo = (tab: VenueTab) => {
    sound.swoosh();
    onTabChange(tab);
    setPhoneFullOpen(false);
    setProfileOpen(false);
  };
  const currentLabel = allNavItems.find((item) => item.id === currentTab)?.label || (isAr ? 'شاشات الإدارة' : 'Management');

  // Shared look, written per theme so light mode never inherits dark-only colours.
  const surface = dark ? 'border-[#C49A52]/20 bg-[#0D0D0F]/95' : 'border-[#C49A52]/25 bg-white/95';
  const divider = dark ? 'border-white/10' : 'border-slate-200';
  const muted = dark ? 'text-[#B9B4AA]' : 'text-slate-500';
  const ghostBtn = dark ? 'border-white/10 text-[#F4F1EA]/80 hover:border-[#C49A52]/50 hover:text-[#E9CF94]' : 'border-slate-200 text-slate-700 hover:border-[#C49A52]/60 hover:text-[#8C6A2E]';
  const iconBtn = `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${dark ? 'text-[#F4F1EA]/70 hover:bg-white/5 hover:text-[#E9CF94]' : 'text-slate-600 hover:bg-[#C49A52]/10 hover:text-[#8C6A2E]'}`;
  const goldActive = 'bg-[linear-gradient(135deg,#E9CF94,#C49A52_55%,#8C6A2E)] text-[#0D0D0F] shadow-sm shadow-[#8C6A2E]/30';

  // Size steps from widest to slimmest. The arrows move one step at a time, like most apps.
  const ORDER: PortalNavMode[] = ['full', 'compact', 'rail'];
  /** Two arrows on one line: shrink (points to the screen edge the menu sits on) and expand. */
  const renderSizeArrows = (shown: PortalNavMode, tight: boolean) => {
    const i = ORDER.indexOf(shown);
    const btn = `flex h-7 items-center justify-center rounded-md transition disabled:cursor-default disabled:opacity-30 ${tight ? 'w-[22px]' : 'w-8'} ${dark ? 'text-[#F4F1EA]/70 enabled:hover:bg-white/5 enabled:hover:text-[#E9CF94]' : 'text-slate-600 enabled:hover:bg-[#C49A52]/10 enabled:hover:text-[#8C6A2E]'}`;
    const shrink = isAr ? 'تصغير القائمة' : 'Collapse menu';
    const grow = isAr ? 'توسيع القائمة' : 'Expand menu';
    return <div className={`flex items-center gap-0.5 rounded-lg border p-0.5 ${divider}`}>
      <button type="button" onClick={() => setMode(ORDER[i + 1])} disabled={i >= ORDER.length - 1} title={shrink} aria-label={shrink} className={btn}><ChevronLeft className="h-4 w-4 rtl:-scale-x-100" /></button>
      <button type="button" onClick={() => setMode(ORDER[i - 1])} disabled={i <= 0} title={grow} aria-label={grow} className={btn}><ChevronRight className="h-4 w-4 rtl:-scale-x-100" /></button>
    </div>;
  };

  const accountActions = <div className="grid grid-cols-2 gap-2">
    <button type="button" onClick={() => { setPhoneFullOpen(false); setProfileOpen(false); onGoToWebsite(); }} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold ${ghostBtn}`}><Home className="h-4 w-4" />{isAr ? 'الموقع' : 'Website'}</button>
    <button type="button" onClick={() => { setPhoneFullOpen(false); setProfileOpen(false); onLogout(); }} className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 px-2 text-[11px] font-bold text-rose-500 hover:bg-rose-500/10"><LogOut className="h-4 w-4 rtl:rotate-180" />{isAr ? 'تسجيل الخروج' : 'Log out'}</button>
  </div>;

  const renderNavItem = (item: NavItem, mode: PortalNavMode) => {
    const Icon = item.icon;
    const active = currentTab === item.id;
    const idle = dark ? 'text-[#F4F1EA]/75 hover:bg-white/5 hover:text-[#E9CF94]' : 'text-slate-700 hover:bg-[#C49A52]/10 hover:text-[#8C6A2E]';
    if (mode === 'full') return <button key={item.id} type="button" onClick={() => goTo(item.id)} aria-current={active ? 'page' : undefined}
      className={`flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-xs font-semibold transition-colors ${active ? goldActive : idle}`}>
      <Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">{item.label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70 rtl:rotate-180" />}
    </button>;
    if (mode === 'compact') return <button key={item.id} type="button" onClick={() => goTo(item.id)} aria-current={active ? 'page' : undefined} title={item.label}
      className={`flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-center text-[10px] font-semibold leading-tight transition-colors ${active ? goldActive : idle}`}>
      <Icon className="h-[18px] w-[18px] shrink-0" /><span className="line-clamp-2 w-full break-words">{item.label}</span>
    </button>;
    return <button key={item.id} type="button" onClick={() => goTo(item.id)} aria-current={active ? 'page' : undefined} title={item.label} aria-label={item.label}
      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${active ? goldActive : idle}`}>
      <Icon className="h-[18px] w-[18px]" />
    </button>;
  };

  const themeLabel = dark ? (isAr ? 'الوضع الفاتح' : 'Light theme') : (isAr ? 'الوضع الليلي' : 'Dark theme');
  const fullLabel = isFullscreen ? (isAr ? 'الخروج من ملء الشاشة' : 'Exit full screen') : (isAr ? 'ملء الشاشة' : 'Full screen');

  /** The full menu: used pinned on desktop and over the page on phones. */
  const renderFull = (onPhone: boolean) => <>
    <div className={`border-b p-3 ${divider}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0"><BrandLogo className="h-7 w-auto max-w-full" /><div className={`mt-1.5 truncate text-[10px] ${muted}`}>{isAr ? 'البوابة' : 'Portal'} · {displayName} · {displayRole}</div></div>
        <div className="flex shrink-0 items-center gap-1">
          {!onPhone && notificationBell}
          {onPhone && <button type="button" onClick={() => setPhoneFullOpen(false)} aria-label={isAr ? 'إغلاق القائمة' : 'Close navigation'} className={iconBtn}><X className="h-4 w-4" /></button>}
        </div>
      </div>
      <div className="mb-2 flex items-center justify-between gap-2"><span className={`text-[10px] font-bold ${muted}`}>{isAr ? 'حجم القائمة' : 'Menu size'}</span>{renderSizeArrows('full', false)}</div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onToggleTheme} title={themeLabel} className={`flex h-9 items-center justify-center gap-2 rounded-lg border text-[10px] font-bold ${ghostBtn}`}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}<span>{themeLabel}</span></button>
        <button type="button" onClick={toggleFullscreen} title={fullLabel} aria-pressed={isFullscreen} className={`flex h-9 items-center justify-center gap-2 rounded-lg border text-[10px] font-bold ${ghostBtn}`}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}<span>{isFullscreen ? (isAr ? 'تصغير' : 'Exit full') : (isAr ? 'ملء الشاشة' : 'Full screen')}</span></button>
      </div>
    </div>
    <nav className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-2.5" aria-label={isAr ? 'التنقل بين شاشات الإدارة' : 'Admin navigation'}>{groupedItems.map((group) => <section key={group.title}><h2 className={`mb-1 px-2 text-[9px] font-black uppercase tracking-wider ${muted}`}>{group.title}</h2><div className="space-y-0.5">{group.items.map((item) => renderNavItem(item, 'full'))}</div></section>)}</nav>
    <div className={`space-y-2 border-t p-2.5 ${divider}`}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onToggleLanguage} className={`flex-1 rounded-lg border px-3 py-2 text-[11px] font-bold ${ghostBtn}`}>{isAr ? 'EN · English' : 'العربية'}</button>
        <button type="button" onClick={onOpenTour} className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${dark ? 'text-[#F4F1EA]/70 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}>{isAr ? 'الجولة' : 'Tour'}</button>
        {!onPhone && <button type="button" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen} title={displayName} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C49A52]/15 text-[#C49A52]"><UserRound className="h-4 w-4" /></button>}
      </div>
      {onPhone && accountActions}
      <div className="flex justify-center pt-1"><DaliCredit tone={dark ? 'white' : 'dark'} tagline={false} className="origin-center scale-[0.8]" /></div>
    </div>
  </>;

  /** The small menu (compact or icons only), always pinned. */
  const renderSmall = (mode: 'compact' | 'rail') => <>
    <div className={`flex flex-col items-center gap-2 border-b px-1 py-3 ${divider}`}>
      <BrandLogo variant="mark" className="h-6 w-auto" />
      {isDesktop && notificationBell}
      {renderSizeArrows(mode, true)}
    </div>
    <nav className={`flex-1 overflow-y-auto overscroll-contain px-1.5 py-2 ${mode === 'compact' ? 'space-y-2' : 'space-y-3'}`} aria-label={isAr ? 'التنقل بين شاشات الإدارة' : 'Admin navigation'}>
      {groupedItems.map((group, i) => <section key={group.title} aria-label={group.title} className={`space-y-1 ${i ? `border-t pt-2 ${divider}` : ''}`}>{group.items.map((item) => renderNavItem(item, mode))}</section>)}
    </nav>
    <div className={`flex flex-col items-center gap-1 border-t px-1.5 py-2 ${divider}`}>
      <button type="button" onClick={onToggleTheme} title={themeLabel} aria-label={themeLabel} className={iconBtn}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
      <button type="button" onClick={onToggleLanguage} title={isAr ? 'English' : 'العربية'} aria-label={isAr ? 'English' : 'العربية'} className={`${iconBtn} text-[11px] font-black`}>{isAr ? 'EN' : 'ع'}</button>
      <button type="button" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen} title={displayName} aria-label={displayName} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C49A52]/15 text-[#C49A52]"><UserRound className="h-4 w-4" /></button>
      <span className="mt-1 flex flex-col items-center gap-0.5" title="Powered by DALI STUDIO"><DaliMark tone="gold" className="h-4 w-4" />{mode === 'compact' && <span dir="ltr" className={`text-[7px] font-bold tracking-[0.2em] ${muted}`}>DALI</span>}</span>
    </div>
  </>;

  return <>
    {/* Pinned to the logical start: right in Arabic, left in English, on every screen size. */}
    <aside dir={isAr ? 'rtl' : 'ltr'} data-nav-mode={pinnedMode} style={{ width: pinnedWidth }}
      className={`fixed start-0 top-0 z-[60] flex h-dvh flex-col border-e shadow-xl shadow-black/10 backdrop-blur-xl transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${surface}`}>
      {pinnedMode === 'full' ? renderFull(false) : renderSmall(pinnedMode)}
    </aside>

    {/* Phones and tablets: a slim top bar beside the menu with the screen name and the bell. */}
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ marginInlineStart: pinnedWidth, width: `calc(100% - ${pinnedWidth}px)` }} className={`sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b px-3 backdrop-blur-xl lg:hidden ${surface}`}>
      <div className="min-w-0"><div className={`truncate text-sm font-black ${dark ? 'text-[#F4F1EA]' : 'text-slate-900'}`}>{currentLabel}</div><div className={`truncate text-[10px] ${muted}`}>{displayName}</div></div>
      {notificationBell}
    </div>

    {phoneFullOpen && !isDesktop && <>
      <button type="button" data-dali-ignore aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'} onClick={() => setPhoneFullOpen(false)} className="fixed inset-0 z-[64] cursor-default" style={{ background: 'rgba(13,13,15,0.55)' }} />
      <aside dir={isAr ? 'rtl' : 'ltr'} className={`fixed start-0 top-0 z-[65] flex h-dvh w-[min(86vw,320px)] flex-col border-e shadow-2xl ${dark ? 'border-[#C49A52]/20 bg-[#0D0D0F]' : 'border-[#C49A52]/25 bg-white'}`}>
        {renderFull(true)}
      </aside>
    </>}

    {profileOpen && <div dir={isAr ? 'rtl' : 'ltr'} style={{ insetInlineStart: pinnedWidth + 8 }} className={`fixed bottom-4 z-[70] w-64 rounded-2xl border p-4 shadow-2xl ${dark ? 'border-white/10 bg-[#0D0D0F]' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C49A52]/40 bg-[#C49A52]/15 text-sm font-black text-[#C49A52]">{displayName.trim().slice(0,1)}</div><div className="min-w-0"><div className={`truncate text-sm font-black ${dark ? 'text-[#F4F1EA]' : 'text-slate-900'}`}>{displayName}</div><div className={`mt-1 truncate text-[11px] ${muted}`}>{displayRole}</div><div className={`mt-1 text-[10px] ${muted}`}>@{user.username}</div></div></div>
      {pinnedMode !== 'full' && <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => { setProfileOpen(false); onOpenTour(); }} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold ${ghostBtn}`}><Compass className="h-4 w-4" />{isAr ? 'الجولة' : 'Tour'}</button>
        <button type="button" onClick={toggleFullscreen} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold ${ghostBtn}`}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}{isFullscreen ? (isAr ? 'تصغير' : 'Exit full') : (isAr ? 'ملء الشاشة' : 'Full screen')}</button>
      </div>}
      <div className="mt-2">{accountActions}</div>
    </div>}
  </>;
}
