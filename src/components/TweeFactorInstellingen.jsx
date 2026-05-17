/**
 * TweeFactorInstellingen — Full TOTP self-service flow
 *
 * Status badge (AAN / UIT) + acties:
 *   - Aanzetten: modal met QR code + secret string + 6-cijferige bevestiging
 *     → na bevestig: 10 backup codes (eenmalig getoond, download/copy)
 *   - Uitzetten: modal met wachtwoord + huidige 2FA code
 *   - Backup codes regenereren: modal met wachtwoord → toon nieuwe 10
 *
 * Compatible met Google Authenticator, Authy, 1Password, Microsoft Authenticator.
 */
import { useState, useEffect } from 'react';
import { parseError } from '../services/api';
import { useTaal } from '../i18n';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Modal shell met glassmorphism + blur backdrop ─────────────────────────────
function Modal({ open, onClose, titel, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/40 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            🔐 {titel}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ── Backup codes paneel — toon + copy + download ──────────────────────────────
function BackupCodesPaneel({ codes }) {
  const [gekopieerd, setGekopieerd] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      /* clipboard niet beschikbaar */
    }
  }

  function download() {
    const blob = new Blob(
      [
        'SwiftBridge — backup codes voor 2-staps verificatie\n',
        '====================================================\n\n',
        codes.map((c, i) => `${String(i + 1).padStart(2, '0')}. ${c}`).join('\n'),
        '\n\nBewaar deze codes veilig. Elke code is eenmalig bruikbaar.\n',
        'Gebruik deze codes als je geen toegang hebt tot je authenticator app.\n',
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swiftbridge-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-900 text-sm">Bewaar deze codes veilig!</p>
            <p className="text-xs text-amber-800 mt-1">
              Dit is je enige kans om ze te zien. Gebruik ze als je je telefoon kwijt bent.
              Elke code is <strong>eenmalig</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-2xl p-4 font-mono text-sm">
        {codes.map((c, i) => (
          <div
            key={c}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center tracking-widest"
          >
            <span className="text-gray-400 text-xs mr-1">{String(i + 1).padStart(2, '0')}.</span>
            <span className="font-bold text-gray-800">{c}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={copy}
          className="px-4 py-3 rounded-xl border-2 border-blue-500 text-blue-600 text-sm font-bold hover:bg-blue-50 transition active:scale-95"
        >
          {gekopieerd ? '✓ Gekopieerd' : '📋 Kopiëren'}
        </button>
        <button
          onClick={download}
          className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition active:scale-95"
        >
          💾 Download .txt
        </button>
      </div>
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function TweeFactorInstellingen({ token, twofaIngeschakeld, onChange }) {
  const { t } = useTaal();

  const [aanModal, setAanModal] = useState(false);
  const [uitModal, setUitModal] = useState(false);
  const [regenModal, setRegenModal] = useState(false);

  // setup-state
  const [setupData, setSetupData] = useState(null); // { secret, otpauthUrl, qrCode }
  const [stap, setStap] = useState('qr'); // 'qr' | 'codes'
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);

  // uit-state
  const [wachtwoord, setWachtwoord] = useState('');
  const [uitCode, setUitCode] = useState('');

  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  // Reset state als modals sluiten
  useEffect(() => {
    if (!aanModal) {
      setSetupData(null);
      setStap('qr');
      setCode('');
      setBackupCodes(null);
      setFout('');
    }
  }, [aanModal]);

  useEffect(() => {
    if (!uitModal) {
      setWachtwoord('');
      setUitCode('');
      setFout('');
    }
  }, [uitModal]);

  useEffect(() => {
    if (!regenModal) {
      setWachtwoord('');
      setBackupCodes(null);
      setFout('');
    }
  }, [regenModal]);

  // ── Aanzetten flow: stap 1 = QR ophalen ─────────────────────────────────────
  async function startSetup() {
    setBezig(true);
    setFout('');
    try {
      const res = await fetch(`${API}/auth/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      setSetupData(data);
      setAanModal(true);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  // ── Stap 2: bevestig code en activeer ───────────────────────────────────────
  async function bevestigAan() {
    if (!/^\d{6}$/.test(code.trim())) {
      setFout('Voer een 6-cijferige code in.');
      return;
    }
    setBezig(true);
    setFout('');
    try {
      const res = await fetch(`${API}/auth/2fa/aanzetten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      setBackupCodes(data.backupCodes);
      setStap('codes');
      onChange?.(true);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  // ── Uitzetten ──────────────────────────────────────────────────────────────
  async function bevestigUit() {
    if (!wachtwoord || !/^[A-Z0-9]{6,8}$/.test(uitCode.trim().toUpperCase()) && !/^\d{6}$/.test(uitCode.trim())) {
      setFout('Voer je wachtwoord en huidige 2FA code (of backup code) in.');
      return;
    }
    setBezig(true);
    setFout('');
    try {
      const res = await fetch(`${API}/auth/2fa/uitzetten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ wachtwoord, code: uitCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      onChange?.(false);
      setUitModal(false);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  // ── Backup codes regenereren ───────────────────────────────────────────────
  async function bevestigRegen() {
    if (!wachtwoord) {
      setFout('Wachtwoord vereist.');
      return;
    }
    setBezig(true);
    setFout('');
    try {
      const res = await fetch(`${API}/auth/2fa/backup-codes-regenereren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ wachtwoord }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      setBackupCodes(data.backupCodes);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div id="tweefactor" className="card-glass p-5 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl flex-shrink-0">{twofaIngeschakeld ? '🔐' : '🔓'}</span>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
              2-staps verificatie
              {twofaIngeschakeld ? (
                <span className="pill-success text-[10px]">AAN</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-bold">UIT</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {twofaIngeschakeld
                ? 'Extra beveiliging actief via authenticator app.'
                : 'Bescherm je account met Google Authenticator, Authy of een soortgelijke app.'}
            </p>
          </div>
        </div>
      </div>

      {fout && !aanModal && !uitModal && !regenModal && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          ❌ {fout}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {!twofaIngeschakeld ? (
          <button
            onClick={startSetup}
            disabled={bezig}
            className="btn-primary py-3 text-sm disabled:opacity-50"
          >
            {bezig ? '⏳ Bezig...' : '🔐 2FA aanzetten →'}
          </button>
        ) : (
          <>
            <button
              onClick={() => setRegenModal(true)}
              className="px-4 py-3 rounded-xl border-2 border-blue-500 text-blue-600 text-sm font-bold hover:bg-blue-50 transition active:scale-95"
            >
              🔄 Backup codes regenereren
            </button>
            <button
              onClick={() => setUitModal(true)}
              className="px-4 py-3 rounded-xl border-2 border-rose-300 text-rose-600 text-sm font-bold hover:bg-rose-50 transition active:scale-95"
            >
              🔓 2FA uitzetten
            </button>
          </>
        )}
      </div>

      {/* ── Modal: Aanzetten (QR → bevestig → backup codes) ─────────────────── */}
      <Modal
        open={aanModal}
        onClose={() => setAanModal(false)}
        titel={stap === 'qr' ? '2FA aanzetten' : 'Bewaar je backup codes'}
      >
        {stap === 'qr' && setupData && (
          <>
            <p className="text-sm text-gray-700">
              Scan de QR code met je authenticator app (Google Authenticator, Authy, 1Password, etc.).
            </p>

            <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <img
                src={setupData.qrCode}
                alt="QR code voor authenticator app"
                className="rounded-xl shadow-md bg-white p-2"
                style={{ width: 200, height: 200 }}
              />
              <p className="text-xs text-gray-500 mt-3 mb-1">Kan je de QR code niet scannen?</p>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs text-gray-700 break-all max-w-full select-all">
                {setupData.secret}
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(setupData.secret);
                  } catch {/* */}
                }}
                className="text-xs text-blue-600 mt-1 hover:underline"
              >
                📋 Kopieer secret
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Voer de 6-cijferige code uit je app in
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-mono outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            {fout && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                ❌ {fout}
              </div>
            )}

            <button
              onClick={bevestigAan}
              disabled={bezig || code.length !== 6}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {bezig ? '⏳ Bezig...' : '✓ Bevestigen en activeren'}
            </button>
          </>
        )}

        {stap === 'codes' && backupCodes && (
          <>
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              ✅ 2-staps verificatie is geactiveerd!
            </p>
            <BackupCodesPaneel codes={backupCodes} />
            <button
              onClick={() => setAanModal(false)}
              className="btn-primary w-full py-3"
            >
              ✓ Klaar — ik heb mijn codes opgeslagen
            </button>
          </>
        )}
      </Modal>

      {/* ── Modal: Uitzetten ─────────────────────────────────────────────────── */}
      <Modal open={uitModal} onClose={() => setUitModal(false)} titel="2FA uitzetten">
        <p className="text-sm text-gray-700">
          Bevestig je wachtwoord en voer een geldige 2FA code (of backup code) in om uit te schakelen.
        </p>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Wachtwoord</label>
          <input
            type="password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            autoComplete="current-password"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Huidige 2FA code of backup code</label>
          <input
            type="text"
            value={uitCode}
            onChange={(e) => setUitCode(e.target.value.toUpperCase())}
            placeholder="123456 of ABCD1234"
            maxLength={8}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono outline-none focus:border-blue-500"
          />
        </div>

        {fout && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            ❌ {fout}
          </div>
        )}

        <button
          onClick={bevestigUit}
          disabled={bezig}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold hover:opacity-90 transition disabled:opacity-50"
        >
          {bezig ? '⏳ Bezig...' : '🔓 Definitief uitzetten'}
        </button>
      </Modal>

      {/* ── Modal: Backup codes regenereren ─────────────────────────────────── */}
      <Modal
        open={regenModal}
        onClose={() => setRegenModal(false)}
        titel="Nieuwe backup codes"
      >
        {!backupCodes ? (
          <>
            <p className="text-sm text-gray-700">
              Voer je wachtwoord in om 10 nieuwe backup codes te genereren. <strong>De oude codes
              vervallen direct.</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Wachtwoord</label>
              <input
                type="password"
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                autoComplete="current-password"
              />
            </div>

            {fout && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                ❌ {fout}
              </div>
            )}

            <button
              onClick={bevestigRegen}
              disabled={bezig}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {bezig ? '⏳ Bezig...' : '🔄 Genereer 10 nieuwe codes'}
            </button>
          </>
        ) : (
          <>
            <BackupCodesPaneel codes={backupCodes} />
            <button
              onClick={() => setRegenModal(false)}
              className="btn-primary w-full py-3"
            >
              ✓ Klaar — ik heb mijn codes opgeslagen
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
