import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Sparkles, Clock, DollarSign } from 'lucide-react';
import { Trip, TripStop } from '../../types';
import { useTrips } from '../../context/TripContext';

interface TripCalendarProps {
  trip: Trip;
}

export const TripCalendar: React.FC<TripCalendarProps> = ({ trip }) => {
  const { activeStops } = useTrips();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(trip.start_date);

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);

  // Current month being viewed
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(trip.start_date));

  // Build calendar matrix
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Leading empty days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];

      // Check if within trip range
      const isWithinTrip = date >= startDate && date <= endDate;

      // Find active stop
      const stop = activeStops.find((s) => {
        const arr = new Date(s.arrival_date);
        const dep = new Date(s.departure_date);
        return date >= arr && date <= dep;
      });

      // Activities on this day
      const acts = stop?.activities?.filter((a) => a.activity_date === dateStr) || [];

      days.push({
        dayNumber: d,
        dateStr,
        isWithinTrip,
        stop,
        activities: acts,
      });
    }
    return days;
  }, [currentMonth, trip, activeStops]);

  // Details for selected day
  const selectedDayInfo = useMemo(() => {
    if (!selectedDateStr) return null;
    const date = new Date(selectedDateStr);
    const stop = activeStops.find((s) => {
      const arr = new Date(s.arrival_date);
      const dep = new Date(s.departure_date);
      return date >= arr && date <= dep;
    });
    const acts = stop?.activities?.filter((a) => a.activity_date === selectedDateStr) || [];

    return {
      dateStr: selectedDateStr,
      formatted: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      stop,
      activities: acts,
    };
  }, [selectedDateStr, activeStops]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Visual Scheduling
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
            Trip Calendar & Timeline
          </h2>
          <p className="text-xs text-neutral-500">
            Interactive visual calendar view across your journey schedule
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={prevMonth}
            className="rounded-full p-2 border border-neutral-200 hover:bg-neutral-100 hover:text-black transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-black uppercase tracking-wider px-3">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-full p-2 border border-neutral-200 hover:bg-neutral-100 hover:text-black transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Grid + Day Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-1.5 pt-3">
            {daysInMonth.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-2xl bg-neutral-50/40" />;
              }

              const isSelected = selectedDateStr === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`group relative h-20 sm:h-24 p-2 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-md'
                      : day.isWithinTrip
                      ? 'bg-neutral-50 border-neutral-200 hover:border-black text-neutral-900'
                      : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{day.dayNumber}</span>
                    {day.stop && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-black'
                        }`}
                      />
                    )}
                  </div>

                  <div>
                    {day.stop && (
                      <p className={`text-[10px] font-bold truncate ${isSelected ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        {day.stop.city?.city_name}
                      </p>
                    )}
                    {day.activities.length > 0 && (
                      <span className={`text-[9px] font-medium block truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {day.activities.length} acts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Details Drawer */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-samsung flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-100 pb-4 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Selected Day Schedule
              </span>
              <h3 className="text-lg font-black text-black mt-0.5">
                {selectedDayInfo?.formatted}
              </h3>
            </div>

            {selectedDayInfo?.stop ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-black" />
                    <span className="font-black text-sm text-black">
                      {selectedDayInfo.stop.city?.city_name}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Hotel: ₹{selectedDayInfo.stop.city?.avg_hotel_cost} • Food: ₹{selectedDayInfo.stop.city?.avg_food_cost}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Scheduled Activities ({selectedDayInfo.activities.length})
                  </h4>

                  {selectedDayInfo.activities.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-2">
                      No activities set for this date.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayInfo.activities.map((act) => (
                        <div
                          key={act.id}
                          className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-neutral-500">
                            <span>{act.activity_time || 'Flexible'}</span>
                            <span className="font-bold text-black">
                              ₹{act.custom_cost ?? act.activity?.estimated_cost ?? 0}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-black mt-1">
                            {act.activity?.activity_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic py-8 text-center">
                Date outside scheduled trip stops.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
