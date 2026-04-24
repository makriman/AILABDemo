import { describe, expect, test } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { QuizSessionProvider } from './context/QuizSessionContext';
import { ToastProvider } from './context/ToastContext';
import App from './App';

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <QuizSessionProvider>
          <App />
        </QuizSessionProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('App', () => {
  test('renders temporary quiz landing page', () => {
    renderApp(['/']);

    expect(screen.getByText(/Generate a Temporary Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/session is temporary/i)).toBeInTheDocument();
  });

  test('redirects /quiz to / when no in-memory session exists', async () => {
    renderApp(['/quiz']);

    await waitFor(() => {
      expect(screen.getByText(/Generate a Temporary Quiz/i)).toBeInTheDocument();
    });
  });

  test('redirects /results to / when no result exists', async () => {
    renderApp(['/results']);

    await waitFor(() => {
      expect(screen.getByText(/Generate a Temporary Quiz/i)).toBeInTheDocument();
    });
  });
});
