import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Bookmark, 
  Trash2, 
  Check, 
  Save, 
  AlertTriangle,
  MapPin,
  Star,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';
import { City } from '../../types';

interface ProfileSettingsProps {
  onPlanTripWithCity: (city: City) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onPlanTripWithCity }) => {
  const { user, updateUserProfile, logout } = useAuth();
  const { savedCities, toggleSaveCity, showToast } = useTrips();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [language, setLanguage] = useState(user?.language || 'English');
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-bold text-neutral-800">Please sign in to view account settings</p>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        full_name: fullName.trim(),
        language,
        profile_photo: profilePhoto.trim() || null,
      });
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account and all associated itineraries? This action cannot be undone.'
      )
    ) {
      logout();
      showToast('Account deactivated', 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          User Settings & Preferences
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
          Profile & Account Management
        </h2>
        <p className="text-xs text-neutral-500">
          Control your traveler profile, language localization, and bookmarked destinations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-samsung">
            <h3 className="text-base font-black text-black mb-5">Personal Information</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Preview */}
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
                <img
                  src={
                    profilePhoto ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                  }
                  alt={user.full_name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-neutral-300 shadow-sm"
                />
                <div className="flex-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Profile Photo URL
                  </label>
                  <input
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-9 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Email (Read only) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-100 px-9 py-2.5 text-xs font-semibold text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Email Verified & Active
                </div>
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Language Preference
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-9 py-2.5 text-xs font-semibold text-black focus:border-black focus:bg-white focus:outline-none"
                  >
                    <option value="English">English (Global)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="French">French (Français)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Danger Zone */}
          <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-900">Delete Account & Data</h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Permanently delete your profile, saved wishlist, and personal travel plans.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xs flex-shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Saved Destinations / Wishlist */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-black" />
                <h3 className="text-sm font-black text-black">
                  Saved Destinations ({savedCities.length})
                </h3>
              </div>
            </div>

            {savedCities.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-6 text-center">
                No cities saved to your wishlist yet. Browse destinations to bookmark favorites.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {savedCities.map((city) => (
                  <div
                    key={city.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-100 bg-neutral-50 p-3 hover:border-black transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-black truncate">{city.city_name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">
                        {city.country} • ₹{city.avg_hotel_cost}/n
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onPlanTripWithCity(city)}
                        className="samsung-pill-btn samsung-pill-primary p-1.5"
                        title="Plan trip with this city"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => toggleSaveCity(city)}
                        className="p-1.5 text-neutral-400 hover:text-red-600"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
