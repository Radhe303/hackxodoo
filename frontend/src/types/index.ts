export interface City {
  id: string;
  city_name: string;
  country: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  cost_index: number;
  avg_hotel_cost: number;
  avg_food_cost: number;
  avg_local_transport: number;
  popularity_score: number;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Activity {
  id: string;
  city_id: string;
  activity_name: string;
  category: string;
  description: string | null;
  estimated_cost: number;
  duration_hours: number;
  rating: number;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TransportMode {
  id: string;
  mode_name: string;
  cost_per_km: number;
  minimum_cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  profile_photo: string | null;
  language: string;
  role: 'user' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  created_at?: string;
}

export interface Trip {
  id: string;
  user_id: string;
  trip_name: string;
  description: string | null;
  cover_photo: string | null;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  visibility: 'private' | 'public' | 'shared';
  estimated_budget: number;
  created_at: string;
  updated_at?: string;
  stops_count?: number;
  cities_visited?: string[];
}

export interface TripStop {
  id: string;
  trip_id: string;
  city_id: string;
  stop_order: number;
  arrival_date: string;
  departure_date: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  city?: City;
  activities?: StopActivity[];
}

export interface StopActivity {
  id: string;
  stop_id: string;
  activity_id: string;
  activity_date: string;
  activity_time: string | null;
  custom_cost: number | null;
  created_at?: string;
  updated_at?: string;
  activity?: Activity;
}

export interface TripTransport {
  id: string;
  trip_id: string;
  from_stop_id: string;
  to_stop_id: string;
  transport_mode_id: string;
  distance_km: number;
  estimated_cost: number;
  created_at?: string;
  from_stop?: TripStop;
  to_stop?: TripStop;
  transport_mode?: TransportMode;
}

export interface BudgetBreakdown {
  transport_cost: number;
  hotel_cost: number;
  food_cost: number;
  activity_cost: number;
  miscellaneous_cost: number;
  total_cost: number;
  budget_limit: number | null;
  is_over_budget: boolean;
  days_count: number;
  avg_cost_per_day: number;
  daily_breakdown: Array<{
    date: string;
    day_number: number;
    hotel: number;
    food: number;
    activities: number;
    transport: number;
    total: number;
  }>;
}

export interface SavedDestination {
  id?: string;
  user_id: string;
  city_id: string;
  created_at?: string;
  city?: City;
}

export interface SharedTrip {
  id: string;
  trip_id: string;
  user_id: string;
  share_token: string;
  visibility: 'public' | 'friends';
  expires_at: string | null;
  created_at: string;
  trip?: Trip;
}
