/**
 * ZinMetLinks.test.jsx — documentnamen in een vertaalde zin worden links
 * (nieuw tabblad); ontbrekende labels komen als link achter de zin.
 */
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ZinMetLinks from './ZinMetLinks';

describe('ZinMetLinks', () => {
  test('maakt de documentnamen in de zin klikbaar, in volgorde', () => {
    const { container } = render(
      <p>
        <ZinMetLinks
          tekst="Door dit apparaat te koppelen ga je akkoord met de Voorwaarden Digitale Toegang. Lees ook onze Veiligheidsregels."
          links={[
            { label: 'Veiligheidsregels', to: '/veiligheid/regels' },
            { label: 'Voorwaarden Digitale Toegang', to: '/voorwaarden/digitale-toegang' },
          ]}
        />
      </p>
    );
    expect(container.textContent).toBe('Door dit apparaat te koppelen ga je akkoord met de Voorwaarden Digitale Toegang. Lees ook onze Veiligheidsregels.');
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/voorwaarden/digitale-toegang', '/veiligheid/regels']);
    for (const a of links) {
      expect(a).toHaveAttribute('target', '_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
  });

  test('label dat niet letterlijk in de zin staat komt als link achteraan', () => {
    const { container } = render(
      <p><ZinMetLinks tekst="Zin zonder naam." links={[{ label: 'Tarieven', to: '/tarieven' }]} /></p>
    );
    expect(container.textContent).toBe('Zin zonder naam. Tarieven');
    expect(screen.getByRole('link', { name: 'Tarieven' })).toHaveAttribute('href', '/tarieven');
  });
});
