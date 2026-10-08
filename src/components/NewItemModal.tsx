import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, MapPin, Sparkles, Mic, Tv, Lightbulb, Volume2 } from 'lucide-react';
import { RunsheetItem, EventPhase } from '../types/event';
import { sound } from '../utils/soundEffects';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (newItem: RunsheetItem) => void;
}

export function NewItemModal({ isOpen, onClose, onAddItem }: NewItemModalProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('11:00');
  const [duration, setDuration] = useState(30);
  const [category, setCategory] = useState<RunsheetItem['category']>('Stage');
  const [phase, setPhase] = useState<EventPhase>('keynote');
  const [leadPerson, setLeadPerson] = useState('');
  const [location, setLocation] = useState('Main Stage');
  const [description, setDescription] = useState('');
  const [audioCue, setAudioCue] = useState('Mic open on walkup');
  const [lightingCue, setLightingCue] = useState('Keylight follow spot');
  const [videoCue, setVideoCue] = useState('8K Title graphic');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    sound.success();
    const newItem: RunsheetItem = {
      id: `rs-${Date.now()}`,
      title: title.trim(),
      time,
      durationMinutes: Number(duration) || 15,
      category,
      phase,
      leadPerson: leadPerson.trim() || 'Stage Director',
      location: location.trim() || 'Auditorium',
      description: description.trim() || 'Live stage segment.',
      status: 'upcoming',
      avCues: {
        audio: audioCue.trim() || 'Standard mic feed',
        lighting: lightingCue.trim() || 'Stage wash',
        video: videoCue.trim() || 'Static backdrop',
      },
    };

    onAddItem(newItem);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 my-8"
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
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Add Timeline Runsheet Cue</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Input chronological cue timing, speaker leads, and AV booth triggers.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cue Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CEO Keynote Presentation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Channel Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RunsheetItem['category'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Stage">Stage</option>
                  <option value="AV/Tech">AV/Tech</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Catering">Catering</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lead Speaker / Anchor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  value={leadPerson}
                  onChange={(e) => setLeadPerson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specific Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auditorium Riser B"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Director Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key choreography details, props, walk-up instructions..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* AV Technical Cues Section */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-indigo-400 block mb-2">
                AV Control Booth Dispatch
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Audio Cue"
                  value={audioCue}
                  onChange={(e) => setAudioCue(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Lighting Cue"
                  value={lightingCue}
                  onChange={(e) => setLightingCue(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Video Screen Cue"
                  value={videoCue}
                  onChange={(e) => setVideoCue(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
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
                Append to Runsheet
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
