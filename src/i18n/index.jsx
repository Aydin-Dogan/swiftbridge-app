/**
 * i18n — Eenvoudig, lichtgewicht (geen externe library)
 *
 * Gebruik: const { t, taal, zetTaal } = useTaal();
 *          <h1>{t('welkom')}</h1>
 *          {t('hallo_naam', { naam: 'Aydin' })}
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { apiFetch } from '../services/api';
import { nl } from './nl';
import { tr } from './tr';
import { en } from './en';
import { ru } from './ru';
import { az } from './az';

const VERTALINGEN = { nl, tr, en, ru, az };
const STORAGE_KEY = 'swiftbridge_taal';

// Bepaal startaal: URL pad > localStorage > browser > nl
// URL pad heeft hoogste prioriteit zodat /tr/ ALTIJD in Turkse taal opent,
// ook als gebruiker eerder NL had gekozen — voor consistente SEO + share-links.
function detecteerTaal() {
  if (typeof window === 'undefined') return 'nl';

  // Check URL pad — eerste segment kan een locale-code zijn (/tr/, /en/...)
  const segments = (window.location.pathname || '/').split('/').filter(Boolean);
  if (segments.length > 0) {
    const eerste = segments[0].toLowerCase();
    if (VERTALINGEN[eerste]) return eerste;
  }

  const opgeslagen = localStorage.getItem(STORAGE_KEY);
  if (opgeslagen && VERTALINGEN[opgeslagen]) return opgeslagen;
  const browserTaal = (navigator.language || 'nl').slice(0, 2).toLowerCase();
  return VERTALINGEN[browserTaal] ? browserTaal : 'nl';
}

const TaalContext = createContext({ taal: 'nl', t: k => k, zetTaal: () => {}, koppelAccount: () => {} });

export function TaalProvider({ children }) {
  const [taal, setTaal] = useState(detecteerTaal);
  const taalNu = useRef(taal);

  // De server kent de taal van de klant: mails en pushberichten volgen
  // gebruikers.taal, en die bleef op 'nl' staan (ronde 3, onderdeel 5). Bij
  // inloggen en bij elke taalwissel gaat daarom één PATCH /users/me met alleen
  // {taal}: alleen voor een ingelogde klant en alleen als de server een andere
  // taal heeft. App.jsx meldt via koppelAccount wie er is ingelogd.
  // serverTaal null = nog onbekend; het profiel van /auth/me geeft hem niet mee.
  const account = useRef({ id: null, serverTaal: null });
  // Eén aanroep tegelijk en op volgorde: bij snel wisselen komt de laatste
  // keuze ook als laatste op de server aan.
  const wachtrij = useRef(Promise.resolve());

  const taalNaarServer = useCallback((gewenst) => {
    wachtrij.current = wachtrij.current.then(async () => {
      const id = account.current.id;
      if (!id) return;
      if (account.current.serverTaal == null) {
        const profiel = await apiFetch('/users/me');
        if (account.current.id !== id) return;
        account.current.serverTaal = profiel?.taal || null;
      }
      if (account.current.serverTaal === gewenst) return;
      const antwoord = await apiFetch('/users/me', { method: 'PATCH', body: { taal: gewenst } });
      if (account.current.id === id) account.current.serverTaal = antwoord?.gebruiker?.taal || gewenst;
    }).catch(() => {
      // Mislukt: de taal in de app is al gewisseld. De server houdt zijn oude
      // taal, dus de volgende wissel of inlog probeert het opnieuw.
    });
  }, []);

  // gebruiker null = uitgelogd. Met { naarServer: true } (na inloggen of
  // registreren) gaat de taal van de app meteen mee; zonder (opstarten met een
  // bestaande sessie) wordt alleen bekend wie er is ingelogd.
  const koppelAccount = useCallback((gebruiker, { naarServer = false } = {}) => {
    const id = gebruiker?.id || null;
    if (id !== account.current.id) account.current = { id, serverTaal: null };
    if (id && gebruiker.taal) account.current.serverTaal = gebruiker.taal;
    if (naarServer) taalNaarServer(taalNu.current);
  }, [taalNaarServer]);

  function zetTaal(nieuweTaal) {
    if (!VERTALINGEN[nieuweTaal]) return;
    setTaal(nieuweTaal);
    taalNu.current = nieuweTaal;
    localStorage.setItem(STORAGE_KEY, nieuweTaal);
    document.documentElement.lang = nieuweTaal;
    taalNaarServer(nieuweTaal);
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
    <TaalContext.Provider value={{ taal, t, zetTaal, koppelAccount }}>
      {children}
    </TaalContext.Provider>
  );
}

export function useTaal() {
  return useContext(TaalContext);
}

// `vlag` is een ISO-landcode — rendering gebeurt via de <Vlag /> component
// (SVG flag-icons), geen emoji meer (fintech-look + Windows-renderproblemen).
export const TALEN = [
  { code: 'nl', vlag: 'NL', naam: 'Nederlands' },
  { code: 'tr', vlag: 'TR', naam: 'Türkçe'    },
  { code: 'en', vlag: 'GB', naam: 'English'   },
  { code: 'ru', vlag: 'RU', naam: 'Русский'   },
  { code: 'az', vlag: 'AZ', naam: 'Azərbaycan' },
];
