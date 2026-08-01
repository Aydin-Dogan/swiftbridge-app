/**
 * Overschrijven.jsx — bank-stijl overboekingsformulier (OVZ-4, bouwbrief §1).
 * Eén pagina met vier secties: Van / Naar / Betaling / Inplannen.
 *
 * Gedrag per planning:
 *  - Eenmalig, uitvoerdatum = vandaag  → hand-off naar de bestaande betaalflow
 *    (localStorage 'swiftbridge_repeat_tx' + navigate 'betaling'); daar kiest
 *    de gebruiker de betaalmethode en bevestigt (incl. PIN/SCA).
 *  - Eenmalig, latere datum            → POST /opdrachten (geplande opdracht;
 *    de backend-cron voert uit op de uitvoerdatum).
 *  - Periodiek                         → POST /recurring (bestaande engine).
 *
 * Omschrijving óf betalingskenmerk (toggle) reist mee met geplande en
 * periodieke opdrachten. "Opslaan als concept" schrijft de PII-vrije
 * payment-draft (alleen bedrag/valuta) die de Verzendlijst toont.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch, parseError } from '../../services/api';
import { VALUTAS } from '../../services/currencies';
import { LANDEN } from '../kyc/landen';
import Card from '../ui/Card';
import Knop from '../ui/Knop';
import VeldGroep from '../ui/VeldGroep';
import { Send, Calendar, Check } from '../icons/Icons';

// ── IBAN validatie (mod-97) — zelfde patroon als BeneficiaryFormulier ──────
const IBAN_LENGTES = {
  TR: 26, NL: 18, DE: 22, BE: 16, FR: 27, GB: 22, AT: 20, ES: 24, IT: 27, PL: 28,
  AZ: 28, KZ: 20, UZ: 29, TM: 23, KG: 22,
};
function valideerIban(iban) {
  const schoon = String(iban || '').replace(/\s/g, '').toUpperCase();
  if (schoon.length < 4) return { geldig: false };
  const land = schoon.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(land)) return { geldig: false };
  const verwacht = IBAN_LENGTES[land];
  if (verwacht && schoon.length !== verwacht) return { geldig: false };
  if (!verwacht && (schoon.length < 15 || schoon.length > 34)) return { geldig: false };
  const herschikt = schoon.slice(4) + schoon.slice(0, 4);
  let rest = 0;
  for (const c of herschikt) {
    const code = c.charCodeAt(0);
    const stuk = code >= 65 ? (code - 55).toString() : c;
    for (const cijfer of stuk) rest = (rest * 10 + parseInt(cijfer, 10)) % 97;
  }
  return { geldig: rest === 1 };
}

// Spiegel van de backend corridor-koppeling (routes/opdrachten.js)
const CORRIDOR_LANDEN = {
  TRY: ['TR'], AZN: ['AZ'], KZT: ['KZ'], UZS: ['UZ'], TMT: ['TM'], KGS: ['KG'], TJS: ['TJ'],
  GBP: ['GB'], EUR: ['NL', 'DE', 'BE', 'FR', 'AT', 'ES', 'IT', 'PL'],
};
const BACKEND_VALUTAS = ['TRY', 'AZN', 'KZT', 'UZS', 'TMT', 'KGS', 'TJS', 'USD', 'EUR', 'GBP', 'MAD'];
const LIVE_VALUTAS = VALUTAS.filter(v => v.status === 'live' && BACKEND_VALUTAS.includes(v.code));

const KENMERK_RE = /^[A-Za-z0-9 \-\/]{1,35}$/;
const MIN_BEDRAG = 50;
const MAX_BEDRAG = 5000;

function landNaam(code) {
  return LANDEN.find(l => l.code === code)?.naam || code;
}

function vandaagStr() {
  return new Date().toISOString().slice(0, 10);
}

function maxDatumStr() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 366);
  return d.toISOString().slice(0, 10);
}

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

const labelKlasse = 'block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2';

export default function Overschrijven() {
  const { t } = useTaal();

  // Naar
  const [ontvangers, setOntvangers] = useState([]);
  const [gekozenId, setGekozenId] = useState('');
  const [naam, setNaam] = useState('');
  const [iban, setIban] = useState('');
  const [bank, setBank] = useState('');
  const [bewaren, setBewaren] = useState(false);
  // Betaling
  const [bedrag, setBedrag] = useState('');
  const [valuta, setValuta] = useState('TRY');
  const [land, setLand] = useState('TR');
  const [omsType, setOmsType] = useState('omschrijving'); // 'omschrijving' | 'kenmerk'
  const [omschrijving, setOmschrijving] = useState('');
  const [kenmerk, setKenmerk] = useState('');
  // Inplannen
  const [planType, setPlanType] = useState('eenmalig'); // 'eenmalig' | 'periodiek'
  const [datum, setDatum] = useState(vandaagStr());
  const [frequentie, setFrequentie] = useState('maandelijks');
  // Status
  const [fouten, setFouten] = useState({});
  const [bezig, setBezig] = useState(false);
  const [serverFout, setServerFout] = useState('');
  const [conceptOk, setConceptOk] = useState(false);
  const [klaar, setKlaar] = useState(null); // { type: 'gepland'|'periodiek', datum }
  const [annuleerModal, setAnnuleerModal] = useState(false);

  useEffect(() => {
    let weg = false;
    apiFetch('/beneficiaries')
      .then(d => { if (!weg) setOntvangers(d?.beneficiaries || []); })
      .catch(() => { if (!weg) setOntvangers([]); });
    return () => { weg = true; };
  }, []);

  const corridorLanden = CORRIDOR_LANDEN[valuta] || ['TR'];
  useEffect(() => {
    if (!corridorLanden.includes(land)) setLand(corridorLanden[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuta]);

  const ibanCheck = useMemo(() => (iban ? valideerIban(iban) : null), [iban]);
  const isVandaag = planType === 'eenmalig' && datum === vandaagStr();

  function kiesOntvanger(id) {
    setGekozenId(id);
    const b = ontvangers.find(o => o.id === id);
    if (b) {
      setNaam(b.naam || '');
      setIban(b.iban || '');
      setBank(b.bank || '');
      if (b.valuta && LIVE_VALUTAS.some(v => v.code === b.valuta)) setValuta(b.valuta);
      setBewaren(false);
    } else {
      setNaam(''); setIban(''); setBank('');
    }
  }

  function valideer() {
    const f = {};
    if (!naam || naam.trim().length < 2) f.naam = t('ovs_naam_fout');
    if (!iban || !valideerIban(iban).geldig) f.iban = t('ovs_iban_fout');
    const b = Number(String(bedrag).replace(',', '.'));
    if (!isFinite(b) || b < MIN_BEDRAG || b > MAX_BEDRAG) f.bedrag = t('ovs_bedrag_fout');
    if (omsType === 'kenmerk' && kenmerk && !KENMERK_RE.test(kenmerk)) f.kenmerk = t('ovs_kenmerk_fout');
    if (planType === 'eenmalig') {
      if (!datum || datum < vandaagStr() || datum > maxDatumStr()) f.datum = t('ovs_datum_fout');
    } else {
      if (!datum || datum < vandaagStr()) f.datum = t('ovs_datum_fout');
    }
    setFouten(f);
    return Object.keys(f).length === 0;
  }

  async function bewaarInAdresboek() {
    // Best-effort — een mislukte adresboek-save mag de opdracht niet blokkeren.
    try {
      await apiFetch('/beneficiaries', {
        method: 'POST',
        body: { naam: naam.trim(), iban: iban.replace(/\s/g, '').toUpperCase(), bank: bank || null, valuta, land },
      });
    } catch { /* stil */ }
  }

  async function verstuur() {
    setServerFout('');
    setConceptOk(false);
    if (!valideer()) return;
    const b = Number(String(bedrag).replace(',', '.'));

    // Vandaag = direct: hand-off naar de betaalflow (methode + bevestiging daar).
    if (isVandaag) {
      if (bewaren && !gekozenId) await bewaarInAdresboek();
      localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
        ontvanger: naam.trim(), iban: iban.replace(/\s/g, '').toUpperCase(),
        bedrag: b, valuta,
      }));
      window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
      return;
    }

    setBezig(true);
    try {
      if (planType === 'periodiek') {
        const start = new Date(`${datum}T00:00:00.000Z`);
        const body = {
          naam: `${naam.trim()} — ${t(`gepland_freq_${frequentie}`)}`,
          bedragEur: b,
          ontvangerNaam: naam.trim(),
          ontvangerIban: iban.replace(/\s/g, '').toUpperCase(),
          ontvangerBank: bank || undefined,
          valuta, land, frequentie,
          startOp: start.toISOString(),
        };
        if (frequentie === 'maandelijks') body.dagVanMaand = start.getUTCDate();
        if (frequentie === 'wekelijks') body.dagVanWeek = start.getUTCDay();
        const res = await apiFetch('/recurring', { method: 'POST', body });
        if (bewaren && !gekozenId) await bewaarInAdresboek();
        setKlaar({ type: 'periodiek', datum: (res?.recurring?.volgendeUitvoering || start.toISOString()).slice(0, 10) });
      } else {
        const body = {
          bedragEur: b,
          ontvangerNaam: naam.trim(),
          ontvangerIban: iban.replace(/\s/g, '').toUpperCase(),
          ontvangerBank: bank || undefined,
          valuta, land,
          uitvoerenOp: `${datum}T00:00:00.000Z`,
        };
        if (omsType === 'omschrijving' && omschrijving.trim()) body.omschrijving = omschrijving.trim();
        if (omsType === 'kenmerk' && kenmerk.trim()) body.betalingskenmerk = kenmerk.trim();
        if (gekozenId) body.beneficiaryId = gekozenId;
        await apiFetch('/opdrachten', { method: 'POST', body });
        if (bewaren && !gekozenId) await bewaarInAdresboek();
        setKlaar({ type: 'gepland', datum });
      }
    } catch (err) {
      setServerFout(parseError(err, t) || t('ovs_fout_opslaan'));
    } finally {
      setBezig(false);
    }
  }

  function conceptOpslaan() {
    // PII-regel: géén IBAN/naam in sessionStorage — zelfde draft-shape als PaymentFlow.
    try {
      sessionStorage.setItem('swiftbridge_payment_draft_v2', JSON.stringify({
        bedrag: String(bedrag || ''), valuta, opgeslagen_op: Date.now(),
      }));
      setConceptOk(true);
    } catch { /* stil */ }
  }

  function reset() {
    setGekozenId(''); setNaam(''); setIban(''); setBank(''); setBewaren(false);
    setBedrag(''); setOmschrijving(''); setKenmerk(''); setOmsType('omschrijving');
    setPlanType('eenmalig'); setDatum(vandaagStr()); setFrequentie('maandelijks');
    setFouten({}); setServerFout(''); setConceptOk(false); setKlaar(null);
  }

  // ── Succes-scherm ─────────────────────────────────────────────────────────
  if (klaar) {
    return (
      <div className="space-y-4 max-w-xl">
        <h1 className="font-display text-2xl text-ink-1">{t('ovs_titel')}</h1>
        <Card size="lg" variant="success" className="text-center space-y-3">
          <span className="mx-auto w-12 h-12 rounded-full bg-success-50 flex items-center justify-center" aria-hidden="true">
            <Check className="w-6 h-6 text-success-600" />
          </span>
          <h2 className="font-display font-medium text-lg text-ink-1">
            {klaar.type === 'periodiek' ? t('ovs_ok_periodiek_titel') : t('ovs_ok_gepland_titel')}
          </h2>
          <p className="text-sm text-ink-2">
            {klaar.type === 'periodiek'
              ? t('ovs_ok_periodiek_tekst', { datum: klaar.datum })
              : t('ovs_ok_gepland_tekst', { datum: klaar.datum })}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <Knop onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betalingen_gepland' }))}>
              {t('ovs_naar_ingepland')}
            </Knop>
            <Knop variant="secondary" onClick={reset}>{t('ovs_nog_een')}</Knop>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="font-display text-2xl text-ink-1">{t('ovs_titel')}</h1>

      {/* ── Van ── */}
      <Card size="lg" as="section" aria-label={t('ovs_van')}>
        <h2 className={labelKlasse}>{t('ovs_van')}</h2>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Send className="w-4 h-4 text-brand-600" />
          </span>
          <div>
            <div className="font-semibold text-ink-1 text-sm">{t('rekening_kaart_naam')}</div>
            <div className="text-[11px] text-ink-3">{t('ovs_hoofdrekening')}</div>
          </div>
        </div>
      </Card>

      {/* ── Naar ── */}
      <Card size="lg" as="section" aria-label={t('ovs_naar')} className="space-y-4">
        <h2 className={labelKlasse}>{t('ovs_naar')}</h2>

        {ontvangers.length > 0 && (
          <div>
            <label htmlFor="ovs-adresboek" className={labelKlasse}>{t('ovs_adresboek')}</label>
            <select id="ovs-adresboek" value={gekozenId} onChange={e => kiesOntvanger(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-3 outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm">
              <option value="">{t('ovs_adresboek_kies')}</option>
              {ontvangers.map(o => (
                <option key={o.id} value={o.id}>{o.bijnaam || o.naam} — {o.iban}</option>
              ))}
            </select>
          </div>
        )}

        <VeldGroep label={t('ovs_ontvanger_naam')} verplicht fout={fouten.naam}
          value={naam} onChange={e => { setNaam(e.target.value); setGekozenId(''); }} autoComplete="off" />

        <VeldGroep label={t('ovs_iban')} verplicht fout={fouten.iban}
          className={`font-mono text-sm ${ibanCheck ? (ibanCheck.geldig ? 'border-success-500 bg-success-50' : 'border-red-300 bg-red-50') : ''}`}
          value={iban} onChange={e => { setIban(e.target.value.toUpperCase()); setGekozenId(''); }}
          autoComplete="off" spellCheck={false} />

        {!gekozenId && (
          <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer select-none">
            <input type="checkbox" checked={bewaren} onChange={e => setBewaren(e.target.checked)}
              className="w-4 h-4 rounded border-border text-brand-600 focus:ring-brand-300" />
            {t('ovs_bewaar_adresboek')}
          </label>
        )}
      </Card>

      {/* ── Betaling ── */}
      <Card size="lg" as="section" aria-label={t('ovs_betaling')} className="space-y-4">
        <h2 className={labelKlasse}>{t('ovs_betaling')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <VeldGroep label={t('ovs_bedrag')} verplicht hint={t('ovs_bedrag_hint')} fout={fouten.bedrag}
            type="number" min={MIN_BEDRAG} max={MAX_BEDRAG} step="0.01" inputMode="decimal"
            value={bedrag} onChange={e => setBedrag(e.target.value)} />
          <div>
            <label htmlFor="ovs-valuta" className={labelKlasse}>{t('ovs_valuta')}</label>
            <select id="ovs-valuta" value={valuta} onChange={e => setValuta(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-3 outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm">
              {LIVE_VALUTAS.map(v => (
                <option key={v.code} value={v.code}>{v.code} — {v.naam}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="ovs-land" className={labelKlasse}>{t('ovs_land')}</label>
          <select id="ovs-land" value={land} onChange={e => setLand(e.target.value)}
            className="w-full border border-border rounded-md px-4 py-3 outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm">
            {corridorLanden.map(c => (
              <option key={c} value={c}>{landNaam(c)}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex gap-1.5 mb-2" role="tablist" aria-label={t('ovs_omschrijving')}>
            {[['omschrijving', t('ovs_omschrijving')], ['kenmerk', t('ovs_kenmerk')]].map(([w, label]) => (
              <button key={w} type="button" role="tab" aria-selected={omsType === w} onClick={() => setOmsType(w)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                  ${omsType === w ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-2 border-border hover:border-brand-300'}`}>
                {label}
              </button>
            ))}
          </div>
          {omsType === 'omschrijving' ? (
            <VeldGroep label={t('ovs_omschrijving')} value={omschrijving} maxLength={140}
              onChange={e => setOmschrijving(e.target.value)} autoComplete="off" />
          ) : (
            <VeldGroep label={t('ovs_kenmerk')} hint={t('ovs_kenmerk_hint')} fout={fouten.kenmerk}
              value={kenmerk} maxLength={35} onChange={e => setKenmerk(e.target.value)}
              autoComplete="off" spellCheck={false} className="font-mono text-sm" />
          )}
        </div>
      </Card>

      {/* ── Inplannen ── */}
      <Card size="lg" as="section" aria-label={t('ovs_inplannen')} className="space-y-4">
        <h2 className={labelKlasse}>{t('ovs_inplannen')}</h2>

        <div className="flex gap-1.5" role="tablist" aria-label={t('ovs_inplannen')}>
          {[['eenmalig', t('ovs_eenmalig')], ['periodiek', t('ovs_periodiek')]].map(([w, label]) => (
            <button key={w} type="button" role="tab" aria-selected={planType === w} onClick={() => setPlanType(w)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${planType === w ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-2 border-border hover:border-brand-300'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <VeldGroep
            label={planType === 'periodiek' ? t('ovs_startdatum') : t('ovs_uitvoerdatum')}
            verplicht fout={fouten.datum}
            hint={planType === 'eenmalig' ? t('ovs_datum_hint') : undefined}
            type="date" min={vandaagStr()} max={maxDatumStr()}
            value={datum} onChange={e => setDatum(e.target.value)} />
          {planType === 'periodiek' && (
            <div>
              <label htmlFor="ovs-freq" className={labelKlasse}>{t('ovs_frequentie')}</label>
              <select id="ovs-freq" value={frequentie} onChange={e => setFrequentie(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-3 outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition text-sm">
                {['dagelijks', 'wekelijks', 'maandelijks'].map(f => (
                  <option key={f} value={f}>{t(`gepland_freq_${f}`)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {planType === 'eenmalig' && !isVandaag && bedrag && (
          <p className="flex items-center gap-2 text-xs text-ink-3">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {t('ovs_ok_gepland_tekst', { datum })}
          </p>
        )}
      </Card>

      {serverFout && (
        <p role="alert" className="text-sm text-fg-error bg-red-50 border border-red-200 rounded-md px-4 py-3">{serverFout}</p>
      )}
      {conceptOk && (
        <p role="status" className="text-sm text-success-700 bg-success-50 border border-success-100 rounded-md px-4 py-3">{t('ovs_concept_ok')}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Knop onClick={verstuur} laden={bezig}>
          {planType === 'periodiek' ? t('ovs_periodiek_instellen') : (isVandaag ? t('ovs_versturen') : t('ovs_knop_inplannen'))}
        </Knop>
        <Knop variant="secondary" onClick={conceptOpslaan} disabled={bezig}>{t('ovs_concept')}</Knop>
        <Knop variant="ghost" onClick={() => setAnnuleerModal(true)} disabled={bezig}>{t('annuleren')}</Knop>
      </div>
      {bedrag && Number(String(bedrag).replace(',', '.')) >= MIN_BEDRAG && (
        <p className="text-[11px] text-ink-3">
          {t('ovs_van')}: {t('rekening_kaart_naam')} · {fmtEur(Number(String(bedrag).replace(',', '.')))} → {naam || '—'}
        </p>
      )}

      {/* ── "Weet je het zeker?"-modal bij annuleren ── */}
      {annuleerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-label={t('ovs_annuleer_titel')}
          onClick={() => setAnnuleerModal(false)}>
          <div className="bg-surface rounded-md shadow-soft-xl border border-border w-full max-w-sm p-6 space-y-4 animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-medium text-lg text-brand-700">{t('ovs_annuleer_titel')}</h2>
            <p className="text-sm text-ink-2">{t('ovs_annuleer_tekst')}</p>
            <div className="flex gap-2">
              <Knop variant="destructive"
                onClick={() => { setAnnuleerModal(false); reset(); window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'dashboard' })); }}>
                {t('ovs_annuleer_ja')}
              </Knop>
              <Knop variant="secondary" onClick={() => setAnnuleerModal(false)}>{t('ovs_annuleer_nee')}</Knop>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
