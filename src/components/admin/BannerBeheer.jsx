/**
 * BannerBeheer.jsx — Admin UI voor het beheren van app-wide banners.
 *
 * Functies:
 * - Lijst van alle banners (incl. inactief) via GET /admin/banners
 * - "Nieuwe banner" knop → modal met formulier (POST /admin/banners)
 * - Per rij: edit (PATCH), toggle actief/inactief, delete (soft via DELETE)
 *
 * Geldige types: info, success, warning, error
 */
import { useState, useEffect, useCallback } from 'react';
import { apiFetch, parseError } from '../../services/api';
import { useTaal } from '../../i18n';
import { Info, CheckCircle, AlertTriangle, XCircle, Plus, Trash } from '../icons/Icons';

const TYPES = [
  { id: 'info', label: 'Info', icoon: Info, kleur: 'text-brand-700' },
  { id: 'success', label: 'Succes', icoon: CheckCircle, kleur: 'text-success-700' },
  { id: 'warning', label: 'Waarschuwing', icoon: AlertTriangle, kleur: 'text-accent-600' },
  { id: 'error', label: 'Fout', icoon: XCircle, kleur: 'text-red-700' },
];

function fmtDatum(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function leegFormulier() {
  return {
    id: '',
    titel: '',
    bericht: '',
    type: 'info',
    sluitbaar: true,
    actief: true,
    cta_tekst: '',
    cta_url: '',
    start_op: '',
    eindigt_op: '',
  };
}

// ── Modal-formulier ──────────────────────────────────────────────────────────
function BannerFormulier({ initieel, onOpslaan, onAnnuleren, opslaan, fout }) {
  const [form, setForm] = useState(initieel || leegFormulier());

  function update(veld, waarde) {
    setForm((f) => ({ ...f, [veld]: waarde }));
  }

  function submit(e) {
    e.preventDefault();
    onOpslaan(form);
  }

  return (
    <form
      onSubmit={submit}
      className="bg-surface border border-border rounded-md p-5 space-y-3 text-ink-1 max-h-[85vh] overflow-y-auto shadow-soft-lg"
    >
      <div className="font-display font-medium text-lg flex items-center gap-2">
        <span>{form.id ? 'Banner bewerken' : 'Nieuwe banner'}</span>
      </div>

      <label className="block">
        <span className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">Titel *</span>
        <input
          type="text"
          required
          maxLength={200}
          value={form.titel}
          onChange={(e) => update('titel', e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
          placeholder="Onderhoud zondag 02:00-04:00"
        />
      </label>

      <label className="block">
        <span className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">Bericht *</span>
        <textarea
          required
          maxLength={1000}
          rows={3}
          value={form.bericht}
          onChange={(e) => update('bericht', e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 resize-none"
          placeholder="Tijdens dit venster zijn overboekingen tijdelijk niet mogelijk."
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">Type</span>
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
          >
            {TYPES.map((tp) => (
              <option key={tp.id} value={tp.id} className="text-gray-900">
                {tp.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 justify-end pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.actief}
              onChange={(e) => update('actief', e.target.checked)}
              className="w-4 h-4 accent-brand-500"
            />
            <span>Actief</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.sluitbaar}
              onChange={(e) => update('sluitbaar', e.target.checked)}
              className="w-4 h-4 accent-brand-500"
            />
            <span>Sluitbaar (× knop)</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">CTA tekst (optioneel)</span>
          <input
            type="text"
            value={form.cta_tekst || ''}
            onChange={(e) => update('cta_tekst', e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            placeholder="Meer info"
          />
        </label>
        <label className="block">
          <span className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">CTA URL (optioneel)</span>
          <input
            type="text"
            value={form.cta_url || ''}
            onChange={(e) => update('cta_url', e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            placeholder="/blog/onderhoud of https://…"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">Start (optioneel)</span>
          <input
            type="datetime-local"
            value={form.start_op || ''}
            onChange={(e) => update('start_op', e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
          />
        </label>
        <label className="block">
          <span className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">Eindigt (optioneel)</span>
          <input
            type="datetime-local"
            value={form.eindigt_op || ''}
            onChange={(e) => update('eindigt_op', e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
          />
        </label>
      </div>

      {fout && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-xs">
          {fout}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onAnnuleren}
          className="flex-1 bg-surface hover:bg-surface-3 border border-border text-ink-1 font-semibold py-2.5 rounded-md text-sm transition"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={opslaan}
          className="flex-1 btn-inst disabled:opacity-50 py-2.5"
        >
          {opslaan ? 'Opslaan…' : (form.id ? 'Bijwerken' : 'Aanmaken')}
        </button>
      </div>
    </form>
  );
}

// ── Hoofdcomponent ──────────────────────────────────────────────────────────
export default function BannerBeheer() {
  const { t } = useTaal();
  const [banners, setBanners] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [modal, setModal] = useState(null); // null | {} | banner
  const [opslaan, setOpslaan] = useState(false);
  const [modalFout, setModalFout] = useState('');

  const laad = useCallback(async () => {
    setLaden(true); setFout('');
    try {
      const data = await apiFetch('/admin/banners?limit=200');
      setBanners(data.banners || []);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [t]);

  useEffect(() => { laad(); }, [laad]);

  function openNieuw() { setModalFout(''); setModal(leegFormulier()); }
  function openBewerken(b) {
    setModalFout('');
    setModal({
      id: b.id,
      titel: b.titel,
      bericht: b.bericht,
      type: b.type,
      actief: b.actief,
      sluitbaar: b.sluitbaar,
      cta_tekst: b.ctaTekst || '',
      cta_url: b.ctaUrl || '',
      start_op: b.startOp ? b.startOp.slice(0, 16) : '',
      eindigt_op: b.eindigtOp ? b.eindigtOp.slice(0, 16) : '',
    });
  }
  function sluitModal() { setModal(null); setModalFout(''); }

  async function opslaanForm(form) {
    setOpslaan(true); setModalFout('');
    try {
      const body = {
        titel: form.titel,
        bericht: form.bericht,
        type: form.type,
        actief: !!form.actief,
        sluitbaar: !!form.sluitbaar,
        cta_tekst: form.cta_tekst || null,
        cta_url: form.cta_url || null,
        start_op: form.start_op || null,
        eindigt_op: form.eindigt_op || null,
      };
      if (form.id) {
        await apiFetch(`/admin/banners/${form.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/admin/banners', { method: 'POST', body });
      }
      sluitModal();
      window.dispatchEvent(new CustomEvent('swiftbridge_banners_update'));
      laad();
    } catch (e) {
      setModalFout(parseError(e, t));
    } finally {
      setOpslaan(false);
    }
  }

  async function toggleActief(b) {
    try {
      await apiFetch(`/admin/banners/${b.id}`, {
        method: 'PATCH',
        body: { actief: !b.actief },
      });
      window.dispatchEvent(new CustomEvent('swiftbridge_banners_update'));
      laad();
    } catch (e) {
      setFout(parseError(e, t));
    }
  }

  async function verwijder(b) {
    if (!confirm(`Banner "${b.titel}" verwijderen? Dit zet hem op inactief.`)) return;
    try {
      await apiFetch(`/admin/banners/${b.id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('swiftbridge_banners_update'));
      laad();
    } catch (e) {
      setFout(parseError(e, t));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-ink-2">
          {banners.length} banner{banners.length === 1 ? '' : 's'} ·{' '}
          <span className="text-success-700 font-semibold">
            {banners.filter((b) => b.actief).length} actief
          </span>
        </div>
        <button
          onClick={openNieuw}
          className="btn-inst gap-1.5"
        >
          <Plus className="w-4 h-4" /> Nieuwe banner
        </button>
      </div>

      {fout && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>
      )}

      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-3 border-b border-border">
              <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Titel</th>
                <th className="px-4 py-3">Bericht</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {laden ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-2">Laden…</td></tr>
              ) : banners.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-2">
                  Geen banners. Klik op "Nieuwe banner" om de eerste aan te maken.
                </td></tr>
              ) : banners.map((b) => {
                const tp = TYPES.find((t) => t.id === b.type) || TYPES[0];
                return (
                  <tr key={b.id} className="hover:bg-surface-3 transition">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border border-border bg-surface-3 ${tp.kleur}`}>
                        <tp.icoon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{tp.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-1 max-w-[200px] truncate" title={b.titel}>
                      {b.titel}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-2 max-w-[260px] truncate" title={b.bericht}>
                      {b.bericht}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {b.startOp || b.eindigtOp
                        ? `${fmtDatum(b.startOp) } → ${ fmtDatum(b.eindigtOp)}`
                        : 'Altijd zichtbaar'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActief(b)}
                        title="Klik om te togglen"
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition ${
                          b.actief
                            ? 'bg-success-50 border border-success-100 text-success-700 hover:bg-success-100'
                            : 'bg-surface-3 border border-border text-gray-500 hover:bg-surface-2'
                        }`}
                      >
                        {b.actief ? '● Actief' : '○ Inactief'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openBewerken(b)}
                        className="text-brand-700 hover:underline underline-offset-4 text-xs font-semibold px-2 py-1 rounded transition"
                      >
                        Bewerk
                      </button>
                      <button
                        onClick={() => verwijder(b)}
                        className="ml-1 inline-flex items-center gap-1 text-red-700 hover:underline underline-offset-4 text-xs font-semibold px-2 py-1 rounded transition"
                      >
                        <Trash className="w-3.5 h-3.5" /> Verwijder
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) sluitModal(); }}
        >
          <div className="w-full max-w-lg">
            <BannerFormulier
              initieel={modal}
              onOpslaan={opslaanForm}
              onAnnuleren={sluitModal}
              opslaan={opslaan}
              fout={modalFout}
            />
          </div>
        </div>
      )}
    </div>
  );
}
