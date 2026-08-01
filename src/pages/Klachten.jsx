import { useState } from 'react';
import { Zap } from '../components/icons/Icons';
import { apiFetch } from '../services/api';

/**
 * Klachtenregeling — voor een betaaldienstverlener een feitelijk vereiste pagina
 * (PSD2 / Wft-zorgplicht). Beschrijft het klachtenproces met wettelijke termijnen
 * en biedt een formulier dat naar support gaat (POST /klachten → e-mail naar het
 * klachtenteam). De escalatieroute (EMI-partner / Kifid) is bewust generiek tot
 * de definitieve contractstructuur met de EMI-partner rond is.
 */
export default function Klachten() {
  const [status, setStatus] = useState('idle'); // idle | bezig | ok | fout
  const [form, setForm] = useState({ naam: '', email: '', onderwerp: '', bericht: '' });

  function veld(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function verstuur(e) {
    e.preventDefault();
    if (status === 'bezig') return;
    setStatus('bezig');
    try {
      await apiFetch('/klachten', { method: 'POST', body: form });
      setStatus('ok');
    } catch {
      setStatus('fout');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-brand-600" />
            <span className="font-bold text-xl text-brand-600">SwiftBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Klachtenregeling</h1>
          <p className="text-gray-600 mb-1">Hoe wij uw klacht behandelen — snel, eerlijk en transparant</p>
          <p className="text-sm text-gray-500 mb-8">Versie 1.0 — juli 2026</p>

          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-8 text-sm text-brand-900">
            <strong>Wij nemen klachten serieus.</strong> Bent u niet tevreden over onze dienst?
            Laat het ons weten. Wij bevestigen uw klacht binnen <strong>2 werkdagen</strong> en geven
            u een inhoudelijke reactie binnen <strong>15 werkdagen</strong>. Lukt dat uitzonderlijk niet,
            dan laten we u weten waarom en wanneer u wél een antwoord kunt verwachten.
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Stap 1 — Meld uw klacht bij ons</h2>
              <p className="mb-3">
                De snelste weg is via het formulier onderaan deze pagina, of per e-mail naar{' '}
                <a href="mailto:klachten@swiftbridge.nl" className="text-brand-600 underline">klachten@swiftbridge.nl</a>.
                Vermeld zoveel mogelijk: uw naam, uw e-mailadres, waar de klacht over gaat en (indien van
                toepassing) het transactienummer. Zo kunnen wij u het snelst helpen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Termijnen</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border border-gray-200 font-semibold">Stap</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">Termijn</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-200">Ontvangstbevestiging van uw klacht</td>
                      <td className="p-3 border border-gray-200">binnen 2 werkdagen</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">Inhoudelijke reactie</td>
                      <td className="p-3 border border-gray-200">binnen 15 werkdagen</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">Bij uitzonderlijke vertraging: tussenbericht met reden + nieuwe datum</td>
                      <td className="p-3 border border-gray-200">uiterlijk 35 werkdagen totaal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Deze termijnen sluiten aan bij de norm die geldt voor betaaldienstverleners (PSD2).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Stap 2 — Niet tevreden met onze reactie?</h2>
              <p className="mb-3">
                Komen we er samen niet uit, dan kunt u uw klacht voorleggen aan onze
                betaaldienstverlener (de door DNB gelicentieerde EMI-partner via wie de betaaldiensten
                worden geleverd) en, als consument, aan het onafhankelijke klachteninstituut voor de
                financiële dienstverlening in Nederland (Kifid). De exacte contactgegevens van de
                EMI-partner en de aansluitingsgegevens bij Kifid vindt u zodra u een inhoudelijke
                reactie van ons ontvangt; ze staan ook in onze algemene voorwaarden.
              </p>
              <p className="text-sm text-gray-500">
                U behoudt daarnaast altijd het recht om uw geschil aan de bevoegde rechter voor te leggen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Wat u van ons mag verwachten</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Een persoonlijke, begrijpelijke reactie — geen standaardbrief.</li>
                <li>Behandeling in uw eigen taal waar mogelijk — de app ondersteunt vijf talen.</li>
                <li>Vertrouwelijke behandeling; uw klacht heeft geen negatief effect op onze dienstverlening aan u.</li>
                <li>Als wij een fout hebben gemaakt, herstellen we die en leggen we uit hoe we herhaling voorkomen.</li>
              </ul>
            </section>

            {/* ── Formulier ── */}
            <section className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Klacht indienen</h2>
              {status === 'ok' ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-900">
                  <strong>Bedankt — uw klacht is ontvangen.</strong> U krijgt binnen 2 werkdagen een
                  bevestiging op het opgegeven e-mailadres.
                </div>
              ) : (
                <form onSubmit={verstuur} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="k-naam" className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                      <input id="k-naam" required value={form.naam} onChange={veld('naam')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" />
                    </div>
                    <div>
                      <label htmlFor="k-email" className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                      <input id="k-email" type="email" required value={form.email} onChange={veld('email')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="k-onderwerp" className="block text-sm font-medium text-gray-700 mb-1">Onderwerp</label>
                    <input id="k-onderwerp" required value={form.onderwerp} onChange={veld('onderwerp')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" />
                  </div>
                  <div>
                    <label htmlFor="k-bericht" className="block text-sm font-medium text-gray-700 mb-1">Uw klacht</label>
                    <textarea id="k-bericht" required rows={5} value={form.bericht} onChange={veld('bericht')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" />
                  </div>
                  {status === 'fout' && (
                    <p className="text-sm text-red-600">Er ging iets mis bij het versturen. Mail ons rechtstreeks via klachten@swiftbridge.nl.</p>
                  )}
                  <button type="submit" disabled={status === 'bezig'}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg px-6 py-3 disabled:opacity-50">
                    {status === 'bezig' ? 'Versturen…' : 'Klacht versturen'}
                  </button>
                </form>
              )}
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-500">SwiftBridge — klachten@swiftbridge.nl</p>
              <p className="text-sm text-gray-500 mt-1">
                SwiftBridge is geen bank en beschikt niet over een eigen bankvergunning van DNB.
                Betaaldiensten worden aangeboden via een door DNB gelicentieerde EMI-partner (agent-model),
                conform PSD2 en de Wwft.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
