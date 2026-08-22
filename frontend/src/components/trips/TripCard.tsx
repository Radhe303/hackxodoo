import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, MoreVertical, Edit2, Trash2, Share2, Sparkles, Eye, TrendingUp } from 'lucide-react';
import { Trip } from '../../types';

interface TripCardProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
  onShare: (trip: Trip) => void;
  viewMode?: 'grid' | 'list';
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onSelect,
  onEdit,
  onDelete,
  onShare,
  viewMode = 'grid',
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const calculatedBudget = (trip.estimated_budget && trip.estimated_budget > 0)
    ? trip.estimated_budget
    : Math.round(totalDays * 6500);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-black text-white border-black';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:border-black hover:shadow-samsung">
        <div
          onClick={() => onSelect(trip)}
          className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
        >
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-900">
            {trip.cover_photo ? (
              <img
                src={trip.cover_photo}
                alt={trip.trip_name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-black text-white">
                <Sparkles className="h-5 w-5 text-neutral-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-black group-hover:text-neutral-700 transition-colors truncate">
                {trip.trip_name}
              </h4>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                  trip.status
                )}`}
              >
                {trip.status}
              </span>
            </div>
            <p className="text-xs text-neutral-500 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-neutral-400" />
                {trip.start_date} → {trip.end_date} ({totalDays} days)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-neutral-400" />
                {trip.stops_count || 0} stops
              </span>
            </p>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className="text-right">
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              {trip.estimated_budget && trip.estimated_budget > 0 ? 'Target Budget' : 'Est. Budget'}
            </p>
            <p className="text-sm font-black text-black">
              ₹{calculatedBudget.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelect(trip)}
              className="samsung-pill-btn samsung-pill-primary px-3.5 py-1.5 text-xs font-bold"
              title="Open Planner"
            >
              Open Plan
            </button>

            <button
              onClick={() => onShare(trip)}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black transition-all"
              title="Share Trip"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onEdit(trip)}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black transition-all"
              title="Edit Details"
            >
              <Edit2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(trip.id)}
              className="rounded-full p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all"
              title="Delete Trip"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid Card View
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 transition-all duration-300 hover:border-black hover:shadow-samsung">
      <div>
        {/* Cover Photo */}
        <div
          onClick={() => onSelect(trip)}
          className="relative h-44 w-full cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 mb-4"
        >
          {trip.cover_photo ? (
            <img
              src={trip.cover_photo}
              alt={trip.trip_name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-neutral-800 text-white">
              <Sparkles className="h-8 w-8 text-neutral-400" />
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${getStatusBadge(
                trip.status
              )}`}
            >
              {trip.status}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-full bg-black/60 backdrop-blur-md p-1.5 text-white hover:bg-black transition-all"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 z-30 mt-1 w-36 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-samsung-lg animate-fade-in text-xs font-semibold">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit(trip);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-black"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Trip
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onShare(trip);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-black"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(trip.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bottom Left: Budget Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="rounded-full bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-neutral-700 shadow-sm flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-neutral-300" />
              ₹{calculatedBudget.toLocaleString()}
            </span>
          </div>

          {/* Bottom Right: Duration Badge */}
          <div className="absolute bottom-3 right-3">
            <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-black shadow-sm">
              {totalDays} Days
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h4
            onClick={() => onSelect(trip)}
            className="text-base font-bold text-black group-hover:text-neutral-700 transition-colors cursor-pointer line-clamp-1"
          >
            {trip.trip_name}
          </h4>

          {trip.description && (
            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
              {trip.description}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between text-xs text-neutral-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              {trip.start_date} → {trip.end_date}
            </span>
            <span className="flex items-center gap-1 font-bold text-neutral-800">
              <MapPin className="h-3.5 w-3.5 text-neutral-400" />
              {trip.stops_count || 0} stops
            </span>
          </div>
        </div>
      </div>

      {/* Footer Details & Action Button */}
      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
            {trip.estimated_budget && trip.estimated_budget > 0 ? 'Target Budget' : 'Est. Total Budget'}
          </span>
          <span className="text-sm font-black text-black">
            ₹{calculatedBudget.toLocaleString()}
          </span>
        </div>

        <button
          onClick={() => onSelect(trip)}
          className="samsung-pill-btn samsung-pill-primary px-4 py-2 text-xs font-bold"
        >
          View Plan
        </button>
      </div>
    </div>
  );
};
