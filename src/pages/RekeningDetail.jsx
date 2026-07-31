/**
 * RekeningDetail.jsx — "Betaalrekening"-detailpagina (bank-concept).
 * Route: /app/rekening. Kaart met totalen, actiecirkels, limieten-kaart
 * (weeklimiet/bestedingsruimte) en "Af- en bijschrijvingen": alle
 * overboekingen per datum met zoeken. Rechterrail op desktop: Beheer zelf
 * + Valuta wisselen-widget.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../i18n';
import Tijdlijn from '../components/dashboard/Tijdlijn';
import DirectNaar from '../components/dashboard/DirectNaar';
import { maandAfschriftUrl } from '../components/dashboard/ActieCirkels';
import { Send, Bell, Download, ChevronDown, ChevronUp } from '../components/icons/Icons';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function Cirkel({ Icoon, label, onClick, href }) {
  const inhoud = (
    <>
      <span className="w-11 h-11 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-soft transition group-active:scale-95">
        <Icoon className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="text-xs font-medium text-ink-2 leading-tight text-center">{label}</span>
    </>
  );
  const klasse = 'group flex flex-col items-center gap-1.5 w-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded-md py-1';
  if (href) return <a href={href} download className={klasse}>{inhoud}</a>;
  return <button type="button" onClick={onClick} className={klasse}>{inhoud}</button>;
}

export default function RekeningDetail({ gebruiker }) {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [transacties, setTransacties] = useState([]);
  const [laden, setLaden] = useState(true);
  const [weekData, setWeekData] = useState({ weekTotaal: 0, weekLimiet: 5000 });
  const [limietUitleg, setLimietUitleg] = useState(false);

  useEffect(() => {
    let weg = false;
    (async () => {
      try {
        const res = await fetch(`${API}/transactions`, { credentials: 'include' });
        if (!res.ok) throw new Error('niet ingelogd');
        const json = await res.json();
        if (weg) return;
        setTransacties(json.transacties || []);
        setWeekData({ weekTotaal: json.weekTotaal || 0, weekLimiet: json.weekLimiet || 5000 });
      } catch {
        if (!weg) setTransacties([]);
      } finally {
        if (!weg) setLaden(false);
      }
    })();
    return () => { weg = true; };
  }, []);

  const totaal = useMemo(
    () => transacties.filter(tx => tx.status === 'voltooid').reduce((s, tx) => s + (tx.eurBedrag || 0), 0),
    [transacties]
  );
  const beschikbaar = Math.max(0, weekData.weekLimiet - weekData.weekTotaal);

  function naarTab(detail) {
    navigate('/app');
    // Kleine vertraging zodat AppShell gemount is voordat het event afgaat
    setTimeout(() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail })), 60);
  }

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="max-w-5xl mx-auto px-4 py-5 pb-16">
        <button onClick={() => navigate('/app')}
          className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4 mb-3 inline-block">
          ← {t('rekening_terug')}
        </button>

        <h1 className="font-display text-2xl text-ink-1 mb-4">{t('rekening_pagina_titel')}</h1>

        <div className="lg:grid lg:grid-cols-[1fr_19rem] lg:gap-5 lg:items-start space-y-4 lg:space-y-0">
          {/* ── Hoofdkolom ── */}
          <div className="space-y-4">
            {/* Rekeningkaart + totaal */}
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => navigate('/app')}
                className="bg-surface border border-border rounded-md shadow-soft px-4 py-3 text-left hover:bg-surface-2 transition min-w-0">
                <div className="font-semibold text-ink-1 text-sm uppercase truncate">{t('rekening_kaart_naam')}</div>
                <div className="text-[11px] text-ink-3 mt-0.5 truncate">{gebruiker?.naam || ''}</div>
              </button>
              <div className="text-right flex-shrink-0 pt-1">
                <div className="font-display font-medium text-base tabular-nums text-ink-1">{laden ? '…' : fmtEur(totaal)}</div>
                <div className="text-[11px] text-ink-3">{t('rekening_totaal')}</div>
              </div>
            </div>

            {/* Actiecirkels */}
            <div className="flex gap-2">
              <Cirkel Icoon={Send} label={t('actie_overschrijven')} onClick={() => naarTab('betaling')} />
              <Cirkel Icoon={Bell} label={t('actie_koersalert')} onClick={() => naarTab('alerts')} />
              <Cirkel Icoon={Download} label={t('actie_downloaden')} href={maandAfschriftUrl()} />
            </div>

            {/* Limieten-kaart (weeklimiet / bestedingsruimte) */}
            <section className="rounded-md border border-border bg-surface shadow-soft p-4"
              aria-label={t('rekening_limiet_titel')}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm">
                  <span className="text-ink-2">{t('rekening_limiet_titel')}</span>{' '}
                  <strong className="font-display tabular-nums text-ink-1">{fmtEur(weekData.weekLimiet)}</strong>
                </div>
                <div className="text-sm">
                  <span className="text-ink-2">{t('rekening_limiet_beschikbaar')}</span>{' '}
                  <strong className={`font-display tabular-nums ${beschikbaar < 500 ? 'text-fg-error' : 'text-success-600'}`}>
                    {fmtEur(beschikbaar)}
                  </strong>
                </div>
              </div>
              <button onClick={() => setLimietUitleg(o => !o)} aria-expanded={limietUitleg}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 border border-brand-300 hover:bg-brand-50 rounded-md px-3 py-2 transition">
                {t('rekening_limiet_uitleg_knop')}
                {limietUitleg ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {limietUitleg && (
                <p className="mt-3 text-xs text-ink-2 leading-relaxed">{t('rekening_limiet_uitleg')}</p>
              )}
            </section>

            {/* Af- en bijschrijvingen */}
            <section aria-label={t('rekening_afbij')}>
              <div className="rounded-md border border-border bg-surface shadow-soft overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle">
                  <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">
                    {t('rekening_afbij')}
                  </h2>
                </div>
                <Tijdlijn transacties={transacties} laden={laden} metZoeken kaal />
              </div>
            </section>
          </div>

          {/* ── Rechterrail (desktop) ── */}
          <div className="space-y-4">
            <DirectNaar titel={t('beheer_zelf_titel')} />
            <section className="rounded-md border border-border bg-surface shadow-soft p-4"
              aria-label={t('rekening_wisselen_titel')}>
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600 mb-2">
                {t('interessant_titel')}
              </div>
              <div className="font-semibold text-ink-1 text-sm">{t('rekening_wisselen_titel')}</div>
              <div className="text-[11px] text-ink-3 mt-0.5 mb-3">{t('rekening_wisselen_sub')}</div>
              <button onClick={() => naarTab('betaling')}
                className="text-sm font-semibold text-brand-700 border border-brand-300 hover:bg-brand-50 rounded-md px-4 py-2 transition">
                {t('rekening_wisselen_knop')}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
