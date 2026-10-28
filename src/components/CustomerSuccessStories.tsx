import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Star,
  Quote,
  Calendar,
  Users,
  MapPin,
  X,
  Volume2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { CoupleTestimonial, Language } from '../types/venueSystem';
import { INITIAL_COUPLE_TESTIMONIALS } from '../data/coupleTestimonialsData';

interface CustomerSuccessStoriesProps {
  language: Language;
  theme?: 'dark' | 'light';
  onOpenBookingModal: (hallId?: string) => void;
  testimonials?: CoupleTestimonial[];
}

export function CustomerSuccessStories({
  language,
  theme = 'dark',
  onOpenBookingModal,
  testimonials = INITIAL_COUPLE_TESTIMONIALS,
}: CustomerSuccessStoriesProps) {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [activeStory, setActiveStory] = useState<CoupleTestimonial | null>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveStory(null);
    };
    if (activeStory) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeStory]);

  const cardStyle = isDark
    ? 'overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900/70 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-amber-400/50 hover:-translate-y-1'
    : 'overflow-hidden rounded-3xl border border-amber-900/10 bg-white/85 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-amber-700/30 hover:-translate-y-1';

  return (
    <section id="stories" className="mx-auto max-w-6xl px-4 py-8">
      {/* Section Head */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.65 }}
        className="mb-12 flex flex-col items-center text-center sm:mb-16"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-amber-500 sm:text-sm">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>{isAr ? 'قصص نجاح وسعادة ضيوفنا' : 'Customer Success Stories'}</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        </div>

        <h2
          className={`mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-5xl ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {isAr
            ? 'شهادات حقيقية ولحظات مصورة من أصحاب ليالي العمر'
            : 'Live Video Testimonials from Our Royal Couples'}
        </h2>

        <p
          className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {isAr
            ? 'شاهد لقطات فيديو حيّة وتجارب واقعية لعرسان احتفلوا بأسعد لحظاتهم داخل قاعات السرايا الفندقية.'
            : 'Watch genuine reflections, video excerpts, and real experiences from unforgettable weddings celebrated in our halls.'}
        </p>
      </motion.div>

      {/* Testimonials Grid (Responsive 1-col on mobile, 2-col on tablet, 4-col on desktop) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((story, i) => (
          <motion.article
            key={story.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className={`${cardStyle} flex flex-col justify-between group cursor-pointer`}
            onClick={() => setActiveStory(story)}
          >
            {/* Video Thumbnail with Play Button */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
              <img
                src={story.thumbnailUrl}
                alt={isAr ? story.coupleNamesAr : story.coupleNamesEn}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

              {/* Glowing Golden Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-5 w-5 fill-slate-950 ms-0.5" />
                </span>
              </div>

              {/* Video Duration Badge */}
              <span className="absolute bottom-3 end-3 rounded-md bg-slate-950/80 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300 backdrop-blur-md">
                {story.duration}
              </span>

              {/* Hall Location Pill */}
              <span className="absolute top-3 start-3 rounded-full border border-amber-400/30 bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                {isAr ? story.hallNameAr.split('·')[0].trim() : story.hallNameEn.split('·')[0].trim()}
              </span>
            </div>

            {/* Content Details */}
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                {/* 5-Star Rating & Date */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: story.rating }).map((_, r) => (
                      <Star key={r} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {story.eventDate}
                  </span>
                </div>

                {/* Couple Names */}
                <h3
                  className={`font-serif text-xl font-bold leading-snug group-hover:text-amber-500 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {isAr ? story.coupleNamesAr : story.coupleNamesEn}
                </h3>

                {/* Highlight Banner */}
                <p className="mt-1 text-xs font-semibold text-amber-500 line-clamp-1">
                  {isAr ? story.highlightAr : story.highlightEn}
                </p>

                {/* Short Quote */}
                <p
                  className={`mt-2.5 text-xs leading-relaxed line-clamp-3 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  “{isAr ? story.quoteAr : story.quoteEn}”
                </p>
              </div>

              {/* Guest count & Watch Action */}
              <div className="mt-4 pt-3 border-t border-amber-500/15 flex items-center justify-between text-xs font-bold text-amber-500">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Users className="h-3 w-3 text-amber-400" />
                  {story.guestsCount} {isAr ? 'ضيف' : 'Guests'}
                </span>
                <span className="inline-flex items-center gap-1 group-hover:underline">
                  <span>{isAr ? 'مشاهدة الفيديو' : 'Watch Story'}</span>
                  <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* =========================================================================
          THEATER-MODE VIDEO MODAL
          ========================================================================= */}
      <AnimatePresence>
        {activeStory && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label={isAr ? 'فيديو قصة النجاح' : 'Video Testimonial'}
            onClick={() => setActiveStory(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full max-w-4xl overflow-hidden rounded-3xl border shadow-2xl ${
                isDark ? 'border-amber-500/30 bg-slate-900' : 'border-amber-900/20 bg-slate-900 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="absolute end-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-amber-500 hover:text-slate-950"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Native Video Player */}
              <div className="relative aspect-video w-full bg-black">
                <video
                  controls
                  autoPlay
                  playsInline
                  poster={activeStory.thumbnailUrl}
                  src={activeStory.videoUrl}
                  className="h-full w-full object-cover"
                >
                  <source src={activeStory.videoUrl} type="video/mp4" />
                  {isAr ? 'متصفحك لا يدعم تشغيل الفيديو.' : 'Your browser does not support video playback.'}
                </video>
              </div>

              {/* Story Details Footer inside Modal */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {Array.from({ length: activeStory.rating }).map((_, r) => (
                        <Star key={r} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="ms-2 text-xs font-mono text-amber-400 font-bold">
                        {isAr ? 'تقييم ممتاز 5.0' : '5.0 Star Experience'}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      {isAr ? activeStory.coupleNamesAr : activeStory.coupleNamesEn}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 font-medium">
                      {isAr ? activeStory.hallNameAr : activeStory.hallNameEn} · {activeStory.eventDate}
                    </p>
                  </div>

                  {/* Direct Booking Action for the Same Hall */}
                  <button
                    type="button"
                    onClick={() => {
                      const hallId = activeStory.hallId;
                      setActiveStory(null);
                      onOpenBookingModal(hallId);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-md transition-all hover:brightness-110 active:scale-95 whitespace-nowrap self-start sm:self-auto"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>{isAr ? 'حجز موعد في نفس القاعة' : 'Book a Tour in This Venue'}</span>
                  </button>
                </div>

                {/* Quote Text */}
                <div className="flex items-start gap-3">
                  <Quote className="h-6 w-6 shrink-0 text-amber-400 rotate-180 opacity-70" />
                  <p className="text-sm sm:text-base leading-relaxed text-slate-200 italic font-serif">
                    “{isAr ? activeStory.quoteAr : activeStory.quoteEn}”
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {isAr ? activeStory.highlightAr : activeStory.highlightEn}
                  </span>
                  {activeStory.guestsCount && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-amber-400" />
                      {isAr ? `${activeStory.guestsCount} ضيف حاضر` : `${activeStory.guestsCount} Guests in attendance`}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
