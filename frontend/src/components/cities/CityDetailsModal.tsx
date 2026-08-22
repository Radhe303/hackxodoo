import React from 'react';
import { X, MapPin, Star, DollarSign, Bookmark, Plus, Compass } from 'lucide-react';
import { City } from '../../types';
import { useTrips } from '../../context/TripContext';

interface CityDetailsModalProps {
  city: City | null;
  onClose: () => void;
  onAddToTrip: (city: City) => void;
}

export const CityDetailsModal: React.FC<CityDetailsModalProps> = ({
  city,
  onClose,
  onAddToTrip,
}) => {
  const { savedCityIds, toggleSaveCity } = useTrips();

  if (!city) return null;

  const isSaved = savedCityIds.has(city.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 animate-fade-in overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl z-10 my-8">
        {/* Cover Photo */}
        <div className="relative h-64 w-full bg-neutral-900">
          <img
            src={
              city.image_url ||
              'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80'
            }
            alt={city.city_name}
            className="h-full w-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-black/60 backdrop-blur-md p-2 text-white hover:bg-black transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white border border-neutral-700 mb-1">
                <Star className="h-3 w-3 fill-white text-white" />
                Popularity Score: {city.popularity_score}/100
              </span>
              <h2 className="text-3xl font-black text-white drop-shadow-md">
                {city.city_name}
              </h2>
              <p className="text-xs text-neutral-200 flex items-center gap-1 font-medium drop-shadow">
                <MapPin className="h-3.5 w-3.5" />
                {city.region ? `${city.region}, ` : ''}{city.country}
              </p>
            </div>

            <button
              onClick={() => toggleSaveCity(city)}
              className={`rounded-full p-3 backdrop-blur-md transition-all shadow-md ${
                isSaved ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
              }`}
              title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Financial & Cost Indices */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Cost Intelligence & Daily Averages
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Hotel / Night</p>
                <p className="text-base font-black text-black mt-1">₹{city.avg_hotel_cost}</p>
                <p className="text-[10px] text-neutral-500">Standard 3-4★</p>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Food / Day</p>
                <p className="text-base font-black text-black mt-1">₹{city.avg_food_cost}</p>
                <p className="text-[10px] text-neutral-500">3 meals avg</p>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Local Transit</p>
                <p className="text-base font-black text-black mt-1">₹{city.avg_local_transport}</p>
                <p className="text-[10px] text-neutral-500">Metro / Cabs</p>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Cost Index</p>
                <p className="text-base font-black text-black mt-1">{city.cost_index} / 100</p>
                <p className="text-[10px] text-neutral-500">Tier Benchmark</p>
              </div>
            </div>
          </div>

          {/* Coordinates & Region */}
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-neutral-700">Geographic Coordinates: </span>
              <span className="text-neutral-500">{city.latitude ?? 'N/A'}, {city.longitude ?? 'N/A'}</span>
            </div>
            <div>
              <span className="font-bold text-neutral-700">Region: </span>
              <span className="text-neutral-500">{city.region || 'Standard'}</span>
            </div>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="samsung-pill-btn samsung-pill-outline px-5 py-2.5 text-xs font-bold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onAddToTrip(city);
                onClose();
              }}
              className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add to Itinerary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
