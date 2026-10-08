import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Shield,
  Plus,
  Check,
} from 'lucide-react';
import { Booking, Hall, ServiceDefinition, EventType } from '../types/venueSystem';
import { sound } from '../utils/soundEffects';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  halls: Hall[];
  servicesCatalogue: ServiceDefinition[];
  existingBookings: Booking[];
  onCreateBooking: (newBooking: Booking) => void;
  preselectedHallId?: string;
}

export function NewBookingModal({
  isOpen,
  onClose,
  halls,
  servicesCatalogue,
  existingBookings,
  onCreateBooking,
  preselectedHallId,
}: NewBookingModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [date, setDate] = useState('2026-11-15');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:30');
  const initialHall = halls.find(h => h.id === preselectedHallId) || halls[0];
  const [hallId, setHallId] = useState(initialHall?.id || 'hall-1');
  const [guestCount, setGuestCount] = useState(350);
  const [basePrice, setBasePrice] = useState(initialHall?.basePrice || 45000);
  const [deposit, setDeposit] = useState(15000);
  const [securityDeposit, setSecurityDeposit] = useState(5000);
  const [status, setStatus] = useState<'confirmed' | 'tentative'>('confirmed');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (preselectedHallId) {
      const found = halls.find((h) => h.id === preselectedHallId);
      if (found) {
        setHallId(found.id);
        setBasePrice(found.basePrice);
      }
    }
  }, [preselectedHallId, halls]);

  // Selected services state: map of serviceId -> quantity
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  // Selected hall object
  const currentHall = halls.find((h) => h.id === hallId) || halls[0];

  // Schedule conflict detection
  const conflictingBooking = existingBookings.find(
    (b) =>
      b.status !== 'cancelled' &&
      b.hallId === hallId &&
      b.date === date &&
      ((startTime >= b.startTime && startTime < b.endTime) ||
        (endTime > b.startTime && endTime <= b.endTime) ||
        (startTime <= b.startTime && endTime >= b.endTime))
  );

  const toggleService = (srv: ServiceDefinition) => {
    sound.tick();
    setSelectedServices((prev) => {
      const copy = { ...prev };
      if (copy[srv.id]) {
        delete copy[srv.id];
      } else {
        copy[srv.id] = srv.category === 'buffet' ? guestCount : 1;
      }
      return copy;
    });
  };

  const updateServiceQty = (serviceId: string, qty: number) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: Math.max(1, qty),
    }));
  };

  // Calculate services total
  const calculatedServices = Object.entries(selectedServices).map(([srvId, qty]) => {
    const srvDef = servicesCatalogue.find((s) => s.id === srvId)!;
    return {
      id: `bs-${Date.now()}-${srvId}`,
      serviceId: srvId,
      name: srvDef.name,
      quantity: qty,
      unitPrice: srvDef.defaultPrice,
      costPrice: srvDef.defaultCost,
      totalPrice: srvDef.defaultPrice * qty,
      totalCost: srvDef.defaultCost * qty,
    };
  });

  const servicesTotal = calculatedServices.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalPrice = basePrice + servicesTotal;
  const remainingAmount = Math.max(0, totalPrice - deposit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;

    sound.success();
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      code: `BK-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      eventType,
      date,
      startTime,
      endTime,
      hallId,
      hallName: currentHall.name,
      guestCount: Number(guestCount) || 200,
      basePrice: Number(basePrice) || 20000,
      services: calculatedServices,
      totalPrice,
      deposit: Number(deposit) || 0,
      paidAmount: Number(deposit) || 0,
      remainingAmount,
      securityDeposit: Number(securityDeposit) || 3000,
      securityDepositStatus: 'held',
      status,
      notes: notes.trim(),
      assignedStaff: [],
      suppliesCost: 2000,
      directExpenses: 1000,
    };

    onCreateBooking(newBooking);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-8 text-right my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={() => {
              onClose();
              sound.tick();
              }}
            className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">تسجيل حجز مناسبة وقاعة جديد</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            تسجيل بيانات العميل، اختيار القاعة، تحديد باقة الخدمات والإضافات، وإثبات العربون والتأمين.
          </p>

          {/* Conflict Alert Banner */}
          {conflictingBooking && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block text-rose-300 font-bold">تنبيه: يوجد تعارض في المواعيد بالقاعة المحددة!</strong>
                <span>
                  القاعة محجوزة مسبقاً بنفس اليوم باسم ({conflictingBooking.clientName}) من {conflictingBooking.startTime} إلى {conflictingBooking.endTime}.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Client Info Section */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400">1. بيانات العميل والتواصل</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    اسم العميل *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد السيد النجار"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010XXXXXXXX"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    العنوان / المنطقة
                  </label>
                  <input
                    type="text"
                    placeholder="التجمع الخامس / المعادي"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Event & Hall Logistics */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400">2. تفاصيل المناسبة والقاعة</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    نوع المناسبة
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="wedding">حفل زفاف (فرح)</option>
                    <option value="engagement">حفل خطوبة</option>
                    <option value="birthday">عيد ميلاد</option>
                    <option value="conference">مؤتمر / ندوة</option>
                    <option value="party">حفلة تخرج / خاصة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    القاعة المحجوزة
                  </label>
                  <select
                    value={hallId}
                    onChange={(e) => {
                      setHallId(e.target.value);
                      const h = halls.find((item) => item.id === e.target.value);
                      if (h) setBasePrice(h.basePrice);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {halls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (سعة {h.capacity} فرد - {h.basePrice.toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    عدد المدعوين المتوقع
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    تاريخ المناسبة
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    وقت البداية
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    وقت النهاية
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Add-on Services Checklist */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-400">3. الخدمات والإضافات المختارة</h4>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  إجمالي الخدمات: {servicesTotal.toLocaleString()} ج.م
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {servicesCatalogue.map((srv) => {
                  const isChecked = !!selectedServices[srv.id];
                  const qty = selectedServices[srv.id] || 1;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                        isChecked
                          ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-xs'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="font-medium line-clamp-1">{srv.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isChecked && (
                          <input
                            type="number"
                            min="1"
                            value={qty}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateServiceQty(srv.id, Number(e.target.value) || 1)}
                            className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono text-xs text-white"
                          />
                        )}
                        <span className="font-mono text-indigo-300 font-bold">
                          {srv.defaultPrice.toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Financial Tally, Deposit & Security Deposit */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400">4. الحسابات، العربون، والتأمين</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    سعر القاعة الأساسي
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    العربون المدفوع الآن
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    مبلغ التأمين (مسترد)
                  </label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    حالة الحجز
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'confirmed' | 'tentative')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="confirmed">مؤكد</option>
                    <option value="tentative">مبدئي</option>
                  </select>
                </div>
              </div>

              {/* Real-time Summary Pill */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-xs font-mono text-slate-200">
                <span>إجمالي الحجز + الخدمات: <strong>{totalPrice.toLocaleString()} ج.م</strong></span>
                <span className="text-emerald-400">المدفوع (عربون): <strong>{deposit.toLocaleString()} ج.م</strong></span>
                <span className="text-rose-400">المتبقي للتحصيل: <strong>{remainingAmount.toLocaleString()} ج.م</strong></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ملاحظات الحجز أو طلبات خاصة من العميل
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="تفاصيل الترتيبات، تفضيلات الزفة، مواعيد التسليم والتجهيز..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                حفظ وتسجيل الحجز رسمياً
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
