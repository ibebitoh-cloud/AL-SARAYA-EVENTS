import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { Guest, TableAssignment } from '../types/event';
import { sound } from '../utils/soundEffects';

interface NewGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableAssignment[];
  onAddGuest: (newGuest: Guest) => void;
}

export function NewGuestModal({ isOpen, onClose, tables, onAddGuest }: NewGuestModalProps) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<Guest['role']>('VIP Speaker');
  const [dietary, setDietary] = useState<Guest['dietary']>('Standard');
  const [selectedTableId, setSelectedTableId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.success();
    const newGuest: Guest = {
      id: `g-${Date.now()}`,
      name: name.trim(),
      organization: organization.trim() || 'Independent',
      role,
      status: 'confirmed',
      dietary,
      tableId: selectedTableId || undefined,
      avatarSeed: name.toLowerCase().replace(/\s+/g, '-'),
    };

    onAddGuest(newGuest);
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
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Register New Attendee</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Add credential credentials, dietary preferences, and seating assignment.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Helena Thorne"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organization / Company
              </label>
              <input
                type="text"
                placeholder="e.g. Quantum AI Labs"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Credential Tier
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Guest['role'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="VIP Speaker">VIP Speaker</option>
                  <option value="Keynote Guest">Keynote Guest</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Media Press">Media Press</option>
                  <option value="Attendee">Attendee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dietary Need
                </label>
                <select
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value as Guest['dietary'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Standard">Standard</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                  <option value="Halal">Halal</option>
                  <option value="Kosher">Kosher</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assign Seating Table (Optional)
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned Floor Pool</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.assignedGuestIds.length}/{t.capacity} seated)
                  </option>
                ))}
              </select>
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
                Confirm RSVP
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
