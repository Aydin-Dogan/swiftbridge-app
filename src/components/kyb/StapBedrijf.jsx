/**
 * StapBedrijf.jsx — stap 1: over je bedrijf.
 *
 * Bedrijf kiezen (KvK-zoeker, prefill uit registratie, of handmatig + uittreksel),
 * rechtsvorm, structuur, handelsnaam, website, SBI-bevestiging en — als de
 * bedrijfsregels dat vereisen — eigenaren/bestuurders.
 *
 * Props: aanvraag, kvk, oefenmodus, uploadDocument, verwijderDocument,
 *        bezig, serverFout, opgeslagenOm, onOpslaan(body), onLater(body), onTerug(body)
 */
import { useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { VeldGroep, Knop } from '../ui';
import { Building } from '../icons/Icons';
import KybStapKader from './KybStapKader';
import KeuzeGroep from './KeuzeGroep';
import KvkZoeker from './KvkZoeker';
import BedrijfHandmatig from './BedrijfHandmatig';
import UboLijst from './UboLijst';
import KybDocumentUpload from './KybDocumentUpload';
import { KYB_OPTIES, uboInvoerVereist } from './kybOpties';
import { uboGeldig, uboNaarBody } from './uboHelpers';
import { compactBody, naarUrl, isUrl } from './stapHelpers';
import KybVraag, { KybVeldGroep } from './KybVraag';

const JA_NEE = [{ waarde: true, tKey: 'kyb_ja' }, { waarde: false, tKey: 'kyb_nee' }];

function beginForm(bedrijf = {}, ubos = []) {
  return {
    rechtsvorm: bedrijf.rechtsvorm || null,
    rechtsvormOverige: bedrijf.rechtsvormOverige || '',
    structuur: Array.isArray(bedrijf.structuur) ? bedrijf.structuur : [],
    kvkNummer: bedrijf.kvkNummer || '',
    bedrijfsnaam: bedrijf.bedrijfsnaam || '',
    handelsnaam: bedrijf.handelsnaam || '',
    handelsnaamKeuze: bedrijf.handelsnaam ? 'andere' : null, // 'deze' | 'andere' | null
    website: bedrijf.website || '',
    geenWebsite: !!bedrijf.geenWebsite,
    vestiging: { straat: '', huisnummer: '', postcode: '', plaats: '', land: 'NL', ...(bedrijf.vestiging || {}) },
    sbiCodes: Array.isArray(bedrijf.sbiCodes) ? bedrijf.sbiCodes : [],
    sbiBevestigd: bedrijf.sbiBevestigd == null ? null : !!bedrijf.sbiBevestigd,
    sbiOpmerking: bedrijf.sbiOpmerking || '',
    hoofdactiviteit: bedrijf.bron === 'handmatig' ? (bedrijf.sbiOpmerking || '') : '',
    bron: bedrijf.bron || null,
    kvkProfiel: bedrijf.kvkProfiel || null,
    ubos: (ubos || []).filter((u) => !u.isAanvrager),
  };
}

export default function StapBedrijf({
  aanvraag, kvk, oefenmodus = false, uploadDocument, verwijderDocument,
  bezig, serverFout, opgeslagenOm, onOpslaan, onLater, onTerug,
}) {
  const { t } = useTaal();
  const bedrijf = aanvraag?.bedrijf || {};
  const [f, setF] = useState(() => beginForm(bedrijf, aanvraag?.ubos));
  const [gekozen, setGekozen] = useState(() => !!(bedrijf.bron && (bedrijf.bedrijfsnaam || '').length >= 2));
  const zet = (patch) => setF((x) => ({ ...x, ...patch }));

  const kvkBeschikbaar = !!kvk?.beschikbaar;
  const kvkBron = kvk?.bron || 'geen';
  const handmatig = f.bron === 'handmatig';
  const uboNodig = uboInvoerVereist(f.rechtsvorm, f.structuur);
  const handelsnamen = f.kvkProfiel?.handelsnamen || [];
  const uittreksels = (aanvraag?.documenten || []).filter((d) => d.soort === 'kvk_uittreksel');

  function kiesKvk(profiel, bronCode) {
    const v = profiel?.vestiging || {};
    zet({
      bron: bronCode,
      kvkNummer: profiel?.kvkNummer || '',
      bedrijfsnaam: profiel?.naam || '',
      vestiging: { straat: v.straat || '', huisnummer: v.huisnummer || '', postcode: v.postcode || '', plaats: v.plaats || '', land: v.land || 'NL' },
      sbiCodes: (profiel?.sbiCodes || []).map((s) => ({ code: String(s.code), omschrijving: s.omschrijving || '' })),
      sbiBevestigd: null,
      sbiOpmerking: '',
      kvkProfiel: profiel || null,
      handelsnaam: '',
      handelsnaamKeuze: null,
    });
    setGekozen(true);
  }

  function kiesHandmatig() {
    zet({ bron: 'handmatig', kvkProfiel: null, sbiCodes: [], sbiBevestigd: null, handelsnaamKeuze: null });
    setGekozen(true);
  }

  // Welke vragen staan nog open? Lege lijst = stap compleet.
  const ontbrekend = useMemo(() => {
    if (!gekozen || !f.bron) return ['bedrijfKiezen'];
    const m = [];
    const v = f.vestiging;
    const bedrijfOnvolledig = !/^\d{8}$/.test(f.kvkNummer) || f.bedrijfsnaam.trim().length < 2
      || !v.straat?.trim() || !v.huisnummer?.trim() || (v.postcode || '').trim().length < 4 || !v.plaats?.trim();
    if (bedrijfOnvolledig) m.push('bedrijfsgegevens');
    if (!f.rechtsvorm) m.push('rechtsvorm');
    if (f.rechtsvorm === 'overig' && !f.rechtsvormOverige.trim()) m.push('rechtsvormOverige');
    if (handelsnamen.length > 0 && f.handelsnaamKeuze === null) m.push('handelsnaamKeuze');
    if (f.handelsnaamKeuze === 'andere' && !f.handelsnaam.trim()) m.push('handelsnaam');
    if (!f.geenWebsite && !isUrl(naarUrl(f.website))) m.push('website');
    if (f.sbiCodes.length > 0 && f.sbiBevestigd === null) m.push('sbiBevestigd');
    if (f.sbiCodes.length > 0 && f.sbiBevestigd === false && !f.sbiOpmerking.trim()) m.push('sbiOpmerking');
    if (uboNodig && !f.ubos.every(uboGeldig)) m.push('ubos');
    return m;
  }, [f, gekozen, handelsnamen.length, uboNodig]);

  function bouwBody() {
    const handelsnaam = f.handelsnaamKeuze === 'deze' ? handelsnamen[0] : (f.handelsnaamKeuze === 'andere' ? f.handelsnaam.trim() : '');
    const body = {
      rechtsvorm: f.rechtsvorm,
      rechtsvormOverige: f.rechtsvorm === 'overig' ? f.rechtsvormOverige.trim() : '',
      structuur: f.structuur,
      kvkNummer: f.kvkNummer,
      bedrijfsnaam: f.bedrijfsnaam.trim(),
      handelsnaam,
      website: f.geenWebsite ? null : (f.website ? naarUrl(f.website) : ''),
      geenWebsite: !!f.geenWebsite,
      vestiging: {
        straat: f.vestiging.straat?.trim() || '',
        huisnummer: f.vestiging.huisnummer?.trim() || '',
        postcode: (f.vestiging.postcode || '').toUpperCase().trim(),
        plaats: f.vestiging.plaats?.trim() || '',
        land: f.vestiging.land || 'NL',
      },
      sbiCodes: f.sbiCodes,
      sbiBevestigd: handmatig ? false : !!f.sbiBevestigd,
      sbiOpmerking: handmatig ? f.hoofdactiviteit.trim() : (f.sbiBevestigd === false ? f.sbiOpmerking.trim() : ''),
      bron: f.bron,
      ubos: uboNodig ? f.ubos.filter(uboGeldig).map(uboNaarBody) : [],
    };
    return body;
  }

  function volledigeBody() {
    const b = bouwBody();
    // Optionele tekstvelden weglaten als ze leeg zijn (schema is strict, optionalText).
    if (!b.rechtsvormOverige) delete b.rechtsvormOverige;
    if (!b.handelsnaam) delete b.handelsnaam;
    if (!b.sbiOpmerking) delete b.sbiOpmerking;
    if (b.website === '') b.website = null;
    return b;
  }

  function gedeeltelijkeBody() {
    const b = compactBody(bouwBody());
    if (f.geenWebsite) b.website = null;
    if (!/^\d{8}$/.test(f.kvkNummer)) delete b.kvkNummer;
    if (b.bedrijfsnaam && b.bedrijfsnaam.length < 2) delete b.bedrijfsnaam;
    if (b.website && !isUrl(b.website)) delete b.website;
    if (!uboNodig) b.ubos = [];
    if (b.vestiging) {
      if (b.vestiging.postcode && b.vestiging.postcode.length < 4) delete b.vestiging.postcode;
      if (Object.keys(b.vestiging).length <= 1) delete b.vestiging; // alleen land
    }
    return b;
  }

  return (
    <KybStapKader
      nr={1}
      titel={t('kyb_stap1_titel')}
      onTerug={() => onTerug?.(gedeeltelijkeBody())}
      onLater={() => onLater?.(gedeeltelijkeBody())}
      onOpslaan={() => onOpslaan?.(volledigeBody())}
      ontbrekend={ontbrekend}
      bezig={bezig}
      serverFout={serverFout}
      opgeslagenOm={opgeslagenOm}
    >
      {!gekozen && (
        <KybVraag veld="bedrijfKiezen">
        <KvkZoeker
          beschikbaar={kvkBeschikbaar}
          bron={kvkBron}
          beginKvkNummer={bedrijf.kvkNummer || ''}
          onGekozen={kiesKvk}
          onHandmatig={kiesHandmatig}
        />
        </KybVraag>
      )}

      {gekozen && !handmatig && (
        <div className="rounded-md border border-brand-100 bg-brand-50 p-4 flex items-start gap-3">
          <Building className="w-6 h-6 text-brand-600 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-ink-1">{f.bedrijfsnaam}</div>
            <div className="text-xs text-ink-2">KvK {f.kvkNummer}</div>
            <div className="text-xs text-ink-2">
              {[f.vestiging.straat, f.vestiging.huisnummer].filter(Boolean).join(' ')}
              {f.vestiging.plaats ? `, ${f.vestiging.postcode} ${f.vestiging.plaats}` : ''}
            </div>
            {oefenmodus && f.bron === 'kvk_mock' && <span className="pill-warning mt-2">{t('kyb_kvk_oefendata')}</span>}
          </div>
          <button type="button" onClick={() => setGekozen(false)}
            className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4 min-h-[44px]">
            {t('kyb_kvk_ander_bedrijf')}
          </button>
        </div>
      )}

      {gekozen && handmatig && (
        <>
          <KybVraag veld="bedrijfsgegevens">
          <BedrijfHandmatig
            waarde={{ bedrijfsnaam: f.bedrijfsnaam, kvkNummer: f.kvkNummer, vestiging: f.vestiging, hoofdactiviteit: f.hoofdactiviteit }}
            onChange={(w) => zet({ bedrijfsnaam: w.bedrijfsnaam || '', kvkNummer: w.kvkNummer || '', vestiging: { ...f.vestiging, ...(w.vestiging || {}) }, hoofdactiviteit: w.hoofdactiviteit || '' })}
          />
          </KybVraag>
          <KybDocumentUpload
            soort="kvk_uittreksel"
            verplicht
            documenten={aanvraag?.documenten || []}
            uploadDocument={uploadDocument}
            verwijderDocument={verwijderDocument}
          />
          {kvkBeschikbaar && (
            <Knop variant="ghost" onClick={() => setGekozen(false)}>{t('kyb_kvk_ander_bedrijf')}</Knop>
          )}
        </>
      )}

      {gekozen && (
        <>
          <KybVraag veld={['rechtsvorm', 'rechtsvormOverige']} kop={t('kyb_rechtsvorm_vraag')}>
            <KeuzeGroep naam="rechtsvorm" label={t('kyb_rechtsvorm_vraag')} opties={KYB_OPTIES.RECHTSVORM}
              waarde={f.rechtsvorm} onChange={(rechtsvorm) => zet({ rechtsvorm })} kolommen={2} />
            {f.rechtsvorm === 'overig' && (
              <VeldGroep className="mt-2" label={t('kyb_rechtsvorm_overig_veld')} value={f.rechtsvormOverige}
                onChange={(e) => zet({ rechtsvormOverige: e.target.value })} maxLength={80} verplicht />
            )}
          </KybVraag>

          <div>
            <div className="text-sm font-medium text-ink-1 mb-2">{t('kyb_structuur_vraag')}</div>
            <KeuzeGroep naam="structuur" label={t('kyb_structuur_vraag')} opties={KYB_OPTIES.STRUCTUUR} meervoudig
              waarden={f.structuur} onChange={(structuur) => zet({ structuur })} />
          </div>

          {handelsnamen.length > 0 && (
            <KybVraag veld="handelsnaamKeuze" kop={t('kyb_handelsnaam_gevonden', { naam: handelsnamen[0] })}>
              <KeuzeGroep naam="handelsnaam" label={t('kyb_handelsnaam_label')} kolommen={2}
                opties={[{ waarde: 'deze', tKey: 'kyb_handelsnaam_deze' }, { waarde: 'andere', tKey: 'kyb_handelsnaam_andere' }]}
                waarde={f.handelsnaamKeuze} onChange={(handelsnaamKeuze) => zet({ handelsnaamKeuze })} />
            </KybVraag>
          )}
          {(handelsnamen.length === 0 || f.handelsnaamKeuze === 'andere') && (
            <KybVeldGroep veld="handelsnaam" label={t('kyb_handelsnaam_label')} value={f.handelsnaam}
              onChange={(e) => zet({ handelsnaam: e.target.value, handelsnaamKeuze: handelsnamen.length ? 'andere' : f.handelsnaamKeuze })}
              maxLength={150} verplicht={f.handelsnaamKeuze === 'andere'} />
          )}

          <div className="space-y-2">
            <KybVeldGroep veld="website" label={t('kyb_website_label')} type="text" inputMode="url" value={f.website}
              onChange={(e) => zet({ website: e.target.value })} disabled={f.geenWebsite} maxLength={200}
              placeholder="https://" verplicht={!f.geenWebsite} />
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={f.geenWebsite} onChange={(e) => zet({ geenWebsite: e.target.checked, website: e.target.checked ? '' : f.website })}
                className="h-5 w-5 rounded border-border-strong accent-brand-600" />
              <span className="text-sm text-ink-1">{t('kyb_website_geen')}</span>
            </label>
          </div>

          {f.sbiCodes.length > 0 && (
            <KybVraag veld={['sbiBevestigd', 'sbiOpmerking']}>
              <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-2">{t('kyb_sbi_kop')}</h3>
              <ul className="text-sm text-ink-1 space-y-1 mb-3">
                {f.sbiCodes.map((s) => (
                  <li key={s.code} className="flex gap-2"><span className="font-mono text-ink-3">{s.code}</span><span>{s.omschrijving}</span></li>
                ))}
              </ul>
              <div className="text-sm font-medium text-ink-1 mb-2">{t('kyb_sbi_vraag')}</div>
              <KeuzeGroep naam="sbi" label={t('kyb_sbi_vraag')} opties={JA_NEE} kolommen={2}
                waarde={f.sbiBevestigd} onChange={(sbiBevestigd) => zet({ sbiBevestigd })} />
              {f.sbiBevestigd === false && (
                <VeldGroep className="mt-2" as="textarea" label={t('kyb_sbi_opmerking')} value={f.sbiOpmerking}
                  onChange={(e) => zet({ sbiOpmerking: e.target.value })} maxLength={300} verplicht />
              )}
            </KybVraag>
          )}

          {f.rechtsvorm && (
            uboNodig ? (
              <KybVraag veld="ubos"><UboLijst ubos={f.ubos} onChange={(ubos) => zet({ ubos })} /></KybVraag>
            ) : (
              <p className="text-sm text-ink-2 rounded-md bg-surface-2 border border-border px-3.5 py-3">{t('kyb_ubo_jij_automatisch')}</p>
            )
          )}

          {handmatig && uittreksels.length === 0 && (
            <p className="text-xs text-ink-3">{t('kyb_document_ontbreekt', { soort: t('kyb_uittreksel_label') })}</p>
          )}
        </>
      )}
    </KybStapKader>
  );
}
