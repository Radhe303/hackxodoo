import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Users, Lock, ExternalLink } from 'lucide-react';
import { Trip, SharedTrip } from '../../types';
import { createTripShareLink } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onOpenPublicView: (token: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  trip,
  onOpenPublicView,
}) => {
  const { user } = useAuth();
  const { showToast } = useTrips();
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public');
  const [shareToken, setShareToken] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    if (!user) {
      showToast('Please sign in to generate share links', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await createTripShareLink(trip.id, user.id, visibility);
      setShareToken(result.share_token);
      showToast('Public share link generated', 'success');
    } catch (err) {
      showToast('Failed to create share link', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareUrl = shareToken
    ? `${window.location.origin}/?share=${shareToken}`
    : '';

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Share link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Collaboration & Social
            </span>
            <h2 className="text-xl font-black tracking-tight text-black">
              Share Travel Itinerary
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Trip Summary Card */}
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
            <h4 className="font-black text-sm text-black">{trip.trip_name}</h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {trip.start_date} → {trip.end_date} • {trip.stops_count || 0} stops
            </p>
          </div>

          {/* Visibility Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-2">
              Audience Access
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-left transition-all border ${
                  visibility === 'public'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold">Public Web Link</p>
                  <p className={`text-[10px] ${visibility === 'public' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Anyone with link can view & copy
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('friends')}
                className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-left transition-all border ${
                  visibility === 'friends'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold">Shared Companions</p>
                  <p className={`text-[10px] ${visibility === 'friends' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Direct friends / invitees only
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Generate or Show URL */}
          {!shareToken ? (
            <button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="samsung-pill-btn samsung-pill-primary w-full py-3 text-xs font-bold"
            >
              {isGenerating ? 'Generating Unique Link...' : 'Create Secure Share Link'}
            </button>
          ) : (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Shareable Public URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-mono text-neutral-800 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="samsung-pill-btn samsung-pill-primary px-4 py-2.5 text-xs font-bold flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    onOpenPublicView(shareToken);
                    onClose();
                  }}
                  className="text-xs font-bold text-black hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Preview Public Read-Only Page
                </button>

                <div className="flex gap-2 text-xs">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Check out my trip itinerary "${trip.trip_name}": ${shareUrl}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-neutral-100 px-3 py-1 font-bold text-neutral-700 hover:bg-neutral-200"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Planning my trip "${trip.trip_name}" on GlobeTrotter: ${shareUrl}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-neutral-100 px-3 py-1 font-bold text-neutral-700 hover:bg-neutral-200"
                  >
                    X / Twitter
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
