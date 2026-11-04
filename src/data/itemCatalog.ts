import type { LucideIcon } from 'lucide-react';
import {
  Armchair, Baby, BookOpen, CakeSlice, Camera, ChefHat, CloudFog, Coffee, Columns3, Cookie, CupSoda, Disc3, DoorOpen, Droplets, Fence, Flame,
  Flower, Flower2, Footprints, Gem, Gift, GlassWater, Heart, IceCreamCone, Lamp, LampCeiling, LampFloor, Landmark, Leaf, Lightbulb, Martini,
  Mic, Monitor, Move3d, Music, PartyPopper, Popcorn, Presentation, Projector, RectangleHorizontal, ScreenShare, Shirt, Signpost, Snowflake,
  Sofa, Sparkle, Sparkles, Speaker, Sprout, Sun, Tent, TreeDeciduous, TreePalm, Tv, Users, Utensils, Wine, Zap, Crown, Armchair as Stool,
} from 'lucide-react';

export type ItemCategory = 'tables' | 'stage' | 'food' | 'decor' | 'lighting' | 'services';

export interface CatalogItem {
  type: string;
  labelEn: string;
  labelAr: string;
  icon: LucideIcon;
  cat: ItemCategory;
  /** Only 3D Studio Pro can add it (Basic shows it locked). */
  pro?: boolean;
}

export const ITEM_CATEGORIES: { id: ItemCategory; en: string; ar: string }[] = [
  { id: 'tables', en: 'Tables & seating', ar: 'طاولات وجلوس' },
  { id: 'stage', en: 'Stage & sound', ar: 'المسرح والصوت' },
  { id: 'food', en: 'Food & drinks', ar: 'أكل ومشروبات' },
  { id: 'decor', en: 'Decor & flowers', ar: 'ديكور وورد' },
  { id: 'lighting', en: 'Lights & effects', ar: 'إضاءة ومؤثرات' },
  { id: 'services', en: 'Entrance & services', ar: 'المدخل والخدمات' },
];

/** Everything the designer can add. Basic gets every item without `pro`; 3D Studio Pro gets all of them. */
export const ITEM_CATALOG: CatalogItem[] = [
  // Tables & seating
  { type: 'table', labelEn: 'Round Table', labelAr: 'طاولة دائرية', icon: Users, cat: 'tables' },
  { type: 'chairs', labelEn: 'Chair', labelAr: 'كرسي', icon: Armchair, cat: 'tables' },
  { type: 'head_table', labelEn: 'Head Table', labelAr: 'طاولة رئيسية', icon: RectangleHorizontal, cat: 'tables' },
  { type: 'kids_table', labelEn: 'Kids Table', labelAr: 'طاولة أطفال', icon: Baby, cat: 'tables' },
  { type: 'lounge', labelEn: 'Lounge Zone', labelAr: 'منطقة جلوس', icon: Users, cat: 'tables' },
  { type: 'sofa', labelEn: 'Sofa', labelAr: 'كنبة', icon: Sofa, cat: 'tables' },
  { type: 'armchair', labelEn: 'Armchair', labelAr: 'فوتيه', icon: Armchair, cat: 'tables' },
  { type: 'ottoman', labelEn: 'Pouf / Ottoman', labelAr: 'بوف', icon: Sprout, cat: 'tables' },
  { type: 'bench', labelEn: 'Bench', labelAr: 'بنش', icon: RectangleHorizontal, cat: 'tables' },
  { type: 'bar_stool', labelEn: 'Bar Stool', labelAr: 'كرسي بار', icon: Stool, cat: 'tables' },
  { type: 'cocktail', labelEn: 'Cocktail Table', labelAr: 'طاولة كوكتيل عالية', icon: Wine, cat: 'tables', pro: true },
  { type: 'royal_chairs', labelEn: 'Royal Couple Chairs', labelAr: 'كراسي العروسين الملكية', icon: Crown, cat: 'tables', pro: true },
  // Stage & sound
  { type: 'stage', labelEn: 'Stage / Kosha', labelAr: 'منصة / كوشة', icon: Presentation, cat: 'stage' },
  { type: 'dance', labelEn: 'Dance Floor', labelAr: 'منصة رقص', icon: Move3d, cat: 'stage' },
  { type: 'screen', labelEn: 'LED Screen', labelAr: 'شاشة LED', icon: Monitor, cat: 'stage' },
  { type: 'led_wall', labelEn: 'Large LED Wall', labelAr: 'جدار شاشة LED كبير', icon: Monitor, cat: 'stage' },
  { type: 'projector_screen', labelEn: 'Projector Screen', labelAr: 'شاشة بروجيكتور', icon: Projector, cat: 'stage' },
  { type: 'tv_stand', labelEn: 'TV on Stand', labelAr: 'شاشة على ستاند', icon: Tv, cat: 'stage' },
  { type: 'podium', labelEn: 'Podium', labelAr: 'منصة خطاب', icon: ScreenShare, cat: 'stage' },
  { type: 'mic_stand', labelEn: 'Microphone', labelAr: 'مايك على ستاند', icon: Mic, cat: 'stage' },
  { type: 'speaker', labelEn: 'Speaker Tower', labelAr: 'سماعة كبيرة', icon: Speaker, cat: 'stage' },
  { type: 'piano', labelEn: 'Grand Piano', labelAr: 'بيانو', icon: Music, cat: 'stage' },
  { type: 'band_riser', labelEn: 'Band Riser', labelAr: 'منصة الفرقة', icon: Music, cat: 'stage' },
  { type: 'dj', labelEn: 'DJ Booth', labelAr: 'ركن الدي جي', icon: Disc3, cat: 'stage', pro: true },
  // Food & drinks
  { type: 'buffet', labelEn: 'Buffet', labelAr: 'بوفيه', icon: Utensils, cat: 'food' },
  { type: 'round_buffet', labelEn: 'Buffet Island', labelAr: 'بوفيه دائري', icon: Utensils, cat: 'food' },
  { type: 'bar', labelEn: 'Service Bar', labelAr: 'بار ضيافة', icon: Martini, cat: 'food' },
  { type: 'coffee_station', labelEn: 'Coffee Station', labelAr: 'ركن القهوة', icon: Coffee, cat: 'food' },
  { type: 'juice_station', labelEn: 'Juice Station', labelAr: 'ركن العصائر', icon: CupSoda, cat: 'food' },
  { type: 'water_station', labelEn: 'Water Station', labelAr: 'ركن المياه', icon: GlassWater, cat: 'food' },
  { type: 'live_cooking', labelEn: 'Live Cooking', labelAr: 'ركن طبخ مباشر', icon: ChefHat, cat: 'food' },
  { type: 'popcorn_cart', labelEn: 'Popcorn Cart', labelAr: 'عربية فشار', icon: Popcorn, cat: 'food' },
  { type: 'ice_cream_cart', labelEn: 'Ice Cream Cart', labelAr: 'عربية آيس كريم', icon: IceCreamCone, cat: 'food' },
  { type: 'cake', labelEn: 'Wedding Cake', labelAr: 'تورتة الفرح', icon: CakeSlice, cat: 'food', pro: true },
  { type: 'champagne', labelEn: 'Champagne Tower', labelAr: 'برج كاسات', icon: GlassWater, cat: 'food', pro: true },
  { type: 'sweets', labelEn: 'Sweets Table', labelAr: 'طاولة الحلويات', icon: Cookie, cat: 'food', pro: true },
  { type: 'ice_sculpture', labelEn: 'Ice Sculpture', labelAr: 'تمثال ثلج', icon: Snowflake, cat: 'food', pro: true },
  // Decor & flowers
  { type: 'flowers', labelEn: 'Flower Stand', labelAr: 'ستاند ورد', icon: Flower2, cat: 'decor' },
  { type: 'potted_plant', labelEn: 'Potted Plant', labelAr: 'زرعة', icon: Leaf, cat: 'decor' },
  { type: 'palm_tree', labelEn: 'Palm Tree', labelAr: 'نخلة', icon: TreePalm, cat: 'decor' },
  { type: 'light_tree', labelEn: 'Tree with Lights', labelAr: 'شجرة بإضاءة', icon: TreeDeciduous, cat: 'decor' },
  { type: 'column', labelEn: 'Decor Column', labelAr: 'عمود ديكور', icon: Columns3, cat: 'decor' },
  { type: 'backdrop', labelEn: 'Backdrop Wall', labelAr: 'خلفية ديكور', icon: RectangleHorizontal, cat: 'decor' },
  { type: 'balloon_arch', labelEn: 'Balloon Arch', labelAr: 'قوس بالونات', icon: PartyPopper, cat: 'decor' },
  { type: 'balloons', labelEn: 'Balloon Bunch', labelAr: 'باقة بالونات', icon: PartyPopper, cat: 'decor' },
  { type: 'candelabra', labelEn: 'Candelabra', labelAr: 'شمعدان', icon: Flame, cat: 'decor' },
  { type: 'lanterns', labelEn: 'Lantern Set', labelAr: 'فوانيس', icon: Lamp, cat: 'decor' },
  { type: 'welcome_sign', labelEn: 'Welcome Sign', labelAr: 'لوحة ترحيب', icon: Signpost, cat: 'decor' },
  { type: 'red_carpet', labelEn: 'Carpet Runner', labelAr: 'سجادة ممر', icon: Footprints, cat: 'decor' },
  { type: 'flower_arch', labelEn: 'Floral Ring Arch', labelAr: 'قوس ورد دائري', icon: Flower2, cat: 'decor', pro: true },
  { type: 'aisle', labelEn: 'Bridal Aisle', labelAr: 'ممر الزفة', icon: Footprints, cat: 'decor', pro: true },
  { type: 'photo_booth', labelEn: 'Photo Booth Wall', labelAr: 'ركن التصوير', icon: Camera, cat: 'decor', pro: true },
  { type: 'ceiling_florals', labelEn: 'Hanging Florals', labelAr: 'ورد معلّق بالسقف', icon: Flower, cat: 'decor', pro: true },
  { type: 'floral_pillar', labelEn: 'Flower Pillar', labelAr: 'عمود ورد', icon: Flower, cat: 'decor', pro: true },
  { type: 'floral_swing', labelEn: 'Floral Swing', labelAr: 'مرجيحة ورد', icon: Flower2, cat: 'decor', pro: true },
  { type: 'pergola', labelEn: 'Floral Pergola', labelAr: 'برجولا ورد', icon: Tent, cat: 'decor', pro: true },
  { type: 'water_fountain', labelEn: 'Water Fountain', labelAr: 'نافورة', icon: Droplets, cat: 'decor', pro: true },
  // Lights & effects
  { type: 'truss', labelEn: 'Lighting Truss', labelAr: 'جسر إضاءة', icon: Sparkles, cat: 'lighting' },
  { type: 'spotlight', labelEn: 'Spotlight Stand', labelAr: 'ستاند سبوت لايت', icon: Lightbulb, cat: 'lighting' },
  { type: 'uplight', labelEn: 'Uplight', labelAr: 'إضاءة أرضية', icon: Sun, cat: 'lighting' },
  { type: 'moving_head', labelEn: 'Moving Head Light', labelAr: 'موفينج هيد', icon: LampFloor, cat: 'lighting' },
  { type: 'string_lights', labelEn: 'Fairy Light Curtain', labelAr: 'ستارة إضاءة', icon: Sparkle, cat: 'lighting' },
  { type: 'fog_machine', labelEn: 'Fog Machine', labelAr: 'ماكينة دخان', icon: CloudFog, cat: 'lighting' },
  { type: 'chandelier', labelEn: 'Chandelier', labelAr: 'نجفة', icon: LampCeiling, cat: 'lighting' },
  { type: 'crystal_chandelier', labelEn: 'Crystal Chandelier', labelAr: 'نجفة كريستال', icon: Gem, cat: 'lighting', pro: true },
  { type: 'sparklers', labelEn: 'Cold Spark Machine', labelAr: 'ماكينة شرار بارد', icon: Flame, cat: 'lighting', pro: true },
  { type: 'love_letters', labelEn: 'LOVE Light Letters', labelAr: 'حروف LOVE مضيئة', icon: Heart, cat: 'lighting', pro: true },
  { type: 'neon_sign', labelEn: 'Neon Sign', labelAr: 'لافتة نيون', icon: Zap, cat: 'lighting', pro: true },
  // Entrance & services
  { type: 'entrance', labelEn: 'Entrance Portal', labelAr: 'بوابة دخول', icon: DoorOpen, cat: 'services' },
  { type: 'exit', labelEn: 'Exit Portal', labelAr: 'بوابة خروج', icon: DoorOpen, cat: 'services' },
  { type: 'registration', labelEn: 'Registration Desk', labelAr: 'مكتب تسجيل', icon: BookOpen, cat: 'services' },
  { type: 'stanchions', labelEn: 'Rope Barriers', labelAr: 'حواجز حبال', icon: Fence, cat: 'services' },
  { type: 'cloakroom', labelEn: 'Cloakroom', labelAr: 'غرفة المعاطف', icon: Shirt, cat: 'services' },
  { type: 'kids_area', labelEn: 'Kids Play Area', labelAr: 'ركن ألعاب أطفال', icon: Baby, cat: 'services' },
  { type: 'arch_gate', labelEn: 'Classic Arch Gate', labelAr: 'بوابة قوس كلاسيك', icon: Landmark, cat: 'services' },
  { type: 'gift_table', labelEn: 'Gift & Guestbook Table', labelAr: 'طاولة الهدايا ودفتر الضيوف', icon: Gift, cat: 'services', pro: true },
];

export const catalogItem = (type: string) => ITEM_CATALOG.find((item) => item.type === type);
