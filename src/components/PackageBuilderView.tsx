import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, ClipboardList, MapPin, Minus, Pencil, Play, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import { Booking, EventType, Hall, LocationId, PriceBook, ServiceDefinition } from '../types/venueSystem';
import { EVENT_TYPES, eventDetailsSummary, eventTypeConfig } from '../data/eventTypes';
import { LOCATIONS, hallLocation, locationName } from '../data/locations';
import { PreparedOperation, loadPreparedOperations, savePreparedOperations } from '../data/preparedOperations';
import { ChoiceSessionView } from './ChoiceSessionView';
import { sound } from '../utils/soundEffects';
import { findBookingConflict, uniqueBookingCode } from '../utils/bookingRules';

interface Props {
  halls: Hall[];
  services: ServiceDefinition[];
  priceBook: PriceBook;
  existingBookings: Booking[];
  onCreateBooking: (booking: Booking) => void;
}

const card = 'rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6';
const input = 'w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400';

const blankOperation = (halls: Hall[]): PreparedOperation => {
  const cfg = eventTypeConfig('wedding');
  const hall = halls.find((h) => hallLocation(h) === 'arcane');
  return {
    id: `op-${Date.now()}`, createdAt: new Date().toISOString(), eventType: 'wedding', locationId: 'arcane', hallId: hall?.id || '',
    guests: hall?.capacity ? Math.min(cfg.defaultGuests, hall.capacity) : cfg.defaultGuests, date: '',
    startTime: cfg.defaultStart, endTime: cfg.defaultEnd, clientName: '', clientPhone: '', details: {}, budget: 0, notes: '',
    packageId: '', selections: {},
  };
};

/**
 * Event Planner. The team prepares each operation before the meeting (client, type, hall, date, guests);
 * in the meeting the customer only chooses in the choice session. Selling prices only.
 */
export function PackageBuilderView({ halls, priceBook, existingBookings, onCreateBooking }: Props) {
  const [ops, setOps] = useState<PreparedOperation[]>(loadPreparedOperations);
  const [draft, setDraft] = useState<PreparedOperation | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => savePreparedOperations(ops), [ops]);

  const upsert = (op: PreparedOperation) => setOps((prev) => prev.some((o) => o.id === op.id) ? prev.map((o) => o.id === op.id ? op : o) : [op, ...prev]);
  const session = ops.find((o) => o.id === sessionId);

  if (session) {
    return <ChoiceSessionView op={session} hall={halls.find((h) => h.id === session.hallId)} priceBook={priceBook}
      onChange={upsert} onBack={() => setSessionId(null)} onCreateBooking={onCreateBooking} />;
  }

<<<<<<< Updated upstream
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
=======
  if (draft) {
    return <OperationForm draft={draft} halls={halls} existingBookings={existingBookings}
      onCancel={() => setDraft(null)} onSave={(op) => { sound.success(); upsert(op); setDraft(null); }} />;
  }
>>>>>>> Stashed changes

  return (
    <div className="w-full pb-20 text-right space-y-5">
      <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-white"><Sparkles className="h-5 w-5 text-amber-400" /> تصميم الحفلة مع العميل</h2>
          <p className="mt-1 text-xs text-slate-400">جهّز بيانات العملية قبل المقابلة، ثم افتح جلسة الاختيار أمام العميل — بدون إدخال بيانات أمامه.</p>
        </div>
        <button type="button" onClick={() => { sound.click(650); setDraft(blankOperation(halls)); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300"><Plus className="h-4 w-4" /> تجهيز عملية جديدة</button>
      </div>

<<<<<<< Updated upstream
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
              {conflict && !savedCode && <p className="text-[11px] font-semibold text-rose-300 text-center">القاعة محجوزة في هذا اليوم ({conflict.startTime} – {conflict.endTime}) باسم {conflict.clientName}. اختر تاريخاً أو قاعة أخرى.</p>}
              {!canSave && !savedCode && !conflict && (
                <p className="text-[11px] text-slate-500 text-center">للحفظ: اختر القاعة والتاريخ واكتب اسم العميل والهاتف{missingRequired.length ? ` و${missingRequired.map((f) => f.labelAr).join(' و')}` : ''}.</p>
              )}
              {savedCode && <p className="text-xs text-emerald-400 text-center">تم الحفظ كحجز مبدئي برقم <span className="font-mono">{savedCode}</span> — بانتظار تأكيد الإدارة والعربون.</p>}
            </div>
=======
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300"><ClipboardList className="h-4 w-4" /> العمليات الجاهزة</h3>
        {ops.length === 0 ? (
          <div className={`${card} py-12 text-center`}>
            <ClipboardList className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-300">لا توجد عمليات جاهزة بعد</p>
            <p className="mt-1 text-xs text-slate-500">جهّز العملية قبل موعد المقابلة: بيانات العميل، نوع المناسبة، القاعة والتاريخ.</p>
>>>>>>> Stashed changes
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ops.map((op) => {
              const cfg = eventTypeConfig(op.eventType);
              const hall = halls.find((h) => h.id === op.hallId);
              const choices = Object.keys(op.selections).length + (op.packageId ? 1 : 0);
              const status = op.bookingCode ? { label: `تم الحجز ${op.bookingCode}`, cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' }
                : choices ? { label: `جلسة جارية · ${choices} اختيار`, cls: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' }
                : { label: 'جاهزة للجلسة', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-200' };
              return (
                <article key={op.id} className={`${card} flex flex-col gap-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-black text-white">{cfg.emoji} {op.clientName}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{cfg.ar}{eventDetailsSummary(op.eventType, op.details) ? ` · ${eventDetailsSummary(op.eventType, op.details)}` : ''}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.cls}`}>{status.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><CalendarDays className="h-3 w-3" /><span className="font-mono">{op.date}</span></span>
                    <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><MapPin className="h-3 w-3" />{hall?.name || '—'}</span>
                    <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><Users className="h-3 w-3" />{op.guests}</span>
                  </div>
                  {op.notes && <p className="line-clamp-2 text-[11px] text-slate-500">{op.notes}</p>}
                  <div className="mt-auto flex gap-2 pt-1">
                    <button type="button" onClick={() => { sound.click(700); setSessionId(op.id); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-300"><Play className="h-3.5 w-3.5" />{choices ? 'استكمال الجلسة' : 'ابدأ الجلسة مع العميل'}</button>
                    <button type="button" aria-label="تعديل" onClick={() => setDraft(op)} className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:text-white"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label="حذف" onClick={() => { if (window.confirm(`حذف عملية ${op.clientName}؟`)) setOps((prev) => prev.filter((o) => o.id !== op.id)); }} className="rounded-xl border border-red-900/60 p-2 text-red-300 hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface FormProps {
  draft: PreparedOperation;
  halls: Hall[];
  existingBookings: Booking[];
  onCancel: () => void;
  onSave: (op: PreparedOperation) => void;
}

/** Staff-only preparation form, filled before the customer meeting. */
function OperationForm({ draft, halls, existingBookings, onCancel, onSave }: FormProps) {
  const [op, setOp] = useState(draft);
  const set = (patch: Partial<PreparedOperation>) => setOp((prev) => ({ ...prev, ...patch }));
  const cfg = eventTypeConfig(op.eventType);
  const locHalls = halls.filter((h) => hallLocation(h) === op.locationId);
  const hall = halls.find((h) => h.id === op.hallId);

  const pickType = (t: EventType) => {
    const next = eventTypeConfig(t);
    set({ eventType: t, details: {}, startTime: next.defaultStart, endTime: next.defaultEnd, packageId: '', selections: {},
      guests: hall?.capacity ? Math.min(next.defaultGuests, hall.capacity) : next.defaultGuests });
  };
  const pickLocation = (l: LocationId) => set({ locationId: l, hallId: halls.find((h) => hallLocation(h) === l)?.id || '' });

  const missing = [
    !op.clientName.trim() && 'اسم العميل',
    !op.clientPhone.trim() && 'رقم الهاتف',
    !op.hallId && 'القاعة',
    !op.date && 'التاريخ',
    ...cfg.fields.filter((f) => f.required && !op.details[f.key]?.trim()).map((f) => f.labelAr),
  ].filter(Boolean) as string[];
  const overCapacity = hall && hall.capacity > 0 && op.guests > hall.capacity;
  const sameDay = hall && op.date ? existingBookings.find((b) => b.status !== 'cancelled' && b.hallId === hall.id && b.date === op.date) : undefined;

  return (
    <div className="w-full pb-20 text-right space-y-5">
      <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="text-lg font-black text-white">تجهيز عملية قبل المقابلة</h2>
          <p className="mt-1 text-xs text-slate-400">هذه البيانات لا تظهر كنموذج أمام العميل — تُجهَّز مسبقاً، وفي الجلسة يختار العميل فقط.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white">إلغاء</button>
      </div>

      <section className={card}>
        <h3 className="mb-3 text-sm font-bold text-amber-300">1. العميل ونوع المناسبة</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {EVENT_TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => pickType(t.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${op.eventType === t.id ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'}`}>
              <span className="text-xl">{t.emoji}</span><span>{t.ar}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-400">اسم العميل *<input value={op.clientName} onChange={(e) => set({ clientName: e.target.value })} className={`${input} mt-1`} /></label>
          <label className="text-xs text-slate-400">رقم الهاتف *<input type="tel" value={op.clientPhone} onChange={(e) => set({ clientPhone: e.target.value })} className={`${input} mt-1 font-mono`} /></label>
          {cfg.fields.map((f) => (
            <label key={f.key} className="text-xs text-slate-400">{f.labelAr}{f.required && ' *'}
              <input type={f.type || 'text'} placeholder={f.placeholderAr || ''} value={op.details[f.key] || ''} onChange={(e) => set({ details: { ...op.details, [f.key]: e.target.value } })} className={`${input} mt-1`} />
            </label>
          ))}
        </div>
      </section>

      <section className={card}>
        <h3 className="mb-3 text-sm font-bold text-amber-300">2. المكان والموعد والعدد</h3>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {LOCATIONS.map((l) => (
            <button key={l.id} type="button" onClick={() => pickLocation(l.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-bold transition ${op.locationId === l.id ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-slate-700 text-slate-300 hover:text-white'}`}>
              <MapPin className="h-4 w-4" /> {l.nameAr}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {locHalls.map((h) => (
            <button key={h.id} type="button" onClick={() => set({ hallId: h.id })}
              className={`rounded-2xl border p-3 text-right transition ${op.hallId === h.id ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}>
              <div className="text-sm font-bold text-white">{h.name}</div>
              <div className="mt-1 text-[11px] text-slate-400">حتى {h.capacity} فرد</div>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-xs text-slate-400">عدد المدعوين
            <div className="mt-1 flex items-center gap-2">
              <button type="button" aria-label="أقل" onClick={() => set({ guests: Math.max(10, op.guests - 10) })} className="rounded-xl border border-slate-700 p-2.5 text-slate-300"><Minus className="h-4 w-4" /></button>
              <input type="number" min={1} value={op.guests} onChange={(e) => set({ guests: Math.max(1, Number(e.target.value) || 1) })} className={`${input} min-w-0 flex-1 text-center font-mono text-lg`} />
              <button type="button" aria-label="أكثر" onClick={() => set({ guests: op.guests + 10 })} className="rounded-xl border border-slate-700 p-2.5 text-slate-300"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <label className="text-xs text-slate-400">التاريخ *<input type="date" value={op.date} onChange={(e) => set({ date: e.target.value })} className={`${input} mt-1 font-mono`} /></label>
          <label className="text-xs text-slate-400">من<input type="time" value={op.startTime} onChange={(e) => set({ startTime: e.target.value })} className={`${input} mt-1 font-mono`} /></label>
          <label className="text-xs text-slate-400">إلى<input type="time" value={op.endTime} onChange={(e) => set({ endTime: e.target.value })} className={`${input} mt-1 font-mono`} /></label>
        </div>
        {overCapacity && <p className="mt-2 flex items-center gap-1 text-xs text-rose-300"><AlertTriangle className="h-3.5 w-3.5" /> العدد أكبر من سعة {hall?.name} ({hall?.capacity} فرد)</p>}
        {sameDay && <p className="mt-2 flex items-center gap-1 text-xs text-rose-300"><AlertTriangle className="h-3.5 w-3.5" /> يوجد حجز آخر في {hall?.name} بنفس اليوم ({sameDay.startTime}–{sameDay.endTime})</p>}
      </section>

      <section className={card}>
        <h3 className="mb-3 text-sm font-bold text-amber-300">3. ملاحظات للفريق قبل الجلسة</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr]">
          <label className="text-xs text-slate-400">الميزانية المتوقعة (اختياري)<input type="number" min={0} value={op.budget || ''} onChange={(e) => set({ budget: Math.max(0, Number(e.target.value) || 0) })} placeholder="ج.م" className={`${input} mt-1 font-mono`} /></label>
          <label className="text-xs text-slate-400">ملاحظات (ذوق العميل، طلبات خاصة...)<textarea rows={2} value={op.notes} onChange={(e) => set({ notes: e.target.value })} className={`${input} mt-1`} /></label>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">الميزانية تظهر في عرض السعر كتنبيه فقط إذا تم تجاوزها.</p>
      </section>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-slate-500">{missing.length ? `مطلوب: ${missing.join(' · ')}` : `جاهزة — ${locationName(op.locationId, true)} · ${hall?.name}`}</p>
        <button type="button" disabled={missing.length > 0} onClick={() => onSave(op)} className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40">حفظ العملية</button>
      </div>
    </div>
  );
}
