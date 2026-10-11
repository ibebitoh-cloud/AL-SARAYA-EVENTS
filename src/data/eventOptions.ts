import type { EventType, LocationId } from '../types/venueSystem';

/**
 * Options the customer chooses from in the builder's choice session, grouped by category.
 * Prices are selling prices for Arcane; Porto Said is priced ~10% higher (see optionPriceAt).
 * `cost` is kept for the booking's internal profit report and is never shown in the session.
 */
export type OptionUnit = 'event' | 'guest' | 'table' | 'unit';

export interface ChoiceOption {
  id: string;
  nameAr: string;
  descAr?: string;
  price: number;
  cost: number;
  unit: OptionUnit;
  emoji?: string;
  /** Colour swatches drawn on the card (theme palettes, linens, chairs). */
  swatch?: string[];
  tagAr?: string;
  /** Table sets: chairs per table, used to work out the number of tables. */
  seats?: number;
  tableShape?: 'round' | 'rect';
}

export interface ChoiceCategory {
  id: string;
  titleAr: string;
  subtitleAr: string;
  emoji: string;
  mode: 'single' | 'multi';
  eventTypes: EventType[];
  options: ChoiceOption[];
}

export const UNIT_LABEL_AR: Record<OptionUnit, string> = { event: 'للمناسبة', guest: 'للفرد', table: 'للطاولة', unit: 'للقطعة' };

const CELEBRATIONS: EventType[] = ['wedding', 'engagement'];
const SOCIAL: EventType[] = ['wedding', 'engagement', 'birthday', 'party'];
const ALL: EventType[] = ['wedding', 'engagement', 'birthday', 'party', 'conference'];

export const CHOICE_CATEGORIES: ChoiceCategory[] = [
  {
    id: 'theme', titleAr: 'ثيم الألوان', subtitleAr: 'الألوان الأساسية التي ستظهر في الديكور والورد والمفارش', emoji: '🎨', mode: 'single', eventTypes: SOCIAL,
    options: [
      { id: 'theme-white-gold', nameAr: 'أبيض وذهبي', descAr: 'كلاسيكي ملكي لا يخطئ', price: 0, cost: 0, unit: 'event', swatch: ['#ffffff', '#d4af37', '#f5ecd7'], tagAr: 'الأكثر طلباً' },
      { id: 'theme-blush-gold', nameAr: 'بلاش بينك وذهبي', descAr: 'رومانسي ناعم', price: 0, cost: 0, unit: 'event', swatch: ['#f4c2c2', '#d4af37', '#fff5f5'] },
      { id: 'theme-champagne', nameAr: 'شامبين ونود', descAr: 'هادئ وراقٍ', price: 0, cost: 0, unit: 'event', swatch: ['#f7e7ce', '#e3c9a8', '#c8a97e'] },
      { id: 'theme-emerald-gold', nameAr: 'زمردي وذهبي', descAr: 'فخم وجريء', price: 0, cost: 0, unit: 'event', swatch: ['#046307', '#d4af37', '#f0f7ef'] },
      { id: 'theme-navy-silver', nameAr: 'كحلي وفضي', descAr: 'أنيق ومسائي', price: 0, cost: 0, unit: 'event', swatch: ['#1b2a4a', '#c0c0c0', '#e8edf5'] },
      { id: 'theme-lavender', nameAr: 'لافندر وأبيض', descAr: 'ربيعي ومنعش', price: 0, cost: 0, unit: 'event', swatch: ['#b9a6d6', '#ffffff', '#ece6f5'] },
      { id: 'theme-burgundy', nameAr: 'نبيتي وذهبي', descAr: 'دافئ للحفلات الشتوية', price: 0, cost: 0, unit: 'event', swatch: ['#6d1a36', '#d4af37', '#f3e3e8'] },
      { id: 'theme-all-white', nameAr: 'أبيض بالكامل', descAr: 'نقي وعصري', price: 0, cost: 0, unit: 'event', swatch: ['#ffffff', '#f2f2f2', '#e6e6e6'] },
      { id: 'theme-black-gold', nameAr: 'أسود وذهبي', descAr: 'جلامور ليلي', price: 0, cost: 0, unit: 'event', swatch: ['#111111', '#d4af37', '#3a3a3a'] },
      { id: 'theme-sage', nameAr: 'أخضر زيتي ونود', descAr: 'طبيعي وبوهو', price: 0, cost: 0, unit: 'event', swatch: ['#9caf88', '#e8dcc8', '#ffffff'] },
    ],
  },
  {
    id: 'kosha', titleAr: 'الكوشة', subtitleAr: 'مكان جلوس العروسين — قلب التصميم', emoji: '👑', mode: 'single', eventTypes: CELEBRATIONS,
    options: [
      { id: 'kosha-classic', nameAr: 'كوشة كلاسيك', descAr: 'أريكة مذهبة وخلفية قماش وإضاءة دافئة', price: 6000, cost: 3500, unit: 'event', emoji: '🛋️' },
      { id: 'kosha-royal', nameAr: 'كوشة ملكية', descAr: 'خلفية 6 متر بأعمدة وتاج وسجاد ملكي', price: 14000, cost: 8500, unit: 'event', emoji: '👑', tagAr: 'فخامة' },
      { id: 'kosha-fresh', nameAr: 'كوشة ورد طبيعي', descAr: 'جدار ورد طبيعي حسب الثيم', price: 18000, cost: 11000, unit: 'event', emoji: '🌹', tagAr: 'الأكثر طلباً' },
      { id: 'kosha-mirror', nameAr: 'كوشة مرايا و LED', descAr: 'تصميم عصري بمرايا وإضاءة متحركة', price: 12000, cost: 7000, unit: 'event', emoji: '✨' },
      { id: 'kosha-boho', nameAr: 'كوشة بوهو', descAr: 'خشب طبيعي وبامباس وورد مجفف', price: 9000, cost: 5200, unit: 'event', emoji: '🌾' },
      { id: 'kosha-arch', nameAr: 'آرش دائري معلّق', descAr: 'دائرة معدنية مغطاة بالورد والإضاءة', price: 10500, cost: 6000, unit: 'event', emoji: '⭕' },
      { id: 'kosha-garden', nameAr: 'مرجيحة الحديقة', descAr: 'مرجيحة ورد للعروسين — مثالية للأوبن إير', price: 11000, cost: 6400, unit: 'event', emoji: '🌿' },
      { id: 'kosha-crystal', nameAr: 'كوشة كريستال', descAr: 'ستائر كريستال وثريات معلقة', price: 16000, cost: 9500, unit: 'event', emoji: '💎' },
    ],
  },
  {
    id: 'tables', titleAr: 'الطاولات', subtitleAr: 'شكل الطاولة وعدد الكراسي عليها — يحدد عدد الطاولات تلقائياً', emoji: '🍽️', mode: 'single', eventTypes: SOCIAL,
    options: [
      { id: 'tbl-round-6', nameAr: 'دائرية 180سم · 6 كراسي', descAr: 'جلسة مريحة وواسعة', price: 150, cost: 60, unit: 'table', emoji: '⚪', seats: 6, tableShape: 'round' },
      { id: 'tbl-round-8', nameAr: 'دائرية 180سم · 8 كراسي', descAr: 'التوازن المثالي', price: 150, cost: 60, unit: 'table', emoji: '⚪', seats: 8, tableShape: 'round', tagAr: 'الأكثر طلباً' },
      { id: 'tbl-round-10', nameAr: 'دائرية 180سم · 10 كراسي', descAr: 'أعداد أكبر في مساحة أقل', price: 150, cost: 60, unit: 'table', emoji: '⚪', seats: 10, tableShape: 'round' },
      { id: 'tbl-rect-6', nameAr: 'مستطيلة 1×2م · 6 كراسي', descAr: 'مظهر عصري ومنظم', price: 170, cost: 70, unit: 'table', emoji: '▭', seats: 6, tableShape: 'rect' },
      { id: 'tbl-rect-8', nameAr: 'مستطيلة 1×2م · 8 كراسي', descAr: 'كرسي على كل رأس', price: 170, cost: 70, unit: 'table', emoji: '▭', seats: 8, tableShape: 'rect' },
      { id: 'tbl-rect-10', nameAr: 'مستطيلة 1×2م · 10 كراسي', descAr: 'صفوف طويلة بطابع ملكي', price: 170, cost: 70, unit: 'table', emoji: '▭', seats: 10, tableShape: 'rect' },
    ],
  },
  {
    id: 'chairs', titleAr: 'الكراسي', subtitleAr: 'شكل الكرسي ولونه — العدد حسب المدعوين', emoji: '🪑', mode: 'single', eventTypes: SOCIAL,
    options: [
      { id: 'chair-banquet', nameAr: 'كرسي بانكيت بكسوة وفيونكة', descAr: 'كسوة قماش ولون الفيونكة حسب الثيم', price: 35, cost: 15, unit: 'guest', swatch: ['#ffffff', '#d4af37'] },
      { id: 'chair-chiavari-gold', nameAr: 'شيافاري ذهبي', descAr: 'الكرسي الكلاسيكي للأفراح', price: 60, cost: 28, unit: 'guest', swatch: ['#d4af37', '#fff8e1'], tagAr: 'الأكثر طلباً' },
      { id: 'chair-chiavari-silver', nameAr: 'شيافاري فضي', descAr: 'يناسب الثيمات الباردة', price: 60, cost: 28, unit: 'guest', swatch: ['#c0c0c0', '#f5f5f5'] },
      { id: 'chair-crystal', nameAr: 'كرسي كريستال شفاف', descAr: 'مظهر عصري خفيف', price: 85, cost: 40, unit: 'guest', swatch: ['#e0f2fe', '#ffffff'] },
      { id: 'chair-napoleon', nameAr: 'نابليون أبيض', descAr: 'فخامة كلاسيكية', price: 75, cost: 35, unit: 'guest', swatch: ['#ffffff', '#e5e5e5'] },
      { id: 'chair-velvet', nameAr: 'كرسي قطيفة', descAr: 'قطيفة بلون الثيم', price: 95, cost: 45, unit: 'guest', swatch: ['#6d1a36', '#1b2a4a', '#046307'] },
      { id: 'chair-wood', nameAr: 'كرسي خشب طبيعي', descAr: 'مثالي للبوهو والحدائق', price: 70, cost: 32, unit: 'guest', swatch: ['#8b5e3c', '#d2b48c'] },
    ],
  },
  {
    id: 'linens', titleAr: 'المفارش والرانر', subtitleAr: 'قماش الطاولة الذي يكمّل الثيم', emoji: '🧵', mode: 'single', eventTypes: SOCIAL,
    options: [
      { id: 'linen-satin', nameAr: 'ساتان سادة', descAr: 'لامع ناعم بلون الثيم', price: 120, cost: 45, unit: 'table', swatch: ['#ffffff', '#f7e7ce'] },
      { id: 'linen-sequin', nameAr: 'ترتر لامع', descAr: 'يعكس الإضاءة بشكل ساحر', price: 220, cost: 90, unit: 'table', swatch: ['#d4af37', '#c0c0c0'], tagAr: 'لمعة' },
      { id: 'linen-velvet', nameAr: 'قطيفة', descAr: 'غني ودافئ', price: 200, cost: 80, unit: 'table', swatch: ['#6d1a36', '#1b2a4a'] },
      { id: 'linen-natural', nameAr: 'كتان طبيعي', descAr: 'بوهو وأنيق', price: 150, cost: 55, unit: 'table', swatch: ['#e8dcc8', '#c8b79e'] },
      { id: 'linen-white-runner', nameAr: 'أبيض + رانر ذهبي', descAr: 'كلاسيكي مع لمسة ذهب', price: 160, cost: 60, unit: 'table', swatch: ['#ffffff', '#d4af37'], tagAr: 'الأكثر طلباً' },
      { id: 'linen-lace', nameAr: 'دانتيل', descAr: 'رومانسي ناعم', price: 190, cost: 75, unit: 'table', swatch: ['#fffaf0', '#f4c2c2'] },
    ],
  },
  {
    id: 'centerpieces', titleAr: 'السنتربيس', subtitleAr: 'ما يتوسط كل طاولة', emoji: '💐', mode: 'single', eventTypes: SOCIAL,
    options: [
      { id: 'cp-low-floral', nameAr: 'ورد منخفض', descAr: 'بوكيه طبيعي لا يحجب الرؤية', price: 350, cost: 180, unit: 'table', emoji: '💐', tagAr: 'الأكثر طلباً' },
      { id: 'cp-tall-floral', nameAr: 'ورد عالي على ستاند', descAr: 'فازة كريستال عالية بالورد', price: 650, cost: 360, unit: 'table', emoji: '🌸' },
      { id: 'cp-candelabra', nameAr: 'شمعدان ذهبي', descAr: 'شمعدان 5 شمعات مع ورد', price: 550, cost: 290, unit: 'table', emoji: '🕯️' },
      { id: 'cp-crystal', nameAr: 'كريستال وإضاءة', descAr: 'قطع كريستال وإضاءة LED', price: 480, cost: 250, unit: 'table', emoji: '💎' },
      { id: 'cp-lanterns', nameAr: 'فوانيس وشموع', descAr: 'دفء وأجواء حالمة', price: 300, cost: 150, unit: 'table', emoji: '🏮' },
      { id: 'cp-greenery', nameAr: 'رانر أخضر وشموع', descAr: 'خضرة طبيعية على طول الطاولة', price: 420, cost: 210, unit: 'table', emoji: '🌿' },
      { id: 'cp-floating', nameAr: 'شموع عائمة', descAr: 'أسطوانات زجاج بماء وشموع', price: 260, cost: 120, unit: 'table', emoji: '✨' },
    ],
  },
  {
    id: 'entrance', titleAr: 'المدخل والممر', subtitleAr: 'أول ما يراه الضيوف — يمكن اختيار أكثر من عنصر', emoji: '🚪', mode: 'multi', eventTypes: SOCIAL,
    options: [
      { id: 'ent-arch', nameAr: 'آرش ورد للمدخل', descAr: 'بوابة ورد على باب القاعة', price: 4500, cost: 2600, unit: 'event', emoji: '🌺' },
      { id: 'ent-aisle', nameAr: 'ستاندات ورد للممر', descAr: 'ستاند ورد على جانبي الممر', price: 450, cost: 240, unit: 'unit', emoji: '💮' },
      { id: 'ent-carpet', nameAr: 'سجادة الممر', descAr: 'سجاد أبيض أو أحمر للممر', price: 1500, cost: 700, unit: 'event', emoji: '🟥' },
      { id: 'ent-board', nameAr: 'لوحة ترحيب بالأسماء', descAr: 'لوحة مطبوعة بأسماء العروسين', price: 900, cost: 400, unit: 'event', emoji: '🪧' },
      { id: 'ent-flowerwall', nameAr: 'جدار ورد للتصوير', descAr: 'خلفية تصوير للضيوف', price: 5500, cost: 3200, unit: 'event', emoji: '📸', tagAr: 'مميز' },
      { id: 'ent-seating-chart', nameAr: 'لوحة توزيع الطاولات', descAr: 'يعرف كل ضيف طاولته', price: 1200, cost: 550, unit: 'event', emoji: '🗺️' },
      { id: 'ent-neon', nameAr: 'لافتة نيون بالأسماء', descAr: 'نيون مضيء بالاسم أو جملة', price: 2200, cost: 1100, unit: 'event', emoji: '💡' },
    ],
  },
  {
    id: 'lighting', titleAr: 'الإضاءة', subtitleAr: 'تصنع الإحساس العام للقاعة — يمكن اختيار أكثر من عنصر', emoji: '💡', mode: 'multi', eventTypes: ALL,
    options: [
      { id: 'light-warm', nameAr: 'إضاءة دافئة أساسية', descAr: 'إضاءة عامة هادئة', price: 2500, cost: 1200, unit: 'event', emoji: '🔆' },
      { id: 'light-uplights', nameAr: 'أب لايت على الجدران', descAr: 'غسيل الجدران بلون الثيم', price: 3500, cost: 1700, unit: 'event', emoji: '🌈', tagAr: 'الأكثر طلباً' },
      { id: 'light-moving', nameAr: 'موفينج هيد', descAr: 'رؤوس متحركة لساحة الرقص', price: 5500, cost: 2800, unit: 'event', emoji: '🎇' },
      { id: 'light-pinspot', nameAr: 'سبوت على كل طاولة', descAr: 'يبرز السنتربيس', price: 120, cost: 50, unit: 'table', emoji: '🔦' },
      { id: 'light-chandeliers', nameAr: 'ثريات كريستال', descAr: 'ثريات معلقة فوق الطاولات', price: 1800, cost: 900, unit: 'unit', emoji: '🪔' },
      { id: 'light-fairy', nameAr: 'سقف فيري لايت', descAr: 'سماء من النجوم فوق الضيوف', price: 7000, cost: 3800, unit: 'event', emoji: '🌌' },
      { id: 'light-laser', nameAr: 'ليزر وشو', descAr: 'عرض ليزر للحظات الحماس', price: 4000, cost: 2000, unit: 'event', emoji: '🟢' },
      { id: 'light-gobo', nameAr: 'جوبو بالأسماء', descAr: 'إسقاط الأسماء أو الشعار على الأرض', price: 1500, cost: 700, unit: 'event', emoji: '🔤' },
    ],
  },
  {
    id: 'music', titleAr: 'الموسيقى والصوت', subtitleAr: 'من يصنع الأجواء — يمكن اختيار أكثر من عنصر', emoji: '🎵', mode: 'multi', eventTypes: SOCIAL,
    options: [
      { id: 'music-dj', nameAr: 'دي جي وساوند', descAr: 'دي جي محترف وسماعات للقاعة', price: 6000, cost: 3200, unit: 'event', emoji: '🎧', tagAr: 'أساسي' },
      { id: 'music-dj-mc', nameAr: 'دي جي + مقدم حفل', descAr: 'مقدم يدير فقرات الحفل', price: 9000, cost: 5000, unit: 'event', emoji: '🎤' },
      { id: 'music-band', nameAr: 'فرقة لايف', descAr: 'مطرب وفرقة موسيقية', price: 18000, cost: 11000, unit: 'event', emoji: '🎸' },
      { id: 'music-oriental', nameAr: 'فرقة شرقي', descAr: 'طبلة وأورج ومطرب شعبي', price: 12000, cost: 7000, unit: 'event', emoji: '🪘' },
      { id: 'music-violin', nameAr: 'عازف كمان', descAr: 'لدخول العروسين أو العشاء', price: 4500, cost: 2500, unit: 'event', emoji: '🎻' },
      { id: 'music-sax', nameAr: 'عازف ساكسفون', descAr: 'أجواء راقية وقت العشاء', price: 4500, cost: 2500, unit: 'event', emoji: '🎷' },
    ],
  },
  {
    id: 'zaffa', titleAr: 'الزفة', subtitleAr: 'لحظة دخول العروسين', emoji: '🥁', mode: 'single', eventTypes: CELEBRATIONS,
    options: [
      { id: 'zaffa-none', nameAr: 'بدون زفة', descAr: 'دخول على أغنية من الدي جي', price: 0, cost: 0, unit: 'event', emoji: '🎶' },
      { id: 'zaffa-saidi', nameAr: 'زفة صعيدي', descAr: 'مزمار وطبل بلدي وخيالة', price: 5000, cost: 2800, unit: 'event', emoji: '🐎' },
      { id: 'zaffa-shami', nameAr: 'زفة شامي ودبكة', descAr: 'فرقة دبكة بالأزياء', price: 7000, cost: 4000, unit: 'event', emoji: '💃' },
      { id: 'zaffa-moroccan', nameAr: 'زفة مغربي', descAr: 'عمارية وفرقة مغربية', price: 9000, cost: 5200, unit: 'event', emoji: '🕌' },
      { id: 'zaffa-tannoura', nameAr: 'تنورة', descAr: 'عرض تنورة مضيئة', price: 4000, cost: 2200, unit: 'event', emoji: '🌀' },
      { id: 'zaffa-drums', nameAr: 'زفة طبول', descAr: 'فرقة طبول بإضاءة', price: 4500, cost: 2500, unit: 'event', emoji: '🥁', tagAr: 'الأكثر طلباً' },
    ],
  },
  {
    id: 'catering', titleAr: 'الضيافة والبوفيه', subtitleAr: 'ما سيقدَّم للضيوف — يمكن اختيار أكثر من عنصر', emoji: '🥘', mode: 'multi', eventTypes: SOCIAL,
    options: [
      { id: 'cat-welcome', nameAr: 'مشروبات ترحيب', descAr: 'عصائر طبيعية عند الاستقبال', price: 45, cost: 20, unit: 'guest', emoji: '🍹' },
      { id: 'cat-sweets', nameAr: 'حلويات شرقية وغربية', descAr: 'تشكيلة حلويات للطاولات', price: 60, cost: 30, unit: 'guest', emoji: '🍰' },
      { id: 'cat-dinner-classic', nameAr: 'بوفيه عشاء كلاسيك', descAr: 'أطباق رئيسية ومقبلات', price: 250, cost: 150, unit: 'guest', emoji: '🍽️' },
      { id: 'cat-dinner-royal', nameAr: 'بوفيه عشاء ملكي', descAr: 'لحوم ومشويات ومأكولات بحرية', price: 420, cost: 260, unit: 'guest', emoji: '🥩', tagAr: 'فخامة' },
      { id: 'cat-live-stations', nameAr: 'محطات حية', descAr: 'شاورما وباستا ومشاوي أمام الضيوف', price: 140, cost: 80, unit: 'guest', emoji: '👨‍🍳' },
      { id: 'cat-dessert-table', nameAr: 'ركن حلويات', descAr: 'طاولة حلويات مصممة بالثيم', price: 6500, cost: 3600, unit: 'event', emoji: '🧁' },
      { id: 'cat-coffee', nameAr: 'ركن قهوة', descAr: 'قهوة عربي وتركي وإسبريسو', price: 35, cost: 15, unit: 'guest', emoji: '☕' },
      { id: 'cat-icecream', nameAr: 'عربة آيس كريم', descAr: 'آيس كريم وفشار وغزل البنات', price: 4000, cost: 2100, unit: 'event', emoji: '🍦' },
    ],
  },
  {
    id: 'cake', titleAr: 'التورتة', subtitleAr: 'تصميم التورتة', emoji: '🎂', mode: 'single', eventTypes: SOCIAL,
    options: [
      { id: 'cake-none', nameAr: 'بدون تورتة', descAr: 'سيحضرها العميل', price: 0, cost: 0, unit: 'event', emoji: '—' },
      { id: 'cake-3', nameAr: 'تورتة 3 أدوار', descAr: 'تكفي حتى 150 فرد', price: 3500, cost: 1900, unit: 'event', emoji: '🎂' },
      { id: 'cake-5', nameAr: 'تورتة 5 أدوار', descAr: 'تكفي حتى 300 فرد', price: 6500, cost: 3600, unit: 'event', emoji: '🎂', tagAr: 'الأكثر طلباً' },
      { id: 'cake-7', nameAr: 'تورتة 7 أدوار ملكية', descAr: 'ارتفاع مبهر مع ورد', price: 11000, cost: 6200, unit: 'event', emoji: '🏰' },
      { id: 'cake-cupcakes', nameAr: 'برج كب كيك', descAr: 'بديل عصري للتورتة', price: 3000, cost: 1600, unit: 'event', emoji: '🧁' },
    ],
  },
  {
    id: 'photo', titleAr: 'التصوير', subtitleAr: 'كيف ستُحفظ الذكرى — يمكن اختيار أكثر من عنصر', emoji: '📷', mode: 'multi', eventTypes: ALL,
    options: [
      { id: 'photo-basic', nameAr: 'تصوير فوتوغرافي', descAr: 'مصور محترف + 300 صورة معدلة', price: 5000, cost: 2800, unit: 'event', emoji: '📷' },
      { id: 'photo-video', nameAr: 'فوتو + فيديو', descAr: 'فيلم الحفل كامل + برومو', price: 9500, cost: 5500, unit: 'event', emoji: '🎥', tagAr: 'الأكثر طلباً' },
      { id: 'photo-4k-drone', nameAr: 'فيديو 4K + درون', descAr: 'لقطات جوية سينمائية', price: 14000, cost: 8200, unit: 'event', emoji: '🚁' },
      { id: 'photo-crane', nameAr: 'كرين تصوير', descAr: 'حركة كاميرا سينمائية', price: 6000, cost: 3500, unit: 'event', emoji: '🏗️' },
      { id: 'photo-booth', nameAr: 'فوتو بوث', descAr: 'طباعة فورية للضيوف', price: 4500, cost: 2400, unit: 'event', emoji: '🖼️' },
      { id: 'photo-same-day', nameAr: 'مونتاج نفس اليوم', descAr: 'فيديو يُعرض قبل نهاية الحفل', price: 5500, cost: 3200, unit: 'event', emoji: '⚡' },
      { id: 'photo-360', nameAr: 'كاميرا 360', descAr: 'فيديوهات دوارة للضيوف', price: 3500, cost: 1800, unit: 'event', emoji: '🔄' },
    ],
  },
  {
    id: 'effects', titleAr: 'المؤثرات الخاصة', subtitleAr: 'لحظات الإبهار — يمكن اختيار أكثر من عنصر', emoji: '🎆', mode: 'multi', eventTypes: SOCIAL,
    options: [
      { id: 'fx-cold-fire', nameAr: 'شلالات نار باردة', descAr: 'آمنة داخل القاعات', price: 1200, cost: 600, unit: 'unit', emoji: '🎇', tagAr: 'الأكثر طلباً' },
      { id: 'fx-clouds', nameAr: 'رقصة على السحاب', descAr: 'دخان كثيف أرضي للرقصة الأولى', price: 3000, cost: 1500, unit: 'event', emoji: '☁️' },
      { id: 'fx-bubbles', nameAr: 'فقاعات', descAr: 'ماكينة فقاعات للحظات الرقص', price: 1200, cost: 500, unit: 'event', emoji: '🫧' },
      { id: 'fx-confetti', nameAr: 'مدافع كونفيتي', descAr: 'قصاصات بلون الثيم', price: 900, cost: 400, unit: 'unit', emoji: '🎊' },
      { id: 'fx-petals', nameAr: 'إسقاط ورد', descAr: 'بتلات ورد من السقف', price: 3500, cost: 1900, unit: 'event', emoji: '🌹' },
      { id: 'fx-led-robot', nameAr: 'روبوت LED', descAr: 'عرض راقص مضيء', price: 5000, cost: 2700, unit: 'event', emoji: '🤖' },
      { id: 'fx-fireworks', nameAr: 'ألعاب نارية خارجية', descAr: 'للأماكن المفتوحة فقط', price: 8000, cost: 4500, unit: 'event', emoji: '🎆' },
    ],
  },
  {
    id: 'extras', titleAr: 'خدمات إضافية', subtitleAr: 'تفاصيل صغيرة تصنع فرقاً — يمكن اختيار أكثر من عنصر', emoji: '⭐', mode: 'multi', eventTypes: SOCIAL,
    options: [
      { id: 'ext-hostess', nameAr: 'فريق استقبال', descAr: 'مضيفات لاستقبال وتوجيه الضيوف', price: 3000, cost: 1700, unit: 'event', emoji: '🤵' },
      { id: 'ext-valet', nameAr: 'فاليه باركينج', descAr: 'صف السيارات للضيوف', price: 3500, cost: 2000, unit: 'event', emoji: '🚗' },
      { id: 'ext-kids', nameAr: 'ركن أطفال', descAr: 'ألعاب ومشرفة للأطفال', price: 3000, cost: 1600, unit: 'event', emoji: '🧸' },
      { id: 'ext-car', nameAr: 'سيارة زفاف مزينة', descAr: 'سيارة فاخرة بالورد', price: 6000, cost: 3500, unit: 'event', emoji: '🚘' },
      { id: 'ext-bride-room', nameAr: 'غرفة تجهيز العروسة', descAr: 'غرفة خاصة قبل الحفل', price: 2500, cost: 900, unit: 'event', emoji: '💄' },
      { id: 'ext-favors', nameAr: 'هدايا الضيوف', descAr: 'توزيعات مغلفة بالثيم', price: 40, cost: 20, unit: 'guest', emoji: '🎁' },
      { id: 'ext-security', nameAr: 'أمن وتنظيم', descAr: 'فريق أمن للحفل', price: 2500, cost: 1500, unit: 'event', emoji: '🛡️' },
    ],
  },
  {
    id: 'birthday-theme', titleAr: 'ثيم الحفلة', subtitleAr: 'شخصية الحفلة', emoji: '🎈', mode: 'single', eventTypes: ['birthday', 'party'],
    options: [
      { id: 'bd-balloons', nameAr: 'بالونات وأرش', descAr: 'أرش بالونات بألوان الثيم', price: 2500, cost: 1200, unit: 'event', emoji: '🎈' },
      { id: 'bd-princess', nameAr: 'ثيم أميرات', descAr: 'خلفية وقلعة ودمى', price: 4500, cost: 2400, unit: 'event', emoji: '👸' },
      { id: 'bd-superhero', nameAr: 'ثيم أبطال خارقين', descAr: 'شخصيات وخلفية وأقنعة', price: 4500, cost: 2400, unit: 'event', emoji: '🦸' },
      { id: 'bd-jungle', nameAr: 'ثيم الغابة', descAr: 'حيوانات وخضرة', price: 4000, cost: 2100, unit: 'event', emoji: '🦁' },
      { id: 'bd-glam', nameAr: 'جلامور للكبار', descAr: 'أسود وذهبي وبالونات أرقام', price: 5000, cost: 2700, unit: 'event', emoji: '🥂' },
      { id: 'bd-graduation', nameAr: 'ثيم تخرج', descAr: 'قبعات وخلفية تخرج', price: 3500, cost: 1800, unit: 'event', emoji: '🎓' },
    ],
  },
  {
    id: 'entertainment', titleAr: 'الفقرات الترفيهية', subtitleAr: 'ما يسعد الضيوف — يمكن اختيار أكثر من عنصر', emoji: '🎪', mode: 'multi', eventTypes: ['birthday', 'party'],
    options: [
      { id: 'ent-magician', nameAr: 'ساحر', descAr: 'عرض 45 دقيقة', price: 3500, cost: 2000, unit: 'event', emoji: '🎩' },
      { id: 'ent-clown', nameAr: 'مهرج', descAr: 'ألعاب ومسابقات', price: 2500, cost: 1400, unit: 'event', emoji: '🤡' },
      { id: 'ent-face', nameAr: 'رسم على الوجه', descAr: 'فنانة رسم للأطفال', price: 1800, cost: 900, unit: 'event', emoji: '🎨' },
      { id: 'ent-bubbleshow', nameAr: 'عرض فقاعات', descAr: 'فقاعات عملاقة', price: 2800, cost: 1500, unit: 'event', emoji: '🫧' },
      { id: 'ent-mascot', nameAr: 'شخصية كرتونية', descAr: 'بدلة شخصية يختارها الطفل', price: 2000, cost: 1100, unit: 'event', emoji: '🐻' },
      { id: 'ent-games', nameAr: 'منسق ألعاب', descAr: 'مسابقات وجوائز', price: 2200, cost: 1200, unit: 'event', emoji: '🏆' },
    ],
  },
  {
    id: 'seating-style', titleAr: 'نظام الجلوس', subtitleAr: 'ترتيب القاعة حسب طبيعة المؤتمر', emoji: '🪑', mode: 'single', eventTypes: ['conference'],
    options: [
      { id: 'seat-theater', nameAr: 'مسرح', descAr: 'صفوف كراسي أمام المنصة — أكبر عدد', price: 25, cost: 10, unit: 'guest', emoji: '🎭', tagAr: 'الأكثر طلباً' },
      { id: 'seat-classroom', nameAr: 'فصل دراسي', descAr: 'طاولات وكراسي للكتابة', price: 45, cost: 20, unit: 'guest', emoji: '📝' },
      { id: 'seat-ushape', nameAr: 'حرف U', descAr: 'للاجتماعات والنقاش', price: 50, cost: 22, unit: 'guest', emoji: '🔷' },
      { id: 'seat-banquet', nameAr: 'طاولات دائرية', descAr: 'للمؤتمرات مع وجبات', price: 55, cost: 25, unit: 'guest', emoji: '⚪' },
      { id: 'seat-cabaret', nameAr: 'كباريه', descAr: 'نصف دائرة مواجهة للمنصة', price: 55, cost: 25, unit: 'guest', emoji: '🌓' },
      { id: 'seat-boardroom', nameAr: 'بورد روم', descAr: 'طاولة اجتماعات واحدة', price: 60, cost: 28, unit: 'guest', emoji: '🗂️' },
    ],
  },
  {
    id: 'stage', titleAr: 'المنصة والشاشات', subtitleAr: 'تجهيزات المتحدثين والعرض — يمكن اختيار أكثر من عنصر', emoji: '🎤', mode: 'multi', eventTypes: ['conference'],
    options: [
      { id: 'stg-stage', nameAr: 'منصة مرتفعة', descAr: 'منصة بسجاد وخلفية', price: 6000, cost: 3200, unit: 'event', emoji: '🟫' },
      { id: 'stg-podium', nameAr: 'بوديوم وميكروفون', descAr: 'بوديوم بشعار الشركة', price: 1500, cost: 700, unit: 'event', emoji: '🎙️' },
      { id: 'stg-led', nameAr: 'شاشة LED عملاقة', descAr: 'شاشة 4×3 متر', price: 12000, cost: 7000, unit: 'event', emoji: '🖥️', tagAr: 'احترافي' },
      { id: 'stg-projector', nameAr: 'بروجكتور وشاشة', descAr: 'حل اقتصادي للعرض', price: 3500, cost: 1700, unit: 'event', emoji: '📽️' },
      { id: 'stg-mics', nameAr: 'ميكروفونات لاسلكية', descAr: 'للمتحدثين والأسئلة', price: 400, cost: 150, unit: 'unit', emoji: '🎤' },
      { id: 'stg-backdrop', nameAr: 'خلفية مطبوعة بالشعار', descAr: 'باك دروب للتصوير والمنصة', price: 4500, cost: 2400, unit: 'event', emoji: '🪧' },
      { id: 'stg-translation', nameAr: 'ترجمة فورية', descAr: 'كابينة وسماعات للحضور', price: 15000, cost: 9000, unit: 'event', emoji: '🌐' },
      { id: 'stg-streaming', nameAr: 'بث مباشر', descAr: 'بث على يوتيوب أو زووم', price: 7000, cost: 3800, unit: 'event', emoji: '📡' },
    ],
  },
  {
    id: 'conf-hospitality', titleAr: 'الضيافة للمؤتمر', subtitleAr: 'استراحات ووجبات — يمكن اختيار أكثر من عنصر', emoji: '☕', mode: 'multi', eventTypes: ['conference'],
    options: [
      { id: 'cb-basic', nameAr: 'استراحة قهوة أساسية', descAr: 'قهوة وشاي ومياه', price: 60, cost: 25, unit: 'guest', emoji: '☕' },
      { id: 'cb-premium', nameAr: 'استراحة قهوة مميزة', descAr: 'معجنات وحلويات وعصائر', price: 120, cost: 55, unit: 'guest', emoji: '🥐', tagAr: 'الأكثر طلباً' },
      { id: 'cb-lunch', nameAr: 'غداء بوفيه', descAr: 'بوفيه ساخن متكامل', price: 280, cost: 160, unit: 'guest', emoji: '🍛' },
      { id: 'cb-lunchbox', nameAr: 'لانش بوكس', descAr: 'وجبة مغلفة لكل فرد', price: 150, cost: 85, unit: 'guest', emoji: '🥡' },
      { id: 'cb-water', nameAr: 'مياه ومشروبات على الطاولات', descAr: 'طوال اليوم', price: 20, cost: 8, unit: 'guest', emoji: '💧' },
    ],
  },
  {
    id: 'conf-extras', titleAr: 'التنظيم والتسجيل', subtitleAr: 'تفاصيل التنظيم — يمكن اختيار أكثر من عنصر', emoji: '🗂️', mode: 'multi', eventTypes: ['conference'],
    options: [
      { id: 'cx-registration', nameAr: 'مكتب تسجيل', descAr: 'فريق تسجيل واستقبال', price: 2500, cost: 1300, unit: 'event', emoji: '🧾' },
      { id: 'cx-badges', nameAr: 'بادجات بالأسماء', descAr: 'طباعة بادج لكل مشارك', price: 25, cost: 10, unit: 'guest', emoji: '🪪' },
      { id: 'cx-kits', nameAr: 'حقيبة المؤتمر', descAr: 'نوت بوك وقلم بالشعار', price: 90, cost: 50, unit: 'guest', emoji: '👜' },
      { id: 'cx-rollups', nameAr: 'رول أب بالشعار', descAr: 'لافتات قائمة', price: 650, cost: 300, unit: 'unit', emoji: '📜' },
      { id: 'cx-gifts', nameAr: 'دروع وهدايا تكريم', descAr: 'للمتحدثين والضيوف', price: 450, cost: 250, unit: 'unit', emoji: '🏅' },
      { id: 'cx-wifi', nameAr: 'إنترنت مخصص', descAr: 'شبكة قوية للحضور', price: 3000, cost: 1500, unit: 'event', emoji: '📶' },
    ],
  },
];

export const categoriesFor = (eventType: EventType) => CHOICE_CATEGORIES.filter((c) => c.eventTypes.includes(eventType));

export const findOption = (optionId: string) => {
  for (const category of CHOICE_CATEGORIES) {
    const option = category.options.find((o) => o.id === optionId);
    if (option) return { category, option };
  }
  return undefined;
};

const roundTo50 = (n: number) => Math.round(n / 50) * 50;

/** Selling price at a location — Porto Said is ~10% higher, like the starting price book. */
export const optionPriceAt = (option: ChoiceOption, loc: LocationId) => {
  if (loc !== 'porto' || option.price === 0) return option.price;
  return option.price >= 1000 ? roundTo50(option.price * 1.1) : Math.round(option.price * 1.1);
};
