import type { FieldDef } from '../components/RecordEditor';
import type { Booking, Hall } from '../types/venueSystem';

/** Form definitions for the generic record editor, one per record type in the management portal. */

const opt = (value: string, ar: string, en: string) => ({ value, ar, en });

export const EVENT_TYPE_OPTIONS = [
  opt('wedding', 'حفل زفاف', 'Wedding'),
  opt('engagement', 'خطوبة / كتب كتاب', 'Engagement'),
  opt('birthday', 'عيد ميلاد', 'Birthday'),
  opt('conference', 'مؤتمر / ندوة', 'Conference'),
  opt('party', 'حفلة خاصة / تخرج', 'Private party'),
];

export const bookingFields = (halls: Hall[]): FieldDef[] => [
  { key: 'clientName', ar: 'اسم العميل', en: 'Client name', required: true },
  { key: 'clientPhone', ar: 'هاتف العميل', en: 'Client phone', type: 'tel', required: true },
  { key: 'clientAddress', ar: 'العنوان', en: 'Address', full: true },
  { key: 'eventType', ar: 'نوع المناسبة', en: 'Event type', type: 'select', options: EVENT_TYPE_OPTIONS },
  { key: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: [opt('confirmed', 'مؤكد', 'Confirmed'), opt('tentative', 'مبدئي', 'Tentative'), opt('completed', 'مكتمل', 'Completed'), opt('cancelled', 'ملغي', 'Cancelled')] },
  { key: 'hallId', ar: 'القاعة', en: 'Venue', type: 'select', options: halls.map((h) => opt(h.id, h.name, h.nameEn || h.name)) },
  { key: 'guestCount', ar: 'عدد الضيوف', en: 'Guests', type: 'number', min: 0 },
  { key: 'date', ar: 'التاريخ', en: 'Date', type: 'date', required: true },
  { key: 'startTime', ar: 'من', en: 'Start time', type: 'time' },
  { key: 'endTime', ar: 'إلى', en: 'End time', type: 'time' },
  { key: 'totalPrice', ar: 'إجمالي الحجز (ج.م)', en: 'Total price (EGP)', type: 'number', min: 0 },
  { key: 'deposit', ar: 'العربون (ج.م)', en: 'Deposit (EGP)', type: 'number', min: 0 },
  { key: 'paidAmount', ar: 'إجمالي المدفوع (ج.م)', en: 'Paid so far (EGP)', type: 'number', min: 0 },
  { key: 'securityDeposit', ar: 'التأمين (ج.م)', en: 'Security deposit (EGP)', type: 'number', min: 0 },
  { key: 'securityDepositStatus', ar: 'حالة التأمين', en: 'Security status', type: 'select', options: [opt('held', 'محتجز', 'Held'), opt('refunded', 'تم الرد', 'Refunded'), opt('deducted', 'مخصوم', 'Deducted')] },
  { key: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea' },
];

/** Keeps derived booking fields (venue name, remaining balance) in step with what was edited. */
export const normalizeBooking = (b: Booking, halls: Hall[]): Booking => {
  const hall = halls.find((h) => h.id === b.hallId);
  const totalPrice = Number(b.totalPrice) || 0;
  const paidAmount = Number(b.paidAmount) || 0;
  return { ...b, hallName: hall?.name ?? b.hallName, locationId: hall?.locationId ?? b.locationId, totalPrice, paidAmount, remainingAmount: Math.max(0, totalPrice - paidAmount) };
};

export const hallFields: FieldDef[] = [
  { key: 'name', ar: 'اسم القاعة (عربي)', en: 'Venue name (Arabic)', required: true },
  { key: 'nameEn', ar: 'اسم القاعة (إنجليزي)', en: 'Venue name (English)' },
  { key: 'capacity', ar: 'السعة', en: 'Capacity', type: 'number', min: 1 },
  { key: 'areaSqMeters', ar: 'المساحة م²', en: 'Area m²', type: 'number', min: 0 },
  { key: 'basePrice', ar: 'السعر الأساسي (ج.م)', en: 'Base price (EGP)', type: 'number', min: 0 },
  { key: 'locationId', ar: 'الموقع', en: 'Location', type: 'select', options: [opt('arcane', 'فندق آركين', 'Arcane Hotel'), opt('porto', 'بورتو سعيد', 'Porto Said')] },
  { key: 'cityAr', ar: 'المدينة (عربي)', en: 'City (Arabic)' },
  { key: 'city', ar: 'المدينة (إنجليزي)', en: 'City (English)' },
  { key: 'description', ar: 'الوصف (عربي)', en: 'Description (Arabic)', type: 'textarea' },
  { key: 'descriptionEn', ar: 'الوصف (إنجليزي)', en: 'Description (English)', type: 'textarea' },
  { key: 'photoUrl', ar: 'صورة القاعة', en: 'Venue photo', type: 'image' },
];

export const clientFields: FieldDef[] = [
  { key: 'name', ar: 'اسم العميل', en: 'Name', required: true },
  { key: 'phone', ar: 'الهاتف', en: 'Phone', type: 'tel', required: true },
  { key: 'address', ar: 'العنوان', en: 'Address', full: true },
  { key: 'totalBookingsCount', ar: 'عدد الحجوزات', en: 'Bookings count', type: 'number', min: 0 },
  { key: 'totalSpent', ar: 'إجمالي التعاملات (ج.م)', en: 'Total business (EGP)', type: 'number', min: 0 },
  { key: 'currentBalanceDue', ar: 'المتبقي عليه (ج.م)', en: 'Balance due (EGP)', type: 'number', min: 0 },
  { key: 'heldSecurityDeposit', ar: 'التأمين المحتجز (ج.م)', en: 'Security held (EGP)', type: 'number', min: 0 },
  { key: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea' },
];

export const staffFields: FieldDef[] = [
  { key: 'name', ar: 'الاسم', en: 'Name', required: true },
  { key: 'phone', ar: 'الهاتف', en: 'Phone', type: 'tel' },
  { key: 'role', ar: 'الوظيفة', en: 'Role', full: true },
  { key: 'baseSalary', ar: 'الراتب / الأجر (ج.م)', en: 'Salary / wage (EGP)', type: 'number', min: 0 },
  { key: 'wagesType', ar: 'نوع الأجر', en: 'Pay type', type: 'select', options: [opt('monthly', 'شهري', 'Monthly'), opt('per_event', 'بالمناسبة', 'Per event')] },
  { key: 'loans', ar: 'السلف (ج.م)', en: 'Loans (EGP)', type: 'number', min: 0 },
  { key: 'bonuses', ar: 'الحوافز (ج.م)', en: 'Bonuses (EGP)', type: 'number', min: 0 },
  { key: 'eventsCount', ar: 'عدد المناسبات', en: 'Events worked', type: 'number', min: 0 },
  { key: 'attendanceStatus', ar: 'الحضور', en: 'Attendance', type: 'select', options: [opt('present', 'حاضر', 'Present'), opt('absent', 'غائب', 'Absent'), opt('leave', 'إجازة', 'On leave')] },
];

export const paymentFields = (bookings: Booking[]): FieldDef[] => [
  { key: 'receiptNo', ar: 'رقم الإيصال', en: 'Receipt no.', required: true },
  { key: 'bookingId', ar: 'الحجز', en: 'Booking', type: 'select', options: bookings.map((b) => opt(b.id, `${b.code} · ${b.clientName}`, `${b.code} · ${b.clientName}`)) },
  { key: 'amount', ar: 'المبلغ (ج.م)', en: 'Amount (EGP)', type: 'number', min: 0, required: true },
  { key: 'date', ar: 'التاريخ', en: 'Date', type: 'date' },
  { key: 'method', ar: 'طريقة الدفع', en: 'Method', type: 'select', options: [opt('cash', 'نقدي', 'Cash'), opt('card', 'بطاقة', 'Card'), opt('transfer', 'تحويل', 'Transfer')] },
  { key: 'type', ar: 'نوع الإيصال', en: 'Receipt type', type: 'select', options: [opt('deposit', 'عربون', 'Deposit'), opt('installment', 'دفعة', 'Instalment'), opt('security_deposit', 'مبلغ تأمين', 'Security deposit'), opt('security_refund', 'رد تأمين', 'Security refund')] },
  { key: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea' },
];

export const expenseFields = (bookings: Booking[]): FieldDef[] => [
  { key: 'title', ar: 'البند', en: 'Title', required: true, full: true },
  { key: 'category', ar: 'الفئة', en: 'Category', type: 'select', options: [
    opt('electricity', 'كهرباء', 'Electricity'), opt('water', 'مياه', 'Water'), opt('labor', 'عمالة', 'Labour'), opt('cleaning', 'نظافة', 'Cleaning'),
    opt('maintenance', 'صيانة', 'Maintenance'), opt('decor', 'ديكور وزهور', 'Decor & flowers'), opt('security', 'أمن وحراسة', 'Security'), opt('sound_lighting', 'صوتيات وإضاءة', 'Sound & lighting'),
    opt('event_supplies', 'مشتريات المناسبات', 'Event supplies'), opt('marketing', 'تسويق وإعلانات', 'Marketing'), opt('rent', 'إيجار', 'Rent'), opt('operational', 'تشغيلية وإدارية', 'Operations & admin'),
  ] },
  { key: 'amount', ar: 'المبلغ (ج.م)', en: 'Amount (EGP)', type: 'number', min: 0, required: true },
  { key: 'date', ar: 'التاريخ', en: 'Date', type: 'date' },
  { key: 'paidTo', ar: 'مدفوع إلى', en: 'Paid to' },
  { key: 'bookingId', ar: 'مرتبط بحجز', en: 'Linked booking', type: 'select', options: [opt('', 'بدون', 'None'), ...bookings.map((b) => opt(b.id, `${b.code} · ${b.clientName}`, `${b.code} · ${b.clientName}`))] },
  { key: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea' },
];
