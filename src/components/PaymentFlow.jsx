import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

const steps = ['Bedrag', 'Bevestiging', 'Verzonden'];

export default function PaymentFlow({ token }) {
  const [step, setStep] = useState(0);
  const [bedrag, setBedrag] = useState('500');
  const [ontvanger, setOntvanger] = useState('Mehmet Yilmaz');
  const [iban, setIban] = useState('TR330006100519786457841326');
  const [fx, setFx] = useState(null);
  const [transactie, setTransactie] = useState(null);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');

  useEffect(() => {
    if (!bedrag || isNaN(bedrag)) return;
    fetch(`${API}/fx/rate?bedrag=${bedrag}`)
      .then(r => r.json())
      .then(setFx)
      .catch(() => {});
  }, [bedrag]);

  async function verstuur() {
    setLaden(true);
    setFout('');
    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eurBedrag: parseFloat(bedrag), ontvangerNaam: ontvanger, ontvangerIBAN: iban }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransactie(data.transactie);
      setStep(2);
    } catch (e) {
      setFout(e.message);
    } finally {
      setLaden(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Stap-indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-1 text-sm mr-3 ${i <= step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`w-8 h-0.5 mr-3 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Stap 0: Bedrag invoeren */}
      {step === 0 && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-800">💸 Geld overmaken</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Bedrag (EUR)</label>
            <div className="flex items-center border-2 border-blue-500 rounded-xl px-4 py-3">
              <span className="text-2xl font-bold text-gray-400 mr-2">€</span>
              <input
                type="number" min="10" max="5000"
                value={bedrag}
                onChange={e => setBedrag(e.target.value)}
                className="flex-1 text-2xl font-bold text-gray-800 outline-none"
              />
            </div>
          </div>

          {fx && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Wisselkoers</span><span className="font-medium">1 EUR = {fx.klantKoers} TRY</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Transactiekosten</span><span className="font-medium">~{(parseFloat(bedrag) * 0.02).toFixed(2)} EUR</span>
              </div>
              <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between font-bold text-blue-700">
                <span>Ontvanger krijgt</span>
                <span className="text-lg">₺{fx.tryBedrag?.toLocaleString('tr-TR')}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Naam ontvanger</label>
            <input value={ontvanger} onChange={e => setOntvanger(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">IBAN Turkije</label>
            <input value={iban} onChange={e => setIban(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-mono text-sm" />
          </div>

          <button onClick={() => setStep(1)}
            disabled={!bedrag || !ontvanger || !iban}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition">
            Volgende →
          </button>
        </div>
      )}

      {/* Stap 1: Bevestiging */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-800">✅ Bevestig overmaken</h2>
          <div className="space-y-3">
            {[
              ['Van', `€${bedrag} (iDEAL)`],
              ['Naar', ontvanger],
              ['IBAN', iban],
              ['Ontvanger krijgt', fx ? `₺${fx.tryBedrag?.toLocaleString('tr-TR')}` : '...'],
              ['Kosten', `€${(parseFloat(bedrag) * 0.02).toFixed(2)}`],
              ['Aankomsttijd', '< 5 minuten ⚡'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500 text-sm">{label}</span>
                <span className="font-semibold text-gray-800 text-sm">{value}</span>
              </div>
            ))}
          </div>
          {fout && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{fout}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50">
              ← Terug
            </button>
            <button onClick={verstuur} disabled={laden}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">
              {laden ? '⏳ Bezig...' : '✓ Verstuur'}
            </button>
          </div>
        </div>
      )}

      {/* Stap 2: Verzonden */}
      {step === 2 && transactie && (
        <div className="bg-white rounded-2xl shadow p-6 text-center space-y-5">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-green-600">Geld onderweg!</h2>
          <p className="text-gray-500">Verwachte aankomsttijd: <strong>&lt; 5 minuten</strong></p>
          <div className="bg-green-50 rounded-xl p-4 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bedrag verstuurd</span>
              <span className="font-bold">€{transactie.eurBedrag}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ontvanger krijgt</span>
              <span className="font-bold text-green-700">₺{transactie.tryBedrag?.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transactie ID</span>
              <span className="font-mono text-xs text-gray-400">{transactie.id?.slice(0,8)}...</span>
            </div>
          </div>
          <button onClick={() => { setStep(0); setTransactie(null); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl">
            Nieuwe overschrijving
          </button>
        </div>
      )}
    </div>
  );
}
