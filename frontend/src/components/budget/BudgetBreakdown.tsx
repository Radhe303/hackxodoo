import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart as BarIcon, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Plane,
  Building,
  Utensils,
  Ticket,
  HelpCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { Trip, BudgetBreakdown as BudgetData } from '../../types';
import { calculateTripBudget } from '../../lib/api';
import { useTrips } from '../../context/TripContext';

interface BudgetBreakdownProps {
  trip: Trip;
  onBackToBuilder: () => void;
}

const MONO_COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({
  trip,
  onBackToBuilder,
}) => {
  const { showToast } = useTrips();
  const [budgetLimit, setBudgetLimit] = useState<number>(trip.estimated_budget ? Math.round(trip.estimated_budget * 1.15) : 50000);
  const [miscCost, setMiscCost] = useState<number>(2000);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    runCalculation();
  }, [trip.id]);

  const runCalculation = async (limitToUse?: number, miscToUse?: number) => {
    setLoading(true);
    try {
      const data = await calculateTripBudget(
        trip.id,
        limitToUse ?? budgetLimit,
        miscToUse ?? miscCost
      );
      setBudgetData(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to calculate budget', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLimits = (e: React.FormEvent) => {
    e.preventDefault();
    runCalculation(budgetLimit, miscCost);
    showToast('Updated budget limits and recalculations', 'success');
  };

  if (loading || !budgetData) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent mb-3" />
        <p className="text-xs font-bold text-neutral-600">Calculating travel finances across stops...</p>
      </div>
    );
  }

  // Data for Donut Chart
  const pieData = [
    { name: 'Accommodation (Hotels)', value: budgetData.hotel_cost },
    { name: 'Transport (Inter-city + Local)', value: budgetData.transport_cost },
    { name: 'Dining & Food', value: budgetData.food_cost },
    { name: 'Activities & Tickets', value: budgetData.activity_cost },
    { name: 'Miscellaneous', value: budgetData.miscellaneous_cost },
  ].filter((item) => item.value > 0);

  // Data for Bar Chart
  const barData = budgetData.daily_breakdown.map((d) => ({
    name: `Day ${d.day_number}`,
    hotel: d.hotel,
    food: d.food,
    transport: d.transport,
    activities: d.activities,
    total: d.total,
  }));

  return (
    <div className="space-y-8">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Financial Analytics
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
            Trip Budget & Cost Breakdown
          </h2>
          <p className="text-xs text-neutral-500">
            Automated cost projection based on hotel rates, transit distances, activities, and dining estimates
          </p>
        </div>

        <button
          onClick={onBackToBuilder}
          className="samsung-pill-btn samsung-pill-outline px-4 py-2 text-xs font-bold self-start sm:self-auto"
        >
          Back to Itinerary
        </button>
      </div>

      {/* Overbudget Warning Alert or Healthy Status Alert */}
      {budgetData.is_over_budget ? (
        <div className="rounded-3xl border-2 border-red-500 bg-red-50 p-5 md:p-6 text-red-900 shadow-sm animate-fade-in flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">
              Budget Alert: Projected Expenses Exceed Target Limit
            </h4>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Your estimated total of <strong>₹{budgetData.total_cost.toLocaleString()}</strong> exceeds your set limit of{' '}
              <strong>₹{budgetData.budget_limit?.toLocaleString()}</strong> by{' '}
              <span className="font-bold">
                ₹{((budgetData.total_cost) - (budgetData.budget_limit || 0)).toLocaleString()}
              </span>
              . Consider adjusting activity tickets or selecting alternate transit modes.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 md:p-6 text-neutral-800 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-black text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-black">
              Budget On Track
            </h4>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Total projected trip expenditure of <strong>₹{budgetData.total_cost.toLocaleString()}</strong> is within your comfort ceiling of{' '}
              <strong>₹{budgetData.budget_limit?.toLocaleString()}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Key Metric Highlights Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Total Estimated Cost
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            ₹{budgetData.total_cost.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">For entire itinerary</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Avg Daily Expense
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            ₹{budgetData.avg_cost_per_day.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Per day across {budgetData.days_count} days</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Target Budget Cap
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            ₹{budgetData.budget_limit?.toLocaleString() || 'None'}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">User configured ceiling</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Duration
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            {budgetData.days_count} Days
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Multi-city schedule</p>
        </div>
      </div>

      {/* Interactive Charts Section: Donut + Day-by-Day Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monochromatic Donut Chart */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <PieIcon className="h-4 w-4" />
              Expense Distribution Breakdown
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={MONO_COLORS[index % MONO_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Estimated Cost']}
                  contentStyle={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Items */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: MONO_COLORS[idx % MONO_COLORS.length] }}
                />
                <span className="truncate text-neutral-600 font-medium">{item.name}:</span>
                <span className="font-bold text-black ml-auto">₹{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day-by-Day Spending Bar Chart */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <BarIcon className="h-4 w-4" />
              Day-by-Day Expense Trajectory
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} />
                <YAxis stroke="#a3a3a3" fontSize={10} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Daily Total']}
                  contentStyle={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="total" fill="#000000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-neutral-500 mt-4 text-center">
            Includes nightly lodging, estimated 3 meals, local transit, and scheduled activities.
          </p>
        </div>
      </div>

      {/* Interactive Category Breakdown List */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-samsung">
        <h3 className="text-lg font-black text-black mb-4">Detailed Line-Item Breakdown</h3>

        <div className="divide-y divide-neutral-100 text-xs">
          {/* Accommodation */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-black">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Accommodation / Hotels</p>
                <p className="text-neutral-500">Nightly room rates across all stops</p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              ₹{budgetData.hotel_cost.toLocaleString()}
            </span>
          </div>

          {/* Transport */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-black">
                <Plane className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Transport (Inter-city + Local)</p>
                <p className="text-neutral-500">Flights/Trains between stops + in-city daily transit</p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              ₹{budgetData.transport_cost.toLocaleString()}
            </span>
          </div>

          {/* Dining */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-black">
                <Utensils className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Food & Dining Estimates</p>
                <p className="text-neutral-500">Calculated based on city dining averages</p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              ₹{budgetData.food_cost.toLocaleString()}
            </span>
          </div>

          {/* Activities */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-black">
                <Ticket className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Activities & Experiences</p>
                <p className="text-neutral-500">Sum of scheduled admission tickets and custom costs</p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              ₹{budgetData.activity_cost.toLocaleString()}
            </span>
          </div>

          {/* Miscellaneous */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-black">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Emergency / Miscellaneous</p>
                <p className="text-neutral-500">Buffer for shopping, tips, and contingencies</p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              ₹{budgetData.miscellaneous_cost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Adjust Target Limit Form */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">
        <h3 className="text-sm font-black uppercase tracking-wider text-black mb-1">
          Adjust Financial Target Thresholds
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Set custom limits to test budget alerts and contingency allocation
        </p>

        <form onSubmit={handleApplyLimits} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Target Budget Ceiling (₹)
            </label>
            <input
              type="number"
              min="0"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Contingency Buffer (₹)
            </label>
            <input
              type="number"
              min="0"
              value={miscCost}
              onChange={(e) => setMiscCost(Number(e.target.value))}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="samsung-pill-btn samsung-pill-primary w-full py-2.5 text-xs font-bold"
            >
              Recalculate Projections
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
