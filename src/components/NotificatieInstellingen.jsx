/**
 * NotificatieInstellingen — Toggle voor push notificaties + test knop
 */
import { useState, useEffect } from 'react';
import {
  pushBeschikbaar, permissieStatus, isIngeschakeld,
  pushInschakelen, pushUitschakelen, stuurTestNotificatie
} from '../services/pushNotificatie';

export default function NotificatieInstellingen({ token }) {
  const [aan,      setAan     ] = useState(false);
  const [laden,    setLaden   ] = useState(true);
  const [bezig,    setBezig   ] = useState(false);
  const [bericht,  setBericht ] = useState('');
  const beschikbaar = pushBeschikbaar();
  const permissie = permissieStatus();

  useEffect(() => {
    if (!beschikbaar) { setLaden(false); return; }
    isIngeschakeld().then(setAan).finally(() => setLaden(false));
  }, [beschikbaar]);

  async function toggle() {
    setBezig(true);
    setBericht('');
    try {
      if (aan) {
        await pushUitschakelen(token);
        setAan(false);
        setBericht('Push notificaties uitgeschakeld.');
      } else {
        await pushInschakelen(token);
        setAan(true);
        setBericht('✅ Push notificaties ingeschakeld!');
      }
    } catch (e) {
      setBericht('❌ ' + e.message);
    } finally {
      setBezig(false);
    }
  }

  async function test() {
    setBezig(true);
    setBericht('');
    try {
      await stuurTestNotificatie(token);
      setBericht('🧪 Test verstuurd! Check je notificaties.');
    } catch (e) {
      setBericht('❌ ' + e.message);
    } finally {
      setBezig(false);
    }
  }

  if (!beschikbaar) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-500">
        ℹ️ Push notificaties worden niet ondersteund in deze browser.
      </div>
    );
  }

  if (permissie === 'denied') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
        🔕 Notificaties zijn uitgeschakeld in je browserinstellingen.<br/>
        Schakel ze in via je browser om push berichten te ontvangen.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{aan ? '🔔' : '🔕'}</span>
          <div>
            <p className="font-bold text-gray-800 text-sm">Push notificaties</p>
            <p className="text-xs text-gray-500">Ontvang berichten bij transactie updates en KYC.</p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={laden || bezig}
          className={`relative w-12 h-6 rounded-full transition flex-shrink-0 ${
            aan ? 'bg-blue-600' : 'bg-gray-300'
          } ${(laden || bezig) ? 'opacity-50' : ''}`}>
          <span className={`absolute top-0.5 ${aan ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow transition-all`}/>
        </button>
      </div>

      {aan && (
        <button
          onClick={test}
          disabled={bezig}
          className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 rounded-lg transition">
          🧪 Test notificatie sturen
        </button>
      )}

      {bericht && (
        <p className={`text-xs ${bericht.startsWith('❌') ? 'text-red-600' : 'text-green-600'}`}>
          {bericht}
        </p>
      )}
    </div>
  );
}
