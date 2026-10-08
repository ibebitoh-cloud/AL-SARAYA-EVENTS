import { Calendar, Building2, Sparkles, Ruler, Image as ImageIcon, Cuboid, ArrowRight, ArrowLeft } from 'lucide-react';
import { Hall, Language } from '../types/venueSystem';
import { ALSARAYA_PHOTOS } from '../data/venueImages';

type Screen = 'events' | 'venues' | 'services' | 'planner' | 'gallery' | '3d-tour';

interface Props {
  screen: Screen;
  halls: Hall[];
  language: Language;
  onOpenBooking: (hallId?: string) => void;
  onGoHome: () => void;
}

const copy = {
  events: { en: ['Events', 'Every occasion is planned around your needs.', 'Weddings, engagements, birthdays, parties, conferences and summits.'], ar: ['المناسبات', 'كل مناسبة نخطط لها حسب احتياجاتكم.', 'أفراح، خطوبات، أعياد ميلاد، حفلات، مؤتمرات وقمم.'] },
  venues: { en: ['Venues', 'Spaces prepared for memorable events.', 'Choose the right hall, or let our team plan your event at your own location.'], ar: ['القاعات', 'مساحات مجهزة لصناعة مناسبات مميزة.', 'اختر القاعة المناسبة أو دع فريقنا يخطط مناسبتك في موقعك الخاص.'] },
  services: { en: ['Services & Equipment Rental', 'Event services and rental equipment coordinated in one place.', 'Venue coordination, equipment rental, planning, decoration, stages, screens, lighting, sound, tables, chairs, flowers and event-day coordination.'], ar: ['الخدمات وتأجير المعدات', 'خدمات وتجهيزات مناسبتك بتنسيق من خلال فريق واحد.', 'توفير القاعات وحجزها، وتأجير المعدات، والتخطيط، والديكور، والمنصات، والشاشات، والإضاءة، والصوت، والطاولات، والكراسي، والزهور، والتنسيق يوم المناسبة.'] },
  planner: { en: ['Event Planning', 'Professional visual planning is available during your interview.', 'Our team can prepare 2D planning and 3D visualization with you before execution. The planning tool is reserved for Saraya employees.'], ar: ['تخطيط المناسبة', 'التخطيط البصري الاحترافي متاح أثناء المقابلة.', 'يقوم فريقنا بإعداد مخطط 2D وتصوّر 3D معكم قبل التنفيذ. أداة التصميم مخصصة لموظفي السرايا.'] },
  gallery: { en: ['Gallery', 'A look at our work and event atmosphere.', 'Explore selected Saraya event photography.'], ar: ['معرض الصور', 'نظرة على أعمالنا وأجواء مناسباتنا.', 'شاهد مجموعة مختارة من صور مناسبات السرايا.'] },
  '3d-tour': { en: ['3D Tour', 'Explore the space with our team.', '3D venue visualization is presented by the Saraya team as part of the planning and interview process.'], ar: ['جولة 3D', 'استكشف المساحة مع فريق السرايا.', 'يقدم فريق السرايا التصور ثلاثي الأبعاد ضمن عملية التخطيط والمقابلة.'] },
} as const;

export function CustomerSectionView({ screen, halls, language, onOpenBooking, onGoHome }: Props) {
  const isAr = language === 'ar';
  const data = copy[screen][isAr ? 'ar' : 'en'];
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const photos = ALSARAYA_PHOTOS;

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
            {['Weddings','Engagements','Birthdays & Parties','Conferences & Summits'].map((x, i) => (
              <div key={x} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img src={photos[i % photos.length]?.src} alt="" className="h-44 w-full object-cover" />
                <div className="p-4 text-sm font-bold">{isAr ? ['أفراح','خطوبات وعقد قران','أعياد ميلاد وحفلات','مؤتمرات وقمم'][i] : x}</div>
              </div>
            ))}
          </div>
        )}

        {screen === 'venues' && (
          <div className="grid gap-5 border-t border-slate-800 p-6 md:grid-cols-2">
            {halls.map(hall => {
              const photo = photos.find(p => p.hallId === hall.id) || photos[0];
              return <article key={hall.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img src={photo?.src} alt="" className="h-60 w-full object-cover" />
                <div className="flex items-center justify-between gap-3 p-5">
                  <div><h2 className="font-serif text-xl font-bold">{isAr ? hall.nameAr : hall.name}</h2><p className="mt-1 text-xs text-slate-400">{hall.capacity} {isAr ? 'ضيف' : 'guests'}</p></div>
                  <button onClick={() => onOpenBooking(hall.id)} className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950">{isAr ? 'احجز' : 'Book'}</button>
                </div>
              </article>;
            })}
          </div>
        )}

        {screen === 'services' && (
          <div className="grid gap-4 border-t border-slate-800 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {(isAr ? ['التخطيط والتصميم','الديكور والتجهيز','المنصات والشاشات','الإضاءة والصوت','الطاولات والكراسي','التنسيق والإشراف'] : ['Planning & Design','Decoration & Setup','Stages & Screens','Lighting & Sound','Tables & Chairs','Event Coordination']).map((x, i) => (
              <div key={x} className="rounded-2xl border border-slate-800 bg-slate-950 p-6"><Sparkles className="h-5 w-5 text-amber-300" /><h2 className="mt-4 font-bold">{x}</h2></div>
            ))}
          </div>
        )}

        {screen === 'planner' && (
          <div className="border-t border-slate-800 p-8 text-center sm:p-12">
            <div className="mx-auto max-w-2xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-8">
              <Ruler className="mx-auto h-8 w-8 text-amber-300" />
              <h2 className="mt-4 text-xl font-bold">{isAr ? 'التصميم يتم مع فريق السرايا' : 'Design is prepared with the Saraya team'}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{isAr ? 'خلال المقابلة نراجع توزيع المساحة والعناصر والتجهيزات، ونستخدم أدواتنا الداخلية لعرض المخطط والتصور ثلاثي الأبعاد.' : 'During the interview, we review the space, layout and production requirements and use our internal tools to present the plan and 3D visualization.'}</p>
            </div>
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
