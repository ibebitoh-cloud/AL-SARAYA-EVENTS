import { useState } from 'react';
import { Volume2, VolumeX, Calendar, Plus, Sparkles, ChevronDown, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { sound } from '../utils/soundEffects';
import { EventDetails } from '../types/event';

export type ActiveTab = 'runsheet' | 'floorplan' | 'rehearsal' | 'budget' | 'guests';

interface HeaderNavProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  events: EventDetails[];
  selectedEvent: EventDetails;
  onSelectEvent: (event: EventDetails) => void;
  onOpenNewEventModal: () => void;
  onOpenOnboarding: () => void;
}

export function HeaderNav({
  currentTab,
  onTabChange,
  events,
  selectedEvent,
  onSelectEvent,
  onOpenNewEventModal,
  onOpenOnboarding,
}: HeaderNavProps) {
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) {
      sound.click(650);
    }
  };

  const navLinks: { id: ActiveTab; label: string }[] = [
    { id: 'runsheet', label: 'Runsheet' },
    { id: 'floorplan', label: 'Floor Plan' },
    { id: 'rehearsal', label: 'Live Rehearsal' },
    { id: 'budget', label: 'Vendors & Budget' },
    { id: 'guests', label: 'Guest RSVP' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.a
            href="#"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.preventDefault();
              sound.swoosh();
              onTabChange('runsheet');
            }}
            className="text-lg font-bold tracking-tight text-white hover:text-indigo-400 transition-colors flex items-center gap-2 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span>AuraEvent</span>
          </motion.a>

          {/* Quick Event Switcher Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02, borderColor: 'rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.click(500);
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer truncate max-w-48"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{selectedEvent.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            </motion.button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute left-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50 overflow-hidden"
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Active Productions
                  </div>
                  {events.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => {
                        sound.click(600);
                        onSelectEvent(evt);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                        evt.id === selectedEvent.id
                          ? 'bg-indigo-600/15 text-indigo-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{evt.name}</span>
                      {evt.id === selectedEvent.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="p-1.5 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenNewEventModal();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Event</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          {navLinks.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sound.swoosh();
                  onTabChange(tab.id);
                }}
                className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </motion.button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          {/* Interactive Onboarding Tour Trigger */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.click(620);
              onOpenOnboarding();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 hover:text-white transition-all cursor-pointer whitespace-nowrap shadow-xs"
            title="Launch animated interactive tour"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '20s' }} />
            <span>Interactive Tour</span>
          </motion.button>

          {/* Sound Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute UI sounds' : 'Enable UI sounds'}
            title={soundEnabled ? 'Tactile sound active' : 'Audio muted'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/60'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </motion.button>

          {/* New Event Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              sound.click(700);
              onOpenNewEventModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>New Production</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile nav bar row - zero horizontal scroll, perfect iPhone fit */}
      <div className="grid grid-cols-5 md:hidden px-2 py-1.5 border-t border-slate-900 gap-1 bg-slate-950/95 w-full">
        {navLinks.map((tab) => {
          const isActive = currentTab === tab.id;
          const shortLabel =
            tab.id === 'runsheet'
              ? 'Runsheet'
              : tab.id === 'floorplan'
              ? 'Floor'
              : tab.id === 'rehearsal'
              ? 'Live Cue'
              : tab.id === 'budget'
              ? 'Budget'
              : 'RSVP';

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                sound.swoosh();
                onTabChange(tab.id);
              }}
              className={`py-1.5 px-1 text-[11px] font-medium rounded-lg text-center truncate transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 bg-slate-900/60 hover:text-white'
              }`}
            >
              {shortLabel}
            </motion.button>
          );
        })}
      </div>
    </header>
  );
}

