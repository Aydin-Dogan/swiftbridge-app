/**
 * Avatar.test.jsx — initialen + deterministische kleur (HHH).
 */
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import Avatar, { initialenUitNaam, kleurUitNaam } from './Avatar';

describe('initialenUitNaam()', () => {
  test('Twee namen: eerste + laatste letter', () => {
    expect(initialenUitNaam('Mehmet Yilmaz')).toBe('MY');
    expect(initialenUitNaam('Aydin Dogan')).toBe('AD');
  });

  test('Eén naam: eerste 2 letters', () => {
    expect(initialenUitNaam('Mehmet')).toBe('ME');
  });

  test('Drie namen: eerste + laatste letter', () => {
    expect(initialenUitNaam('Jan de Boer')).toBe('JB');
  });

  test('Lege of ongeldige input: ?', () => {
    expect(initialenUitNaam('')).toBe('?');
    expect(initialenUitNaam(null)).toBe('?');
    expect(initialenUitNaam(undefined)).toBe('?');
    expect(initialenUitNaam('   ')).toBe('?');
  });
});

describe('kleurUitNaam()', () => {
  test('Deterministisch: zelfde naam = zelfde kleur', () => {
    expect(kleurUitNaam('Mehmet Yilmaz')).toBe(kleurUitNaam('Mehmet Yilmaz'));
    expect(kleurUitNaam('Aydin')).toBe(kleurUitNaam('Aydin'));
  });

  test('Verschillende namen geven verschillende kleuren (meestal)', () => {
    const kleuren = new Set();
    ['Mehmet', 'Aydin', 'Ali', 'Fatima', 'Hassan'].forEach(n => kleuren.add(kleurUitNaam(n)));
    // 5 verschillende namen → minstens 2 verschillende kleuren in 8-paletten
    expect(kleuren.size).toBeGreaterThanOrEqual(2);
  });

  test('Returnt geldige hex-kleur', () => {
    expect(kleurUitNaam('Test')).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('<Avatar />', () => {
  test('Rendert initialen', () => {
    const { container } = render(<Avatar naam="Mehmet Yilmaz" />);
    expect(container.textContent).toContain('MY');
  });

  test('Past size prop toe', () => {
    const { container } = render(<Avatar naam="Test" size={64} />);
    const div = container.firstChild;
    expect(div.style.width).toBe('64px');
    expect(div.style.height).toBe('64px');
  });

  test('aria-label gebruikt naam', () => {
    const { container } = render(<Avatar naam="Aydin Dogan" />);
    expect(container.firstChild.getAttribute('aria-label')).toBe('Aydin Dogan');
  });
});
