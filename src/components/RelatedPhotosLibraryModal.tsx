import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Calendar,
  Layers,
  Edit3,
  CheckCircle2,
  ExternalLink,
  Tag,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { VenuePhoto } from '../data/venueImages';
import { Language, Hall } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface RelatedPhotosLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePhoto: VenuePhoto | null;
  allPhotos: VenuePhoto[];
  halls: Hall[];
  language: Language;
  onSelectPhoto: (photo: VenuePhoto) => void;
  onOpenBookingModal: (hallId?: string) => void;
  onOpenEditManager: (tab?: 'halls' | 'photos', targetId?: string) => void;
}

export function RelatedPhotosLibraryModal({
  isOpen,
  onClose,
  activePhoto,
  allPhotos,
  halls,
  language,
  onSelectPhoto,
  onOpenBookingModal,
  onOpenEditManager,
}: RelatedPhotosLibraryModalProps) {
  const isAr = language === 'ar';
  const [filterMode, setFilterMode] = useState<'hall' | 'category' | 'all'>('hall');

  if (!isOpen || !activePhoto) return null;

  // Find related photos
  const relatedPhotos = allPhotos.filter((p) => {
    if (filterMode === 'hall') {
      return p.hallId === activePhoto.hallId || p.hallNameAr === activePhoto.hallNameAr;
    }
    if (filterMode === 'category') {
      return p.category === activePhoto.category;
    }
    return true;
  });

  const currentIndex = relatedPhotos.findIndex((p) => p.id === activePhoto.id);

  const handleNext = () => {
    if (relatedPhotos.length <= 1) return;
    sound.tick();
    const nextIdx = (currentIndex + 1) % relatedPhotos.length;
    onSelectPhoto(relatedPhotos[nextIdx]);
  };

  const handlePrev = () => {
    if (relatedPhotos.length <= 1) return;
    sound.tick();
    const prevIdx = (currentIndex - 1 + relatedPhotos.length) % relatedPhotos.length;
    onSelectPhoto(relatedPhotos[prevIdx]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') {
        isAr ? handlePrev() : handleNext();
      } else if (e.key === 'ArrowLeft') {
        isAr ? handleNext() : handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, relatedPhotos, isAr]);

  const activeHall = halls.find((h) => h.id === activePhoto.hallId) || halls[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.click(600);
            onClose();
          }}
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-6xl max-h-[94vh] bg-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-amber-500/15 bg-slate-950/80">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              <div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'مكتبة الصور المرتبطة' : 'Related Photos Library'}</span>
                  <span className="text-xs font-sans text-amber-400/80 font-mono">
                    ({currentIndex + 1} / {relatedPhotos.length})
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAr ? activePhoto.hallNameAr : activePhoto.hallNameEn}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick in-demo edit button */}
              <button
                type="button"
                onClick={() => {
                  sound.click(700);
                  onOpenEditManager('photos', activePhoto.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold transition-colors"
                title={isAr ? 'تعديل أو استبدال هذه الصورة لاحقاً' : 'Edit or replace this photo'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'تعديل الصورة' : 'Edit Photo'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.click(600);
                  onClose();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Visual Display & Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
            {/* Left: Large High-Res Image with Next/Prev Controls */}
            <div className="lg:col-span-8 relative bg-black flex items-center justify-center min-h-[320px] sm:min-h-[460px] max-h-[60vh] lg:max-h-[66vh] overflow-hidden group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activePhoto.id}
                  src={activePhoto.src}
                  alt={isAr ? activePhoto.titleAr : activePhoto.titleEn}
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full object-contain select-none max-h-[66vh]"
                />
              </AnimatePresence>

              {/* Prev / Next Arrows */}
              {relatedPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous"
                    className="absolute start-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-amber-400 text-white hover:text-slate-950 border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-110"
                  >
                    {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next"
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-amber-400 text-white hover:text-slate-950 border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-110"
                  >
                    {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>

            {/* Right: Photo Specs & Direct Inquiry */}
            <div className="lg:col-span-4 p-5 sm:p-6 bg-slate-950/90 border-t lg:border-t-0 lg:border-s border-amber-500/15 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block mb-1">
                    {isAr ? activePhoto.hallNameAr : activePhoto.hallNameEn}
                  </span>
                  <h4 className="text-lg sm:text-xl font-serif font-bold text-white">
                    {isAr ? activePhoto.titleAr : activePhoto.titleEn}
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isAr ? activePhoto.captionAr : activePhoto.captionEn}
                </p>

                {/* Hall Quick Specs */}
                {activeHall && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Building className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'القاعة:' : 'Hall:'}</span>
                      </span>
                      <span className="font-semibold text-white">{activeHall.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">{isAr ? 'السعة القصوى:' : 'Max Capacity:'}</span>
                      <span className="font-mono text-amber-300">{activeHall.capacity} {isAr ? 'فرد' : 'Guests'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">{isAr ? 'سعر الحجز المبدئي:' : 'Starting Rate:'}</span>
                      <span className="font-mono font-bold text-white">{activeHall.basePrice?.toLocaleString()} EGP</span>
                    </div>
                  </div>
                )}

                {/* Tags if available */}
                {activePhoto.tags && activePhoto.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activePhoto.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    sound.fanfare();
                    onClose();
                    onOpenBookingModal(activePhoto.hallId);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all text-center flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isAr ? 'احجز مناسبتك في هذه القاعة' : 'Book Event in This Hall'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.click(650);
                    onOpenEditManager('halls', activePhoto.hallId);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'تعديل بيانات واسم القاعة (Demo)' : 'Edit Hall Name & Details (Demo)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Album Strip: Filter & Related Thumbnails */}
          <div className="px-4 sm:px-6 py-4 border-t border-amber-500/15 bg-slate-950/95 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">
                {isAr ? 'تصفح الصور المرتبطة حسب:' : 'Browse Related Photos by:'}
              </span>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    sound.tick();
                    setFilterMode('hall');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filterMode === 'hall'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'نفس القاعة' : 'Same Hall'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.tick();
                    setFilterMode('category');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filterMode === 'category'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'نفس الفئة' : 'Same Category'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.tick();
                    setFilterMode('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filterMode === 'all'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'جميع صور المكتبة' : 'All Photos'}
                </button>
              </div>
            </div>

            {/* Thumbnails Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {relatedPhotos.map((photo) => {
                const isActive = photo.id === activePhoto.id;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      sound.click(650);
                      onSelectPhoto(photo);
                    }}
                    className={`relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      isActive
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md'
                        : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={photo.src}
                      alt={isAr ? photo.titleAr : photo.titleEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-1 start-1 end-1 text-[9px] text-white truncate font-medium">
                      {isAr ? photo.titleAr : photo.titleEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
