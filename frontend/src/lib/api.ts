import { 
  City, 
  Activity, 
  TransportMode, 
  Trip, 
  TripStop, 
  StopActivity, 
  BudgetBreakdown, 
  User, 
  SavedDestination, 
  SharedTrip 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper for authenticated requests with CSRF protection and JWT
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const token = localStorage.getItem('globetrotter_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Include CSRF token if cookie is set
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    if (match) {
      headers['X-CSRF-Token'] = match[1];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const msg = errJson?.message || `HTTP ${response.status}: ${response.statusText}`;
      return { data: null, error: msg };
    }

    const json = await response.json();
    return { data: json, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Network error' };
  }
}

// Fallback user-isolated storage key generator
const getUserStorageKey = (userId: string, key: string) => `gt_usr_${userId}_${key}`;

// ==========================================
// CITIES API
// ==========================================

export async function fetchCities(params?: {
  query?: string;
  country?: string;
  region?: string;
  limit?: number;
  offset?: number;
}): Promise<City[]> {
  const queryParams = new URLSearchParams();
  if (params?.query) queryParams.set('q', params.query);
  if (params?.country && params.country !== 'All') queryParams.set('country', params.country);
  if (params?.region && params.region !== 'All') queryParams.set('region', params.region);
  if (params?.limit) queryParams.set('limit', String(params.limit));
  if (params?.offset) queryParams.set('offset', String(params.offset));

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const { data } = await apiCall<{ cities: City[] }>(`/cities${queryStr}`);
  
  if (data?.cities && data.cities.length > 0) {
    return data.cities;
  }

  // Curated Fallback Cities
  return [
    {
      id: 'c1-delhi',
      city_name: 'New Delhi',
      country: 'India',
      region: 'North India',
      latitude: 28.6139,
      longitude: 77.2090,
      cost_index: 2,
      avg_hotel_cost: 3200,
      avg_food_cost: 900,
      avg_local_transport: 400,
      popularity_score: 96,
      image_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'c2-mumbai',
      city_name: 'Mumbai',
      country: 'India',
      region: 'West India',
      latitude: 19.0760,
      longitude: 72.8777,
      cost_index: 3,
      avg_hotel_cost: 5500,
      avg_food_cost: 1400,
      avg_local_transport: 600,
      popularity_score: 98,
      image_url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'c3-manali',
      city_name: 'Manali',
      country: 'India',
      region: 'North India',
      latitude: 32.2432,
      longitude: 77.1892,
      cost_index: 2,
      avg_hotel_cost: 2800,
      avg_food_cost: 800,
      avg_local_transport: 500,
      popularity_score: 94,
      image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'c4-tokyo',
      city_name: 'Tokyo',
      country: 'Japan',
      region: 'East Asia',
      latitude: 35.6762,
      longitude: 139.6503,
      cost_index: 4,
      avg_hotel_cost: 12000,
      avg_food_cost: 3500,
      avg_local_transport: 1200,
      popularity_score: 99,
      image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'c5-paris',
      city_name: 'Paris',
      country: 'France',
      region: 'Europe',
      latitude: 48.8566,
      longitude: 2.3522,
      cost_index: 4,
      avg_hotel_cost: 15000,
      avg_food_cost: 4200,
      avg_local_transport: 1500,
      popularity_score: 99,
      image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    }
  ];
}

export async function fetchCityById(cityId: string): Promise<City | null> {
  const { data } = await apiCall<{ city: City }>(`/cities/${cityId}`);
  if (data?.city) return data.city;

  const all = await fetchCities();
  return all.find((c) => c.id === cityId) || null;
}

// ==========================================
// ACTIVITIES API
// ==========================================

export async function fetchActivities(params?: {
  city_id?: string;
  query?: string;
  category?: string;
  max_cost?: number;
  max_duration?: number;
  limit?: number;
}): Promise<Activity[]> {
  const queryParams = new URLSearchParams();
  if (params?.city_id) queryParams.set('city_id', params.city_id);
  if (params?.query) queryParams.set('q', params.query);
  if (params?.category && params.category !== 'All') queryParams.set('category', params.category);
  if (params?.max_cost) queryParams.set('max_cost', String(params.max_cost));
  if (params?.max_duration) queryParams.set('max_duration', String(params.max_duration));
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const { data } = await apiCall<{ activities: Activity[] }>(`/activities${queryStr}`);
  
  if (data?.activities && data.activities.length > 0) {
    return data.activities;
  }

  // Fallback activities
  return [
    {
      id: 'act-1',
      city_id: params?.city_id || 'c1-delhi',
      activity_name: 'Historical Heritage Walk & Red Fort Tour',
      category: 'Sightseeing',
      description: 'Explore the iconic Mughal architecture with expert architectural commentary.',
      estimated_cost: 650,
      duration_hours: 3.5,
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'act-2',
      city_id: params?.city_id || 'c2-mumbai',
      activity_name: 'Marine Drive Sunset Cruise & Street Food Safari',
      category: 'Food & Culinary',
      description: 'Taste authentic local cuisines along the Arabian sea coastline.',
      estimated_cost: 1200,
      duration_hours: 4.0,
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'act-3',
      city_id: params?.city_id || 'c3-manali',
      activity_name: 'Solang Valley High Altitude Paragliding',
      category: 'Adventure',
      description: 'Soar through Himalayan mountain peaks with certified tandem pilots.',
      estimated_cost: 2500,
      duration_hours: 2.0,
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80',
    }
  ];
}

// ==========================================
// TRANSPORT MODES API
// ==========================================

export async function fetchTransportModes(): Promise<TransportMode[]> {
  const { data } = await apiCall<{ transport_modes: TransportMode[] }>('/transport-modes');
  if (data?.transport_modes && data.transport_modes.length > 0) {
    return data.transport_modes;
  }

  return [
    {
      id: 'tm-flight',
      mode_name: 'Flight',
      cost_per_km: 7.5,
      minimum_cost: 2500,
    },
    {
      id: 'tm-train',
      mode_name: 'Express Train (Vande Bharat)',
      cost_per_km: 2.8,
      minimum_cost: 500,
    },
    {
      id: 'tm-car',
      mode_name: 'Private Luxury Sedan',
      cost_per_km: 4.2,
      minimum_cost: 800,
    },
    {
      id: 'tm-bus',
      mode_name: 'Volvo Sleeper Bus',
      cost_per_km: 1.8,
      minimum_cost: 400,
    },
  ];
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ==========================================
// TRIPS API (STRICT CUSTOMER DATA ISOLATION)
// ==========================================

export async function fetchUserTrips(userId: string): Promise<Trip[]> {
  if (!userId) return [];

  // 1. Fetch from Flask Backend (guaranteed isolated by user_id)
  const { data } = await apiCall<{ trips: Trip[] }>('/trips');
  if (data?.trips) {
    return data.trips;
  }

  // 2. Isolated local storage fallback keyed by userId
  const storageKey = getUserStorageKey(userId, 'trips');
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // parse fallback
    }
  }

  return [];
}

export async function fetchTripById(tripId: string): Promise<Trip | null> {
  const { data } = await apiCall<{ trip: Trip }>(`/trips/${tripId}`);
  return data?.trip || null;
}

export async function createTrip(tripData: {
  user_id: string;
  trip_name: string;
  start_date: string;
  end_date: string;
  description?: string | null;
  cover_photo?: string | null;
}): Promise<Trip> {
  const { data } = await apiCall<{ trip: Trip }>('/trips', {
    method: 'POST',
    body: JSON.stringify({
      trip_name: tripData.trip_name.trim(),
      start_date: tripData.start_date,
      end_date: tripData.end_date,
      description: tripData.description?.trim() || null,
      cover_photo: tripData.cover_photo?.trim() || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80',
    }),
  });

  if (data?.trip) {
    return data.trip;
  }

  // Fallback local persistence isolated by user_id
  const newTrip: Trip = {
    id: crypto.randomUUID(),
    user_id: tripData.user_id,
    trip_name: tripData.trip_name.trim(),
    start_date: tripData.start_date,
    end_date: tripData.end_date,
    description: tripData.description?.trim() || null,
    cover_photo: tripData.cover_photo?.trim() || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80',
    status: 'planning',
    visibility: 'private',
    estimated_budget: 0,
    created_at: new Date().toISOString(),
  };

  const storageKey = getUserStorageKey(tripData.user_id, 'trips');
  const stored = localStorage.getItem(storageKey);
  const currentTrips = stored ? JSON.parse(stored) : [];
  localStorage.setItem(storageKey, JSON.stringify([newTrip, ...currentTrips]));

  return newTrip;
}

export async function updateTrip(
  tripId: string,
  updates: Partial<Trip>
): Promise<Trip | null> {
  const { data } = await apiCall<{ trip: Trip }>(`/trips/${tripId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  return data?.trip || null;
}

export async function deleteTrip(tripId: string): Promise<boolean> {
  const { error } = await apiCall(`/trips/${tripId}`, {
    method: 'DELETE',
  });

  return !error;
}

// ==========================================
// TRIP STOPS API
// ==========================================

export async function fetchTripStops(tripId: string): Promise<TripStop[]> {
  const { data } = await apiCall<{ stops: TripStop[] }>(`/trips/${tripId}/stops`);
  if (data?.stops) {
    return data.stops;
  }

  const stored = localStorage.getItem(`gt_trip_${tripId}_stops`);
  return stored ? JSON.parse(stored) : [];
}

export async function addTripStop(stopData: {
  trip_id: string;
  city_id: string;
  arrival_date: string;
  departure_date: string;
  notes?: string | null;
  stop_order?: number;
}): Promise<TripStop> {
  const { data } = await apiCall<{ stop: TripStop }>(`/trips/${stopData.trip_id}/stops`, {
    method: 'POST',
    body: JSON.stringify(stopData),
  });

  if (data?.stop) {
    return data.stop;
  }

  const city = await fetchCityById(stopData.city_id);
  const existingStops = await fetchTripStops(stopData.trip_id);
  const newStop: TripStop = {
    id: crypto.randomUUID(),
    trip_id: stopData.trip_id,
    city_id: stopData.city_id,
    arrival_date: stopData.arrival_date,
    departure_date: stopData.departure_date,
    notes: stopData.notes || null,
    stop_order: stopData.stop_order ?? (existingStops.length + 1),
    city: city || undefined,
    activities: [],
  };

  const key = `gt_trip_${stopData.trip_id}_stops`;
  const existing = localStorage.getItem(key);
  const stops = existing ? JSON.parse(existing) : [];
  localStorage.setItem(key, JSON.stringify([...stops, newStop]));

  return newStop;
}

export async function updateTripStop(
  stopId: string,
  updates: Partial<TripStop>
): Promise<TripStop | null> {
  const { data } = await apiCall<{ stop: TripStop }>(`/trips/stops/${stopId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  return data?.stop || null;
}

export async function deleteTripStop(stopId: string): Promise<boolean> {
  const { error } = await apiCall(`/trips/stops/${stopId}`, {
    method: 'DELETE',
  });

  return !error;
}

// ==========================================
// ITINERARY ACTIVITIES API
// ==========================================

export async function addActivityToStop(data: {
  stop_id: string;
  activity_id: string;
  activity_date?: string | null;
  activity_time?: string | null;
  custom_cost?: number | null;
}): Promise<StopActivity> {
  const { data: resData } = await apiCall<{ stop_activity: StopActivity }>(
    `/itinerary/stops/${data.stop_id}/activities`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  if (resData?.stop_activity) {
    return resData.stop_activity;
  }

  const newActivity: StopActivity = {
    id: crypto.randomUUID(),
    stop_id: data.stop_id,
    activity_id: data.activity_id,
    activity_date: data.activity_date || new Date().toISOString().split('T')[0],
    activity_time: data.activity_time || null,
    custom_cost: data.custom_cost || null,
  };

  return newActivity;
}

export async function removeActivityFromStop(
  stopActivityId: string
): Promise<boolean> {
  const { error } = await apiCall(
    `/itinerary/stops/activities/${stopActivityId}`,
    {
      method: 'DELETE',
    }
  );

  return !error;
}

// ==========================================
// BUDGET API
// ==========================================

export async function calculateTripBudget(
  tripId: string,
  customBudgetLimit?: number,
  customMiscCost: number = 2500
): Promise<BudgetBreakdown> {
  const stops = await fetchTripStops(tripId);
  const trip = await fetchTripById(tripId);

  let hotelCost = 0;
  let foodCost = 0;
  let transportCost = 0;
  let activityCost = 0;
  let totalDays = 0;

  const dailyMap: Record<string, { hotel: number; food: number; activities: number; transport: number }> = {};

  if (stops.length > 0) {
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const city = stop.city || (await fetchCityById(stop.city_id));
      const arrival = new Date(stop.arrival_date);
      const departure = new Date(stop.departure_date);
      const nights = Math.max(
        1,
        Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
      );
      totalDays += nights;

      const nightlyHotel = city?.avg_hotel_cost || 4200;
      const dailyFood = city?.avg_food_cost || 1200;
      const dailyLocalTrans = city?.avg_local_transport || 500;

      hotelCost += nightlyHotel * nights;
      foodCost += dailyFood * (nights + 1);
      transportCost += dailyLocalTrans * nights;

      // Add inter-city transport benchmark between stops
      if (i > 0) {
        transportCost += 3200; // Inter-city rail/flight estimate
      }

      if (stop.activities && stop.activities.length > 0) {
        for (const act of stop.activities) {
          const cost = act.custom_cost ?? act.activity?.estimated_cost ?? 650;
          activityCost += cost;
        }
      } else {
        // Benchmark activity cost per stop
        activityCost += 1500;
      }

      // Populate daily breakdown dates
      for (let d = 0; d < nights; d++) {
        const curDate = new Date(arrival.getTime() + d * 86400000).toISOString().split('T')[0];
        if (!dailyMap[curDate]) {
          dailyMap[curDate] = {
            hotel: nightlyHotel,
            food: dailyFood,
            transport: dailyLocalTrans + (d === 0 && i > 0 ? 3200 : 0),
            activities: stop.activities && stop.activities.length > 0 ? Math.round(activityCost / nights) : 800,
          };
        }
      }
    }
  } else {
    // Intelligent benchmark estimation based on trip date range
    let days = 6;
    let startDate = new Date();
    if (trip?.start_date && trip?.end_date) {
      const s = new Date(trip.start_date);
      const e = new Date(trip.end_date);
      const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        days = diff;
        startDate = s;
      }
    }
    totalDays = days;

    const baseHotel = 4500;
    const baseFood = 1400;
    const baseLocalTrans = 600;
    const baseIntercity = 4800;
    const baseActivities = 1100;

    hotelCost = baseHotel * Math.max(1, days - 1);
    foodCost = baseFood * days;
    transportCost = (baseLocalTrans * days) + baseIntercity;
    activityCost = baseActivities * days;

    for (let d = 0; d < days; d++) {
      const curDate = new Date(startDate.getTime() + d * 86400000).toISOString().split('T')[0];
      dailyMap[curDate] = {
        hotel: d < days - 1 ? baseHotel : 0,
        food: baseFood,
        transport: baseLocalTrans + (d === 0 || d === days - 1 ? 2400 : 0),
        activities: baseActivities,
      };
    }
  }

  const daysCount = Math.max(1, totalDays);
  const miscCostVal = customMiscCost > 0 ? customMiscCost : 2500;
  const totalCost = hotelCost + foodCost + transportCost + activityCost + miscCostVal;
  const budgetLimit = customBudgetLimit ?? (trip?.estimated_budget && trip.estimated_budget > 0 ? trip.estimated_budget : Math.round(totalCost * 1.15));
  const isOverBudget = budgetLimit !== null && totalCost > budgetLimit;

  const dailyBreakdown = Object.entries(dailyMap).map(([date, items], idx) => ({
    date,
    day_number: idx + 1,
    hotel: items.hotel,
    food: items.food,
    transport: items.transport,
    activities: items.activities,
    total: items.hotel + items.food + items.transport + items.activities,
  }));

  return {
    hotel_cost: hotelCost,
    food_cost: foodCost,
    transport_cost: transportCost,
    activity_cost: activityCost,
    miscellaneous_cost: miscCostVal,
    total_cost: totalCost,
    budget_limit: budgetLimit,
    is_over_budget: isOverBudget,
    days_count: daysCount,
    avg_cost_per_day: Math.round(totalCost / daysCount),
    daily_breakdown: dailyBreakdown,
  };
}


// ==========================================
// SAVED DESTINATIONS API
// ==========================================

export async function fetchSavedDestinations(userId: string): Promise<City[]> {
  if (!userId) return [];

  const { data } = await apiCall<{ saved_destinations: Array<{ city_id: string; cities?: City }> }>(
    '/saved-destinations'
  );

  if (data?.saved_destinations && data.saved_destinations.length > 0) {
    return data.saved_destinations
      .map((item) => item.cities)
      .filter((c): c is City => Boolean(c));
  }

  const key = getUserStorageKey(userId, 'saved_cities');
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

export async function toggleSavedDestination(
  userId: string,
  cityId: string
): Promise<boolean> {
  if (!userId || !cityId) return false;

  const key = getUserStorageKey(userId, 'saved_cities');
  const stored = localStorage.getItem(key);
  const current: City[] = stored ? JSON.parse(stored) : [];
  const exists = current.some((c) => c.id === cityId);

  if (exists) {
    const updated = current.filter((c) => c.id !== cityId);
    localStorage.setItem(key, JSON.stringify(updated));
    await apiCall(`/saved-destinations/${cityId}`, { method: 'DELETE' }).catch(() => {});
    return false; // Removed
  } else {
    const city = await fetchCityById(cityId);
    if (city) {
      const updated = [city, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
    }
    await apiCall('/saved-destinations', {
      method: 'POST',
      body: JSON.stringify({ city_id: cityId }),
    }).catch(() => {});
    return true; // Added
  }
}

// ==========================================
// SHARING API
// ==========================================

export async function createTripShareLink(
  tripId: string,
  userId: string,
  visibility: 'public' | 'friends' = 'public'
): Promise<SharedTrip> {
  const { data } = await apiCall<{ shared_trip: SharedTrip }>(
    `/trips/${tripId}/share`,
    {
      method: 'POST',
      body: JSON.stringify({ visibility }),
    }
  );

  if (data?.shared_trip) {
    return data.shared_trip;
  }

  const shareToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  return {
    id: crypto.randomUUID(),
    trip_id: tripId,
    user_id: userId,
    share_token: shareToken,
    visibility,
    expires_at: null,
    created_at: new Date().toISOString(),
  };
}

export async function fetchSharedTripByToken(
  shareToken: string
): Promise<{ trip: Trip; stops: TripStop[] } | null> {
  const { data } = await apiCall<{ trip: Trip; stops: TripStop[] }>(
    `/shared/${shareToken}`
  );

  return data || null;
}

export async function copySharedTripToUser(
  shareToken: string,
  targetUserId: string
): Promise<Trip | null> {
  const shared = await fetchSharedTripByToken(shareToken);
  if (!shared) return null;

  const newTrip = await createTrip({
    user_id: targetUserId,
    trip_name: `${shared.trip.trip_name} (Copy)`,
    start_date: shared.trip.start_date,
    end_date: shared.trip.end_date,
    description: shared.trip.description,
    cover_photo: shared.trip.cover_photo,
  });

  for (const stop of shared.stops) {
    await addTripStop({
      trip_id: newTrip.id,
      city_id: stop.city_id,
      arrival_date: stop.arrival_date,
      departure_date: stop.departure_date,
      notes: stop.notes,
      stop_order: stop.stop_order,
    });
  }

  return newTrip;
}
