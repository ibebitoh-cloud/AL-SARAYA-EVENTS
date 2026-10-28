import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Calendar,
  Heart,
  Sparkles,
  Cake,
  Presentation,
  ArrowRight,
  ArrowLeft,
  Users,
  MapPin,
  Building2,
  Award,
  PenTool,
  Truck,
  Palette,
  Mic2,
  ClipboardCheck,
  ShieldCheck,
  Volume2,
  Box,
  Compass,
  CheckCircle2,
  PhoneCall,
  Clock,
  Sparkle,
  Image as ImageIcon,
} from 'lucide-react';
import { Hall, Language, Booking } from '../types/venueSystem';
import { ALSARAYA_PHOTOS, VenuePhoto } from '../data/venueImages';
import { BrandLogo } from './BrandLogo';
import { SERVICE_KEYS, SiteContent, siteText, pickServicePhotos } from '../data/siteContent';
import { CustomerSuccessStories } from './CustomerSuccessStories';
import ballroomImg from '../assets/images/alsaraya_grand_ballroom_1791458716707.jpg';
import koshaImg from '../assets/images/alsaraya_royal_kosha_1791458732633.jpg';
import gardenImg from '../assets/images/alsaraya_garden_terrace_1791458767479.jpg';
import diningImg from '../assets/images/alsaraya_banquet_dining_1791458748323.jpg';

interface SarayaCustomerHomepageProps {
  halls: Hall[];
  photos?: VenuePhoto[];
  language: Language;
  theme?: 'dark' | 'light';
  onSelectHallForBooking: (hallId: string) => void;
  onOpenBookingModal: (hallId?: string) => void;
  onCreateBooking: (newBooking: Booking) => void;
  onOpenEventDesigner?: () => void;
  onOpenEditManager?: (tab?: 'halls' | 'photos', targetId?: string) => void;
  onNavigate?: (sectionId: string) => void;
  content?: SiteContent;
}

const OCCASIONS = [
  {
    key: 'wedding',
    icon: Heart,
    titleAr: 'حفلات الزفاف الملكية',
    titleEn: 'Royal Weddings',
    descAr: 'تصميم كوشة خاصة، زفة استعراضية، ممر رخامي بالورد الطبيعي، وأحدث هندسة صوت وإضاءة.',
    descEn: 'Couture bridal kosha, theatrical entrance aisle, fresh floral styling, and bespoke acoustics.',
    badgeAr: 'الأكثر تميزاً',
    badgeEn: 'Flagship Signature',
  },
  {
    key: 'engagement',
    icon: Sparkles,
    titleAr: 'حفلات الخطوبة وعقد القران',
    titleEn: 'Engagements & Katb Ketab',
    descAr: 'أجواء عائلية راقية مع كوشة أنيقة، ضيافة حلويات فاخرة، وتصوير فوتوغرافي احترافي.',
    descEn: 'Refined intimate ambiance, delicate floral dais, luxury sweets hospitality, and cinema photography.',
    badgeAr: 'أناقة استثنائية',
    badgeEn: 'Intimate Elegance',
  },
  {
    key: 'corporate',
    icon: Presentation,
    titleAr: 'المؤتمرات وقمم الشركات',
    titleEn: 'Corporate Summits & Galas',
    descAr: 'شاشات LED عملاقة، عزل صوتي 65dB، مقاعد مريحة لكبار الشخصيات، وبوفيه عمل مفتوح.',
    descEn: 'Panoramic LED video walls, 65dB acoustic isolation, VIP executive seating, and business dining.',
    badgeAr: 'معايير فندقية',
    badgeEn: 'Hotel Grade',
  },
  {
    key: 'birthday',
    icon: Cake,
    titleAr: 'أعياد الميلاد والمناسبات الخاصة',
    titleEn: 'Milestones & Private Galas',
    descAr: 'ديكورات بالونات مبهجة، كيك شو مخصص، إضاءة احتفالية ومؤثرات مسرحية للأعزاء.',
    descEn: 'Artistic balloon installations, custom cake reveal, festive stage lights, and luxury catering.',
    badgeAr: 'لحظات بهيجة',
    badgeEn: 'Joyful Moments',
  },
] as const;

const SERVICE_ICONS = [PenTool, Building2, Truck, ClipboardCheck, Palette, Mic2];

const HERO_HALL_SLIDES = [
  {
    id: 'arcane-hall',
    image: ballroomImg,
    titleAr: 'قاعة آركين الكبرى',
    titleEn: 'Arcane Grand Ballroom',
    subtitleAr: 'ثريات كريستال عملاقة وممر عروسين ملكي محاط بالزهور البيضاء',
    subtitleEn: 'Grand crystal chandeliers & a white marble aisle flanked with fresh florals',
    capacity: '400 ضيف · فندق آركين',
    capacityEn: '400 Guests · Arcane Hotel',
    featureAr: 'عزل صوتي فندقي 65dB',
    featureEn: '65dB Acoustic Isolation',
  },
  {
    id: 'porto-garden',
    image: gardenImg,
    titleAr: 'الحديقة المفتوحة (أوبن إير)',
    titleEn: 'Royal Open-Air Garden Terrace',
    subtitleAr: 'أمسيات تحت النجوم وإضاءات ساحرة مع نافورة ونخيل مضاء',
    subtitleEn: 'Starlit open-sky ceremonies with fairy lights, palms, and illuminated fountain',
    capacity: '500 ضيف · بورتو سعيد',
    capacityEn: '500 Guests · Porto Said',
    featureAr: 'إطلالة بحرية ونسيم عليل',
    featureEn: 'Panoramic Waterfront Sea Breeze',
  },
  {
    id: 'porto-veina',
    image: koshaImg,
    titleAr: 'كوشة العروس وقاعة فيينا',
    titleEn: 'Couture Kosha & Veina Hall',
    subtitleAr: 'أريكة مذهبة تحت قوس ورد طبيعي متدلي مع شمعدانات كريستال',
    subtitleEn: 'Gilded bridal dais under cascading florals with warm crystal candelabras',
    capacity: '400 ضيف · بورتو سعيد',
    capacityEn: '400 Guests · Porto Said',
    featureAr: 'تصميم كوشة حصري لكل مناسبة',
    featureEn: 'Exclusive Bespoke Kosha Design',
  },
  {
    id: 'porto-seila',
    image: diningImg,
    titleAr: 'قاعة سيلا والبوفيه الملكي',
    titleEn: 'Seila Hall & Royal Banquets',
    subtitleAr: 'طاولات مذهبة بشمعدانات فاخرة وأرقى خدمات الضيافة الفندقية الحية',
    subtitleEn: 'Ornate banquet tables, golden cutlery, and live gourmet catering stations',
    capacity: '300 ضيف · بورتو سعيد',
    capacityEn: '300 Guests · Porto Said',
    featureAr: 'طهي حي وضيافة 5 نجوم',
    featureEn: 'Live Cooking & 5-Star Hospitality',
  },
];

const JOURNEY_STEPS = [
  {
    step: '01',
    titleAr: 'الاستشارة الأولية والمعاينة',
    titleEn: 'Private Consultation & Viewing',
    descAr: 'نستقبلكم في جولة خاصة داخل القاعات لمناقشة رؤيتكم، عدد الضيوف، والموعد المفضل.',
    descEn: 'We welcome you for a private venue walkthrough to align on date, guest count, and artistic vision.',
  },
  {
    step: '02',
    titleAr: 'التصميم وتوزيع القاعة 3D',
    titleEn: 'Bespoke 3D Staging & Design',
    descAr: 'محاكاة ثلاثية الأبعاد كاملة لتوزيع الطاولات، ممر العروسين، الكوشة، ومنصات البوفيه.',
    descEn: 'Full 3D visualization of guest seating, bridal aisle, stage proximity, and culinary stations.',
  },
  {
    step: '03',
    titleAr: 'التجهيز والبروفة الفنية',
    titleEn: 'Production & Technical Rehearsal',
    descAr: 'تنسيق متكامل للديكور، الورود الطبيعية، شبكات الإضاءة والصوت، وبروفة دقيقة للزفة.',
    descEn: 'Flawless floral styling, ambient light tuning, sound check, and bridal entrance rehearsals.',
  },
  {
    step: '04',
    titleAr: 'ليلة العمر الملكية',
    titleEn: 'The Royal Celebration Night',
    descAr: 'فريق ضيافة وإشراف فندقي محترف يتولى أدق التفاصيل لتعيشوا أسعد لحظات العمر بكل هدوء.',
    descEn: 'Our dedicated master-of-ceremonies and culinary crew direct every detail with hotel-grade precision.',
  },
];

export function SarayaCustomerHomepage({
  halls,
  photos,
  language,
  theme = 'dark',
  onSelectHallForBooking,
  onOpenBookingModal,
  onNavigate,
  content,
}: SarayaCustomerHomepageProps) {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<VenuePhoto | null>(null);

  // Auto-rotate hero slide every 7 seconds
  useEffect(() => {
    if (isPaused || reduceMotion) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_HALL_SLIDES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused, reduceMotion]);

  const sourcePhotos = photos?.length ? photos : ALSARAYA_PHOTOS;
  const seen = new Set<string>();
  const displayPhotos = sourcePhotos.filter((photo) => {
    const source = (photo.src || '').trim().replace(/[?#].*$/, '').toLowerCase();
    if (!source || seen.has(source)) return false;
    seen.add(source);
    return true;
  });

  const photoFor = (categories: readonly string[], index = 0) => {
    const matches = displayPhotos.filter((p) => categories.includes(p.category));
    return (matches[index] ?? matches[0] ?? displayPhotos[index % Math.max(1, displayPhotos.length)])?.src || '';
  };

  const servicePhotos = pickServicePhotos(displayPhotos, content, new Set());
  const shownHalls = halls.filter((hall) => !hall.isExternalListing).slice(0, 6);
  const venues = shownHalls.length ? shownHalls : halls.slice(0, 6);
  const galleryPhotos = displayPhotos.slice(0, 6);

  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  const sectionHead = ({
    kicker,
    title,
    text,
    link,
  }: {
    kicker: string;
    title: string;
    text?: string;
    link?: { id: string; label: string };
  }) => (
    <motion.div {...reveal()} className="mb-12 flex flex-col items-center text-center sm:mb-16">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-amber-500 sm:text-sm">
        <Sparkle className="h-3 w-3 fill-amber-500" />
        <span>{kicker}</span>
        <Sparkle className="h-3 w-3 fill-amber-500" />
      </div>
      <h2
        className={`mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-5xl ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {title}
      </h2>
      {text && (
        <p
          className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {text}
        </p>
      )}
      {link && onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate(link.id)}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-500 transition-colors hover:text-amber-400 hover:underline"
        >
          {link.label}
          <Arrow className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );

  const cardStyle = isDark
    ? 'overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900/70 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-amber-400/40 hover:-translate-y-1'
    : 'overflow-hidden rounded-3xl border border-amber-900/10 bg-white/85 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-amber-700/30 hover:-translate-y-1';

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full space-y-24 sm:space-y-32">
      {/* =========================================================================
          NEW HERO: PALATIAL CINEMATIC STAGE & INTERACTIVE HALL NAVIGATOR
          ========================================================================= */}
      <section
        id="hero"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative mx-auto min-h-[90vh] sm:min-h-[92vh] w-full max-w-7xl overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-amber-500/25 shadow-2xl flex flex-col justify-between"
      >
        {/* Dynamic venue slide images with Ken Burns zoom */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 h-full w-full"
            >
              <img
                src={HERO_HALL_SLIDES[activeSlide].image}
                alt={isAr ? HERO_HALL_SLIDES[activeSlide].titleAr : HERO_HALL_SLIDES[activeSlide].titleEn}
                className="h-full w-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Opulent dark royal vignette overlay: keeps text ultra-crisp in both themes */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060a12] via-[#080d18]/65 to-[#060a12]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-[#050810]/85" />
        </div>

        {/* Top Kicker & Royal Crest */}
        <div className="relative z-10 px-4 pt-8 text-center sm:px-8 sm:pt-12">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-slate-950/65 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-300 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {isAr
                ? 'السرايا للمناسبات الفاخرة · فندق آركين & بورتو سعيد'
                : 'ELSARAYA ROYAL EVENTS · ARCANE HOTEL & PORTO SAID'}
            </span>
          </motion.div>
        </div>

        {/* Center Main Stage Copy */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-6 text-center sm:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-serif text-3xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
          >
            {isAr ? (
              <>
                <span>حيث تُصاغ الليالي الملكية</span>
                <span className="block mt-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  وتتحول اللحظات إلى أساطير
                </span>
              </>
            ) : (
              <>
                <span>Where Royal Celebrations Become</span>
                <span className="block mt-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  Timeless Palatial Legends
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-xl font-sans"
          >
            {isAr
              ? 'ست قاعات فندقية فاخرة بمواصفات عالمية، عزل صوتي متطور 65dB، وإدارة متكاملة ترعى أدق تفاصيل الزفاف وحفلات النخبة في مصر.'
              : 'Six bespoke hotel-grade venues with panoramic splendor, advanced 65dB acoustic isolation, and couture event management tailored for life’s greatest milestones.'}
          </motion.p>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <button
              type="button"
              onClick={() => onOpenBookingModal()}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-8 py-4 text-base font-bold text-slate-950 shadow-[0_12px_28px_-8px_rgba(245,158,11,0.6)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
            >
              <Calendar className="h-5 w-5" />
              <span>{isAr ? 'طلب معاينة خاصة واستشارة' : 'Request Private Consultation'}</span>
            </button>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('3d-tour')}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/60 px-6 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:border-amber-400/50 hover:bg-slate-900/80 active:scale-95"
              >
                <Box className="h-5 w-5 text-amber-400" />
                <span>{isAr ? 'جولة تفاعلية 3D للقاعات' : 'Explore 3D Virtual Tour'}</span>
              </button>
            )}
          </motion.div>

          {/* Quick Occasion Selection Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold"
          >
            {OCCASIONS.map(({ key, icon: Icon, titleAr, titleEn }) => (
              <button
                key={key}
                type="button"
                onClick={() => onOpenBookingModal()}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-slate-950/70 px-4 py-2 text-slate-200 backdrop-blur-sm transition-all hover:border-amber-400 hover:bg-amber-500/20 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5 text-amber-400" />
                <span>{isAr ? titleAr : titleEn}</span>
              </button>
            ))}
          </motion.div>
        </div>

        {/* Bottom Hall Navigator Bar */}
        <div className="relative z-10 border-t border-amber-500/20 bg-slate-950/80 p-3 backdrop-blur-xl sm:p-4">
          <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-slate-200">
                {isAr ? 'استكشف القاعات الملكية:' : 'Explore Royal Venues:'}
              </span>
            </div>

            <div className="flex w-full sm:w-auto items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
              {HERO_HALL_SLIDES.map((slide, i) => {
                const isActive = activeSlide === i;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlide(i)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? 'border border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-md'
                        : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full transition-colors ${
                        isActive ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-600'
                      }`}
                    />
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {isAr ? slide.titleAr : slide.titleEn}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-amber-300 font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>
                {isAr
                  ? HERO_HALL_SLIDES[activeSlide].featureAr
                  : HERO_HALL_SLIDES[activeSlide].featureEn}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY HALLMARKS STRIP (PRESTIGE METRICS & STANDARDS)
          ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4">
        <div
          className={`grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 rounded-3xl p-6 sm:p-8 ${
            isDark
              ? 'border border-amber-500/20 bg-slate-900/60 shadow-xl'
              : 'border border-amber-900/10 bg-white/80 shadow-md'
          }`}
        >
          <div className="flex flex-col items-center text-center p-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 mb-3">
              <Building2 className="h-6 w-6" />
            </span>
            <span className={`font-serif text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              6+
            </span>
            <span className={`text-xs sm:text-sm font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isAr ? 'قاعات ومساحات فندقية' : 'Hotel Venues & Spaces'}
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 mb-3">
              <Users className="h-6 w-6" />
            </span>
            <span className={`font-serif text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              500+
            </span>
            <span className={`text-xs sm:text-sm font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isAr ? 'سعة استيعابية للضيوف' : 'Guest Capacity'}
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 mb-3">
              <Volume2 className="h-6 w-6" />
            </span>
            <span className={`font-serif text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              65dB
            </span>
            <span className={`text-xs sm:text-sm font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isAr ? 'عزل صوتي فندقي كامل' : 'Acoustic Sound Isolation'}
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 mb-3">
              <Award className="h-6 w-6" />
            </span>
            <span className={`font-serif text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              100%
            </span>
            <span className={`text-xs sm:text-sm font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isAr ? 'تخطيط مخصص بدون باقات' : 'Bespoke Custom Planning'}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROYAL OCCASIONS (WEDDINGS, ENGAGEMENTS, CORPORATE, BIRTHDAYS)
          ========================================================================= */}
      <section id="events" className="mx-auto max-w-6xl px-4">
        {sectionHead({
          kicker: isAr ? 'المناسبات والاحتفالات' : 'Curated Experiences',
          title: isAr ? 'نُصمم لكل مناسبة طابعاً ملكياً خاصاً' : 'A Bespoke Signature for Every Celebration',
          text: isAr
            ? 'من حفلات الزفاف الأسطورية وحتى قمم الشركات الكبرى، نوفر بيئة متكاملة تجمع بين الفخامة المعمارية وأحدث التقنيات.'
            : 'From grand bridal celebrations to prestigious corporate summits, we craft bespoke environments of hotel-grade elegance.',
          link: onNavigate ? { id: 'events', label: isAr ? 'استعراض كافة المناسبات' : 'View all event types' } : undefined,
        })}

        <div className="grid gap-6 sm:grid-cols-2">
          {OCCASIONS.map(({ key, icon: Icon, titleAr, titleEn, descAr, descEn, badgeAr, badgeEn }, i) => {
            const photoSrc = photoFor([key, 'wedding', 'ballroom'], i);
            return (
              <motion.div
                key={key}
                {...reveal(i * 0.08)}
                className={`${cardStyle} group cursor-pointer flex flex-col`}
                onClick={() => onOpenBookingModal()}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={photoSrc}
                    alt={isAr ? titleAr : titleEn}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <span className="absolute start-4 top-4 flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-slate-950/80 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                    <Icon className="h-3.5 w-3.5 text-amber-400" />
                    <span>{isAr ? badgeAr : badgeEn}</span>
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                  <div>
                    <h3 className={`font-serif text-2xl font-bold sm:text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isAr ? titleAr : titleEn}
                    </h3>
                    <p className={`mt-3 text-sm leading-relaxed sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {isAr ? descAr : descEn}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-500 group-hover:text-amber-400">
                    <span>{isAr ? 'طلب تفاصيل ومعاينة' : 'Inquire & Request Tour'}</span>
                    <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          PALATIAL VENUES & HALLS (NO PRICES ON CUSTOMER VIEW)
          ========================================================================= */}
      <section id="venues" className="mx-auto max-w-6xl px-4">
        {sectionHead({
          kicker: isAr ? 'القاعات والمساحات' : 'Palatial Venues',
          title: isAr ? 'ست قاعات فندقية فاخرة في موقعين متميزين' : 'Six Prestigious Venues Across Two Iconic Destinations',
          text: isAr
            ? 'فندق آركين وبورتو سعيد — قاعات مغلقة مجهزة بالكامل ومساحات مفتوحة ساحرة على البحر والحدائق.'
            : 'Arcane Hotel & Porto Said — fully fitted royal ballrooms and breathtaking open-air seafront terraces.',
          link: onNavigate ? { id: 'venues', label: isAr ? 'استعراض كافة القاعات' : 'Explore all venues' } : undefined,
        })}

        <div className="grid gap-6 md:grid-cols-3">
          {venues.map((hall, i) => {
            const src =
              hall.photoUrl || hall.photo || hall.galleryPhotos?.[0] || photoFor(['ballroom', 'dining'], i);
            const name = isAr ? hall.name : hall.nameEn || hall.name;
            const place = isAr ? hall.cityAr || hall.city : hall.city || hall.cityAr;
            return (
              <motion.div key={hall.id} {...reveal(i * 0.08)} className={`${cardStyle} flex flex-col`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                  {src ? (
                    <img
                      src={src}
                      alt={name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-600">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  <span className="absolute end-3 top-3 rounded-full border border-white/20 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                    {place}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className={`font-serif text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {name}
                    </h3>
                    <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {hall.capacity > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-amber-400" />
                          {isAr ? `حتى ${hall.capacity} ضيف` : `Up to ${hall.capacity} guests`}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                        {isAr ? 'عزل صوتي 65dB' : 'Acoustic 65dB'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectHallForBooking(hall.id);
                      onOpenBookingModal(hall.id);
                    }}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>{isAr ? 'احجز موعد لهذه القاعة' : 'Book Visit For This Venue'}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          COUTURE SERVICES & PRODUCTION
          ========================================================================= */}
      <section id="services" className="mx-auto max-w-6xl px-4">
        {sectionHead({
          kicker: isAr ? 'خدمات الإنتاج الملكي' : 'Couture Production',
          title: isAr ? 'خدمات متكاملة برؤية فندقية شاملة' : 'Turnkey Production & Palatial Hospitality',
          text: isAr
            ? 'نوفر كل ما يحتاجه الحفل من هندسة الصوت والإضاءة وحتى البوفيه المفتوح والضيافة الراقية دون الحاجة لوسطاء.'
            : 'From acoustic engineering and live lighting rigs to gourmet catering and bespoke florals, all handled under one roof.',
          link: onNavigate ? { id: 'services', label: isAr ? 'استعراض كافة الخدمات' : 'View all services' } : undefined,
        })}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_KEYS.map((key, i) => {
            const Icon = SERVICE_ICONS[i] || Sparkles;
            const src = servicePhotos[i]?.src;
            return (
              <motion.div key={key} {...reveal((i % 3) * 0.08)} className={cardStyle}>
                {src && (
                  <div className="aspect-[16/10] overflow-hidden bg-slate-900">
                    <img
                      src={src}
                      alt={siteText(content, `services.${key}.title`, isAr)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className={`text-lg font-bold sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {siteText(content, `services.${key}.title`, isAr)}
                    </h3>
                  </div>
                  <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {siteText(content, `services.${key}.text`, isAr)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          THE SARAYA EXPERIENCE (HOW IT WORKS JOURNEY)
          ========================================================================= */}
      <section id="about" className="mx-auto max-w-6xl px-4">
        {sectionHead({
          kicker: isAr ? 'رحلة الحفل الملكي' : 'The Saraya Journey',
          title: isAr ? 'كيف نحوّل أحلامكم إلى واقع لا يُنسى' : 'From Initial Vision to Flawless Execution',
          text: isAr
            ? 'خطوات واضحة ومدروسة تضمن راحة بالكم التامة وتتيح لكم الاستمتاع بكل لحظة.'
            : 'A transparent, structured path ensuring total peace of mind for you and your guests.',
        })}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY_STEPS.map((item, i) => (
            <motion.div
              key={item.step}
              {...reveal(i * 0.08)}
              className={`${cardStyle} p-6 sm:p-7 relative flex flex-col justify-between`}
            >
              <div>
                <span className="text-3xl font-black font-serif text-amber-500/35">
                  {item.step}
                </span>
                <h3 className={`mt-3 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isAr ? item.titleAr : item.titleEn}
                </h3>
                <p className={`mt-3 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isAr ? item.descAr : item.descEn}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{isAr ? 'إشراف فندقي كامل' : 'Hotel Supervised'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          PHOTOGRAPHY & MOMENTS GALLERY
          ========================================================================= */}
      {galleryPhotos.length > 0 && (
        <section id="gallery" className="mx-auto max-w-6xl px-4">
          {sectionHead({
            kicker: isAr ? 'معرض الذكريات' : 'Royal Gallery',
            title: isAr ? 'لقطات حيّة من أبهى ليالي السرايا' : 'Unforgettable Moments Captured at AlSaraya',
            text: isAr
              ? 'تصفح باقة مختارة من صور القاعات والديكورات والكوشات المنفذة على أرض الواقع.'
              : 'Browse real moments, floral installations, and palatial koshas executed in our halls.',
            link: onNavigate ? { id: 'gallery', label: isAr ? 'استعراض كامل المعرض' : 'Open full gallery' } : undefined,
          })}

          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
            {galleryPhotos.map((photo, i) => (
              <motion.figure
                key={photo.id}
                {...reveal((i % 3) * 0.06)}
                onClick={() => setSelectedPhoto(photo)}
                className={`${cardStyle} group relative cursor-pointer ${
                  i === 0 ? 'col-span-2 row-span-2 md:col-span-2' : ''
                }`}
              >
                <img
                  src={photo.src}
                  alt={isAr ? photo.titleAr : photo.titleEn}
                  loading="lazy"
                  className="h-full min-h-48 w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent px-4 pb-4 pt-12 text-xs sm:text-sm font-semibold text-white">
                  <div className="text-amber-400 text-[10px] font-mono">
                    {isAr ? photo.hallNameAr : photo.hallNameEn}
                  </div>
                  <div>{isAr ? photo.titleAr : photo.titleEn}</div>
                </figcaption>
              </motion.figure>
            ))}
          </div>

          {/* Photo Modal */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
              onClick={() => setSelectedPhoto(null)}
            >
              <div className="relative max-w-3xl overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900 shadow-2xl">
                <img
                  src={selectedPhoto.src}
                  alt={isAr ? selectedPhoto.titleAr : selectedPhoto.titleEn}
                  className="max-h-[80vh] w-full object-contain"
                />
                <div className="p-4 text-center">
                  <h4 className="text-base font-bold text-white">
                    {isAr ? selectedPhoto.titleAr : selectedPhoto.titleEn}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    {isAr ? selectedPhoto.captionAr : selectedPhoto.captionEn}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          CUSTOMER SUCCESS STORIES (VIDEO TESTIMONIALS)
          ========================================================================= */}
      <CustomerSuccessStories
        language={language}
        theme={theme}
        onOpenBookingModal={onOpenBookingModal}
      />

      {/* =========================================================================
          CLOSING GRAND BOOKING CALL TO ACTION
          ========================================================================= */}
      <section id="contact" className="mx-auto max-w-4xl px-4 pb-16">
        <motion.div
          {...reveal()}
          className={`relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-16 ${
            isDark
              ? 'border border-amber-500/30 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 shadow-2xl'
              : 'border border-amber-900/15 bg-gradient-to-b from-white/95 via-amber-50/40 to-white shadow-xl'
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <Award className="h-7 w-7" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 sm:text-sm">
            {isAr ? 'خطوتكم الأولى نحو ليلة العمر' : 'Your Royal Celebration Awaits'}
          </p>

          <h2
            className={`mt-4 font-serif text-3xl font-bold leading-tight sm:text-5xl ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {isAr ? 'دعنا نُصمّم حفلكم بمواصفات ملكية تليق بكم' : 'Let Us Curate Your Grand Milestone'}
          </h2>

          <p
            className={`mx-auto mt-5 max-w-xl text-base leading-relaxed sm:text-lg ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {isAr
              ? 'تفضّل بطلب معاينة خاصة للقاعات ولقاء استشاري لبحث تفاصيل الموعد والخدمات وإعداد خطة الحفل.'
              : 'Request a private viewing of our ballrooms and a personalized consultation with our senior event planners.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onOpenBookingModal()}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-9 py-4 text-base font-bold text-slate-950 shadow-[0_12px_28px_-8px_rgba(245,158,11,0.6)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
            >
              <Calendar className="h-5 w-5" />
              <span>{isAr ? 'حجز موعد استشارة ومعاينة' : 'Book Private Consultation'}</span>
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
