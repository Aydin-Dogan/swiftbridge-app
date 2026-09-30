/**
 * KycDossiers.jsx — Het dossierscherm voor particuliere KYC-aanvragen.
 *
 * Werkpakket 4 en 6 uit het KYC-masterdocument, maar ingedeeld naar de vier
 * vragen die de eigenaar zelf stelde en die scherper zijn dan een lijst blokken:
 *
 *   1. Wat is het risico van deze klant?
 *   2. Accepteer ik hem, en waarom?
 *   3. Waar leg ik dat vast?
 *   4. Klopt zijn gedrag later nog met zijn verhaal?
 *
 * WAT DIT SCHERM ANDERS DOET DAN DE BESTAANDE REVIEW-WACHTRIJ
 * De bestaande KYCReviewQueue toont wie er wacht. Dit scherm toont daarnaast
 * WAAROM een dossier nog niet beoordeeld kan worden. Dat is hier de kern: van de
 * drie aanvragen die op 28 september 2026 wachtten was er geen enkele
 * beoordeelbaar, en dat was niet te zien. Een scherm dat lege velden netjes
 * toont, verbergt het probleem in plaats van het te laten zien.
 *
 * Dit scherm NEEMT GEEN BESLUITEN. De besluitknoppen komen pas als het
 * vierogenprincipe is aangesloten op de database. Tot die tijd is dit het scherm
 * waarmee je ziet wat er speelt en wat er moet gebeuren.
 *
 * Endpoints: GET /admin/kyc/wachtrij en GET /admin/kyc/dossier/:id
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, parseError } from '../../../services/api';
import { useTaal } from '../../../i18n';
import { Refresh, X } from '../../icons/Icons';
import { useTx, fmtDatum } from '../kyb/kybAdminLabels';
import {
  RISICO_STIJL, RISICO_LABEL, KYC_STATUS_STIJL, STATUS_LABEL,
  DOCUMENT_LABEL, BRON_LABEL, CHECKLIST_LABEL, ACTIE_LABEL,
  VERVOLG_LABEL, VERVOLG_STIJL, label,
} from './kycLabels';

// ── Kleine bouwstenen ────────────────────────────────────────────────────────

function Pil({ stijl, children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[0.7rem] font-medium ${stijl || 'bg-surface-3 text-ink-2 border-border'}`}>
      {children}
    </span>
  );
}

/**
 * Risicobadge. Bewust met tekst erbij en niet alleen kleur: kleur alleen is
 * onbruikbaar voor wie kleurenblind is, en dat staat ook zo in hoofdstuk 10.1
 * van het masterdocument.
 */
function RisicoBadge({ klasse, score }) {
  return (
    <Pil stijl={RISICO_STIJL[klasse]}>
      {label(RISICO_LABEL, klasse)}
      {typeof score === 'number' ? <span className="ml-1 opacity-70">{score}</span> : null}
    </Pil>
  );
}

function Wachttijd({ dagen, buiten }) {
  if (dagen === null || dagen === undefined) return <span className="text-ink-3">-</span>;
  const tekst = dagen === 1 ? '1 dag' : `${dagen} dagen`;
  if (!buiten) return <span className="text-ink-2">{tekst}</span>;
  return (
    <span className="text-red-600 font-medium">
      {tekst}
      <span className="ml-1 font-normal">buiten de termijn</span>
    </span>
  );
}

function Blok({ nummer, vraag, children }) {
  return (
    <section className="bg-surface border border-border rounded-md overflow-hidden">
      <header className="px-4 py-3 border-b border-border bg-surface-2">
        <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500">
          Vraag {nummer}
        </div>
        <h4 className="font-display text-base font-medium text-ink-1">{vraag}</h4>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Regel({ naam, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-ink-2">{naam}</span>
      <span className="text-sm text-ink-1 text-right">{children}</span>
    </div>
  );
}

function JaNee({ waarde, jaTekst = 'Ja', neeTekst = 'Nee', neeIsFout = false }) {
  if (waarde) return <span className="text-success-700">{jaTekst}</span>;
  return <span className={neeIsFout ? 'text-red-600' : 'text-ink-2'}>{neeTekst}</span>;
}

// ── De wachtrij ──────────────────────────────────────────────────────────────

function Tellers({ tellers, tx }) {
  if (!tellers) return null;
  const items = [
    { naam: tx('kyc_admin_teller_open', 'Open dossiers'), waarde: tellers.open, alarm: false },
    { naam: tx('kyc_admin_teller_termijn', 'Buiten de termijn'), waarde: tellers.buitenTermijn, alarm: tellers.buitenTermijn > 0 },
    { naam: tx('kyc_admin_teller_incompleet', 'Niet beoordeelbaar'), waarde: tellers.nietBeoordeelbaar, alarm: tellers.nietBeoordeelbaar > 0 },
    { naam: tx('kyc_admin_teller_tweede', 'Wacht op tweede beoordelaar'), waarde: tellers.wachtOpTweede, alarm: false },
    { naam: tx('kyc_admin_teller_hoog', 'Hoog risico'), waarde: tellers.hoogRisico, alarm: tellers.hoogRisico > 0 },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {items.map((i) => (
        <div key={i.naam} className="bg-surface border border-border rounded-md p-3">
          <div className={`font-display text-2xl font-medium ${i.alarm ? 'text-red-600' : 'text-ink-1'}`}>
            {i.waarde ?? 0}
          </div>
          <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mt-0.5">{i.naam}</div>
        </div>
      ))}
    </div>
  );
}

function Wachtrij({ dossiers, tx, onOpen }) {
  if (!dossiers.length) {
    return (
      <div className="bg-surface border border-border rounded-md p-8 text-center">
        <p className="text-ink-2">{tx('kyc_admin_leeg', 'Er wachten geen particuliere aanvragen op beoordeling.')}</p>
      </div>
    );
  }
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-[0.7rem] uppercase tracking-[0.14em] text-gray-500">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium">{tx('kyc_admin_kol_ingediend', 'Ingediend')}</th>
            <th className="text-left px-4 py-2.5 font-medium">{tx('kyc_admin_kol_document', 'Document')}</th>
            <th className="text-left px-4 py-2.5 font-medium">{tx('kyc_admin_kol_risico', 'Risico')}</th>
            <th className="text-left px-4 py-2.5 font-medium">{tx('kyc_admin_kol_wacht', 'Wacht al')}</th>
            <th className="text-left px-4 py-2.5 font-medium">{tx('kyc_admin_kol_reden', 'Waarom bij een mens')}</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {dossiers.map((d) => (
            <tr key={d.id} className="border-t border-border hover:bg-surface-2/60 transition">
              <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{fmtDatum(d.ingediendOp, false)}</td>
              <td className="px-4 py-3">
                <div className="text-ink-1">{label(DOCUMENT_LABEL, d.documentType)}</div>
                <div className="text-[0.7rem] text-gray-500">{label(BRON_LABEL, d.bron)}</div>
              </td>
              <td className="px-4 py-3"><RisicoBadge klasse={d.risicoKlasse} score={d.risicoScore} /></td>
              <td className="px-4 py-3 whitespace-nowrap"><Wachttijd dagen={d.dagenWachtend} buiten={d.buitenTermijn} /></td>
              <td className="px-4 py-3">
                <div className="text-ink-2">{d.redenBijMens}</div>
                {!d.beoordeelbaar && (
                  <div className="text-[0.7rem] text-red-600 mt-0.5">
                    {d.blokkades === 1
                      ? tx('kyc_admin_blok_een', '1 punt moet eerst worden opgelost')
                      : tx('kyc_admin_blok_meer', '{n} punten moeten eerst worden opgelost', { n: d.blokkades })}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onOpen(d.id)} className="btn-inst text-xs px-3 py-1.5">
                  {tx('kyc_admin_open', 'Bekijken')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Het dossier: de vier vragen ──────────────────────────────────────────────

function VraagRisico({ risico, tx }) {
  return (
    <Blok nummer={1} vraag={tx('kyc_admin_vraag1', 'Wat is het risico van deze klant?')}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <RisicoBadge klasse={risico.klasse} score={risico.score} />
        {risico.tweedeBeoordelaarNodig && (
          <Pil stijl="bg-brand-50 text-brand-700 border-brand-100">
            {tx('kyc_admin_tweede_nodig', 'Twee beoordelaars nodig')}
          </Pil>
        )}
        <span className="text-sm text-ink-2">
          {tx('kyc_admin_hertoets', 'Opnieuw toetsen over {n} maanden', { n: risico.hertoetsingOverMaanden })}
        </span>
      </div>

      {risico.ondergrenzen?.length > 0 && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <div className="text-sm font-medium text-red-700 mb-1">
            {tx('kyc_admin_ondergrens', 'Dit dossier kan niet op laag risico uitkomen')}
          </div>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {risico.ondergrenzen.map((o) => (
              <li key={o.code}>
                {String(o.code).replace(/_/g, ' ')} — {tx('kyc_admin_minimaal', 'minimaal {k}', { k: label(RISICO_LABEL, o.minimum) })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mb-2">
        {tx('kyc_admin_factoren', 'Waarom deze klasse')}
      </div>
      <ul className="space-y-1.5">
        {risico.factoren.map((f, i) => (
          <li key={`${f.code}-${i}`} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-ink-1">{f.toelichting}</span>
            <span className={`shrink-0 tabular-nums ${f.punten > 0 ? 'text-red-600' : 'text-success-700'}`}>
              {f.punten > 0 ? `+${f.punten}` : f.punten}
            </span>
          </li>
        ))}
      </ul>
    </Blok>
  );
}

function VraagBesluit({ besluit, tx }) {
  const blokkerend = besluit.ontbreekt.filter((o) => o.blokkerend);
  const overig = besluit.ontbreekt.filter((o) => !o.blokkerend);

  return (
    <Blok nummer={2} vraag={tx('kyc_admin_vraag2', 'Accepteer ik hem, en waarom?')}>
      <div className={`rounded-md border p-3 mb-4 ${VERVOLG_STIJL[besluit.aanbevolenVervolg] || 'bg-surface-3 border-border'}`}>
        <div className="font-medium">{label(VERVOLG_LABEL, besluit.aanbevolenVervolg)}</div>
        <p className="text-sm mt-1 opacity-90">{besluit.toelichting}</p>
      </div>

      {blokkerend.length > 0 && (
        <>
          <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mb-2">
            {tx('kyc_admin_blokkerend', 'Dit moet eerst opgelost worden')}
          </div>
          <ul className="space-y-2 mb-4">
            {blokkerend.map((o) => (
              <li key={o.code} className="rounded-md border border-red-200 bg-red-50 p-3">
                <div className="text-sm text-ink-1">{o.wat}</div>
                <div className="text-[0.7rem] text-red-700 mt-1 uppercase tracking-[0.12em]">
                  {label(ACTIE_LABEL, o.actie)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {overig.length > 0 && (
        <>
          <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mb-2">
            {tx('kyc_admin_aandacht', 'Aandachtspunten, houden het besluit niet op')}
          </div>
          <ul className="space-y-1.5 mb-4">
            {overig.map((o) => (
              <li key={o.code} className="text-sm text-ink-2">{o.wat}</li>
            ))}
          </ul>
        </>
      )}

      <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mb-2">
        {tx('kyc_admin_checklist', 'Checklist bij deze risicoklasse')}
      </div>
      <ul className="space-y-1">
        {besluit.checklist.map((punt) => (
          <li key={punt} className="flex items-center gap-2 text-sm text-ink-2">
            <span className="w-4 h-4 rounded border border-border bg-surface-3 shrink-0" aria-hidden="true" />
            {label(CHECKLIST_LABEL, punt)}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-3">
        {tx('kyc_admin_checklist_uit',
          'De checklist en de besluitknoppen worden actief zodra het vierogenprincipe op de database is aangesloten.')}
      </p>
    </Blok>
  );
}

function VraagVastlegging({ vastlegging, tx }) {
  const { identiteit, akkoord, account } = vastlegging;
  return (
    <Blok nummer={3} vraag={tx('kyc_admin_vraag3', 'Waar leg ik dat vast?')}>
      <div className="grid sm:grid-cols-2 gap-x-6">
        <div>
          <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mb-1">
            {tx('kyc_admin_identiteit', 'Identiteit')}
          </div>
          <Regel naam={tx('kyc_admin_route', 'Route')}>{label(BRON_LABEL, identiteit.bron)}</Regel>
          {identiteit.bron === 'idin' && (
            <Regel naam={tx('kyc_admin_idin_gelukt', 'iDIN werkelijk geslaagd')}>
              <JaNee waarde={identiteit.idinWerkelijkGeslaagd} neeIsFout />
            </Regel>
          )}
          <Regel naam={tx('kyc_admin_doctype', 'Documenttype')}>{label(DOCUMENT_LABEL, identiteit.documentType)}</Regel>
          <Regel naam={tx('kyc_admin_nationaliteit', 'Nationaliteit')}>{identiteit.nationaliteit || '-'}</Regel>
          <Regel naam={tx('kyc_admin_beelden', 'Beschikbare foto’s')}>
            {identiteit.beeldenBeschikbaar?.length
              ? identiteit.beeldenBeschikbaar.join(', ')
              : <span className="text-red-600">{tx('kyc_admin_geen_beelden', 'geen')}</span>}
          </Regel>
        </div>

        <div>
          <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mb-1">
            {tx('kyc_admin_akkoord', 'Akkoord en account')}
          </div>
          <Regel naam={tx('kyc_admin_voorwaarden', 'Voorwaarden')}>
            {akkoord.voorwaardenVersie
              ? `${tx('kyc_admin_versie', 'versie')} ${akkoord.voorwaardenVersie}`
              : <span className="text-amber-700">{tx('kyc_admin_niet_vast', 'niet vastgelegd')}</span>}
          </Regel>
          <Regel naam={tx('kyc_admin_geaccepteerd', 'Geaccepteerd op')}>
            {akkoord.geaccepteerdOp ? fmtDatum(akkoord.geaccepteerdOp) : '-'}
          </Regel>
          <Regel naam={tx('kyc_admin_email_ok', 'E-mail bevestigd')}><JaNee waarde={account.emailGeverifieerd} /></Regel>
          <Regel naam={tx('kyc_admin_2fa', 'Tweestapsverificatie')}><JaNee waarde={account.tweefactorAan} /></Regel>
          <Regel naam={tx('kyc_admin_adres', 'Woonadres bekend')}>
            <JaNee waarde={account.heeftAdres} neeIsFout />
          </Regel>
          <Regel naam={tx('kyc_admin_land', 'Land')}>{account.land || '-'}</Regel>
          <Regel naam={tx('kyc_admin_klant_sinds', 'Klant sinds')}>
            {account.aangemeldOp ? fmtDatum(account.aangemeldOp, false) : '-'}
          </Regel>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
        <div className="text-sm font-medium text-amber-700">
          {tx('kyc_admin_screening_kop', 'Screening')}
        </div>
        <p className="text-sm text-amber-700/90 mt-0.5">
          {vastlegging.screening === null
            ? tx('kyc_admin_screening_nooit',
              'Er is voor deze klant nooit gescreend op sanctielijsten. Dat is een wettelijke verplichting zonder drempel.')
            : tx('kyc_admin_screening_wel', 'Screening uitgevoerd.')}
        </p>
      </div>
    </Blok>
  );
}

function VraagGedrag({ gedrag, tx }) {
  return (
    <Blok nummer={4} vraag={tx('kyc_admin_vraag4', 'Klopt zijn gedrag later nog met zijn verhaal?')}>
      <Regel naam={tx('kyc_admin_tx', 'Uitgevoerde overboekingen')}>{gedrag.aantalTransacties}</Regel>
      <Regel naam={tx('kyc_admin_landen', 'Landen van de ontvangers')}>
        {gedrag.bestemmingslanden?.length ? gedrag.bestemmingslanden.join(', ') : '-'}
      </Regel>
      <Regel naam={tx('kyc_admin_verwacht', 'Wat de klant opgaf')}>
        {gedrag.opgegevenVerwachting
          ? gedrag.opgegevenVerwachting
          : <span className="text-amber-700">{tx('kyc_admin_niet_gevraagd', 'nooit gevraagd')}</span>}
      </Regel>
      {!gedrag.vergelijkingMogelijk && (
        <p className="text-sm text-ink-2 mt-3">{gedrag.toelichting}</p>
      )}
    </Blok>
  );
}

function DossierPaneel({ dossierId, onSluit, tx }) {
  const { t } = useTaal();
  const [dossier, setDossier] = useState(null);
  const [fout, setFout] = useState('');
  const [laden, setLaden] = useState(true);

  // Escape sluit het paneel. Zonder dit moet iemand die met het toetsenbord
  // werkt eerst naar het kruisje navigeren.
  useEffect(() => {
    const opToets = (e) => { if (e.key === 'Escape') onSluit(); };
    document.addEventListener('keydown', opToets);
    return () => document.removeEventListener('keydown', opToets);
  }, [onSluit]);

  useEffect(() => {
    let geannuleerd = false;
    (async () => {
      setLaden(true); setFout('');
      try {
        const d = await apiFetch(`/admin/kyc/dossier/${dossierId}`);
        if (!geannuleerd) setDossier(d);
      } catch (e) {
        if (!geannuleerd) setFout(parseError(e, t));
      } finally {
        if (!geannuleerd) setLaden(false);
      }
    })();
    return () => { geannuleerd = true; };
  }, [dossierId, t]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      // Klikken naast het paneel sluit het. De controle op currentTarget zorgt
      // dat een klik binnen het paneel niet per ongeluk doorslaat.
      onClick={(e) => { if (e.target === e.currentTarget) onSluit(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tx('kyc_admin_dossier', 'Particulier dossier')}
        className="bg-surface-2 border border-border rounded-md w-full max-w-3xl my-4 shadow-soft-xl"
      >
        <header className="flex items-start justify-between gap-4 p-4 border-b border-border bg-surface sticky top-0 rounded-t-md">
          <div>
            <h3 className="font-display text-lg font-medium text-ink-1">
              {tx('kyc_admin_dossier', 'Particulier dossier')}
            </h3>
            {dossier && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Pil stijl={KYC_STATUS_STIJL[dossier.status]}>{label(STATUS_LABEL, dossier.status)}</Pil>
                <RisicoBadge klasse={dossier.risico.klasse} score={dossier.risico.score} />
                <span className="text-sm">
                  <Wachttijd dagen={dossier.dagenWachtend} buiten={dossier.buitenTermijn} />
                </span>
              </div>
            )}
          </div>
          <button onClick={onSluit} className="text-gray-500 hover:text-ink-1 transition" aria-label={tx('sluiten', 'Sluiten')}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 space-y-4">
          {laden && <div className="text-ink-2 animate-pulse py-8 text-center">{tx('laden', 'Laden...')}</div>}
          {fout && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{fout}</div>}
          {dossier && !laden && (
            <>
              <VraagRisico risico={dossier.risico} tx={tx} />
              <VraagBesluit besluit={dossier.besluit} tx={tx} />
              <VraagVastlegging vastlegging={dossier.vastlegging} tx={tx} />
              <VraagGedrag gedrag={dossier.gedrag} tx={tx} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Hoofdcomponent ───────────────────────────────────────────────────────────

export default function KycDossiers() {
  const { t } = useTaal();
  const tx = useTx();
  const [data, setData] = useState({ dossiers: [], tellers: null });
  const [fout, setFout] = useState('');
  const [laden, setLaden] = useState(true);
  const [open, setOpen] = useState(null);
  // Vernieuwen gebeurt door deze teller op te hogen. Het ophalen zit in het
  // effect zelf, met een annuleervlag, zodat een antwoord dat binnenkomt nadat
  // het scherm is gesloten geen state meer zet.
  const [versie, setVersie] = useState(0);
  const laad = useCallback(() => setVersie((v) => v + 1), []);

  useEffect(() => {
    let geannuleerd = false;
    (async () => {
      try {
        const d = await apiFetch('/admin/kyc/wachtrij');
        if (geannuleerd) return;
        setData({ dossiers: d.dossiers || [], tellers: d.tellers || null });
        setFout('');
      } catch (e) {
        if (!geannuleerd) setFout(parseError(e, t));
      } finally {
        if (!geannuleerd) setLaden(false);
      }
    })();
    return () => { geannuleerd = true; };
  }, [t, versie]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-medium text-ink-1">
            {tx('kyc_admin_titel', 'Particuliere aanvragen')}
          </h3>
          <p className="text-sm text-ink-2">
            {tx('kyc_admin_sub', 'Risico, wat er ontbreekt, en waarom een dossier nog niet beoordeeld kan worden.')}
          </p>
        </div>
        <button onClick={laad} disabled={laden} className="text-gray-500 hover:text-brand-600 disabled:opacity-40 transition" title={tx('vernieuwen', 'Vernieuwen')}>
          <Refresh className="w-5 h-5" />
        </button>
      </div>

      {fout && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">{fout}</div>}
      {laden && <div className="text-ink-2 animate-pulse py-8 text-center">{tx('laden', 'Laden...')}</div>}

      {!laden && !fout && (
        <>
          <Tellers tellers={data.tellers} tx={tx} />
          <Wachtrij dossiers={data.dossiers} tx={tx} onOpen={setOpen} />
        </>
      )}

      {open && <DossierPaneel dossierId={open} onSluit={() => setOpen(null)} tx={tx} />}
    </div>
  );
}
