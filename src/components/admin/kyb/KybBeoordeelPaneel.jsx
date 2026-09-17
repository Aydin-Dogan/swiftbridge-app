/**
 * KybBeoordeelPaneel.jsx — Besluitpaneel voor een zakelijke aanvraag (alleen in ingediend/in_behandeling).
 *
 * Inhoud (contract sectie 6 + 2.6):
 *   - checklist met 6 controlepunten (verplicht voor goedkeuren)
 *   - interne notitie (POST /admin/kyb/:id/notitie, nooit zichtbaar voor de klant)
 *   - Aanvullende informatie vragen  -> KybInfoNodigModal -> besluit info_nodig
 *   - Afwijzen                       -> reden-code + tipping-off-waarschuwing + ConfirmDialog (destructive)
 *   - Goedkeuren                     -> disabled tot checklist compleet EN identiteit goedgekeurd; ConfirmDialog met bedrijfsnaam
 *
 * Alle besluiten gaan naar POST /admin/kyb/:id/beoordeel met body kybBeoordeel
 * { besluit, redenCode, berichtKlant, notitie, checklist, stappen, documentSoorten }.
 *
 * Props:
 *   kybId, bedrijfsnaam, status
 *   checklistInit         — reeds afgevinkte punten (beoordeling_checklist)
 *   notitieInit           — bestaande interne notitie
 *   identiteitGoedgekeurd — kyc_status goedgekeurd of idin geverifieerd (uit het dossier)
 *   onGewijzigd           — callback na een geslaagd besluit of notitie ({ status })
 */
import { useState } from 'react';
import { apiFetch, parseError } from '../../../services/api';
import { useTaal } from '../../../i18n';
import ConfirmDialog from '../../ConfirmDialog';
import { AlertTriangle, CheckCircle, XCircle, Info } from '../../icons/Icons';
import KybInfoNodigModal from './KybInfoNodigModal';
import { useTx, useKybLabels, CHECKLIST, REDEN_CODES, GENERIEKE_REDEN_CODES } from './kybAdminLabels';

const OPEN_STATUSSEN = ['ingediend', 'in_behandeling'];

export default function KybBeoordeelPaneel({
  kybId, bedrijfsnaam, status, checklistInit = [], notitieInit = '', identiteitGoedgekeurd = false, onGewijzigd,
}) {
  const { t } = useTaal();
  const tx = useTx();
  const labels = useKybLabels();

  const [checklist, setChecklist] = useState(Array.isArray(checklistInit) ? checklistInit : []);
  const [notitie, setNotitie] = useState('');
  const [notitieBezig, setNotitieBezig] = useState(false);
  const [notitieMelding, setNotitieMelding] = useState('');
  const [afwijsModus, setAfwijsModus] = useState(false);
  const [redenCode, setRedenCode] = useState('');
  const [berichtKlant, setBerichtKlant] = useState('');
  const [bevestig, setBevestig] = useState(null); // 'goedkeuren' | 'afwijzen' | null
  const [infoOpen, setInfoOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  // Sync alleen als de INHOUD van de server-checklist verandert (een nieuwe lege array per render
  // zou anders een render-lus veroorzaken). Patroon "state afleiden van props tijdens render":
  // geen effect nodig, dus ook geen extra render-ronde.
  const checklistInitKey = JSON.stringify(Array.isArray(checklistInit) ? checklistInit : []);
  const [vorigeChecklistKey, setVorigeChecklistKey] = useState(checklistInitKey);
  if (vorigeChecklistKey !== checklistInitKey) {
    setVorigeChecklistKey(checklistInitKey);
    setChecklist(JSON.parse(checklistInitKey));
  }

  if (!OPEN_STATUSSEN.includes(status)) return null;

  const checklistCompleet = CHECKLIST.every((c) => checklist.includes(c));
  const magGoedkeuren = checklistCompleet && identiteitGoedgekeurd && !bezig;
  const generiek = GENERIEKE_REDEN_CODES.includes(redenCode);

  function wisselCheck(code) {
    setChecklist((huidig) => (huidig.includes(code) ? huidig.filter((c) => c !== code) : [...huidig, code]));
  }

  async function slaNotitieOp() {
    if (!notitie.trim()) return;
    setNotitieBezig(true); setNotitieMelding('');
    try {
      await apiFetch(`/admin/kyb/${kybId}/notitie`, { method: 'POST', body: { notitie: notitie.trim() } });
      setNotitie('');
      setNotitieMelding(tx('kyb_admin_notitie_opgeslagen', 'Notitie opgeslagen.'));
      onGewijzigd?.({ status });
    } catch (e) {
      setNotitieMelding(parseError(e, t));
    } finally {
      setNotitieBezig(false);
    }
  }

  async function beoordeel(body) {
    setBezig(true); setFout('');
    try {
      const res = await apiFetch(`/admin/kyb/${kybId}/beoordeel`, { method: 'POST', body: { ...body, checklist } });
      setBevestig(null); setInfoOpen(false); setAfwijsModus(false);
      onGewijzigd?.(res || { status: body.besluit });
      return true;
    } catch (e) {
      setFout(parseError(e, t));
      setBevestig(null);
      return false;
    } finally {
      setBezig(false);
    }
  }

  return (
    <section aria-labelledby="kyb-beoordeel-kop" className="bg-surface border border-border rounded-md p-5 shadow-soft space-y-5">
      <h3 id="kyb-beoordeel-kop" className="font-display text-lg font-medium text-ink-1">
        {tx('kyb_admin_checklist_kop', 'Controlepunten (verplicht voor goedkeuren)')}
      </h3>

      {/* Checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CHECKLIST.map((code) => (
          <li key={code}>
            <label className="flex items-start gap-2 text-sm text-ink-1 border border-border rounded-md px-3 py-2 cursor-pointer hover:bg-surface-3">
              <input
                type="checkbox"
                checked={checklist.includes(code)}
                onChange={() => wisselCheck(code)}
                disabled={bezig}
                className="mt-0.5 accent-brand-600"
              />
              <span>{labels.checklist(code)}</span>
            </label>
          </li>
        ))}
      </ul>
      {!identiteitGoedgekeurd && (
        <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{tx('errors.KYB_KYC_VEREIST', 'Keur eerst de identiteit van de aanvrager goed.')}</span>
        </p>
      )}

      {/* Interne notitie */}
      <div>
        <label htmlFor="kyb-notitie" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-1">
          {tx('kyb_admin_notitie', 'Interne notitie (nooit zichtbaar voor de klant)')}
        </label>
        <textarea
          id="kyb-notitie"
          value={notitie}
          onChange={(e) => setNotitie(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={slaNotitieOp}
            disabled={notitieBezig || !notitie.trim()}
            className="px-3 py-1.5 rounded-md bg-surface border border-border text-sm text-ink-1 hover:bg-surface-3 disabled:opacity-40"
          >
            {notitieBezig ? tx('laden', 'Laden...') : tx('kyb_admin_notitie_opslaan', 'Notitie opslaan')}
          </button>
          {notitieMelding && <span className="text-xs text-ink-2">{notitieMelding}</span>}
        </div>
        {notitieInit && (
          <pre className="mt-2 text-xs text-ink-2 bg-surface-3 border border-border rounded-md p-3 whitespace-pre-wrap font-sans">{notitieInit}</pre>
        )}
      </div>

      {fout && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>}

      {/* Afwijzen: reden-code + tipping-off */}
      {afwijsModus && (
        <div className="border border-red-200 bg-red-50/60 rounded-md p-4 space-y-3">
          <label htmlFor="kyb-reden" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2">
            {tx('kyb_admin_reden', 'Reden')}
          </label>
          <select
            id="kyb-reden"
            value={redenCode}
            onChange={(e) => setRedenCode(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          >
            <option value="">-</option>
            {REDEN_CODES.map((code) => (
              <option key={code} value={code}>{labels.reden(code)}</option>
            ))}
          </select>
          <p className="flex items-start gap-2 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{tx('kyb_admin_tipping_off', 'Let op: bij sanctie-, PEP- of risicoredenen ontvangt de klant uitsluitend de generieke tekst (Wwft art. 23). Overweeg een FIU- of DNB-melding via de compliance-procedure.')}</span>
          </p>
          {redenCode && !generiek && (
            <div>
              <label htmlFor="kyb-bericht-afwijzen" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-1">
                {tx('kyb_admin_bericht_klant', 'Bericht aan de klant')}
              </label>
              <textarea
                id="kyb-bericht-afwijzen"
                value={berichtKlant}
                onChange={(e) => setBerichtKlant(e.target.value)}
                rows={2}
                maxLength={1000}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setAfwijsModus(false); setRedenCode(''); setBerichtKlant(''); }} disabled={bezig}
              className="px-4 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 hover:bg-surface-3 disabled:opacity-40">
              {tx('annuleren', 'Annuleren')}
            </button>
            <button type="button" onClick={() => setBevestig('afwijzen')} disabled={!redenCode || bezig}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-sm text-white font-semibold disabled:opacity-40 inline-flex items-center gap-1.5">
              <XCircle className="w-4 h-4" aria-hidden="true" /> {tx('kyb_admin_afwijzen', 'Afwijzen')}
            </button>
          </div>
        </div>
      )}

      {/* Actieknoppen */}
      {!afwijsModus && (
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={() => setInfoOpen(true)} disabled={bezig}
            className="px-4 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 hover:bg-surface-3 disabled:opacity-40">
            {tx('kyb_admin_info_vragen', 'Aanvullende informatie vragen')}
          </button>
          <button type="button" onClick={() => setAfwijsModus(true)} disabled={bezig}
            className="px-4 py-2 rounded-md bg-red-600/90 hover:bg-red-700 text-sm text-white font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-1.5">
            <XCircle className="w-4 h-4" aria-hidden="true" /> {tx('kyb_admin_afwijzen', 'Afwijzen')}
          </button>
          <button type="button" onClick={() => setBevestig('goedkeuren')} disabled={!magGoedkeuren}
            title={!checklistCompleet ? tx('errors.KYB_CHECKLIST_ONVOLLEDIG', 'Vink eerst alle controlepunten af.') : (!identiteitGoedgekeurd ? tx('errors.KYB_KYC_VEREIST', 'Keur eerst de identiteit van de aanvrager goed.') : undefined)}
            className="px-4 py-2 rounded-md bg-success-600 hover:bg-success-700 text-sm text-white font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4" aria-hidden="true" /> {tx('kyb_admin_goedkeuren', 'Goedkeuren')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={bevestig === 'goedkeuren'}
        onClose={() => setBevestig(null)}
        onConfirm={() => beoordeel({ besluit: 'goedgekeurd' })}
        title={tx('kyb_admin_goedkeuren', 'Goedkeuren')}
        message={tx('kyb_admin_bevestig_goedkeuren', 'Weet je zeker dat je {bedrijf} wilt goedkeuren? De klant kan daarna zakelijk overboeken.', { bedrijf: bedrijfsnaam || '-' })}
        confirmLabel={tx('kyb_admin_goedkeuren', 'Goedkeuren')}
        busy={bezig}
      />
      <ConfirmDialog
        open={bevestig === 'afwijzen'}
        onClose={() => setBevestig(null)}
        onConfirm={() => beoordeel({ besluit: 'afgewezen', redenCode, ...(berichtKlant.trim() && !generiek ? { berichtKlant: berichtKlant.trim() } : {}) })}
        title={tx('kyb_admin_afwijzen', 'Afwijzen')}
        message={tx('kyb_admin_bevestig_afwijzen', 'Weet je zeker dat je deze aanvraag wilt afwijzen? Dit is definitief.')}
        confirmLabel={tx('kyb_admin_afwijzen', 'Afwijzen')}
        variant="destructive"
        busy={bezig}
      />
      <KybInfoNodigModal
        open={infoOpen}
        onClose={() => { if (!bezig) { setInfoOpen(false); setFout(''); } }}
        onVerstuur={({ berichtKlant: bericht, stappen, documentSoorten }) => beoordeel({ besluit: 'info_nodig', berichtKlant: bericht, stappen, documentSoorten })}
        bezig={bezig}
        fout={infoOpen ? fout : ''}
      />
    </section>
  );
}
