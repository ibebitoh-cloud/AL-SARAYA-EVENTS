import { useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'motion/react';
import {
  ArrowRight, ArrowLeft, Calendar, Camera, CheckCircle2, ChevronDown, Eye, Heart,
  MapPin, MessageCircle, Sparkles, Users, Cake, Presentation, Ruler,
  X
} from 'lucide-react';
import { Hall, Language, Booking } from '../types/venueSystem';
import { ALSARAYA_PHOTOS, VenuePhoto } from '../data/venueImages';
import { WeddingHeroScene } from './WeddingHeroScene';
import { SiteContent, siteText, pickServicePhotos } from '../data/siteContent';

interface SarayaCustomerHomepageProps {
  halls: Hall[];
  photos?: VenuePhoto[];
  language: Language;
  onSelectHallForBooking: (hallId: string) => void;
  onOpenBookingModal: (hallId?: string) => void;
  onCreateBooking: (newBooking: Booking) => void;
  onOpenEventDesigner?: () => void;
  onOpenEditManager?: (tab?: 'halls' | 'photos', targetId?: string) => void;
  /** Editable website copy and photos from the portal's Website Content screen. */
  content?: SiteContent;
  /** Opens the Services page with the full service catalogue and rental items. */
  onOpenServicesPage?: () => void;
}

type EventKey = 'wedding' | 'engagement' | 'birthday' | 'corporate';

const eventContent: Record<EventKey, {
  icon: typeof Heart;
}> = {
  wedding: { icon: Heart },
  engagement: { icon: Sparkles },
  birthday: { icon: Cake },
  corporate: { icon: Presentation },
};

// Fades a block up the first time it scrolls into view, so the page opens calm and the details arrive as visitors scroll.
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SarayaCustomerHomepage({
  halls, photos, language, onOpenBookingModal, onCreateBooking,
  onOpenEventDesigner, onOpenEditManager, content, onOpenServicesPage
}: SarayaCustomerHomepageProps) {
  const isAr = language === 'ar';
  const t = (key: string) => siteText(content, key, isAr);
  const customImage = (key: string) => content?.images[key]?.trim() || '';
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const sourcePhotos = photos?.length ? photos : ALSARAYA_PHOTOS;
  const normalizePhotoSource = (src: string) => (src || '').trim().replace(/[?#].*$/, '').toLowerCase();
  const seenPhotoSources = new Set<string>();
  const displayPhotos = sourcePhotos.filter(photo => {
    const source = normalizePhotoSource(photo.src);
    if (!source || seenPhotoSources.has(source)) return false;
    seenPhotoSources.add(source);
    return true;
  });
  const availableHalls = halls;
  // Reserve a different source image for each event category; never recycle a source.
  // This prevents the old index-based fallback from repeating event-card photos.
  const eventPhotoCategories: Record<EventKey, string[]> = {
    wedding: ['wedding', 'ballroom', 'kosha', 'dining'],
    engagement: ['engagement'],
    birthday: ['birthday', 'party'],
    corporate: ['corporate'],
  };
  const usedEventPhotoSources = new Set<string>();
  const eventPhotos = Object.fromEntries((Object.keys(eventContent) as EventKey[]).map(key => {
    const candidates = [
      ...displayPhotos.filter(photo => eventPhotoCategories[key].includes(photo.category)),
      ...displayPhotos.filter(photo => !eventPhotoCategories[key].includes(photo.category)),
    ];
    const photo = candidates.find(candidate => !usedEventPhotoSources.has(normalizePhotoSource(candidate.src)));
    if (photo) usedEventPhotoSources.add(normalizePhotoSource(photo.src));
    const custom = customImage(`event.${key}`);
    return [key, custom ? { ...(photo ?? displayPhotos[0]), src: custom } : photo];
  })) as Record<EventKey, VenuePhoto | undefined>;
  // Service cards use the photo set in Website Content, or a library photo not already on an event card.
  const servicePhotos = pickServicePhotos(displayPhotos, content, usedEventPhotoSources);
  const [event, setEvent] = useState<EventKey>('wedding');
  const [gallery, setGallery] = useState<VenuePhoto | null>(null);

  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroImageScale = useTransform(heroProgress, [0, 1], [1, 1.15]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);
  const heroTextY = useTransform(heroProgress, [0, 1], [0, -80]);

  const openBooking = (hallId?: string) => onOpenBookingModal(hallId);

  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="w-full overflow-x-hidden pb-12 text-slate-100 sm:pb-20">
      {/* HERO — one photo, one line, one button. Everything else waits below the fold. */}
      <section id="hero" ref={heroRef} className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-950 sm:rounded-[2rem]">
        <motion.img
          src={customImage('hero') || displayPhotos[0]?.src}
          alt=""
          style={reduceMotion ? undefined : { scale: heroImageScale }}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" />
        <WeddingHeroScene reduceMotion={Boolean(reduceMotion)} />
        <motion.div
          style={reduceMotion ? undefined : { opacity: heroTextOpacity, y: heroTextY }}
          className="relative z-10 mx-auto flex min-h-[calc(100svh-8.5rem)] max-w-5xl flex-col items-center justify-center px-5 py-16 text-center sm:min-h-[calc(100svh-7rem)] sm:px-8"
        >
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
            {t('hero.kicker')}
          </motion.div>
          <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }} className="text-4xl font-serif font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
            {t('hero.title1')}<br /><span className="text-amber-300">{t('hero.title2')}</span>
          </motion.h1>
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-10">
            <button type="button" onClick={() => openBooking()} className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300">
              <Calendar className="h-4 w-4" />{t('hero.button')}
            </button>
          </motion.div>
        </motion.div>
        <motion.button
          type="button"
          onClick={() => document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth' })}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute inset-x-0 bottom-5 z-10 mx-auto flex w-max flex-col items-center gap-1 text-[11px] font-semibold tracking-widest text-slate-300 hover:text-amber-300"
        >
          {t('hero.scroll')}
          <motion.span animate={reduceMotion ? undefined : { y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}><ChevronDown className="h-5 w-5" /></motion.span>
        </motion.button>
      </section>

      {/* INTRO — the details that used to crowd the hero */}
      <section id="intro" className="mx-auto mt-16 max-w-3xl scroll-mt-24 text-center sm:mt-28">
        <Reveal>
          <p className="text-xl font-serif leading-relaxed text-slate-200 sm:text-3xl">
            {t('intro.text')}
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4 sm:gap-y-0">
            {[
              [t('intro.stat1'), availableHalls.length || '—'],
              [t('intro.stat2'), '✓'],
              [t('intro.stat3'), '✓'],
              [t('intro.stat4'), '✓'],
            ].map(([label, value]) => <div key={label} className="px-2"><div className="text-lg font-bold text-amber-300">{value}</div><div className="mt-1 text-[11px] text-slate-400">{label}</div></div>)}
          </div>
        </Reveal>
      </section>

      {/* EVENT TYPES */}
      <section id="events" className="mt-12 space-y-5 scroll-mt-24 sm:mt-20 sm:space-y-7">
        <Reveal>
          <header>
            <div className="text-xs font-bold tracking-[0.2em] text-amber-400">{t('events.kicker')}</div>
            <h2 className="mt-2 text-3xl font-serif font-bold sm:text-4xl">{t('events.title')}</h2>
          </header>
        </Reveal>
        <Reveal delay={0.1}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(eventContent) as EventKey[]).map((key) => {
            const item = eventContent[key]; const Icon = item.icon; const active = event === key;
            return <button key={key} type="button" onClick={() => setEvent(key)} className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition ${active ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-500/40'}`}>
              <Icon className="h-5 w-5" /><span className="text-xs font-bold">{t(`events.${key}.title`)}</span>
            </button>;
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={event} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 lg:grid-cols-2">
            <img src={eventPhotos[event]?.src} alt={isAr ? `${t(`events.${event}.title`)} - تجهيزات وديكور المناسبة` : `${t(`events.${event}.title`)} event setup and decor`} className="h-72 w-full object-cover lg:h-full" referrerPolicy="no-referrer" />
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">{t('events.cardKicker')}</div>
              <h3 className="text-2xl font-serif font-bold">{t(`events.${event}.title`)}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{t(`events.${event}.text`)}</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
                {t('events.note')}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        </Reveal>
      </section>

      {/* WHAT WE DO */}
      <section id="services" className="mt-20 space-y-7 scroll-mt-24">
        <Reveal>
          <header>
            <div className="text-xs font-bold tracking-[0.2em] text-amber-400">{t('services.kicker')}</div>
            <h2 className="mt-2 text-3xl font-serif font-bold sm:text-4xl">{t('services.title')}</h2>
          </header>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicePhotos.map((service, index) => (
            <Reveal key={service.key} delay={(index % 3) * 0.08} className="h-full">
              <article className="group h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
                <div className="relative h-44 overflow-hidden bg-slate-950 sm:h-48">
                  {service.src && <img src={service.src} alt={t(`services.${service.key}.title`)} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>
                <div className="p-5"><h3 className="text-base font-bold">{t(`services.${service.key}.title`)}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{t(`services.${service.key}.text`)}</p></div>
              </article>
            </Reveal>
          ))}
        </div>
        {onOpenServicesPage && <div className="flex justify-center"><button type="button" onClick={onOpenServicesPage} className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-amber-400">{isAr ? 'كل الخدمات والمعدات بالصور' : 'All services & rental items'}<Arrow className="h-4 w-4" /></button></div>}
      </section>

      {/* VENUES */}
      <section id="venues" className="mt-20 space-y-7 scroll-mt-24">
        <Reveal>
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><div className="text-xs font-bold tracking-[0.2em] text-amber-400">{t('venues.kicker')}</div><h2 className="mt-2 text-3xl font-serif font-bold sm:text-4xl">{t('venues.title')}</h2></div>
            <p className="max-w-md text-xs leading-6 text-slate-400">{t('venues.text')}</p>
          </header>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          {availableHalls.map((hall, index) => {
            // The public venue card reads directly from the same Hall profile edited in Company Profile.
            const profilePhoto = hall.photoUrl || hall.photo;
            const linkedLibraryPhoto = displayPhotos.find(p => p.hallId === hall.id)
              || displayPhotos.find(p => (p.hallNameAr && p.hallNameAr === hall.name) || (p.hallNameEn && p.hallNameEn === hall.nameEn));
            const photoSrc = profilePhoto || linkedLibraryPhoto?.src;
            const venueName = isAr ? hall.name : (hall.nameEn || hall.name);
            const description = isAr ? hall.description : (hall.descriptionEn || hall.description);
            return <Reveal key={hall.id} delay={(index % 2) * 0.1}><article className="h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="relative h-64 bg-slate-950">
                {photoSrc ? <img src={photoSrc} alt={venueName} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">{isAr ? 'صورة القاعة ستُضاف قريباً' : 'Venue photo coming soon'}</div>}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-5 pt-16"><h3 className="text-xl font-serif font-bold">{venueName}</h3>{hall.city && <div className="mt-1 text-xs font-semibold text-amber-200">{isAr ? (hall.cityAr || hall.city) : hall.city}</div>}{hall.isExternalListing && <span className="mt-2 inline-flex rounded-full border border-white/20 bg-slate-950/70 px-2 py-1 text-[10px] font-bold text-slate-200">{isAr ? "دليل قاعات خارجي" : "External venue listing"}</span>}</div>
              </div>
              <div className="space-y-3 p-4">
                {description && <p className="text-sm leading-6 text-slate-400">{description}</p>}{hall.isExternalListing && hall.sourceUrl && <a href={hall.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex text-xs font-semibold text-amber-300 underline decoration-amber-300/40 underline-offset-4 hover:text-amber-200">{isAr ? "عرض بيانات القاعة ومصدرها" : "View venue listing & source"}</a>}{hall.isExternalListing && <p className="text-[11px] leading-5 text-slate-500">{isAr ? "الصور مرجعية مرخّصة وليست صوراً مؤكدة للمكان. التوافر والأسعار يحتاجان إلى تأكيد من إدارة القاعة." : "Licensed stock reference images, not verified venue photos. Confirm availability and rates with the venue."}</p>}
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                    <span className="flex items-center gap-2"><Users className="h-4 w-4 text-amber-300" />{hall.capacity || '—'} {isAr ? 'ضيف' : 'guests'}</span>
                    {hall.areaSqMeters ? <span className="flex items-center gap-1"><Ruler className="h-4 w-4 text-amber-300" />{hall.areaSqMeters} {isAr ? 'م²' : 'm²'}</span> : null}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:flex">
                    <button type="button" onClick={() => openBooking(hall.id)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-amber-400">{isAr ? 'ناقش تصميم مناسبتك' : 'Discuss Your Event Plan'}</button>
                    <button type="button" onClick={() => openBooking(hall.id)} className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300">{hall.isExternalListing ? (isAr ? 'استفسر عن التوافر' : 'Check Availability') : (isAr ? 'احجز' : 'Book')}</button>
                  </div>
                </div>
              </div>
            </article></Reveal>;
          })}
        </div>
      </section>

      {/* DESIGNER FEATURE — INTERVIEW ONLY */}
      <section id="planner" className="mt-12 overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-950 scroll-mt-24 sm:mt-20 sm:rounded-3xl">
        <Reveal className="grid items-center">
          <div className="p-7 sm:p-10 lg:p-14">
            <div className="text-xs font-bold tracking-[0.2em] text-amber-400">{t('planner.kicker')}</div>
            <h2 className="mt-3 text-3xl font-serif font-bold sm:text-4xl">{t('planner.title')}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{t('planner.text')}</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300">
              {t('planner.tags').split(/[,،]/).map((x) => x.trim()).filter(Boolean).map(x => <span key={x} className="rounded-lg border border-slate-700 px-3 py-2">{x}</span>)}
            </div>
            <div className="mt-7 inline-flex items-center rounded-xl border border-amber-400/30 bg-amber-400/5 px-5 py-3 text-sm font-semibold text-amber-300">{t('planner.note')}</div>
            <div className="mt-7">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5"><div className="text-sm font-bold text-white">{isAr ? 'تصميم وتجهيز حسب مناسبتكم' : 'Planning tailored to your event'}</div><p className="mt-2 text-xs leading-6 text-slate-400">{isAr ? 'نراجع المساحة والتجهيزات معكم ونشارك صوراً وأمثلة مناسبة قبل التنفيذ.' : 'We review the space and setup with you, and share relevant photos and examples before the event.'}</p></div>
            </div>
          </div>

        </Reveal>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="mt-20 space-y-7 scroll-mt-24">
        <Reveal>
          <header><div className="text-xs font-bold tracking-[0.2em] text-amber-400">{t('gallery.kicker')}</div><h2 className="mt-2 text-3xl font-serif font-bold sm:text-4xl">{t('gallery.title')}</h2></header>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {displayPhotos.slice(0, 18).map((photo, index) => <Reveal key={photo.id} delay={(index % 3) * 0.08}><button type="button" onClick={() => setGallery(photo)} className="group relative block w-full h-56 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-start sm:h-64"><img src={photo.src} alt={isAr ? photo.titleAr : photo.titleEn} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" /><div className="absolute inset-x-3 bottom-3"><div className="text-[10px] text-amber-300">{isAr ? photo.hallNameAr : photo.hallNameEn}</div><div className="mt-1 text-xs font-bold text-white">{isAr ? photo.titleAr : photo.titleEn}</div></div></button></Reveal>)}
        </div>
      </section>


      {/* ABOUT SARAYA */}
      <section id="about" className="mt-12 scroll-mt-24 rounded-2xl border border-amber-500/20 bg-slate-900/70 p-5 sm:mt-20 sm:rounded-3xl sm:p-12">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-bold tracking-[0.2em] text-amber-400">{t('about.kicker')}</div>
          <h2 className="mt-3 text-3xl font-serif font-bold sm:text-4xl">{t('about.title')}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">{t('about.text')}</p>
          <button type="button" onClick={() => openBooking()} className="mt-6 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300">{t('about.button')}</button>
        </Reveal>
      </section>

      {/* FINAL CTA */}
      <section id="contact" className="mt-12 rounded-2xl border border-amber-500/25 bg-slate-900 p-5 text-center sm:mt-20 sm:rounded-3xl sm:p-12">
        <Reveal className="mx-auto max-w-2xl">
          <MessageCircle className="mx-auto h-8 w-8 text-amber-300" />
          <div className="mt-4 text-xs font-bold tracking-[0.2em] text-amber-400">{t('contact.kicker')}</div>
          <h2 className="mt-3 text-3xl font-serif font-bold sm:text-4xl">{t('contact.title')}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">{t('contact.text')}</p>
          <div className="mt-7 flex justify-center"><button type="button" onClick={() => openBooking()} className="rounded-xl border border-slate-700 px-7 py-3.5 text-sm font-semibold text-white hover:border-amber-400">{t('contact.button')}</button></div>
        </Reveal>
      </section>

      {gallery && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4" onClick={() => setGallery(null)}>
        <div className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900" onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setGallery(null)} className="absolute end-3 top-3 z-10 rounded-full bg-slate-950/80 p-2 text-white"><X className="h-5 w-5" /></button>
          <img src={gallery.src} alt={isAr ? gallery.titleAr : gallery.titleEn} className="max-h-[78vh] w-full object-contain" referrerPolicy="no-referrer" />
          <div className="space-y-2 p-4"><div className="text-xs text-amber-300">{isAr ? gallery.hallNameAr : gallery.hallNameEn}</div><div className="font-serif font-bold">{isAr ? gallery.titleAr : gallery.titleEn}</div>{(gallery.captionAr || gallery.captionEn) && <p className="text-xs leading-5 text-slate-400">{isAr ? gallery.captionAr : gallery.captionEn}</p>}{gallery.photoCredit && gallery.sourceUrl && <a href={gallery.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex text-xs font-semibold text-amber-300 underline underline-offset-4">{isAr ? `مصدر الصورة والترخيص: ${gallery.photoCredit}` : `Image source & license: ${gallery.photoCredit}`}</a>}</div>
        </div>
      </div>}
    </main>
  );
}
