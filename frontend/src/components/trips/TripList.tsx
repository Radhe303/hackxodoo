import React, { useState, useMemo } from 'react';
import { Search, Plus, LayoutGrid, List, Filter, Calendar, Sparkles } from 'lucide-react';
import { Trip } from '../../types';
import { TripCard } from './TripCard';
import { useTrips } from '../../context/TripContext';
import { deleteTrip } from '../../lib/api';

interface TripListProps {
  onSelectTrip: (trip: Trip) => void;
  onEditTrip: (trip: Trip) => void;
  onShareTrip: (trip: Trip) => void;
}

export const TripList: React.FC<TripListProps> = ({
  onSelectTrip,
  onEditTrip,
  onShareTrip,
}) => {
  const { trips, refreshTrips, setIsCreateTripOpen, showToast, isLoadingTrips } = useTrips();
  const [filter, setFilter] = useState<'all' | 'planning' | 'active' | 'completed' | 'shared'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Filter tab
      if (filter === 'planning' && trip.status !== 'planning') return false;
      if (filter === 'active' && trip.status !== 'active') return false;
      if (filter === 'completed' && trip.status !== 'completed') return false;
      if (filter === 'shared' && trip.visibility === 'private') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = trip.trip_name.toLowerCase().includes(term);
        const matchesDesc = trip.description?.toLowerCase().includes(term);
        const matchesCity = trip.cities_visited?.some((c) =>
          c.toLowerCase().includes(term)
        );
        return matchesName || matchesDesc || matchesCity;
      }

      return true;
    });
  }, [trips, filter, searchTerm]);

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip itinerary?')) {
      try {
        await deleteTrip(tripId);
        showToast('Trip itinerary deleted', 'info');
        await refreshTrips();
      } catch (err) {
        showToast('Failed to delete trip', 'error');
      }
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Trips', count: trips.length },
    { id: 'planning', label: 'In Planning', count: trips.filter((t) => t.status === 'planning').length },
    { id: 'active', label: 'Active', count: trips.filter((t) => t.status === 'active').length },
    { id: 'completed', label: 'Completed', count: trips.filter((t) => t.status === 'completed').length },
    { id: 'shared', label: 'Shared / Public', count: trips.filter((t) => t.visibility !== 'private').length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Journey Management
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
            My Travel Itineraries
          </h2>
          <p className="text-xs text-neutral-500">
            View, customize, calculate budgets, and share your multi-city adventures
          </p>
        </div>

        <button
          onClick={() => setIsCreateTripOpen(true)}
          className="samsung-pill-btn samsung-pill-primary px-5 py-2.5 text-xs font-bold self-start sm:self-auto shadow-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Plan New Trip
        </button>
      </div>

      {/* Controls Bar: Filter pills + Search + View mode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-y border-neutral-200 py-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`samsung-pill-btn px-4 py-2 text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Layout View */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name or city..."
              className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-9 py-2 text-xs font-medium text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center rounded-full border border-neutral-200 bg-neutral-100 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-full p-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-500 hover:text-black'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-full p-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-500 hover:text-black'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trips Content */}
      {isLoadingTrips ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent mb-3" />
          <p className="text-xs font-bold text-neutral-600">Loading your itineraries from database...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 mb-3">
            <Calendar className="h-7 w-7" />
          </div>
          <h4 className="text-base font-bold text-black">
            {searchTerm ? 'No itineraries match your search' : 'No trips in this category'}
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-5">
            {searchTerm
              ? 'Try changing your keyword or clear the search input.'
              : 'Create a new itinerary to begin adding travel stops, activities, and estimating costs.'}
          </p>
          <button
            onClick={() => setIsCreateTripOpen(true)}
            className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Plan New Trip
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-3'
          }
        >
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              viewMode={viewMode}
              onSelect={onSelectTrip}
              onEdit={onEditTrip}
              onDelete={handleDeleteTrip}
              onShare={onShareTrip}
            />
          ))}
        </div>
      )}
    </div>
  );
};
