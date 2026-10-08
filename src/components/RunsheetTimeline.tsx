import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Volume2,
  Tv,
  Lightbulb,
  Search,
  Filter,
  Plus,
  Radio,
  MapPin,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RunsheetItem, CueStatus } from '../types/event';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface RunsheetTimelineProps {
  items: RunsheetItem[];
  onUpdateItemStatus: (itemId: string, newStatus: CueStatus) => void;
  onAddItem: () => void;
  onSelectRehearsalItem?: (itemId: string) => void;
}

export function RunsheetTimeline({
  items,
  onUpdateItemStatus,
  onAddItem,
  onSelectRehearsalItem,
}: RunsheetTimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(items[2]?.id || null);
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = ['all', 'Stage', 'AV/Tech', 'Lighting', 'Catering', 'VIP'];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.leadPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStatusClick = (item: RunsheetItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle: Record<CueStatus, CueStatus> = {
      upcoming: 'standby',
      standby: 'live',
      live: 'completed',
      completed: 'upcoming',
    };
    const nextStatus = cycle[item.status];
    onUpdateItemStatus(item.id, nextStatus);

    if (nextStatus === 'live') {
      sound.stageCue();
    } else if (nextStatus === 'completed') {
      sound.success();
      // Burst celebratory micro confetti at mouse location
      try {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        confetti({
          particleCount: 28,
          spread: 60,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: ['#6366f1', '#a855f7', '#fbbf24', '#34d399'],
        });
      } catch {
        // Safe fail
      }
    } else {
      sound.click(550);
    }
  };

  const toggleExpand = (itemId: string) => {
    sound.tick();
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const getStatusBadge = (status: CueStatus) => {
    switch (status) {
      case 'live':
        return {
          label: 'ON AIR · LIVE',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400 animate-ping',
        };
      case 'standby':
        return {
          label: 'STANDBY CUE',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'completed':
        return {
          label: 'EXECUTED',
          color: 'bg-slate-800 text-slate-400 border-slate-700/60',
          dot: 'bg-slate-500',
        };
      default:
        return {
          label: 'UPCOMING',
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          dot: 'bg-indigo-400',
        };
    }
  };

  return (
    <div ref={containerRef} className="relative w-full pb-20">
      {/* Controls & Filter Bar - Zero horizontal scroll on mobile */}
      <div className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm w-full">
        {/* Search with responsive focus ring */}
        <div className="relative flex-1 max-w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search cues, audio feeds, speakers, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category Segmented Buttons - Clean flex-wrap with zero horizontal scroll */}
        <div className="flex flex-wrap items-center gap-1.5 py-1 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 hidden sm:block" />
          {categories.map((cat) => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                sound.click(500);
                setSelectedCategory(cat);
              }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat === 'all' ? 'All Channels' : cat}
            </motion.button>
          ))}
        </div>

        {/* Add Cue CTA */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            sound.click(600);
            onAddItem();
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Cue Item</span>
        </motion.button>
      </div>

      {/* Main Runsheet Timeline Spine */}
      <div className="relative pl-6 sm:pl-10 md:pl-16">
        {/* Continuous laser spine line */}
        <div className="absolute top-2 bottom-2 left-3 sm:left-5 md:left-8 w-0.5 bg-gradient-to-b from-indigo-500/40 via-violet-500/30 to-amber-500/20" />

        {/* Runsheet Cards with Scroll In-View Motion */}
        <div className="space-y-6">
          {filteredItems.map((item, index) => {
            const statusBadge = getStatusBadge(item.status);
            const isLive = item.status === 'live';
            const isExpanded = expandedItemId === item.id;

            return (
              <motion.div
                key={item.id}
                id={`runsheet-${item.id}`}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: '-40px' }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(0.2, (index % 4) * 0.05),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative group"
              >
                {/* Node beacon on the spine */}
                <div
                  onClick={(e) => handleStatusClick(item, e)}
                  title="Click to cycle cue execution status"
                  className={`absolute -left-6 sm:-left-10 md:-left-16 top-5 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all duration-300 z-10 ${
                    isLive
                      ? 'bg-emerald-950 border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)] scale-110'
                      : item.status === 'completed'
                      ? 'bg-slate-900 border-indigo-400 text-indigo-400'
                      : item.status === 'standby'
                      ? 'bg-amber-950 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                      : 'bg-slate-950 border-slate-700 group-hover:border-indigo-400'
                  }`}
                >
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  ) : isLive ? (
                    <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                  ) : item.status === 'standby' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-500 group-hover:bg-indigo-400 transition-colors" />
                  )}
                </div>

                {/* 3D Interactive Tilt Card for Runsheet Item */}
                <TiltCard
                  tiltMax={4}
                  scaleOnHover={1.01}
                  className={`rounded-2xl border transition-all duration-300 ${
                    isLive
                      ? 'bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border-emerald-500/40 shadow-xl shadow-emerald-950/30'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700/90 shadow-lg'
                  }`}
                >
                  <div className="p-5 sm:p-6">
                    {/* Header Row: Time, Category, Status, Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Time Pill */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 font-semibold tabular-nums">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>{item.time}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 font-normal">{item.durationMinutes}m</span>
                        </div>

                        {/* Category Label */}
                        <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/50">
                          {item.category}
                        </span>

                        <span className="text-slate-600 hidden sm:inline">·</span>

                        {/* Location */}
                        <span className="text-xs text-slate-400 flex items-center gap-1 hidden sm:flex">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{item.location}</span>
                        </span>
                      </div>

                      {/* Right Action & Status Badge */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleStatusClick(item, e)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${statusBadge.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          <span>{statusBadge.label}</span>
                        </button>

                        {onSelectRehearsalItem && (
                          <button
                            onClick={() => {
                              sound.stageCue();
                              onSelectRehearsalItem(item.id);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Open in Live Rehearsal View"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          aria-label={isExpanded ? 'Collapse item details' : 'Expand item details'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h3
                        onClick={() => toggleExpand(item.id)}
                        className="text-base sm:text-lg font-semibold text-slate-100 hover:text-indigo-300 transition-colors cursor-pointer leading-snug"
                      >
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Lead Person & Key Info Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Director/Lead:</span>
                        <span className="text-slate-200 font-medium">{item.leadPerson}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Volume2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-32">{item.avCues.audio.slice(0, 22)}...</span>
                        </span>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                        >
                          {isExpanded ? 'Hide AV Script' : 'Full AV Script →'}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Technical AV Cues Drawer */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden mt-4 pt-4 border-t border-slate-800/80"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
                            {/* Audio Cue */}
                            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                              <Volume2 className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-400 font-mono">
                                  Sound / Audio Cue
                                </span>
                                <p className="text-xs text-slate-300 mt-0.5">
                                  {item.avCues.audio}
                                </p>
                              </div>
                            </div>

                            {/* Lighting Cue */}
                            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 font-mono">
                                  Lighting Rig Wash
                                </span>
                                <p className="text-xs text-slate-300 mt-0.5">
                                  {item.avCues.lighting}
                                </p>
                              </div>
                            </div>

                            {/* Video / Display Cue */}
                            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                              <Tv className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-400 font-mono">
                                  LED Screen / Projection
                                </span>
                                <p className="text-xs text-slate-300 mt-0.5">
                                  {item.avCues.video}
                                </p>
                              </div>
                            </div>
                          </div>

                          {item.notes && (
                            <div className="mt-3 px-3 py-2 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300 flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              <span>Backstage Note: {item.notes}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium text-sm">No runsheet cues match your criteria</p>
            <p className="text-slate-500 text-xs mt-1">Try resetting search filters or add a new timeline cue.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
