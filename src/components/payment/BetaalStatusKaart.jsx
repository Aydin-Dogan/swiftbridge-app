/**
 * BetaalStatusKaart.jsx — wat de klant ziet als hij terugkomt van iDEAL.
 *
 * Mollie stuurt de klant na het betalen (of afbreken) terug naar
 * /app?payment=<transactie-id>. Die parameter werd nergens gelezen: de klant zag
 * niets, ook niet als zijn betaling was afgebroken of mislukt (analyse
 * aanmeldroute, 13-10-2026).
 *
 * Deze kaart vraagt GET /payments/:id/status. De server kijkt zo nodig zelf bij
 * Mollie (de webhook kan later komen dan de klant) en geeft een uitkomst:
 *   betaald      → "Betaling ontvangen"
 *   bezig        → nog niet bevestigd; de kaart kijkt een paar keer opnieuw en
 *                  biedt "Verder met betalen" (zelfde Mollie-betaling)
 *   afgebroken / mislukt / niet_gestart
 *                → niets afgeschreven, met "Opnieuw betalen" voor DEZELFDE
 *                  overboeking zolang de server dat toestaat
 *                  (kanOpnieuwBetalen), anders "Nieuwe overboeking".
 * Nooit een succesmelding als de status onbekend is.
 */
import { useEffect, useState } from 'react';
import { apiFetch, parseError } from '../../services/api';
import { startBetaling, doorsturenNaar } from '../../services/betaalStart';
import { formatBedrag } from '../../services/currencies';
import { useTaal } from '../../i18n';
import { CheckCircle, Clock, XCircle, AlertTriangle } from '../icons/Icons';

// Zolang de bank nog niet heeft bevestigd: zo vaak opnieuw kijken.
const MAX_KEER_KIJKEN = 10;

const WEERGAVE = {
  betaald:      { titel: 'betaalstatus_betaald_titel',      tekst: 'betaalstatus_betaald_tekst',      Icoon: CheckCircle,   kleur: 'success' },
  bezig:        { titel: 'betaalstatus_bezig_titel',        tekst: 'betaalstatus_bezig_tekst',        Icoon: Clock,         kleur: 'brand' },
  afgebroken:   { titel: 'betaalstatus_afgebroken_titel',   tekst: 'betaalstatus_afgebroken_tekst',   Icoon: XCircle,       kleur: 'amber' },
  mislukt:      { titel: 'betaalstatus_mislukt_titel',      tekst: 'betaalstatus_mislukt_tekst',      Icoon: XCircle,       kleur: 'red' },
  niet_gestart: { titel: 'betaalstatus_niet_gestart_titel', tekst: 'betaalstatus_niet_gestart_tekst', Icoon: AlertTriangle, kleur: 'amber' },
};

const KADER = {
  success: 'bg-success-50 border-success-100 text-success-700',
  brand: 'bg-brand-50 border-brand-200 text-brand-800',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  red: 'bg-red-50 border-red-200 text-red-700',
};

export default function BetaalStatusKaart({ transactieId, onSluit, onNieuweOverboeking, pollMs = 3000 }) {
  const { t } = useTaal();
  const [status, setStatus] = useState(null);
  const [ophaalFout, setOphaalFout] = useState(false);
  const [bezigMetStarten, setBezigMetStarten] = useState(false);
  const [startFout, setStartFout] = useState('');

  useEffect(() => {
    let weg = false;
    let timer = null;
    async function kijk(keer) {
      try {
        const s = await apiFetch(`/payments/${encodeURIComponent(transactieId)}/status`);
        if (weg) return;
        setStatus(s);
        if (s?.uitkomst === 'bezig' && keer + 1 < MAX_KEER_KIJKEN) {
          timer = setTimeout(() => kijk(keer + 1), pollMs);
        }
      } catch {
        if (!weg) setOphaalFout(true);
      }
    }
    kijk(0);
    return () => { weg = true; clearTimeout(timer); };
  }, [transactieId, pollMs]);

  async function betaal() {
    setBezigMetStarten(true);
    setStartFout('');
    const uit = await startBetaling({ transactieId, methode: status?.betaalMethode || 'ideal' });
    if (uit.soort === 'doorsturen') {
      doorsturenNaar(uit.checkoutUrl);
      return;
    }
    // Ook de simulatie is hier geen succes: bij een terugkeer van iDEAL hoort
    // betalen aan te staan, dus een melding in plaats van een groen scherm.
    setStartFout(parseError(uit.fout || { errorCode: 'PAY_NIET_GECONFIGUREERD' }, t));
    setBezigMetStarten(false);
  }

  if (ophaalFout) {
    return (
      <Kader kleur="amber" Icoon={AlertTriangle} titel={t('betaalstatus_onbekend')}>
        <Knoppen>
          <SecundaireKnop onClick={onSluit}>{t('betaalstatus_sluiten')}</SecundaireKnop>
        </Knoppen>
      </Kader>
    );
  }

  if (!status) {
    return (
      <div role="status" aria-live="polite" className="mb-4 bg-surface border border-border rounded-md p-4 text-sm text-ink-2">
        {t('betaalstatus_laden')}
      </div>
    );
  }

  const weergave = WEERGAVE[status.uitkomst] || WEERGAVE.bezig;
  const nietBetaald = ['afgebroken', 'mislukt', 'niet_gestart'].includes(status.uitkomst);
  const kanOpnieuw = nietBetaald && status.kanOpnieuwBetalen;

  return (
    <Kader kleur={weergave.kleur} Icoon={weergave.Icoon} titel={t(weergave.titel)}>
      <p className="text-sm">{t(weergave.tekst)}</p>
      {nietBetaald && !kanOpnieuw && (
        <p className="mt-2 text-sm">{t('errors.PAY_NIET_MEER_TE_BETALEN')}</p>
      )}

      {typeof status.eurBedrag === 'number' && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-2">{t('betaalstatus_bedrag')}</dt>
          <dd className="text-right font-semibold tabular-nums">€{status.eurBedrag.toFixed(2)}</dd>
          {typeof status.ontvangenBedrag === 'number' && (
            <>
              <dt className="text-ink-2">{t('betaalstatus_ontvanger_krijgt')}</dt>
              <dd className="text-right font-semibold tabular-nums">{formatBedrag(status.ontvangenBedrag, status.valuta || 'TRY')}</dd>
            </>
          )}
        </dl>
      )}

      {kanOpnieuw && status.welkomstDeal && (
        <p className="mt-3 text-sm">{t('betaalstatus_welkomstactie')}</p>
      )}

      {startFout && (
        <p role="alert" className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{startFout}</p>
      )}

      <Knoppen>
        {status.uitkomst === 'bezig' && (
          <PrimaireKnop onClick={betaal} disabled={bezigMetStarten}>
            {bezigMetStarten ? t('laden') : t('betaal_verder')}
          </PrimaireKnop>
        )}
        {kanOpnieuw && (
          <PrimaireKnop onClick={betaal} disabled={bezigMetStarten}>
            {bezigMetStarten ? t('laden') : t('betaal_opnieuw')}
          </PrimaireKnop>
        )}
        {nietBetaald && !kanOpnieuw && (
          <PrimaireKnop onClick={onNieuweOverboeking}>{t('betaal_nieuwe_overboeking')}</PrimaireKnop>
        )}
        <SecundaireKnop onClick={onSluit}>{t('betaalstatus_sluiten')}</SecundaireKnop>
      </Knoppen>
    </Kader>
  );
}

function Kader({ kleur, Icoon, titel, children }) {
  return (
    <section role="status" aria-live="polite" className={`mb-4 border rounded-md p-4 ${KADER[kleur] || KADER.brand}`}>
      <div className="flex items-start gap-3">
        <Icoon className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-medium text-base">{titel}</h2>
          {children}
        </div>
      </div>
    </section>
  );
}

function Knoppen({ children }) {
  return <div className="mt-4 flex flex-wrap gap-2">{children}</div>;
}

function PrimaireKnop({ children, ...rest }) {
  return (
    <button type="button" className="btn-inst px-4 py-2.5 text-sm disabled:bg-gray-300" {...rest}>
      {children}
    </button>
  );
}

function SecundaireKnop({ children, ...rest }) {
  return (
    <button type="button" className="px-4 py-2.5 text-sm font-semibold text-ink-2 hover:text-ink-1" {...rest}>
      {children}
    </button>
  );
}
