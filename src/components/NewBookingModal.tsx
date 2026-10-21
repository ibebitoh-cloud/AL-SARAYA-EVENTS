import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Sparkles, Check, ArrowRight, MapPin, Package as PackageIcon } from 'lucide-react';
import { Booking, Hall, ServiceDefinition, EventType, LocationId, PriceBook, BookingServiceItem, Language } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import { EVENT_TYPES, eventTypeConfig } from '../data/eventTypes';
import { LOCATIONS, hallLocation } from '../data/locations';
import { packagesFor, packagePriceAt, servicePriceAt } from '../data/pricing';
import { findBookingConflict, uniqueBookingCode } from '../utils/bookingRules';

const CUSTOM_HALL_ID = 'custom-hall';
const CUSTOMER_VENUE_ID = 'customer-venue';

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
  language?: Language;
}

const inputCls = 'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500';
const labelCls = 'block text-xs font-semibold text-slate-300 mb-1';
const sectionCls = 'p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3';

export function NewBookingModal({
  isOpen, onClose, halls, servicesCatalogue, priceBook, existingBookings, onCreateBooking,
  preselectedHallId, customerMode = false, hideFinancials = false, language = 'ar',
}: NewBookingModalProps) {
  const isAr = language === 'ar';
  const tr = (ar: string, en: string) => (isAr ? ar : en);
  const egp = (n: number) => `${n.toLocaleString()} ${tr('ج.م', 'EGP')}`;
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
  const [submittedCode, setSubmittedCode] = useState('');

  // Start fresh every time the form opens.
  useEffect(() => {
    if (!isOpen) return;
    const hall = halls.find((h) => h.id === preselectedHallId) || halls[0];
    setEventType(null); setDetails({}); setPackageId(''); setSelectedServices({});
    setClientName(''); setClientPhone(''); setClientAddress(''); setNotes(''); setDate(''); setCustomHallName(''); setSubmittedCode('');
    setLocationId(hallLocation(hall)); setHallId(hall?.id || ''); setBasePrice(hall?.basePrice || 0);
    setStatus(noPayments ? 'tentative' : 'confirmed');
  }, [isOpen, preselectedHallId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const isCustomHall = hallId === CUSTOM_HALL_ID || hallId === CUSTOMER_VENUE_ID;
  const isCustomerVenue = hallId === CUSTOMER_VENUE_ID;
  const showLocationPrices = !customerMode || !isCustomerVenue;
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

  const conflictingBooking = findBookingConflict(existingBookings, {
    hallId: isCustomHall ? undefined : hallId, hallName: bookedHallName, date, startTime, endTime,
  });

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
    if (!eventType || !clientName.trim() || !clientPhone.trim() || !bookedHallName || !date || missingRequired || conflictingBooking) return;
    sound.success();
    const code = uniqueBookingCode(existingBookings);
    const cleanDetails = Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
    onCreateBooking({
      id: `bk-${Date.now()}`,
      code,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      eventType, date, startTime, endTime,
      hallId: isCustomHall ? '' : hallId, hallName: bookedHallName, locationId,
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
    // Customers get a confirmation screen; staff go straight back to their list.
    if (customerMode) setSubmittedCode(code);
    else onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
          dir={isAr ? 'rtl' : 'ltr'} role="dialog" aria-modal="true" aria-labelledby="new-booking-title"
          className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-8 text-start my-auto max-h-[92vh] overflow-y-auto"
        >
          <button type="button" aria-label={tr('إغلاق', 'Close')} onClick={() => { onClose(); sound.tick(); }} className="absolute top-5 end-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 id="new-booking-title" className="text-xl font-bold text-white">{customerMode ? tr('طلب حجز مناسبة', 'Request a booking') : tr('تسجيل حجز جديد', 'New booking')}</h3>
          </div>

          {submittedCode && (
            <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"><Check className="h-7 w-7" /></div>
              <h4 className="text-lg font-black text-white">{tr('تم إرسال طلبك بنجاح', 'Your request has been sent')}</h4>
              <p className="max-w-sm text-sm leading-6 text-slate-400">{tr('سيتواصل معك فريق السرايا قريباً لتأكيد الموعد والتفاصيل.', 'The Saraya team will contact you shortly to confirm the date and details.')}</p>
              <p className="text-xs text-slate-500">{tr('رقم الطلب', 'Request number')}: <span dir="ltr" className="font-mono font-bold text-amber-300">{submittedCode}</span></p>
              <button type="button" onClick={onClose} className="mt-2 rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300">{tr('تم', 'Done')}</button>
            </div>
          )}

          {/* STEP 1 — choose the operation type */}
          {!submittedCode && !eventType && (
            <div className="mt-5">
              <p className="text-xs text-slate-400 mb-4">{tr('الخطوة 1 من 2 — اختر نوع المناسبة، وستظهر لك التفاصيل الخاصة بها.', 'Step 1 of 2 — choose the type of event to see the details it needs.')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EVENT_TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => chooseType(t.id)}
                    className="group p-5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500 hover:bg-indigo-600/10 transition-all text-start">
                    <div className="text-3xl">{t.emoji}</div>
                    <div className="mt-3 text-sm font-bold text-white">{isAr ? t.ar : t.en}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{isAr ? t.descAr : t.descEn}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — details that depend on the type */}
          {!submittedCode && eventType && typeCfg && (
            <form onSubmit={handleSubmit} className="space-y-5 mt-5">
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/40">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeCfg.emoji}</span>
                  <div>
                    <div className="text-[10px] text-indigo-300">{tr('الخطوة 2 من 2 — نوع المناسبة', 'Step 2 of 2 — event type')}</div>
                    <div className="text-sm font-bold text-white">{isAr ? typeCfg.ar : typeCfg.en}</div>
                  </div>
                </div>
                <button type="button" onClick={() => setEventType(null)} className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white">
                  <ArrowRight className="w-3.5 h-3.5 ltr:rotate-180" /> {tr('تغيير النوع', 'Change type')}
                </button>
              </div>

              {conflictingBooking && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <strong className="block text-rose-300 font-bold">{tr('هذا الموعد غير متاح في القاعة المختارة', 'This time is not available in the selected hall')}</strong>
                    <span>{customerMode
                      ? tr(`القاعة محجوزة في هذا اليوم من ${conflictingBooking.startTime} إلى ${conflictingBooking.endTime}. يرجى اختيار موعد أو قاعة أخرى.`, `The hall is booked that day from ${conflictingBooking.startTime} to ${conflictingBooking.endTime}. Please choose another time or hall.`)
                      : tr(`القاعة محجوزة باسم (${conflictingBooking.clientName}) من ${conflictingBooking.startTime} إلى ${conflictingBooking.endTime}. غيّر الموعد أو القاعة للحفظ.`, `Already booked for ${conflictingBooking.clientName} from ${conflictingBooking.startTime} to ${conflictingBooking.endTime}. Change the time or hall to save.`)}</span>
                  </div>
                </div>
              )}

              {/* 1. Type-specific details (bride & groom for weddings/engagements, company for conferences...) */}
              <div className={sectionCls}>
                <h4 className="text-xs font-bold text-indigo-400">1. {tr(`بيانات ${typeCfg.ar}`, `${typeCfg.en} details`)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {typeCfg.fields.map((f) => (
                    <div key={f.key}>
                      <label className={labelCls}>{isAr ? f.labelAr : f.labelEn}{f.required && ' *'}</label>
                      <input type={f.type || 'text'} required={f.required} placeholder={isAr ? f.placeholderAr || '' : ''}
                        value={details[f.key] || ''} onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Client */}
              <div className={sectionCls}>
                <h4 className="text-xs font-bold text-indigo-400">2. {tr('بيانات التواصل', 'Contact details')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{tr('الاسم بالكامل (صاحب الحجز) *', 'Full name (booking contact) *')}</label>
                    <input type="text" required autoComplete="name" placeholder={tr('مثال: محمد السيد النجار', 'e.g. Mohamed El-Sayed')} value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tr('رقم الهاتف *', 'Phone number *')}</label>
                    <input type="tel" required dir="ltr" autoComplete="tel" inputMode="tel" placeholder="010XXXXXXXX" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>{tr('العنوان / المنطقة', 'Address / area')}</label>
                    <input type="text" placeholder={tr('بورسعيد / الإسماعيلية', 'Port Said / Ismailia')} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* 3. Location, hall, date */}
              <div className={sectionCls}>
                <h4 className="text-xs font-bold text-indigo-400">3. {tr('المكان والقاعة والموعد', 'Venue, hall & date')}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATIONS.map((loc) => (
                    <button key={loc.id} type="button" onClick={() => chooseLocation(loc.id)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${locationId === loc.id ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'}`}>
                      <MapPin className="w-3.5 h-3.5" /> {isAr ? loc.nameAr : loc.nameEn}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{tr('القاعة', 'Hall')}</label>
                    <select value={hallId} onChange={(e) => { const nextId = e.target.value; setHallId(nextId); const h = halls.find((x) => x.id === nextId); if (h) setBasePrice(h.basePrice); else if (nextId === CUSTOMER_VENUE_ID) setBasePrice(0); }} className={inputCls}>
                      {locationHalls.map((h) => <option key={h.id} value={h.id}>{isAr ? h.name : h.nameEn || h.name} ({tr(`حتى ${h.capacity} فرد`, `up to ${h.capacity} guests`)})</option>)}
                      <option value={CUSTOM_HALL_ID}>{tr('➕ مكان آخر (اكتب الاسم)', '➕ Another venue (type the name)')}</option>
                      <option value={CUSTOMER_VENUE_ID}>{tr('📍 مكان العميل (خارج قاعاتنا)', '📍 Customer’s own venue')}</option>
                    </select>
                    {isCustomHall && (
                      <input type="text" required autoFocus value={customHallName} onChange={(e) => setCustomHallName(e.target.value)}
                        placeholder={isCustomerVenue ? tr('اكتب عنوان / اسم مكان العميل', 'Enter the customer’s venue name or address') : tr('اكتب اسم القاعة / المكان', 'Type the hall / venue name')} className={`mt-2 ${inputCls} border-indigo-500/60`} />
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>{tr('عدد المدعوين المتوقع', 'Expected guests')}</label>
                    <input type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value) || 0)} className={`${inputCls} font-mono`} />
                  </div>
                </div>
                {customerMode && isCustomerVenue && <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3"><label className={labelCls}>{tr('اختر تسعير الخدمات', 'Choose service pricing location')}</label><div className="grid grid-cols-2 gap-2">{LOCATIONS.map((loc) => <button key={loc.id} type="button" onClick={() => setLocationId(loc.id)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${locationId === loc.id ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>{isAr ? loc.nameAr : loc.nameEn}</button>)}</div><p className="mt-2 text-[10px] text-slate-400">{tr('ستظهر أسعار الموقع المختار فقط. يمكنك تغيير الاختيار لعرض تسعير الموقع الآخر.', 'Only prices for the selected location are shown. Switch locations to view the other pricing.')}</p></div>}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className={labelCls}>{tr('تاريخ المناسبة', 'Event date')}</label><input type="date" required min={customerMode ? new Date().toISOString().split('T')[0] : undefined} value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} font-mono`} /></div>
                  <div><label className={labelCls}>{tr('وقت البداية', 'Start time')}</label><input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={`${inputCls} font-mono`} /></div>
                  <div><label className={labelCls}>{tr('وقت النهاية', 'End time')}</label><input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={`${inputCls} font-mono`} /></div>
                </div>
              </div>

              {/* 4. Package for this type, priced for this location */}
              {typePackages.length > 0 && (
                <div className={sectionCls}>
                  <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5"><PackageIcon className="w-3.5 h-3.5" /> 4. {tr('الباقة', 'Package')} ({(isAr ? LOCATIONS.find((l) => l.id === locationId)?.nameAr : LOCATIONS.find((l) => l.id === locationId)?.nameEn)})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button type="button" onClick={() => setPackageId('')}
                      className={`p-3 rounded-xl border text-xs text-start ${!packageId ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}>
                      {tr('بدون باقة — خدمات منفصلة فقط', 'No package — individual services only')}
                    </button>
                    {typePackages.map((pkg) => {
                      const p = packagePriceAt(priceBook, locationId, pkg.id);
                      return (
                        <button key={pkg.id} type="button" onClick={() => { sound.tick(); setPackageId(pkg.id); }}
                          className={`p-3 rounded-xl border text-xs text-start ${packageId === pkg.id ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'}`}>
                          <div className="flex items-center justify-between gap-2"><strong>{isAr ? pkg.nameAr : pkg.nameEn}</strong>
                          {showLocationPrices && <span className="font-mono text-indigo-300">{egp(p.price)} / {tr('فرد', 'guest')}</span>}</div>
                          <div className="mt-1 text-[10px] text-slate-500 line-clamp-1">{(isAr ? pkg.includesAr : pkg.includesEn).join(' · ')}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Add-on services, priced for this location */}
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400">5. {tr('خدمات وإضافات', 'Services & add-ons')}</h4>
                  {!customerMode && <span className="text-xs font-mono text-emerald-400 font-bold">{tr('الباقة والخدمات', 'Package & services')}: {egp(servicesTotal)}</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pe-1">
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
                          {showLocationPrices && <span className="font-mono text-indigo-300 font-bold">{egp(price)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selling-price summary for the operations agent (no payments, no costs). */}
              {hideFinancials && !customerMode && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-200">
                  <span>{tr('إيجار القاعة', 'Hall rent')}: <strong>{egp(Number(basePrice) || 0)}</strong></span>
                  <span>{tr('الإجمالي للعميل', 'Client total')}: <strong className="text-amber-300">{egp(totalPrice)}</strong></span>
                  <span className="text-slate-400 font-sans">{tr('يُسجَّل كحجز مبدئي — تؤكده الإدارة وتحصّل العربون', 'Saved as tentative — management confirms it and collects the deposit')}</span>
                </div>
              )}

              {/* 6. Payments — managers only */}
              {!noPayments && (
                <div className={sectionCls}>
                  <h4 className="text-xs font-bold text-indigo-400">6. {tr('الحسابات والعربون والتأمين', 'Pricing, deposit & security')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><label className={labelCls}>{tr('سعر القاعة الأساسي', 'Base hall price')}</label><input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value) || 0)} className={`${inputCls} font-mono`} /></div>
                    <div><label className={labelCls}>{tr('العربون المدفوع الآن', 'Deposit paid now')}</label><input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value) || 0)} className={`${inputCls} font-mono`} /></div>
                    <div><label className={labelCls}>{tr('التأمين (مسترد)', 'Security deposit (refundable)')}</label><input type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(Number(e.target.value) || 0)} className={`${inputCls} font-mono text-amber-300`} /></div>
                    <div><label className={labelCls}>{tr('حالة الحجز', 'Status')}</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value as 'confirmed' | 'tentative')} className={inputCls}>
                        <option value="confirmed">{tr('مؤكد', 'Confirmed')}</option><option value="tentative">{tr('مبدئي', 'Tentative')}</option>
                      </select></div>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-200">
                    <span>{tr('الإجمالي', 'Total')}: <strong>{egp(totalPrice)}</strong></span>
                    <span className="text-emerald-400">{tr('المدفوع (عربون)', 'Paid (deposit)')}: <strong>{egp(paidNow)}</strong></span>
                    <span className="text-rose-400">{tr('المتبقي للتحصيل', 'Balance due')}: <strong>{egp(remainingAmount)}</strong></span>
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>{tr('ملاحظات أو طلبات خاصة', 'Notes or special requests')}</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr('تفاصيل الترتيبات، مواعيد التجهيز والتسليم...', 'Arrangements, setup and delivery times...')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
                {conflictingBooking && <span className="me-auto text-[11px] font-semibold text-rose-300">{tr('الموعد متعارض مع حجز آخر في نفس القاعة.', 'This time clashes with another booking in the same hall.')}</span>}
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer">{tr('إلغاء', 'Cancel')}</button>
                <button type="submit" disabled={!!conflictingBooking} className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                  {customerMode ? tr('إرسال طلب الحجز', 'Send booking request') : hideFinancials ? tr('حفظ كحجز مبدئي', 'Save as tentative') : tr('حفظ وتسجيل الحجز', 'Save booking')}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
