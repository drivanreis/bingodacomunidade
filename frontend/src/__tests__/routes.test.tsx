import { describe, it, expect, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import App from '../App';

const renderAt = async (path: string) => {
  window.history.pushState({}, '', path);
  render(<App />);
};

const expectPath = async (path: string) => {
  await waitFor(() => {
    expect(window.location.pathname).toBe(path);
  });
};

describe('Rotas do app (smoke)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const publicRoutes = [
    '/',
    '/first-access-setup',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/admin-site/login',
    '/admin-paroquia/login',
  ];

  publicRoutes.forEach((path) => {
    it(`mantém rota pública ${path}`, async () => {
      await renderAt(path);
      await expectPath(path);
    });
  });

  const redirects = [
    { path: '/admin-site', to: '/admin-site/login' },
    { path: '/rota-inexistente', to: '/' },
  ];

  redirects.forEach(({ path, to }) => {
    it(`redireciona ${path} para ${to}`, async () => {
      await renderAt(path);
      await expectPath(to);
    });
  });

  const protectedRedirects = [
    { path: '/admin-site/dashboard', to: '/admin-site/login' },
    { path: '/admin-site/paroquias', to: '/admin-site/login' },
    { path: '/admin-site/usuarios', to: '/admin-site/login' },
    { path: '/admin-site/admins', to: '/admin-site/login' },
    { path: '/admin-site/relatorios', to: '/admin-site/login' },
    { path: '/admin-site/configuracoes', to: '/admin-site/login' },
    { path: '/admin-site/auditoria', to: '/admin-site/login' },
    { path: '/admin-site/feedback', to: '/admin-site/login' },
    { path: '/admin-paroquia/dashboard', to: '/admin-paroquia/login' },
    { path: '/dashboard', to: '/login' },
    { path: '/feedback', to: '/login' },
    { path: '/games', to: '/login' },
    { path: '/games/new', to: '/login' },
    { path: '/games/123', to: '/login' },
    { path: '/profile', to: '/login' },
  ];

  protectedRedirects.forEach(({ path, to }) => {
    it(`redireciona rota protegida ${path} para ${to} quando não autenticado`, async () => {
      await renderAt(path);
      await expectPath(to);
    });
  });
});
