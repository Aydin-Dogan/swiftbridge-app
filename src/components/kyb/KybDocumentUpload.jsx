/**
 * KybDocumentUpload.jsx — upload van een KYB-document (pdf/jpeg/png, max 8 MB)
 * met voortgang, preview (afbeeldingen via FileReader) en lijst van al
 * geuploade documenten van deze soort.
 *
 * Props:
 *   soort              DOC_SOORT (bv. 'kvk_uittreksel')
 *   onKlaar            (document) => void na een geslaagde upload
 *   verplicht          toont het sterretje
 *   uploadDocument     (soort, file, onProgress) => Promise<{ document }>  (uit de hook)
 *   verwijderDocument  (id) => Promise  (optioneel)
 *   documenten         al aanwezige documenten (alle soorten; wordt hier gefilterd)
 *   label / uitleg     alternatieve teksten
 */
import { useId, useRef, useState } from 'react';
import { useTaal } from '../../i18n';
import { parseError } from '../../services/api';
import { FileText, CheckCircle, Trash, Plus } from '../icons/Icons';
import { MAX_DOCUMENT_BYTES } from './kybOpties';

const TOEGESTAAN = ['application/pdf', 'image/jpeg', 'image/png'];

export default function KybDocumentUpload({
  soort, onKlaar, verplicht = false, uploadDocument, verwijderDocument, documenten = [], label, uitleg,
}) {
  const { t } = useTaal();
  const id = useId();
  const inputRef = useRef(null);
  const [bezig, setBezig] = useState(false);
  const [pct, setPct] = useState(0);
  const [fout, setFout] = useState('');
  const [preview, setPreview] = useState(null);
  const [bestandsnaam, setBestandsnaam] = useState('');

  const eigen = (documenten || []).filter((d) => d && d.soort === soort);
  const kopLabel = label || (soort === 'kvk_uittreksel' ? t('kyb_uittreksel_label') : t('kyb_info_document_toevoegen'));
  const uitlegTekst = uitleg || t('kyb_uittreksel_uitleg');

  async function kies(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFout('');
    if (!TOEGESTAAN.includes(file.type)) { setFout(t('errors.KYB_DOCUMENT_TYPE')); return; }
    if (file.size > MAX_DOCUMENT_BYTES) { setFout(t('errors.KYB_DOCUMENT_TE_GROOT')); return; }
    if (typeof uploadDocument !== 'function') return;

    setBestandsnaam(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    setBezig(true);
    setPct(0);
    try {
      const res = await uploadDocument(soort, file, setPct);
      setPreview(null);
      setBestandsnaam('');
      onKlaar?.(res?.document || null);
    } catch (err) {
      setFout(parseError(err, t));
      setPreview(null);
    } finally {
      setBezig(false);
    }
  }

  async function verwijder(docId) {
    if (typeof verwijderDocument !== 'function') return;
    setFout('');
    try {
      await verwijderDocument(docId);
    } catch (err) {
      setFout(parseError(err, t));
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-1">
        {kopLabel}
        {verplicht && <span className="text-fg-error ml-0.5" aria-hidden="true">*</span>}
      </label>
      <p id={`${id}-uitleg`} className="text-xs text-ink-3 mb-2">{uitlegTekst}</p>

      {eigen.length > 0 && (
        <ul className="space-y-2 mb-3" aria-live="polite">
          {eigen.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-md border border-border-success bg-surface px-3 py-2.5 text-sm">
              <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-ink-1 truncate">
                  {soort === 'kvk_uittreksel' ? t('kyb_uittreksel_ontvangen') : t('kyb_stap_voltooid')}
                </span>
                {d.bestandsnaam && <span className="block text-xs text-ink-3 truncate">{d.bestandsnaam}</span>}
              </span>
              {typeof verwijderDocument === 'function' && (
                <button
                  type="button"
                  onClick={() => verwijder(d.id)}
                  aria-label={`${t('kyb_verwijder_knop')}: ${d.bestandsnaam || soort}`}
                  className="w-10 h-10 rounded-md flex items-center justify-center text-ink-3 hover:text-fg-error hover:bg-surface-2 transition"
                >
                  <Trash className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={bezig}
        aria-describedby={`${id}-uitleg`}
        className="w-full min-h-[64px] border border-dashed border-border hover:border-brand-400 hover:bg-brand-50 rounded-md p-4 text-center transition disabled:opacity-60"
      >
        {bezig ? (
          <span className="block space-y-2">
            <span className="block text-sm text-ink-2">{bestandsnaam}</span>
            <span className="block h-2 rounded-full bg-surface-2 overflow-hidden">
              <span
                className="block h-full bg-brand-600 transition-all"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2 text-sm font-semibold text-ink-2">
            {preview ? <FileText className="w-5 h-5" aria-hidden="true" /> : <Plus className="w-5 h-5" aria-hidden="true" />}
            {eigen.length > 0 ? t('kyb_info_document_toevoegen') : kopLabel}
          </span>
        )}
      </button>
      {preview && bezig && (
        <img src={preview} alt="" className="h-24 mx-auto mt-2 rounded-md object-cover shadow-soft" />
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={kies}
        className="hidden"
      />
      {fout && <p role="alert" className="mt-2 text-[11px] text-fg-error">{fout}</p>}
    </div>
  );
}
