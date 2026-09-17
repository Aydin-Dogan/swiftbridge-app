/**
 * KybDossier.jsx — Volledig dossier van één zakelijke aanvraag (KYB) voor de beoordelaar.
 *
 * Backend (contract 2.6):
 *   GET   /admin/kyb/:id                       -> { aanvraag, account, identiteit, documenten, screening, eerdereAanvragen, historie }
 *   POST  /admin/kyb/:id/in-behandeling        -> claimen
 *   POST  /admin/kyb/:id/herscreen             -> sanctiescreening opnieuw inplannen
 *   PATCH /admin/kyc/:kycId/beoordeel          -> identiteit goed-/afkeuren (contract 2.7)
 *   GET   /admin/kyc/:kycId/document/:type     -> beelden voorkant/achterkant/selfie (via KybDocumentKnop)
 *   GET   /admin/kyb/:id/document/:docId       -> geuploade documenten (via KybDocumentKnop)
 *
 * Secties in vaste volgorde (contract sectie 6): Bedrijf, Eigenaren en bestuurders, Identiteit,
 * Gebruik en doel, Aanvullend, Verklaringen, Screening, Documenten, Historie. Daaronder het
 * beoordeelpaneel (alleen bij ingediend/in_behandeling).
 *
 * De JSON-blokken komen gedecrypt uit de API; we lezen ze tolerant (bedrijf / bedrijfJson / bedrijf_json).
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, parseError } from '../../../services/api';
import { useTaal } from '../../../i18n';
import { AlertTriangle, CheckCircle, XCircle, Refresh, Shield } from '../../icons/Icons';
import KybDocumentKnop from './KybDocumentKnop';
import KybBeoordeelPaneel from './KybBeoordeelPaneel';
import {
  useTx, useKybLabels, fmtDatum, fmtBytes, STATUS_STIJL, veld, uboLijst, volledigeNaam, adresRegel, wijktAf,
} from './kybAdminLabels';

function Pill({ children, klas = 'bg-surface-3 text-ink-2 border-border' }) {
  return <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${klas}`}>{children}</span>;
}

function Sectie({ titel, children, extra }) {
  return (
    <section className="bg-surface border border-border rounded-md p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <h3 className="font-display text-base font-medium text-ink-1">{titel}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Rij({ label, children, afwijkend = false, afwijkLabel }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-3 py-1.5 border-b border-border/60 last:border-0 text-sm">
      <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 pt-0.5">{label}</div>
      <div className={`text-ink-1 ${afwijkend ? 'text-red-700 font-semibold' : ''}`}>
        {children ?? '-'}
        {afwijkend && afwijkLabel && <Pill klas="bg-red-100 text-red-700 border-red-200 ml-2">{afwijkLabel}</Pill>}
      </div>
    </div>
  );
}

function matchesTekst(matches) {
  if (!matches) return '';
  if (Array.isArray(matches)) {
    return matches.map((m) => (typeof m === 'string' ? m : (m?.naam || m?.name || m?.gecheckteNaam || JSON.stringify(m)))).join('; ');
  }
  return typeof matches === 'string' ? matches : JSON.stringify(matches);
}

export default function KybDossier({ id, onTerug, onGewijzigd }) {
  const { t } = useTaal();
  const tx = useTx();
  const labels = useKybLabels();
  const [data, setData] = useState(null);
  const [fout, setFout] = useState('');
  const [actieBezig, setActieBezig] = useState('');
  const [actieMelding, setActieMelding] = useState('');
  const [idAfwijsOpen, setIdAfwijsOpen] = useState(false);
  const [idOpmerking, setIdOpmerking] = useState('');

  // Laadstatus afgeleid van een sleutel (id + herlaadronde): "laden" zolang de ronde voor de
  // huidige sleutel nog niet is afgerond. Het ophalen zelf gebeurt in de effect hieronder;
  // state-updates alleen in de promise-callbacks (geen synchrone setState in de effect).
  const [herlaadNr, setHerlaadNr] = useState(0);
  const [geladenSleutel, setGeladenSleutel] = useState(null);
  const sleutel = `${id}|${herlaadNr}`;
  const laden = geladenSleutel !== sleutel;
  const laad = useCallback(() => setHerlaadNr((n) => n + 1), []);

  useEffect(() => {
    let actief = true;
    apiFetch(`/admin/kyb/${id}`)
      .then((d) => { if (actief) { setData(d); setFout(''); } })
      .catch((e) => { if (actief) setFout(parseError(e, t)); })
      .finally(() => { if (actief) setGeladenSleutel(sleutel); });
    return () => { actief = false; };
  }, [id, sleutel, t]);

  async function actie(naam, fn) {
    setActieBezig(naam); setActieMelding('');
    try {
      await fn();
      laad();
      onGewijzigd?.();
    } catch (e) {
      setActieMelding(parseError(e, t));
    } finally {
      setActieBezig('');
    }
  }

  const terugKnop = (
    <button type="button" onClick={onTerug} className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4">
      &larr; {tx('kyb_admin_titel', 'Zakelijke aanvragen')}
    </button>
  );

  if (laden && !data) return <div className="space-y-4">{terugKnop}<div className="text-center text-ink-2 py-10">{tx('laden', 'Laden...')}</div></div>;
  if (fout && !data) return <div className="space-y-4">{terugKnop}<div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div></div>;
  if (!data) return null;

  const aanvraag = data.aanvraag || {};
  const account = data.account || {};
  const identiteit = data.identiteit || {};
  const documenten = Array.isArray(data.documenten) ? data.documenten : [];
  const screening = data.screening || veld(aanvraag, 'screening') || null;
  const eerdere = Array.isArray(data.eerdereAanvragen) ? data.eerdereAanvragen : [];
  const historie = Array.isArray(data.historie) ? data.historie : [];

  const status = veld(aanvraag, 'status') || '-';
  const bedrijf = veld(aanvraag, 'bedrijf') || {};
  const kvkProfiel = bedrijf.kvkProfiel || null;
  const persoon = veld(aanvraag, 'persoon') || {};
  const toestel = veld(aanvraag, 'toestel') || {};
  const gebruik = veld(aanvraag, 'gebruik') || {};
  const identiteitBlok = veld(aanvraag, 'identiteit') || {};
  const aanvullend = veld(aanvraag, 'aanvullend') || {};
  const toestemming = veld(aanvraag, 'toestemming') || {};
  const infoVerzoek = veld(aanvraag, 'infoVerzoek') || null;
  const infoAntwoord = veld(aanvraag, 'infoAntwoord') ?? veld(aanvraag, 'infoAntwoordVersleuteld') ?? null;
  const risicoSignalen = veld(aanvraag, 'risicoSignalen') || [];
  const checklistInit = veld(aanvraag, 'beoordelingChecklist') || [];
  const notitieInit = veld(aanvraag, 'beoordelingNotitie') || '';
  const ubos = uboLijst(aanvraag);
  const bedrijfsnaam = bedrijf.bedrijfsnaam || veld(aanvraag, 'bedrijfsnaam') || account.bedrijfsnaam || '-';
  const snapshot = identiteit.snapshot || identiteitBlok.snapshot || null;
  const identiteitBron = identiteit.bron || identiteitBlok.bron;
  const kycRecordId = identiteit.kycRecordId || identiteitBlok.kycRecordId || null;
  const kycStatus = identiteit.kycStatus || account.kycStatus || null;
  const identiteitGoedgekeurd = kycStatus === 'goedgekeurd' || account.kycStatus === 'goedgekeurd' || account.idinStatus === 'geverifieerd';
  const beelden = Array.isArray(identiteit.beeldenBeschikbaar) ? identiteit.beeldenBeschikbaar : [];
  const magIdentiteitBeoordelen = Boolean(kycRecordId) && kycStatus === 'in_behandeling';
  const personenScreening = Array.isArray(screening?.personen) ? screening.personen : [];
  const screeningVoor = (uboId) => personenScreening.find((p) => p.id === uboId) || null;
  const vestigingOpgegeven = adresRegel(bedrijf.vestiging);
  const vestigingKvk = kvkProfiel ? adresRegel(kvkProfiel.vestiging) : null;
  const sbiOpgegeven = Array.isArray(bedrijf.sbiCodes) ? bedrijf.sbiCodes.map((s) => `${s.code} ${s.omschrijving || ''}`.trim()).join('; ') : '';
  const sbiKvk = kvkProfiel && Array.isArray(kvkProfiel.sbiCodes) ? kvkProfiel.sbiCodes.map((s) => `${s.code} ${s.omschrijving || ''}`.trim()).join('; ') : null;
  const afwijkLabel = tx('kyb_admin_afwijking', 'Wijkt af');

  return (
    <div className="space-y-4">
      {terugKnop}

      {/* Kop */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-medium text-ink-1">{bedrijfsnaam}</h2>
            <div className="text-xs text-ink-2 font-mono mt-0.5">KvK {bedrijf.kvkNummer || veld(aanvraag, 'kvkNummer') || '-'} · {tx('kyb_admin_kol_versie', 'Poging')} {veld(aanvraag, 'ingediendCount') ?? veld(aanvraag, 'versie') ?? 1}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Pill klas={STATUS_STIJL[status] || STATUS_STIJL.concept}>{labels.status(status)}</Pill>
              {veld(aanvraag, 'sanctieHit') ? <Pill klas="bg-red-100 text-red-700 border-red-200">{tx('kyb_admin_sanctie_hit', 'Sanctie-hit')}</Pill> : null}
              {risicoSignalen.map((s) => (
                <Pill key={s} klas={/sanctie|pep|mismatch/.test(s) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>{labels.risicoSignaal(s)}</Pill>
              ))}
            </div>
          </div>
          <div className="text-right text-xs text-ink-2 space-y-1">
            <div>{tx('kyb_admin_kol_ingediend', 'Ingediend')}: {fmtDatum(veld(aanvraag, 'ingediendOp'))}</div>
            <div>{tx('kyb_admin_kol_uiterlijk', 'Uiterlijk')}: {fmtDatum(veld(aanvraag, 'verwachtUiterlijkOp'), false)}</div>
            {veld(aanvraag, 'inBehandelingDoor') && <div>{tx('kyb_admin_in_behandeling_bij', 'In behandeling bij {naam}', { naam: veld(aanvraag, 'inBehandelingDoor') })}</div>}
            {veld(aanvraag, 'beoordeeldOp') && <div>{tx('kyb_admin_beoordeeld_op', 'Beoordeeld')}: {fmtDatum(veld(aanvraag, 'beoordeeldOp'))} ({veld(aanvraag, 'beoordeeldDoor') || '-'})</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {status === 'ingediend' && (
            <button type="button" disabled={Boolean(actieBezig)}
              onClick={() => actie('claim', () => apiFetch(`/admin/kyb/${id}/in-behandeling`, { method: 'POST', body: {} }))}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-50">
              {actieBezig === 'claim' ? tx('laden', 'Laden...') : tx('kyb_admin_claim', 'In behandeling nemen')}
            </button>
          )}
          <button type="button" disabled={Boolean(actieBezig)} onClick={laad}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-xs text-ink-1 hover:bg-surface-3 disabled:opacity-50">
            <Refresh className="w-3.5 h-3.5" aria-hidden="true" /> {tx('vernieuwen', 'Vernieuwen')}
          </button>
          {actieMelding && <span role="alert" className="text-xs text-red-700 self-center">{actieMelding}</span>}
        </div>
        {veld(aanvraag, 'berichtKlant') && (
          <p className="mt-3 text-sm text-ink-2 border-l-2 border-brand-100 pl-3">{tx('kyb_admin_bericht_klant', 'Bericht aan de klant')}: {veld(aanvraag, 'berichtKlant')}</p>
        )}
      </div>

      {/* 1. Bedrijf */}
      <Sectie titel={tx('kyb_admin_sectie_bedrijf', 'Bedrijf')} extra={<Pill klas={bedrijf.bron === 'handmatig' ? 'bg-amber-50 text-amber-700 border-amber-200' : undefined}>{labels.kvkBron(bedrijf.bron)}</Pill>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 border-b border-border">
                <th className="py-2 pr-3 w-40"></th>
                <th className="py-2 pr-3">{tx('kyb_admin_opgegeven', 'Opgegeven')}</th>
                <th className="py-2 pr-3">{tx('kyb_admin_kvk_profiel', 'Handelsregister')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[
                [tx('kyb_bedrijf_naam', 'Bedrijfsnaam'), bedrijf.bedrijfsnaam, kvkProfiel?.naam],
                [tx('kyb_bedrijf_kvk', 'KvK-nummer'), bedrijf.kvkNummer, kvkProfiel?.kvkNummer],
                [tx('kyb_bedrijf_adres_kop', 'Vestigingsadres'), vestigingOpgegeven, vestigingKvk],
                [tx('kyb_sbi_kop', 'Activiteiten (SBI)'), sbiOpgegeven || '-', sbiKvk],
              ].map(([label, opgegeven, kvk]) => {
                const afwijkend = kvkProfiel ? wijktAf(opgegeven, kvk) : false;
                return (
                  <tr key={label}>
                    <td className="py-2 pr-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 align-top">{label}</td>
                    <td className={`py-2 pr-3 align-top ${afwijkend ? 'text-red-700 font-semibold' : 'text-ink-1'}`}>
                      {opgegeven || '-'}
                      {afwijkend && <Pill klas="bg-red-100 text-red-700 border-red-200 ml-2">{afwijkLabel}</Pill>}
                    </td>
                    <td className="py-2 pr-3 align-top text-ink-2">{kvkProfiel ? (kvk || '-') : <span className="text-ink-3">-</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Rij label={tx('kyb_rechtsvorm_vraag', 'Rechtsvorm')}>{labels.rechtsvorm(bedrijf.rechtsvorm)}{bedrijf.rechtsvormOverige ? ` (${bedrijf.rechtsvormOverige})` : ''}{kvkProfiel?.rechtsvormKvk ? <span className="text-ink-3"> · KvK: {kvkProfiel.rechtsvormKvk}</span> : null}</Rij>
          <Rij label={tx('kyb_structuur_vraag', 'Structuur')}>{labels.structuurLijst(bedrijf.structuur)}</Rij>
          <Rij label={tx('kyb_handelsnaam_label', 'Handelsnaam')}>{bedrijf.handelsnaam || '-'}{kvkProfiel?.handelsnamen?.length ? <span className="text-ink-3"> · KvK: {kvkProfiel.handelsnamen.join(', ')}</span> : null}</Rij>
          <Rij label={tx('kyb_website_label', 'Website')}>{bedrijf.geenWebsite ? tx('kyb_website_geen', 'Mijn bedrijf heeft geen website') : (bedrijf.website || '-')}</Rij>
          <Rij label={tx('kyb_sbi_vraag', 'SBI bevestigd')}>{labels.jaNee(bedrijf.sbiBevestigd)}{bedrijf.sbiOpmerking ? ` - ${bedrijf.sbiOpmerking}` : ''}</Rij>
          {bedrijf.kvkOpgehaaldOp && <Rij label={tx('kyb_admin_kvk_opgehaald', 'KvK opgehaald')}>{fmtDatum(bedrijf.kvkOpgehaaldOp)}</Rij>}
          <Rij label={tx('kyb_uittreksel_label', 'KvK-uittreksel')}>
            {documenten.filter((d) => d.soort === 'kvk_uittreksel' && !d.verwijderdOp).length === 0
              ? <span className="text-ink-3">-</span>
              : documenten.filter((d) => d.soort === 'kvk_uittreksel' && !d.verwijderdOp).map((d) => (
                <KybDocumentKnop key={d.id} pad={`/admin/kyb/${id}/document/${d.id}`} label={`${tx('kyb_admin_document_open', 'Openen')} (${d.bestandsnaam || d.mime || 'document'})`} klein className="mr-2" />
              ))}
          </Rij>
        </div>
      </Sectie>

      {/* 2. Eigenaren en bestuurders */}
      <Sectie titel={tx('kyb_admin_sectie_personen', 'Eigenaren en bestuurders')}>
        {ubos.length === 0 ? <p className="text-sm text-ink-3">-</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 border-b border-border">
                  <th className="py-2 pr-3">{tx('kyb_admin_kol_naam', 'Naam')}</th>
                  <th className="py-2 pr-3">{tx('kyb_ubo_rol', 'Rol')}</th>
                  <th className="py-2 pr-3">{tx('kyb_ubo_aard', 'Soort belang')}</th>
                  <th className="py-2 pr-3">{tx('kyb_geboortedatum_label', 'Geboortedatum')}</th>
                  <th className="py-2 pr-3">{tx('kyb_nationaliteit_label', 'Nationaliteit')}</th>
                  <th className="py-2 pr-3">PEP</th>
                  <th className="py-2 pr-3">{tx('kyb_admin_sectie_screening', 'Screening')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {ubos.map((u, i) => {
                  const sc = screeningVoor(u.id);
                  return (
                    <tr key={u.id || i} className={u.pep ? 'bg-red-50/50' : ''}>
                      <td className="py-2 pr-3 text-ink-1">
                        {volledigeNaam(u)}
                        {u.isAanvrager && <Pill klas="bg-brand-50 text-brand-700 border-brand-100 ml-2">{tx('kyb_admin_aanvrager', 'Aanvrager')}</Pill>}
                      </td>
                      <td className="py-2 pr-3 text-ink-2">{labels.uboRol(u.rol)}</td>
                      <td className="py-2 pr-3 text-ink-2">{u.uboAard ? labels.uboAard(u.uboAard) : '-'}{u.uboPercentageKlasse ? ` · ${labels.uboPct(u.uboPercentageKlasse)}` : ''}</td>
                      <td className="py-2 pr-3 text-ink-2 tabular-nums">{u.geboortedatum || '-'}</td>
                      <td className="py-2 pr-3 text-ink-2">{u.nationaliteit || '-'}</td>
                      <td className="py-2 pr-3">
                        {u.pep ? <Pill klas="bg-red-100 text-red-700 border-red-200">PEP</Pill> : <span className="text-ink-3">{labels.jaNee(false)}</span>}
                        {u.pep && u.pepToelichting && <div className="text-xs text-ink-2 mt-1">{u.pepToelichting}</div>}
                      </td>
                      <td className="py-2 pr-3">
                        {!sc ? <span className="text-ink-3">-</span>
                          : sc.unavailable ? <Pill klas="bg-amber-50 text-amber-700 border-amber-200">{tx('kyb_admin_screening_onbeschikbaar', 'Screening niet uitgevoerd')}</Pill>
                            : sc.hit ? <Pill klas="bg-red-100 text-red-700 border-red-200">{tx('kyb_admin_sanctie_hit', 'Sanctie-hit')}</Pill>
                              : <Pill klas="bg-success-50 text-success-700 border-success-100">OK</Pill>}
                        {sc?.hit && sc.matches ? <div className="text-xs text-ink-2 mt-1 font-mono">{matchesTekst(sc.matches)}</div> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Rij label={tx('kyb_roepnaam_label', 'Roepnaam')}>{persoon.roepnaam || veld(account, 'roepnaam') || '-'}</Rij>
          <Rij label={tx('kyb_mobiel_label', 'Mobiel nummer')}>{persoon.telefoonMobiel || account.telefoon || '-'}</Rij>
          <Rij label={tx('kyb_email_label', 'E-mailadres')}>{account.email || '-'} {account.emailGeverifieerd ? <Pill klas="bg-success-50 text-success-700 border-success-100 ml-1">{tx('kyb_admin_geverifieerd', 'geverifieerd')}</Pill> : <Pill klas="bg-amber-50 text-amber-700 border-amber-200 ml-1">{tx('kyb_admin_niet_geverifieerd', 'niet geverifieerd')}</Pill>}</Rij>
          <Rij label={tx('kyb_adres_kop', 'Je woonadres').replace(/^Je /, '')}>{adresRegel(persoon.adres) !== '-' ? adresRegel(persoon.adres) : (account.adres ? adresRegel(account.adres) : '-')}</Rij>
          <Rij label={tx('kyb_pep_vraag', 'PEP').length > 40 ? 'PEP' : tx('kyb_pep_vraag', 'PEP')} afwijkend={Boolean(persoon.pep)}>{labels.jaNee(persoon.pep)}{persoon.pepToelichting ? ` - ${persoon.pepToelichting}` : ''}</Rij>
          <Rij label={tx('kyb_stap3_label', 'Toestel')}>{toestel.gekoppeld ? `${tx('kyb_toestel_al_gekoppeld', 'Dit toestel is al gekoppeld.')} ${toestel.apparaatNaam || ''}`.trim() : (toestel.overgeslagen ? tx('kyb_toestel_overslaan', 'Overslaan, later instellen') : '-')}{toestel.passkey ? ` · ${tx('kyb_biometrie_kop', 'Inloggen met gezicht of vingerafdruk')}` : ''}{account.passkeys ? ` · passkeys: ${account.passkeys}` : ''}</Rij>
        </div>
      </Sectie>

      {/* 3. Identiteit */}
      <Sectie
        titel={tx('kyb_admin_sectie_identiteit', 'Identiteit')}
        extra={(
          <div className="flex flex-wrap gap-1.5">
            {identiteitBron && <Pill>{labels.identiteitBron(identiteitBron)}</Pill>}
            {identiteitBron === 'idin' && <Pill klas="bg-amber-50 text-amber-700 border-amber-200">{tx('kyb_admin_geen_documentkopie', 'Geen documentkopie (iDIN)')}</Pill>}
            {kycStatus && <Pill klas={kycStatus === 'goedgekeurd' ? 'bg-success-50 text-success-700 border-success-100' : (kycStatus === 'in_behandeling' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-200')}>KYC: {kycStatus}</Pill>}
            {account.idinStatus && <Pill>iDIN: {account.idinStatus}</Pill>}
          </div>
        )}
      >
        {(identiteit.mismatch || risicoSignalen.includes('identiteit_mismatch')) && (
          <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{tx('kyb_admin_id_mismatch', 'Geboortedatum wijkt af van het identiteitsbewijs')}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 border-b border-border">
                <th className="py-2 pr-3 w-40"></th>
                <th className="py-2 pr-3">{tx('kyb_admin_opgegeven', 'Opgegeven')} ({labels.stap(2)})</th>
                <th className="py-2 pr-3">{tx('kyb_admin_id_snapshot', 'Identiteitsbewijs')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[
                [tx('kyb_admin_kol_naam', 'Naam'), volledigeNaam(persoon), snapshot ? volledigeNaam(snapshot) : null],
                [tx('kyb_geboortedatum_label', 'Geboortedatum'), persoon.geboortedatum, snapshot?.geboortedatum],
                [tx('kyb_nationaliteit_label', 'Nationaliteit'), persoon.nationaliteit, snapshot?.nationaliteit],
              ].map(([label, opgegeven, snap]) => {
                const afwijkend = snapshot ? wijktAf(opgegeven, snap) : false;
                return (
                  <tr key={label}>
                    <td className="py-2 pr-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500">{label}</td>
                    <td className={`py-2 pr-3 ${afwijkend ? 'text-red-700 font-semibold' : 'text-ink-1'}`}>{opgegeven || '-'}{afwijkend && <Pill klas="bg-red-100 text-red-700 border-red-200 ml-2">{afwijkLabel}</Pill>}</td>
                    <td className="py-2 pr-3 text-ink-2">{snapshot ? (snap || '-') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Rij label={tx('kyc_review_kol_doctype', 'Type')}>{identiteit.documentType || snapshot?.documentType || '-'}{snapshot?.documentNummerLaatste4 ? <span className="text-ink-3 font-mono"> · ****{snapshot.documentNummerLaatste4}</span> : null}</Rij>
          <Rij label={tx('kyc_review_ingediend_op', 'Ingediend op')}>{fmtDatum(identiteit.ingediendOp)}</Rij>
          <Rij label={tx('kyb_id_controle_bevestig', 'Bevestigd door klant')}>{fmtDatum(identiteitBlok.bevestigdOp)}</Rij>
          <Rij label={tx('kyb_admin_beelden', 'Beelden')}>
            {beelden.length === 0 || !kycRecordId ? <span className="text-ink-3">-</span> : beelden.map((type) => (
              <KybDocumentKnop key={type} pad={`/admin/kyc/${kycRecordId}/document/${type}`} label={tx(`kyc_upload_${type}_label`, type)} klein className="mr-2 mb-1" />
            ))}
          </Rij>
        </div>
        {magIdentiteitBeoordelen && (
          <div className="mt-4 border-t border-border pt-4 space-y-3">
            {idAfwijsOpen ? (
              <div className="space-y-2">
                <label htmlFor="kyb-id-opmerking" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2">{tx('kyc_review_reden_label', 'Reden van afkeuring (verplicht)')}</label>
                <textarea id="kyb-id-opmerking" value={idOpmerking} onChange={(e) => setIdOpmerking(e.target.value)} rows={2}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setIdAfwijsOpen(false); setIdOpmerking(''); }} disabled={Boolean(actieBezig)}
                    className="px-3 py-1.5 rounded-md bg-surface border border-border text-xs text-ink-1 hover:bg-surface-3 disabled:opacity-40">{tx('annuleren', 'Annuleren')}</button>
                  <button type="button" disabled={!idOpmerking.trim() || Boolean(actieBezig)}
                    onClick={() => actie('id-afwijzen', async () => {
                      await apiFetch(`/admin/kyc/${kycRecordId}/beoordeel`, { method: 'PATCH', body: { status: 'afgekeurd', opmerking: idOpmerking.trim() } });
                      setIdAfwijsOpen(false); setIdOpmerking('');
                    })}
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-xs text-white font-semibold disabled:opacity-40">
                    {tx('kyb_admin_id_afwijzen', 'Identiteit afwijzen')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 justify-end">
                <button type="button" onClick={() => setIdAfwijsOpen(true)} disabled={Boolean(actieBezig)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600/90 hover:bg-red-700 text-xs text-white font-semibold disabled:opacity-40">
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {tx('kyb_admin_id_afwijzen', 'Identiteit afwijzen')}
                </button>
                <button type="button" disabled={Boolean(actieBezig)}
                  onClick={() => actie('id-goedkeuren', () => apiFetch(`/admin/kyc/${kycRecordId}/beoordeel`, { method: 'PATCH', body: { status: 'goedgekeurd' } }))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success-600 hover:bg-success-700 text-xs text-white font-semibold disabled:opacity-40">
                  <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> {actieBezig === 'id-goedkeuren' ? tx('laden', 'Laden...') : tx('kyb_admin_id_goedkeuren', 'Identiteit goedkeuren')}
                </button>
              </div>
            )}
          </div>
        )}
      </Sectie>

      {/* 4. Gebruik en doel */}
      <Sectie titel={tx('kyb_admin_sectie_gebruik', 'Gebruik en doel')}>
        <Rij label={tx('kyb_tx_jaar_vraag', 'Overboekingen per jaar')}>{gebruik.txPerJaar ? labels.txPerJaar(gebruik.txPerJaar) : '-'}</Rij>
        <Rij label={tx('kyb_omvang_vraag', 'Gemiddelde overboeking')}>{gebruik.omvangPerTx ? labels.omvang(gebruik.omvangPerTx) : '-'}</Rij>
        <Rij label={tx('kyb_internationaal_vraag', 'Buitenland')}>{labels.jaNee(gebruik.internationaal)}{Array.isArray(gebruik.landen) && gebruik.landen.length ? ` - ${gebruik.landen.join(', ')}` : ''}</Rij>
        <Rij label={tx('kyb_volume_vraag', 'Volume eerste kwartaal')}>{gebruik.volumeKwartaal ? labels.volume(gebruik.volumeKwartaal) : '-'}</Rij>
        <Rij label={tx('kyb_herkomst_vraag', 'Herkomst middelen')}>{labels.herkomstLijst(gebruik.herkomstMiddelen)}{gebruik.herkomstToelichting ? ` - ${gebruik.herkomstToelichting}` : ''}</Rij>
      </Sectie>

      {/* 5. Aanvullend */}
      <Sectie titel={tx('kyb_admin_sectie_aanvullend', 'Aanvullend')}>
        <Rij label={tx('kyb_omzet_vraag', 'Jaaromzet')}>{aanvullend.jaaromzet ? labels.jaaromzet(aanvullend.jaaromzet) : '-'}</Rij>
        <Rij label={tx('kyb_deelnemingen_vraag', 'Deelnemingen')}>{labels.jaNee(aanvullend.deelnemingen)}{aanvullend.deelnemingenToelichting ? ` - ${aanvullend.deelnemingenToelichting}` : ''}</Rij>
        <Rij label={tx('kyb_buiten_nl_vraag', 'Actief buiten Nederland')}>{labels.jaNee(aanvullend.actiefBuitenNl)}{Array.isArray(aanvullend.actiefLanden) && aanvullend.actiefLanden.length ? ` - ${aanvullend.actiefLanden.join(', ')}` : ''}</Rij>
      </Sectie>

      {/* 6. Verklaringen */}
      <Sectie titel={tx('kyb_admin_sectie_toestemming', 'Verklaringen')}>
        {[
          ['verklaringJuistVolledig', tx('kyb_verklaring_juist', 'Gegevens juist en volledig')],
          ['verklaringBevoegd', tx('kyb_verklaring_bevoegd', 'Bevoegd namens het bedrijf')],
          ['acceptatiecriteriaAkkoord', tx('kyb_verklaring_acceptatie', 'Voldoet aan de acceptatiecriteria')],
          ['voorwaardenAkkoord', tx('kyb_verklaring_voorwaarden', 'Akkoord met voorwaarden en privacybeleid', { versie: toestemming.voorwaardenVersie || '-' })],
          ['medebestuurdersAkkoord', tx('kyb_verklaring_medebestuurders', 'Medebestuurders stemmen in')],
          ['productupdatesOptIn', tx('kyb_marketing_kop', 'Productupdates')],
        ].map(([k, label]) => (
          <Rij key={k} label={label.length > 60 ? `${label.slice(0, 57)}...` : label}>
            {toestemming[k] === true
              ? <span className="inline-flex items-center gap-1 text-success-700"><CheckCircle className="w-4 h-4" aria-hidden="true" />{labels.jaNee(true)}</span>
              : toestemming[k] === false ? <span className="text-ink-2">{labels.jaNee(false)}</span> : '-'}
          </Rij>
        ))}
        <Rij label={tx('kyb_admin_versies', 'Versies')}>AV {toestemming.voorwaardenVersie || '-'} · Privacy {toestemming.privacyVersie || '-'}</Rij>
        <Rij label={tx('kyb_admin_akkoord_op', 'Akkoord op')}>{fmtDatum(toestemming.akkoordOp)}</Rij>
        <Rij label="IP-hash">{toestemming.ipHash ? <span className="font-mono text-xs">{toestemming.ipHash}</span> : '-'}</Rij>
        <Rij label="User-agent">{toestemming.userAgent ? <span className="text-xs text-ink-2 break-all">{toestemming.userAgent}</span> : '-'}</Rij>
      </Sectie>

      {/* 7. Screening */}
      <Sectie
        titel={tx('kyb_admin_sectie_screening', 'Screening')}
        extra={(
          <button type="button" disabled={Boolean(actieBezig)}
            onClick={() => actie('herscreen', () => apiFetch(`/admin/kyb/${id}/herscreen`, { method: 'POST', body: {} }))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-xs text-ink-1 hover:bg-surface-3 disabled:opacity-50">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" /> {actieBezig === 'herscreen' ? tx('laden', 'Laden...') : tx('kyb_admin_herscreen', 'Opnieuw screenen')}
          </button>
        )}
      >
        {!screening ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">{tx('kyb_admin_screening_onbeschikbaar', 'Screening niet uitgevoerd')}</p>
        ) : (
          <div>
            <Rij label={tx('kyb_admin_screening_op', 'Uitgevoerd op')}>{fmtDatum(screening.op)}{screening.unavailable ? <Pill klas="bg-amber-50 text-amber-700 border-amber-200 ml-2">{tx('kyb_admin_screening_onbeschikbaar', 'Screening niet uitgevoerd')}</Pill> : null}</Rij>
            {[['bedrijf', tx('kyb_admin_kol_bedrijf', 'Bedrijf')], ['handelsnaam', tx('kyb_handelsnaam_label', 'Handelsnaam')]].map(([k, label]) => {
              const s = screening[k];
              if (!s) return null;
              return (
                <Rij key={k} label={label} afwijkend={Boolean(s.hit)} afwijkLabel={s.hit ? tx('kyb_admin_sanctie_hit', 'Sanctie-hit') : undefined}>
                  {s.hit ? (matchesTekst(s.matches) || tx('kyb_admin_sanctie_hit', 'Sanctie-hit')) : 'OK'}
                </Rij>
              );
            })}
            <Rij label={tx('kyb_admin_sectie_personen', 'Eigenaren en bestuurders')}>
              {personenScreening.length === 0 ? '-' : personenScreening.map((p) => {
                const u = ubos.find((x) => x.id === p.id);
                return (
                  <div key={p.id || p.rol} className="flex flex-wrap items-center gap-2 py-0.5">
                    <span>{u ? volledigeNaam(u) : (p.naam || p.rol || '-')}</span>
                    {p.unavailable ? <Pill klas="bg-amber-50 text-amber-700 border-amber-200">{tx('kyb_admin_screening_onbeschikbaar', 'Screening niet uitgevoerd')}</Pill>
                      : p.hit ? <Pill klas="bg-red-100 text-red-700 border-red-200">{tx('kyb_admin_sanctie_hit', 'Sanctie-hit')}</Pill>
                        : <Pill klas="bg-success-50 text-success-700 border-success-100">OK</Pill>}
                    {p.hit && p.matches ? <span className="text-xs font-mono text-ink-2">{matchesTekst(p.matches)}</span> : null}
                  </div>
                );
              })}
            </Rij>
          </div>
        )}
      </Sectie>

      {/* 8. Documenten */}
      <Sectie titel={tx('kyb_admin_sectie_documenten', 'Documenten')}>
        {documenten.length === 0 ? <p className="text-sm text-ink-3">-</p> : (
          <ul className="divide-y divide-border/60">
            {documenten.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <div className="text-ink-1">{labels.docSoort(d.soort)} <span className="text-ink-3">· {d.bestandsnaam || d.mime || '-'} · {fmtBytes(d.grootte)}</span></div>
                  <div className="text-xs text-ink-3">{fmtDatum(d.geuploadOp)}{d.verwijderdOp ? ` · ${tx('kyb_admin_verwijderd', 'verwijderd')} ${fmtDatum(d.verwijderdOp)}` : ''}</div>
                </div>
                {!d.verwijderdOp && <KybDocumentKnop pad={`/admin/kyb/${id}/document/${d.id}`} klein />}
              </li>
            ))}
          </ul>
        )}
      </Sectie>

      {/* 9. Historie */}
      <Sectie titel={tx('kyb_admin_sectie_historie', 'Historie')}>
        {infoVerzoek && (
          <div className="mb-4 border border-border rounded-md p-3 bg-surface-3/60 text-sm">
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">{tx('kyb_admin_info_vragen', 'Aanvullende informatie vragen')} · {fmtDatum(infoVerzoek.gevraagdOp)}</div>
            <p className="text-ink-1">{infoVerzoek.tekst || '-'}</p>
            <p className="text-xs text-ink-2 mt-1">{tx('kyb_admin_stappen_heropenen', 'Stappen')}: {labels.stappenLijst(infoVerzoek.stappen)}{Array.isArray(infoVerzoek.documentSoorten) && infoVerzoek.documentSoorten.length ? ` · ${labels.docSoortLijst(infoVerzoek.documentSoorten)}` : ''}</p>
            {(infoAntwoord || infoVerzoek.beantwoordOp) && (
              <div className="mt-2 border-l-2 border-brand-100 pl-3">
                <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500">{tx('kyb_info_antwoord_label', 'Je antwoord').replace(/^Je /, '')} · {fmtDatum(infoVerzoek.beantwoordOp || veld(aanvraag, 'infoAntwoordOp'))}</div>
                <p className="text-ink-1 whitespace-pre-wrap">{typeof infoAntwoord === 'string' ? infoAntwoord : (infoAntwoord?.antwoord || '-')}</p>
              </div>
            )}
          </div>
        )}
        {eerdere.length > 0 && (
          <div className="mb-4">
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">{tx('kyb_admin_eerdere', 'Eerdere pogingen')}</div>
            <ul className="text-sm divide-y divide-border/60">
              {eerdere.map((e) => (
                <li key={e.id} className="py-1.5 flex flex-wrap gap-2 items-center">
                  <span className="font-mono text-xs text-ink-3">v{e.versie}</span>
                  <Pill klas={STATUS_STIJL[e.status] || STATUS_STIJL.concept}>{labels.status(e.status)}</Pill>
                  <span className="text-xs text-ink-2">{fmtDatum(e.beoordeeldOp)}</span>
                  {e.besluitRedenCode && <span className="text-xs text-ink-2">{labels.reden(e.besluitRedenCode)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {historie.length === 0 ? <p className="text-sm text-ink-3">-</p> : (
          <ul className="text-sm divide-y divide-border/60">
            {historie.map((h, i) => (
              <li key={h.id || i} className="py-1.5 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-ink-2 tabular-nums w-36">{fmtDatum(h.aangemaaktOp || h.aangemaakt_op)}</span>
                <Pill>{h.actie}</Pill>
                {h.details && <span className="text-xs text-ink-3 font-mono break-all">{typeof h.details === 'string' ? h.details : JSON.stringify(h.details)}</span>}
              </li>
            ))}
          </ul>
        )}
      </Sectie>

      {/* Beoordeelpaneel */}
      <KybBeoordeelPaneel
        kybId={id}
        bedrijfsnaam={bedrijfsnaam}
        status={status}
        checklistInit={checklistInit}
        notitieInit={notitieInit}
        identiteitGoedgekeurd={identiteitGoedgekeurd}
        onGewijzigd={() => { laad(); onGewijzigd?.(); }}
      />
    </div>
  );
}
