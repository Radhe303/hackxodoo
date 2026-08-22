import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Plus, 
  Trash2, 
  ArrowDown, 
  Sparkles, 
  Clock, 
  DollarSign, 
  Navigation, 
  ArrowUp, 
  CheckCircle2, 
  X, 
  Share2, 
  Eye,
  Plane,
  Train,
  Car
} from 'lucide-react';
import { Trip, TripStop, City } from '../../types';
import { useTrips } from '../../context/TripContext';
import { deleteTripStop, removeActivityFromStop, updateTripStop, calculateDistanceKm } from '../../lib/api';
import { AddStopModal } from './AddStopModal';
import { AddActivityModal } from './AddActivityModal';

interface ItineraryBuilderProps {
  trip: Trip;
  onViewItinerary: () => void;
  onViewBudget: () => void;
  onShareTrip: () => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  trip,
  onViewItinerary,
  onViewBudget,
  onShareTrip,
}) => {
  const { activeStops, refreshStops, refreshTrips, showToast } = useTrips();
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [activeStopForActivity, setActiveStopForActivity] = useState<TripStop | null>(null);

  const handleDeleteStop = async (stopId: string, cityName?: string) => {
    if (window.confirm(`Remove ${cityName || 'this stop'} from itinerary?`)) {
      try {
        await deleteTripStop(stopId);
        showToast('Stop removed', 'info');
        await refreshStops(trip.id);
        await refreshTrips();
      } catch (err) {
        showToast('Failed to remove stop', 'error');
      }
    }
  };

  const handleRemoveActivity = async (activityId: string, activityName?: string) => {
    try {
      await removeActivityFromStop(activityId);
      showToast(`Removed ${activityName || 'activity'}`, 'info');
      await refreshStops(trip.id);
    } catch (err) {
      showToast('Failed to remove activity', 'error');
    }
  };

  const handleMoveStop = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeStops.length) return;

    const stopA = activeStops[index];
    const stopB = activeStops[targetIndex];

    try {
      await updateTripStop(stopA.id, { stop_order: stopB.stop_order });
      await updateTripStop(stopB.id, { stop_order: stopA.stop_order });
      showToast('Stops reordered', 'success');
      await refreshStops(trip.id);
    } catch (err) {
      showToast('Failed to reorder stops', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-samsung">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-black px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                Builder Mode
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-[10px] font-bold text-neutral-600">
                {activeStops.length} Stops Defined
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
              {trip.trip_name}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              <span>{trip.start_date} → {trip.end_date}</span>
              {trip.description && <span>• {trip.description}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddStopOpen(true)}
              className="samsung-pill-btn samsung-pill-primary px-5 py-2.5 text-xs font-bold shadow-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add City Stop
            </button>

            <button
              onClick={onViewItinerary}
              className="samsung-pill-btn samsung-pill-secondary px-4 py-2.5 text-xs font-bold"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Day-by-Day View
            </button>

            <button
              onClick={onViewBudget}
              className="samsung-pill-btn samsung-pill-outline px-4 py-2.5 text-xs font-bold"
            >
              <DollarSign className="mr-1.5 h-4 w-4" />
              Budget Breakdown
            </button>

            <button
              onClick={onShareTrip}
              className="samsung-pill-btn samsung-pill-outline px-3.5 py-2.5 text-xs font-bold"
              title="Share Itinerary"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stops Timeline & Journey Flow */}
      {activeStops.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 mb-3">
            <MapPin className="h-7 w-7" />
          </div>
          <h4 className="text-base font-bold text-black">No stops added yet</h4>
          <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-5">
            Begin constructing your multi-city journey by adding your starting city destination.
          </p>
          <button
            onClick={() => setIsAddStopOpen(true)}
            className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add First Stop
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeStops.map((stop, index) => {
            const nextStop = activeStops[index + 1];
            let transitDistance: number | null = null;

            if (
              nextStop &&
              stop.city?.latitude &&
              stop.city?.longitude &&
              nextStop.city?.latitude &&
              nextStop.city?.longitude
            ) {
              transitDistance = calculateDistanceKm(
                stop.city.latitude,
                stop.city.longitude,
                nextStop.city.latitude,
                nextStop.city.longitude
              );
            }

            return (
              <React.Fragment key={stop.id}>
                {/* Stop Card */}
                <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung transition-all hover:border-neutral-400">
                  {/* Top Bar of Stop */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white font-black text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black tracking-tight text-black">
                            {stop.city?.city_name}
                          </h3>
                          <span className="text-xs font-semibold text-neutral-500">
                            {stop.city?.region ? `${stop.city.region}, ` : ''}{stop.city?.country}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          <span>{stop.arrival_date} → {stop.departure_date}</span>
                        </p>
                      </div>
                    </div>

                    {/* Reorder and Delete Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveStop(index, 'up')}
                        className={`rounded-full p-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-black ${
                          index === 0 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        disabled={index === activeStops.length - 1}
                        onClick={() => handleMoveStop(index, 'down')}
                        className={`rounded-full p-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-black ${
                          index === activeStops.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteStop(stop.id, stop.city?.city_name)}
                        className="rounded-full p-2 border border-neutral-200 text-neutral-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        title="Remove Stop"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stop Meta Row: Hotel & Food Cost Indices */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-neutral-100 text-xs">
                    <div className="rounded-xl bg-neutral-50 p-2.5">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Hotel Est.</span>
                      <span className="font-bold text-neutral-900">₹{stop.city?.avg_hotel_cost || 0} / night</span>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-2.5">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Food Est.</span>
                      <span className="font-bold text-neutral-900">₹{stop.city?.avg_food_cost || 0} / day</span>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-2.5">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Local Transit</span>
                      <span className="font-bold text-neutral-900">₹{stop.city?.avg_local_transport || 0} / day</span>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-2.5">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Popularity</span>
                      <span className="font-bold text-neutral-900">{stop.city?.popularity_score || 0} / 100</span>
                    </div>
                  </div>

                  {/* Stop Notes if any */}
                  {stop.notes && (
                    <div className="py-3 text-xs text-neutral-600 italic border-b border-neutral-100">
                      Note: {stop.notes}
                    </div>
                  )}

                  {/* Activities Scheduled in this Stop */}
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Scheduled Activities & Sightseeing ({stop.activities?.length || 0})
                      </h4>
                      <button
                        onClick={() => setActiveStopForActivity(stop)}
                        className="samsung-pill-btn samsung-pill-outline px-3 py-1.5 text-xs font-bold"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Assign Activity
                      </button>
                    </div>

                    {(!stop.activities || stop.activities.length === 0) ? (
                      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-xs text-neutral-500">
                        No activities assigned for {stop.city?.city_name} yet. Click "Assign Activity" to add sightseeing or food experiences.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stop.activities.map((act) => (
                          <div
                            key={act.id}
                            className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 hover:border-black hover:bg-white transition-all"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase">
                                  <Sparkles className="h-3 w-3 text-black" />
                                  {act.activity?.category || 'Activity'}
                                </span>
                                <button
                                  onClick={() => handleRemoveActivity(act.id, act.activity?.activity_name)}
                                  className="text-neutral-400 hover:text-red-600 p-1"
                                  title="Remove Activity"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="font-bold text-xs text-black mt-1 line-clamp-1">
                                {act.activity?.activity_name}
                              </p>
                              <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-2">
                                <span>{act.activity_date}</span>
                                {act.activity_time && <span>• {act.activity_time}</span>}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-neutral-500">
                                {act.activity?.duration_hours} hrs
                              </span>
                              <span className="font-black text-black">
                                ₹{act.custom_cost ?? act.activity?.estimated_cost ?? 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inter-City Transit Connector */}
                {nextStop && (
                  <div className="flex items-center justify-center my-2">
                    <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-semibold text-neutral-700 shadow-sm">
                      <Navigation className="h-3.5 w-3.5 text-black" />
                      <span>
                        Travel to <strong>{nextStop.city?.city_name}</strong>
                      </span>
                      {transitDistance && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                          ~{transitDistance} km
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Add Another Stop CTA */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setIsAddStopOpen(true)}
              className="samsung-pill-btn samsung-pill-outline px-6 py-3 text-xs font-bold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Next City Stop
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddStopModal
        isOpen={isAddStopOpen}
        onClose={() => setIsAddStopOpen(false)}
        trip={trip}
      />

      {activeStopForActivity && (
        <AddActivityModal
          isOpen={!!activeStopForActivity}
          onClose={() => setActiveStopForActivity(null)}
          stop={activeStopForActivity}
        />
      )}
    </div>
  );
};
