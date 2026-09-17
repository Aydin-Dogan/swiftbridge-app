/**
 * KybHub.test.jsx — 7 stapkaarten, hervat-knop en verwijderen met bevestiging.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import KybHub from './KybHub';
import { renderMetRouter, forceerNederlands, oefenAanvraag } from './kybTestHulp';

describe('KybHub', () => {
  beforeEach(() => { forceerNederlands(); });

  test('toont 7 kaarten en "Ga verder met stap 3"', () => {
    const onNaarStap = vi.fn();
    renderMetRouter(<KybHub aanvraag={oefenAanvraag({ stappenVoltooid: [1, 2], volgendeStap: 3 })} onNaarStap={onNaarStap} />);
    const lijst = screen.getByRole('list', { name: 'Je aanvraag' });
    expect(lijst.querySelectorAll('li')).toHaveLength(7);
    expect(screen.getAllByText('Voltooid')).toHaveLength(2);
    expect(screen.getAllByText('Open')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: /Ga verder met stap 3/ }));
    expect(onNaarStap).toHaveBeenCalledWith(3);
    expect(screen.getByRole('button', { name: /Over je bedrijf/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Vragen over je gebruik/ }));
    expect(onNaarStap).toHaveBeenLastCalledWith(4);
  });

  test('huidige stap heeft aria-current=step', () => {
    renderMetRouter(<KybHub aanvraag={oefenAanvraag({ stappenVoltooid: [1], volgendeStap: 2 })} onNaarStap={() => {}} />);
    expect(screen.getByRole('button', { name: /Over jou/ })).toHaveAttribute('aria-current', 'step');
  });

  test('verwijderen vraagt bevestiging (ConfirmDialog) en roept onIntrekken aan', async () => {
    const onIntrekken = vi.fn().mockResolvedValue({});
    renderMetRouter(<KybHub aanvraag={oefenAanvraag()} onNaarStap={() => {}} onIntrekken={onIntrekken} />);
    fireEvent.click(screen.getByRole('button', { name: /Aanvraag verwijderen/ }));
    const dialoog = screen.getByRole('dialog');
    expect(dialoog).toHaveTextContent('Weet je zeker dat je deze aanvraag wilt verwijderen?');
    expect(onIntrekken).not.toHaveBeenCalled();
    fireEvent.click(dialoog.querySelectorAll('button')[1]);
    await waitFor(() => expect(onIntrekken).toHaveBeenCalledTimes(1));
  });

  test('info_nodig markeert de heropende stappen met "Aanvullen"', () => {
    renderMetRouter(<KybHub aanvraag={oefenAanvraag({ status: 'info_nodig', stappenVoltooid: [1, 2, 3, 4, 5, 6, 7], volgendeStap: 7, infoVerzoek: { stappen: [4] } })} onNaarStap={() => {}} />);
    expect(screen.getAllByText('Aanvullen')).toHaveLength(1);
  });
});
