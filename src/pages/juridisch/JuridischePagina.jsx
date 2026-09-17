/**
 * JuridischePagina — toont één juridisch document (publiek, zonder login).
 *
 * Twee manieren van gebruik:
 *   <JuridischePagina slug="voorwaarden" />        huidige versie op de vaste route
 *   route /voorwaarden/archief/:versie/:slug        archiefversie (slug + versie uit de URL)
 *
 * De markdown komt uit src/content/juridisch/<versie>/ en wordt pas geladen als
 * de pagina opent. Tokens ({{...}}) worden vervangen, de eerste kop wordt de
 * paginatitel en de koppen vormen de inhoudsopgave.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useTaal } from '../../i18n';
import JuridischePaginaLayout from '../../components/juridisch/JuridischePaginaLayout';
import { MarkdownInhoud } from '../../lib/juridisch/markdown';
import { parseMarkdown, scheidDocumentKop, inhoudsopgave } from '../../lib/juridisch/parser';
import { vervangTokens } from '../../content/juridisch/tokens';
import {
  ARCHIEF_ROUTE,
  JURIDISCH_VERSIE,
  archiefRoute,
  documentOpSlug,
  heeftDocument,
  laadMarkdown,
  versieInfo,
} from '../../content/juridisch/index';

function Laden() {
  return (
    <div className="space-y-3 py-4" aria-busy="true">
      {[92, 100, 84, 96, 70].map((breedte, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-surface-3" style={{ width: `${breedte}%` }} />
      ))}
    </div>
  );
}

function DocumentWeergave({ slug, versie, archief }) {
  const { t } = useTaal();
  const location = useLocation();
  const doc = documentOpSlug(slug);
  const info = versieInfo(versie);
  const [markdown, setMarkdown] = useState(null);
  const [fout, setFout] = useState(null);

  useEffect(() => {
    let actief = true;
    laadMarkdown(slug, versie).then(
      (tekst) => { if (actief) setMarkdown(tekst); },
      (err) => { if (actief) setFout(err); },
    );
    return () => { actief = false; };
  }, [slug, versie]);

  const inhoud = useMemo(() => {
    if (markdown == null) return null;
    return scheidDocumentKop(parseMarkdown(vervangTokens(markdown)));
  }, [markdown]);

  const toc = useMemo(() => (inhoud ? inhoudsopgave(inhoud.blokken) : []), [inhoud]);
  const titel = inhoud?.titel || doc.titel;

  // Paginatitel in het tabblad.
  useEffect(() => {
    const vorige = document.title;
    document.title = `${titel} | SwiftBridge`;
    return () => { document.title = vorige; };
  }, [titel]);

  // Na laden: naar het anker in de URL scrollen (de tekst komt asynchroon binnen,
  // dus de browser kan dat zelf niet), anders bovenaan beginnen.
  useEffect(() => {
    if (!inhoud) return;
    const id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    const doel = id ? document.getElementById(id) : null;
    if (doel) doel.scrollIntoView({ block: 'start' });
    else if (!id) window.scrollTo(0, 0);
  }, [inhoud, location.hash]);

  // In het archief verwijzen kruisverwijzingen naar dezelfde archiefversie.
  const routeVoor = useCallback(
    (doelSlug) => (archief ? archiefRoute(versie, doelSlug) : documentOpSlug(doelSlug)?.route),
    [archief, versie],
  );

  const kruimel = archief ? (
    <nav aria-label={t('juridisch_archief_titel')} className="flex flex-wrap items-center gap-x-2 text-ink-2">
      <Link to={ARCHIEF_ROUTE} className="text-brand-500 underline underline-offset-4 hover:text-accent-600">
        {t('juridisch_terug')}
      </Link>
      <span aria-hidden="true">·</span>
      <span>{t('juridisch_archief_titel')}</span>
    </nav>
  ) : null;

  // Laadfout (bijv. chunk niet bereikbaar): laat de globale ErrorBoundary het afhandelen.
  if (fout) throw fout;

  return (
    <JuridischePaginaLayout
      titel={titel}
      soort={inhoud?.soort}
      versie={inhoud?.versie || versie}
      geldigVanaf={inhoud?.geldigVanaf || info?.geldigVanaf}
      inhoudsopgave={toc}
      kruimel={kruimel}
    >
      {inhoud ? (
        <MarkdownInhoud blokken={inhoud.blokken} huidigeSlug={slug} routeVoor={routeVoor} />
      ) : (
        <Laden />
      )}
    </JuridischePaginaLayout>
  );
}

export default function JuridischePagina({ slug: vasteSlug }) {
  const params = useParams();
  const archief = !vasteSlug;
  const slug = vasteSlug || params.slug;
  const versie = archief ? params.versie : JURIDISCH_VERSIE;

  if (!heeftDocument(slug, versie)) {
    return <Navigate to={ARCHIEF_ROUTE} replace />;
  }
  // key: bij een ander document of andere versie begint de weergave opnieuw.
  return <DocumentWeergave key={`${versie}/${slug}`} slug={slug} versie={versie} archief={archief} />;
}
