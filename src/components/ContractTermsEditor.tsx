import { useState } from 'react';
import { ScrollText, X } from 'lucide-react';
import type { Language } from '../types/venueSystem';
import { makeTr } from '../utils/tr';
import { usePersistentState } from '../utils/usePersistentState';
import { sound } from '../utils/soundEffects';

/** The standard terms printed on every contract. The CEO can change them. */
export interface ContractTerms { ar: string[]; en: string[]; balanceDays: number }

export const DEFAULT_TERMS: ContractTerms = {
  balanceDays: 7,
  ar: [
    'الإلغاء قبل موعد المناسبة بأكثر من 60 يوماً: يُرد العربون بعد خصم 10% مصاريف إدارية.',
    'الإلغاء قبل الموعد بمدة من 30 إلى 60 يوماً: يُخصم 50% من العربون.',
    'الإلغاء قبل الموعد بأقل من 30 يوماً: لا يُرد العربون.',
    'يحق للطرف الثاني تأجيل المناسبة مرة واحدة دون رسوم إذا طلب ذلك قبل الموعد بـ 30 يوماً على الأقل، وحسب توافر القاعة.',
    'تُحسب أي ساعة إضافية بعد الموعد المتفق عليه حسب قائمة الأسعار المعتمدة.',
    'لا يزيد عدد المدعوين عن سعة القاعة، ويُحاسب أي عدد إضافي حسب سعر الفرد.',
    'يُمنع إدخال أطعمة أو مشروبات أو ألعاب نارية من الخارج إلا بموافقة كتابية من الإدارة.',
    'أي تلفيات في القاعة أو المعدات تُخصم من مبلغ التأمين، ويُرد الباقي خلال 3 أيام عمل بعد المعاينة.',
    'في حالة القوة القاهرة لا يتحمل أي طرف مسؤولية، وتُنقل المناسبة لأقرب موعد متاح.',
    'يخضع هذا العقد للقانون المصري، وتختص محاكم القاهرة بأي نزاع ينشأ عنه.',
    'حُرر هذا العقد من نسختين، بيد كل طرف نسخة للعمل بموجبها.',
  ],
  en: [
    'Cancellation more than 60 days before the event: the deposit is refunded less a 10% admin fee.',
    'Cancellation 30 to 60 days before the event: 50% of the deposit is kept.',
    'Cancellation less than 30 days before the event: the deposit is not refunded.',
    'The client may postpone once free of charge if asked at least 30 days before the event, subject to venue availability.',
    'Each extra hour beyond the agreed time is charged at the approved price list.',
    'Guests must not exceed the venue capacity; extra guests are charged per person.',
    'Outside food, drinks or fireworks are not allowed without written approval from management.',
    'Any damage to the venue or equipment is deducted from the security deposit; the rest is refunded within 3 working days after inspection.',
    'Neither party is liable for force majeure; the event moves to the nearest available date.',
    'This contract is governed by Egyptian law, and the Cairo courts handle any dispute.',
    'This contract is made in two copies, one for each party.',
  ],
};


/** The saved contract terms, shared by the Contracts screen and the Company screen. */
export const useContractTerms = () => usePersistentState<ContractTerms>('saraya-contract-terms-v1', DEFAULT_TERMS, (s) => Boolean(s && typeof s === 'object' && Array.isArray((s as ContractTerms).ar) && Array.isArray((s as ContractTerms).en)));

const card = 'rounded-3xl border border-slate-800 bg-slate-900/80';
const gold = 'bg-gradient-to-br from-[#E9CF94] via-[#C49A52] to-[#8C6A2E] text-[#0D0D0F]';

/** CEO-only card on the Company screen: shows the contract terms and opens the editor. */
export function ContractTermsCard({ language }: { language: Language }) {
  const { isAr, tr } = makeTr(language);
  const [terms, setTerms] = useContractTerms();
  const [open, setOpen] = useState(false);
  const list = isAr ? terms.ar : terms.en;
  return (
    <section className={`${card} p-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-white"><ScrollText className="h-5 w-5 text-amber-400" />{tr('شروط العقد', 'Contract terms')}</h2>
          <p className="mt-1 text-xs text-slate-400">{tr(`للمدير التنفيذي فقط. تُطبع على كل العقود · ${list.length} بند · سداد المتبقي قبل المناسبة بـ ${terms.balanceDays} أيام`, `CEO only. Printed on every contract · ${list.length} clauses · balance due ${terms.balanceDays} days before the event`)}</p>
        </div>
        <button type="button" onClick={() => { sound.click(600); setOpen(true); }} className={`rounded-xl px-4 py-2 text-xs font-black ${gold}`}>{tr('تعديل الشروط', 'Edit terms')}</button>
      </div>
      <ol className="mt-4 list-decimal space-y-1 text-xs leading-6 text-slate-300 ps-5">
        {list.slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}
      </ol>
      {list.length > 3 && <p className="mt-1 text-[11px] text-slate-500">{tr(`و${list.length - 3} بنود أخرى`, `and ${list.length - 3} more`)}</p>}
      {open && <TermsEditor terms={terms} language={language} onClose={() => setOpen(false)} onSave={(t) => { setTerms(t); setOpen(false); sound.success(); }} onReset={() => setTerms(DEFAULT_TERMS)} />}
    </section>
  );
}

function TermsEditor({ terms, language, onClose, onSave, onReset }: { terms: ContractTerms; language: Language; onClose: () => void; onSave: (t: ContractTerms) => void; onReset: () => void }) {
  const { tr } = makeTr(language);
  const [ar, setAr] = useState(terms.ar.join('\n'));
  const [en, setEn] = useState(terms.en.join('\n'));
  const [days, setDays] = useState(terms.balanceDays);
  const area = 'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs leading-6 text-white focus:border-amber-400 focus:outline-none';
  const split = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(13, 13, 15, 0.7)' }} onClick={onClose}>
      <div className={`${card} max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-slate-900 p-5 sm:p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-black text-white">{tr('شروط العقد المعتمدة', 'Standard contract terms')}</h3>
          <button type="button" aria-label={tr('إغلاق', 'Close')} onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-4 text-xs text-slate-400">{tr('للمدير التنفيذي فقط. كل سطر بند. تظهر على كل العقود عند العرض والطباعة.', 'CEO only. One clause per line. Every contract shows these when viewed or printed.')}</p>
        <label className="block text-xs text-slate-400">{tr('سداد المتبقي قبل المناسبة بـ (أيام)', 'Balance due before the event (days)')}
          <input type="number" min={0} value={days} onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))} className="mt-1 block w-32 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white focus:border-amber-400 focus:outline-none" />
        </label>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="text-xs text-slate-400">{tr('البنود بالعربية', 'Arabic clauses')}<textarea dir="rtl" rows={14} value={ar} onChange={(e) => setAr(e.target.value)} className={area} /></label>
          <label className="text-xs text-slate-400">{tr('البنود بالإنجليزية', 'English clauses')}<textarea dir="ltr" rows={14} value={en} onChange={(e) => setEn(e.target.value)} className={area} /></label>
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <button type="button" onClick={() => { if (window.confirm(tr('استرجاع الشروط الافتراضية؟', 'Restore the default terms?'))) { onReset(); onClose(); } }} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white">{tr('استرجاع الافتراضي', 'Restore defaults')}</button>
          <button type="button" onClick={() => onSave({ ar: split(ar), en: split(en), balanceDays: days })} className={`rounded-xl px-5 py-2 text-xs font-black ${gold}`}>{tr('حفظ الشروط', 'Save terms')}</button>
        </div>
      </div>
    </div>
  );
}
