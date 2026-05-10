import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const stappen = [
  { titel: 'Persoonlijk', icoon: '👤' },
  { titel: 'Document', icoon: '🪪' },
  { titel: 'Selfie', icoon: '🤳' },
  { titel: 'Klaar', icoon: '✅' },
];

export default function KYCFlow({ token }) {
  const [stap, setStap] = useState(0);
  const [form, setForm] = useState({
    voornaam: '', achternaam: '', geboortedatum: '', nationaliteit: 'TR',
    documentType: 'kimlik', documentNummer: '',
  });
  const [selfie, setSelfie] = useState(false);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
  const [status, setStatus] = useState(null);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function dien_in() {
    setLaden(true);
    setFout('');
    try {
      const res = await fetch(`${API}/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          documentType: form.documentType,
          documentNummer: form.documentNummer,
          geboortedatum: form.geboortedatum,
          nationaliteit: form.nationaliteit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data.status);
      setStap(3);
    } catch (e) {
      setFout(e.message);
    } finally {
      setLaden(false);
    }
  }

  const docTypes = [
    { value: 'kimlik', label: '🇹🇷 Turks Kimlik (TC)', sub: 'Turkse identiteitskaart' },
    { value: 'paspoort', label: '📘 Paspoort', sub: 'Nederlands of Turks paspoort' },
    { value: 'rijbewijs', label: '🚗 Rijbewijs', sub: 'EU rijbewijs' },
  ];

  return (
    <div className="max-w-md mx-auto">
      {/* Voortgangsbalk */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div className="absolute top-4 left-0 h-0.5 bg-blue-600 z-0 transition-all"
          style={{ width: `${(stap / (stappen.length - 1)) * 100}%` }} />
        {stappen.map((s, i) => (
          <div key={i} className="flex flex-col items-center z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg border-2
              ${i < stap ? 'bg-blue-600 border-blue-600 text-white' :
                i === stap ? 'bg-white border-blue-600' : 'bg-white border-gray-300'}`}>
              {i < stap ? '✓' : s.icoon}
            </div>
            <span className={`text-xs mt-1 font-medium ${i <= stap ? 'text-blue-600' : 'text-gray-400'}`}>
              {s.titel}
            </span>
          </div>
        ))}
      </div>

      {/* Stap 0: Persoonlijk */}
      {stap === 0 && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">👤 Persoonlijke gegevens</h2>
          <p className="text-gray-500 text-sm">We hebben dit nodig om je identiteit te verifiëren (KYC-vereiste DNB).</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Voornaam</label>
              <input value={form.voornaam} onChange={e => update('voornaam', e.target.value)}
                placeholder="Aydin"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Achternaam</label>
              <input value={form.achternaam} onChange={e => update('achternaam', e.target.value)}
                placeholder="Dogan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Geboortedatum</label>
            <input type="date" value={form.geboortedatum} onChange={e => update('geboortedatum', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nationaliteit</label>
            <select value={form.nationaliteit} onChange={e => update('nationaliteit', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
              <option value="TR">🇹🇷 Turks</option>
              <option value="NL">🇳🇱 Nederlands</option>
              <option value="DUAL">🇹🇷🇳🇱 Dubbele nationaliteit</option>
            </select>
          </div>
          <button onClick={() => setStap(1)}
            disabled={!form.voornaam || !form.achternaam || !form.geboortedatum}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">
            Volgende →
          </button>
        </div>
      )}

      {/* Stap 1: Document */}
      {stap === 1 && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">🪪 Identiteitsbewijs</h2>
          <p className="text-gray-500 text-sm">Kies je document type. SwiftBridge accepteert het Turkse kimlik!</p>
          <div className="space-y-2">
            {docTypes.map(d => (
              <label key={d.value}
                className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition
                  ${form.documentType === d.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="docType" value={d.value}
                  checked={form.documentType === d.value}
                  onChange={e => update('documentType', e.target.value)}
                  className="mr-3" />
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{d.label}</div>
                  <div className="text-xs text-gray-500">{d.sub}</div>
                </div>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Documentnummer</label>
            <input value={form.documentNummer} onChange={e => update('documentNummer', e.target.value)}
              placeholder={form.documentType === 'kimlik' ? '12345678901' : 'NL1234567'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            📸 Foto van je document uploaden doe je in de volgende stap
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStap(0)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm">← Terug</button>
            <button onClick={() => setStap(2)} disabled={!form.documentNummer}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition text-sm">
              Volgende →
            </button>
          </div>
        </div>
      )}

      {/* Stap 2: Selfie */}
      {stap === 2 && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">🤳 Selfie verificatie</h2>
          <p className="text-gray-500 text-sm">Houd je identiteitsbewijs naast je gezicht en maak een foto.</p>
          <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition
            ${selfie ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
            onClick={() => setSelfie(true)}>
            {selfie ? (
              <div>
                <div className="text-5xl mb-2">✅</div>
                <p className="text-green-600 font-semibold">Selfie goedgekeurd (simulatie)</p>
                <p className="text-green-500 text-sm">Liveness check geslaagd</p>
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-2">📷</div>
                <p className="text-gray-600 font-semibold">Klik om selfie te maken</p>
                <p className="text-gray-400 text-sm">Of sleep een foto hierheen</p>
                <p className="text-xs text-blue-500 mt-2">Powered by Sumsub</p>
              </div>
            )}
          </div>
          {fout && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{fout}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStap(1)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm">← Terug</button>
            <button onClick={dien_in} disabled={!selfie || laden}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition text-sm">
              {laden ? '⏳ Bezig...' : '✓ Indienen'}
            </button>
          </div>
        </div>
      )}

      {/* Stap 3: Klaar */}
      {stap === 3 && (
        <div className="bg-white rounded-2xl shadow p-6 text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800">KYC ingediend!</h2>
          <p className="text-gray-500 text-sm">Je aanvraag is ontvangen en wordt beoordeeld.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="font-semibold text-amber-600">⏳ In behandeling</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Document</span>
              <span className="font-semibold capitalize">{form.documentType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Verwachte tijd</span>
              <span className="font-semibold text-green-600">&lt; 5 minuten</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Je ontvangt een push-notificatie zodra je KYC is goedgekeurd.</p>
        </div>
      )}
    </div>
  );
}
