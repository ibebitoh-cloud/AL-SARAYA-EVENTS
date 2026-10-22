import { useState } from 'react';
import { Globe2, RotateCcw, Save, Check } from 'lucide-react';
import type { Language } from '../types/venueSystem';
import { DEFAULT_SITE_CONTENT, SITE_SECTIONS, type SiteContent } from '../data/siteContent';
import { ImageField } from './RecordEditor';

interface Props {
  language: Language;
  content: SiteContent;
  onSave: (content: SiteContent) => void;
  onOpenTab?: (tab: 'company' | 'photo_library') => void;
  onPreview?: () => void;
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none';

/** Edits every text and photo on the public home page in Arabic and English. */
export function SiteContentView({ language, content, onSave, onOpenTab, onPreview }: Props) {
  const ar = language === 'ar';
  const [draft, setDraft] = useState<SiteContent>(() => ({ texts: { ...DEFAULT_SITE_CONTENT.texts, ...content.texts }, images: { ...content.images } }));
  const [sectionId, setSectionId] = useState(SITE_SECTIONS[0].id);
  const [saved, setSaved] = useState(false);
  const section = SITE_SECTIONS.find((s) => s.id === sectionId) ?? SITE_SECTIONS[0];
  const dirty = JSON.stringify(draft) !== JSON.stringify({ texts: { ...DEFAULT_SITE_CONTENT.texts, ...content.texts }, images: { ...content.images } });

  const setText = (key: string, lang: 'ar' | 'en', value: string) => { setSaved(false); setDraft((d) => ({ ...d, texts: { ...d.texts, [key]: { ...d.texts[key], [lang]: value } } })); };
  const setImage = (key: string, value: string) => { setSaved(false); setDraft((d) => ({ ...d, images: { ...d.images, [key]: value } })); };
  const resetSection = () => {
    setSaved(false);
    setDraft((d) => ({
      texts: { ...d.texts, ...Object.fromEntries(section.texts.map((t) => [t.key, { ar: t.ar, en: t.en }])) },
      images: Object.fromEntries(Object.entries(d.images).filter(([k]) => !section.images?.some((i) => i.key === k))),
    }));
  };
  const save = () => { onSave(draft); setSaved(true); };

  return (
    <div className="w-full space-y-5 pb-20 text-start">
      <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400"><Globe2 className="h-4 w-4" />{ar ? 'الموقع العام' : 'Public website'}</div>
            <h1 className="mt-2 text-2xl font-black text-white">{ar ? 'محتوى الموقع' : 'Website content'}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">{ar ? 'عدّل نصوص وصور الصفحة الرئيسية بالعربي والإنجليزي. اترك أي حقل فارغاً لاستخدام النص الأصلي.' : 'Edit the home page texts and photos in Arabic and English. Leave a field empty to use the original text.'}</p>
            <p className="mt-2 text-xs text-slate-500">
              {ar ? 'اسم الشركة والهاتف وواتساب والروابط من ' : 'Company name, phone, WhatsApp and social links live in '}
              <button type="button" onClick={() => onOpenTab?.('company')} className="font-bold text-amber-300 hover:underline">{ar ? 'ملف الشركة' : 'Company profile'}</button>
              {ar ? '، وصور المعرض من ' : '; gallery photos live in the '}
              <button type="button" onClick={() => onOpenTab?.('photo_library')} className="font-bold text-amber-300 hover:underline">{ar ? 'مكتبة الصور' : 'Photo library'}</button>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onPreview && <button type="button" onClick={onPreview} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:border-amber-400">{ar ? 'عرض الموقع' : 'View website'}</button>}
            <button type="button" onClick={save} disabled={!dirty && saved} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60">{saved && !dirty ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{saved && !dirty ? (ar ? 'تم الحفظ' : 'Saved') : (ar ? 'حفظ التغييرات' : 'Save changes')}</button>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1" data-no-screen-swipe>
        {SITE_SECTIONS.map((s) => (
          <button key={s.id} type="button" onClick={() => setSectionId(s.id)} className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold transition ${s.id === section.id ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-500/40'}`}>{ar ? s.titleAr : s.titleEn}</button>
        ))}
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-white">{ar ? section.titleAr : section.titleEn}</h2>
          <button type="button" onClick={resetSection} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300"><RotateCcw className="h-3.5 w-3.5" />{ar ? 'استعادة النص الأصلي لهذا القسم' : 'Restore this section'}</button>
        </div>
        {section.images?.map((img) => (
          <div key={img.key} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <ImageField label={ar ? img.labelAr : img.labelEn} value={draft.images[img.key] || ''} onChange={(src) => setImage(img.key, src)} language={language} />
            {!draft.images[img.key] && <p className="mt-2 text-[11px] text-slate-500">{ar ? 'بدون صورة مخصصة، تُختار صورة تلقائياً من مكتبة الصور.' : 'With no custom photo, one is picked automatically from the photo library.'}</p>}
          </div>
        ))}
        {section.texts.map((field) => (
          <div key={field.key} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="text-xs font-bold text-slate-300">{ar ? field.labelAr : field.labelEn}</div>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {(['ar', 'en'] as const).map((lang) => (
                <label key={lang} className="text-[11px] text-slate-500">
                  {lang === 'ar' ? 'العربية' : 'English'}
                  {field.multiline
                    ? <textarea dir={lang === 'ar' ? 'rtl' : 'ltr'} value={draft.texts[field.key]?.[lang] ?? ''} placeholder={lang === 'ar' ? field.ar : field.en} onChange={(e) => setText(field.key, lang, e.target.value)} className={`${inputClass} min-h-24`} />
                    : <input dir={lang === 'ar' ? 'rtl' : 'ltr'} value={draft.texts[field.key]?.[lang] ?? ''} placeholder={lang === 'ar' ? field.ar : field.en} onChange={(e) => setText(field.key, lang, e.target.value)} className={inputClass} />}
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
