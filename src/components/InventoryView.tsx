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
import { InventoryItem } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onUpdateItemQuantity: (itemId: string, newQty: number, damagedQty?: number) => void;
  onAddItem: (newItem: InventoryItem) => void;
}

export function InventoryView({
  inventory,
  onUpdateItemQuantity,
  onAddItem,
}: InventoryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New item form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('buffet');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('قطعة');
  const [minThreshold, setMinThreshold] = useState(20);
  const [costPerUnit, setCostPerUnit] = useState(35);

  const categories = [
    { id: 'all', label: 'جميع المستلزمات' },
    { id: 'buffet', label: 'مستلزمات البوفيه' },
    { id: 'serving', label: 'أدوات التقديم' },
    { id: 'decor', label: 'مستلزمات الديكور' },
    { id: 'operations', label: 'مستلزمات التشغيل' },
    { id: 'cleaning', label: 'أدوات النظافة' },
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
      damagedQuantity: 0,
      lastRestockedDate: new Date().toISOString().split('T')[0],
    };

    onAddItem(newItem);
    setIsModalOpen(false);
    setName('');
  };

  return (
    <div className="w-full space-y-6 pb-20 text-right">
      {/* Top Banner & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span>المخزون والمستلزمات وأدوات الضيافة</span>
          </h2>
          <p className="text-xs text-slate-400">
            متابعة عهدة القاعات، أدوات التقديم، الجرد، التالف، وتنبيهات الحد الأدنى
          </p>
        </div>

        <button
          onClick={() => {
            sound.click(650);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة صنف جديد للمخزون</span>
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
                    آخر جرد وتوريد: {item.lastRestockedDate}
                  </span>
                </div>

                {isLowStock && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    <span>نقص مخزون</span>
                  </span>
                )}
              </div>

              {/* Quantity Gauge */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">الرصيد الحالي</span>
                  <span className={`font-bold tabular-nums text-sm ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {item.quantity}
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans block">{item.unit}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">الحد الأدنى</span>
                  <span className="font-bold text-slate-300 tabular-nums text-sm">
                    {item.minThreshold}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans block">للتنبيه</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">التالف / كسر</span>
                  <span className="font-bold text-rose-400 tabular-nums text-sm">
                    {item.damagedQuantity}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans block">هالك</span>
                </div>
              </div>

              {/* Quick Stock Adjustment buttons */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  تكلفة الوحدة: {item.costPerUnit} ج.م
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      sound.tick();
                      onUpdateItemQuantity(item.id, Math.max(0, item.quantity - 10));
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer"
                    title="صرف 10 وحدات"
                  >
                    −10 صرف
                  </button>
                  <button
                    onClick={() => {
                      sound.click(600);
                      onUpdateItemQuantity(item.id, item.quantity + 50);
                    }}
                    className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-mono text-[11px] cursor-pointer"
                    title="وارد 50 وحدة"
                  >
                    +50 توريد
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
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-right">
            <h3 className="text-base font-bold text-white mb-4">إضافة مستلزم / صنف جديد</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الصنف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مناديل سفرة مطبوعة شعار القاعة"
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
                    onChange={(e) => setCategory(e.target.value as InventoryItem['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="buffet">مستلزمات البوفيه</option>
                    <option value="serving">أدوات التقديم</option>
                    <option value="decor">مستلزمات الديكور</option>
                    <option value="operations">مستلزمات التشغيل</option>
                    <option value="cleaning">أدوات النظافة</option>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الكمية الحالية</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الحد الأدنى</label>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">سعر التكلفة</label>
                  <input
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
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
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
