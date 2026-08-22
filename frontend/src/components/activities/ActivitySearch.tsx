import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, Filter, Clock, DollarSign, MapPin, Plus } from 'lucide-react';
import { Activity, City } from '../../types';
import { fetchActivities, fetchCities } from '../../lib/api';
import { ActivityCard } from './ActivityCard';
import { useTrips } from '../../context/TripContext';

interface ActivitySearchProps {
  onAssignActivity?: (activity: Activity) => void;
}

export const ActivitySearch: React.FC<ActivitySearchProps> = ({
  onAssignActivity,
}) => {
  const { activeTrip, activeStops, showToast } = useTrips();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxCost, setMaxCost] = useState<number>(10000);
  const [maxDuration, setMaxDuration] = useState<number>(12);

  useEffect(() => {
    Promise.all([fetchActivities(), fetchCities()]).then(([acts, c]) => {
      setActivities(acts);
      setCities(c);
      setLoading(false);
    });
  }, []);

  const cityMap = useMemo(() => {
    const map = new Map<string, string>();
    cities.forEach((c) => map.set(c.id, c.city_name));
    return map;
  }, [cities]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // City
      if (selectedCityId !== 'All' && act.city_id !== selectedCityId) {
        return false;
      }

      // Category
      if (selectedCategory !== 'All' && act.category !== selectedCategory) {
        return false;
      }

      // Cost & Duration
      if (act.estimated_cost > maxCost) return false;
      if (act.duration_hours > maxDuration) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = act.activity_name.toLowerCase().includes(term);
        const matchesDesc = act.description?.toLowerCase().includes(term);
        const matchesCat = act.category?.toLowerCase().includes(term);
        return matchesName || matchesDesc || matchesCat;
      }

      return true;
    });
  }, [activities, selectedCityId, selectedCategory, maxCost, maxDuration, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Experiences Directory
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
            Activities & Things to Do
          </h2>
          <p className="text-xs text-neutral-500">
            Discover curated sightseeing, heritage tours, dining, and outdoor adventures
          </p>
        </div>

        <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-bold text-neutral-800 self-start sm:self-auto border border-neutral-200">
          {activities.length} Activities Available
        </span>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search experiences..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-9 py-2 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          {/* City Filter */}
          <div>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
            >
              <option value="All">All Cities (30)</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Max Cost Slider */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-600 mb-1">
              <span>Max Budget:</span>
              <span className="text-black font-black">₹{maxCost.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="500"
              value={maxCost}
              onChange={(e) => setMaxCost(Number(e.target.value))}
              className="w-full h-1 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent mb-3" />
          <p className="text-xs font-bold text-neutral-600">Loading activities...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-12 text-center">
          <p className="text-sm font-bold text-black">No activities found matching criteria</p>
          <p className="text-xs text-neutral-500 mt-1">Try broadening your search or adjusting cost slider</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              cityName={cityMap.get(act.city_id)}
              onAddActivity={onAssignActivity}
            />
          ))}
        </div>
      )}
    </div>
  );
};
