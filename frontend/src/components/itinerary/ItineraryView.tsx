import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  DollarSign, 
  Printer, 
  LayoutList, 
  LayoutGrid, 
  GitCommit, 
  Share2, 
  ArrowLeft 
} from 'lucide-react';
import { Trip, TripStop } from '../../types';
import { useTrips } from '../../context/TripContext';

interface ItineraryViewProps {
  trip: Trip;
  onBackToBuilder: () => void;
  onShareTrip: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  trip,
  onBackToBuilder,
  onShareTrip,
}) => {
  const { activeStops } = useTrips();
  const [viewMode, setViewMode] = useState<'days' | 'cities' | 'timeline'>('days');

  // Compute all trip days
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  // Group activities and stops by day
  const daysList = useMemo(() => {
    const days = [];
    for (let d = 0; d < totalDays; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + d);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Find active stop for this day
      const activeStop = activeStops.find((s) => {
        const arr = new Date(s.arrival_date);
        const dep = new Date(s.departure_date);
        return currentDate >= arr && currentDate <= dep;
      }) || activeStops[0];

      // Find activities scheduled on this day
      const dayActivities = activeStop?.activities?.filter(
        (a) => a.activity_date === dateStr
      ) || [];

      days.push({
        dayNumber: d + 1,
        dateStr,
        formattedDate: currentDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        stop: activeStop,
        activities: dayActivities,
      });
    }
    return days;
  }, [totalDays, startDate, activeStops]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBuilder}
            className="rounded-full p-2 border border-neutral-200 hover:bg-neutral-100 hover:text-black transition-all"
            title="Back to Itinerary Builder"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Trip Overview & Schedule
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
              {trip.trip_name}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              <span>{trip.start_date} → {trip.end_date} ({totalDays} Days)</span>
              <span>•</span>
              <span className="font-bold text-black">{activeStops.length} Stops</span>
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-full border border-neutral-200 bg-neutral-100 p-1">
            <button
              onClick={() => setViewMode('days')}
              className={`samsung-pill-btn px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'days' ? 'bg-white text-black shadow-sm' : 'text-neutral-600 hover:text-black'
              }`}
            >
              <LayoutGrid className="mr-1 h-3.5 w-3.5" />
              Day-by-Day
            </button>
            <button
              onClick={() => setViewMode('cities')}
              className={`samsung-pill-btn px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'cities' ? 'bg-white text-black shadow-sm' : 'text-neutral-600 hover:text-black'
              }`}
            >
              <LayoutList className="mr-1 h-3.5 w-3.5" />
              By City
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`samsung-pill-btn px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'timeline' ? 'bg-white text-black shadow-sm' : 'text-neutral-600 hover:text-black'
              }`}
            >
              <GitCommit className="mr-1 h-3.5 w-3.5" />
              Timeline
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="samsung-pill-btn samsung-pill-outline px-4 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>

          <button
            onClick={onShareTrip}
            className="samsung-pill-btn samsung-pill-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Content depending on selected view */}
      {viewMode === 'days' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {daysList.map((day) => (
            <div
              key={day.dayNumber}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung transition-all hover:border-black"
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white text-xs font-black">
                      {day.dayNumber}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-black">
                        Day {day.dayNumber}
                      </h4>
                      <p className="text-[11px] text-neutral-400">{day.formattedDate}</p>
                    </div>
                  </div>

                  {day.stop && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-800">
                      <MapPin className="h-3 w-3 text-neutral-500" />
                      {day.stop.city?.city_name}
                    </span>
                  )}
                </div>

                {/* Day Activities */}
                <div className="space-y-2.5">
                  {day.activities.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-4 text-center">
                      Free exploration & transit day
                    </p>
                  ) : (
                    day.activities.map((act) => (
                      <div
                        key={act.id}
                        className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
                      >
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                          <span className="font-semibold">{act.activity_time || 'Flexible'}</span>
                          <span className="font-bold text-black">
                            ₹{act.custom_cost ?? act.activity?.estimated_cost ?? 0}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-black">{act.activity?.activity_name}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          {act.activity?.category} • {act.activity?.duration_hours} hrs
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Day Summary Stats */}
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                <span>{day.activities.length} experiences</span>
                <span className="font-bold text-black">
                  Hotel: ₹{day.stop?.city?.avg_hotel_cost || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'cities' && (
        <div className="space-y-6">
          {activeStops.map((stop, i) => (
            <div
              key={stop.id}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white font-black text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black">
                      {stop.city?.city_name}, {stop.city?.country}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Stay: {stop.arrival_date} to {stop.departure_date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-neutral-700">
                  <span>Hotel: ₹{stop.city?.avg_hotel_cost}/n</span>
                  <span>Food: ₹{stop.city?.avg_food_cost}/d</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {stop.activities && stop.activities.length > 0 ? (
                  stop.activities.map((act) => (
                    <div
                      key={act.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-neutral-500">{act.activity_date}</span>
                        <span className="font-bold text-black">
                          ₹{act.custom_cost ?? act.activity?.estimated_cost ?? 0}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-black">{act.activity?.activity_name}</p>
                      <p className="text-[10px] text-neutral-500 mt-1">{act.activity?.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 italic py-2 col-span-3">
                    No individual activities assigned for this stop.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200">
          {daysList.map((day) => (
            <div key={day.dayNumber} className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-6 sm:-left-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white text-[10px] font-black ring-4 ring-white">
                {day.dayNumber}
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-black">
                    Day {day.dayNumber} • {day.formattedDate}
                  </span>
                  {day.stop && (
                    <span className="font-bold text-xs text-neutral-800">
                      {day.stop.city?.city_name}
                    </span>
                  )}
                </div>

                {day.activities.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {day.activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between rounded-xl bg-neutral-50 p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="font-bold text-neutral-900">
                            {act.activity?.activity_name}
                          </span>
                        </div>
                        <span className="font-bold text-black">
                          ₹{act.custom_cost ?? act.activity?.estimated_cost ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">Day at leisure</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
