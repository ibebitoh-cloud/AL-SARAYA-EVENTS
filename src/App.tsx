/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  INITIAL_BOOKINGS,
  INITIAL_HALLS,
  INITIAL_SERVICES,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_INVENTORY,
  INITIAL_STAFF,
  INITIAL_CLIENTS,
} from './data/mockVenueData';
import { INITIAL_EVENTS } from './data/mockEvents';
import {
  Booking, BookingStatus, PaymentReceipt, Expense, InventoryItem, Employee,
  ServiceDefinition, VenueTab, Language, Hall, PriceBook,
} from './types/venueSystem';
import { VenueHeaderNav } from './components/VenueHeaderNav';
import { SarayaBrandHeader } from './components/SarayaBrandHeader';
import { SarayaCustomerHomepage } from './components/SarayaCustomerHomepage';
import { ALSARAYA_PHOTOS, VenuePhoto } from './data/venueImages';
import { CustomerSectionView } from './components/CustomerSectionView';
import { CompanyShowcaseView } from './components/CompanyShowcaseView';
import { PortalLogin } from './components/PortalLogin';
import { SystemUser, canAccess, landingTab } from './data/systemProfiles';
import { buildInitialPriceBook } from './data/pricing';
import { NewBookingModal } from './components/NewBookingModal';
import { OnboardingFlow } from './components/OnboardingFlow';
// Management screens load on demand so public visitors only download the website.
const CompanyProfileView = lazy(() => import('./components/CompanyProfileView').then((m) => ({ default: m.CompanyProfileView })));
const PackageBuilderView = lazy(() => import('./components/PackageBuilderView').then((m) => ({ default: m.PackageBuilderView })));
const PriceListsView = lazy(() => import('./components/PriceListsView').then((m) => ({ default: m.PriceListsView })));
const DashboardView = lazy(() => import('./components/DashboardView').then((m) => ({ default: m.DashboardView })));
const BookingsView = lazy(() => import('./components/BookingsView').then((m) => ({ default: m.BookingsView })));
const CalendarAgendaView = lazy(() => import('./components/CalendarAgendaView').then((m) => ({ default: m.CalendarAgendaView })));
const EventLayoutDesigner = lazy(() => import('./components/EventLayoutDesigner').then((m) => ({ default: m.EventLayoutDesigner })));
const CateringMenuView = lazy(() => import('./components/CateringMenuView').then((m) => ({ default: m.CateringMenuView })));
const ContractsView = lazy(() => import('./components/ContractsView').then((m) => ({ default: m.ContractsView })));
const ClientsView = lazy(() => import('./components/ClientsView').then((m) => ({ default: m.ClientsView })));
const ServicesView = lazy(() => import('./components/ServicesView').then((m) => ({ default: m.ServicesView })));
const PaymentsLedgerView = lazy(() => import('./components/PaymentsLedgerView').then((m) => ({ default: m.PaymentsLedgerView })));
const ExpensesView = lazy(() => import('./components/ExpensesView').then((m) => ({ default: m.ExpensesView })));
const FinanceView = lazy(() => import('./components/FinanceView').then((m) => ({ default: m.FinanceView })));
const InventoryView = lazy(() => import('./components/InventoryView').then((m) => ({ default: m.InventoryView })));
const StaffView = lazy(() => import('./components/StaffView').then((m) => ({ default: m.StaffView })));
const ReportsView = lazy(() => import('./components/ReportsView').then((m) => ({ default: m.ReportsView })));
const PhotoLibraryPage = lazy(() => import('./components/PhotoLibraryPage').then((m) => ({ default: m.PhotoLibraryPage })));
const EventProfitCalculatorModal = lazy(() => import('./components/EventProfitCalculatorModal').then((m) => ({ default: m.EventProfitCalculatorModal })));
const InvoicePrintModal = lazy(() => import('./components/InvoicePrintModal').then((m) => ({ default: m.InvoicePrintModal })));
import { DICTIONARY } from './utils/i18n';
import { sound } from './utils/soundEffects';
import { uniqueBookingCode } from './utils/bookingRules';


const uniqueEventPhotos = (items: VenuePhoto[]) => {
  const seen = new Set<string>();
  return items.filter((photo) => {
    if (!photo.src?.trim()) return false;
    const source = photo.src.trim().replace(/[?#].*$/, '').toLowerCase();
    if (seen.has(source)) return false;
    seen.add(source);
    return true;
  });
};

// De-duplicate at the application boundary so every screen receives the same clean booking list.
const dedupeBookings = (items: Booking[]) => {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  return items.filter((booking) => {
    const id = String(booking.id || '').trim().toLowerCase();
    const code = String(booking.code || '').trim().toLowerCase();
    if ((id && seenIds.has(id)) || (code && seenCodes.has(code))) return false;
    if (id) seenIds.add(id);
    if (code) seenCodes.add(code);
    return true;
  });
};

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (window.localStorage.getItem('saraya-theme') as 'dark' | 'light') || 'dark';
  });
  const [currentTab, setCurrentTab] = useState<VenueTab>(() => {
    if (typeof window === 'undefined') return 'home';
    const id = window.localStorage.getItem('saraya-portal-user-id') || 'guest';
    return (window.localStorage.getItem(`saraya-last-tab-${id}`) as VenueTab | null) || 'home';
  });
  const [portalUser, setPortalUser] = useState<SystemUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(window.localStorage.getItem('saraya-portal-user') || 'null') as SystemUser | null; } catch { return null; }
  });
  const [portalLoginOpen, setPortalLoginOpen] = useState(false);
  const [portalWelcome, setPortalWelcome] = useState<SystemUser | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [footerCreditVisible, setFooterCreditVisible] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer || typeof IntersectionObserver === 'undefined') {
      setFooterCreditVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setFooterCreditVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.18 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; window.localStorage.setItem('saraya-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = language; }, [language]);
  const toggleLanguage = () => setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  useEffect(() => {
    if (!portalUser) return;
    const savedTab = window.localStorage.getItem(`saraya-last-tab-${portalUser.id}`) as VenueTab | null;
    if (savedTab && canAccess(portalUser, savedTab) && currentTab === 'home') setCurrentTab(savedTab);
  }, [portalUser]);
  useEffect(() => {
    if (!portalUser || !canAccess(portalUser, currentTab)) return;
    window.localStorage.setItem('saraya-portal-user-id', portalUser.id);
    window.localStorage.setItem('saraya-portal-user', JSON.stringify(portalUser));
    window.localStorage.setItem(`saraya-last-tab-${portalUser.id}`, currentTab);
  }, [portalUser, currentTab]);
  const [bookings, setBookings] = useState<Booking[]>(() => {
    if (typeof window === 'undefined') return dedupeBookings(INITIAL_BOOKINGS);
    try {
      const saved = JSON.parse(window.localStorage.getItem('saraya-bookings-v2') || 'null');
      return dedupeBookings(Array.isArray(saved) ? saved : INITIAL_BOOKINGS);
    } catch {
      return dedupeBookings(INITIAL_BOOKINGS);
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('saraya-bookings-v2', JSON.stringify(dedupeBookings(bookings)));
    } catch (error) {
      console.warn('Bookings could not be saved locally:', error);
    }
  }, [bookings]);
  // v2 key: the venue list was replaced with the 6 Arcane Hotel / Porto Said venues, so older saved halls are ignored.
  const [halls, setHalls] = useState<Hall[]>(() => {
    if (typeof window === 'undefined') return INITIAL_HALLS;
    try {
      const saved = JSON.parse(window.localStorage.getItem('saraya-halls-v2') || 'null');
      // Rename the old "البول" pool label in halls saved before the fix.
      return Array.isArray(saved) && saved.length ? saved.map((h: Hall) => h.name === 'البول (حمام السباحة)' ? { ...h, name: 'حمام السباحة' } : h) : INITIAL_HALLS;
    } catch { return INITIAL_HALLS; }
  });
  useEffect(() => { window.localStorage.setItem('saraya-halls-v2', JSON.stringify(halls)); }, [halls]);
  const [photos, setPhotos] = useState<VenuePhoto[]>(() => {
    if (typeof window === 'undefined') return uniqueEventPhotos(ALSARAYA_PHOTOS);
    try {
      const saved = JSON.parse(window.localStorage.getItem('alsaraya_custom_photos_v2') || 'null');
      // Built-in photos always come from code (so corrected names/places reach returning visitors); uploads are kept.
      const builtIn = new Map(ALSARAYA_PHOTOS.map((p) => [p.id, p]));
      const list = Array.isArray(saved) && saved.length
        ? [...saved.map((p: VenuePhoto) => builtIn.get(p.id) ?? p), ...ALSARAYA_PHOTOS.filter((p) => !saved.some((s: VenuePhoto) => s.id === p.id))]
        : ALSARAYA_PHOTOS;
      return uniqueEventPhotos(list);
    } catch {
      return uniqueEventPhotos(ALSARAYA_PHOTOS);
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem('alsaraya_custom_photos_v2', JSON.stringify(uniqueEventPhotos(photos))); } catch (error) {
      console.warn('Photo library could not be saved locally:', error);
    }
  }, [photos]);
  const handleSavePhotos = (updatedPhotos: VenuePhoto[]) => setPhotos(uniqueEventPhotos(updatedPhotos));
  const handleUpdateHall = (updated: Hall) => setHalls((prev) => prev.map((h) => h.id === updated.id ? updated : h));
  const [servicesCatalogue, setServicesCatalogue] = useState<ServiceDefinition[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SERVICES;
    try { return JSON.parse(window.localStorage.getItem('saraya-services') || '') || INITIAL_SERVICES; } catch { return INITIAL_SERVICES; }
  });
  const [payments, setPayments] = useState<PaymentReceipt[]>(() => {
    if (typeof window === 'undefined') return INITIAL_PAYMENTS;
    try { return JSON.parse(window.localStorage.getItem('saraya-payments') || '') || INITIAL_PAYMENTS; } catch { return INITIAL_PAYMENTS; }
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window === 'undefined') return INITIAL_EXPENSES;
    try { return JSON.parse(window.localStorage.getItem('saraya-expenses') || '') || INITIAL_EXPENSES; } catch { return INITIAL_EXPENSES; }
  });
  useEffect(() => { window.localStorage.setItem('saraya-services', JSON.stringify(servicesCatalogue)); }, [servicesCatalogue]);
  // Separate full price list per location (Arcane / Porto), edited by the manager in "قوائم الأسعار".
  const [priceBook, setPriceBook] = useState<PriceBook>(() => {
    if (typeof window === 'undefined') return buildInitialPriceBook(INITIAL_SERVICES);
    try {
      const saved = JSON.parse(window.localStorage.getItem('saraya-price-book-v1') || 'null');
      return saved?.arcane && saved?.porto ? saved : buildInitialPriceBook(INITIAL_SERVICES);
    } catch { return buildInitialPriceBook(INITIAL_SERVICES); }
  });
  useEffect(() => { window.localStorage.setItem('saraya-price-book-v1', JSON.stringify(priceBook)); }, [priceBook]);
  useEffect(() => { window.localStorage.setItem('saraya-payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { window.localStorage.setItem('saraya-expenses', JSON.stringify(expenses)); }, [expenses]);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_INVENTORY;
    try { return JSON.parse(window.localStorage.getItem('saraya-inventory') || '') || INITIAL_INVENTORY; } catch { return INITIAL_INVENTORY; }
  });
  useEffect(() => { window.localStorage.setItem('saraya-inventory', JSON.stringify(inventory)); }, [inventory]);
  const [staff, setStaff] = useState<Employee[]>(INITIAL_STAFF);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [companyProfile, setCompanyProfile] = useState(() => {
    const defaults = { nameEn: 'SARAYA EVENTS', nameAr: 'السرايا للمناسبات', taglineEn: 'Luxury Weddings & Venues', taglineAr: 'السرايا للمناسبات وقاعات الأفراح الملكية في مصر', businessEn: 'Wedding halls, events & event management', businessAr: 'قاعات أفراح ومناسبات وإدارة فعاليات', locationsEn: 'Arcane Hotel · Porto Said', locationsAr: 'فندق آركين · بورتو سعيد', phone: '+20 2 2795 0000', whatsapp: '+20 100 123 4567', instagramUrl: '', tiktokUrl: '', logo: 'black' as 'black' | 'white' };
    if (typeof window === 'undefined') return defaults;
    try { return { ...defaults, ...(JSON.parse(window.localStorage.getItem('saraya-company-profile') || '') || {}) }; } catch { return defaults; }
  });
  useEffect(() => { window.localStorage.setItem('saraya-company-profile', JSON.stringify(companyProfile)); }, [companyProfile]);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedBookingForProfit, setSelectedBookingForProfit] = useState<Booking | null>(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [preselectedHallId, setPreselectedHallId] = useState<string | undefined>(undefined);
  const handleCreateBooking = (newBooking: Booking) => {
    // Ignore a repeat submit for the same booking; the Photo Library creates one album card per booking ID.
    if (bookings.some((booking) => booking.id === newBooking.id)) return;
    // A clashing code would make dedupeBookings drop the new booking, so give it a fresh one.
    if (bookings.some((booking) => booking.code === newBooking.code)) newBooking = { ...newBooking, code: uniqueBookingCode(bookings) };
    setBookings((prev) => dedupeBookings([newBooking, ...prev]));
    if (newBooking.deposit > 0) {
      setPayments((prev) => [{
        id: `rcp-${Date.now()}`,
        receiptNo: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        bookingId: newBooking.id,
        bookingCode: newBooking.code,
        clientName: newBooking.clientName,
        amount: newBooking.deposit,
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
        type: 'deposit',
        notes: `عربون حجز ${newBooking.hallName}`,
      }, ...prev]);
    }
  };
  const handleUpdateBookingStatus = (bookingId: string, status: BookingStatus) => setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  const handleUpdateBookingCosts = (bookingId: string, updates: Partial<Booking>) => setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...updates } : b)));
  const handleAddPayment = (newPayment: PaymentReceipt) => { setPayments((prev) => [newPayment, ...prev]); setBookings((prev) => prev.map((b) => b.id === newPayment.bookingId && newPayment.type !== 'security_refund' ? { ...b, paidAmount: b.paidAmount + newPayment.amount, remainingAmount: Math.max(0, b.totalPrice - (b.paidAmount + newPayment.amount)) } : b)); };
  const handleRefundSecurityDeposit = (bookingId: string) => { const targetBooking = bookings.find((b) => b.id === bookingId); if (!targetBooking || targetBooking.securityDepositStatus !== 'held' || !(targetBooking.securityDeposit > 0)) return; setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, securityDepositStatus: 'refunded' } : b)); setPayments((prev) => [{ id: `rcp-${Date.now()}`, receiptNo: `REF-${Math.floor(1000 + Math.random() * 9000)}`, bookingId: targetBooking.id, bookingCode: targetBooking.code, clientName: targetBooking.clientName, amount: targetBooking.securityDeposit, date: new Date().toISOString().split('T')[0], method: 'cash', type: 'security_refund', notes: 'إيصال رد تأمين القاعة للعميل نقداً بعد سلامة المرافق' }, ...prev]); };
  const handleAddExpense = (newExpense: Expense) => setExpenses((prev) => [newExpense, ...prev]);
  const handleAddService = (newService: ServiceDefinition) => setServicesCatalogue((prev) => [...prev, newService]);
  const handleUpdateService = (updatedService: ServiceDefinition) => setServicesCatalogue((prev) => prev.map((service) => service.id === updatedService.id ? updatedService : service));
  const handleUpdateInventoryQty = (itemId: string, newQty: number, damagedQty?: number) => setInventory((prev) => prev.map((item) => item.id === itemId ? { ...item, quantity: newQty, damagedQuantity: damagedQty !== undefined ? damagedQty : item.damagedQuantity } : item));
  const handleAddInventoryItem = (newItem: InventoryItem) => setInventory((prev) => [...prev, newItem]);
  const handleEditInventoryItem = (updatedItem: InventoryItem) => setInventory((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
  const handleAddStaff = (newStaff: Employee) => setStaff((prev) => [...prev, newStaff]);
  const handleUpdateStaffAttendance = (staffId: string, status: Employee['attendanceStatus']) => setStaff((prev) => prev.map((emp) => emp.id === staffId ? { ...emp, attendanceStatus: status } : emp));
  const swipeStartX = useRef<number | null>(null);
  const swipeableTabs: VenueTab[] = (['package_builder', 'price_lists', 'dashboard', 'bookings', 'agenda', 'company', 'event_designer', 'inventory', 'services', 'finance', 'catering', 'contracts', 'clients', 'payments', 'expenses', 'staff', 'reports', 'photo_library'] as VenueTab[]).filter((tab) => canAccess(portalUser, tab));
  const handleScreenTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, button, a, [role="button"], [data-no-screen-swipe]')) {
      swipeStartX.current = null;
      return;
    }
    swipeStartX.current = event.changedTouches[0]?.clientX ?? null;
  };
  const handleScreenTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = swipeStartX.current;
    swipeStartX.current = null;
    if (startX === null || !portalUser || currentTab === 'home' || portalLoginOpen) return;
    const deltaX = event.changedTouches[0]?.clientX - startX;
    if (!Number.isFinite(deltaX) || Math.abs(deltaX) < 75) return;
    const currentIndex = swipeableTabs.indexOf(currentTab);
    if (currentIndex < 0) return;
    const nextIndex = currentIndex + (deltaX < 0 ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= swipeableTabs.length) return;
    setCurrentTab(swipeableTabs[nextIndex]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const t = DICTIONARY[language];
  const isInternalManagementScreen = Boolean(portalUser && currentTab !== 'home' && !currentTab.startsWith('public_') && !portalLoginOpen);
  return (<div className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col selection:bg-indigo-500 selection:text-white relative box-border font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
    {!isInternalManagementScreen && <SarayaBrandHeader language={language} theme={theme} onToggleTheme={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')} onToggleLanguage={toggleLanguage} instagramUrl={companyProfile.instagramUrl} tiktokUrl={companyProfile.tiktokUrl} onOpenBookingModal={() => { setPreselectedHallId(undefined); setIsNewBookingModalOpen(true); }} onNavigateSection={(sectionId) => { const screenMap: Record<string, VenueTab> = { events: 'public_events', venues: 'public_venues', services: 'public_services', planner: 'public_planner', gallery: 'public_gallery', '3d-tour': 'public_3d_tour' }; const nextTab = screenMap[sectionId]; if (nextTab) { setCurrentTab(nextTab); window.scrollTo({ top: 0, behavior: 'smooth' }); } else if (sectionId === 'hero') { setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } else { setCurrentTab('home'); window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }), 350); } }} onOpenManagementPortal={() => { sound.click(650); if (portalUser && portalUser.role !== 'customer') { setPortalLoginOpen(false); setCurrentTab(landingTab(portalUser)); } else { setPortalLoginOpen(true); setCurrentTab('home'); } window.scrollTo({ top: 0, behavior: 'smooth' }); }} isManagementMode={false} onExitManagementMode={() => { sound.swoosh(); setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
    {!portalLoginOpen && portalUser && currentTab !== 'home' && !currentTab.startsWith('public_') && <VenueHeaderNav currentTab={currentTab} language={language} user={portalUser} theme={theme} onToggleTheme={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')} onVisibilityChange={setSidebarVisible} onTabChange={(tab) => { setCurrentTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onToggleLanguage={toggleLanguage} onOpenTour={() => setIsOnboardingOpen(true)} onGoToWebsite={() => { sound.swoosh(); setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onLogout={() => { sound.swoosh(); setPortalUser(null); window.localStorage.removeItem('saraya-portal-user'); window.localStorage.removeItem('saraya-portal-user-id'); setSidebarVisible(true); setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
    {portalWelcome && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4" onClick={() => setPortalWelcome(null)}><motion.div initial={{opacity:0,scale:.96,y:10}} animate={{opacity:1,scale:1,y:0}} className="w-full max-w-md rounded-3xl border border-amber-400/20 bg-slate-900 p-8 text-center shadow-2xl"><div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">WELCOME</div><h1 className="mt-3 text-3xl font-black text-white">{language === 'ar' ? `أهلاً بك، ${portalWelcome.nameAr}` : `Welcome, ${portalWelcome.name}`}</h1><p className="mt-2 text-xs text-slate-500">{language === 'ar' ? 'تم تسجيل دخولك إلى نظام الإدارة' : 'You are signed in to the management system'}</p><button onClick={() => setPortalWelcome(null)} className="mt-6 px-5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold">{language === 'ar' ? 'دخول النظام' : 'Enter system'}</button></motion.div></div>}
    <main className={`flex-1 w-full px-3 sm:px-6 lg:px-8 pt-6 overflow-x-hidden ${isInternalManagementScreen ? `lg:flex-none mx-0 w-full max-w-none pb-6 sm:px-4 lg:px-8 lg:pb-8 transition-[width,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarVisible ? 'lg:w-[calc(100%-16rem)] lg:ms-64' : 'lg:w-full lg:ms-0'}` : 'max-w-7xl mx-auto'}`}><AnimatePresence mode="wait"><motion.div onTouchStart={handleScreenTouchStart} onTouchEnd={handleScreenTouchEnd} key={`${currentTab}-${language}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}><Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" /><span className="sr-only">{language === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}</span></div>}>
      {portalLoginOpen && <PortalLogin language={language} onLogin={(user) => { setPortalUser(user); setPortalLoginOpen(false); setPortalWelcome(user); setCurrentTab(user.role === 'customer' ? landingTab(user) : canAccess(user, 'dashboard') ? 'dashboard' : landingTab(user)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onBack={() => setPortalLoginOpen(false)} />}
      {!portalLoginOpen && currentTab === 'home' && <SarayaCustomerHomepage halls={halls} photos={photos.filter((photo) => !photo.reviewStatus || photo.reviewStatus === 'approved')} language={language} onSelectHallForBooking={(hallId) => setPreselectedHallId(hallId)} onOpenBookingModal={() => setIsNewBookingModalOpen(true)} onCreateBooking={handleCreateBooking} onOpenEventDesigner={() => setCurrentTab('event_designer')} />}
      {currentTab.startsWith('public_') && <CustomerSectionView screen={({ public_events: 'events', public_venues: 'venues', public_services: 'services', public_planner: 'planner', public_gallery: 'gallery', public_3d_tour: '3d-tour' } as const)[currentTab as 'public_events' | 'public_venues' | 'public_services' | 'public_planner' | 'public_gallery' | 'public_3d_tour']} halls={halls} photos={photos.filter((photo) => !photo.reviewStatus || photo.reviewStatus === 'approved')} language={language} onOpenBooking={(hallId) => { if (hallId) setPreselectedHallId(hallId); setIsNewBookingModalOpen(true); }} onGoHome={() => { setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      {currentTab === 'company' && canAccess(portalUser, 'company') && <CompanyProfileView language={language} halls={halls} bookings={bookings} services={servicesCatalogue} clients={clients} staff={staff} inventory={inventory} payments={payments} expenses={expenses} companyProfile={companyProfile} onUpdateCompanyProfile={setCompanyProfile} onUpdateHall={handleUpdateHall} />}
      {currentTab === 'photo_library' && canAccess(portalUser, 'photo_library') && <PhotoLibraryPage language={language} photos={photos} bookings={bookings} onSavePhotos={handleSavePhotos} />}
      {currentTab === 'package_builder' && canAccess(portalUser, 'package_builder') && <PackageBuilderView halls={halls} services={servicesCatalogue} priceBook={priceBook} existingBookings={bookings} onCreateBooking={handleCreateBooking} />}
      {currentTab === 'price_lists' && canAccess(portalUser, 'price_lists') && <PriceListsView halls={halls} services={servicesCatalogue} priceBook={priceBook} onUpdatePriceBook={setPriceBook} onUpdateHall={handleUpdateHall} />}
      {portalUser && currentTab !== 'home' && !currentTab.startsWith('public_') && !portalLoginOpen && !canAccess(portalUser, currentTab) && <div className="mx-auto max-w-md py-20 text-center text-sm text-slate-400">{language === 'ar' ? 'هذه الشاشة غير متاحة لحسابك.' : 'This screen is not available for your account.'}</div>}
      {currentTab === 'dashboard' && canAccess(portalUser, 'dashboard') && <DashboardView bookings={bookings} halls={halls} language={language} onNavigateTab={(tab) => setCurrentTab(tab)} />}
      {currentTab === 'bookings' && canAccess(portalUser, 'bookings') && <BookingsView bookings={bookings} onOpenNewBooking={() => setIsNewBookingModalOpen(true)} onSelectBookingForProfit={(b) => setSelectedBookingForProfit(b)} onSelectBookingForInvoice={(b) => setSelectedBookingForInvoice(b)} onUpdateBookingStatus={handleUpdateBookingStatus} sellingPricesOnly={Boolean(portalUser?.sellingPricesOnly)} />}
      {currentTab === 'agenda' && canAccess(portalUser, 'agenda') && <CalendarAgendaView bookings={bookings} halls={halls} onSelectBooking={(b) => setSelectedBookingForInvoice(b)} onOpenNewBooking={() => setIsNewBookingModalOpen(true)} />}
      {currentTab === 'event_designer' && canAccess(portalUser, 'event_designer') && <EventLayoutDesigner language={language} halls={halls} onUpdateHall={handleUpdateHall} />}
      {currentTab === 'catering' && canAccess(portalUser, 'catering') && <CateringMenuView language={language} />}
      {currentTab === 'contracts' && canAccess(portalUser, 'contracts') && <ContractsView bookings={bookings} language={language} />}
      {currentTab === 'clients' && canAccess(portalUser, 'clients') && <ClientsView clients={clients} bookings={bookings} onSelectBookingForInvoice={(b) => setSelectedBookingForInvoice(b)} />}
      {currentTab === 'services' && canAccess(portalUser, 'services') && <ServicesView services={servicesCatalogue} onAddService={handleAddService} onUpdateService={handleUpdateService} sellingPricesOnly={Boolean(portalUser?.sellingPricesOnly)} />}
      {currentTab === 'finance' && canAccess(portalUser, 'finance') && <FinanceView payments={payments} expenses={expenses} bookings={bookings} onAddPayment={handleAddPayment} onRefundSecurityDeposit={handleRefundSecurityDeposit} onAddExpense={handleAddExpense} />}
      {currentTab === 'payments' && canAccess(portalUser, 'payments') && <PaymentsLedgerView payments={payments} bookings={bookings} onAddPayment={handleAddPayment} onRefundSecurityDeposit={handleRefundSecurityDeposit} />}
      {currentTab === 'expenses' && canAccess(portalUser, 'expenses') && <ExpensesView expenses={expenses} bookings={bookings} onAddExpense={handleAddExpense} />}
      {currentTab === 'inventory' && canAccess(portalUser, 'inventory') && <InventoryView inventory={inventory} onUpdateItemQuantity={handleUpdateInventoryQty} onAddItem={handleAddInventoryItem} onEditItem={handleEditInventoryItem} sellingPricesOnly={Boolean(portalUser?.sellingPricesOnly)} />}
      {currentTab === 'staff' && canAccess(portalUser, 'staff') && <StaffView staff={staff} bookings={bookings} onAddStaff={handleAddStaff} onUpdateStaffAttendance={handleUpdateStaffAttendance} />}
      {currentTab === 'reports' && canAccess(portalUser, 'reports') && <ReportsView bookings={bookings} expenses={expenses} payments={payments} inventory={inventory} staff={staff} />}
    </Suspense></motion.div></AnimatePresence></main>
    <footer ref={footerRef} className={`mt-12 w-full border-t px-4 py-8 sm:px-6 lg:px-8 transition-[width,margin,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${theme === 'dark' ? 'border-white/10 bg-[#080d17]' : 'border-slate-200 bg-white'} ${isInternalManagementScreen ? `${sidebarVisible ? 'lg:w-[calc(100%-16rem)] lg:ms-64' : 'lg:w-full lg:ms-0'} lg:px-8` : ''}`}>
      <div className={`mx-auto ${isInternalManagementScreen ? 'w-full max-w-none' : 'max-w-7xl'}`}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-lg font-black tracking-tight text-amber-300">S</div>
              <div>
                <div className="text-sm font-bold tracking-[0.16em] text-white">SARAYA EVENTS</div>
                <div className="mt-1 text-xs text-slate-400">{language === 'ar' ? 'السرايا للمناسبات' : 'Luxury Weddings & Venues'}</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">{language === 'ar' ? 'مساحة راقية للاحتفال بأهم مناسباتكم، مع خدمات وتنظيم يليق بكل لحظة.' : 'An elegant setting for life’s important celebrations, supported by thoughtful service and event planning.'}</p>
          </div>
          <div className={language === 'ar' ? 'text-right' : 'text-left'}>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">{language === 'ar' ? 'تواصل معنا' : 'Contact'}</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p className="flex items-start gap-2"><span className="mt-0.5 text-amber-300">⌖</span><span>{language === 'ar' ? 'فندق آركين' : 'Arcane Hotel'}<br />{language === 'ar' ? 'بورتو سعيد' : 'Porto Said'}</span></p>
              <a className="block transition-colors hover:text-amber-300" href={`tel:${companyProfile.phone.replace(/[^+\d]/g, '')}`}>{language === 'ar' ? 'هاتف' : 'Phone'}: {companyProfile.phone}</a>
              <a className="block transition-colors hover:text-amber-300" href={`https://wa.me/${companyProfile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp: {companyProfile.whatsapp}</a>
            </div>
          </div>
          <div className={language === 'ar' ? 'text-right' : 'text-left'}>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">{language === 'ar' ? 'روابط سريعة' : 'Quick links'}</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              {isInternalManagementScreen && portalUser ? ([
                ['package_builder', 'تصميم الحفلة', 'Event Planner'], ['price_lists', 'قوائم الأسعار', 'Price Lists'], ['dashboard', 'لوحة التحكم', 'Dashboard'], ['bookings', 'الحجوزات', 'Bookings'], ['agenda', 'التقويم', 'Calendar'],
                ['photo_library', 'مكتبة الصور', 'Photo Library'], ['inventory', 'المخزون', 'Inventory'], ['company', 'ملف الشركة', 'Company Profile'],
                ['event_designer', 'مصمم المناسبات', 'Event Designer'], ['services', 'الخدمات', 'Services'], ['finance', 'المالية', 'Finance'],
                ['catering', 'الضيافة', 'Catering'], ['contracts', 'العقود', 'Contracts'], ['clients', 'العملاء', 'Clients'],
                ['payments', 'المدفوعات', 'Payments'], ['expenses', 'المصروفات', 'Expenses'], ['staff', 'الموظفون', 'Staff'], ['reports', 'التقارير', 'Reports'],
              ] as [VenueTab, string, string][]).filter(([tab]) => canAccess(portalUser, tab)).map(([tab, arLabel, enLabel]) => <button key={tab} type="button" onClick={() => { sound.click(650); setCurrentTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={currentTab === tab ? 'page' : undefined} className={currentTab === tab ? 'text-start font-bold text-amber-500' : 'text-start text-slate-500 transition-colors hover:text-amber-500'}>{language === 'ar' ? arLabel : enLabel}</button>) : <>
                <button type="button" onClick={() => { sound.click(650); setPortalLoginOpen(true); setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-start transition-colors hover:text-amber-500">{language === 'ar' ? 'بوابة إدارة القاعات للموظفين' : 'Staff Portal'}</button>
                {companyProfile.instagramUrl && <a href={companyProfile.instagramUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-amber-500">Instagram</a>}
                {companyProfile.tiktokUrl && <a href={companyProfile.tiktokUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-amber-500">TikTok</a>}
              </>}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes saraya-credit-main {
            0% { opacity: 0; transform: translateX(-10px) skewX(-12deg); filter: blur(3px); letter-spacing: .34em; }
            12% { opacity: 1; transform: translateX(5px) skewX(8deg); filter: blur(0); text-shadow: -5px 0 #22d3ee, 5px 0 #fb7185; clip-path: inset(0 0 52% 0); }
            24% { transform: translateX(-4px) skewX(-4deg); text-shadow: 5px 0 #22d3ee, -5px 0 #fb7185; clip-path: inset(42% 0 12% 0); }
            38% { transform: translateX(3px); text-shadow: -3px 0 #22d3ee, 3px 0 #fb7185; clip-path: inset(0); letter-spacing: .22em; }
            52% { transform: translateX(-1px); text-shadow: 2px 0 #22d3ee, -2px 0 #fb7185; }
            68%, 100% { opacity: 1; transform: translateX(0) skewX(0); filter: none; text-shadow: 0 0 22px rgba(245, 185, 66, .18); clip-path: inset(0); letter-spacing: .18em; }
          }
          @keyframes saraya-credit-cyan {
            0%, 100% { opacity: 0; transform: translate(-8px, 2px); }
            14%, 32% { opacity: .95; transform: translate(5px, -1px); }
            46% { opacity: .5; transform: translate(-3px, 1px); }
            60% { opacity: 0; transform: translate(0); }
          }
          @keyframes saraya-credit-pink {
            0%, 100% { opacity: 0; transform: translate(7px, -2px); }
            18%, 36% { opacity: .9; transform: translate(-5px, 1px); }
            48% { opacity: .4; transform: translate(3px, -1px); }
            62% { opacity: 0; transform: translate(0); }
          }
          @keyframes saraya-credit-scan {
            0% { opacity: 0; transform: translateX(-120%) scaleX(.35); }
            16% { opacity: 1; transform: translateX(0) scaleX(1); }
            42% { opacity: .9; transform: translateX(12%) scaleX(.85); }
            100% { opacity: 0; transform: translateX(120%) scaleX(.3); }
          }
          @media (prefers-reduced-motion: reduce) {
            .saraya-credit-main, .saraya-credit-layer, .saraya-credit-scan { animation: none !important; }
          }
        `}</style>
        <div className="mt-6 flex flex-col items-center gap-2 border-t border-white/10 pt-4 text-center">
          <div dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="flex w-full flex-col items-center justify-center gap-0 text-center leading-tight">
            <div className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-500">Powered by</div>
            <span className="relative inline-block overflow-visible py-0 px-2">
              {footerCreditVisible && <span aria-hidden="true" className="saraya-credit-scan pointer-events-none absolute -left-3 right-0 top-1/2 z-0 h-5 bg-gradient-to-r from-transparent via-cyan-300/70 to-fuchsia-400/70 blur-[2px]" style={{ animation: 'saraya-credit-scan 1.25s ease-out both' }} />}
              <span className={`saraya-credit-main relative z-10 inline-block text-xl font-black tracking-[0.22em] text-amber-300 drop-shadow-[0_0_14px_rgba(245,185,66,0.28)] ${footerCreditVisible ? '' : 'opacity-0'}`} style={footerCreditVisible ? { animation: 'saraya-credit-main 1.35s cubic-bezier(.2,.8,.2,1) both' } : undefined}>DALI STUDIO</span>
              {footerCreditVisible && <span aria-hidden="true" className="saraya-credit-layer pointer-events-none absolute left-2 top-1/2 z-20 -translate-y-1/2 whitespace-nowrap text-xl font-black tracking-[0.22em] text-cyan-300 mix-blend-screen" style={{ animation: 'saraya-credit-cyan 1.1s steps(2, end) both' }}>DALI STUDIO</span>}
              {footerCreditVisible && <span aria-hidden="true" className="saraya-credit-layer pointer-events-none absolute left-2 top-1/2 z-20 -translate-y-1/2 whitespace-nowrap text-xl font-black tracking-[0.22em] text-rose-400 mix-blend-screen" style={{ animation: 'saraya-credit-pink 1.1s steps(2, end) both' }}>DALI STUDIO</span>}
            </span>
            <span className="text-sm font-bold leading-tight text-slate-300">Mohamed Alaa</span>
            <a href="tel:+201146475759" className="text-xs font-bold leading-tight text-slate-500 transition-colors hover:text-amber-300">+20 114 647 5759</a>
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500">© {new Date().getFullYear()} SARAYA EVENTS. All rights reserved.</div>
        </div>
      </div>
    </footer>
    <NewBookingModal isOpen={isNewBookingModalOpen} onClose={() => setIsNewBookingModalOpen(false)} halls={halls} servicesCatalogue={servicesCatalogue} priceBook={priceBook} existingBookings={bookings} onCreateBooking={handleCreateBooking} preselectedHallId={preselectedHallId} customerMode={currentTab === 'home' || currentTab.startsWith('public_')} hideFinancials={Boolean(portalUser?.sellingPricesOnly)} language={language} />
    <Suspense fallback={null}>{selectedBookingForProfit && <EventProfitCalculatorModal isOpen={!!selectedBookingForProfit && !portalUser?.sellingPricesOnly} onClose={() => setSelectedBookingForProfit(null)} booking={selectedBookingForProfit} onUpdateBookingCosts={handleUpdateBookingCosts} />}
    {selectedBookingForInvoice && <InvoicePrintModal isOpen onClose={() => setSelectedBookingForInvoice(null)} booking={selectedBookingForInvoice} />}</Suspense>
    <OnboardingFlow isOpen={isOnboardingOpen} language={language} onClose={() => setIsOnboardingOpen(false)} onComplete={() => setIsOnboardingOpen(false)} onNavigate={(tab) => { setCurrentTab(tab); setIsOnboardingOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
  </div>);
}
