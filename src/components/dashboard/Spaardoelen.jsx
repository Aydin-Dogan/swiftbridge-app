/**
 * Spaardoelen.jsx — Dashboard card voor user spaardoelen (Verbetering AAA).
 *
 * Toont alle doelen met progress-bar, deadline-countdown en suggested
 * wekelijkse/maandelijkse bijdrage. Inline form om nieuw doel toe te
 * voegen. PATCH-knop voor huidig bedrag aanpassen.
 *
 * Filosofie: motivatie + concrete actie. "Stuur €40/week" is tastbaarder
 * dan "spaar voor doel".
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, parseError } from '../../services/api';
import { useTaal } from '../../i18n';
import ConfirmDialog from '../ConfirmDialog';

const EMOJI_KEUZES = ['🎯', '🎁', '✈️', '🏠', '🎓', '👶', '🚗', '💍', '🎉', '❤️'];

function ProgressBar({ procent, bereikt }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          bereikt
            ? 'bg-gradient-to-r from-emerald-400 to-green-500'
            : 'bg-gradient-to-r from-blue-400 to-indigo-500'
        }`}
        style={{ width: `${Math.min(100, procent)}%` }}
      />
    </div>
  );
}

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n || 0);
}

function fmtDeadline(iso, t) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('nl-NL', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

export default function Spaardoelen() {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [bewerkId, setBewerkId] = useState(null);
  const [verwijderId, setVerwijderId] = useState(null);
  const [verwijderBezig, setVerwijderBezig] = useState(false);

  const laad = useCallback(async () => {
    setLaden(true);
    try {
      const d = await apiFetch('/spaardoelen');
      setItems(d.spaardoelen || []);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [t]);

  useEffect(() => { laad(); }, [laad]);

  async function bevestigVerwijder() {
    if (!verwijderId) return;
    setVerwijderBezig(true);
    try {
      await apiFetch(`/spaardoelen/${verwijderId}`, { method: 'DELETE' });
      await laad();
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setVerwijderBezig(false);
      setVerwijderId(null);
    }
  }

  // Verberg sectie helemaal als user geen doelen heeft en formOpen=false
  // — voorkom Dashboard-clutter voor users die deze feature niet gebruiken.
  // Bij eerste keer tonen we wel een uitnodiging-knop.
  const heeftDoelen = items.length > 0;

  return (
    <section
      className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-lg shadow-sm animate-fade-up overflow-hidden"
      aria-label={t('spaardoel_titel')}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span aria-hidden="true">🎯</span>
          {t('spaardoel_titel')}
        </h3>
        {heeftDoelen && !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            + {t('spaardoel_nieuw_kort')}
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {fout && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
            {fout}
          </div>
        )}

        {laden && !items.length ? (
          <div className="space-y-3">
            <div className="h-3 w-1/2 rounded animate-shimmer" />
            <div className="h-2 w-full rounded animate-shimmer" />
          </div>
        ) : !heeftDoelen && !formOpen ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-600 mb-3">
              {t('spaardoel_intro')}
            </p>
            <button
              onClick={() => setFormOpen(true)}
              className="btn-primary text-sm inline-flex items-center gap-1.5"
            >
              {t('spaardoel_nieuw')}
            </button>
          </div>
        ) : (
          <>
            {items.map(item => (
              <SpaardoelKaart
                key={item.id}
                item={item}
                onUpdate={laad}
                onBewerk={() => setBewerkId(item.id)}
                onVerwijder={() => setVerwijderId(item.id)}
                bewerkActief={bewerkId === item.id}
                onSluitBewerk={() => setBewerkId(null)}
                onNaarOverboeking={() => {
                  // XXX — smart prefill: ontvanger uit doel + suggested bedrag.
                  // suggested = min(suggestedPerWeek, resterendEur) — week-bijdrage tenzij doel al binnen 1 transactie
                  const resterend = Math.max(0, Number(item.doel_bedrag_eur) - Number(item.huidig_bedrag_eur || 0));
                  const bedrag = item.suggestedPerWeek
                    ? Math.min(item.suggestedPerWeek, resterend || item.suggestedPerWeek)
                    : (resterend || 100);
                  try {
                    localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
                      ontvanger: item.ontvanger_naam || '',
                      bedrag,
                      valuta: item.valuta_doel || 'TRY',
                    }));
                  } catch {/* private mode */}
                  window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
                }}
              />
            ))}
            {formOpen && (
              <SpaardoelForm onSluit={() => setFormOpen(false)} onAangemaakt={() => { setFormOpen(false); laad(); }} />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!verwijderId}
        onClose={() => !verwijderBezig && setVerwijderId(null)}
        onConfirm={bevestigVerwijder}
        title={t('spaardoel_verwijder_titel')}
        message={t('spaardoel_verwijder_bericht')}
        variant="destructive"
        busy={verwijderBezig}
      />
    </section>
  );
}

// ── Eén spaardoel-kaart ────────────────────────────────────────────────────
function SpaardoelKaart({ item, onUpdate, onBewerk, onVerwijder, bewerkActief, onSluitBewerk, onNaarOverboeking }) {
  const { t } = useTaal();
  const [nieuwBedrag, setNieuwBedrag] = useState(String(item.huidig_bedrag_eur || 0));
  const [bezig, setBezig] = useState(false);

  async function update() {
    setBezig(true);
    try {
      await apiFetch(`/spaardoelen/${item.id}`, {
        method: 'PATCH',
        body: { huidigBedragEur: Number(nieuwBedrag) || 0 },
      });
      onSluitBewerk();
      await onUpdate();
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className={`rounded-xl border p-3 ${
      item.bereikt
        ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="text-xl flex-shrink-0" aria-hidden="true">{item.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-gray-900 truncate">
              {item.naam}
              {item.bereikt && <span className="ml-1.5 text-xs text-emerald-700">✓ {t('spaardoel_bereikt')}</span>}
            </div>
            {item.ontvanger_naam && (
              <div className="text-xs text-gray-500 truncate">→ {item.ontvanger_naam}</div>
            )}
          </div>
        </div>
        <button
          onClick={onVerwijder}
          className="text-xs text-gray-400 hover:text-red-600 px-1 flex-shrink-0"
          aria-label={t('spaardoel_verwijder')}
        >
          ✕
        </button>
      </div>

      <div className="flex items-baseline justify-between text-sm mb-1.5">
        <span className="font-bold text-gray-900">{fmtEur(item.huidig_bedrag_eur)}</span>
        <span className="text-xs text-gray-500">
          van {fmtEur(item.doel_bedrag_eur)} ({item.procent}%)
        </span>
      </div>

      <ProgressBar procent={item.procent} bereikt={item.bereikt} />

      {/* Deadline + suggesties */}
      {item.deadline && !item.bereikt && (
        <div className="mt-2 text-xs text-gray-600 space-y-0.5">
          <div>
            {fmtDeadline(item.deadline, t)} · <span className="font-semibold">{item.dagenResterend} {t('spaardoel_dagen_resterend')}</span>
          </div>
          {item.suggestedPerWeek > 0 && (
            <div className="text-emerald-700 font-medium">
              {t('spaardoel_suggest_week', { bedrag: item.suggestedPerWeek })}
            </div>
          )}
        </div>
      )}

      {/* Bewerk-form */}
      {bewerkActief ? (
        <div className="mt-3 flex gap-2 items-center">
          <input
            type="number"
            min="0"
            step="1"
            value={nieuwBedrag}
            onChange={(e) => setNieuwBedrag(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="0"
            disabled={bezig}
          />
          <button
            onClick={update}
            disabled={bezig}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded"
          >
            {bezig ? '...' : t('spaardoel_opslaan')}
          </button>
          <button
            onClick={onSluitBewerk}
            disabled={bezig}
            className="text-xs text-gray-500 hover:text-gray-700 px-1"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onBewerk}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded px-2.5 py-1.5 transition"
          >
            {t('spaardoel_update')}
          </button>
          {!item.bereikt && (
            <button
              onClick={onNaarOverboeking}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded px-2.5 py-1.5 transition"
            >
              {t('spaardoel_stuur_nu')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Form voor nieuw spaardoel ─────────────────────────────────────────────
function SpaardoelForm({ onSluit, onAangemaakt }) {
  const { t } = useTaal();
  const [naam, setNaam] = useState('');
  const [doelBedrag, setDoelBedrag] = useState('500');
  const [deadline, setDeadline] = useState('');
  const [ontvanger, setOntvanger] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (bezig) return;
    setBezig(true);
    setFout('');
    try {
      await apiFetch('/spaardoelen', {
        method: 'POST',
        body: {
          naam: naam.trim(),
          doelBedragEur: Number(doelBedrag),
          deadline: deadline || undefined,
          ontvangerNaam: ontvanger.trim() || undefined,
          emoji,
        },
      });
      onAangemaakt?.();
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-blue-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-sm text-blue-900">{t('spaardoel_form_titel')}</h4>
        <button type="button" onClick={onSluit} className="text-xs text-blue-700">✕</button>
      </div>

      {/* Emoji picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('spaardoel_form_emoji')}</label>
        <div className="flex gap-1.5 flex-wrap">
          {EMOJI_KEUZES.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`text-xl w-8 h-8 rounded-full flex items-center justify-center transition ${
                emoji === e ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-white hover:bg-blue-100'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('spaardoel_form_naam')}</label>
        <input
          type="text"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder={t('spaardoel_form_naam_placeholder')}
          maxLength={100}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('spaardoel_form_bedrag')}</label>
          <input
            type="number"
            min="1"
            step="10"
            value={doelBedrag}
            onChange={(e) => setDoelBedrag(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('spaardoel_form_deadline')}</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('spaardoel_form_ontvanger')}</label>
        <input
          type="text"
          value={ontvanger}
          onChange={(e) => setOntvanger(e.target.value)}
          placeholder={t('spaardoel_form_ontvanger_placeholder')}
          maxLength={100}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {fout && (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">{fout}</div>
      )}

      <button
        type="submit"
        disabled={bezig || !naam.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-lg transition"
      >
        {bezig ? '...' : t('spaardoel_form_aanmaken')}
      </button>
    </form>
  );
}
