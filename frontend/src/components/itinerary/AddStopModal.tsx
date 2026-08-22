import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Plus, ArrowRight, Search, Check } from 'lucide-react';
import { fetchCities, addTripStop } from '../../lib/api';
import { City, Trip } from '../../types';
import { useTrips } from '../../context/TripContext';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  initialCity?: City | null;
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  trip,
  initialCity,
}) => {
  const { refreshStops, refreshTrips, showToast } = useTrips();
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity || null);
  const [citySearch, setCitySearch] = useState('');
  const [arrivalDate, setArrivalDate] = useState(trip.start_date);
  const [departureDate, setDepartureDate] = useState(trip.end_date);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialCity) {
      setSelectedCity(initialCity);
    }
  }, [initialCity]);

  useEffect(() => {
    if (isOpen) {
      fetchCities().then(setCities);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCities = cities.filter((c) => {
    if (!citySearch.trim()) return true;
    const term = citySearch.toLowerCase();
    return (
      c.city_name.toLowerCase().includes(term) ||
      c.country.toLowerCase().includes(term) ||
      (c.region && c.region.toLowerCase().includes(term))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) {
      setErrorMsg('Please select a destination city');
      return;
    }

    if (new Date(arrivalDate) > new Date(departureDate)) {
      setErrorMsg('Departure date cannot be earlier than arrival date');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await addTripStop({
        trip_id: trip.id,
        city_id: selectedCity.id,
        arrival_date: arrivalDate,
        departure_date: departureDate,
        notes: notes.trim() || null,
      });

      showToast(`Added ${selectedCity.city_name} to itinerary`, 'success');
      await refreshStops(trip.id);
      await refreshTrips();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to add stop');
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
              Itinerary Builder
            </span>
            <h2 className="text-xl font-black tracking-tight text-black">
              Add City Stop to {trip.trip_name}
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
          {/* City Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              1. Choose Destination City *
            </label>

            {/* City Search Bar */}
            <div className="relative mb-2">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search across 30 cities in database..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-9 py-2 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
              />
            </div>

            {/* City Grid Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-neutral-100 rounded-2xl bg-neutral-50/50">
              {filteredCities.map((city) => {
                const isSelected = selectedCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setErrorMsg('');
                    }}
                    className={`flex items-start gap-2 rounded-xl p-2.5 text-left transition-all border ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <MapPin className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs truncate leading-tight">{city.city_name}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {city.country}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates Selection */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Arrival Date *
              </label>
              <input
                type="date"
                required
                value={arrivalDate}
                min={trip.start_date}
                max={trip.end_date}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Departure Date *
              </label>
              <input
                type="date"
                required
                value={departureDate}
                min={arrivalDate}
                max={trip.end_date}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Stop Notes / Hotel Preferences
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Staying near South Beach / Colaba area"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
            />
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
              disabled={isSubmitting || !selectedCity}
              className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold"
            >
              {isSubmitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Add Stop
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
