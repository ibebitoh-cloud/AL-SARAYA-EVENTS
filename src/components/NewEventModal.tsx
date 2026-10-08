import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Sparkles, DollarSign, Users } from 'lucide-react';
import { EventDetails } from '../types/event';
import { sound } from '../utils/soundEffects';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (newEvent: EventDetails) => void;
}

export function NewEventModal({ isOpen, onClose, onCreateEvent }: NewEventModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('2026-11-28');
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('');
  const [targetAttendees, setTargetAttendees] = useState(350);
  const [totalBudget, setTotalBudget] = useState(120000);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.success();
    const newEvent: EventDetails = {
      id: `evt-${Date.now()}`,
      name: name.trim(),
      theme: 'Metropolitan Obsidian & Warm Auric',
      date,
      venueName: venueName.trim() || 'Grand Met Ballroom',
      location: location.trim() || 'Horizon Plaza Center',
      targetAttendees: Number(targetAttendees) || 300,
      totalBudget: Number(totalBudget) || 100000,
      allocatedBudget: Math.round((Number(totalBudget) || 100000) * 0.8),
      runsheet: [
        {
          id: `rs-${Date.now()}-1`,
          time: '08:30',
          durationMinutes: 60,
          title: 'Load-In & Stage Calibration',
          phase: 'setup',
          category: 'AV/Tech',
          description: 'Technical crew checks audio, wireless comms, and video switcher.',
          leadPerson: 'Stage Manager',
          location: 'Main Auditorium',
          status: 'upcoming',
          avCues: {
            audio: 'Line check and intercom comms online',
            lighting: 'Work floodlights',
            video: 'Display test pattern',
          },
        },
        {
          id: `rs-${Date.now()}-2`,
          time: '10:00',
          durationMinutes: 45,
          title: 'Opening Welcome & Keynote Session',
          phase: 'keynote',
          category: 'Stage',
          description: 'Official opening ceremony and introductory keynote presentation.',
          leadPerson: 'Event Host',
          location: 'Center Stage',
          status: 'upcoming',
          avCues: {
            audio: 'Wireless mic feed active with walk-up music sting',
            lighting: 'Warm keylight wash 5600K',
            video: 'Title slide presentation 8K',
          },
        },
      ],
      tables: [
        {
          id: `tbl-${Date.now()}-1`,
          name: 'VIP Table 1',
          shape: 'round',
          capacity: 8,
          posX: 250,
          posY: 220,
          category: 'VIP & Speakers',
          assignedGuestIds: [],
        },
        {
          id: `tbl-${Date.now()}-2`,
          name: 'General Floor Table A',
          shape: 'round',
          capacity: 8,
          posX: 450,
          posY: 220,
          category: 'General Floor',
          assignedGuestIds: [],
        },
      ],
      guests: [
        {
          id: `g-${Date.now()}-1`,
          name: 'Keynote Speaker 1',
          organization: 'Apex Horizons',
          role: 'VIP Speaker',
          status: 'confirmed',
          dietary: 'Standard',
          avatarSeed: 'speaker',
        },
      ],
      vendors: [
        {
          id: `vnd-${Date.now()}-1`,
          name: 'Audio Visual Masters',
          service: 'Main Audio & Projection',
          contactName: 'Alex Mercer',
          phone: '+1 (555) 345-6789',
          budgetAllocated: Math.round(Number(totalBudget) * 0.4),
          spent: Math.round(Number(totalBudget) * 0.35),
          status: 'confirmed',
          arrivalWindow: '07:00 - 08:30',
        },
      ],
    };

    onCreateEvent(newEvent);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              sound.tick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h3 className="text-lg font-bold text-white">New Event Production</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Configure schedule dates, capacity targets, and financial ceilings.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Production / Event Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NextGen Innovators Gala 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Production Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Attendees
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={targetAttendees}
                  onChange={(e) => setTargetAttendees(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Venue & Hall Name
              </label>
              <input
                type="text"
                placeholder="e.g. Metropolitan Grand Ballroom"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Total Budget ($ USD)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Initialize Production
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
