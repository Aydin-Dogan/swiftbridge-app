/**
 * Afmelden.jsx — afmelden voor herinneringen met één klik, zonder inloggen
 * (ronde 3, onderdeel 8; besluit Aydin 14-10-2026).
 *
 * Route: /afmelden?token=...&taal=.. (publiek, geen auth). Hier komt de link
 * onderaan de herinneringsmail uit (swiftbridge-api
 * src/services/emailService.js). Een GET op de afmeldroute van de API stuurt
 * ook hierheen, dan zonder ?taal=.
 *
 * - Bij het laden gaat er niets naar de server (review ronde 3). Linkscanners
 *   die links in een sandbox met JavaScript openen (Defender Safe Links,
 *   Proofpoint, Mimecast) zouden de klant anders al afmelden voordat hij de
 *   mail heeft gezien. Pas de knop 'Geen herinneringen meer' doet één
 *   POST /users/afmelden, met het token in de body en niet in het adres.
 *   Afmelden met één klik vanuit het mailprogramma loopt via de headers
 *   List-Unsubscribe en List-Unsubscribe-Post op de API, niet via deze pagina.
 * - Een geldig token geeft altijd { ok: true }, ook voor een onbekende of al
 *   afgemelde klant: de pagina verraadt niet of een account bestaat.
 * - Een afgekapt, verlopen of vervalst token geeft 400 LINK_ONGELDIG (de API
 *   controleert de handtekening vóór hij een account opzoekt). De klant leest
 *   dan dat de link niet (meer) werkt en gaat naar de schakelaar in Profiel,
 *   zonder 'Opnieuw proberen' (review ronde 3).
 * - Alleen een storing (serverfout, te veel verzoeken, geen verbinding) geeft
 *   een foutmelding, met 'Opnieuw proberen'.
 * - Zonder token gaat er niets naar de server.
 * - In de taal van de mail (?taal=); ontbreekt die, dan de taal van de app.
 *   ?taal= geldt alleen voor deze pagina (review ronde 3): niets in
 *   localStorage, geen PATCH naar de server, en bij het verlaten weer de
 *   bewaarde taal. De taalkiezer op de pagina is wel een keuze en wordt bewaard.
 * - Het token gaat niet naar de console of naar analytics.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TaalKiezer from '../components/TaalKiezer';
import { useTaal, TALEN } from '../i18n';
import { apiFetch } from '../services/api';
import { CheckCircle, AlertTriangle } from '../components/icons/Icons';

const GELDIGE_TALEN = TALEN.map((l) => l.code);

export default function Afmelden() {
  const [params] = useSearchParams();
  const { t, taal, zetTaal, herstelTaal } = useTaal();
  const navigate = useNavigate();

  // Eén keer lezen bij het openen.
  const [token] = useState(() => params.get('token') || '');
  const [linkTaal] = useState(() => params.get('taal'));
  // 'vraag' | 'bezig' | 'klaar' | 'fout' | 'onvolledig'
  const [status, setStatus] = useState(token ? 'vraag' : 'onvolledig');

  const actief = useRef(true);

  async function afmelden() {
    setStatus('bezig');
    try {
      await apiFetch('/users/afmelden', { method: 'POST', body: { token } });
      if (actief.current) setStatus('klaar');
    } catch (e) {
      // Geen foutdetails op het scherm of in de console. Een ongeldige link wordt
      // nooit geldig door opnieuw te proberen: dan naar de schakelaar in Profiel.
      if (actief.current) setStatus(e?.errorCode === 'LINK_ONGELDIG' ? 'onvolledig' : 'fout');
    }
  }

  useEffect(() => {
    actief.current = true;
    // De taal van de mail, alleen voor deze pagina: niet bewaren en niet naar
    // de server, anders zet een oude mail de taal van de klant terug. Een
    // onbekende waarde negeren.
    const tijdelijk = GELDIGE_TALEN.includes(linkTaal) && linkTaal !== taal;
    if (tijdelijk) zetTaal(linkTaal, { bewaar: false });
    return () => {
      actief.current = false;
      // Weg van deze pagina: weer de bewaarde taal (of wat de klant hier zelf koos).
      if (tijdelijk) herstelTaal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // /account/notificaties: ingelogd naar Profiel, uitgelogd eerst inloggen.
  const naarVoorkeuren = () => navigate('/account/notificaties');

  return (
    <div className="min-h-screen bg-surface-2 px-4 py-6 relative">
      <div className="absolute top-4 right-4"><TaalKiezer /></div>
      <div className="max-w-md mx-auto space-y-4 pt-10">
        <div className="text-center">
          <img src="/icon-192.png" alt="SwiftBridge" width="48" height="48" className="mx-auto rounded-xl shadow-sm" />
        </div>

        <div className="bg-surface border border-border rounded-md shadow-soft p-6 text-center space-y-3" role="status" aria-live="polite">
          {status === 'vraag' && (
            <>
              <h1 className="font-display text-lg font-medium text-ink-1">{t('afmelden_vraag_titel')}</h1>
              <p className="text-sm text-ink-2">{t('afmelden_vraag_uitleg')}</p>
              <button type="button" onClick={afmelden} className="btn-primary w-full py-3">
                {t('afmelden_knop')}
              </button>
              <button type="button" onClick={naarVoorkeuren} className="w-full text-sm font-semibold text-brand-600 hover:text-brand-700 py-2">
                {t('afmelden_naar_voorkeuren')}
              </button>
            </>
          )}

          {status === 'bezig' && (
            <p className="text-sm text-ink-3 py-6">{t('laden')}</p>
          )}

          {status === 'klaar' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-success-500" aria-hidden="true" />
              <h1 className="font-display text-lg font-medium text-ink-1">{t('afmelden_klaar_titel')}</h1>
              <p className="text-sm text-ink-2">{t('afmelden_klaar_uitleg')}</p>
              <p className="text-xs text-ink-3">{t('notif_altijd')}</p>
              <button type="button" onClick={naarVoorkeuren} className="btn-primary w-full py-3">
                {t('afmelden_naar_voorkeuren')}
              </button>
            </>
          )}

          {status === 'fout' && (
            <>
              <AlertTriangle className="w-10 h-10 mx-auto text-accent-600" aria-hidden="true" />
              <h1 className="font-display text-lg font-medium text-ink-1">{t('afmelden_fout_titel')}</h1>
              <p className="text-sm text-ink-2">{t('afmelden_fout_uitleg')}</p>
              <button type="button" onClick={afmelden} className="btn-primary w-full py-3">
                {t('afmelden_opnieuw')}
              </button>
              <button type="button" onClick={naarVoorkeuren} className="w-full text-sm font-semibold text-brand-600 hover:text-brand-700 py-2">
                {t('afmelden_naar_voorkeuren')}
              </button>
            </>
          )}

          {status === 'onvolledig' && (
            <>
              <AlertTriangle className="w-10 h-10 mx-auto text-accent-600" aria-hidden="true" />
              <h1 className="font-display text-lg font-medium text-ink-1">{t('afmelden_onvolledig_titel')}</h1>
              <p className="text-sm text-ink-2">{t('afmelden_onvolledig_uitleg')}</p>
              <button type="button" onClick={naarVoorkeuren} className="btn-primary w-full py-3">
                {t('afmelden_naar_voorkeuren')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
