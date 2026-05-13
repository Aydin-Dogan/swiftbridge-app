/**
 * TweeFactorInstellingen — Toggle voor 2FA via e-mail
 */
import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TweeFactorInstellingen({ token, twofaIngeschakeld, onChange }) {
  const [bezig,   setBezig  ] = useState(false);
  const [bericht, setBericht] = useState('');

  async function toggle() {
    setBezig(true);
    setBericht('');
    try {
      const res = await fetch(`${API}/auth/2fa-instellen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ingeschakeld: !twofaIngeschakeld }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange?.(data.twofaIngeschakeld);
      setBericht(data.twofaIngeschakeld
        ? '✅ 2FA ingeschakeld. Volgende keer inloggen krijg je een code per e-mail.'
        : '2FA uitgeschakeld.');
    } catch (e) {
      setBericht('❌ ' + e.message);
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{twofaIngeschakeld ? '🔐' : '🔓'}</span>
          <div>
            <p className="font-bold text-gray-800 text-sm">2-staps verificatie</p>
            <p className="text-xs text-gray-500">Extra beveiliging via e-mail code bij elke inlog.</p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={bezig}
          className={`relative w-12 h-6 rounded-full transition flex-shrink-0 ${
            twofaIngeschakeld ? 'bg-blue-600' : 'bg-gray-300'
          } ${bezig ? 'opacity-50' : ''}`}>
          <span className={`absolute top-0.5 ${twofaIngeschakeld ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow transition-all`}/>
        </button>
      </div>

      {bericht && (
        <p className={`text-xs ${bericht.startsWith('❌') ? 'text-red-600' : 'text-green-600'}`}>
          {bericht}
        </p>
      )}
    </div>
  );
}
