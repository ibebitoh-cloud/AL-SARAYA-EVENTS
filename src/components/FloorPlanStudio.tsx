import { useState, useRef, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Users, Plus, ShieldCheck, Sparkles, UserCheck, Utensils, Maximize2 } from 'lucide-react';
import { TableAssignment, Guest } from '../types/event';
import { sound } from '../utils/soundEffects';

interface FloorPlanStudioProps {
  tables: TableAssignment[];
  guests: Guest[];
  onAssignGuestToTable: (guestId: string, tableId: string) => void;
  onRemoveGuestFromTable: (guestId: string) => void;
  onAddTable: (newTable: TableAssignment) => void;
}

export function FloorPlanStudio({
  tables,
  guests,
  onAssignGuestToTable,
  onRemoveGuestFromTable,
  onAddTable,
}: FloorPlanStudioProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(tables[0]?.id || null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  // Mouse tilt for the 3D venue floor
  const floorRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { damping: 25, stiffness: 180 });
  const springY = useSpring(mouseY, { damping: 25, stiffness: 180 });

  const rotateX = useTransform(springY, [-300, 300], [14, -14]);
  const rotateY = useTransform(springX, [-500, 500], [-18, 18]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!is3DMode || !floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];
  const assignedGuests = guests.filter((g) => selectedTable?.assignedGuestIds.includes(g.id));
  const unseatedGuests = guests.filter((g) => !g.tableId);

  const totalSeats = tables.reduce((acc, t) => acc + t.capacity, 0);
  const occupiedSeats = tables.reduce((acc, t) => acc + t.assignedGuestIds.length, 0);
  const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  const categories = ['all', 'VIP & Speakers', 'Corporate Sponsors', 'Media & Press', 'General Floor'];

  const filteredTables = tables.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory
  );

  const handleCreateTable = () => {
    sound.click(650);
    const newId = `tbl-${Date.now()}`;
    const newTable: TableAssignment = {
      id: newId,
      name: `Table ${tables.length + 1} (Pavilion)`,
      shape: 'round',
      capacity: 8,
      posX: 340,
      posY: 380,
      category: 'General Floor',
      assignedGuestIds: [],
    };
    onAddTable(newTable);
    setSelectedTableId(newId);
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Top Controls & Metrics */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>Spatial Seating & 3D Stage Studio</span>
            <span className="text-xs font-normal text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-full">
              Isometric Mode
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Move mouse across canvas to orbit 3D stage. Click tables to inspect attendee seating and dietary allocations.
          </p>
        </div>

        {/* Global Seating Capacity Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Total Venue Occupancy
            </span>
            <span className="text-xs text-slate-200 font-semibold tabular-nums">
              {occupiedSeats} / {totalSeats} Seated ({occupancyRate}%)
            </span>
          </div>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancyRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
            />
          </div>

          <button
            onClick={() => {
              sound.tick();
              setIs3DMode(!is3DMode);
            }}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
              is3DMode
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-700/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span>{is3DMode ? '3D Tilt ON' : 'Flat 2D'}</span>
          </button>
        </div>
      </div>

      {/* Main Floor Grid & Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Interactive 3D Canvas (2 Cols) */}
        <div className="lg:col-span-2 space-y-3 w-full min-w-0">
          {/* Category Filter Tabs - Wrap cleanly on mobile, zero horizontal scroll */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1 w-full">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  sound.click(520);
                  setActiveCategory(cat);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 bg-slate-900/60 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Tables' : cat}
              </motion.button>
            ))}

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleCreateTable}
              className="ml-auto px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>Add Table</span>
            </motion.button>
          </div>

          {/* 3D Perspective Box */}
          <div
            ref={floorRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full h-[460px] sm:h-[580px] rounded-3xl bg-slate-950/90 border border-slate-800/80 overflow-hidden shadow-2xl p-3 sm:p-6 flex flex-col perspective-1000 select-none"
          >
            {/* Grid background floor lines */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Transforming 3D Plane */}
            <motion.div
              style={{
                transformStyle: 'preserve-3d',
                rotateX: is3DMode ? rotateX : 0,
                rotateY: is3DMode ? rotateY : 0,
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              className="relative w-full h-full flex flex-col justify-between"
            >
              {/* Main Stage & Podiums */}
              <div className="w-full flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative w-11/12 max-w-md py-2 sm:py-3 px-3 sm:px-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-violet-900/80 to-indigo-900/60 border border-indigo-500/40 text-center shadow-[0_0_30px_rgba(99,102,241,0.25)]"
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-1 bg-indigo-400 rounded-full shadow-[0_0_12px_rgba(129,140,248,1)]" />
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-indigo-300 font-semibold">
                    MAIN KEYNOTE STAGE & 8K LED WALL
                  </span>
                  <div className="flex items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-300 mt-0.5 font-mono">
                    <span className="hidden sm:inline">Podium Left</span>
                    <span className="text-indigo-400 font-semibold">· CENTER RISER ·</span>
                    <span className="hidden sm:inline">Demo Pod Right</span>
                  </div>
                </motion.div>
                {/* Stage Lighting Beams */}
                <div className="w-full max-w-sm h-8 sm:h-12 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
              </div>

              {/* Table Arena Grid - Clean responsive iPhone sizing */}
              <div className="relative flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 items-center justify-items-center py-2 sm:py-4">
                {filteredTables.map((tbl) => {
                  const isSelected = tbl.id === selectedTableId;
                  const isFull = tbl.assignedGuestIds.length >= tbl.capacity;
                  const seatPct = Math.round((tbl.assignedGuestIds.length / tbl.capacity) * 100);

                  return (
                    <motion.div
                      key={tbl.id}
                      onClick={() => {
                        sound.click(600);
                        setSelectedTableId(tbl.id);
                      }}
                      whileHover={{ scale: 1.06, y: -4 }}
                      whileTap={{ scale: 0.94 }}
                      className={`relative cursor-pointer transition-all duration-300 p-2 sm:p-4 rounded-2xl flex flex-col items-center justify-center text-center ${
                        tbl.shape === 'round'
                          ? 'w-28 h-28 sm:w-36 sm:h-36 rounded-full'
                          : 'w-32 h-26 sm:w-44 sm:h-32 rounded-2xl'
                      } ${
                        isSelected
                          ? 'bg-gradient-to-b from-indigo-600/30 to-violet-900/40 border-2 border-indigo-400 shadow-[0_0_24px_rgba(99,102,241,0.5)]'
                          : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-md'
                      }`}
                    >
                      {/* Orbital Seat Nodes around Table */}
                      <div className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: tbl.capacity }).map((_, seatIdx) => {
                          const angle = (seatIdx / tbl.capacity) * 2 * Math.PI;
                          const isOccupied = seatIdx < tbl.assignedGuestIds.length;
                          // Responsive radius
                          const radius = tbl.shape === 'round' ? 52 : 58;
                          const x = Math.cos(angle) * radius;
                          const y = Math.sin(angle) * radius;

                          return (
                            <div
                              key={seatIdx}
                              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full border transition-all ${
                                isOccupied
                                  ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                  : 'bg-slate-800 border-slate-700'
                              }`}
                              style={{
                                transform: `translate(${x}px, ${y}px)`,
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Table Inner Info */}
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-100 line-clamp-1 px-1">
                        {tbl.name}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-indigo-300 uppercase tracking-wider font-mono">
                        {tbl.category.split(' ')[0]}
                      </span>

                      <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-slate-300 tabular-nums">
                        <Users className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-slate-400" />
                        <span>
                          {tbl.assignedGuestIds.length}/{tbl.capacity}
                        </span>
                      </div>

                      {/* Mini Capacity Ring */}
                      <div className="w-10 sm:w-12 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            isFull
                              ? 'bg-emerald-400'
                              : seatPct > 50
                              ? 'bg-indigo-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${seatPct}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Floor Status Footer */}
              <div className="w-full flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 font-mono pt-1 sm:pt-2 border-t border-slate-900">
                <span className="truncate">[FOH CONSOLE]</span>
                <span className="text-indigo-400 truncate px-1">MAIN AISLE</span>
                <span className="truncate">[MEZZANINE]</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Selected Table Inspector & Guest Assignment Drawer */}
        <div className="space-y-4">
          {selectedTable ? (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{selectedTable.name}</h3>
                  <span className="text-xs text-indigo-400 font-mono">{selectedTable.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-300 font-bold tabular-nums">
                    {assignedGuests.length} / {selectedTable.capacity} Seated
                  </span>
                  <div className="text-[10px] text-slate-500">
                    {selectedTable.capacity - assignedGuests.length} seats free
                  </div>
                </div>
              </div>

              {/* Dietary Stats for Table */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dietary Requirements:</span>
                </span>
                <span className="text-slate-200 font-medium">
                  {assignedGuests.filter((g) => g.dietary !== 'Standard').length > 0
                    ? `${assignedGuests.filter((g) => g.dietary !== 'Standard').length} Special Diets`
                    : 'All Standard'}
                </span>
              </div>

              {/* Seated Guests List */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Seated Attendees
                </h4>
                {assignedGuests.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No attendees assigned to this table yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {assignedGuests.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                            {guest.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-slate-200 block">{guest.name}</span>
                            <span className="text-[10px] text-slate-400">{guest.organization}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {guest.dietary !== 'Standard' && (
                            <span className="text-[10px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10">
                              {guest.dietary}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              sound.tick();
                              onRemoveGuestFromTable(guest.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 text-[11px] cursor-pointer"
                            title="Unseat attendee"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Assign From Unseated Pool */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Unassigned Guests Pool ({unseatedGuests.length})
                  </h4>
                </div>

                {unseatedGuests.length === 0 ? (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5 py-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>All guests have confirmed table seating!</span>
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {unseatedGuests.slice(0, 5).map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:bg-slate-950 text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-200 block">{guest.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {guest.role} · {guest.dietary}
                          </span>
                        </div>
                        <button
                          disabled={assignedGuests.length >= selectedTable.capacity}
                          onClick={() => {
                            sound.success();
                            onAssignGuestToTable(guest.id, selectedTable.id);
                          }}
                          className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                            assignedGuests.length >= selectedTable.capacity
                              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          Seat Here
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-500">
              Select a table from the floor to inspect seating.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
