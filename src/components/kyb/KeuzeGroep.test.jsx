/**
 * KeuzeGroep.test.jsx — rollen, toetsenbord en meervoudige keuze.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import KeuzeGroep from './KeuzeGroep';
import { KYB_OPTIES } from './kybOpties';
import { renderMetRouter, forceerNederlands } from './kybTestHulp';

describe('KeuzeGroep', () => {
  beforeEach(() => { forceerNederlands(); });

  test('enkelvoudig: role=radiogroup met radio-opties en aria-checked', () => {
    const onChange = vi.fn();
    renderMetRouter(<KeuzeGroep naam="rechtsvorm" label="Rechtsvorm" opties={KYB_OPTIES.RECHTSVORM} waarde="bv" onChange={onChange} />);
    expect(screen.getByRole('radiogroup', { name: 'Rechtsvorm' })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(screen.getByRole('radio', { name: 'Bv' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Eenmanszaak' })).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(screen.getByRole('radio', { name: 'Stichting' }));
    expect(onChange).toHaveBeenCalledWith('stichting');
  });

  test('toetsenbord: pijltje omlaag kiest de volgende optie, spatie kiest de gefocuste', () => {
    const onChange = vi.fn();
    renderMetRouter(<KeuzeGroep naam="rechtsvorm" opties={KYB_OPTIES.RECHTSVORM} waarde="eenmanszaak" onChange={onChange} />);
    const eerste = screen.getByRole('radio', { name: 'Eenmanszaak' });
    eerste.focus();
    fireEvent.keyDown(eerste, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith('bv');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Bv' }));
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Bv' }), { key: ' ' });
    expect(onChange).toHaveBeenLastCalledWith('bv');
    // omhoog vanaf de eerste optie draait rond naar de laatste
    fireEvent.keyDown(eerste, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith('overig');
  });

  test('roving tabindex: alleen de gekozen radio is tabbaar', () => {
    renderMetRouter(<KeuzeGroep naam="x" opties={KYB_OPTIES.UBO_PCT} waarde="50_75" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: '50% tot 75%' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: '25% tot 50%' })).toHaveAttribute('tabindex', '-1');
  });

  test('meervoudig: role=group met checkboxes; onChange geeft de lijst in optie-volgorde', () => {
    const onChange = vi.fn();
    renderMetRouter(<KeuzeGroep naam="herkomst" label="Herkomst" opties={KYB_OPTIES.HERKOMST} meervoudig waarden={['lening']} onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Herkomst' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(7);
    expect(screen.getByRole('checkbox', { name: 'Lening' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Omzet van mijn onderneming' }));
    expect(onChange).toHaveBeenLastCalledWith(['omzet_onderneming', 'lening']);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lening' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  test('booleaanse waarden (Ja/Nee) werken als radio', () => {
    const onChange = vi.fn();
    renderMetRouter(<KeuzeGroep naam="pep" opties={[{ waarde: true, tKey: 'kyb_ja' }, { waarde: false, tKey: 'kyb_nee' }]} waarde={false} onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Nee' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Ja' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
