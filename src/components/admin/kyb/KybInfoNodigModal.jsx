/**
 * KybInfoNodigModal.jsx — Modal "Aanvullende informatie vragen" (besluit info_nodig).
 *
 * Verplicht (contract 2.6): bericht aan de klant van minimaal 10 tekens en minimaal één stap (1-7)
 * die de klant mag heropenen. Optioneel: gevraagde documentsoorten.
 *
 * Props:
 *   open        — boolean
 *   onClose     — sluiten zonder versturen
 *   onVerstuur  — ({ berichtKlant, stappen, documentSoorten }) => Promise|void
 *   bezig       — verzenden loopt
 *   fout        — servermelding (string)
 */
import { useEffect, useState } from 'react';
import { X } from '../../icons/Icons';
import { useTx, useKybLabels, AANTAL_STAPPEN, DOC_SOORTEN } from './kybAdminLabels';

const MIN_BERICHT = 10;

export default function KybInfoNodigModal({ open, onClose, onVerstuur, bezig = false, fout = '' }) {
  const tx = useTx();
  const labels = useKybLabels();
  const [bericht, setBericht] = useState('');
  const [stappen, setStappen] = useState([]);
  const [documentSoorten, setDocumentSoorten] = useState([]);

  // Leeg formulier bij elke keer openen (state afleiden van de prop tijdens render, geen effect).
  const [vorigeOpen, setVorigeOpen] = useState(open);
  if (open !== vorigeOpen) {
    setVorigeOpen(open);
    if (open) { setBericht(''); setStappen([]); setDocumentSoorten([]); }
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !bezig) onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, bezig, onClose]);

  if (!open) return null;

  const geldig = bericht.trim().length >= MIN_BERICHT && stappen.length >= 1;

  function wissel(lijst, zet, waarde) {
    zet(lijst.includes(waarde) ? lijst.filter((x) => x !== waarde) : [...lijst, waarde].sort());
  }

  function verstuur(e) {
    e.preventDefault();
    if (!geldig || bezig) return;
    onVerstuur?.({ berichtKlant: bericht.trim(), stappen: [...stappen].sort((a, b) => a - b), documentSoorten });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyb-info-titel"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !bezig) onClose?.(); }}
    >
      <form onSubmit={verstuur} className="bg-surface border border-border rounded-md p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-soft-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 id="kyb-info-titel" className="font-display text-lg font-medium text-ink-1">
            {tx('kyb_admin_info_vragen', 'Aanvullende informatie vragen')}
          </h3>
          <button type="button" onClick={onClose} disabled={bezig} className="text-gray-500 hover:text-ink-1" aria-label={tx('sluiten', 'Sluiten')}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <label htmlFor="kyb-info-bericht" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-1">
          {tx('kyb_admin_bericht_klant', 'Bericht aan de klant')}
        </label>
        <textarea
          id="kyb-info-bericht"
          value={bericht}
          onChange={(e) => setBericht(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
        />
        <p className="text-[11px] text-ink-3 mt-1 mb-4">
          {bericht.trim().length}/{MIN_BERICHT} (min.) - {tx('kyb_admin_bericht_klant_hint', 'Dit bericht ziet de klant letterlijk in de app en in de e-mail.')}
        </p>

        <fieldset className="mb-4">
          <legend className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-2">
            {tx('kyb_admin_stappen_heropenen', 'Welke stappen mag de klant aanpassen?')}
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: AANTAL_STAPPEN }, (_, i) => i + 1).map((nr) => (
              <label key={nr} className="flex items-center gap-2 text-sm text-ink-1 border border-border rounded-md px-3 py-2 cursor-pointer hover:bg-surface-3">
                <input
                  type="checkbox"
                  checked={stappen.includes(nr)}
                  onChange={() => wissel(stappen, setStappen, nr)}
                  className="accent-brand-600"
                />
                <span>{nr}. {labels.stap(nr)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-2">
            {tx('kyb_admin_documenten_vragen', 'Gevraagde documenten')}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOC_SOORTEN.filter((s) => s !== 'info_antwoord').map((soort) => (
              <label key={soort} className="flex items-center gap-2 text-sm text-ink-1 border border-border rounded-md px-3 py-2 cursor-pointer hover:bg-surface-3">
                <input
                  type="checkbox"
                  checked={documentSoorten.includes(soort)}
                  onChange={() => wissel(documentSoorten, setDocumentSoorten, soort)}
                  className="accent-brand-600"
                />
                <span>{labels.docSoort(soort)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {fout && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-3">{fout}</div>}

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button type="button" onClick={onClose} disabled={bezig} className="px-4 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 hover:bg-surface-3 disabled:opacity-40">
            {tx('annuleren', 'Annuleren')}
          </button>
          <button type="submit" disabled={!geldig || bezig} className="btn-inst px-5 py-2.5 disabled:opacity-40">
            {bezig ? tx('laden', 'Laden...') : tx('kyb_admin_info_vragen', 'Aanvullende informatie vragen')}
          </button>
        </div>
      </form>
    </div>
  );
}
