import { useEffect, useState } from 'react';
import { Box, Camera, Clapperboard, Clock, Footprints, KeyRound, Lock, Moon, Palette, Presentation, Sparkles, X } from 'lucide-react';
import type { Hall, Language } from '../types/venueSystem';
import { EventLayoutDesigner } from './EventLayoutDesigner';
import { BrandLogo } from './BrandLogo';
import { PRO_3D, PRO_3D_LICENSE_KEY, PRO_3D_STORAGE_KEY, hashProKey, isProLicensed } from '../data/proFeatures';
import previewPro from '../assets/images/studio3d/preview-pro.webp';
import previewBasic from '../assets/images/studio3d/preview-basic.webp';

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
  const [licensed, setLicensed] = useState(() => (typeof window === 'undefined' ? PRO_3D.unlocked : isProLicensed()));
  const [keyOpen, setKeyOpen] = useState(false);
  const active = licensed || Boolean(demo.activeUntil && demo.activeUntil > now);
  const left = Math.max(0, PRO_3D.demoSessions - demo.used);
  const price = `$${PRO_3D.priceUsd}`;

  useEffect(() => {
    if (licensed || !demo.activeUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [demo.activeUntil, licensed]);

  const startSession = () => {
    if (left <= 0) return;
    const next = { used: demo.used + 1, activeUntil: Date.now() + PRO_3D.demoMinutes * 60_000 };
    writeDemo(next);
    setDemo(next);
    setNow(Date.now());
  };

  const keyDialog = keyOpen && <ActivationDialog onClose={() => setKeyOpen(false)} onActivated={() => { setKeyOpen(false); setLicensed(true); }} />;

  if (licensed) return <EventLayoutDesigner language={language} halls={halls} onUpdateHall={onUpdateHall} edition="pro" />;

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
            <button type="button" onClick={() => setKeyOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 py-1 font-black text-slate-950 hover:bg-amber-300"><KeyRound className="h-3.5 w-3.5" />Activate subscription</button>
          </div>
        </div>
        <EventLayoutDesigner language={language} halls={halls} onUpdateHall={onUpdateHall} edition="pro" canSave={false} demo />
        {keyDialog}
      </div>
    );
  }

  const features = [
    { icon: Palette, en: 'Decor styles: Royal gold, Black & gold, Classic white, Garden, Corporate', ar: 'ستايلات ديكور: ذهبي ملكي، أسود وذهبي، أبيض كلاسيك، جاردن، رسمي' },
    { icon: Footprints, en: 'Walk-through at eye level, on phones too', ar: 'تجوّل داخل القاعة بمستوى نظر الضيف، حتى على الموبايل' },
    { icon: Box, en: 'Rich detail: place settings, centrepieces, kosha flowers, chandeliers and lighting', ar: 'تفاصيل غنية: أطباق وكؤوس، سنترات، ورد الكوشة، نجف وإضاءة' },
    { icon: Presentation, en: 'Client presentation view to win the booking', ar: 'عرض احترافي للعميل لإقناعه بالحجز' },
    { icon: Moon, en: 'Lighting scenes: Day, Evening glow and Party beams on the dance floor', ar: 'مشاهد إضاءة: نهار، مساء، وحفلة بإضاءة ملونة على منصة الرقص' },
    { icon: Clapperboard, en: 'One-tap camera shots (entrance, kosha, guest seat, aerial) and a cinematic auto tour', ar: 'لقطات كاميرا بلمسة (المدخل، الكوشة، مقعد ضيف، من أعلى) وجولة سينمائية تلقائية' },
    { icon: Camera, en: 'HD photos with the ELSARAYA EVENTS caption, ready to send on WhatsApp', ar: 'صور بدقة عالية باسم السرايا جاهزة للإرسال على واتساب' },
    { icon: Sparkles, en: 'Real reflections on gold, glass and marble, and a coffered ceiling in the walk-through', ar: 'انعكاسات حقيقية على الذهب والزجاج والرخام، وسقف بإضاءة في التجوّل' },
  ];
  const ended = demo.used > 0;
  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-amber-400/30 bg-slate-900/80 p-6 sm:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <BrandLogo className="h-6 w-auto" />
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-black text-amber-200"><Sparkles className="h-3.5 w-3.5" />{isAr ? 'إضافة مميزة' : 'PREMIUM ADD-ON'}</div>
      <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">{isAr ? 'استوديو 3D برو' : '3D Studio Pro'}</h1>
      <p className="mt-2 text-sm leading-7 text-slate-300">{isAr ? 'اعرض على العميل حفلته قبل ما تحصل: القاعة بمقاساتها الحقيقية، بالديكور اللي اختاره، ويتجوّل جواها بنفسه.' : 'Show clients their event before it happens: the real-size venue, in the decor they choose, and let them walk through it.'}</p>
      {/* Preview: what Pro looks like next to the basic Event Designer. */}
      <figure className="mt-5">
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-[#0D0D0F]">
          <img src={previewPro} alt="3D Studio Pro view of a wedding layout" className="block aspect-[16/10] w-full object-cover" loading="lazy" />
          <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#E9CF94] via-[#C49A52] to-[#8C6A2E] px-2.5 py-1 text-[10px] font-black tracking-widest text-[#0D0D0F]"><Sparkles className="h-3 w-3" />PRO</span>
          <div className="absolute bottom-3 end-3 w-[34%] max-w-[220px] overflow-hidden rounded-xl border border-slate-600 bg-[#08111D] shadow-2xl">
            <img src={previewBasic} alt="Basic 3D view of the same hall" className="block aspect-[4/3] w-full object-cover" loading="lazy" />
            <span className="absolute start-2 top-2 rounded-md bg-[#172033] px-2 py-0.5 text-[9px] font-black tracking-widest text-[#CFE5FF]">BASIC</span>
          </div>
        </div>
        <figcaption className="mt-2 text-[11px] text-slate-500">The same hall in the basic Event Designer (inset) and 3D Studio Pro with decor, lighting and real measurements.</figcaption>
      </figure>
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
          <button type="button" onClick={() => setKeyOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300"><KeyRound className="h-4 w-4" />Activate subscription</button>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">{isAr ? `الاشتراك ${price} · يتفعّل بعد إتمام الدفع.` : `Subscription ${price} · activates with the key you receive after payment.`}</p>
      </div>
      {keyDialog}
    </section>
  );
}

/** "Enter activation key" dialog. A valid key is remembered on this browser and unlocks Pro. */
function ActivationDialog({ onClose, onActivated }: { onClose: () => void; onActivated: () => void }) {
  const [key, setKey] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'wrong' | 'ok'>('idle');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setState('checking');
    let hash = '';
    try { hash = await hashProKey(key); } catch {}
    if (hash && hash === PRO_3D.activationKeyHash) {
      try { window.localStorage.setItem(PRO_3D_LICENSE_KEY, hash); } catch {}
      setState('ok');
      window.setTimeout(onActivated, 900);
    } else setState('wrong');
  };
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: 'rgba(5,5,7,.78)' }} role="dialog" aria-modal="true" aria-labelledby="pro-key-title" dir="ltr" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-amber-400/40 bg-[#111113] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-200"><KeyRound className="h-4 w-4" />3D Studio Pro</div>
            <h2 id="pro-key-title" className="mt-1 text-lg font-black text-white">Enter activation key</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Your activation key is issued once your subscription payment is completed. It unlocks Pro on this device.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <label className="mt-4 block text-[11px] font-bold text-slate-300" htmlFor="pro-key-input">Activation key</label>
        <input id="pro-key-input" autoFocus autoComplete="off" spellCheck={false} value={key} onChange={(e) => { setKey(e.target.value.toUpperCase()); if (state === 'wrong') setState('idle'); }} placeholder="XXXX-XXXX-XXXX-XXXX" aria-invalid={state === 'wrong'} aria-describedby="pro-key-status" className={`mt-1 w-full rounded-xl border bg-[#0D0D0F] px-3 py-2.5 font-mono text-sm tracking-[0.2em] text-white outline-none focus:border-amber-400 ${state === 'wrong' ? 'border-red-500' : 'border-slate-700'}`} />
        <div id="pro-key-status" role="status" className="mt-2 min-h-5 text-xs">
          {state === 'wrong' && <span className="font-bold text-red-400">This activation key isn’t valid. Check it and try again.</span>}
          {state === 'ok' && <span className="font-bold text-emerald-400">Key accepted. Unlocking 3D Studio Pro…</span>}
        </div>
        <button type="submit" disabled={!key.trim() || state === 'checking' || state === 'ok'} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50"><Lock className="h-4 w-4" />{state === 'checking' ? 'Checking…' : 'Activate'}</button>
        <p className="mt-3 text-[10px] leading-4 text-slate-500">Don’t have a key yet? Complete your subscription to receive one.{PRO_3D.paymentUrl && <> <a href={PRO_3D.paymentUrl} target="_blank" rel="noreferrer" className="font-bold text-amber-300 hover:text-amber-200">Go to payment</a></>}</p>
      </form>
    </div>
  );
}
