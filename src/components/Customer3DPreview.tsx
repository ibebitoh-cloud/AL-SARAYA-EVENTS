import { useState } from 'react';
import { Cuboid, X } from 'lucide-react';
import { Hall, Hall3DProfile, Language } from '../types/venueSystem';
import { EventLayout3D } from './EventLayout3D';

interface Props {
  halls: Hall[];
  language: Language;
}

// Same starter layout the Company Profile uses when a hall has no saved 3D design.
const starterDesign = (hall?: Hall): Hall3DProfile => {
  const area = hall?.areaSqMeters ?? 0;
  const width = area > 0 ? Math.max(10, Math.round(Math.sqrt(area * 0.66))) : 20;
  const depth = area > 0 ? Math.max(10, Math.round(area / width)) : 30;
  const tables = Math.max(4, Math.ceil((hall?.capacity || 120) / 10));
  return {
    width,
    depth,
    items: [
      { id: 'stage-1', type: 'stage', labelEn: 'Stage', labelAr: 'منصة', x: 50, y: 12, rotation: 0 },
      { id: 'screen-1', type: 'screen', labelEn: 'LED Screen', labelAr: 'شاشة LED', x: 50, y: 6, rotation: 0 },
      { id: 'dance-1', type: 'dance', labelEn: 'Dance Floor', labelAr: 'منصة رقص', x: 50, y: 58, rotation: 0 },
      ...Array.from({ length: Math.min(tables, 12) }, (_, i) => ({ id: `table-${i + 1}`, type: 'table', labelEn: 'Round Table', labelAr: 'طاولة دائرية', x: 20 + (i % 4) * 20, y: 30 + Math.floor(i / 4) * 22, rotation: 0, seats: 10 })),
    ],
  };
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
        <EventLayout3D key={hall?.id} items={design.items} width={design.width} depth={design.depth} language={language} mode="overview" onSelect={() => {}} onMove={() => {}} />
      </div>
      <p className="p-3 text-[11px] leading-5 text-slate-500">{isAr ? 'نموذج توضيحي؛ يتم إعداد التصميم النهائي مع فريق السرايا خلال الاستشارة.' : 'Illustrative model; the final design is prepared with the Saraya team during your consultation.'}</p>
    </div>
  );
}
