import React from 'react';

export const Footer: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-neutral-200 bg-white text-black py-12 transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                <span className="font-black text-sm">G</span>
              </div>
              <span className="font-black text-lg tracking-tight">GLOBETROTTER</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Empowering personalized travel planning through intelligent itineraries, 
              budget visibility, and intuitive multi-city journey mapping.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database Connected
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Explore Platform
            </h4>
            <ul className="space-y-2 text-xs font-medium text-neutral-600">
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-black transition-colors">
                  Travel Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cities')} className="hover:text-black transition-colors">
                  City Directory (30 Destinations)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-trips')} className="hover:text-black transition-colors">
                  My Trip Plans
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('builder')} className="hover:text-black transition-colors">
                  Itinerary Builder & Stop Organizer
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Capabilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Core Capabilities
            </h4>
            <ul className="space-y-2 text-xs font-medium text-neutral-600">
              <li>
                <button onClick={() => onNavigate('budget')} className="hover:text-black transition-colors">
                  Real-time Budget Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shared')} className="hover:text-black transition-colors">
                  Sharable Public Itineraries
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-black transition-colors">
                  Admin Analytics & AI Ingestion
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('profile')} className="hover:text-black transition-colors">
                  Profile & Saved Wishlist
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Design & Engineering */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Design & Architecture
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed mb-3">
              Built with a high-contrast Samsung monochrome design system, relational Supabase database, and automated distance-cost engines.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-neutral-600">
              <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">React + TS</span>
              <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">Tailwind</span>
              <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">Supabase DB</span>
              <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">Recharts</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} GlobeTrotter. All rights reserved. Crafted with minimalist monochrome precision.</p>
          <div className="flex items-center gap-4">
            <span className="text-neutral-400">Design inspired by Samsung Global Monochrome</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
