/**
 * favorieteValutas.js — Hook voor user-favoriete valutacodes (KKK/MMM).
 *
 * Bronnen, in volgorde van waarheid:
 *   1. /users/me bij ingelogde gebruiker (gezaghebbend)
 *   2. localStorage 'favoriete_valutas_cache' (snelle herstart, anonieme bezoeker)
 *   3. Lege lijst (default)
 *
 * Patroon:
 *   const { favorieten, toggleFavoriet, isFavoriet } = useFavorieteValutas(gebruiker);
 *
 *   <CurrencySelector
 *     favorieten={favorieten}
 *     onToggleFavoriet={toggleFavoriet}
 *     ...
 *   />
 *
 * Optimistic update: lokale state direct gewijzigd, daarna PATCH /users/me
 * (debounced 800ms zodat snel achter elkaar klikken niet 5 calls genereert).
 * Backend faalt? Lokaal blijft het zoals user verwacht — we re-syncen niet
 * (dat zou de UI laten flikkeren). De volgende /users/me bij refresh
 * herstelt de werkelijke waarheid.
 *
 * Voor anonieme bezoeker: alleen localStorage. Bij login worden de
 * cached favs gemerged met server-favs en gepushed.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from './api';

const CACHE_KEY = 'favoriete_valutas_cache';
const MAX_FAVORIETEN = 12; // ruime cap tegen misbruik

function leesCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(c => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

function schrijfCache(codes) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(codes));
  } catch {
    // Storage full of disabled — geen probleem, server is leidend
  }
}

function dedupe(codes) {
  return Array.from(new Set(codes.map(c => String(c).toUpperCase().trim()).filter(Boolean)));
}

export function useFavorieteValutas(gebruiker) {
  // Init: server-favorieten (indien ingelogd) overrules cache.
  const [favorieten, setFavorieten] = useState(() => {
    const fromUser = Array.isArray(gebruiker?.favorieteValutas)
      ? gebruiker.favorieteValutas
      : null;
    return dedupe(fromUser || leesCache());
  });

  // Sync wanneer gebruiker-prop vernieuwt (bv na haalProfiel())
  useEffect(() => {
    if (gebruiker?.favorieteValutas && Array.isArray(gebruiker.favorieteValutas)) {
      const serverFavs = dedupe(gebruiker.favorieteValutas);
      setFavorieten(serverFavs);
      schrijfCache(serverFavs);
    }
  }, [gebruiker?.favorieteValutas]);

  // Debounced server-sync — voorkomt PATCH-spam bij snel klikken.
  // We proberen ALTIJD te syncen (cookies leveren auth). Bij 401/403 (anoniem
  // op landing/calculator) faalt het stil — de lokale cache blijft leidend.
  const syncTimer = useRef(null);
  const syncNaarServer = useCallback((nieuweCodes) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      apiFetch('/users/me', {
        method: 'PATCH',
        body: { favorieteValutas: nieuweCodes },
      }).catch(() => {
        // Stil falen: 401 voor anoniem, of netwerk-issue. Cache blijft.
      });
    }, 800);
  }, []);

  // Cleanup bij unmount
  useEffect(() => () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
  }, []);

  const toggleFavoriet = useCallback((code) => {
    const c = String(code || '').toUpperCase().trim();
    if (!c) return;
    setFavorieten((huidig) => {
      let nieuwe;
      if (huidig.includes(c)) {
        nieuwe = huidig.filter(x => x !== c);
      } else {
        if (huidig.length >= MAX_FAVORIETEN) {
          // Soft-cap: schuif oudste eruit ipv weigeren
          nieuwe = [...huidig.slice(1), c];
        } else {
          nieuwe = [...huidig, c];
        }
      }
      schrijfCache(nieuwe);
      syncNaarServer(nieuwe);
      return nieuwe;
    });
  }, [syncNaarServer]);

  const isFavoriet = useCallback((code) => {
    if (!code) return false;
    return favorieten.includes(String(code).toUpperCase());
  }, [favorieten]);

  return { favorieten, toggleFavoriet, isFavoriet };
}
