import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  MapPin, 
  Calendar, 
  Check, 
  Sparkles, 
  ArrowLeft, 
  Globe, 
  Compass, 
  Clock 
} from 'lucide-react';
import { Trip, TripStop } from '../../types';
import { fetchSharedTripByToken, copySharedTripToUser } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';

interface PublicItineraryProps {
  shareToken: string;
  onBackToApp: () => void;
}

export const PublicItinerary: React.FC<PublicItineraryProps> = ({
  shareToken,
  onBackToApp,
}) => {
  const { user } = useAuth();
  const { refreshTrips, setActiveTrip, showToast } = useTrips();
  const [data, setData] = useState<{ trip: Trip; stops: TripStop[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchSharedTripByToken(shareToken).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [shareToken]);

  const handleCopyTripToMyAccount = async () => {
    if (!user) {
      showToast('Please sign in to clone this trip to your account', 'error');
      return;
    }

    setIsCopying(true);
    try {
      const cloned = await copySharedTripToUser(shareToken, user.id);
      if (cloned) {
        showToast(`Trip "${cloned.trip_name}" cloned to your account!`, 'success');
        await refreshTrips();
        setActiveTrip(cloned);
        onBackToApp();
      }
    } catch (err) {
      showToast('Failed to copy trip', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast('Link copied to clipboard', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent mb-3" />
        <p className="text-xs font-bold text-neutral-600">Loading public travel itinerary...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center max-w-xl mx-auto shadow-samsung my-12">
        <Globe className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-lg font-black text-black">Itinerary Not Found</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-6">
          This shared link may have expired or was removed by the owner.
        </p>
        <button
          onClick={onBackToApp}
          className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold"
        >
          Return to GlobeTrotter
        </button>
      </div>
    );
  }

  const { trip, stops } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8 my-6">
      {/* Top Floating Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToApp}
          className="samsung-pill-btn samsung-pill-outline px-4 py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to GlobeTrotter
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="samsung-pill-btn samsung-pill-outline px-4 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedLink ? 'Copied' : 'Copy Link'}
          </button>

          <button
            onClick={handleCopyTripToMyAccount}
            disabled={isCopying}
            className="samsung-pill-btn samsung-pill-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isCopying ? 'Cloning Itinerary...' : 'Copy Trip to My Account'}
          </button>
        </div>
      </div>

      {/* Hero Showcase */}
      <div className="relative overflow-hidden rounded-3xl bg-black text-white p-8 sm:p-12 shadow-samsung-lg">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-300">
            <Globe className="h-3.5 w-3.5 text-white" />
            Public Shared Itinerary
          </span>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            {trip.trip_name}
          </h1>

          <p className="text-xs text-neutral-400 leading-relaxed">
            {trip.description || 'A customized multi-city journey planned with GlobeTrotter.'}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-300 border-t border-neutral-800">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-neutral-400" />
              {trip.start_date} → {trip.end_date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-neutral-400" />
              {stops.length} Stops
            </span>
            <span>•</span>
            <span className="font-bold text-white">
              Estimated Budget: ₹{trip.estimated_budget?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Stops & Daily Plan */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-black">Journey Stops & Activities</h3>

        <div className="space-y-4">
          {stops.map((stop, i) => (
            <div
              key={stop.id}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-white font-black text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-black">
                      {stop.city?.city_name}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {stop.arrival_date} → {stop.departure_date}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold text-neutral-800">
                  Hotel: ₹{stop.city?.avg_hotel_cost}/n
                </span>
              </div>

              {/* Stop Activities */}
              <div className="space-y-2 mt-4">
                {stop.activities && stop.activities.length > 0 ? (
                  stop.activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between rounded-2xl bg-neutral-50 p-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-black">{act.activity?.activity_name}</p>
                        <p className="text-[10px] text-neutral-500">
                          {act.activity_date} {act.activity_time ? `• ${act.activity_time}` : ''}
                        </p>
                      </div>
                      <span className="font-black text-black">
                        ₹{act.custom_cost ?? act.activity?.estimated_cost ?? 0}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 italic py-2">
                    Leisure exploration stop.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
