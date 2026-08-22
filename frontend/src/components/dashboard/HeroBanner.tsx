import React from 'react';
import { Sparkles, Compass, MapPin, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';

interface HeroBannerProps {
  onPlanTrip: () => void;
  onExploreCities: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onPlanTrip, onExploreCities }) => {
  const { user } = useAuth();
  const { trips, savedCities } = useTrips();

  const totalUpcomingTrips = trips.filter(
    (t) => t.status === 'planning' || t.status === 'active'
  ).length;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-black text-white p-8 sm:p-12 md:p-16 shadow-samsung-lg">
      {/* Background Subtle Gradient & Mesh Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-neutral-700 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-neutral-800 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl space-y-6">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/90 px-4 py-1.5 text-xs font-semibold text-neutral-300">
          <Sparkles className="h-3.5 w-3.5 text-white" />
          <span>Intelligent Multi-City Travel Planner</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15] text-white">
          The World at Your Command.{' '}
          <span className="text-neutral-400 font-light block sm:inline">
            Design seamless journeys with zero friction.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed max-w-2xl">
          Welcome back, <strong className="text-white">{user?.full_name || 'Traveler'}</strong>. 
          Manage your travel stops, explore 30+ curated cities with real-time costs, visualize interactive timelines, and track estimated budgets automatically.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onPlanTrip}
            className="samsung-pill-btn bg-white text-black hover:bg-neutral-200 px-6 py-3.5 text-xs font-black tracking-wide shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Plan New Trip
          </button>

          <button
            onClick={onExploreCities}
            className="samsung-pill-btn border border-neutral-700 bg-transparent text-white hover:bg-neutral-900 hover:border-white px-6 py-3.5 text-xs font-bold tracking-wide transition-all flex items-center gap-2"
          >
            <Compass className="h-4 w-4" />
            Explore Destinations
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-neutral-800">
          <div>
            <p className="text-2xl font-black text-white">{trips.length}</p>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Total Itineraries</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalUpcomingTrips}</p>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Active / Upcoming</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">30</p>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Cities In Database</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{savedCities.length}</p>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Wishlist Items</p>
          </div>
        </div>
      </div>
    </section>
  );
};
