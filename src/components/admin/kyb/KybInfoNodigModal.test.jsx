/**
 * Tests KybInfoNodigModal — bericht >= 10 tekens en minimaal 1 stap verplicht (contract 2.6).
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaalProvider } from '../../../i18n';
import KybInfoNodigModal from './KybInfoNodigModal';

// jsdom meldt navigator.language 'en-US'; de admin-teksten in deze tests zijn NL (contract 3.4).
beforeEach(() => { localStorage.setItem('swiftbridge_taal', 'nl'); });

function renderModal(props = {}) {
  const onVerstuur = vi.fn();
  const onClose = vi.fn();
  render(
    <TaalProvider>
      <KybInfoNodigModal open onClose={onClose} onVerstuur={onVerstuur} {...props} />
    </TaalProvider>
  );
  return { onVerstuur, onClose };
}

describe('KybInfoNodigModal', () => {
  test('rendert niets als open=false', () => {
    render(<TaalProvider><KybInfoNodigModal open={false} /></TaalProvider>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('verstuurknop blijft uit tot bericht >= 10 tekens EN minstens 1 stap', () => {
    const { onVerstuur } = renderModal();
    const knop = screen.getByRole('button', { name: /aanvullende informatie vragen/i });
    expect(knop).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/bericht aan de klant/i), { target: { value: 'Graag de landenlijst aanvullen' } });
    expect(knop).toBeDisabled(); // nog geen stap

    fireEvent.click(screen.getByLabelText(/4\. Gebruik/i));
    expect(knop).toBeEnabled();

    fireEvent.click(knop);
    expect(onVerstuur).toHaveBeenCalledWith({
      berichtKlant: 'Graag de landenlijst aanvullen',
      stappen: [4],
      documentSoorten: [],
    });
  });

  test('kort bericht met stap blijft geblokkeerd', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/bericht aan de klant/i), { target: { value: 'te kort' } });
    fireEvent.click(screen.getByLabelText(/1\. Bedrijf/i));
    expect(screen.getByRole('button', { name: /aanvullende informatie vragen/i })).toBeDisabled();
  });

  test('gevraagde documentsoorten gaan mee in de body', () => {
    const { onVerstuur } = renderModal();
    fireEvent.change(screen.getByLabelText(/bericht aan de klant/i), { target: { value: 'Stuur de statuten en het uittreksel opnieuw.' } });
    fireEvent.click(screen.getByLabelText(/1\. Bedrijf/i));
    fireEvent.click(screen.getByLabelText(/^Statuten$/i));
    fireEvent.click(screen.getByLabelText(/KvK-uittreksel/i));
    fireEvent.click(screen.getByRole('button', { name: /aanvullende informatie vragen/i }));
    const body = onVerstuur.mock.calls[0][0];
    expect(body.stappen).toEqual([1]);
    expect(body.documentSoorten.sort()).toEqual(['kvk_uittreksel', 'statuten']);
  });

  test('Escape sluit de modal', () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
