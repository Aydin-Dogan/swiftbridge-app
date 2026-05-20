/**
 * OnfidoEmbed.jsx — Onfido Web SDK loader + mount.
 *
 * Laadt de Onfido Web SDK lazy via CDN (geen npm-dep om bundle klein te houden)
 * en initialiseert hem met de sdkToken die de backend (services/kyc/onfido.js)
 * meegeeft in de /kyc/submit-response.
 *
 * Props:
 *  - sdkToken: string — door backend uitgegeven (vervalt na 90 min)
 *  - taal:     'nl' | 'tr' | 'en' | 'ru' | 'az'
 *  - onComplete: () => void — user heeft alle stappen doorlopen (document + selfie)
 *  - onError:    (msg: string) => void — SDK kon niet laden of crashte
 *  - onAnnuleer: () => void — user klikte op "annuleren / terug"
 *
 * Resultaat van de verificatie komt NIET hier binnen — die loopt via de
 * server-side webhook (POST /kyc/webhook) van Onfido. Wij weten alleen dat
 * de user het flow voltooid heeft; goedkeuring/afwijzing volgt uit de webhook.
 */

import { useEffect, useRef, useState } from 'react';

// Pin een specifieke SDK versie zodat updates niet stilletjes ons UI breken.
// Bij major upgrade hier handmatig versie verhogen + integration testen.
const ONFIDO_SDK_VERSION = '14.30.0';
const ONFIDO_JS_URL  = `https://assets.onfido.com/web-sdk-releases/${ONFIDO_SDK_VERSION}/onfido.min.js`;
const ONFIDO_CSS_URL = `https://assets.onfido.com/web-sdk-releases/${ONFIDO_SDK_VERSION}/style.css`;

// Map onze i18n taalcodes naar Onfido's ondersteunde locales
const TAAL_MAP = {
  nl: 'nl_NL',
  en: 'en_US',
  tr: 'tr_TR',
  ru: 'ru_RU',
  az: 'en_US', // Onfido heeft geen Azerbaijani — fall back op EN
};

// Helper: laad een script één keer, return promise die resolved wanneer geladen
function laadScriptEenmalig(src, idAttr) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('Geen document'));
    if (document.getElementById(idAttr)) {
      // Al geladen
      return resolve();
    }
    const s = document.createElement('script');
    s.src = src;
    s.id = idAttr;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Kon ${src} niet laden`));
    document.head.appendChild(s);
  });
}

function laadStylesheetEenmalig(href, idAttr) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(idAttr)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.id = idAttr;
  document.head.appendChild(link);
}

export default function OnfidoEmbed({ sdkToken, taal = 'nl', onComplete, onError, onAnnuleer }) {
  const mountRef = useRef(null);
  const sdkInstanceRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | klaar | fout
  const [foutMsg, setFoutMsg] = useState('');

  useEffect(() => {
    if (!sdkToken) {
      setStatus('fout');
      setFoutMsg('Geen SDK-token ontvangen van de server.');
      return;
    }

    let geannuleerd = false;

    (async () => {
      try {
        laadStylesheetEenmalig(ONFIDO_CSS_URL, 'onfido-sdk-css');
        await laadScriptEenmalig(ONFIDO_JS_URL, 'onfido-sdk-js');
        if (geannuleerd) return;

        // window.Onfido is nu beschikbaar
        if (!window.Onfido || typeof window.Onfido.init !== 'function') {
          throw new Error('Onfido SDK geladen maar Onfido.init ontbreekt');
        }

        const containerId = 'onfido-mount-' + Math.random().toString(36).slice(2, 8);
        if (mountRef.current) mountRef.current.id = containerId;

        sdkInstanceRef.current = window.Onfido.init({
          token: sdkToken,
          containerId,
          language: { locale: TAAL_MAP[taal] || 'en_US' },
          steps: [
            'welcome',
            {
              type: 'document',
              options: {
                documentTypes: {
                  passport: true,
                  national_identity_card: true,
                  driving_licence: true,
                },
              },
            },
            { type: 'face', options: { requestedVariant: 'standard' } },
            'complete',
          ],
          onComplete: (data) => {
            console.log('[Onfido] flow voltooid', data);
            try { sdkInstanceRef.current?.tearDown?.(); } catch { /* noop */ }
            onComplete?.(data);
          },
          onError: (err) => {
            console.error('[Onfido] SDK error', err);
            onError?.(err?.message || 'Onfido SDK gaf een fout');
          },
        });

        setStatus('klaar');
      } catch (err) {
        if (geannuleerd) return;
        console.error('[Onfido] laden mislukt:', err);
        setStatus('fout');
        setFoutMsg(err.message || 'Onbekende fout bij laden van Onfido SDK');
        onError?.(err.message);
      }
    })();

    return () => {
      geannuleerd = true;
      try { sdkInstanceRef.current?.tearDown?.(); } catch { /* noop */ }
      sdkInstanceRef.current = null;
    };
    // sdkToken kan niet veranderen tijdens leven van dit component (nieuwe token = nieuwe mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkToken]);

  if (status === 'fout') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 space-y-3">
        <p className="font-bold">⚠️ Verificatie kan nu niet starten</p>
        <p>{foutMsg}</p>
        <p className="text-xs text-red-500">
          Je documenten zijn wel bij ons aangekomen. Een medewerker controleert ze handmatig
          binnen 24 uur en je krijgt een e-mail zodra het besluit klaar is.
        </p>
        {onAnnuleer && (
          <button
            type="button"
            onClick={onAnnuleer}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm"
          >
            ← Terug
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      {status === 'loading' && (
        <div className="text-center py-8 text-gray-500 text-sm">
          <div className="text-3xl mb-2 animate-pulse">📸</div>
          <p className="font-medium">Verificatie-module wordt geladen...</p>
          <p className="text-xs text-gray-400 mt-1">via beveiligde verbinding met Onfido</p>
        </div>
      )}
      {/* Onfido mount-container — de SDK injecteert hier zijn eigen UI */}
      <div ref={mountRef} className="onfido-mount-container" />
    </div>
  );
}
