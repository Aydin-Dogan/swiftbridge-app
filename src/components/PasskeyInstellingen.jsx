/**
 * PasskeyInstellingen.jsx — beheer van passkeys (BIO-1, Beveiliging-sectie).
 * Kaart naast TweeFactorInstellingen: lijst van geregistreerde passkeys,
 * toevoegen via de WebAuthn-ceremony (Windows Hello / Face ID / vingerafdruk)
 * en verwijderen met bevestiging. Verbergt zichzelf-in-uitleg wanneer de
 * browser/context geen WebAuthn ondersteunt (bv. LAN-IP zonder https).
 */
import { useEffect, useState } from 'react';
import { useTaal } from '../i18n';
import { apiFetch, parseError } from '../services/api';
import { passkeySupport, passkeyRegistreer, isGeannuleerd } from '../services/passkey';
import { Fingerprint, Trash } from './icons/Icons';

export default function PasskeyInstellingen() {
  const { t } = useTaal();
  const [credentials, setCredentials] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [gelukt, setGelukt] = useState(false);
  const [verwijderId, setVerwijderId] = useState(null);
  const ondersteund = passkeySupport();

  useEffect(() => {
    let weg = false;
    apiFetch('/auth/webauthn/credentials')
      .then(d => { if (!weg) setCredentials(d?.credentials || []); })
      .catch(() => { if (!weg) setCredentials([]); });
    return () => { weg = true; };
  }, []);

  async function voegToe() {
    setFout('');
    setGelukt(false);
    setBezig(true);
    try {
      const naam = typeof navigator !== 'undefined' ? (navigator.platform || 'Dit apparaat') : 'Dit apparaat';
      const res = await passkeyRegistreer(naam);
      setCredentials(prev => [res.credential, ...(prev || [])]);
      setGelukt(true);
    } catch (err) {
      if (!isGeannuleerd(err)) setFout(parseError(err, t) || t('passkey_fout'));
    } finally {
      setBezig(false);
    }
  }

  async function verwijder(id) {
    setFout('');
    try {
      await apiFetch(`/auth/webauthn/credentials/${id}`, { method: 'DELETE' });
      setCredentials(prev => (prev || []).filter(c => c.id !== id));
      setVerwijderId(null);
    } catch (err) {
      setFout(parseError(err, t) || t('passkey_fout'));
    }
  }

  const aantal = credentials?.length || 0;

  return (
    <div id="passkeys" className="card-glass p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Fingerprint className="w-5 h-5 text-brand-600 flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-1 text-sm">{t('passkey_titel')}</h3>
            <p className="text-xs text-ink-3 mt-0.5">{t('passkey_uitleg')}</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0
          ${aantal > 0 ? 'bg-success-50 text-success-700' : 'bg-surface-2 text-ink-3'}`}>
          {aantal > 0 ? t('passkey_badge_aan', { aantal }) : t('passkey_badge_uit')}
        </span>
      </div>

      {!ondersteund && (
        <p className="text-xs text-ink-3 bg-surface-2 rounded-md px-3 py-2.5">{t('passkey_niet_ondersteund')}</p>
      )}

      {ondersteund && credentials === null && (
        <p className="text-xs text-ink-3">{t('laden')}</p>
      )}

      {ondersteund && credentials !== null && (
        <>
          {aantal > 0 && (
            <ul className="divide-y divide-border-subtle border border-border rounded-md">
              {credentials.map(c => (
                <li key={c.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-1 truncate">{c.apparaatNaam || t('passkey_naam_onbekend')}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">
                      {t('passkey_sinds')}: {(c.aangemaaktOp || '').slice(0, 10)}
                      {c.laatstGebruikt && ` · ${t('passkey_laatst')}: ${c.laatstGebruikt.slice(0, 10)}`}
                    </div>
                  </div>
                  {verwijderId === c.id ? (
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => verwijder(c.id)}
                        className="text-[11px] font-semibold text-fg-error hover:underline underline-offset-4">
                        {t('passkey_verwijder_ja')}
                      </button>
                      <button onClick={() => setVerwijderId(null)}
                        className="text-[11px] font-semibold text-ink-3 hover:underline underline-offset-4">
                        {t('annuleren')}
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setVerwijderId(c.id)} aria-label={t('passkey_verwijder')}
                      className="text-ink-3 hover:text-fg-error transition flex-shrink-0">
                      <Trash className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {fout && <p role="alert" className="text-xs text-fg-error">{fout}</p>}
          {gelukt && <p role="status" className="text-xs text-success-700">{t('passkey_toegevoegd')}</p>}

          <button onClick={voegToe} disabled={bezig}
            className="btn-inst w-full py-3 disabled:opacity-50">
            {bezig ? t('laden') : t('passkey_toevoegen')}
          </button>
        </>
      )}
    </div>
  );
}
