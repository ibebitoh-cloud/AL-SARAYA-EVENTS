import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Plus,
  Compass,
  LayoutDashboard,
  Calendar,
  Users,
  Utensils,
  Receipt,
  DollarSign,
  Package,
  FileBarChart2,
  Sparkles,
  FileText,
  Radio,
  Globe,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
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
  onOpenTour,
}: VenueHeaderNavProps) {
  const isAr = language === 'ar';
  const t = DICTIONARY[language];
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) sound.click(650);
  };

  const navItems: { id: VenueTab; label: string; icon: typeof LayoutDashboard; category: 'overview' | 'operations' | 'finance' }[] = [
    { id: 'home', label: isAr ? 'موقع السرايا' : 'Customer Website', icon: Sparkles, category: 'overview' },
    { id: 'company', label: t.tabs.company, icon: Sparkles, category: 'overview' },
    { id: 'dashboard', label: t.tabs.dashboard, icon: LayoutDashboard, category: 'overview' },
    { id: 'bookings', label: t.tabs.bookings, icon: Calendar, category: 'operations' },
    { id: 'agenda', label: t.tabs.agenda, icon: Calendar, category: 'operations' },
    { id: 'floorplan', label: t.tabs.floorplan, icon: Compass, category: 'overview' },
    { id: 'live_stage', label: t.tabs.live_stage, icon: Radio, category: 'operations' },
    { id: 'catering', label: t.tabs.catering, icon: Utensils, category: 'operations' },
    { id: 'contracts', label: t.tabs.contracts, icon: FileText, category: 'operations' },
    { id: 'clients', label: t.tabs.clients, icon: Users, category: 'operations' },
    { id: 'services', label: t.tabs.services, icon: Utensils, category: 'finance' },
    { id: 'payments', label: t.tabs.payments, icon: Receipt, category: 'finance' },
    { id: 'expenses', label: t.tabs.expenses, icon: DollarSign, category: 'finance' },
    { id: 'inventory', label: t.tabs.inventory, icon: Package, category: 'finance' },
    { id: 'staff', label: t.tabs.staff, icon: Users, category: 'finance' },
    { id: 'reports', label: t.tabs.reports, icon: FileBarChart2, category: 'finance' },
  ];

  // Primary tabs for quick bar
  const quickTabs: VenueTab[] = ['home', 'dashboard', 'bookings', 'agenda', 'floorplan', 'reports'];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Wordmark & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.a
            href="#"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.preventDefault();
              sound.swoosh();
              onTabChange('company');
            }}
            className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-white hover:text-indigo-400 transition-colors flex items-center gap-2 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="truncate">{t.appName}</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50 hidden md:inline">
              PRO ERP
            </span>
          </motion.a>
        </div>

        {/* Zone 2: Desktop Navigation Bar with Dropdown / Quick Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          {quickTabs.map((tabId) => {
            const item = navItems.find((n) => n.id === tabId);
            if (!item) return null;
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sound.swoosh();
                  onTabChange(item.id);
                }}
                className={`relative px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}

          {/* More Screens Menu Trigger */}
          <button
            onClick={() => {
              sound.click(600);
              setIsMobileMenuOpen((prev) => !prev);
            }}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isAr ? 'كافة الشاشات (15)' : 'All Screens (15)'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </nav>

        {/* Zone 3: Actions (Language Switcher, Tour, Sound, New Booking) */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.click(650);
              onToggleLanguage();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-xs font-bold text-slate-200 hover:text-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={isAr ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
          </motion.button>

          {/* Interactive Tour Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.click(620);
              onOpenTour();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            title={t.interactiveTour}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '20s' }} />
            <span className="hidden xl:inline">{t.interactiveTour}</span>
          </motion.button>

          {/* Sound Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleSound}
            aria-label={soundEnabled ? t.soundOff : t.soundOn}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/60'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </motion.button>

          {/* New Booking Primary Action */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              sound.click(700);
              onOpenNewBooking();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.newBooking}</span>
          </motion.button>

          {/* Mobile All Screens Trigger */}
          <button
            onClick={() => {
              sound.click(550);
              setIsMobileMenuOpen((prev) => !prev);
            }}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-label="القائمة"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Quick Bar (Thumb-Friendly, NO horizontal scroll) */}
      <div className="lg:hidden w-full border-t border-slate-900 bg-slate-950/95 px-2 py-1.5">
        <div className="grid grid-cols-4 gap-1 w-full text-center">
          {[
            { id: 'company' as VenueTab, label: isAr ? 'القاعات' : 'Halls' },
            { id: 'dashboard' as VenueTab, label: isAr ? 'الرئيسية' : 'Home' },
            { id: 'bookings' as VenueTab, label: isAr ? 'الحجوزات' : 'Bookings' },
            { id: 'agenda' as VenueTab, label: isAr ? 'الأجندة' : 'Agenda' },
          ].map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.swoosh();
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`py-1.5 px-0.5 text-xs font-bold rounded-lg truncate transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 bg-slate-900/50 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dropdown / Drawer for All 15 Screens (Categorized & Clean) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full border-b border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 py-6 shadow-2xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400">
                  {isAr ? 'شاشات ومنظومة قاعات أورا المتكاملة (15 شاشة)' : 'Aura Palace System Workspaces (15 Screens)'}
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  {isAr ? 'إغلاق القائمة ✕' : 'Close ✕'}
                </button>
              </div>

              {/* 3 Structured Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category 1: Overview */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                    {t.tabCategories.overview}
                  </div>
                  <div className="space-y-1">
                    {navItems
                      .filter((n) => n.category === 'overview')
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              sound.swoosh();
                              onTabChange(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-amber-300" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Category 2: Operations */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                    {t.tabCategories.operations}
                  </div>
                  <div className="space-y-1">
                    {navItems
                      .filter((n) => n.category === 'operations')
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              sound.swoosh();
                              onTabChange(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-indigo-400" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Category 3: Finance & Assets */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    {t.tabCategories.finance}
                  </div>
                  <div className="space-y-1">
                    {navItems
                      .filter((n) => n.category === 'finance')
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              sound.swoosh();
                              onTabChange(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-emerald-400" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
