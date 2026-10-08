import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Utensils,
  Plus,
  Sparkles,
  Search,
  DollarSign,
  TrendingUp,
  Tag,
  Layers,
  Check,
} from 'lucide-react';
import { ServiceDefinition } from '../types/venueSystem';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface ServicesViewProps {
  services: ServiceDefinition[];
  onAddService: (newService: ServiceDefinition) => void;
}

export function ServicesView({ services, onAddService }: ServicesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Service form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceDefinition['category']>('buffet');
  const [defaultPrice, setDefaultPrice] = useState(2500);
  const [defaultCost, setDefaultCost] = useState(1200);
  const [unit, setUnit] = useState('مناسبة');
  const [description, setDescription] = useState('');

  const categories = [
    { id: 'all', label: 'جميع الخدمات' },
    { id: 'buffet', label: 'بوفيه وضيافة' },
    { id: 'kosha', label: 'كوشة العروس' },
    { id: 'decor', label: 'ديكور وزهور' },
    { id: 'lighting', label: 'إضاءة وليزر' },
    { id: 'sound_dj', label: 'صوتيات ودي جي' },
    { id: 'photography', label: 'تصوير وفيديو' },
    { id: 'screen', label: 'شاشات عرض' },
    { id: 'hospitality', label: 'خدمة تنظيم' },
    { id: 'tables_chairs', label: 'طاولات وكراسي' },
  ];

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.success();
    const newService: ServiceDefinition = {
      id: `srv-${Date.now()}`,
      name: name.trim(),
      category,
      defaultPrice: Number(defaultPrice) || 1000,
      defaultCost: Number(defaultCost) || 500,
      unit: unit.trim() || 'مناسبة',
      description: description.trim(),
    };

    onAddService(newService);
    setIsModalOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="w-full space-y-6 pb-20 text-right">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-indigo-400" />
            <span>دليل الخدمات والإضافات الفندقية</span>
          </h2>
          <p className="text-xs text-slate-400">تحديد أسعار البيع وتكلفة كل خدمة ومتابعة ربحيتها</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.click(650);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة خدمة جديدة</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              sound.click(500);
              setSelectedCategory(cat.id);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((srv) => {
          const profit = srv.defaultPrice - srv.defaultCost;
          const margin = srv.defaultPrice > 0 ? Math.round((profit / srv.defaultPrice) * 100) : 0;

          return (
            <TiltCard
              key={srv.id}
              tiltMax={4}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold">
                    {srv.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">{srv.name}</h3>
                </div>
              </div>

              {srv.description && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {srv.description}
                </p>
              )}

              {/* Price, Cost & Profit Tally */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-950/70">
                  <span className="text-[10px] text-slate-500 block font-sans">سعر البيع</span>
                  <span className="font-bold text-white tabular-nums">
                    {srv.defaultPrice.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">لكل {srv.unit}</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/70">
                  <span className="text-[10px] text-slate-500 block font-sans">التكلفة</span>
                  <span className="font-bold text-rose-300 tabular-nums">
                    {srv.defaultCost.toLocaleString()} ج.م
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">تكلفة تقديرية</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/70">
                  <span className="text-[10px] text-slate-500 block font-sans">هامش الربح</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {margin}%
                  </span>
                  <span className="text-[9px] text-emerald-500 block font-sans">+{profit.toLocaleString()}</span>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* Add New Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-right">
            <h3 className="text-base font-bold text-white mb-4">إضافة خدمة أو باقة جديدة</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الخدمة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عربة آيس كريم وفشار"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">القسم</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceDefinition['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="buffet">بوفيه</option>
                    <option value="kosha">كوشة</option>
                    <option value="decor">ديكور</option>
                    <option value="lighting">إضاءة</option>
                    <option value="sound_dj">صوتيات ودي جي</option>
                    <option value="photography">تصوير</option>
                    <option value="screen">شاشات</option>
                    <option value="hospitality">تنظيم وضيافة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">سعر البيع للعميل</label>
                  <input
                    type="number"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">تكلفة الخدمة</label>
                  <input
                    type="number"
                    value={defaultCost}
                    onChange={(e) => setDefaultCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الوصف والتفاصيل</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  حفظ الخدمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
