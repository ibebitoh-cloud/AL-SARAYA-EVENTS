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

  if (draft) {
    return <OperationForm draft={draft} halls={halls} existingBookings={existingBookings}
      onCancel={() => setDraft(null)} onSave={(op) => { sound.success(); upsert(op); setDraft(null); }} />;
  }

  return (
    <div className="w-full pb-20 text-right space-y-5">
      <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-white"><Sparkles className="h-5 w-5 text-amber-400" /> تصميم الحفلة مع العميل</h2>
          <p className="mt-1 text-xs text-slate-400">جهّز بيانات العملية قبل المقابلة، ثم افتح جلسة الاختيار أمام العميل — بدون إدخال بيانات أمامه.</p>
        </div>
        <button type="button" onClick={() => { sound.click(650); setDraft(blankOperation(halls)); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300"><Plus className="h-4 w-4" /> تجهيز عملية جديدة</button>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300"><ClipboardList className="h-4 w-4" /> العمليات الجاهزة</h3>
        {ops.length === 0 ? (
          <div className={`${card} py-12 text-center`}>
            <ClipboardList className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-300">لا توجد عمليات جاهزة بعد</p>
            <p className="mt-1 text-xs text-slate-500">جهّز العملية قبل موعد المقابلة: بيانات العميل، نوع المناسبة، القاعة والتاريخ.</p>
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
