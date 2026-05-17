/**
 * GdprBeheer.jsx — AVG/GDPR rechten beheer
 * Recht op inzage (Art. 15): download alle persoonlijke data als JSON.
 * Recht op vergetelheid (Art. 17): anonimiseer account (transactiegegevens
 * blijven 5 jaar bewaard conform Wwft Art. 38).
 */
import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function GdprBeheer({ token }) {
  const [bezigExport, setBezigExport] = useState(false);
  const [bezigAnoniem, setBezigAnoniem] = useState(false);
  const [fout, setFout] = useState('');
  const [bericht, setBericht] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bevestiging, setBevestiging] = useState('');

  async function downloadData() {
    setBezigExport(true);
    setFout('');
    setBericht('');
    try {
      const res = await fetch(`${API}/users/me/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      // Haal filename uit Content-Disposition als beschikbaar
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      const bestandsnaam = match ? match[1] : `swiftbridge-data-${new Date().toISOString().slice(0, 10)}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = bestandsnaam;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBericht('Download gestart. Bewaar je gegevensbestand op een veilige plek.');
    } catch (e) {
      setFout('Download mislukt: ' + e.message);
    } finally {
      setBezigExport(false);
    }
  }

  async function bevestigAnonimiseren() {
    if (bevestiging.trim() !== 'IK BEGRIJP HET') {
      setFout('Typ exact: IK BEGRIJP HET');
      return;
    }
    setBezigAnoniem(true);
    setFout('');
    try {
      const res = await fetch(`${API}/users/me/anonimiseer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bevestiging: 'IK BEGRIJP HET' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // Wis lokale sessie volledig
      try {
        localStorage.removeItem('sb_token');
        localStorage.removeItem('sb_refresh');
        localStorage.removeItem('sb_gebruiker');
        sessionStorage.clear();
      } catch {}

      alert('Je account is geanonimiseerd. Je wordt nu uitgelogd.');
      window.location.href = '/login';
    } catch (e) {
      setFout('Anonimiseren mislukt: ' + e.message);
      setBezigAnoniem(false);
    }
  }

  function sluitModal() {
    if (bezigAnoniem) return;
    setModalOpen(false);
    setBevestiging('');
    setFout('');
  }

  return (
    <div className="card-glass p-5 space-y-4 animate-fade-up border-l-4 border-slate-400">
      <div>
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          AVG / GDPR beheer
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Onder de AVG heb je het recht op inzage in je gegevens (Art. 15) en het recht op vergetelheid (Art. 17).
        </p>
      </div>

      {/* Data download */}
      <div className="rounded-xl border-2 border-blue-100 bg-blue-50/40 p-4 space-y-2">
        <h4 className="font-semibold text-sm text-gray-800">Download mijn data</h4>
        <p className="text-xs text-gray-600">
          Krijg een JSON-bestand met al je profielgegevens, transacties, KYC-records, audit-log en notificatie-instellingen.
        </p>
        <button
          onClick={downloadData}
          disabled={bezigExport}
          className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
        >
          {bezigExport ? 'Bezig met ophalen...' : 'Download mijn data (JSON)'}
        </button>
      </div>

      {/* Account anonimiseren */}
      <div className="rounded-xl border-2 border-rose-200 bg-rose-50/40 p-4 space-y-2">
        <h4 className="font-semibold text-sm text-gray-800">Account anonimiseren</h4>
        <p className="text-xs text-gray-600">
          Wist je naam, e-mail, telefoon, adres en KYC-gegevens. Deze actie is <strong>onomkeerbaar</strong> en je wordt direct uitgelogd.
        </p>
        <div className="text-[11px] text-gray-500 bg-white/60 rounded-lg px-2 py-1.5 border border-gray-100">
          <strong>Wwft bewaarplicht:</strong> je transactie historie wordt 5 jaar bewaard zonder identificeerbare gegevens.
        </div>
        <button
          onClick={() => { setModalOpen(true); setFout(''); setBericht(''); }}
          className="w-full py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition disabled:opacity-50"
        >
          Account anonimiseren (definitief)
        </button>
      </div>

      {fout && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
          {fout}
        </div>
      )}
      {bericht && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-sm">
          {bericht}
        </div>
      )}

      {/* Bevestigingsmodal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={sluitModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-gray-900">Account anonimiseren</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                Hierna worden de volgende gegevens <strong>onomkeerbaar gewist</strong>:
              </p>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                <li>Naam, e-mail, telefoon, adres</li>
                <li>KYC documenten en iDIN gegevens</li>
                <li>Push-notificaties en koers-alerts</li>
                <li>Inloggegevens en 2FA</li>
              </ul>
              <p className="text-xs text-gray-600">
                Je transactie-historie blijft bewaard maar zonder identificeerbare gegevens (Wwft Art. 38, 5 jaar bewaarplicht).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Typ <span className="font-mono text-rose-600">IK BEGRIJP HET</span> om te bevestigen:
              </label>
              <input
                value={bevestiging}
                onChange={(e) => setBevestiging(e.target.value)}
                placeholder="IK BEGRIJP HET"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-mono"
                disabled={bezigAnoniem}
                autoFocus
              />
            </div>

            {fout && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
                {fout}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={sluitModal}
                disabled={bezigAnoniem}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={bevestigAnonimiseren}
                disabled={bezigAnoniem || bevestiging.trim() !== 'IK BEGRIJP HET'}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bezigAnoniem ? 'Bezig...' : 'Definitief anonimiseren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
