import { Language, VenueTab, EventType, BookingStatus, PaymentMethod } from '../types/venueSystem';

export interface Translations {
  appName: string;
  appSub: string;
  erpBadge: string;
  langName: string;
  otherLangName: string;

  // Tabs
  tabs: Record<VenueTab, string>;
  tabCategories: {
    overview: string;
    operations: string;
    finance: string;
  };

  // Common
  newBooking: string;
  interactiveTour: string;
  soundOn: string;
  soundOff: string;
  search: string;
  filter: string;
  all: string;
  actions: string;
  status: string;
  date: string;
  time: string;
  hall: string;
  client: string;
  phone: string;
  guests: string;
  totalPrice: string;
  deposit: string;
  paid: string;
  remaining: string;
  insurance: string;
  notes: string;
  save: string;
  cancel: string;
  print: string;
  details: string;
  currency: string;
  persons: string;
  days: string;
  hours: string;

  // Event types
  eventTypes: Record<EventType, string>;

  // Booking statuses
  bookingStatuses: Record<BookingStatus, string>;

  // Payment methods
  paymentMethods: Record<PaymentMethod, string>;

  // Dashboard & Company
  companyHeroTitle: string;
  companyHeroSubtitle: string;
  companyStoryBadge: string;
  companyStoryHeading: string;
  companyStoryDesc: string;
  quickStats: {
    eventsProduced: string;
    hallsAvailable: string;
    capacityMax: string;
    satisfaction: string;
  };
}

export const DICTIONARY: Record<Language, Translations> = {
  ar: {
    appName: 'السرايا للمناسبات | SARAYA EVENT',
    appSub: 'السرايا لتنظيم المناسبات وحفلات الزفاف الفاخرة في مصر',
    erpBadge: 'إصدار السرايا الفندقي',
    langName: 'العربية',
    otherLangName: 'English',

    tabs: {
      home: 'الموقع الرئيسي للسرايا',
      company: 'عن شركة السرايا والقاعات',
      dashboard: 'لوحة التحكم',
      bookings: 'الحجوزات',
      agenda: 'الأجندة والتقويم',
      floorplan: 'مخطط القاعة والطاولات',
      live_stage: 'غرفة التحكم المباشرة',
      catering: 'قائمة البوفيه والضيافة',
      contracts: 'العقود وعروض الأسعار',
      clients: 'العملاء وكشوف الحساب',
      services: 'الخدمات والإضافات',
      payments: 'الخزينة والحسابات',
      expenses: 'المصروفات',
      inventory: 'المخزون والمستلزمات',
      staff: 'العمال والموظفين',
      reports: 'التقارير والأرباح',
    },

    tabCategories: {
      overview: 'قاعات السرايا والاستعراض',
      operations: 'إدارة المناسبات والتشغيل',
      finance: 'الحسابات والمستودع والتقارير',
    },

    newBooking: 'حجز جديد',
    interactiveTour: 'جولة النظام',
    soundOn: 'تفعيل الصوت',
    soundOff: 'كتم الصوت',
    search: 'بحث...',
    filter: 'تصفية',
    all: 'الكل',
    actions: 'إجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    time: 'الوقت',
    hall: 'القاعة',
    client: 'العميل',
    phone: 'رقم الهاتف',
    guests: 'عدد المدعوين',
    totalPrice: 'سعر الحجز',
    deposit: 'العربون',
    paid: 'المدفوع',
    remaining: 'المتبقي',
    insurance: 'التأمين',
    notes: 'ملاحظات',
    save: 'حفظ',
    cancel: 'إلغاء',
    print: 'طباعة إيصال / عقد',
    details: 'عرض التفاصيل',
    currency: 'ج.م',
    persons: 'فرد',
    days: 'أيام',
    hours: 'ساعات',

    eventTypes: {
      wedding: 'فرح وزفاف ملكي',
      engagement: 'حفل خطوبة',
      birthday: 'عيد ميلاد',
      conference: 'مؤتمر ومعرض',
      party: 'حفلة خاصة وسهرة',
    },

    bookingStatuses: {
      confirmed: 'مؤكد',
      tentative: 'مبدئي',
      completed: 'مكتمل',
      cancelled: 'ملغي',
    },

    paymentMethods: {
      cash: 'نقداً كاش',
      card: 'بطاقة مصرفية POS',
      transfer: 'تحويل بنكي',
    },

    companyHeroTitle: 'قصر وقاعات السرايا الملكية للمناسبات والمؤتمرات',
    companyHeroSubtitle: 'الصرح الأكثر فخامة وتجهيزاً في الشرق الأوسط، يجمع بين الفن المعماري الأندلسي وأحدث تقنيات الصوت والإضاءة المسرحية العالمية.',
    companyStoryBadge: 'تاريخ وأصالة السرايا منذ 2012',
    companyStoryHeading: 'أكثر من عقد في صناعة أسعد اللحظات الملكية بقصر السرايا',
    companyStoryDesc: 'تأسست مجموعة قصر وقاعات السرايا لتقديم معيار جديد تماماً للضيافة الفاخرة. نمتلك 4 قاعات متكاملة بمساحات تتجاوز 10,000 متر مربع، مجهزة بأحدث بنية تحتية هندسية، وأنظمة عزل صوتي متطورة، وجسور إضاءة روبوتية، ومطابخ فندقية يديرها كبار الطهاة.',
    quickStats: {
      eventsProduced: 'مناسبة ملكية منفذة بالسرايا',
      hallsAvailable: 'قاعات رئيسية وحديقة',
      capacityMax: 'أقصى سعة استيعابية',
      satisfaction: 'نسبة رضا العملاء',
    },
  },

  en: {
    appName: 'SARAYA EVENT | Luxury Weddings & Venues',
    appSub: 'Egypt’s Premier Luxury Hall Management & Wedding Production',
    erpBadge: 'Saraya Luxury Edition',
    langName: 'English',
    otherLangName: 'العربية',

    tabs: {
      home: 'Saraya Event Website',
      company: 'About AlSaraya & Halls',
      dashboard: 'Dashboard',
      bookings: 'Bookings',
      agenda: 'Calendar Agenda',
      floorplan: 'Floor Plan & 3D Seating',
      live_stage: 'Live Stage Control',
      catering: 'Buffet & Catering Menus',
      contracts: 'Contracts & Quotations',
      clients: 'Clients & CRM',
      services: 'Services & Add-ons',
      payments: 'Treasury & Payments',
      expenses: 'Expenses Ledger',
      inventory: 'Inventory & Supplies',
      staff: 'Staff & Labor',
      reports: 'Reports & Net Profit',
    },

    tabCategories: {
      overview: 'AlSaraya Showcase & Halls',
      operations: 'Event Operations & Staging',
      finance: 'Finance, Stock & Analytics',
    },

    newBooking: 'New Booking',
    interactiveTour: 'Interactive Tour',
    soundOn: 'Enable Sound',
    soundOff: 'Mute Sound',
    search: 'Search...',
    filter: 'Filter',
    all: 'All',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    hall: 'Venue Hall',
    client: 'Client Name',
    phone: 'Phone Number',
    guests: 'Guest Count',
    totalPrice: 'Total Price',
    deposit: 'Deposit',
    paid: 'Paid',
    remaining: 'Remaining Due',
    insurance: 'Security Deposit',
    notes: 'Notes',
    save: 'Save',
    cancel: 'Cancel',
    print: 'Print Receipt / Contract',
    details: 'View Details',
    currency: 'USD',
    persons: 'Guests',
    days: 'Days',
    hours: 'Hours',

    eventTypes: {
      wedding: 'Royal Wedding Gala',
      engagement: 'Engagement Soiree',
      birthday: 'Birthday Celebration',
      conference: 'Corporate Conference',
      party: 'Private Reception',
    },

    bookingStatuses: {
      confirmed: 'Confirmed',
      tentative: 'Tentative',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },

    paymentMethods: {
      cash: 'Cash',
      card: 'Credit Card / POS',
      transfer: 'Bank Wire Transfer',
    },

    companyHeroTitle: 'AlSaraya Royal Palace & Grand Venues',
    companyHeroSubtitle: 'The premier luxury venue in the region, merging timeless architectural grandeur with state-of-the-art concert acoustics, robotic stage lighting, and five-star culinary banquets.',
    companyStoryBadge: 'AlSaraya Heritage & Excellence Since 2012',
    companyStoryHeading: 'Over a Decade of Orchestrating Legendary Moments at AlSaraya',
    companyStoryDesc: 'Founded to redefine luxury hospitality, AlSaraya Royal Palace spans across 10,000+ sqm of landscaped grounds and architectural splendor. Featuring 4 distinct venue halls engineered with German 65dB acoustic isolation, motorized intelligent lighting rigs, and central five-star banquet kitchens directed by international master chefs.',
    quickStats: {
      eventsProduced: 'Royal Events Produced at AlSaraya',
      hallsAvailable: 'Grand Halls & Gardens',
      capacityMax: 'Maximum Combined Capacity',
      satisfaction: 'Client Satisfaction Rate',
    },
  },
};
