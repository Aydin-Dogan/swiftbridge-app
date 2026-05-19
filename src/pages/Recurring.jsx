/**
 * Recurring.jsx — Pagina voor terugkerende overboekingen.
 *
 * Route: /app/recurring
 *
 * Layout:
 *  - Header met titel + uitleg
 *  - "+ Nieuwe terugkerende overboeking" knop (opent RecurringFormulier)
 *  - Lijst met RecurringKaart's (sorted: actief eerst, dan volgende_uitvoering ASC)
 *  - Lege state met CTA als nog niets bestaat
 *  - KYC / email-verificatie melding als API 403 geeft
 *
 * State management: dit is een client-only page met fetch on mount.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../i18n';
import { apiFetch, parseError } from '../services/api';
import RecurringKaart from '../components/recurring/RecurringKaart';
import RecurringFormulier from '../components/recurring/RecurringFormulier';

export default function Recurring() {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [meldingId, setMeldingId] = useState(null);
  const [melding, setMelding] = useState('');

  const laad = useCallback(async () => {
    setLaden(true);
    setFout('');
    try {
      const d = await apiFetch('/recurring');
      setItems(d.recurring || []);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [t]);

  useEffect(() => { laad(); }, [laad]);

  async function pauzeer(id) {
    if (bezig) return;
    setBezig(true);
    try {
      await apiFetch(`/recurring/${id}`, { method: 'PATCH', body: { actief: false } });
      await laad();
    } catch (e) {
      setFout(parseError(e, t));
    } finally { setBezig(false); }
  }

  async function hervat(id) {
    if (bezig) return;
    setBezig(true);
    try {
      await apiFetch(`/recurring/${id}`, { method: 'PATCH', body: { actief: true } });
      await laad();
    } catch (e) {
      setFout(parseError(e, t));
    } finally { setBezig(false); }
  }

  async function uitvoer(id) {
    if (bezig) return;
    if (!confirm(t('recurring_bevestig_uitvoer'))) return;
    setBezig(true);
    setMeldingId(id);
    try {
      const r = await apiFetch(`/recurring/${id}/uitvoeren-nu`, { method: 'POST' });
      setMelding(t('recurring_melding_uitvoer_ok'));
      await laad();
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
      setTimeout(() => { setMelding(''); setMeldingId(null); }, 3500);
    }
  }

  async function verwijder(id) {
    if (bezig) return;
    if (!confirm(t('recurring_bevestig_verwijder'))) return;
    setBezig(true);
    try {
      await apiFetch(`/recurring/${id}`, { method: 'DELETE' });
      await laad();
    } catch (e) {
      setFout(parseError(e, t));
    } finally { setBezig(false); }
  }

  function aangemaakt(neuw) {
    // Voeg direct toe + refresh om sorting/lijst-shape exact gelijk aan API te krijgen
    setItems(prev => [neuw, ...prev]);
    laad();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/app')}
            className="text-xs text-blue-600 hover:underline mb-2 inline-block"
          >
            ← {t('terug')}
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">{t('recurring_pagina_titel')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('recurring_pagina_uitleg')}</p>
        </div>
      </header>

      {melding && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-sm">
          {melding}
        </div>
      )}

      {fout && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
          {fout}
        </div>
      )}

      <button
        type="button"
        onClick={() => setFormOpen(true)}
        className="w-full mb-5 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition"
      >
        + {t('recurring_knop_nieuw')}
      </button>

      {laden ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🔁</div>
          <h3 className="font-bold text-gray-800">{t('recurring_leeg_titel')}</h3>
          <p className="text-gray-500 text-sm mt-1 mb-4">{t('recurring_leeg_uitleg')}</p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl active:scale-95 transition text-sm"
          >
            {t('recurring_leeg_cta')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <RecurringKaart
              key={item.id}
              item={item}
              onPauzeer={pauzeer}
              onHervat={hervat}
              onUitvoer={uitvoer}
              onVerwijder={verwijder}
              bezig={bezig && meldingId === item.id}
            />
          ))}
        </div>
      )}

      <RecurringFormulier
        open={formOpen}
        onSluit={() => setFormOpen(false)}
        onAangemaakt={aangemaakt}
      />
    </div>
  );
}
