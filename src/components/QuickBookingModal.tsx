import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Calendar, MapPin, Phone, User, AlertTriangle } from 'lucide-react';
import { Booking, Hall, Language } from '../types/venueSystem';
import { LOCATIONS, hallLocation } from '../data/locations';
import { uniqueBookingCode } from '../utils/bookingRules';
import { sound } from '../utils/soundEffects';

const OTHER_VENUE = 'other-venue';

interface Props {
  halls: Hall[];
  existingBookings: Booking[];
  language: Language;
  preselectedHallId?: string;
  onCreate: (booking: Booking) => void;
  onClose: () => void;
}

const inputCls = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none';
const labelCls = 'mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300';

/** The short public booking form: venue, date, name and phone. The team calls back for everything else. */
export function QuickBookingModal({ halls, existingBookings, language, preselectedHallId, onCreate, onClose }: Props) {
  const isAr = language === 'ar';
  const tr = (ar: string, en: string) => (isAr ? ar : en);
  const [hallId, setHallId] = useState(() => (preselectedHallId && halls.some((h) => h.id === preselectedHallId) ? preselectedHallId : ''));
  const [otherVenue, setOtherVenue] = useState('');
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState<Booking | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const hall = halls.find((h) => h.id === hallId);
  const hallName = hallId === OTHER_VENUE ? otherVenue.trim() : (hall?.name || '');
  const phoneOk = phone.replace(/\D/g, '').length >= 8;
  const missing = { venue: !hallName, date: !date, name: !name.trim(), phone: !phoneOk };
  const sameDay = hall && date ? existingBookings.some((b) => b.status !== 'cancelled' && b.hallId === hall.id && b.date === date) : false;
  const hallLabel = (h: Hall) => (isAr ? h.name : (h.nameEn || h.name));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.values(missing).some(Boolean)) return;
    sound.success();
    const venue = { hallId: hall ? hall.id : '', hallName, locationId: hall ? hallLocation(hall) : undefined };
    const booking: Booking = {
      id: `bk-${Date.now()}`,
      code: uniqueBookingCode(existingBookings),
      clientName: name.trim(),
      clientPhone: phone.trim(),
      eventType: 'wedding',
      date,
      startTime: '18:00',
      endTime: '23:30',
      ...venue,
      guestCount: 0,
      basePrice: 0,
      services: [],
      totalPrice: 0,
      deposit: 0,
      paidAmount: 0,
      remainingAmount: 0,
      securityDeposit: 0,
      securityDepositStatus: 'held',
      status: 'tentative',
      notes: tr('طلب سريع من الموقع: اتصل بالعميل لتحديد نوع المناسبة والوقت والتفاصيل.', 'Quick website request: call the customer to confirm the event type, time and details.'),
      assignedStaff: [],
      suppliesCost: 0,
      directExpenses: 0,
      source: 'website_quick',
    };
    onCreate(booking);
    setSent(booking);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md sm:p-5" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        dir={isAr ? 'rtl' : 'ltr'} role="dialog" aria-modal="true" aria-labelledby="quick-booking-title"
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-md rounded-3xl border border-amber-500/20 bg-slate-900 p-5 text-start shadow-2xl sm:p-7"
      >
        <button type="button" aria-label={tr('إغلاق', 'Close')} onClick={onClose} className="absolute end-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"><Check className="h-7 w-7" /></div>
            <h3 id="quick-booking-title" className="text-xl font-black text-white">{tr('شكراً، وصلنا طلبك', 'Thank you, we got your request')}</h3>
            <p className="max-w-sm text-sm leading-7 text-slate-300">
              {tr(`سنتواصل معك على الرقم ${sent.clientPhone} قريباً لتأكيد الموعد والتفاصيل.`, `We will contact you on ${sent.clientPhone} soon to confirm the date and details.`)}
            </p>
            <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
              <div className="flex justify-between gap-3"><span>{tr('رقم الطلب', 'Request number')}</span><span dir="ltr" className="font-mono font-bold text-amber-300">{sent.code}</span></div>
              <div className="mt-2 flex justify-between gap-3"><span>{tr('المكان', 'Venue')}</span><span className="font-semibold text-slate-200">{hall ? hallLabel(hall) : sent.hallName}</span></div>
              <div className="mt-2 flex justify-between gap-3"><span>{tr('التاريخ', 'Date')}</span><span dir="ltr" className="font-mono text-slate-200">{sent.date}</span></div>
            </div>
            <button type="button" onClick={onClose} className="mt-1 w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300">{tr('تم', 'Done')}</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="pe-8">
              <h3 id="quick-booking-title" className="text-xl font-black text-white">{tr('ابدأ الحجز', 'Start a booking')}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">{tr('اختر المكان والتاريخ واترك اسمك ورقمك، وسنتواصل معك لإكمال التفاصيل.', 'Pick the venue and date and leave your name and number. We will contact you to finish the details.')}</p>
            </div>

            <div>
              <label htmlFor="qb-venue" className={labelCls}><MapPin className="h-3.5 w-3.5 text-amber-300" />{tr('المكان', 'Venue')}</label>
              <select id="qb-venue" value={hallId} onChange={(e) => setHallId(e.target.value)} className={`${inputCls} ${tried && missing.venue ? 'border-rose-500' : ''}`}>
                <option value="">{tr('اختر القاعة أو المكان', 'Choose a hall or place')}</option>
                {LOCATIONS.map((loc) => {
                  const list = halls.filter((h) => hallLocation(h) === loc.id);
                  return list.length ? <optgroup key={loc.id} label={isAr ? loc.nameAr : loc.nameEn}>{list.map((h) => <option key={h.id} value={h.id}>{hallLabel(h)}</option>)}</optgroup> : null;
                })}
                <option value={OTHER_VENUE}>{tr('مكاني الخاص / مكان آخر', 'My own place / another venue')}</option>
              </select>
              {hallId === OTHER_VENUE && <input type="text" value={otherVenue} onChange={(e) => setOtherVenue(e.target.value)} placeholder={tr('اكتب اسم المكان أو العنوان', 'Type the place name or address')} className={`mt-2 ${inputCls} ${tried && missing.venue ? 'border-rose-500' : ''}`} />}
            </div>

            <div>
              <label htmlFor="qb-date" className={labelCls}><Calendar className="h-3.5 w-3.5 text-amber-300" />{tr('تاريخ المناسبة', 'Event date')}</label>
              <input id="qb-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} font-mono ${tried && missing.date ? 'border-rose-500' : ''}`} />
              {sameDay && <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-5 text-amber-200"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{tr('يوجد حجز آخر في هذا المكان في نفس اليوم. أرسل طلبك وسنتواصل معك لإيجاد وقت مناسب.', 'This venue already has an event that day. Send your request and we will contact you to find a time that works.')}</p>}
            </div>

            <div>
              <label htmlFor="qb-name" className={labelCls}><User className="h-3.5 w-3.5 text-amber-300" />{tr('الاسم', 'Your name')}</label>
              <input id="qb-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('الاسم بالكامل', 'Full name')} className={`${inputCls} ${tried && missing.name ? 'border-rose-500' : ''}`} />
            </div>

            <div>
              <label htmlFor="qb-phone" className={labelCls}><Phone className="h-3.5 w-3.5 text-amber-300" />{tr('رقم الهاتف', 'Phone number')}</label>
              <input id="qb-phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010XXXXXXXX" className={`${inputCls} font-mono ${isAr ? 'text-right' : ''} ${tried && missing.phone ? 'border-rose-500' : ''}`} />
            </div>

            {tried && Object.values(missing).some(Boolean) && <p role="alert" className="text-xs font-semibold text-rose-300">{tr('من فضلك أكمل الحقول المحددة باللون الأحمر.', 'Please fill in the fields marked in red.')}</p>}

            <button type="submit" className="w-full rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300">
              {tr('أرسل الطلب', 'Send request')}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
