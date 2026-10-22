import { useState } from 'react';
import { MapPin, Copy, Tags } from 'lucide-react';
import { Hall, Language, LocationId, PriceBook, PriceEntry, ServiceDefinition } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { LOCATIONS, hallLocation } from '../data/locations';
import { EVENT_PACKAGES, packagePriceAt, servicePriceAt } from '../data/pricing';
import { eventTypeConfig } from '../data/eventTypes';
import { useEffect } from 'react';

interface Props {
  halls: Hall[];
  services: ServiceDefinition[];
  priceBook: PriceBook;
  onUpdatePriceBook: (book: PriceBook) => void;
  onUpdateHall: (hall: Hall) => void;
  language?: Language;
  isCEO?: boolean;
  pendingPriceBook?: PriceBook | null;
  onSubmitApproval?: (book: PriceBook) => void;
  onApprovePending?: () => void;
  onRejectPending?: () => void;
}

const num = 'w-28 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono text-center focus:outline-none focus:border-amber-400';
const th = 'px-3 py-2 text-[11px] font-semibold text-slate-400 text-start';
const td = 'px-3 py-2 text-xs text-slate-200';

/** Manager screen: each location (Arcane / Porto) has its own full price list. */
export function PriceListsView({ halls, services, priceBook, onUpdatePriceBook, onUpdateHall, language = 'ar', isCEO = true, pendingPriceBook, onSubmitApproval, onApprovePending, onRejectPending }: Props) {
  const { isAr, tr } = makeTr(language);
  const locName = (id: LocationId) => { const l = LOCATIONS.find((x) => x.id === id); return isAr ? l?.nameAr : l?.nameEn; };
  const [loc, setLoc] = useState<LocationId>('arcane');
  const [draft, setDraft] = useState(priceBook);
  useEffect(() => setDraft(priceBook), [priceBook]);
  const displayedBook = isCEO ? priceBook : draft;
  const other: LocationId = loc === 'arcane' ? 'porto' : 'arcane';
  const locHalls = halls.filter((h) => hallLocation(h) === loc);

  const setEntry = (kind: 'packages' | 'services', id: string, patch: Partial<PriceEntry>, current: PriceEntry) => {
    const next = {
      ...displayedBook,
      [loc]: { ...displayedBook[loc], [kind]: { ...displayedBook[loc][kind], [id]: { ...current, ...patch } } },
    };
    if (isCEO) onUpdatePriceBook(next); else setDraft(next);
  };

  const copyFromOther = () => {
    const from = locName(other);
    const to = locName(loc);
    if (!window.confirm(isAr ? `نسخ أسعار الباقات والخدمات من ${from} إلى ${to}؟ سيتم استبدال أسعار ${to} الحالية.` : `Copy package and service prices from ${from} to ${to}? This replaces the current ${to} prices.`)) return;
    const next = { ...displayedBook, [loc]: JSON.parse(JSON.stringify(displayedBook[other])) };
    if (isCEO) onUpdatePriceBook(next); else setDraft(next);
  };

  const margin = (e: PriceEntry) => (e.price > 0 ? Math.round(((e.price - e.cost) / e.price) * 100) : 0);
  const savePriceChanges = () => { if (isCEO) onUpdatePriceBook(draft); else onSubmitApproval?.(draft); };

  return (
    <div className="w-full space-y-5 pb-20 text-start">
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Tags className="w-5 h-5 text-amber-400" /> {tr('قوائم الأسعار حسب المكان', 'Price lists by venue')}</h2>
          <p className="text-xs text-slate-400 mt-1">{tr('لكل مكان قائمة أسعار كاملة خاصة به: إيجار القاعات، الباقات، والخدمات. فريق العمليات يرى أسعار البيع فقط.', 'Each venue has its own full price list: hall rent, packages and services. The operations team only sees selling prices.')}</p>
        </div>
        <div className="flex items-center gap-2">
          {LOCATIONS.map((l) => (
            <button key={l.id} type="button" onClick={() => setLoc(l.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border ${loc === l.id ? 'bg-amber-400 text-slate-950 border-amber-300' : 'border-slate-700 text-slate-300 hover:text-white'}`}>
              <MapPin className="w-3.5 h-3.5" /> {isAr ? l.nameAr : l.nameEn}
            </button>
          ))}
          <button type="button" onClick={copyFromOther} title={tr('نسخ من المكان الآخر', 'Copy from the other venue')} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-700 text-[11px] text-slate-400 hover:text-white">
            <Copy className="w-3.5 h-3.5" /> {tr('نسخ من', 'Copy from')} {locName(other)}
          </button>
        </div>
      </div>
      {!isCEO && pendingPriceBook && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">{tr('تم إرسال تغييرات أسعار من المالية وتنتظر موافقة الرئيس التنفيذي.', 'Price changes from Finance were sent and are waiting for CEO approval.')}</div>}
      {isCEO && pendingPriceBook && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4"><div><strong className="text-amber-200">{tr('طلب تعديل أسعار بانتظار موافقتك', 'Price changes waiting for your approval')}</strong><p className="mt-1 text-xs text-slate-300">{tr('اعتماد جماعي يفعّل كل تغييرات المالية في آركين وبورتو مرة واحدة.', 'Approving applies all of Finance’s changes for Arcane and Porto at once.')}</p></div><div className="flex gap-2"><button type="button" onClick={onRejectPending} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200">{tr('رفض الكل', 'Reject all')}</button><button type="button" onClick={onApprovePending} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950">{tr('اعتماد كل التغييرات', 'Approve all changes')}</button></div></div>}

      {/* Halls */}
      <section className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
        <h3 className="px-4 pt-4 text-sm font-bold text-amber-300">{tr('إيجار القاعات', 'Hall rent')}</h3>
        <table className="w-full mt-2">
          <thead><tr className="border-b border-slate-800"><th className={th}>{tr('القاعة', 'Hall')}</th><th className={th}>{tr('السعة (فرد)', 'Capacity (guests)')}</th><th className={th}>{tr('سعر الإيجار (ج.م)', 'Rent (EGP)')}</th></tr></thead>
          <tbody>
            {locHalls.map((h) => (
              <tr key={h.id} className="border-b border-slate-800/60">
                <td className={td}><span className="inline-block w-2 h-2 rounded-full ms-1" style={{ background: h.color }} /> {isAr ? h.name : h.nameEn || h.name}</td>
                <td className={td}><input type="number" className={num} value={h.capacity} onChange={(e) => onUpdateHall({ ...h, capacity: Number(e.target.value) || 0 })} /></td>
                <td className={td}><input type="number" className={num} value={h.basePrice} onChange={(e) => onUpdateHall({ ...h, basePrice: Number(e.target.value) || 0 })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Packages */}
      <section className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
        <h3 className="px-4 pt-4 text-sm font-bold text-amber-300">{tr('الباقات (السعر للفرد)', 'Packages (price per guest)')}</h3>
        <table className="w-full mt-2">
          <thead><tr className="border-b border-slate-800"><th className={th}>{tr('الباقة', 'Package')}</th><th className={th}>{tr('النوع', 'Type')}</th><th className={th}>{tr('سعر البيع', 'Selling price')}</th><th className={th}>{tr('التكلفة', 'Cost')}</th><th className={th}>{tr('الهامش', 'Margin')}</th></tr></thead>
          <tbody>
            {EVENT_PACKAGES.map((p) => {
              const e = packagePriceAt(displayedBook, loc, p.id);
              return (
                <tr key={p.id} className="border-b border-slate-800/60">
                  <td className={td}>{isAr ? p.nameAr : p.nameEn}</td>
                  <td className={`${td} text-slate-400`}>{p.eventTypes.map((t) => (isAr ? eventTypeConfig(t).ar : eventTypeConfig(t).en)).join(isAr ? '، ' : ', ')}</td>
                  <td className={td}><input type="number" className={num} value={e.price} onChange={(ev) => setEntry('packages', p.id, { price: Number(ev.target.value) || 0 }, e)} /></td>
                  {isCEO && <><td className={td}><input type="number" className={`${num} text-rose-300`} value={e.cost} onChange={(ev) => setEntry('packages', p.id, { cost: Number(ev.target.value) || 0 }, e)} /></td><td className={`${td} font-mono text-emerald-400`}>{margin(e)}%</td></>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Services */}
      <section className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
        <h3 className="px-4 pt-4 text-sm font-bold text-amber-300">{tr('الخدمات والإضافات', 'Services & add-ons')}</h3>
        <table className="w-full mt-2">
          <thead><tr className="border-b border-slate-800"><th className={th}>{tr('الخدمة', 'Service')}</th><th className={th}>{tr('الوحدة', 'Unit')}</th><th className={th}>{tr('سعر البيع', 'Selling price')}</th><th className={th}>{tr('التكلفة', 'Cost')}</th><th className={th}>{tr('الهامش', 'Margin')}</th></tr></thead>
          <tbody>
            {services.map((s) => {
              const e = servicePriceAt(displayedBook, loc, s);
              return (
                <tr key={s.id} className="border-b border-slate-800/60">
                  <td className={td}>{s.name}</td>
                  <td className={`${td} text-slate-400`}>{s.unit}</td>
                  <td className={td}><input type="number" className={num} value={e.price} onChange={(ev) => setEntry('services', s.id, { price: Number(ev.target.value) || 0 }, e)} /></td>
                  {isCEO && <><td className={td}><input type="number" className={`${num} text-rose-300`} value={e.cost} onChange={(ev) => setEntry('services', s.id, { cost: Number(ev.target.value) || 0 }, e)} /></td><td className={`${td} font-mono text-emerald-400`}>{margin(e)}%</td></>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {!isCEO && <button type="button" onClick={savePriceChanges} className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950">{tr('إرسال التغييرات لاعتماد الرئيس التنفيذي', 'Send changes for CEO approval')}</button>}
      <p className="text-[11px] text-slate-500">{isCEO ? tr('التعديلات تُحفظ تلقائياً. التكاليف وهوامش الربح ظاهرة للرئيس التنفيذي فقط.', 'Changes save automatically. Costs and margins are visible to the CEO only.') : tr('تعديلاتك تظل مسودة حتى اعتمادها من الرئيس التنفيذي. تكاليف الشراء وهوامش الربح غير معروضة.', 'Your changes stay a draft until the CEO approves them. Costs and margins are hidden.')}</p>
    </div>
  );
}
