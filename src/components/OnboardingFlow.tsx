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
  onNavigate?: (tab: import('../types/venueSystem').VenueTab) => void;
}

export function OnboardingFlow({ isOpen, language, onClose, onComplete, onNavigate }: OnboardingFlowProps) {
  const isAr = language === 'ar';
  const [step, setStep] = useState(0);
  const steps = [
    { icon: LayoutDashboard, title: isAr ? 'نظرة عامة على السرايا' : 'SARAYA EVENT at a glance', description: isAr ? 'السرايا منصة لإدارة أعمال قاعات الأفراح والمناسبات من أول استفسار وحجز، مروراً بتجهيز المناسبة والعقد والخدمات، وحتى التحصيل والمصروفات والتقارير والصور. هذه الجولة تشرح وظيفة كل شاشة وكيف تتكامل الأقسام معاً.' : 'SARAYA EVENT brings venue operations together: enquiries and bookings, event planning, contracts and services, payments and expenses, reports, and event photos. This tour explains what each screen is for and how the sections fit together.', action: isAr ? 'فتح لوحة التحكم' : 'Open dashboard', tab: 'dashboard' as const },
    { icon: LayoutDashboard, title: isAr ? 'لوحة التحكم' : 'Dashboard', description: isAr ? 'ابدأ من هنا للحصول على نظرة سريعة على النشاط والحجوزات والمؤشرات المهمة. استخدمها كنقطة بداية، ثم انتقل إلى الشاشة المتخصصة لتنفيذ الإجراء أو مراجعة التفاصيل.' : 'Start here for a high-level view of venue activity, bookings, and key indicators. Use it as your starting point, then open the relevant screen to take action or inspect details.', action: isAr ? 'فتح لوحة التحكم' : 'Open dashboard', tab: 'dashboard' as const },
    { icon: CalendarDays, title: isAr ? 'الحجوزات والمناسبات' : 'Bookings & Events', description: isAr ? 'أنشئ الحجز وسجّل العميل ورقم الهاتف ونوع المناسبة والتاريخ والوقت والقاعة وعدد الضيوف والسعر والخدمات والعربون والتأمين. راجع حالة الحجز والمبلغ المدفوع والمتبقي، وحدّث بيانات المناسبة عند الحاجة. إنشاء الحجز يضيف ألبومه إلى مكتبة الصور، وإذا سُجّل عربون يُنشأ له سجل تحصيل.' : 'Create a booking with client contacts, event type, date and time, venue, guest count, pricing, services, deposit, and security deposit. Review booking status, paid amount, and remaining balance. A new booking is linked to its own photo album, and a recorded deposit creates a payment entry.', action: isAr ? 'فتح الحجوزات' : 'Open bookings', tab: 'bookings' as const },
    { icon: CalendarDays, title: isAr ? 'الأجندة ومواعيد المناسبات' : 'Calendar & Agenda', description: isAr ? 'استخدم الأجندة لمراجعة المناسبات حسب مواعيدها ومتابعة جدول القاعات، واكتشاف تداخل المواعيد مبكراً. ارجع إلى شاشة الحجوزات لتعديل تفاصيل الحجز نفسه.' : 'Use the agenda to review upcoming events by date and keep track of the venue schedule. Spot potential timing conflicts early, then return to Bookings to change reservation details.', action: isAr ? 'فتح الأجندة' : 'Open agenda', tab: 'agenda' as const },
    { icon: Images, title: isAr ? 'مكتبة الصور وألبومات الحجوزات' : 'Photo Library & Albums', description: isAr ? 'تجمع مكتبة الصور صور المناسبات في شاشة مستقلة. لكل حجز ألبوم مرتبط به حتى يسهل العثور على الصور الخاصة بكل عميل ومناسبة بدلاً من خلط الصور بين الحجوزات. افتح المكتبة لمراجعة الصور وإدارة محتوى الألبومات.' : 'The separate Photo Library organizes event photos. Each booking has its own associated album so photos can be found by event instead of being mixed together. Open the library to browse and manage event imagery.', action: isAr ? 'فتح مكتبة الصور' : 'Open photo library', tab: 'photo_library' as const },
    { icon: Sparkles, title: isAr ? 'البوفيه والخدمات الإضافية' : 'Catering & Services', description: isAr ? 'راجع خيارات البوفيه وباقات الضيافة من شاشة البوفيه، واستخدم الخدمات لتعريف الخدمات الإضافية مثل الديكور والصوت والإضاءة والتصوير والطاولات والكراسي مع أسعارها وتكلفتها. أضف الخدمات المناسبة إلى الحجز وراجع أثرها على الإجمالي.' : 'Review food and hospitality options in Catering. Use Services to maintain add-ons such as décor, sound, lighting, photography, tables, and chairs, including their prices and costs. Add the appropriate services to a booking and verify the updated total.', action: isAr ? 'فتح الخدمات' : 'Open services', tab: 'services' as const },
    { icon: CheckCircle2, title: isAr ? 'العقود والاتفاقات' : 'Contracts', description: isAr ? 'استخدم شاشة العقود لمراجعة بيانات الاتفاق المرتبط بالحجز، والمبالغ والعربون والتأمين وحالة العقد. تأكد من مطابقة اسم العميل والقاعة والتاريخ والقيم قبل اعتماد العقد أو تحديث حالته.' : 'Use Contracts to review the agreement tied to a booking, including client and venue details, event date, amounts, deposit, security deposit, and contract status. Verify these details before confirming or updating an agreement.', action: isAr ? 'فتح العقود' : 'Open contracts', tab: 'contracts' as const },
    { icon: Users, title: isAr ? 'العملاء' : 'Clients', description: isAr ? 'شاشة العملاء تساعدك على مراجعة ملفات العملاء ووسائل الاتصال والحجوزات المرتبطة بهم وإجمالي التعاملات والأرصدة المستحقة. استخدمها للعثور على سجل العميل قبل إنشاء حجز جديد أو متابعة حجز قائم.' : 'Clients keeps customer records and contact details together with related bookings, total activity, and outstanding balances. Find the client record before creating a new booking or following up on an existing one.', action: isAr ? 'فتح العملاء' : 'Open clients', tab: 'clients' as const },
    { icon: Wallet, title: isAr ? 'سجل التحصيل والإيصالات' : 'Payments Ledger & Receipts', description: isAr ? 'سجّل وراجع دفعات العملاء والإيصالات وطرق الدفع، بما في ذلك العربون والأقساط والتأمين ورد التأمين. راجع رقم الإيصال واسم العميل وكود الحجز والمبلغ والتاريخ قبل إتمام التسجيل؛ ويُحدّث التحصيل رصيد الحجز المرتبط به.' : 'Record and review customer payments and receipts, including deposits, installments, security deposits, and security refunds. Verify receipt number, client, booking code, amount, date, and payment method. A payment updates the balance of its linked booking.', action: isAr ? 'فتح سجل التحصيل' : 'Open payment ledger', tab: 'payments' as const },
    { icon: Wallet, title: isAr ? 'المصروفات' : 'Expenses', description: isAr ? 'سجّل المصروفات التشغيلية مثل العمالة والمرافق والنظافة والصيانة والتجهيزات والتسويق، وحدد المستفيد والتاريخ والقيمة. اربط المصروف بالحجز عند انطباق ذلك حتى يمكن مراجعة تكلفة المناسبة بصورة أوضح.' : 'Record operating costs such as labor, utilities, cleaning, maintenance, supplies, and marketing. Enter the payee, date, and amount, and link an expense to a booking when relevant to make event costs easier to review.', action: isAr ? 'فتح المصروفات' : 'Open expenses', tab: 'expenses' as const },
    { icon: Wallet, title: isAr ? 'المالية' : 'Finance Overview', description: isAr ? 'استخدم شاشة المالية لمراجعة الصورة الإجمالية للتحصيل والمبالغ المستحقة والمصروفات. سجل الدفعات في سجل التحصيل وسجّل التكاليف في المصروفات أولاً حتى تكون المراجعة المالية مبنية على بيانات واضحة ومحدثة.' : 'Use Finance for a broader view of collections, outstanding balances, and expenses. Enter receipts in the Payments Ledger and costs in Expenses first so the overview reflects the records maintained by the team.', action: isAr ? 'فتح المالية' : 'Open finance', tab: 'finance' as const },
    { icon: Sparkles, title: isAr ? 'المخزون والمستلزمات' : 'Inventory & Supplies', description: isAr ? 'تابع كميات المستلزمات ووحدات القياس والحد الأدنى المطلوب والكميات التالفة وتاريخ آخر توريد. حدّث الكميات بعد الاستلام أو الاستخدام، وراجع الأصناف التي اقتربت من حد التنبيه قبل موعد المناسبة.' : 'Track supply quantities, units, minimum thresholds, damaged items, and last restock date. Update quantities after receiving or using items, and review low-stock items before an event.', action: isAr ? 'فتح المخزون' : 'Open inventory', tab: 'inventory' as const },
    { icon: Users, title: isAr ? 'الموظفون وفريق العمل' : 'Staff & Team', description: isAr ? 'راجع بيانات الموظفين وأدوارهم وأجورهم وحالة الحضور والسلف والحوافز. حدّث الحضور وراجع توزيع المسؤوليات قبل المناسبة، وتحقق من البيانات المالية الخاصة بالفريق قبل اعتمادها.' : 'Review staff contacts, roles, pay arrangements, attendance, loans, and bonuses. Update attendance and check responsibilities before an event, then verify team-related financial details before relying on them.', action: isAr ? 'فتح الموظفين' : 'Open staff', tab: 'staff' as const },
    { icon: LayoutDashboard, title: isAr ? 'التقارير' : 'Reports', description: isAr ? 'ارجع إلى التقارير لمراجعة ملخصات النشاط ومؤشرات الأداء المتاحة. استخدمها للمتابعة واكتشاف ما يحتاج إلى اهتمام، ثم افتح شاشة الحجوزات أو المالية أو المصروفات للوصول إلى السجل التفصيلي والتحقق منه.' : 'Use Reports to review available activity summaries and performance indicators. Identify items that need attention, then open Bookings, Finance, or Expenses to inspect and verify the underlying records.', action: isAr ? 'فتح التقارير' : 'Open reports', tab: 'reports' as const },
    { icon: Sparkles, title: isAr ? 'الموقع العام وتجربة العميل' : 'Public Website & Customer Experience', description: isAr ? 'الواجهة العامة مخصصة لتعريف الزوار بالسرايا والقاعات والخدمات والمعرض والجولة الافتراضية المتاحة. بوابة الإدارة منفصلة عنها وتُستخدم لتشغيل الحجوزات والبيانات الداخلية. افتح الموقع العام لمراجعة ما يراه العميل.' : 'The public-facing website introduces visitors to SARAYA EVENT, venues, services, gallery, and the available virtual tour. The management portal is separate and handles internal operations. Review the public pages to understand the customer-facing experience.', action: isAr ? 'العودة إلى الصفحة الرئيسية' : 'Return to public home', tab: 'home' as const },
    { icon: CheckCircle2, title: isAr ? 'ملخص التطبيق وطريقة العمل' : 'Full App Overview & Recommended Workflow', description: isAr ? 'باختصار: ابدأ بملف العميل ثم أنشئ الحجز، وتأكد من القاعة والتاريخ والسعر والخدمات والعربون والتأمين. بعد ذلك راجع الأجندة، وجهّز خدمات الضيافة والموظفين والمخزون، وراجع العقد. سجّل كل دفعة في سجل التحصيل وكل تكلفة في المصروفات، ثم تابع الرصيد والنتائج من المالية والتقارير. أخيراً، احتفظ بصور المناسبة في ألبوم الحجز الخاص بها. استخدم الشاشة المتخصصة لكل مهمة، ولا تعتبر الأرقام أو السجلات نهائية قبل مراجعة تفاصيلها. يمكنك الرجوع إلى هذا الدليل من القائمة الجانبية في أي وقت.' : 'In short: find or create the client record, create the booking, and verify venue, date, price, services, deposit, and security deposit. Check the agenda, coordinate catering, staff, and inventory, and review the contract. Record every collection in the Payments Ledger and every cost in Expenses, then monitor balances and results in Finance and Reports. Keep event photos in that booking’s album. Use the dedicated screen for each task and verify the underlying record before treating a figure as final. Reopen this guide from the sidebar whenever you need it.', action: isAr ? 'إنهاء الجولة' : 'Finish tour', tab: 'dashboard' as const },
  ];  const active = steps[step];
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
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
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
