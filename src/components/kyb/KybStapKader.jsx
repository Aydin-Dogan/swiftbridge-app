/**
 * KybStapKader.jsx — vaste omlijsting van een KYB-stap: voortgang, kop,
 * inhoud, foutmelding, "opgeslagen om" en de knoppenrij.
 *
 * Props:
 *   nr            stapnummer 1..7
 *   titel         zichtbare kop (h1, krijgt focus bij stapwissel)
 *   kinderen      inhoud (alias voor children)
 *   onTerug       terug naar het overzicht
 *   onOpslaan     "Opslaan en verder" (null/undefined = knop verbergen)
 *   onLater       "Opslaan en later verder" (null/undefined = knop verbergen)
 *   bezig         verzoek loopt
 *   opgeslagenOm  Date/timestamp van de laatste geslaagde opslag
 *   serverFout    tekst (al vertaald) of null
 *   kanOpslaan    false = primaire knop uitgeschakeld (alleen als `ontbrekend` niet is meegegeven)
 *   ontbrekend    lijst met veldsleutels die nog niet zijn ingevuld. Als deze is
 *                 meegegeven blijft de knop klikbaar: een klik bij open vragen
 *                 kleurt die vragen rood (KybVraag) en scrolt naar de eerste.
 *   opslaanLabel  alternatief label voor de primaire knop
 */
import { useEffect, useRef, useState } from 'react';
import { KybFoutContext } from './kybFoutContext';
import { useTaal } from '../../i18n';
import StappenIndicator from '../onboarding/StappenIndicator';
import { Card, Knop } from '../ui';
import { AlertTriangle } from '../icons/Icons';
import { AANTAL_STAPPEN, STAPPEN } from './kybOpties';

function fmtTijd(waarde) {
  if (!waarde) return '';
  const d = waarde instanceof Date ? waarde : new Date(waarde);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

export default function KybStapKader({
  nr, titel, kinderen, children, onTerug, onOpslaan, onLater, bezig = false,
  opgeslagenOm = null, serverFout = null, kanOpslaan = true, opslaanLabel, ontbrekend,
}) {
  const { t } = useTaal();
  const kopRef = useRef(null);
  const inhoudRef = useRef(null);
  const [toonFouten, setToonFouten] = useState(false);
  const metMarkering = Array.isArray(ontbrekend);
  const compleet = metMarkering ? ontbrekend.length === 0 : kanOpslaan;
  const foutContext = { toon: toonFouten, ontbrekend: metMarkering ? ontbrekend : [] };

  function klikOpslaan() {
    if (!compleet) {
      if (!metMarkering) return;
      setToonFouten(true);
      // Na de render naar de eerste rode vraag scrollen.
      setTimeout(() => {
        const eerste = inhoudRef.current?.querySelector('[data-kyb-ontbreekt="true"]');
        eerste?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    onOpslaan?.();
  }

  // Toegankelijkheid: bij een stapwissel gaat de focus naar de kop.
  useEffect(() => {
    kopRef.current?.focus();
  }, [nr]);

  return (
    <div className="space-y-4 animate-fade-up">
      <StappenIndicator
        huidigeStap={nr}
        totaalStappen={AANTAL_STAPPEN}
        labels={STAPPEN.map((s) => t(s.labelKey))}
      />
      <div>
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">
          {t('kyb_stap_van', { huidig: nr, totaal: AANTAL_STAPPEN })}
        </p>
        <h1 ref={kopRef} tabIndex={-1} className="font-display text-2xl text-ink-1 mt-1 outline-none">
          {titel}
        </h1>
      </div>

      <KybFoutContext.Provider value={foutContext}>
        <div ref={inhoudRef}>
          <Card size="lg" className="space-y-5 shadow-soft">
            {kinderen || children}
          </Card>
        </div>
      </KybFoutContext.Provider>

      {toonFouten && metMarkering && ontbrekend.length > 0 && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-border-error bg-red-50 px-4 py-3 text-sm text-fg-error">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{t('kyb_vul_rood_in')}</span>
        </div>
      )}

      {serverFout && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-border-error bg-surface px-4 py-3 text-sm text-fg-error">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{serverFout}</span>
        </div>
      )}

      {opgeslagenOm && !serverFout && (
        <p aria-live="polite" className="text-xs text-ink-3">
          {t('kyb_opgeslagen_om', { tijd: fmtTijd(opgeslagenOm) })}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-1">
        {onTerug && (
          <Knop variant="secondary" size="lg" onClick={onTerug} disabled={bezig}>
            {t('kyb_terug')}
          </Knop>
        )}
        <div className="flex-1" />
        {onLater && (
          <Knop variant="ghost" size="lg" onClick={onLater} disabled={bezig}>
            {t('kyb_later_knop')}
          </Knop>
        )}
        {onOpslaan && (
          <button
            type="button"
            onClick={klikOpslaan}
            disabled={bezig || (!metMarkering && !kanOpslaan)}
            aria-busy={bezig || undefined}
            className="btn-inst min-h-[48px] px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bezig ? t('laden') : (opslaanLabel || t('kyb_volgende'))}
          </button>
        )}
      </div>
    </div>
  );
}
