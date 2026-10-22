import { useState, type ReactNode } from 'react';
import { Pencil, Save, Trash2, Upload, X } from 'lucide-react';
import type { Language } from '../types/venueSystem';

/** One editable field in a record form. Labels are kept in both languages. */
export interface FieldDef {
  key: string;
  ar: string;
  en: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'image';
  options?: { value: string; ar: string; en: string }[];
  required?: boolean;
  /** Span both columns of the form. */
  full?: boolean;
  min?: number;
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none';

/**
 * Reads an image file as a data URL so uploaded photos survive in local storage.
 * Phone photos are scaled down to at most 1200px so many of them fit in the browser's storage.
 */
export const readImageFile = (file: File, onDone: (dataUrl: string) => void) => {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const original = String(reader.result);
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') { onDone(original); return; }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
      if (scale === 1 && file.size < 400_000) { onDone(original); return; }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { onDone(original); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onDone(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => onDone(original);
    img.src = original;
  };
  reader.readAsDataURL(file);
};

export function ImageField({ value, onChange, language, label }: { value: string; onChange: (src: string) => void; language: Language; label?: string }) {
  const ar = language === 'ar';
  return (
    <div className="space-y-2">
      {label && <div className="text-xs text-slate-400">{label}</div>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 sm:w-36">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[11px] text-slate-600">{ar ? 'لا توجد صورة' : 'No photo'}</div>}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <input value={value.startsWith('data:') ? '' : value} placeholder={value.startsWith('data:') ? (ar ? 'صورة مرفوعة من الجهاز' : 'Uploaded from device') : 'https://...'} onChange={(e) => onChange(e.target.value)} className={inputClass} dir="ltr" />
          <div className="flex gap-2">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-amber-400">
              <Upload className="h-3.5 w-3.5" />{ar ? 'رفع صورة' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageFile(f, onChange); e.target.value = ''; }} />
            </label>
            {value && <button type="button" onClick={() => onChange('')} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-rose-300">{ar ? 'إزالة' : 'Remove'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecordEditorModalProps<T> {
  title: string;
  fields: FieldDef[];
  value: T;
  language: Language;
  onSave: (value: T) => void;
  onClose: () => void;
  onDelete?: () => void;
  /** Extra form content below the fields (e.g. a booking's services), editing the same draft. */
  extra?: (draft: T, set: (key: string, value: unknown) => void) => ReactNode;
  /** Extra check before saving; return a message to stop the save. */
  validate?: (draft: T) => string | undefined;
}

/** Generic add/edit form used by every management list, so each record type gets the same editing experience. */
export function RecordEditorModal<T extends object>({ title, fields, value, language, onSave, onClose, onDelete, extra, validate }: RecordEditorModalProps<T>) {
  const ar = language === 'ar';
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...(value as Record<string, unknown>) });
  const [error, setError] = useState('');
  const set = (key: string, v: unknown) => setDraft((prev) => ({ ...prev, [key]: v }));
  const save = () => {
    const missing = fields.find((f) => f.required && (draft[f.key] === undefined || String(draft[f.key]).trim() === ''));
    if (missing) { setError(ar ? `الحقل "${missing.ar}" مطلوب` : `"${missing.en}" is required`); return; }
    const problem = validate?.(draft as T);
    if (problem) { setError(problem); return; }
    onSave(draft as T);
  };
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} dir={ar ? 'rtl' : 'ltr'} className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 text-start" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button type="button" aria-label={ar ? 'إغلاق' : 'Close'} onClick={onClose} className="rounded-lg bg-slate-800 p-2 text-slate-300"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map((f) => {
            const label = ar ? f.ar : f.en;
            const v = draft[f.key];
            if (f.type === 'image') return <div key={f.key} className="sm:col-span-2"><ImageField label={label} value={String(v ?? '')} onChange={(src) => set(f.key, src)} language={language} /></div>;
            if (f.type === 'checkbox') return <label key={f.key} className={`flex items-center gap-3 text-xs text-slate-300 ${f.full ? 'sm:col-span-2' : ''}`}><input type="checkbox" checked={Boolean(v)} onChange={(e) => set(f.key, e.target.checked)} />{label}</label>;
            return (
              <label key={f.key} className={`text-xs text-slate-400 ${f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                {label}{f.required && <span className="text-rose-400"> *</span>}
                {f.type === 'textarea' ? <textarea value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} className={`${inputClass} min-h-20`} />
                  : f.type === 'select' ? <select value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} className={inputClass}>{f.options?.map((o) => <option key={o.value} value={o.value}>{ar ? o.ar : o.en}</option>)}</select>
                  : <input type={f.type === 'number' ? 'number' : f.type || 'text'} min={f.min} value={v === undefined || v === null ? '' : String(v)} dir={['tel', 'url', 'number', 'date', 'time'].includes(f.type || '') ? 'ltr' : undefined} onChange={(e) => set(f.key, f.type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value)} className={inputClass} />}
              </label>
            );
          })}
        </div>
        {extra?.(draft as T, set)}
        {error && <p className="mt-3 text-xs font-semibold text-rose-400">{error}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {onDelete ? <button type="button" onClick={() => { if (window.confirm(ar ? 'هل تريد حذف هذا السجل نهائياً؟' : 'Delete this record permanently?')) onDelete(); }} className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300"><Trash2 className="h-3.5 w-3.5" />{ar ? 'حذف' : 'Delete'}</button> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="button" onClick={save} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950"><Save className="h-3.5 w-3.5" />{ar ? 'حفظ' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small edit/delete buttons shown on each record card. */
export function RowActions({ onEdit, onDelete, language }: { onEdit?: () => void; onDelete?: () => void; language: Language }) {
  const ar = language === 'ar';
  if (!onEdit && !onDelete) return null;
  return (
    <div className="flex items-center gap-1.5" data-no-screen-swipe>
      {onEdit && <button type="button" onClick={onEdit} aria-label={ar ? 'تعديل' : 'Edit'} title={ar ? 'تعديل' : 'Edit'} className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 transition hover:border-amber-400 hover:text-amber-300"><Pencil className="h-3.5 w-3.5" /></button>}
      {onDelete && <button type="button" onClick={() => { if (window.confirm(ar ? 'هل تريد حذف هذا السجل نهائياً؟' : 'Delete this record permanently?')) onDelete(); }} aria-label={ar ? 'حذف' : 'Delete'} title={ar ? 'حذف' : 'Delete'} className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-400 transition hover:border-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}
    </div>
  );
}
