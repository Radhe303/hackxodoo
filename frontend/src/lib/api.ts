import { supabase } from './supabase';
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
  try {
    let q = supabase.from('cities').select('*');

    if (params?.country && params.country !== 'All') {
      q = q.ilike('country', `%${params.country}%`);
    }

    if (params?.region && params.region !== 'All') {
      q = q.ilike('region', `%${params.region}%`);
    }

    if (params?.query && params.query.trim()) {
      const term = params.query.trim();
      q = q.or(`city_name.ilike.%${term}%,country.ilike.%${term}%,region.ilike.%${term}%`);
    }

    q = q.order('popularity_score', { ascending: false });

    if (params?.limit) {
      const offset = params.offset || 0;
      q = q.range(offset, offset + params.limit - 1);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching cities:', err);
    return [];
  }
}

export async function fetchCityById(cityId: string): Promise<City | null> {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching city:', err);
    return null;
  }
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
  try {
    let q = supabase.from('activities').select('*');

    if (params?.city_id) {
      q = q.eq('city_id', params.city_id);
    }

    if (params?.category && params.category !== 'All') {
      q = q.ilike('category', `%${params.category}%`);
    }

    if (params?.query && params.query.trim()) {
      const term = params.query.trim();
      q = q.or(`activity_name.ilike.%${term}%,description.ilike.%${term}%`);
    }

    if (params?.max_cost !== undefined && params.max_cost > 0) {
      q = q.lte('estimated_cost', params.max_cost);
    }

    if (params?.max_duration !== undefined && params.max_duration > 0) {
      q = q.lte('duration_hours', params.max_duration);
    }

    q = q.order('rating', { ascending: false });

    if (params?.limit) {
      q = q.limit(params.limit);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching activities:', err);
    return [];
  }
}

// ==========================================
// TRANSPORT MODES API
// ==========================================

export async function fetchTransportModes(): Promise<TransportMode[]> {
  try {
    const { data, error } = await supabase
      .from('transport_modes')
      .select('*')
      .order('cost_per_km', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching transport modes:', err);
    return [];
  }
}

// Haversine formula to compute accurate distance in km between two geo-coordinates
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
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
// TRIPS API
// ==========================================

export async function fetchUserTrips(userId: string): Promise<Trip[]> {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with stops count
    const enrichedTrips: Trip[] = await Promise.all(
      (data || []).map(async (trip) => {
        const { data: stops } = await supabase
          .from('trip_stops')
          .select('id, city_id, cities(city_name)')
          .eq('trip_id', trip.id);

        const citiesVisited = stops
          ? (stops as any[]).map((s) => s.cities?.city_name).filter(Boolean)
          : [];

        return {
          ...trip,
          stops_count: stops?.length || 0,
          cities_visited: citiesVisited,
        };
      })
    );

    return enrichedTrips;
  } catch (err) {
    console.error('Error fetching trips:', err);
    return [];
  }
}

export async function fetchTripById(tripId: string): Promise<Trip | null> {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching trip:', err);
    return null;
  }
}

export async function createTrip(tripData: {
  user_id: string;
  trip_name: string;
  start_date: string;
  end_date: string;
  description?: string | null;
  cover_photo?: string | null;
}): Promise<Trip> {
  const newTrip = {
    user_id: tripData.user_id,
    trip_name: tripData.trip_name.trim(),
    start_date: tripData.start_date,
    end_date: tripData.end_date,
    description: tripData.description?.trim() || null,
    cover_photo: tripData.cover_photo?.trim() || null,
    status: 'planning',
    visibility: 'private',
    estimated_budget: 0,
  };

  const { data, error } = await supabase
    .from('trips')
    .insert([newTrip])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrip(
  tripId: string,
  updates: Partial<Trip>
): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', tripId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTrip(tripId: string): Promise<boolean> {
  // First delete associated stop activities and stops
  const { data: stops } = await supabase
    .from('trip_stops')
    .select('id')
    .eq('trip_id', tripId);

  if (stops && stops.length > 0) {
    const stopIds = stops.map((s) => s.id);
    await supabase.from('stop_activities').delete().in('stop_id', stopIds);
    await supabase.from('trip_stops').delete().eq('trip_id', tripId);
  }

  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) throw error;
  return true;
}

// ==========================================
// TRIP STOPS & ITINERARY API
// ==========================================

export async function fetchTripStops(tripId: string): Promise<TripStop[]> {
  try {
    const { data, error } = await supabase
      .from('trip_stops')
      .select(`
        id,
        trip_id,
        city_id,
        stop_order,
        arrival_date,
        departure_date,
        notes,
        created_at,
        updated_at,
        city:cities(*)
      `)
      .eq('trip_id', tripId)
      .order('stop_order', { ascending: true });

    if (error) throw error;

    // Fetch activities for each stop
    const stopsWithActivities = await Promise.all(
      (data || []).map(async (stop: any) => {
        const { data: acts } = await supabase
          .from('stop_activities')
          .select(`
            id,
            stop_id,
            activity_id,
            activity_date,
            activity_time,
            custom_cost,
            created_at,
            activity:activities(*)
          `)
          .eq('stop_id', stop.id)
          .order('activity_date', { ascending: true });

        return {
          ...stop,
          activities: acts || [],
        };
      })
    );

    return stopsWithActivities;
  } catch (err) {
    console.error('Error fetching trip stops:', err);
    return [];
  }
}

export async function addTripStop(params: {
  trip_id: string;
  city_id: string;
  arrival_date: string;
  departure_date: string;
  notes?: string | null;
  stop_order?: number;
}): Promise<TripStop> {
  // Determine stop order
  let order = params.stop_order;
  if (order === undefined) {
    const { data: existing } = await supabase
      .from('trip_stops')
      .select('stop_order')
      .eq('trip_id', params.trip_id)
      .order('stop_order', { ascending: false })
      .limit(1);

    order = existing && existing.length > 0 ? existing[0].stop_order + 1 : 1;
  }

  const { data, error } = await supabase
    .from('trip_stops')
    .insert([
      {
        trip_id: params.trip_id,
        city_id: params.city_id,
        arrival_date: params.arrival_date,
        departure_date: params.departure_date,
        notes: params.notes || null,
        stop_order: order,
      },
    ])
    .select(`
      id,
      trip_id,
      city_id,
      stop_order,
      arrival_date,
      departure_date,
      notes,
      city:cities(*)
    `)
    .single();

  if (error) throw error;
  return data as unknown as TripStop;
}

export async function updateTripStop(
  stopId: string,
  updates: Partial<TripStop>
): Promise<TripStop> {
  const { data, error } = await supabase
    .from('trip_stops')
    .update(updates)
    .eq('id', stopId)
    .select(`
      id,
      trip_id,
      city_id,
      stop_order,
      arrival_date,
      departure_date,
      notes,
      city:cities(*)
    `)
    .single();

  if (error) throw error;
  return data as unknown as TripStop;
}

export async function deleteTripStop(stopId: string): Promise<boolean> {
  await supabase.from('stop_activities').delete().eq('stop_id', stopId);
  const { error } = await supabase.from('trip_stops').delete().eq('id', stopId);
  if (error) throw error;
  return true;
}

export async function addActivityToStop(params: {
  stop_id: string;
  activity_id: string;
  activity_date: string;
  activity_time?: string | null;
  custom_cost?: number | null;
}): Promise<StopActivity> {
  const { data, error } = await supabase
    .from('stop_activities')
    .insert([
      {
        stop_id: params.stop_id,
        activity_id: params.activity_id,
        activity_date: params.activity_date,
        activity_time: params.activity_time || null,
        custom_cost: params.custom_cost ?? null,
      },
    ])
    .select(`
      id,
      stop_id,
      activity_id,
      activity_date,
      activity_time,
      custom_cost,
      activity:activities(*)
    `)
    .single();

  if (error) throw error;
  return data as unknown as StopActivity;
}

export async function removeActivityFromStop(
  stopActivityId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('stop_activities')
    .delete()
    .eq('id', stopActivityId);
  if (error) throw error;
  return true;
}

// ==========================================
// BUDGET CALCULATION ENGINE
// ==========================================

export async function calculateTripBudget(
  tripId: string,
  budgetLimit?: number | null,
  miscellaneousCost: number = 0
): Promise<BudgetBreakdown> {
  const trip = await fetchTripById(tripId);
  if (!trip) throw new Error('Trip not found');

  const stops = await fetchTripStops(tripId);
  const transportModes = await fetchTransportModes();

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  let totalHotelCost = 0;
  let totalFoodCost = 0;
  let totalLocalTransportCost = 0;
  let totalActivityCost = 0;
  let totalInterCityTransportCost = 0;

  // Inter-city transport cost calculation
  for (let i = 0; i < stops.length - 1; i++) {
    const fromCity = stops[i].city;
    const toCity = stops[i + 1].city;

    if (fromCity?.latitude && fromCity?.longitude && toCity?.latitude && toCity?.longitude) {
      const distance = calculateDistanceKm(
        fromCity.latitude,
        fromCity.longitude,
        toCity.latitude,
        toCity.longitude
      );

      // Default to Flight for > 600km or Train for shorter distances
      const preferredMode =
        distance > 600
          ? transportModes.find((m) => m.mode_name.toLowerCase() === 'flight') || transportModes[0]
          : transportModes.find((m) => m.mode_name.toLowerCase() === 'train') || transportModes[0];

      if (preferredMode) {
        const cost = Math.max(
          preferredMode.minimum_cost,
          distance * preferredMode.cost_per_km
        );
        totalInterCityTransportCost += cost;
      }
    }
  }

  // Calculate per stop hotel, food, activities
  const dailyBreakdown: BudgetBreakdown['daily_breakdown'] = [];

  for (let d = 0; d < totalDays; d++) {
    const currentDayDate = new Date(startDate);
    currentDayDate.setDate(startDate.getDate() + d);
    const dateStr = currentDayDate.toISOString().split('T')[0];

    // Find which stop corresponds to this date
    const activeStop = stops.find((s) => {
      const arr = new Date(s.arrival_date);
      const dep = new Date(s.departure_date);
      return currentDayDate >= arr && currentDayDate <= dep;
    }) || stops[0];

    const hotelPerNight = activeStop?.city?.avg_hotel_cost || 3000;
    const foodPerDay = activeStop?.city?.avg_food_cost || 600;
    const localTransportPerDay = activeStop?.city?.avg_local_transport || 300;

    // Calculate activities on this day
    let dayActivityCost = 0;
    if (activeStop?.activities) {
      for (const act of activeStop.activities) {
        if (act.activity_date === dateStr) {
          dayActivityCost += act.custom_cost ?? act.activity?.estimated_cost ?? 0;
        }
      }
    }

    totalHotelCost += hotelPerNight;
    totalFoodCost += foodPerDay;
    totalLocalTransportCost += localTransportPerDay;
    totalActivityCost += dayActivityCost;

    dailyBreakdown.push({
      date: dateStr,
      day_number: d + 1,
      hotel: hotelPerNight,
      food: foodPerDay,
      activities: dayActivityCost,
      transport: localTransportPerDay,
      total: hotelPerNight + foodPerDay + dayActivityCost + localTransportPerDay,
    });
  }

  const totalTransportCost = Math.round(
    totalInterCityTransportCost + totalLocalTransportCost
  );
  const totalCost = Math.round(
    totalTransportCost +
      totalHotelCost +
      totalFoodCost +
      totalActivityCost +
      (miscellaneousCost || 0)
  );

  const isOverBudget = budgetLimit ? totalCost > budgetLimit : false;

  // Update trip estimated budget in database
  await updateTrip(tripId, { estimated_budget: totalCost });

  return {
    transport_cost: totalTransportCost,
    hotel_cost: Math.round(totalHotelCost),
    food_cost: Math.round(totalFoodCost),
    activity_cost: Math.round(totalActivityCost),
    miscellaneous_cost: Math.round(miscellaneousCost || 0),
    total_cost: totalCost,
    budget_limit: budgetLimit || null,
    is_over_budget: isOverBudget,
    days_count: totalDays,
    avg_cost_per_day: Math.round(totalCost / totalDays),
    daily_breakdown: dailyBreakdown,
  };
}

// ==========================================
// SAVED DESTINATIONS API
// ==========================================

export async function fetchSavedDestinations(
  userId: string
): Promise<City[]> {
  try {
    const { data, error } = await supabase
      .from('saved_destinations')
      .select('city_id, city:cities(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((item: any) => item.city).filter(Boolean);
  } catch (err) {
    console.error('Error fetching saved destinations:', err);
    return [];
  }
}

export async function toggleSavedDestination(
  userId: string,
  cityId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('saved_destinations')
    .select('id')
    .eq('user_id', userId)
    .eq('city_id', cityId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('saved_destinations')
      .delete()
      .eq('user_id', userId)
      .eq('city_id', cityId);
    return false; // un-saved
  } else {
    await supabase.from('saved_destinations').insert([
      {
        user_id: userId,
        city_id: cityId,
      },
    ]);
    return true; // saved
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
  const shareToken =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);

  const { data, error } = await supabase
    .from('shared_trips')
    .insert([
      {
        trip_id: tripId,
        user_id: userId,
        share_token: shareToken,
        visibility: visibility,
      },
    ])
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSharedTripByToken(
  shareToken: string
): Promise<{ trip: Trip; stops: TripStop[] } | null> {
  try {
    const { data: shareData, error } = await supabase
      .from('shared_trips')
      .select('trip_id')
      .eq('share_token', shareToken)
      .maybeSingle();

    if (error || !shareData) return null;

    const trip = await fetchTripById(shareData.trip_id);
    if (!trip) return null;

    const stops = await fetchTripStops(shareData.trip_id);
    return { trip, stops };
  } catch (err) {
    console.error('Error fetching shared trip:', err);
    return null;
  }
}

export async function copySharedTripToUser(
  shareToken: string,
  targetUserId: string
): Promise<Trip | null> {
  const sharedData = await fetchSharedTripByToken(shareToken);
  if (!sharedData) return null;

  const originalTrip = sharedData.trip;
  const originalStops = sharedData.stops;

  // Clone trip
  const clonedTrip = await createTrip({
    user_id: targetUserId,
    trip_name: `${originalTrip.trip_name} (Copy)`,
    start_date: originalTrip.start_date,
    end_date: originalTrip.end_date,
    description: originalTrip.description,
    cover_photo: originalTrip.cover_photo,
  });

  // Clone stops and activities
  for (const stop of originalStops) {
    const newStop = await addTripStop({
      trip_id: clonedTrip.id,
      city_id: stop.city_id,
      arrival_date: stop.arrival_date,
      departure_date: stop.departure_date,
      notes: stop.notes,
      stop_order: stop.stop_order,
    });

    if (stop.activities) {
      for (const act of stop.activities) {
        await addActivityToStop({
          stop_id: newStop.id,
          activity_id: act.activity_id,
          activity_date: act.activity_date,
          activity_time: act.activity_time,
          custom_cost: act.custom_cost,
        });
      }
    }
  }

  return clonedTrip;
}
