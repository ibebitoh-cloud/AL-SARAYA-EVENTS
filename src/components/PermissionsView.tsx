import { ShieldCheck, RotateCcw } from 'lucide-react';
import type { Language } from '../types/venueSystem';
import { SYSTEM_USERS } from '../data/systemProfiles';
import { DEFAULT_EDIT_PERMISSIONS, EDIT_AREAS, MANAGED_ROLES, type EditArea, type EditPermissions } from '../data/editPermissions';

interface Props {
  language: Language;
  permissions: EditPermissions;
  onChange: (permissions: EditPermissions) => void;
}

/** CEO-only screen: tick which team may edit which part of the system. */
export function PermissionsView({ language, permissions, onChange }: Props) {
  const ar = language === 'ar';
  const roles = MANAGED_ROLES.map((role) => ({ role, user: SYSTEM_USERS.find((u) => u.role === role) }));
  const toggle = (role: (typeof MANAGED_ROLES)[number], area: EditArea) => {
    const current = permissions[role] ?? [];
    onChange({ ...permissions, [role]: current.includes(area) ? current.filter((a) => a !== area) : [...current, area] });
  };
  const setAll = (role: (typeof MANAGED_ROLES)[number], on: boolean) => onChange({ ...permissions, [role]: on ? EDIT_AREAS.map((a) => a.id) : [] });

  return (
    <div className="w-full space-y-5 pb-20 text-start">
      <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400"><ShieldCheck className="h-4 w-4" />{ar ? 'للرئيس التنفيذي فقط' : 'CEO only'}</div>
            <h1 className="mt-2 text-2xl font-black text-white">{ar ? 'صلاحيات التعديل' : 'Edit permissions'}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">{ar ? 'اختر من يستطيع تعديل كل جزء من النظام. الرئيس التنفيذي يعدّل كل شيء دائماً. من لا يملك صلاحية التعديل يرى الشاشة للعرض فقط.' : 'Choose who can edit each part of the system. The CEO can always edit everything. Anyone without edit rights sees the screen as view only.'}</p>
          </div>
          <button type="button" onClick={() => onChange(DEFAULT_EDIT_PERMISSIONS)} className="flex items-center gap-2 self-start rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:border-amber-400"><RotateCcw className="h-3.5 w-3.5" />{ar ? 'استعادة الافتراضي' : 'Reset to defaults'}</button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/70" data-no-screen-swipe>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-400">
              <th className="p-4 text-start font-semibold">{ar ? 'الجزء' : 'Area'}</th>
              <th className="p-4 text-center font-semibold text-amber-300">{ar ? 'الرئيس التنفيذي' : 'CEO'}</th>
              {roles.map(({ role, user }) => (
                <th key={role} className="p-4 text-center font-semibold">
                  <div className="text-white">{ar ? user?.nameAr : user?.name}</div>
                  <div className="mt-2 flex justify-center gap-2 text-[10px] font-normal">
                    <button type="button" onClick={() => setAll(role, true)} className="text-emerald-300 hover:underline">{ar ? 'الكل' : 'All'}</button>
                    <button type="button" onClick={() => setAll(role, false)} className="text-rose-300 hover:underline">{ar ? 'لا شيء' : 'None'}</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EDIT_AREAS.map((area) => (
              <tr key={area.id} className="border-b border-slate-800/60 last:border-0">
                <td className="p-4"><div className="font-bold text-white">{ar ? area.ar : area.en}</div><div className="text-[11px] text-slate-500">{ar ? area.hintAr : area.hintEn}</div></td>
                <td className="p-4 text-center"><input type="checkbox" checked disabled aria-label={`${ar ? area.ar : area.en}: CEO`} className="h-4 w-4 accent-amber-400" /></td>
                {roles.map(({ role, user }) => (
                  <td key={role} className="p-4 text-center">
                    <input type="checkbox" checked={Boolean(permissions[role]?.includes(area.id))} onChange={() => toggle(role, area.id)} aria-label={`${ar ? area.ar : area.en}: ${ar ? user?.nameAr : user?.name}`} className="h-4 w-4 cursor-pointer accent-amber-400" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">{ar ? 'تُحفظ التغييرات فوراً. الشاشات التي يفتحها كل مستخدم ما زالت تحددها صلاحيات حسابه.' : 'Changes save immediately. Which screens each user can open is still set by their account.'}</p>
    </div>
  );
}
