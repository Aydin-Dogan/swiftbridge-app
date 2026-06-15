/**
 * KYCFlow.jsx — Verbeterde KYC verificatie
 * - Echte file upload voor document foto
 * - Selfie upload (camera of bestand)
 * - Preview van geüploade foto's
 * - Voortgangsbalk + stap validatie
 */
import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { parseError } from '../services/api';
import { useTaal } from '../i18n';
import {
  User, IdCard, Eye, Check, CheckCircle, Plus, Lightbulb, Sparkles, Bell,
  Clock, Refresh, Lock, Mail, Globe, ChevronDown,
} from './icons/Icons.jsx';

// Lazy load document upload wizard (alleen relevant voor users zonder NL bank).
const DocumentUploadFlow = lazy(() => import('./kyc/DocumentUploadFlow'));
// Lazy load Onfido embed — alleen geladen als backend een Onfido sdkToken teruggeeft.
const OnfidoEmbed = lazy(() => import('./kyc/OnfidoEmbed'));

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STAPPEN = [
  { titel: 'Persoonlijk', icoon: User },
  { titel: 'Document', icoon: IdCard },
  { titel: 'Selfie', icoon: Eye },
  { titel: 'Klaar', icoon: CheckCircle },
];

const DOC_TYPES = [
  { value: 'kimlik', label: 'Turks Kimlik (TC)', sub: 'Turkse identiteitskaart' },
  { value: 'paspoort', label: 'Paspoort', sub: 'Nederlands of Turks paspoort'},
  { value: 'rijbewijs', label: 'Rijbewijs', sub: 'EU rijbewijs' },
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
      <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative border border-dashed rounded-md p-6 text-center cursor-pointer transition ${
          preview
            ? 'border-success-500 bg-success-50'
            : 'border-border hover:border-brand-400 hover:bg-brand-50'
        }`}
      >
        {preview ? (
          <div className="space-y-2">
            <img src={preview} alt="Preview" className="h-32 mx-auto rounded-md object-cover shadow-soft" loading="lazy" decoding="async" />
            <p className="text-success-700 font-semibold text-sm">Foto geüpload</p>
            <p className="text-gray-500 text-xs">Klik om te wijzigen</p>
          </div>
        ) : (
          <div>
            <div className="mb-2"><Plus className="w-10 h-10 mx-auto text-gray-400" /></div>
            <p className="text-ink-2 font-semibold text-sm">{sublabel || 'Klik om foto te uploaden'}</p>
            <p className="text-gray-500 text-xs mt-1">JPG, PNG of PDF · Max 10MB</p>
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
    <div className="bg-surface border border-border rounded-md shadow-soft p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl font-medium text-ink-1">Persoonlijke gegevens</h2>
        <p className="text-ink-2 text-sm mt-1">KYC-procedure conform Wwft en AML-richtlijnen (uitgevoerd via licentiepartner bij commerciële livegang).</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
        <strong>Bèta:</strong> Tijdens de testfase worden je documentfoto's lokaal verwerkt en niet permanent opgeslagen.
        Bij commerciële livegang verloopt KYC via onze licentiepartner met versleutelde opslag.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-ink-2 mb-1">Voornaam *</label>
          <input value={form.voornaam} onChange={e => update('voornaam', e.target.value)}
            placeholder="Aydin"
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-2 mb-1">Achternaam *</label>
          <input value={form.achternaam} onChange={e => update('achternaam', e.target.value)}
            placeholder="Dogan"
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1">Geboortedatum *</label>
        <input type="date" value={form.geboortedatum} onChange={e => update('geboortedatum', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1">Nationaliteit</label>
        <select value={form.nationaliteit} onChange={e => update('nationaliteit', e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2.5 text-sm outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition">
          <option value="TR">Turks</option>
          <option value="NL">Nederlands</option>
          <option value="DUAL">Dubbele nationaliteit</option>
          <option value="OTHER">Anders</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1">Telefoonnummer</label>
        <input value={form.telefoon} onChange={e => update('telefoon', e.target.value)}
          placeholder="+31 6 12345678"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition" />
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-md p-3 text-xs text-brand-700">
        Je gegevens zijn versleuteld en worden alleen gebruikt voor verificatie. Wij delen niets met derden.
      </div>

      <button onClick={onVolgende} disabled={!geldig}
        className="btn-inst w-full py-3 disabled:bg-gray-300 disabled:cursor-not-allowed">
        Volgende →
      </button>
    </div>
  );
}

// ── Stap 1: Document ──────────────────────────────────────────────────────────
function StapDocument({ form, update, docFoto, setDocFoto, onVolgende, onTerug }) {
  const geldig = form.documentType && form.documentNummer && docFoto;

  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl font-medium text-ink-1">Identiteitsbewijs</h2>
        <p className="text-ink-2 text-sm mt-1">SwiftBridge accepteert het Turkse kimlik!</p>
      </div>

      <div className="space-y-2">
        {DOC_TYPES.map(d => (
          <label key={d.value}
            className={`flex items-center p-3 border rounded-md cursor-pointer transition ${
              form.documentType === d.value
                ? 'border-brand-500 bg-brand-50'
                : 'border-border hover:border-gray-300'}`}>
            <input type="radio" name="docType" value={d.value}
              checked={form.documentType === d.value}
              onChange={e => update('documentType', e.target.value)}
              className="mr-3 accent-brand-600" />
            <div>
              <div className="font-semibold text-ink-1 text-sm">{d.label}</div>
              <div className="text-xs text-gray-500">{d.sub}</div>
            </div>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-2 mb-1">Documentnummer *</label>
        <input value={form.documentNummer} onChange={e => update('documentNummer', e.target.value)}
          placeholder={form.documentType === 'kimlik' ? '12345678901 (11 cijfers)' : 'NL1234567'}
          className="w-full border border-border rounded-md px-3 py-2.5 text-sm outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 font-mono transition" />
      </div>

      <FotoUpload
        label="Foto van je document *"
        sublabel="Maak een foto of upload een scan van je document"
        preview={docFoto}
        onBestand={(data) => setDocFoto(data)}
      />

      {!geldig && form.documentNummer && !docFoto && (
        <p className="text-amber-600 text-xs">Upload nog een foto van je document</p>
      )}

      <div className="flex gap-3">
        <button onClick={onTerug} className="flex-1 border border-border rounded-md text-ink-2 py-3 hover:bg-surface-3 font-semibold text-sm transition">← Terug</button>
        <button onClick={onVolgende} disabled={!geldig}
          className="flex-1 btn-inst py-3 disabled:bg-gray-300 disabled:cursor-not-allowed">
          Volgende →
        </button>
      </div>
    </div>
  );
}

// ── Stap 2: Selfie ────────────────────────────────────────────────────────────
function StapSelfie({ selfieFoto, setSelfieFoto, laden, fout, onIndienen, onTerug }) {
  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl font-medium text-ink-1">Selfie verificatie</h2>
        <p className="text-ink-2 text-sm mt-1">
          Houd je identiteitsbewijs naast je gezicht en maak een foto. Zorg voor goede belichting.
        </p>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icoon: Lightbulb, tekst: 'Goede belichting' },
          { icoon: Eye, tekst: 'Kijk recht in camera' },
          { icoon: IdCard, tekst: 'Document zichtbaar' },
        ].map(t => (
          <div key={t.tekst} className="bg-brand-50 border border-brand-100 rounded-md p-2 text-center">
            <div className="mb-1 text-brand-600"><t.icoon className="w-5 h-5 mx-auto" /></div>
            <div className="text-xs text-brand-700 font-medium">{t.tekst}</div>
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

      {fout && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-600 text-sm">{fout}</div>}

      <div className="flex gap-3">
        <button onClick={onTerug} className="flex-1 border border-border rounded-md text-ink-2 py-3 hover:bg-surface-3 font-semibold text-sm transition">← Terug</button>
        <button onClick={onIndienen} disabled={!selfieFoto || laden}
          className="flex-1 bg-success-600 hover:bg-success-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition text-sm">
          {laden ? 'Indienen...' : (
            <span className="inline-flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" /> Indienen
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Stap 3: Klaar ─────────────────────────────────────────────────────────────
function StapKlaar({ form }) {
  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-6 text-center space-y-5">
      <div><Sparkles className="w-16 h-16 mx-auto text-brand-600" /></div>
      <h2 className="font-display text-2xl font-medium text-ink-1">KYC ingediend!</h2>
      <p className="text-ink-2 text-sm">Je aanvraag is ontvangen en wordt binnen 5 minuten beoordeeld.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-left space-y-3">
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
          <span className="font-semibold text-amber-600">In beoordeling</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Verwacht klaar</span>
          <span className="font-semibold text-success-700">&lt; 5 minuten</span>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-md p-4 text-sm text-brand-700 flex items-start gap-2">
        <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Je ontvangt een notificatie zodra je KYC is goedgekeurd. Daarna kun je direct geld overmaken.</span>
      </div>
    </div>
  );
}

// ── Al goedgekeurd scherm ──────────────────────────────────────────────────
function KYCGoedgekeurd({ naam }) {
  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-8 text-center space-y-5">
      <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-10 h-10 text-success-600" /></div>
      <h2 className="font-display text-2xl font-medium text-ink-1">Verificatie voltooid!</h2>
      <p className="text-ink-2 text-sm">Hoi {naam}, je identiteit is bevestigd. Je kunt nu geld overmaken naar Turkije.</p>
      <div className="bg-success-50 border border-success-100 rounded-md p-4 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-semibold text-success-700">Goedgekeurd</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Toegang</span>
          <span className="font-semibold text-success-700">Volledige toegang</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Transactielimiet</span>
          <span className="font-semibold tabular-nums text-ink-1">€10 – €5.000</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Weeklimiet</span>
          <span className="font-semibold tabular-nums text-ink-1">€5.000 per week</span>
        </div>
      </div>
      <div className="bg-brand-50 border border-brand-100 rounded-md p-4 text-sm text-brand-700">
        Ga naar het tabblad <strong>Overmaken</strong> om een betaling te starten.
      </div>
    </div>
  );
}

// ── In behandeling scherm ──────────────────────────────────────────────────
function KYCInBehandeling({ naam }) {
  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-8 text-center space-y-5">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
      </div>
      <h2 className="font-display text-2xl font-medium text-ink-1">Aanvraag in behandeling</h2>
      <p className="text-ink-2 text-sm">
        Hoi {naam}, we controleren je documenten. Dit duurt normaal <strong>minder dan 5 minuten</strong>.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-bold text-amber-600">In beoordeling</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Ingediend</span>
          <span className="font-bold text-gray-700">Documenten ontvangen</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Verwacht klaar</span>
          <span className="font-semibold text-success-700">&lt; 5 minuten</span>
        </div>
      </div>
      <div className="space-y-2">
        {['Documenten ontvangen', 'Identiteitscontrole bezig...', 'AML/compliance check...'].map((stap, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-md text-sm ${i === 0 ? 'bg-success-50 text-success-700' : i === 1 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
            <span>{i === 0 ? <CheckCircle className="w-4 h-4" /> : i === 1 ? <Refresh className="w-4 h-4" /> : <Clock className="w-4 h-4" />}</span>
            <span className={i < 2 ? 'font-medium' : ''}>{stap}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Je ontvangt een e-mail zodra je KYC is beoordeeld.</p>
    </div>
  );
}

// ── Afgewezen scherm (Verbetering MM polish) ──────────────────────────────
function KYCAfgewezen({ naam, onOpnieuw }) {
  const { t } = useTaal();
  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-8 text-center space-y-5">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-medium text-ink-1">{t('kyc_afgewezen_titel')}</h2>
      <p className="text-ink-2 text-sm">
        {t('kyc_afgewezen_intro', { naam })}
      </p>
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-left space-y-3">
        <p className="font-semibold text-red-700 text-sm mb-2">{t('kyc_afgewezen_redenen_titel')}:</p>
        {[
          t('kyc_afgewezen_reden_1'),
          t('kyc_afgewezen_reden_2'),
          t('kyc_afgewezen_reden_3'),
          t('kyc_afgewezen_reden_4'),
        ].map((reden, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-red-600">
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>{reden}</span>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
        {t('kyc_afgewezen_support')} <a href="mailto:support@swiftbridge.tr" className="font-semibold underline underline-offset-4">support@swiftbridge.tr</a>
      </div>
      <button onClick={onOpnieuw}
        className="btn-inst w-full py-3 inline-flex items-center justify-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15A9 9 0 1 1 5.64 5.64L23 10" />
        </svg>
        {t('kyc_afgewezen_opnieuw')}
      </button>
    </div>
  );
}

// ── Geblokkeerd scherm ─────────────────────────────────────────────────────
function KYCGeblokkeerd() {
  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-8 text-center space-y-5">
      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto"><Lock className="w-10 h-10 text-gray-600" /></div>
      <h2 className="font-display text-2xl font-medium text-ink-1">Account geblokkeerd</h2>
      <p className="text-ink-2 text-sm">
        Je account is tijdelijk geblokkeerd. Neem contact op met onze klantenservice.
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-bold text-gray-700">Geblokkeerd</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Toegang</span>
          <span className="font-bold text-red-600">Geen toegang</span>
        </div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700 space-y-2">
        <p className="font-bold flex items-center gap-1.5"><Mail className="w-4 h-4" /> Contact klantenservice</p>
        <p>E-mail: <strong>support@swiftbridge.tr</strong></p>
        <p className="text-xs text-red-500">Vermeld je e-mailadres en de reden van je verzoek.</p>
      </div>
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function KYCFlow({ token, gebruiker }) {
  const { t } = useTaal();
  const taal = (typeof navigator !== 'undefined' && navigator.language || 'nl').slice(0, 2);
  const [stap, setStap ] = useState(0);
  const [opnieuw, setOpnieuw ] = useState(false);
  const [form, setForm ] = useState({
    voornaam: '', achternaam: '', geboortedatum: '',
    nationaliteit: 'TR', documentType: 'kimlik',
    documentNummer: '', telefoon: '',
  });
  const [docFoto, setDocFoto ] = useState(null);
  const [selfieFoto,setSelfieFoto] = useState(null);
  const [laden, setLaden ] = useState(false);
  const [fout, setFout ] = useState('');
  // Onfido SDK state — alleen gezet als backend KYC_PROVIDER=onfido draait
  const [onfidoToken, setOnfidoToken] = useState(null);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function dien_in() {
    setLaden(true);
    setFout('');
    try {
      // BÈTA: documentfoto's worden nu NIET naar de server gestuurd, alleen flags.
      // Voor productie-livegang moet hier echte file upload naar S3/encrypted storage komen
      // met virusscan + face-matching tegen documentfoto. Zonder dat is dit geen
      // AML/DNB-waardige KYC-flow. Zie BUSINESS_PLAN.md §7.
      // TODO(livegang): vervang door multipart/form-data POST met docFoto + selfieFoto.
      const res = await fetch(`${API}/kyc/submit`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          documentType: form.documentType,
          documentNummer: form.documentNummer,
          geboortedatum: form.geboortedatum,
          nationaliteit: form.nationaliteit,
          heeftDocFoto: !!docFoto,
          heeftSelfie: !!selfieFoto,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.error || `HTTP ${res.status}`);
        err.errorCode = data.errorCode || data.code;
        err.data = data;
        throw err;
      }
      // Backend kan een sdkToken meegeven (Onfido/Veriff/Sumsub). Als die er is,
      // schakelen we over naar de embedded SDK-flow ipv direct naar 'klaar'.
      // Mock-provider geeft geen sdkToken — dan blijft het oude pad gelden.
      const data = await res.json().catch(() => ({}));
      if (data?.sdkToken && data?.provider && data.provider !== 'mock') {
        setOnfidoToken(data.sdkToken);
        // Stap blijft 2 — render OnfidoEmbed in plaats van StapSelfie
      } else {
        setStap(3);
      }
      setOpnieuw(false);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }

  function onOnfidoVoltooid() {
    // SDK-flow door user voltooid; eindbeslissing komt straks via webhook.
    // We tonen 'in behandeling' totdat user/profiel opnieuw geladen wordt.
    setOnfidoToken(null);
    setStap(3);
  }

  function startOpnieuw() {
    setOpnieuw(true);
    setStap(0);
    setDocFoto(null);
    setSelfieFoto(null);
    setFout('');
    setOnfidoToken(null);
    setForm({ voornaam: '', achternaam: '', geboortedatum: '', nationaliteit: 'TR', documentType: 'kimlik', documentNummer: '', telefoon: '' });
  }

  const kycStatus = gebruiker?.kycStatus;

  // Toon statusscherm op basis van huidige KYC status (tenzij gebruiker opnieuw wil indienen)
  if (!opnieuw) {
    if (kycStatus === 'goedgekeurd') return <KYCGoedgekeurd naam={gebruiker.naam} />;
    if (kycStatus === 'in_behandeling') return <KYCInBehandeling naam={gebruiker.naam} />;
    if (kycStatus === 'afgewezen') return <KYCAfgewezen naam={gebruiker.naam} onOpnieuw={startOpnieuw} />;
    if (kycStatus === 'geblokkeerd') return <KYCGeblokkeerd />;
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Voortgangsbalk */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-brand-600 z-0 transition-all duration-500"
          style={{ width: `${(stap / (STAPPEN.length - 1)) * 100}%` }}
        />
        {STAPPEN.map((s, i) => (
          <div key={i} className="flex flex-col items-center z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition ${
              i < stap ? 'bg-brand-600 border-brand-600 text-white' :
              i === stap ? 'bg-surface border-brand-600 text-brand-600 shadow-soft' :
                           'bg-surface border-gray-300 text-gray-400'}`}>
              {i < stap ? <Check className="w-4 h-4" /> : <s.icoon className="w-4 h-4" />}
            </div>
            <span className={`text-[0.7rem] mt-1 font-medium uppercase tracking-[0.15em] ${i <= stap ? 'text-brand-700' : 'text-gray-400'}`}>
              {s.titel}
            </span>
          </div>
        ))}
      </div>

      {stap === 0 && <StapPersoonlijk form={form} update={update} onVolgende={() => setStap(1)} />}
      {stap === 1 && <StapDocument form={form} update={update} docFoto={docFoto} setDocFoto={setDocFoto} onVolgende={() => setStap(2)} onTerug={() => setStap(0)} />}
      {stap === 2 && !onfidoToken && <StapSelfie selfieFoto={selfieFoto} setSelfieFoto={setSelfieFoto} laden={laden} fout={fout} onIndienen={dien_in} onTerug={() => setStap(1)} />}
      {stap === 2 && onfidoToken && (
        <Suspense fallback={<div className="text-center py-6 text-gray-500 text-sm">{t('laden')}</div>}>
          <OnfidoEmbed
            sdkToken={onfidoToken}
            taal={taal}
            onComplete={onOnfidoVoltooid}
            onError={(msg) => { setFout(msg || 'SDK fout'); setOnfidoToken(null); }}
            onAnnuleer={() => { setOnfidoToken(null); }}
          />
        </Suspense>
      )}
      {stap === 3 && <StapKlaar form={form} />}

      {/* Document upload fallback (voor users zonder NL bank) — alleen tonen
          tijdens de actieve flow, niet op het Klaar-scherm */}
      {stap < 3 && <DocumentUploadFallback />}
    </div>
  );
}

// ── Document upload fallback (collapsible) ────────────────────────────────────
function DocumentUploadFallback() {
  const { t } = useTaal();
  const [open, setOpen] = useState(false);
  const [klaar, setKlaar] = useState(false);

  return (
    <div className="mt-5 bg-surface rounded-md shadow-soft border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="doc-upload-paneel"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-3 transition"
      >
        <div className="flex items-center gap-3">
          <div className="text-brand-600" aria-hidden="true"><Globe className="w-6 h-6" /></div>
          <div>
            <div className="font-display font-medium text-ink-1 text-sm">
              {t('kyc_fallback_titel')}
            </div>
            <div className="text-xs text-gray-500">
              {t('kyc_fallback_subtitel')}
            </div>
          </div>
        </div>
        <div className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true"><ChevronDown className="w-4 h-4" /></div>
      </button>
      {open && (
        <div id="doc-upload-paneel" className="border-t border-border-subtle p-5 bg-surface-2">
          {klaar ? (
            <div className="bg-success-50 border border-success-100 rounded-md p-4 text-sm text-success-700">
              {t('kyc_upload_succes_omschrijving')}
            </div>
          ) : (
            <Suspense fallback={
              <div className="text-center py-6 text-gray-500 text-sm">{t('laden')}</div>
            }>
              <DocumentUploadFlow
                onSuccess={() => setKlaar(true)}
                onAnnuleer={() => setOpen(false)}
              />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
}
