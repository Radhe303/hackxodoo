import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trip, City, TripStop } from '../types';
import { fetchUserTrips, fetchSavedDestinations, toggleSavedDestination, fetchTripStops } from '../lib/api';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface TripContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  activeStops: TripStop[];
  savedCities: City[];
  savedCityIds: Set<string>;
  isLoadingTrips: boolean;
  isCreateTripOpen: boolean;
  isSearchPaletteOpen: boolean;
  toasts: Toast[];
  setActiveTrip: (trip: Trip | null) => void;
  setIsCreateTripOpen: (open: boolean) => void;
  setIsSearchPaletteOpen: (open: boolean) => void;
  refreshTrips: () => Promise<void>;
  refreshStops: (tripId: string) => Promise<void>;
  toggleSaveCity: (city: City) => Promise<boolean>;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [activeStops, setActiveStops] = useState<TripStop[]>([]);
  const [savedCities, setSavedCities] = useState<City[]>([]);
  const [savedCityIds, setSavedCityIds] = useState<Set<string>>(new Set());
  const [isLoadingTrips, setIsLoadingTrips] = useState<boolean>(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState<boolean>(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const refreshTrips = useCallback(async () => {
    if (!user) {
      setTrips([]);
      return;
    }
    setIsLoadingTrips(true);
    try {
      const userTrips = await fetchUserTrips(user.id);
      setTrips(userTrips);
      // Auto select first trip if none is selected
      if (!activeTrip && userTrips.length > 0) {
        setActiveTrip(userTrips[0]);
      }
    } catch (err) {
      console.error('Error refreshing trips:', err);
    } finally {
      setIsLoadingTrips(false);
    }
  }, [user, activeTrip]);

  const refreshStops = useCallback(async (tripId: string) => {
    try {
      const stops = await fetchTripStops(tripId);
      setActiveStops(stops);
    } catch (err) {
      console.error('Error refreshing stops:', err);
    }
  }, []);

  const refreshSavedCities = useCallback(async () => {
    if (!user) {
      setSavedCities([]);
      setSavedCityIds(new Set());
      return;
    }
    try {
      const saved = await fetchSavedDestinations(user.id);
      setSavedCities(saved);
      setSavedCityIds(new Set(saved.map((c) => c.id)));
    } catch (err) {
      console.error('Error fetching saved destinations:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshTrips();
    refreshSavedCities();
  }, [user, refreshTrips, refreshSavedCities]);

  useEffect(() => {
    if (activeTrip) {
      refreshStops(activeTrip.id);
    } else {
      setActiveStops([]);
    }
  }, [activeTrip, refreshStops]);

  const toggleSaveCity = async (city: City): Promise<boolean> => {
    if (!user) {
      showToast('Please log in to save destinations', 'error');
      return false;
    }

    try {
      const isSavedNow = await toggleSavedDestination(user.id, city.id);
      if (isSavedNow) {
        setSavedCities((prev) => [city, ...prev]);
        setSavedCityIds((prev) => new Set([...prev, city.id]));
        showToast(`Added ${city.city_name} to wishlist`, 'success');
      } else {
        setSavedCities((prev) => prev.filter((c) => c.id !== city.id));
        setSavedCityIds((prev) => {
          const next = new Set(prev);
          next.delete(city.id);
          return next;
        });
        showToast(`Removed ${city.city_name} from wishlist`, 'info');
      }
      return isSavedNow;
    } catch (err) {
      showToast('Failed to update wishlist', 'error');
      return false;
    }
  };

  // Keyboard shortcut listener for CommandPalette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        activeStops,
        savedCities,
        savedCityIds,
        isLoadingTrips,
        isCreateTripOpen,
        isSearchPaletteOpen,
        toasts,
        setActiveTrip,
        setIsCreateTripOpen,
        setIsSearchPaletteOpen,
        refreshTrips,
        refreshStops,
        toggleSaveCity,
        showToast,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};
