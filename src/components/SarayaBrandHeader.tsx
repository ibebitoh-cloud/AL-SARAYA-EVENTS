import { useEffect, useState } from 'react';
import {
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
import { Language } from '../types/venueSystem';
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

  const go = (id: string) => {
    sound.tick();
    if (isManagementMode) onExitManagementMode();
    onNavigateSection(id);
  };

  // Every link and tool sits in the bar: on wide screens they fill the top row, and on
  // smaller screens the same links and tools run along a second, scrollable row. No dropdown.
  const linkClass = 'shrink-0 whitespace-nowrap text-sm font-semibold text-[#78350f]/75 transition-colors hover:text-[#78350f]';
  const iconBtn = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#78350f] transition-colors hover:bg-[#78350f]/5';
  const chip = 'flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#78350f]/15 bg-white/60 px-3 text-xs font-bold text-[#78350f] transition-colors hover:bg-white';

  const linkItems = navLinks.map((link) => (
    <a key={link.id} href={`?section=${link.id}`} onClick={(e) => { e.preventDefault(); go(link.id); }} className={linkClass}>
      {isAr ? link.labelAr : link.labelEn}
    </a>
  ));

  const toolItems = (
    <>
      <button type="button" onClick={() => { sound.click(700); onToggleLanguage(); }} className={chip}>{isAr ? 'English' : 'العربية'}</button>
      <button type="button" onClick={() => { sound.click(600); onToggleTheme(); }} className={chip}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{theme === 'dark' ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}</button>
      <button type="button" onClick={toggleSound} className={chip}>{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{isAr ? 'الصوت' : 'Sound'}</button>
      <button type="button" onClick={() => { void toggleFullscreen(); }} aria-pressed={isFullscreen} className={chip}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}{isAr ? 'الشاشة' : 'Screen'}</button>
      <a href={instagramHref} target="_blank" rel="noreferrer" className={chip}><Instagram className="h-4 w-4" />Instagram</a>
      <a href={tiktokHref} target="_blank" rel="noreferrer" className={chip}><Music2 className="h-4 w-4" />TikTok</a>
      <button type="button" onClick={() => { sound.click(600); onOpenManagementPortal(); }} className={chip}><Shield className="h-4 w-4" />{isAr ? 'بوابة الموظفين' : 'Staff Portal'}</button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-[#b45309]/15 bg-[#fffbeb]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#hero"
          onClick={(e) => { e.preventDefault(); sound.swoosh(); go('hero'); }}
          aria-label="ELSARAYA EVENTS"
          className="group flex shrink-0 items-center"
        >
          <BrandLogo tone="dark" className="h-8 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-9" />
        </a>

        <nav className="hidden items-center gap-5 xl:flex">{linkItems}</nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-1 xl:flex">
            <button type="button" onClick={() => { sound.click(600); onToggleTheme(); }} aria-label={theme === 'dark' ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')} title={theme === 'dark' ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')} className={iconBtn}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button type="button" onClick={toggleSound} aria-label={isAr ? 'الصوت' : 'Sound'} title={isAr ? 'الصوت' : 'Sound'} className={iconBtn}>
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => { void toggleFullscreen(); }} aria-label={isAr ? 'الشاشة' : 'Screen'} aria-pressed={isFullscreen} className={iconBtn}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <a href={instagramHref} target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram" className={iconBtn}><Instagram className="h-4 w-4" /></a>
            <a href={tiktokHref} target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok" className={iconBtn}><Music2 className="h-4 w-4" /></a>
            <button type="button" onClick={() => { sound.click(600); onOpenManagementPortal(); }} aria-label={isAr ? 'بوابة الموظفين' : 'Staff Portal'} title={isAr ? 'بوابة الموظفين' : 'Staff Portal'} className={iconBtn}><Shield className="h-4 w-4" /></button>
          </div>
          <button type="button" onClick={() => { sound.click(700); onToggleLanguage(); }} className="hidden h-9 items-center rounded-full px-3 text-xs font-bold text-[#78350f]/80 transition-colors hover:bg-[#78350f]/5 hover:text-[#78350f] sm:inline-flex">
            {isAr ? 'EN' : 'العربية'}
          </button>
          <button type="button" onClick={() => { sound.chime(); onOpenBookingModal(); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#78350f] px-4 text-xs font-bold text-[#fef3c7] shadow-[0_6px_18px_-6px_rgba(120,53,15,0.6)] transition-colors hover:bg-[#92400e]">
            <Calendar className="h-4 w-4" />
            {isAr ? 'احجز' : 'Book'}
          </button>
        </div>
      </div>

      <div className="border-t border-[#b45309]/10 xl:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {linkItems}
          <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-[#b45309]/20" />
          {toolItems}
        </div>
      </div>
    </header>
  );
}
