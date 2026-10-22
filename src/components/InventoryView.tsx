import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  CheckCircle2,
  Trash2,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { InventoryItem, Language } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { sound } from '../utils/soundEffects';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onUpdateItemQuantity: (itemId: string, newQty: number, damagedQty?: number) => void;
  onAddItem: (newItem: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  /** Operations staff: can add/edit/delete items but never see or set the buying price or stock value. */
  sellingPricesOnly?: boolean;
  language?: Language;
  onDeleteItem?: (itemId: string) => void;
}

export function InventoryView({
  inventory,
  onUpdateItemQuantity,
  onAddItem,
  onEditItem,
  sellingPricesOnly = false,
  language = 'ar',
  onDeleteItem,
}: InventoryViewProps) {
  const { tr, egp } = makeTr(language);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // New item form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('buffet');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('قطعة');
  const [minThreshold, setMinThreshold] = useState(20);
  const [costPerUnit, setCostPerUnit] = useState(35);
  const [salePrice, setSalePrice] = useState(0);

  const categories = [
    { id: 'all', label: tr('جميع المستلزمات', 'All items') },
    { id: 'buffet', label: tr('مستلزمات البوفيه', 'Buffet supplies') },
    { id: 'serving', label: tr('أدوات التقديم', 'Serving ware') },
    { id: 'decor', label: tr('مستلزمات الديكور', 'Decor supplies') },
    { id: 'operations', label: tr('مستلزمات التشغيل', 'Operations supplies') },
    { id: 'cleaning', label: tr('أدوات النظافة', 'Cleaning supplies') },
  ];

  const filteredItems = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.success();
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: name.trim(),
      category,
      quantity: Number(quantity) || 0,
      unit: unit.trim() || 'قطعة',
      minThreshold: Number(minThreshold) || 10,
      costPerUnit: Number(costPerUnit) || 0,
      salePrice: Number(salePrice) || 0,
      damagedQuantity: 0,
      lastRestockedDate: new Date().toISOString().split('T')[0],
    };

    onAddItem(newItem);
    setIsModalOpen(false);
    setName('');
  };

  const openCreate = () => {
    setEditingItem(null);
    setName('');
    setCategory('buffet');
    setQuantity(100);
    setUnit('قطعة');
    setMinThreshold(20);
    setCostPerUnit(sellingPricesOnly ? 0 : 35);
    setSalePrice(0);
    setIsModalOpen(true);
  };

  const deleteItem = (item: InventoryItem) => {
    if (!onDeleteItem || !window.confirm(tr(`حذف "${item.name}" من المخزون نهائياً؟`, `Delete "${item.name}" from stock for good?`))) return;
    sound.click(400);
    onDeleteItem(item.id);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setMinThreshold(item.minThreshold);
    setCostPerUnit(item.costPerUnit);
    setSalePrice(item.salePrice ?? 0);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const item: InventoryItem = {
      id: editingItem?.id ?? `inv-${Date.now()}`, name: name.trim(), category,
      quantity: Math.max(0, Number(quantity) || 0), unit: unit.trim() || 'قطعة',
      minThreshold: Math.max(0, Number(minThreshold) || 0),
      // Selling-price-only staff never touch the buying price: keep the existing one (new items start at 0 for a manager to fill).
      costPerUnit: sellingPricesOnly ? (editingItem?.costPerUnit ?? 0) : Math.max(0, Number(costPerUnit) || 0),
      salePrice: Math.max(0, Number(salePrice) || 0), damagedQuantity: editingItem?.damagedQuantity ?? 0,
      lastRestockedDate: editingItem?.lastRestockedDate ?? new Date().toISOString().split('T')[0],
    };
    sound.success();
    if (editingItem) onEditItem(item); else onAddItem(item);
    setIsModalOpen(false); setEditingItem(null); setName('');
  };

  return (
    <div className="w-full space-y-6 pb-20 text-start">
      {/* Top Banner & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span>{tr('المخزون والمستلزمات وأدوات الضيافة', 'Inventory & supplies')}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {tr('متابعة عهدة القاعات، أدوات التقديم، الجرد، التالف، وتنبيهات الحد الأدنى', 'Track hall stock, serving ware, stock counts, damage and low-stock alerts')}
          </p>
        </div>

        <button
          onClick={() => {
            sound.click(650);
            openCreate();
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{tr('إضافة صنف جديد للمخزون', 'Add item')}</span>
        </button>
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

      {/* Inventory Items Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isLowStock = item.quantity <= item.minThreshold;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                isLowStock
                  ? 'bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-950/20'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">{item.name}</h3>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    {tr('آخر جرد وتوريد', 'Last restock')}: {item.lastRestockedDate}
                  </span>
                </div>

                {isLowStock && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{tr('نقص مخزون', 'Low stock')}</span>
                  </span>
                )}
              </div>

              {/* Quantity Gauge */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{tr('الرصيد الحالي', 'In stock')}</span>
                  <span className={`font-bold tabular-nums text-sm ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {item.quantity}
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans block">{item.unit}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{tr('الحد الأدنى', 'Minimum')}</span>
                  <span className="font-bold text-slate-300 tabular-nums text-sm">
                    {item.minThreshold}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans block">{tr('للتنبيه', 'alert level')}</span>
                </div>

                {!sellingPricesOnly && <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{tr('قيمة المخزون', 'Stock value')}</span>
                  <span className="font-bold text-amber-300 tabular-nums text-sm">
                    {egp((item.quantity * item.costPerUnit))}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans block">{tr('بسعر التكلفة', 'at cost')}</span>
                </div>}

                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">{tr('التالف / كسر', 'Damaged')}</span>
                  <span className="font-bold text-rose-400 tabular-nums text-sm">
                    {item.damagedQuantity}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans block">{tr('هالك', 'written off')}</span>
                </div>
              </div>

              {/* Quick Stock Adjustment buttons */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  {!sellingPricesOnly && <>{tr('شراء', 'Cost')}: {egp(item.costPerUnit)} · </>}{tr('بيع', 'Price')}: {egp(item.salePrice ?? 0)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(item)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                  >{tr('تعديل', 'Edit')}</button>
                  {onDeleteItem && <button
                    onClick={() => deleteItem(item)}
                    aria-label={tr(`حذف ${item.name}`, `Delete ${item.name}`)}
                    title={tr('حذف الصنف', 'Delete item')}
                    className="p-1.5 rounded-lg border border-red-900/60 text-red-300 hover:bg-red-950/40 cursor-pointer"
                  ><Trash2 className="w-3.5 h-3.5" /></button>}
                  <button
                    onClick={() => {
                      sound.tick();
                      onUpdateItemQuantity(item.id, Math.max(0, item.quantity - 10));
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer"
                    title={tr('صرف 10 وحدات', 'Issue 10 units')}
                  >
                    −10 {tr('صرف', 'issue')}
                  </button>
                  <button
                    onClick={() => {
                      sound.click(600);
                      onUpdateItemQuantity(item.id, item.quantity + 50);
                    }}
                    className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-mono text-[11px] cursor-pointer"
                    title={tr('وارد 50 وحدة', 'Receive 50 units')}
                  >
                    +50 {tr('توريد', 'receive')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Inventory Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-start">
            <h3 className="text-base font-bold text-white mb-4">{editingItem ? tr('تعديل الصنف', 'Edit item') : tr('إضافة مستلزم / صنف جديد', 'Add item')}</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('اسم الصنف', 'Item name')}</label>
                <input
                  type="text"
                  required
                  placeholder={tr('مثال: مناديل سفرة مطبوعة شعار القاعة', 'e.g. Printed napkins with the hall logo')}
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
                    onChange={(e) => setCategory(e.target.value as InventoryItem['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="buffet">{tr('مستلزمات البوفيه', 'Buffet supplies')}</option>
                    <option value="serving">{tr('أدوات التقديم', 'Serving ware')}</option>
                    <option value="decor">{tr('مستلزمات الديكور', 'Decor supplies')}</option>
                    <option value="operations">{tr('مستلزمات التشغيل', 'Operations supplies')}</option>
                    <option value="cleaning">{tr('أدوات النظافة', 'Cleaning supplies')}</option>
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

              <div className={`grid grid-cols-2 gap-3 ${sellingPricesOnly ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('الكمية الحالية', 'Quantity')}</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('الحد الأدنى', 'Minimum')}</label>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                {!sellingPricesOnly && <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('سعر الشراء', 'Cost price')}</label>
                  <input
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('سعر البيع', 'Selling price')}</label>
                  <input type="number" min="0" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono" />
                </div>
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
                  {editingItem ? tr('حفظ التعديلات', 'Save changes') : tr('حفظ الصنف', 'Save item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
