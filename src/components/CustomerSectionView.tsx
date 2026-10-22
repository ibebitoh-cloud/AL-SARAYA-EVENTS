import { useState } from 'react';
import { Calendar, Building2, Sparkles, Ruler, Image as ImageIcon, Cuboid, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { Hall, Language, ServiceDefinition, InventoryItem } from '../types/venueSystem';
import { isCustomerItem } from '../data/inventoryDisplay';
import { ALSARAYA_PHOTOS, VenuePhoto } from '../data/venueImages';
import { SiteContent, siteText, pickServicePhotos } from '../data/siteContent';

type Screen = 'events' | 'venues' | 'services' | 'planner' | 'gallery' | '3d-tour';

interface Props {
  screen: Screen;
  halls: Hall[];
  photos?: VenuePhoto[];
  language: Language;
  onOpenBooking: (hallId?: string) => void;
  onGoHome: () => void;
  /** Editable service texts and photos from Website Content. */
  content?: SiteContent;
  /** Service catalogue and rental stock, shown with photos and without prices. */
  services?: ServiceDefinition[];
  inventory?: InventoryItem[];
}

const copy = {
  events: { en: ['Events', 'Every occasion is planned around your needs.', 'Weddings, engagements, birthdays, parties, conferences and summits.'], ar: ['المناسبات', 'كل مناسبة نخطط لها حسب احتياجاتكم.', 'أفراح، خطوبات، أعياد ميلاد، حفلات، مؤتمرات وقمم.'] },
  venues: { en: ['Venues', 'Spaces prepared for memorable events.', 'Choose the right hall, or let our team plan your event at your own location.'], ar: ['القاعات', 'مساحات مجهزة لصناعة مناسبات مميزة.', 'اختر القاعة المناسبة أو دع فريقنا يخطط مناسبتك في موقعك الخاص.'] },
  services: { en: ['Services & Equipment Rental', 'Event services and rental equipment coordinated in one place.', 'Venue coordination, equipment rental, planning, decoration, stages, screens, lighting, sound, tables, chairs, flowers and event-day coordination.'], ar: ['الخدمات وتأجير المعدات', 'خدمات وتجهيزات مناسبتك بتنسيق من خلال فريق واحد.', 'توفير القاعات وحجزها، وتأجير المعدات، والتخطيط، والديكور، والمنصات، والشاشات، والإضاءة، والصوت، والطاولات، والكراسي، والزهور، والتنسيق يوم المناسبة.'] },
  planner: { en: ['Event Planning', 'Professional visual planning is available during your interview.', 'Our team can prepare 2D planning and 3D visualization with you before execution. The planning tool is reserved for Saraya employees.'], ar: ['تخطيط المناسبة', 'التخطيط البصري الاحترافي متاح أثناء المقابلة.', 'يقوم فريقنا بإعداد مخطط 2D وتصوّر 3D معكم قبل التنفيذ. أداة التصميم مخصصة لموظفي السرايا.'] },
  gallery: { en: ['Gallery', 'A look at our work and event atmosphere.', 'Explore selected Saraya event photography.'], ar: ['معرض الصور', 'نظرة على أعمالنا وأجواء مناسباتنا.', 'شاهد مجموعة مختارة من صور مناسبات السرايا.'] },
  '3d-tour': { en: ['3D Tour', 'Explore the space with our team.', '3D venue visualization is presented by the Saraya team as part of the planning and interview process.'], ar: ['جولة 3D', 'استكشف المساحة مع فريق السرايا.', 'يقدم فريق السرايا التصور ثلاثي الأبعاد ضمن عملية التخطيط والمقابلة.'] },
} as const;

export function CustomerSectionView({ screen, halls, photos: libraryPhotos, language, onOpenBooking, onGoHome, content, services = [], inventory = [] }: Props) {
  const isAr = language === 'ar';
  const [selectedVenuePhoto, setSelectedVenuePhoto] = useState<VenuePhoto | null>(null);
  const [venueAlbumSlides, setVenueAlbumSlides] = useState<Record<string, number>>({});
  const data = copy[screen][isAr ? 'ar' : 'en'];
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const sourcePhotos = libraryPhotos?.length ? libraryPhotos : ALSARAYA_PHOTOS;
  const photos = sourcePhotos.filter((photo, index, list) => {
    const key = photo.src.trim().replace(/[?#].*$/, '').toLowerCase();
    return !!key && list.findIndex((other) => other.src.trim().replace(/[?#].*$/, '').toLowerCase() === key) === index;
  });
  const availableHalls = halls;

  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="min-h-[70vh] pb-20">
      <div className="rounded-3xl border border-amber-500/15 bg-slate-900/60 overflow-hidden">
        <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
              {screen === 'events' && <Calendar className="h-6 w-6" />}
              {screen === 'venues' && <Building2 className="h-6 w-6" />}
              {screen === 'services' && <Sparkles className="h-6 w-6" />}
              {screen === 'planner' && <Ruler className="h-6 w-6" />}
              {screen === 'gallery' && <ImageIcon className="h-6 w-6" />}
              {screen === '3d-tour' && <Cuboid className="h-6 w-6" />}
            </div>
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white">{data[0]}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-amber-200/90">{data[1]}</p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">{data[2]}</p>
          </div>
        </div>

        {screen === 'events' && (
          <div className="grid gap-4 border-t border-slate-800 p-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: isAr ? 'أفراح' : 'Weddings', categories: ['wedding', 'ballroom', 'kosha', 'dining'] },
              { label: isAr ? 'خطوبات وعقد قران' : 'Engagements', categories: ['engagement'] },
              { label: isAr ? 'أعياد ميلاد وحفلات' : 'Birthdays & Parties', categories: ['birthday', 'party'] },
              { label: isAr ? 'مؤتمرات وقمم' : 'Conferences & Summits', categories: ['corporate'] },
            ].map((item) => {
              const photo = photos.find((candidate) => item.categories.includes(candidate.category)) || photos[0];
              return (
                <div key={item.label} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img src={photo?.src} alt={item.label} className="h-44 w-full object-cover" />
                  <div className="p-4 text-sm font-bold">{item.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {screen === 'venues' && (
          <div className="grid gap-5 border-t border-slate-800 p-6 md:grid-cols-2">
            {availableHalls.map(hall => {
              const albumPhotos = sourcePhotos.filter(photo => photo.hallId === hall.id);
              const photo = albumPhotos[0] || photos.find(p => p.hallId === hall.id) || photos[0];
              return <article key={hall.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <button type="button" onClick={() => photo && setSelectedVenuePhoto(photo)} className="group relative block w-full text-left">
                  <img src={photo?.src} alt={isAr ? hall.name : (hall.nameEn || hall.name)} className="h-60 w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
                  <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white">{albumPhotos.length} {isAr ? 'صور في الألبوم' : 'photos in album'}</span>
                </button>
                <div className="flex items-center justify-between gap-3 p-5">
                  <div><h2 className="font-serif text-xl font-bold">{isAr ? hall.name : (hall.nameEn || hall.name)}</h2><p className="mt-1 text-xs text-slate-400">{hall.capacity || '—'} {hall.capacity ? (isAr ? 'ضيف' : 'guests') : ''}{hall.city ? ` · ${isAr ? (hall.cityAr || hall.city) : hall.city}` : ''}</p>{hall.isExternalListing && hall.sourceUrl && <a href={hall.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-amber-300 underline underline-offset-4">{isAr ? 'مصدر بيانات القاعة' : 'Venue listing source'}</a>}{hall.isExternalListing && <p className="mt-2 text-[11px] leading-5 text-slate-500">{isAr ? 'قد تتضمن الصور مراجع بصرية وليست صوراً مؤكدة للمكان نفسه.' : 'The album may include visual references that are not verified photos of this exact venue.'}</p>}</div>
                  <button onClick={() => onOpenBooking(hall.id)} className="shrink-0 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950">{isAr ? 'احجز' : 'Book'}</button>
                </div>
                {albumPhotos.length > 0 && (() => {
                  const slide = venueAlbumSlides[hall.id] ?? 0;
                  const maxSlide = Math.max(0, Math.ceil(albumPhotos.length / 2) - 1);
                  const visiblePhotos = albumPhotos.slice(slide * 2, slide * 2 + 2);
                  const moveSlide = (direction: number) => setVenueAlbumSlides(current => ({ ...current, [hall.id]: (slide + direction + maxSlide + 1) % (maxSlide + 1) }));
                  return <div className="px-4 pb-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400">{isAr ? 'ألبوم الصور' : 'Photo album'} · {Math.min(slide * 2 + 1, albumPhotos.length)}–{Math.min(slide * 2 + visiblePhotos.length, albumPhotos.length)} / {albumPhotos.length}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => moveSlide(-1)} aria-label={isAr ? 'الصورتان السابقتان' : 'Previous two photos'} className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/40 bg-slate-900 text-amber-200 transition hover:bg-amber-400 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400"><ArrowLeft className="h-4 w-4" /></button>
                        <button type="button" onClick={() => moveSlide(1)} aria-label={isAr ? 'الصورتان التاليتان' : 'Next two photos'} className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/40 bg-slate-900 text-amber-200 transition hover:bg-amber-400 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400"><ArrowRight className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2" onTouchStart={event => { (event.currentTarget as HTMLDivElement).dataset.touchStartX = String(event.touches[0].clientX); }} onTouchEnd={event => { const startX = Number((event.currentTarget as HTMLDivElement).dataset.touchStartX || 0); const deltaX = event.changedTouches[0].clientX - startX; if (Math.abs(deltaX) > 40) moveSlide(deltaX < 0 ? 1 : -1); }}>
                      {visiblePhotos.map((albumPhoto, index) => <button key={albumPhoto.id} type="button" onClick={() => setSelectedVenuePhoto(albumPhoto)} aria-label={`${isAr ? 'عرض صورة' : 'View photo'} ${slide * 2 + index + 1}`} className="relative overflow-hidden rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <img src={albumPhoto.src} alt={isAr ? albumPhoto.titleAr : albumPhoto.titleEn} loading="lazy" className="h-28 w-full object-cover transition duration-300 hover:scale-[1.03] sm:h-36" />
                      </button>)}
                    </div>
                    {maxSlide > 0 && <div className="mt-3 flex justify-center gap-1.5">{Array.from({ length: maxSlide + 1 }, (_, index) => <button key={index} type="button" onClick={() => setVenueAlbumSlides(current => ({ ...current, [hall.id]: index }))} aria-label={`${isAr ? 'الانتقال إلى الشريحة' : 'Go to slide'} ${index + 1}`} className={`h-1.5 rounded-full transition-all ${slide === index ? 'w-6 bg-amber-300' : 'w-1.5 bg-slate-600 hover:bg-slate-400'}`} />)}</div>}
                  </div>;
                })()}
              </article>;
            })}
          </div>
        )}

        {selectedVenuePhoto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={isAr ? 'عرض صورة القاعة' : 'Venue photo viewer'} onClick={() => setSelectedVenuePhoto(null)}>
            <button type="button" onClick={() => setSelectedVenuePhoto(null)} aria-label={isAr ? 'إغلاق' : 'Close'} className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-slate-900/80 p-3 text-white"><X className="h-5 w-5" /></button>
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950" onClick={event => event.stopPropagation()}>
              <img src={selectedVenuePhoto.src} alt={isAr ? selectedVenuePhoto.titleAr : selectedVenuePhoto.titleEn} className="max-h-[78vh] w-full object-contain" />
              <div className="p-4 text-sm font-semibold text-white">{isAr ? selectedVenuePhoto.titleAr : selectedVenuePhoto.titleEn}<p className="mt-1 text-xs font-normal text-slate-400">{isAr ? selectedVenuePhoto.captionAr : selectedVenuePhoto.captionEn}</p>{selectedVenuePhoto.sourceUrl && <a href={selectedVenuePhoto.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-amber-300 underline">{isAr ? 'مصدر الصورة' : 'Photo source'}</a>}</div>
            </div>
          </div>
        )}

        {screen === 'services' && (
          <div className="grid gap-4 border-t border-slate-800 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {pickServicePhotos(photos, content).map((service) => {
              const title = siteText(content, `services.${service.key}.title`, isAr);
              return (
                <article key={service.key} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  {service.src ? <img src={service.src} alt={title} loading="lazy" className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-slate-900"><Sparkles className="h-6 w-6 text-amber-300" /></div>}
                  <div className="p-5"><h2 className="font-bold">{title}</h2><p className="mt-2 text-xs leading-6 text-slate-400">{siteText(content, `services.${service.key}.text`, isAr)}</p></div>
                </article>
              );
            })}
          </div>
        )}
        {screen === 'services' && (services.length > 0 || inventory.some(isCustomerItem)) && (
          <div className="space-y-10 border-t border-slate-800 p-6">
            {[
              { id: 'catalogue', title: isAr ? 'خدماتنا بالتفصيل' : 'Our services in detail', items: services.map((s) => ({ id: s.id, name: s.name, text: s.description, photo: s.photoUrl })) },
              { id: 'rental', title: isAr ? 'معدات وأدوات للإيجار' : 'Equipment & items for rent', items: inventory.filter(isCustomerItem).map((i) => ({ id: i.id, name: i.name, text: '', photo: i.photoUrl })) },
            ].filter((group) => group.items.length).map((group) => (
              <section key={group.id}>
                <h2 className="mb-4 font-serif text-2xl font-bold text-white">{group.title}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                      {item.photo ? <img src={item.photo} alt={item.name} loading="lazy" className="h-32 w-full object-cover sm:h-40" /> : <div className="flex h-32 items-center justify-center bg-slate-900 sm:h-40"><Sparkles className="h-6 w-6 text-amber-300/60" /></div>}
                      <div className="p-3"><h3 dir="auto" className="text-sm font-bold leading-snug">{item.name}</h3>{item.text && <p dir="auto" className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-400">{item.text}</p>}</div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
            <div className="text-center">
              <p className="text-xs text-slate-400">{isAr ? 'الأسعار حسب المناسبة. اطلب الحجز وسيتواصل معك فريقنا بالتفاصيل والتكلفة.' : 'Pricing depends on your event. Send a booking request and our team will contact you with details and the cost.'}</p>
              <button type="button" onClick={() => onOpenBooking()} className="mt-4 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950">{isAr ? 'ابدأ الحجز' : 'Start a Booking'}</button>
            </div>
          </div>
        )}

        {screen === 'planner' && (
          <div className="border-t border-slate-800 p-8 text-center sm:p-12">
            <div className="mx-auto max-w-2xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-8">
              <Ruler className="mx-auto h-8 w-8 text-amber-300" />
              <h2 className="mt-4 text-xl font-bold">{isAr ? 'التصميم يتم مع فريق السرايا' : 'Design is prepared with the Saraya team'}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{isAr ? 'خلال المقابلة نراجع توزيع المساحة والعناصر والتجهيزات، ونستخدم أدواتنا الداخلية لعرض المخطط والتصور ثلاثي الأبعاد.' : 'During the interview, we review the space, layout and production requirements and use our internal tools to present the plan and 3D visualization.'}</p>
            </div>
            <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 p-6"><h3 className="font-bold text-white">{isAr ? 'صور وأفكار للتجهيز' : 'Event setup photos and ideas'}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{isAr ? 'تصفح صور المناسبات والخدمات المتاحة، وسيساعدك فريقنا في اختيار التجهيز المناسب لموقعك.' : 'Browse event and service photos. Our team can help choose the right setup for your venue.'}</p></div>
          </div>
        )}

        {screen === 'gallery' && (
          <div className="grid grid-cols-2 gap-3 border-t border-slate-800 p-6 md:grid-cols-3">
            {photos.slice(0, 12).map(photo => <img key={photo.id} src={photo.src} alt={isAr ? photo.titleAr : photo.titleEn} className="h-56 w-full rounded-xl object-cover" />)}
          </div>
        )}

        {screen === '3d-tour' && (
          <div className="border-t border-slate-800 p-8 text-center sm:p-12">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-10">
              <Cuboid className="mx-auto h-10 w-10 text-amber-300" />
              <h2 className="mt-4 text-2xl font-serif font-bold">{isAr ? 'التصور ثلاثي الأبعاد مع فريقنا' : '3D visualization with our team'}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{isAr ? 'نقدم جولة وتصوّراً ثلاثي الأبعاد مناسباً للمساحة والمناسبة أثناء المقابلة.' : 'We provide a 3D walkthrough and visualization tailored to your event and space during the interview.'}</p>
              <button onClick={() => onOpenBooking()} className="mt-6 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950">{isAr ? 'تواصل للحجز' : 'Contact for Booking'}</button>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800 p-6 flex justify-center">
          <button onClick={onGoHome} className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-amber-400">{isAr ? 'العودة للرئيسية' : 'Back to Home'}<Arrow className="h-4 w-4" /></button>
        </div>
      </div>
    </main>
  );
}
