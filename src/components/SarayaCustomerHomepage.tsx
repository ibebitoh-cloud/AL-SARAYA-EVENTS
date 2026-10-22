import { motion, useReducedMotion } from 'motion/react';
import { Calendar, Heart, Sparkles, Cake, Presentation } from 'lucide-react';
import { Hall, Language, Booking } from '../types/venueSystem';
import { ALSARAYA_PHOTOS, VenuePhoto } from '../data/venueImages';
import { RevealText } from './ui/reveal-text';
import { SiteContent, siteText } from '../data/siteContent';

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
}

const OCCASIONS = [
  { key: 'wedding', icon: Heart },
  { key: 'engagement', icon: Sparkles },
  { key: 'birthday', icon: Cake },
  { key: 'corporate', icon: Presentation },
] as const;

export function SarayaCustomerHomepage({ photos, language, onOpenBookingModal, content }: SarayaCustomerHomepageProps) {
  const isAr = language === 'ar';
  const t = (key: string) => siteText(content, key, isAr);
  const reduceMotion = useReducedMotion();
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
  const fadeIn = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  // The whole home page (App draws the honey ember background behind it): one warm screen with the name, one line, one button and the occasions.
  // Venues, services, gallery and the rest have their own pages in the header menu.
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="w-full">
      <div>
        <section id="hero" className="flex min-h-[calc(100svh-5.5rem)] flex-col items-center justify-center px-5 py-14 text-center sm:px-10">
          <motion.p {...fadeIn(0.1)} className="mb-4 text-[11px] font-bold uppercase tracking-[0.35em] text-[#b45309] sm:mb-6 sm:text-xs">
            {t('hero.kicker')}
          </motion.p>
          <h1 aria-label={t('hero.word')}>
            <RevealText
              text={t('hero.word')}
              textColor="text-[#451a03]"
              overlayColor="text-[#d97706]"
              fontSize="text-[clamp(2.6rem,13vw,8.5rem)]"
              letterImages={letterPhotos}
            />
          </h1>
          <motion.p {...fadeIn(1.5)} className="mt-6 max-w-xl font-serif text-lg leading-snug text-[#78350f] sm:mt-8 sm:text-2xl">
            {t('hero.title1')} <span className="text-[#b45309]">{t('hero.title2')}</span>
          </motion.p>
          <motion.div {...fadeIn(1.7)} className="mt-8 sm:mt-10">
            <button type="button" onClick={() => onOpenBookingModal()} className="inline-flex items-center gap-2 rounded-full bg-[#78350f] px-8 py-4 text-sm font-bold text-[#fef3c7] shadow-[0_14px_30px_-12px_rgba(120,53,15,0.7)] transition hover:-translate-y-0.5 hover:bg-[#92400e]">
              <Calendar className="h-4 w-4" />{t('hero.button')}
            </button>
          </motion.div>
          <motion.ul {...fadeIn(1.9)} id="about" className="mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:mt-16">
            {OCCASIONS.map(({ key, icon: Icon }) => (
              <li key={key}>
                <button type="button" onClick={() => onOpenBookingModal()} className="inline-flex items-center gap-2 rounded-full border border-[#78350f]/15 bg-white/45 px-4 py-2 text-xs font-semibold text-[#78350f] backdrop-blur transition hover:bg-white/80">
                  <Icon className="h-3.5 w-3.5 text-[#d97706]" />{t(`events.${key}.title`)}
                </button>
              </li>
            ))}
          </motion.ul>
        </section>
      </div>
    </main>
  );
}
