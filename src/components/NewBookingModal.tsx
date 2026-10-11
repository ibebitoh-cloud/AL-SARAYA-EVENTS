import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Sparkles, Check, ArrowRight, MapPin, Package as PackageIcon } from 'lucide-react';
import { Booking, Hall, ServiceDefinition, EventType, LocationId, PriceBook, BookingServiceItem } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import { EVENT_TYPES, eventTypeConfig } from '../data/eventTypes';
import { LOCATIONS, hallLocation } from '../data/locations';
import { packagesFor, packagePriceAt, servicePriceAt } from '../data/pricing';

const CUSTOM_HALL_ID = 'custom-hall';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  halls: Hall[];
  servicesCatalogue: ServiceDefinition[];
  priceBook: PriceBook;
  existingBookings: Booking[];
  onCreateBooking: (newBooking: Booking) => void;
  preselectedHallId?: string;
  /** Public website request: no payments, no internal fields. */
  customerMode?: boolean;
  /** Limited staff user (operations agent): sees selling prices only, records a tentative booking without payments. */
  hideFinancials?: boolean;
}

const inputCls = 'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500';
const labelCls = 'block text-xs font-semibold text-slate-300 mb-1';
const sectionCls = 'p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3';

export function NewBookingModal({
  isOpen, onClose, halls, servicesCatalogue, priceBook, existingBookings, onCreateBooking,
  preselectedHallId, customerMode = false, hideFinancials = false,
}: NewBookingModalProps) {
  const noPayments = customerMode || hideFinancials;
  const initialHall = halls.find((h) => h.id === preselectedHallId) || halls[0];

  // Step 1: the operation type. Everything after it depends on the type.
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:30');
  const [locationId, setLocationId] = useState<LocationId>(hallLocation(initialHall));
  const [hallId, setHallId] = useState(initialHall?.id || '');
  const [customHallName, setCustomHallName] = useState('');
  const [guestCount, setGuestCount] = useState(300);
  const [basePrice, setBasePrice] = useState(initialHall?.basePrice || 0);
  const [packageId, setPackageId] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [deposit, setDeposit] = useState(15000);
  const [securityDeposit, setSecurityDeposit] = useState(5000);
  const [status, setStatus] = useState<'confirmed' | 'tentative'>(noPayments ? 'tentative' : 'confirmed');
  const [notes, setNotes] = useState('');

  // Start fresh every time the form opens.
  useEffect(() => {
    if (!isOpen) return;
    const hall = halls.find((h) => h.id === preselectedHallId) || halls[0];
    setEventType(null); setDetails({}); setPackageId(''); setSelectedServices({});
    setClientName(''); setClientPhone(''); setClientAddress(''); setNotes(''); setDate(''); setCustomHallName('');
    setLocationId(hallLocation(hall)); setHallId(hall?.id || ''); setBasePrice(hall?.basePrice || 0);
    setStatus(noPayments ? 'tentative' : 'confirmed');
  }, [isOpen, preselectedHallId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const isCustomHall = hallId === CUSTOM_HALL_ID;
  const locationHalls = halls.filter((h) => hallLocation(h) === locationId);
  const currentHall = halls.find((h) => h.id === hallId);
  const bookedHallName = isCustomHall ? customHallName.trim() : (currentHall?.name || '');
  const typeCfg = eventType ? eventTypeConfig(eventType) : null;
  const typePackages = eventType ? packagesFor(eventType) : [];
  const selectedPackage = typePackages.find((p) => p.id === packageId);
  const packageUnitPrice = selectedPackage ? packagePriceAt(priceBook, locationId, selectedPackage.id) : null;

  const chooseType = (type: EventType) => {
    sound.click(650);
    const cfg = eventTypeConfig(type);
    setEventType(type);
    setDetails({});
    setPackageId('');
    setGuestCount(cfg.defaultGuests);
    setStartTime(cfg.defaultStart);
    setEndTime(cfg.defaultEnd);
  };

  const chooseLocation = (loc: LocationId) => {
    setLocationId(loc);
    const first = halls.find((h) => hallLocation(h) === loc);
    if (!isCustomHall && first) { setHallId(first.id); setBasePrice(first.basePrice); }
  };

  const conflictingBooking = existingBookings.find((b) =>
    b.status !== 'cancelled' &&
    (isCustomHall ? !!bookedHallName && b.hallName.trim() === bookedHallName : b.hallId === hallId) &&
    b.date === date &&
    ((startTime >= b.startTime && startTime < b.endTime) ||
      (endTime > b.startTime && endTime <= b.endTime) ||
      (startTime <= b.startTime && endTime >= b.endTime))
  );

  const toggleService = (srv: ServiceDefinition) => {
    sound.tick();
    setSelectedServices((prev) => {
      const copy = { ...prev };
      if (copy[srv.id]) delete copy[srv.id];
      else copy[srv.id] = srv.unit === 'فرد' ? guestCount : 1;
      return copy;
    });
  };

  const lineItems: BookingServiceItem[] = [];
  if (selectedPackage && packageUnitPrice) {
    lineItems.push({
      id: `bs-${Date.now()}-${selectedPackage.id}`, serviceId: selectedPackage.id, name: selectedPackage.nameAr,
      quantity: guestCount, unitPrice: packageUnitPrice.price, costPrice: packageUnitPrice.cost,
      totalPrice: packageUnitPrice.price * guestCount, totalCost: packageUnitPrice.cost * guestCount,
    });
  }
  Object.entries(selectedServices).forEach(([srvId, qty]) => {
    const srv = servicesCatalogue.find((s) => s.id === srvId);
    if (!srv) return;
    const p = servicePriceAt(priceBook, locationId, srv);
    lineItems.push({
      id: `bs-${Date.now()}-${srvId}`, serviceId: srvId, name: srv.name, quantity: qty,
      unitPrice: p.price, costPrice: p.cost, totalPrice: p.price * qty, totalCost: p.cost * qty,
    });
  });
  const servicesTotal = lineItems.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalPrice = (Number(basePrice) || 0) + servicesTotal;
  const paidNow = noPayments ? 0 : (Number(deposit) || 0);
  const remainingAmount = Math.max(0, totalPrice - paidNow);
  const missingRequired = typeCfg?.fields.some((f) => f.required && !details[f.key]?.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType || !clientName.trim() || !clientPhone.trim() || !bookedHallName || missingRequired) return;
    sound.success();
    const cleanDetails = Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
    onCreateBooking({
      id: `bk-${Date.now()}`,
      code: `BK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      eventType, date, startTime, endTime,
      hallId, hallName: bookedHallName, locationId,
      guestCount: Number(guestCount) || 0,
      basePrice: Number(basePrice) || 0,
      services: lineItems,
      packageId: selectedPackage?.id, packageName: selectedPackage?.nameAr,
      eventDetails: cleanDetails,
      totalPrice,
      deposit: paidNow,
      paidAmount: paidNow,
      remainingAmount,
      securityDeposit: noPayments ? 0 : (Number(securityDeposit) || 0),
      securityDepositStatus: 'held',
      status: noPayments ? 'tentative' : status,
      notes: notes.trim(),
      assignedStaff: [],
      suppliesCost: 2000,
      directExpenses: 1000,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-8 text-right my-auto max-h-[92vh] overflow-y-auto"
        >
          <button onClick={() => { onClose(); sound.tick(); }} className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">{customerMode ? 'طلب حجز مناسبة' : 'تسجيل عملية / حجز جديد'}</h3>
          </div>

          {/* STEP 1 — choose the operation type */}
          {!eventType && (
            <div className="mt-5">
              <p className="text-xs text-slate-400 mb-4">الخطوة 1 من 2 — اختر نوع المناسبة أولاً، وستظهر التفاصيل الخاصة بها.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EVENT_TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => chooseType(t.id)}
                    className="group p-5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500 hover:bg-indigo-600/10 transition-all text-right">
                    <div className="text-3xl">{t.emoji}</div>
                    <div className="mt-3 text-sm font-bold text-white">{t.ar}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{t.descAr}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — details that depend on the type */}
          {eventType && typeCfg && (
            <form onSubmit={handleSubmit} className="space-y-5 mt-5">
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/40">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeCfg.emoji}</span>
                  <div>
                    <div className="text-[10px] text-indigo-300">الخطوة 2 من 2 — نوع المناسبة</div>
                    <div className="text-sm font-bold text-white">{typeCfg.ar}</div>
                  </div>
                </div>
                <button type="button" onClick={() => setEventType(null)} className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white">
                  <ArrowRight className="w-3.5 h-3.5" /> تغيير النوع
                </button>
              </div>

              {conflictingBooking && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <strong className="block text-rose-300 font-bold">تنبيه: يوجد تعارض في المواعيد بالقاعة المحددة!</strong>
                    <span>القاعة محجوزة مسبقاً بنفس اليوم باسم ({conflictingBooking.clientName}) من {conflictingBooking.startTime} إلى {conflictingBooking.endTime}.</span>
                  </div>
                </div>
              )}

              {/* 1. Type-specific details (bride & groom for weddings/engagements, company for conferences...) */}
              <div className={sectionCls}>
                <h4 className="text-xs font-bold text-indigo-400">1. بيانات {typeCfg.ar}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {typeCfg.fields.map((f) => (
                    <div key={f.key}>
                      <label className={labelCls}>{f.labelAr}{f.required && ' *'}</label>
                      <input type={f.type || 'text'} required={f.required} placeholder={f.placeholderAr || ''}
                        value={details[f.key] || ''} onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Client */}
              <div className={sectionCls}>
                <h4 className="text-xs font-bold text-indigo-400">2. بيانات العميل والتواصل</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>اسم العميل (المسؤول عن الحجز) *</label>
                    <input type="text" required placeholder="مثال: محمد السيد النجار" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>رقم الهاتف *</label>
                    <input type="tel" required placeholder="010XXXXXXXX" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>العنوان / المنطقة</label>
                    <input type="text" placeholder="بورسعيد / الإسماعيلية" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* 3. Location, hall, date */}
              <div className={sectionCls}>
                <h4 className="text-xs font-bold text-indigo-400">3. المكان والقاعة والموعد</h4>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATIONS.map((loc) => (
                    <button key={loc.id} type="button" onClick={() => chooseLocation(loc.id)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${locationId === loc.id ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'}`}>
                      <MapPin className="w-3.5 h-3.5" /> {loc.nameAr}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>القاعة المحجوزة</label>
                    <select value={hallId} onChange={(e) => { setHallId(e.target.value); const h = halls.find((x) => x.id === e.target.value); if (h) setBasePrice(h.basePrice); }} className={inputCls}>
                      {locationHalls.map((h) => <option key={h.id} value={h.id}>{h.name} (سعة {h.capacity} فرد)</option>)}
                      <option value={CUSTOM_HALL_ID}>➕ قاعة أخرى (اكتب الاسم)</option>
                    </select>
                    {isCustomHall && (
                      <input type="text" required autoFocus value={customHallName} onChange={(e) => setCustomHallName(e.target.value)}
                        placeholder="اكتب اسم القاعة / المكان" className={`mt-2 ${inputCls} border-indigo-500/60`} />
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>عدد المدعوين المتوقع</label>
                    <input type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value) || 0)} className={`${inputCls} font-mono`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className={labelCls}>تاريخ المناسبة</label><input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} font-mono`} /></div>
                  <div><label className={labelCls}>وقت البداية</label><input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={`${inputCls} font-mono`} /></div>
                  <div><label className={labelCls}>وقت النهاية</label><input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={`${inputCls} font-mono`} /></div>
                </div>
              </div>

              {/* 4. Package for this type, priced for this location */}
              {typePackages.length > 0 && (
                <div className={sectionCls}>
                  <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5"><PackageIcon className="w-3.5 h-3.5" /> 4. الباقة ({LOCATIONS.find((l) => l.id === locationId)?.nameAr})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button type="button" onClick={() => setPackageId('')}
                      className={`p-3 rounded-xl border text-xs text-right ${!packageId ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}>
                      بدون باقة — خدمات منفصلة فقط
                    </button>
                    {typePackages.map((pkg) => {
                      const p = packagePriceAt(priceBook, locationId, pkg.id);
                      return (
                        <button key={pkg.id} type="button" onClick={() => { sound.tick(); setPackageId(pkg.id); }}
                          className={`p-3 rounded-xl border text-xs text-right ${packageId === pkg.id ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'}`}>
                          <div className="flex items-center justify-between gap-2"><strong>{pkg.nameAr}</strong>
                            <span className="font-mono text-indigo-300">{customerMode ? '' : `${p.price.toLocaleString()} ج.م / فرد`}</span></div>
                          <div className="mt-1 text-[10px] text-slate-500 line-clamp-1">{pkg.includesAr.join(' · ')}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Add-on services, priced for this location */}
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400">5. خدمات وإضافات</h4>
                  {!customerMode && <span className="text-xs font-mono text-emerald-400 font-bold">إجمالي الباقة والخدمات: {servicesTotal.toLocaleString()} ج.م</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {servicesCatalogue.map((srv) => {
                    const isChecked = !!selectedServices[srv.id];
                    const qty = selectedServices[srv.id] || 1;
                    const price = servicePriceAt(priceBook, locationId, srv).price;
                    return (
                      <div key={srv.id} onClick={() => toggleService(srv)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${isChecked ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${isChecked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-600'}`}>{isChecked && <Check className="w-3 h-3" />}</div>
                          <span className="font-medium line-clamp-1">{srv.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isChecked && <input type="number" min="1" value={qty} onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSelectedServices((prev) => ({ ...prev, [srv.id]: Math.max(1, Number(e.target.value) || 1) }))}
                            className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono text-xs text-white" />}
                          <span className="font-mono text-indigo-300 font-bold">{customerMode ? 'متاح' : `${price.toLocaleString()} ج.م`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selling-price summary for the operations agent (no payments, no costs). */}
              {hideFinancials && !customerMode && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-200">
                  <span>إيجار القاعة: <strong>{(Number(basePrice) || 0).toLocaleString()} ج.م</strong></span>
                  <span>الإجمالي للعميل: <strong className="text-amber-300">{totalPrice.toLocaleString()} ج.م</strong></span>
                  <span className="text-slate-400 font-sans">يُسجَّل كحجز مبدئي — يتم تأكيده وتحصيل العربون من الإدارة</span>
                </div>
              )}

              {/* 6. Payments — managers only */}
              {!noPayments && (
                <div className={sectionCls}>
                  <h4 className="text-xs font-bold text-indigo-400">6. الحسابات، العربون، والتأمين</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><label className={labelCls}>سعر القاعة الأساسي</label><input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value) || 0)} className={`${inputCls} font-mono`} /></div>
                    <div><label className={labelCls}>العربون المدفوع الآن</label><input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value) || 0)} className={`${inputCls} font-mono`} /></div>
                    <div><label className={labelCls}>مبلغ التأمين (مسترد)</label><input type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(Number(e.target.value) || 0)} className={`${inputCls} font-mono text-amber-300`} /></div>
                    <div><label className={labelCls}>حالة الحجز</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value as 'confirmed' | 'tentative')} className={inputCls}>
                        <option value="confirmed">مؤكد</option><option value="tentative">مبدئي</option>
                      </select></div>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-200">
                    <span>الإجمالي: <strong>{totalPrice.toLocaleString()} ج.م</strong></span>
                    <span className="text-emerald-400">المدفوع (عربون): <strong>{paidNow.toLocaleString()} ج.م</strong></span>
                    <span className="text-rose-400">المتبقي للتحصيل: <strong>{remainingAmount.toLocaleString()} ج.م</strong></span>
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>ملاحظات أو طلبات خاصة من العميل</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="تفاصيل الترتيبات، مواعيد التسليم والتجهيز..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 cursor-pointer">
                  {customerMode ? 'إرسال طلب الحجز' : hideFinancials ? 'حفظ كحجز مبدئي' : 'حفظ وتسجيل الحجز رسمياً'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
