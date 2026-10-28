import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Shield,
  Calendar,
  Sun,
  Moon,
  Instagram,
  Music2,
  Menu,
  X,
  Sparkles,
  Building2,
  Heart,
  Video,
  Box,
  Image as ImageIcon,
  Info,
  PhoneCall,
  Globe,
  ArrowRight,
  ArrowLeft,
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
  const isDark = theme === 'dark';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for subtle shadow/blur elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) sound.click(650);
  };

  const navLinks = [
    { id: 'venues', labelAr: 'القاعات', labelEn: 'Venues', icon: Building2 },
    { id: 'events', labelAr: 'المناسبات', labelEn: 'Events', icon: Heart },
    { id: 'services', labelAr: 'الخدمات', labelEn: 'Services', icon: Sparkles },
    { id: '3d-tour', labelAr: 'المحاكاة 3D', labelEn: '3D Tour', icon: Box },
    { id: 'stories', labelAr: 'قصص النجاح', labelEn: 'Success Stories', icon: Video },
    { id: 'gallery', labelAr: 'معرض الصور', labelEn: 'Gallery', icon: ImageIcon },
    { id: 'about', labelAr: 'عن السرايا', labelEn: 'About', icon: Info },
    { id: 'contact', labelAr: 'تواصل معنا', labelEn: 'Contact', icon: PhoneCall },
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
    setMobileMenuOpen(false);
    if (isManagementMode) onExitManagementMode();
    onNavigateSection(id);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full shrink-0 transition-all duration-300 ${
        scrolled
          ? isDark
            ? 'border-b border-amber-500/20 bg-slate-950/90 shadow-2xl backdrop-blur-xl'
            : 'border-b border-amber-900/10 bg-white/90 shadow-md backdrop-blur-xl'
          : isDark
          ? 'border-b border-amber-500/15 bg-slate-950/75 backdrop-blur-md'
          : 'border-b border-amber-900/10 bg-white/80 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            sound.swoosh();
            go('hero');
          }}
          aria-label="ELSARAYA EVENTS"
          className="group flex shrink-0 items-center transition-transform hover:scale-[1.02]"
        >
          <BrandLogo
            variant="horizontal"
            tone={isDark ? 'white' : 'dark'}
            className="h-9 sm:h-10 w-auto object-contain"
          />
        </a>

        {/* Desktop Navigation (Visible on lg screens 1024px+) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(link.id);
              }}
              className={`text-sm font-semibold tracking-wide transition-colors duration-200 relative py-1 ${
                isDark
                  ? 'text-slate-300 hover:text-amber-400'
                  : 'text-slate-700 hover:text-amber-700'
              }`}
            >
              <span>{isAr ? link.labelAr : link.labelEn}</span>
            </a>
          ))}
        </nav>

        {/* Header Right Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => {
              sound.click(600);
              onToggleTheme();
            }}
            aria-label={theme === 'dark' ? (isAr ? 'الوضع الفاتح' : 'Light Mode') : (isAr ? 'الوضع الداكن' : 'Dark Mode')}
            title={theme === 'dark' ? (isAr ? 'الوضع الفاتح' : 'Light Mode') : (isAr ? 'الوضع الداكن' : 'Dark Mode')}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              isDark
                ? 'border border-amber-500/20 bg-slate-900/80 text-amber-400 hover:bg-slate-800'
                : 'border border-amber-900/10 bg-slate-100/80 text-slate-700 hover:bg-white hover:text-amber-800 shadow-xs'
            }`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Sound Toggle Button (Desktop & Tablet) */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isAr ? 'المؤثرات الصوتية' : 'Sound Effects'}
            title={isAr ? 'المؤثرات الصوتية' : 'Sound Effects'}
            className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              isDark
                ? 'border border-amber-500/20 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-amber-400'
                : 'border border-amber-900/10 bg-slate-100/80 text-slate-700 hover:bg-white hover:text-amber-800 shadow-xs'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-amber-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => {
              sound.click(700);
              onToggleLanguage();
            }}
            aria-label={isAr ? 'Switch to English' : 'التحويل للعربية'}
            className={`hidden sm:inline-flex items-center gap-1.5 h-9 rounded-full px-3.5 text-xs font-bold transition-all ${
              isDark
                ? 'border border-amber-500/20 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-amber-400'
                : 'border border-amber-900/10 bg-slate-100/80 text-slate-700 hover:bg-white hover:text-amber-800 shadow-xs'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-amber-500" />
            <span>{isAr ? 'EN' : 'العربية'}</span>
          </button>

          {/* Admin Portal Button (Desktop & Tablet with clear label, compact icon on small screens) */}
          <button
            type="button"
            onClick={() => {
              sound.click(600);
              onOpenManagementPortal();
            }}
            aria-label={isAr ? 'دخول الإدارة' : 'Admin Portal'}
            title={isAr ? 'دخول الإدارة' : 'Admin Portal'}
            className={`inline-flex items-center gap-1.5 h-9 sm:h-10 rounded-full px-2.5 sm:px-4 text-xs font-bold transition-all ${
              isDark
                ? 'border border-amber-500/35 bg-slate-900/90 text-amber-300 hover:bg-slate-800 hover:border-amber-400 shadow-sm'
                : 'border border-amber-900/20 bg-amber-50/80 text-amber-900 hover:bg-white hover:text-amber-950 shadow-xs'
            }`}
          >
            <Shield className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">
              {isAr ? 'دخول الإدارة' : 'Admin Portal'}
            </span>
          </button>

          {/* Primary Action Button (Book Visit) */}
          <button
            type="button"
            onClick={() => {
              sound.chime();
              onOpenBookingModal();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 text-xs font-bold text-slate-950 shadow-[0_4px_16px_-4px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
          >
            <Calendar className="h-4 w-4" />
            <span>{isAr ? 'حجز موعد' : 'Book Visit'}</span>
          </button>

          {/* Mobile Hamburger Menu Toggle (Hidden on lg+) */}
          <button
            type="button"
            onClick={() => {
              sound.click(600);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label={mobileMenuOpen ? (isAr ? 'إغلاق القائمة' : 'Close Menu') : (isAr ? 'فتح القائمة' : 'Open Menu')}
            className={`flex lg:hidden h-10 w-10 items-center justify-center rounded-full transition-colors ${
              isDark
                ? 'border border-amber-500/25 bg-slate-900/80 text-slate-200 hover:bg-slate-800'
                : 'border border-amber-900/15 bg-white text-slate-800 shadow-sm'
            }`}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          LUXURY MOBILE & TABLET DRAWER OVERLAY
          ========================================================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: isAr ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? '100%' : '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-y-0 ${
                isAr ? 'right-0' : 'left-0'
              } w-full max-w-sm flex flex-col justify-between overflow-y-auto p-6 shadow-2xl ${
                isDark
                  ? 'border-s border-amber-500/20 bg-slate-950 text-slate-100'
                  : 'border-s border-amber-900/15 bg-white text-slate-900'
              }`}
            >
              {/* Drawer Top Lockup */}
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-amber-500/20">
                  <BrandLogo
                    variant="horizontal"
                    tone={isDark ? 'white' : 'dark'}
                    className="h-8 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label={isAr ? 'إغلاق' : 'Close'}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      isDark
                        ? 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                        : 'border border-slate-200 bg-slate-100 text-slate-700 hover:text-black'
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Prominent Admin Portal Card at Top of Drawer */}
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.click(600);
                      setMobileMenuOpen(false);
                      onOpenManagementPortal();
                    }}
                    className={`flex items-center justify-between w-full rounded-2xl p-3.5 text-start transition-all shadow-sm ${
                      isDark
                        ? 'border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 text-slate-100 hover:border-amber-400/60'
                        : 'border border-amber-900/20 bg-gradient-to-r from-amber-100/70 via-amber-50 to-white text-slate-900 hover:border-amber-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md">
                        <Shield className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-amber-500">
                          {isAr ? 'دخول الإدارة' : 'Admin Portal'}
                        </div>
                        <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {isAr ? 'لوحة تحكم القاعات والموظفين' : 'Halls, Bookings & Staff'}
                        </div>
                      </div>
                    </div>
                    <Arrow className="h-4 w-4 text-amber-500 shrink-0" />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="mt-5 flex flex-col gap-1.5">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => go(link.id)}
                        className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-base font-semibold transition-all ${
                          isDark
                            ? 'text-slate-200 hover:bg-slate-900 hover:text-amber-400'
                            : 'text-slate-800 hover:bg-amber-50/70 hover:text-amber-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                              isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{isAr ? link.labelAr : link.labelEn}</span>
                        </div>
                        <Arrow className="h-4 w-4 text-slate-500" />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Bottom Controls & Socials */}
              <div className="mt-8 pt-6 border-t border-amber-500/20 space-y-4">
                {/* Book Consultation Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBookingModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3.5 text-sm font-bold text-slate-950 shadow-md transition-all hover:brightness-110 active:scale-95"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{isAr ? 'حجز موعد استشارة ومعاينة' : 'Book Private Consultation'}</span>
                </button>

                {/* Quick Preferences Bar (Language & Sound) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.click(700);
                      onToggleLanguage();
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors ${
                      isDark
                        ? 'border border-slate-800 bg-slate-900 text-slate-300'
                        : 'border border-slate-200 bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Globe className="h-4 w-4 text-amber-500" />
                    <span>{isAr ? 'English Language' : 'اللغة العربية'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleSound}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors ${
                      isDark
                        ? 'border border-slate-800 bg-slate-900 text-slate-300'
                        : 'border border-slate-200 bg-slate-100 text-slate-700'
                    }`}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-amber-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-slate-500" />
                    )}
                    <span>{soundEnabled ? (isAr ? 'الصوت مفعّل' : 'Sound On') : (isAr ? 'كتم الصوت' : 'Sound Off')}</span>
                  </button>
                </div>

                {/* Social Channels & Staff Portal */}
                <div className="flex items-center justify-between text-xs pt-2 text-slate-400">
                  <div className="flex items-center gap-3">
                    <a
                      href={instagramHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-pink-400"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>Instagram</span>
                    </a>
                    <a
                      href={tiktokHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-cyan-400"
                    >
                      <Music2 className="h-4 w-4" />
                      <span>TikTok</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenManagementPortal();
                    }}
                    className="flex items-center gap-1.5 hover:text-amber-400 font-semibold"
                  >
                    <Shield className="h-3.5 w-3.5 text-amber-500" />
                    <span>{isAr ? 'دخول الإدارة' : 'Admin Portal'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
