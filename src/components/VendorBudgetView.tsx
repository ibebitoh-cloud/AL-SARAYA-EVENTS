import { useState } from 'react';
import { motion } from 'motion/react';
import { DollarSign, CheckCircle2, Clock, Phone, AlertCircle, Plus, Sparkles, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Vendor } from '../types/event';
import { TiltCard } from './TiltCard';
import { sound } from '../utils/soundEffects';

interface VendorBudgetViewProps {
  vendors: Vendor[];
  totalBudget: number;
  allocatedBudget: number;
  onUpdateVendorStatus: (vendorId: string, status: Vendor['status']) => void;
  onAddVendor: () => void;
}

export function VendorBudgetView({
  vendors,
  totalBudget,
  allocatedBudget,
  onUpdateVendorStatus,
  onAddVendor,
}: VendorBudgetViewProps) {
  const [filter, setFilter] = useState<string>('all');

  const totalSpent = vendors.reduce((acc, v) => acc + v.spent, 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPct = Math.round((totalSpent / totalBudget) * 100);

  const filteredVendors = vendors.filter((v) => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  const handleToggleStatus = (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: Record<Vendor['status'], Vendor['status']> = {
      contract_pending: 'confirmed',
      confirmed: 'paid_in_full',
      paid_in_full: 'contract_pending',
    };
    const next = nextStatus[vendor.status];
    onUpdateVendorStatus(vendor.id, next);

    if (next === 'paid_in_full') {
      sound.success();
      try {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        confetti({
          particleCount: 30,
          spread: 60,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: ['#10b981', '#6366f1', '#fbbf24'],
        });
      } catch {
        // Safe fail
      }
    } else {
      sound.click(600);
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Total Budget</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
            ${totalBudget.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Approved production ceiling
          </div>
        </TiltCard>

        {/* Spent to Date Card */}
        <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Committed & Spent</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">{spentPct}%</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
            ${totalSpent.toLocaleString()}
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ duration: 0.6 }}
              className="h-full bg-emerald-500"
            />
          </div>
        </TiltCard>

        {/* Contingency Buffer Card */}
        <TiltCard tiltMax={4} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Unspent Buffer</span>
            <span className="text-xs font-mono text-indigo-400 font-bold">Reserves</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-indigo-300 tabular-nums">
            ${remainingBudget.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Available for emergency day-of provisions
          </div>
        </TiltCard>
      </div>

      {/* Vendors List & Action Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Production Vendors & Contractors</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Track vendor delivery schedules, arrival windows, and invoice disbursements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => {
                  sound.click(500);
                  setFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  sound.click(500);
                  setFilter('paid_in_full');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filter === 'paid_in_full' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Settled
              </button>
              <button
                onClick={() => {
                  sound.click(500);
                  setFilter('confirmed');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filter === 'confirmed' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Confirmed
              </button>
            </div>

            <button
              onClick={() => {
                sound.click(650);
                onAddVendor();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vendor</span>
            </button>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVendors.map((vendor) => {
            const isSettled = vendor.status === 'paid_in_full';
            const isConfirmed = vendor.status === 'confirmed';

            return (
              <TiltCard
                key={vendor.id}
                tiltMax={4}
                className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/90 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{vendor.name}</h4>
                    <span className="text-xs text-indigo-400 block mt-0.5">{vendor.service}</span>
                  </div>

                  <button
                    onClick={(e) => handleToggleStatus(vendor, e)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      isSettled
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : isConfirmed
                        ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {isSettled ? 'Paid in Full' : isConfirmed ? 'Confirmed' : 'Contract Pending'}
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Lead Contact</span>
                    <span className="text-slate-200 font-medium">{vendor.contactName}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{vendor.phone}</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Spent / Cap</span>
                    <span className="text-slate-100 font-mono font-bold tabular-nums">
                      ${vendor.spent.toLocaleString()} / ${vendor.budgetAllocated.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-indigo-300 block mt-0.5">
                      Arrival: {vendor.arrivalWindow}
                    </span>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
