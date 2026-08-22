import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Trip } from '../../types';

interface BudgetWidgetProps {
  trips: Trip[];
  onNavigateToBudget: () => void;
}

export const BudgetWidget: React.FC<BudgetWidgetProps> = ({
  trips,
  onNavigateToBudget,
}) => {
  const activeTrips = trips.filter((t) => t.status !== 'cancelled');
  const totalEstimatedCommitment = activeTrips.reduce(
    (acc, t) => acc + (t.estimated_budget || 0),
    0
  );

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-samsung transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-black" />
            Financial Intelligence
          </span>
          <h3 className="text-xl font-black tracking-tight text-black">
            Trip Budget & Expense Highlights
          </h3>
        </div>
        <button
          onClick={onNavigateToBudget}
          className="samsung-pill-btn samsung-pill-outline px-4 py-2 text-xs font-bold flex items-center gap-1.5"
        >
          View Full Breakdown
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Total Planned */}
        <div className="rounded-2xl bg-neutral-50 p-5 border border-neutral-100">
          <p className="text-xs font-semibold text-neutral-500">Total Planned Spend</p>
          <p className="text-2xl font-black text-black mt-1">
            ₹{totalEstimatedCommitment.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Across {activeTrips.length} active multi-city trips
          </p>
        </div>

        {/* Dynamic Calculation Engine Feature */}
        <div className="rounded-2xl bg-neutral-50 p-5 border border-neutral-100">
          <p className="text-xs font-semibold text-neutral-500">Automated Calculations</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-black">Hotel + Food + Transport + Activities</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Powered by real city cost indices & transit rates
          </p>
        </div>

        {/* Budget Overrun Guard */}
        <div className="rounded-2xl bg-black text-white p-5 border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300">Budget Guard</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white mt-1">
              Live Threshold Warning System
            </p>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            Instant alerts when activities and hotel nights exceed target limits
          </p>
        </div>
      </div>
    </div>
  );
};
