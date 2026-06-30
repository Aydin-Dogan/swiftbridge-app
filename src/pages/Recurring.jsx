/**
 * Recurring.jsx — Pagina voor terugkerende overboekingen.
 *
 * Route: /app/recurring
 *
 * Layout:
 * - Header met titel + uitleg
 * - "+ Nieuwe terugkerende overboeking" knop (opent RecurringFormulier)
 * - Lijst met RecurringKaart's (sorted: actief eerst, dan volgende_uitvoering ASC)
 * - Lege state met CTA als nog niets bestaat
 * - KYC / email-verificatie melding als API 403 geeft
 *
 * State management: dit is een client-only page met fetch on mount.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../i18n';
import { apiFetch, parseError } from '../services/api';
import RecurringKaart from '../components/recurring/RecurringKaart';
import RecurringFormulier from '../components/recurring/RecurringFormulier';
import ConfirmDialog from '../components/ConfirmDialog';
import { Refresh } from '../components/icons/Icons';

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
  // Confirmation dialog state (Verbetering DD) — vervangt window.confirm()
  // met een nette modal die ESC-toets + click-outside ondersteunt.
  const [bevestig, setBevestig] = useState(null);
  // bevestig = { actie: 'uitvoer'|'verwijder', id, title, message, variant }
  // Verbetering QQ: SEPA-mandaat-status voor automatische incasso.
  const [mandaat, setMandaat] = useState(null); // { incassoBeschikbaar, heeftMandaat }
  const [incassoBezig, setIncassoBezig] = useState(false);

  const laad = useCallback(async () => {
    setLaden(true);
    setFout('');
    try {
      const d = await apiFetch('/recurring');
      setItems(d.recurring || []);
      // Incasso-status best-effort ophalen — mag de pagina niet blokkeren.
      try {
        const m = await apiFetch('/recurring/mandaat/status');
        setMandaat(m);
      } catch { /* incasso-status niet kritiek */ }
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [t]);

  // Start de SEPA-mandaat-flow → Mollie-checkout. Gebruikt de eerste actieve
  // schedule als basis voor de eerste incasso (de cron incasseert de rest).
  async function stelIncassoIn() {
    if (incassoBezig) return;
    const doel = items.find(i => i.actief) || items[0];
    if (!doel) return;
    setIncassoBezig(true);
    setFout('');
    try {
      const r = await apiFetch(`/recurring/${doel.id}/mandaat/start`, { method: 'POST' });
      if (r?.checkoutUrl) {
        window.location.href = r.checkoutUrl;   // door naar Mollie-checkout
      } else {
        await laad();
        setIncassoBezig(false);
      }
    } catch (e) {
      setFout(parseError(e, t) || t('recurring_incasso_fout'));
      setIncassoBezig(false);
    }
  }

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

  // Trigger bevestiging-dialog ipv direct uit te voeren
  function vraagUitvoer(id) {
    if (bezig) return;
    setBevestig({
      actie: 'uitvoer',
      id,
      title: t('recurring_bevestig_uitvoer_titel'),
      message: t('recurring_bevestig_uitvoer'),
      variant: 'default',
    });
  }

  function vraagVerwijder(id) {
    if (bezig) return;
    setBevestig({
      actie: 'verwijder',
      id,
      title: t('recurring_bevestig_verwijder_titel'),
      message: t('recurring_bevestig_verwijder'),
      variant: 'destructive',
    });
  }

  async function bevestigUitvoeren() {
    if (!bevestig || bezig) return;
    const { actie, id } = bevestig;
    setBezig(true);

    if (actie === 'uitvoer') {
      setMeldingId(id);
      try {
        await apiFetch(`/recurring/${id}/uitvoeren-nu`, { method: 'POST' });
        setMelding(t('recurring_melding_uitvoer_ok'));
        await laad();
      } catch (e) {
        setFout(parseError(e, t));
      } finally {
        setBezig(false);
        setBevestig(null);
        setTimeout(() => { setMelding(''); setMeldingId(null); }, 3500);
      }
    } else if (actie === 'verwijder') {
      try {
        await apiFetch(`/recurring/${id}`, { method: 'DELETE' });
        await laad();
      } catch (e) {
        setFout(parseError(e, t));
      } finally {
        setBezig(false);
        setBevestig(null);
      }
    } else {
      setBezig(false);
      setBevestig(null);
    }
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

      {/* Verbetering QQ: automatische SEPA-incasso. Toont alleen wanneer incasso
          beschikbaar is (live Mollie-modus). */}
      {mandaat?.incassoBeschikbaar && (
        mandaat.heeftMandaat ? (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            {t('recurring_incasso_actief')}
          </div>
        ) : items.length > 0 ? (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-bold text-amber-900 text-sm">{t('recurring_incasso_titel')}</h3>
            <p className="text-amber-800 text-sm mt-1 mb-3">{t('recurring_incasso_uitleg')}</p>
            <button
              type="button"
              onClick={stelIncassoIn}
              disabled={incassoBezig}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl active:scale-95 transition text-sm"
            >
              {incassoBezig ? t('recurring_incasso_bezig') : t('recurring_incasso_knop')}
            </button>
          </div>
        ) : null
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
          <Refresh className="w-10 h-10 text-gray-300 mx-auto mb-3" />
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
              onUitvoer={vraagUitvoer}
              onVerwijder={vraagVerwijder}
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

      {/* Bevestig-dialog voor uitvoer + verwijder (Verbetering DD) */}
      <ConfirmDialog
        open={!!bevestig}
        onClose={() => !bezig && setBevestig(null)}
        onConfirm={bevestigUitvoeren}
        title={bevestig?.title}
        message={bevestig?.message}
        variant={bevestig?.variant}
        busy={bezig}
      />
    </div>
  );
}
