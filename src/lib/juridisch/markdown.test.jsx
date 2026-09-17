/**
 * markdown.test.jsx — parser + renderer van de juridische documenten:
 * koppen met ankers (incl. artikel-N-alias), tabellen, vet/cursief, lijsten,
 * links, kruisverwijzingen, tokens en bescherming tegen HTML-injectie.
 */
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MarkdownInhoud } from './markdown';
import { slugify, parseMarkdown, parseInline, scheidDocumentKop, inhoudsopgave, veiligeHref } from './parser';

function renderMd(markdown, props = {}) {
  return render(
    <MemoryRouter>
      <MarkdownInhoud markdown={markdown} {...props} />
    </MemoryRouter>,
  );
}

describe('slugify', () => {
  test('kleine letters, accenten weg, niet-alfanumeriek naar -, geen dubbele -', () => {
    expect(slugify('12. Beëindigen van de relatie')).toBe('12-beeindigen-van-de-relatie');
    expect(slugify('Regel 1 — Houd je codes geheim')).toBe('regel-1-houd-je-codes-geheim');
    expect(slugify('3. Inloggen en goedkeuren (sterke cliëntauthenticatie)')).toBe('3-inloggen-en-goedkeuren-sterke-clientauthenticatie');
    expect(slugify('  Vragen?  ')).toBe('vragen');
  });
});

describe('koppen en ankers', () => {
  test('### 9. krijgt een slug-id en daarvoor een <span id="artikel-9">', () => {
    const { container } = renderMd('### 9. Wanneer wij een overboeking pauzeren voor een controle\n\nTekst.');
    const kop = container.querySelector('h3');
    expect(kop).not.toBeNull();
    expect(kop.id).toBe('9-wanneer-wij-een-overboeking-pauzeren-voor-een-controle');
    const alias = container.querySelector('#artikel-9');
    expect(alias).not.toBeNull();
    expect(alias.tagName).toBe('SPAN');
    expect(alias.nextElementSibling).toBe(kop);
  });

  test('## 13. en koppen zonder nummer', () => {
    const { container } = renderMd('## 13. Klachten en geschillen\n\n## Lees dit eerst');
    const koppen = container.querySelectorAll('h2');
    expect(koppen).toHaveLength(2);
    expect(koppen[0].id).toBe('13-klachten-en-geschillen');
    expect(container.querySelector('#artikel-13')).not.toBeNull();
    expect(koppen[1].id).toBe('lees-dit-eerst');
    expect(container.querySelectorAll('span[id^="artikel-"]')).toHaveLength(1);
  });

  test('dubbele koppen krijgen unieke ids', () => {
    const blokken = parseMarkdown('## Vragen\n\n## Vragen');
    expect(blokken.map((b) => b.id)).toEqual(['vragen', 'vragen-2']);
  });

  test('inhoudsopgave bevat niveau 2 en 3', () => {
    const blokken = parseMarkdown('# Titel\n\n## Deel A — Profiel\n\n### 1. Wat is het?\n\n#### Detail');
    expect(inhoudsopgave(blokken)).toEqual([
      { id: 'deel-a-profiel', tekst: 'Deel A — Profiel', niveau: 2 },
      { id: '1-wat-is-het', tekst: '1. Wat is het?', niveau: 3 },
    ]);
  });
});

describe('alinea\'s en lijsten', () => {
  test('"13.2 ..." blijft een gewone alinea, geen lijst', () => {
    const { container } = renderMd('13.1 Eerste lid.\n\n13.2 Kom je er met ons niet uit, dan kun je naar Kifid.');
    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(container.querySelector('ol')).toBeNull();
    expect(container.textContent).toContain('13.2 Kom je er met ons niet uit');
  });

  test('-lijst direct na een alinea en genummerde lijst', () => {
    const md = '1.2 Voor sommige diensten gelden aparte voorwaarden:\n- Voorwaarden Betaaldiensten\n- Voorwaarden Digitale Toegang\n\n1. **Aanvraag** — invullen\n2. **Controle** — verifiëren';
    const { container } = renderMd(md);
    expect(container.querySelector('p').textContent).toBe('1.2 Voor sommige diensten gelden aparte voorwaarden:');
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
    const ol = container.querySelector('ol');
    expect(ol.querySelectorAll('li')).toHaveLength(2);
    expect(ol.querySelector('strong').textContent).toBe('Aanvraag');
  });

  test('vet en cursief', () => {
    const { container } = renderMd('SwiftBridge is **geen bank** en *geen* spaarproduct.');
    expect(container.querySelector('strong').textContent).toBe('geen bank');
    expect(container.querySelector('em').textContent).toBe('geen');
  });

  test('--- wordt een scheidslijn, > een waarschuwingsblok met terracotta rand', () => {
    const { container } = renderMd('Boven\n\n---\n\n> Geen depositogarantie.\n> Lees verder.');
    expect(container.querySelector('hr')).not.toBeNull();
    const blok = container.querySelector('aside[role="note"]');
    expect(blok).not.toBeNull();
    expect(blok.className).toContain('border-accent-500');
    expect(blok.textContent).toContain('Geen depositogarantie.');
  });

  test('meerregelige alinea krijgt een regelafbreking', () => {
    const { container } = renderMd('Versie 1.0\nSwiftBridge B.V.');
    expect(container.querySelector('p br')).not.toBeNull();
  });
});

describe('tabellen', () => {
  test('koprij navy met witte tekst, rijen met cellen en inline-opmaak', () => {
    const md = '| Situatie | Kosten |\n|---|---|\n| Papieren afschrift | Geen kosten |\n| **Totaal** | € 4,95 |';
    const { container } = renderMd(md);
    const koprij = container.querySelector('thead tr');
    expect(koprij.className).toContain('bg-brand-500');
    expect(koprij.className).toContain('text-white');
    expect([...container.querySelectorAll('th')].map((th) => th.textContent)).toEqual(['Situatie', 'Kosten']);
    const rijen = container.querySelectorAll('tbody tr');
    expect(rijen).toHaveLength(2);
    expect(rijen[1].querySelector('td strong').textContent).toBe('Totaal');
    expect(container.querySelector('tbody').className).toContain('divide-y');
  });

  test('tabel met lege koprij krijgt geen thead', () => {
    const { container } = renderMd('| | |\n|---|---|\n| Minimumbedrag | € 50 |');
    expect(container.querySelector('thead')).toBeNull();
    expect(container.querySelectorAll('tbody td')).toHaveLength(2);
  });
});

describe('links', () => {
  test('interne link via router, externe met noopener noreferrer', () => {
    const { container } = renderMd('Zie [artikel 9](/voorwaarden/betaaldiensten#artikel-9) en [Kifid](https://www.kifid.nl).');
    const links = container.querySelectorAll('a');
    expect(links[0].getAttribute('href')).toBe('/voorwaarden/betaaldiensten#artikel-9');
    expect(links[0].getAttribute('target')).toBeNull();
    expect(links[1].getAttribute('href')).toBe('https://www.kifid.nl');
    expect(links[1].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[1].getAttribute('target')).toBe('_blank');
  });

  test('e-mailadressen en www-adressen worden klikbaar', () => {
    const { container } = renderMd('Mail klachten@swiftbridge.nl of kijk op www.kifid.nl.');
    const links = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['mailto:klachten@swiftbridge.nl', 'https://www.kifid.nl']);
  });

  test('kruisverwijzing naar een ander document linkt door, naar zichzelf niet', () => {
    const md = 'Zie de Voorwaarden Betaaldiensten, artikel 11. Lees "Hoe jouw geld beschermd is". Deze Algemene Voorwaarden gelden.';
    const { container } = renderMd(md, { huidigeSlug: 'voorwaarden' });
    const links = [...container.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/voorwaarden/betaaldiensten#artikel-11', '/veiligheid/jouw-geld']);
    expect(links[0].textContent).toBe('Voorwaarden Betaaldiensten, artikel 11');
    expect(container.textContent).toContain('Deze Algemene Voorwaarden gelden.');
  });

  test('"artikel 14 van de Algemene Voorwaarden" linkt naar het artikel', () => {
    const knopen = parseInline('volgens artikel 14 van de Algemene Voorwaarden.', {
      verwijzingen: [{ naam: 'Algemene Voorwaarden', slug: 'voorwaarden', route: '/voorwaarden' }],
      huidigeSlug: 'voorwaarden-digitale-toegang',
    });
    const link = knopen.find((k) => k.type === 'link');
    expect(link.href).toBe('/voorwaarden#artikel-14');
  });
});

describe('geen HTML-injectie', () => {
  test('HTML in de bron blijft zichtbare tekst', () => {
    const md = '<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n| <b>x</b> | y |\n|---|---|\n| <iframe src="https://evil.example"></iframe> | z |';
    const { container } = renderMd(md);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });

  test('javascript:- en data:-links worden geen link', () => {
    const { container } = renderMd('[klik](javascript:alert(1)) en [plaatje](data:text/html;base64,PHNjcmlwdD4=) en [x](//evil.example)');
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('klik');
  });

  test('veiligeHref staat alleen bekende schema\'s toe', () => {
    expect(veiligeHref('/privacy')).toBe('/privacy');
    expect(veiligeHref('#artikel-9')).toBe('#artikel-9');
    expect(veiligeHref('https://www.dnb.nl')).toBe('https://www.dnb.nl');
    expect(veiligeHref('mailto:privacy@swiftbridge.nl')).toBe('mailto:privacy@swiftbridge.nl');
    expect(veiligeHref('JavaScript:alert(1)')).toBeNull();
    expect(veiligeHref('//evil.example')).toBeNull();
    expect(veiligeHref('/pad" onmouseover="x')).toBeNull();
  });
});

describe('tokens', () => {
  test('agent-token geeft zolang niet geregistreerd de "nog niet"-tekst', () => {
    const { container } = renderMd('Toezicht. {{AGENT_REGISTRATIE_KORT}}', { agentGeregistreerd: false });
    expect(container.textContent).toContain('De inschrijving als agent bij DNB volgt zodra de samenwerking met onze EMI-partner is afgerond.');
    expect(container.textContent).not.toContain('{{');
    expect(container.textContent).not.toMatch(/staat als agent geregistreerd/);
  });

  test('geregistreerd geeft de oorspronkelijke tekst; onbekende tokens verdwijnen', () => {
    const { container } = renderMd('{{AGENT_REGISTRATIE_KORT}} {{ONBEKEND}}', { agentGeregistreerd: true });
    expect(container.textContent).toContain('SwiftBridge staat als agent geregistreerd bij DNB.');
    expect(container.textContent).not.toContain('ONBEKEND');
  });
});

describe('documentkop', () => {
  test('titel uit de eerste kop, versieregel eruit, overige inleiding blijft', () => {
    const blokken = parseMarkdown('# Algemene Voorwaarden SwiftBridge\n\nVersie 1.0 — geldig vanaf 17 september 2026\nSwiftBridge B.V., Den Haag · KvK 42138434\n\n---\n\n## 1. Eerste');
    const kop = scheidDocumentKop(blokken);
    expect(kop.titel).toBe('Algemene Voorwaarden SwiftBridge');
    expect(kop.versie).toBe('1.0');
    expect(kop.geldigVanaf).toBe('17 september 2026');
    expect(kop.blokken[0]).toEqual({ type: 'alinea', regels: ['SwiftBridge B.V., Den Haag · KvK 42138434'] });
  });

  test('voorvoegsel "Productkenmerkenblad" komt terug als soort', () => {
    const kop = scheidDocumentKop(parseMarkdown('# Kenmerken\n\nProductkenmerkenblad — versie 1.0, geldig vanaf 17 september 2026\n\n---'));
    expect(kop.versie).toBe('1.0');
    expect(kop.soort).toBe('Productkenmerkenblad');
    expect(kop.blokken[0]).toEqual({ type: 'scheiding' });
  });
});
