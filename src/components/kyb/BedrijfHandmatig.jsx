/**
 * BedrijfHandmatig.jsx — bedrijfsgegevens zelf invullen wanneer het
 * Handelsregister niet bereikbaar is (bron 'handmatig'). De klant voegt dan
 * een recent KvK-uittreksel toe (verplicht bij indienen).
 *
 * Props: waarde { bedrijfsnaam, kvkNummer, vestiging:{straat,huisnummer,postcode,plaats,land}, hoofdactiviteit },
 *        onChange(nieuweWaarde)
 */
import { useTaal } from '../../i18n';
import { VeldGroep } from '../ui';

export default function BedrijfHandmatig({ waarde = {}, onChange }) {
  const { t } = useTaal();
  const v = waarde || {};
  const vest = v.vestiging || {};

  function zet(patch) { onChange?.({ ...v, ...patch }); }
  function zetVest(patch) { onChange?.({ ...v, vestiging: { ...vest, ...patch } }); }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">{t('kyb_handmatig_uitleg')}</p>
      <VeldGroep
        label={t('kyb_bedrijf_naam')}
        value={v.bedrijfsnaam || ''}
        onChange={(e) => zet({ bedrijfsnaam: e.target.value })}
        autoComplete="organization"
        maxLength={150}
        verplicht
      />
      <VeldGroep
        label={t('kyb_bedrijf_kvk')}
        value={v.kvkNummer || ''}
        onChange={(e) => zet({ kvkNummer: e.target.value.replace(/\D/g, '').slice(0, 8) })}
        inputMode="numeric"
        maxLength={8}
        hint={t('kyb_kvk_zoek_hint')}
        className="font-mono"
        verplicht
      />
      <div>
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-2">{t('kyb_bedrijf_adres_kop')}</h3>
        <div className="grid grid-cols-3 gap-2">
          <VeldGroep className="col-span-2" label={t('kyb_straat_label')} value={vest.straat || ''}
            onChange={(e) => zetVest({ straat: e.target.value })} maxLength={100} verplicht />
          <VeldGroep label={t('kyb_huisnummer_label')} value={vest.huisnummer || ''}
            onChange={(e) => zetVest({ huisnummer: e.target.value })} maxLength={10} verplicht />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <VeldGroep label={t('kyb_postcode_label')} value={vest.postcode || ''}
            onChange={(e) => zetVest({ postcode: e.target.value.toUpperCase() })} maxLength={12} verplicht />
          <VeldGroep className="col-span-2" label={t('kyb_plaats_label')} value={vest.plaats || ''}
            onChange={(e) => zetVest({ plaats: e.target.value })} maxLength={80} verplicht />
        </div>
      </div>
      <VeldGroep
        label={t('kyb_hoofdactiviteit')}
        value={v.hoofdactiviteit || ''}
        onChange={(e) => zet({ hoofdactiviteit: e.target.value })}
        maxLength={300}
      />
    </div>
  );
}
