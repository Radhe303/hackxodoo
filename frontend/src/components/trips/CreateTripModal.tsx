import React, { useState } from 'react';
import { X, Calendar, Image, Sparkles, ArrowRight, Check } from 'lucide-react';
import { createTrip, updateTrip } from '../../lib/api';
import { Trip } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripToEdit?: Trip | null;
}

const PRESET_COVERS = [
  {
    name: 'India Heritage',
    url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Metropolitan Neon',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Coastal Horizon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mountain Pass',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80',
  },
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  tripToEdit,
}) => {
  const { user } = useAuth();
  const { refreshTrips, setActiveTrip, showToast } = useTrips();

  const [tripName, setTripName] = useState(tripToEdit?.trip_name || '');
  const [startDate, setStartDate] = useState(
    tripToEdit?.start_date ||
      new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    tripToEdit?.end_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(
    tripToEdit?.description || ''
  );
  const [coverPhoto, setCoverPhoto] = useState(
    tripToEdit?.cover_photo || PRESET_COVERS[0].url
  );
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState<number>(
    tripToEdit?.estimated_budget || 50000
  );
  const [status, setStatus] = useState<'planning' | 'active' | 'completed' | 'cancelled'>(
    tripToEdit?.status || 'planning'
  );
  const [visibility, setVisibility] = useState<'private' | 'public' | 'shared'>(
    tripToEdit?.visibility || 'private'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in to save your trip');
      return;
    }

    if (!tripName.trim()) {
      setErrorMsg('Trip name is required');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('End date cannot be earlier than start date');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (tripToEdit) {
        const updated = await updateTrip(tripToEdit.id, {
          trip_name: tripName.trim(),
          start_date: startDate,
          end_date: endDate,
          description: description.trim() || null,
          cover_photo: customPhotoUrl.trim() || coverPhoto,
          estimated_budget: Number(estimatedBudget) || 50000,
          status: status,
          visibility: visibility,
        });
        showToast('Trip itinerary updated successfully', 'success');
        setActiveTrip(updated);
      } else {
        const newTrip = await createTrip({
          user_id: user.id,
          trip_name: tripName.trim(),
          start_date: startDate,
          end_date: endDate,
          description: description.trim() || null,
          cover_photo: customPhotoUrl.trim() || coverPhoto,
        });
        if (newTrip && estimatedBudget) {
          await updateTrip(newTrip.id, { estimated_budget: Number(estimatedBudget) });
        }
        showToast('Trip created successfully! Now add stops.', 'success');
        setActiveTrip(newTrip);
      }


      await refreshTrips();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save trip. Please try again.');
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
              Trip Initiation
            </span>
            <h2 className="text-xl font-black tracking-tight text-black">
              {tripToEdit ? 'Edit Trip Itinerary' : 'Plan New Personalized Trip'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Trip Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Trip Name *
            </label>
            <input
              type="text"
              required
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g. Royal Rajasthan & Golden Triangle Tour"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Start Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                End Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Target Budget Ceiling */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Target Budget Ceiling (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-neutral-400">₹</span>
              <input
                type="number"
                min="0"
                step="500"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                placeholder="50000"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-8 pr-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Automated financial engine will track expenses, flight/hotel benchmarks, and alert if costs exceed this cap.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Trip Description & Notes
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key objectives, companion notes, or luggage checklists..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Status & Visibility (for edit or advanced mode) */}
          {tripToEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
                >
                  <option value="planning">In Planning</option>
                  <option value="active">Active Journey</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
                >
                  <option value="private">Private (Only You)</option>
                  <option value="shared">Shared with Link</option>
                  <option value="public">Public Showcase</option>
                </select>
              </div>
            </div>
          )}

          {/* Cover Photo Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-2">
              Select Cover Aesthetics
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COVERS.map((preset) => {
                const isSelected = coverPhoto === preset.url && !customPhotoUrl;
                return (
                  <div
                    key={preset.name}
                    onClick={() => {
                      setCoverPhoto(preset.url);
                      setCustomPhotoUrl('');
                    }}
                    className={`group relative h-16 cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                      isSelected ? 'border-black ring-2 ring-black/20' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="h-full w-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2">
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="Or paste custom image URL..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-medium text-black focus:border-black focus:bg-white focus:outline-none"
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
              disabled={isSubmitting}
              className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold"
            >
              {isSubmitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {tripToEdit ? 'Update Itinerary' : 'Create Trip & Add Stops'}
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
