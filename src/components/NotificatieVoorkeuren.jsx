/**
 * NotificatieVoorkeuren.jsx — toggles voor email / push / whatsapp opt-in (GGG).
 *
 * Sluit aan op PATCH /users/me dat email_opt_in + push_opt_in + whatsapp_opt_in
 * ondersteunt. Toont 3 toggles, slaat direct op bij wijziging.
 */
import { useState } from 'react';
import { apiFetch, parseError } from '../services/api';
import { useTaal } from '../i18n';

function Toggle({ aan, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aan}
      onClick={() => onChange(!aan)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${
        aan ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          aan ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function NotificatieVoorkeuren({ profiel, onUpdate }) {
  const { t } = useTaal();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const huidigEmail = profiel?.emailOptIn ?? true;
  const huidigPush = profiel?.pushOptIn ?? true;
  const huidigWhatsApp = profiel?.whatsappOptIn ?? true;

  async function update(veld, waarde) {
    setBezig(true);
    setFout('');
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: { [veld]: waarde },
      });
      onUpdate?.({ [veld]: waarde });
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="card-glass p-5 animate-fade-up border-l-4 border-indigo-500 space-y-3">
      <div>
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-700" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {t('notif_voorkeuren_titel')}
        </h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          {t('notif_voorkeuren_uitleg')}
        </p>
      </div>

      <div className="space-y-2">
        {/* Email */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-100">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-lg" aria-hidden="true">📧</span>
            <div>
              <div className="font-semibold text-sm text-gray-900">{t('notif_email_label')}</div>
              <div className="text-xs text-gray-500">{t('notif_email_uitleg')}</div>
            </div>
          </div>
          <Toggle aan={huidigEmail} onChange={(v) => update('emailOptIn', v)} disabled={bezig} />
        </div>

        {/* Push */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-100">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-lg" aria-hidden="true">🔔</span>
            <div>
              <div className="font-semibold text-sm text-gray-900">{t('notif_push_label')}</div>
              <div className="text-xs text-gray-500">{t('notif_push_uitleg')}</div>
            </div>
          </div>
          <Toggle aan={huidigPush} onChange={(v) => update('pushOptIn', v)} disabled={bezig} />
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-100">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-lg" aria-hidden="true">💬</span>
            <div>
              <div className="font-semibold text-sm text-gray-900">{t('notif_whatsapp_label')}</div>
              <div className="text-xs text-gray-500">{t('notif_whatsapp_uitleg')}</div>
            </div>
          </div>
          <Toggle aan={huidigWhatsApp} onChange={(v) => update('whatsappOptIn', v)} disabled={bezig} />
        </div>
      </div>

      {fout && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs">
          {fout}
        </div>
      )}
    </div>
  );
}
