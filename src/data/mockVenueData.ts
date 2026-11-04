import {
  Hall,
  ServiceDefinition,
  Booking,
  PaymentReceipt,
  Expense,
  InventoryItem,
  Employee,
  ClientProfile,
} from '../types/venueSystem';

// Al-Saraya's 6 venues across two locations: Arcane Hotel and Porto Said.
// Capacity and base price are placeholders — update them from the portal (Company Profile) or here.
const ARCANE = { city: 'Arcane Hotel', cityAr: 'فندق اركان', locationId: 'arcane' as const };
const PORTO = { city: 'Porto Said', cityAr: 'بورتو سعيد', locationId: 'porto' as const };

export const INITIAL_HALLS: Hall[] = [
  { id: 'arcane-pool', name: 'حمام السباحة', nameEn: 'Pool', ...ARCANE, capacity: 300, basePrice: 30000, color: '#0ea5e9' },
  { id: 'arcane-hall', name: 'قاعة اركان', nameEn: 'Arcane Hall', ...ARCANE, capacity: 400, basePrice: 40000, color: '#6366f1' },
  { id: 'porto-veina', name: 'قاعة فيينا', nameEn: 'Veina Hall', ...PORTO, capacity: 400, basePrice: 40000, color: '#ec4899' },
  { id: 'porto-roof', name: 'الروف', nameEn: 'Roof', ...PORTO, capacity: 250, basePrice: 30000, color: '#eab308' },
  { id: 'porto-garden', name: 'الحديقة المفتوحة (أوبن إير)', nameEn: 'Open Air Garden', ...PORTO, capacity: 500, basePrice: 35000, color: '#10b981' },
  { id: 'porto-seila', name: 'قاعة سيلا', nameEn: 'Seila Hall', ...PORTO, capacity: 300, basePrice: 30000, color: '#f97316' },
];

export const INITIAL_SERVICES: ServiceDefinition[] = [
  {
    id: 'srv-1',
    name: 'بوفيه مفتوح فاخر (شامل المشاوي والحلويات)',
    category: 'buffet',
    defaultPrice: 150, // سعر الفرد
    defaultCost: 95, // تكلفة الفرد
    unit: 'فرد',
    description: 'تشكيلة لحوم ومقبلات شرقية وغربية وعصائر طبيعية وبوفيه حلويات',
  },
  {
    id: 'srv-2',
    name: 'كوشة عروس ملكية ديزاين حديث بالورد',
    category: 'kosha',
    defaultPrice: 9000,
    defaultCost: 4500,
    unit: 'مناسبة',
    description: 'كوشة بارتفاع 4 أمتار مع إضاءة خافتة وأريكة مريحة وسجاد ملكي',
  },
  {
    id: 'srv-3',
    name: 'ديكور سنتربيس وطاولات ورد طبيعي',
    category: 'decor',
    defaultPrice: 350,
    defaultCost: 180,
    unit: 'طاولة',
    description: 'فازات كريستال مع زهور طبيعية منسقة بعناية وشمعدانات ذهبية',
  },
  {
    id: 'srv-4',
    name: 'شبكة إضاءة متطورة وموفينج هيد وبيمات',
    category: 'lighting',
    defaultPrice: 5500,
    defaultCost: 2000,
    unit: 'مناسبة',
    description: '16 رأس متحرك + مصفوفة ليزر + جهاز دخان احترافي هازر',
  },
  {
    id: 'srv-5',
    name: 'صوتيات متكاملة ودي جي احترافي لاين أري',
    category: 'sound_dj',
    defaultPrice: 6000,
    defaultCost: 2200,
    unit: 'مناسبة',
    description: 'أجهزة ميكسر ديجيتال، سماعات JBL Line Array وميكروفونات لاسلكية',
  },
  {
    id: 'srv-6',
    name: 'تصوير فيديو 4K وكرين وفوتوغرافي ألبوم جلد',
    category: 'photography',
    defaultPrice: 8500,
    defaultCost: 3800,
    unit: 'مناسبة',
    description: '3 كاميرات سينمائية + كاميرا كرين رافعة + ألبوم حراري مقاس 30*60',
  },
  {
    id: 'srv-7',
    name: 'شاشات عرض عملاقة 4K LED جدارية',
    category: 'screen',
    defaultPrice: 7000,
    defaultCost: 2800,
    unit: 'مناسبة',
    description: 'شاشة مقاس 6x3 متر بدقة بكسل P2.6 مع مخرج فيديو حي وسويتش احترافي',
  },
  {
    id: 'srv-8',
    name: 'فريق تنظيم وإشراف وضيافة فندقية (10 أفراد)',
    category: 'hospitality',
    defaultPrice: 4000,
    defaultCost: 2000,
    unit: 'مناسبة',
    description: 'مضيفات استقبال، كباتن بوفيه، ومشرف أمن وقاعة ذوو خبرة',
  },
  {
    id: 'srv-9',
    name: 'طاولات دائرية فاخرة وكراسي شيفاري ذهبية',
    category: 'tables_chairs',
    defaultPrice: 120,
    defaultCost: 50,
    unit: 'طقم طاولة بـ 8 كراسي',
    description: 'مفارش ساتان مطرزة وأدوات مائدة استيل مذهب',
  },
];

// No bookings, receipts or contracts ship with the app: the client starts with a clean slate (user request, 2026-11-04).
export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_PAYMENTS: PaymentReceipt[] = [];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'فاتورة كهرباء القاعات لشهر سبتمبر',
    category: 'electricity',
    amount: 14200,
    date: '2026-10-01',
    paidTo: 'شركة جنوب القاهرة للكهرباء',
    notes: 'استهلاك التكييفات والإضاءة للقاعات الكبرى',
  },
  {
    id: 'exp-2',
    title: 'صيانة دورية لتكييفات قاعة اركان',
    category: 'maintenance',
    amount: 4500,
    date: '2026-10-03',
    paidTo: 'شركة كاريير إيجيبت',
    notes: 'شحن فريون وفلاتر هواء استعداداً للموسم',
  },
  {
    id: 'exp-4',
    title: 'شراء ورد طبيعي هولندي وفازات ديكور',
    category: 'decor',
    amount: 3200,
    date: '2026-10-06',
    paidTo: 'مشتل فلورنتينا الدولي',
    notes: 'سنتربيس طاولات الخطوبة',
  },
  {
    id: 'exp-5',
    title: 'أجور عمال نظافة إضافيين وخدمات أمن',
    category: 'cleaning',
    amount: 2800,
    date: '2026-10-04',
    paidTo: 'شركة إيليت للنظافة والأمن',
  },
  {
    id: 'exp-6',
    title: 'حملة إعلانات ممولة فيسبوك وإنستغرام لموسم الخريف',
    category: 'marketing',
    amount: 5000,
    date: '2026-10-02',
    paidTo: 'ميتا للأعمال',
    notes: 'استهداف المقبلين على الزواج في القاهرة والجيزة',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'أطباق صيني فندقية مذهبة مقاس 28 سم',
    category: 'serving',
    quantity: 850,
    unit: 'طبق',
    minThreshold: 400,
    costPerUnit: 45,
    damagedQuantity: 18,
    lastRestockedDate: '2026-09-20',
  },
  {
    id: 'inv-2',
    name: 'أطقم شوك وسكاكين وملاعق استانلس 18/10',
    category: 'serving',
    quantity: 920,
    unit: 'طقم',
    minThreshold: 500,
    costPerUnit: 35,
    damagedQuantity: 8,
    lastRestockedDate: '2026-09-20',
  },
  {
    id: 'inv-3',
    name: 'كؤوس كريستال للعصائر والمشروبات',
    category: 'serving',
    quantity: 750,
    unit: 'كأس',
    minThreshold: 350,
    costPerUnit: 25,
    damagedQuantity: 32,
    lastRestockedDate: '2026-09-25',
  },
  {
    id: 'inv-4',
    name: 'سخانات بوفيه رول توب استانلس ستيل كهرباء وشمع',
    category: 'buffet',
    quantity: 36,
    unit: 'سخان',
    minThreshold: 20,
    costPerUnit: 1400,
    damagedQuantity: 2,
    lastRestockedDate: '2026-08-10',
  },
  {
    id: 'inv-5',
    name: 'سائل جهاز دخان هازر ثقيل احترافي',
    category: 'operations',
    quantity: 8, // كمية منخفضة!
    unit: 'جركن 5 لتر',
    minThreshold: 12, // تنبيه نقص
    costPerUnit: 450,
    damagedQuantity: 0,
    lastRestockedDate: '2026-09-01',
  },
  {
    id: 'inv-6',
    name: 'مفارش طاولات ساتان أوف وايت مطرزة',
    category: 'decor',
    quantity: 110,
    unit: 'مفرش',
    minThreshold: 50,
    costPerUnit: 220,
    damagedQuantity: 5,
    lastRestockedDate: '2026-09-12',
  },
  {
    id: 'inv-7',
    name: 'شمع بوفيه مستورد للاشتعال المستمر 6 ساعات',
    category: 'buffet',
    quantity: 65, // تنبيه نقص!
    unit: 'علبة شمع',
    minThreshold: 100,
    costPerUnit: 18,
    damagedQuantity: 0,
    lastRestockedDate: '2026-09-18',
  },
];

export const INITIAL_STAFF: Employee[] = [
  {
    id: 'emp-sara-ibrahim',
    name: 'سارة إبراهيم',
    phone: '',
    role: 'الأوبريشن',
    baseSalary: 0,
    wagesType: 'monthly',
    loans: 0,
    bonuses: 0,
    eventsCount: 0,
    attendanceStatus: 'present',
  },
  {
    id: 'emp-mostafa',
    name: 'مصطفى',
    phone: '',
    role: 'الأوبريشن',
    baseSalary: 0,
    wagesType: 'monthly',
    loans: 0,
    bonuses: 0,
    eventsCount: 0,
    attendanceStatus: 'present',
  },
  {
    id: 'emp-amira-makawy',
    name: 'أميرة مكاوي',
    phone: '',
    role: 'الأوبريشن',
    baseSalary: 0,
    wagesType: 'monthly',
    loans: 0,
    bonuses: 0,
    eventsCount: 0,
    attendanceStatus: 'present',
  },
];

// Sample clients came with the sample bookings, so they are gone too.
export const INITIAL_CLIENTS: ClientProfile[] = [];
