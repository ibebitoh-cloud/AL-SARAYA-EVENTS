/**
 * Every piece of public website copy that the CEO can edit from the portal ("Website Content").
 * Defaults are the original hard-coded texts; saved edits override them key by key.
 */

export interface SiteText { ar: string; en: string }

export interface SiteContent {
  texts: Record<string, SiteText>;
  /** Image overrides (URL or uploaded data URL). Empty means "pick automatically from the photo library". */
  images: Record<string, string>;
}

export interface SiteTextField { key: string; ar: string; en: string; labelAr: string; labelEn: string; multiline?: boolean }
export interface SiteImageField { key: string; labelAr: string; labelEn: string }
export interface SiteSection { id: string; titleAr: string; titleEn: string; texts: SiteTextField[]; images?: SiteImageField[] }

/** The six service cards shown on the home page and the Services page. */
export const SERVICE_KEYS = ['1', '2', '3', '4', '5', '6'] as const;
// Library photo categories that suit each service when no photo is set in Website Content.
const SERVICE_PHOTO_HINTS: Record<(typeof SERVICE_KEYS)[number], string[]> = {
  '1': ['kosha', 'wedding'], '2': ['ballroom'], '3': ['dining'], '4': ['wedding', 'engagement'], '5': ['kosha', 'engagement', 'birthday'], '6': ['corporate', 'party'],
};

const f = (key: string, labelAr: string, labelEn: string, ar: string, en: string, multiline = false): SiteTextField => ({ key, labelAr, labelEn, ar, en, multiline });

export const SITE_SECTIONS: SiteSection[] = [
  {
    id: 'hero', titleAr: 'الواجهة الرئيسية', titleEn: 'Hero (first screen)',
    texts: [
      f('hero.word', 'الكلمة الكبيرة (تظهر حرفاً حرفاً)', 'Big animated word', 'ELSARAYA EVENTS', 'ELSARAYA EVENTS'),
      f('hero.title1', 'العنوان - السطر الأول', 'Headline, line 1', 'نخطط مناسبتك.', 'Plan the event.'),
      f('hero.title2', 'العنوان - السطر الثاني (ذهبي)', 'Headline, line 2 (gold)', 'ونحوّلها إلى واقع.', 'Then bring it to life.'),
      f('hero.button', 'زر الحجز', 'Booking button', 'ابدأ الحجز', 'Start a Booking'),
      f('hero.scroll', 'نص "اكتشف المزيد"', '"Scroll" hint', 'اكتشف المزيد', 'SCROLL TO EXPLORE'),
    ],
    images: [{ key: 'hero', labelAr: 'صورة خلفية الواجهة', labelEn: 'Hero background photo' }],
  },
  {
    id: 'intro', titleAr: 'المقدمة', titleEn: 'Introduction',
    texts: [
      f('intro.text', 'فقرة المقدمة', 'Intro paragraph', 'السرايا تنسّق مناسبتك من البداية للنهاية؛ نوفر القاعات المناسبة، ونؤجر المعدات، وننسّق الخدمات والموردين، داخل القاعات المتاحة أو في موقعك الخاص.', 'ElSaraya coordinates your event from start to finish: arranging suitable venues, renting equipment, and coordinating services and suppliers at available venues or your own location.', true),
      f('intro.stat1', 'المؤشر 1 (عدد القاعات)', 'Highlight 1 (venue count)', 'قاعات ومواقع متاحة', 'Venues Arranged'),
      f('intro.stat2', 'المؤشر 2', 'Highlight 2', 'أفراح وخطوبات', 'Weddings & Engagements'),
      f('intro.stat3', 'المؤشر 3', 'Highlight 3', 'مؤتمرات وقمم', 'Conferences & Summits'),
      f('intro.stat4', 'المؤشر 4', 'Highlight 4', 'تنفيذ في موقعك', 'Your Location'),
    ],
  },
  {
    id: 'events', titleAr: 'المناسبات', titleEn: 'Events',
    texts: [
      f('events.kicker', 'عنوان القسم الصغير', 'Section label', '01 · المناسبات', '01 · EVENTS'),
      f('events.title', 'عنوان القسم', 'Section title', 'اختر المناسبة. والباقي علينا.', 'Choose the occasion. We handle the rest.'),
      f('events.cardKicker', 'السطر الصغير في البطاقة', 'Card label', 'تجربة مصممة لك', 'BUILT AROUND YOU'),
      f('events.note', 'ملاحظة أسفل البطاقة', 'Card footnote', 'نراجع تفاصيل المخطط معك خلال جلسة استشارة قبل التنفيذ.', 'We review the event layout with you during a planning consultation before execution.'),
      f('events.wedding.title', 'الزفاف - الاسم', 'Weddings - name', 'زفاف وأفراح', 'Weddings'),
      f('events.wedding.text', 'الزفاف - الوصف', 'Weddings - description', 'تنسيق متكامل يبدأ من توفير المكان وينتهي بأدق التفاصيل.', 'Complete event coordination, from venue booking to the final detail.', true),
      f('events.engagement.title', 'الخطوبة - الاسم', 'Engagements - name', 'خطوبة وعقد قران', 'Engagements'),
      f('events.engagement.text', 'الخطوبة - الوصف', 'Engagements - description', 'أجواء أنيقة وحميمة مصممة حسب رؤيتكم.', 'Elegant, intimate celebrations built around your vision.', true),
      f('events.birthday.title', 'أعياد الميلاد - الاسم', 'Birthdays - name', 'أعياد ميلاد وحفلات', 'Birthdays & Parties'),
      f('events.birthday.text', 'أعياد الميلاد - الوصف', 'Birthdays - description', 'ديكور وتجهيزات مرنة تناسب كل فكرة ومكان.', 'Flexible decoration and production for every idea and location.', true),
      f('events.corporate.title', 'المؤتمرات - الاسم', 'Conferences - name', 'مؤتمرات وقمم', 'Conferences & Summits'),
      f('events.corporate.text', 'المؤتمرات - الوصف', 'Conferences - description', 'منصة، شاشات، مقاعد وتجهيز احترافي للمؤتمرات.', 'Stages, screens, seating and professional conference production.', true),
    ],
    images: [
      { key: 'event.wedding', labelAr: 'صورة الزفاف', labelEn: 'Weddings photo' },
      { key: 'event.engagement', labelAr: 'صورة الخطوبة', labelEn: 'Engagements photo' },
      { key: 'event.birthday', labelAr: 'صورة أعياد الميلاد', labelEn: 'Birthdays photo' },
      { key: 'event.corporate', labelAr: 'صورة المؤتمرات', labelEn: 'Conferences photo' },
    ],
  },
  {
    id: 'services', titleAr: 'الخدمات وصورها', titleEn: 'Services & photos',
    texts: [
      f('services.kicker', 'عنوان القسم الصغير', 'Section label', '02 · خدماتنا', '02 · WHAT WE DO'),
      f('services.title', 'عنوان القسم', 'Section title', 'من الفكرة إلى التنفيذ', 'From concept to execution'),
      f('services.1.title', 'الخدمة 1 - العنوان', 'Service 1 - title', 'التخطيط والتصميم', 'Planning & Design'),
      f('services.1.text', 'الخدمة 1 - الوصف', 'Service 1 - text', 'نحوّل فكرتك إلى مخطط واضح قبل التنفيذ.', 'Turn your idea into a clear layout before execution.', true),
      f('services.2.title', 'الخدمة 2 - العنوان', 'Service 2 - title', 'توفير القاعات وحجزها', 'Venue Sourcing & Booking'),
      f('services.2.text', 'الخدمة 2 - الوصف', 'Service 2 - text', 'ننسّق حجز القاعة المناسبة مع مالكها أو نرتب مناسبتك في موقعك الخاص.', 'We coordinate venue bookings with owners or arrange your event at your own location.', true),
      f('services.3.title', 'الخدمة 3 - العنوان', 'Service 3 - title', 'تأجير المعدات', 'Equipment Rental'),
      f('services.3.text', 'الخدمة 3 - الوصف', 'Service 3 - text', 'تأجير الطاولات والكراسي والإضاءة والشاشات وتجهيزات المناسبة.', 'Rent tables, chairs, lighting, screens and other event equipment.', true),
      f('services.4.title', 'الخدمة 4 - العنوان', 'Service 4 - title', 'التنفيذ والإشراف', 'Production & Coordination'),
      f('services.4.text', 'الخدمة 4 - الوصف', 'Service 4 - text', 'فريق يتولى التجهيز والتنسيق في يوم المناسبة.', 'A team coordinating setup and production on event day.', true),
      f('services.5.title', 'الخدمة 5 - العنوان', 'Service 5 - title', 'الديكور والزهور', 'Decoration & Flowers'),
      f('services.5.text', 'الخدمة 5 - الوصف', 'Service 5 - text', 'كوشة وورود وديكورات تناسب ذوقكم وطابع المناسبة.', 'Kosha, florals and decor styled to your taste and the occasion.', true),
      f('services.6.title', 'الخدمة 6 - العنوان', 'Service 6 - title', 'المنصات والإضاءة والصوت', 'Stages, Lighting & Sound'),
      f('services.6.text', 'الخدمة 6 - الوصف', 'Service 6 - text', 'منصات وشاشات وإضاءة وصوت احترافي للحفلات والمؤتمرات.', 'Stages, screens, lighting and professional sound for parties and conferences.', true),
    ],
    images: SERVICE_KEYS.map((n) => ({ key: `service.${n}`, labelAr: `صورة الخدمة ${n}`, labelEn: `Service ${n} photo` })),
  },
  {
    id: 'venues', titleAr: 'القاعات', titleEn: 'Venues',
    texts: [
      f('venues.kicker', 'عنوان القسم الصغير', 'Section label', '03 · القاعات والمواقع', '03 · VENUES & LOCATIONS'),
      f('venues.title', 'عنوان القسم', 'Section title', 'اختر المساحة المناسبة لمناسبتك', 'Find the right venue for your event'),
      f('venues.text', 'وصف القسم', 'Section text', 'ننسّق حجز القاعات المتاحة مع ملاكها، ويمكننا أيضاً تجهيز مناسبتك في موقعك الخاص.', 'We coordinate bookings with venue owners and can also arrange your event at your own location.', true),
    ],
  },
  {
    id: 'planner', titleAr: 'التخطيط والتصميم', titleEn: 'Planning & design',
    texts: [
      f('planner.kicker', 'عنوان القسم الصغير', 'Section label', '04 · التخطيط والتصميم', '04 · EVENT PLANNING & DESIGN'),
      f('planner.title', 'عنوان القسم', 'Section title', 'نخطط لمناسبتك معك قبل التنفيذ', 'We plan your event with you before execution'),
      f('planner.text', 'وصف القسم', 'Section text', 'نستخدم أدوات التخطيط والتصميم لعرض توزيع الطاولات والكراسي والمنصة والشاشة والزهور ومراجعة التفاصيل معك قبل التنفيذ.', 'Our team uses planning and design tools to review tables, chairs, stages, screens, flowers and the full event setup with you before execution.', true),
      f('planner.tags', 'الوسوم (افصل بينها بفاصلة)', 'Tags (comma separated)', 'تخطيط 2D، تصور 3D، مراجعة داخلية، موقع العميل', '2D Planning, 3D Visualization, Inside Review, Client Location'),
      f('planner.note', 'الملاحظة المميزة', 'Highlighted note', 'التخطيط التفصيلي متاح خلال جلسة استشارة مع فريق السرايا', 'Detailed event planning is available during a consultation with the ElSaraya team'),
    ],
  },
  {
    id: 'gallery', titleAr: 'معرض الأعمال', titleEn: 'Gallery',
    texts: [
      f('gallery.kicker', 'عنوان القسم الصغير', 'Section label', '05 · معرض الأعمال', '05 · OUR WORK'),
      f('gallery.title', 'عنوان القسم', 'Section title', 'شاهد ما ننفذ', 'See what we create'),
    ],
  },
  {
    id: 'about', titleAr: 'عن السرايا', titleEn: 'About',
    texts: [
      f('about.kicker', 'عنوان القسم الصغير', 'Section label', 'عن السرايا', 'ABOUT ELSARAYA'),
      f('about.title', 'عنوان القسم', 'Section title', 'كل خدمات مناسبتك من خلال فريق واحد', 'Your event, coordinated through one team'),
      f('about.text', 'نص التعريف', 'About text', 'تنسّق السرايا بين حجز القاعات، وتأجير المعدات، والخدمات، والموردين، وتجهيزات يوم المناسبة. نساعدك على ترتيب التفاصيل من خلال نقطة تواصل واحدة، سواء أقيمت المناسبة في قاعة متاحة أو في موقعك الخاص.', 'ElSaraya coordinates venue bookings, equipment rental, event services, suppliers and event-day setup. We help bring the details together through one point of contact, whether your event is held at an arranged venue or at your own location.', true),
      f('about.button', 'نص الزر', 'Button', 'ناقش مناسبتك معنا', 'Discuss Your Event'),
    ],
  },
  {
    id: 'contact', titleAr: 'لنبدأ', titleEn: 'Call to action',
    texts: [
      f('contact.kicker', 'عنوان القسم الصغير', 'Section label', '06 · لنبدأ', '06 · LET’S START'),
      f('contact.title', 'عنوان القسم', 'Section title', 'قل لنا ماذا تتخيل.', 'Tell us what you are imagining.'),
      f('contact.text', 'النص', 'Text', 'سواء في قاعة متاحة أو موقعك الخاص، نساعدك في تنسيق المكان والمعدات والخدمات وتحويل فكرتك إلى مناسبة متكاملة.', 'Whether at an arranged venue or your own location, we coordinate the venue, equipment and services to bring your event together.', true),
      f('contact.button', 'نص الزر', 'Button', 'تواصل للحجز', 'Contact for Booking'),
    ],
  },
  {
    id: 'footer', titleAr: 'تذييل الموقع', titleEn: 'Footer',
    texts: [
      f('footer.text', 'نبذة أسفل الموقع', 'Footer description', 'مساحة راقية للاحتفال بأهم مناسباتكم، مع خدمات وتنظيم يليق بكل لحظة.', 'An elegant setting for life’s important celebrations, supported by thoughtful service and event planning.', true),
      f('footer.contactTitle', 'عنوان التواصل', 'Contact heading', 'تواصل معنا', 'Contact'),
      f('footer.linksTitle', 'عنوان الروابط', 'Links heading', 'روابط سريعة', 'Quick links'),
    ],
  },
];

export const DEFAULT_SITE_CONTENT: SiteContent = {
  texts: Object.fromEntries(SITE_SECTIONS.flatMap((s) => s.texts.map((t) => [t.key, { ar: t.ar, en: t.en }]))),
  images: {},
};

/** Returns the edited text for a key, falling back to the default when a language was left empty. */
export const siteText = (content: SiteContent | undefined, key: string, isAr: boolean) => {
  const lang = isAr ? 'ar' : 'en';
  return content?.texts[key]?.[lang]?.trim() || DEFAULT_SITE_CONTENT.texts[key]?.[lang] || '';
};

/**
 * Photo for each service card: the one set in Website Content, otherwise a library photo of a fitting
 * category that is not already used nearby (pass the sources already on screen in `used`).
 */
export const pickServicePhotos = (photos: { src: string; category: string }[], content: SiteContent | undefined, used = new Set<string>()) => {
  const norm = (src: string) => src.trim().replace(/[?#].*$/, '').toLowerCase();
  const taken = new Set(used);
  return SERVICE_KEYS.map((key) => {
    const custom = content?.images[`service.${key}`]?.trim();
    if (custom) return { key, src: custom };
    const hints = SERVICE_PHOTO_HINTS[key];
    const pick = [...photos.filter((p) => hints.includes(p.category)), ...photos].find((p) => p.src && !taken.has(norm(p.src)))
      ?? photos.find((p) => hints.includes(p.category)) ?? photos[0];
    if (pick?.src) taken.add(norm(pick.src));
    return { key, src: pick?.src || '' };
  });
};
