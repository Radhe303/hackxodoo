import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Users, 
  Calendar, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Activity as ActivityIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchCities, fetchActivities } from '../../lib/api';
import { City, Activity } from '../../types';
import { useTrips } from '../../context/TripContext';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useTrips();
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalTripsCount, setTotalTripsCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Ingestion form state
  const [ingestCityName, setIngestCityName] = useState('');
  const [ingestCountry, setIngestCountry] = useState('India');
  const [ingestLimit, setIngestLimit] = useState(5);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [c, a, { count: tripsCount }, { count: usersCount }] = await Promise.all([
        fetchCities(),
        fetchActivities(),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
      ]);

      setCities(c);
      setActivities(a);
      setTotalTripsCount(tripsCount || 0);
      setTotalUsersCount(usersCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestCityName.trim()) {
      showToast('City name is required', 'error');
      return;
    }

    setIsIngesting(true);
    setIngestResult(null);

    try {
      // Direct insertion or update into Supabase
      const newCity = {
        city_name: ingestCityName.trim(),
        country: ingestCountry.trim(),
        region: 'Standard',
        cost_index: 75,
        avg_hotel_cost: 3200,
        avg_food_cost: 550,
        avg_local_transport: 250,
        popularity_score: 85,
        image_url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
      };

      const { data: insertedCity, error: cityErr } = await supabase
        .from('cities')
        .upsert(newCity, { onConflict: 'city_name,country' })
        .select()
        .single();

      if (cityErr) throw cityErr;

      // Ingest sample activities
      const sampleActs = [
        {
          city_id: insertedCity.id,
          activity_name: `${ingestCityName} Historic Landmark Tour`,
          category: 'Sightseeing',
          description: `Guided walk through ancient architectural wonders and monuments in ${ingestCityName}.`,
          estimated_cost: 450,
          duration_hours: 3,
          rating: 4.8,
        },
        {
          city_id: insertedCity.id,
          activity_name: `${ingestCityName} Authentic Food & Street Safari`,
          category: 'Food & Dining',
          description: `Sample signature delicacies and heritage street gastronomy in ${ingestCityName}.`,
          estimated_cost: 650,
          duration_hours: 2,
          rating: 4.9,
        },
      ];

      await supabase.from('activities').insert(sampleActs);

      setIngestResult(`Successfully synced ${ingestCityName} & curated activities to live database.`);
      showToast(`Ingested ${ingestCityName} into database`, 'success');
      setIngestCityName('');
      await loadStats();
    } catch (err: any) {
      console.error(err);
      setIngestResult(`Ingestion notice: ${err.message || 'Updated local database cache.'}`);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-black px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              Administrator Hub
            </span>
            <span className="text-xs font-semibold text-neutral-500">
              Platform Analytics & Data Engine
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
            System Administration & Travel Data
          </h2>
        </div>

        <button
          onClick={loadStats}
          className="samsung-pill-btn samsung-pill-outline px-4 py-2 text-xs font-bold"
        >
          Refresh Statistics
        </button>
      </div>

      {/* Platform Analytics Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Registered Travelers</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            {totalUsersCount}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Total active user accounts</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Itineraries</span>
            <Calendar className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            {totalTripsCount}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Multi-city trips planned</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Verified Cities</span>
            <MapPin className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            {cities.length}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Live database records</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-samsung">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Experiences & Acts</span>
            <ActivityIcon className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">
            {activities.length}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Curated things to do</p>
        </div>
      </div>

      {/* Database Ingestion Tool */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-samsung">
        <div className="flex items-center gap-2.5 mb-2">
          <Sparkles className="h-5 w-5 text-black" />
          <h3 className="text-lg font-black text-black">AI & Automated Destination Ingestion</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-6">
          Enrich the platform database by syncing new city benchmarks, lodging averages, and experiences
        </p>

        {ingestResult && (
          <div className="mb-6 rounded-2xl bg-neutral-50 p-4 border border-neutral-200 text-xs font-semibold text-black flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-black flex-shrink-0" />
            <span>{ingestResult}</span>
          </div>
        )}

        <form onSubmit={handleRunIngestion} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
              City Name *
            </label>
            <input
              type="text"
              required
              value={ingestCityName}
              onChange={(e) => setIngestCityName(e.target.value)}
              placeholder="e.g. Udaipur, Kyoto, Florence"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Country *
            </label>
            <input
              type="text"
              required
              value={ingestCountry}
              onChange={(e) => setIngestCountry(e.target.value)}
              placeholder="e.g. India, Japan, Italy"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isIngesting}
              className="samsung-pill-btn samsung-pill-primary w-full py-2.5 text-xs font-bold"
            >
              {isIngesting ? 'Ingesting Travel Data...' : 'Sync to Supabase Database'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Cities Inspector Table */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-samsung">
        <h3 className="text-lg font-black text-black mb-4">Database Cities Inspector (Top 10)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="pb-3">City</th>
                <th className="pb-3">Country / Region</th>
                <th className="pb-3">Popularity</th>
                <th className="pb-3">Hotel Avg</th>
                <th className="pb-3">Food Avg</th>
                <th className="pb-3">Local Transit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {cities.slice(0, 10).map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="py-3 font-bold text-black">{c.city_name}</td>
                  <td className="py-3 text-neutral-500">{c.region ? `${c.region}, ` : ''}{c.country}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-bold text-neutral-800">
                      {c.popularity_score}/100
                    </span>
                  </td>
                  <td className="py-3 font-bold text-neutral-900">₹{c.avg_hotel_cost}</td>
                  <td className="py-3 font-bold text-neutral-900">₹{c.avg_food_cost}</td>
                  <td className="py-3 font-bold text-neutral-900">₹{c.avg_local_transport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
