import { useState } from 'react';
import { MapPin, Copy, Tags } from 'lucide-react';
import { Hall, LocationId, PriceBook, PriceEntry, ServiceDefinition } from '../types/venueSystem';
import { LOCATIONS, hallLocation } from '../data/locations';
import { EVENT_PACKAGES, packagePriceAt, servicePriceAt } from '../data/pricing';
import { eventTypeConfig } from '../data/eventTypes';

interface Props {
  halls: Hall[];
  services: ServiceDefinition[];
  priceBook: PriceBook;
  onUpdatePriceBook: (book: PriceBook) => void;
  onUpdateHall: (hall: Hall) => void;
}

const num = 'w-28 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono text-center focus:outline-none focus:border-amber-400';
const th = 'px-3 py-2 text-[11px] font-semibold text-slate-400 text-right';
const td = 'px-3 py-2 text-xs text-slate-200';

/** Manager screen: each location (Arcane / Porto) has its own full price list. */
export function PriceListsView({ halls, services, priceBook, onUpdatePriceBook, onUpdateHall }: Props) {
  const [loc, setLoc] = useState<LocationId>('arcane');
  const other: LocationId = loc === 'arcane' ? 'porto' : 'arcane';
  const locHalls = halls.filter((h) => hallLocation(h) === loc);

  const setEntry = (kind: 'packages' | 'services', id: string, patch: Partial<PriceEntry>, current: PriceEntry) => {
    onUpdatePriceBook({
      ...priceBook,
      [loc]: { ...priceBook[loc], [kind]: { ...priceBook[loc][kind], [id]: { ...current, ...patch } } },
    });
  };

  const copyFromOther = () => {
    const from = LOCATIONS.find((l) => l.id === other)?.nameAr;
    const to = LOCATIONS.find((l) => l.id === loc)?.nameAr;
    if (!window.confirm(`نسخ أسعار الباقات والخدمات من ${from} إلى ${to}؟ سيتم استبدال أسعار ${to} الحالية.`)) return;
    onUpdatePriceBook({ ...priceBook, [loc]: JSON.parse(JSON.stringify(priceBook[other])) });
  };

  const margin = (e: PriceEntry) => (e.price > 0 ? Math.round(((e.price - e.cost) / e.price) * 100) : 0);

  return (
    <div className="w-full space-y-5 pb-20 text-right">
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Tags className="w-5 h-5 text-amber-400" /> قوائم الأسعار حسب المكان</h2>
          <p className="text-xs text-slate-400 mt-1">لكل مكان قائمة أسعار كاملة خاصة به: إيجار القاعات، الباقات، والخدمات. فريق العمليات يرى أسعار البيع فقط.</p>
        </div>
        <div className="flex items-center gap-2">
          {LOCATIONS.map((l) => (
            <button key={l.id} type="button" onClick={() => setLoc(l.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border ${loc === l.id ? 'bg-amber-400 text-slate-950 border-amber-300' : 'border-slate-700 text-slate-300 hover:text-white'}`}>
              <MapPin className="w-3.5 h-3.5" /> {l.nameAr}
            </button>
          ))}
          <button type="button" onClick={copyFromOther} title="نسخ من المكان الآخر" className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-700 text-[11px] text-slate-400 hover:text-white">
            <Copy className="w-3.5 h-3.5" /> نسخ من {LOCATIONS.find((l) => l.id === other)?.nameAr}
          </button>
        </div>
      </div>

      {/* Halls */}
      <section className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
        <h3 className="px-4 pt-4 text-sm font-bold text-amber-300">إيجار القاعات</h3>
        <table className="w-full mt-2">
          <thead><tr className="border-b border-slate-800"><th className={th}>القاعة</th><th className={th}>السعة (فرد)</th><th className={th}>سعر الإيجار (ج.م)</th></tr></thead>
          <tbody>
            {locHalls.map((h) => (
              <tr key={h.id} className="border-b border-slate-800/60">
                <td className={td}><span className="inline-block w-2 h-2 rounded-full ms-1" style={{ background: h.color }} /> {h.name}</td>
                <td className={td}><input type="number" className={num} value={h.capacity} onChange={(e) => onUpdateHall({ ...h, capacity: Number(e.target.value) || 0 })} /></td>
                <td className={td}><input type="number" className={num} value={h.basePrice} onChange={(e) => onUpdateHall({ ...h, basePrice: Number(e.target.value) || 0 })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Packages */}
      <section className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
        <h3 className="px-4 pt-4 text-sm font-bold text-amber-300">الباقات (السعر للفرد)</h3>
        <table className="w-full mt-2">
          <thead><tr className="border-b border-slate-800"><th className={th}>الباقة</th><th className={th}>النوع</th><th className={th}>سعر البيع</th><th className={th}>التكلفة</th><th className={th}>الهامش</th></tr></thead>
          <tbody>
            {EVENT_PACKAGES.map((p) => {
              const e = packagePriceAt(priceBook, loc, p.id);
              return (
                <tr key={p.id} className="border-b border-slate-800/60">
                  <td className={td}>{p.nameAr}</td>
                  <td className={`${td} text-slate-400`}>{p.eventTypes.map((t) => eventTypeConfig(t).ar).join('، ')}</td>
                  <td className={td}><input type="number" className={num} value={e.price} onChange={(ev) => setEntry('packages', p.id, { price: Number(ev.target.value) || 0 }, e)} /></td>
                  <td className={td}><input type="number" className={`${num} text-rose-300`} value={e.cost} onChange={(ev) => setEntry('packages', p.id, { cost: Number(ev.target.value) || 0 }, e)} /></td>
                  <td className={`${td} font-mono text-emerald-400`}>{margin(e)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Services */}
      <section className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
        <h3 className="px-4 pt-4 text-sm font-bold text-amber-300">الخدمات والإضافات</h3>
        <table className="w-full mt-2">
          <thead><tr className="border-b border-slate-800"><th className={th}>الخدمة</th><th className={th}>الوحدة</th><th className={th}>سعر البيع</th><th className={th}>التكلفة</th><th className={th}>الهامش</th></tr></thead>
          <tbody>
            {services.map((s) => {
              const e = servicePriceAt(priceBook, loc, s);
              return (
                <tr key={s.id} className="border-b border-slate-800/60">
                  <td className={td}>{s.name}</td>
                  <td className={`${td} text-slate-400`}>{s.unit}</td>
                  <td className={td}><input type="number" className={num} value={e.price} onChange={(ev) => setEntry('services', s.id, { price: Number(ev.target.value) || 0 }, e)} /></td>
                  <td className={td}><input type="number" className={`${num} text-rose-300`} value={e.cost} onChange={(ev) => setEntry('services', s.id, { cost: Number(ev.target.value) || 0 }, e)} /></td>
                  <td className={`${td} font-mono text-emerald-400`}>{margin(e)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <p className="text-[11px] text-slate-500">التعديلات تُحفظ تلقائياً. الخدمات الجديدة التي تضاف من شاشة "الخدمات" تأخذ سعرها الافتراضي إلى أن تحدد لها سعراً هنا.</p>
    </div>
  );
}
