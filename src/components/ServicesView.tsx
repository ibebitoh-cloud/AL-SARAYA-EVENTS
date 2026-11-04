import { useState } from 'react';
import { m as motion } from 'motion/react';
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
  ImageOff,
  MapPin,
  ArrowLeftRight,
} from 'lucide-react';
import { Hall, ServiceDefinition, Language, PriceBook, PriceEntry, PriceLocationId } from '../types/venueSystem';
import { PRICE_LOCATIONS, hallLocation, priceLocationName } from '../data/locations';
import { servicePriceAt, setServicePrices } from '../data/pricing';
import { makeTr } from '../utils/tr';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';
import { RowActions, ImageField } from './RecordEditor';

interface ServicesViewProps {
  services: ServiceDefinition[];
  onAddService: (newService: ServiceDefinition) => void;
  onUpdateService: (updatedService: ServiceDefinition) => void;
  /** Operations staff: show selling prices only (no cost, margin or editing). */
  sellingPricesOnly?: boolean;
  language?: Language;
  onDeleteService?: (serviceId: string) => void;
  /** Each service has its own price at Arcane, Porto and any other place. */
  priceBook: PriceBook;
  onUpdatePriceBook: (book: PriceBook) => void;
  halls?: Hall[];
}

type PlacePrices = Record<PriceLocationId, PriceEntry>;

export function ServicesView({ services, onAddService, onUpdateService, sellingPricesOnly = false, language = 'ar', onDeleteService, priceBook, onUpdatePriceBook, halls = [] }: ServicesViewProps) {
  const { tr, egp, isAr } = makeTr(language);
  /** The place is chosen first; services and their prices are shown for that place only. */
  const [place, setPlace] = useState<PriceLocationId | null>(null);
  const [prices, setPrices] = useState<PlacePrices>({ arcane: { price: 2500, cost: 1200 }, porto: { price: 2500, cost: 1200 }, other: { price: 2500, cost: 1200 } });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDefinition | null>(null);

  // New Service form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceDefinition['category']>('buffet');
  const [unit, setUnit] = useState('مناسبة');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const missingPhotos = services.filter((s) => !s.photoUrl?.trim()).length;

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
    const start = { price: 2500, cost: 1200 };
    setPrices({ arcane: start, porto: start, other: start });
    setUnit('مناسبة');
    setDescription('');
    setPhotoUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceDefinition) => {
    setEditingService(service);
    setName(service.name);
    setCategory(service.category);
    setPrices({
      arcane: servicePriceAt(priceBook, 'arcane', service),
      porto: servicePriceAt(priceBook, 'porto', service),
      other: servicePriceAt(priceBook, 'other', service),
    });
    setUnit(service.unit);
    setDescription(service.description || '');
    setPhotoUrl(service.photoUrl || '');
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
      // The catalogue default follows the Arcane price; each place keeps its own price in the price book.
      defaultPrice: Number(prices.arcane.price) || 0,
      defaultCost: Number(prices.arcane.cost) || 0,
      unit: unit.trim() || 'مناسبة',
      description: description.trim(),
      photoUrl: photoUrl.trim() || undefined,
    };
    if (editingService) onUpdateService(updatedService);
    else onAddService(updatedService);
    onUpdatePriceBook(setServicePrices(priceBook, updatedService.id, prices));
    setIsModalOpen(false);
    setEditingService(null);
    setName('');
    setDescription('');
  };

  const placeHalls = (id: PriceLocationId) => id === 'other' ? [] : halls.filter((h) => !h.isExternalListing && hallLocation(h) === id);

  if (!place) {
    return (
      <div className="w-full space-y-6 pb-20 text-start">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span>{tr('اختر المكان أولاً', 'Choose the place first')}</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">{tr('لكل مكان أسعار خدمات خاصة به. اختر المكان لعرض خدماته وأسعارها.', 'Each place has its own service prices. Pick a place to see its services and prices.')}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PRICE_LOCATIONS.map((loc) => {
            const hallsHere = placeHalls(loc.id);
            return (
              <button key={loc.id} type="button" onClick={() => { sound.click(620); setPlace(loc.id); }}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-start transition hover:border-amber-400/70 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950"><MapPin className="h-5 w-5" /></span>
                <span className="text-lg font-black text-white">{isAr ? loc.nameAr : loc.nameEn}</span>
                <span className="text-xs leading-5 text-slate-400">
                  {loc.id === 'other'
                    ? tr('مكان العميل أو أي مكان خارج قاعاتنا', "The client's own venue or any place outside our halls")
                    : hallsHere.length ? hallsHere.map((h) => (isAr ? h.name : h.nameEn || h.name)).join(' · ') : tr('قاعات هذا الموقع', 'Halls at this location')}
                </span>
                <span className="mt-auto text-[11px] font-bold text-amber-300">{tr(`${services.length} خدمة ←`, `${services.length} services →`)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20 text-start">
      {/* Chosen place */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3">
        <MapPin className="h-4 w-4 text-amber-300" />
        <span className="text-xs text-amber-100/80">{tr('المكان:', 'Place:')}</span>
        <strong className="text-sm text-white">{priceLocationName(place, isAr)}</strong>
        <div className="ms-auto flex flex-wrap gap-1.5">
          {PRICE_LOCATIONS.filter((l) => l.id !== place).map((l) => (
            <button key={l.id} type="button" onClick={() => { sound.click(560); setPlace(l.id); }} className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white">
              <ArrowLeftRight className="h-3 w-3" /> {isAr ? l.nameAr : l.nameEn}
            </button>
          ))}
        </div>
      </div>

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

      {!sellingPricesOnly && missingPhotos > 0 && (
        <div role="note" className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-xs font-semibold text-amber-200">
          <ImageOff className="h-4 w-4 shrink-0" />
          {tr(`${missingPhotos} خدمة بدون صورة. العملاء يرون صورة كل خدمة في الموقع ونموذج الحجز، فأضف صورة من زر «تعديل».`, `${missingPhotos} service(s) have no photo. Customers see each service's photo on the website and in the booking form, so add one with "Edit".`)}
        </div>
      )}

      {/* Services Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((srv) => {
          const here = servicePriceAt(priceBook, place, srv);
          const profit = here.price - here.cost;
          const margin = here.price > 0 ? Math.round((profit / here.price) * 100) : 0;

          return (
            <TiltCard
              key={srv.id}
              tiltMax={4}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
            >
              <div className="-mx-5 -mt-5 mb-1 h-36 overflow-hidden rounded-t-2xl bg-slate-950">
                {srv.photoUrl ? <img src={srv.photoUrl} alt={srv.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-1 text-[11px] text-slate-500"><ImageOff className="h-5 w-5" />{tr('لا توجد صورة', 'No photo yet')}</div>}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold">
                    {categories.find((c) => c.id === srv.category)?.label ?? srv.category}
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
                    {egp(here.price)}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">{tr('لكل', 'per')} {srv.unit}</span>
                </div>

                {!sellingPricesOnly && <>
                <div className="p-2 rounded-xl bg-slate-950/70">
                  <span className="text-[10px] text-slate-500 block font-sans">{tr('التكلفة', 'Cost')}</span>
                  <span className="font-bold text-rose-300 tabular-nums">
                    {egp(here.cost)}
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
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-start">
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
                    <option value="tables_chairs">{tr('طاولات وكراسي', 'Tables & chairs')}</option>
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

              <fieldset className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                <legend className="px-1 text-xs font-semibold text-amber-300">{tr('السعر في كل مكان', 'Price at each place')}</legend>
                <div className="grid grid-cols-[1fr_6.5rem_6.5rem] items-center gap-2 text-[10px] font-semibold text-slate-500">
                  <span>{tr('المكان', 'Place')}</span><span>{tr('سعر البيع', 'Client price')}</span><span>{tr('التكلفة', 'Cost')}</span>
                </div>
                {PRICE_LOCATIONS.map((loc) => (
                  <div key={loc.id} className={`grid grid-cols-[1fr_6.5rem_6.5rem] items-center gap-2 rounded-xl p-1 ${loc.id === place ? 'bg-amber-400/10' : ''}`}>
                    <span className="flex items-center gap-1 text-xs font-semibold text-white"><MapPin className="h-3 w-3 text-amber-300" />{isAr ? loc.nameAr : loc.nameEn}</span>
                    <input type="number" min={0} aria-label={`${tr('سعر البيع', 'Client price')} · ${isAr ? loc.nameAr : loc.nameEn}`} value={prices[loc.id].price}
                      onChange={(e) => { const v = Math.max(0, Number(e.target.value) || 0); setPrices((p) => ({ ...p, [loc.id]: { ...p[loc.id], price: v } })); }}
                      className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono" />
                    <input type="number" min={0} aria-label={`${tr('التكلفة', 'Cost')} · ${isAr ? loc.nameAr : loc.nameEn}`} value={prices[loc.id].cost}
                      onChange={(e) => { const v = Math.max(0, Number(e.target.value) || 0); setPrices((p) => ({ ...p, [loc.id]: { ...p[loc.id], cost: v } })); }}
                      className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono" />
                  </div>
                ))}
              </fieldset>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('الوصف والتفاصيل', 'Description')}</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white resize-none"
                />
              </div>

              <ImageField label={tr('صورة الخدمة (تظهر للعملاء)', 'Service photo (shown to customers)')} value={photoUrl} onChange={setPhotoUrl} language={language} />

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
