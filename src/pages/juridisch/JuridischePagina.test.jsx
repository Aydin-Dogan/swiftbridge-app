/**
 * JuridischePagina.test.jsx — rookproef van de juridische pagina's:
 * document laadt, titel + versieregel + inhoudsopgave + ankers, archief-
 * overzicht en -route, onbekende archiefversie gaat terug naar het archief.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import JuridischePagina from './JuridischePagina';
import JuridischArchief from './JuridischArchief';

function renderRoute(pad) {
  return render(
    <MemoryRouter initialEntries={[pad]}>
      <Routes>
        <Route path="/voorwaarden/betaaldiensten" element={<JuridischePagina slug="voorwaarden-betaaldiensten" />} />
        <Route path="/voorwaarden/archief" element={<JuridischArchief />} />
        <Route path="/voorwaarden/archief/:versie/:slug" element={<JuridischePagina />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('JuridischePagina', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  test('toont document met titel, versieregel, inhoudsopgave en artikel-anker', async () => {
    const { container } = renderRoute('/voorwaarden/betaaldiensten#artikel-9');
    const titel = await screen.findByRole('heading', { level: 1, name: 'Voorwaarden Betaaldiensten SwiftBridge' });
    expect(titel).toBeInTheDocument();
    // Zonder TaalProvider geeft t() de sleutel terug; de versieregel is er wel.
    expect(container.textContent).toContain('juridisch_versie');
    // Versieregel uit de markdown staat niet dubbel in de tekst.
    expect(container.querySelector('article p')?.textContent).not.toMatch(/^Versie 1\.0 — geldig vanaf/);
    await waitFor(() => expect(container.querySelector('#artikel-9')).not.toBeNull());
    // Id begint met een cijfer: geldig in HTML/ankers, maar geen geldige CSS-selector.
    expect(document.getElementById('9-wanneer-wij-een-overboeking-pauzeren-voor-een-controle')).not.toBeNull();
    expect(container.querySelector('a[href="#9-wanneer-wij-een-overboeking-pauzeren-voor-een-controle"]')).not.toBeNull();
    expect(container.querySelector('a[href="#deel-a-je-swiftbridge-profiel"]')).not.toBeNull();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.getAllByRole('button', { name: 'juridisch_download_pdf' })).toHaveLength(1);
    expect(container.querySelector('img[src="/brand/sb-logo.png"]')).not.toBeNull();
    expect(container.innerHTML).not.toContain('{{');
  });

  test('archiefversie laadt via de URL en verwijzingen blijven in het archief', async () => {
    const { container } = renderRoute('/voorwaarden/archief/1.0/voorwaarden');
    await screen.findByRole('heading', { level: 1, name: 'Algemene Voorwaarden SwiftBridge' });
    const link = [...container.querySelectorAll('a')].find((a) => a.textContent === 'Voorwaarden Betaaldiensten');
    expect(link?.getAttribute('href')).toBe('/voorwaarden/archief/1.0/voorwaarden-betaaldiensten');
    expect(container.textContent).not.toMatch(/staat als agent geregistreerd/);
  });

  test('onbekende archiefversie gaat naar het archiefoverzicht', async () => {
    renderRoute('/voorwaarden/archief/0.1/voorwaarden');
    expect(await screen.findByRole('link', { name: /Algemene Voorwaarden/ })).toHaveAttribute('href', '/voorwaarden/archief/1.0/voorwaarden');
  });
});
