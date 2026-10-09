import { useState } from 'react';
import {
  Plus, LayoutDashboard, Calendar, Building, Ruler, Package, Utensils, Wallet, Images,
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
  onOpenNewBooking: () => void;
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
  onOpenNewBooking,
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
  const mobilePrimary = navItems.filter((item) =>
    ['dashboard', 'bookings', 'agenda', 'inventory'].includes(item.id)
  );
  const secondaryItems = navItems.filter((item) => !desktopPrimary.some((primary) => primary.id === item.id));
  const goTo = (tab: VenueTab) => {
    sound.swoosh();
    onTabChange(tab);
    setMoreOpen(false);
    setProfileOpen(false);
  };
  const ProfileDetails = () => (
    <div className="flex items-center gap-3 text-start" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/15 text-sm font-black text-amber-300">
        {(isAr ? user.nameAr : user.name).trim().slice(0, 1)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-black text-white">{isAr ? user.nameAr : user.name}</div>
        <div className="mt-0.5 truncate text-[11px] text-slate-400">{isAr ? user.roleAr : user.role}</div>
        <div className="mt-0.5 text-[10px] text-slate-500">@{user.username}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop navigation: one sticky row, with secondary screens inside More. */}
      <header className="sticky top-[72px] z-40 hidden w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md lg:block">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 xl:px-6">
          <button
            type="button"
            onClick={() => goTo('dashboard')}
            className="flex shrink-0 items-center gap-2 text-sm font-black tracking-tight text-white"
            aria-label={isAr ? 'الرئيسية' : 'Dashboard'}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>{t.appName}</span>
          </button>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-1">
            {desktopPrimary.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-colors xl:px-3 ${active ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => { setMoreOpen((open) => !open); setProfileOpen(false); }}
                aria-expanded={moreOpen}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-colors ${secondaryItems.some((item) => item.id === currentTab) ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <MoreHorizontal className="h-4 w-4" />{isAr ? 'المزيد' : 'More'}<ChevronDown className="h-3 w-3" />
              </button>
              {moreOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 grid min-w-48 gap-1 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
                  {secondaryItems.map((item) => {
                    const Icon = item.icon;
                    return <button key={item.id} type="button" onClick={() => goTo(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-start text-xs ${currentTab === item.id ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{item.label}</button>;
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={onOpenPhotoLibrary} title={isAr ? 'مكتبة صور المناسبات' : 'Event Photo Library'} className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-slate-900 px-2.5 py-2 text-[11px] font-bold text-amber-300 hover:bg-slate-800">
              <Images className="h-4 w-4" /><span className="hidden xl:inline">{isAr ? 'مكتبة الصور' : 'Photo Library'}</span>
            </button>
            <button type="button" onClick={onToggleLanguage} className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-[11px] font-bold text-slate-300">{isAr ? 'EN' : 'عربي'}</button>
            <button type="button" onClick={onOpenNewBooking} className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"><Plus className="h-3.5 w-3.5" /><span>{isAr ? 'حجز جديد' : 'New Booking'}</span></button>
            <div className="relative">
              <button type="button" onClick={() => { setProfileOpen((open) => !open); setMoreOpen(false); }} aria-expanded={profileOpen} className="flex max-w-48 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 hover:border-amber-400/50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-xs font-black text-amber-300">{(isAr ? user.nameAr : user.name).trim().slice(0, 1)}</span>
                <span className="min-w-0 text-start"><span className="block truncate text-[11px] font-bold text-white">{isAr ? user.nameAr : user.name}</span><span className="block truncate text-[10px] text-slate-500">{isAr ? user.roleAr : user.role}</span></span>
                <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
              </button>
              {profileOpen && <div className="absolute end-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-2xl"><ProfileDetails /></div>}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation: a single fixed bottom bar; More opens the other screens. */}
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
