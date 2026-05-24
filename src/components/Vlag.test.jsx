/**
 * Tests voor Vlag.jsx — a11y + fallback gedrag.
 */

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Vlag from './Vlag';

describe('Vlag', () => {
  test('rendert TR-vlag met aria-label', () => {
    const { container } = render(<Vlag land="TR" />);
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.getAttribute('aria-label')).toMatch(/Türkiye/i);
  });

  test('rendert NL-vlag met juiste aria-label', () => {
    const { container } = render(<Vlag land="NL" />);
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper.getAttribute('aria-label')).toMatch(/Nederland/i);
  });

  test('decoratief mode: aria-hidden zonder label', () => {
    const { container } = render(<Vlag land="TR" decorative />);
    const wrapper = container.querySelector('[aria-hidden="true"]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.getAttribute('aria-label')).toBeNull();
  });

  test('onbekende landcode: fallback met land-code als text', () => {
    render(<Vlag land="XX" />);
    expect(screen.getByText('XX')).toBeInTheDocument();
  });

  test('case-insensitive landcode (lowercase werkt ook)', () => {
    const { container } = render(<Vlag land="tr" />);
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper).toBeInTheDocument();
  });
});
