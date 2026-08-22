import React from 'react';
import { Calendar, MapPin, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { Trip } from '../../types';

interface UpcomingTripsProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onPlanNew: () => void;
  onViewAll: () => void;
}

export const UpcomingTrips: React.FC<UpcomingTripsProps> = ({
  trips,
  onSelectTrip,
  onPlanNew,
  onViewAll,
}) => {
  const activeOrUpcoming = trips.filter((t) => t.status !== 'cancelled');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-black">
            Upcoming & Recent Itineraries
          </h3>
          <p className="text-xs text-neutral-500">
            Your planned multi-city routes and active schedules
          </p>
        </div>
        {trips.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-black hover:text-neutral-600 transition-colors flex items-center gap-1"
          >
            View All ({trips.length})
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {activeOrUpcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center sm:p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-black">No trips planned yet</h4>
          <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4">
            Create your first multi-city itinerary to organize stops, activities, and track your total budget.
          </p>
          <button
            onClick={onPlanNew}
            className="samsung-pill-btn samsung-pill-primary px-5 py-2.5 text-xs font-bold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Plan First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrUpcoming.slice(0, 3).map((trip) => {
            const startDate = new Date(trip.start_date);
            const endDate = new Date(trip.end_date);
            const durationDays = Math.max(
              1,
              Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            );

            return (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 transition-all duration-300 hover:border-black hover:shadow-samsung"
              >
                {/* Cover Photo or Fallback Geometric Pattern */}
                <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-neutral-900 mb-4">
                  {trip.cover_photo ? (
                    <img
                      src={trip.cover_photo}
                      alt={trip.trip_name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-black via-neutral-900 to-neutral-800 text-white p-4">
                      <Sparkles className="h-8 w-8 text-neutral-400" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white border border-neutral-700">
                      {trip.status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-black shadow-sm">
                      {durationDays} Days
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-black group-hover:text-neutral-700 transition-colors line-clamp-1">
                    {trip.trip_name}
                  </h4>

                  {trip.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {trip.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {trip.start_date} → {trip.end_date}
                    </span>
                    <span className="font-bold text-black">
                      ₹{trip.estimated_budget?.toLocaleString() || 0}
                    </span>
                  </div>

                  {trip.cities_visited && trip.cities_visited.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-neutral-500 truncate pt-1">
                      <MapPin className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                      <span className="truncate">
                        {trip.cities_visited.join(' • ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
