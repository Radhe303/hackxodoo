import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Sparkles, DollarSign, X, ArrowRight } from 'lucide-react';
import { fetchCities, fetchActivities } from '../../lib/api';
import { City, Activity } from '../../types';
import { useTrips } from '../../context/TripContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: City) => void;
  onNavigate: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectCity,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const { trips, setIsCreateTripOpen } = useTrips();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [cityRes, actRes] = await Promise.all([
          fetchCities({ query: searchTerm, limit: 6 }),
          fetchActivities({ query: searchTerm, limit: 6 }),
        ]);
        setCities(cityRes);
        setActivities(actRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 backdrop-blur-md bg-black/40 animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl z-10 transition-all">
        {/* Search Header */}
        <div className="flex items-center border-b border-neutral-200 px-5 py-4">
          <Search className="h-5 w-5 text-neutral-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cities, activities, trips, or jump to actions..."
            className="w-full bg-transparent text-sm font-medium text-black placeholder-neutral-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-full text-neutral-400 hover:text-black"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-3 rounded-full bg-neutral-100 p-1.5 text-neutral-500 hover:bg-neutral-200 text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Navigation / Actions */}
          {!searchTerm && (
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Quick Shortcuts
              </p>
              <button
                onClick={() => {
                  setIsCreateTripOpen(true);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-all"
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-black" />
                  Plan a New Customized Multi-City Trip
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
              </button>
              <button
                onClick={() => {
                  onNavigate('cities');
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-all"
              >
                <span className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-black" />
                  Explore All 30 Indian & Global Destinations
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
              </button>
              <button
                onClick={() => {
                  onNavigate('budget');
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-all"
              >
                <span className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-black" />
                  Open Cost Breakdown & Expense Engine
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
              </button>
            </div>
          )}

          {/* Cities Section */}
          {cities.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Cities & Destinations ({cities.length})
              </p>
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-medium text-black hover:bg-neutral-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 group-hover:bg-black group-hover:text-white transition-colors">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-neutral-900">{city.city_name}</p>
                      <p className="text-[11px] text-neutral-500">{city.region ? `${city.region}, ` : ''}{city.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700">
                      Cost: ₹{city.avg_hotel_cost}/night
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Activities Section */}
          {activities.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Activities & Experiences ({activities.length})
              </p>
              {activities.map((act) => (
                <button
                  key={act.id}
                  onClick={() => {
                    onNavigate('cities');
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-medium text-black hover:bg-neutral-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 group-hover:bg-black group-hover:text-white transition-colors">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-neutral-900">{act.activity_name}</p>
                      <p className="text-[11px] text-neutral-500">{act.category} • {act.duration_hours}h</p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-800">
                      ₹{act.estimated_cost}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* My Trips */}
          {trips.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                My Trips ({trips.length})
              </p>
              {trips.slice(0, 3).map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => {
                    onNavigate('my-trips');
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-medium text-black hover:bg-neutral-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-neutral-500" />
                    <div className="text-left">
                      <p className="font-bold text-neutral-900">{trip.trip_name}</p>
                      <p className="text-[11px] text-neutral-500">{trip.start_date} → {trip.end_date}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase">
                    {trip.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {searchTerm && cities.length === 0 && activities.length === 0 && !loading && (
            <div className="py-12 text-center">
              <p className="text-xs font-bold text-neutral-800">No matching destinations or activities found</p>
              <p className="text-[11px] text-neutral-500 mt-1">Try searching for "Mumbai", "Delhi", "Goa", or "Sightseeing"</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2.5 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>Press <strong>ESC</strong> to dismiss</span>
          <span>Live search across Supabase</span>
        </div>
      </div>
    </div>
  );
};
