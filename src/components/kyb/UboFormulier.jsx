/**
 * UboFormulier.jsx — een eigenaar/bestuurder toevoegen of bewerken.
 *
 * Props: waarde (bestaand persoon of null), onOpslaan(persoon), onAnnuleer()
 * Validatie (uboGeldig) en API-body (uboNaarBody) staan in ./uboHelpers.js.
 */
import { useState } from 'react';
import { useTaal } from '../../i18n';
import { LANDEN } from '../kyc/landen';
import { VeldGroep, Knop } from '../ui';
import KeuzeGroep from './KeuzeGroep';
import { KYB_OPTIES } from './kybOpties';
import { uboGeldig } from './uboHelpers';

const JA_NEE = [{ waarde: true, tKey: 'kyb_ja' }, { waarde: false, tKey: 'kyb_nee' }];
const LEEG = {
  rol: 'ubo', voornamen: '', tussenvoegsel: '', achternaam: '', geboortedatum: '', nationaliteit: '',
  uboAard: null, uboPercentageKlasse: null, pep: false, pepToelichting: '',
};

export default function UboFormulier({ waarde = null, onOpslaan, onAnnuleer }) {
  const { t } = useTaal();
  const [p, setP] = useState({ ...LEEG, ...(waarde || {}) });
  const zet = (patch) => setP((x) => ({ ...x, ...patch }));
  const geldig = uboGeldig(p);
  const aardOpties = KYB_OPTIES.UBO_AARD.filter((o) => o.waarde !== 'pseudo');

  return (
    <div className="rounded-md border border-border bg-surface-2 p-4 space-y-4" role="group" aria-label={t('kyb_ubo_toevoegen')}>
      <div>
        <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-2">{t('kyb_ubo_rol')}</div>
        <KeuzeGroep naam="ubo-rol" label={t('kyb_ubo_rol')} opties={KYB_OPTIES.UBO_ROL} waarde={p.rol}
          onChange={(rol) => zet({ rol, uboAard: rol === 'ubo' ? p.uboAard : null, uboPercentageKlasse: rol === 'ubo' ? p.uboPercentageKlasse : null })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <VeldGroep className="sm:col-span-2" label={t('kyb_voornamen_label')} value={p.voornamen}
          onChange={(e) => zet({ voornamen: e.target.value })} maxLength={100} verplicht />
        <VeldGroep label={t('kyb_tussenvoegsel_label')} value={p.tussenvoegsel || ''}
          onChange={(e) => zet({ tussenvoegsel: e.target.value })} maxLength={20} />
      </div>
      <VeldGroep label={t('kyb_achternaam_label')} value={p.achternaam}
        onChange={(e) => zet({ achternaam: e.target.value })} maxLength={100} verplicht />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <VeldGroep label={t('kyb_geboortedatum_label')} type="date" value={p.geboortedatum}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => zet({ geboortedatum: e.target.value })} verplicht />
        <div>
          <label htmlFor="ubo-nat" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-1">
            {t('kyb_nationaliteit_label')}<span className="text-fg-error ml-0.5" aria-hidden="true">*</span>
          </label>
          <select id="ubo-nat" value={p.nationaliteit} onChange={(e) => zet({ nationaliteit: e.target.value })}
            className="w-full bg-surface text-ink-1 border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20">
            <option value="">-</option>
            {LANDEN.filter((l) => /^[A-Z]{2}$/.test(l.code)).map((l) => (
              <option key={l.code} value={l.code}>{l.naam}</option>
            ))}
          </select>
        </div>
      </div>

      {p.rol === 'ubo' && (
        <>
          <div>
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-2">{t('kyb_ubo_aard')}</div>
            <KeuzeGroep naam="ubo-aard" label={t('kyb_ubo_aard')} opties={aardOpties} waarde={p.uboAard} kolommen={2}
              onChange={(uboAard) => zet({ uboAard })} />
          </div>
          <div>
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-2">{t('kyb_ubo_pct')}</div>
            <KeuzeGroep naam="ubo-pct" label={t('kyb_ubo_pct')} opties={KYB_OPTIES.UBO_PCT} waarde={p.uboPercentageKlasse}
              onChange={(uboPercentageKlasse) => zet({ uboPercentageKlasse })} />
          </div>
        </>
      )}

      <div>
        <div className="text-sm font-medium text-ink-1 mb-2">{t('kyb_pep_vraag')}</div>
        <p className="text-xs text-ink-3 mb-2">{t('kyb_pep_info')}</p>
        <KeuzeGroep naam="ubo-pep" label={t('kyb_pep_vraag')} opties={JA_NEE} waarde={p.pep} kolommen={2}
          onChange={(pep) => zet({ pep })} />
        {p.pep && (
          <VeldGroep className="mt-2" as="textarea" label={t('kyb_pep_toelichting')} value={p.pepToelichting || ''}
            onChange={(e) => zet({ pepToelichting: e.target.value })} maxLength={300} verplicht />
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Knop variant="secondary" size="lg" onClick={onAnnuleer}>{t('annuleren')}</Knop>
        <Knop variant="primary" size="lg" disabled={!geldig} onClick={() => onOpslaan?.(p)} className="flex-1">
          {t('opslaan')}
        </Knop>
      </div>
    </div>
  );
}
