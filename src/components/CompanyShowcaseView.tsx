import { useState, useId } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Building2,
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
  Tv,
  Music,
  Heart,
  ChevronDown,
  Calculator,
  Compass,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Hall, Language } from '../types/venueSystem';
import { TiltCard } from './TiltCard';
import { ScrollMotionGallery } from './ScrollMotionGallery';
import { ALSARAYA_PHOTOS } from '../data/venueImages';
import { sound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface CompanyShowcaseViewProps {
  halls: Hall[];
  language: Language;
  onSelectHallForBooking: (hallId: string) => void;
  onOpenNewBooking: () => void;
  onNavigateToFloorPlan: () => void;
}

export function CompanyShowcaseView({
  halls,
  language,
  onSelectHallForBooking,
  onOpenNewBooking,
  onNavigateToFloorPlan,
}: CompanyShowcaseViewProps) {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // State for interactive instant price estimator
  const [selectedHallId, setSelectedHallId] = useState<string>(halls[0]?.id || 'hall-1');
  const [guestCount, setGuestCount] = useState<number>(300);
  const [selectedMenuTier, setSelectedMenuTier] = useState<'classic' | 'diamond' | 'royal'>('diamond');
  const [includeDrone4k, setIncludeDrone4k] = useState<boolean>(true);
  const [includeRoboticLights, setIncludeRoboticLights] = useState<boolean>(true);
  const [includeLuxuryKosha, setIncludeLuxuryKosha] = useState<boolean>(true);

  const selectedHall = halls.find((h) => h.id === selectedHallId) || halls[0];

  // Pricing formula for estimator
  const menuPricePerPerson = {
    classic: 110,
    diamond: 160,
    royal: 220,
  }[selectedMenuTier];

  const addonsTotal =
    (includeDrone4k ? 8500 : 0) +
    (includeRoboticLights ? 5500 : 0) +
    (includeLuxuryKosha ? 9000 : 0);

  const cateringTotal = guestCount * menuPricePerPerson;
  const estimatedGrandTotal = (selectedHall?.basePrice || 45000) + cateringTotal + addonsTotal;
  const requiredDeposit = Math.round(estimatedGrandTotal * 0.35);

  const triggerEstimateConfetti = () => {
    sound.fanfare();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const hallSpecs = [
    {
      id: 'hall-1',
      photo: ALSARAYA_PHOTOS[0].src,
      nameAr: 'القاعة الملكية الكبرى (The Royal Grand Ballroom)',
      nameEn: 'The Royal Grand Ballroom',
      area: '1,250 م²',
      capacity: '650 فرد',
      ceiling: '8.5 متر بارتفاع شاهق',
      chandeliers: 'ثريات كريستال مورانو إيطالي أصلي',
      flooring: 'رخام كارارا إيطالي ناصع مع عزل مانع للانزلاق',
      soundTech: 'نظام صوتي فرنسي L-Acoustics Kiva II مع ميكسر ديجيتال',
      lightingTech: '32 رأس متحرك Beam + Matrix LED وجهاز دخان هازر',
      screens: 'شاشة سينمائية منحنية 4K LED بمقاس 14م × 4.5م',
      suite: 'جناح ملكي للعروس طابقين بمصعد خاص وغرفة تجميل وجاكوزي',
      idealFor: isAr ? 'أفراح الملوك وكبار الشخصيات والمؤتمرات الدولية' : 'Royal weddings, VIP galas & international summits',
      color: 'from-indigo-600/30 to-violet-900/40',
      borderAccent: 'border-indigo-500/40',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    },
    {
      id: 'hall-2',
      photo: ALSARAYA_PHOTOS[1].src,
      nameAr: 'قاعة اللؤلؤة الماسية (The Pearl Diamond Hall)',
      nameEn: 'The Pearl Diamond Hall',
      area: '700 م²',
      capacity: '350 فرد',
      ceiling: '6.5 متر بتصميم أرابيسك عصري',
      chandeliers: 'ثريات ليد دائرية متدرجة ذات إضاءة دافئة',
      flooring: 'أرضيات خشبية باركيه ألماني مع كاريزما بيضاء',
      soundTech: 'أنظمة صوتية Bose Professional موزعة هندسياً',
      lightingTech: '16 رأس متحرك وإضاءة ووش بانورامية للمحيط',
      screens: 'شاشتان جداريتان فائقتا الوضوح بمقاس 6م × 3م',
      suite: 'جناح عروس مجهز بالكامل مع إطلالة بانورامية على القاعة',
      idealFor: isAr ? 'حفلات الزفاف الرومانسية وحفلات الخطوبة الأنيقة' : 'Romantic weddings & high-end engagement soirees',
      color: 'from-pink-600/20 to-rose-950/40',
      borderAccent: 'border-pink-500/40',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    },
    {
      id: 'hall-3',
      photo: ALSARAYA_PHOTOS[2].src,
      nameAr: 'قاعة الملوك الفاخرة (The Kings Executive Pavilion)',
      nameEn: 'The Kings Executive Pavilion',
      area: '450 م²',
      capacity: '250 فرد',
      ceiling: '5.5 متر مع عوازل صوتية ممتصة للصدى',
      chandeliers: 'تصميم إضاءة هندسية مخفية مع تحكم سيناريوهات',
      flooring: 'سجاد ملكي فاخر عالي الكثافة مقاوم للاشتعال',
      soundTech: 'أنظمة مؤتمرات Shure مع كبائن ترجمة فورية',
      lightingTech: 'إضاءة محايدة عالية السطوع للكاميرات والبث التلفزيوني',
      screens: 'شاشة رئيسية P1.8 فائقة الدقة لعروض الفيديو',
      suite: 'صالون استقبال دبلوماسي خاص لكبار الشخصيات',
      idealFor: isAr ? 'المؤتمرات الوزارية، حفلات العشاء الرسمية، وملكات الزواج' : 'Executive summits, diplomatic banquets & intimate galas',
      color: 'from-amber-600/20 to-yellow-950/40',
      borderAccent: 'border-amber-500/40',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'hall-4',
      photo: ALSARAYA_PHOTOS[3].src,
      nameAr: 'الحديقة والواحة المكشوفة (The Oasis Garden & Terrace)',
      nameEn: 'The Oasis Garden & Terrace',
      area: '1,800 م²',
      capacity: '450 فرد',
      ceiling: 'سماء مفتوحة مع مظلات إضاءة شجرية ساحرة',
      chandeliers: 'سقف من آلاف المصابيح المعلقة كنجوم متلألئة',
      flooring: 'عشب طبيعي مهندم وممرات حجرية رخامية مضيئة',
      soundTech: 'نظام صوتي خارجي مقاوم للعوامل الجوية وتوزيع 360°',
      lightingTech: 'إضاءة أشجار هيدروليكية ونوافير راقصة ملونة',
      screens: 'شاشة خارجية مقاومة لضوء النهار ومقاومة للأمطار',
      suite: 'جناح استراحة حديقة خارجي بطراز أندلسي ريفي',
      idealFor: isAr ? 'حفلات الزفاف المسائية بالهواء الطلق وحفلات الكوكتيل' : 'Open-air starlight weddings, cocktails & garden galas',
      color: 'from-emerald-600/20 to-teal-950/40',
      borderAccent: 'border-emerald-500/40',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
  ];

  const milestones = [
    { year: '2012', titleAr: 'تأسيس قصر السرايا', titleEn: 'Inception & Grand Opening of AlSaraya', descAr: 'افتتاح القاعة الملكية الكبرى بقصر السرايا بمعايير فندقية لم يسبق لها مثيل.', descEn: 'Opening of AlSaraya Royal Grand Ballroom setting unprecedented standards.' },
    { year: '2016', titleAr: 'توسعة قصر السرايا', titleEn: 'AlSaraya Palace Expansion', descAr: 'إضافة قاعة اللؤلؤة وحديقة الواحة المفتوحة لتلبية طلب كبار العائلات.', descEn: 'Inaugurating the Pearl Hall and Oasis Garden Terrace for open-air luxury.' },
    { year: '2020', titleAr: 'التجديد التكنولوجي الشامل', titleEn: 'AV Tech Revolution', descAr: 'تركيب أكبر شاشات LED منحنية وأنظمة صوت Line-Array المتطورة.', descEn: 'Installing massive curved 4K LED walls and Meyer Sound Line Arrays.' },
    { year: '2024', titleAr: 'جائزة أفضل قصر مناسبات', titleEn: 'Top Luxury Venue Award', descAr: 'حصد قصر السرايا جائزة التميز الفندقي كأفضل وجهة للأعراس الملكية.', descEn: 'Awarded Regional Venue of the Year for flawless luxury execution.' },
    { year: '2026', titleAr: 'إطلاق منظومة ERP الذكية', titleEn: 'Smart ERP Integration', descAr: 'أتمتة الحجوزات، محاكاة حركة الطاولات، والتمرير السينمائي السلس.', descEn: 'Full digital integration: 3D seating, live stage control & profit engine.' },
  ];

  const testimonials = [
    {
      authorAr: 'المهندس طارق الدسوقي وحرمه',
      authorEn: 'Eng. Tarek & Dr. Sarah',
      hallAr: 'القاعة الملكية الكبرى',
      hallEn: 'Royal Grand Ballroom',
      date: 'سبتمبر 2026',
      rating: 5,
      commentAr: 'فرحنا كان أسطوري بكل تفاصيله! جناح العروس كان مريح جداً، وتنظيم الدخول والإضاءة والصوتيات كان على أعلى مستوى عالمي، والضيوف أشادوا بجودة البوفيه حتى الآن.',
      commentEn: 'Our wedding was legendary in every sense! The bridal suite was royal, AV acoustics flawless, and guests are still raving about the banquet dinner.',
    },
    {
      authorAr: 'المستشار عبد الرحمن المنشاوي',
      authorEn: 'Judge Abdulrahman',
      hallAr: 'قاعة اللؤلؤة الماسية',
      hallEn: 'Pearl Diamond Hall',
      date: 'أكتوبر 2026',
      rating: 5,
      commentAr: 'الأجواء والورد والكوشة كانت تحفة فنية متكاملة. الفريق كان محترفاً جداً في إدارة الوقت والدفعات، ورد التأمين تم بعد المناسبة مباشرة بكل أمانة.',
      commentEn: 'Exquisite aesthetics, majestic florals, and complete integrity. The staff was world-class and security deposit refund was processed promptly.',
    },
    {
      authorAr: 'مجموعة أجياد للاستثمار والمؤتمرات',
      authorEn: 'Ajyad Investment Summit',
      hallAr: 'قاعة الملوك الفاخرة',
      hallEn: 'Kings Executive Pavilion',
      date: 'أغسطس 2026',
      rating: 5,
      commentAr: 'استضفنا مؤتمرنا السنوي بحضور أكثر من 200 مستثمر أجنبي، وكانت شاشات العرض والترجمة الفورية وخدمة كبار الشخصيات بمثابة واجهة مشرفة لبلدنا.',
      commentEn: 'Hosted our international investor summit with 200+ global delegates. The simultaneous interpretation and VIP protocol were immaculate.',
    },
  ];

  return (
    <div className={`w-full space-y-16 pb-28 ${isAr ? 'text-right' : 'text-left'}`}>
      {/* 1. HERO SECTION: MAJESTIC SHOWCASE */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-6 sm:p-12 lg:p-16 shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs sm:text-sm font-semibold shadow-inner"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '15s' }} />
            <span>{isAr ? 'الصرح الفندقي الأكثر فخامة وتجهيزاً في الشرق الأوسط' : 'The Most Prestigious Luxury Venue in the Region'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight"
          >
            {isAr ? (
              <>
                قصر وقاعات <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-indigo-300">السرايا الملكية</span> للمناسبات
              </>
            ) : (
              <>
                AlSaraya <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-indigo-300">Royal Palace & Grand Venues</span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
          >
            {isAr
              ? 'مجموعة قصر وقاعات السرايا الفاخرة؛ صروح معمارية ملكية مجهزة بأحدث تقنيات الصوت والإضاءة المسرحية، مطابخ فندقية خاصة، وأجنحة ملكية تصنع لك ذكريات لا تُنسى.'
              : 'AlSaraya Royal Palace Venues; a curated sanctuary of architectural magnificence featuring German acoustic isolation, robotic stage lighting, and five-star culinary banquets.'}
          </motion.p>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl pt-4"
          >
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">1,450+</div>
              <div className="text-xs text-slate-400 mt-1">{isAr ? 'مناسبة ملكية بالسرايا' : 'Royal Galas Hosted'}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-300">4</div>
              <div className="text-xs text-slate-400 mt-1">{isAr ? 'قاعات كبرى وحديقة' : 'Grand Halls & Gardens'}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">1,700</div>
              <div className="text-xs text-slate-400 mt-1">{isAr ? 'السعة الكلية المتزامنة' : 'Concurrent Capacity'}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black font-mono text-rose-300">99.8%</div>
              <div className="text-xs text-slate-400 mt-1">{isAr ? 'نسبة رضا العملاء' : 'Satisfaction Rate'}</div>
            </div>
          </motion.div>

          {/* Interactive CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sound.click(750);
                onOpenNewBooking();
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>{isAr ? 'تسجيل حجز جديد بالسرايا' : 'Book at AlSaraya Now'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.click(600);
                onNavigateToFloorPlan();
              }}
              className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'مخطط القاعات وتوزيع الطاولات' : 'Interactive 3D Seating Studio'}</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC SCROLL MOTION PHOTO GALLERY (AlSaraya Visuals) */}
      <section>
        <ScrollMotionGallery
          language={language}
          onSelectHallForBooking={onSelectHallForBooking}
          onOpenNewBooking={onOpenNewBooking}
        />
      </section>

      {/* 3. THE 4 ARCHITECTURAL HALLS SHOWCASE */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>{isAr ? 'صروح قصر السرايا المعمارية الأربعة' : 'AlSaraya Four Architectural Masterpieces'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {isAr ? 'مواصفات وتفاصيل قاعات السرايا' : 'Detailed Specs & Hall Profiles'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            {isAr
              ? 'صممت كل قاعة بهندسة معمارية مستقلة لتلائم كافة أنماط المناسبات من الأفراح الأسطورية إلى المؤتمرات الدولية.'
              : 'Each venue hall is architecturally designed to serve distinct event styles from royal galas to corporate summits.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hallSpecs.map((hall) => {
            const rawHall = halls.find((h) => h.id === hall.id);
            return (
              <TiltCard
                key={hall.id}
                tiltMax={5}
                className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${hall.color} bg-slate-900/90 border ${hall.borderAccent} relative overflow-hidden flex flex-col justify-between space-y-6 group`}
              >
                <div>
                  {/* Real Photo Banner with Hover Zoom */}
                  <div className="relative aspect-16/9 rounded-2xl overflow-hidden mb-5 border border-slate-800 shadow-lg">
                    <img
                      src={hall.photo}
                      alt={hall.nameAr}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-75" />
                    <div className="absolute bottom-2.5 right-3 left-3 flex items-center justify-between text-xs text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'تصوير واقعي من داخل القاعة' : 'Authentic Venue Photo'}</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 border border-slate-800">
                        HD 4K
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${hall.badgeColor} mb-2`}>
                        {isAr ? `سعة استيعابية حتى ${hall.capacity}` : `Capacity up to ${hall.capacity}`}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        {isAr ? hall.nameAr : hall.nameEn}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 italic">{hall.idealFor}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400">{isAr ? 'سعر الحجز الأساسي' : 'Base Hall Rate'}</div>
                      <div className="text-xl font-black font-mono text-amber-300">
                        {rawHall?.basePrice ? rawHall.basePrice.toLocaleString() : '45,000'} {isAr ? 'ج.م' : 'EGP'}
                      </div>
                    </div>
                  </div>

                  {/* Architectural Specs Table */}
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <div className="text-slate-400 font-medium">{isAr ? 'المساحة والارتفاع' : 'Area & Height'}</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{hall.area} · {hall.ceiling}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <div className="text-slate-400 font-medium">{isAr ? 'الثريات والأرضية' : 'Chandeliers & Floor'}</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{hall.chandeliers}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <div className="text-slate-400 font-medium">{isAr ? 'النظام الصوتي' : 'Acoustics & Sound'}</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{hall.soundTech}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <div className="text-slate-400 font-medium">{isAr ? 'الشاشات والإضاءة' : 'Screens & Lighting'}</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{hall.screens}</div>
                    </div>
                  </div>

                  {/* Bridal Suite Perk */}
                  <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center gap-3 text-xs text-indigo-200">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{hall.suite}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      sound.click(650);
                      setSelectedHallId(hall.id);
                      const el = document.getElementById('instant-calculator');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-semibold text-slate-300 hover:text-white underline decoration-slate-600 underline-offset-4 cursor-pointer"
                  >
                    {isAr ? 'حساب تكلفة هذا الحجز' : 'Calculate Estimate for Hall'}
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      sound.click(700);
                      onSelectHallForBooking(hall.id);
                      onOpenNewBooking();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    <span>{isAr ? 'احجز القاعة الآن' : 'Book This Hall'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* 3. SIX LUXURY INFRASTRUCTURE PILLARS */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-300" />
            <span>{isAr ? 'معايير الفخامة الهندسية والتشغيلية' : 'Engineering & Hospitality Standards'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? 'لماذا تختار قصر وقاعات السرايا الملكية؟' : 'Why Choose AlSaraya Royal Venues?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isAr
              ? 'بنية تحتية هندسية تم تشييدها خصيصاً لتفادي أي خلل مفاجئ، مع ضمان أعلى مستويات الراحة والأمان.'
              : 'Engineered from the ground up with fail-safe redundancies and presidential hospitality protocols.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'عزل صوتي هيدروليكي 65dB' : 'German 65dB Acoustic Isolation'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'جدران مزدوجة ممتصة للصدى تضمن نقاءً صوتياً مذهلاً وتمنع تسرب الصوت بين القاعات المتجاورة بالكامل.'
                : 'Acoustic double walls ensuring studio-grade sound clarity and complete isolation between halls.'}
            </p>
          </TiltCard>

          <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'طاقة كهربائية ثلاثية لا تنقطع' : 'Triple Power Redundancy'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'مولدان عملاقان من شركة Cummins بقوة 2,000 kVA مع أنظمة UPS تعمل فورياً بدون انقطاع لثانية واحدة.'
                : 'Dual 2,000 kVA Cummins industrial generators with zero-second UPS battery bridges.'}
            </p>
          </TiltCard>

          <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'مطبخ فندقي مركزي 450 م²' : 'Central 5-Star Kitchen & Bakery'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'حاصل على شهادة سلامة الغذاء الدولية HACCP بإشراف طهاة دوليين لتقديم أشهى البوفيهات الطازجة.'
                : 'HACCP certified commercial kitchen with specialized hot banqueting, patisserie, and butchery.'}
            </p>
          </TiltCard>

          <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'أجنحة العروس الفندقية الملكية' : 'Palatial Bridal Suites'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'أجنحة خاصة مستقلة بمصاعد خاصة، صالون تجميل، جاكوزي، وشاشة لمتابعة حركة القاعة مباشرة قبل الدخول.'
                : 'Multi-room private suites with private direct elevators, hair stylist studio, and live backstage screens.'}
            </p>
          </TiltCard>

          <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'تصوير سينمائي 4K وكرين ودرون' : 'Cinematic 4K Cranes & Drone Rig'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'كاميرات سينمائية سوني FX6 مع كاميرا كرين هيدروليكية لالتقاط زوايا أسطورية لدخول العروسين.'
                : 'Broadcast studio gear, Sony cinema cameras, hydraulic jib cranes, and live wireless director monitor.'}
            </p>
          </TiltCard>

          <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'أمن حراسة ومواقف 500 سيارة' : 'Covered 500-Car Valet Facility'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'موقف سيارات مغطى واسع مع فريق محترف لخدمة الفاليه وكاميرات مراقبة ذكية 24 ساعة لراحة الضيوف.'
                : 'Covered indoor parking with automated valet retrieval and round-the-clock security surveillance.'}
            </p>
          </TiltCard>
        </div>
      </section>

      {/* 4. INTERACTIVE INSTANT ESTIMATE CALCULATOR (LONG SCROLL FEATURE) */}
      <section
        id="instant-calculator"
        className="rounded-3xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-semibold border border-indigo-700/50">
              <Calculator className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAr ? 'حاسبة التكلفة التقديرية الفورية' : 'Instant Event Cost Estimator'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isAr ? 'صمّم باقة مناسبتك واعرف السعر المتوقع في ثوانٍ' : 'Configure Your Royal Event Package'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {isAr
                ? 'اختر القاعة، عدد المدعوين، ونوع البوفيه والخدمات لمعرفة التكلفة الإجمالية وقيمة العربون المطلوب فوراً.'
                : 'Select your preferred hall, guest count, dining tier and add-ons for transparent instant pricing.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Controls */}
            <div className="space-y-6">
              {/* Hall Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  {isAr ? '1. اختر القاعة المطلوبة:' : '1. Select Venue Hall:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {halls.map((h) => {
                    const isSelected = selectedHallId === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          sound.click(600);
                          setSelectedHallId(h.id);
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="truncate">{h.name}</div>
                        <div className="text-[10px] opacity-80 font-mono mt-0.5">
                          {h.basePrice.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guest Count Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>{isAr ? '2. عدد المدعوين:' : '2. Expected Guest Count:'}</span>
                  <span className="text-amber-300 font-mono text-base">{guestCount} {isAr ? 'فرد' : 'guests'}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="650"
                  step="25"
                  value={guestCount}
                  onChange={(e) => {
                    setGuestCount(Number(e.target.value));
                    sound.tick();
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>100 {isAr ? 'فرد' : 'guests'}</span>
                  <span>350</span>
                  <span>650 {isAr ? 'فرد' : 'guests'}</span>
                </div>
              </div>

              {/* Dining Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  {isAr ? '3. باقة البوفيه والضيافة:' : '3. Banquet Menu Tier:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'classic', labelAr: 'كلاسيك فاخر', labelEn: 'Classic Banquet', price: 110 },
                    { id: 'diamond', labelAr: 'الماسية الملكية', labelEn: 'Diamond Gala', price: 160 },
                    { id: 'royal', labelAr: 'مأدبة الملوك', labelEn: 'Imperial Royal', price: 220 },
                  ].map((tier) => {
                    const isSelected = selectedMenuTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => {
                          sound.click(650);
                          setSelectedMenuTier(tier.id as any);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{isAr ? tier.labelAr : tier.labelEn}</div>
                        <div className="text-[11px] font-mono mt-0.5">
                          {tier.price} {isAr ? 'ج.م/فرد' : 'EGP/pp'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Add-ons */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  {isAr ? '4. الإضافات المسرحية الخاصة:' : '4. Special Stage Add-ons:'}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                    <span className="text-slate-200">{isAr ? 'تصوير سينمائي 4K وكرين رافعة (8,500 ج.م)' : 'Cinematic 4K Crane + Drone (8,500 EGP)'}</span>
                    <input
                      type="checkbox"
                      checked={includeDrone4k}
                      onChange={(e) => {
                        setIncludeDrone4k(e.target.checked);
                        sound.click(550);
                      }}
                      className="rounded accent-indigo-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                    <span className="text-slate-200">{isAr ? 'شبكة إضاءة روبوتية Beam وماتريكس (5,500 ج.م)' : 'Robotic Beam & Matrix Light Truss (5,500 EGP)'}</span>
                    <input
                      type="checkbox"
                      checked={includeRoboticLights}
                      onChange={(e) => {
                        setIncludeRoboticLights(e.target.checked);
                        sound.click(550);
                      }}
                      className="rounded accent-indigo-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                    <span className="text-slate-200">{isAr ? 'كوشة ملكية خاصة ورد طبيعي فاخر (9,000 ج.م)' : 'Grand Luxury Kosha & Fresh Florals (9,000 EGP)'}</span>
                    <input
                      type="checkbox"
                      checked={includeLuxuryKosha}
                      onChange={(e) => {
                        setIncludeLuxuryKosha(e.target.checked);
                        sound.click(550);
                      }}
                      className="rounded accent-indigo-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Invoice Estimate Card */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400">{isAr ? 'كشف التكلفة التقديري' : 'Estimate Summary'}</span>
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  ESTIMATE-2026
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'إيجار القاعة الأساسي:' : 'Base Hall Rental:'}</span>
                  <span className="font-mono">{selectedHall?.basePrice.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>
                    {isAr ? `البوفيه المفتوح (${guestCount} فرد × ${menuPricePerPerson}):` : `Catering (${guestCount} guests × ${menuPricePerPerson}):`}
                  </span>
                  <span className="font-mono text-emerald-400">{cateringTotal.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'الخدمات والإضافات المسرحية:' : 'Stage Services & Extras:'}</span>
                  <span className="font-mono text-amber-300">{addonsTotal.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">{isAr ? 'الإجمالي التقديري للحفل:' : 'Estimated Grand Total:'}</span>
                  <span className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-amber-300">
                    {estimatedGrandTotal.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{isAr ? 'العربون المطلوب لتثبيت الموعد (35%):' : 'Booking Deposit Required (35%):'}</span>
                  <span className="font-mono text-amber-400 font-bold">{requiredDeposit.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    triggerEstimateConfetti();
                    onSelectHallForBooking(selectedHallId);
                    onOpenNewBooking();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isAr ? 'تثبيت هذا الحجز وإصدار العقد' : 'Lock In Date & Generate Contract'}</span>
                </motion.button>
                <div className="text-[11px] text-center text-slate-500 mt-2">
                  {isAr ? 'لا يشمل أي رسوم مخفية · التأمين مسترد بالكامل بعد الحفل' : 'Transparent pricing · Security deposit 100% refundable'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPANY MILESTONE TIMELINE */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>{isAr ? 'مسيرة الفخامة والريادة' : 'Our Decadal Legacy'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? 'تاريخ يمتد لأكثر من 14 عاماً' : '14+ Years of Flawless Hospitality'}
          </h2>
        </div>

        <div className="relative border-l-2 border-indigo-950 sm:border-l-0 sm:grid sm:grid-cols-5 gap-4 ml-4 sm:ml-0">
          {milestones.map((m, idx) => (
            <div key={m.year} className="mb-6 sm:mb-0 relative pl-6 sm:pl-0">
              <div className="hidden sm:block h-1 w-full bg-indigo-950 relative top-3 -z-10" />
              <div className="w-6 h-6 rounded-full bg-indigo-600 border-4 border-slate-950 text-white text-[10px] font-mono flex items-center justify-center font-bold mb-3 shadow-[0_0_12px_rgba(99,102,241,0.8)]">
                {idx + 1}
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs font-black font-mono text-amber-400">{m.year}</div>
                <h4 className="text-sm font-bold text-white mt-1">{isAr ? m.titleAr : m.titleEn}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{isAr ? m.descAr : m.descEn}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. VIP TESTIMONIALS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wider">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{isAr ? 'آراء عملائنا الكرام' : 'Distinguished Client Accolades'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {isAr ? 'شهادات نعتز بها من أصحاب المناسبات' : 'Words from Our Honored Hosts'}
            </h2>
          </div>
          <div className="flex items-center gap-1 text-amber-300 text-xs font-mono">
            <span className="font-bold text-lg">4.98</span>
            <span>/ 5.0 ({isAr ? 'تقييم موثق من 1,450 حفل' : 'Verified by 1,450+ Events'})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-300">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-300" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{isAr ? t.commentAr : t.commentEn}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-xs">
                <div className="font-bold text-white">{isAr ? t.authorAr : t.authorEn}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {isAr ? t.hallAr : t.hallEn} · {t.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CONTACT & PRIVATE TOUR RESERVATIONS */}
      <section className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'معاينة القاعات متاحة يومياً' : 'Hall Tours Available Daily'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {isAr ? 'تفضّل بزيارتنا وتجربة الضيافة الملكية' : 'Visit Us For a VIP Venue Tour'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'يسعد فريق العلاقات العامة واستقبال كبار الشخصيات بمرافقتكم في جولة تفصيلية داخل القاعات، أجنحة العروس، والمطبخ الفندقي مع جلسة تذوق خاصة.'
                : 'Our VIP relations team is honored to host you for a private walkthrough of all 4 halls, luxury bridal suites, and a private culinary tasting.'}
            </p>

            <div className="space-y-2 text-xs text-slate-300 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{isAr ? 'طريق النصر الرئيسي - التجمع الخامس / تقاطع محور المشير - قصر السرايا' : 'Main Boulevard, VIP District, AlSaraya Palace Avenue'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-slate-200">+20 100 889 9772 · +20 122 455 6001</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isAr ? 'يومياً من 11:00 صباحاً وحتى 11:00 مساءً' : 'Open Daily: 11:00 AM – 11:00 PM'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white">
              {isAr ? 'حجز موعد معاينة وتذوق مجاني' : 'Schedule a Private Walkthrough'}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'اسم العميل / العروسين:' : 'Client / Couple Name:'}</label>
                <input
                  type="text"
                  placeholder={isAr ? 'أدخل الاسم بالكامل' : 'Full Name'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'رقم الهاتف / واتساب:' : 'WhatsApp / Mobile:'}</label>
                <input
                  type="tel"
                  placeholder="010XXXXXXXX"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'التاريخ المبدئي للمناسبة:' : 'Target Event Date:'}</label>
                <input
                  type="date"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sound.fanfare();
                  confetti({ particleCount: 40, spread: 50 });
                  alert(isAr ? 'تم تسجيل طلب المعاينة بنجاح! سيتواصل معكم مدير الاستقبال خلال دقائق.' : 'Tour booked! Our VIP host will reach out to confirm your visit.');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {isAr ? 'تأكيد موعد المعاينة المجانية' : 'Confirm Free VIP Tour'}
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
