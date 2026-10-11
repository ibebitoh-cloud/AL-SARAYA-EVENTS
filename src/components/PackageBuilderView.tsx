import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, MapPin, Users, Printer, CalendarCheck, RotateCcw, Minus, Plus, AlertTriangle, Sparkles } from 'lucide-react';
import { Booking, BookingServiceItem, EventType, Hall, LocationId, PriceBook, ServiceDefinition } from '../types/venueSystem';
import { EVENT_TYPES, eventTypeConfig } from '../data/eventTypes';
import { LOCATIONS, hallLocation, locationName } from '../data/locations';
import { packagesFor, packagePriceAt, servicePriceAt } from '../data/pricing';
import { sound } from '../utils/soundEffects';

interface Props {
  halls: Hall[];
  services: ServiceDefinition[];
  priceBook: PriceBook;
  existingBookings: Booking[];
  onCreateBooking: (booking: Booking) => void;
}

const money = (n: number) => `${Math.round(n).toLocaleString()} ج.م`;
const card = 'rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6';
const input = 'w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400';

/**
 * Sit-down screen for the operations team and the customer: pick the event, location, hall,
 * package and extras together and see the price build up. Selling prices only — no costs or margins.
 */
export function PackageBuilderView({ halls, services, priceBook, existingBookings, onCreateBooking }: Props) {
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
    setExtras((prev) => { const c = { ...prev }; if (c[srv.id]) delete c[srv.id]; else c[srv.id] = srv.unit === 'فرد' ? guests : 1; return c; });
  };
  const reset = () => { setPackageId(''); setExtras({}); setDetails({}); setClientName(''); setClientPhone(''); setDate(''); setSavedCode(''); };

  const missingRequired = typeCfg.fields.filter((f) => f.required && !details[f.key]?.trim());
  const canSave = !!hall && !!clientName.trim() && !!clientPhone.trim() && !!date && missingRequired.length === 0;

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
    const code = `BK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
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
    <div className="w-full pb-20 text-right space-y-5 print:p-0">
      <div className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden`}>
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> تصميم الحفلة مع العميل</h2>
          <p className="text-xs text-slate-400 mt-1">اختاروا معاً نوع المناسبة والمكان والباقة والإضافات — الأسعار المعروضة هي أسعار البيع للعميل.</p>
        </div>
        <button type="button" onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white"><RotateCcw className="w-3.5 h-3.5" /> بدء تصميم جديد</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5 print:hidden">
          {/* 1. Type */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">1. نوع المناسبة</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {EVENT_TYPES.map((t) => (
                <button key={t.id} type="button" onClick={() => pickType(t.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${eventType === t.id ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
                  <div className="text-2xl">{t.emoji}</div>
                  <div className="mt-1 text-xs font-bold text-white">{t.ar}</div>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Location & hall */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">2. المكان والقاعة</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {LOCATIONS.map((l) => (
                <button key={l.id} type="button" onClick={() => pickLocation(l.id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-bold transition-all ${locationId === l.id ? 'bg-amber-400 text-slate-950 border-amber-300' : 'border-slate-700 text-slate-300 hover:text-white'}`}>
                  <MapPin className="w-4 h-4" /> {l.nameAr}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {locHalls.map((h) => (
                <button key={h.id} type="button" onClick={() => { sound.tick(); setHallId(h.id); }}
                  className={`overflow-hidden rounded-2xl border text-right transition-all ${hallId === h.id ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800 hover:border-slate-600'}`}>
                  <div className="h-20" style={{ background: h.photo ? `center/cover url(${h.photo})` : `linear-gradient(135deg, ${h.color}55, #0f172a)` }} />
                  <div className="p-3 bg-slate-950/70">
                    <div className="text-sm font-bold text-white">{h.name}</div>
                    <div className="mt-1 text-[11px] text-slate-400">حتى {h.capacity} فرد</div>
                    <div className="mt-1 text-xs font-mono text-amber-300">{money(h.basePrice)}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">عدد المدعوين</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setGuests((g) => Math.max(10, g - 10))} className="p-2.5 rounded-xl border border-slate-700 text-slate-300"><Minus className="w-4 h-4" /></button>
                  <input type="number" min={1} value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))} className={`${input} text-center font-mono text-lg`} />
                  <button type="button" onClick={() => setGuests((g) => g + 10)} className="p-2.5 rounded-xl border border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">التاريخ المطلوب</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} font-mono`} />
              </div>
            </div>
            {overCapacity && <p className="mt-2 text-xs text-rose-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> العدد أكبر من سعة {hall?.name} ({hall?.capacity} فرد)</p>}
            {sameDayBooking && <p className="mt-2 text-xs text-rose-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> يوجد حجز آخر في {hall?.name} بنفس اليوم ({sameDayBooking.startTime}–{sameDayBooking.endTime})</p>}
          </section>

          {/* 3. Package */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">3. الباقة — أسعار {locationName(locationId, true)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pkgs.map((p) => {
                const price = packagePriceAt(priceBook, locationId, p.id).price;
                const active = packageId === p.id;
                return (
                  <motion.button key={p.id} type="button" whileTap={{ scale: 0.98 }} onClick={() => { sound.tick(); setPackageId(active ? '' : p.id); }}
                    className={`p-4 rounded-2xl border text-right transition-all ${active ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-black text-white">{p.nameAr}</div>
                      {active && <span className="rounded-full bg-amber-400 p-1 text-slate-950"><Check className="w-3 h-3" /></span>}
                    </div>
                    <div className="mt-2 text-xl font-black text-amber-300 font-mono">{price.toLocaleString()} <span className="text-xs font-sans text-slate-400">ج.م / فرد</span></div>
                    <ul className="mt-3 space-y-1">
                      {p.includesAr.map((i) => <li key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400 shrink-0" />{i}</li>)}
                    </ul>
                    <div className="mt-2 text-[10px] text-slate-500">الحد الأدنى {p.minGuests} فرد</div>
                  </motion.button>
                );
              })}
            </div>
            {belowMin && <p className="mt-2 text-xs text-amber-300">الحد الأدنى لهذه الباقة {pkg?.minGuests} فرد.</p>}
          </section>

          {/* 4. Extras */}
          <section className={card}>
            <h3 className="text-sm font-bold text-amber-300 mb-3">4. إضافات حسب رغبة العميل</h3>
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
            <h3 className="text-sm font-bold text-amber-300 mb-3">5. بيانات العميل و{typeCfg.ar}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1">اسم العميل *</label><input value={clientName} onChange={(e) => setClientName(e.target.value)} className={input} /></div>
              <div><label className="block text-xs text-slate-400 mb-1">رقم الهاتف *</label><input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={`${input} font-mono`} /></div>
              {typeCfg.fields.map((f) => (
                <div key={f.key}><label className="block text-xs text-slate-400 mb-1">{f.labelAr}{f.required && ' *'}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholderAr || ''} value={details[f.key] || ''} onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))} className={input} /></div>
              ))}
            </div>
          </section>
        </div>

        {/* Live quote — the customer sees this */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-amber-500/5 print:border-slate-300 print:bg-white print:text-black">
            <div className="text-[10px] tracking-[0.3em] text-amber-400 font-bold">SARAYA EVENTS · عرض سعر</div>
            <div className="mt-2 text-xl font-black text-white print:text-black">{typeCfg.emoji} {typeCfg.ar}</div>
            {typeCfg.fields.some((f) => details[f.key]) && (
              <div className="mt-1 text-xs text-slate-300 print:text-black">{typeCfg.fields.filter((f) => details[f.key]).map((f) => `${f.labelAr}: ${details[f.key]}`).join(' · ')}</div>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300 print:text-black">
              <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1"><MapPin className="w-3 h-3" />{locationName(locationId, true)} · {hall?.name || '—'}</span>
              <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1"><Users className="w-3 h-3" />{guests} فرد</span>
              {date && <span className="rounded-full border border-slate-700 px-2 py-1 font-mono">{date}</span>}
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-3 text-slate-300 print:text-black"><span>إيجار {hall?.name || 'القاعة'}</span><span className="font-mono">{money(hallRent)}</span></div>
              {pkg && <div className="flex justify-between gap-3 text-slate-300 print:text-black"><span>{pkg.nameAr}<span className="block text-[10px] text-slate-500">{pkgPrice.toLocaleString()} × {guests} فرد</span></span><span className="font-mono">{money(pkgTotal)}</span></div>}
              {extraLines.map((l) => (
                <div key={l.srv.id} className="flex justify-between gap-3 text-slate-300 print:text-black"><span className="line-clamp-2">{l.srv.name}<span className="block text-[10px] text-slate-500">{l.price.toLocaleString()} × {l.qty}</span></span><span className="font-mono shrink-0">{money(l.total)}</span></div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-700">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-400">الإجمالي</span>
                <span className="text-3xl font-black text-amber-300 font-mono print:text-black">{Math.round(grandTotal).toLocaleString()}<span className="text-sm text-slate-400"> ج.م</span></span>
              </div>
              <div className="mt-1 text-left text-[11px] text-slate-500">≈ {Math.round(perGuest).toLocaleString()} ج.م للفرد</div>
            </div>

            <div className="mt-5 grid gap-2 print:hidden">
              <button type="button" onClick={saveAsBooking} disabled={!canSave}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed">
                <CalendarCheck className="w-4 h-4" /> حفظ كحجز مبدئي
              </button>
              <button type="button" onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs text-slate-300 hover:text-white">
                <Printer className="w-4 h-4" /> طباعة عرض السعر
              </button>
              {!canSave && !savedCode && (
                <p className="text-[11px] text-slate-500 text-center">للحفظ: اختر القاعة والتاريخ واكتب اسم العميل والهاتف{missingRequired.length ? ` و${missingRequired.map((f) => f.labelAr).join(' و')}` : ''}.</p>
              )}
              {savedCode && <p className="text-xs text-emerald-400 text-center">تم الحفظ كحجز مبدئي برقم <span className="font-mono">{savedCode}</span> — بانتظار تأكيد الإدارة والعربون.</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
