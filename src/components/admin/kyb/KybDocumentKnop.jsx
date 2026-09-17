/**
 * KybDocumentKnop.jsx — Opent een beveiligd document (KYB-document of KYC-beeld) in een nieuw tabblad.
 *
 * Nooit via <iframe> of <img src=API>: de API zet frame-ancestors 'none' en de sessie is een httpOnly-cookie.
 * Werkwijze (contract B16): fetch met credentials -> blob -> window.open(blobUrl).
 * Het tabblad wordt synchroon (in de klik) geopend en daarna naar de blob-URL gestuurd, zodat
 * pop-upblokkering na de asynchrone fetch geen roet in het eten gooit.
 *
 * Props:
 *   pad    — API-pad, bv. /admin/kyb/{id}/document/{docId} of /admin/kyc/{kycId}/document/voorkant
 *   label  — knoptekst (default "Openen")
 *   klein  — compacte variant (in tabellen)
 */
import { useState } from 'react';
import { API_URL } from '../../../services/api';
import { Eye } from '../../icons/Icons';
import { useTx } from './kybAdminLabels';

export default function KybDocumentKnop({ pad, label, klein = false, className = '' }) {
  const tx = useTx();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const tekst = label || tx('kyb_admin_document_open', 'Openen');

  async function open() {
    if (bezig) return;
    setFout('');
    setBezig(true);
    let venster;
    try { venster = window.open('', '_blank'); } catch { venster = null; }
    try {
      const res = await fetch(`${API_URL}${pad}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (venster && !venster.closed) {
        venster.location.href = blobUrl;
      } else {
        window.open(blobUrl, '_blank');
      }
      // Ruim de blob-URL op zodra de browser hem heeft geladen.
      setTimeout(() => { try { URL.revokeObjectURL(blobUrl); } catch { /* al opgeruimd */ } }, 60_000);
    } catch {
      if (venster && !venster.closed) { try { venster.close(); } catch { /* niets */ } }
      setFout(tx('kyc_review_fout_beeld', 'Kan document niet laden.'));
    } finally {
      setBezig(false);
    }
  }

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={open}
        disabled={bezig}
        className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-brand-700 font-semibold hover:bg-surface-3 disabled:opacity-50 transition ${klein ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
      >
        <Eye className={klein ? 'w-3.5 h-3.5' : 'w-4 h-4'} aria-hidden="true" />
        {bezig ? tx('laden', 'Laden...') : tekst}
      </button>
      {fout && <span role="alert" className="text-[11px] text-fg-error">{fout}</span>}
    </span>
  );
}
