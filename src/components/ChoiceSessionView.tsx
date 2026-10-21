import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Cuboid, MapPin, Minus, Plus, Printer, Users, X } from 'lucide-react';
import { Booking, BookingServiceItem, Hall, HallLayoutItem, PriceBook } from '../types/venueSystem';
import { eventTypeConfig } from '../data/eventTypes';
import { locationName } from '../data/locations';
import { packagePriceAt, packagesFor } from '../data/pricing';
import {
  ChoiceCategory, ChoiceOption, PACKAGE_INCLUDES, UNIT_LABEL_AR, categoriesFor, findOption, optionPriceAt,
} from '../data/eventOptions';
import { PreparedOperation } from '../data/preparedOperations';
import { EventLayout3D } from './EventLayout3D';
import { sound } from '../utils/soundEffects';

interface Props {
  op: PreparedOperation;
  hall?: Hall;
  priceBook: PriceBook;
  onChange: (op: PreparedOperation) => void;
  onBack: () => void;
  onCreateBooking: (booking: Booking) => void;
}

const money = (n: number) => `${Math.round(n).toLocaleString()} ج.م`;

/** Customer-facing choice session: everything about the operation is prepared, the customer only chooses. */
export function ChoiceSessionView({ op, hall, priceBook, onChange, onBack, onCreateBooking }: Props) {
  const typeCfg = eventTypeConfig(op.eventType);
  const pkgs = packagesFor(op.eventType);
  const pkg = pkgs.find((p) => p.id === op.packageId);
  const included = new Set(pkg ? PACKAGE_INCLUDES[pkg.id] ?? [] : []);
  const includedIn = (cat: ChoiceCategory) => cat.options.find((o) => included.has(o.id));
  /** Price the customer pays: free if the package includes it, the difference when swapping a single-choice item. */
  const effectivePrice = (cat: ChoiceCategory, option: ChoiceOption) => {
    if (included.has(option.id)) return 0;
    const base = optionPriceAt(option, op.locationId);
    const inc = cat.mode === 'single' ? includedIn(cat) : undefined;
    return inc ? Math.max(0, base - optionPriceAt(inc, op.locationId)) : base;
  };
  const categories = categoriesFor(op.eventType);
  const steps = ['package', ...categories.map((c) => c.id)];
  const [step, setStep] = useState(0);
  const [show3D, setShow3D] = useState(false);
  const stepId = steps[step];
  const category = categories.find((c) => c.id === stepId);

  const tableOption = categories.find((c) => c.id === 'tables')?.options.find((o) => op.selections[o.id]);
  const seatsPerTable = tableOption?.seats ?? 10;
  const tableCount = Math.max(1, Math.ceil(op.guests / seatsPerTable));

  const qtyFor = (option: ChoiceOption) => {
    if (option.unit === 'guest') return op.guests;
    if (option.unit === 'table') return tableCount;
    if (option.unit === 'unit') return op.selections[option.id] || 1;
    return 1;
  };

  const lines = useMemo(() => Object.keys(op.selections).flatMap((id) => {
    const found = findOption(id);
    if (!found) return [];
    const unitPrice = effectivePrice(found.category, found.option);
    const qty = qtyFor(found.option);
    const swappedFrom = found.category.mode === 'single' && !included.has(id) ? includedIn(found.category) : undefined;
    return [{ ...found, qty, unitPrice, total: unitPrice * qty, isIncluded: included.has(id), swappedFrom }];
  }), [op.selections, op.locationId, op.guests, op.packageId, tableCount]);

  const hallRent = hall?.basePrice || 0;
  const pkgPrice = pkg ? packagePriceAt(priceBook, op.locationId, pkg.id).price : 0;
  const pkgTotal = pkgPrice * op.guests;
  const optionsTotal = lines.reduce((sum, l) => sum + l.total, 0);
  const grandTotal = hallRent + pkgTotal + optionsTotal;
  const paidLines = lines.filter((l) => l.total > 0);
  const freeLines = lines.filter((l) => l.total === 0);
  const overBudget = op.budget > 0 && grandTotal > op.budget;

  const update = (patch: Partial<PreparedOperation>) => onChange({ ...op, ...patch });

  const choosePackage = (pkgId: string) => {
    sound.tick();
    const nextId = op.packageId === pkgId ? '' : pkgId;
    const selections = { ...op.selections };
    // Drop what the previous package put in, then pre-select what the new one includes.
    (PACKAGE_INCLUDES[op.packageId] ?? []).forEach((id) => delete selections[id]);
    (PACKAGE_INCLUDES[nextId] ?? []).forEach((id) => {
      const found = findOption(id);
      if (!found) return;
      if (found.category.mode === 'single' && found.category.options.some((o) => selections[o.id])) return;
      selections[id] = 1;
    });
    update({ packageId: nextId, selections });
  };

  const toggleOption = (cat: ChoiceCategory, option: ChoiceOption) => {
    sound.tick();
    const selections = { ...op.selections };
    const wasOn = !!selections[option.id];
    if (cat.mode === 'single') {
      const inc = includedIn(cat);
      if (wasOn && option.id === inc?.id) return; // the package's own choice stays until swapped
      cat.options.forEach((o) => delete selections[o.id]);
      if (!wasOn) selections[option.id] = 1;
      else if (inc) selections[inc.id] = 1;
    } else if (wasOn) delete selections[option.id];
    else selections[option.id] = 1;
    update({ selections });
  };

  const setQty = (optionId: string, qty: number) => update({ selections: { ...op.selections, [optionId]: Math.max(1, Math.min(200, qty)) } });

  const stepDone = (id: string) => id === 'package'
    ? !!op.packageId
    : Object.keys(op.selections).some((sel) => findOption(sel)?.category.id === id);

  const saveAsBooking = () => {
    if (!hall || op.bookingCode) return;
    sound.success();
    const stamp = Date.now();
    const services: BookingServiceItem[] = [];
    if (pkg) {
      const p = packagePriceAt(priceBook, op.locationId, pkg.id);
      services.push({ id: `bs-${stamp}-${pkg.id}`, serviceId: pkg.id, name: pkg.nameAr, quantity: op.guests, unitPrice: p.price, costPrice: p.cost, totalPrice: p.price * op.guests, totalCost: p.cost * op.guests });
    }
    paidLines.forEach((l) => {
      const cost = Math.max(0, l.option.cost - (l.swappedFrom?.cost ?? 0));
      services.push({
        id: `bs-${stamp}-${l.option.id}`, serviceId: l.option.id, quantity: l.qty, unitPrice: l.unitPrice, costPrice: cost, totalPrice: l.total, totalCost: cost * l.qty,
        name: `${l.category.titleAr}: ${l.option.nameAr}${l.swappedFrom ? ` (ترقية بدلاً من ${l.swappedFrom.nameAr})` : ''}`,
      });
    });
    const freeNote = freeLines.map((l) => `${l.category.titleAr}: ${l.option.nameAr}${l.isIncluded ? ' (ضمن الباقة)' : ''}`).join(' · ');
    const code = `BK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    onCreateBooking({
      id: `bk-${stamp}`, code, clientName: op.clientName, clientPhone: op.clientPhone, eventType: op.eventType,
      date: op.date, startTime: op.startTime, endTime: op.endTime, hallId: hall.id, hallName: hall.name, locationId: op.locationId,
      guestCount: op.guests, basePrice: hallRent, services, packageId: pkg?.id, packageName: pkg?.nameAr, eventDetails: op.details,
      totalPrice: grandTotal, deposit: 0, paidAmount: 0, remainingAmount: grandTotal, securityDeposit: 0, securityDepositStatus: 'held',
      status: 'tentative', assignedStaff: [], suppliesCost: 0, directExpenses: 0,
      notes: ['تم الاختيار مع العميل في جلسة تصميم الحفلة', freeNote && `اختيارات: ${freeNote}`, op.notes].filter(Boolean).join('\n'),
    });
    update({ bookingCode: code });
  };

  // Illustrative 3D layout of the chosen table set in this hall.
  const layout = useMemo(() => {
    const area = hall?.areaSqMeters ?? 0;
    const width = hall?.default3D?.width ?? (area > 0 ? Math.max(12, Math.round(Math.sqrt(area * 0.66))) : 24);
    const depth = hall?.default3D?.depth ?? (area > 0 ? Math.max(12, Math.round(area / width)) : 32);
    const rect = tableOption?.tableShape === 'rect';
    const stepX = rect ? 3.6 : 3.4;
    const stepY = rect ? 2.8 : 3.4;
    const cols = Math.max(1, Math.floor((width * 0.9) / stepX));
    const items: HallLayoutItem[] = [
      { id: 'stage', type: 'stage', labelEn: 'Stage', labelAr: typeCfg.id === 'conference' ? 'منصة' : 'الكوشة', x: 50, y: 8, rotation: 0 },
    ];
    if (typeCfg.id !== 'conference') items.push({ id: 'dance', type: 'dance', labelEn: 'Dance Floor', labelAr: 'ساحة الرقص', x: 50, y: 24, rotation: 0 });
    for (let i = 0; i < tableCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const xM = (col - (Math.min(cols, tableCount) - 1) / 2) * stepX;
      const yM = -depth * 0.12 + row * stepY;
      items.push({
        id: `t${i}`, type: 'table', labelEn: `T${i + 1}`, labelAr: `${i + 1}`, rotation: 0, seats: seatsPerTable,
        shape: rect ? 'rect' : 'round', widthM: rect ? 2 : 1.8, depthM: rect ? 1 : 1.8,
        x: Math.max(3, Math.min(97, (xM / width + 0.5) * 100)), y: Math.max(3, Math.min(97, (yM / depth + 0.5) * 100)),
      });
    }
    return { width, depth, items };
  }, [hall, tableOption?.tableShape, tableCount, seatsPerTable, typeCfg.id]);

  const includedHere = category ? category.options.filter((o) => included.has(o.id)) : [];

  return (
    <div className="w-full pb-20 text-right space-y-4">
      {/* Who the session is for — prepared before the meeting */}
      <div className="rounded-3xl border border-amber-400/25 bg-gradient-to-l from-slate-900 to-slate-950 p-5 sm:p-6 print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-amber-400">SARAYA EVENTS · جلسة اختيار</div>
            <h2 className="mt-2 text-2xl font-black text-white">{typeCfg.emoji} {typeCfg.ar}{op.details.brideName && op.details.groomName ? ` — ${op.details.brideName} و${op.details.groomName}` : op.details.companyName ? ` — ${op.details.companyName}` : op.details.celebrantName ? ` — ${op.details.celebrantName}` : ''}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2.5 py-1"><MapPin className="h-3 w-3" />{locationName(op.locationId, true)} · {hall?.name || '—'}</span>
              <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2.5 py-1"><Users className="h-3 w-3" />{op.guests} فرد</span>
              <span dir="ltr" className="rounded-full border border-slate-700 px-2.5 py-1 font-mono">{op.date} · {op.startTime}–{op.endTime}</span>
            </div>
          </div>
          <button type="button" onClick={onBack} className="flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white"><ArrowRight className="h-3.5 w-3.5" /> العمليات الجاهزة</button>
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-2 overflow-x-auto pb-1 print:hidden" data-no-screen-swipe>
        {steps.map((id, i) => {
          const cat = categories.find((c) => c.id === id);
          const done = stepDone(id);
          return (
            <button key={id} type="button" onClick={() => { sound.click(500); setStep(i); setShow3D(false); }}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${i === step ? 'border-amber-400 bg-amber-400 text-slate-950' : done ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}>
              <span>{cat ? cat.emoji : '📦'}</span>{cat ? cat.titleAr : 'الباقة'}{done && i !== step && <Check className="h-3 w-3" />}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 print:hidden">
          <div className="mb-4">
            <h3 className="text-xl font-black text-white">{category ? `${category.emoji} ${category.titleAr}` : '📦 اختر الباقة'}</h3>
            <p className="mt-1 text-xs text-slate-400">{category ? category.subtitleAr : 'نقطة البداية — كل باقة تشمل مجموعة من الخدمات، ويمكن الإضافة عليها في الخطوات التالية. يمكن أيضاً التصميم بدون باقة.'}</p>
            {category?.id === 'tables' && <p className="mt-2 text-xs text-amber-200">{op.guests} فرد ÷ {seatsPerTable} كراسي = <strong>{tableCount} طاولة</strong></p>}
            {includedHere.length > 0 && category && (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                {pkg?.nameAr} تشمل: {includedHere.map((o) => o.nameAr).join(' · ')} — {category.mode === 'single' ? 'ويمكن الترقية لاختيار آخر بفرق السعر فقط.' : 'وما تختاره غيرها يُضاف عليها.'}
              </div>
            )}
          </div>

          {stepId === 'package' ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pkgs.map((p) => {
                const price = packagePriceAt(priceBook, op.locationId, p.id).price;
                const active = op.packageId === p.id;
                return (
                  <motion.button key={p.id} type="button" whileTap={{ scale: 0.98 }} onClick={() => choosePackage(p.id)}
                    className={`rounded-2xl border p-4 text-right transition ${active ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
                    <div className="flex items-start justify-between gap-2"><div className="text-sm font-black text-white">{p.nameAr}</div>{active && <span className="rounded-full bg-amber-400 p-1 text-slate-950"><Check className="h-3 w-3" /></span>}</div>
                    <div className="mt-2 font-mono text-xl font-black text-amber-300">{price.toLocaleString()} <span className="font-sans text-xs text-slate-400">ج.م / فرد</span></div>
                    <ul className="mt-3 space-y-1">{p.includesAr.map((i) => <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300"><Check className="h-3 w-3 shrink-0 text-emerald-400" />{i}</li>)}</ul>
                    {op.guests < p.minGuests && <div className="mt-2 text-[10px] text-amber-300">الحد الأدنى {p.minGuests} فرد</div>}
                  </motion.button>
                );
              })}
              <button type="button" onClick={() => op.packageId && choosePackage(op.packageId)}
                className={`rounded-2xl border border-dashed p-4 text-right transition ${!op.packageId ? 'border-amber-400 bg-amber-400/5' : 'border-slate-700 hover:border-slate-500'}`}>
                <div className="text-sm font-black text-white">بدون باقة</div>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">اختيار حر لكل تفصيلة على حدة من الخطوات التالية.</p>
              </button>
            </div>
          ) : category && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {category.options.map((option) => {
                  const on = !!op.selections[option.id];
                  const unitPrice = effectivePrice(category, option);
                  const isIncluded = included.has(option.id);
                  const isUpgrade = !isIncluded && category.mode === 'single' && !!includedIn(category);
                  const qty = qtyFor(option);
                  return (
                    <motion.div key={option.id} role="button" tabIndex={0} whileTap={{ scale: 0.98 }} onClick={() => toggleOption(category, option)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOption(category, option); } }}
                      className={`relative cursor-pointer overflow-hidden rounded-2xl border text-right transition ${on ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
                      <div className="flex h-24 items-center justify-center bg-gradient-to-b from-slate-800/60 to-slate-950/40">
                        {option.swatch
                          ? <div className="flex h-14 w-32 overflow-hidden rounded-xl border border-white/20 shadow-lg">{option.swatch.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
                          : <span className="text-5xl drop-shadow">{option.emoji}</span>}
                      </div>
                      {isIncluded
                        ? <span className="absolute start-2 top-2 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-slate-950">ضمن الباقة</span>
                        : option.tagAr && <span className="absolute start-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">{option.tagAr}</span>}
                      {on && <span className="absolute end-2 top-2 rounded-full bg-amber-400 p-1 text-slate-950"><Check className="h-3 w-3" /></span>}
                      <div className="p-3.5">
                        <div className="text-sm font-black text-white">{option.nameAr}</div>
                        {option.descAr && <p className="mt-1 text-[11px] leading-5 text-slate-400">{option.descAr}</p>}
                        <div className="mt-2 font-mono text-sm font-bold text-amber-300">
                          {isIncluded ? <span className="font-sans text-emerald-300">مشمول بدون تكلفة إضافية</span>
                            : unitPrice === 0 ? <span className="font-sans text-emerald-300">بدون تكلفة إضافية</span>
                            : <>{isUpgrade && '+'}{unitPrice.toLocaleString()} <span className="font-sans text-[10px] text-slate-400">ج.م {isUpgrade ? 'فرق ترقية' : UNIT_LABEL_AR[option.unit]}</span></>}
                        </div>
                        {on && unitPrice > 0 && option.unit !== 'event' && (
                          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-slate-950/70 px-2 py-1.5 text-[11px] text-slate-300" onClick={(e) => e.stopPropagation()}>
                            {option.unit === 'unit' ? (
                              <div className="flex items-center gap-1.5">
                                <button type="button" aria-label="أقل" onClick={() => setQty(option.id, qty - 1)} className="rounded-md border border-slate-700 p-1"><Minus className="h-3 w-3" /></button>
                                <span className="w-6 text-center font-mono text-white">{qty}</span>
                                <button type="button" aria-label="أكثر" onClick={() => setQty(option.id, qty + 1)} className="rounded-md border border-slate-700 p-1"><Plus className="h-3 w-3" /></button>
                              </div>
                            ) : <span>× {qty} {option.unit === 'guest' ? 'فرد' : 'طاولة'}</span>}
                            <span className="font-mono text-amber-200">{money(unitPrice * qty)}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {category.id === 'tables' && (
                <div className="mt-4">
                  {!show3D ? (
                    <button type="button" onClick={() => setShow3D(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-slate-950/60 py-4 text-sm font-bold text-amber-200 hover:border-amber-300">
                      <Cuboid className="h-5 w-5" /> شاهد توزيع {tableCount} طاولة في {hall?.name || 'القاعة'} بشكل 3D
                    </button>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-amber-400/30">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                        <span>توزيع توضيحي · {tableCount} طاولة × {seatsPerTable} كراسي</span>
                        <button type="button" aria-label="إغلاق" onClick={() => setShow3D(false)} className="rounded-full border border-slate-700 p-1.5 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="h-[420px]">
                        <EventLayout3D key={`${tableOption?.id}-${tableCount}`} items={layout.items} width={layout.width} depth={layout.depth} language="ar" mode="overview" onSelect={() => {}} onMove={() => {}} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button type="button" disabled={step === 0} onClick={() => { setStep(step - 1); setShow3D(false); }} className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 disabled:opacity-30"><ArrowRight className="h-4 w-4" /> السابق</button>
            <span className="text-[11px] text-slate-500">{step + 1} / {steps.length}</span>
            <button type="button" disabled={step === steps.length - 1} onClick={() => { setStep(step + 1); setShow3D(false); }} className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-30">التالي <ArrowLeft className="h-4 w-4" /></button>
          </div>
        </section>

        {/* Live quote — selling prices only */}
        <aside className="h-fit lg:sticky lg:top-6">
          <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-2xl shadow-amber-500/5 print:border-slate-300 print:bg-white print:text-black">
            <div className="text-[10px] font-bold tracking-[0.3em] text-amber-400">SARAYA EVENTS · عرض سعر</div>
            <div className="mt-1 text-sm font-bold text-white print:text-black">{op.clientName} · {typeCfg.ar}</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3 text-slate-300 print:text-black"><span>إيجار {hall?.name || 'القاعة'}</span><span className="font-mono">{money(hallRent)}</span></div>
              {pkg && <div className="flex justify-between gap-3 text-slate-300 print:text-black"><span>{pkg.nameAr}<span className="block text-[10px] text-slate-500">{pkgPrice.toLocaleString()} × {op.guests} فرد</span></span><span className="font-mono">{money(pkgTotal)}</span></div>}
              {categories.map((cat) => {
                const catLines = paidLines.filter((l) => l.category.id === cat.id);
                if (!catLines.length) return null;
                return (
                  <div key={cat.id} className="border-t border-slate-800 pt-2">
                    <div className="mb-1 text-[10px] font-bold text-amber-300/80">{cat.emoji} {cat.titleAr}</div>
                    {catLines.map((l) => (
                      <div key={l.option.id} className="flex justify-between gap-3 text-xs text-slate-300 print:text-black">
                        <span>{l.option.nameAr}{l.swappedFrom && <span className="block text-[10px] text-slate-500">ترقية بدلاً من {l.swappedFrom.nameAr}</span>}{l.option.unit !== 'event' && <span className="block text-[10px] text-slate-500">{l.unitPrice.toLocaleString()} × {l.qty}</span>}</span>
                        <span className="shrink-0 font-mono">{money(l.total)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            {freeLines.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-800 pt-3">
                {freeLines.map((l) => <span key={l.option.id} className={`rounded-full border px-2 py-0.5 text-[10px] ${l.isIncluded ? 'border-emerald-500/40 text-emerald-200' : 'border-slate-700 text-slate-300'}`}>{l.category.titleAr}: {l.option.nameAr}</span>)}
              </div>
            )}
            <div className="mt-4 border-t border-slate-700 pt-4">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-400">الإجمالي</span>
                <span className="font-mono text-3xl font-black text-amber-300 print:text-black">{Math.round(grandTotal).toLocaleString()}<span className="text-sm text-slate-400"> ج.م</span></span>
              </div>
              <div className="mt-1 text-left text-[11px] text-slate-500">≈ {Math.round(grandTotal / Math.max(1, op.guests)).toLocaleString()} ج.م للفرد</div>
              {overBudget && <div className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">أعلى من الميزانية المتوقعة ({money(op.budget)}) بـ {money(grandTotal - op.budget)}</div>}
            </div>
            <div className="mt-4 grid gap-2 print:hidden">
              {op.bookingCode
                ? <p className="rounded-xl bg-emerald-500/10 p-3 text-center text-xs text-emerald-300">تم الحفظ كحجز مبدئي برقم <span className="font-mono">{op.bookingCode}</span></p>
                : <button type="button" onClick={saveAsBooking} disabled={!hall} className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:opacity-40"><CalendarCheck className="h-4 w-4" /> حفظ كحجز مبدئي</button>}
              <button type="button" onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs text-slate-300 hover:text-white"><Printer className="h-4 w-4" /> طباعة عرض السعر</button>
              <p className="text-center text-[10px] text-slate-500">يتم حفظ الاختيارات تلقائياً — يمكن استكمال الجلسة لاحقاً.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
