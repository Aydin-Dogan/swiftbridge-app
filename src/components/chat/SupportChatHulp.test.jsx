/**
 * SupportChatHulp.test.jsx — AI-hulp na inloggen (verzoek Aydin 17-9).
 *
 * - ingelogd: genummerd hulpmenu i.p.v. de vaste FAQ-knoppen
 * - onderwerp > vraag gaat als echt bericht naar /support/chat
 * - antwoord met stappen wordt opgemaakt en krijgt een "Ga naar"-knop
 * - vraag vanaf de Service-pagina (event) opent de chat en verstuurt
 * - anoniem: geen hulpmenu en geen "Ga naar"-knoppen
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderMetRouter, forceerNederlands } from '../kyb/kybTestHulp';

const apiFetch = vi.fn();
vi.mock('../../services/api', () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

const { default: SupportChat } = await import('./SupportChat');

const ANTWOORD = 'Zo vind je het:\n1. Klik op **Meer**.\n2. Kies **Documenten**.\n[[ga:documenten]]';

describe('SupportChat: hulp voor ingelogde klanten', () => {
  beforeEach(() => {
    localStorage.clear(); // eerst wissen: forceerNederlands zet de taal in localStorage
    forceerNederlands();
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({ antwoord: ANTWOORD, logId: 'log1', mock: false });
  });

  test('onderwerp kiezen, vraag versturen, opgemaakt antwoord met Ga naar-knop', async () => {
    renderMetRouter(<SupportChat gebruiker={{ id: 'u1', naam: 'Oefen' }} />, { pad: '/app' });
    fireEvent.click(screen.getByRole('button', { name: 'Open support chat' }));

    expect(screen.getByText('Waarmee kunnen we helpen?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Jaaroverzicht en documenten/ }));
    fireEvent.click(screen.getByRole('button', { name: /Waar vind ik mijn jaaroverzicht\?/ }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/support/chat', expect.anything()));
    const body = apiFetch.mock.calls[0][1].body;
    expect(body.berichten.at(-1)).toEqual({ rol: 'user', tekst: 'Waar vind ik mijn jaaroverzicht?' });

    expect(await screen.findByText('Documenten', { selector: 'strong' })).toBeInTheDocument();
    const knop = screen.getByRole('button', { name: /Ga naar Documenten/ });
    const events = [];
    const luister = (e) => events.push(e.detail);
    window.addEventListener('swiftbridge_navigate', luister);
    fireEvent.click(knop);
    window.removeEventListener('swiftbridge_navigate', luister);
    expect(events).toEqual(['documenten']);
    expect(screen.queryByText(/\[\[ga:/)).toBeNull();
  });

  test('vraag vanaf de Service-pagina opent de chat en verstuurt', async () => {
    renderMetRouter(<SupportChat gebruiker={{ id: 'u1', naam: 'Oefen' }} />, { pad: '/app' });
    act(() => {
      window.dispatchEvent(new CustomEvent('swiftbridge_chat_vraag', { detail: { vraag: 'Hoe stel ik een koersalert in?' } }));
    });
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('anoniem: vaste FAQ-knoppen, geen hulpmenu en geen Ga naar-knop', async () => {
    renderMetRouter(<SupportChat gebruiker={null} />, { pad: '/' });
    fireEvent.click(screen.getByRole('button', { name: 'Open support chat' }));
    expect(screen.queryByText('Waarmee kunnen we helpen?')).toBeNull();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Waar is mijn jaaroverzicht?' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form'));
    expect(await screen.findByText('Documenten', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ga naar/ })).toBeNull();
  });
});
