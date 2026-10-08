import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2 } from 'lucide-react';
import { Vendor } from '../types/event';
import { sound } from '../utils/soundEffects';

interface NewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVendor: (newVendor: Vendor) => void;
}

export function NewVendorModal({ isOpen, onClose, onAddVendor }: NewVendorModalProps) {
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [budgetAllocated, setBudgetAllocated] = useState(15000);
  const [arrivalWindow, setArrivalWindow] = useState('07:30 - 08:30');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.success();
    const newVendor: Vendor = {
      id: `vnd-${Date.now()}`,
      name: name.trim(),
      service: service.trim() || 'General Production Contractor',
      contactName: contactName.trim() || 'Site Supervisor',
      phone: phone.trim() || '+1 (555) 000-0000',
      budgetAllocated: Number(budgetAllocated) || 10000,
      spent: 0,
      status: 'confirmed',
      arrivalWindow: arrivalWindow.trim() || '08:00 - 09:00',
    };

    onAddVendor(newVendor);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8"
        >
          <button
            onClick={() => {
              sound.tick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Onboard Production Vendor</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Log vendor contracts, arrival timeframes, and allocated spending caps.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vendor Company / Service Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Visual Projections"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Service Description
              </label>
              <input
                type="text"
                placeholder="e.g. 4K LED Screen & Truss Rigging"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Point of Contact
                </label>
                <input
                  type="text"
                  placeholder="e.g. James Cole"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Allocated Cap ($ USD)
                </label>
                <input
                  type="number"
                  value={budgetAllocated}
                  onChange={(e) => setBudgetAllocated(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Arrival Window
                </label>
                <input
                  type="text"
                  placeholder="07:00 - 08:30"
                  value={arrivalWindow}
                  onChange={(e) => setArrivalWindow(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Onboard Contractor
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
