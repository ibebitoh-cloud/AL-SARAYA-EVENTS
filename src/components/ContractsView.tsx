import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, CheckCircle2, Printer, Search, Plus, Eye, X, ScrollText, CalendarDays, MapPin, Users } from 'lucide-react';
import { Booking, Language, ContractAgreement } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';
import { makeTr, eventTypeLabel } from '../utils/tr';
import { eventDetailsSummary } from '../data/eventTypes';
import { bookingTotals } from '../data/recordFields';
import { RecordEditorModal, RowActions, type FieldDef } from './RecordEditor';
import { usePersistentState, isNonEmptyArray } from '../utils/usePersistentState';
import { SAMPLE_CONTRACTS, markSamplesMerged, mergeSampleEvents } from '../data/sampleEvents';
import { BrandLogo } from './BrandLogo';
import { DaliCredit } from './DaliCredit';
import { type ContractTerms, useContractTerms } from './ContractTermsEditor';

interface CompanyInfo { nameAr?: string; nameEn?: string; phone?: string; locationsAr?: string; locationsEn?: string; email?: string }

interface ContractsViewProps {
  bookings: Booking[];
  language: Language;
  /** Create, edit, delete and sign contracts (set on the Edit Permissions screen). */
  canEdit?: boolean;
  company?: CompanyInfo;
}

type Status = ContractAgreement['status'];

const INITIAL_CONTRACTS: ContractAgreement[] = [
  {
    id: 'cnt-1', contractNumber: 'CTR-2026-101', bookingCode: 'BK-2026-101', clientName: 'أحمد محمود السعيد', clientPhone: '01023456789',
    clientNationalId: '29304151201934', hallName: 'قاعة اركان', date: '2026-11-16', timeSlot: '18:00 – 23:30',
    totalAmount: 130000, depositAmount: 30000, securityDeposit: 5000, status: 'signed', signedDate: '2026-09-01', termsApproved: true,
  },
];

const contractFields: FieldDef[] = [
  { key: 'contractNumber', ar: 'رقم العقد', en: 'Contract no.', required: true },
  { key: 'bookingCode', ar: 'كود الحجز', en: 'Booking code' },
  { key: 'clientName', ar: 'اسم العميل', en: 'Client name', required: true },
  { key: 'clientPhone', ar: 'هاتف العميل', en: 'Client phone', type: 'tel' },
  { key: 'clientNationalId', ar: 'الرقم القومي', en: 'National ID' },
  { key: 'hallName', ar: 'القاعة', en: 'Venue' },
  { key: 'date', ar: 'التاريخ', en: 'Date', type: 'date' },
  { key: 'timeSlot', ar: 'الموعد', en: 'Time slot' },
  { key: 'totalAmount', ar: 'قيمة العقد (ج.م)', en: 'Total value (EGP)', type: 'number', min: 0 },
  { key: 'depositAmount', ar: 'العربون (ج.م)', en: 'Deposit (EGP)', type: 'number', min: 0 },
  { key: 'securityDeposit', ar: 'التأمين (ج.م)', en: 'Security deposit (EGP)', type: 'number', min: 0 },
  { key: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: [
    { value: 'draft', ar: 'مسودة', en: 'Draft' }, { value: 'signed', ar: 'موقّع', en: 'Signed' },
    { value: 'completed', ar: 'منتهي', en: 'Completed' }, { value: 'terminated', ar: 'ملغي', en: 'Cancelled' },
  ] },
  { key: 'signedDate', ar: 'تاريخ التوقيع', en: 'Signed on', type: 'date' },
  { key: 'termsApproved', ar: 'تمت الموافقة على الشروط', en: 'Terms approved', type: 'checkbox' },
];

const STATUS: Record<Status, { ar: string; en: string; cls: string }> = {
  draft: { ar: 'مسودة', en: 'Draft', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-200' },
  signed: { ar: 'موقّع', en: 'Signed', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  completed: { ar: 'منتهي', en: 'Completed', cls: 'border-sky-500/40 bg-sky-500/10 text-sky-300' },
  terminated: { ar: 'ملغي', en: 'Cancelled', cls: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
};

const gold = 'bg-gradient-to-br from-[#E9CF94] via-[#C49A52] to-[#8C6A2E] text-[#0D0D0F]';
const card = 'rounded-3xl border border-slate-800 bg-slate-900/80';
const today = () => new Date().toISOString().split('T')[0];

const fromBooking = (bk: Booking, number: string): ContractAgreement => ({
  id: `cnt-${Date.now()}`, contractNumber: number, bookingCode: bk.code, clientName: bk.clientName, clientPhone: bk.clientPhone,
  clientNationalId: '', hallName: bk.hallName, date: bk.date, timeSlot: `${bk.startTime} – ${bk.endTime}`,
  totalAmount: bk.totalPrice, depositAmount: bk.deposit, securityDeposit: bk.securityDeposit, status: 'draft', termsApproved: false,
});

export function ContractsView({ bookings, language, canEdit = true, company }: ContractsViewProps) {
  const { isAr, tr, egp } = makeTr(language);
  const [contracts, setContracts] = usePersistentState<ContractAgreement[]>('saraya-contracts-v1', INITIAL_CONTRACTS, isNonEmptyArray);
  const [terms] = useContractTerms();
  const [editingContract, setEditingContract] = useState<ContractAgreement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Status | 'all'>('all');

  // Add the sample contracts once to a browser that saved its contracts before they existed.
  useEffect(() => { setContracts((prev) => mergeSampleEvents(prev, SAMPLE_CONTRACTS, 'contracts')); markSamplesMerged('contracts'); }, [setContracts]);

  const saveContract = (c: ContractAgreement) => setContracts((prev) => prev.some((x) => x.id === c.id) ? prev.map((x) => x.id === c.id ? c : x) : [c, ...prev]);
  const deleteContract = (id: string) => setContracts((prev) => prev.filter((x) => x.id !== id));
  const nextNumber = () => {
    const year = new Date().getFullYear();
    const used = contracts.map((c) => Number(c.contractNumber.split('-').pop()) || 0);
    return `CTR-${year}-${Math.max(100, ...used) + 1}`;
  };
  const sign = (id: string) => {
    sound.success();
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'signed', signedDate: today(), termsApproved: true } : c));
  };

  const counts = useMemo(() => contracts.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {} as Record<string, number>), [contracts]);
  const q = searchQuery.trim().toLowerCase();
  const visible = contracts
    .filter((c) => filter === 'all' || c.status === filter)
    .filter((c) => !q || [c.clientName, c.contractNumber, c.bookingCode, c.hallName].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => {
      // Live contracts first, soonest event at the top; finished ones after, latest first.
      const done = (c: ContractAgreement) => c.status === 'completed' || c.status === 'terminated';
      if (done(a) !== done(b)) return done(a) ? 1 : -1;
      return done(a) ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
  const selected = contracts.find((c) => c.id === selectedId) || null;
  const withoutContract = bookings
    .filter((b) => b.status !== 'cancelled' && !contracts.some((c) => c.bookingCode === b.code))
    .sort((a, b) => a.date.localeCompare(b.date));

  const filters: (Status | 'all')[] = ['all', 'draft', 'signed', 'completed', 'terminated'];

  return (
    <div className="w-full space-y-6 pb-24 text-start">
      {/* Header */}
      <div className={`${card} flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between`}>
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
            <FileText className="h-4 w-4" /><span>{tr('العقود', 'Contracts')}</span>
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">{tr('عقود المناسبات', 'Event contracts')}</h1>
          <p className="mt-1 max-w-xl text-xs text-slate-400 sm:text-sm">
            {tr('اختر الحجز ويُكتب العقد تلقائياً بالشروط المعتمدة، ثم اطبعه للتوقيع.', 'Pick a booking and the contract fills in with the approved terms, ready to print and sign.')}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          {canEdit && (
            <button type="button" onClick={() => { sound.click(650); setPickerOpen(true); }} className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-black ${gold}`}>
              <Plus className="h-3.5 w-3.5" />{tr('عقد جديد من حجز', 'New contract from a booking')}
            </button>
          )}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-3 h-3.5 w-3.5 text-slate-500 start-3" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={tr('بحث بالعميل أو رقم العقد...', 'Search client or contract...')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 text-xs text-white placeholder-slate-500 ps-9 pe-3 focus:border-amber-400 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2" data-no-screen-swipe>
        {filters.map((f) => {
          const n = f === 'all' ? contracts.length : counts[f] || 0;
          const label = f === 'all' ? tr('الكل', 'All') : isAr ? STATUS[f].ar : STATUS[f].en;
          return (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === f ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-slate-700 text-slate-300 hover:text-white'}`}>
              {label} <span className="font-mono opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      {/* Contract cards */}
      {visible.length === 0 ? (
        <div className={`${card} py-12 text-center text-sm text-slate-400`}>{tr('لا توجد عقود هنا', 'No contracts here')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => {
            const st = STATUS[c.status];
            const bk = bookings.find((b) => b.code === c.bookingCode);
            return (
              <article key={c.id} className={`${card} flex flex-col gap-3 p-5`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-2.5 py-1 font-mono text-xs font-bold text-amber-300" dir="ltr">{c.contractNumber}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>{isAr ? st.ar : st.en}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{c.clientName}</h3>
                  {bk && <div className="mt-0.5 text-[11px] text-amber-200/80">{eventTypeLabel(bk.eventType, isAr)}</div>}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><CalendarDays className="h-3 w-3" /><span className="font-mono">{c.date}</span></span>
                  <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><MapPin className="h-3 w-3" />{c.hallName}</span>
                  {bk && <span className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5"><Users className="h-3 w-3" />{bk.guestCount}</span>}
                </div>
                <div className="space-y-1 rounded-xl border border-slate-800/70 bg-slate-950/60 p-3 text-xs">
                  <div className="flex justify-between text-slate-300"><span>{tr('قيمة العقد', 'Contract value')}</span><span className="font-mono font-bold text-white">{egp(bk?.totalPrice ?? c.totalAmount)}</span></div>
                  <div className="flex justify-between text-slate-400"><span>{tr('العربون', 'Deposit')}</span><span className="font-mono">{egp(bk?.deposit ?? c.depositAmount)}</span></div>
                  {c.signedDate && <div className="flex justify-between text-slate-500"><span>{tr('تاريخ التوقيع', 'Signed on')}</span><span className="font-mono">{c.signedDate}</span></div>}
                </div>
                <div className="mt-auto flex items-center gap-2 border-t border-slate-800/80 pt-3">
                  {canEdit && <RowActions language={language} onEdit={() => setEditingContract(c)} onDelete={() => deleteContract(c.id)} />}
                  <button type="button" onClick={() => { sound.click(600); setSelectedId(c.id); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700">
                    <Eye className="h-3.5 w-3.5 text-amber-300" />{tr('عرض وطباعة', 'View & print')}
                  </button>
                  {canEdit && c.status === 'draft' && (
                    <button type="button" onClick={() => sign(c.id)} className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />{tr('تم التوقيع', 'Mark signed')}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pick a booking for a new contract */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(13, 13, 15, 0.7)' }} onClick={() => setPickerOpen(false)}>
          <div className={`${card} max-h-[85vh] w-full max-w-lg overflow-y-auto bg-slate-900 p-5`} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-white">{tr('اختر الحجز', 'Choose the booking')}</h3>
              <button type="button" aria-label={tr('إغلاق', 'Close')} onClick={() => setPickerOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            {withoutContract.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">{tr('كل الحجوزات لها عقود بالفعل.', 'Every booking already has a contract.')}</p>
            ) : (
              <div className="space-y-2">
                {withoutContract.map((b) => (
                  <button key={b.id} type="button" onClick={() => { const c = fromBooking(b, nextNumber()); sound.success(); saveContract(c); setPickerOpen(false); setSelectedId(c.id); }}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-start hover:border-amber-400">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{b.clientName}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{eventTypeLabel(b.eventType, isAr)} · {b.hallName}</div>
                    </div>
                    <div className="shrink-0 text-end font-mono text-[11px] text-slate-300"><div>{b.date}</div><div className="text-slate-500">{b.code}</div></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* The contract document */}
      <AnimatePresence>
        {selected && (
          <ContractDocument key={selected.id} contract={selected} booking={bookings.find((b) => b.code === selected.bookingCode)} terms={terms} language={language} company={company}
            canSign={canEdit && selected.status === 'draft'} onSign={() => sign(selected.id)} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>

      {editingContract && (
        <RecordEditorModal title={contracts.some((c) => c.id === editingContract.id) ? tr('تعديل العقد', 'Edit contract') : tr('عقد جديد', 'New contract')}
          fields={contractFields} value={editingContract} language={language} onClose={() => setEditingContract(null)}
          onSave={(c) => { saveContract(c); setEditingContract(null); }}
          onDelete={contracts.some((c) => c.id === editingContract.id) ? () => { deleteContract(editingContract.id); setEditingContract(null); } : undefined} />
      )}
    </div>
  );
}

// Paper colours are inline so the light theme's colour overrides can't change the printed sheet.
const INK = '#0D0D0F';
const MUTED = '#5b5750';
const RULE = '#d8d2c4';
const GOLD = '#8C6A2E';

interface DocProps {
  contract: ContractAgreement;
  booking?: Booking;
  terms: ContractTerms;
  language: Language;
  company?: CompanyInfo;
  canSign: boolean;
  onSign: () => void;
  onClose: () => void;
}

function ContractDocument({ contract: c, booking: bk, terms, language, company, canSign, onSign, onClose }: DocProps) {
  const { isAr, tr, egp } = makeTr(language);
  const totals = bk ? bookingTotals(bk) : { subtotal: c.totalAmount, percent: 0, discount: 0, total: c.totalAmount };
  const deposit = bk?.deposit ?? c.depositAmount;
  const paid = bk?.paidAmount ?? deposit;
  const remaining = Math.max(0, totals.total - paid);
  const security = bk?.securityDeposit ?? c.securityDeposit;
  const details = bk ? eventDetailsSummary(bk.eventType, bk.eventDetails, isAr) : '';
  const companyName = isAr ? (company?.nameAr || 'السرايا للمناسبات') : (company?.nameEn || 'ELSARAYA EVENTS');
  const st = STATUS[c.status];

  const Heading = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <h4 className="mb-2 mt-5 flex items-center gap-2 text-sm font-black" style={{ color: INK, breakAfter: 'avoid' }}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px]" style={{ background: GOLD, color: '#fff' }}>{n}</span>{children}
    </h4>
  );
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex justify-between gap-4 border-b py-1.5 text-xs" style={{ borderColor: RULE }}><span style={{ color: MUTED }}>{k}</span><span className="text-end font-semibold" style={{ color: INK }}>{v}</span></div>
  );

  // Rendered straight into <body> so printing can hide the rest of the app (no blank pages).
  return createPortal(
    <div className="contract-print-root fixed inset-0 z-[90] flex justify-center overflow-y-auto p-2 backdrop-blur-sm sm:p-6 print:p-0" style={{ backgroundColor: 'rgba(13, 13, 15, 0.7)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(e) => e.stopPropagation()}
        className="my-auto h-fit w-full max-w-3xl print:my-0 print:max-w-none">
        {/* Actions (not printed) */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 print:hidden">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{isAr ? st.ar : st.en}</span>
          <div className="flex gap-2">
            {canSign && (
              <button type="button" onClick={onSign} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />{tr('تم التوقيع', 'Mark signed')}
              </button>
            )}
            <button type="button" onClick={() => { sound.click(600); window.print(); }} className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black ${gold}`}>
              <Printer className="h-3.5 w-3.5" />{tr('طباعة / PDF', 'Print / PDF')}
            </button>
            <button type="button" aria-label={tr('إغلاق', 'Close')} onClick={onClose} className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* A4 sheet */}
        <article dir={isAr ? 'rtl' : 'ltr'} className="contract-sheet rounded-2xl p-6 text-start shadow-2xl sm:p-10 print:rounded-none print:p-0 print:shadow-none" style={{ background: '#FFFFFF', color: INK }}>
          <header className="flex flex-col items-center border-b-2 pb-5 text-center" style={{ borderColor: GOLD }}>
            <BrandLogo variant="full" tone="dark" className="h-24 w-auto" />
            <p className="mt-2 text-[11px]" style={{ color: MUTED }}>
              {(isAr ? company?.locationsAr : company?.locationsEn) || ''}{company?.phone ? ` · ${company.phone}` : ''}
            </p>
            <h2 className="mt-4 flex items-center gap-2 text-xl font-black" style={{ color: INK }}><ScrollText className="h-5 w-5" style={{ color: GOLD }} />{tr('عقد اتفاق تنظيم مناسبة', 'Event Agreement')}</h2>
            <div className="mt-1 flex flex-wrap justify-center gap-x-4 font-mono text-[11px]" style={{ color: MUTED }} dir="ltr">
              <span>{c.contractNumber}</span><span>{c.bookingCode}</span><span>{c.signedDate || today()}</span>
            </div>
          </header>

          <p className="mt-5 text-xs leading-6" style={{ color: INK }}>
            {tr(
              `إنه في يوم ${c.signedDate || today()} تم الاتفاق بين كل من:`,
              `This agreement is made on ${c.signedDate || today()} between:`,
            )}
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
            <div className="rounded-xl border p-3 text-xs leading-6" style={{ borderColor: RULE }}>
              <div className="font-black" style={{ color: GOLD }}>{tr('الطرف الأول', 'First party')}</div>
              <div className="font-bold">{companyName}</div>
              <div style={{ color: MUTED }}>{tr('ويمثلها المدير التنفيذي', 'Represented by the CEO')}</div>
            </div>
            <div className="rounded-xl border p-3 text-xs leading-6" style={{ borderColor: RULE }}>
              <div className="font-black" style={{ color: GOLD }}>{tr('الطرف الثاني', 'Second party')}</div>
              <div className="font-bold">{c.clientName}</div>
              <div style={{ color: MUTED }}>{tr('رقم قومي', 'National ID')}: <span className="font-mono">{c.clientNationalId || '—'}</span> · {tr('هاتف', 'Phone')}: <span className="font-mono" dir="ltr">{c.clientPhone}</span></div>
            </div>
          </div>

          <Heading n={1}>{tr('موضوع العقد', 'The event')}</Heading>
          <Row k={tr('نوع المناسبة', 'Event type')} v={bk ? eventTypeLabel(bk.eventType, isAr) : '—'} />
          {details && <Row k={tr('التفاصيل', 'Details')} v={details} />}
          <Row k={tr('المكان', 'Venue')} v={c.hallName} />
          <Row k={tr('التاريخ', 'Date')} v={<span className="font-mono">{c.date}</span>} />
          <Row k={tr('الموعد', 'Time')} v={<span className="font-mono" dir="ltr">{c.timeSlot}</span>} />
          {bk && <Row k={tr('عدد المدعوين', 'Guests')} v={bk.guestCount} />}

          {bk && bk.services.length > 0 && <>
            <Heading n={2}>{tr('الخدمات المتفق عليها', 'Agreed services')}</Heading>
            <ul className="space-y-1 text-xs">
              {bk.services.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 border-b py-1.5" style={{ borderColor: RULE }}>
                  <span>{s.name}</span><span className="font-mono" style={{ color: MUTED }}>× {s.quantity}</span>
                </li>
              ))}
            </ul>
          </>}

          <Heading n={bk && bk.services.length > 0 ? 3 : 2}>{tr('القيمة وطريقة السداد', 'Price and payment')}</Heading>
          {totals.discount > 0 && <Row k={tr('الإجمالي قبل الخصم', 'Subtotal')} v={egp(totals.subtotal)} />}
          {totals.discount > 0 && <Row k={tr(`خصم ${totals.percent}%`, `Discount ${totals.percent}%`)} v={`− ${egp(totals.discount)}`} />}
          <Row k={tr('إجمالي قيمة العقد', 'Total contract value')} v={<span className="font-mono font-black">{egp(totals.total)}</span>} />
          <Row k={tr('العربون المدفوع عند التوقيع', 'Deposit paid on signing')} v={<span className="font-mono">{egp(deposit)}</span>} />
          <Row k={tr('المدفوع حتى الآن', 'Paid so far')} v={<span className="font-mono">{egp(paid)}</span>} />
          <Row k={tr('المتبقي', 'Balance')} v={<span className="font-mono">{egp(remaining)}</span>} />
          <p className="mt-2 text-xs leading-6">{tr(`يُسدد المتبقي بالكامل قبل موعد المناسبة بـ ${terms.balanceDays} أيام على الأقل.`, `The full balance is due at least ${terms.balanceDays} days before the event.`)}</p>
          <p className="text-xs leading-6">{tr(`يدفع الطرف الثاني تأميناً قدره ${egp(security)} يُرد بعد المناسبة وفق البنود التالية.`, `The client pays a security deposit of ${egp(security)}, refunded after the event as set out below.`)}</p>

          <Heading n={bk && bk.services.length > 0 ? 4 : 3}>{tr('الشروط العامة', 'General terms')}</Heading>
          <ol className="list-decimal space-y-1.5 text-xs leading-6 ps-5">
            {(isAr ? terms.ar : terms.en).filter((t) => t.trim()).map((t, i) => <li key={i}>{t}</li>)}
          </ol>

          {/* Signatures */}
          <div className="mt-10 grid grid-cols-2 gap-8 text-xs" style={{ breakInside: 'avoid' }}>
            {[[tr('الطرف الأول', 'First party'), companyName], [tr('الطرف الثاني', 'Second party'), c.clientName]].map(([role, name]) => (
              <div key={role}>
                <div className="font-black" style={{ color: GOLD }}>{role}</div>
                <div className="mt-0.5 font-bold">{name}</div>
                <div className="mt-10 border-t pt-1" style={{ borderColor: INK, color: MUTED }}>{tr('التوقيع', 'Signature')}</div>
                <div className="mt-6 border-t pt-1" style={{ borderColor: INK, color: MUTED }}>{tr('التاريخ', 'Date')}</div>
              </div>
            ))}
          </div>

          <footer className="mt-10 flex flex-col items-center gap-2 border-t pt-4" style={{ borderColor: RULE }}>
            <DaliCredit tone="dark" tagline={false} />
          </footer>
        </article>
      </motion.div>
    </div>,
    document.body,
  );
}
