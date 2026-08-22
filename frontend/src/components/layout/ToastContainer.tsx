import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useTrips } from '../../context/TripContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useTrips();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-black p-4 text-white shadow-samsung-dark animate-fade-in"
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && (
              <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="h-5 w-5 text-neutral-300 flex-shrink-0" />
            )}
            {toast.type === 'info' && (
              <Info className="h-5 w-5 text-neutral-300 flex-shrink-0" />
            )}
            <p className="text-xs font-semibold tracking-wide text-neutral-100 leading-snug">
              {toast.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
