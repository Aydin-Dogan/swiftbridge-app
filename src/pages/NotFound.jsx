/**
 * NotFound.jsx — Custom 404 pagina met navigatie-suggesties.
 *
 * Vervangt de stilzwijgende Navigate-to-/ uit App.jsx. Bezoekers met
 * typo's of dode links krijgen nu uitleg + actie-opties.
 *
 * SEO: gebruikt useEffect om status-code 404 te signaleren via meta (Google
 * Bot rendert SPA's en herkent meta robots/noindex). Voor échte HTTP 404
 * zou Railway-level redirect nodig zijn — out of scope.
 */
import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTaal } from '../i18n';
import { Zap, ArrowRight, Globe } from '../components/icons/Icons';

const POPULAIRE_LINKS = [
  { path: '/calculator',           label_key: 'notfound_link_calculator' },
  { path: '/wise-alternatief',     label_key: 'notfound_link_wise' },
  { path: '/garanti-overboeking',  label_key: 'notfound_link_garanti' },
  { path: '/papara-yukleme',       label_key: 'notfound_link_papara' },
  { path: '/bayram-remittance',    label_key: 'notfound_link_bayram' },
];

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTaal();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = '404 — Pagina niet gevonden | SwiftBridge';

    // Voeg noindex toe zodat Google deze URL niet indexeert
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    meta.id = 'notfound-meta-robots';
    document.head.appendChild(meta);

    return () => {
      document.title = prevTitle;
      const el = document.getElementById('notfound-meta-robots');
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Lichte sticky nav */}
      <nav className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition">
            <Zap className="w-5 h-5 text-brand-600" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">SwiftBridge</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl text-center">
          {/* Big 404 */}
          <div className="mb-6">
            <div className="text-7xl sm:text-8xl font-bold text-brand-600 tracking-tight">
              404
            </div>
            <div className="w-16 h-1 bg-brand-200 mx-auto mt-3 rounded-full" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {t('notfound_titel')}
          </h1>

          <p className="text-gray-600 mb-2 max-w-md mx-auto">
            {t('notfound_subtitel')}
          </p>

          {/* Toon de URL die gefaald is — helpt klant te zien wat fout ging */}
          <p className="text-xs text-gray-400 font-mono mb-8 break-all">
            {location.pathname}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => navigate('/')}
              className="btn-primary px-6 py-3 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {t('notfound_naar_home')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/calculator')}
              className="btn-secondary px-5 py-3 text-sm w-full sm:w-auto"
            >
              {t('notfound_naar_calculator')}
            </button>
          </div>

          {/* Populaire pagina's */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left shadow-soft-sm">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-brand-600" />
              <h2 className="font-semibold text-gray-900 text-sm">
                {t('notfound_populair_titel')}
              </h2>
            </div>
            <ul className="space-y-2.5">
              {POPULAIRE_LINKS.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:underline">{t(link.label_key)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-500 mt-8">
            {t('notfound_contact_prefix')}{' '}
            <a href="mailto:support@swiftbridge.tr" className="text-brand-600 hover:underline font-semibold">
              support@swiftbridge.tr
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
