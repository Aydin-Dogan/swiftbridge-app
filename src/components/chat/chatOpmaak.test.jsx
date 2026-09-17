import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { splitsActies, parseBlokken } from './chatOpmaak';
import { OpgemaakteTekst } from './OpgemaakteTekst';
import ChatBubble from './ChatBubble';

describe('chatOpmaak', () => {
  it('haalt alleen toegestane actie-tokens uit de tekst', () => {
    const { tekst, acties } = splitsActies('Klik op **Betalingen**.\n[[ga:betalingen]] [[ga:hacker]] [[ga:betalingen]]');
    expect(acties).toEqual(['betalingen']);
    expect(tekst).toBe('Klik op **Betalingen**.');
  });

  it('herkent genummerde stappen, opsommingen en alinea\'s', () => {
    const blokken = parseBlokken('Zo doe je dat:\n1. Klik op **Meer**.\n2) Kies **Documenten**.\n\n- tip een\n- tip twee');
    expect(blokken.map((b) => b.type)).toEqual(['p', 'ol', 'ul']);
    expect(blokken[1].items.map((i) => i.nr)).toEqual([1, 2]);
  });

  it('rendert vet als strong en nooit als HTML', () => {
    const { container } = render(<OpgemaakteTekst tekst={'Klik op **Service** <img src=x onerror=alert(1)>'} />);
    expect(container.querySelector('strong')?.textContent).toBe('Service');
    expect(container.querySelector('img')).toBeNull();
  });

  it('ChatBubble toont "Ga naar"-knop alleen met onActie', () => {
    const t = (k, p) => (k === 'chat_ga_naar' ? `Ga naar ${p.plek}` : k === 'zijbalk_documenten' ? 'Documenten' : k);
    const bericht = { id: '1', rol: 'support', tekst: '1. Klik op **Meer**.\n[[ga:documenten]]' };
    const onActie = vi.fn();
    const { rerender } = render(<ChatBubble bericht={bericht} t={t} onActie={onActie} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ga naar Documenten' }));
    expect(onActie).toHaveBeenCalledWith('documenten');
    rerender(<ChatBubble bericht={bericht} t={t} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/\[\[ga:/)).toBeNull();
  });
});
