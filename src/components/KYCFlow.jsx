/**
 * KYCFlow.jsx — Verbeterde KYC verificatie
 * - Echte file upload voor document foto
 * - Selfie upload (camera of bestand)
 * - Preview van geüploade foto's
 * - Voortgangsbalk + stap validatie
 */
import { useState, useRef, useCallback } from 'react';
import { parseError } from '../services/api';
import { useTaal } from '../i18n';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STAPPEN = [
  { titel: 'Persoonlijk', icoon: '👤' },
  { titel: 'Document',    icoon: '🪪' },
  { titel: 'Selfie',      icoon: '🤳' },
  { titel: 'Klaar',       icoon: '✅' },
];

const DOC_TYPES = [
  { value: 'kimlik',    label: '🇹🇷 Turks Kimlik (TC)',   sub: 'Turkse identiteitskaart'    },
  { value: 'paspoort',  label: '📘 Paspoort',              sub: 'Nederlands of Turks paspoort'},
  { value: 'rijbewijs', label: '🚗 Rijbewijs',             sub: 'EU rijbewijs'                },
];

// ── Upload veld component ──────────────────────────────────────────────────────
function FotoUpload({ label, sublabel, preview, onBestand, accept = 'image/*', capture }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onBestand(ev.target.result, file.name);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
          preview
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        {preview ? (
          <div className="space-y-2">
            <img src={preview} alt="Preview" className="h-32 mx-auto rounded-xl object-cover shadow" />
            <p className="text-green-600 font-semibold text-sm">✅ Foto geüpload</p>
            <p className="text-gray-400 text-xs">Klik om te wijzigen</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gray-700 font-semibold text-sm">{sublabel || 'Klik om foto te uploaden'}</p>
            <p className="text-gray-400 text-xs mt-1">JPG, PNG of PDF · Max 10MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          capture={capture}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ── Stap 0: Persoonlijk ───────────────────────────────────────────────────────
function StapPersoonlijk({ form, update, onVolgende }) {
  const geldig = form.voornaam && form.achternaam && form.geboortedatum;
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">👤 Persoonlijke gegevens</h2>
        <p className="text-gray-500 text-sm mt-1">KYC-procedure conform Wwft en AML-richtlijnen (uitgevoerd via licentiepartner bij commerciële livegang).</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        <strong>⚠️ Bèta:</strong> Tijdens de testfase worden je documentfoto's lokaal verwerkt en niet permanent opgeslagen.
        Bij commerciële livegang verloopt KYC via onze licentiepartner met versleutelde opslag.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Voornaam *</label>
          <input value={form.voornaam} onChange={e => update('voornaam', e.target.value)}
            placeholder="Aydin"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Achternaam *</label>
          <input value={form.achternaam} onChange={e => update('achternaam', e.target.value)}
            placeholder="Dogan"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Geboortedatum *</label>
        <input type="date" value={form.geboortedatum} onChange={e => update('geboortedatum', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nationaliteit</label>
        <select value={form.nationaliteit} onChange={e => update('nationaliteit', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition bg-white">
          <option value="TR">🇹🇷 Turks</option>
          <option value="NL">🇳🇱 Nederlands</option>
          <option value="DUAL">🇹🇷🇳🇱 Dubbele nationaliteit</option>
          <option value="OTHER">🌍 Anders</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Telefoonnummer</label>
        <input value={form.telefoon} onChange={e => update('telefoon', e.target.value)}
          placeholder="+31 6 12345678"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition" />
      </div>

      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
        🔒 Je gegevens zijn versleuteld en worden alleen gebruikt voor verificatie. Wij delen niets met derden.
      </div>

      <button onClick={onVolgende} disabled={!geldig}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition">
        Volgende →
      </button>
    </div>
  );
}

// ── Stap 1: Document ──────────────────────────────────────────────────────────
function StapDocument({ form, update, docFoto, setDocFoto, onVolgende, onTerug }) {
  const geldig = form.documentType && form.documentNummer && docFoto;

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">🪪 Identiteitsbewijs</h2>
        <p className="text-gray-500 text-sm mt-1">SwiftBridge accepteert het Turkse kimlik!</p>
      </div>

      <div className="space-y-2">
        {DOC_TYPES.map(d => (
          <label key={d.value}
            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition ${
              form.documentType === d.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="docType" value={d.value}
              checked={form.documentType === d.value}
              onChange={e => update('documentType', e.target.value)}
              className="mr-3 accent-blue-600" />
            <div>
              <div className="font-semibold text-gray-800 text-sm">{d.label}</div>
              <div className="text-xs text-gray-500">{d.sub}</div>
            </div>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Documentnummer *</label>
        <input value={form.documentNummer} onChange={e => update('documentNummer', e.target.value)}
          placeholder={form.documentType === 'kimlik' ? '12345678901 (11 cijfers)' : 'NL1234567'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 font-mono transition" />
      </div>

      <FotoUpload
        label="Foto van je document *"
        sublabel="Maak een foto of upload een scan van je document"
        preview={docFoto}
        onBestand={(data) => setDocFoto(data)}
      />

      {!geldig && form.documentNummer && !docFoto && (
        <p className="text-amber-600 text-xs">📸 Upload nog een foto van je document</p>
      )}

      <div className="flex gap-3">
        <button onClick={onTerug} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm transition">← Terug</button>
        <button onClick={onVolgende} disabled={!geldig}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm">
          Volgende →
        </button>
      </div>
    </div>
  );
}

// ── Stap 2: Selfie ────────────────────────────────────────────────────────────
function StapSelfie({ selfieFoto, setSelfieFoto, laden, fout, onIndienen, onTerug }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">🤳 Selfie verificatie</h2>
        <p className="text-gray-500 text-sm mt-1">
          Houd je identiteitsbewijs naast je gezicht en maak een foto. Zorg voor goede belichting.
        </p>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icoon: '☀️', tekst: 'Goede belichting' },
          { icoon: '👁️', tekst: 'Kijk recht in camera' },
          { icoon: '🪪', tekst: 'Document zichtbaar' },
        ].map(t => (
          <div key={t.tekst} className="bg-blue-50 rounded-xl p-2 text-center">
            <div className="text-xl mb-1">{t.icoon}</div>
            <div className="text-xs text-blue-700 font-medium">{t.tekst}</div>
          </div>
        ))}
      </div>

      <FotoUpload
        label="Selfie met identiteitsbewijs *"
        sublabel="Gebruik je camera of upload een foto"
        preview={selfieFoto}
        onBestand={(data) => setSelfieFoto(data)}
        capture="user"
      />

      {fout && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{fout}</div>}

      <div className="flex gap-3">
        <button onClick={onTerug} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm transition">← Terug</button>
        <button onClick={onIndienen} disabled={!selfieFoto || laden}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm">
          {laden ? '⏳ Indienen...' : '✓ Indienen'}
        </button>
      </div>
    </div>
  );
}

// ── Stap 3: Klaar ─────────────────────────────────────────────────────────────
function StapKlaar({ form }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 text-center space-y-5">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-bold text-gray-800">KYC ingediend!</h2>
      <p className="text-gray-500 text-sm">Je aanvraag is ontvangen en wordt binnen 5 minuten beoordeeld.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Naam</span>
          <span className="font-semibold">{form.voornaam} {form.achternaam}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Document</span>
          <span className="font-semibold capitalize">{DOC_TYPES.find(d => d.value === form.documentType)?.label}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-semibold text-amber-600">⏳ In beoordeling</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Verwacht klaar</span>
          <span className="font-semibold text-green-600">&lt; 5 minuten</span>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        📱 Je ontvangt een notificatie zodra je KYC is goedgekeurd. Daarna kun je direct geld overmaken.
      </div>
    </div>
  );
}

// ── ✅ Al goedgekeurd scherm ──────────────────────────────────────────────────
function KYCGoedgekeurd({ naam }) {
  return (
    <div className="bg-white rounded-2xl shadow p-8 text-center space-y-5">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">✅</div>
      <h2 className="text-2xl font-bold text-gray-800">Verificatie voltooid!</h2>
      <p className="text-gray-500 text-sm">Hoi {naam}, je identiteit is bevestigd. Je kunt nu geld overmaken naar Turkije.</p>
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-bold text-green-600">✅ Goedgekeurd</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Toegang</span>
          <span className="font-bold text-green-600">Volledige toegang</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Transactielimiet</span>
          <span className="font-bold text-gray-800">€10 – €5.000</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Weeklimiet</span>
          <span className="font-bold text-gray-800">€5.000 per week</span>
        </div>
      </div>
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        💸 Ga naar het tabblad <strong>Overmaken</strong> om een betaling te starten.
      </div>
    </div>
  );
}

// ── ⏳ In behandeling scherm ──────────────────────────────────────────────────
function KYCInBehandeling({ naam }) {
  return (
    <div className="bg-white rounded-2xl shadow p-8 text-center space-y-5">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-4xl animate-pulse">⏳</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Aanvraag in behandeling</h2>
      <p className="text-gray-500 text-sm">
        Hoi {naam}, we controleren je documenten. Dit duurt normaal <strong>minder dan 5 minuten</strong>.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-bold text-amber-600">⏳ In beoordeling</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Ingediend</span>
          <span className="font-bold text-gray-700">Documenten ontvangen</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Verwacht klaar</span>
          <span className="font-bold text-green-600">&lt; 5 minuten</span>
        </div>
      </div>
      <div className="space-y-2">
        {['Documenten ontvangen ✅', 'Identiteitscontrole bezig... 🔍', 'AML/compliance check...'].map((stap, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${i === 0 ? 'bg-green-50 text-green-700' : i === 1 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
            <span>{i === 0 ? '✅' : i === 1 ? '🔄' : '⬜'}</span>
            <span className={i < 2 ? 'font-medium' : ''}>{stap}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Je ontvangt een e-mail zodra je KYC is beoordeeld.</p>
    </div>
  );
}

// ── ❌ Afgewezen scherm ───────────────────────────────────────────────────────
function KYCAfgewezen({ naam, onOpnieuw }) {
  return (
    <div className="bg-white rounded-2xl shadow p-8 text-center space-y-5">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-4xl">❌</div>
      <h2 className="text-2xl font-bold text-gray-800">Verificatie afgewezen</h2>
      <p className="text-gray-500 text-sm">
        Helaas, {naam}, konden we je identiteit niet bevestigen. Je kunt het opnieuw proberen.
      </p>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left space-y-3">
        <p className="font-semibold text-red-700 text-sm mb-2">Mogelijke redenen:</p>
        {[
          'Foto van document was onscherp of onleesbaar',
          'Selfie kwam niet overeen met het document',
          'Documentnummer onjuist ingevoerd',
          'Document is verlopen',
        ].map((reden, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-red-600">
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>{reden}</span>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
        📧 Heb je vragen? Stuur een e-mail naar <strong>support@swiftbridge.nl</strong>
      </div>
      <button onClick={onOpnieuw}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">
        🔄 Opnieuw proberen
      </button>
    </div>
  );
}

// ── 🔒 Geblokkeerd scherm ─────────────────────────────────────────────────────
function KYCGeblokkeerd() {
  return (
    <div className="bg-white rounded-2xl shadow p-8 text-center space-y-5">
      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto text-4xl">🔒</div>
      <h2 className="text-2xl font-bold text-gray-800">Account geblokkeerd</h2>
      <p className="text-gray-500 text-sm">
        Je account is tijdelijk geblokkeerd. Neem contact op met onze klantenservice.
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-bold text-gray-700">🔒 Geblokkeerd</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Toegang</span>
          <span className="font-bold text-red-600">Geen toegang</span>
        </div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-2">
        <p className="font-bold">📞 Contact klantenservice</p>
        <p>E-mail: <strong>support@swiftbridge.nl</strong></p>
        <p className="text-xs text-red-500">Vermeld je e-mailadres en de reden van je verzoek.</p>
      </div>
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function KYCFlow({ token, gebruiker }) {
  const { t } = useTaal();
  const [stap,      setStap     ] = useState(0);
  const [opnieuw,   setOpnieuw  ] = useState(false);
  const [form,      setForm     ] = useState({
    voornaam: '', achternaam: '', geboortedatum: '',
    nationaliteit: 'TR', documentType: 'kimlik',
    documentNummer: '', telefoon: '',
  });
  const [docFoto,   setDocFoto  ] = useState(null);
  const [selfieFoto,setSelfieFoto] = useState(null);
  const [laden,     setLaden    ] = useState(false);
  const [fout,      setFout     ] = useState('');

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function dien_in() {
    setLaden(true);
    setFout('');
    try {
      // ⚠️ BÈTA: documentfoto's worden nu NIET naar de server gestuurd, alleen flags.
      // Voor productie-livegang moet hier echte file upload naar S3/encrypted storage komen
      // met virusscan + face-matching tegen documentfoto. Zonder dat is dit geen
      // AML/DNB-waardige KYC-flow. Zie BUSINESS_PLAN.md §7.
      // TODO(livegang): vervang door multipart/form-data POST met docFoto + selfieFoto.
      const res = await fetch(`${API}/kyc/submit`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          documentType:   form.documentType,
          documentNummer: form.documentNummer,
          geboortedatum:  form.geboortedatum,
          nationaliteit:  form.nationaliteit,
          heeftDocFoto:   !!docFoto,
          heeftSelfie:    !!selfieFoto,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.error || `HTTP ${res.status}`);
        err.errorCode = data.errorCode || data.code;
        err.data = data;
        throw err;
      }
      setStap(3);
      setOpnieuw(false);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }

  function startOpnieuw() {
    setOpnieuw(true);
    setStap(0);
    setDocFoto(null);
    setSelfieFoto(null);
    setFout('');
    setForm({ voornaam: '', achternaam: '', geboortedatum: '', nationaliteit: 'TR', documentType: 'kimlik', documentNummer: '', telefoon: '' });
  }

  const kycStatus = gebruiker?.kycStatus;

  // Toon statusscherm op basis van huidige KYC status (tenzij gebruiker opnieuw wil indienen)
  if (!opnieuw) {
    if (kycStatus === 'goedgekeurd')    return <KYCGoedgekeurd naam={gebruiker.naam} />;
    if (kycStatus === 'in_behandeling') return <KYCInBehandeling naam={gebruiker.naam} />;
    if (kycStatus === 'afgewezen')      return <KYCAfgewezen naam={gebruiker.naam} onOpnieuw={startOpnieuw} />;
    if (kycStatus === 'geblokkeerd')    return <KYCGeblokkeerd />;
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Voortgangsbalk */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500"
          style={{ width: `${(stap / (STAPPEN.length - 1)) * 100}%` }}
        />
        {STAPPEN.map((s, i) => (
          <div key={i} className="flex flex-col items-center z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition ${
              i < stap  ? 'bg-blue-600 border-blue-600 text-white' :
              i === stap ? 'bg-white border-blue-600 shadow-sm' :
                           'bg-white border-gray-300 text-gray-400'}`}>
              {i < stap ? '✓' : s.icoon}
            </div>
            <span className={`text-xs mt-1 font-medium ${i <= stap ? 'text-blue-600' : 'text-gray-400'}`}>
              {s.titel}
            </span>
          </div>
        ))}
      </div>

      {stap === 0 && <StapPersoonlijk form={form} update={update} onVolgende={() => setStap(1)} />}
      {stap === 1 && <StapDocument form={form} update={update} docFoto={docFoto} setDocFoto={setDocFoto} onVolgende={() => setStap(2)} onTerug={() => setStap(0)} />}
      {stap === 2 && <StapSelfie selfieFoto={selfieFoto} setSelfieFoto={setSelfieFoto} laden={laden} fout={fout} onIndienen={dien_in} onTerug={() => setStap(1)} />}
      {stap === 3 && <StapKlaar form={form} />}
    </div>
  );
}
