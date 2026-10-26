import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Calendar, Heart, Sparkles, Cake, Presentation, ArrowRight, ArrowLeft, Users, MapPin, Building2, Award, PenTool, Truck, Palette, Mic2, ClipboardCheck } from 'lucide-react';
import { Hall, Language, Booking } from '../types/venueSystem';
import { ALSARAYA_PHOTOS, VenuePhoto } from '../data/venueImages';
import { RevealText } from './ui/reveal-text';
import { BrandLogo } from './BrandLogo';
import { SERVICE_KEYS, SiteContent, siteText, pickServicePhotos } from '../data/siteContent';

interface SarayaCustomerHomepageProps {
  halls: Hall[];
  photos?: VenuePhoto[];
  language: Language;
  onSelectHallForBooking: (hallId: string) => void;
  onOpenBookingModal: (hallId?: string) => void;
  onCreateBooking: (newBooking: Booking) => void;
  onOpenEventDesigner?: () => void;
  onOpenEditManager?: (tab?: 'halls' | 'photos', targetId?: string) => void;
  /** Opens a public page (events, venues, services, gallery…) from a "see all" link. */
  onNavigate?: (sectionId: string) => void;
  /** Editable website copy and photos from the portal's Website Content screen. */
  content?: SiteContent;
}

const OCCASIONS = [
  { key: 'wedding', icon: Heart, categories: ['wedding', 'kosha'] },
  { key: 'engagement', icon: Sparkles, categories: ['engagement', 'kosha'] },
  { key: 'birthday', icon: Cake, categories: ['birthday', 'party'] },
  { key: 'corporate', icon: Presentation, categories: ['corporate', 'ballroom'] },
] as const;

const SERVICE_ICONS = [PenTool, Building2, Truck, ClipboardCheck, Palette, Mic2];

// Section labels in Website Content carry an old "01 · " number; the home page no longer follows that order.
const stripNumber = (label: string) => label.replace(/^\s*\d+\s*·\s*/, '');

export function SarayaCustomerHomepage({ halls, photos, language, onOpenBookingModal, onNavigate, content }: SarayaCustomerHomepageProps) {
  const isAr = language === 'ar';
  const t = (key: string) => siteText(content, key, isAr);
  const reduceMotion = useReducedMotion();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const sourcePhotos = photos?.length ? photos : ALSARAYA_PHOTOS;
  const seen = new Set<string>();
  const displayPhotos = sourcePhotos.filter((photo) => {
    const source = (photo.src || '').trim().replace(/[?#].*$/, '').toLowerCase();
    if (!source || seen.has(source)) return false;
    seen.add(source);
    return true;
  });
  // Wedding and party photos that fill the letters on hover: two wedding shots, then a party shot.
  const weddingPhotos = displayPhotos.filter((p) => ['wedding', 'kosha', 'ballroom', 'engagement', 'dining'].includes(p.category)).map((p) => p.src);
  const partyPhotos = displayPhotos.filter((p) => ['birthday', 'party'].includes(p.category)).map((p) => p.src);
  const letterPhotos: string[] = [];
  for (let w = 0, pa = 0; w < weddingPhotos.length || pa < partyPhotos.length;) {
    if (w < weddingPhotos.length) letterPhotos.push(weddingPhotos[w++]);
    if (w < weddingPhotos.length) letterPhotos.push(weddingPhotos[w++]);
    if (pa < partyPhotos.length) letterPhotos.push(partyPhotos[pa++]);
  }
  const photoFor = (categories: readonly string[], index = 0) => {
    const matches = displayPhotos.filter((p) => categories.includes(p.category));
    return (matches[index] ?? matches[0] ?? displayPhotos[index % Math.max(1, displayPhotos.length)])?.src || '';
  };
  const aboutPhoto = content?.images.hero?.trim() || photoFor(['ballroom', 'wedding'], 0);
  const servicePhotos = pickServicePhotos(displayPhotos, content, new Set([aboutPhoto]));
  const shownHalls = halls.filter((hall) => !hall.isExternalListing).slice(0, 3);
  const venues = shownHalls.length ? shownHalls : halls.slice(0, 3);
  const galleryPhotos = displayPhotos.slice(0, 6);

  const fadeIn = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
  });
  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  const sectionHead = ({ kicker, title, text, link }: { kicker: string; title: string; text?: string; link?: { id: string; label: string } }) => (
    <motion.div {...reveal()} className="mb-10 flex flex-col items-center text-center sm:mb-14">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b45309] sm:text-sm">{stripNumber(kicker)}</p>
      <h2 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight text-[#451a03] sm:text-6xl">{title}</h2>
      {text && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#78350f]/85 sm:text-xl">{text}</p>}
      {link && onNavigate && (
        <button type="button" onClick={() => onNavigate(link.id)} className="mt-6 inline-flex items-center gap-2 text-base font-bold text-[#92400e] underline-offset-4 hover:underline">
          {link.label}<Arrow className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
  const section = (id: string, children: ReactNode) => (
    <section id={id} className="mx-auto w-full max-w-6xl px-1 py-20 sm:px-4 sm:py-28">{children}</section>
  );
  const card = 'overflow-hidden rounded-3xl border border-white/60 bg-white/55 shadow-[0_20px_50px_-30px_rgba(120,53,15,0.55)] backdrop-blur-md';

  const stats = [
    { icon: Building2, value: halls.length ? `${halls.length}+` : '', label: t('intro.stat1') },
    { icon: Heart, value: '', label: t('intro.stat2') },
    { icon: Presentation, value: '', label: t('intro.stat3') },
    { icon: MapPin, value: '', label: t('intro.stat4') },
  ];

  // App draws the honey ember background behind the whole page.
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="w-full">
      {/* First screen: the name, one line, one button and the occasions. */}
      <section id="hero" className="flex min-h-[calc(100svh-5.5rem)] flex-col items-center justify-center px-1 py-14 text-center sm:px-6">
        <motion.p {...fadeIn(0.1)} className="mb-5 text-sm font-bold uppercase tracking-[0.35em] text-[#b45309] sm:mb-7 sm:text-base">
          {t('hero.kicker')}
        </motion.p>
        <h1 aria-label={t('hero.word')}>
          <RevealText
            text={t('hero.word')}
            textColor="hero-gold-foil"
            overlayColor="text-[#d97706]"
            fontSize="text-[clamp(3.4rem,17.5vw,15rem)]"
            letterImages={letterPhotos}
          />
        </h1>
        <motion.p {...fadeIn(1.5)} className="mt-7 max-w-3xl font-serif text-2xl leading-snug text-[#78350f] sm:mt-10 sm:text-4xl">
          {t('hero.title1')} <span className="text-[#b45309]">{t('hero.title2')}</span>
        </motion.p>
        <motion.div {...fadeIn(1.7)} className="mt-9 sm:mt-12">
          <button type="button" onClick={() => onOpenBookingModal()} className="inline-flex items-center gap-2.5 rounded-full bg-[#78350f] px-9 py-4 text-base font-bold text-[#fef3c7] shadow-[0_14px_30px_-12px_rgba(120,53,15,0.7)] transition hover:-translate-y-0.5 hover:bg-[#92400e] sm:px-11 sm:py-5 sm:text-lg">
            <Calendar className="h-5 w-5" />{t('hero.button')}
          </button>
        </motion.div>
        <motion.ul {...fadeIn(1.9)} className="mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-2.5 sm:mt-16">
          {OCCASIONS.map(({ key, icon: Icon }) => (
            <li key={key}>
              <button type="button" onClick={() => onOpenBookingModal()} className="inline-flex items-center gap-2 rounded-full border border-[#78350f]/15 bg-white/45 px-5 py-2.5 text-sm font-semibold text-[#78350f] backdrop-blur transition hover:bg-white/80 sm:text-base">
                <Icon className="h-4 w-4 text-[#d97706]" />{t(`events.${key}.title`)}
              </button>
            </li>
          ))}
        </motion.ul>
      </section>

      {/* About us */}
      {section("about", <>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div {...reveal()} className={`${card} aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]`}>
            <div className="flex h-full w-full items-center justify-center p-10 sm:p-14"><BrandLogo variant="full" tone="dark" className="h-auto max-h-full w-full max-w-sm object-contain" /></div>
          </motion.div>
          <motion.div {...reveal(0.1)} className="text-center lg:text-start">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b45309] sm:text-sm">{t('about.kicker')}</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[#451a03] sm:text-6xl">{t('about.title')}</h2>
            <p className="mt-6 text-lg leading-relaxed text-[#78350f]/90 sm:text-xl">{t('about.text')}</p>
            <button type="button" onClick={() => onOpenBookingModal()} className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[#78350f] px-7 py-3.5 text-base font-bold text-[#78350f] transition hover:bg-[#78350f] hover:text-[#fef3c7]">
              {t('about.button')}<Arrow className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
        <ul className="mt-14 grid grid-cols-2 gap-3 sm:mt-20 sm:gap-5 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <motion.li key={label} {...reveal(i * 0.08)} className={`${card} flex flex-col items-center gap-3 px-4 py-7 text-center`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#78350f] text-[#fde68a]"><Icon className="h-6 w-6" /></span>
              {value && <span className="font-serif text-4xl font-bold text-[#451a03]">{value}</span>}
              <span className="text-base font-semibold text-[#78350f] sm:text-lg">{label}</span>
            </motion.li>
          ))}
        </ul>
      </>)}

      {/* Occasions */}
      {section("events", <>
        {sectionHead({ kicker: t('events.kicker'), title: t('events.title'), link: { id: 'events', label: isAr ? 'كل المناسبات' : 'All occasions' } })}
        <div className="grid gap-5 sm:grid-cols-2">
          {OCCASIONS.map(({ key, icon: Icon, categories }, i) => (
            <motion.button type="button" key={key} {...reveal(i * 0.08)} onClick={() => onOpenBookingModal()} className={`${card} group text-start transition hover:-translate-y-1`}>
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={photoFor(categories, i % 2)} alt={t(`events.${key}.title`)} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute start-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#fffbeb]/90 text-[#b45309]"><Icon className="h-5 w-5" /></span>
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="font-serif text-2xl font-semibold text-[#451a03] sm:text-3xl">{t(`events.${key}.title`)}</h3>
                <p className="mt-2 text-base leading-relaxed text-[#78350f]/85 sm:text-lg">{t(`events.${key}.text`)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </>)}

      {/* Services */}
      {section("services", <>
        {sectionHead({ kicker: t('services.kicker'), title: t('services.title'), link: { id: 'services', label: isAr ? 'كل الخدمات' : 'All services' } })}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_KEYS.map((key, i) => {
            const Icon = SERVICE_ICONS[i];
            const src = servicePhotos[i]?.src;
            return (
              <motion.div key={key} {...reveal((i % 3) * 0.08)} className={card}>
                {src && <img src={src} alt={t(`services.${key}.title`)} loading="lazy" className="aspect-[16/10] w-full object-cover" />}
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 shrink-0 text-[#d97706]" />
                    <h3 className="text-xl font-bold text-[#451a03] sm:text-2xl">{t(`services.${key}.title`)}</h3>
                  </div>
                  <p className="mt-3 text-base leading-relaxed text-[#78350f]/85">{t(`services.${key}.text`)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </>)}

      {/* Venues: names, size and photos only (customers never see prices). */}
      {venues.length > 0 && section("venues", <>
          {sectionHead({ kicker: t('venues.kicker'), title: t('venues.title'), text: t('venues.text'), link: { id: 'venues', label: isAr ? 'كل القاعات' : 'All venues' } })}
          <div className="grid gap-5 md:grid-cols-3">
            {venues.map((hall, i) => {
              const src = hall.photoUrl || hall.photo || hall.galleryPhotos?.[0] || photoFor(['ballroom', 'dining'], i);
              const name = isAr ? hall.name : hall.nameEn || hall.name;
              const place = isAr ? hall.cityAr || hall.city : hall.city || hall.cityAr;
              return (
                <motion.div key={hall.id} {...reveal(i * 0.08)} className={`${card} flex flex-col`}>
                  {src && <img src={src} alt={name} loading="lazy" className="aspect-[4/3] w-full object-cover" />}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-2xl font-semibold text-[#451a03]">{name}</h3>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-base text-[#78350f]/85">
                      {hall.capacity > 0 && <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-[#d97706]" />{isAr ? `حتى ${hall.capacity} ضيف` : `Up to ${hall.capacity} guests`}</span>}
                      {place && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#d97706]" />{place}</span>}
                    </div>
                    <button type="button" onClick={() => onOpenBookingModal(hall.id)} className="mt-6 inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#78350f] px-6 py-3 text-sm font-bold text-[#fef3c7] transition hover:bg-[#92400e] sm:text-base">
                      <Calendar className="h-4 w-4" />{isAr ? 'احجز هذه القاعة' : 'Book this venue'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>)}

      {/* Gallery strip */}
      {galleryPhotos.length > 0 && section("gallery", <>
          {sectionHead({ kicker: t('gallery.kicker'), title: t('gallery.title'), link: { id: 'gallery', label: isAr ? 'المعرض كاملاً' : 'Full gallery' } })}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {galleryPhotos.map((photo, i) => (
              <motion.figure key={photo.id} {...reveal((i % 3) * 0.06)} className={`${card} group relative ${i === 0 ? 'col-span-2 row-span-2 md:col-span-2' : ''}`}>
                <img src={photo.src} alt={isAr ? photo.titleAr : photo.titleEn} loading="lazy" className="h-full min-h-40 w-full object-cover transition duration-700 group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#451a03]/80 to-transparent px-4 pb-3 pt-10 text-sm font-semibold text-[#fef3c7] sm:text-base">
                  {isAr ? photo.titleAr : photo.titleEn}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </>)}

      {/* Closing call to action */}
      <section id="contact" className="mx-auto w-full max-w-4xl px-1 pb-24 pt-10 sm:px-4 sm:pb-32">
        <motion.div {...reveal()} className={`${card} px-6 py-14 text-center sm:px-14 sm:py-20`}>
          <Award className="mx-auto h-10 w-10 text-[#d97706]" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-[#b45309] sm:text-sm">{stripNumber(t('contact.kicker'))}</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[#451a03] sm:text-6xl">{t('contact.title')}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#78350f]/85 sm:text-xl">{t('contact.text')}</p>
          <button type="button" onClick={() => onOpenBookingModal()} className="mt-9 inline-flex items-center gap-2.5 rounded-full bg-[#78350f] px-9 py-4 text-base font-bold text-[#fef3c7] shadow-[0_14px_30px_-12px_rgba(120,53,15,0.7)] transition hover:-translate-y-0.5 hover:bg-[#92400e] sm:text-lg">
            <Calendar className="h-5 w-5" />{t('contact.button')}
          </button>
        </motion.div>
      </section>
    </main>
  );
}
