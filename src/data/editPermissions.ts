import type { SystemRole, SystemUser } from './systemProfiles';

/** Parts of the system that can be edited. The CEO always edits everything and decides who else may edit each part. */
export type EditArea =
  | 'bookings' | 'clients' | 'staff' | 'services' | 'inventory' | 'payments' | 'expenses'
  | 'contracts' | 'catering' | 'price_lists' | 'photo_library' | 'company' | 'site_content';

export const EDIT_AREAS: { id: EditArea; ar: string; en: string; hintAr: string; hintEn: string }[] = [
  { id: 'bookings', ar: 'الحجوزات', en: 'Bookings', hintAr: 'إضافة وتعديل وحذف الحجوزات وتغيير حالتها', hintEn: 'Add, edit, delete bookings and change their status' },
  { id: 'clients', ar: 'العملاء', en: 'Clients', hintAr: 'بيانات العملاء وأرصدتهم', hintEn: 'Client details and balances' },
  { id: 'staff', ar: 'الموظفون', en: 'Staff', hintAr: 'الموظفون والأجور والحضور', hintEn: 'Staff, wages and attendance' },
  { id: 'services', ar: 'الخدمات', en: 'Services', hintAr: 'كتالوج الخدمات وأسعارها', hintEn: 'Service catalogue and prices' },
  { id: 'inventory', ar: 'المخزون', en: 'Inventory', hintAr: 'الأصناف والكميات والتالف', hintEn: 'Items, quantities and damage' },
  { id: 'payments', ar: 'المدفوعات', en: 'Payments', hintAr: 'سندات القبض ورد التأمين', hintEn: 'Receipts and security refunds' },
  { id: 'expenses', ar: 'المصروفات', en: 'Expenses', hintAr: 'تسجيل وتعديل المصروفات', hintEn: 'Record and edit expenses' },
  { id: 'contracts', ar: 'العقود', en: 'Contracts', hintAr: 'إصدار وتعديل وتوقيع العقود', hintEn: 'Issue, edit and sign contracts' },
  { id: 'catering', ar: 'الضيافة', en: 'Catering', hintAr: 'باقات البوفيه والأصناف', hintEn: 'Buffet packages and dishes' },
  { id: 'price_lists', ar: 'قوائم الأسعار', en: 'Price lists', hintAr: 'أسعار وتكاليف كل موقع', hintEn: 'Prices and costs per location' },
  { id: 'photo_library', ar: 'مكتبة الصور', en: 'Photo library', hintAr: 'رفع الصور واعتمادها وحذفها', hintEn: 'Upload, approve and delete photos' },
  { id: 'company', ar: 'ملف الشركة والقاعات', en: 'Company profile & venues', hintAr: 'بيانات الشركة والتواصل والقاعات', hintEn: 'Company details, contacts and venues' },
  { id: 'site_content', ar: 'محتوى الموقع', en: 'Website content', hintAr: 'نصوص وصور الصفحة الرئيسية', hintEn: 'Home page texts and photos' },
];

export type EditPermissions = Partial<Record<SystemRole, EditArea[]>>;

/** Starting point that matches what each team already did before permissions existed; the CEO can change it. */
export const DEFAULT_EDIT_PERMISSIONS: EditPermissions = {
  finance: ['bookings', 'clients', 'payments', 'expenses'],
  operation: ['bookings', 'services', 'inventory', 'staff', 'catering'],
  operation_agent: ['bookings', 'inventory'],
};

/** Roles whose edit rights the CEO manages (the CEO and website customers are not listed). */
export const MANAGED_ROLES: SystemRole[] = ['finance', 'operation', 'operation_agent'];

export const canEdit = (user: SystemUser | null | undefined, area: EditArea, permissions: EditPermissions) =>
  !!user && (user.role === 'ceo' || Boolean(permissions[user.role]?.includes(area)));
