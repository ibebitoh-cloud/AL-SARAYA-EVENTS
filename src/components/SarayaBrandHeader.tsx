import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Volume2,
  VolumeX,
  Shield,
  Calendar,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Instagram,
  Music2,
} from 'lucide-react';
import { Language, VenueTab } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import { BrandLogo } from './BrandLogo';

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

  // The four links that matter most stay on the bar; everything else lives in the menu.
  const mainLinks = navLinks.filter((link) => ['events', 'venues', 'gallery', 'contact'].includes(link.id));
  const go = (id: string) => {
    sound.tick();
    setIsMobileMenuOpen(false);
    if (isManagementMode) onExitManagementMode();
    onNavigateSection(id);
  };
  const chip = 'flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#78350f]/15 bg-white/60 px-2 py-2 text-xs font-bold text-[#78350f] transition-colors hover:bg-white';

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-[#b45309]/15 bg-[#fffbeb]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a
          href="#hero"
          onClick={(e) => { e.preventDefault(); sound.swoosh(); go('hero'); }}
          aria-label="ELSARAYA EVENTS"
          className="group flex shrink-0 items-center"
        >
          <BrandLogo tone="dark" className="h-8 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-9" />
        </a>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#78350f]/75 lg:flex">
          {mainLinks.map((link) => (
            <a key={link.id} href={`?section=${link.id}`} onClick={(e) => { e.preventDefault(); go(link.id); }} className="relative py-1 transition-colors hover:text-[#78350f] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-[#d97706] after:transition-transform hover:after:scale-x-100">
              {isAr ? link.labelAr : link.labelEn}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => { sound.click(700); onToggleLanguage(); }} className="hidden h-9 items-center rounded-full px-3 text-xs font-bold text-[#78350f]/80 transition-colors hover:bg-[#78350f]/5 hover:text-[#78350f] sm:inline-flex">
            {isAr ? 'EN' : 'العربية'}
          </button>
          <button type="button" onClick={() => { sound.chime(); onOpenBookingModal(); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#78350f] px-4 text-xs font-bold text-[#fef3c7] shadow-[0_6px_18px_-6px_rgba(120,53,15,0.6)] transition-colors hover:bg-[#92400e]">
            <Calendar className="h-4 w-4" />
            {isAr ? 'احجز' : 'Book'}
          </button>
          <button type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-expanded={isMobileMenuOpen} aria-label={isAr ? 'القائمة' : 'Menu'} className="flex h-9 w-9 items-center justify-center rounded-full text-[#78350f] transition-colors hover:bg-[#78350f]/5">
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[#b45309]/10 bg-[#fffbeb]/95 backdrop-blur-xl"
          >
            <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
              <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                {navLinks.map((link) => (
                  <a key={link.id} href={`#${link.id}`} onClick={(e) => { e.preventDefault(); go(link.id); }} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#78350f]/80 transition-colors hover:bg-white/70 hover:text-[#78350f]">
                    {isAr ? link.labelAr : link.labelEn}
                  </a>
                ))}
              </nav>
              <div className="grid grid-cols-3 gap-2 border-t border-[#b45309]/10 pt-4 sm:grid-cols-6">
                <button type="button" onClick={() => { setIsMobileMenuOpen(false); onToggleLanguage(); }} className={chip}>{isAr ? 'English' : 'العربية'}</button>
                <button type="button" onClick={() => { setIsMobileMenuOpen(false); onToggleTheme(); }} className={chip}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{theme === 'dark' ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}</button>
                <button type="button" onClick={toggleSound} className={chip}>{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{isAr ? 'الصوت' : 'Sound'}</button>
                <button type="button" onClick={() => { setIsMobileMenuOpen(false); void toggleFullscreen(); }} aria-pressed={isFullscreen} className={chip}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}{isAr ? 'الشاشة' : 'Screen'}</button>
                <a href={instagramHref} target="_blank" rel="noreferrer" className={chip}><Instagram className="h-4 w-4" />Instagram</a>
                <a href={tiktokHref} target="_blank" rel="noreferrer" className={chip}><Music2 className="h-4 w-4" />TikTok</a>
              </div>
              <button type="button" onClick={() => { setIsMobileMenuOpen(false); sound.click(600); onOpenManagementPortal(); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#78350f]/20 px-4 py-2.5 text-xs font-semibold text-[#78350f]/70 transition-colors hover:bg-white/70 hover:text-[#78350f]">
                <Shield className="h-4 w-4" />{isAr ? 'بوابة الموظفين' : 'Staff Portal'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
