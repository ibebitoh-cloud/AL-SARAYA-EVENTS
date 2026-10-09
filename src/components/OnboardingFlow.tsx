import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, CalendarDays, Images, Wallet, Users, LayoutDashboard, CheckCircle2, Sparkles } from 'lucide-react';
import { Language } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface OnboardingFlowProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onComplete: () => void;
  onNavigate?: (tab: 'dashboard' | 'bookings' | 'photo_library' | 'finance' | 'clients') => void;
}

export function OnboardingFlow({ isOpen, language, onClose, onComplete, onNavigate }: OnboardingFlowProps) {
  const isAr = language === 'ar';
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: LayoutDashboard,
      title: isAr ? 'مرحباً بك في بوابة السرايا' : 'Welcome to SARAYA EVENT',
      description: isAr ? 'هذه جولة سريعة للتعرّف على أقسام إدارة القاعات. استخدم القائمة الجانبية للتنقل بين الشاشات.' : 'Take a quick tour of the venue management portal. Use the sidebar to move between screens.',
      action: isAr ? 'لوحة التحكم' : 'Dashboard',
      tab: 'dashboard' as const,
    },
    {
      icon: CalendarDays,
      title: isAr ? 'الحجوزات والمناسبات' : 'Bookings & Events',
      description: isAr ? 'أنشئ حجزاً، وسجّل بيانات العميل والقاعة وموعد المناسبة والسعر والعربون. راجع حالة الحجز والمدفوعات المستحقة.' : 'Create reservations and manage customer, hall, event date, price, deposit, and booking status.',
      action: isAr ? 'فتح الحجوزات' : 'Open bookings',
      tab: 'bookings' as const,
    },
    {
      icon: Images,
      title: isAr ? 'مكتبة الصور' : 'Photo Library',
      description: isAr ? 'تصفّح صور المناسبات في مكان واحد. لكل عملية حجز ألبوم مستقل لتسهيل الوصول إلى صور المناسبة.' : 'Browse event photos in one place. Each booking has its own album to keep event photos organized.',
      action: isAr ? 'فتح مكتبة الصور' : 'Open photo library',
      tab: 'photo_library' as const,
    },
    {
      icon: Wallet,
      title: isAr ? 'المالية والمدفوعات' : 'Finance & Payments',
      description: isAr ? 'تابع المقبوضات والعربون والمبالغ المتبقية والمصروفات. راجع السجلات قبل اعتماد أي إجراء مالي.' : 'Track receipts, deposits, outstanding balances, and expenses. Review entries before confirming financial actions.',
      action: isAr ? 'فتح المالية' : 'Open finance',
      tab: 'finance' as const,
    },
    {
      icon: Users,
      title: isAr ? 'العملاء وإنهاء الجولة' : 'Clients & Finish',
      description: isAr ? 'استخدم شاشة العملاء لمراجعة بيانات العملاء والحجوزات المرتبطة بهم. يمكنك الرجوع إلى هذه الجولة من القائمة الجانبية في أي وقت.' : 'Use the Clients screen to review customer records and related bookings. You can reopen this tour from the sidebar whenever you need it.',
      action: isAr ? 'فتح العملاء' : 'Open clients',
      tab: 'clients' as const,
    },
  ];
  const active = steps[step];
  const Icon = active.icon;

  useEffect(() => {
    if (!isOpen) setStep(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setStep((value) => Math.max(0, Math.min(steps.length - 1, value + (isAr ? -1 : 1))));
      if (event.key === 'ArrowLeft') setStep((value) => Math.max(0, Math.min(steps.length - 1, value + (isAr ? 1 : -1))));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAr, steps.length, onClose]);

  if (!isOpen) return null;

  const finish = () => {
    sound.success();
    onComplete();
    onClose();
  };
  const next = () => {
    sound.swoosh();
    if (step < steps.length - 1) setStep((value) => value + 1);
    else finish();
  };
  const previous = () => {
    sound.click(500);
    setStep((value) => Math.max(0, value - 1));
  };

  return (
    <AnimatePresence>
      <div dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-md sm:p-6">
        <motion.section role="dialog" aria-modal="true" aria-labelledby="onboarding-title" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-400/20 bg-slate-900 p-5 shadow-2xl sm:p-8">
          <button type="button" onClick={onClose} aria-label={isAr ? 'إغلاق الجولة' : 'Close tour'} className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white`}><X className="h-5 w-5" /></button>
          <div className="mb-6 pe-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">{isAr ? 'دليل الاستخدام التفاعلي' : 'Interactive onboarding'} · {isAr ? `الخطوة ${step + 1} من ${steps.length}` : `Step ${step + 1} of ${steps.length}`}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><motion.div className="h-full rounded-full bg-amber-400" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.25 }} /></div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {steps.map((item, index) => <button key={item.title} type="button" onClick={() => setStep(index)} aria-label={isAr ? `الانتقال إلى الخطوة ${index + 1}` : `Go to step ${index + 1}`} className={`flex h-9 items-center justify-center rounded-lg border text-xs font-bold transition ${index === step ? 'border-amber-400 bg-amber-400 text-slate-950' : index < step ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-950 text-slate-500'}`}>{index < step ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</button>)}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: isAr ? -12 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isAr ? 12 : -12 }} transition={{ duration: 0.2 }} className="min-h-[230px] py-3">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300"><Icon className="h-7 w-7" /></div>
              <h2 id="onboarding-title" className="text-2xl font-black leading-tight text-white sm:text-3xl">{active.title}</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{active.description}</p>
              <button type="button" onClick={() => onNavigate?.(active.tab)} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-400/20">
                {active.action} {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button type="button" onClick={previous} disabled={step === 0} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30">{isAr ? 'السابق' : 'Previous'}</button>
            <button type="button" onClick={finish} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white">{isAr ? 'تخطي الجولة' : 'Skip tour'}</button>
            <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-300">{step === steps.length - 1 ? (isAr ? 'إنهاء الجولة' : 'Finish tour') : (isAr ? 'التالي' : 'Next')} {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500"><Sparkles className="h-3.5 w-3.5 text-amber-400" />{isAr ? 'يمكنك فتح هذا الدليل من القائمة الجانبية في أي وقت.' : 'You can reopen this guide from the sidebar at any time.'}</div>
        </motion.section>
      </div>
    </AnimatePresence>
  );
}
