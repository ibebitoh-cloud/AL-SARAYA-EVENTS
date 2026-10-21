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
  Pencil,
} from 'lucide-react';
import { ServiceDefinition, Language } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';
import { RowActions } from './RecordEditor';

interface ServicesViewProps {
  services: ServiceDefinition[];
  onAddService: (newService: ServiceDefinition) => void;
  onUpdateService: (updatedService: ServiceDefinition) => void;
  /** Operations staff: show selling prices only (no cost, margin or editing). */
  sellingPricesOnly?: boolean;
  language?: Language;
  onDeleteService?: (serviceId: string) => void;
}

export function ServicesView({ services, onAddService, onUpdateService, sellingPricesOnly = false, language = 'ar', onDeleteService }: ServicesViewProps) {
  const { tr, egp } = makeTr(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDefinition | null>(null);

  // New Service form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceDefinition['category']>('buffet');
  const [defaultPrice, setDefaultPrice] = useState(2500);
  const [defaultCost, setDefaultCost] = useState(1200);
  const [unit, setUnit] = useState('مناسبة');
  const [description, setDescription] = useState('');

  const categories = [
    { id: 'all', label: tr('جميع الخدمات', 'All services') },
    { id: 'buffet', label: tr('بوفيه وضيافة', 'Buffet & catering') },
    { id: 'kosha', label: tr('كوشة العروس', 'Bridal kosha') },
    { id: 'decor', label: tr('ديكور وزهور', 'Decor & flowers') },
    { id: 'lighting', label: tr('إضاءة وليزر', 'Lighting & lasers') },
    { id: 'sound_dj', label: tr('صوتيات ودي جي', 'Sound & DJ') },
    { id: 'photography', label: tr('تصوير وفيديو', 'Photo & video') },
    { id: 'screen', label: tr('شاشات عرض', 'Screens') },
    { id: 'hospitality', label: tr('خدمة تنظيم', 'Event staff') },
    { id: 'tables_chairs', label: tr('طاولات وكراسي', 'Tables & chairs') },
  ];

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setCategory('buffet');
    setDefaultPrice(2500);
    setDefaultCost(1200);
    setUnit('مناسبة');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceDefinition) => {
    setEditingService(service);
    setName(service.name);
    setCategory(service.category);
    setDefaultPrice(service.defaultPrice);
    setDefaultCost(service.defaultCost);
    setUnit(service.unit);
    setDescription(service.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sound.success();
    const updatedService: ServiceDefinition = {
      id: editingService?.id || `srv-${Date.now()}`,
      name: name.trim(),
      category,
      defaultPrice: Number(defaultPrice) || 0,
      defaultCost: Number(defaultCost) || 0,
      unit: unit.trim() || 'مناسبة',
      description: description.trim(),
    };
    if (editingService) onUpdateService(updatedService);
    else onAddService(updatedService);
    setIsModalOpen(false);
    setEditingService(null);
    setName('');
    setDescription('');
  };

  return (
    <div className="w-full space-y-6 pb-20 text-start">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-indigo-400" />
            <span>{tr('دليل الخدمات والإضافات الفندقية', 'Services & add-ons')}</span>
          </h2>
          <p className="text-xs text-slate-400">{sellingPricesOnly ? tr('أسعار البيع المعتمدة لكل خدمة', 'Approved selling price for each service') : tr('تحديد أسعار البيع وتكلفة كل خدمة ومتابعة ربحيتها', 'Set selling price and cost for each service and track margins')}</p>
        </div>

        {!sellingPricesOnly && <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.click(650);
              openCreateModal();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr('إضافة خدمة جديدة', 'Add service')}</span>
          </button>
        </div>}
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
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold">
                    {srv.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">{srv.name}</h3>
                </div>
                {!sellingPricesOnly && <button type="button" onClick={() => openEditModal(srv)} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 text-xs font-semibold" aria-label={`${tr('تعديل', 'Edit')} ${srv.name}`}>
                  <Pencil className="w-3.5 h-3.5" /> {tr('تعديل', 'Edit')}
                </button>}
                {!sellingPricesOnly && onDeleteService && <RowActions language={language} onDelete={() => onDeleteService(srv.id)} />}
              </div>

              {srv.description && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {srv.description}
                </p>
              )}

              {/* Price, Cost & Profit Tally */}
              <div className={`pt-3 border-t border-slate-800/80 grid gap-2 text-center text-xs font-mono ${sellingPricesOnly ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <div className="p-2 rounded-xl bg-slate-950/70">
                  <span className="text-[10px] text-slate-500 block font-sans">{tr('سعر البيع', 'Selling price')}</span>
                  <span className="font-bold text-white tabular-nums">
                    {egp(srv.defaultPrice)}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">{tr('لكل', 'per')} {srv.unit}</span>
                </div>

                {!sellingPricesOnly && <>
                <div className="p-2 rounded-xl bg-slate-950/70">
                  <span className="text-[10px] text-slate-500 block font-sans">{tr('التكلفة', 'Cost')}</span>
                  <span className="font-bold text-rose-300 tabular-nums">
                    {egp(srv.defaultCost)}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">{tr('تكلفة تقديرية', 'estimated')}</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/70">
                  <span className="text-[10px] text-slate-500 block font-sans">{tr('هامش الربح', 'Margin')}</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {margin}%
                  </span>
                  <span className="text-[9px] text-emerald-500 block font-sans">+{profit.toLocaleString()}</span>
                </div>
                </>}
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* Add New Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-start">
            <h3 className="text-base font-bold text-white mb-4">{editingService ? tr('تعديل الخدمة الحالية', 'Edit service') : tr('إضافة خدمة أو باقة جديدة', 'Add service or package')}</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('اسم الخدمة', 'Service name')}</label>
                <input
                  type="text"
                  required
                  placeholder={tr('مثال: عربة آيس كريم وفشار', 'e.g. Ice cream & popcorn cart')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('القسم', 'Category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceDefinition['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="buffet">{tr('بوفيه', 'Buffet')}</option>
                    <option value="kosha">{tr('كوشة', 'Kosha')}</option>
                    <option value="decor">{tr('ديكور', 'Decor')}</option>
                    <option value="lighting">{tr('إضاءة', 'Lighting')}</option>
                    <option value="sound_dj">{tr('صوتيات ودي جي', 'Sound & DJ')}</option>
                    <option value="photography">{tr('تصوير', 'Photography')}</option>
                    <option value="screen">{tr('شاشات', 'Screens')}</option>
                    <option value="hospitality">{tr('تنظيم وضيافة', 'Event staff & hospitality')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('الوحدة', 'Unit')}</label>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('سعر البيع للعميل', 'Client price')}</label>
                  <input
                    type="number"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('تكلفة الخدمة', 'Service cost')}</label>
                  <input
                    type="number"
                    value={defaultCost}
                    onChange={(e) => setDefaultCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('الوصف والتفاصيل', 'Description')}</label>
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
                  {tr('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {editingService ? tr('حفظ التعديلات', 'Save changes') : tr('حفظ الخدمة', 'Save service')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
