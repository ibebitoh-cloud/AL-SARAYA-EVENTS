import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, MapPin, Users, Printer, CalendarCheck, RotateCcw, Minus, Plus, AlertTriangle, Sparkles } from 'lucide-react';
import { Booking, BookingServiceItem, EventType, Hall, Language, LocationId, PriceBook, ServiceDefinition } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { EVENT_TYPES, eventTypeConfig } from '../data/eventTypes';
import { LOCATIONS, hallLocation, locationName } from '../data/locations';
import { packagesFor, packagePriceAt, servicePriceAt } from '../data/pricing';
import { sound } from '../utils/soundEffects';
import { findBookingConflict, uniqueBookingCode } from '../utils/bookingRules';

interface Props {
  halls: Hall[];
  services: ServiceDefinition[];
  priceBook: PriceBook;
  existingBookings: Booking[];
  onCreateBooking: (booking: Booking) => void;
  language?: Language;
}

const card = 'rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6';
const input = 'w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400';

/**
 * Sit-down screen for the operations team and the customer: pick the event, location, hall,
 * package and extras together and see the price build up. Selling prices only — no costs or margins.
 */
export function PackageBuilderView({ halls, services, priceBook, existingBookings, onCreateBooking, language = 'ar' }: Props) {
  const { isAr, tr, egp } = makeTr(language);
  const money = (n: number) => egp(Math.round(n));
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [locationId, setLocationId] = useState<LocationId>('arcane');
  const [hallId, setHallId] = useState<string>(() => halls.find((h) => hallLocation(h) === 'arcane')?.id || '');
  const [guests, setGuests] = useState(eventTypeConfig('wedding').defaultGuests);
  const [packageId, setPackageId] = useState<string>('');
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [date, setDate] = useState('');
  const [savedCode, setSavedCode] = useState('');

  const typeCfg = eventTypeConfig(eventType);
  const locHalls = halls.filter((h) => hallLocation(h) === locationId);
  const hall = halls.find((h) => h.id === hallId);
  const pkgs = packagesFor(eventType);
  const pkg = pkgs.find((p) => p.id === packageId);
  const pkgPrice = pkg ? packagePriceAt(priceBook, locationId, pkg.id).price : 0;

  const extraLines = useMemo(() => Object.entries(extras).flatMap(([id, qty]) => {
    const srv = services.find((s) => s.id === id);
    if (!srv) return [];
    const price = servicePriceAt(priceBook, locationId, srv).price;
    return [{ srv, qty, price, total: price * qty }];
  }), [extras, services, priceBook, locationId]);

  const hallRent = hall?.basePrice || 0;
  const pkgTotal = pkgPrice * guests;
  const extrasTotal = extraLines.reduce((a, l) => a + l.total, 0);
  const grandTotal = hallRent + pkgTotal + extrasTotal;
  const perGuest = guests > 0 ? grandTotal / guests : 0;

  const sameDayBooking = date && hall ? existingBookings.find((b) => b.status !== 'cancelled' && b.hallId === hall.id && b.date === date) : undefined;
  const overCapacity = hall && hall.capacity > 0 && guests > hall.capacity;
  const belowMin = pkg && guests < pkg.minGuests;

  const pickType = (t: EventType) => {
    sound.click(600); setEventType(t); setPackageId(''); setDetails({}); setGuests(eventTypeConfig(t).defaultGuests); setSavedCode('');
  };
  const pickLocation = (l: LocationId) => {
    sound.click(600); setLocationId(l); setHallId(halls.find((h) => hallLocation(h) === l)?.id || ''); setSavedCode('');
  };
  const toggleExtra = (srv: ServiceDefinition) => {
    sound.tick();
    setExtras((prev) => { const c = { ...prev }; if (c[srv.id]) delete c[srv.id]; else c[srv.id] = srv.unit === tr('فرد', 'guests') ? guests : 1; return c; });
  };
  const reset = () => { setPackageId(''); setExtras({}); setDetails({}); setClientName(''); setClientPhone(''); setDate(''); setSavedCode(''); };

  const missingRequired = typeCfg.fields.filter((f) => f.required && !details[f.key]?.trim());
  const conflict = hall ? findBookingConflict(existingBookings, { hallId: hall.id, date, startTime: typeCfg.defaultStart, endTime: typeCfg.defaultEnd }) : undefined;
  // One save per design: "بدء تصميم جديد" clears it for the next customer.
  const canSave = !!hall && !!clientName.trim() && !!clientPhone.trim() && !!date && missingRequired.length === 0 && !conflict && !savedCode;

  const saveAsBooking = () => {
    if (!canSave || !hall) return;
    sound.success();
    const lines: BookingServiceItem[] = [];
    const stamp = Date.now();
    if (pkg) {
      const p = packagePriceAt(priceBook, locationId, pkg.id);
      lines.push({ id: `bs-${stamp}-${pkg.id}`, serviceId: pkg.id, name: pkg.nameAr, quantity: guests, unitPrice: p.price, costPrice: p.cost, totalPrice: p.price * guests, totalCost: p.cost * guests });
    }
    extraLines.forEach(({ srv, qty }) => {
      const p = servicePriceAt(priceBook, locationId, srv);
      lines.push({ id: `bs-${stamp}-${srv.id}`, serviceId: srv.id, name: srv.name, quantity: qty, unitPrice: p.price, costPrice: p.cost, totalPrice: p.price * qty, totalCost: p.cost * qty });
    });
    const code = uniqueBookingCode(existingBookings);
    onCreateBooking({
      id: `bk-${stamp}`, code, clientName: clientName.trim(), clientPhone: clientPhone.trim(),
      eventType, date, startTime: typeCfg.defaultStart, endTime: typeCfg.defaultEnd,
      hallId: hall.id, hallName: hall.name, locationId, guestCount: guests, basePrice: hallRent,
      services: lines, packageId: pkg?.id, packageName: pkg?.nameAr,
      eventDetails: Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)),
      totalPrice: grandTotal, deposit: 0, paidAmount: 0, remainingAmount: grandTotal,
      securityDeposit: 0, securityDepositStatus: 'held', status: 'tentative',
      notes: 'تم التصميم مع العميل من شاشة تصميم الحفلة', assignedStaff: [], suppliesCost: 0, directExpenses: 0,
    });
    setSavedCode(code);
  };

  return (
    <div className="w-full pb-20 text-start space-y-5 print:p-0">
      <div className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden`}>
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> {tr('تصميم الحفلة مع العميل', 'Event planner')}</h2>
          <p className="text-xs text-slate-400 mt-1">{tr('اختاروا معاً نوع المناسبة والمكان والباقة والإضافات — الأسعار المعروضة هي أسعار البيع للعميل.', 'Choose the event type, venue, package and extras together with the client. Prices shown are client selling prices.')}</p>
        </div>
        <button type="button" onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white"><RotateCcw className="w-3.5 h-3.5" /> {tr('بدء تصميم جديد', 'Start over')}</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5 print:hidden">
          {/* 1. Type */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">{tr('1. نوع المناسبة', '1. Event type')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {EVENT_TYPES.map((t) => (
                <button key={t.id} type="button" onClick={() => pickType(t.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${eventType === t.id ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
                  <div className="text-2xl">{t.emoji}</div>
                  <div className="mt-1 text-xs font-bold text-white">{isAr ? t.ar : t.en}</div>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Location & hall */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">{tr('2. المكان والقاعة', '2. Venue & hall')}</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {LOCATIONS.map((l) => (
                <button key={l.id} type="button" onClick={() => pickLocation(l.id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-bold transition-all ${locationId === l.id ? 'bg-amber-400 text-slate-950 border-amber-300' : 'border-slate-700 text-slate-300 hover:text-white'}`}>
                  <MapPin className="w-4 h-4" /> {isAr ? l.nameAr : l.nameEn}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {locHalls.map((h) => (
                <button key={h.id} type="button" onClick={() => { sound.tick(); setHallId(h.id); }}
                  className={`overflow-hidden rounded-2xl border text-start transition-all ${hallId === h.id ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800 hover:border-slate-600'}`}>
                  <div className="h-20" style={{ background: h.photo ? `center/cover url(${h.photo})` : `linear-gradient(135deg, ${h.color}55, #0f172a)` }} />
                  <div className="p-3 bg-slate-950/70">
                    <div className="text-sm font-bold text-white">{isAr ? h.name : h.nameEn || h.name}</div>
                    <div className="mt-1 text-[11px] text-slate-400">{tr('حتى', 'Up to')} {h.capacity} {tr('فرد', 'guests')}</div>
                    <div className="mt-1 text-xs font-mono text-amber-300">{money(h.basePrice)}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">{tr('عدد المدعوين', 'Guests')}</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setGuests((g) => Math.max(10, g - 10))} className="p-2.5 rounded-xl border border-slate-700 text-slate-300"><Minus className="w-4 h-4" /></button>
                  <input type="number" min={1} value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))} className={`${input} text-center font-mono text-lg`} />
                  <button type="button" onClick={() => setGuests((g) => g + 10)} className="p-2.5 rounded-xl border border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{tr('التاريخ المطلوب', 'Event date')}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} font-mono`} />
              </div>
            </div>
            {overCapacity && <p className="mt-2 text-xs text-rose-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {tr('العدد أكبر من سعة', 'More guests than the capacity of')} {isAr ? hall?.name : hall?.nameEn || hall?.name} ({hall?.capacity} {tr('فرد', 'guests')})</p>}
            {sameDayBooking && <p className="mt-2 text-xs text-rose-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {tr('يوجد حجز آخر في', 'Another booking in')} {isAr ? hall?.name : hall?.nameEn || hall?.name} {tr('بنفس اليوم', 'on the same day')} ({sameDayBooking.startTime}–{sameDayBooking.endTime})</p>}
          </section>

          {/* 3. Package */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">{tr('3. الباقة — أسعار', '3. Package — prices at')} {locationName(locationId, isAr)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pkgs.map((p) => {
                const price = packagePriceAt(priceBook, locationId, p.id).price;
                const active = packageId === p.id;
                return (
                  <motion.button key={p.id} type="button" whileTap={{ scale: 0.98 }} onClick={() => { sound.tick(); setPackageId(active ? '' : p.id); }}
                    className={`p-4 rounded-2xl border text-start transition-all ${active ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-black text-white">{isAr ? p.nameAr : p.nameEn}</div>
                      {active && <span className="rounded-full bg-amber-400 p-1 text-slate-950"><Check className="w-3 h-3" /></span>}
                    </div>
                    <div className="mt-2 text-xl font-black text-amber-300 font-mono">{price.toLocaleString()} <span className="text-xs font-sans text-slate-400">{tr('ج.م / فرد', 'EGP / guest')}</span></div>
                    <ul className="mt-3 space-y-1">
                      {(isAr ? p.includesAr : p.includesEn).map((i) => <li key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400 shrink-0" />{i}</li>)}
                    </ul>
                    <div className="mt-2 text-[10px] text-slate-500">{tr('الحد الأدنى', 'Minimum')} {p.minGuests} {tr('فرد', 'guests')}</div>
                  </motion.button>
                );
              })}
            </div>
            {belowMin && <p className="mt-2 text-xs text-amber-300">{tr('الحد الأدنى لهذه الباقة', 'Minimum for this package')} {pkg?.minGuests} {tr('فرد', 'guests')}.</p>}
          </section>

          {/* 4. Extras */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">{tr('4. إضافات حسب رغبة العميل', '4. Extras')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {services.map((srv) => {
                const on = !!extras[srv.id];
                const price = servicePriceAt(priceBook, locationId, srv).price;
                return (
                  <div key={srv.id} onClick={() => toggleExtra(srv)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-2 text-xs transition-all ${on ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-slate-600'}`}>{on && <Check className="w-3 h-3" />}</div>
                      <span className="line-clamp-1">{srv.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {on && <input type="number" min={1} value={extras[srv.id]} onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setExtras((p) => ({ ...p, [srv.id]: Math.max(1, Number(e.target.value) || 1) }))}
                        className="w-14 px-1 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono text-white" />}
                      <span className="font-mono text-amber-300">{price.toLocaleString()} <span className="text-slate-500">/ {srv.unit}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5. Customer & event details */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">{isAr ? `5. بيانات العميل و${typeCfg.ar}` : `5. Client & ${typeCfg.en.toLowerCase()} details`}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1">{tr('اسم العميل *', 'Client name *')}</label><input value={clientName} onChange={(e) => setClientName(e.target.value)} className={input} /></div>
              <div><label className="block text-xs text-slate-400 mb-1">{tr('رقم الهاتف *', 'Phone *')}</label><input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={`${input} font-mono`} /></div>
              {typeCfg.fields.map((f) => (
                <div key={f.key}><label className="block text-xs text-slate-400 mb-1">{isAr ? f.labelAr : f.labelEn}{f.required && ' *'}</label>
                  <input type={f.type || 'text'} placeholder={isAr ? f.placeholderAr || '' : ''} value={details[f.key] || ''} onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))} className={input} /></div>
              ))}
            </div>
          </section>
        </div>

        {/* Live quote — the customer sees this */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-amber-500/5 print:border-slate-300 print:bg-white print:text-black">
            <div className="text-[10px] tracking-[0.3em] text-amber-400 font-bold">SARAYA EVENTS · {tr('عرض سعر', 'Quote')}</div>
            <div className="mt-2 text-xl font-black text-white print:text-black">{typeCfg.emoji} {isAr ? typeCfg.ar : typeCfg.en}</div>
            {typeCfg.fields.some((f) => details[f.key]) && (
              <div className="mt-1 text-xs text-slate-300 print:text-black">{typeCfg.fields.filter((f) => details[f.key]).map((f) => `${isAr ? f.labelAr : f.labelEn}: ${details[f.key]}`).join(' · ')}</div>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300 print:text-black">
              <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1"><MapPin className="w-3 h-3" />{locationName(locationId, isAr)} · {(isAr ? hall?.name : hall?.nameEn || hall?.name) || '—'}</span>
              <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1"><Users className="w-3 h-3" />{guests} {tr('فرد', 'guests')}</span>
              {date && <span className="rounded-full border border-slate-700 px-2 py-1 font-mono">{date}</span>}
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-3 text-slate-300 print:text-black"><span>{tr('إيجار', 'Rent')} {(isAr ? hall?.name : hall?.nameEn || hall?.name) || tr('القاعة', 'hall')}</span><span className="font-mono">{money(hallRent)}</span></div>
              {pkg && <div className="flex justify-between gap-3 text-slate-300 print:text-black"><span>{isAr ? pkg.nameAr : pkg.nameEn}<span className="block text-[10px] text-slate-500">{pkgPrice.toLocaleString()} × {guests} {tr('فرد', 'guests')}</span></span><span className="font-mono">{money(pkgTotal)}</span></div>}
              {extraLines.map((l) => (
                <div key={l.srv.id} className="flex justify-between gap-3 text-slate-300 print:text-black"><span className="line-clamp-2">{l.srv.name}<span className="block text-[10px] text-slate-500">{l.price.toLocaleString()} × {l.qty}</span></span><span className="font-mono shrink-0">{money(l.total)}</span></div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-700">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-400">{tr('الإجمالي', 'Total')}</span>
                <span className="text-3xl font-black text-amber-300 font-mono print:text-black">{Math.round(grandTotal).toLocaleString()}<span className="text-sm text-slate-400"> {tr('ج.م', 'EGP')}</span></span>
              </div>
              <div className="mt-1 text-end text-[11px] text-slate-500">≈ {egp(Math.round(perGuest))} {tr('للفرد', 'per guest')}</div>
            </div>

            <div className="mt-5 grid gap-2 print:hidden">
              <button type="button" onClick={saveAsBooking} disabled={!canSave}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed">
                <CalendarCheck className="w-4 h-4" /> {tr('حفظ كحجز مبدئي', 'Save as tentative booking')}
              </button>
              <button type="button" onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs text-slate-300 hover:text-white">
                <Printer className="w-4 h-4" /> {tr('طباعة عرض السعر', 'Print quote')}
              </button>
              {conflict && !savedCode && <p className="text-[11px] font-semibold text-rose-300 text-center">{isAr ? `القاعة محجوزة في هذا اليوم (${conflict.startTime} – ${conflict.endTime}) باسم ${conflict.clientName}. اختر تاريخاً أو قاعة أخرى.` : `The hall is booked that day (${conflict.startTime} – ${conflict.endTime}) for ${conflict.clientName}. Choose another date or hall.`}</p>}
              {!canSave && !savedCode && !conflict && (
                <p className="text-[11px] text-slate-500 text-center">{isAr ? `للحفظ: اختر القاعة والتاريخ واكتب اسم العميل والهاتف${missingRequired.length ? ` و${missingRequired.map((f) => f.labelAr).join(' و')}` : ''}.` : `To save: choose a hall and date and enter the client name and phone${missingRequired.length ? `, plus ${missingRequired.map((f) => f.labelEn).join(', ')}` : ''}.`}</p>
              )}
              {savedCode && <p className="text-xs text-emerald-400 text-center">{tr('تم الحفظ كحجز مبدئي برقم', 'Saved as tentative booking')} <span className="font-mono">{savedCode}</span> — {tr('بانتظار تأكيد الإدارة والعربون.', 'waiting for management to confirm and take the deposit.')}</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
