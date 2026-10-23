import type { EventType } from '../types/venueSystem';

export interface EventField {
  key: string;
  labelAr: string;
  labelEn: string;
  placeholderAr?: string;
  type?: 'text' | 'number';
  required?: boolean;
}

export interface EventTypeConfig {
  id: EventType;
  ar: string;
  en: string;
  emoji: string;
  descAr: string;
  descEn: string;
  defaultGuests: number;
  defaultStart: string;
  defaultEnd: string;
  fields: EventField[];
}

/** Each operation type asks for its own details. Weddings and engagements ask for the bride and groom. */
export const EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'wedding', ar: 'حفل زفاف', en: 'Wedding', emoji: '💍', descAr: 'فرح كامل بالزفة والكوشة', descEn: 'Full wedding with zaffa & kosha',
    defaultGuests: 350, defaultStart: '19:30', defaultEnd: '23:30',
    fields: [
      { key: 'brideName', labelAr: 'اسم العروسة', labelEn: 'Bride name', placeholderAr: 'اسم العروسة بالكامل', required: true },
      { key: 'groomName', labelAr: 'اسم العريس', labelEn: 'Groom name', placeholderAr: 'اسم العريس بالكامل', required: true },
      { key: 'zaffa', labelAr: 'نوع الزفة', labelEn: 'Zaffa style', placeholderAr: 'زفة صعيدي / شامي / دي جي...' },
    ],
  },
  {
    id: 'engagement', ar: 'خطوبة / كتب كتاب', en: 'Engagement', emoji: '💐', descAr: 'خطوبة أو عقد قران', descEn: 'Engagement or katb el-ketab',
    defaultGuests: 200, defaultStart: '19:00', defaultEnd: '23:00',
    fields: [
      { key: 'brideName', labelAr: 'اسم العروسة', labelEn: 'Bride name', placeholderAr: 'اسم العروسة بالكامل', required: true },
      { key: 'groomName', labelAr: 'اسم العريس', labelEn: 'Groom name', placeholderAr: 'اسم العريس بالكامل', required: true },
      { key: 'katbKetab', labelAr: 'يوجد كتب كتاب؟', labelEn: 'Katb el-ketab?', placeholderAr: 'نعم / لا — اسم المأذون' },
    ],
  },
  {
    id: 'birthday', ar: 'عيد ميلاد', en: 'Birthday', emoji: '🎂', descAr: 'حفلة عيد ميلاد', descEn: 'Birthday party',
    defaultGuests: 80, defaultStart: '18:00', defaultEnd: '22:00',
    fields: [
      { key: 'celebrantName', labelAr: 'اسم صاحب/ة عيد الميلاد', labelEn: 'Birthday person', required: true },
      { key: 'age', labelAr: 'العمر', labelEn: 'Age', type: 'number' },
      { key: 'theme', labelAr: 'الثيم / الألوان', labelEn: 'Theme / colours', placeholderAr: 'مثال: أسود وذهبي' },
    ],
  },
  {
    id: 'conference', ar: 'مؤتمر / قمة', en: 'Conference / Summit', emoji: '🎤', descAr: 'مؤتمرات وقمم وندوات', descEn: 'Conferences, summits & seminars',
    defaultGuests: 150, defaultStart: '09:00', defaultEnd: '16:00',
    fields: [
      { key: 'companyName', labelAr: 'اسم الشركة / الجهة', labelEn: 'Company / organisation', required: true },
      { key: 'eventTitle', labelAr: 'عنوان المؤتمر', labelEn: 'Event title', required: true },
      { key: 'contactPerson', labelAr: 'المسؤول عن التنسيق', labelEn: 'Coordinator' },
    ],
  },
  {
    id: 'corporate', ar: 'فعالية شركات', en: 'Corporate event', emoji: '🏢', descAr: 'حفلات وإطلاق منتجات واجتماعات شركات', descEn: 'Company parties, launches & meetings',
    defaultGuests: 120, defaultStart: '18:00', defaultEnd: '22:00',
    fields: [
      { key: 'companyName', labelAr: 'اسم الشركة', labelEn: 'Company', required: true },
      { key: 'eventTitle', labelAr: 'اسم الفعالية', labelEn: 'Event name' },
      { key: 'contactPerson', labelAr: 'المسؤول عن التنسيق', labelEn: 'Coordinator' },
    ],
  },
  {
    id: 'party', ar: 'مناسبة أخرى', en: 'Other event', emoji: '🎉', descAr: 'حفلة خاصة أو تخرج أو أي مناسبة أخرى', descEn: 'Private party, graduation or anything else',
    defaultGuests: 120, defaultStart: '19:00', defaultEnd: '23:00',
    fields: [
      { key: 'occasion', labelAr: 'المناسبة', labelEn: 'Occasion', placeholderAr: 'تخرج / ذكرى سنوية...', required: true },
    ],
  },
];

export const eventTypeConfig = (id: EventType) => EVENT_TYPES.find((t) => t.id === id) || EVENT_TYPES[0];

/** One-line summary of the type-specific details, e.g. "العروسة: منى · العريس: أحمد". */
export const eventDetailsSummary = (eventType: EventType, details: Record<string, string> | undefined, isAr = true) => {
  if (!details) return '';
  return eventTypeConfig(eventType).fields
    .filter((f) => details[f.key]?.trim())
    .map((f) => `${isAr ? f.labelAr : f.labelEn}: ${details[f.key].trim()}`)
    .join(' · ');
};
