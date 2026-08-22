import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, DollarSign, Plus, ArrowRight, Search, Star } from 'lucide-react';
import { fetchActivities, addActivityToStop } from '../../lib/api';
import { Activity, TripStop } from '../../types';
import { useTrips } from '../../context/TripContext';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop: TripStop;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  stop,
}) => {
  const { refreshStops, showToast } = useTrips();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityDate, setActivityDate] = useState(stop.arrival_date);
  const [activityTime, setActivityTime] = useState('10:00');
  const [customCost, setCustomCost] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && stop.city_id) {
      fetchActivities({ city_id: stop.city_id }).then(setActivities);
    }
  }, [isOpen, stop.city_id]);

  if (!isOpen) return null;

  const filteredActivities = activities.filter((act) => {
    if (!activitySearch.trim()) return true;
    const term = activitySearch.toLowerCase();
    return (
      act.activity_name.toLowerCase().includes(term) ||
      act.category.toLowerCase().includes(term) ||
      (act.description && act.description.toLowerCase().includes(term))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) {
      setErrorMsg('Please select an activity from the list');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await addActivityToStop({
        stop_id: stop.id,
        activity_id: selectedActivity.id,
        activity_date: activityDate,
        activity_time: activityTime || null,
        custom_cost: customCost !== '' ? Number(customCost) : null,
      });

      showToast(`Added ${selectedActivity.activity_name} to ${stop.city?.city_name}`, 'success');
      await refreshStops(stop.trip_id);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to assign activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 animate-fade-in overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-2xl z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Stop Experience
            </span>
            <h2 className="text-xl font-black tracking-tight text-black">
              Assign Activity in {stop.city?.city_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Activity Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              1. Choose Activity in {stop.city?.city_name} *
            </label>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search sightseeing, food tours, nature, adventures..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-9 py-2 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
              />
            </div>

            {/* Activities List */}
            <div className="space-y-2 max-h-52 overflow-y-auto p-1 border border-neutral-100 rounded-2xl bg-neutral-50/50">
              {filteredActivities.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No activities in database for this city yet.
                </div>
              ) : (
                filteredActivities.map((act) => {
                  const isSelected = selectedActivity?.id === act.id;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setSelectedActivity(act);
                        setCustomCost(act.estimated_cost);
                        setErrorMsg('');
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left transition-all border ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-sm'
                          : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isSelected ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                          <Sparkles className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-neutral-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{act.activity_name}</p>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            {act.category} • {act.duration_hours}h duration
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-black block ${isSelected ? 'text-white' : 'text-black'}`}>
                          ₹{act.estimated_cost}
                        </span>
                        <span className={`text-[10px] flex items-center gap-0.5 justify-end ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          <Star className="h-2.5 w-2.5 fill-current" />
                          {act.rating}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Scheduling: Date & Time */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Scheduled Date *
              </label>
              <input
                type="date"
                required
                value={activityDate}
                min={stop.arrival_date}
                max={stop.departure_date}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Cost Override */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Estimated Ticket / Cost (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-neutral-400">₹</span>
              <input
                type="number"
                min="0"
                value={customCost}
                onChange={(e) => setCustomCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Cost amount in INR"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-8 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="samsung-pill-btn samsung-pill-outline px-5 py-2.5 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedActivity}
              className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold"
            >
              {isSubmitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Assign to Stop
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
