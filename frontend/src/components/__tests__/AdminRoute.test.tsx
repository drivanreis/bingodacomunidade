import type React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminRoute, SuperAdminRoute, ParishAdminRoute, PublicUserRoute } from '../AdminRoute';

const renderWithRoutes = (element: React.ReactElement, initialPath = '/protected') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/" element={<div>home</div>} />
        <Route path="/dashboard" element={<div>dashboard</div>} />
        <Route path="/login" element={<div>login</div>} />
        <Route path="/admin-site/login" element={<div>admin-site-login</div>} />
        <Route path="/admin-site/dashboard" element={<div>admin-site-dashboard</div>} />
        <Route path="/admin-paroquia/login" element={<div>admin-paroquia-login</div>} />
        <Route path="/admin-paroquia/dashboard" element={<div>admin-paroquia-dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('AdminRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redireciona para login quando não há sessão', () => {
    renderWithRoutes(
      <AdminRoute allowedRoles={['admin_site']} redirectTo="/admin-site/login">
        <div>conteudo protegido</div>
      </AdminRoute>
    );

    expect(screen.getByText('admin-site-login')).toBeInTheDocument();
  });

  it('renderiza conteúdo quando role é permitida', () => {
    localStorage.setItem('@BingoComunidade:token', 'token');
    localStorage.setItem('@BingoComunidade:user', JSON.stringify({ nivel_acesso: 'admin_site' }));

    renderWithRoutes(
      <AdminRoute allowedRoles={['admin_site']}>
        <div>conteudo protegido</div>
      </AdminRoute>
    );

    expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
  });

  it('redireciona para dashboard correspondente quando role não é permitida', () => {
    localStorage.setItem('@BingoComunidade:token', 'token');
    localStorage.setItem('@BingoComunidade:user', JSON.stringify({ nivel_acesso: 'admin_paroquia' }));

    renderWithRoutes(
      <AdminRoute allowedRoles={['admin_site']}>
        <div>conteudo protegido</div>
      </AdminRoute>
    );

    expect(screen.getByText('admin-paroquia-dashboard')).toBeInTheDocument();
  });

  it('redireciona quando user no storage está inválido (json quebrado)', () => {
    localStorage.setItem('@BingoComunidade:token', 'token');
    localStorage.setItem('@BingoComunidade:user', '{invalido');

    renderWithRoutes(
      <AdminRoute allowedRoles={['admin_site']} redirectTo="/login">
        <div>conteudo protegido</div>
      </AdminRoute>
    );

    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('SuperAdminRoute aceita admin_site', () => {
    localStorage.setItem('@BingoComunidade:token', 'token');
    localStorage.setItem('@BingoComunidade:user', JSON.stringify({ nivel_acesso: 'admin_site' }));

    renderWithRoutes(
      <SuperAdminRoute>
        <div>super-admin-area</div>
      </SuperAdminRoute>
    );

    expect(screen.getByText('super-admin-area')).toBeInTheDocument();
  });

  it('ParishAdminRoute aceita paroquia_caixa', () => {
    localStorage.setItem('@BingoComunidade:token', 'token');
    localStorage.setItem('@BingoComunidade:user', JSON.stringify({ tipo: 'paroquia_caixa' }));

    renderWithRoutes(
      <ParishAdminRoute>
        <div>paroquia-area</div>
      </ParishAdminRoute>
    );

    expect(screen.getByText('paroquia-area')).toBeInTheDocument();
  });

  it('PublicUserRoute aceita fiel', () => {
    localStorage.setItem('@BingoComunidade:token', 'token');
    localStorage.setItem('@BingoComunidade:user', JSON.stringify({ tipo: 'fiel' }));

    renderWithRoutes(
      <PublicUserRoute>
        <div>public-user-area</div>
      </PublicUserRoute>
    );

    expect(screen.getByText('public-user-area')).toBeInTheDocument();
  });
});
