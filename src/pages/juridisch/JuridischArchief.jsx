/**
 * JuridischArchief — overzicht van alle gepubliceerde versies van de juridische
 * documenten (/voorwaarden/archief). Bij een geschil moet aantoonbaar zijn welke
 * tekst gold op het moment van een transactie; elke versie blijft daarom
 * bereikbaar onder /voorwaarden/archief/<versie>/<slug>.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTaal } from '../../i18n';
import JuridischePaginaLayout from '../../components/juridisch/JuridischePaginaLayout';
import { DOCUMENTEN, VERSIES, archiefRoute, heeftDocument } from '../../content/juridisch/index';

export default function JuridischArchief() {
  const { t } = useTaal();
  const titel = t('juridisch_archief_titel');

  useEffect(() => {
    const vorige = document.title;
    document.title = `${titel} | SwiftBridge`;
    window.scrollTo(0, 0);
    return () => { document.title = vorige; };
  }, [titel]);

  const kruimel = (
    <Link to="/voorwaarden" className="text-brand-500 underline underline-offset-4 hover:text-accent-600">
      {t('juridisch_terug')}
    </Link>
  );

  return (
    <JuridischePaginaLayout titel={titel} kruimel={kruimel} toonActies={false}>
      <div className="space-y-10">
        {VERSIES.map((v) => (
          <section key={v.versie} aria-labelledby={`versie-${v.versie}`}>
            <h2 id={`versie-${v.versie}`} className="font-display text-2xl text-ink-1">
              {t('juridisch_versie', { versie: v.versie })}
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              <time dateTime={v.geldigVanafIso}>{t('juridisch_geldig_vanaf', { datum: v.geldigVanaf })}</time>
            </p>
            <ul className="mt-4 divide-y divide-border rounded-md border border-border">
              {DOCUMENTEN.filter((doc) => heeftDocument(doc.slug, v.versie)).map((doc) => (
                <li key={doc.slug}>
                  <Link
                    to={archiefRoute(v.versie, doc.slug)}
                    className="flex items-baseline gap-3 px-4 py-3 text-ink-1 hover:bg-surface-2 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500"
                  >
                    <span className="w-6 shrink-0 text-xs tabular-nums text-ink-3">{doc.nummer}</span>
                    <span>{doc.titel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </JuridischePaginaLayout>
  );
}
