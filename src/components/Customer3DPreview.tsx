import { useState } from 'react';
import { Cuboid, X } from 'lucide-react';
import { Hall, Hall3DProfile, Language } from '../types/venueSystem';
import { EventLayout3D } from './EventLayout3D';
import { autoLayout, hallDimensions } from '../data/venueModel';

interface Props {
  halls: Hall[];
  language: Language;
}

// Same starter layout the Company Profile uses when a hall has no saved 3D design.
const starterDesign = (hall?: Hall): Hall3DProfile => {
  const dims = hallDimensions(hall);
  return { width: dims.widthM, depth: dims.depthM, items: autoLayout({ widthM: dims.widthM, depthM: dims.depthM, guests: hall?.capacity || 200, pool: dims.pool }).items };
};

/** Customer-facing 3D preview: a card that opens an embedded (not full-screen) viewer on click. */
export function Customer3DPreview({ halls, language }: Props) {
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [hallId, setHallId] = useState(halls[0]?.id);
  const hall = halls.find(h => h.id === hallId) ?? halls[0];
  const design = hall?.default3D ?? starterDesign(hall);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-slate-900 to-slate-950 px-6 py-12 text-center transition hover:border-amber-300">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300 transition group-hover:scale-105"><Cuboid className="h-7 w-7" /></span>
        <span className="text-lg font-serif font-bold text-white">{isAr ? 'شاهد التصور ثلاثي الأبعاد' : 'View the 3D preview'}</span>
        <span className="text-xs text-slate-400">{isAr ? 'اضغط لفتح نموذج 3D لتوزيع القاعة' : 'Click to open a 3D model of the hall layout'}</span>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-950 text-start">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-3">
        <div className="flex flex-wrap gap-2">
          {halls.map(h => (
            <button key={h.id} type="button" onClick={() => setHallId(h.id)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${h.id === hall?.id ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-amber-400'}`}>
              {isAr ? h.name : (h.nameEn || h.name)}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label={isAr ? 'إغلاق' : 'Close'} className="rounded-full border border-slate-700 p-2 text-slate-300 hover:border-amber-400 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="h-[420px] sm:h-[520px]">
        <EventLayout3D key={hall?.id} items={design.items} width={hallDimensions(hall).widthM} depth={hallDimensions(hall).depthM} hall={hallDimensions(hall)} decor={design.decor} language={language} mode="overview" readOnly />
      </div>
      <p className="p-3 text-[11px] leading-5 text-slate-500">{isAr ? 'نموذج توضيحي؛ يتم إعداد التصميم النهائي مع فريق السرايا خلال الاستشارة.' : 'Illustration at the venue’s real size; the final design is prepared with the ELSARAYA team during your consultation.'}</p>
    </div>
  );
}
