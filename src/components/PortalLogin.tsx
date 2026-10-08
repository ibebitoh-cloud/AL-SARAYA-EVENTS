import { motion } from 'motion/react';
import { ShieldCheck, UserRound, ArrowRight } from 'lucide-react';
import { Language } from '../types/venueSystem';
import { SYSTEM_USERS, SystemUser } from '../data/systemProfiles';

interface Props {
  language: Language;
  onLogin: (user: SystemUser) => void;
  onBack: () => void;
}

export function PortalLogin({ language, onLogin, onBack }: Props) {
  const ar = language === 'ar';
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div className="mt-4 text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold">{ar ? 'البوابة الداخلية' : 'INTERNAL PORTAL'}</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">{ar ? 'اختر المستخدم للدخول' : 'Choose your profile'}</h1>
          <p className="mt-2 text-xs text-slate-500">{ar ? 'نسخة تجريبية — بدون كلمة مرور' : 'Trial access — no password required'}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {SYSTEM_USERS.map((user) => (
            <button key={user.id} onClick={() => onLogin(user)} className="group text-left rtl:text-right rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-amber-400/40 hover:bg-slate-900 p-5 transition-all">
              <div className="flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center"><UserRound className="w-5 h-5 text-amber-400" /></div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors rtl:rotate-180" />
              </div>
              <div className="mt-4 text-base font-black text-white">{ar ? user.nameAr : user.name}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{ar ? user.roleAr : user.role}</div>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="block mx-auto mt-6 text-xs text-slate-500 hover:text-amber-400">{ar ? 'العودة للموقع' : 'Back to website'}</button>
      </motion.div>
    </div>
  );
}
