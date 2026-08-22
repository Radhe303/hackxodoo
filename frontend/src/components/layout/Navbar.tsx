import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Share2, 
  Search, 
  Plus, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  Bookmark, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
}) => {
  const { user, logout, switchDemoUser } = useAuth();
  const { setIsCreateTripOpen, setIsSearchPaletteOpen, savedCities } = useTrips();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Explore', icon: Compass },
    { id: 'cities', label: 'Destinations', icon: MapPin },
    { id: 'my-trips', label: 'My Trips', icon: Calendar },
    { id: 'builder', label: 'Itinerary Planner', icon: Sparkles },
    { id: 'budget', label: 'Budget & Cost', icon: DollarSign },
    { id: 'shared', label: 'Public Gallery', icon: Share2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo - Samsung bold monochrome typography */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="group flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 group-hover:scale-105">
              <span className="font-extrabold tracking-tighter text-lg">G</span>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-black block leading-none">
                GLOBETROTTER
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                Travel Operating System
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-full border border-neutral-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`samsung-pill-btn px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                  }`}
                >
                  <Icon className={`mr-1.5 h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search trigger (Cmd + K) */}
          <button
            onClick={() => setIsSearchPaletteOpen(true)}
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-500 transition-all hover:border-black hover:text-black sm:w-44 justify-between"
            title="Search destinations and activities (Ctrl+K)"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Search...</span>
            </span>
            <kbd className="hidden rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-mono text-neutral-700 sm:inline">
              ⌘K
            </kbd>
          </button>

          {/* "Plan New Trip" CTA button */}
          <button
            onClick={() => setIsCreateTripOpen(true)}
            className="samsung-pill-btn samsung-pill-primary px-4 py-2.5 text-xs font-bold tracking-wide"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Plan Trip</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* User Profile Dropdown / Auth Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1 pr-3 hover:border-black transition-all focus:outline-none"
              >
                <img
                  src={
                    user.profile_photo ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                  }
                  alt={user.full_name}
                  className="h-8 w-8 rounded-full object-cover border border-neutral-300"
                />
                <span className="hidden text-xs font-semibold text-black lg:inline max-w-[100px] truncate">
                  {user.full_name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-neutral-200 bg-white p-2 shadow-samsung-lg animate-fade-in">
                    <div className="border-b border-neutral-100 p-3">
                      <p className="text-xs font-bold text-black truncate">
                        {user.full_name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {user.email}
                      </p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-800 uppercase tracking-wider">
                        {user.role} account
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentTab('profile');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black transition-all"
                      >
                        <UserIcon className="h-4 w-4 text-neutral-500" />
                        Account Settings & Profile
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('cities');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <Bookmark className="h-4 w-4 text-neutral-500" />
                          Saved Wishlist
                        </span>
                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold">
                          {savedCities.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('admin');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black transition-all"
                      >
                        <ShieldCheck className="h-4 w-4 text-neutral-500" />
                        Admin & Analytics Hub
                      </button>
                    </div>

                    {/* Quick Demo Switcher */}
                    <div className="border-t border-neutral-100 pt-2 pb-1">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Demo Account Switch
                      </p>
                      <div className="mt-1 flex gap-1 px-2">
                        <button
                          onClick={() => {
                            switchDemoUser('traveler');
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`flex-1 rounded-lg py-1 text-[11px] font-semibold border ${
                            user.role === 'user'
                              ? 'bg-black text-white border-black'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          Traveler
                        </button>
                        <button
                          onClick={() => {
                            switchDemoUser('admin');
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`flex-1 rounded-lg py-1 text-[11px] font-semibold border ${
                            user.role === 'admin'
                              ? 'bg-black text-white border-black'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          Admin
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-neutral-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-all"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="samsung-pill-btn samsung-pill-outline px-4 py-2 text-xs font-bold"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
