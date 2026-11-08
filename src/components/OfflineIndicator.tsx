import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  lang: 'ar' | 'en';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  const isAr = lang === 'ar';

  if (isOnline) return null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-3 rounded-xl bg-amber-500/95 text-slate-950 px-4 py-2.5 shadow-2xl backdrop-blur-md border border-amber-300 text-xs font-semibold animate-in slide-in-from-bottom-2 duration-300"
    >
      <div className="w-6 h-6 rounded-lg bg-amber-600/30 flex items-center justify-center shrink-0">
        <WifiOff className="w-3.5 h-3.5 text-slate-950" />
      </div>
      <div className="flex-1">
        <div className="font-bold">
          {isAr ? 'وضع عدم الاتصال بالإنترنت (Offline Mode)' : 'Offline Mode Active'}
        </div>
        <div className="text-[11px] text-slate-900/80 font-normal">
          {isAr
            ? 'التطبيق يعمل باستقلالية تامة عبر ذاكرة التخزين المحلية (Service Worker).'
            : 'Nafas is operating in offline mode via local service worker caching.'}
        </div>
      </div>
      <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping shrink-0" />
    </div>
  );
};
