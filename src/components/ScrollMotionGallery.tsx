import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useVelocity, useSpring, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Maximize2,
  X,
  Calendar,
  Compass,
  ArrowRight,
  ArrowLeft,
  Camera,
  Layers,
  Eye,
} from 'lucide-react';
import { ALSARAYA_PHOTOS, VenuePhoto } from '../data/venueImages';
import { Language } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface ScrollMotionGalleryProps {
  language: Language;
  onSelectHallForBooking?: (hallId: string) => void;
  onOpenNewBooking?: () => void;
}

export function ScrollMotionGallery({
  language,
  onSelectHallForBooking,
  onOpenNewBooking,
}: ScrollMotionGalleryProps) {
  const isAr = language === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<VenuePhoto | null>(null);

  // Scroll tracking for motion
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Multi-speed parallax offsets
  const yFast = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const ySlow = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const yCounter = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const scaleCenter = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1.04, 0.96]);
  const rotateLeft = useTransform(scrollYProgress, [0, 1], [-3, 3]);
  const rotateRight = useTransform(scrollYProgress, [0, 1], [3, -3]);

  // Velocity response
  const scrollVelocity = useVelocity(scrollYProgress);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 30, stiffness: 200 });
  const skewOnScroll = useTransform(smoothVelocity, [-1, 1], [-4, 4]);

  return (
    <div ref={containerRef} className="w-full space-y-8 relative overflow-hidden py-6">
      {/* Gallery Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Camera className="w-4 h-4" />
            <span>{isAr ? 'معرض الصور التفاعلي المتحرك · قصر السرايا' : 'Dynamic Scroll Motion Showcase · AlSaraya'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            {isAr ? 'مشاهد حية تتحرك مع التمرير (Scroll Motion)' : 'Visuals Reacting to Scroll Motion'}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>{isAr ? 'طبقات بارالاكس متعددة السرعات' : 'Multi-Velocity Parallax Layers'}</span>
        </div>
      </div>

      {/* 1. SCROLL-DRIVEN PARALLAX 4-GRID (Photos move at distinct speeds as you scroll) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Column 1: Photos 1 & 3 with negative vertical displacement */}
        <div className="space-y-6 lg:space-y-8">
          {/* Photo 1: Grand Ballroom */}
          <motion.div
            style={{ y: yFast, rotate: rotateLeft, skewY: skewOnScroll }}
            className="group relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl cursor-pointer"
            onClick={() => {
              sound.click(650);
              setSelectedPhoto(ALSARAYA_PHOTOS[0]);
            }}
          >
            <div className="relative aspect-16/10 overflow-hidden">
              <motion.img
                src={ALSARAYA_PHOTOS[0].src}
                alt={ALSARAYA_PHOTOS[0].titleAr}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                style={{ scale: scaleCenter }}
              />
              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

              {/* Parallax Badge */}
              <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'القاعة الملكية الكبرى' : 'Grand Ballroom'}</span>
              </div>

              {/* View Fullscreen Icon */}
              <div className="absolute top-4 left-4 z-10 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-2 bg-slate-900/90 border-t border-slate-800/80">
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                {isAr ? ALSARAYA_PHOTOS[0].titleAr : ALSARAYA_PHOTOS[0].titleEn}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr ? ALSARAYA_PHOTOS[0].captionAr : ALSARAYA_PHOTOS[0].captionEn}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                <span>{isAr ? 'اضغط للتكبير ومعاينة القاعة' : 'Click to inspect in fullscreen'}</span>
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>

          {/* Photo 3: Dining Table */}
          <motion.div
            style={{ y: yCounter, skewY: skewOnScroll }}
            className="group relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl cursor-pointer"
            onClick={() => {
              sound.click(650);
              setSelectedPhoto(ALSARAYA_PHOTOS[2]);
            }}
          >
            <div className="relative aspect-16/10 overflow-hidden">
              <motion.img
                src={ALSARAYA_PHOTOS[2].src}
                alt={ALSARAYA_PHOTOS[2].titleAr}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

              <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'الضيافة الفندقية الملكية' : 'Royal Banqueting'}</span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-2 bg-slate-900/90 border-t border-slate-800/80">
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                {isAr ? ALSARAYA_PHOTOS[2].titleAr : ALSARAYA_PHOTOS[2].titleEn}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr ? ALSARAYA_PHOTOS[2].captionAr : ALSARAYA_PHOTOS[2].captionEn}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Column 2: Photos 2 & 4 with positive vertical displacement (creates dramatic counter-movement) */}
        <div className="space-y-6 lg:space-y-8 md:pt-12">
          {/* Photo 2: Royal Kosha */}
          <motion.div
            style={{ y: ySlow, rotate: rotateRight, skewY: skewOnScroll }}
            className="group relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl cursor-pointer"
            onClick={() => {
              sound.click(650);
              setSelectedPhoto(ALSARAYA_PHOTOS[1]);
            }}
          >
            <div className="relative aspect-16/10 overflow-hidden">
              <motion.img
                src={ALSARAYA_PHOTOS[1].src}
                alt={ALSARAYA_PHOTOS[1].titleAr}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                style={{ scale: scaleCenter }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

              <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-pink-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>{isAr ? 'كوشة العروس الفاخرة' : 'Bridal Kosha'}</span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-2 bg-slate-900/90 border-t border-slate-800/80">
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-pink-300 transition-colors">
                {isAr ? ALSARAYA_PHOTOS[1].titleAr : ALSARAYA_PHOTOS[1].titleEn}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr ? ALSARAYA_PHOTOS[1].captionAr : ALSARAYA_PHOTOS[1].captionEn}
              </p>
            </div>
          </motion.div>

          {/* Photo 4: Garden Terrace */}
          <motion.div
            style={{ y: yFast, skewY: skewOnScroll }}
            className="group relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl cursor-pointer"
            onClick={() => {
              sound.click(650);
              setSelectedPhoto(ALSARAYA_PHOTOS[3]);
            }}
          >
            <div className="relative aspect-16/10 overflow-hidden">
              <motion.img
                src={ALSARAYA_PHOTOS[3].src}
                alt={ALSARAYA_PHOTOS[3].titleAr}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

              <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'الحديقة المفتوحة' : 'Garden Terrace'}</span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-2 bg-slate-900/90 border-t border-slate-800/80">
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                {isAr ? ALSARAYA_PHOTOS[3].titleAr : ALSARAYA_PHOTOS[3].titleEn}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr ? ALSARAYA_PHOTOS[3].captionAr : ALSARAYA_PHOTOS[3].captionEn}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2. KINETIC SCROLL PHOTO RIBBON (Dual-lane moving strip that responds to scroll) */}
      <div className="relative p-6 rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="text-xs font-bold text-slate-400 mb-3 flex items-center justify-between">
          <span>{isAr ? 'شريط الصور السينمائي المتدفق' : 'Cinematic Horizontal Photo Stream'}</span>
          <span className="text-[11px] text-indigo-400 font-mono">{isAr ? 'يتسارع مع التمرير' : 'Scroll Accelerated'}</span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
          {ALSARAYA_PHOTOS.map((photo) => (
            <motion.div
              key={`tape-${photo.id}`}
              whileHover={{ scale: 1.05, y: -6 }}
              onClick={() => {
                sound.click(600);
                setSelectedPhoto(photo);
              }}
              className="shrink-0 w-64 sm:w-80 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer snap-start shadow-xl group"
            >
              <div className="aspect-16/10 overflow-hidden relative">
                <img
                  src={photo.src}
                  alt={photo.titleAr}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2.5 right-2.5 left-2.5 text-xs font-bold text-white truncate">
                  {isAr ? photo.titleAr : photo.titleEn}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Photo Banner */}
              <div className="relative aspect-16/9 sm:aspect-21/9 w-full overflow-hidden bg-slate-950">
                <img
                  src={selectedPhoto.src}
                  alt={selectedPhoto.titleAr}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 left-4 p-2 rounded-full bg-slate-950/80 border border-slate-700 text-white hover:bg-slate-800 cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Details */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 mb-2">
                      {isAr ? selectedPhoto.hallNameAr : selectedPhoto.hallNameEn}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {isAr ? selectedPhoto.titleAr : selectedPhoto.titleEn}
                    </h3>
                  </div>

                  {onOpenNewBooking && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        sound.click(750);
                        setSelectedPhoto(null);
                        onOpenNewBooking();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                    >
                      <Calendar className="w-4 h-4 text-amber-300" />
                      <span>{isAr ? 'حجز هذه القاعة الآن' : 'Book This Venue Now'}</span>
                    </motion.button>
                  )}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {isAr ? selectedPhoto.captionAr : selectedPhoto.captionEn}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
