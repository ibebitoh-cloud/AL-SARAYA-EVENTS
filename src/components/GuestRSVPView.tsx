import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Search, CheckCircle2, UserCheck, Plus, Sparkles, Filter, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Guest, TableAssignment } from '../types/event';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface GuestRSVPViewProps {
  guests: Guest[];
  tables: TableAssignment[];
  onToggleGuestStatus: (guestId: string, status: Guest['status']) => void;
  onAddGuest: () => void;
}

export function GuestRSVPView({
  guests,
  tables,
  onToggleGuestStatus,
  onAddGuest,
}: GuestRSVPViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const checkedInCount = guests.filter((g) => g.status === 'checked-in').length;
  const confirmedCount = guests.filter((g) => g.status === 'confirmed').length;
  const totalCount = guests.length;
  const checkInRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const roles = ['all', 'VIP Speaker', 'Keynote Guest', 'Sponsor', 'Media Press', 'Attendee'];
  const statuses = ['all', 'checked-in', 'confirmed', 'pending'];

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || g.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleStatusClick = (guest: Guest, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle: Record<Guest['status'], Guest['status']> = {
      pending: 'confirmed',
      confirmed: 'checked-in',
      'checked-in': 'pending',
      declined: 'confirmed',
    };
    const nextStatus = cycle[guest.status];
    onToggleGuestStatus(guest.id, nextStatus);

    if (nextStatus === 'checked-in') {
      sound.success();
      try {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        confetti({
          particleCount: 25,
          spread: 50,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: ['#34d399', '#6366f1', '#fbbf24'],
        });
      } catch {
        // Safe fail
      }
    } else {
      sound.click(550);
    }
  };

  const getTableName = (tableId?: string) => {
    if (!tableId) return 'Unassigned Table';
    const found = tables.find((t) => t.id === tableId);
    return found ? found.name : 'Table Assigned';
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Check-In Metric Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>VIP & Guest RSVP Concierge</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time door check-ins, dietary tag allocation, and credential verification.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Doors Checked-In</span>
            <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
              {checkedInCount} / {totalCount} ({checkInRate}%)
            </span>
          </div>
          <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${checkInRate}%` }}
              transition={{ duration: 0.6 }}
              className="h-full bg-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search attendee by name, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status / Role Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => {
                  sound.click(500);
                  setStatusFilter(st);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer capitalize ${
                  statusFilter === st ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              sound.click(650);
              onAddGuest();
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Guests High-Density Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map((guest) => {
          const isCheckedIn = guest.status === 'checked-in';
          const isConfirmed = guest.status === 'confirmed';

          return (
            <TiltCard
              key={guest.id}
              tiltMax={4}
              className={`p-4 rounded-2xl border transition-all ${
                isCheckedIn
                  ? 'bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border-emerald-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {guest.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white leading-tight">{guest.name}</h4>
                    <span className="text-xs text-slate-400 block">{guest.organization}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleStatusClick(guest, e)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider font-mono border transition-all cursor-pointer ${
                    isCheckedIn
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isConfirmed
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isCheckedIn ? 'Checked In' : isConfirmed ? 'Confirmed' : 'Pending'}
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Role:</span>
                  <span className="text-indigo-300 font-medium">{guest.role}</span>
                </div>

                <div className="flex items-center gap-2">
                  {guest.dietary !== 'Standard' && (
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {guest.dietary}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 truncate max-w-28 font-mono">
                    {getTableName(guest.tableId)}
                  </span>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
}
