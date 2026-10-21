// Asset references for AlSaraya Royal Palaces & Venues
import { FEATURED_VENUE_PHOTOS } from './featuredVenueCatalog';
import ballroomImg from '../assets/images/alsaraya_grand_ballroom_1791458716707.jpg';
import koshaImg from '../assets/images/alsaraya_royal_kosha_1791458732633.jpg';
import diningImg from '../assets/images/alsaraya_banquet_dining_1791458748323.jpg';
import corporateImg from '../assets/images/saraya_corporate_summit_1791459214689.jpg';
import weddingEntranceImg from '../assets/images/saraya_couture_wedding_1791459224733.jpg';
import gardenImg from '../assets/images/alsaraya_garden_terrace_1791458767479.jpg';

export const BIRTHDAY_DECORATION_PHOTOS: VenuePhoto[] = [
  {
    id: 'birthday-1',
    src: 'https://images.unsplash.com/photo-1774290687117-eb1769c33df3?auto=format&fit=crop&fm=jpg&q=85&w=1800',
    titleAr: 'ديكور عيد ميلاد فاخر بالبالونات وطاولة الحلوى',
    titleEn: 'Luxury Birthday Balloon & Dessert Setup',
    hallNameAr: 'تجهيزات أعياد الميلاد',
    hallNameEn: 'Birthday Party Setup',
    captionAr: 'خلفية احتفالية مع قوس بالونات وطاولة كيك وحلويات وإضاءة ديكورية.',
    captionEn: 'A polished birthday backdrop with a balloon arch, cake and dessert display, and decorative lighting.',
    category: 'birthday',
    parallaxSpeed: 25,
    tags: ['عيد ميلاد', 'بالونات', 'كيك', 'حلويات', 'ديكور'],
  },
  {
    id: 'birthday-2',
    src: 'https://images.unsplash.com/photo-1741969494307-55394e3e4071?auto=format&fit=crop&fm=jpg&q=85&w=1800',
    titleAr: 'قوس بالونات وطاولة عيد الميلاد',
    titleEn: 'Birthday Balloon Arch & Party Table',
    hallNameAr: 'تجهيزات أعياد الميلاد',
    hallNameEn: 'Birthday Party Setup',
    captionAr: 'تجهيز واضح لحفل عيد ميلاد مع قوس بالونات وطاولة رئيسية للكيك والحلوى.',
    captionEn: 'A dedicated birthday setup with a balloon arch and a central cake and dessert table.',
    category: 'birthday',
    parallaxSpeed: -20,
    tags: ['عيد ميلاد', 'قوس بالونات', 'طاولة كيك', 'احتفال'],
  },
  {
    id: 'birthday-3',
    src: 'https://images.pexels.com/photos/16032215/pexels-photo-16032215/free-photo-of-neon-sign-with-balls-on-wall.jpeg?auto=compress&dpr=1&w=1800',
    titleAr: 'ديكور عيد ميلاد أسود وذهبي',
    titleEn: 'Black & Gold Birthday Backdrop',
    hallNameAr: 'تجهيزات أعياد الميلاد',
    hallNameEn: 'Birthday Party Setup',
    captionAr: 'خلفية عيد ميلاد أنيقة بالبالونات السوداء والبيضاء والذهبية مع إضاءة احتفالية.',
    captionEn: 'An elegant birthday backdrop with black, white and gold balloons and a glowing celebration sign.',
    category: 'birthday',
    parallaxSpeed: 35,
    tags: ['عيد ميلاد', 'أسود وذهبي', 'بالونات', 'إضاءة'],
  },
];

export interface VenuePhoto {
  id: string;
  src: string;
  titleAr: string;
  titleEn: string;
  hallNameAr: string;
  hallNameEn: string;
  captionAr: string;
  captionEn: string;
  category: 'ballroom' | 'kosha' | 'dining' | 'corporate' | 'wedding' | 'engagement' | 'birthday' | 'party';
  parallaxSpeed: number; // e.g. 0.15, -0.2, 0.25 for multi-speed motion
  hallId?: string;
  /** Stable booking link keeps each event's photo album separate. */
  bookingId?: string;
  /** Optional label for general-purpose / legacy albums. */
  albumName?: string;
  tags?: string[];
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'archived';
  /** Image source and licensing information for imported venue-gallery entries. */
  sourceUrl?: string;
  photoCredit?: string;
}

export const ALSARAYA_PHOTOS: VenuePhoto[] = [
  ...FEATURED_VENUE_PHOTOS.slice().sort((a, b) => Number(a.id.match(/photo-(\d+)$/)?.[1] || 0) - Number(b.id.match(/photo-(\d+)$/)?.[1] || 0)),
  {
    id: 'photo-1',
    src: ballroomImg,
    titleAr: 'قاعة آركين والثريات الكريستالية',
    titleEn: 'Arcane Hall & Crystal Chandeliers',
    hallNameAr: 'قاعة آركين',
    hallNameEn: 'Arcane Hall',
    hallId: 'arcane-hall',
    tags: ['ثريات', 'كريستال', 'رخام', 'ممر العروسين', 'قاعة كبرى'],
    captionAr: 'ثريات كريستال وممر أبيض للعروسين تحيط به الورود البيضاء، وطاولات دائرية بكراسي شيافاري ذهبية.',
    captionEn: 'Crystal chandeliers and a white bridal aisle lined with white florals, with round tables and gold chiavari chairs.',
    category: 'ballroom',
    parallaxSpeed: -45,
  },
  {
    id: 'photo-2',
    src: koshaImg,
    titleAr: 'كوشة ملكية بالورد المتدلي',
    titleEn: 'Royal Kosha with Cascading Florals',
    hallNameAr: 'قاعة فيينا',
    hallNameEn: 'Veina Hall',
    hallId: 'porto-veina',
    tags: ['كوشة', 'ورد طبيعي', 'إضاءة دافئة', 'زفاف'],
    captionAr: 'كوشة بأريكة مذهبة تحت قوس من الورد الأبيض والوردي المتدلي، مع شمعدانات كريستال وإضاءة دافئة.',
    captionEn: 'A gilded bridal sofa under an arch of cascading white and blush flowers, with crystal candelabras and warm light.',
    category: 'kosha',
    parallaxSpeed: 55,
  },
  {
    id: 'photo-5',
    src: weddingEntranceImg,
    titleAr: 'دخول العروسين تحت قوس الورد',
    titleEn: 'Bridal Entrance Under a Floral Arch',
    hallNameAr: 'قاعة آركين',
    hallNameEn: 'Arcane Hall',
    hallId: 'arcane-hall',
    tags: ['زفة', 'دخول العروسين', 'شموع', 'ورود'],
    captionAr: 'ممر رخامي للعروسين يمر تحت قوس ورد طبيعي، تحيط به الشموع وبتلات الورد على الجانبين.',
    captionEn: 'A marble aisle for the couple passing under a natural floral arch, lined with candles and rose petals.',
    category: 'wedding',
    parallaxSpeed: -25,
  },
  {
    id: 'photo-3',
    src: diningImg,
    titleAr: 'طاولة العشاء والشمعدانات الذهبية',
    titleEn: 'Banquet Table & Golden Candelabras',
    hallNameAr: 'قاعة سيلا',
    hallNameEn: 'Seila Hall',
    hallId: 'porto-seila',
    tags: ['عشاء', 'شمعدانات', 'أدوات مذهبة', 'سنتربيس'],
    captionAr: 'طاولة دائرية بمفرش مطرز وأدوات مذهبة وكؤوس كريستال، يتوسطها شمعدان ذهبي مع ورد أبيض.',
    captionEn: 'A round table with an embroidered cloth, gold cutlery and crystal glasses, centred on a gold candelabra with white flowers.',
    category: 'dining',
    parallaxSpeed: -35,
  },
  {
    id: 'photo-7',
    src: gardenImg,
    titleAr: 'حفل في الحديقة المفتوحة',
    titleEn: 'Open-Air Garden Ceremony',
    hallNameAr: 'الحديقة المفتوحة (أوبن إير)',
    hallNameEn: 'Open Air Garden',
    hallId: 'porto-garden',
    tags: ['أوبن إير', 'حديقة', 'فوانيس', 'إضاءة معلقة', 'كتب كتاب'],
    captionAr: 'حفل ليلي تحت الأشجار بإضاءة معلقة وفوانيس، وقوس ورد أبيض ونافورة يتوسطان صفوف الضيوف.',
    captionEn: 'An evening ceremony under the trees with string lights and lanterns, a white floral arch and a fountain between the guest rows.',
    category: 'wedding',
    parallaxSpeed: 30,
  },
  {
    id: 'photo-8',
    src: 'https://images.unsplash.com/photo-1676027649792-9e6b014a0e2f?auto=format&fit=crop&fm=jpg&q=85&w=1800',
    titleAr: 'حفلة بجوار حمام السباحة',
    titleEn: 'Poolside Celebration',
    hallNameAr: 'حمام السباحة',
    hallNameEn: 'Pool',
    hallId: 'arcane-pool',
    tags: ['حمام سباحة', 'أوبن إير', 'إضاءة معلقة', 'عشاء'],
    captionAr: 'طاولة عشاء بورد وردي أمام حمام السباحة، مع إضاءة معلقة فوق المكان.',
    captionEn: 'A dinner table with blush flowers in front of the pool, with string lights overhead.',
    category: 'dining',
    parallaxSpeed: -30,
    photoCredit: 'Lachlan Rennie / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/a-table-set-for-a-wedding-with-a-pool-in-the-background-SIkMbOxnsPo',
  },
  {
    id: 'photo-9',
    src: 'https://images.unsplash.com/photo-1752766074168-44afdbaaf390?auto=format&fit=crop&fm=jpg&q=85&w=1800',
    titleAr: 'عشاء على الروف',
    titleEn: 'Rooftop Dinner',
    hallNameAr: 'الروف',
    hallNameEn: 'Roof',
    hallId: 'porto-roof',
    tags: ['روف', 'أوبن إير', 'عشاء', 'إطلالة'],
    captionAr: 'طاولة عشاء طويلة على سطح مفتوح بإطلالة، مجهزة بالورد والشموع لحفلات العائلة والخطوبة.',
    captionEn: 'A long dinner table on an open rooftop with a view, set with flowers and candles for family events and engagements.',
    category: 'dining',
    parallaxSpeed: 25,
    photoCredit: 'Deliberate Directions / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/a-rooftop-dining-table-set-for-an-elegant-event-JaUzpKC2Gjc',
  },
  {
    id: 'photo-6',
    src: corporateImg,
    titleAr: 'مؤتمرات وحفلات الشركات',
    titleEn: 'Conferences & Corporate Galas',
    hallNameAr: 'المؤتمرات والفعاليات',
    hallNameEn: 'Conferences & Events',
    tags: ['مؤتمرات', 'شاشات LED', 'عشاء عمل', 'شركات'],
    captionAr: 'منصة بشاشة LED منحنية وإضاءة مسرحية، وطاولات عشاء دائرية للضيوف أمام المتحدث.',
    captionEn: 'A stage with a curved LED screen and stage lighting, and round dinner tables for guests facing the speaker.',
    category: 'corporate',
    parallaxSpeed: 40,
  },
  {
    id: 'engagement-1',
    src: 'https://cdn.shopify.com/s/files/1/0685/8666/8353/files/Soz-_-Nisan-Organizasyonu-Rehberi-_-Konseptler_-Tepsiler_-Fiyatlar-Alisse-nuerA-Blog-03.jpg?v=1763557153',
    titleAr: 'تنسيق خطوبة وعقد قران أنيق',
    titleEn: 'Elegant Engagement Celebration Setup',
    hallNameAr: 'تجهيزات الخطوبة وعقد القران',
    hallNameEn: 'Engagement Event Setup',
    captionAr: 'تصميم أنيق للخطوبة وعقد القران مع تفاصيل ديكورية مرتبة.',
    captionEn: 'An elegant engagement and marriage-contract setup with coordinated decorative details.',
    category: 'engagement',
    parallaxSpeed: 20,
    tags: ['خطوبة', 'عقد قران', 'ديكور', 'زهور'],
  },
  ...BIRTHDAY_DECORATION_PHOTOS,
];
