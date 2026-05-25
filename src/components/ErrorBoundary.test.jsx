/**
 * Tests voor ErrorBoundary — vangt React render-errors op.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

// Component dat crasht op render
function Boom({ should = true }) {
  if (should) throw new Error('Test crash');
  return <div>OK</div>;
}

function Wrap({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('ErrorBoundary', () => {
  let errorSpy;
  beforeEach(() => {
    // Voorkom dat React's console.error de test-output vervuilt
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('rendert children als er geen error is', () => {
    render(
      <Wrap>
        <ErrorBoundary>
          <div>Happy path</div>
        </ErrorBoundary>
      </Wrap>
    );
    expect(screen.getByText('Happy path')).toBeInTheDocument();
  });

  test('vangt error en toont fallback met error-id', () => {
    render(
      <Wrap>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </Wrap>
    );
    expect(screen.getByText('Er ging iets mis')).toBeInTheDocument();
    // Error-id format: ERR-XXXXX
    expect(screen.getByText(/^ERR-[A-Z0-9]+$/)).toBeInTheDocument();
  });

  test('toont link naar startpagina', () => {
    render(
      <Wrap>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </Wrap>
    );
    const home = screen.getByText('Naar startpagina');
    expect(home).toBeInTheDocument();
    expect(home.closest('a')).toHaveAttribute('href', '/');
  });

  test('retry-knop reset state', () => {
    let crash = true;
    function Toggle() {
      return <Boom should={crash} />;
    }
    const { rerender } = render(
      <Wrap>
        <ErrorBoundary>
          <Toggle />
        </ErrorBoundary>
      </Wrap>
    );
    expect(screen.getByText('Er ging iets mis')).toBeInTheDocument();
    crash = false; // volgende render crasht niet meer
    fireEvent.click(screen.getByText('Opnieuw proberen'));
    rerender(
      <Wrap>
        <ErrorBoundary>
          <Toggle />
        </ErrorBoundary>
      </Wrap>
    );
    expect(screen.queryByText('Er ging iets mis')).not.toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
