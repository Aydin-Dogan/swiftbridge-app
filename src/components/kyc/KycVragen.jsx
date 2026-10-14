/**
 * KycVragen.jsx — vijf korte vragen over doel en gebruik (voorstel aanmeldroute,
 * stap 6; 14-10-2026).
 *
 * Waarvoor stuur je geld, hoeveel per maand, waar komt het vandaan, ben je
 * politiek prominent, en naar welk land. De KYC-poort van de API keurt niemand
 * goed zonder deze antwoorden. Bewust GEEN onderdeel van KYCFlow.jsx: dit
 * scherm staat los, en VragenVoorBetalen.jsx toont het alleen aan wie nog niet
 * antwoordde.
 *
 * Eenvoudig voor iedereen, ook voor wie de app voor het eerst gebruikt: vaste
 * keuzes als grote knoppen (KeuzeGroep, minimaal 48px hoog), één zin uitleg,
 * geen vrije tekst. De landen waar we naartoe uitbetalen staan als knop; elk
 * ander land kan uit een lijst.
 *
 * Props: gebruikerId, beginwaarden (eerdere antwoorden of null),
 *        onKlaar({ beantwoord, opnieuwInBeoordeling, pep })
 */
import { useId, useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { parseError } from '../../services/api';
import { VALUTAS_LIVE } from '../../services/currencies';
import {
  DOELEN, MAANDVOLUMES, BRONNEN, MAX_LANDEN, opties, slaAntwoordenOp,
} from '../../services/kycAntwoorden';
import KeuzeGroep from '../kyb/KeuzeGroep';
import { landNaam, kiesbareLanden } from '../kyb/landNaam';
import { Check, X } from '../icons/Icons';

// De landen waar de app naartoe uitbetaalt, als knop. De euro is geen land.
const UITBETAAL_LANDEN = [...new Set(
  VALUTAS_LIVE.map((v) => String(v.landCode || '').toUpperCase()).filter((c) => c && c !== 'EU')
)];

const PEP_OPTIES = [{ waarde: 'ja', tKey: 'ja' }, { waarde: 'nee', tKey: 'nee' }];

function Vraag({ id, titel, uitleg, open, children }) {
  const { t } = useTaal();
  return (
    <fieldset className="mt-6 first:mt-0" aria-describedby={open ? `${id}-open` : undefined}>
      <legend id={id} className="font-display text-base font-medium text-ink-1">{titel}</legend>
      {uitleg && <p className="text-xs text-ink-3 mt-1">{uitleg}</p>}
      <div className="mt-2.5">{children}</div>
      {open && <p id={`${id}-open`} className="mt-1.5 text-sm text-red-700">{t('kyc_vragen_kies_een')}</p>}
    </fieldset>
  );
}

export default function KycVragen({ gebruikerId, beginwaarden = null, onKlaar }) {
  const { t, taal } = useTaal();
  const id = useId();
  const b = beginwaarden || {};
  const [doel, setDoel] = useState(b.doel || null);
  const [volume, setVolume] = useState(b.verwachtMaandVolume || null);
  const [bron, setBron] = useState(b.bronInkomen || null);
  const [pep, setPep] = useState(typeof b.pep === 'boolean' ? b.pep : null);
  const [landen, setLanden] = useState(Array.isArray(b.landen) ? b.landen : []);
  const [toonOpen, setToonOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const knopLanden = useMemo(() => {
    const coll = new Intl.Collator(taal || 'nl');
    return UITBETAAL_LANDEN
      .map((code) => ({ code, naam: landNaam(code, taal) }))
      .sort((x, y) => coll.compare(x.naam, y.naam));
  }, [taal]);
  const andereGekozen = landen.filter((c) => !UITBETAAL_LANDEN.includes(c));
  const lijstLanden = useMemo(
    () => kiesbareLanden(taal).filter((l) => !UITBETAAL_LANDEN.includes(l.code)),
    [taal]
  );

  function wisselLand(code) {
    setLanden((huidig) => {
      if (huidig.includes(code)) return huidig.filter((c) => c !== code);
      return huidig.length >= MAX_LANDEN ? huidig : [...huidig, code];
    });
  }

  const compleet = Boolean(doel && volume && bron) && pep !== null && landen.length > 0;

  async function verstuur() {
    if (!compleet) {
      setToonOpen(true);
      return;
    }
    setBezig(true);
    setFout('');
    try {
      const uit = await slaAntwoordenOp(gebruikerId, {
        doel, verwachtMaandVolume: volume, bronInkomen: bron, pep, landen,
      });
      onKlaar?.(uit);
    } catch (e) {
      setFout(parseError(e, t));
      setBezig(false);
    }
  }

  return (
    <section className="max-w-md mx-auto bg-surface border border-border rounded-md p-5 shadow-soft">
      <h2 className="font-display text-xl font-medium text-ink-1">{t('kyc_vragen_titel')}</h2>
      <p className="text-sm text-ink-2 mt-1">{t('kyc_vragen_waarom')}</p>

      <div className="mt-5">
        <Vraag id={`${id}-doel`} titel={t('kyc_vragen_doel')} open={toonOpen && !doel}>
          <KeuzeGroep naam="doel" label={t('kyc_vragen_doel')} kolommen={2}
            opties={opties(DOELEN, 'kyc_vragen_doel')} waarde={doel} onChange={setDoel} />
        </Vraag>

        <Vraag id={`${id}-volume`} titel={t('kyc_vragen_volume')} open={toonOpen && !volume}>
          <KeuzeGroep naam="volume" label={t('kyc_vragen_volume')}
            opties={opties(MAANDVOLUMES, 'kyc_vragen_volume')} waarde={volume} onChange={setVolume} />
        </Vraag>

        <Vraag id={`${id}-bron`} titel={t('kyc_vragen_bron')} open={toonOpen && !bron}>
          <KeuzeGroep naam="bron" label={t('kyc_vragen_bron')} kolommen={2}
            opties={opties(BRONNEN, 'kyc_vragen_bron')} waarde={bron} onChange={setBron} />
        </Vraag>

        <Vraag id={`${id}-pep`} titel={t('kyc_vragen_pep')} uitleg={t('kyc_vragen_pep_uitleg')} open={toonOpen && pep === null}>
          <KeuzeGroep naam="pep" label={t('kyc_vragen_pep')} kolommen={2} opties={PEP_OPTIES}
            waarde={pep === null ? null : (pep ? 'ja' : 'nee')} onChange={(w) => setPep(w === 'ja')} />
        </Vraag>

        <Vraag id={`${id}-landen`} titel={t('kyc_vragen_landen')} open={toonOpen && landen.length === 0}>
          <div role="group" aria-labelledby={`${id}-landen`} className="grid gap-2 sm:grid-cols-2">
            {knopLanden.map((l) => {
              const aan = landen.includes(l.code);
              return (
                <button key={l.code} type="button" role="checkbox" aria-checked={aan} onClick={() => wisselLand(l.code)}
                  className={`w-full min-h-[48px] flex items-center gap-3 text-left px-3.5 py-2.5 rounded-md border transition
                    focus:outline-none focus:ring-2 focus:ring-brand-500/30
                    ${aan ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-border bg-surface text-ink-1 hover:border-brand-300'}`}>
                  <span aria-hidden="true" className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded border-2
                    ${aan ? 'border-brand-600 bg-brand-600 text-white' : 'border-border-strong bg-surface'}`}>
                    {aan && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-sm font-medium">{l.naam}</span>
                </button>
              );
            })}
          </div>

          {andereGekozen.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-3">
              {andereGekozen.map((code) => (
                <li key={code} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold pl-3 pr-1 py-1">
                  {landNaam(code, taal)}
                  <button type="button" onClick={() => wisselLand(code)}
                    aria-label={t('kyc_vragen_land_weg', { land: landNaam(code, taal) })}
                    className="w-8 h-8 rounded-full hover:bg-brand-100 flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label htmlFor={`${id}-ander`} className="block text-sm text-ink-2 mt-3 mb-1">{t('kyc_vragen_ander_land')}</label>
          <select id={`${id}-ander`} value="" onChange={(e) => { if (e.target.value) wisselLand(e.target.value); }}
            className="w-full min-h-[48px] bg-surface text-ink-1 border border-border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            <option value="">{t('kyc_vragen_kies_land')}</option>
            {lijstLanden.filter((l) => !landen.includes(l.code)).map((l) => (
              <option key={l.code} value={l.code}>{l.naam}</option>
            ))}
          </select>
        </Vraag>
      </div>

      {fout && (
        <p role="alert" className="mt-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{fout}</p>
      )}

      <button type="button" onClick={verstuur} disabled={bezig}
        className="btn-inst w-full mt-6 min-h-[52px] text-base disabled:bg-gray-300">
        {bezig ? t('laden') : t('kyc_vragen_verder')}
      </button>
    </section>
  );
}
