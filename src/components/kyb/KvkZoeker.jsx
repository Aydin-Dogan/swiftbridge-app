/**
 * KvkZoeker.jsx — bedrijf zoeken in het Handelsregister (of de oefen-mock).
 *
 * Props:
 *   beschikbaar     kvk.beschikbaar uit GET /kyb/aanvraag
 *   bron            'mock' | 'kvk' | 'geen'
 *   beginKvkNummer  KvK-nummer uit de registratie: dan eerst "Is dit je bedrijf?"
 *   onGekozen       (bedrijfProfiel, bronCode) => void  (bronCode: 'kvk' | 'kvk_mock')
 *   onHandmatig     () => void — klant vult de gegevens zelf in
 */
import { useEffect, useRef, useState } from 'react';
import { useTaal } from '../../i18n';
import { parseError } from '../../services/api';
import { zoekKvk, haalKvkBasisprofiel } from '../../services/kyb';
import { Building, Search } from '../icons/Icons';
import { VeldGroep, Knop } from '../ui';

function adresRegel(v) {
  if (!v) return '';
  const straat = [v.straat, v.huisnummer].filter(Boolean).join(' ');
  return [straat, [v.postcode, v.plaats].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

function BedrijfKaart({ bedrijf, kop, children }) {
  return (
    <div className="rounded-md border border-brand-100 bg-brand-50 p-4 space-y-2">
      {kop && <div className="font-display text-lg text-ink-1">{kop}</div>}
      <div className="flex items-start gap-3">
        <Building className="w-6 h-6 text-brand-600 flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <div className="font-semibold text-ink-1">{bedrijf.naam}</div>
          <div className="text-xs text-ink-2">KvK {bedrijf.kvkNummer}</div>
          {adresRegel(bedrijf.vestiging || bedrijf) && (
            <div className="text-xs text-ink-2">{adresRegel(bedrijf.vestiging || bedrijf)}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function KvkZoeker({ beschikbaar = true, bron = 'kvk', beginKvkNummer = '', onGekozen, onHandmatig }) {
  const { t } = useTaal();
  const bronCode = bron === 'mock' ? 'kvk_mock' : 'kvk';
  const [q, setQ] = useState('');
  const [resultaten, setResultaten] = useState(null); // null = nog niet gezocht
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [nietBeschikbaar, setNietBeschikbaar] = useState(!beschikbaar);
  const [voorstel, setVoorstel] = useState(null); // basisprofiel uit registratie-kvk
  // Prefill: geldig KvK-nummer uit de registratie (8 cijfers) zolang het Handelsregister beschikbaar is.
  const prefillNr = beschikbaar && /^\d{8}$/.test(beginKvkNummer || '') ? beginKvkNummer : '';
  const [voorstelBezig, setVoorstelBezig] = useState(!!prefillNr);
  const [vorigPrefillNr, setVorigPrefillNr] = useState(prefillNr);
  const weg = useRef(false);

  // Verandert de prefill (props), dan begint het voorstel opnieuw (state afleiden tijdens render).
  if (vorigPrefillNr !== prefillNr) {
    setVorigPrefillNr(prefillNr);
    setVoorstel(null);
    setVoorstelBezig(!!prefillNr);
  }

  useEffect(() => {
    weg.current = false;
    return () => { weg.current = true; };
  }, []);

  // Prefill: KvK-nummer uit de registratie -> "Is dit je bedrijf?" (state alleen in de promise-callbacks)
  useEffect(() => {
    if (!prefillNr) return undefined;
    let actief = true;
    haalKvkBasisprofiel(prefillNr)
      .then((d) => { if (actief && d?.bedrijf) setVoorstel(d.bedrijf); })
      .catch((e) => {
        if (!actief) return;
        if (e?.status === 503 || e?.errorCode === 'KYB_KVK_NIET_BESCHIKBAAR') setNietBeschikbaar(true);
        else setQ(prefillNr);
      })
      .finally(() => { if (actief) setVoorstelBezig(false); });
    return () => { actief = false; };
  }, [prefillNr]);

  function wijzigZoekterm(waarde) {
    setQ(waarde);
    if (waarde.trim().length < 2) setResultaten(null); // te kort: oude resultaten niet laten staan
  }

  // Zoeken met debounce 400 ms (min. 2 tekens)
  useEffect(() => {
    if (nietBeschikbaar || voorstel) return undefined;
    const term = q.trim();
    if (term.length < 2) return undefined;
    let actief = true;
    const timer = setTimeout(async () => {
      setBezig(true);
      setFout('');
      try {
        const d = await zoekKvk(term);
        if (actief) setResultaten(Array.isArray(d?.resultaten) ? d.resultaten : []);
      } catch (e) {
        if (!actief) return;
        if (e?.status === 503 || e?.errorCode === 'KYB_KVK_NIET_BESCHIKBAAR') setNietBeschikbaar(true);
        else { setFout(parseError(e, t)); setResultaten([]); }
      } finally {
        if (actief) setBezig(false);
      }
    }, 400);
    return () => { actief = false; clearTimeout(timer); };
  }, [q, nietBeschikbaar, voorstel, t]);

  async function kiesResultaat(r) {
    setBezig(true);
    setFout('');
    try {
      const d = await haalKvkBasisprofiel(r.kvkNummer);
      if (weg.current) return;
      onGekozen?.(d?.bedrijf || naarProfiel(r), bronCode);
    } catch (e) {
      if (weg.current) return;
      if (e?.status === 503 || e?.errorCode === 'KYB_KVK_NIET_BESCHIKBAAR') { setNietBeschikbaar(true); return; }
      // Basisprofiel niet beschikbaar (bv. niet ingeschakeld): zoekresultaat volstaat.
      onGekozen?.(naarProfiel(r), bronCode);
    } finally {
      if (!weg.current) setBezig(false);
    }
  }

  function naarProfiel(r) {
    return {
      kvkNummer: r.kvkNummer,
      naam: r.naam,
      handelsnamen: [],
      rechtsvormKvk: r.type || null,
      vestiging: { straat: r.straat || '', huisnummer: r.huisnummer || '', postcode: r.postcode || '', plaats: r.plaats || '', land: 'NL' },
      sbiCodes: [],
      opgehaaldOp: null,
    };
  }

  if (nietBeschikbaar) {
    return (
      <div className="space-y-3">
        <div role="status" className="rounded-md border border-border-warning bg-surface px-4 py-3 text-sm text-ink-1">
          {t('kyb_kvk_niet_beschikbaar')}
        </div>
        <Knop variant="primary" size="lg" fullWidth onClick={() => onHandmatig?.()}>
          {t('kyb_handmatig_knop')}
        </Knop>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bron === 'mock' && (
        <div className="space-y-1">
          <span className="pill-warning">{t('kyb_kvk_oefendata')}</span>
          <p className="text-xs text-ink-3">{t('kyb_kvk_oefen_uitleg')}</p>
        </div>
      )}

      {voorstelBezig && <p className="text-sm text-ink-3">{t('laden')}</p>}

      {voorstel && (
        <BedrijfKaart bedrijf={voorstel} kop={t('kyb_kvk_is_dit_je_bedrijf')}>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={() => onGekozen?.(voorstel, bronCode)}
              className="btn-inst min-h-[48px] px-5 flex-1"
            >
              {t('kyb_kvk_bevestig')}
            </button>
            <Knop variant="secondary" size="lg" onClick={() => { setVoorstel(null); setQ(''); }}>
              {t('kyb_kvk_ander_bedrijf')}
            </Knop>
          </div>
        </BedrijfKaart>
      )}

      {!voorstel && !voorstelBezig && (
        <>
          <VeldGroep
            label={t('kyb_kvk_zoek_label')}
            hint={t('kyb_kvk_zoek_hint')}
            value={q}
            onChange={(e) => wijzigZoekterm(e.target.value)}
            autoComplete="off"
            inputMode="search"
            leading={<Search className="w-4 h-4" aria-hidden="true" />}
            fout={fout || undefined}
          />
          {bezig && <p className="text-xs text-ink-3">{t('laden')}</p>}
          {resultaten && resultaten.length === 0 && !bezig && (
            <p role="status" className="text-sm text-ink-2">{t('kyb_kvk_geen_resultaat')}</p>
          )}
          {resultaten && resultaten.length > 0 && (
            <ul className="divide-y divide-border-subtle border border-border rounded-md overflow-hidden" aria-label={t('kyb_kvk_zoek_label')}>
              {resultaten.map((r) => (
                <li key={`${r.kvkNummer}-${r.naam}`}>
                  <button
                    type="button"
                    onClick={() => kiesResultaat(r)}
                    disabled={bezig}
                    className="w-full flex items-center gap-3 text-left px-3.5 py-3 min-h-[56px] hover:bg-surface-2 transition disabled:opacity-60"
                  >
                    <Building className="w-5 h-5 text-brand-600 flex-shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink-1 truncate">{r.naam}</span>
                      <span className="block text-xs text-ink-3">
                        KvK {r.kvkNummer}{r.plaats ? ` - ${r.plaats}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onHandmatig?.()}
            className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4 min-h-[44px]"
          >
            {t('kyb_handmatig_knop')}
          </button>
        </>
      )}
    </div>
  );
}
