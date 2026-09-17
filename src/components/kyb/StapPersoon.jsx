/**
 * StapPersoon.jsx — stap 2: over jou (de tekenbevoegde aanvrager).
 *
 * Roepnaam, naam (vooringevuld uit de accountnaam), geboortedatum,
 * nationaliteit, mobiel (E.164), e-mail (alleen-lezen), woonadres, PEP-vraag.
 * Buiten de oefenmodus blokkeert een onbevestigd e-mailadres het voltooien.
 *
 * Props: aanvraag, account, oefenmodus, bezig, serverFout, opgeslagenOm,
 *        onOpslaan(body), onLater(body), onTerug(body), onNaarProfiel()
 */
import { useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch, parseError } from '../../services/api';
import { VeldGroep, Knop } from '../ui';
import { Mail, Info } from '../icons/Icons';
import KybStapKader from './KybStapKader';
import KeuzeGroep from './KeuzeGroep';
import KybVraag, { KybVeldGroep } from './KybVraag';
import { kiesbareLanden } from './landNaam';
import { compactBody, splitsNaam, naarE164, E164_RE } from './stapHelpers';

const JA_NEE = [{ waarde: true, tKey: 'kyb_ja' }, { waarde: false, tKey: 'kyb_nee' }];

function beginForm(persoon = {}, account = {}) {
  const naam = splitsNaam(account?.naam);
  const adres = persoon.adres || {};
  const acc = account?.adres || {};
  return {
    roepnaam: persoon.roepnaam || account?.roepnaam || naam.voornamen.split(' ')[0] || '',
    voornamen: persoon.voornamen || naam.voornamen,
    tussenvoegsel: persoon.tussenvoegsel || naam.tussenvoegsel,
    achternaam: persoon.achternaam || naam.achternaam,
    geboortedatum: persoon.geboortedatum || '',
    nationaliteit: persoon.nationaliteit || '',
    telefoonMobiel: persoon.telefoonMobiel || account?.telefoon || '+31',
    adres: {
      straat: adres.straat || acc.straat || '',
      huisnummer: adres.huisnummer || acc.huisnummer || '',
      toevoeging: adres.toevoeging || acc.toevoeging || '',
      postcode: adres.postcode || acc.postcode || '',
      plaats: adres.plaats || acc.plaats || acc.stad || '',
      land: adres.land || acc.land || 'NL',
    },
    pep: persoon.pep == null ? null : !!persoon.pep,
    pepToelichting: persoon.pepToelichting || '',
  };
}

export default function StapPersoon({
  aanvraag, account, oefenmodus = false, bezig, serverFout, opgeslagenOm, onOpslaan, onLater, onTerug, onNaarProfiel,
}) {
  const { t, taal } = useTaal();
  const landen = useMemo(() => kiesbareLanden(taal), [taal]);
  const [f, setF] = useState(() => beginForm(aanvraag?.persoon, account));
  const [pepInfo, setPepInfo] = useState(false);
  const [mailBezig, setMailBezig] = useState(false);
  const [mailBericht, setMailBericht] = useState('');
  const [mailFout, setMailFout] = useState('');
  const zet = (patch) => setF((x) => ({ ...x, ...patch }));
  const zetAdres = (patch) => setF((x) => ({ ...x, adres: { ...x.adres, ...patch } }));

  const emailBlokkade = !oefenmodus && account && account.emailGeverifieerd === false;
  const mobiel = naarE164(f.telefoonMobiel);

  // Welke velden staan nog open? Lege lijst = stap compleet.
  const ontbrekend = useMemo(() => {
    const m = [];
    if (!f.roepnaam.trim()) m.push('roepnaam');
    if (!f.voornamen.trim()) m.push('voornamen');
    if (!f.achternaam.trim()) m.push('achternaam');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.geboortedatum)) m.push('geboortedatum');
    if (!/^[A-Z]{2}$/.test(f.nationaliteit)) m.push('nationaliteit');
    if (!E164_RE.test(mobiel)) m.push('telefoonMobiel');
    const a = f.adres;
    if (!a.straat.trim()) m.push('straat');
    if (!a.huisnummer.trim()) m.push('huisnummer');
    if (!a.postcode.trim()) m.push('postcode');
    if (!a.plaats.trim()) m.push('plaats');
    if (f.pep === null) m.push('pep');
    if (f.pep && !f.pepToelichting.trim()) m.push('pepToelichting');
    return m;
  }, [f, mobiel]);

  function bouwBody() {
    return {
      roepnaam: f.roepnaam.trim(),
      voornamen: f.voornamen.trim(),
      achternaam: f.achternaam.trim(),
      tussenvoegsel: f.tussenvoegsel.trim(),
      geboortedatum: f.geboortedatum,
      nationaliteit: f.nationaliteit,
      telefoonMobiel: mobiel,
      adres: {
        straat: f.adres.straat.trim(),
        huisnummer: f.adres.huisnummer.trim(),
        toevoeging: f.adres.toevoeging.trim(),
        postcode: f.adres.postcode.toUpperCase().trim(),
        plaats: f.adres.plaats.trim(),
        land: f.adres.land || 'NL',
      },
      pep: !!f.pep,
      pepToelichting: f.pep ? f.pepToelichting.trim() : '',
    };
  }

  function volledigeBody() {
    const b = bouwBody();
    if (!b.tussenvoegsel) delete b.tussenvoegsel;
    if (!b.pepToelichting) delete b.pepToelichting;
    if (!b.adres.toevoeging) delete b.adres.toevoeging;
    return b;
  }

  function gedeeltelijkeBody() {
    const b = compactBody(bouwBody());
    if (b.telefoonMobiel && !E164_RE.test(b.telefoonMobiel)) delete b.telefoonMobiel;
    if (b.geboortedatum && !/^\d{4}-\d{2}-\d{2}$/.test(b.geboortedatum)) delete b.geboortedatum;
    if (f.pep === null) delete b.pep;
    if (b.adres && Object.keys(b.adres).length <= 1) delete b.adres;
    return b;
  }

  async function stuurVerificatieOpnieuw() {
    setMailBezig(true);
    setMailBericht('');
    setMailFout('');
    try {
      await apiFetch('/auth/verifieer-email/opnieuw-sturen', { method: 'POST', body: {} });
      setMailBericht(t('kyb_email_opnieuw_gelukt'));
    } catch (e) {
      setMailFout(parseError(e, t));
    } finally {
      setMailBezig(false);
    }
  }

  return (
    <KybStapKader
      nr={2}
      titel={t('kyb_stap2_titel')}
      onTerug={() => onTerug?.(gedeeltelijkeBody())}
      onLater={() => onLater?.(gedeeltelijkeBody())}
      onOpslaan={() => onOpslaan?.(volledigeBody())}
      ontbrekend={ontbrekend}
      bezig={bezig}
      serverFout={serverFout}
      opgeslagenOm={opgeslagenOm}
    >
      {emailBlokkade && (
        <div role="alert" className="rounded-md border border-border-warning bg-surface p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-ink-1 text-sm">
            <Mail className="w-4 h-4 text-accent-600" aria-hidden="true" /> {t('kyb_email_bevestig_kop')}
          </div>
          <p className="text-xs text-ink-2">{t('kyb_email_bevestig_uitleg')}</p>
          {mailBericht && <p role="status" className="text-xs text-success-700">{mailBericht}</p>}
          {mailFout && <p className="text-xs text-fg-error">{mailFout}</p>}
          <Knop variant="secondary" size="md" laden={mailBezig} onClick={stuurVerificatieOpnieuw}>
            {t('kyb_email_opnieuw')}
          </Knop>
        </div>
      )}

      <KybVeldGroep veld="roepnaam" label={t('kyb_roepnaam_label')} value={f.roepnaam} onChange={(e) => zet({ roepnaam: e.target.value })}
        maxLength={60} autoComplete="given-name" verplicht />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <KybVeldGroep veld="voornamen" className="sm:col-span-2" label={t('kyb_voornamen_label')} value={f.voornamen}
          onChange={(e) => zet({ voornamen: e.target.value })} maxLength={100} verplicht />
        <VeldGroep label={t('kyb_tussenvoegsel_label')} value={f.tussenvoegsel}
          onChange={(e) => zet({ tussenvoegsel: e.target.value })} maxLength={20} />
      </div>
      <KybVeldGroep veld="achternaam" label={t('kyb_achternaam_label')} value={f.achternaam} onChange={(e) => zet({ achternaam: e.target.value })}
        maxLength={100} autoComplete="family-name" verplicht />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <KybVeldGroep veld="geboortedatum" label={t('kyb_geboortedatum_label')} type="date" value={f.geboortedatum}
          max={new Date().toISOString().slice(0, 10)} onChange={(e) => zet({ geboortedatum: e.target.value })} verplicht />
        <KybVraag veld="nationaliteit">
          <label htmlFor="persoon-nat" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-1">
            {t('kyb_nationaliteit_label')}<span className="text-fg-error ml-0.5" aria-hidden="true">*</span>
          </label>
          <select id="persoon-nat" value={f.nationaliteit} onChange={(e) => zet({ nationaliteit: e.target.value })}
            className="w-full bg-surface text-ink-1 border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20">
            <option value="">-</option>
            {landen.map((l) => (
              <option key={l.code} value={l.code}>{l.naam}</option>
            ))}
          </select>
        </KybVraag>
      </div>

      <KybVeldGroep veld="telefoonMobiel" label={t('kyb_mobiel_label')} type="tel" inputMode="tel" autoComplete="tel" value={f.telefoonMobiel}
        onChange={(e) => zet({ telefoonMobiel: e.target.value })} onBlur={() => zet({ telefoonMobiel: naarE164(f.telefoonMobiel) })}
        hint={t('kyb_mobiel_hint')} maxLength={20} verplicht />

      <VeldGroep label={t('kyb_email_label')} type="email" value={account?.email || ''} readOnly disabled
        trailing={onNaarProfiel ? (
          <button type="button" onClick={onNaarProfiel} className="text-[11px] font-semibold text-brand-700 hover:underline underline-offset-4 whitespace-nowrap">
            {t('kyb_email_wijzig')}
          </button>
        ) : null} />

      <div>
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2">{t('kyb_adres_kop')}</h3>
        <p className="text-xs text-ink-3 mb-2">{t('kyb_adres_hint')}</p>
        <div className="grid grid-cols-4 gap-2">
          <KybVeldGroep veld="straat" className="col-span-2" label={t('kyb_straat_label')} value={f.adres.straat}
            onChange={(e) => zetAdres({ straat: e.target.value })} autoComplete="address-line1" maxLength={100} verplicht />
          <KybVeldGroep veld="huisnummer" label={t('kyb_huisnummer_label')} value={f.adres.huisnummer}
            onChange={(e) => zetAdres({ huisnummer: e.target.value })} maxLength={10} verplicht />
          <VeldGroep label={t('kyb_toevoeging_label')} value={f.adres.toevoeging}
            onChange={(e) => zetAdres({ toevoeging: e.target.value })} maxLength={10} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <KybVeldGroep veld="postcode" label={t('kyb_postcode_label')} value={f.adres.postcode}
            onChange={(e) => zetAdres({ postcode: e.target.value.toUpperCase() })} autoComplete="postal-code" maxLength={12} verplicht />
          <KybVeldGroep veld="plaats" className="col-span-2" label={t('kyb_plaats_label')} value={f.adres.plaats}
            onChange={(e) => zetAdres({ plaats: e.target.value })} autoComplete="address-level2" maxLength={80} verplicht />
        </div>
        <div className="mt-2">
          <label htmlFor="persoon-land" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-1">{t('kyb_land_label')}</label>
          <select id="persoon-land" value={f.adres.land} onChange={(e) => zetAdres({ land: e.target.value })}
            className="w-full bg-surface text-ink-1 border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20">
            {landen.map((l) => (
              <option key={l.code} value={l.code}>{l.naam}</option>
            ))}
          </select>
        </div>
      </div>

      <KybVraag veld={['pep', 'pepToelichting']}>
        <div className="flex items-start gap-2 mb-2">
          <div className="text-sm font-medium text-ink-1 flex-1">{t('kyb_pep_vraag')}</div>
          <button type="button" onClick={() => setPepInfo((o) => !o)} aria-expanded={pepInfo}
            aria-label={t('kyb_pep_info')} className="w-8 h-8 rounded-full flex items-center justify-center text-brand-600 hover:bg-brand-50">
            <Info className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {pepInfo && <p className="text-xs text-ink-2 mb-2 rounded-md bg-surface-2 border border-border px-3 py-2">{t('kyb_pep_info')}</p>}
        <KeuzeGroep naam="pep" label={t('kyb_pep_vraag')} opties={JA_NEE} kolommen={2} waarde={f.pep} onChange={(pep) => zet({ pep })} />
        {f.pep && (
          <VeldGroep className="mt-2" as="textarea" label={t('kyb_pep_toelichting')} value={f.pepToelichting}
            onChange={(e) => zet({ pepToelichting: e.target.value })} maxLength={300} verplicht />
        )}
      </KybVraag>
    </KybStapKader>
  );
}
