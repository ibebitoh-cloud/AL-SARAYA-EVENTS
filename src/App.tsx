/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
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
  ServiceDefinition, VenueTab, Language, Hall,
} from './types/venueSystem';
import { TableAssignment, Guest } from './types/event';
import { VenueHeaderNav } from './components/VenueHeaderNav';
import { SarayaBrandHeader } from './components/SarayaBrandHeader';
import { SarayaCustomerHomepage } from './components/SarayaCustomerHomepage';
import { PhotoLibraryPage } from './components/PhotoLibraryPage';
import { ALSARAYA_PHOTOS, VenuePhoto } from './data/venueImages';
import { CustomerSectionView } from './components/CustomerSectionView';
import { CompanyShowcaseView } from './components/CompanyShowcaseView';
import { CompanyProfileView } from './components/CompanyProfileView';
import { PortalLogin } from './components/PortalLogin';
import { SystemUser } from './data/systemProfiles';
import { DashboardView } from './components/DashboardView';
import { BookingsView } from './components/BookingsView';
import { CalendarAgendaView } from './components/CalendarAgendaView';
import { FloorPlanStudio } from './components/FloorPlanStudio';
import { EventLayoutDesigner } from './components/EventLayoutDesigner';
import { CateringMenuView } from './components/CateringMenuView';
import { ContractsView } from './components/ContractsView';
import { ClientsView } from './components/ClientsView';
import { ServicesView } from './components/ServicesView';
import { PaymentsLedgerView } from './components/PaymentsLedgerView';
import { ExpensesView } from './components/ExpensesView';
import { FinanceView } from './components/FinanceView';
import { InventoryView } from './components/InventoryView';
import { StaffView } from './components/StaffView';
import { ReportsView } from './components/ReportsView';
import { NewBookingModal } from './components/NewBookingModal';
import { EventProfitCalculatorModal } from './components/EventProfitCalculatorModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DICTIONARY } from './utils/i18n';
import { sound } from './utils/soundEffects';

const isOutdoorVenuePhoto = (photo: VenuePhoto) =>
  (photo.category as string) === 'garden' ||
  /garden|terrace|open[ -]?air|outdoor|حديقة|تراس|هواء طلق/i.test(
    [photo.titleAr, photo.titleEn, photo.hallNameAr, photo.hallNameEn, ...(photo.tags ?? [])].join(' ')
  );

const uniqueEventPhotos = (items: VenuePhoto[]) => {
  const seen = new Set<string>();
  return items.filter((photo) => {
    if (!photo.src?.trim() || isOutdoorVenuePhoto(photo)) return false;
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
  const [currentTab, setCurrentTab] = useState<VenueTab>('home');
  const [portalUser, setPortalUser] = useState<SystemUser | null>(null);
  const [portalLoginOpen, setPortalLoginOpen] = useState(false);
  const [portalWelcome, setPortalWelcome] = useState<SystemUser | null>(null);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; window.localStorage.setItem('saraya-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = language; }, [language]);
  const toggleLanguage = () => setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  const [bookings, setBookings] = useState<Booking[]>(() => {
    if (typeof window === 'undefined') return dedupeBookings(INITIAL_BOOKINGS);
    try {
      const saved = JSON.parse(window.localStorage.getItem('saraya-bookings') || 'null');
      return dedupeBookings(Array.isArray(saved) ? saved : INITIAL_BOOKINGS);
    } catch {
      return dedupeBookings(INITIAL_BOOKINGS);
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('saraya-bookings', JSON.stringify(dedupeBookings(bookings)));
    } catch (error) {
      console.warn('Bookings could not be saved locally:', error);
    }
  }, [bookings]);
  const [halls, setHalls] = useState<Hall[]>(() => {
    if (typeof window === 'undefined') return INITIAL_HALLS;
    try { const saved = JSON.parse(window.localStorage.getItem('saraya-halls') || 'null'); const list = Array.isArray(saved) && saved.length ? saved : INITIAL_HALLS; return list.map((hall: Hall) => /garden|terrace|open[ -]?air|outdoor|حديقة|تراس|هواء طلق/i.test(`${hall.name} ${hall.nameEn || ''}`) ? { ...hall, name: 'قاعة المؤتمرات الدبلوماسية', nameEn: 'The Diplomat Conference & Summit Hall' } : hall); } catch { return INITIAL_HALLS; }
  });
  useEffect(() => { window.localStorage.setItem('saraya-halls', JSON.stringify(halls)); }, [halls]);
  const [photos, setPhotos] = useState<VenuePhoto[]>(() => {
    if (typeof window === 'undefined') return uniqueEventPhotos(ALSARAYA_PHOTOS);
    try {
      const saved = JSON.parse(window.localStorage.getItem('alsaraya_custom_photos') || 'null');
      return uniqueEventPhotos(Array.isArray(saved) && saved.length ? saved : ALSARAYA_PHOTOS);
    } catch {
      return uniqueEventPhotos(ALSARAYA_PHOTOS);
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem('alsaraya_custom_photos', JSON.stringify(uniqueEventPhotos(photos))); } catch (error) {
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
    const defaults = { nameEn: 'SARAYA EVENT', nameAr: 'السرايا للمناسبات', taglineEn: 'Luxury Weddings & Venues', taglineAr: 'السرايا للمناسبات وقاعات الأفراح الملكية في مصر', businessEn: 'Wedding halls, events & event management', businessAr: 'قاعات أفراح ومناسبات وإدارة فعاليات', locationsEn: 'Ring Road, New Cairo · Corniche, Alexandria', locationsAr: 'القاهرة الجديدة · الإسكندرية', phone: '+20 2 2795 0000', whatsapp: '+20 100 123 4567', instagramUrl: '', tiktokUrl: '', logo: 'black' as 'black' | 'white' };
    if (typeof window === 'undefined') return defaults;
    try { return { ...defaults, ...(JSON.parse(window.localStorage.getItem('saraya-company-profile') || '') || {}) }; } catch { return defaults; }
  });
  useEffect(() => { window.localStorage.setItem('saraya-company-profile', JSON.stringify(companyProfile)); }, [companyProfile]);
  const [tables, setTables] = useState<TableAssignment[]>(INITIAL_EVENTS[0].tables);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_EVENTS[0].guests);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedBookingForProfit, setSelectedBookingForProfit] = useState<Booking | null>(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [preselectedHallId, setPreselectedHallId] = useState<string | undefined>(undefined);
  const handleCreateBooking = (newBooking: Booking) => {
    // Ignore a repeat submit for the same booking; the Photo Library creates one album card per booking ID.
    if (bookings.some((booking) => booking.id === newBooking.id || booking.code === newBooking.code)) return;
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
  const handleRefundSecurityDeposit = (bookingId: string) => { const targetBooking = bookings.find((b) => b.id === bookingId); if (!targetBooking) return; setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, securityDepositStatus: 'refunded' } : b)); setPayments((prev) => [{ id: `rcp-${Date.now()}`, receiptNo: `REF-${Math.floor(1000 + Math.random() * 9000)}`, bookingId: targetBooking.id, bookingCode: targetBooking.code, clientName: targetBooking.clientName, amount: targetBooking.securityDeposit, date: new Date().toISOString().split('T')[0], method: 'cash', type: 'security_refund', notes: 'إيصال رد تأمين القاعة للعميل نقداً بعد سلامة المرافق' }, ...prev]); };
  const handleAddExpense = (newExpense: Expense) => setExpenses((prev) => [newExpense, ...prev]);
  const handleAddService = (newService: ServiceDefinition) => setServicesCatalogue((prev) => [...prev, newService]);
  const handleUpdateInventoryQty = (itemId: string, newQty: number, damagedQty?: number) => setInventory((prev) => prev.map((item) => item.id === itemId ? { ...item, quantity: newQty, damagedQuantity: damagedQty !== undefined ? damagedQty : item.damagedQuantity } : item));
  const handleAddInventoryItem = (newItem: InventoryItem) => setInventory((prev) => [...prev, newItem]);
  const handleEditInventoryItem = (updatedItem: InventoryItem) => setInventory((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
  const handleAddStaff = (newStaff: Employee) => setStaff((prev) => [...prev, newStaff]);
  const handleUpdateStaffAttendance = (staffId: string, status: Employee['attendanceStatus']) => setStaff((prev) => prev.map((emp) => emp.id === staffId ? { ...emp, attendanceStatus: status } : emp));
  const handleAssignGuestToTable = (guestId: string, tableId: string) => { setTables((prev) => prev.map((t) => { const withoutGuest = t.assignedGuestIds.filter((id) => id !== guestId); return t.id === tableId ? { ...t, assignedGuestIds: [...withoutGuest, guestId] } : { ...t, assignedGuestIds: withoutGuest }; })); setGuests((prev) => prev.map((g) => g.id === guestId ? { ...g, tableId } : g)); sound.chime(); };
  const handleRemoveGuestFromTable = (guestId: string) => { setTables((prev) => prev.map((t) => ({ ...t, assignedGuestIds: t.assignedGuestIds.filter((id) => id !== guestId) }))); setGuests((prev) => prev.map((g) => g.id === guestId ? { ...g, tableId: undefined } : g)); sound.tick(); };
  const handleAddTable = (newTable: TableAssignment) => { setTables((prev) => [...prev, newTable]); sound.pop(); };
  const swipeStartX = useRef<number | null>(null);
  const swipeableTabs: VenueTab[] = ['dashboard', 'bookings', 'agenda', 'company', 'event_designer', 'inventory', 'services', 'finance', 'floorplan', 'catering', 'contracts', 'clients', 'payments', 'expenses', 'staff', 'reports', 'photo_library'];
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
  return (<div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative box-border font-sans">
    <SarayaBrandHeader language={language} theme={theme} onToggleTheme={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')} onToggleLanguage={toggleLanguage} instagramUrl={companyProfile.instagramUrl} tiktokUrl={companyProfile.tiktokUrl} onOpenBookingModal={() => { setPreselectedHallId(undefined); setIsNewBookingModalOpen(true); }} onNavigateSection={(sectionId) => { const screenMap: Record<string, VenueTab> = { events: 'public_events', venues: 'public_venues', services: 'public_services', planner: 'public_planner', gallery: 'public_gallery', '3d-tour': 'public_3d_tour' }; const nextTab = screenMap[sectionId]; if (nextTab) { setCurrentTab(nextTab); window.scrollTo({ top: 0, behavior: 'smooth' }); } else if (sectionId === 'hero') { setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } else { setCurrentTab('home'); window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }), 350); } }} onOpenManagementPortal={() => { sound.click(650); setPortalLoginOpen(true); setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} isManagementMode={Boolean(portalUser && currentTab !== 'home' && !currentTab.startsWith('public_'))} onExitManagementMode={() => { sound.swoosh(); setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    {!portalLoginOpen && portalUser && currentTab !== 'home' && !currentTab.startsWith('public_') && <VenueHeaderNav currentTab={currentTab} language={language} user={portalUser} onTabChange={(tab) => { setCurrentTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onToggleLanguage={toggleLanguage} onOpenTour={() => setIsOnboardingOpen(true)}  />}
    {portalWelcome && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4" onClick={() => setPortalWelcome(null)}><motion.div initial={{opacity:0,scale:.96,y:10}} animate={{opacity:1,scale:1,y:0}} className="w-full max-w-md rounded-3xl border border-amber-400/20 bg-slate-900 p-8 text-center shadow-2xl"><div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">WELCOME</div><h1 className="mt-3 text-3xl font-black text-white">{language === 'ar' ? `أهلاً بك، ${portalWelcome.nameAr}` : `Welcome, ${portalWelcome.name}`}</h1><p className="mt-2 text-xs text-slate-500">{language === 'ar' ? 'تم الدخول إلى البوابة التجريبية' : 'You are now inside the trial portal'}</p><button onClick={() => setPortalWelcome(null)} className="mt-6 px-5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold">{language === 'ar' ? 'دخول النظام' : 'Enter System'}</button></motion.div></div>}
    <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6 overflow-x-hidden ${portalUser && currentTab !== 'home' && !currentTab.startsWith('public_') ? 'pb-24 lg:pb-8' : ''}`}><AnimatePresence mode="wait"><motion.div onTouchStart={handleScreenTouchStart} onTouchEnd={handleScreenTouchEnd} key={`${currentTab}-${language}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
      {portalLoginOpen && <PortalLogin language={language} onLogin={(user) => { setPortalUser(user); setPortalLoginOpen(false); setPortalWelcome(user); setCurrentTab(user.role === 'customer' ? 'home' : 'dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onBack={() => setPortalLoginOpen(false)} />}
      {!portalLoginOpen && currentTab === 'home' && <SarayaCustomerHomepage halls={halls} photos={photos.filter((photo) => !photo.reviewStatus || photo.reviewStatus === 'approved')} language={language} onSelectHallForBooking={(hallId) => setPreselectedHallId(hallId)} onOpenBookingModal={() => setIsNewBookingModalOpen(true)} onCreateBooking={handleCreateBooking} onOpenEventDesigner={() => setCurrentTab('event_designer')} />}
      {currentTab.startsWith('public_') && <CustomerSectionView screen={({ public_events: 'events', public_venues: 'venues', public_services: 'services', public_planner: 'planner', public_gallery: 'gallery', public_3d_tour: '3d-tour' } as const)[currentTab as 'public_events' | 'public_venues' | 'public_services' | 'public_planner' | 'public_gallery' | 'public_3d_tour']} halls={halls} photos={photos.filter((photo) => !photo.reviewStatus || photo.reviewStatus === 'approved')} language={language} onOpenBooking={(hallId) => { if (hallId) setPreselectedHallId(hallId); setIsNewBookingModalOpen(true); }} onGoHome={() => { setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      {currentTab === 'company' && portalUser && <CompanyProfileView language={language} halls={halls} bookings={bookings} services={servicesCatalogue} clients={clients} staff={staff} inventory={inventory} payments={payments} expenses={expenses} companyProfile={companyProfile} onUpdateCompanyProfile={setCompanyProfile} onUpdateHall={handleUpdateHall} />}
      {currentTab === 'photo_library' && portalUser && <PhotoLibraryPage language={language} photos={photos} bookings={bookings} onSavePhotos={handleSavePhotos} />}
      {currentTab === 'dashboard' && portalUser && <DashboardView bookings={bookings} halls={halls} language={language} onNavigateTab={(tab) => setCurrentTab(tab)} />}
      {currentTab === 'bookings' && portalUser && <BookingsView bookings={bookings} onOpenNewBooking={() => setIsNewBookingModalOpen(true)} onSelectBookingForProfit={(b) => setSelectedBookingForProfit(b)} onSelectBookingForInvoice={(b) => setSelectedBookingForInvoice(b)} onUpdateBookingStatus={handleUpdateBookingStatus} />}
      {currentTab === 'agenda' && portalUser && <CalendarAgendaView bookings={bookings} halls={halls} onSelectBooking={(b) => setSelectedBookingForInvoice(b)} onOpenNewBooking={() => setIsNewBookingModalOpen(true)} />}
      {currentTab === 'event_designer' && portalUser && <EventLayoutDesigner language={language} />}
      {currentTab === 'floorplan' && portalUser && <div className="space-y-4"><div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"><div><h2 className="text-xl font-bold text-white">{language === 'ar' ? 'مخطط القاعة وتوزيع الطاولات ثلاثي الأبعاد' : 'Interactive 3D Floor Plan & Seating Studio'}</h2><p className="text-xs text-slate-400">{language === 'ar' ? 'توزيع مقاعد الضيوف، تحديد طاولات كبار الشخصيات VIP، محاكاة حركة المسرح والبوفيه' : 'Arrange guest seating, VIP tables, stage proximity, and catering stations'}</p></div></div><FloorPlanStudio tables={tables} guests={guests} onAssignGuestToTable={handleAssignGuestToTable} onRemoveGuestFromTable={handleRemoveGuestFromTable} onAddTable={handleAddTable} /></div>}
      {currentTab === 'catering' && portalUser && <CateringMenuView language={language} />}
      {currentTab === 'contracts' && portalUser && <ContractsView bookings={bookings} language={language} />}
      {currentTab === 'clients' && portalUser && <ClientsView clients={clients} bookings={bookings} onSelectBookingForInvoice={(b) => setSelectedBookingForInvoice(b)} />}
      {currentTab === 'services' && portalUser && <ServicesView services={servicesCatalogue} onAddService={handleAddService} />}
      {currentTab === 'finance' && portalUser && <FinanceView payments={payments} expenses={expenses} bookings={bookings} onAddPayment={handleAddPayment} onRefundSecurityDeposit={handleRefundSecurityDeposit} onAddExpense={handleAddExpense} />}
      {currentTab === 'payments' && portalUser && <PaymentsLedgerView payments={payments} bookings={bookings} onAddPayment={handleAddPayment} onRefundSecurityDeposit={handleRefundSecurityDeposit} />}
      {currentTab === 'expenses' && portalUser && <ExpensesView expenses={expenses} bookings={bookings} onAddExpense={handleAddExpense} />}
      {currentTab === 'inventory' && portalUser && <InventoryView inventory={inventory} onUpdateItemQuantity={handleUpdateInventoryQty} onAddItem={handleAddInventoryItem} onEditItem={handleEditInventoryItem} />}
      {currentTab === 'staff' && portalUser && <StaffView staff={staff} bookings={bookings} onAddStaff={handleAddStaff} onUpdateStaffAttendance={handleUpdateStaffAttendance} />}
      {currentTab === 'reports' && portalUser && <ReportsView bookings={bookings} expenses={expenses} payments={payments} inventory={inventory} staff={staff} />}
    </motion.div></AnimatePresence></main>
    <footer className="w-full border-t border-amber-500/15 bg-slate-950 py-7 px-4 text-xs text-slate-400 mt-10"><div className="max-w-7xl mx-auto flex flex-col items-center gap-5 text-center"><div className="w-full"><div className="flex items-center justify-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(212,175,55,0.8)]" /><span className="text-amber-300 font-serif font-black tracking-wider text-sm">SARAYA EVENT</span><span className="text-slate-600">·</span><span className="text-slate-300 font-semibold">{language === 'ar' ? 'السرايا للمناسبات وقاعات الأفراح الملكية في مصر' : 'Luxury Weddings & Venues'}</span></div><p className="mt-1 text-[10px] text-slate-500">{language === 'ar' ? 'القاهرة الجديدة (الطريق الدائري) · الكورنيش (الإسكندرية) · هاتف: 27950000 2 20+ · واتساب: 4567 123 100 20+' : 'Ring Road, New Cairo · Corniche, Alexandria · Hotline: +20 2 2795 0000 · WhatsApp: +20 100 123 4567'}</p></div><div className="flex flex-wrap items-center justify-center gap-3 text-slate-400 font-mono text-[10px]"><span>{language === 'ar' ? '4 قاعات فندقية مستقلة' : '4 Independent Royal Halls'}</span><span>·</span><span>{language === 'ar' ? 'عزل صوتي 65dB' : '65dB Acoustic Isolation'}</span><span>·</span><button type="button" onClick={() => { sound.click(650); setCurrentTab(currentTab === 'home' ? 'dashboard' : 'home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-amber-400 hover:text-amber-300 underline font-sans">{currentTab === 'home' ? (language === 'ar' ? 'بوابة إدارة القاعات للموظفين' : 'Staff Portal') : (language === 'ar' ? 'العودة لموقع العملاء' : 'Customer Website')}</button><span>·</span><span>© 2026 SARAYA EVENT</span></div><div className="w-full border-t border-white/10 pt-5"><div className="text-[8px] font-semibold uppercase tracking-[0.3em] text-slate-500">POWERED BY</div><div className="mt-0.5 select-none font-sans text-lg font-black uppercase tracking-[0.16em] text-amber-400" title="Bebito">BEBITO</div><div className="mt-1 text-[9px] font-medium tracking-wide text-slate-400">MOHAMED ALAA · +20 114 647 5759</div></div></div></footer>
    <NewBookingModal isOpen={isNewBookingModalOpen} onClose={() => setIsNewBookingModalOpen(false)} halls={halls} servicesCatalogue={servicesCatalogue} existingBookings={bookings} onCreateBooking={handleCreateBooking} preselectedHallId={preselectedHallId} customerMode={currentTab === 'home' || currentTab.startsWith('public_')} />
    <EventProfitCalculatorModal isOpen={!!selectedBookingForProfit} onClose={() => setSelectedBookingForProfit(null)} booking={selectedBookingForProfit} onUpdateBookingCosts={handleUpdateBookingCosts} />
    <InvoicePrintModal isOpen={!!selectedBookingForInvoice} onClose={() => setSelectedBookingForInvoice(null)} booking={selectedBookingForInvoice} />
    <OnboardingFlow isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} onComplete={() => setIsOnboardingOpen(false)} />
  </div>);
}
