import React from 'react';
import { MapPin, Star, Bookmark, Plus, ArrowRight, DollarSign } from 'lucide-react';
import { City } from '../../types';
import { useTrips } from '../../context/TripContext';

interface PopularCitiesProps {
  cities: City[];
  onSelectCity: (city: City) => void;
  onViewAllCities: () => void;
  onAddStopWithCity: (city: City) => void;
}

export const PopularCities: React.FC<PopularCitiesProps> = ({
  cities,
  onSelectCity,
  onViewAllCities,
  onAddStopWithCity,
}) => {
  const { savedCityIds, toggleSaveCity } = useTrips();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-black">
            Popular & Recommended Destinations
          </h3>
          <p className="text-xs text-neutral-500">
            Real data from Supabase across 30 premier Indian & global cities
          </p>
        </div>
        <button
          onClick={onViewAllCities}
          className="text-xs font-bold text-black hover:text-neutral-600 transition-colors flex items-center gap-1"
        >
          Explore All Destinations ({cities.length})
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cities.slice(0, 8).map((city) => {
          const isSaved = savedCityIds.has(city.id);

          return (
            <div
              key={city.id}
              className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:border-black hover:shadow-samsung flex flex-col justify-between"
            >
              <div>
                {/* Top header with photo / fallback */}
                <div
                  onClick={() => onSelectCity(city)}
                  className="relative h-40 w-full overflow-hidden rounded-2xl bg-neutral-900 mb-3 cursor-pointer"
                >
                  <img
                    src={
                      city.image_url ||
                      `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&auto=format&fit=crop&q=80`
                    }
                    alt={city.city_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  {/* Popularity Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-neutral-700">
                      <Star className="h-3 w-3 fill-white text-white" />
                      Score: {city.popularity_score}
                    </span>
                  </div>

                  {/* Bookmark Wishlist button */}
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

                {/* City Meta */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4
                      onClick={() => onSelectCity(city)}
                      className="text-base font-bold text-black group-hover:text-neutral-700 cursor-pointer"
                    >
                      {city.city_name}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                      Idx {city.cost_index}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-neutral-400" />
                    {city.region ? `${city.region}, ` : ''}{city.country}
                  </p>
                </div>

                {/* Average Costs Preview */}
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

              {/* Action Buttons */}
              <div className="pt-1 flex gap-2">
                <button
                  onClick={() => onSelectCity(city)}
                  className="samsung-pill-btn samsung-pill-secondary flex-1 py-2 text-[11px] font-bold"
                >
                  Details
                </button>
                <button
                  onClick={() => onAddStopWithCity(city)}
                  className="samsung-pill-btn samsung-pill-primary px-3 py-2 text-[11px] font-bold"
                  title="Add to active trip"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
