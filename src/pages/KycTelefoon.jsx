/**
 * KycTelefoon.jsx — de telefoonkant van de KYC-handoff.
 * Route: /kyc-telefoon?token=... (QR/link vanaf de computer, 15 min geldig).
 * Geen login nodig: het kortlevende handoff-token autoriseert uitsluitend
 * het uploaden van documentfoto's voor de bijbehorende klant. Na de upload
 * gaat de computer automatisch verder.
 */
import { useEffect, useState, Suspense, lazy } from 'react';
import { useTaal } from '../i18n';
import { CheckCircle, AlertTriangle } from '../components/icons/Icons';

const DocumentUploadFlow = lazy(() => import('../components/kyc/DocumentUploadFlow'));
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function KycTelefoon() {
  const { t } = useTaal();
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [info, setInfo] = useState(null);
  const [fout, setFout] = useState('');
  const [laden, setLaden] = useState(true);
  const [klaar, setKlaar] = useState(false);

  useEffect(() => {
    let weg = false;
    if (!token) { setFout('Deze link mist een code. Maak op je computer een nieuwe telefoonlink.'); setLaden(false); return undefined; }
    fetch(`${API}/kyc/handoff/info`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (weg) return;
        if (!res.ok) setFout(data.error || 'Deze link is ongeldig of verlopen. Maak op je computer een nieuwe link.');
        else setInfo(data);
      })
      .catch(() => { if (!weg) setFout('Geen verbinding met de server. Controleer je internet en probeer opnieuw.'); })
      .finally(() => { if (!weg) setLaden(false); });
    return () => { weg = true; };
  }, [token]);

  return (
    <div className="min-h-screen bg-surface-2 px-4 py-6">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <img src="/icon-192.png" alt="SwiftBridge" width="48" height="48" className="mx-auto rounded-xl shadow-sm" />
          <h1 className="font-display text-xl text-ink-1 mt-2">Identiteit verifiëren</h1>
          {info?.voornaam && !klaar && (
            <p className="text-sm text-ink-2 mt-1">
              Hallo {info.voornaam} — maak hier de foto's van je document en een selfie.
            </p>
          )}
        </div>

        {laden && <p className="text-sm text-ink-3 text-center py-8">{t('laden')}</p>}

        {!laden && fout && (
          <div className="bg-surface border border-border rounded-md shadow-soft p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 mx-auto text-accent-600" aria-hidden="true" />
            <p className="text-sm text-ink-1">{fout}</p>
          </div>
        )}

        {!laden && !fout && !klaar && info && (
          <Suspense fallback={<p className="text-sm text-ink-3 text-center py-8">{t('laden')}</p>}>
            <DocumentUploadFlow
              bearerToken={token}
              beginWaarden={{ geboortedatum: info.geboortedatum, nationaliteit: info.nationaliteit }}
              onSuccess={() => setKlaar(true)}
            />
          </Suspense>
        )}

        {klaar && (
          <div className="bg-surface border border-border rounded-md shadow-soft p-6 text-center space-y-3">
            <CheckCircle className="w-12 h-12 mx-auto text-success-500" aria-hidden="true" />
            <h2 className="font-display text-lg font-medium text-ink-1">Foto's ontvangen</h2>
            <p className="text-sm text-ink-2">
              Je kunt deze pagina sluiten en verdergaan op je computer — die gaat automatisch door.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
