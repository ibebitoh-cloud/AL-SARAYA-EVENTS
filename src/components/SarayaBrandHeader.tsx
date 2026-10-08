import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Volume2,
  VolumeX,
  Shield,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { Language, VenueTab } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface SarayaBrandHeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  onOpenBookingModal: () => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenManagementPortal: () => void;
  isManagementMode: boolean;
  onExitManagementMode: () => void;
}

export function SarayaBrandHeader({
  language,
  onToggleLanguage,
  onOpenBookingModal,
  onNavigateSection,
  onOpenManagementPortal,
  isManagementMode,
  onExitManagementMode,
}: SarayaBrandHeaderProps) {
  const isAr = language === 'ar';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) sound.click(650);
  };

  const navLinks = [
    { id: 'events', labelAr: 'المناسبات', labelEn: 'Events' },
    { id: 'venues', labelAr: 'القاعات', labelEn: 'Venues' },
    { id: 'services', labelAr: 'الخدمات', labelEn: 'Services' },
    { id: 'planner', labelAr: 'صمم حفلَك', labelEn: 'Planner' },
    { id: 'gallery', labelAr: 'معرض الصور', labelEn: 'Gallery' },
    { id: '3d-tour', labelAr: 'المحاكاة 3D', labelEn: '3D Tour' },
    { id: 'about', labelAr: 'عن السرايا', labelEn: 'About' },
    { id: 'contact', labelAr: 'تواصل معنا', labelEn: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-500/15 bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              sound.swoosh();
              if (isManagementMode) onExitManagementMode();
              onNavigateSection('hero');
            }}
            className="flex items-center gap-2.5 text-lg sm:text-xl font-serif font-black tracking-wider text-amber-300 hover:text-amber-200 transition-colors group"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(212,175,55,0.9)]" />
            <span className="tracking-widest uppercase">SARAYA EVENT</span>
          </a>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        {!isManagementMode ? (
          <nav className="hidden lg:flex items-center gap-6 text-xs xl:text-sm font-medium text-slate-300">
            {navLinks.slice(0, 6).map((link) => (
              <a
                key={link.id}
                href={`?section=${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  sound.tick();
                  onNavigateSection(link.id);
                }}
                className="hover:text-amber-300 transition-colors py-1 whitespace-nowrap"
              >
                {isAr ? link.labelAr : link.labelEn}
              </a>
            ))}
            {/* More dropdown if needed */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-amber-300 transition-colors py-1 whitespace-nowrap"
              >
                <span>{isAr ? 'المزيد' : 'More'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full start-0 mt-2 hidden group-hover:flex flex-col min-w-[140px] p-2 bg-slate-900/95 border border-amber-500/20 rounded-xl shadow-xl backdrop-blur-md z-50">
                {navLinks.slice(6).map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      sound.tick();
                      onNavigateSection(link.id);
                    }}
                    className="px-3 py-2 text-xs text-slate-300 hover:text-amber-300 hover:bg-slate-800/80 rounded-lg transition-colors"
                  >
                    {isAr ? link.labelAr : link.labelEn}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs text-amber-300 font-mono bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'بوابة إدارة وتشغيل القاعات الداخلية' : 'Internal Hall Management & Operations Portal'}</span>
          </div>
        )}

        {/* Zone 3: Primary Actions (Language, Audio, Booking CTA, Discreet Management) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute' : 'Enable audio'}
            className="p-2 text-slate-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.click(700);
              onToggleLanguage();
            }}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            {isAr ? 'EN' : 'العربية'}
          </button>

          {/* Management Mode Toggle Switch */}
          {isManagementMode ? (
            <button
              type="button"
              onClick={() => {
                sound.swoosh();
                onExitManagementMode();
              }}
              className="px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg transition-colors whitespace-nowrap hidden sm:flex items-center gap-1.5"
            >
              <span>{isAr ? '← العودة للموقع' : '← Customer Website'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sound.click(600);
                onOpenManagementPortal();
              }}
              title={isAr ? 'بوابة إدارة القاعات للموظفين' : 'Staff Management Portal'}
              className="p-2 text-slate-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 hidden sm:flex items-center gap-1.5 text-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px] text-slate-400">{isAr ? 'الإدارة' : 'Portal'}</span>
            </button>
          )}

          {/* Primary Booking / Inquiry CTA */}
          <button
            type="button"
            onClick={() => {
              sound.chime();
              onOpenBookingModal();
            }}
            className="px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            {isAr ? 'احجز مناسبتك' : 'Book Your Event'}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-900"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-b border-amber-500/20 bg-slate-950/98 px-4 py-4 space-y-2 backdrop-blur-xl"
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  sound.tick();
                  setIsMobileMenuOpen(false);
                  if (isManagementMode) onExitManagementMode();
                  onNavigateSection(link.id);
                }}
                className="block px-3 py-2 text-sm font-medium text-slate-200 hover:text-amber-300 hover:bg-slate-900 rounded-lg transition-colors"
              >
                {isAr ? link.labelAr : link.labelEn}
              </a>
            ))}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenManagementPortal();
                }}
                className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 py-1"
              >
                <Shield className="w-4 h-4" />
                <span>{isAr ? 'بوابة إدارة وتشغيل القاعات' : 'Staff Management Portal'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
