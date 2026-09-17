/**
 * StapGebruik.jsx — stap 4: vragen over je gebruik (Wwft: doel en aard).
 *
 * Props: aanvraag, bezig, serverFout, opgeslagenOm, onOpslaan(body), onLater(body), onTerug(body)
 */
import { useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { VeldGroep } from '../ui';
import { Info } from '../icons/Icons';
import KybStapKader from './KybStapKader';
import KeuzeGroep from './KeuzeGroep';
import LandenKiezer from './LandenKiezer';
import { KYB_OPTIES } from './kybOpties';
import { compactBody } from './stapHelpers';
import KybVraag from './KybVraag';

const JA_NEE = [{ waarde: true, tKey: 'kyb_ja' }, { waarde: false, tKey: 'kyb_nee' }];

function beginForm(g = {}) {
  return {
    txPerJaar: g.txPerJaar || null,
    omvangPerTx: g.omvangPerTx || null,
    internationaal: g.internationaal == null ? null : !!g.internationaal,
    landen: Array.isArray(g.landen) ? g.landen : [],
    volumeKwartaal: g.volumeKwartaal || null,
    herkomstMiddelen: Array.isArray(g.herkomstMiddelen) ? g.herkomstMiddelen : [],
    herkomstToelichting: g.herkomstToelichting || '',
  };
}

export default function StapGebruik({ aanvraag, bezig, serverFout, opgeslagenOm, onOpslaan, onLater, onTerug }) {
  const { t } = useTaal();
  const [f, setF] = useState(() => beginForm(aanvraag?.gebruik));
  const zet = (patch) => setF((x) => ({ ...x, ...patch }));
  const overig = f.herkomstMiddelen.includes('overig');

  // Welke vragen staan nog open? Lege lijst = stap compleet.
  const ontbrekend = useMemo(() => {
    const m = [];
    if (!f.txPerJaar) m.push('txPerJaar');
    if (!f.omvangPerTx) m.push('omvangPerTx');
    if (f.internationaal === null) m.push('internationaal');
    if (f.internationaal && f.landen.length === 0) m.push('landen');
    if (!f.volumeKwartaal) m.push('volumeKwartaal');
    if (f.herkomstMiddelen.length === 0) m.push('herkomstMiddelen');
    if (overig && !f.herkomstToelichting.trim()) m.push('herkomstToelichting');
    return m;
  }, [f, overig]);

  function bouwBody() {
    return {
      txPerJaar: f.txPerJaar,
      omvangPerTx: f.omvangPerTx,
      internationaal: f.internationaal,
      landen: f.internationaal ? f.landen : [],
      volumeKwartaal: f.volumeKwartaal,
      herkomstMiddelen: f.herkomstMiddelen,
      herkomstToelichting: f.herkomstToelichting.trim(),
    };
  }

  function volledigeBody() {
    const b = bouwBody();
    b.internationaal = !!b.internationaal;
    if (!b.herkomstToelichting) delete b.herkomstToelichting;
    return b;
  }

  function gedeeltelijkeBody() {
    const b = compactBody(bouwBody());
    if (f.internationaal === null) delete b.internationaal;
    if (Array.isArray(b.herkomstMiddelen) && b.herkomstMiddelen.length === 0) delete b.herkomstMiddelen;
    return b;
  }

  return (
    <KybStapKader
      nr={4}
      titel={t('kyb_stap4_titel')}
      onTerug={() => onTerug?.(gedeeltelijkeBody())}
      onLater={() => onLater?.(gedeeltelijkeBody())}
      onOpslaan={() => onOpslaan?.(volledigeBody())}
      ontbrekend={ontbrekend}
      bezig={bezig}
      serverFout={serverFout}
      opgeslagenOm={opgeslagenOm}
    >
      <div className="flex items-start gap-2 rounded-md bg-brand-50 border border-brand-100 px-3.5 py-3 text-xs text-brand-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>{t('kyb_gebruik_waarom')}</span>
      </div>

      <KybVraag veld="txPerJaar" kop={t('kyb_tx_jaar_vraag')}>
        <KeuzeGroep naam="txPerJaar" label={t('kyb_tx_jaar_vraag')} opties={KYB_OPTIES.TX_PER_JAAR} kolommen={2}
          waarde={f.txPerJaar} onChange={(txPerJaar) => zet({ txPerJaar })} />
      </KybVraag>

      <KybVraag veld="omvangPerTx" kop={t('kyb_omvang_vraag')}>
        <KeuzeGroep naam="omvangPerTx" label={t('kyb_omvang_vraag')} opties={KYB_OPTIES.OMVANG_PER_TX}
          waarde={f.omvangPerTx} onChange={(omvangPerTx) => zet({ omvangPerTx })} />
      </KybVraag>

      <KybVraag veld={['internationaal', 'landen']} kop={t('kyb_internationaal_vraag')}>
        <KeuzeGroep naam="internationaal" label={t('kyb_internationaal_vraag')} opties={JA_NEE} kolommen={2}
          waarde={f.internationaal} onChange={(internationaal) => zet({ internationaal })} />
        {f.internationaal && (
          <div className="mt-3">
            <LandenKiezer label={t('kyb_landen_vraag')} waarden={f.landen} onChange={(landen) => zet({ landen })}
              fout={ontbrekend.includes('landen')} />
          </div>
        )}
      </KybVraag>

      <KybVraag veld="volumeKwartaal" kop={t('kyb_volume_vraag')}>
        <KeuzeGroep naam="volumeKwartaal" label={t('kyb_volume_vraag')} opties={KYB_OPTIES.VOLUME_KWARTAAL}
          waarde={f.volumeKwartaal} onChange={(volumeKwartaal) => zet({ volumeKwartaal })} />
      </KybVraag>

      <KybVraag veld={['herkomstMiddelen', 'herkomstToelichting']} kop={t('kyb_herkomst_vraag')} uitleg={t('kyb_herkomst_uitleg')}>
        <KeuzeGroep naam="herkomst" label={t('kyb_herkomst_vraag')} opties={KYB_OPTIES.HERKOMST} meervoudig
          waarden={f.herkomstMiddelen} onChange={(herkomstMiddelen) => zet({ herkomstMiddelen })} />
        {overig && (
          <VeldGroep className="mt-2" as="textarea" label={t('kyb_herkomst_toelichting')} value={f.herkomstToelichting}
            onChange={(e) => zet({ herkomstToelichting: e.target.value })} maxLength={500} verplicht />
        )}
      </KybVraag>
    </KybStapKader>
  );
}
