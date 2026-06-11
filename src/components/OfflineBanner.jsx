/**
 * OfflineBanner — Toont een banner als de gebruiker offline is
 */
import { useEffect, useState } from 'react';
import { AlertTriangle } from './icons/Icons';

export default function OfflineBanner() {
  const [offline, setOffline ] = useState(!navigator.onLine);
  const [terugOnline, setTerugOnline] = useState(false);

  useEffect(() => {
    function online() {
      setOffline(false);
      setTerugOnline(true);
      setTimeout(() => setTerugOnline(false), 3000);
    }
    function offline() { setOffline(true); }
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  if (offline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white px-4 py-2 text-center text-sm font-semibold shadow-lg">
        <span className="inline-flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Geen internet — sommige functies werken niet
        </span>
      </div>
    );
  }

  if (terugOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] bg-green-600 text-white px-4 py-2 text-center text-sm font-semibold shadow-lg transition">
        Verbinding hersteld
      </div>
    );
  }

  return null;
}
