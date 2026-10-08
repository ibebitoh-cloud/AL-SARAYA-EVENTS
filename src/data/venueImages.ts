// Asset references for AlSaraya Royal Palaces & Venues
import ballroomImg from '../assets/images/alsaraya_grand_ballroom_1791458716707.jpg';
import koshaImg from '../assets/images/alsaraya_royal_kosha_1791458732633.jpg';
import diningImg from '../assets/images/alsaraya_banquet_dining_1791458748323.jpg';
import corporateImg from '../assets/images/saraya_corporate_summit_1791459214689.jpg';
import weddingEntranceImg from '../assets/images/saraya_couture_wedding_1791459224733.jpg';

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
  tags?: string[];
}

export const ALSARAYA_PHOTOS: VenuePhoto[] = [
  {
    id: 'photo-1',
    src: ballroomImg,
    titleAr: 'القاعة الملكية الكبرى والثريات الكريستالية',
    titleEn: 'The Royal Grand Ballroom & Murano Chandeliers',
    hallNameAr: 'القاعة الملكية الكبرى',
    hallNameEn: 'The Royal Grand Ballroom',
    hallId: 'hall-1',
    tags: ['ثريات', 'كريستال', 'رخام', 'سقف شاهق', 'قاعة كبرى'],
    captionAr: 'مساحة 1,250 م² بارتفاع 8.5 متر، ثريات كريستال مورانو وأرضيات رخام كارارا ناصع.',
    captionEn: '1,250 sqm expanse with 8.5m soaring ceilings, Murano chandeliers, and Italian Carrara marble.',
    category: 'ballroom',
    parallaxSpeed: -45,
  },
  {
    id: 'photo-2',
    src: koshaImg,
    titleAr: 'كوشة العروس الملكية والأزهار المتدلية',
    titleEn: 'Imperial Royal Kosha & Cascading Florals',
    hallNameAr: 'قاعة اللؤلؤة الماسية / البارون',
    hallNameEn: 'The Baron Andalusian Hall',
    hallId: 'hall-2',
    tags: ['كوشة', 'أزهار طبيعية', 'إضاءة دافئة', 'زفاف ملكي'],
    captionAr: 'تصميم ملكي فاخر مخملي مع أوركيد وأزهار الباستيل وإضاءة معمارية دافئة مخصصة لدخول العروس.',
    captionEn: 'Opulent velvet bridal stage framed by natural white orchids, pastel roses, and romantic warm wash.',
    category: 'kosha',
    parallaxSpeed: 55,
  },
  {
    id: 'photo-5',
    src: weddingEntranceImg,
    titleAr: 'ممر العروس الرخامي وأقواس الزهور الطبيعية',
    titleEn: 'The Couture Bridal Catwalk & Floral Arches',
    hallNameAr: 'القاعة الملكية الكبرى',
    hallNameEn: 'The Royal Grand Ballroom',
    hallId: 'hall-1',
    tags: ['ممشى زفاف', 'كات ووك', 'زفة', 'شموع', 'ورود'],
    captionAr: 'ممشى زفاف بطول 25 متراً محاط بأقواس الزهور البيضاء والشموع الكريستالية لأجمل زفة في مصر.',
    captionEn: '25-meter bridal runway flanked by cascading white florals and crystal candles for an iconic entrance.',
    category: 'wedding',
    parallaxSpeed: -25,
  },
  {
    id: 'photo-3',
    src: diningImg,
    titleAr: 'مائدة الملوك والشمعدانات الذهبية',
    titleEn: 'Royal Banquet Table Setting & Golden Candelabras',
    hallNameAr: 'قاعة البارون / الملوك',
    hallNameEn: 'The Baron Andalusian Hall',
    hallId: 'hall-2',
    tags: ['بوفيه', 'طعام فندقي', 'شمعدانات', 'أدوات مذهبة', 'VIP'],
    captionAr: 'طاولات دائرية فندقية مع شمعدانات مطلية بالذهب، أدوات فضية كريستالية، وسنتربيس زهور طبيعية.',
    captionEn: 'Five-star banquet dining with gold-gilded candelabras, crystal glassware, and bespoke botanical centerpieces.',
    category: 'dining',
    parallaxSpeed: -35,
  },
  {
    id: 'photo-6',
    src: corporateImg,
    titleAr: 'قمة المؤتمرات واحتفالات الشركات الكبرى',
    titleEn: 'Executive Corporate Summit & Gala Banquet',
    hallNameAr: 'قاعة الدبلوماسيين للمؤتمرات',
    hallNameEn: 'The Diplomat Conference & Summit Hall',
    hallId: 'hall-4',
    tags: ['مؤتمرات', 'شاشات 4K', 'عشاء عمل', 'ندوات', 'شركات'],
    captionAr: 'شاشات LED عملاقة بدقة 4K، عوازل صوتية 65dB، وترتيبات طاولات عشاء العمل التنفيذي.',
    captionEn: 'Curved 4K LED presentation walls, 65dB acoustic isolation, and executive VIP gala configurations.',
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
