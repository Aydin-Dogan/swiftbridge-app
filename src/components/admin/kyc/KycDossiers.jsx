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
 * BESLUITEN
 * Sinds 2-10-2026 neemt dit scherm ook besluiten, via de KYC-poort in de API.
 * Bij midden en hoog risico tekenen twee medewerkers: de tweede ziet wat de
 * eerste besloot (wie, wanneer, met welke reden) en bevestigt precies dat
 * besluit; iets anders kiezen kan alleen bewust, met een reden (14-10-2026).
 *
 * Endpoints: GET /admin/kyc/wachtrij, GET /admin/kyc/dossier/:id,
 * PUT /admin/kyc/dossier/:id/checklist en POST /admin/kyc/dossier/:id/besluit
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
  DOEL_LABEL, VOLUME_LABEL, HERKOMST_LABEL, ANTWOORD_BRON_LABEL,
  BESLUIT_LABEL, ROL_LABEL, REDEN_LABEL,
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

/** De drie antwoorden die de API per checklistpunt accepteert. */
const ANTWOORDEN = [
  { waarde: 'akkoord', kort: 'Ja' },
  { waarde: 'niet_akkoord', kort: 'Nee' },
  { waarde: 'niet_van_toepassing', kort: 'N.v.t.' },
];

/**
 * Een checklistpunt met zijn drie antwoorden.
 *
 * Bewust geen enkel vinkje: de API kent drie antwoorden, en "niet van
 * toepassing" is iets anders dan "niet afgevinkt". Een vakje dat beide zou
 * moeten betekenen, laat een beoordelaar denken dat hij iets heeft vastgelegd
 * wat er niet staat.
 */
function ChecklistPunt({ punt, waarde, bezig, onKies, tx }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-ink-2">{label(CHECKLIST_LABEL, punt)}</span>
      <span className="flex shrink-0 rounded-md border border-border overflow-hidden" role="group"
        aria-label={label(CHECKLIST_LABEL, punt)}>
        {ANTWOORDEN.map((a) => (
          <button
            key={a.waarde}
            type="button"
            disabled={bezig}
            aria-pressed={waarde === a.waarde}
            onClick={() => onKies(punt, a.waarde)}
            className={`px-2.5 py-1 text-xs font-medium border-l first:border-l-0 border-border transition
              disabled:opacity-40
              ${waarde === a.waarde
                ? (a.waarde === 'akkoord' ? 'bg-success-600 text-white'
                  : a.waarde === 'niet_akkoord' ? 'bg-red-600 text-white'
                  : 'bg-ink-2 text-white')
                : 'bg-surface text-ink-2 hover:bg-surface-3'}`}
          >
            {tx(`kyc_admin_antwoord_${a.waarde}`, a.kort)}
          </button>
        ))}
      </span>
    </li>
  );
}

/** Leesbare teksten voor besluit, rol en redencode; vertaald via src/i18n. */
function besluitTeksten(tx) {
  return {
    besluit: (code) => tx(`kyc_admin_besluit_${code}`, label(BESLUIT_LABEL, code)),
    rol: (code) => tx(`kyc_admin_rol_${code}`, label(ROL_LABEL, code)),
    reden: (code) => tx(`kyc_admin_reden_${code}`, label(REDEN_LABEL, code)),
  };
}

/** Besluiten die de tweede beoordelaar kan bevestigen (API lib/vierogen.js). */
const AFSLUITENDE_BESLUITEN = ['goedgekeurd', 'afgewezen', 'beeindigd'];

/**
 * Wat de eerste beoordelaar besloot: besluit, reden, wie (naam en rol) en
 * wanneer. Zonder dit bevestigde de tweede beoordelaar blind, en stuurde de
 * knop altijd 'goedgekeurd', ook na een afwijzing door de eerste.
 */
function EersteBeoordeling({ eerste, tx }) {
  const teksten = besluitTeksten(tx);
  const kop = tx('kyc_admin_eerste_kop', 'Besluit van de eerste beoordelaar');
  if (!eerste) {
    return (
      <div role="group" aria-label={kop} className="rounded-md border border-amber-200 bg-amber-50 p-3 mb-3 text-sm text-amber-700">
        {tx('kyc_admin_eerste_kwijt',
          'Het besluit van de eerste beoordelaar is niet terug te vinden. Zet het dossier terug in behandeling; dan begint de beoordeling opnieuw.')}
      </div>
    );
  }
  const wie = eerste.beoordelaar
    ? `${eerste.beoordelaar.naam} (${teksten.rol(eerste.beoordelaar.rol)})`
    : tx('kyc_admin_eerste_onbekend', 'Onbekende medewerker');
  return (
    <div role="group" aria-label={kop} className="rounded-md border border-brand-100 bg-brand-50 p-3 mb-3">
      <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mb-1">{kop}</div>
      <Regel naam={tx('kyc_admin_eerste_besluit', 'Besluit')}>
        <span className={`font-medium ${eerste.besluit === 'goedgekeurd' ? 'text-success-700' : 'text-red-600'}`}>
          {teksten.besluit(eerste.besluit)}
        </span>
      </Regel>
      {eerste.redenCode && (
        <Regel naam={tx('kyc_admin_eerste_reden', 'Reden')}>{teksten.reden(eerste.redenCode)}</Regel>
      )}
      <Regel naam={tx('kyc_admin_eerste_wie', 'Door')}>{wie}</Regel>
      <Regel naam={tx('kyc_admin_eerste_wanneer', 'Op')}>{fmtDatum(eerste.op)}</Regel>
    </div>
  );
}

/** Een keuzelijst met de redencodes bij afwijzen. */
function RedenKeuze({ id, codes, waarde, onKies, tx }) {
  const teksten = besluitTeksten(tx);
  return (
    <div className="mb-3">
      <label htmlFor={id} className="block text-sm font-medium text-ink-1 mb-1">
        {tx('kyc_admin_afwijzen_kop', 'Reden van de afwijzing')}
      </label>
      <select
        id={id}
        value={waarde}
        onChange={(e) => onKies(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-1"
      >
        <option value="">{tx('kyc_admin_afwijzen_kies', 'Kies een reden')}</option>
        {codes.map((c) => <option key={c} value={c}>{teksten.reden(c)}</option>)}
      </select>
      <p className="text-xs text-ink-2 mt-1">
        {tx('kyc_admin_afwijzen_uitleg', 'De reden blijft intern. De klant krijgt alleen de vaste tekst die bij deze reden hoort.')}
      </p>
    </div>
  );
}

const KNOP_NEUTRAAL = 'px-4 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 hover:bg-surface-3 disabled:opacity-40';
const KNOP_ROOD = 'px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-sm text-white font-semibold disabled:opacity-40';
const KNOP_GROEN = 'px-4 py-2 rounded-md bg-success-600 hover:bg-success-700 text-sm text-white font-semibold disabled:opacity-40';
const TEKSTVAK = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-1';

function VraagBesluit({
  besluit, checklist, magBeoordelen, status, eersteBeoordeling, screening, dossierId, tx, onBijgewerkt,
}) {
  const blokkerend = besluit.ontbreekt.filter((o) => o.blokkerend);
  const overig = besluit.ontbreekt.filter((o) => !o.blokkerend);
  const teksten = besluitTeksten(tx);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [ontbreekt, setOntbreekt] = useState([]);
  // Welk invulvak open staat: 'info' (vraag aan de klant), 'afwijzen' (reden)
  // of 'oneens' (de tweede beoordelaar kiest iets anders dan de eerste).
  const [formulier, setFormulier] = useState(null);
  const [tekst, setTekst] = useState('');
  const [redenCode, setRedenCode] = useState('');
  const [oneensKeuze, setOneensKeuze] = useState('in_behandeling');
  const [trefferVerworpen, setTrefferVerworpen] = useState(false);
  const wachtOpTweede = status === 'wacht_op_tweede';
  const mag = magBeoordelen?.mag === true;
  const eerste = wachtOpTweede ? eersteBeoordeling : null;
  const teBevestigen = eerste && AFSLUITENDE_BESLUITEN.includes(eerste.besluit) ? eerste.besluit : null;
  const redenCodes = Array.isArray(besluit.redenCodes) ? besluit.redenCodes : Object.keys(REDEN_LABEL);

  // Een gedeeltelijke overeenkomst met de sanctielijst: goedkeuren kan pas als
  // de beoordelaar uitdrukkelijk zegt dat hij hem zelf heeft nagekeken en
  // verworpen. De poort vraagt dat van beide beoordelaars.
  const mogelijkeTreffer = Boolean(
    screening && screening.uitgevoerd && !screening.hit && Number(screening.mogelijkeTreffers) > 0
  );
  const vraagNaarTreffer = mogelijkeTreffer && (wachtOpTweede ? teBevestigen === 'goedgekeurd' : true);
  const trefferOpen = vraagNaarTreffer && !trefferVerworpen;

  function openFormulier(welk) {
    setFormulier((nu) => (nu === welk ? null : welk));
    setTekst('');
    setFout('');
  }

  function sluitFormulier() {
    setFormulier(null);
    setTekst('');
    setRedenCode('');
    setOneensKeuze('in_behandeling');
  }

  async function kiesAntwoord(punt, waarde) {
    setBezig(true);
    setFout('');
    try {
      await apiFetch(`/admin/kyc/dossier/${dossierId}/checklist`, {
        method: 'PUT',
        body: { checklist: { [punt]: waarde } },
      });
      onBijgewerkt?.();
    } catch (e) {
      setFout(e?.body?.error || e?.message || 'Opslaan is niet gelukt.');
    } finally {
      setBezig(false);
    }
  }

  /**
   * Stuurt een besluit. body is precies wat de API krijgt: { besluit } plus,
   * waar nodig, de vraag aan de klant of de notitie (opmerking), de redencode
   * of mogelijkeTrefferBeoordeeld.
   */
  async function neemBesluit(body) {
    setBezig(true);
    setFout('');
    setOntbreekt([]);
    try {
      await apiFetch(`/admin/kyc/dossier/${dossierId}/besluit`, { method: 'POST', body });
      sluitFormulier();
      setTrefferVerworpen(false);
      onBijgewerkt?.();
    } catch (e) {
      setFout(e?.body?.error || e?.message || 'Het besluit kon niet worden vastgelegd.');
      // De API vertelt WELKE punten nog ontbreken; dat is bruikbaarder dan
      // alleen "checklist niet volledig".
      if (Array.isArray(e?.body?.ontbreekt)) setOntbreekt(e.body.ontbreekt);
      // De poort screende de klant zojuist opnieuw. Het dossier opnieuw
      // ophalen laat de verse uitslag zien, en zo nodig de vraag of de
      // beoordelaar een mogelijke treffer zelf heeft verworpen.
      if (e?.body?.errorCode === 'KYC_POORT_GEWEIGERD') onBijgewerkt?.();
    } finally {
      setBezig(false);
    }
  }

  function goedkeuren() {
    neemBesluit(vraagNaarTreffer
      ? { besluit: 'goedgekeurd', mogelijkeTrefferBeoordeeld: trefferVerworpen }
      : { besluit: 'goedgekeurd' });
  }

  /** De tweede handtekening: precies het besluit (en de reden) van de eerste. */
  function bevestig() {
    if (teBevestigen === 'goedgekeurd') return goedkeuren();
    const body = { besluit: teBevestigen };
    if (teBevestigen === 'afgewezen') body.redenCode = eerste.redenCode || redenCode;
    return neemBesluit(body);
  }

  // Een oudere eerste afwijzing zonder vastgelegde reden: dan kiest de tweede
  // de reden, want zonder reden weigert de API.
  const redenOntbreekt = teBevestigen === 'afgewezen' && !eerste?.redenCode;
  const bevestigenKan = mag && !bezig && !trefferOpen && !(redenOntbreekt && !redenCode);

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
      <ul className="divide-y divide-border mb-4">
        {besluit.checklist.map((punt) => (
          <ChecklistPunt
            key={punt}
            punt={punt}
            waarde={checklist?.[punt]}
            bezig={bezig}
            onKies={kiesAntwoord}
            tx={tx}
          />
        ))}
      </ul>

      {besluit.interneNotitie && (
        <div
          role="group"
          aria-label={tx('kyc_admin_notitie_kop', 'Interne notitie bij het vorige besluit')}
          className="rounded-md border border-border bg-surface-2 p-3 mb-3"
        >
          <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 mb-1">
            {tx('kyc_admin_notitie_kop', 'Interne notitie bij het vorige besluit')}
          </div>
          <p className="text-sm text-ink-1 whitespace-pre-line">{besluit.interneNotitie}</p>
        </div>
      )}

      {wachtOpTweede && <EersteBeoordeling eerste={eerste} tx={tx} />}

      {wachtOpTweede && (
        <div className="rounded-md border border-brand-100 bg-brand-50 p-3 mb-3 text-sm text-ink-1">
          {mag
            ? tx('kyc_admin_tweede_uitleg',
              'Jij bent de tweede beoordelaar: je bevestigt dit besluit. Ben je het niet eens, kies dan "Niet eens" en schrijf op waarom.')
            : (magBeoordelen?.reden
              || tx('kyc_admin_tweede_ander', 'Dit dossier wacht op een tweede beoordelaar.'))}
        </div>
      )}

      {redenOntbreekt && mag && (
        <RedenKeuze id={`kyc-reden-tweede-${dossierId}`} codes={redenCodes} waarde={redenCode} onKies={setRedenCode} tx={tx} />
      )}

      {vraagNaarTreffer && (
        <label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 mb-3 text-sm text-amber-800">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={trefferVerworpen}
            disabled={bezig || !mag}
            onChange={(e) => setTrefferVerworpen(e.target.checked)}
          />
          <span>
            {tx('kyc_admin_treffer_verworpen',
              'Ik heb de mogelijke treffer zelf nagekeken op de sanctielijst: het is niet deze klant.')}
          </span>
        </label>
      )}

      {fout && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 mb-3 text-sm text-red-700">
          {fout}
          {ontbreekt.length > 0 && (
            <ul className="mt-1 list-disc list-inside">
              {ontbreekt.map((p) => <li key={p}>{label(CHECKLIST_LABEL, p)}</li>)}
            </ul>
          )}
        </div>
      )}

      {wachtOpTweede ? (
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" disabled={bezig || !mag} onClick={() => openFormulier('oneens')} className={KNOP_NEUTRAAL}>
            {teBevestigen
              ? tx('kyc_admin_knop_oneens', 'Niet eens')
              : tx('kyc_admin_knop_terugzetten', 'Terug in behandeling')}
          </button>
          {teBevestigen && (
            <button
              type="button"
              disabled={!bevestigenKan}
              onClick={bevestig}
              className={teBevestigen === 'goedgekeurd' ? KNOP_GROEN : KNOP_ROOD}
            >
              {tx('kyc_admin_knop_bevestig_besluit', 'Bevestigen: {besluit}', { besluit: teksten.besluit(teBevestigen) })}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" disabled={bezig} onClick={() => openFormulier('info')} className={KNOP_NEUTRAAL}>
            {tx('kyc_admin_knop_info', 'Informatie opvragen')}
          </button>
          <button type="button" disabled={bezig || !mag} onClick={() => openFormulier('afwijzen')} className={KNOP_ROOD}>
            {tx('kyc_admin_knop_afwijzen', 'Afwijzen')}
          </button>
          <button type="button" disabled={bezig || !mag || trefferOpen} onClick={goedkeuren} className={KNOP_GROEN}>
            {tx('kyc_admin_knop_goedkeuren', 'Goedkeuren')}
          </button>
        </div>
      )}

      {formulier === 'info' && (
        <BesluitFormulier
          bezig={bezig}
          kanVersturen={Boolean(tekst.trim())}
          knop={tx('kyc_admin_info_versturen', 'Vraag versturen')}
          onVerstuur={() => neemBesluit({ besluit: 'info_nodig', opmerking: tekst.trim() })}
          onAnnuleer={sluitFormulier}
          tx={tx}
        >
          <VrijeTekst
            id={`kyc-info-${dossierId}`}
            label={tx('kyc_admin_info_vraag', 'Wat heb je van de klant nodig? De klant krijgt deze tekst in de app en in de mail.')}
            waarde={tekst}
            onWijzig={setTekst}
            max={2000}
          />
        </BesluitFormulier>
      )}

      {formulier === 'afwijzen' && (
        <BesluitFormulier
          bezig={bezig}
          kanVersturen={Boolean(redenCode)}
          knop={tx('kyc_admin_knop_afwijzen_bevestigen', 'Afwijzing vastleggen')}
          stijl={KNOP_ROOD}
          onVerstuur={() => neemBesluit({ besluit: 'afgewezen', redenCode })}
          onAnnuleer={sluitFormulier}
          tx={tx}
        >
          <RedenKeuze id={`kyc-reden-${dossierId}`} codes={redenCodes} waarde={redenCode} onKies={setRedenCode} tx={tx} />
        </BesluitFormulier>
      )}

      {formulier === 'oneens' && (
        <BesluitFormulier
          bezig={bezig}
          kanVersturen={Boolean(tekst.trim())}
          knop={tx('kyc_admin_knop_oneens_versturen', 'Vastleggen')}
          onVerstuur={() => neemBesluit({ besluit: oneensKeuze, opmerking: tekst.trim() })}
          onAnnuleer={sluitFormulier}
          tx={tx}
        >
          <fieldset className="mb-3">
            <legend className="text-sm font-medium text-ink-1 mb-1">
              {tx('kyc_admin_oneens_kop', 'Wat moet er nu gebeuren?')}
            </legend>
            {[
              { waarde: 'in_behandeling', tekst: tx('kyc_admin_oneens_terug', 'Terug in behandeling: de beoordeling begint opnieuw') },
              { waarde: 'info_nodig', tekst: tx('kyc_admin_oneens_info', 'Informatie opvragen bij de klant') },
            ].map((k) => (
              <label key={k.waarde} className="flex items-center gap-2 text-sm text-ink-1 py-0.5">
                <input
                  type="radio"
                  name={`kyc-oneens-${dossierId}`}
                  value={k.waarde}
                  checked={oneensKeuze === k.waarde}
                  // Het vak is een interne notitie OF de vraag aan de klant.
                  // Bij wisselen leeg, anders gaat een interne notitie met een
                  // klik naar de klant, in de app en in de mail (Wwft art. 23).
                  onChange={() => { setOneensKeuze(k.waarde); setTekst(''); }}
                />
                {k.tekst}
              </label>
            ))}
          </fieldset>
          <VrijeTekst
            id={`kyc-oneens-tekst-${dossierId}`}
            label={oneensKeuze === 'info_nodig'
              ? tx('kyc_admin_info_vraag', 'Wat heb je van de klant nodig? De klant krijgt deze tekst in de app en in de mail.')
              : tx('kyc_admin_oneens_reden', 'Waarom ben je het niet eens? Dit is een interne notitie; de klant ziet hem niet.')}
            waarde={tekst}
            onWijzig={setTekst}
            max={oneensKeuze === 'info_nodig' ? 2000 : 500}
          />
        </BesluitFormulier>
      )}
    </Blok>
  );
}

/** Een invulvak onder de besluitknoppen, met Annuleren en een verstuurknop. */
function BesluitFormulier({ bezig, kanVersturen, knop, stijl = KNOP_GROEN, onVerstuur, onAnnuleer, tx, children }) {
  return (
    <div className="mt-3 rounded-md border border-border bg-surface-2 p-3">
      {children}
      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" disabled={bezig} onClick={onAnnuleer} className={KNOP_NEUTRAAL}>
          {tx('annuleren', 'Annuleren')}
        </button>
        <button type="button" disabled={bezig || !kanVersturen} onClick={onVerstuur} className={stijl}>
          {knop}
        </button>
      </div>
    </div>
  );
}

function VrijeTekst({ id, label: tekstLabel, waarde, onWijzig, max }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="block text-sm font-medium text-ink-1 mb-1">{tekstLabel}</label>
      <textarea
        id={id}
        rows={3}
        maxLength={max}
        value={waarde}
        onChange={(e) => onWijzig(e.target.value)}
        className={TEKSTVAK}
      />
    </div>
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

      <ScreeningUitslag screening={vastlegging.screening} tx={tx} />
    </Blok>
  );
}

/**
 * De uitslag van de laatste sanctiescreening van de KYC-poort. Tot 14-10-2026
 * stond hier alleen "Screening uitgevoerd", ook bij een (mogelijke) treffer;
 * dan wist de beoordelaar niet dat hij iets moest nakijken. De API geeft
 * bewust alleen aantallen en scores, geen namen van de lijst.
 */
function ScreeningUitslag({ screening: s, tx }) {
  let stijl = 'border-amber-200 bg-amber-50 text-amber-700';
  let tekst;
  if (!s) {
    tekst = tx('kyc_admin_screening_nooit',
      'Er is voor deze klant nooit gescreend op sanctielijsten. Dat is een wettelijke verplichting zonder drempel.');
  } else if (!s.uitgevoerd || s.unavailable) {
    tekst = tx('kyc_admin_screening_onbereikbaar',
      'De laatste screening kon niet worden uitgevoerd: de lijst was niet bereikbaar. Zonder screening geen goedkeuring.');
  } else if (s.hit) {
    stijl = 'border-red-200 bg-red-50 text-red-700';
    tekst = tx('kyc_admin_screening_treffer', 'Treffer op de sanctielijst. Dit dossier kan niet worden goedgekeurd.');
  } else if (Number(s.mogelijkeTreffers) > 0) {
    tekst = tx('kyc_admin_screening_mogelijk',
      'Mogelijke treffer op de sanctielijst: {n}, hoogste overeenkomst {score}. Kijk zelf na of het om deze klant gaat.',
      {
        n: s.mogelijkeTreffers,
        score: typeof s.hoogsteScore === 'number' ? `${Math.round(s.hoogsteScore * 100)}%` : '-',
      });
  } else {
    stijl = 'border-success-100 bg-success-50 text-success-700';
    tekst = tx('kyc_admin_screening_schoon', 'Geen treffer op de sanctielijst.');
  }
  return (
    <div className={`mt-4 rounded-md border p-3 ${stijl}`}>
      <div className="text-sm font-medium">{tx('kyc_admin_screening_kop', 'Screening')}</div>
      <p className="text-sm mt-0.5 opacity-90">{tekst}</p>
      {s?.op && (
        <p className="text-xs mt-1 opacity-80">
          {tx('kyc_admin_screening_op', 'Laatste screening: {op}', { op: fmtDatum(s.op) })}
        </p>
      )}
    </div>
  );
}

/**
 * Wat de klant zelf opgaf over doel en gebruik (stap 6 van de aanmeldroute,
 * 14-10-2026), precies zoals de KYC-poort het ziet. Na een wijziging staat bij
 * elk veranderd antwoord wat het eerst was: een wijziging na goedkeuring kan de
 * klant terug in beoordeling hebben gezet, en dan wil de beoordelaar weten wat er
 * veranderde. De PEP-verklaring "ja" valt op: die beslist het hoger management
 * van de principaal, niet deze beoordelaar.
 */
function AntwoordenKlant({ antwoorden: a, tx }) {
  const vorige = a.vorige || {};
  const veranderd = new Set(a.gewijzigd || []);
  const landen = (lijst) => (Array.isArray(lijst) && lijst.length ? lijst.join(', ') : '-');
  const pep = (w) => {
    if (w === true) return tx('ja', 'Ja');
    if (w === false) return tx('nee', 'Nee');
    return '-';
  };
  const regels = [
    { veld: 'doel', naam: tx('kyc_admin_doel', 'Waarvoor'), toon: (x) => label(DOEL_LABEL, x.doel) },
    { veld: 'verwachtMaandVolume', naam: tx('kyc_admin_volume', 'Bedrag per maand'), toon: (x) => label(VOLUME_LABEL, x.verwachtMaandVolume) },
    { veld: 'bronInkomen', naam: tx('kyc_admin_herkomst', 'Herkomst van het geld'), toon: (x) => label(HERKOMST_LABEL, x.bronInkomen) },
    { veld: 'pep', naam: tx('kyc_admin_pep_verklaring', 'Politiek prominent (eigen verklaring)'), toon: (x) => pep(x.pep) },
    { veld: 'landen', naam: tx('kyc_admin_opgegeven_landen', 'Naar welke landen'), toon: (x) => landen(x.landen) },
  ];
  const kop = [
    a.versie ? `${tx('kyc_admin_versie', 'versie')} ${a.versie}` : null,
    a.opgeslagenOp ? fmtDatum(a.opgeslagenOp) : null,
    a.bron ? label(ANTWOORD_BRON_LABEL, a.bron) : null,
  ].filter(Boolean).join(' · ');
  const opgaf = tx('kyc_admin_verwacht', 'Wat de klant opgaf');

  return (
    <div role="group" aria-label={opgaf} className="mt-3 rounded-md border border-border p-3">
      <div className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500">{opgaf}</div>
      {kop && <p className="text-xs text-ink-3 mt-0.5 mb-1">{kop}</p>}
      {regels.map((r) => (
        <Regel key={r.veld} naam={r.naam}>
          <span className={r.veld === 'pep' && a.pep === true ? 'text-red-600 font-medium' : undefined}>{r.toon(a)}</span>
          {veranderd.has(r.veld) && (
            <span className="block text-xs text-amber-700">{tx('kyc_admin_eerder', 'eerder')}: {r.toon(vorige)}</span>
          )}
        </Regel>
      ))}
    </div>
  );
}

function VraagGedrag({ gedrag, antwoorden, tx }) {
  return (
    <Blok nummer={4} vraag={tx('kyc_admin_vraag4', 'Klopt zijn gedrag later nog met zijn verhaal?')}>
      <Regel naam={tx('kyc_admin_tx', 'Uitgevoerde overboekingen')}>{gedrag.aantalTransacties}</Regel>
      <Regel naam={tx('kyc_admin_landen', 'Landen van de ontvangers')}>
        {gedrag.bestemmingslanden?.length ? gedrag.bestemmingslanden.join(', ') : '-'}
      </Regel>
      {antwoorden ? <AntwoordenKlant antwoorden={antwoorden} tx={tx} /> : (
        <Regel naam={tx('kyc_admin_verwacht', 'Wat de klant opgaf')}>
          <span className="text-amber-700">{tx('kyc_admin_niet_gevraagd', 'nooit gevraagd')}</span>
        </Regel>
      )}
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

  // Na elk vinkje en elk besluit het dossier opnieuw ophalen, zodat de status,
  // de checklist en "mag ik nog beslissen" van de server komen en niet van wat
  // het scherm dacht. Dit loopt vanuit een klik, niet vanuit een effect, dus
  // hier mag de status gewoon direct worden gezet.
  const herlaadDossier = useCallback(async () => {
    try {
      const d = await apiFetch(`/admin/kyc/dossier/${dossierId}`);
      setDossier(d);
      setFout('');
    } catch (e) {
      setFout(parseError(e, t));
    }
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
              <VraagBesluit
                besluit={dossier.besluit}
                checklist={dossier.checklist}
                magBeoordelen={dossier.magBeoordelen}
                status={dossier.status}
                eersteBeoordeling={dossier.eersteBeoordeling || null}
                screening={dossier.vastlegging?.screening || null}
                dossierId={dossierId}
                tx={tx}
                onBijgewerkt={herlaadDossier}
              />
              <VraagVastlegging vastlegging={dossier.vastlegging} tx={tx} />
              <VraagGedrag gedrag={dossier.gedrag} antwoorden={dossier.antwoorden} tx={tx} />
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
