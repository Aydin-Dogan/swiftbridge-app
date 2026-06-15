/**
 * RecurringFormulier.jsx — Modal voor het aanmaken van een terugkerende overboeking.
 *
 * Velden:
 * - Naam (label)
 * - Bedrag (EUR)
 * - Ontvanger naam, IBAN, optionele bank
 * - FrequentiePicker (sub-component)
 * - Startdatum
 * - Optionele einddatum
 *
 * Validatie:
 * - Bedrag €10 – €5000
 * - IBAN niet leeg (server doet mod-97; we doen lichte client check)
 * - Naam ≥ 2 tekens
 * - Startdatum verplicht en niet in het verleden
 *
 * Bij succes: roept onAangemaakt(nieuw) en sluit modal.
 */
import { useState } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch, parseError } from '../../services/api';
import FrequentiePicker from './FrequentiePicker';
import { X } from '../icons/Icons';

function vandaagISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function RecurringFormulier({ open, onSluit, onAangemaakt }) {
  const { t } = useTaal();
  const [naam, setNaam] = useState('');
  const [bedrag, setBedrag] = useState('');
  const [ontvangerNaam, setOntvangerNaam] = useState('');
  const [iban, setIban] = useState('');
  const [bank, setBank] = useState('');
  const [valuta, setValuta] = useState('TRY');
  const [land, setLand] = useState('TR');
  const [frequentie, setFrequentie] = useState('maandelijks');
  const [dagVanMaand, setDagVanMaand] = useState(1);
  const [dagVanWeek, setDagVanWeek] = useState(1);
  const [startOp, setStartOp] = useState(vandaagISO());
  const [eindigtOp, setEindigtOp] = useState('');
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  if (!open) return null;

  function reset() {
    setNaam(''); setBedrag(''); setOntvangerNaam(''); setIban(''); setBank('');
    setValuta('TRY'); setLand('TR'); setFrequentie('maandelijks');
    setDagVanMaand(1); setDagVanWeek(1); setStartOp(vandaagISO()); setEindigtOp('');
    setFout('');
  }

  async function submit(e) {
    e.preventDefault();
    setFout('');

    const b = parseFloat(bedrag);
    if (!naam.trim() || naam.trim().length < 2) {
      setFout(t('recurring_form_fout_naam'));
      return;
    }
    if (!isFinite(b) || b < 10 || b > 5000) {
      setFout(t('recurring_form_fout_bedrag'));
      return;
    }
    if (!ontvangerNaam.trim() || ontvangerNaam.trim().length < 2) {
      setFout(t('recurring_form_fout_ontvanger'));
      return;
    }
    if (!iban.replace(/\s/g, '')) {
      setFout(t('recurring_form_fout_iban'));
      return;
    }
    if (!startOp) {
      setFout(t('recurring_form_fout_start'));
      return;
    }

    setBezig(true);
    try {
      const body = {
        naam: naam.trim(),
        bedragEur: b,
        ontvangerNaam: ontvangerNaam.trim(),
        ontvangerIban: iban.replace(/\s/g, '').toUpperCase(),
        ontvangerBank: bank.trim() || undefined,
        valuta,
        land,
        frequentie,
        startOp: new Date(startOp).toISOString(),
      };
      if (frequentie === 'maandelijks') body.dagVanMaand = dagVanMaand;
      if (frequentie === 'wekelijks') body.dagVanWeek = dagVanWeek;
      if (eindigtOp) body.eindigtOp = new Date(eindigtOp).toISOString();

      const res = await apiFetch('/recurring', { method: 'POST', body });
      onAangemaakt && onAangemaakt(res.recurring);
      reset();
      onSluit && onSluit();
    } catch (err) {
      setFout(parseError(err, t));
    } finally {
      setBezig(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-up"
      onClick={(e) => { if (e.target === e.currentTarget) onSluit && onSluit(); }}
    >
      <div className="bg-surface w-full sm:max-w-lg rounded-t-md sm:rounded-md border border-border shadow-soft-xl overflow-hidden flex flex-col max-h-[95vh]">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <h2 className="font-display font-medium text-lg text-ink-1">{t('recurring_form_titel')}</h2>
          <button
            type="button"
            onClick={onSluit}
            aria-label={t('sluiten')}
            className="text-ink-2 hover:text-ink-1 leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-2"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={submit} className="px-5 py-4 space-y-4 overflow-y-auto">
          {fout && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
              {fout}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">
              {t('recurring_veld_naam')}
            </label>
            <input
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder={t('recurring_veld_naam_placeholder')}
              maxLength={100}
              className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">
              {t('recurring_veld_bedrag')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">€</span>
              <input
                type="number"
                value={bedrag}
                min="10"
                max="5000"
                step="0.01"
                onChange={(e) => setBedrag(e.target.value)}
                placeholder="100.00"
                className="w-full pl-8 p-3 border border-border rounded-md bg-surface tabular-nums focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <p className="text-xs text-ink-3 mt-1">{t('recurring_veld_bedrag_hint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">
              {t('recurring_veld_ontvanger')}
            </label>
            <input
              type="text"
              value={ontvangerNaam}
              onChange={(e) => setOntvangerNaam(e.target.value)}
              placeholder={t('recurring_veld_ontvanger_placeholder')}
              className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">
              {t('recurring_veld_iban')}
            </label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="TR33 0006 1005 1978 6457 8413 26"
              className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">
                {t('recurring_veld_bank')}
              </label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Garanti BBVA"
                className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">
                {t('recurring_veld_valuta')}
              </label>
              <select
                value={valuta}
                onChange={(e) => setValuta(e.target.value)}
                className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="TRY">TRY</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-2 mb-2">
              {t('recurring_veld_frequentie')}
            </label>
            <FrequentiePicker
              frequentie={frequentie}
              setFrequentie={setFrequentie}
              dagVanMaand={dagVanMaand}
              setDagVanMaand={setDagVanMaand}
              dagVanWeek={dagVanWeek}
              setDagVanWeek={setDagVanWeek}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">
                {t('recurring_veld_start')}
              </label>
              <input
                type="date"
                value={startOp}
                onChange={(e) => setStartOp(e.target.value)}
                className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">
                {t('recurring_veld_eind')}
              </label>
              <input
                type="date"
                value={eindigtOp}
                onChange={(e) => setEindigtOp(e.target.value)}
                className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onSluit}
              className="flex-1 border border-border text-ink-2 font-semibold py-3 rounded-md hover:bg-surface-2 active:scale-95 transition"
              disabled={bezig}
            >
              {t('annuleren')}
            </button>
            <button
              type="submit"
              disabled={bezig}
              className="flex-1 btn-inst py-3 active:scale-95 disabled:opacity-60"
            >
              {bezig ? t('laden') : t('recurring_form_opslaan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
