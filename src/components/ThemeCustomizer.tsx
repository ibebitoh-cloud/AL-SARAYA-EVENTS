import { useEffect, useState } from 'react';
import { Palette, X } from 'lucide-react';
import { Language } from '../types/venueSystem';

type ThemeId = 'dark' | 'light' | 'ocean' | 'forest' | 'plum' | 'custom';
type PaletteColors = { page: string; surface: string; surface2: string; surface3: string; border: string; text: string; muted: string; input: string; hover: string; accent: string; banner: string; header: string; cell: string; cellText: string };
const presets: Record<Exclude<ThemeId, 'custom'>, PaletteColors> = {
  dark: { page: '#020617', surface: '#0f172a', surface2: '#111827', surface3: '#1e293b', border: '#334155', text: '#f8fafc', muted: '#94a3b8', input: '#0f172a', hover: '#1e293b', accent: '#fbbf24', banner: '#172554', header: '#0f172a', cell: '#0f172a', cellText: '#f8fafc' },
  light: { page: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9', surface3: '#e2e8f0', border: '#cbd5e1', text: '#0f172a', muted: '#64748b', input: '#ffffff', hover: '#f1f5f9', accent: '#d97706', banner: '#eff6ff', header: '#ffffff', cell: '#ffffff', cellText: '#0f172a' },
  ocean: { page: '#071923', surface: '#0d2734', surface2: '#103343', surface3: '#174456', border: '#286174', text: '#e6f7fb', muted: '#91b9c5', input: '#0d2734', hover: '#174456', accent: '#22d3ee', banner: '#123746', header: '#0d2734', cell: '#0d2734', cellText: '#e6f7fb' },
  forest: { page: '#101b16', surface: '#192920', surface2: '#20362a', surface3: '#2c4735', border: '#496450', text: '#edf7ef', muted: '#a3b8a7', input: '#192920', hover: '#2c4735', accent: '#86efac', banner: '#1e3928', header: '#192920', cell: '#192920', cellText: '#edf7ef' },
  plum: { page: '#1b1320', surface: '#2a1d31', surface2: '#35243d', surface3: '#493151', border: '#65486e', text: '#faf1ff', muted: '#c4a9cd', input: '#2a1d31', hover: '#493151', accent: '#e9a8ff', banner: '#382242', header: '#2a1d31', cell: '#2a1d31', cellText: '#faf1ff' },
};
const keys: (keyof PaletteColors)[] = ['page', 'surface', 'surface2', 'surface3', 'border', 'text', 'muted', 'input', 'hover', 'accent', 'banner', 'header', 'cell', 'cellText'];
const labels: Record<keyof PaletteColors, [string, string]> = { page: ['خلفية النظام', 'Page'], surface: ['البطاقات', 'Cards'], surface2: ['اللوحات', 'Panels'], surface3: ['العناصر المحددة', 'Raised areas'], border: ['الحدود', 'Borders'], text: ['النص الأساسي', 'Main text'], muted: ['النص الثانوي', 'Muted text'], input: ['حقول الإدخال', 'Inputs'], hover: ['التحويم', 'Hover'], accent: ['اللون المميز', 'Accent'], banner: ['اللافتات', 'Banners'], header: ['رأس الصفحة', 'Header'], cell: ['خلفية الخلايا', 'Cell background'], cellText: ['نص الخلايا', 'Cell text'] };
const defaultCustom = presets.dark;

export function ThemeCustomizer({ language, theme, onThemeChange }: { language: Language; theme: string; onThemeChange: (theme: string) => void }) {
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<PaletteColors>(() => {
    try { return { ...defaultCustom, ...JSON.parse(localStorage.getItem('saraya-theme-colors') || '{}') }; } catch { return defaultCustom; }
  });
  useEffect(() => {
    const active = theme === 'custom' ? colors : (presets[theme as keyof typeof presets] || presets.dark);
    const root = document.documentElement;
    const cssVars: Record<string, string> = { page: '--saraya-page', surface: '--saraya-surface', surface2: '--saraya-surface-2', surface3: '--saraya-surface-3', border: '--saraya-border', text: '--saraya-text', muted: '--saraya-muted', input: '--saraya-input', hover: '--saraya-hover', accent: '--saraya-accent', banner: '--saraya-banner', header: '--saraya-header', cell: '--saraya-cell', cellText: '--saraya-cell-text' };
    Object.entries(cssVars).forEach(([key, variable]) => root.style.setProperty(variable, active[key as keyof PaletteColors]));
    root.dataset.theme = theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'custom';
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    localStorage.setItem('saraya-theme', theme);
    localStorage.setItem('saraya-theme-colors', JSON.stringify(colors));
  }, [theme, colors]);
  const names: Record<ThemeId, string> = { dark: isAr ? 'ليلي' : 'Dark', light: isAr ? 'فاتح' : 'Light', ocean: isAr ? 'محيطي' : 'Ocean', forest: isAr ? 'غابة' : 'Forest', plum: isAr ? 'أرجواني' : 'Plum', custom: isAr ? 'مخصص' : 'Custom' };
  return <div className="fixed bottom-4 end-4 z-[70]">
    <button type="button" onClick={() => setOpen((v) => !v)} aria-label={isAr ? 'تخصيص المظهر' : 'Customize theme'} title={isAr ? 'تخصيص المظهر' : 'Customize theme'} className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--saraya-border)] bg-[var(--saraya-surface)] text-[var(--saraya-accent)] shadow-lg"><Palette className="h-5 w-5" /></button>
    {open && <section dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'إعدادات المظهر' : 'Theme settings'} className="absolute bottom-14 end-0 max-h-[78vh] w-[min(92vw,370px)] overflow-auto rounded-2xl border border-[var(--saraya-border)] bg-[var(--saraya-surface)] p-4 text-[var(--saraya-text)] shadow-2xl">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">{isAr ? 'المظهر والألوان' : 'Theme & colors'}</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button></div>
      <div className="grid grid-cols-3 gap-2">{(Object.keys(presets) as Exclude<ThemeId, 'custom'>[]).map((id) => <button key={id} type="button" onClick={() => onThemeChange(id)} className={`rounded-lg border px-2 py-2 text-xs font-bold ${theme === id ? 'border-[var(--saraya-accent)]' : 'border-[var(--saraya-border)]'}`}><span className="mb-1 flex justify-center gap-1">{[presets[id].page, presets[id].accent, presets[id].surface].map((color) => <i key={color} className="h-3 w-3 rounded-full" style={{ background: color }} />)}</span>{names[id]}</button>)}</div>
      <button type="button" onClick={() => onThemeChange('custom')} className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs font-bold ${theme === 'custom' ? 'border-[var(--saraya-accent)]' : 'border-[var(--saraya-border)]'}`}>{names.custom}</button>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">{keys.map((key) => <label key={key} className="flex items-center justify-between gap-2 text-[11px] text-[var(--saraya-muted)]"><span>{labels[key][isAr ? 0 : 1]}</span><input type="color" value={colors[key]} onChange={(e) => { setColors((prev) => ({ ...prev, [key]: e.target.value })); onThemeChange('custom'); }} className="h-7 w-10 cursor-pointer rounded border border-[var(--saraya-border)] bg-transparent p-0.5" /></label>)}</div>
      <button type="button" onClick={() => { setColors(defaultCustom); onThemeChange('dark'); }} className="mt-3 text-[11px] font-bold text-[var(--saraya-accent)]">{isAr ? 'استعادة ألوان الوضع الليلي' : 'Reset to dark colors'}</button>
    </section>}
  </div>;
}
