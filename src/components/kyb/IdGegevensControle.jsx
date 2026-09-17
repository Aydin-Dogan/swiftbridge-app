/**
 * IdGegevensControle.jsx — de klant controleert (en corrigeert) de gegevens
 * die precies moeten overeenkomen met het identiteitsbewijs, en bevestigt.
 * Resultaat is de body van PUT /kyb/aanvraag/stap/5.
 *
 * Props: begin { voornamen, tussenvoegsel, achternaam, geboortedatum, nationaliteit },
 *        onBevestig(body), bezig
 */
import { useState } from 'react';
import { useTaal } from '../../i18n';
import { LANDEN } from '../kyc/landen';
import { VeldGroep } from '../ui';

export default function IdGegevensControle({ begin = {}, onBevestig, bezig = false }) {
  const { t } = useTaal();
  const [v, setV] = useState({
    voornamen: begin.voornamen || '',
    tussenvoegsel: begin.tussenvoegsel || '',
    achternaam: begin.achternaam || '',
    geboortedatum: begin.geboortedatum || '',
    nationaliteit: begin.nationaliteit || '',
  });
  const [akkoord, setAkkoord] = useState(false);
  const zet = (patch) => setV((x) => ({ ...x, ...patch }));

  const geldig = v.voornamen.trim() && v.achternaam.trim()
    && /^\d{4}-\d{2}-\d{2}$/.test(v.geboortedatum) && /^[A-Z]{2}$/.test(v.nationaliteit) && akkoord;

  function bevestig() {
    if (!geldig) return;
    const body = {
      bevestigd: true,
      voornamen: v.voornamen.trim(),
      achternaam: v.achternaam.trim(),
      geboortedatum: v.geboortedatum,
      nationaliteit: v.nationaliteit,
    };
    if (v.tussenvoegsel.trim()) body.tussenvoegsel = v.tussenvoegsel.trim();
    onBevestig?.(body);
  }

  return (
    <div className="space-y-4" role="group" aria-label={t('kyb_id_controle_kop')}>
      <div>
        <h3 className="font-display text-lg text-ink-1">{t('kyb_id_controle_kop')}</h3>
        <p className="text-xs text-ink-2 mt-1">{t('kyb_id_controle_uitleg')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <VeldGroep className="sm:col-span-2" label={t('kyb_voornamen_label')} value={v.voornamen}
          onChange={(e) => zet({ voornamen: e.target.value })} maxLength={100} verplicht />
        <VeldGroep label={t('kyb_tussenvoegsel_label')} value={v.tussenvoegsel}
          onChange={(e) => zet({ tussenvoegsel: e.target.value })} maxLength={20} />
      </div>
      <VeldGroep label={t('kyb_achternaam_label')} value={v.achternaam}
        onChange={(e) => zet({ achternaam: e.target.value })} maxLength={100} verplicht />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <VeldGroep label={t('kyb_geboortedatum_label')} type="date" value={v.geboortedatum}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => zet({ geboortedatum: e.target.value })} verplicht />
        <div>
          <label htmlFor="id-nat" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-1">
            {t('kyb_nationaliteit_label')}<span className="text-fg-error ml-0.5" aria-hidden="true">*</span>
          </label>
          <select id="id-nat" value={v.nationaliteit} onChange={(e) => zet({ nationaliteit: e.target.value })}
            className="w-full bg-surface text-ink-1 border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20">
            <option value="">-</option>
            {LANDEN.filter((l) => /^[A-Z]{2}$/.test(l.code)).map((l) => (
              <option key={l.code} value={l.code}>{l.naam}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-start gap-3 cursor-pointer min-h-[48px]">
        <input type="checkbox" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-border-strong accent-brand-600" />
        <span className="text-sm text-ink-1">{t('kyb_id_controle_bevestig')}</span>
      </label>
      <p className="text-xs text-ink-3">{t('kyb_id_grondslag')}</p>
      <button type="button" onClick={bevestig} disabled={!geldig || bezig}
        className="btn-inst w-full min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed">
        {bezig ? t('laden') : t('bevestigen')}
      </button>
    </div>
  );
}
