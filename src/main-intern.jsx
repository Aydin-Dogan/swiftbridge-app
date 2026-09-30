/**
 * main-intern.jsx — Ingang van de INTERNE omgeving (compliance).
 *
 * Tweede bouwingang naast main.jsx, ronde 0 uit het architectuurbesluit.
 * Dezelfde codebase, dezelfde gedeelde componenten, maar een eigen bundel die
 * niet aan klanten wordt geserveerd.
 *
 * Geen service worker hier: de klantapp heeft er een voor offline gebruik, maar
 * een compliance-werkplek hoort niets te cachen. Dossiergegevens in een
 * browsercache zijn precies wat je niet wilt op een gedeelde computer.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import InternApp from './intern/InternApp.jsx';
import { TaalProvider } from './i18n';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TaalProvider>
      <InternApp />
    </TaalProvider>
  </StrictMode>,
);
