/**
 * InternApp.jsx — De router van de INTERNE omgeving.
 *
 * Ronde 0 uit het architectuurbesluit van 29 september 2026: de
 * compliance-schermen zitten niet langer in de klantapplicatie maar in een
 * eigen bundel met een eigen ingang.
 *
 * WAAROM DIT EEN APARTE BUNDEL IS
 * Een React-app wordt als JavaScript naar de browser gestuurd. Zat het
 * compliance-scherm in dezelfde bundel als het klantscherm, dan kon elke
 * bezoeker die downloaden en lezen: welke endpoints er zijn, welke redencodes
 * er bestaan, hoe de beoordeling werkt. Niet bruikbaar zonder de juiste rol,
 * maar wel leesbaar - en juist bij een compliance-omgeving is die informatie
 * waardevol voor precies de verkeerde persoon.
 *
 * Let op: het scheiden van de bundel is GEEN beveiliging. De beveiliging is dat
 * de server elk verzoek onder /admin weigert zonder de juiste rol, en dat elke
 * weigering wordt vastgelegd (middleware/admin.js). Deze scheiding zorgt er
 * alleen voor dat de werkwijze niet op straat ligt.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import InternAanmelden from './InternAanmelden';
import InternWachtwoord from './InternWachtwoord';

const AdminCompliance = lazy(() => import('./AdminCompliance'));
const AdminPanel = lazy(() => import('./AdminPanel'));
const AdminOverzicht = lazy(() => import('./AdminOverzicht'));
const AdminErrors = lazy(() => import('./AdminErrors'));

function Laden() {
  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center">
      <div className="text-ink-2 animate-pulse">Laden...</div>
    </div>
  );
}

/** Wat een bezoeker ziet die hier per ongeluk belandt. Geen enkele hint. */
function Onbekend() {
  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-md p-8 max-w-sm text-center shadow-soft">
        <h1 className="font-display text-lg font-medium text-ink-1 mb-2">Pagina niet gevonden</h1>
        <Link to="/" className="text-fg-primary text-sm font-medium hover:underline">
          Terug naar het overzicht
        </Link>
      </div>
    </div>
  );
}

const API = import.meta.env.VITE_API_URL || '/api';

/**
 * Het basispad van deze omgeving.
 *
 * Nu draait de interne omgeving op /intern van hetzelfde domein; na stap 8 van
 * het architectuurbesluit op intern.swiftbridge.nl, waar hij op de wortel staat.
 * De router moet in beide gevallen kloppen, anders komt elke route uit op
 * "pagina niet gevonden" — precies wat er gebeurde toen dit ontbrak.
 */
function basisPad() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname.startsWith('/intern') ? '/intern' : '/';
}

/**
 * Wie is er aangemeld? De server beslist dat, niet de browser.
 *
 * Er wordt bewust niets in localStorage bewaard: de enige bron is de
 * sb_intern-cookie, en die is HttpOnly. Dit scherm weet dus alleen wat de
 * server zegt. Verloopt de sessie tussendoor, dan geeft het eerstvolgende
 * verzoek een weigering en komt de medewerker vanzelf weer op het aanmeldscherm.
 */
function useMedewerker() {
  const [stand, setStand] = useState({ bezig: true, medewerker: null });

  useEffect(() => {
    let weg = false;
    fetch(`${API}/intern/auth/ik`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!weg) setStand({ bezig: false, medewerker: d ? d.medewerker : null }); })
      .catch(() => { if (!weg) setStand({ bezig: false, medewerker: null }); });
    return () => { weg = true; };
  }, []);

  return [stand, setStand];
}

function Kop({ medewerker, opAfmelden, opWachtwoord }) {
  // Bewust tolerant: een ontbrekend veld mag nooit het hele scherm wit maken.
  // Dat gebeurde wel toen hier een verzonnen object binnenkwam zonder rol.
  const naam = medewerker?.naam || 'Medewerker';
  const rol = String(medewerker?.rol || '').replace(/_/g, ' ');
  return (
    <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
      <span className="text-sm text-ink-2">
        {naam}{rol ? <> · <span className="text-ink-3">{rol}</span></> : null}
      </span>
      <span className="flex items-center gap-4">
        <button type="button" onClick={opWachtwoord} className="text-sm text-ink-3 hover:text-ink-1 hover:underline">
          Wachtwoord
        </button>
        <button type="button" onClick={opAfmelden} className="text-sm text-ink-3 hover:text-ink-1 hover:underline">
          Afmelden
        </button>
      </span>
    </div>
  );
}

export default function InternApp() {
  const [stand, setStand] = useMedewerker();
  const [wachtwoordScherm, setWachtwoordScherm] = useState(false);

  async function afmelden() {
    try {
      await fetch(`${API}/intern/auth/afmelden`, { method: 'POST', credentials: 'include' });
    } catch { /* ook zonder netwerk terug naar het aanmeldscherm */ }
    setStand({ bezig: false, medewerker: null });
  }

  if (stand.bezig) return <Laden />;

  // Geen sessie: alleen het aanmeldscherm. De schermen hieronder worden dan
  // niet eens geladen, dus ook hun code komt niet in beeld.
  if (!stand.medewerker) {
    return <InternAanmelden opAangemeld={(m) => setStand({ bezig: false, medewerker: m })} />;
  }

  // Bewust buiten de router: het wachtwoordscherm hoort niet in de
  // browsergeschiedenis, zodat een terug-knop er niet middenin terugkomt.
  if (wachtwoordScherm) {
    return <InternWachtwoord opKlaar={() => setWachtwoordScherm(false)} />;
  }

  return (
    <BrowserRouter basename={basisPad()}>
      <Kop
        medewerker={stand.medewerker}
        opAfmelden={afmelden}
        opWachtwoord={() => setWachtwoordScherm(true)}
      />
      <Suspense fallback={<Laden />}>
        <Routes>
          {/* De compliance-werkplek is de startpagina van deze omgeving. */}
          <Route path="/" element={<AdminCompliance />} />
          <Route path="/compliance" element={<Navigate to="/" replace />} />
          <Route path="/beheer" element={<AdminPanel />} />
          <Route path="/overzicht" element={<AdminOverzicht />} />
          <Route path="/fouten" element={<AdminErrors />} />
          <Route path="*" element={<Onbekend />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
