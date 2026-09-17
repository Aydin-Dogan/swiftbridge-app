/**
 * StapToestemming.jsx — stap 7: controleren en akkoord.
 *
 * Samenvatting, productupdates (opt-in, default uit), vier verplichte
 * verklaringen (+ medebestuurders bij meerdere bestuurders) en de knop
 * "Aanvraag indienen". Bij 400 KYB_NIET_COMPLEET: lijst met directe links.
 *
 * Props: aanvraag, bezig, serverFout, opgeslagenOm, onIndienen(body) -> Promise,
 *        onWijzig(nr), onTerug()
 */
import { useEffect, useState } from 'react';
import { useTaal } from '../../i18n';
import { parseError } from '../../services/api';
import { haalVoorwaarden } from '../../services/kyb';
import { Download } from '../icons/Icons';
import KybStapKader from './KybStapKader';
import KybSamenvatting from './KybSamenvatting';

const STANDAARD_VOORWAARDEN = {
  voorwaardenVersie: '2026-09',
  privacyVersie: '2026-09',
  // Routes van de juridische documenten v1.0 (zelfde als GET /kyb/voorwaarden)
  links: {
    algemeneVoorwaarden: '/voorwaarden',
    privacy: '/privacy',
    acceptatiecriteria: '/zakelijk/acceptatiecriteria',
  },
};

function Vinkje({ id, checked, onChange, children }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer min-h-[48px] py-1">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 flex-shrink-0 rounded border-border-strong accent-brand-600" />
      <span className="text-sm text-ink-1">{children}</span>
    </label>
  );
}

export default function StapToestemming({ aanvraag, bezig, serverFout, opgeslagenOm, onIndienen, onWijzig, onTerug }) {
  const { t } = useTaal();
  const toestemming = aanvraag?.toestemming || {};
  const [vw, setVw] = useState(STANDAARD_VOORWAARDEN);
  const [optIn, setOptIn] = useState(!!toestemming.productupdatesOptIn);
  const [v, setV] = useState({ juist: false, bevoegd: false, acceptatie: false, voorwaarden: false, medebestuurders: false });
  const [lokaalBezig, setLokaalBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [ontbrekend, setOntbrekend] = useState(null); // { stappen:[], documenten:[] }
  const zet = (patch) => setV((x) => ({ ...x, ...patch }));

  const medebestuurdersNodig = Array.isArray(aanvraag?.bedrijf?.structuur) && aanvraag.bedrijf.structuur.includes('meerdere_bestuurders');

  useEffect(() => {
    let weg = false;
    haalVoorwaarden()
      .then((d) => {
        if (weg || !d) return;
        setVw({
          voorwaardenVersie: d.voorwaardenVersie || STANDAARD_VOORWAARDEN.voorwaardenVersie,
          privacyVersie: d.privacyVersie || STANDAARD_VOORWAARDEN.privacyVersie,
          links: { ...STANDAARD_VOORWAARDEN.links, ...(d.links || {}) },
        });
      })
      .catch(() => { /* standaardwaarden blijven staan */ });
    return () => { weg = true; };
  }, []);

  const allesAan = v.juist && v.bevoegd && v.acceptatie && v.voorwaarden && (!medebestuurdersNodig || v.medebestuurders);
  const isBezig = bezig || lokaalBezig;

  async function indienen() {
    if (!allesAan || isBezig) return;
    setFout('');
    setOntbrekend(null);
    setLokaalBezig(true);
    const body = {
      verklaringJuistVolledig: true,
      verklaringBevoegd: true,
      acceptatiecriteriaAkkoord: true,
      voorwaardenAkkoord: true,
      voorwaardenVersie: vw.voorwaardenVersie,
      privacyVersie: vw.privacyVersie,
      productupdatesOptIn: !!optIn,
    };
    if (medebestuurdersNodig) body.medebestuurdersAkkoord = true;
    try {
      await onIndienen?.(body);
    } catch (e) {
      if (e?.errorCode === 'KYB_NIET_COMPLEET' || e?.data?.errorCode === 'KYB_NIET_COMPLEET') {
        const d = e.data || {};
        setOntbrekend({
          stappen: Array.isArray(d.ontbrekendeStappen) ? d.ontbrekendeStappen : [],
          documenten: Array.isArray(d.ontbrekendeDocumenten) ? d.ontbrekendeDocumenten : [],
        });
        setFout(t('kyb_niet_compleet'));
      } else {
        setFout(parseError(e, t));
      }
    } finally {
      setLokaalBezig(false);
    }
  }

  return (
    <KybStapKader
      nr={7}
      titel={t('kyb_stap7_titel')}
      onTerug={() => onTerug?.()}
      onOpslaan={null}
      bezig={isBezig}
      serverFout={serverFout}
      opgeslagenOm={opgeslagenOm}
    >
      <KybSamenvatting aanvraag={aanvraag} onWijzig={onWijzig} />

      <div className="rounded-md border border-border bg-surface-2 p-4 space-y-2">
        <h3 className="font-display text-lg text-ink-1">{t('kyb_marketing_kop')}</h3>
        <label className="flex items-start gap-3 cursor-pointer min-h-[48px]">
          <span className="relative inline-flex flex-shrink-0 mt-0.5">
            <input type="checkbox" role="switch" aria-checked={optIn} checked={optIn} onChange={(e) => setOptIn(e.target.checked)}
              className="peer sr-only" />
            <span aria-hidden="true" className="w-11 h-6 rounded-full bg-border-strong peer-checked:bg-brand-600 transition-colors" />
            <span aria-hidden="true" className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </span>
          <span>
            <span className="block text-sm text-ink-1">{t('kyb_marketing_optin')}</span>
            <span className="block text-xs text-ink-3 mt-0.5">{t('kyb_marketing_uitleg')}</span>
          </span>
        </label>
      </div>

      <div className="space-y-1">
        <h3 className="font-display text-lg text-ink-1">{t('kyb_akkoord_kop')}</h3>
        <Vinkje id="kyb-v-juist" checked={v.juist} onChange={(juist) => zet({ juist })}>{t('kyb_verklaring_juist')}</Vinkje>
        <Vinkje id="kyb-v-bevoegd" checked={v.bevoegd} onChange={(bevoegd) => zet({ bevoegd })}>{t('kyb_verklaring_bevoegd')}</Vinkje>
        <Vinkje id="kyb-v-acceptatie" checked={v.acceptatie} onChange={(acceptatie) => zet({ acceptatie })}>
          {t('kyb_verklaring_acceptatie')}{' '}
          <a href={vw.links.acceptatiecriteria} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline underline-offset-4">
            {t('link_acceptatiecriteria')}
          </a>
        </Vinkje>
        <Vinkje id="kyb-v-voorwaarden" checked={v.voorwaarden} onChange={(voorwaarden) => zet({ voorwaarden })}>
          {t('kyb_verklaring_voorwaarden', { versie: vw.voorwaardenVersie })}
        </Vinkje>
        {medebestuurdersNodig && (
          <Vinkje id="kyb-v-mede" checked={v.medebestuurders} onChange={(medebestuurders) => zet({ medebestuurders })}>
            {t('kyb_verklaring_medebestuurders')}
          </Vinkje>
        )}
        <div className="flex flex-wrap gap-4 pt-1 text-xs">
          <a href={vw.links.algemeneVoorwaarden} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand-700 underline underline-offset-4">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t('link_voorwaarden')}
          </a>
          <a href={vw.links.privacy} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand-700 underline underline-offset-4">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t('link_privacy')}
          </a>
        </div>
      </div>

      <p className="text-xs text-ink-3">{t('kyb_disclaimer_emi')}</p>

      {fout && (
        <div role="alert" className="rounded-md border border-border-error bg-surface px-4 py-3 text-sm text-fg-error space-y-2">
          <div>{fout}</div>
          {ontbrekend && (
            <ul className="space-y-1">
              {ontbrekend.stappen.map((nr) => (
                <li key={`s-${nr}`}>
                  <button type="button" onClick={() => onWijzig?.(nr)} className="font-semibold text-brand-700 underline underline-offset-4">
                    {t('kyb_naar_stap', { stap: nr })}
                  </button>
                </li>
              ))}
              {ontbrekend.documenten.map((soort) => (
                <li key={`d-${soort}`}>
                  <button type="button" onClick={() => onWijzig?.(1)} className="font-semibold text-brand-700 underline underline-offset-4">
                    {t('kyb_document_ontbreekt', { soort: soort === 'kvk_uittreksel' ? t('kyb_uittreksel_label') : soort })}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button type="button" onClick={indienen} disabled={!allesAan || isBezig} aria-busy={isBezig || undefined}
        className="btn-inst w-full min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed">
        {isBezig ? t('laden') : t('kyb_indienen_knop')}
      </button>
    </KybStapKader>
  );
}
