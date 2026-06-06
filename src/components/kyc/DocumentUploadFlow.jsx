/**
 * DocumentUploadFlow.jsx — Document-based KYC wizard (fallback voor users zonder NL bank/iDIN)
 *
 * Stappen:
 * 1. Document type kiezen (Paspoort / ID-kaart / Rijbewijs)
 * 2. Document info (nummer, geboortedatum, nationaliteit)
 * 3. Foto voorkant (file input + drag-drop)
 * 4. Foto achterkant (alleen ID-kaart + Rijbewijs)
 * 5. Selfie (file input OF camera via getUserMedia)
 * 6. Review + verzenden
 *
 * Submit: multipart/form-data POST /kyc/upload-document met credentials:'include'.
 * Backend zet kyc_records.bron='document_upload', status='in_behandeling'.
 *
 * Client-side validatie:
 * - max 5MB per file
 * - alleen image/jpeg + image/png
 *
 * A11y: labels op alle inputs, aria-describedby voor instructies.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL, parseError } from '../../services/api';
import { useTaal } from '../../i18n';

const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const TOEGESTANE_TYPES = ['image/jpeg', 'image/png'];

// ── Document types ────────────────────────────────────────────────────────────
const DOC_TYPES = [
  { value: 'paspoort', icoon: '📘', tKey: 'kyc_doc_paspoort', heeftAchterkant: false },
  { value: 'id_kaart', icoon: '🪪', tKey: 'kyc_doc_id_kaart', heeftAchterkant: true },
  { value: 'rijbewijs', icoon: '🚗', tKey: 'kyc_doc_rijbewijs', heeftAchterkant: true },
];

// Top 50 landen (focus op diaspora-relevante landen)
const LANDEN = [
  { code: 'TR', vlag: '🇹🇷', naam: 'Türkiye' },
  { code: 'NL', vlag: '🇳🇱', naam: 'Nederland' },
  { code: 'MA', vlag: '🇲🇦', naam: 'Marokko' },
  { code: 'SY', vlag: '🇸🇾', naam: 'Syrië' },
  { code: 'AF', vlag: '🇦🇫', naam: 'Afghanistan' },
  { code: 'IR', vlag: '🇮🇷', naam: 'Iran' },
  { code: 'IQ', vlag: '🇮🇶', naam: 'Irak' },
  { code: 'PK', vlag: '🇵🇰', naam: 'Pakistan' },
  { code: 'AZ', vlag: '🇦🇿', naam: 'Azerbeidzjan' },
  { code: 'UZ', vlag: '🇺🇿', naam: 'Oezbekistan' },
  { code: 'KZ', vlag: '🇰🇿', naam: 'Kazachstan' },
  { code: 'TM', vlag: '🇹🇲', naam: 'Turkmenistan' },
  { code: 'KG', vlag: '🇰🇬', naam: 'Kirgizië' },
  { code: 'TJ', vlag: '🇹🇯', naam: 'Tadzjikistan' },
  { code: 'DE', vlag: '🇩🇪', naam: 'Duitsland' },
  { code: 'BE', vlag: '🇧🇪', naam: 'België' },
  { code: 'FR', vlag: '🇫🇷', naam: 'Frankrijk' },
  { code: 'IT', vlag: '🇮🇹', naam: 'Italië' },
  { code: 'ES', vlag: '🇪🇸', naam: 'Spanje' },
  { code: 'PT', vlag: '🇵🇹', naam: 'Portugal' },
  { code: 'PL', vlag: '🇵🇱', naam: 'Polen' },
  { code: 'RO', vlag: '🇷🇴', naam: 'Roemenië' },
  { code: 'BG', vlag: '🇧🇬', naam: 'Bulgarije' },
  { code: 'GR', vlag: '🇬🇷', naam: 'Griekenland' },
  { code: 'AL', vlag: '🇦🇱', naam: 'Albanië' },
  { code: 'MK', vlag: '🇲🇰', naam: 'Noord-Macedonië' },
  { code: 'RS', vlag: '🇷🇸', naam: 'Servië' },
  { code: 'BA', vlag: '🇧🇦', naam: 'Bosnië en Herzegovina' },
  { code: 'XK', vlag: '🇽🇰', naam: 'Kosovo' },
  { code: 'GE', vlag: '🇬🇪', naam: 'Georgië' },
  { code: 'AM', vlag: '🇦🇲', naam: 'Armenië' },
  { code: 'RU', vlag: '🇷🇺', naam: 'Rusland' },
  { code: 'UA', vlag: '🇺🇦', naam: 'Oekraïne' },
  { code: 'BY', vlag: '🇧🇾', naam: 'Wit-Rusland' },
  { code: 'MD', vlag: '🇲🇩', naam: 'Moldavië' },
  { code: 'EG', vlag: '🇪🇬', naam: 'Egypte' },
  { code: 'DZ', vlag: '🇩🇿', naam: 'Algerije' },
  { code: 'TN', vlag: '🇹🇳', naam: 'Tunesië' },
  { code: 'LB', vlag: '🇱🇧', naam: 'Libanon' },
  { code: 'JO', vlag: '🇯🇴', naam: 'Jordanië' },
  { code: 'PS', vlag: '🇵🇸', naam: 'Palestina' },
  { code: 'SO', vlag: '🇸🇴', naam: 'Somalië' },
  { code: 'SD', vlag: '🇸🇩', naam: 'Soedan' },
  { code: 'ER', vlag: '🇪🇷', naam: 'Eritrea' },
  { code: 'ET', vlag: '🇪🇹', naam: 'Ethiopië' },
  { code: 'IN', vlag: '🇮🇳', naam: 'India' },
  { code: 'BD', vlag: '🇧🇩', naam: 'Bangladesh' },
  { code: 'GB', vlag: '🇬🇧', naam: 'Verenigd Koninkrijk' },
  { code: 'US', vlag: '🇺🇸', naam: 'Verenigde Staten' },
  { code: 'OTHER', vlag: '🌍', naam: 'Anders' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function valideerBestand(file, t) {
  if (!file) return t('kyc_upload_fout_geen_bestand');
  if (file.size > MAX_FILE_BYTES) {
    return t('kyc_upload_fout_te_groot', { max: MAX_FILE_MB });
  }
  if (!TOEGESTANE_TYPES.includes(file.type)) {
    return t('kyc_upload_fout_type');
  }
  return null;
}

// ── Stappen indicator ─────────────────────────────────────────────────────────
function StappenIndicator({ huidigeStap, totaal }) {
  return (
    <div className="flex items-center justify-between mb-6 px-1">
      {Array.from({ length: totaal }).map((_, i) => (
        <div key={i} className="flex items-center flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              i < huidigeStap
                ? 'bg-green-500 text-white'
                : i === huidigeStap
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-400'
            }`}
            aria-label={`Stap ${i + 1} van ${totaal}`}
          >
            {i < huidigeStap ? '✓' : i + 1}
          </div>
          {i < totaal - 1 && (
            <div
              className={`flex-1 h-1 mx-1 rounded-full transition ${
                i < huidigeStap ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── File upload veld (drag-drop + preview) ────────────────────────────────────
function FileUploadVeld({ id, label, beschrijving, file, setFile, fout, setFout }) {
  const { t } = useTaal();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(null);

  // Genereer preview wanneer file verandert
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  function handleFile(f) {
    const validationFout = valideerBestand(f, t);
    if (validationFout) {
      setFout(validationFout);
      return;
    }
    setFout(null);
    setFile(f);
  }

  function onChange(e) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <p id={`${id}-help`} className="text-xs text-gray-500 mb-2">{beschrijving}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
          fout
            ? 'border-red-400 bg-red-50'
            : preview
            ? 'border-green-400 bg-green-50'
            : drag
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        {preview ? (
          <div className="space-y-2">
            <img src={preview} alt={t('kyc_upload_preview_alt')} className="h-36 mx-auto rounded-xl object-cover shadow" loading="lazy" decoding="async" />
            <p className="text-green-700 font-semibold text-sm">
              {t('kyc_upload_geupload')} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            <p className="text-gray-500 text-xs">{t('kyc_upload_klik_wijzig')}</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2" aria-hidden="true">📷</div>
            <p className="text-gray-700 font-semibold text-sm">
              {drag ? t('kyc_upload_drop_hier') : t('kyc_upload_klik_of_drop')}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {t('kyc_upload_formaat_info', { max: MAX_FILE_MB })}
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="file"
          accept="image/jpeg,image/png"
          onChange={onChange}
          className="hidden"
          aria-describedby={`${id}-help`}
        />
      </div>
      {fout && (
        <p role="alert" className="mt-2 text-sm text-red-600">{fout}</p>
      )}
    </div>
  );
}

// ── Camera selfie (getUserMedia) ──────────────────────────────────────────────
function CameraSelfie({ onCapture, onAnnuleer }) {
  const { t } = useTaal();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [klaar, setKlaar] = useState(false);
  const [fout, setFout] = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let geannuleerd = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (geannuleerd) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setKlaar(true);
        }
      } catch (e) {
        setFout(e.message || t('kyc_camera_fout'));
      }
    })();
    return () => {
      geannuleerd = true;
      stopStream();
    };
  }, [stopStream, t]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopStream();
      onCapture(file);
    }, 'image/jpeg', 0.92);
  }

  function annuleer() {
    stopStream();
    onAnnuleer();
  }

  if (fout) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm text-red-700 font-semibold">{t('kyc_camera_fout')}</p>
        <p className="text-xs text-red-600">{fout}</p>
        <button
          type="button"
          onClick={annuleer}
          className="text-sm bg-white border border-red-200 text-red-700 px-4 py-2 rounded-xl hover:bg-red-100"
        >
          {t('kyc_camera_terug')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          aria-label={t('kyc_camera_video_label')}
        />
        {/* Kader overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3/4 aspect-[3/4] border-4 border-white/70 rounded-3xl shadow-xl" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
          <span className="inline-block bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {t('kyc_camera_houd_gezicht_in_kader')}
          </span>
        </div>
        {!klaar && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
            {t('kyc_camera_initialiseren')}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={annuleer}
          className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm"
        >
          {t('kyc_camera_terug')}
        </button>
        <button
          type="button"
          onClick={capture}
          disabled={!klaar}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm"
        >
          📸 {t('kyc_camera_maak_foto')}
        </button>
      </div>
    </div>
  );
}

// ── DocumentUploadFlow (main) ─────────────────────────────────────────────────
export default function DocumentUploadFlow({ onSuccess, onAnnuleer }) {
  const { t } = useTaal();
  const [stap, setStap] = useState(0);
  const [form, setForm] = useState({
    documentType: 'paspoort',
    documentNummer: '',
    geboortedatum: '',
    nationaliteit: 'TR',
  });
  const [voorkant, setVoorkant] = useState(null);
  const [achterkant, setAchterkant] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [foutVoorkant, setFoutVoorkant] = useState(null);
  const [foutAchterkant, setFoutAchterkant] = useState(null);
  const [foutSelfie, setFoutSelfie] = useState(null);
  const [toonCamera, setToonCamera] = useState(false);

  const [bezig, setBezig] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverFout, setServerFout] = useState('');
  const [klaar, setKlaar] = useState(false);

  const docConfig = DOC_TYPES.find((d) => d.value === form.documentType);
  const heeftAchterkant = docConfig?.heeftAchterkant;

  // Berekent total aantal stappen (achterkant skip voor paspoort)
  const stappen = heeftAchterkant
    ? ['type', 'info', 'voorkant', 'achterkant', 'selfie', 'review']
    : ['type', 'info', 'voorkant', 'selfie', 'review'];

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function volgende() { setStap((s) => Math.min(s + 1, stappen.length - 1)); }
  function vorige() { setStap((s) => Math.max(s - 1, 0)); }

  // Bij wissel doc-type: reset achterkant
  useEffect(() => {
    if (!heeftAchterkant) {
      setAchterkant(null);
      setFoutAchterkant(null);
    }
  }, [heeftAchterkant]);

  async function indienen() {
    setBezig(true);
    setServerFout('');
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('document_type', form.documentType);
      fd.append('document_nummer', form.documentNummer);
      fd.append('geboortedatum', form.geboortedatum);
      fd.append('nationaliteit', form.nationaliteit);
      fd.append('document_voorkant', voorkant);
      if (achterkant) fd.append('document_achterkant', achterkant);
      fd.append('selfie', selfie);

      // XMLHttpRequest gebruiken zodat we onprogress kunnen tonen
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/kyc/upload-document`);
        xhr.withCredentials = true; // stuur sb_token cookie mee
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let data = null;
            try { data = JSON.parse(xhr.responseText); } catch {}
            const err = new Error(data?.error || `HTTP ${xhr.status}`);
            err.errorCode = data?.errorCode || data?.code;
            err.data = data;
            reject(err);
          }
        };
        xhr.onerror = () => reject(new Error(t('errors.SERVER_ERROR')));
        xhr.send(fd);
      });

      setKlaar(true);
      onSuccess?.();
    } catch (e) {
      setServerFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  if (klaar) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-4">
        <div className="text-6xl" aria-hidden="true">✅</div>
        <h2 className="text-xl font-bold text-gray-800">{t('kyc_upload_succes_titel')}</h2>
        <p className="text-gray-600 text-sm">{t('kyc_upload_succes_omschrijving')}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 text-left">
          {t('kyc_upload_succes_email_info')}
        </div>
        {onSuccess && (
          <button
            onClick={onAnnuleer}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
          >
            {t('kyc_upload_sluit')}
          </button>
        )}
      </div>
    );
  }

  const huidige = stappen[stap];

  return (
    <div className="bg-white rounded-2xl shadow p-5 sm:p-6 space-y-5 max-w-lg mx-auto">
      <div>
        <h2 className="text-lg font-bold text-gray-800">📄 {t('kyc_upload_wizard_titel')}</h2>
        <p className="text-gray-500 text-xs mt-1">
          {t('kyc_upload_wizard_subtitel', { huidig: stap + 1, totaal: stappen.length })}
        </p>
      </div>

      <StappenIndicator huidigeStap={stap} totaal={stappen.length} />

      {/* Stap 1: type kiezen */}
      {huidige === 'type' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            {t('kyc_upload_privacy_disclaimer')}
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-gray-700 mb-1">
              {t('kyc_upload_kies_doctype')}
            </legend>
            {DOC_TYPES.map((d) => (
              <label
                key={d.value}
                className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition ${
                  form.documentType === d.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="documentType"
                  value={d.value}
                  checked={form.documentType === d.value}
                  onChange={(e) => update('documentType', e.target.value)}
                  className="mr-3 accent-blue-600"
                />
                <div className="text-2xl mr-3" aria-hidden="true">{d.icoon}</div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{t(d.tKey)}</div>
                  <div className="text-xs text-gray-500">{t(`${d.tKey}_sub`)}</div>
                </div>
              </label>
            ))}
          </fieldset>
          <div className="flex gap-2 pt-1">
            {onAnnuleer && (
              <button
                onClick={onAnnuleer}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm"
              >
                {t('annuleren')}
              </button>
            )}
            <button
              onClick={volgende}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm"
            >
              {t('volgende')}
            </button>
          </div>
        </div>
      )}

      {/* Stap 2: info */}
      {huidige === 'info' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="documentNummer" className="block text-sm font-semibold text-gray-700 mb-1">
              {t('kyc_upload_document_nummer')} *
            </label>
            <input
              id="documentNummer"
              name="documentNummer"
              value={form.documentNummer}
              onChange={(e) => update('documentNummer', e.target.value)}
              placeholder="AB1234567"
              autoComplete="off"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="geboortedatum" className="block text-sm font-semibold text-gray-700 mb-1">
              {t('kyc_upload_geboortedatum')} *
            </label>
            <input
              id="geboortedatum"
              name="geboortedatum"
              type="date"
              value={form.geboortedatum}
              onChange={(e) => update('geboortedatum', e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="nationaliteit" className="block text-sm font-semibold text-gray-700 mb-1">
              {t('kyc_upload_nationaliteit')} *
            </label>
            <select
              id="nationaliteit"
              name="nationaliteit"
              value={form.nationaliteit}
              onChange={(e) => update('nationaliteit', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500"
              aria-required="true"
            >
              {LANDEN.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.vlag} {l.naam}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={vorige}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm"
            >
              {t('terug')}
            </button>
            <button
              onClick={volgende}
              disabled={!form.documentNummer || !form.geboortedatum || !form.nationaliteit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm"
            >
              {t('volgende')}
            </button>
          </div>
        </div>
      )}

      {/* Stap 3: voorkant */}
      {huidige === 'voorkant' && (
        <div className="space-y-4">
          <FileUploadVeld
            id="voorkant"
            label={t('kyc_upload_voorkant_label')}
            beschrijving={t('kyc_upload_voorkant_beschrijving')}
            file={voorkant}
            setFile={setVoorkant}
            fout={foutVoorkant}
            setFout={setFoutVoorkant}
          />
          <div className="flex gap-2">
            <button
              onClick={vorige}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm"
            >
              {t('terug')}
            </button>
            <button
              onClick={volgende}
              disabled={!voorkant || foutVoorkant}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm"
            >
              {t('volgende')}
            </button>
          </div>
        </div>
      )}

      {/* Stap 4: achterkant (alleen voor ID + rijbewijs) */}
      {huidige === 'achterkant' && (
        <div className="space-y-4">
          <FileUploadVeld
            id="achterkant"
            label={t('kyc_upload_achterkant_label')}
            beschrijving={t('kyc_upload_achterkant_beschrijving')}
            file={achterkant}
            setFile={setAchterkant}
            fout={foutAchterkant}
            setFout={setFoutAchterkant}
          />
          <div className="flex gap-2">
            <button
              onClick={vorige}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm"
            >
              {t('terug')}
            </button>
            <button
              onClick={volgende}
              disabled={!achterkant || foutAchterkant}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm"
            >
              {t('volgende')}
            </button>
          </div>
        </div>
      )}

      {/* Stap 5: selfie */}
      {huidige === 'selfie' && (
        <div className="space-y-4">
          {toonCamera ? (
            <CameraSelfie
              onCapture={(f) => {
                setSelfie(f);
                setFoutSelfie(null);
                setToonCamera(false);
              }}
              onAnnuleer={() => setToonCamera(false)}
            />
          ) : (
            <>
              <FileUploadVeld
                id="selfie"
                label={t('kyc_upload_selfie_label')}
                beschrijving={t('kyc_upload_selfie_beschrijving')}
                file={selfie}
                setFile={setSelfie}
                fout={foutSelfie}
                setFout={setFoutSelfie}
              />
              <button
                type="button"
                onClick={() => setToonCamera(true)}
                className="w-full border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-xl text-sm"
              >
                📸 {t('kyc_upload_selfie_camera_starten')}
              </button>
            </>
          )}
          {!toonCamera && (
            <div className="flex gap-2">
              <button
                onClick={vorige}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm"
              >
                {t('terug')}
              </button>
              <button
                onClick={volgende}
                disabled={!selfie || foutSelfie}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm"
              >
                {t('volgende')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stap 6: review */}
      {huidige === 'review' && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-sm">{t('kyc_upload_review_titel')}</h3>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('kyc_upload_kies_doctype')}</span>
              <span className="font-semibold">{t(docConfig.tKey)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('kyc_upload_document_nummer')}</span>
              <span className="font-mono">{form.documentNummer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('kyc_upload_geboortedatum')}</span>
              <span>{form.geboortedatum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('kyc_upload_nationaliteit')}</span>
              <span>
                {LANDEN.find((l) => l.code === form.nationaliteit)?.vlag}{' '}
                {LANDEN.find((l) => l.code === form.nationaliteit)?.naam}
              </span>
            </div>
          </div>
          {/* Thumbnails */}
          <div className="grid grid-cols-3 gap-2">
            {[voorkant, achterkant, selfie].filter(Boolean).map((f, i) => (
              <ThumbVoorkant key={i} file={f} />
            ))}
          </div>
          {serverFout && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {serverFout}
            </div>
          )}
          {bezig && (
            <div className="space-y-2">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-xs text-center text-gray-500">
                {t('kyc_upload_progress', { pct: progress })}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={vorige}
              disabled={bezig}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm disabled:opacity-50"
            >
              {t('terug')}
            </button>
            <button
              onClick={indienen}
              disabled={bezig || !voorkant || !selfie}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm"
            >
              {bezig ? t('laden') : `✓ ${t('kyc_upload_verzenden')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Thumbnail helper voor review-stap ────────────────────────────────────────
function ThumbVoorkant({ file }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    const r = new FileReader();
    r.onload = (e) => setSrc(e.target.result);
    r.readAsDataURL(file);
  }, [file]);
  if (!src) return <div className="bg-gray-100 h-20 rounded-lg animate-pulse" />;
  return <img src={src} alt="thumbnail" className="h-20 w-full object-cover rounded-lg shadow" loading="lazy" decoding="async" />;
}
