import type { Language } from '../types/venueSystem';

/** Small helpers for screens that keep their Arabic and English copy side by side. */
export const makeTr = (language: Language) => {
  const isAr = language === 'ar';
  const tr = (ar: string, en: string) => (isAr ? ar : en);
  const egp = (amount: number) => `${(Number(amount) || 0).toLocaleString()} ${tr('ج.م', 'EGP')}`;
  return { isAr, tr, egp };
};

const EVENT_TYPE_LABELS: Record<string, [string, string]> = {
  wedding: ['حفل زفاف', 'Wedding'],
  engagement: ['خطوبة / كتب كتاب', 'Engagement'],
  birthday: ['عيد ميلاد', 'Birthday'],
  conference: ['مؤتمر / قمة', 'Conference / Summit'],
  corporate: ['فعالية شركات', 'Corporate event'],
  party: ['مناسبة أخرى', 'Other event'],
};
export const eventTypeLabel = (type: string, isAr: boolean) => EVENT_TYPE_LABELS[type]?.[isAr ? 0 : 1] ?? type;

const STATUS_LABELS: Record<string, [string, string]> = {
  confirmed: ['مؤكد', 'Confirmed'],
  tentative: ['مبدئي', 'Tentative'],
  completed: ['مكتمل', 'Completed'],
  cancelled: ['ملغي', 'Cancelled'],
};
export const bookingStatusLabel = (status: string, isAr: boolean) => STATUS_LABELS[status]?.[isAr ? 0 : 1] ?? status;
