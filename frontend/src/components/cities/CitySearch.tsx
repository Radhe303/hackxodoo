import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Star, Bookmark, Plus, Filter, Compass, DollarSign } from 'lucide-react';
import { City, Trip } from '../../types';
import { fetchCities } from '../../lib/api';
import { useTrips } from '../../context/TripContext';
import { CityDetailsModal } from './CityDetailsModal';

interface CitySearchProps {
  onAddCityToTrip: (city: City) => void;
}

export const CitySearch: React.FC<CitySearchProps> = ({ onAddCityToTrip }) => {
  const { savedCityIds, toggleSaveCity } = useTrips();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [sortBy, setSortBy] = useState<'popularity' | 'cost_asc' | 'cost_desc' | 'name'>('popularity');
  const [selectedCityForModal, setSelectedCityForModal] = useState<City | null>(null);

  useEffect(() => {
    fetchCities().then((data) => {
      setCities(data);
      setLoading(false);
    });
  }, []);

  // Extract unique regions
  const regions = useMemo(() => {
    const set = new Set<string>();
    cities.forEach((c) => {
      if (c.region) set.add(c.region);
    });
    return ['All', ...Array.from(set).sort()];
  }, [cities]);

  // Filter and sort
  const filteredCities = useMemo(() => {
    return cities
      .filter((city) => {
        // Region
        if (selectedRegion !== 'All' && city.region !== selectedRegion) {
          return false;
        }

        // Search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          return (
            city.city_name.toLowerCase().includes(term) ||
            city.country.toLowerCase().includes(term) ||
            (city.region && city.region.toLowerCase().includes(term))
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popularity') return b.popularity_score - a.popularity_score;
        if (sortBy === 'cost_asc') return a.avg_hotel_cost - b.avg_hotel_cost;
        if (sortBy === 'cost_desc') return b.avg_hotel_cost - a.avg_hotel_cost;
        if (sortBy === 'name') return a.city_name.localeCompare(b.city_name);
        return 0;
      });
  }, [cities, searchTerm, selectedRegion, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Database Exploration
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
            Destinations & Cities
          </h2>
          <p className="text-xs text-neutral-500">
            Explore 30 verified Indian and global cities with real hotel, food, and transport benchmarks
          </p>
        </div>

        <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-bold text-neutral-800 self-start sm:self-auto border border-neutral-200">
          {cities.length} Cities in Database
        </span>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-neutral-200 py-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by city name, state, or country..."
            className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-9 py-2 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
          />
        </div>

        {/* Region & Sort Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
            >
              <option value="popularity">Highest Popularity</option>
              <option value="cost_asc">Cost: Low to High</option>
              <option value="cost_desc">Cost: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Cities */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent mb-3" />
          <p className="text-xs font-bold text-neutral-600">Loading cities from database...</p>
        </div>
      ) : filteredCities.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-12 text-center">
          <p className="text-sm font-bold text-black">No cities found matching your filter</p>
          <p className="text-xs text-neutral-500 mt-1">Try resetting the region filter or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCities.map((city) => {
            const isSaved = savedCityIds.has(city.id);

            return (
              <div
                key={city.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:border-black hover:shadow-samsung"
              >
                <div>
                  {/* Photo & Badges */}
                  <div
                    onClick={() => setSelectedCityForModal(city)}
                    className="relative h-44 w-full cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 mb-3"
                  >
                    <img
                      src={
                        city.image_url ||
                        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={city.city_name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80';
                      }}
                    />

                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-neutral-700">
                        <Star className="h-3 w-3 fill-white text-white" />
                        Score: {city.popularity_score}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveCity(city);
                      }}
                      className={`absolute top-2.5 right-2.5 rounded-full p-2 backdrop-blur-md transition-all ${
                        isSaved
                          ? 'bg-black text-white'
                          : 'bg-white/80 text-black hover:bg-white'
                      }`}
                      title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {/* Meta */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4
                        onClick={() => setSelectedCityForModal(city)}
                        className="text-base font-bold text-black group-hover:text-neutral-700 cursor-pointer line-clamp-1"
                      >
                        {city.city_name}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                        Idx {city.cost_index}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                      <span>{city.region ? `${city.region}, ` : ''}{city.country}</span>
                    </p>
                  </div>

                  {/* Key Cost Averages */}
                  <div className="my-3 grid grid-cols-2 gap-2 rounded-2xl bg-neutral-50 p-2.5 text-[11px] border border-neutral-100">
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Avg Hotel</span>
                      <span className="font-bold text-neutral-800">₹{city.avg_hotel_cost}/n</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Avg Food</span>
                      <span className="font-bold text-neutral-800">₹{city.avg_food_cost}/d</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setSelectedCityForModal(city)}
                    className="samsung-pill-btn samsung-pill-secondary flex-1 py-2 text-xs font-bold"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onAddCityToTrip(city)}
                    className="samsung-pill-btn samsung-pill-primary px-3.5 py-2 text-xs font-bold"
                    title="Add to Itinerary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedCityForModal && (
        <CityDetailsModal
          city={selectedCityForModal}
          onClose={() => setSelectedCityForModal(null)}
          onAddToTrip={onAddCityToTrip}
        />
      )}
    </div>
  );
};
