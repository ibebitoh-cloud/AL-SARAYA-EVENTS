import { useEffect, useState } from 'react';
import { Box, Clock, CreditCard, Footprints, Lock, Palette, Presentation, Sparkles } from 'lucide-react';
import type { Hall, Language } from '../types/venueSystem';
import { EventLayoutDesigner } from './EventLayoutDesigner';
import { BrandLogo } from './BrandLogo';
import { PRO_3D, PRO_3D_STORAGE_KEY } from '../data/proFeatures';

type DemoState = { used: number; activeUntil?: number };

const readDemo = (): DemoState => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PRO_3D_STORAGE_KEY) || 'null');
    if (saved && typeof saved.used === 'number') return saved;
  } catch {}
  return { used: 0 };
};
const writeDemo = (state: DemoState) => { try { window.localStorage.setItem(PRO_3D_STORAGE_KEY, JSON.stringify(state)); } catch {} };

interface Props { language: Language; halls: Hall[]; onUpdateHall: (hall: Hall) => void; }

/** 3D Studio Pro: the premium 3D designer. Runs as a limited demo until payment is completed and it is unlocked (src/data/proFeatures.ts). */
export function Studio3DProView({ halls, onUpdateHall }: Props) {
  // 3D Studio Pro always runs in English, even when the portal is in Arabic.
  const language: Language = 'en';
  const isAr = false;
  const [demo, setDemo] = useState<DemoState>(() => (typeof window === 'undefined' ? { used: 0 } : readDemo()));
  const [now, setNow] = useState(() => Date.now());
  const active = PRO_3D.unlocked || Boolean(demo.activeUntil && demo.activeUntil > now);
  const left = Math.max(0, PRO_3D.demoSessions - demo.used);
  const price = `$${PRO_3D.priceUsd}`;

  useEffect(() => {
    if (PRO_3D.unlocked || !demo.activeUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [demo.activeUntil]);

  const startSession = () => {
    if (left <= 0) return;
    const next = { used: demo.used + 1, activeUntil: Date.now() + PRO_3D.demoMinutes * 60_000 };
    writeDemo(next);
    setDemo(next);
    setNow(Date.now());
  };

  if (PRO_3D.unlocked) return <EventLayoutDesigner language={language} halls={halls} onUpdateHall={onUpdateHall} edition="pro" />;

  if (active) {
    const remaining = Math.max(0, Math.ceil(((demo.activeUntil || 0) - now) / 1000));
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    return (
      <div className="relative" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="sticky top-2 z-30 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/50 bg-slate-950/95 px-4 py-2.5 shadow-xl backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-black text-amber-200"><Sparkles className="h-4 w-4" />{isAr ? 'نسخة تجريبية · استوديو 3D برو' : 'DEMO · 3D Studio Pro'}</div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-mono text-amber-100" dir="ltr"><Clock className="h-3.5 w-3.5" />{mm}:{ss}</span>
            <span>{isAr ? `الجلسات المتبقية: ${left}` : `${left} sessions left`}</span>
            <a href={PRO_3D.paymentUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-amber-400 px-2.5 py-1 font-black text-slate-950 hover:bg-amber-300">{isAr ? 'فعّل الاشتراك للاستخدام' : 'Activate subscription to use'}</a>
          </div>
        </div>
        <EventLayoutDesigner language={language} halls={halls} onUpdateHall={onUpdateHall} edition="pro" canSave={false} demo />
      </div>
    );
  }

  const features = [
    { icon: Palette, en: 'Decor styles: Royal gold, Black & gold, Classic white, Garden, Corporate', ar: 'ستايلات ديكور: ذهبي ملكي، أسود وذهبي، أبيض كلاسيك، جاردن، رسمي' },
    { icon: Footprints, en: 'Walk-through at eye level, on phones too', ar: 'تجوّل داخل القاعة بمستوى نظر الضيف، حتى على الموبايل' },
    { icon: Box, en: 'Rich detail: place settings, centrepieces, kosha flowers, chandeliers and lighting', ar: 'تفاصيل غنية: أطباق وكؤوس، سنترات، ورد الكوشة، نجف وإضاءة' },
    { icon: Presentation, en: 'Client presentation view to win the booking', ar: 'عرض احترافي للعميل لإقناعه بالحجز' },
  ];
  const ended = demo.used > 0;
  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-amber-400/30 bg-slate-900/80 p-6 sm:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <BrandLogo className="h-6 w-auto" />
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-black text-amber-200"><Sparkles className="h-3.5 w-3.5" />{isAr ? 'إضافة مميزة' : 'PREMIUM ADD-ON'}</div>
      <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">{isAr ? 'استوديو 3D برو' : '3D Studio Pro'}</h1>
      <p className="mt-2 text-sm leading-7 text-slate-300">{isAr ? 'اعرض على العميل حفلته قبل ما تحصل: القاعة بمقاساتها الحقيقية، بالديكور اللي اختاره، ويتجوّل جواها بنفسه.' : 'Show clients their event before it happens: the real-size venue, in the decor they choose, and let them walk through it.'}</p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {features.map(({ icon: Icon, en, ar }) => <li key={en} className="flex items-start gap-2.5 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs leading-5 text-slate-200"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{isAr ? ar : en}</li>)}
      </ul>
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        {left > 0 ? <>
          <div className="text-sm font-bold text-white">{ended ? (isAr ? 'انتهت جلسة التجربة' : 'Demo session ended') : (isAr ? 'جرّبه الآن' : 'Try it now')}</div>
          <p className="mt-1 text-xs text-slate-400">{isAr ? `متبقي ${left} من ${PRO_3D.demoSessions} جلسات تجربة، كل جلسة ${PRO_3D.demoMinutes} دقائق. الحفظ غير متاح في التجربة.` : `${left} of ${PRO_3D.demoSessions} demo sessions left, ${PRO_3D.demoMinutes} minutes each. Saving is off in the demo.`}</p>
          <button type="button" onClick={startSession} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300"><Sparkles className="h-4 w-4" />{isAr ? 'ابدأ جلسة تجربة' : 'Start demo session'}</button>
        </> : <>
          <div className="flex items-center gap-2 text-sm font-bold text-white"><Lock className="h-4 w-4 text-amber-300" />{isAr ? 'انتهت التجربة' : 'The demo has ended'}</div>
          <p className="mt-1 text-xs text-slate-400">{isAr ? 'استخدمت كل جلسات التجربة. الخدمة غير قابلة للاستخدام بدون اشتراك فعّال.' : 'All demo sessions are used. The service can’t be used without an active subscription.'}</p>
        </>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-200"><Lock className="h-3.5 w-3.5" />{isAr ? 'خدمة أونلاين · الاشتراك غير مفعّل' : 'Online service · subscription not active'}</div>
            <p className="mt-1 text-xs leading-5 text-slate-300">{isAr ? '3D Studio Pro غير قابل للاستخدام بدون اشتراك فعّال. التجربة للمعاينة فقط: لا حفظ ولا عرض للعملاء.' : '3D Studio Pro can’t be used without an active subscription. The demo is a preview only: no saving and no client presentation.'}</p>
          </div>
          <a href={PRO_3D.paymentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300"><CreditCard className="h-4 w-4" />{isAr ? 'فعّل الاشتراك' : 'Activate subscription'}</a>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">{isAr ? `الاشتراك ${price} · يتفعّل بعد إتمام الدفع.` : `Subscription ${price} · activates once payment is completed.`}</p>
      </div>
    </section>
  );
}
