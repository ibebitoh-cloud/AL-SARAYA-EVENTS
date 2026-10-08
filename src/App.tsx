/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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
  Booking,
  BookingStatus,
  PaymentReceipt,
  Expense,
  InventoryItem,
  Employee,
  ServiceDefinition,
  VenueTab,
  Language,
} from './types/venueSystem';
import { TableAssignment, Guest } from './types/event';
import { VenueHeaderNav } from './components/VenueHeaderNav';
import { SarayaBrandHeader } from './components/SarayaBrandHeader';
import { SarayaCustomerHomepage } from './components/SarayaCustomerHomepage';
import { CompanyShowcaseView } from './components/CompanyShowcaseView';
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
import { InventoryView } from './components/InventoryView';
import { StaffView } from './components/StaffView';
import { ReportsView } from './components/ReportsView';
import { NewBookingModal } from './components/NewBookingModal';
import { EventProfitCalculatorModal } from './components/EventProfitCalculatorModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DICTIONARY } from './utils/i18n';
import { sound } from './utils/soundEffects';

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [currentTab, setCurrentTab] = useState<VenueTab>('home');

  // Synchronize document direction with selected language
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  // Master Data State
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [halls] = useState(INITIAL_HALLS);
  const [servicesCatalogue, setServicesCatalogue] = useState<ServiceDefinition[]>(INITIAL_SERVICES);
  const [payments, setPayments] = useState<PaymentReceipt[]>(INITIAL_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [staff, setStaff] = useState<Employee[]>(INITIAL_STAFF);
  const [clients, setClients] = useState(INITIAL_CLIENTS);

  // Seating & Stage Live Control State
  const [tables, setTables] = useState<TableAssignment[]>(INITIAL_EVENTS[0].tables);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_EVENTS[0].guests);

  // Modals state
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedBookingForProfit, setSelectedBookingForProfit] = useState<Booking | null>(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [preselectedHallId, setPreselectedHallId] = useState<string | undefined>(undefined);

  // Handlers
  const handleCreateBooking = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);

    // Automatically record deposit in payments ledger if paid
    if (newBooking.deposit > 0) {
      const depositPayment: PaymentReceipt = {
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
      };
      setPayments((prev) => [depositPayment, ...prev]);
    }
  };

  const handleUpdateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  const handleUpdateBookingCosts = (bookingId: string, updates: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, ...updates } : b))
    );
  };

  const handleAddPayment = (newPayment: PaymentReceipt) => {
    setPayments((prev) => [newPayment, ...prev]);
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === newPayment.bookingId && newPayment.type !== 'security_refund') {
          const newPaid = b.paidAmount + newPayment.amount;
          const newRemaining = Math.max(0, b.totalPrice - newPaid);
          return {
            ...b,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
          };
        }
        return b;
      })
    );
  };

  const handleRefundSecurityDeposit = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, securityDepositStatus: 'refunded' } : b
      )
    );

    const refundReceipt: PaymentReceipt = {
      id: `rcp-${Date.now()}`,
      receiptNo: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingId: targetBooking.id,
      bookingCode: targetBooking.code,
      clientName: targetBooking.clientName,
      amount: targetBooking.securityDeposit,
      date: new Date().toISOString().split('T')[0],
      method: 'cash',
      type: 'security_refund',
      notes: `إيصال رد تأمين القاعة للعميل نقداً بعد سلامة المرافق`,
    };
    setPayments((prev) => [refundReceipt, ...prev]);
  };

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleAddService = (newService: ServiceDefinition) => {
    setServicesCatalogue((prev) => [...prev, newService]);
  };

  const handleUpdateInventoryQty = (itemId: string, newQty: number, damagedQty?: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQty,
              damagedQuantity: damagedQty !== undefined ? damagedQty : item.damagedQuantity,
            }
          : item
      )
    );
  };

  const handleAddInventoryItem = (newItem: InventoryItem) => {
    setInventory((prev) => [...prev, newItem]);
  };

  const handleAddStaff = (newStaff: Employee) => {
    setStaff((prev) => [...prev, newStaff]);
  };

  const handleUpdateStaffAttendance = (staffId: string, status: Employee['attendanceStatus']) => {
    setStaff((prev) =>
      prev.map((emp) => (emp.id === staffId ? { ...emp, attendanceStatus: status } : emp))
    );
  };

  // Seating studio handlers
  const handleAssignGuestToTable = (guestId: string, tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        const withoutGuest = t.assignedGuestIds.filter((id) => id !== guestId);
        if (t.id === tableId) {
          return { ...t, assignedGuestIds: [...withoutGuest, guestId] };
        }
        return { ...t, assignedGuestIds: withoutGuest };
      })
    );
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, tableId } : g))
    );
    sound.chime();
  };

  const handleRemoveGuestFromTable = (guestId: string) => {
    setTables((prev) =>
      prev.map((t) => ({
        ...t,
        assignedGuestIds: t.assignedGuestIds.filter((id) => id !== guestId),
      }))
    );
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, tableId: undefined } : g))
    );
    sound.tick();
  };

  const handleAddTable = (newTable: TableAssignment) => {
    setTables((prev) => [...prev, newTable]);
    sound.pop();
  };

  const t = DICTIONARY[language];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative box-border font-sans">
      {/* Primary Customer-Facing Luxury Header */}
      <SarayaBrandHeader
        language={language}
        onToggleLanguage={toggleLanguage}
        onOpenBookingModal={() => {
          setPreselectedHallId(undefined);
          setIsNewBookingModalOpen(true);
        }}
        onNavigateSection={(sectionId) => {
          if (currentTab !== 'home') {
            setCurrentTab('home');
            setTimeout(() => {
              const el = document.getElementById(sectionId);
              el?.scrollIntoView({ behavior: 'smooth' });
            }, 120);
          } else {
            const el = document.getElementById(sectionId);
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onOpenManagementPortal={() => {
          sound.click(650);
          setCurrentTab('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isManagementMode={currentTab !== 'home'}
        onExitManagementMode={() => {
          sound.swoosh();
          setCurrentTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Internal Management Tabs Bar (Active when staff switches into management mode) */}
      {currentTab !== 'home' && (
        <VenueHeaderNav
          currentTab={currentTab}
          language={language}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onToggleLanguage={toggleLanguage}
          onOpenNewBooking={() => {
            setPreselectedHallId(undefined);
            setIsNewBookingModalOpen(true);
          }}
          onOpenTour={() => setIsOnboardingOpen(true)}
        />
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentTab}-${language}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* 0. Customer-Facing Homepage */}
            {currentTab === 'home' && (
              <SarayaCustomerHomepage
                halls={halls}
                language={language}
                onSelectHallForBooking={(hallId) => {
                  setPreselectedHallId(hallId);
                }}
                onOpenBookingModal={() => setIsNewBookingModalOpen(true)}
                onCreateBooking={handleCreateBooking}
              />
            )}

            {/* 1. Long-scrolling Company & Halls Presentation */}
            {currentTab === 'company' && (
              <CompanyShowcaseView
                halls={halls}
                language={language}
                onSelectHallForBooking={(hallId) => {
                  setPreselectedHallId(hallId);
                }}
                onOpenNewBooking={() => setIsNewBookingModalOpen(true)}
                onNavigateToFloorPlan={() => setCurrentTab('floorplan')}
              />
            )}

            {/* 2. Concise Executive Dashboard ("LESS FOR DASHBOARD") */}
            {currentTab === 'dashboard' && (
              <DashboardView
                bookings={bookings}
                halls={halls}
                language={language}
                onOpenNewBooking={() => setIsNewBookingModalOpen(true)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {/* 3. Bookings Module */}
            {currentTab === 'bookings' && (
              <BookingsView
                bookings={bookings}
                onOpenNewBooking={() => setIsNewBookingModalOpen(true)}
                onSelectBookingForProfit={(b) => setSelectedBookingForProfit(b)}
                onSelectBookingForInvoice={(b) => setSelectedBookingForInvoice(b)}
                onUpdateBookingStatus={handleUpdateBookingStatus}
              />
            )}

            {/* 4. Agenda & Calendar Module */}
            {currentTab === 'agenda' && (
              <CalendarAgendaView
                bookings={bookings}
                halls={halls}
                onSelectBooking={(b) => setSelectedBookingForInvoice(b)}
                onOpenNewBooking={() => setIsNewBookingModalOpen(true)}
              />
            )}

            {/* 5. Event Layout Designer */}
            {currentTab === 'event_designer' && (
              <EventLayoutDesigner language={language} />
            )}

            {/* Legacy seating studio kept available for existing data */}
            {currentTab === 'floorplan' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {language === 'ar' ? 'مخطط القاعة وتوزيع الطاولات ثلاثي الأبعاد' : 'Interactive 3D Floor Plan & Seating Studio'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {language === 'ar' ? 'توزيع مقاعد الضيوف، تحديد طاولات كبار الشخصيات VIP، محاكاة حركة المسرح والبوفيه' : 'Arrange guest seating, VIP tables, stage proximity, and catering stations'}
                    </p>
                  </div>
                </div>
                <FloorPlanStudio
                  tables={tables}
                  guests={guests}
                  onAssignGuestToTable={handleAssignGuestToTable}
                  onRemoveGuestFromTable={handleRemoveGuestFromTable}
                  onAddTable={handleAddTable}
                />
              </div>
            )}

            {/* 7. Buffet & Catering Designer */}
            {currentTab === 'catering' && (
              <CateringMenuView language={language} />
            )}

            {/* 8. Contracts & Quotations */}
            {currentTab === 'contracts' && (
              <ContractsView bookings={bookings} language={language} />
            )}

            {/* 9. Clients CRM */}
            {currentTab === 'clients' && (
              <ClientsView
                clients={clients}
                bookings={bookings}
                onSelectBookingForInvoice={(b) => setSelectedBookingForInvoice(b)}
              />
            )}

            {/* 10. Services & Add-ons Catalogue */}
            {currentTab === 'services' && (
              <ServicesView
                services={servicesCatalogue}
                onAddService={handleAddService}
              />
            )}

            {/* 11. Payments & Treasury */}
            {currentTab === 'payments' && (
              <PaymentsLedgerView
                payments={payments}
                bookings={bookings}
                onAddPayment={handleAddPayment}
                onRefundSecurityDeposit={handleRefundSecurityDeposit}
              />
            )}

            {/* 12. Expenses Ledger */}
            {currentTab === 'expenses' && (
              <ExpensesView
                expenses={expenses}
                bookings={bookings}
                onAddExpense={handleAddExpense}
              />
            )}

            {/* 13. Inventory & Supplies */}
            {currentTab === 'inventory' && (
              <InventoryView
                inventory={inventory}
                onUpdateItemQuantity={handleUpdateInventoryQty}
                onAddItem={handleAddInventoryItem}
              />
            )}

            {/* 14. Staff & Labor Management */}
            {currentTab === 'staff' && (
              <StaffView
                staff={staff}
                bookings={bookings}
                onAddStaff={handleAddStaff}
                onUpdateStaffAttendance={handleUpdateStaffAttendance}
              />
            )}

            {/* 15. Reports & Profit Analytics */}
            {currentTab === 'reports' && (
              <ReportsView
                bookings={bookings}
                expenses={expenses}
                payments={payments}
                inventory={inventory}
                staff={staff}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bilingual Responsive Footer */}
      <footer className="w-full border-t border-amber-500/15 bg-slate-950 py-10 px-4 text-xs text-slate-400 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              <span className="text-amber-300 font-serif font-black tracking-wider text-sm">SARAYA EVENT</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-semibold">{language === 'ar' ? 'السرايا للمناسبات وقاعات الأفراح الملكية في مصر' : 'Luxury Weddings & Halls Management Egypt'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'ar'
                ? 'القاهرة الجديدة (الطريق الدائري) · الكورنيش (الإسكندرية) · هاتف: 27950000 2 20+ · واتساب: 4567 123 100 20+'
                : 'Ring Road, New Cairo · Corniche, Alexandria · Hotline: +20 2 2795 0000 · WhatsApp: +20 100 123 4567'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 text-slate-400 font-mono text-[11px]">
            <span>{language === 'ar' ? '4 قاعات فندقية مستقلة' : '4 Independent Royal Halls'}</span>
            <span>·</span>
            <span>{language === 'ar' ? 'عزل صوتي 65dB' : '65dB Acoustic Isolation'}</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                sound.click(650);
                setCurrentTab(currentTab === 'home' ? 'dashboard' : 'home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-amber-400 hover:text-amber-300 underline font-sans"
            >
              {currentTab === 'home'
                ? (language === 'ar' ? 'بوابة إدارة القاعات للموظفين' : 'Staff Portal')
                : (language === 'ar' ? 'العودة لموقع العملاء' : 'Customer Website')}
            </button>
            <span>·</span>
            <span>© 2026 SARAYA EVENT</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        halls={halls}
        servicesCatalogue={servicesCatalogue}
        existingBookings={bookings}
        onCreateBooking={handleCreateBooking}
        preselectedHallId={preselectedHallId}
      />

      <EventProfitCalculatorModal
        isOpen={!!selectedBookingForProfit}
        onClose={() => setSelectedBookingForProfit(null)}
        booking={selectedBookingForProfit}
        onUpdateBookingCosts={handleUpdateBookingCosts}
      />

      <InvoicePrintModal
        isOpen={!!selectedBookingForInvoice}
        onClose={() => setSelectedBookingForInvoice(null)}
        booking={selectedBookingForInvoice}
      />

      <OnboardingFlow
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
