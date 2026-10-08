import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Utensils,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Flame,
  Coffee,
  PieChart,
  ShieldAlert,
} from 'lucide-react';
import { Language, CateringItem, CateringPackage } from '../types/venueSystem';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface CateringMenuViewProps {
  language: Language;
}

const INITIAL_PACKAGES: CateringPackage[] = [
  {
    id: 'pkg-royal',
    name: 'مأدبة الملوك الإمبراطورية (Imperial Royal Feast)',
    nameEn: 'Imperial Royal Feast',
    pricePerPerson: 220,
    minGuests: 150,
    includesLiveStations: 4,
    coursesCount: 7,
    description: 'الباقة الأكثر فخامة؛ تشمل خراف محشية، محطة سوشي حي، بوفيه سي فود جمبري واستاكوزا، وشلال شوكولاتة بلجيكي.',
    descriptionEn: 'The peak of luxury dining; whole roasted stuffed lambs, live sushi bar, jumbo seafood grill, and Belgian chocolate fountain.',
    items: ['سوشي حي', 'خروف محشي شرقي', 'جمبري جامبو مشوي', 'طاجن سي فود بالموزاريلا', 'بوفيه حلويات فرنسية فاخرة', 'محطة عصائر طبيعية فريش'],
  },
  {
    id: 'pkg-diamond',
    name: 'باقة اللؤلؤة الماسية (Diamond Gala Banquet)',
    nameEn: 'Diamond Gala Banquet',
    pricePerPerson: 160,
    minGuests: 100,
    includesLiveStations: 2,
    coursesCount: 5,
    description: 'تشكيلة متكاملة من المشاوي الشرقية المشكلة، مقبلات لبنانية فاخرة، شاورما نحاسية مقطعة حياً، وحلويات شرقية وغربية.',
    descriptionEn: 'Grand selection of mixed charcoal grills, Lebanese mezze, live brass shawarma carving, and artisanal dessert assortment.',
    items: ['شاورما لحم ودجاج لايف', 'كباب وكفتة ريش ضأن', 'ستيك لحم تندرلوين', 'مقبلات ساخنة وباردة 18 صنف', 'أم علي بالمكسرات وتشيز كيك'],
  },
  {
    id: 'pkg-classic',
    name: 'باقة الزمرد الكلاسيكية (Emerald Banquet)',
    nameEn: 'Emerald Classic Banquet',
    pricePerPerson: 110,
    minGuests: 80,
    includesLiveStations: 1,
    coursesCount: 4,
    description: 'بوفيه متوازن عالي الجودة يضم أطباق الدجاج المحشي، لحوم مشوية، بوفيه سلطات منوع، وحلويات شرقية طازجة.',
    descriptionEn: 'Balanced premium buffet featuring stuffed chicken supremes, roasted beef, extensive salad bar, and fresh oriental pastries.',
    items: ['روستو بتلو بالصوص', 'دجاج بانيه ومحشي مكسرات', 'أرز بسمتي بالمكسرات', '12 صنف مقبلات وسلطات', 'تورتة وحلويات شرقية'],
  },
];

const INITIAL_DISHES: CateringItem[] = [
  {
    id: 'dish-1',
    name: 'محطة الشاورما النحاسية الحية',
    nameEn: 'Live Brass Shawarma Carving Station',
    category: 'live_station',
    description: 'شاورما لحم بلدي ودجاج مع خبز صاج طازج وخبز صاج وصوصات الثومية والطحينة والباربيكيو.',
    descriptionEn: 'Live carving station with prime beef and chicken shawarma served on freshly baked saj bread with gourmet dips.',
    costPerPlate: 32,
    dietaryTags: ['halal'],
    popular: true,
  },
  {
    id: 'dish-2',
    name: 'ريش ضأن وكباب حلبي على الفحم',
    nameEn: 'Charcoal Grilled Lamb Chops & Aleppo Kebab',
    category: 'main',
    description: 'ريش ضأن متبلة بالأعشاب البرية وكباب تركي مميز يقدم ساخناً من شوايات الفحم مباشرة.',
    descriptionEn: 'Tender marinated lamb cutlets and seasoned kebabs skewered and grilled over natural hardwood lump charcoal.',
    costPerPlate: 48,
    dietaryTags: ['halal', 'gluten_free'],
    popular: true,
  },
  {
    id: 'dish-3',
    name: 'بار السوشي الياباني الطازج',
    nameEn: 'Artisan Live Sushi & Sashimi Bar',
    category: 'live_station',
    description: 'طهاة سوشي محترفون يعدون نيجيري، كاليفورنيا رول، وسلمون كرسبي حياً أمام الضيوف.',
    descriptionEn: 'Master sushi chefs rolling fresh sashimi, nigiri, and tempura rolls live before guests.',
    costPerPlate: 55,
    dietaryTags: ['halal', 'gluten_free'],
    popular: true,
  },
  {
    id: 'dish-4',
    name: 'تشكيلة المازة اللبنانية والمقبلات الساخنة',
    nameEn: 'Royal Lebanese Cold & Hot Mezze',
    category: 'appetizer',
    description: 'حمص بالصنوبر، متبل باذنجان مدخن، ورق عنب بدبس الرمان، كبة شامية مقلية، وسمبوسك جبنة بالنعناع.',
    descriptionEn: 'Hummus with pine nuts, smoked mutabbal, vine leaves in pomegranate molasses, and crisp stuffed sambousek.',
    costPerPlate: 18,
    dietaryTags: ['halal', 'vegetarian'],
    popular: false,
  },
  {
    id: 'dish-5',
    name: 'شلال الشوكولاتة البلجيكية والفواكه الاستوائية',
    nameEn: 'Belgian Chocolate Waterfall & Fresh Fruit',
    category: 'dessert',
    description: 'برج شوكولاتة كاليه بلجيكي ثلاثي الأدوار مع قطع الفراولة، الأناناس، والمارشميلو والبراونيز.',
    descriptionEn: 'Multi-tier warm Callebaut Belgian chocolate fondue cascade with organic strawberries, pineapple skewers, and brownies.',
    costPerPlate: 22,
    dietaryTags: ['halal', 'vegetarian'],
    popular: true,
  },
  {
    id: 'dish-6',
    name: 'بار العصائر والموكتيلات الطبيعية المنعشة',
    nameEn: 'Signature Mocktails & Fresh Juice Station',
    category: 'beverage',
    description: 'موكتيل موهيتو باشن فروت، ليمون بالنعناع فريش، مانجو كينيا طبيعي، وعصير رمان طبيعي مثلج.',
    descriptionEn: 'Signature virgin passion fruit mojitos, frozen minted lemonade, fresh Alphonso mango, and cold-pressed pomegranate.',
    costPerPlate: 12,
    dietaryTags: ['halal', 'gluten_free', 'dairy_free'],
    popular: false,
  },
];

export function CateringMenuView({ language }: CateringMenuViewProps) {
  const isAr = language === 'ar';

  const [packages] = useState<CateringPackage[]>(INITIAL_PACKAGES);
  const [dishes, setDishes] = useState<CateringItem[]>(INITIAL_DISHES);
  const [activeTab, setActiveTab] = useState<'packages' | 'dishes'>('packages');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishCost, setNewDishCost] = useState('');
  const [newDishCat, setNewDishCat] = useState<CateringItem['category']>('main');
  const [newDishDesc, setNewDishDesc] = useState('');

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName || !newDishCost) return;

    const newItem: CateringItem = {
      id: `dish-${Date.now()}`,
      name: newDishName,
      nameEn: newDishName,
      category: newDishCat,
      description: newDishDesc || 'صنف بوفيه فندقي فاخر محضر بأجود المكونات الطازجة.',
      descriptionEn: newDishDesc || 'Premium banquet dish prepared with freshly sourced ingredients.',
      costPerPlate: Number(newDishCost),
      dietaryTags: ['halal'],
      popular: false,
    };

    setDishes((prev) => [newItem, ...prev]);
    setIsAddDishModalOpen(false);
    setNewDishName('');
    setNewDishCost('');
    setNewDishDesc('');
    sound.chime();
    confetti({ particleCount: 30, spread: 45 });
  };

  const filteredDishes = dishes.filter((dish) => {
    const matchesCat = activeCategoryFilter === 'all' || dish.category === activeCategoryFilter;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className={`w-full space-y-8 pb-24 ${isAr ? 'text-right' : 'text-left'}`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Utensils className="w-4 h-4" />
            <span>{isAr ? 'المطبخ الفندقي والضيافة الملكية' : 'Banqueting & Gastronomy Suite'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? 'قوائم البوفيه والطهي المباشر' : 'Catering & Buffet Designer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            {isAr
              ? 'إدارة باقات البوفيه المفتوح، أركان الطهي المباشر Live Stations، حساب تكلفة الوجبة للنزيل وهامش الربحية.'
              : 'Configure banquet packages, live cooking stations, plate costing, and dietary certifications.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                sound.click(600);
                setActiveTab('packages');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'packages'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'باقات البوفيه الرئيسية' : 'Banqueting Packages'}
            </button>
            <button
              onClick={() => {
                sound.click(600);
                setActiveTab('dishes');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'dishes'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'كتالوج الأصناف ومحطات الطهي' : 'Dish & Station Catalog'}
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.click(700);
              setIsAddDishModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة صنف جديد' : 'Add New Item'}</span>
          </motion.button>
        </div>
      </div>

      {/* VIEW 1: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <TiltCard
                key={pkg.id}
                tiltMax={4}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-6 relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-mono font-bold mb-2">
                        {pkg.coursesCount} {isAr ? 'أطباق ودورات تقديم' : 'Course Service'}
                      </span>
                      <h3 className="text-lg font-black text-white">{isAr ? pkg.name : pkg.nameEn}</h3>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">{isAr ? 'سعر الفرد للباقة:' : 'Rate Per Guest:'}</span>
                    <span className="text-2xl font-black font-mono text-amber-300">
                      {pkg.pricePerPerson} <span className="text-xs">{isAr ? 'ج.م' : 'EGP'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAr ? pkg.description : pkg.descriptionEn}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">
                      {isAr ? 'أبرز الأصناف المشمولة في الباقة:' : 'Featured Inclusions:'}
                    </div>
                    {pkg.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-200 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {isAr ? `حد أدنى ${pkg.minGuests} فرد` : `Min ${pkg.minGuests} guests`}
                  </span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{pkg.includesLiveStations} {isAr ? 'محطات طهي حي' : 'Live Stations'}</span>
                  </span>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: DISHES & STATIONS */}
      {activeTab === 'dishes' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
              {[
                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                { id: 'live_station', labelAr: 'طهي مباشر Live', labelEn: 'Live Stations' },
                { id: 'main', labelAr: 'الأطباق الرئيسية', labelEn: 'Main Courses' },
                { id: 'appetizer', labelAr: 'المقبلات والمازة', labelEn: 'Appetizers' },
                { id: 'dessert', labelAr: 'الحلويات والشوكولاتة', labelEn: 'Desserts' },
                { id: 'beverage', labelAr: 'المشروبات والعصائر', labelEn: 'Beverages' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    sound.click(550);
                    setActiveCategoryFilter(c.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeCategoryFilter === c.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white bg-slate-950/60'
                  }`}
                >
                  {isAr ? c.labelAr : c.labelEn}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className={`w-3.5 h-3.5 text-slate-500 absolute top-3 ${isAr ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث في الأصناف...' : 'Search items...'}
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 ${
                  isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {dish.category}
                    </span>
                    {dish.popular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {isAr ? 'الأكثر طلباً' : 'Most Popular'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white">{isAr ? dish.name : dish.nameEn}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isAr ? dish.description : dish.descriptionEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{isAr ? 'تكلفة التحضير:' : 'Prep Cost:'}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {dish.costPerPlate} {isAr ? 'ج.م / وجبة' : 'EGP/plate'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add New Dish */}
      <AnimatePresence>
        {isAddDishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-white">
                {isAr ? 'إضافة صنف أو محطة طهي جديدة' : 'Add New Dish or Live Station'}
              </h3>
              <form onSubmit={handleAddDish} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'اسم الصنف أو المحطة:' : 'Dish Name:'}</label>
                  <input
                    type="text"
                    required
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'التصنيف:' : 'Category:'}</label>
                    <select
                      value={newDishCat}
                      onChange={(e) => setNewDishCat(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="main">{isAr ? 'طبق رئيسي' : 'Main'}</option>
                      <option value="live_station">{isAr ? 'محطة طهي حي' : 'Live Station'}</option>
                      <option value="appetizer">{isAr ? 'مقبلات' : 'Appetizer'}</option>
                      <option value="dessert">{isAr ? 'حلويات' : 'Dessert'}</option>
                      <option value="beverage">{isAr ? 'مشروبات' : 'Beverage'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'التكلفة للوجبة (ج.م):' : 'Cost/Plate (EGP):'}</label>
                    <input
                      type="number"
                      required
                      value={newDishCost}
                      onChange={(e) => setNewDishCost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'وصف المكونات والتقديم:' : 'Description:'}</label>
                  <textarea
                    rows={3}
                    value={newDishDesc}
                    onChange={(e) => setNewDishDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                  >
                    {isAr ? 'حفظ الصنف في الكتالوج' : 'Save Dish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddDishModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
