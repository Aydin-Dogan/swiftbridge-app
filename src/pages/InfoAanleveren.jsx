import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { Info, Check, Camera, Photo, Shield, AlertTriangle } from '../components/icons/Icons';

/**
 * InfoAanleveren.jsx — "Info nodig"-flow, klantkant (Wwft/compliance).
 *
 * Compliance heeft een transactie gemarkeerd; de klant levert hier categorie +
 * bewijsfoto (camera of bibliotheek) + korte omschrijving aan. Mobiel-eerst,
 * touch-targets >= 44px, naar het goedgekeurde voorbeeld
 * (SwiftBridge-info-aanleveren-mobiel.html). Route: /app/transactie-info/:transactieId
 * (push-notificatie en e-mail wijzen hierheen).
 */

const CATEGORIEEN = [
  ['salaris', 'Salaris'], ['loonspecificatie', 'Loonspecificatie'], ['factuur', 'Factuur'],
  ['cadeau', 'Cadeau'], ['giftcard', 'Giftcard'], ['benzine', 'Benzine'],
  ['spaargeld', 'Spaargeld'], ['verkoop', 'Verkoop'], ['anders', 'Anders'],
];

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function DetailRij({ label, waarde, waardeKleur = 'text-ink-1' }) {
  return (
    <div className="flex justify-between items-center px-3.5 py-2.5 text-sm border-b border-border last:border-b-0">
      <span className="text-ink-3">{label}</span>
      <span className={`font-semibold ${waardeKleur}`}>{waarde}</span>
    </div>
  );
}

export default function InfoAanleveren() {
  const navigate = useNavigate();
  const { transactieId } = useParams();

  const [fase, setFase] = useState('laden'); // laden | geen | intro | formulier | klaar | uitslag
  const [verzoek, setVerzoek] = useState(null);
  const [categorie, setCategorie] = useState(null);
  const [omschrijving, setOmschrijving] = useState('');
  const [bestand, setBestand] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const cameraRef = useRef(null);
  const bibliotheekRef = useRef(null);

  useEffect(() => {
    let weg = false;
    apiFetch(`/info-verzoeken/${transactieId}`)
      .then((d) => {
        if (weg) return;
        if (!d?.verzoek) { setFase('geen'); return; }
        setVerzoek(d.verzoek);
        if (d.verzoek.status === 'wachtend') setFase('intro');
        else if (d.verzoek.status === 'ingediend') setFase('klaar');
        else setFase('uitslag'); // vrijgegeven / afgewezen
      })
      .catch(() => { if (!weg) setFase('geen'); });
    return () => { weg = true; };
  }, [transactieId]);

  function kiesBestand(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setFout('Foto is te groot (max 5 MB).'); return; }
    setFout('');
    setBestand(f);
  }

  async function verstuur() {
    if (!categorie) { setFout('Kies eerst een categorie.'); return; }
    if (omschrijving.trim().length < 5) { setFout('Geef een korte omschrijving (minimaal 5 tekens).'); return; }
    setBezig(true); setFout('');
    try {
      const form = new FormData();
      form.append('categorie', categorie);
      form.append('omschrijving', omschrijving.trim());
      if (bestand) form.append('bewijs', bestand);
      await apiFetch(`/info-verzoeken/${transactieId}`, { method: 'POST', body: form });
      setFase('klaar');
    } catch (e) {
      setFout(e.message || 'Versturen mislukt. Probeer het opnieuw.');
    } finally { setBezig(false); }
  }

  const tx = verzoek?.transactie;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Navy top-balk zoals het prototype */}
      <div className="bg-brand-500 text-white px-4 py-3.5 flex items-center gap-3">
        <button onClick={() => navigate('/app')} aria-label="Terug"
          className="text-brand-100 text-xl leading-none w-11 h-11 -my-2 -ml-2 flex items-center justify-center">
          &#8249;
        </button>
        <span className="font-display font-bold">
          {fase === 'intro' || fase === 'laden' || fase === 'geen' ? 'Transactie' : 'Informatie aanleveren'}
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 pb-10">

        {fase === 'laden' && <p className="text-ink-2 text-sm text-center py-10">Laden…</p>}

        {fase === 'geen' && (
          <div className="text-center py-10">
            <p className="text-ink-2 text-sm mb-6">Er staat geen informatieverzoek open voor deze transactie.</p>
            <button onClick={() => navigate('/app')} className="btn-inst w-full py-3.5">Naar mijn overzicht</button>
          </div>
        )}

        {/* Scherm 1 — transactie met status "Info nodig" */}
        {fase === 'intro' && tx && (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Info className="w-3.5 h-3.5" /> Info nodig
            </span>
            <h2 className="font-display text-xl font-bold text-ink-1 mt-3 mb-1">Naar {tx.ontvangerNaam}</h2>
            <p className="text-ink-2 text-sm mb-4">
              We hebben aanvullende informatie nodig voor deze overboeking (wettelijk verplichte controle).
              {verzoek.reden ? <> Reden: {verzoek.reden}.</> : null}
            </p>
            <div className="border border-border rounded-xl overflow-hidden mb-5 bg-surface">
              <DetailRij label="Bedrag" waarde={fmtEur(tx.eurBedrag)} />
              <DetailRij label="Datum" waarde={(tx.datum || '').slice(0, 10)} />
              <DetailRij label="Referentie" waarde={tx.referentie || transactieId.slice(0, 8)} />
              <DetailRij label="Status" waarde="Wacht op jouw info" waardeKleur="text-amber-700" />
            </div>
            <button onClick={() => setFase('formulier')}
              className="w-full py-3.5 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition-colors">
              Informatie aanleveren
            </button>
          </>
        )}

        {/* Scherm 2 — categorie + foto + omschrijving */}
        {fase === 'formulier' && (
          <>
            <label className="block text-sm font-semibold text-ink-1 mb-2">Waar ging deze overboeking over?</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIEEN.map(([waarde, label]) => (
                <button key={waarde} type="button" onClick={() => setCategorie(waarde)}
                  aria-pressed={categorie === waarde}
                  className={`px-3.5 py-2.5 rounded-full text-sm font-semibold border transition-colors
                    ${categorie === waarde
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-surface text-ink-2 border-border hover:border-brand-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-ink-1 mt-6 mb-2">Voeg een bewijsstuk toe <span className="font-normal text-ink-3">(optioneel)</span></label>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => cameraRef.current?.click()}
                className="flex-1 border-[1.5px] border-dashed border-border rounded-xl px-2 py-4 text-center text-sm text-ink-2 bg-surface-2 hover:border-accent-400 transition-colors">
                <span className="mx-auto mb-1.5 w-9 h-9 rounded-lg bg-accent-400/15 text-accent-600 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </span>
                Foto maken
              </button>
              <button type="button" onClick={() => bibliotheekRef.current?.click()}
                className="flex-1 border-[1.5px] border-dashed border-border rounded-xl px-2 py-4 text-center text-sm text-ink-2 bg-surface-2 hover:border-accent-400 transition-colors">
                <span className="mx-auto mb-1.5 w-9 h-9 rounded-lg bg-accent-400/15 text-accent-600 flex items-center justify-center">
                  <Photo className="w-5 h-5" />
                </span>
                Uit bibliotheek
              </button>
            </div>
            {/* Camera (capture) en bibliotheek (zonder capture) — toestemming vraagt het toestel zelf */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={kiesBestand} />
            <input ref={bibliotheekRef} type="file" accept="image/*" className="hidden" onChange={kiesBestand} />

            {bestand && (
              <div className="mt-3 border border-border rounded-xl p-2.5 flex items-center gap-2.5 text-sm text-ink-1 bg-surface">
                <span className="w-11 h-11 rounded-lg bg-surface-2 flex items-center justify-center text-ink-3">
                  <Photo className="w-5 h-5" />
                </span>
                <span className="truncate">{bestand.name}</span>
                <span className="text-ink-3">&middot; toegevoegd</span>
                <button type="button" onClick={() => setBestand(null)} className="ml-auto text-ink-3 hover:text-red-600 text-sm font-semibold px-2 py-2">
                  Verwijder
                </button>
              </div>
            )}

            <label htmlFor="info-omschrijving" className="block text-sm font-semibold text-ink-1 mt-6 mb-2">Korte omschrijving</label>
            <textarea id="info-omschrijving" value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)}
              placeholder="Bijv. maandsalaris juli voor mijn broer." maxLength={1000}
              className="w-full border border-border rounded-xl px-3.5 py-3 text-sm min-h-[88px] resize-y outline-none bg-surface text-ink-1 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />

            {fout && (
              <div role="alert" className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-md flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{fout}</span>
              </div>
            )}

            <button onClick={verstuur} disabled={bezig}
              className="mt-5 w-full py-3.5 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition-colors disabled:opacity-50">
              {bezig ? 'Versturen…' : 'Versturen'}
            </button>

            <div className="mt-4 flex gap-2.5 bg-brand-50 border border-brand-100 rounded-lg px-3.5 py-3 text-[13px] text-brand-800">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Je foto wordt versleuteld verwerkt en alleen door ons compliance-team bekeken.</span>
            </div>
          </>
        )}

        {/* Scherm 3 — verzonden / in behandeling */}
        {fase === 'klaar' && (
          <div className="text-center pt-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-success-50 text-success-700 flex items-center justify-center mb-4">
              <Check className="w-7 h-7" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink-1 mb-1">Bedankt, we hebben je info</h2>
            <p className="text-ink-2 text-sm mb-5">
              We controleren je gegevens. Je hoort binnen enkele werkdagen of de overboeking wordt
              vrijgegeven — je krijgt automatisch bericht.
            </p>
            <div className="border border-border rounded-xl overflow-hidden mb-6 bg-surface text-left">
              <DetailRij label="Categorie" waarde={(CATEGORIEEN.find(([w]) => w === (categorie || verzoek?.categorie)) || ['', '—'])[1]} />
              <DetailRij label="Bewijsstuk" waarde={(bestand || verzoek?.heeftBewijs) ? '1 foto' : 'Geen'} />
              <DetailRij label="Status" waarde="In behandeling" waardeKleur="text-success-700" />
            </div>
            <button onClick={() => navigate('/app')} className="btn-inst w-full py-3.5">Terug naar overzicht</button>
          </div>
        )}

        {/* Uitslag — vrijgegeven of afgewezen */}
        {fase === 'uitslag' && verzoek && (
          <div className="text-center pt-4">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4
              ${verzoek.status === 'vrijgegeven' ? 'bg-success-50 text-success-700' : 'bg-red-50 text-red-600'}`}>
              {verzoek.status === 'vrijgegeven' ? <Check className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <h2 className="font-display text-xl font-bold text-ink-1 mb-1">
              {verzoek.status === 'vrijgegeven' ? 'Je overboeking is vrijgegeven' : 'Overboeking niet uitgevoerd'}
            </h2>
            <p className="text-ink-2 text-sm mb-6">
              {verzoek.status === 'vrijgegeven'
                ? 'Onze controle is afgerond; de verwerking gaat gewoon verder.'
                : 'Na beoordeling kunnen we deze overboeking niet uitvoeren. Al afgeschreven geld storten we terug.'}
              {verzoek.beoordelingNotitie ? <> Toelichting: {verzoek.beoordelingNotitie}</> : null}
            </p>
            <button onClick={() => navigate('/app')} className="btn-inst w-full py-3.5">Naar mijn overzicht</button>
          </div>
        )}
      </div>
    </div>
  );
}
