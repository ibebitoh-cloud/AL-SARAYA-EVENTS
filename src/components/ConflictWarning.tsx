import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Booking, ConflictOverride, Hall, Language } from '../types/venueSystem';
import { makeTr } from '../utils/tr';

/** Shortest reason accepted for saving over a double-booking warning. */
export const MIN_OVERRIDE_REASON = 5;

export const overrideReasonOk = (reason: string) => reason.trim().length >= MIN_OVERRIDE_REASON;

/** The audit note stored on a booking saved over a clash. */
export const makeConflictOverride = (conflicts: Booking[], reason: string, user: { id: string; name: string } | null | undefined): ConflictOverride => ({
  conflictWithCode: conflicts.map((c) => c.code).join(', '),
  reason: reason.trim(),
  byUserId: user?.id || '',
  byName: user?.name || '',
  at: new Date().toISOString(),
});

interface Props {
  conflicts: Booking[];
  /** The signed-in user may save anyway (CEO, or a role the CEO allowed in Edit Permissions). */
  canOverride: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  language: Language;
  /** Used to show venue names in the current language. */
  halls?: Hall[];
}

/** Double-booking warning that names each clashing booking and, for authorised users, asks for an override reason. */
export function ConflictWarning({ conflicts, canOverride, reason, onReasonChange, language, halls = [] }: Props) {
  const { isAr, tr } = makeTr(language);
  const venue = (b: Booking) => { const h = halls.find((x) => x.id === b.hallId); return h ? (isAr ? h.name : h.nameEn || h.name) : b.hallName; };
  if (!conflicts.length) return null;
  return (
    <div role="alert" className="space-y-2 rounded-2xl border border-rose-500/50 bg-rose-950/50 p-3.5 text-xs text-rose-200">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
        <div className="space-y-1">
          <strong className="block font-bold text-rose-300">{tr('تعارض: القاعة محجوزة في نفس الوقت', 'Clash: this venue is already booked at that time')}</strong>
          {conflicts.map((c) => (
            <span key={c.id} className="block">
              <span className="font-mono">{c.code}</span> · {c.clientName} · <span dir="ltr">{c.startTime}–{c.endTime}</span> · {venue(c)}
            </span>
          ))}
        </div>
      </div>
      {canOverride ? (
        <label className="block">
          <span className="flex items-center gap-1.5 font-semibold text-rose-200"><ShieldCheck className="h-3.5 w-3.5" />{tr('للحفظ رغم التعارض اكتب السبب (يُسجَّل باسمك)', 'To save anyway, write the reason (it is recorded with your name)')}</span>
          <textarea value={reason} onChange={(e) => onReasonChange(e.target.value)} rows={2} placeholder={tr('مثال: الحفلتان في جزأين منفصلين من القاعة', 'e.g. the two events use separate parts of the hall')} className="mt-1 w-full resize-none rounded-xl border border-rose-500/40 bg-slate-950 px-3 py-2 text-xs text-white focus:border-rose-300 focus:outline-none" />
        </label>
      ) : (
        <p className="text-rose-300">{tr('غيّر الموعد أو القاعة للحفظ. الحفظ رغم التعارض متاح فقط لمن يسمح له الرئيس التنفيذي.', 'Change the time or venue to save. Only users the CEO allows can save over a clash.')}</p>
      )}
    </div>
  );
}
