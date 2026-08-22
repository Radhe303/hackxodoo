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
  HelpCircle,
  Users,
  Compass,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  Lightbulb
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

type TravelStyle = 'budget' | 'standard' | 'luxury';
type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

const CURRENCY_RATES: Record<Currency, { symbol: string; rate: number; label: string }> = {
  INR: { symbol: '₹', rate: 1.0, label: 'INR (₹)' },
  USD: { symbol: '$', rate: 0.012, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.011, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 0.0095, label: 'GBP (£)' },
  AED: { symbol: 'AED ', rate: 0.044, label: 'AED' },
};

const TRAVEL_STYLE_CONFIG: Record<TravelStyle, { label: string; multiplier: number; desc: string; icon: string }> = {
  budget: {
    label: 'Backpacker / Saver',
    multiplier: 0.65,
    desc: 'Boutique hostels & homestays, authentic street food & dhabas, local transit & walking tours.',
    icon: '🎒',
  },
  standard: {
    label: 'Standard / Comfort',
    multiplier: 1.0,
    desc: '3-4 Star verified hotels, casual dining cafes, rideshares, inter-city trains & curated tours.',
    icon: '🧳',
  },
  luxury: {
    label: 'Luxury / Executive',
    multiplier: 2.3,
    desc: '5-Star heritage resorts, gourmet fine dining, private chauffeur, domestic flights & VIP entries.',
    icon: '💎',
  },
};

const PARTY_SIZES = [
  { label: 'Solo', multiplier: 1.0, count: 1 },
  { label: 'Couple (2)', multiplier: 1.65, count: 2 },
  { label: 'Group (3)', multiplier: 2.35, count: 3 },
  { label: 'Family (4)', multiplier: 2.9, count: 4 },
];

const MONO_COLORS = ['#000000', '#383838', '#686868', '#999999', '#cccccc'];

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({
  trip,
  onBackToBuilder,
}) => {
  const { showToast } = useTrips();
  const [budgetLimit, setBudgetLimit] = useState<number>(
    trip.estimated_budget ? Math.round(trip.estimated_budget * 1.15) : 55000
  );
  const [miscCost, setMiscCost] = useState<number>(3000);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Enhancements: Travel Style, Currency, and Party Size
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('standard');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [partySizeIndex, setPartySizeIndex] = useState<number>(0);

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

  const currConfig = CURRENCY_RATES[currency];
  const styleMultiplier = TRAVEL_STYLE_CONFIG[travelStyle].multiplier;
  const partyMultiplier = PARTY_SIZES[partySizeIndex].multiplier;
  const combinedMultiplier = styleMultiplier * partyMultiplier;

  const formatPrice = (baseInr: number) => {
    const adjusted = Math.round(baseInr * combinedMultiplier * currConfig.rate);
    return `${currConfig.symbol}${adjusted.toLocaleString()}`;
  };

  const formatRawNum = (baseInr: number) => {
    return Math.round(baseInr * combinedMultiplier * currConfig.rate);
  };

  const handleExportCSV = () => {
    if (!budgetData) return;
    const rows = [
      ['GlobeTrotter Travel Financial Report'],
      ['Trip Name', trip.trip_name],
      ['Travel Style', TRAVEL_STYLE_CONFIG[travelStyle].label],
      ['Party Size', PARTY_SIZES[partySizeIndex].label],
      ['Currency', currency],
      ['Duration', `${budgetData.days_count} Days`],
      [''],
      ['Expense Category', `Amount (${currConfig.symbol})`],
      ['Accommodation (Hotels)', formatRawNum(budgetData.hotel_cost)],
      ['Transport (Inter-city + Local)', formatRawNum(budgetData.transport_cost)],
      ['Food & Dining', formatRawNum(budgetData.food_cost)],
      ['Activities & Sightseeing', formatRawNum(budgetData.activity_cost)],
      ['Miscellaneous & Contingency', formatRawNum(budgetData.miscellaneous_cost)],
      ['TOTAL ESTIMATED', formatRawNum(budgetData.total_cost)],
      [''],
      ['Day-by-Day Schedule Matrix'],
      ['Day', 'Date', 'Accommodation', 'Food', 'Transport', 'Activities', 'Daily Total'],
      ...budgetData.daily_breakdown.map((d) => [
        `Day ${d.day_number}`,
        d.date,
        formatRawNum(d.hotel),
        formatRawNum(d.food),
        formatRawNum(d.transport),
        formatRawNum(d.activities),
        formatRawNum(d.total),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${trip.trip_name.replace(/\s+/g, '_')}_budget.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Budget CSV report downloaded', 'success');
  };

  if (loading || !budgetData) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-black border-t-transparent mb-3" />
        <p className="text-xs font-bold text-neutral-600">Calculating intelligent travel finances & benchmark models...</p>
      </div>
    );
  }

  const adjustedTotal = Math.round(budgetData.total_cost * combinedMultiplier);
  const adjustedLimit = Math.round((budgetData.budget_limit || 60000) * partyMultiplier);
  const isAdjustedOver = adjustedTotal > adjustedLimit;

  // Data for Donut Chart
  const pieData = [
    { name: 'Accommodation (Hotels)', value: Math.round(budgetData.hotel_cost * combinedMultiplier) },
    { name: 'Transport (Inter-city + Local)', value: Math.round(budgetData.transport_cost * combinedMultiplier) },
    { name: 'Dining & Food', value: Math.round(budgetData.food_cost * combinedMultiplier) },
    { name: 'Activities & Tickets', value: Math.round(budgetData.activity_cost * combinedMultiplier) },
    { name: 'Miscellaneous Buffer', value: Math.round(budgetData.miscellaneous_cost * combinedMultiplier) },
  ].filter((item) => item.value > 0);

  // Data for Bar Chart
  const barData = budgetData.daily_breakdown.map((d) => ({
    name: `Day ${d.day_number}`,
    total: Math.round(d.total * combinedMultiplier * currConfig.rate),
    hotel: Math.round(d.hotel * combinedMultiplier * currConfig.rate),
    food: Math.round(d.food * combinedMultiplier * currConfig.rate),
    transport: Math.round(d.transport * combinedMultiplier * currConfig.rate),
    activities: Math.round(d.activities * combinedMultiplier * currConfig.rate),
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Screen 7 • Financial Intelligence Engine
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
              <Sparkles className="h-2.5 w-2.5" /> AI Calibrated
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black mt-1">
            Trip Budget & Cost Intelligence
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Dynamic cost projections synthesizing accommodation benchmarks, transit corridors, daily dining & ticket admissions
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportCSV}
            className="samsung-pill-btn samsung-pill-outline px-4 py-2 text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={onBackToBuilder}
            className="samsung-pill-btn samsung-pill-primary px-4 py-2 text-xs font-bold"
          >
            Back to Itinerary
          </button>
        </div>
      </div>

      {/* Control Bar: Currency Selector, Travel Style & Party Size */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
        {/* Travel Style Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Travel Style Preset
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 p-1 rounded-2xl">
            {(Object.keys(TRAVEL_STYLE_CONFIG) as TravelStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setTravelStyle(style)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5 ${
                  travelStyle === style
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                }`}
              >
                <span>{TRAVEL_STYLE_CONFIG[style].icon}</span>
                <span className="truncate text-[11px]">{style === 'budget' ? 'Budget' : style === 'standard' ? 'Comfort' : 'Luxury'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency Switcher */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Display Currency
          </label>
          <div className="grid grid-cols-5 gap-1 bg-neutral-100 p-1 rounded-2xl">
            {(Object.keys(CURRENCY_RATES) as Currency[]).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  currency === curr
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Party Size Multiplier */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Party Size / Travelers
          </label>
          <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-2xl">
            {PARTY_SIZES.map((size, idx) => (
              <button
                key={size.label}
                onClick={() => setPartySizeIndex(idx)}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  partySizeIndex === idx
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Style Explanation Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs text-neutral-700">
        <div className="flex items-center gap-2">
          <span className="text-base">{TRAVEL_STYLE_CONFIG[travelStyle].icon}</span>
          <span className="font-bold text-black">{TRAVEL_STYLE_CONFIG[travelStyle].label}:</span>
          <span className="text-neutral-600">{TRAVEL_STYLE_CONFIG[travelStyle].desc}</span>
        </div>
        <span className="font-mono text-[11px] font-black text-black bg-white px-2.5 py-1 rounded-full border border-neutral-200">
          ×{combinedMultiplier.toFixed(2)} factor
        </span>
      </div>

      {/* Overbudget Warning Alert or Healthy Status Alert */}
      {isAdjustedOver ? (
        <div className="rounded-3xl border-2 border-red-500 bg-red-50 p-5 md:p-6 text-red-900 shadow-sm animate-fade-in flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">
              Budget Notice: Projected Expenses Exceed Target Ceiling
            </h4>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Your estimated total of <strong>{formatPrice(budgetData.total_cost)}</strong> exceeds your set limit of{' '}
              <strong>{currConfig.symbol}{Math.round(adjustedLimit * currConfig.rate).toLocaleString()}</strong> by{' '}
              <span className="font-bold">
                {currConfig.symbol}{Math.round((adjustedTotal - adjustedLimit) * currConfig.rate).toLocaleString()}
              </span>
              . Consider switching to standard travel mode or adjusting activity admissions.
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
              Finances In Optimal Health
            </h4>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Total projected trip expenditure of <strong>{formatPrice(budgetData.total_cost)}</strong> is comfortably within your planned ceiling of{' '}
              <strong>{currConfig.symbol}{Math.round(adjustedLimit * currConfig.rate).toLocaleString()}</strong>.
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
            {formatPrice(budgetData.total_cost)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">For entire {budgetData.days_count}-day schedule</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Avg Daily Expense
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            {formatPrice(budgetData.avg_cost_per_day)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Across all party members</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Target Budget Cap
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            {currConfig.symbol}{Math.round(adjustedLimit * currConfig.rate).toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Configured comfort ceiling</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Duration & Travelers
          </p>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            {budgetData.days_count}D • {PARTY_SIZES[partySizeIndex].count}P
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">{PARTY_SIZES[partySizeIndex].label}</p>
        </div>
      </div>

      {/* Interactive Charts Section: Donut + Day-by-Day Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monochromatic Donut Chart */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <PieIcon className="h-4 w-4" />
              Category Distribution Breakdown
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
                  {pieData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={MONO_COLORS[index % MONO_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${currConfig.symbol}${Math.round(Number(value) * currConfig.rate).toLocaleString()}`, 'Projected Cost']}
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
                <span className="font-bold text-black ml-auto">
                  {currConfig.symbol}{Math.round(item.value * currConfig.rate).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Day-by-Day Spending Bar Chart */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <BarIcon className="h-4 w-4" />
              Daily Spending Trajectory
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} />
                <YAxis stroke="#a3a3a3" fontSize={10} />
                <Tooltip
                  formatter={(value: any) => [`${currConfig.symbol}${Number(value).toLocaleString()}`, 'Daily Total']}
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
            Includes lodging, 3 daily meals, transit, and curated activity admissions in {currency}.
          </p>
        </div>
      </div>

      {/* Itemized Line-Item Breakdown List */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-samsung">
        <h3 className="text-lg font-black text-black mb-4">Itemized Category Matrix</h3>

        <div className="divide-y divide-neutral-100 text-xs">
          {/* Accommodation */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-black">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Accommodation / Hotels & Stays</p>
                <p className="text-neutral-500">
                  {travelStyle === 'luxury' ? '5-Star Luxury Resorts & Heritage Suites' : travelStyle === 'budget' ? 'Cozy Hostels & Verified Homestays' : '3-4 Star Boutique Hotels & City Stays'}
                </p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              {formatPrice(budgetData.hotel_cost)}
            </span>
          </div>

          {/* Transport */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-black">
                <Plane className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Transport (Inter-city Transit & In-city Commute)</p>
                <p className="text-neutral-500">
                  {travelStyle === 'luxury' ? 'Domestic Flights & Dedicated Private Sedan Chauffeur' : travelStyle === 'budget' ? 'Express Trains & City Metro / Transit Network' : 'Vande Bharat Express Trains & App-based Cabs'}
                </p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              {formatPrice(budgetData.transport_cost)}
            </span>
          </div>

          {/* Dining */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-black">
                <Utensils className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Food & Culinary Allowances</p>
                <p className="text-neutral-500">
                  Daily 3-meal estimate (Breakfast, Lunch, Dinner + Artisanal Cafes) across {budgetData.days_count} days
                </p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              {formatPrice(budgetData.food_cost)}
            </span>
          </div>

          {/* Activities */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-black">
                <Ticket className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Activities, Guided Tours & Monument Admissions</p>
                <p className="text-neutral-500">
                  Curated sightseeing admissions, museum entry passes, and adventure activities
                </p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              {formatPrice(budgetData.activity_cost)}
            </span>
          </div>

          {/* Miscellaneous */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-black">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Contingency Buffer & Shopping</p>
                <p className="text-neutral-500">10% safety reserve for tips, local souvenirs, and emergency transit</p>
              </div>
            </div>
            <span className="font-black text-sm text-black">
              {formatPrice(budgetData.miscellaneous_cost)}
            </span>
          </div>
        </div>
      </div>

      {/* Day-by-Day Expense Matrix Table */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-samsung overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Day-by-Day Itemized Schedule
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Granular financial distribution across each calendar day of your travel
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-400">
            {budgetData.daily_breakdown.length} Total Days
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Lodging</th>
                <th className="py-3 px-4">Meals</th>
                <th className="py-3 px-4">Transit</th>
                <th className="py-3 px-4">Activities</th>
                <th className="py-3 px-4 text-right">Daily Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {budgetData.daily_breakdown.map((d) => (
                <tr key={d.date} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-black">Day {d.day_number}</td>
                  <td className="py-3 px-4 text-neutral-500 font-mono">{d.date}</td>
                  <td className="py-3 px-4 text-neutral-700">{formatPrice(d.hotel)}</td>
                  <td className="py-3 px-4 text-neutral-700">{formatPrice(d.food)}</td>
                  <td className="py-3 px-4 text-neutral-700">{formatPrice(d.transport)}</td>
                  <td className="py-3 px-4 text-neutral-700">{formatPrice(d.activities)}</td>
                  <td className="py-3 px-4 font-black text-black text-right">{formatPrice(d.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-300 bg-neutral-50 font-black text-black">
                <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                  Estimated Grand Total:
                </td>
                <td className="py-3 px-4 text-right text-sm">
                  {formatPrice(budgetData.total_cost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Smart AI Financial Optimization Tips */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">
        <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4" />
          AI Cost Optimization & Savings Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="font-bold text-black mb-1">🚅 High-Speed Rail vs Flights</p>
            <p className="text-neutral-500 leading-relaxed">
              Choosing Vande Bharat Express on inter-city legs saves up to ₹3,400 while avoiding airport transfers and baggage fees.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="font-bold text-black mb-1">🎟️ Bundled Heritage Passes</p>
            <p className="text-neutral-500 leading-relaxed">
              Acquiring combined monument & museum passes at city hubs provides 20-30% discount over individual gate admissions.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="font-bold text-black mb-1">🏨 Early-Bird Boutique Stays</p>
            <p className="text-neutral-500 leading-relaxed">
              Locking verified 4-star boutique hotels 20+ days prior unlocks complimentary breakfast and 15% rate discounts.
            </p>
          </div>
        </div>
      </div>

      {/* Adjust Target Limit Form */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-samsung">
        <h3 className="text-sm font-black uppercase tracking-wider text-black mb-1">
          Adjust Financial Target Thresholds
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Test custom budget caps and contingency allocations in {currency}
        </p>

        <form onSubmit={handleApplyLimits} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Target Budget Ceiling (INR ₹)
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
              Contingency Reserve (INR ₹)
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
