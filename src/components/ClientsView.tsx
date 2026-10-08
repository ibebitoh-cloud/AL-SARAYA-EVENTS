import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Calendar,
  Receipt,
  DollarSign,
  AlertCircle,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import { ClientProfile, Booking } from '../types/venueSystem';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface ClientsViewProps {
  clients: ClientProfile[];
  bookings: Booking[];
  onSelectBookingForInvoice: (booking: Booking) => void;
}

export function ClientsView({
  clients,
  bookings,
  onSelectBookingForInvoice,
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientForStatement, setSelectedClientForStatement] = useState<ClientProfile | null>(null);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 pb-20 text-right">
      {/* Top Search & Metrics */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white">سجل العملاء وكشوف الحسابات</h2>
            <p className="text-xs text-slate-400">متابعة أرصدة العملاء، الحجوزات السابقة، والتأمينات المستحقة</p>
          </div>
        </div>

        <div className="relative flex-1 max-w-full md:max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل، رقم الهاتف، أو العنوان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((client) => {
          const clientBookings = bookings.filter((b) => b.clientName === client.name || b.clientPhone === client.phone);
          const hasDebt = client.currentBalanceDue > 0;

          return (
            <TiltCard
              key={client.id}
              tiltMax={3}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-md"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{client.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{client.address}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.click(600);
                    setSelectedClientForStatement(client);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>كشف الحساب</span>
                </button>
              </div>

              {/* Financial Balance Summary */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70">
                  <span className="text-[10px] text-slate-500 block font-mono">إجمالي التعاملات</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {client.totalSpent.toLocaleString()} ج.م
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70">
                  <span className="text-[10px] text-slate-500 block font-mono">المتبقي عليه</span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      hasDebt ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {hasDebt ? `${client.currentBalanceDue.toLocaleString()} ج.م` : 'خالص'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70">
                  <span className="text-[10px] text-slate-500 block font-mono">التأمين المحتجز</span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    {client.heldSecurityDeposit.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              {/* Client Notes & Bookings Count */}
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>عدد الحجوزات المسجلة: <strong className="text-white">{clientBookings.length}</strong></span>
                  <span className="text-indigo-400">عميل نشط</span>
                </div>
                {client.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-950/40 p-2 rounded-lg">
                    {client.notes}
                  </p>
                )}
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* Client Statement Modal (كشف حساب العميل) */}
      <AnimatePresence>
        {selectedClientForStatement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-right my-auto"
            >
              <button
                onClick={() => setSelectedClientForStatement(null)}
                className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>كشف حساب العميل التفصيلي</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  العميل: <strong className="text-white">{selectedClientForStatement.name}</strong> · هاتف: {selectedClientForStatement.phone}
                </p>
              </div>

              {/* Transactions History */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1">
                {bookings
                  .filter((b) => b.clientName === selectedClientForStatement.name)
                  .map((bk) => (
                    <div
                      key={bk.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-400 font-bold">{bk.code}</span>
                          <span className="font-semibold text-white">{bk.hallName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({bk.date})</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          الإجمالي: {bk.totalPrice.toLocaleString()} ج.م · المسدد: {bk.paidAmount.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="text-left font-mono">
                        <span className="text-rose-400 font-bold block">
                          {bk.remainingAmount > 0 ? `متبقي ${bk.remainingAmount.toLocaleString()} ج.م` : 'مسدد بالكامل'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedClientForStatement(null);
                            onSelectBookingForInvoice(bk);
                          }}
                          className="text-[10px] text-indigo-400 hover:underline mt-0.5 cursor-pointer"
                        >
                          عرض الفاتورة ←
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Balance Totals Footer */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span>إجمالي المسحوبات: <strong>{selectedClientForStatement.totalSpent.toLocaleString()} ج.م</strong></span>
                <span className="text-rose-400">الرصيد المدين المتبقي: <strong>{selectedClientForStatement.currentBalanceDue.toLocaleString()} ج.م</strong></span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
