/**
 * i18n — Eenvoudig, lichtgewicht (geen externe library)
 *
 * Gebruik: const { t, taal, zetTaal } = useTaal();
 *          <h1>{t('welkom')}</h1>
 *          {t('hallo_naam', { naam: 'Aydin' })}
 */
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { nl } from './nl';
import { tr } from './tr';
import { en } from './en';
import { ru } from './ru';
import { az } from './az';

const VERTALINGEN = { nl, tr, en, ru, az };
const STORAGE_KEY = 'swiftbridge_taal';

// Bepaal startaal: localStorage > browser > nl
function detecteerTaal() {
  if (typeof window === 'undefined') return 'nl';
  const opgeslagen = localStorage.getItem(STORAGE_KEY);
  if (opgeslagen && VERTALINGEN[opgeslagen]) return opgeslagen;
  const browserTaal = (navigator.language || 'nl').slice(0, 2).toLowerCase();
  return VERTALINGEN[browserTaal] ? browserTaal : 'nl';
}

const TaalContext = createContext({ taal: 'nl', t: k => k, zetTaal: () => {} });

export function TaalProvider({ children }) {
  const [taal, setTaal] = useState(detecteerTaal);

  function zetTaal(nieuweTaal) {
    if (!VERTALINGEN[nieuweTaal]) return;
    setTaal(nieuweTaal);
    localStorage.setItem(STORAGE_KEY, nieuweTaal);
    document.documentElement.lang = nieuweTaal;
  }

  useEffect(() => {
    document.documentElement.lang = taal;
  }, [taal]);

  // t() functie — haal vertaling op met variabelen
  // Ondersteunt geneste keys via puntnotatie, bv. t('errors.SERVER_ERROR').
  const t = useMemo(() => {
    const dict = VERTALINGEN[taal] || VERTALINGEN.nl;
    function lookup(d, sleutel) {
      if (d == null) return undefined;
      if (sleutel in d) return d[sleutel];
      // Geneste lookup voor "groep.code" notatie
      if (sleutel.includes('.')) {
        const segmenten = sleutel.split('.');
        let waarde = d;
        for (const s of segmenten) {
          if (waarde == null) return undefined;
          waarde = waarde[s];
        }
        return waarde;
      }
      return undefined;
    }
    return (sleutel, vars = {}) => {
      let tekst = lookup(dict, sleutel);
      if (tekst === undefined) tekst = lookup(VERTALINGEN.nl, sleutel);
      if (tekst === undefined) tekst = sleutel;
      if (typeof tekst !== 'string') return tekst; // bv. t('errors') retourneert het object
      for (const [k, v] of Object.entries(vars)) {
        tekst = tekst.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
      return tekst;
    };
  }, [taal]);

  return (
    <TaalContext.Provider value={{ taal, t, zetTaal }}>
      {children}
    </TaalContext.Provider>
  );
}

export function useTaal() {
  return useContext(TaalContext);
}

export const TALEN = [
  { code: 'nl', vlag: '🇳🇱', naam: 'Nederlands' },
  { code: 'tr', vlag: '🇹🇷', naam: 'Türkçe'    },
  { code: 'en', vlag: '🇬🇧', naam: 'English'   },
  { code: 'ru', vlag: '🇷🇺', naam: 'Русский'   },
  { code: 'az', vlag: '🇦🇿', naam: 'Azərbaycan' },
];
