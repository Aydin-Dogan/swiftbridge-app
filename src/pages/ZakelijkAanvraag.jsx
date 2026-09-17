/**
 * ZakelijkAanvraag.jsx — "Zakelijk profiel aanvragen" (KYB-flow), klantkant.
 *
 * Routes (zonder AppShell, navy topbalk zoals InfoAanleveren):
 *   /app/zakelijk-aanvraag            hub: intro / stappenoverzicht / status
 *   /app/zakelijk-aanvraag/stap/:nr   deep-link naar stap 1..7
 *
 * De server is de waarheid (GET /kyb/aanvraag). Stappen mogen in elke
 * volgorde; "Opslaan en later verder" = PUT met gedeeltelijk:true.
 * Bij 401 sturen we naar /login?next=<huidig pad>. Geen PII in storage.
 * Contract: swiftbridge-api/docs/KYB_API.md.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useTaal } from '../i18n';
import { parseError } from '../services/api';
import { useKybAanvraag } from '../hooks/useKybAanvraag';
import { AANTAL_STAPPEN } from '../components/kyb/kybOpties';
import KybIntro from '../components/kyb/KybIntro';
import KybHub from '../components/kyb/KybHub';
import KybStatusScherm from '../components/kyb/KybStatusScherm';
import StapBedrijf from '../components/kyb/StapBedrijf';
import StapPersoon from '../components/kyb/StapPersoon';
import StapToestel from '../components/kyb/StapToestel';
import StapGebruik from '../components/kyb/StapGebruik';
import StapIdentiteit from '../components/kyb/StapIdentiteit';
import StapAanvullend from '../components/kyb/StapAanvullend';
import StapToestemming from '../components/kyb/StapToestemming';
import { Knop } from '../components/ui';

const HUB = '/app/zakelijk-aanvraag';
const BEWERKBAAR = new Set(['concept', 'info_nodig']);

function LaadRegel({ tekst }) {
  return <p className="text-ink-2 text-sm text-center py-10" role="status">{tekst}</p>;
}

export default function ZakelijkAanvraag({ gebruiker, onProfielVerversen }) {
  const { t } = useTaal();
  const navigate = useNavigate();
  const { nr } = useParams();
  const stapNr = nr == null ? null : Number(nr);
  const kyb = useKybAanvraag();
  const { aanvraag, account, kvk, slaWerkdagen, oefenmodus, laden, fout } = kyb;

  const [bezig, setBezig] = useState(false);
  const [serverFout, setServerFout] = useState('');
  const [opgeslagenOm, setOpgeslagenOm] = useState(null);
  const [startFout, setStartFout] = useState('');

  const naarLogin = useCallback(() => {
    const pad = stapNr ? `${HUB}/stap/${stapNr}` : HUB;
    navigate(`/login?next=${encodeURIComponent(pad)}`, { replace: true });
  }, [navigate, stapNr]);

  // 401 op de eerste GET: sessie verlopen -> login met terugkeerpad.
  useEffect(() => {
    if (fout?.status === 401) naarLogin();
  }, [fout, naarLogin]);

  // Foutmelding en "opgeslagen om" horen bij een stap: bij stapwissel leegmaken
  // (state afleiden van de route-parameter tijdens render, geen effect nodig).
  const [vorigeStapNr, setVorigeStapNr] = useState(stapNr);
  if (vorigeStapNr !== stapNr) {
    setVorigeStapNr(stapNr);
    setServerFout('');
    setOpgeslagenOm(null);
  }

  const verversProfiel = useCallback(() => {
    if (typeof onProfielVerversen === 'function') {
      Promise.resolve(onProfielVerversen()).catch(() => {});
    }
  }, [onProfielVerversen]);

  function naarStap(n) { navigate(`${HUB}/stap/${n}`); }
  function naarHub() { navigate(HUB); }

  function behandelFout(e) {
    if (e?.status === 401) {
      naarLogin();
      return;
    }
    if (e?.status === 419 || e?.errorCode === 'CSRF_INVALID') {
      setServerFout(t('kyb_sessie_verlopen'));
      return;
    }
    setServerFout(parseError(e, t) || t('kyb_fout_opslaan'));
  }

  // Volledige PUT -> door naar de volgende stap (of de hub na stap 7).
  async function opslaanEnVerder(n, body) {
    if (bezig) return;
    setBezig(true);
    setServerFout('');
    try {
      await kyb.slaStapOp(n, body);
      setOpgeslagenOm(Date.now());
      if (n === 5) verversProfiel();
      // Bij "actie nodig" mag de klant alleen de heropende stappen bewerken:
      // terug naar het statusscherm i.p.v. door naar een geblokkeerde stap (409).
      if (n >= AANTAL_STAPPEN || aanvraag?.status === 'info_nodig') naarHub();
      else naarStap(n + 1);
    } catch (e) {
      behandelFout(e);
    } finally {
      setBezig(false);
    }
  }

  // Gedeeltelijke PUT -> terug naar de hub.
  async function opslaanEnLater(n, body) {
    if (bezig) return;
    setBezig(true);
    setServerFout('');
    try {
      if (body && Object.keys(body).length > 0) {
        await kyb.slaStapOp(n, body, { gedeeltelijk: true });
      }
      naarHub();
    } catch (e) {
      behandelFout(e);
    } finally {
      setBezig(false);
    }
  }

  // Terug: best-effort gedeeltelijke opslag, daarna altijd naar de hub.
  async function terug(n, body) {
    if (body && Object.keys(body).length > 0 && !bezig) {
      try { await kyb.slaStapOp(n, body, { gedeeltelijk: true }); } catch { /* concept blijft zoals het was */ }
    }
    naarHub();
  }

  async function indienen(body7) {
    // Fouten (incl. KYB_NIET_COMPLEET) gaan door naar StapToestemming, die ze toont.
    // Vanuit "actie nodig" is stap 7 alleen bewerkbaar als de beoordelaar hem heropende.
    const stap7Open = aanvraag?.status !== 'info_nodig'
      || (aanvraag?.infoVerzoek?.stappen || []).map(Number).includes(7);
    if (body7 && stap7Open) await kyb.slaStapOp(7, body7);
    try {
      await kyb.indienen();
    } catch (e) {
      if (e?.status === 401) { naarLogin(); return; }
      throw e;
    }
    verversProfiel();
    naarHub();
  }

  async function start() {
    if (bezig) return;
    setBezig(true);
    setStartFout('');
    try {
      await kyb.start();
      verversProfiel();
      naarStap(1);
    } catch (e) {
      if (e?.status === 401) naarLogin();
      else if (e?.errorCode === 'KYB_REEDS_ACTIEF') await kyb.herlaad();
      else setStartFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  async function intrekken() {
    await kyb.intrekken();
    verversProfiel();
    naarHub();
  }

  async function infoAntwoord(tekst) {
    await kyb.infoAntwoord(tekst);
    verversProfiel();
  }

  function naarProfiel() {
    navigate('/app');
    setTimeout(() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'profiel' })), 50);
  }

  function naarOvermaken() {
    navigate('/app');
    setTimeout(() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' })), 50);
  }

  // ── Inhoud bepalen ──────────────────────────────────────────────────────────
  let inhoud;
  const status = aanvraag?.status || 'geen';
  const isZakelijk = (account ? true : gebruiker?.accountType === 'zakelijk');

  if (laden && !aanvraag && !fout) {
    inhoud = <LaadRegel tekst={t('laden')} />;
  } else if (fout?.status === 401) {
    inhoud = <LaadRegel tekst={t('laden')} />;
  } else if (fout?.errorCode === 'KYB_ACCOUNT_TYPE' || fout?.status === 403 || (!fout && !isZakelijk)) {
    inhoud = (
      <div className="text-center py-10 space-y-4">
        <p className="text-ink-2 text-sm" role="alert">{t('errors.KYB_ACCOUNT_TYPE')}</p>
        <Knop variant="primary" size="lg" onClick={() => navigate('/app')}>{t('tab_dashboard')}</Knop>
      </div>
    );
  } else if (fout?.errorCode === 'KYB_INTAKE_GESLOTEN' || fout?.status === 503) {
    inhoud = <KybIntro slaWerkdagen={slaWerkdagen} intakeOpen={false} />;
  } else if (fout) {
    inhoud = (
      <div className="text-center py-10 space-y-4">
        <p className="text-fg-error text-sm" role="alert">{parseError(fout, t)}</p>
        <Knop variant="secondary" size="lg" onClick={() => kyb.herlaad()}>{t('vernieuwen')}</Knop>
      </div>
    );
  } else if (!aanvraag || status === 'geen') {
    if (stapNr) inhoud = <Navigate to={HUB} replace />;
    else inhoud = <KybIntro slaWerkdagen={slaWerkdagen} onStart={start} bezig={bezig} fout={startFout} />;
  } else if (stapNr) {
    if (!Number.isInteger(stapNr) || stapNr < 1 || stapNr > AANTAL_STAPPEN || !BEWERKBAAR.has(status)) {
      inhoud = <Navigate to={HUB} replace />;
    } else {
      const basis = {
        aanvraag, account, kvk, oefenmodus, bezig, serverFout, opgeslagenOm,
        onOpslaan: (body) => opslaanEnVerder(stapNr, body),
        onLater: (body) => opslaanEnLater(stapNr, body),
        onTerug: (body) => terug(stapNr, body),
      };
      switch (stapNr) {
        case 1:
          inhoud = <StapBedrijf {...basis} uploadDocument={kyb.uploadDocument} verwijderDocument={kyb.verwijderDocument} />;
          break;
        case 2:
          inhoud = <StapPersoon {...basis} onNaarProfiel={naarProfiel} />;
          break;
        case 3:
          inhoud = <StapToestel {...basis} />;
          break;
        case 4:
          inhoud = <StapGebruik {...basis} />;
          break;
        case 5:
          inhoud = <StapIdentiteit {...basis} onIdinGelukt={() => { kyb.herlaad(); verversProfiel(); }} />;
          break;
        case 6:
          inhoud = <StapAanvullend {...basis} />;
          break;
        default:
          inhoud = <StapToestemming aanvraag={aanvraag} bezig={bezig} serverFout={serverFout} opgeslagenOm={opgeslagenOm}
            onIndienen={indienen} onWijzig={naarStap} onTerug={naarHub} />;
      }
    }
  } else if (status === 'concept') {
    inhoud = <KybHub aanvraag={aanvraag} onNaarStap={naarStap} onIntrekken={intrekken} bezig={bezig} />;
  } else {
    inhoud = (
      <KybStatusScherm
        aanvraag={aanvraag}
        slaWerkdagen={slaWerkdagen}
        onNieuw={(status === 'afgewezen' || status === 'ingetrokken') ? start : undefined}
        onInfoAntwoord={infoAntwoord}
        onIndienen={status === 'info_nodig' ? () => indienen() : undefined}
        onNaarStap={naarStap}
        uploadDocument={status === 'info_nodig' ? kyb.uploadDocument : undefined}
        verwijderDocument={kyb.verwijderDocument}
        onNaarOvermaken={naarOvermaken}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Navy topbalk (patroon InfoAanleveren) */}
      <div className="bg-brand-500 text-white px-4 py-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (stapNr ? naarHub() : navigate('/app'))}
          aria-label={t('kyb_terug')}
          className="text-brand-100 text-xl leading-none w-11 h-11 -my-2 -ml-2 flex items-center justify-center"
        >
          &#8249;
        </button>
        <span className="font-display font-bold">{t('kyb_titel')}</span>
      </div>

      <main id="inhoud" className="max-w-lg mx-auto px-4 py-5 pb-12">
        {inhoud}
      </main>
    </div>
  );
}
