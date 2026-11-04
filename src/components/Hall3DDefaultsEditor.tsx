import { useState } from 'react';
import { X } from 'lucide-react';
import type { EventType, Hall, Hall3DProfile, Language } from '../types/venueSystem';
import { EventLayoutDesigner } from './EventLayoutDesigner';
import { DEFAULT_EVENT_TYPES, autoDesign, designerKind } from '../data/booking3D';
import { hallDimensions } from '../data/venueModel';
import { isProLicensed } from '../data/proFeatures';

type Tab = 'main' | EventType;

interface Props {
  hall: Hall;
  language: Language;
  onUpdateHall: (hall: Hall) => void;
  onClose: () => void;
}

/** Company profile → Halls → 3D defaults: the starting 3D for each event type in this hall. */
export function Hall3DDefaultsEditor({ hall: initialHall, language, onUpdateHall, onClose }: Props) {
  const isAr = language === 'ar';
  const [hall, setHall] = useState<Hall>(initialHall);
  const [tab, setTab] = useState<Tab>('main');
  const pro = isProLicensed();

  const isSet = (t: Tab) => t === 'main' ? !!hall.default3D?.items?.length : !!hall.defaults3D?.[t]?.items?.length;
  const typeLabel = (t: Tab) => t === 'main' ? (isAr ? 'الأساسي' : 'Main') : (() => { const e = DEFAULT_EVENT_TYPES.find((x) => x.id === t); return e ? (isAr ? e.ar : e.en) : t; })();

  const designFor = (t: Tab): Hall3DProfile => {
    if (t !== 'main' && hall.defaults3D?.[t]?.items?.length) return hall.defaults3D[t]!;
    if (hall.default3D?.items?.length) return hall.default3D;
    return autoDesign(hall, hall.capacity, t === 'main' ? 'wedding' : t);
  };

  const commit = (next: Hall) => { setHall(next); onUpdateHall(next); };
  const save = (design: Hall3DProfile) => {
    const stamped = { ...design, updatedAt: new Date().toISOString() };
    commit(tab === 'main' ? { ...hall, default3D: stamped } : { ...hall, defaults3D: { ...(hall.defaults3D || {}), [tab]: stamped } });
  };
  const clear = () => {
    if (tab === 'main') { commit({ ...hall, default3D: undefined }); return; }
    const rest = { ...(hall.defaults3D || {}) };
    delete rest[tab];
    commit({ ...hall, defaults3D: rest });
  };

  const hallName = isAr ? hall.name : (hall.nameEn || hall.name);
  const status = isSet(tab)
    ? (isAr ? 'محفوظ · الحجوزات الجديدة تبدأ من هذا التصميم' : 'Saved · new bookings start from this design')
    : tab === 'main'
      ? (isAr ? 'غير محفوظ · يُستخدم ترتيب تلقائي' : 'Not set · an automatic layout is used')
      : (isAr ? 'غير محفوظ · يُستخدم التصميم الأساسي للقاعة' : 'Not set · the hall’s main default is used');

  return (
    <div className="fixed inset-0 z-[90] overflow-auto bg-slate-950 p-2 sm:p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-wider text-amber-400">{isAr ? 'التصميم الافتراضي 3D' : '3D DEFAULTS'}</div>
            <div className="truncate text-lg font-black text-white">{hallName}</div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white"><X className="me-1 inline h-3.5 w-3.5" />{isAr ? 'إغلاق' : 'Close'}</button>
        </div>
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {(['main', ...DEFAULT_EVENT_TYPES.map((e) => e.id)] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${tab === t ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
              {typeLabel(t)}{isSet(t) && <span className={`ms-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${tab === t ? 'bg-slate-950' : 'bg-emerald-400'}`} />}
            </button>
          ))}
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-300">
          <span>{status}</span>
          {isSet(tab) && <button type="button" onClick={clear} className="rounded-lg border border-slate-700 px-2.5 py-1 font-bold text-slate-300">{tab === 'main' ? (isAr ? 'مسح' : 'Clear') : (isAr ? 'مسح (استخدم الأساسي)' : 'Clear (use main)')}</button>}
        </div>
        <EventLayoutDesigner
          key={`${hall.id}-${tab}`}
          language={language}
          initialDesign={designFor(tab)}
          hallDims={hallDimensions(hall)}
          initialEventKind={tab === 'main' ? undefined : designerKind(tab)}
          contextTitle={`${hallName} · ${typeLabel(tab)}`}
          edition={pro ? 'pro' : 'basic'}
          onSaveDesign={save}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
