import React from 'react';
import { Sparkles, Clock, DollarSign, Star, Plus, MapPin } from 'lucide-react';
import { Activity } from '../../types';

interface ActivityCardProps {
  activity: Activity;
  cityName?: string;
  onAddActivity?: (activity: Activity) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  cityName,
  onAddActivity,
}) => {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:border-black hover:shadow-samsung">
      <div>
        {/* Cover Photo or Fallback */}
        <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-neutral-900 mb-3">
          <img
            src={
              activity.image_url ||
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80'
            }
            alt={activity.activity_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80';
            }}
          />

          <div className="absolute top-2.5 left-2.5">
            <span className="rounded-full bg-black/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-neutral-700">
              {activity.category}
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5">
            <span className="rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-black flex items-center gap-1 shadow-sm">
              <Star className="h-3 w-3 fill-black text-black" />
              {activity.rating}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-black line-clamp-1 group-hover:text-neutral-700 transition-colors">
            {activity.activity_name}
          </h4>

          {cityName && (
            <p className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-neutral-400" />
              {cityName}
            </p>
          )}

          {activity.description && (
            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
              {activity.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer Details & Action Button */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-neutral-400 block font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {activity.duration_hours} hrs
          </span>
          <span className="text-sm font-black text-black">
            ₹{activity.estimated_cost}
          </span>
        </div>

        {onAddActivity && (
          <button
            onClick={() => onAddActivity(activity)}
            className="samsung-pill-btn samsung-pill-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1"
            title="Assign to Stop"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
};
