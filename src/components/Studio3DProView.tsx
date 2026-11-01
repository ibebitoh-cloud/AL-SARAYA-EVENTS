import { useEffect, useState } from 'react';
import { Box, Clock, Footprints, Lock, Palette, Presentation, Sparkles } from 'lucide-react';
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

/** 3D Studio Pro: the premium 3D designer. Runs as a limited demo until DALI STUDIO unlocks it (src/data/proFeatures.ts). */
export function Studio3DProView({ language, halls, onUpdateHall }: Props) {
  const isAr = language === 'ar';
  const [demo, setDemo] = useState<DemoState>(() => (typeof window === 'undefined' ? { used: 0 } : readDemo()));
  const [now, setNow] = useState(() => Date.now());
  const active = PRO_3D.unlocked || Boolean(demo.activeUntil && demo.activeUntil > now);
  const left = Math.max(0, PRO_3D.demoSessions - demo.used);

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
            <span className="text-slate-500">{isAr ? 'الحفظ متاح في النسخة الكاملة' : 'Saving is in the full version'}</span>
          </div>
        </div>
        <div className="relative">
          <EventLayoutDesigner language={language} halls={halls} onUpdateHall={onUpdateHall} edition="pro" canSave={false} />
          {/* DEMO watermark over the whole tool, including the 3D canvas and any screenshot of it. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
            <div className="absolute -inset-1/2 flex flex-wrap content-start gap-x-24 gap-y-20 opacity-[0.10]" style={{ transform: 'rotate(-24deg)' }}>
              {Array.from({ length: 160 }, (_, i) => <span key={i} className="whitespace-nowrap text-2xl font-black tracking-[0.3em] text-amber-200">DEMO · DALI STUDIO</span>)}
            </div>
          </div>
        </div>
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
          <p className="mt-1 text-xs text-slate-400">{isAr ? 'استخدمت كل جلسات التجربة. لتفعيل النسخة الكاملة تواصل مع DALI STUDIO.' : 'All demo sessions are used. Contact DALI STUDIO to unlock the full version.'}</p>
        </>}
        <a href={PRO_3D.contactUrl} target="_blank" rel="noreferrer" className="mt-3 block text-xs font-bold text-amber-300 hover:text-amber-200">{isAr ? `لتفعيل النسخة الكاملة: DALI STUDIO ${PRO_3D.contactLabel}` : `Unlock the full version: DALI STUDIO ${PRO_3D.contactLabel}`}</a>
      </div>
    </section>
  );
}
