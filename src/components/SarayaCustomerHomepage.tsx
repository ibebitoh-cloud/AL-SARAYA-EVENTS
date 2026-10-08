import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Utensils,
  Camera,
  Music,
  Heart,
  ChevronDown,
  Eye,
  Sliders,
  Compass,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Star,
  Flame,
  Layers,
  Send,
  Building,
  Edit3,
} from 'lucide-react';
import { Hall, Language, Booking, EventType } from '../types/venueSystem';
import { ALSARAYA_PHOTOS, VenuePhoto, BIRTHDAY_DECORATION_PHOTOS } from '../data/venueImages';
import { Saraya3DViewer } from './Saraya3DViewer';
import { RelatedPhotosLibraryModal } from './RelatedPhotosLibraryModal';
import { sound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface SarayaCustomerHomepageProps {
  halls: Hall[];
  photos?: VenuePhoto[];
  language: Language;
  onSelectHallForBooking: (hallId: string) => void;
  onOpenBookingModal: () => void;
  onCreateBooking: (newBooking: Booking) => void;
  onOpenEditManager?: (tab?: 'halls' | 'photos', targetId?: string) => void;
}

export function SarayaCustomerHomepage({
  halls,
  photos,
  language,
  onSelectHallForBooking,
  onOpenBookingModal,
  onCreateBooking,
  onOpenEditManager,
}: SarayaCustomerHomepageProps) {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const displayPhotos = photos && photos.length > 0 ? photos : ALSARAYA_PHOTOS;

  // Selected event type for explorer section
  const [selectedEventType, setSelectedEventType] = useState<'wedding' | 'engagement' | 'birthday' | 'corporate'>('wedding');

  // Selected gallery filter
  const [galleryCategory, setGalleryCategory] = useState<string>('all');
  const [activeLibraryPhoto, setActiveLibraryPhoto] = useState<VenuePhoto | null>(null);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState<boolean>(false);

  const handleOpenLibraryPhoto = (photo: VenuePhoto) => {
    sound.click(650);
    setActiveLibraryPhoto(photo);
    setIsLibraryModalOpen(true);
  };

  // Interactive Planner state
  const [plannerEventType, setPlannerEventType] = useState<EventType>('wedding');
  const [plannerGuestCount, setPlannerGuestCount] = useState<number>(300);
  const [plannerHallId, setPlannerHallId] = useState<string>(halls[0]?.id || 'hall-1');
  const [plannerStyle, setPlannerStyle] = useState<'royal_gold' | 'modern_crystal' | 'botanical' | 'minimal_white'>('royal_gold');
  const [plannerMenuTier, setPlannerMenuTier] = useState<'classic' | 'diamond' | 'royal'>('diamond');

  // Upgrades
  const [upgradeKosha, setUpgradeKosha] = useState<boolean>(true);
  const [upgradeDrone, setUpgradeDrone] = useState<boolean>(true);
  const [upgradeRoboticLights, setUpgradeRoboticLights] = useState<boolean>(true);
  const [upgradeLowFog, setUpgradeLowFog] = useState<boolean>(true);
  const [upgradeWelcomeBar, setUpgradeWelcomeBar] = useState<boolean>(false);

  // Lead contact form for planner
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('2026-06-20');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [isInquirySubmitted, setIsInquirySubmitted] = useState<boolean>(false);

  // Direct contact form state
  const [directName, setDirectName] = useState<string>('');
  const [directPhone, setDirectPhone] = useState<string>('');
  const [directEventType, setDirectEventType] = useState<EventType>('wedding');
  const [directDate, setDirectDate] = useState<string>('2026-07-15');
  const [directMessage, setDirectMessage] = useState<string>('');
  const [isDirectSubmitted, setIsDirectSubmitted] = useState<boolean>(false);

  const selectedPlannerHall = halls.find((h) => h.id === plannerHallId) || halls[0];

  // Pricing formula for interactive planner
  const menuPricePerGuest = {
    classic: 140,
    diamond: 190,
    royal: 260,
  }[plannerMenuTier];

  const cateringTotal = plannerGuestCount * menuPricePerGuest;
  const upgradesTotal =
    (upgradeKosha ? 12000 : 0) +
    (upgradeDrone ? 9500 : 0) +
    (upgradeRoboticLights ? 7000 : 0) +
    (upgradeLowFog ? 4500 : 0) +
    (upgradeWelcomeBar ? 5500 : 0);

  const hallBasePrice = selectedPlannerHall?.basePrice || 50000;
  const estimatedInvestmentTotal = hallBasePrice + cateringTotal + upgradesTotal;
  const suggestedDeposit = Math.round(estimatedInvestmentTotal * 0.3);

  // Submit planner inquiry handler
  const handlePlannerInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      sound.tick();
      return;
    }

    sound.fanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      code: `SAR-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName,
      clientPhone,
      eventType: plannerEventType,
      date: eventDate || new Date().toISOString().split('T')[0],
      startTime: '19:00',
      endTime: '01:00',
      hallId: plannerHallId,
      hallName: selectedPlannerHall?.name || 'القاعة الملكية الكبرى',
      guestCount: plannerGuestCount,
      basePrice: hallBasePrice,
      totalPrice: estimatedInvestmentTotal,
      deposit: suggestedDeposit,
      paidAmount: suggestedDeposit,
      remainingAmount: estimatedInvestmentTotal - suggestedDeposit,
      securityDeposit: 8000,
      securityDepositStatus: 'held',
      status: 'tentative',
      notes: `طلب حجز من الموقع الرسمي للسرايا - النمط: ${plannerStyle}، المنيو: ${plannerMenuTier}، ملاحظات: ${clientNotes || 'لا توجد'}`,
      services: [
        {
          id: 'srv-1',
          serviceId: 'srv-1',
          name: 'بوفيه وضيافة السرايا الفاخرة',
          quantity: 1,
          unitPrice: cateringTotal,
          costPrice: Math.round(cateringTotal * 0.65),
          totalPrice: cateringTotal,
          totalCost: Math.round(cateringTotal * 0.65),
        },
        {
          id: 'srv-2',
          serviceId: 'srv-2',
          name: 'كوشة وتجهيزات الديكور والإضاءة',
          quantity: 1,
          unitPrice: upgradesTotal,
          costPrice: Math.round(upgradesTotal * 0.5),
          totalPrice: upgradesTotal,
          totalCost: Math.round(upgradesTotal * 0.5),
        },
      ],
      assignedStaff: [],
      suppliesCost: 4500,
      directExpenses: 3500,
    };

    onCreateBooking(newBooking);
    setIsInquirySubmitted(true);
  };

  // Submit direct contact handler
  const handleDirectContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName || !directPhone) return;

    sound.chime();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
    });

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      code: `SAR-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: directName,
      clientPhone: directPhone,
      eventType: directEventType,
      date: directDate || new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '00:00',
      hallId: halls[0]?.id || 'hall-1',
      hallName: halls[0]?.name || 'القاعة الملكية الكبرى',
      guestCount: 250,
      basePrice: 50000,
      totalPrice: 85000,
      deposit: 25000,
      paidAmount: 25000,
      remainingAmount: 60000,
      securityDeposit: 8000,
      securityDepositStatus: 'held',
      status: 'tentative',
      notes: `استفسار مباشر من الموقع: ${directMessage || 'طلب معاينة وتفاصيل أسعار'}`,
      services: [],
      assignedStaff: [],
      suppliesCost: 3500,
      directExpenses: 2500,
    };

    onCreateBooking(newBooking);
    setIsDirectSubmitted(true);
  };

  // Filtered gallery photos
  const filteredPhotos = displayPhotos.filter((p) => {
    if (galleryCategory === 'all') return true;
    if (galleryCategory === 'weddings') return p.category === 'wedding' || p.category === 'ballroom';
    if (galleryCategory === 'kosha') return p.category === 'kosha';
    if (galleryCategory === 'dining') return p.category === 'dining';
    if (galleryCategory === 'garden') return p.category === 'garden';
    if (galleryCategory === 'corporate') return p.category === 'corporate';
    if (galleryCategory === 'birthday') return p.category === 'birthday';
    return true;
  });

  return (
    <div className="w-full space-y-24 sm:space-y-32 pb-24 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* =========================================================================
          SECTION 1: HERO SECTION
          ========================================================================= */}
      <section
        id="hero"
        className="relative -mt-6 pt-16 sm:pt-24 pb-20 sm:pb-28 overflow-hidden rounded-3xl border border-amber-500/15 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl"
      >
        {/* Background Image Texture with Scrim */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={displayPhotos[0]?.src || ALSARAYA_PHOTOS[0].src}
            alt="Saraya Grand Ballroom"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105 transform motion-safe:animate-pulse transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Unboxed Brand Kicker (No Pill) */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-widest text-amber-300 uppercase">
            <span>{isAr ? 'السرايا لتنظيم المناسبات والأعراس الملكية' : 'Saraya Luxury Weddings & Venues Egypt'}</span>
            <span aria-hidden="true">·</span>
            <span>{isAr ? 'القاهرة والإسكندرية' : 'Cairo & Alexandria'}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-white leading-tight sm:leading-none text-balance">
            {isAr ? (
              <>
                حيث تصبح أروع ليالي العمر <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
                  أسطورة خالدة من الفخامة والجمال
                </span>
              </>
            ) : (
              <>
                Where Egypt&apos;s Grandest Celebrations <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
                  Come to Life with Timeless Elegance
                </span>
              </>
            )}
          </h1>

          {/* Subheading / Value Proposition */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed text-balance">
            {isAr
              ? 'أرقى قاعات المناسبات الفندقية المستقلة في مصر. نتولى أدق تفاصيل يومك من الكوشة الملكية، الديكورات العالمية، البوفيه الفندقي المفتوح، وحتى الإشراف الميداني الشامل وهندسة الصوت والإضاءة.'
              : 'Egypt’s premier independent luxury event palace. We craft unforgettable weddings, grand engagements, and corporate galas with bespoke bridal koshas, 5-star culinary banquets, concert-grade acoustic engineering, and full coordination.'}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#planner"
              onClick={(e) => {
                e.preventDefault();
                sound.chime();
                const el = document.getElementById('planner');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl transition-all shadow-[0_0_25px_rgba(212,175,55,0.45)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isAr ? 'صمم مناسبتك واحسب تكلفتها' : 'Plan Your Event & Get Estimate'}</span>
              <ArrowIcon className="w-4 h-4" />
            </a>

            <a
              href="#venues"
              onClick={(e) => {
                e.preventDefault();
                sound.click(650);
                const el = document.getElementById('venues');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-7 py-4 text-sm font-semibold text-white bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 hover:border-amber-400 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'استكشف القاعات والمحاكاة 3D' : 'Explore Halls & 3D Tour'}</span>
            </a>
          </div>

          {/* Trust Metrics & Proof (Strict Zero-Pill Typography) */}
          <div className="pt-10 border-t border-amber-500/15 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-black text-amber-300 tabular-nums">1,200+</div>
              <div className="text-xs text-slate-400 mt-0.5">{isAr ? 'حفل زفاف ومناسبة منفذة' : 'Weddings & Galas Hosted'}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-black text-amber-300 tabular-nums">4</div>
              <div className="text-xs text-slate-400 mt-0.5">{isAr ? 'قاعات ملكية فندقية مستقلة' : 'Signature Luxury Halls'}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-black text-amber-300 tabular-nums">10,000 m²</div>
              <div className="text-xs text-slate-400 mt-0.5">{isAr ? 'مساحة القصر والحدائق' : 'Palace Grounds & Terraces'}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-black text-amber-300 tabular-nums">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">{isAr ? 'إنتاج وتنسيق داخلي متكامل' : 'In-House Production'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: EVENT TYPES EXPLORER
          ========================================================================= */}
      <section id="events" className="space-y-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-amber-500/15 pb-5">
          <div>
            <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
              {isAr ? '01. المناسبات والاحتفالات' : '01. Signature Event Experiences'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mt-1">
              {isAr ? 'كل مناسبة هي تحفة فنية مصممة خصيصاً لك' : 'Crafted Experiences for Every Milestone'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            {isAr
              ? 'اختر نوع مناسبتك للاطلاع على المواصفات والترتيبات الخاصة التي تقدمها السرايا.'
              : 'Explore the dedicated setup, bridal protocols, and staging tailored for your specific celebration.'}
          </p>
        </div>

        {/* Interactive Event Type Tabs (Functional Filter Buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
          {[
            { id: 'wedding', labelAr: 'أفراح وزفاف ملكي', labelEn: 'Royal Weddings', icon: Heart },
            { id: 'engagement', labelAr: 'خطوبة وعقد قران', labelEn: 'Engagements', icon: Sparkles },
            { id: 'birthday', labelAr: 'أعياد ميلاد وحفلات', labelEn: 'Birthdays & Parties', icon: Flame },
            { id: 'corporate', labelAr: 'مؤتمرات وشركات', labelEn: 'Corporate Summits', icon: Building },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedEventType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedEventType(item.id as any);
                  sound.tick();
                }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                <span className="whitespace-nowrap">{isAr ? item.labelAr : item.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Event Type Showcase Display Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedEventType}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-amber-500/20 bg-slate-900/60 p-6 sm:p-8 lg:p-10 backdrop-blur-sm"
          >
            {/* Visual Column */}
            <div className="lg:col-span-7 relative h-72 sm:h-96 rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl">
              <img
                src={
                  selectedEventType === 'wedding'
                    ? ALSARAYA_PHOTOS[2].src
                    : selectedEventType === 'engagement'
                    ? ALSARAYA_PHOTOS[1].src
                    : selectedEventType === 'birthday'
                    ? (displayPhotos.find((p) => p.category === 'birthday')?.src || BIRTHDAY_DECORATION_PHOTOS[0].src)
                    : ALSARAYA_PHOTOS[4].src
                }
                alt="Event showcase"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 start-4 end-4 text-xs text-amber-200 bg-slate-950/80 backdrop-blur p-3 rounded-xl border border-amber-500/30">
                {selectedEventType === 'wedding' && (isAr ? 'ممشى الزفة الملكي مع ممر رخامي وأقواس زهور طبيعية بطول 25 متراً' : '25m Imperial marble bridal runway with custom floral wisteria')}
                {selectedEventType === 'engagement' && (isAr ? 'كوشة عصرية مخملية مع تفاصيل الإضاءة الدافئة لليالي الخطوبة الحميمية' : 'Couture velvet bridal kosha with romantic candlelight illumination')}
                {selectedEventType === 'birthday' && (isAr ? 'طاولات طعام فندقية ومحطات كيك ومشروبات مبتكرة مع عروض ضوئية' : 'Five-star banquet dining with custom dessert and mocktail towers')}
                {selectedEventType === 'corporate' && (isAr ? 'شاشات عرض LED بدقة 4K مع بنية صوتية مخصصة للمؤتمرات وكبار الزوار' : 'Curved 4K LED presentation wall and executive translation booths')}
              </div>
            </div>

            {/* Details & Specs Column */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                  {selectedEventType === 'wedding' && (isAr ? 'حفلات الزفاف الكبرى' : 'Signature Weddings')}
                  {selectedEventType === 'engagement' && (isAr ? 'الخطوبة وعقد القران' : 'Bespoke Engagements')}
                  {selectedEventType === 'birthday' && (isAr ? 'المناسبات الخاصة وأعياد الميلاد' : 'Private Celebrations')}
                  {selectedEventType === 'corporate' && (isAr ? 'المؤتمرات وفعاليات الهيئات والشركات' : 'Corporate Galas & Summits')}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                  {selectedEventType === 'wedding' && (isAr ? 'زفة أسطورية تليق بأميرات السرايا' : 'An Unforgettable Royal Fairy Tale')}
                  {selectedEventType === 'engagement' && (isAr ? 'أمسية دافئة مفعمة بالرقي والفرح العائلي' : 'Intimate Luxury for Family Celebrations')}
                  {selectedEventType === 'birthday' && (isAr ? 'أجواء عصرية نابضة بالحيوية والإبهار' : 'High-Energy Contemporary Atmosphere')}
                  {selectedEventType === 'corporate' && (isAr ? 'تنظيم بروتوكولي رفيع المستوى للمؤسسات' : 'Presidential Standards for Corporate Excellence')}
                </h3>
              </div>

              {/* Feature Points */}
              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                {selectedEventType === 'wedding' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'كوشة عروس مخصصة بتصميم مهندس ديكور السرايا مع باقات زهور طبيعية.' : 'Custom bridal kosha styled by in-house floral architects with fresh imports.'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'جناح خاص للعروس (Bridal Suite) مجهز بالكامل مع خزانة ومرافق عناية خاصة.' : 'Dedicated private Bridal Suite with Hollywood vanity, private bath, and safe.'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'نظام صوت L-Acoustics، أجهزة دخان هازر، وأعمدة شرار بارد لرقصة الزفاف الأولى.' : 'L-Acoustics line arrays, low-fog clouds, and cold spark fountains for the first dance.'}</span>
                    </div>
                  </>
                )}

                {selectedEventType === 'engagement' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'توزيع مقاعد عائلي راقٍ يتسع من 150 إلى 400 ضيف بأريحية تامة.' : 'Intimate luxury seating configurations for 150 to 400 guests with maximum comfort.'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'منصة تقديم دبل الخطوبة مع إضاءات سبوت لايت دافئة للتصوير السينمائي.' : 'Dedicated ring ceremony platform with warm cinematic spotlighting for photos.'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'بوفيه حلويات وموكتيل استوائي ترحيبي عند مدخل القاعة لجميع الحضور.' : 'Welcome mocktail fountain bar and bespoke French pastry tiers at the foyer.'}</span>
                    </div>
                  </>
                )}

                {selectedEventType === 'birthday' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'شاشات تفاعلية وجدران تصوير Photobooth 360° مع طباعة فورية للضيوف.' : 'Interactive 360° video spinner booths with instant digital guest sharing.'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'محطات طهي حي ومشروبات ساخنة وعصائر طبيعية وبوفيه كاجوال راقٍ.' : 'Live chef cooking stations, artisan gelato bars, and gourmet sliders buffet.'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'عروض إضاءة ليزر ورؤوس متحركة متحكم بها ديجيتال عبر الميكسر.' : 'Dynamic laser effects and motorized beam trusses synced to the evening beats.'}</span>
                    </div>
                  </>
                )}

                {selectedEventType === 'corporate' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'شاشة عرض LED رئيسية بدقة 4K مع منصة متحدثين ذكية وميكروفونات لاسلكية.' : 'Curved 4K presentation LED wall with digital podiums and Shure wireless microphones.'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'عزل صوتي 65dB وكبائن مجهزة للترجمة الفورية وشبكة إنترنت فايبر مخصصة.' : '65dB acoustic isolation, simultaneous translation booths, and enterprise fiber WiFi.'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{isAr ? 'خيارات عشاء عمل تنفيذي VIP، قاعات استراحة لكبار الزوار، ومواقف سيارات واسعة.' : 'Executive VIP dining salons, VIP green rooms, and dedicated valet parking capacity.'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.chime();
                    setPlannerEventType(selectedEventType === 'corporate' ? 'conference' : selectedEventType);
                    const el = document.getElementById('planner');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>{isAr ? 'صمم هذا الحدث في المخطط' : 'Configure This Event in Planner'}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* =========================================================================
          SECTION 3: VENUES SHOWCASE
          ========================================================================= */}
      <section id="venues" className="space-y-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-amber-500/15 pb-5">
          <div>
            <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
              {isAr ? '02. القاعات والمساحات' : '02. Signature Halls & Spaces'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mt-1">
              {isAr ? 'قاعات ملكية معمارية تلبي كافة التطلعات' : 'Iconic Palatial Venues'}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              {isAr
                ? 'مساحات فندقية رحبة مجهزة بأعلى مواصفات العزل الصوتي والتقنيات التكنولوجية.'
                : 'Each venue embodies distinct architectural character, tailored capacities, and five-star hospitality.'}
            </p>
            <button
              type="button"
              onClick={() => {
                sound.click(700);
                onOpenEditManager?.('halls');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold transition-all shadow-sm shrink-0 whitespace-nowrap self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تعديل القاعات والأسماء (Demo)' : 'Edit Halls & Details (Demo)'}</span>
            </button>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {halls.map((venue, idx) => {
            // Find photo for this hall
            const matchingPhotoObj =
              displayPhotos.find((p) => p.hallId === venue.id) ||
              displayPhotos[idx % displayPhotos.length];
            const venuePhotoSrc = venue.photo || venue.photoUrl || matchingPhotoObj?.src || ALSARAYA_PHOTOS[0].src;

            return (
              <div
                key={venue.id}
                className="rounded-2xl sm:rounded-3xl border border-amber-500/25 bg-slate-900/70 overflow-hidden shadow-xl flex flex-col group hover:border-amber-400 transition-all duration-300"
              >
                {/* Photo Area with click-to-library indicator */}
                <div
                  onClick={() => {
                    const photoForModal = matchingPhotoObj || {
                      id: `photo-${venue.id}`,
                      src: venuePhotoSrc,
                      titleAr: venue.name,
                      titleEn: venue.nameEn || venue.name,
                      hallNameAr: venue.name,
                      hallNameEn: venue.nameEn || venue.name,
                      captionAr: venue.description || 'قاعة ملكية فاخرة بالسرايا.',
                      captionEn: venue.descriptionEn || 'Luxury royal hall at Saraya.',
                      category: 'ballroom' as const,
                      parallaxSpeed: 30,
                      hallId: venue.id,
                    };
                    handleOpenLibraryPhoto(photoForModal);
                  }}
                  className="relative h-64 sm:h-72 overflow-hidden cursor-pointer"
                  title={isAr ? 'انقر لتكبير واستعراض مكتبة صور هذه القاعة' : 'Click to view photo library for this hall'}
                >
                  <img
                    src={venuePhotoSrc}
                    alt={isAr ? venue.name : venue.nameEn || venue.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top-Right Badge: Click to View Library */}
                  <div className="absolute top-3 end-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-amber-500/30 text-[10px] text-amber-300 font-medium opacity-90 group-hover:opacity-100 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all">
                    <Layers className="w-3 h-3" />
                    <span>{isAr ? 'استعراض مكتبة الصور' : 'View Photo Library'}</span>
                  </div>

                  {/* Specs Overlay Tags */}
                  <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-[11px] text-amber-200 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 font-mono">
                    <span>{venue.capacity} {isAr ? 'فرد' : 'Guests'}</span>
                    <span className="text-slate-500">·</span>
                    <span>{venue.areaSqMeters || 850} m²</span>
                    <span className="text-slate-500">·</span>
                    
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                        {isAr ? venue.name : venue.nameEn || venue.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          sound.click(650);
                          onOpenEditManager?.('halls', venue.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                        title={isAr ? 'تعديل اسم وبيانات هذه القاعة' : 'Edit hall details'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {isAr
                        ? venue.description || 'قاعة ملكية فاخرة مجهزة للمناسبات الكبرى بالسرايا بأعلى معايير الضيافة.'
                        : venue.descriptionEn || 'Luxury royal hall tailored for grand celebrations with five-star hospitality.'}
                    </p>
                  </div>

                  {/* Venue Actions */}
                  <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                    <a
                      href="#3d-tour"
                      onClick={(e) => {
                        e.preventDefault();
                        sound.tick();
                        const el = document.getElementById('3d-tour');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 py-2.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 text-center transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'المحاكاة 3D' : '3D Tour'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        sound.chime();
                        onSelectHallForBooking(venue.id);
                        onOpenBookingModal();
                      }}
                      className="flex-1 py-2.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-bold text-slate-950 text-center transition-all shadow-md truncate"
                    >
                      {isAr ? 'احجز هذه القاعة' : 'Book This Venue'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.click(650);
                        onOpenEditManager?.('halls', venue.id);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white text-xs border border-slate-700 transition-colors"
                      title={isAr ? 'تعديل بيانات القاعة' : 'Edit hall'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: PHOTOGRAPHY & MOTION GALLERY
          ========================================================================= */}
      <section id="gallery" className="space-y-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-amber-500/15 pb-5">
          <div>
            <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
              {isAr ? '05. معرض الصور الحية' : '05. Live Event Photography Gallery'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mt-1">
              {isAr ? 'لحظات حقيقية وأجواء ساحرة من حفلات السرايا' : 'Real Celebrations Captured at Saraya'}
            </h2>
          </div>

          {/* Gallery Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'weddings', labelAr: 'الأفراح والممشى', labelEn: 'Weddings' },
              { id: 'kosha', labelAr: 'الكوشة والديكور', labelEn: 'Kosha' },
              { id: 'dining', labelAr: 'المائدة والضيافة', labelEn: 'Dining' },
              { id: 'garden', labelAr: 'الحديقة المفتوحة', labelEn: 'Garden' },
              { id: 'corporate', labelAr: 'المؤتمرات', labelEn: 'Corporate' },
              { id: 'birthday', labelAr: 'أعياد الميلاد', labelEn: 'Birthdays' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setGalleryCategory(cat.id);
                  sound.tick();
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  galleryCategory === cat.id
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => {
                sound.click(600);
                setActiveLightboxPhoto(photo);
              }}
              className="group relative h-80 rounded-2xl overflow-hidden border border-amber-500/20 bg-slate-900 cursor-pointer shadow-lg hover:border-amber-400 transition-all duration-300"
            >
              <img
                src={photo.src}
                alt={isAr ? photo.titleAr : photo.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              <div className="absolute bottom-4 start-4 end-4 space-y-1">
                <span className="text-[10px] text-amber-400 font-mono tracking-wider uppercase">
                  {isAr ? photo.hallNameAr : photo.hallNameEn}
                </span>
                <h4 className="text-sm font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                  {isAr ? photo.titleAr : photo.titleEn}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {isAr ? photo.captionAr : photo.captionEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeLibraryPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightboxPhoto(null)}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl flex flex-col"
            >
              <div className="relative h-[65vh] overflow-hidden bg-black">
                <img
                  src={activeLibraryPhoto.src}
                  alt={isAr ? activeLibraryPhoto.titleAr : activeLibraryPhoto.titleEn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6 bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-amber-500/20">
                <div>
                  <span className="text-xs text-amber-400 font-mono">
                    {isAr ? activeLibraryPhoto.hallNameAr : activeLibraryPhoto.hallNameEn}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-white">
                    {isAr ? activeLibraryPhoto.titleAr : activeLibraryPhoto.titleEn}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    {isAr ? activeLibraryPhoto.captionAr : activeLibraryPhoto.captionEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLightboxPhoto(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          SECTION 7: 3D VENUE EXPERIENCE
          ========================================================================= */}
      <section id="3d-tour" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-amber-500/15 pb-5">
          <div>
            <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
              {isAr ? '06. المحاكاة ثلاثية الأبعاد' : '06. 3D Spatial Venue Experience'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mt-1">
              {isAr ? 'تجربة تفاعلية ثلاثية الأبعاد لاكتشاف كل ركن' : 'Interactive 3D Venue Exploration'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            {isAr
              ? 'قم بالدوران بزاوية 360 درجة، تغيير زوايا الرؤية، وتبديل أنماط الإضاءة لاختبار مساحتك.'
              : 'Rotate the camera, change lighting moods, test seating layouts, and inspect runway acoustics.'}
          </p>
        </div>

        {/* 3D Viewer Component */}
        <Saraya3DViewer
          language={language}
          onSelectHallForBooking={onSelectHallForBooking}
          onOpenBookingModal={onOpenBookingModal}
        />
      </section>

      {/* =========================================================================
          SECTION 10: FINAL BOOKING CTA & CONTACT
          ========================================================================= */}
      <section id="contact" className="space-y-8 scroll-mt-24">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Contact Info & Direct Links */}
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                {isAr ? '09. احجز موعدك وتواصل معنا' : '09. Book a Showroom Visit or Call'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                {isAr ? 'هل أنت مستعد لحجز ليلتك الاستثنائية؟' : 'Ready to Reserve Your Signature Date?'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? 'المواعيد الشاغرة لموسم الصيف والشتاء المقبلين تحجز مبكراً. تواصل معنا الآن للمعاينة الميدانية أو الاستفسار السريع.'
                  : 'Dates for upcoming seasons reserve quickly. Reach out to schedule a private tour and lock in your preferred hall.'}
              </p>

              {/* Contact Affordances */}
              <div className="space-y-3 text-xs sm:text-sm">
                <a
                  href="https://wa.me/201001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">{isAr ? 'محادثة واتساب فورية مباشرة' : 'Direct WhatsApp Chat'}</div>
                    <div className="text-xs text-emerald-400/80 font-mono">+20 100 123 4567</div>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <Phone className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">{isAr ? 'هاتف الحجوزات والمعاينة' : 'Reservations & Showroom Hotline'}</div>
                    <div className="text-xs text-slate-400 font-mono">+20 2 2795 0000 / +20 100 123 4567</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">{isAr ? 'موقع قصر وقاعات السرايا' : 'Location & Palace Grounds'}</div>
                    <div className="text-xs text-slate-400">{isAr ? 'القاهرة الجديدة (الطريق الدائري) والكورنيش (الإسكندرية)' : 'New Cairo Ring Road & Alexandria Corniche, Egypt'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Direct Form */}
            <div className="lg:col-span-6">
              {!isDirectSubmitted ? (
                <form onSubmit={handleDirectContactSubmit} className="p-6 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'طلب معاينة وتأكيد موعد مباشر' : 'Request Venue Visit / Date Inquiry'}
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        {isAr ? 'الاسم:' : 'Your Name:'}
                      </label>
                      <input
                        type="text"
                        required
                        value={directName}
                        onChange={(e) => setDirectName(e.target.value)}
                        placeholder={isAr ? 'الاسم الكريم' : 'Your name'}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        {isAr ? 'رقم الهاتف:' : 'Phone Number:'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={directPhone}
                        onChange={(e) => setDirectPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'نوع المناسبة:' : 'Event Type:'}
                        </label>
                        <select
                          value={directEventType}
                          onChange={(e) => setDirectEventType(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="wedding">{isAr ? 'زفاف' : 'Wedding'}</option>
                          <option value="engagement">{isAr ? 'خطوبة' : 'Engagement'}</option>
                          <option value="birthday">{isAr ? 'عيد ميلاد' : 'Birthday'}</option>
                          <option value="conference">{isAr ? 'مؤتمر' : 'Corporate'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'التاريخ المطلوب:' : 'Desired Date:'}
                        </label>
                        <input
                          type="date"
                          value={directDate}
                          onChange={(e) => setDirectDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-medium block mb-1">
                        {isAr ? 'رسالة أو تفاصيل إضافية:' : 'Message / Questions:'}
                      </label>
                      <textarea
                        rows={2}
                        value={directMessage}
                        onChange={(e) => setDirectMessage(e.target.value)}
                        placeholder={isAr ? 'حدد موعد المعاينة المناسب لك...' : 'Your preferred tour time...'}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>{isAr ? 'تأكيد إرسال الطلب' : 'Submit Inquiry'}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-400 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">
                    {isAr ? 'تم استلام طلب المعاينة!' : 'Tour Request Sent!'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {isAr
                      ? `شكراً أ/ ${directName}، سيتواصل معك فريق الاستقبال لتأكيد موعد الزيارة.`
                      : 'Thank you, our concierge will confirm your showroom appointment shortly.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDirectSubmitted(false)}
                    className="text-xs text-amber-300 underline pt-2"
                  >
                    {isAr ? 'إرسال طلب آخر' : 'Send another'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
