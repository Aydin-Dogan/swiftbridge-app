/**
 * StapAanvullend.jsx — stap 6: aanvullende vragen (jaaromzet, deelnemingen,
 * activiteit buiten Nederland).
 *
 * Props: aanvraag, bezig, serverFout, opgeslagenOm, onOpslaan(body), onLater(body), onTerug(body)
 */
import { useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { VeldGroep } from '../ui';
import KybStapKader from './KybStapKader';
import KeuzeGroep from './KeuzeGroep';
import LandenKiezer from './LandenKiezer';
import { KYB_OPTIES } from './kybOpties';
import { compactBody } from './stapHelpers';
import KybVraag from './KybVraag';

const JA_NEE = [{ waarde: true, tKey: 'kyb_ja' }, { waarde: false, tKey: 'kyb_nee' }];

function beginForm(a = {}) {
  return {
    jaaromzet: a.jaaromzet || null,
    deelnemingen: a.deelnemingen == null ? null : !!a.deelnemingen,
    deelnemingenToelichting: a.deelnemingenToelichting || '',
    actiefBuitenNl: a.actiefBuitenNl == null ? null : !!a.actiefBuitenNl,
    actiefLanden: Array.isArray(a.actiefLanden) ? a.actiefLanden : [],
  };
}

export default function StapAanvullend({ aanvraag, bezig, serverFout, opgeslagenOm, onOpslaan, onLater, onTerug }) {
  const { t } = useTaal();
  const [f, setF] = useState(() => beginForm(aanvraag?.aanvullend));
  const zet = (patch) => setF((x) => ({ ...x, ...patch }));

  // Welke vragen staan nog open? Lege lijst = stap compleet.
  const ontbrekend = useMemo(() => {
    const m = [];
    if (!f.jaaromzet) m.push('jaaromzet');
    if (f.deelnemingen === null) m.push('deelnemingen');
    if (f.deelnemingen && !f.deelnemingenToelichting.trim()) m.push('deelnemingenToelichting');
    if (f.actiefBuitenNl === null) m.push('actiefBuitenNl');
    if (f.actiefBuitenNl && f.actiefLanden.length === 0) m.push('actiefLanden');
    return m;
  }, [f]);

  function bouwBody() {
    return {
      jaaromzet: f.jaaromzet,
      deelnemingen: f.deelnemingen,
      deelnemingenToelichting: f.deelnemingen ? f.deelnemingenToelichting.trim() : '',
      actiefBuitenNl: f.actiefBuitenNl,
      actiefLanden: f.actiefBuitenNl ? f.actiefLanden : [],
    };
  }

  function volledigeBody() {
    const b = bouwBody();
    b.deelnemingen = !!b.deelnemingen;
    b.actiefBuitenNl = !!b.actiefBuitenNl;
    if (!b.deelnemingenToelichting) delete b.deelnemingenToelichting;
    return b;
  }

  function gedeeltelijkeBody() {
    const b = compactBody(bouwBody());
    if (f.deelnemingen === null) delete b.deelnemingen;
    if (f.actiefBuitenNl === null) delete b.actiefBuitenNl;
    return b;
  }

  return (
    <KybStapKader
      nr={6}
      titel={t('kyb_stap6_titel')}
      onTerug={() => onTerug?.(gedeeltelijkeBody())}
      onLater={() => onLater?.(gedeeltelijkeBody())}
      onOpslaan={() => onOpslaan?.(volledigeBody())}
      ontbrekend={ontbrekend}
      bezig={bezig}
      serverFout={serverFout}
      opgeslagenOm={opgeslagenOm}
    >
      <KybVraag veld="jaaromzet" kop={t('kyb_omzet_vraag')}>
        <KeuzeGroep naam="jaaromzet" label={t('kyb_omzet_vraag')} opties={KYB_OPTIES.JAAROMZET}
          waarde={f.jaaromzet} onChange={(jaaromzet) => zet({ jaaromzet })} />
      </KybVraag>

      <KybVraag veld={['deelnemingen', 'deelnemingenToelichting']} kop={t('kyb_deelnemingen_vraag')}>
        <KeuzeGroep naam="deelnemingen" label={t('kyb_deelnemingen_vraag')} opties={JA_NEE} kolommen={2}
          waarde={f.deelnemingen} onChange={(deelnemingen) => zet({ deelnemingen })} />
        {f.deelnemingen && (
          <VeldGroep className="mt-2" as="textarea" label={t('kyb_deelnemingen_toelichting')} value={f.deelnemingenToelichting}
            onChange={(e) => zet({ deelnemingenToelichting: e.target.value })} maxLength={300} verplicht />
        )}
      </KybVraag>

      <KybVraag veld={['actiefBuitenNl', 'actiefLanden']} kop={t('kyb_buiten_nl_vraag')}>
        <KeuzeGroep naam="actiefBuitenNl" label={t('kyb_buiten_nl_vraag')} opties={JA_NEE} kolommen={2}
          waarde={f.actiefBuitenNl} onChange={(actiefBuitenNl) => zet({ actiefBuitenNl })} />
        {f.actiefBuitenNl && (
          <div className="mt-3">
            <LandenKiezer label={t('kyb_buiten_nl_landen')} waarden={f.actiefLanden} onChange={(actiefLanden) => zet({ actiefLanden })}
              fout={ontbrekend.includes('actiefLanden')} />
          </div>
        )}
      </KybVraag>
    </KybStapKader>
  );
}
