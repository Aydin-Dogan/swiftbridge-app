/**
 * Profiel.jsx — Account houder profielgegevens
 * Naam, e-mail, telefoon, adres
 * Beschikbaar na KYC verificatie
 */
import { useState, useEffect } from 'react';
import { useTaal } from '../i18n';
import { parseError } from '../services/api';
import Vlag from './Vlag';
import GdprBeheer from './GdprBeheer';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── iDIN verificatie via NL bank ─────────────────────────────────────
const NL_BANKEN_IDIN = [
  { code: 'INGBNL2A', naam: 'ING',          kleur: '#FF6200' },
  { code: 'RABONL2U', naam: 'Rabobank',     kleur: '#005EB8' },
  { code: 'ABNANL2A', naam: 'ABN AMRO',     kleur: '#00A551' },
  { code: 'SNSBNL2A', naam: 'SNS Bank',     kleur: '#003D7E' },
  { code: 'BUNQNL2A', naam: 'bunq',         kleur: '#2A2F37' },
  { code: 'KNABNL2H', naam: 'Knab',         kleur: '#FFCC00' },
  { code: 'ASNBNL21', naam: 'ASN Bank',     kleur: '#1B8B47' },
  { code: 'RBRBNL21', naam: 'RegioBank',    kleur: '#005EB8' },
  { code: 'TRIONL2U', naam: 'Triodos Bank', kleur: '#00853E' },
];

function IdinKnop({ token, onSucces }) {
  const { t } = useTaal();
  const [open, setOpen] = useState(false);
  const [gekozen, setGekozen] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  async function startVerificatie(bank) {
    setBezig(true);
    setFout('');
    setGekozen(bank);
    try {
      const res = await fetch(`${API}/idin/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankIssuer: bank.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }

      // Mock flow: simuleer redirect terug + voltooi direct
      if (data.mock) {
        const voltooi = await fetch(`${API}/idin/voltooien`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ transactionId: data.transactionId }),
        });
        const vRes = await voltooi.json().catch(() => ({}));
        if (!voltooi.ok) {
          setFout(parseError({ ...vRes, status: voltooi.status }, t));
          return;
        }
        alert(`✅ Mock iDIN gelukt!\nNaam: ${vRes.geverifieerd.naam}\nAdres: ${vRes.geverifieerd.adres}`);
        onSucces?.();
      } else {
        // Echte flow: stuur door naar bank
        window.location.href = data.redirectUrl;
      }
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="card-glass p-5 border-l-4 border-blue-500 animate-fade-up">
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">🪪</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800">Verifieer met je bank (iDIN)</h3>
          <p className="text-xs text-gray-600 mt-1 mb-3">
            Snelste manier — log even in bij je bank. Wij krijgen alleen je geverifieerde naam, geboortedatum en adres. Geen wachtwoorden, geen scans.
          </p>

          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="btn-primary w-full py-3 text-sm"
            >
              🏦 Kies mijn bank →
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600">Kies je bank:</p>
              <div className="grid grid-cols-3 gap-1.5">
                {NL_BANKEN_IDIN.map(b => (
                  <button
                    key={b.code}
                    onClick={() => startVerificatie(b)}
                    disabled={bezig}
                    className="border-2 rounded-lg py-2 px-1 text-[10px] font-bold transition active:scale-95 disabled:opacity-50"
                    style={{ borderColor: b.kleur, color: b.kleur, background: 'white' }}
                  >
                    {bezig && gekozen?.code === b.code ? '⏳' : b.naam}
                  </button>
                ))}
              </div>
              {fout && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">❌ {fout}</div>}
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ← Terug
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LANDEN = [
  { code: 'NL', naam: 'Nederland' },
  { code: 'BE', naam: 'België' },
  { code: 'DE', naam: 'Duitsland' },
  { code: 'TR', naam: 'Türkiye' },
  { code: 'FR', naam: 'Frankrijk' },
  { code: 'GB', naam: 'Verenigd Koninkrijk' },
  { code: 'AT', naam: 'Oostenrijk' },
];

export default function Profiel({ token, gebruiker, onUpdate }) {
  const { t } = useTaal();
  const [laden, setLaden] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [bericht, setBericht] = useState(null);
  const [fout, setFout] = useState('');
  const [form, setForm] = useState({
    naam: '',
    telefoon: '',
    adresStraat: '',
    adresHuisnummer: '',
    adresPostcode: '',
    adresStad: '',
    adresLand: 'NL',
    whatsappOptIn: true,
  });
  const [profiel, setProfiel] = useState(null);

  async function laad() {
    setLaden(true);
    try {
      const res = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      setProfiel(data);
      setForm({
        naam: data.naam || '',
        telefoon: data.telefoon || '',
        adresStraat: data.adres?.straat || '',
        adresHuisnummer: data.adres?.huisnummer || '',
        adresPostcode: data.adres?.postcode || '',
        adresStad: data.adres?.stad || '',
        adresLand: data.adres?.land || 'NL',
        whatsappOptIn: data.whatsappOptIn !== undefined ? !!data.whatsappOptIn : true,
      });
    } catch (e) {
      setFout(parseError(e, t));
      console.error('Profiel laad fout:', e);
    } finally {
      setLaden(false);
    }
  }

  useEffect(() => { laad(); }, []);

  function update(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function opslaan(e) {
    e.preventDefault();
    setBezig(true);
    setFout('');
    setBericht(null);
    try {
      const res = await fetch(`${API}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      setBericht('✅ Profiel bijgewerkt');
      setProfiel(data.gebruiker);
      onUpdate?.(data.gebruiker);
      setTimeout(() => setBericht(null), 3000);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  if (laden) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (fout && !profiel) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <div className="text-4xl">⚠️</div>
        <h2 className="font-bold text-rose-800">Profiel kon niet geladen worden</h2>
        <p className="text-sm text-rose-700">{fout}</p>
        <button onClick={laad} className="btn-primary text-sm">
          🔄 Opnieuw proberen
        </button>
      </div>
    );
  }

  const kycOk = profiel?.kycStatus === 'goedgekeurd';

  return (
    <div className="space-y-4">
      {/* Profielkaart header */}
      <div className="card-glass p-5 animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {profiel?.naam?.[0]?.toUpperCase() || 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-800 truncate">{profiel?.naam}</h2>
            <p className="text-xs text-gray-500 truncate">{profiel?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {kycOk ? (
                <span className="pill-success">✅ KYC goedgekeurd</span>
              ) : (
                <span className="pill-warning">⏳ KYC vereist</span>
              )}
              {profiel?.twofaIngeschakeld && (
                <span className="pill-success">🔒 2FA</span>
              )}
            </div>
          </div>
        </div>

        {profiel?.statistieken && (
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profiel.statistieken.aantalTransacties}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Transacties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">€{profiel.statistieken.totaalVerstuurdEur.toFixed(0)}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Verstuurd</div>
            </div>
          </div>
        )}
      </div>

      {/* iDIN verificatie via bank — snelste route naar KYC */}
      {!kycOk && (
        <IdinKnop token={token} onSucces={laad} />
      )}

      {/* KYC check */}
      {!kycOk && (
        <div className="card-glass p-4 border-l-4 border-amber-500">
          <div className="flex items-start gap-2">
            <span className="text-2xl">🪪</span>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">KYC verificatie nodig</h3>
              <p className="text-xs text-gray-600 mt-1">
                Voltooi eerst je identiteitsverificatie om je profielgegevens aan te kunnen passen. Gebruik bij voorkeur iDIN hierboven — snelste en veiligste manier via je bank.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profiel formulier */}
      <form onSubmit={opslaan} className="card-glass p-5 space-y-4 animate-fade-up">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          👤 Persoonlijke gegevens
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Volledige naam *</label>
          <input
            value={form.naam}
            onChange={e => update('naam', e.target.value)}
            disabled={!kycOk}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            required
            minLength={2}
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">E-mailadres</label>
            <input
              value={profiel?.email || ''}
              disabled
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
              title="E-mail kan niet gewijzigd worden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Telefoon</label>
            <input
              type="tel"
              value={form.telefoon}
              onChange={e => update('telefoon', e.target.value)}
              disabled={!kycOk}
              placeholder="+31 6 12345678"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
            />
            <p className="text-[10px] text-gray-500 mt-1">Vereist voor WhatsApp</p>
          </div>
        </div>

        <h3 className="font-bold text-gray-800 flex items-center gap-2 pt-2 border-t border-gray-100">
          🏠 Adres
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Straat</label>
            <input
              value={form.adresStraat}
              onChange={e => update('adresStraat', e.target.value)}
              disabled={!kycOk}
              placeholder="Hoofdstraat"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Huisnr.</label>
            <input
              value={form.adresHuisnummer}
              onChange={e => update('adresHuisnummer', e.target.value)}
              disabled={!kycOk}
              placeholder="12A"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Postcode</label>
            <input
              value={form.adresPostcode}
              onChange={e => update('adresPostcode', e.target.value.toUpperCase())}
              disabled={!kycOk}
              placeholder="1234AB"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 font-mono"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Stad</label>
            <input
              value={form.adresStad}
              onChange={e => update('adresStad', e.target.value)}
              disabled={!kycOk}
              placeholder="Amsterdam"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Land</label>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <Vlag land={form.adresLand} size={28} />
            </div>
            <select
              value={form.adresLand}
              onChange={e => update('adresLand', e.target.value)}
              disabled={!kycOk}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
            >
              {LANDEN.map(l => (
                <option key={l.code} value={l.code}>{l.naam} ({l.code})</option>
              ))}
            </select>
          </div>
        </div>

        <h3 className="font-bold text-gray-800 flex items-center gap-2 pt-2 border-t border-gray-100">
          📲 Notificaties
        </h3>

        <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition ${
          form.whatsappOptIn
            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm'
            : 'border-gray-200 bg-white hover:border-emerald-300'
        }`}>
          <input
            type="checkbox"
            checked={!!form.whatsappOptIn}
            onChange={e => update('whatsappOptIn', e.target.checked)}
            disabled={!kycOk}
            className="mt-0.5 h-5 w-5 accent-emerald-600 disabled:opacity-50"
          />
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              {t('profiel_whatsapp_titel')}
              {form.whatsappOptIn && (
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">AAN</span>
              )}
            </div>
            <div className="text-xs text-gray-600 mt-1 leading-relaxed">
              {t('profiel_whatsapp_uitleg')}
            </div>
            {(!form.telefoon) && (
              <div className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 inline-flex items-center gap-1">
                <span>📞</span>
                <span className="font-medium">{t('profiel_whatsapp_geen_telefoon')}</span>
              </div>
            )}
          </div>
        </label>

        {fout && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
            ❌ {fout}
          </div>
        )}
        {bericht && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-sm">
            {bericht}
          </div>
        )}

        <button
          type="submit"
          disabled={!kycOk || bezig}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bezig ? '⏳ Opslaan...' : '💾 Opslaan'}
        </button>
      </form>

      {/* AVG / GDPR beheer — data export + account anonimiseren */}
      <div className="card-glass p-5 animate-fade-up border-l-4 border-blue-500 space-y-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
          {t('profiel_gdpr_kop')}
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          {t('profiel_gdpr_uitleg')}
        </p>
      </div>
      <GdprBeheer token={token} />
    </div>
  );
}
