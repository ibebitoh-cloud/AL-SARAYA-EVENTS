import { useState } from 'react';
import { Plus, Trash2, Percent, Lock } from 'lucide-react';
import type { Booking, BookingServiceItem, Language, PriceBook, ServiceDefinition } from '../types/venueSystem';
import { servicePriceAt } from '../data/pricing';
import { bookingTotals } from '../data/recordFields';
import { makeTr } from '../utils/tr';

interface Props {
  booking: Booking;
  services: ServiceDefinition[];
  priceBook: PriceBook;
  language: Language;
  /** Only the CEO can set the discount. Everyone else sees it read-only. */
  canDiscount: boolean;
  set: (key: string, value: unknown) => void;
}

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none';

/** Booking edit: add or remove services, change quantities, and see the total update as you go. */
export function BookingServicesEditor({ booking, services, priceBook, language, canDiscount, set }: Props) {
  const { tr, egp } = makeTr(language);
  const [toAdd, setToAdd] = useState('');
  const lines = booking.services || [];
  const location = booking.locationId || 'arcane';
  const totals = bookingTotals({ basePrice: Number(booking.basePrice) || 0, services: lines.map((l) => ({ ...l, totalPrice: (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) })), discountPercent: booking.discountPercent });
  const paid = Number(booking.paidAmount) || 0;

  const update = (next: BookingServiceItem[]) => set('services', next);
  const addService = () => {
    const srv = services.find((s) => s.id === toAdd);
    if (!srv) return;
    const existing = lines.find((l) => l.serviceId === srv.id);
    if (existing) {
      update(lines.map((l) => l === existing ? { ...l, quantity: (Number(l.quantity) || 0) + 1 } : l));
    } else {
      const p = servicePriceAt(priceBook, location, srv);
      const quantity = srv.unit === 'فرد' ? Math.max(1, Number(booking.guestCount) || 1) : 1;
      update([...lines, { id: `bs-${Date.now()}-${srv.id}`, serviceId: srv.id, name: srv.name, quantity, unitPrice: p.price, costPrice: p.cost, totalPrice: p.price * quantity, totalCost: p.cost * quantity }]);
    }
    setToAdd('');
  };

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div>
        <h3 className="text-sm font-black text-white">{tr('الخدمات والإضافات', 'Services & add-ons')}</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">{tr('الأسعار من قائمة أسعار الفرع. الإجمالي يتحدث تلقائياً.', 'Prices come from the branch price list. The total updates automatically.')}</p>
      </div>

      {lines.length === 0 && <p className="text-xs text-slate-500">{tr('لا توجد خدمات في هذا الحجز بعد.', 'No services on this booking yet.')}</p>}
      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={line.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <span dir="auto" className="w-full min-w-0 text-xs font-semibold text-slate-200 sm:w-auto sm:flex-1">{line.name}</span>
            <label className="ms-auto flex shrink-0 items-center gap-1.5 text-[11px] text-slate-500 sm:ms-0">
              {tr('الكمية', 'Qty')}
              <input type="number" min={1} dir="ltr" value={line.quantity} aria-label={tr('الكمية', 'Quantity')} onChange={(e) => update(lines.map((l, i) => i === index ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) } : l))} className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-center font-mono text-xs text-white" />
            </label>
            <span className="w-24 shrink-0 text-end font-mono text-xs text-indigo-300 sm:w-28">{egp((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0))}</span>
            <button type="button" onClick={() => update(lines.filter((_, i) => i !== index))} aria-label={tr('حذف الخدمة', 'Remove service')} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <select value={toAdd} onChange={(e) => setToAdd(e.target.value)} aria-label={tr('اختر خدمة لإضافتها', 'Choose a service to add')} className={inputClass}>
          <option value="">{tr('اختر خدمة لإضافتها…', 'Choose a service to add…')}</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} · {egp(servicePriceAt(priceBook, location, s).price)}</option>)}
        </select>
        <button type="button" onClick={addService} disabled={!toAdd} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Plus className="h-3.5 w-3.5" />{tr('إضافة', 'Add')}</button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-semibold"><Percent className="h-3.5 w-3.5 text-amber-300" />{tr('خصم على السعر النهائي', 'Discount on final price')}</span>
          {canDiscount
            ? <span className="flex items-center gap-1"><input type="number" min={0} max={100} step="0.5" dir="ltr" value={booking.discountPercent ?? ''} placeholder="0" onChange={(e) => set('discountPercent', e.target.value === '' ? undefined : Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-center font-mono text-xs text-white" />%</span>
            : <span className="flex items-center gap-1 text-slate-400"><Lock className="h-3.5 w-3.5" />{totals.percent ? `${totals.percent}%` : tr('لا يوجد', 'None')} · {tr('للرئيس التنفيذي فقط', 'CEO only')}</span>}
        </label>
      </div>

      <dl className="space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-400"><dt>{tr('سعر القاعة', 'Hall price')}</dt><dd className="font-mono">{egp(Number(booking.basePrice) || 0)}</dd></div>
        <div className="flex justify-between text-slate-400"><dt>{tr('الخدمات', 'Services')}</dt><dd className="font-mono">{egp(totals.subtotal - (Number(booking.basePrice) || 0))}</dd></div>
        {totals.discount > 0 && <div className="flex justify-between text-amber-300"><dt>{tr(`خصم ${totals.percent}%`, `Discount ${totals.percent}%`)}</dt><dd className="font-mono">− {egp(totals.discount)}</dd></div>}
        <div className="flex justify-between border-t border-slate-800 pt-1.5 text-sm font-black text-white"><dt>{tr('الإجمالي النهائي', 'Final total')}</dt><dd className="font-mono">{egp(totals.total)}</dd></div>
        <div className="flex justify-between text-rose-300"><dt>{tr('المتبقي بعد المدفوع', 'Balance after payments')}</dt><dd className="font-mono">{egp(Math.max(0, totals.total - paid))}</dd></div>
      </dl>
    </div>
  );
}
