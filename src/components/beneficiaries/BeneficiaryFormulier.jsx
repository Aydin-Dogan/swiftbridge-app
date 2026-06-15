/**
 * BeneficiaryFormulier.jsx — Modal voor toevoegen/bewerken van begunstigde
 * Velden: naam, bijnaam (optioneel), IBAN, bank (auto-prefilled obv land),
 * valuta dropdown, land dropdown. Glassmorphism + bevestiging.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { VALUTAS, getValuta } from '../../services/currencies';
import { LAND_INFO, bankenPerLand } from '../../services/turkstaligeBanken';
import Vlag from '../Vlag';
import { X } from '../icons/Icons';

// ── IBAN landcode mapping (eerste 2 chars) ──────────────────────────────────
const IBAN_LANDCODES = {
  NL: 'NL', BE: 'BE', DE: 'DE', FR: 'FR', GB: 'GB', AT: 'AT', ES: 'ES', IT: 'IT',
  TR: 'TR', AZ: 'AZ', KZ: 'KZ', UZ: 'UZ', TM: 'TM', KG: 'KG', TJ: 'TJ',
};

// Lichtgewicht IBAN validatie (formaat + mod-97 check)
const IBAN_LENGTES = {
  TR: 26, NL: 18, DE: 22, BE: 16, FR: 27, GB: 22, AT: 20, ES: 24, IT: 27,
  AZ: 28, KZ: 20, UZ: 30, TM: 30, KG: 20,
};

function valideerIban(iban) {
  const schoon = (iban || '').replace(/\s/g, '').toUpperCase();
  if (schoon.length < 4) return { geldig: false, fout: 'IBAN te kort' };
  const land = schoon.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(land)) return { geldig: false, fout: 'Ongeldige landcode' };
  const verwacht = IBAN_LENGTES[land];
  if (verwacht && schoon.length !== verwacht) {
    return { geldig: false, fout: `${land} IBAN: ${verwacht} tekens (nu ${schoon.length})` };
  }
  const her = schoon.slice(4) + schoon.slice(0, 4);
  const num = her.split('').map(c => {
    const code = c.charCodeAt(0);
    return code >= 65 ? (code - 55).toString() : c;
  }).join('');
  let rest = 0;
  for (const cij of num) rest = (rest * 10 + parseInt(cij, 10)) % 97;
  if (rest !== 1) return { geldig: false, fout: 'Ongeldige IBAN checksum' };
  return { geldig: true, fout: null };
}

const LANDEN = [
  { code: 'TR', naam: 'Türkiye', valuta: 'TRY' },
  { code: 'AZ', naam: 'Azerbeidzjan', valuta: 'AZN' },
  { code: 'KZ', naam: 'Kazachstan', valuta: 'KZT' },
  { code: 'UZ', naam: 'Oezbekistan', valuta: 'UZS' },
  { code: 'TM', naam: 'Turkmenistan', valuta: 'TMT' },
  { code: 'KG', naam: 'Kirgizië', valuta: 'KGS' },
  { code: 'NL', naam: 'Nederland', valuta: 'EUR' },
  { code: 'BE', naam: 'België', valuta: 'EUR' },
  { code: 'DE', naam: 'Duitsland', valuta: 'EUR' },
  { code: 'FR', naam: 'Frankrijk', valuta: 'EUR' },
  { code: 'GB', naam: 'VK', valuta: 'GBP' },
];

export default function BeneficiaryFormulier({ open, initial, bezig, fout, onAnnuleer, onOpslaan }) {
  const { t } = useTaal();
  const [form, setForm] = useState({
    naam: '',
    bijnaam: '',
    iban: '',
    bank: '',
    valuta: 'TRY',
    land: 'TR',
  });
  const [ibanCheck, setIbanCheck] = useState(null);
  const [lokaleFout, setLokaleFout] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        naam: initial.naam || '',
        bijnaam: initial.bijnaam || initial.label || '',
        iban: initial.iban || '',
        bank: initial.bank || '',
        valuta: initial.valuta || 'TRY',
        land: initial.land || 'TR',
      });
    } else {
      setForm({ naam: '', bijnaam: '', iban: '', bank: '', valuta: 'TRY', land: 'TR' });
    }
    setLokaleFout('');
  }, [initial, open]);

  // Banken voor het gekozen land (uit turkstaligeBanken; voor andere landen leeg)
  const beschikbareBanken = useMemo(() => {
    if (LAND_INFO[form.land]) {
      return bankenPerLand(form.land).filter(b => b.categorie !== 'wallet');
    }
    return [];
  }, [form.land]);

  // Bij wijzigen van land: auto-prefill valuta + eerste bank
  function kiesLand(landCode) {
    const landInfo = LANDEN.find(l => l.code === landCode);
    setForm(f => {
      const nieuw = { ...f, land: landCode };
      if (landInfo?.valuta) nieuw.valuta = landInfo.valuta;
      // Auto-pick eerste bank uit lijst als beschikbaar
      if (LAND_INFO[landCode]) {
        const banken = bankenPerLand(landCode).filter(b => b.categorie !== 'wallet');
        if (banken.length && !banken.find(b => b.naam === f.bank)) {
          nieuw.bank = banken[0].naam;
        }
      }
      return nieuw;
    });
  }

  function update(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'iban') {
      const schoon = (v || '').replace(/\s/g, '').toUpperCase();
      setIbanCheck(schoon.length > 4 ? valideerIban(schoon) : null);
      // Auto-detect land uit IBAN prefix
      if (schoon.length >= 2) {
        const detected = IBAN_LANDCODES[schoon.slice(0, 2)];
        if (detected && detected !== form.land) {
          kiesLand(detected);
        }
      }
    }
  }

  function indien() {
    setLokaleFout('');
    if (!form.naam.trim()) { setLokaleFout(t('benef_fout_naam_vereist')); return; }
    const c = valideerIban(form.iban);
    if (!c.geldig) { setLokaleFout(c.fout); return; }
    onOpslaan({
      ...form,
      naam: form.naam.trim(),
      bijnaam: form.bijnaam.trim() || null,
      iban: form.iban.replace(/\s/g, '').toUpperCase(),
    });
  }

  if (!open) return null;

  const valutaInfo = getValuta(form.valuta);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-md w-full max-w-md shadow-soft-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
          <h3 className="font-display font-medium text-ink-1">
            {initial ? t('benef_bewerk_titel') : t('benef_toevoeg_titel')}
          </h3>
          <button onClick={onAnnuleer} className="text-ink-3 hover:text-ink-1" aria-label={t('sluiten')}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-3">
          {/* Naam */}
          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1">{t('benef_naam')} *</label>
            <input
              value={form.naam}
              onChange={e => update('naam', e.target.value)}
              placeholder="Mehmet Yilmaz"
              maxLength={100}
              className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Bijnaam */}
          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1">{t('benef_bijnaam')}</label>
            <input
              value={form.bijnaam}
              onChange={e => update('bijnaam', e.target.value)}
              placeholder={t('benef_bijnaam_placeholder')}
              maxLength={40}
              className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Land */}
          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1">{t('benef_land')}</label>
            <div className="flex items-center gap-2">
              <Vlag land={form.land} size={24} />
              <select
                value={form.land}
                onChange={e => kiesLand(e.target.value)}
                className="flex-1 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {LANDEN.map(l => (
                  <option key={l.code} value={l.code}>{l.naam} ({l.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Valuta */}
          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1">{t('benef_valuta')}</label>
            <div className="flex items-center gap-2">
              <Vlag land={valutaInfo.landCode} size={24} />
              <select
                value={form.valuta}
                onChange={e => update('valuta', e.target.value)}
                className="flex-1 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {VALUTAS.map(v => (
                  <option key={v.code} value={v.code}>{v.naam} ({v.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bank */}
          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1">{t('benef_bank')}</label>
            {beschikbareBanken.length > 0 ? (
              <select
                value={form.bank}
                onChange={e => update('bank', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">— {t('benef_bank_kies')} —</option>
                {beschikbareBanken.map(b => (
                  <option key={b.id} value={b.naam}>{b.naam}</option>
                ))}
              </select>
            ) : (
              <input
                value={form.bank}
                onChange={e => update('bank', e.target.value)}
                placeholder={t('benef_bank_placeholder')}
                maxLength={80}
                className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            )}
          </div>

          {/* IBAN */}
          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1">{t('benef_iban')} *</label>
            <input
              value={form.iban}
              onChange={e => update('iban', e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="TR330006100519786457841326"
              className={`w-full border rounded-md px-3 py-2 outline-none font-mono text-sm transition ${
                !form.iban ? 'border-border' :
                ibanCheck?.geldig ? 'border-success-500 bg-success-50' : 'border-red-300 bg-red-50'
              }`}
            />
            {form.iban && ibanCheck && (
              <p className={`text-xs mt-1 ${ibanCheck.geldig ? 'text-success-600' : 'text-red-500'}`}>
                {ibanCheck.geldig ? `${t('benef_iban_geldig')}` : `${ibanCheck.fout}`}
              </p>
            )}
          </div>

          {(fout || lokaleFout) && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-md px-3 py-2 text-sm">
              {fout || lokaleFout}
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-border sticky bottom-0 bg-surface">
          <button
            onClick={onAnnuleer}
            disabled={bezig}
            className="flex-1 border border-border text-ink-2 font-semibold py-2 rounded-md hover:bg-surface-2 transition"
          >
            {t('annuleren')}
          </button>
          <button
            onClick={indien}
            disabled={bezig}
            className="flex-1 btn-inst py-3 disabled:opacity-60"
          >
            {bezig ? `${t('laden')}` : `${t('opslaan')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
