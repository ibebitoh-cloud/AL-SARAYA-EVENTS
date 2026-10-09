export type EventType = 'wedding' | 'engagement' | 'birthday' | 'conference' | 'party';

export type BookingStatus = 'confirmed' | 'tentative' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export type Language = 'ar' | 'en';

export type VenueTab =
  | 'home'
  | 'public_events'
  | 'public_venues'
  | 'public_services'
  | 'public_planner'
  | 'public_gallery'
  | 'public_3d_tour'
  | 'company'
  | 'dashboard'
  | 'bookings'
  | 'agenda'
  | 'floorplan'
  | 'event_designer'
  | 'live_stage'
  | 'catering'
  | 'contracts'
  | 'clients'
  | 'services'
  | 'finance'
  | 'payments'
  | 'expenses'
  | 'inventory'
  | 'staff'
  | 'reports'
  | 'photo_library';

export interface CateringItem {
  id: string;
  name: string;
  nameEn: string;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage' | 'live_station';
  description: string;
  descriptionEn: string;
  costPerPlate: number;
  dietaryTags: ('halal' | 'vegetarian' | 'gluten_free' | 'dairy_free')[];
  popular: boolean;
}

export interface CateringPackage {
  id: string;
  name: string;
  nameEn: string;
  pricePerPerson: number;
  minGuests: number;
  includesLiveStations: number;
  coursesCount: number;
  description: string;
  descriptionEn: string;
  items: string[];
}

export interface ContractAgreement {
  id: string;
  contractNumber: string;
  bookingCode: string;
  clientName: string;
  clientPhone: string;
  clientNationalId: string;
  hallName: string;
  date: string;
  timeSlot: string;
  totalAmount: number;
  depositAmount: number;
  securityDeposit: number;
  status: 'draft' | 'signed' | 'completed' | 'terminated';
  signedDate?: string;
  termsApproved: boolean;
}

export interface HallLayoutItem {
  id: string;
  type: string;
  labelEn: string;
  labelAr: string;
  x: number;
  y: number;
  rotation: number;
  quantity?: number;
  seats?: number;
}

export interface Hall3DProfile {
  width: number;
  depth: number;
  items: HallLayoutItem[];
}

export interface Hall {
  id: string;
  name: string;
  nameEn?: string;
  capacity: number;
  basePrice: number;
  color: string;
  areaSqMeters?: number;
  description?: string;
  descriptionEn?: string;
  photo?: string;
  photoUrl?: string;
  default3D?: Hall3DProfile;
}

export interface BookingServiceItem {
  id: string;
  serviceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  totalCost: number;
}

export interface AssignedStaff {
  staffId: string;
  name: string;
  role: string;
  wage: number; // تكلفة العامل في هذه المناسبة
}

export interface Booking {
  id: string;
  code: string; // كود الحجز مثل BK-2026-101
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  clientNotes?: string;
  eventType: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  hallId: string;
  hallName: string;
  guestCount: number;
  basePrice: number; // سعر القاعة الأساسي
  services: BookingServiceItem[]; // الخدمات الإضافية
  totalPrice: number; // إجمالي قيمة الحجز + الخدمات
  deposit: number; // العربون
  paidAmount: number; // إجمالي المدفوع حتى الآن
  remainingAmount: number; // المبلغ المتبقي
  securityDeposit: number; // مبلغ التأمين
  securityDepositStatus: 'held' | 'refunded' | 'deducted'; // حالة التأمين (محتجز / تم الرد / مخصوم)
  status: BookingStatus;
  notes?: string;
  assignedStaff: AssignedStaff[]; // العمال المعينون للمناسبة
  suppliesCost: number; // تكلفة المستلزمات والمستهلكات
  directExpenses: number; // مصروفات مباشرة إضافية للمناسبة
}

export interface PaymentReceipt {
  id: string;
  receiptNo: string;
  bookingId: string;
  bookingCode: string;
  clientName: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  type: 'deposit' | 'installment' | 'security_deposit' | 'security_refund';
  notes?: string;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  category: 'buffet' | 'kosha' | 'decor' | 'lighting' | 'sound_dj' | 'photography' | 'screen' | 'hospitality' | 'tables_chairs' | 'other';
  defaultPrice: number;
  defaultCost: number;
  unit: string;
  description?: string;
}

export interface Expense {
  id: string;
  title: string;
  category:
    | 'electricity'
    | 'water'
    | 'labor'
    | 'cleaning'
    | 'maintenance'
    | 'decor'
    | 'security'
    | 'sound_lighting'
    | 'event_supplies'
    | 'marketing'
    | 'rent'
    | 'operational';
  amount: number;
  date: string;
  bookingId?: string; // إذا كان مرتبطاً بمناسبة محددة
  bookingCode?: string;
  paidTo: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'buffet' | 'serving' | 'cleaning' | 'decor' | 'operations';
  quantity: number;
  unit: string; // قطعة / كرتونة / لتر / طقم
  minThreshold: number; // الحد الأدنى للتنبيه
  costPerUnit: number; // تكلفة شراء الوحدة
  salePrice?: number; // سعر بيع/احتساب الوحدة
  damagedQuantity: number; // التالف
  lastRestockedDate: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string; // مشرف قاعة / دي جي / فني إضاءة / كابتن بوفيه / عامل نظافة / أمن
  baseSalary: number; // الراتب أو أجر المناسبة
  wagesType: 'monthly' | 'per_event';
  loans: number; // السلف
  bonuses: number; // الحوافز
  eventsCount: number;
  attendanceStatus: 'present' | 'absent' | 'leave';
}

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalBookingsCount: number;
  totalSpent: number;
  currentBalanceDue: number; // المتبقي عليه
  heldSecurityDeposit: number; // التأمينات المحتجزة
  notes?: string;
}
