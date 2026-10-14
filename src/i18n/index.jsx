/**
 * i18n — Eenvoudig, lichtgewicht (geen externe library)
 *
 * Gebruik: const { t, taal, zetTaal, herstelTaal } = useTaal();
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
// De taal waarmee de server een nieuw account aanmaakt (gebruikers.taal
// DEFAULT 'nl'); bij registreren legt de API nog geen taal vast.
const STANDAARD_SERVERTAAL = 'nl';

// Bepaal startaal: URL pad > localStorage > browser > nl
// URL pad heeft hoogste prioriteit zodat /tr/ ALTIJD in Turkse taal opent,
// ook als gebruiker eerder NL had gekozen — voor consistente SEO + share-links.
// gekozen: de taal komt uit het adres of uit een eerdere keuze op dit toestel.
// De browsertaal (of 'nl' als laatste uitweg) is een gok.
function detecteerTaal() {
  if (typeof window === 'undefined') return { taal: 'nl', gekozen: false };

  // Check URL pad — eerste segment kan een locale-code zijn (/tr/, /en/...)
  const segments = (window.location.pathname || '/').split('/').filter(Boolean);
  if (segments.length > 0) {
    const eerste = segments[0].toLowerCase();
    if (VERTALINGEN[eerste]) return { taal: eerste, gekozen: true };
  }

  const opgeslagen = localStorage.getItem(STORAGE_KEY);
  if (opgeslagen && VERTALINGEN[opgeslagen]) return { taal: opgeslagen, gekozen: true };
  const browserTaal = (navigator.language || 'nl').slice(0, 2).toLowerCase();
  return { taal: VERTALINGEN[browserTaal] ? browserTaal : 'nl', gekozen: false };
}

const TaalContext = createContext({ taal: 'nl', t: k => k, zetTaal: () => {}, herstelTaal: () => {}, koppelAccount: () => {} });

export function TaalProvider({ children }) {
  const [begin] = useState(detecteerTaal);
  const [taal, setTaal] = useState(begin.taal);
  const taalNu = useRef(taal);
  // Is de taal op dit toestel bewust gekozen (adres, eerdere keuze, zetTaal)?
  // Zo niet, dan is het een gok uit de browsertaal (review ronde 3).
  const taalGekozen = useRef(begin.gekozen);

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

  // { gok: true }: de taal is alleen uit de browser gehaald. Die vervangt dan
  // alleen de standaardtaal van een nieuw account, nooit een taal die de klant
  // elders koos. Anders zette één keer inloggen op een Nederlandstalige pc een
  // klant met Turks op de server terug op Nederlands.
  const taalNaarServer = useCallback((gewenst, { gok = false } = {}) => {
    wachtrij.current = wachtrij.current.then(async () => {
      const id = account.current.id;
      if (!id) return;
      if (account.current.serverTaal == null) {
        const profiel = await apiFetch('/users/me');
        if (account.current.id !== id) return;
        account.current.serverTaal = profiel?.taal || null;
      }
      if (account.current.serverTaal === gewenst) return;
      if (gok && account.current.serverTaal && account.current.serverTaal !== STANDAARD_SERVERTAAL) return;
      const antwoord = await apiFetch('/users/me', { method: 'PATCH', body: { taal: gewenst } });
      if (account.current.id === id) account.current.serverTaal = antwoord?.gebruiker?.taal || gewenst;
    }).catch(() => {
      // Mislukt: de taal in de app is al gewisseld. De server houdt zijn oude
      // taal, dus de volgende wissel of inlog probeert het opnieuw.
    });
  }, []);

  // gebruiker null = uitgelogd. Met { naarServer: true } (na inloggen of
  // registreren) gaat de taal van de app meteen mee; zonder (opstarten met een
  // bestaande sessie) wordt alleen bekend wie er is ingelogd. Een gegokte taal
  // gaat alleen mee over de standaardtaal heen (zie taalNaarServer).
  const koppelAccount = useCallback((gebruiker, { naarServer = false } = {}) => {
    const id = gebruiker?.id || null;
    if (id !== account.current.id) account.current = { id, serverTaal: null };
    if (id && gebruiker.taal) account.current.serverTaal = gebruiker.taal;
    if (naarServer) taalNaarServer(taalNu.current, { gok: !taalGekozen.current });
  }, [taalNaarServer]);

  // Met { bewaar: false } wisselt alleen wat je ziet: niets in localStorage,
  // niets naar de server, en taalNu blijft de bewaarde taal. Voor de
  // afmeldpagina in de taal van de mail; een oude mail mag de taal die de klant
  // later koos niet terugzetten (review ronde 3). herstelTaal() zet daarna de
  // bewaarde taal weer terug.
  function zetTaal(nieuweTaal, { bewaar = true } = {}) {
    if (!VERTALINGEN[nieuweTaal]) return;
    setTaal(nieuweTaal);
    document.documentElement.lang = nieuweTaal;
    if (!bewaar) return;
    taalNu.current = nieuweTaal;
    taalGekozen.current = true;
    localStorage.setItem(STORAGE_KEY, nieuweTaal);
    taalNaarServer(nieuweTaal);
  }

  function herstelTaal() {
    setTaal(taalNu.current);
    document.documentElement.lang = taalNu.current;
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
    <TaalContext.Provider value={{ taal, t, zetTaal, herstelTaal, koppelAccount }}>
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
