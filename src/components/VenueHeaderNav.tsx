import { Plus, LayoutDashboard, Calendar, Building, Ruler } from 'lucide-react';
import { VenueTab, Language } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import { DICTIONARY } from '../utils/i18n';

interface VenueHeaderNavProps {
  currentTab: VenueTab;
  language: Language;
  onTabChange: (tab: VenueTab) => void;
  onToggleLanguage: () => void;
  onOpenNewBooking: () => void;
  onOpenTour: () => void;
}

export function VenueHeaderNav({
  currentTab,
  language,
  onTabChange,
  onToggleLanguage,
  onOpenNewBooking,
}: VenueHeaderNavProps) {
  const isAr = language === 'ar';
  const t = DICTIONARY[language];

  const navItems: { id: VenueTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: isAr ? 'الرئيسية' : 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: isAr ? 'الحجوزات' : 'Bookings', icon: Calendar },
    { id: 'agenda', label: isAr ? 'التقويم' : 'Calendar', icon: Calendar },
    { id: 'company', label: isAr ? 'القاعات' : 'Halls', icon: Building },
    { id: 'event_designer', label: isAr ? 'مصمم المناسبات' : 'Designer', icon: Ruler },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <button
          onClick={() => onTabChange('dashboard')}
          className="text-sm font-black tracking-tight text-white flex items-center gap-2 shrink-0"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>{t.appName}</span>
        </button>

        <nav className="flex-1 flex items-center justify-center gap-1 overflow-hidden">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.swoosh();
                  onTabChange(item.id);
                }}
                className={`px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'text-slate-950 bg-amber-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleLanguage}
            className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300"
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
          <button
            onClick={onOpenNewBooking}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'حجز جديد' : 'New Booking'}</span>
          </button>
        </div>
      </div>

      <div className="lg:hidden border-t border-slate-900 px-2 py-1">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                sound.swoosh();
                onTabChange(item.id);
              }}
              className={`py-1.5 text-[10px] font-bold rounded-md truncate ${
                currentTab === item.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 bg-slate-900/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
