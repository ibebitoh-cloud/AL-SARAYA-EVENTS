import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Shield,
  Download,
  Plus,
  Sparkles,
  AlertCircle,
  Eye,
  Signature,
} from 'lucide-react';
import { Booking, Language, ContractAgreement } from '../types/venueSystem';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface ContractsViewProps {
  bookings: Booking[];
  language: Language;
}

const INITIAL_CONTRACTS: ContractAgreement[] = [
  {
    id: 'cnt-1',
    contractNumber: 'CTR-2026-101',
    bookingCode: 'BK-2026-101',
    clientName: 'أحمد محمود التهامي',
    clientPhone: '01012345678',
    clientNationalId: '29304151201934',
    hallName: 'القاعة الملكية الكبرى',
    date: '2026-10-10',
    timeSlot: '18:00 – 01:00',
    totalAmount: 97500,
    depositAmount: 35000,
    securityDeposit: 5000,
    status: 'signed',
    signedDate: '2026-09-01',
    termsApproved: true,
  },
  {
    id: 'cnt-2',
    contractNumber: 'CTR-2026-102',
    bookingCode: 'BK-2026-102',
    clientName: 'د. منى سيف الدين',
    clientPhone: '01123456789',
    clientNationalId: '29508211400291',
    hallName: 'قاعة اللؤلؤة الماسية',
    date: '2026-10-12',
    timeSlot: '19:00 – 00:00',
    totalAmount: 48000,
    depositAmount: 18000,
    securityDeposit: 4000,
    status: 'signed',
    signedDate: '2026-09-15',
    termsApproved: true,
  },
  {
    id: 'cnt-3',
    contractNumber: 'CTR-2026-103',
    bookingCode: 'BK-2026-103',
    clientName: 'م. حسام غالي الشريف',
    clientPhone: '01234567890',
    clientNationalId: '29111050103289',
    hallName: 'قاعة الملوك الفاخرة',
    date: '2026-10-14',
    timeSlot: '09:00 – 17:00',
    totalAmount: 35000,
    depositAmount: 10000,
    securityDeposit: 3000,
    status: 'draft',
    termsApproved: false,
  },
  {
    id: 'cnt-4',
    contractNumber: 'CTR-2026-104',
    bookingCode: 'BK-2026-104',
    clientName: 'كريم عبد العزيز حلمي',
    clientPhone: '01555667788',
    clientNationalId: '29406121800124',
    hallName: 'الحديقة الخارجية المفتوحة',
    date: '2026-10-16',
    timeSlot: '17:00 – 23:00',
    totalAmount: 62000,
    depositAmount: 22000,
    securityDeposit: 5000,
    status: 'signed',
    signedDate: '2026-09-22',
    termsApproved: true,
  },
];

export function ContractsView({ bookings, language }: ContractsViewProps) {
  const isAr = language === 'ar';
  const [contracts, setContracts] = useState<ContractAgreement[]>(INITIAL_CONTRACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<ContractAgreement | null>(null);

  const handleSignContract = (id: string) => {
    sound.fanfare();
    confetti({ particleCount: 40, spread: 55 });
    setContracts((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'signed',
              signedDate: new Date().toISOString().split('T')[0],
              termsApproved: true,
            }
          : c
      )
    );
    if (selectedContract && selectedContract.id === id) {
      setSelectedContract((prev) => (prev ? { ...prev, status: 'signed', termsApproved: true } : null));
    }
  };

  const filteredContracts = contracts.filter(
    (c) =>
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`w-full space-y-8 pb-24 ${isAr ? 'text-right' : 'text-left'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'الاتفاقيات القانونية والتوثيق' : 'Legal Agreements & Proposals'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? 'عقود الحجوزات وعروض الأسعار' : 'Event Contracts & Quotations'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            {isAr
              ? 'إصدار وتوثيق عقود القاعات الرسمية، توقيع الشروط والأحكام، تنظيم مواعيد سداد الدفعات، وبنود رد التأمين.'
              : 'Issue legally binding venue rental contracts, terms compliance, installment milestones, and deposit terms.'}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className={`w-3.5 h-3.5 text-slate-500 absolute top-3 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث برقم العقد أو العميل...' : 'Search contract or client...'}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredContracts.map((c) => {
          const isSigned = c.status === 'signed';
          return (
            <TiltCard
              key={c.id}
              tiltMax={4}
              className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40">
                    {c.contractNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSigned
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isSigned ? (isAr ? 'موقّع ومعتمد' : 'Signed & Active') : (isAr ? 'مسودة بانتظار التوقيع' : 'Draft / Pending')}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{c.clientName}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{c.hallName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{c.date} · {c.timeSlot}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/70 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{isAr ? 'قيمة العقد:' : 'Total Value:'}</span>
                    <span className="font-mono font-bold text-white">{c.totalAmount.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{isAr ? 'العربون المسدد:' : 'Deposit Paid:'}</span>
                    <span className="font-mono text-emerald-400 font-bold">{c.depositAmount.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{isAr ? 'مبلغ التأمين المسترد:' : 'Held Security Deposit:'}</span>
                    <span className="font-mono text-amber-400">{c.securityDeposit.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.click(600);
                    setSelectedContract(c);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAr ? 'معاينة العقد' : 'View Contract'}</span>
                </button>

                {!isSigned && (
                  <button
                    onClick={() => handleSignContract(c.id)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title={isAr ? 'اعتماد التوقيع' : 'Sign Agreement'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'توقيع' : 'Sign'}</span>
                  </button>
                )}
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* Contract Preview Modal */}
      <AnimatePresence>
        {selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                    عقد إيجار قاعة مناسبات رسمي
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    {isAr ? `عقد حجز رقم: ${selectedContract.contractNumber}` : `Contract Agreement: ${selectedContract.contractNumber}`}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    مرتبط بحجز رقم {selectedContract.bookingCode}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedContract(null)}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>

              {/* Legal Terms & Parties */}
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-sm">
                    {isAr ? 'الطرف الأول: مجموعة قاعات وقصر أورا للمناسبات' : 'First Party: Aura Palace & Luxury Venues'}
                  </div>
                  <div className="text-slate-400">
                    {isAr
                      ? `الطرف الثاني: السيد / ${selectedContract.clientName} - رقم قومي: ${selectedContract.clientNationalId} - هاتف: ${selectedContract.clientPhone}`
                      : `Second Party: ${selectedContract.clientName} - National ID: ${selectedContract.clientNationalId} - Phone: ${selectedContract.clientPhone}`}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white">{isAr ? 'موضوع التعاقد والبيانات المالية:' : 'Agreement Scope & Financials:'}</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>{isAr ? `تأجير ${selectedContract.hallName} بتاريخ ${selectedContract.date} من الساعة ${selectedContract.timeSlot}.` : `Rental of ${selectedContract.hallName} on ${selectedContract.date} during ${selectedContract.timeSlot}.`}</li>
                    <li>{isAr ? `إجمالي القيمة المتفق عليها: ${selectedContract.totalAmount.toLocaleString()} ج.م شاملة كافة الخدمات المسجلة.` : `Total agreed value: ${selectedContract.totalAmount.toLocaleString()} EGP.`}</li>
                    <li>{isAr ? `سدد الطرف الثاني عربوناً وقدره: ${selectedContract.depositAmount.toLocaleString()} ج.م عند توقيع هذا العقد.` : `Deposit paid upon signing: ${selectedContract.depositAmount.toLocaleString()} EGP.`}</li>
                    <li>{isAr ? `يتم سداد المبلغ المتبقي بالكامل قبل موعد المناسبة بـ 48 ساعة على الأقل.` : `Remaining balance due at least 48 hours prior to event.`}</li>
                    <li>{isAr ? `يلتزم الطرف الأول برد مبلغ التأمين وقدره ${selectedContract.securityDeposit.toLocaleString()} ج.م نقداً فور انتهاء المناسبة وسلامة أجهزة القاعة.` : `Security deposit of ${selectedContract.securityDeposit.toLocaleString()} EGP is fully refunded post-event upon venue clearance.`}</li>
                  </ul>
                </div>
              </div>

              {/* Signature Block */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs">
                  <div className="text-slate-400">{isAr ? 'حالة التوقيع والاعتماد:' : 'Signing Status:'}</div>
                  <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedContract.status === 'signed' ? (isAr ? 'معتمد وموقع إلكترونياً' : 'Electronically Signed & Verified') : (isAr ? 'بانتظار التوقيع' : 'Pending Signature')}</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      sound.click(600);
                      window.print();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isAr ? 'طباعة العقد الرسمي' : 'Print Official Contract'}</span>
                  </button>

                  {selectedContract.status !== 'signed' && (
                    <button
                      onClick={() => handleSignContract(selectedContract.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'توقيع العقد الآن' : 'Sign Now'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
