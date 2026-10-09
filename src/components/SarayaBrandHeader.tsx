import { useEffect, useState } from 'react';
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
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Instagram,
  Music2,
} from 'lucide-react';
import { Language, VenueTab } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface SarayaBrandHeaderProps {
  language: Language;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenBookingModal: () => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenManagementPortal: () => void;
  isManagementMode: boolean;
  instagramUrl?: string;
  tiktokUrl?: string;
  onExitManagementMode: () => void;
}

export function SarayaBrandHeader({
  language,
  theme,
  onToggleTheme,
  onToggleLanguage,
  onOpenBookingModal,
  onNavigateSection,
  onOpenManagementPortal,
  isManagementMode,
  instagramUrl,
  tiktokUrl,
  onExitManagementMode,
}: SarayaBrandHeaderProps) {
  const isAr = language === 'ar';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    syncFullscreen();
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by browser or device policy; keep the app usable.
    }
  };

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

  const socialHref = (value: string | undefined, base: string) => {
    const url = (value || '').trim();
    if (!url) return base;
    if (/^https?:\/\//i.test(url)) return url;
    return `${base}${url.replace(/^@/, '').replace(/^\/+/, '')}`;
  };
  const instagramHref = socialHref(instagramUrl, 'https://www.instagram.com/');
  const tiktokHref = socialHref(tiktokUrl, 'https://www.tiktok.com/@');

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-amber-500/15 bg-slate-950/95 shadow-sm shadow-black/10 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-[72px] sm:gap-3 sm:px-6 lg:px-8">
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
            <span className="tracking-widest uppercase">SARAYA EVENTS</span>
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
          {!isManagementMode && (
            <>
              <a href={instagramHref} target="_blank" rel="noreferrer" aria-label="Instagram profile" title={instagramUrl?.trim() ? 'Instagram profile' : 'Set the official Instagram URL in Company Profile'} className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-300 transition-colors hover:border-amber-400/50 hover:bg-slate-900 hover:text-amber-300">
                <Instagram className="h-4 w-4" />
              </a>
              <a href={tiktokHref} target="_blank" rel="noreferrer" aria-label="TikTok profile" title={tiktokUrl?.trim() ? 'TikTok profile' : 'Set the official TikTok URL in Company Profile'} className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-300 transition-colors hover:border-amber-400/50 hover:bg-slate-900 hover:text-amber-300">
                <Music2 className="h-4 w-4" />
              </a>
            </>
          )}
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute' : 'Enable audio'}
            className="hidden sm:flex p-2 text-slate-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.click(720);
              onToggleTheme();
            }}
            aria-label={theme === 'dark' ? (isAr ? 'الوضع الفاتح' : 'Light theme') : (isAr ? 'الوضع الداكن' : 'Dark theme')}
            title={theme === 'dark' ? (isAr ? 'الوضع الفاتح' : 'Light theme') : (isAr ? 'الوضع الداكن' : 'Dark theme')}
            className="saraya-theme-toggle hidden sm:inline-flex"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden xl:inline">{theme === 'dark' ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? (isAr ? 'الخروج من ملء الشاشة' : 'Exit full screen') : (isAr ? 'ملء الشاشة' : 'Enter full screen')}
            aria-pressed={isFullscreen}
            title={isFullscreen ? (isAr ? 'الخروج من ملء الشاشة' : 'Exit full screen') : (isAr ? 'ملء الشاشة' : 'Enter full screen')}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-transparent p-2 text-slate-400 transition-colors hover:border-slate-800 hover:bg-slate-900 hover:text-amber-300"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden xl:inline">{isFullscreen ? (isAr ? 'خروج' : 'Exit') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}</span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.click(700);
              onToggleLanguage();
            }}
            className="hidden sm:inline-flex px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
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
            className="px-3 py-2 sm:px-4 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] whitespace-nowrap"
          >
            <Calendar className="inline h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">{isAr ? 'احجز مناسبتك' : 'Book Your Event'}</span>
            <span className="sm:hidden">{isAr ? 'احجز' : 'Book'}</span>
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
            <div className="mb-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3">
              {isManagementMode ? (
                <button type="button" onClick={() => { setIsMobileMenuOpen(false); onExitManagementMode(); }} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950">
                  <ArrowRight className="h-4 w-4" />{isAr ? 'العودة إلى الموقع الرئيسي' : 'Back to Customer Website'}
                </button>
              ) : (
                <button type="button" onClick={() => { setIsMobileMenuOpen(false); onOpenManagementPortal(); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 shadow-sm">
                  <Shield className="h-5 w-5" />{isAr ? 'بوابة الإدارة والتشغيل' : 'Staff Management Portal'}<ArrowRight className="h-4 w-4" />
                </button>
              )}
              <p className="mt-2 text-center text-[11px] text-slate-400">{isAr ? 'للموظفين والإدارة' : 'For staff and management'}</p>
            </div>
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

            {!isManagementMode && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
                <a href={instagramHref} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-amber-400/50 hover:text-amber-300" title={instagramUrl?.trim() ? 'Instagram profile' : 'Set the official Instagram URL in Company Profile'}>
                  <Instagram className="h-4 w-4" />Instagram
                </a>
                <a href={tiktokHref} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-amber-400/50 hover:text-amber-300" title={tiktokUrl?.trim() ? 'TikTok profile' : 'Set the official TikTok URL in Company Profile'}>
                  <Music2 className="h-4 w-4" />TikTok
                </a>
              </div>
            )}
            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => { setIsMobileMenuOpen(false); onToggleLanguage(); }} className="flex min-h-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-bold text-slate-200">{isAr ? 'English' : 'العربية'}</button>
              <button type="button" onClick={() => { setIsMobileMenuOpen(false); onToggleTheme(); }} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-bold text-slate-200">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{isAr ? (theme === 'dark' ? 'فاتح' : 'داكن') : (theme === 'dark' ? 'Light' : 'Dark')}</button>
              <button type="button" onClick={() => { setIsMobileMenuOpen(false); void toggleFullscreen(); }} aria-pressed={isFullscreen} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-bold text-slate-200">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}{isAr ? (isFullscreen ? 'خروج' : 'ملء الشاشة') : (isFullscreen ? 'Exit' : 'Fullscreen')}</button>
              <button type="button" onClick={toggleSound} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-bold text-slate-200">{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{isAr ? 'الصوت' : 'Sound'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
