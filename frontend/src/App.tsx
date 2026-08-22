import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider, useTrips } from './context/TripContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/layout/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';
import { AuthScreen } from './components/auth/AuthScreen';

// Screens

import { HeroBanner } from './components/dashboard/HeroBanner';
import { UpcomingTrips } from './components/dashboard/UpcomingTrips';
import { PopularCities } from './components/dashboard/PopularCities';
import { BudgetWidget } from './components/dashboard/BudgetWidget';
import { TripList } from './components/trips/TripList';
import { CreateTripModal } from './components/trips/CreateTripModal';
import { ItineraryBuilder } from './components/itinerary/ItineraryBuilder';
import { ItineraryView } from './components/itinerary/ItineraryView';
import { CitySearch } from './components/cities/CitySearch';
import { ActivitySearch } from './components/activities/ActivitySearch';
import { BudgetBreakdown } from './components/budget/BudgetBreakdown';
import { TripCalendar } from './components/calendar/TripCalendar';
import { ShareModal } from './components/share/ShareModal';
import { PublicItinerary } from './components/share/PublicItinerary';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CityDetailsModal } from './components/cities/CityDetailsModal';

import { City, Trip, Activity } from './types';
import { fetchCities } from './lib/api';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { 
    trips, 
    activeTrip, 
    setActiveTrip, 
    isCreateTripOpen, 
    setIsCreateTripOpen, 
    isSearchPaletteOpen, 
    setIsSearchPaletteOpen,
    showToast
  } = useTrips();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [tripToShare, setTripToShare] = useState<Trip | null>(null);
  const [publicShareToken, setPublicShareToken] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityForModal, setSelectedCityForModal] = useState<City | null>(null);

  // Check URL query parameters for ?share=token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const share = urlParams.get('share');
    if (share) {
      setPublicShareToken(share);
      setCurrentTab('shared');
    }
  }, []);

  // Fetch initial cities for dashboard
  useEffect(() => {
    fetchCities().then(setCities);
  }, []);

  const handleSelectTrip = (trip: Trip) => {
    setActiveTrip(trip);
    setCurrentTab('builder');
  };

  const handleEditTrip = (trip: Trip) => {
    setTripToEdit(trip);
    setIsCreateTripOpen(true);
  };

  const handleShareTrip = (trip: Trip) => {
    setTripToShare(trip);
  };

  const handleAddCityToTrip = (city: City) => {
    if (!activeTrip) {
      setTripToEdit(null);
      setIsCreateTripOpen(true);
      showToast(`Create a trip first to add ${city.city_name}`, 'info');
    } else {
      setCurrentTab('builder');
      showToast(`Selected ${city.city_name}. Click Add City Stop in builder.`, 'info');
    }
  };

  // Screen 1: If user is not authenticated, display full Register/Login Landing Page
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black font-sans">
        <AuthScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Top Navbar */}

      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Screen Router */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Screen 2: Dashboard / Home Screen */}
        {currentTab === 'dashboard' && (
          <div className="space-y-12 animate-fade-in">
            <HeroBanner
              onPlanTrip={() => {
                setTripToEdit(null);
                setIsCreateTripOpen(true);
              }}
              onExploreCities={() => setCurrentTab('cities')}
            />

            <UpcomingTrips
              trips={trips}
              onSelectTrip={handleSelectTrip}
              onPlanNew={() => {
                setTripToEdit(null);
                setIsCreateTripOpen(true);
              }}
              onViewAll={() => setCurrentTab('my-trips')}
            />

            <PopularCities
              cities={cities}
              onSelectCity={(city) => setSelectedCityForModal(city)}
              onViewAllCities={() => setCurrentTab('cities')}
              onAddStopWithCity={handleAddCityToTrip}
            />

            <BudgetWidget
              trips={trips}
              onNavigateToBudget={() => {
                if (activeTrip) setCurrentTab('budget');
                else setCurrentTab('my-trips');
              }}
            />
          </div>
        )}

        {/* Screen 4: My Trips Screen */}
        {currentTab === 'my-trips' && (
          <div className="animate-fade-in">
            <TripList
              onSelectTrip={handleSelectTrip}
              onEditTrip={handleEditTrip}
              onShareTrip={handleShareTrip}
            />
          </div>
        )}

        {/* Screen 5: Itinerary Builder Screen */}
        {currentTab === 'builder' && (
          <div className="animate-fade-in">
            {activeTrip ? (
              <ItineraryBuilder
                trip={activeTrip}
                onViewItinerary={() => setCurrentTab('itinerary-view')}
                onViewBudget={() => setCurrentTab('budget')}
                onShareTrip={() => handleShareTrip(activeTrip)}
              />
            ) : (
              <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-samsung">
                <p className="text-base font-bold text-black">No active trip selected</p>
                <p className="text-xs text-neutral-500 mt-1 mb-5">
                  Select a trip from your list or create a new one to begin planning.
                </p>
                <button
                  onClick={() => setCurrentTab('my-trips')}
                  className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold"
                >
                  Go to My Trips
                </button>
              </div>
            )}
          </div>
        )}

        {/* Screen 6: Itinerary View Screen */}
        {currentTab === 'itinerary-view' && (
          <div className="animate-fade-in">
            {activeTrip ? (
              <ItineraryView
                trip={activeTrip}
                onBackToBuilder={() => setCurrentTab('builder')}
                onShareTrip={() => handleShareTrip(activeTrip)}
              />
            ) : (
              <div className="py-20 text-center">
                <p className="text-sm font-bold">Select a trip first</p>
              </div>
            )}
          </div>
        )}

        {/* Screen 7: Destinations / City Search Screen */}
        {currentTab === 'cities' && (
          <div className="animate-fade-in">
            <CitySearch onAddCityToTrip={handleAddCityToTrip} />
          </div>
        )}

        {/* Screen 8: Activity Search Screen */}
        {currentTab === 'activities' && (
          <div className="animate-fade-in">
            <ActivitySearch
              onAssignActivity={(act) => {
                if (activeTrip) {
                  setCurrentTab('builder');
                  showToast(`Opened builder. Assign "${act.activity_name}" to a stop.`, 'info');
                } else {
                  showToast('Please create or select a trip first', 'info');
                  setCurrentTab('my-trips');
                }
              }}
            />
          </div>
        )}

        {/* Screen 9: Trip Budget & Cost Breakdown Screen */}
        {currentTab === 'budget' && (
          <div className="animate-fade-in">
            {activeTrip ? (
              <BudgetBreakdown
                trip={activeTrip}
                onBackToBuilder={() => setCurrentTab('builder')}
              />
            ) : (
              <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-samsung">
                <p className="text-base font-bold text-black">Select an itinerary to calculate expenses</p>
                <p className="text-xs text-neutral-500 mt-1 mb-5">
                  Choose a trip from your list to see hotel, transit, food, and activity breakdown.
                </p>
                <button
                  onClick={() => setCurrentTab('my-trips')}
                  className="samsung-pill-btn samsung-pill-primary px-6 py-2.5 text-xs font-bold"
                >
                  View My Trips
                </button>
              </div>
            )}
          </div>
        )}

        {/* Screen 10: Trip Calendar / Timeline Screen */}
        {currentTab === 'calendar' && (
          <div className="animate-fade-in">
            {activeTrip ? (
              <TripCalendar trip={activeTrip} />
            ) : (
              <div className="py-20 text-center">
                <p className="text-sm font-bold">Please select a trip first</p>
              </div>
            )}
          </div>
        )}

        {/* Screen 11: Shared / Public Itinerary View Screen */}
        {currentTab === 'shared' && (
          <div className="animate-fade-in">
            <PublicItinerary
              shareToken={publicShareToken || 'demo-token'}
              onBackToApp={() => setCurrentTab('dashboard')}
            />
          </div>
        )}

        {/* Screen 12: User Profile & Settings Screen */}
        {currentTab === 'profile' && (
          <div className="animate-fade-in">
            <ProfileSettings onPlanTripWithCity={handleAddCityToTrip} />
          </div>
        )}

        {/* Screen 13: Admin / Analytics Dashboard */}
        {currentTab === 'admin' && (
          <div className="animate-fade-in">
            <AdminDashboard />
          </div>
        )}
      </main>

      {/* Minimalist Monochrome Footer */}
      <Footer onNavigate={(tab) => setCurrentTab(tab)} />

      {/* Global Modals & Toasts */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <CreateTripModal
        isOpen={isCreateTripOpen}
        onClose={() => {
          setIsCreateTripOpen(false);
          setTripToEdit(null);
        }}
        tripToEdit={tripToEdit}
      />

      {tripToShare && (
        <ShareModal
          isOpen={!!tripToShare}
          onClose={() => setTripToShare(null)}
          trip={tripToShare}
          onOpenPublicView={(token) => {
            setPublicShareToken(token);
            setCurrentTab('shared');
          }}
        />
      )}

      <CommandPalette
        isOpen={isSearchPaletteOpen}
        onClose={() => setIsSearchPaletteOpen(false)}
        onSelectCity={(city) => {
          setSelectedCityForModal(city);
        }}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      {selectedCityForModal && (
        <CityDetailsModal
          city={selectedCityForModal}
          onClose={() => setSelectedCityForModal(null)}
          onAddToTrip={handleAddCityToTrip}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <TripProvider>
        <AppContent />
      </TripProvider>
    </AuthProvider>
  );
};

export default App;
