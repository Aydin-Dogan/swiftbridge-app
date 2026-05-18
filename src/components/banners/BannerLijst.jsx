/**
 * BannerLijst.jsx — Toont alle actieve app-wide banners.
 *
 * Werking:
 *   - Haalt /banners/actief op (geen auth nodig — publiek endpoint).
 *   - Filtert banners die deze gebruiker via localStorage al heeft gedismist
 *     (key: sb_banner_dismissed_{id}).
 *   - Toont max 3 zichtbaar tegelijk; oudere komen weer naar boven zodra
 *     nieuwere worden weggeklikt.
 *   - Niet-sluitbare banners blijven altijd staan (geen × knop).
 *   - Faalt stil bij netwerkfout: geen banner liever dan een lege error-state.
 */
import { useEffect, useState, useCallback } from 'react';
import Banner from './Banner';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DISMISS_PREFIX = 'sb_banner_dismissed_';
const MAX_ZICHTBAAR = 3;

function isGedismist(id) {
  try { return localStorage.getItem(DISMISS_PREFIX + id) === '1'; }
  catch { return false; }
}

function markeerGedismist(id) {
  try { localStorage.setItem(DISMISS_PREFIX + id, '1'); }
  catch { /* private mode / quota — negeer */ }
}

export default function BannerLijst() {
  const [banners, setBanners]       = useState([]);
  const [gedismist, setGedismist]   = useState({});  // {id: true}
  const [geladen, setGeladen]       = useState(false);

  // ── Banners ophalen ────────────────────────────────────────────────────────
  const laden = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/banners/actief`);
      if (!res.ok) return;
      const json = await res.json();
      setBanners(Array.isArray(json.banners) ? json.banners : []);
    } catch {
      /* netwerkfout — banners zijn niet kritiek, stil falen */
    } finally {
      setGeladen(true);
    }
  }, []);

  useEffect(() => {
    laden();
    // Re-fetch wanneer admin elders een banner aanmaakt/wijzigt:
    const handler = () => laden();
    window.addEventListener('swiftbridge_banners_update', handler);
    return () => window.removeEventListener('swiftbridge_banners_update', handler);
  }, [laden]);

  // ── Initial dismissed state uit localStorage ───────────────────────────────
  useEffect(() => {
    if (!banners.length) return;
    const map = {};
    for (const b of banners) {
      if (b.sluitbaar && isGedismist(b.id)) map[b.id] = true;
    }
    setGedismist(map);
  }, [banners]);

  function dismiss(id) {
    markeerGedismist(id);
    setGedismist((g) => ({ ...g, [id]: true }));
  }

  if (!geladen) return null;
  const zichtbaar = banners.filter((b) => !gedismist[b.id]).slice(0, MAX_ZICHTBAAR);
  if (!zichtbaar.length) return null;

  return (
    <div className="space-y-3" aria-label="App-meldingen">
      {zichtbaar.map((b) => (
        <Banner key={b.id} banner={b} onDismiss={() => dismiss(b.id)} />
      ))}
    </div>
  );
}
