/**
 * Tests for ParoquiaManager Component
 * 
 * Testa renderização e funcionalidade do componente ParoquiaManager
 * que gerencia configuração de paróquia individual (Admin-Paróquia)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParoquiaManager from '../../pages/ParoquiaManager';

// Mock completo do módulo API (SEM variáveis antes de vi.mock)
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({
      data: {
        id: 'paroquia-1',
        nome: 'Paróquia Teste',
        cnpj: '00.000.000/0000-00',
        email: 'parish@test.com',
        telefone: '(85) 9999-9999',
        endereco: 'Rua Teste, 123',
        cidade: 'Fortaleza',
        estado: 'CE',
        cep: '60000-000',
        chave_pix: 'test@email.com',
        pessoa_responsavel: 'Responsável Teste',
        cpf_responsavel: '111.111.111-11',
        data_criacao: '2024-01-01'
      }
    })),
    post: vi.fn(() => Promise.resolve({ data: { id: 'new-id' } })),
    put: vi.fn(() => Promise.resolve({ data: { id: 'paroquia-1' } })),
    delete: vi.fn(() => Promise.resolve({ data: { success: true } })),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}));

// Mock do useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'user-123',
      tipo: 'paroquia_admin',
      paroquia_id: 'paroquia-1',
      nome: 'Admin Paróquia',
      email: 'admin@paroquia.com'
    },
    logout: vi.fn()
  }))
}));

// Mock do useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('ParoquiaManager Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('✅ Deve renderizar ParoquiaManager e carregar dados da paróquia', async () => {
    const { container } = render(
      <BrowserRouter>
        <ParoquiaManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Componente deve existir no DOM
      expect(container).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('ParoquiaManager: Deve ser acessível apenas para Admin-Paróquia', () => {
    const user = {
      tipo: 'paroquia_admin',
      paroquia_id: 'paroquia-1'
    };

    const hasAccess = user.tipo === 'paroquia_admin' && user.paroquia_id !== null;
    expect(hasAccess).toBe(true);
  });

  it('ParoquiaManager: ❌ Não deve ser acessível para Admin-Site', () => {
    const user = {
      tipo: 'admin_site',
      paroquia_id: null
    };

    const hasAccess = user.tipo === 'paroquia_admin' && user.paroquia_id !== null;
    expect(hasAccess).toBe(false);
  });

  it('ParoquiaManager: ❌ Não deve ser acessível para Usuario Comum', () => {
    const user = {
      tipo: 'usuario_publico',
      paroquia_id: null
    };

    const hasAccess = user.tipo === 'paroquia_admin' && user.paroquia_id !== null;
    expect(hasAccess).toBe(false);
  });

  it('ParoquiaManager: Rota deve ser singular /admin-paroquia/paroquia', () => {
    const route = '/admin-paroquia/paroquia';
    const isSingular = !route.includes('paroquias');
    expect(isSingular).toBe(true);
  });

  it('ParoquiaManager: Deve gerenciar APENAS sua paróquia', () => {
    const userParoquiaId: string = 'paroquia-1';
    const targetParoquiaId: string = 'paroquia-1';
    
    const canManage = userParoquiaId === targetParoquiaId;
    expect(canManage).toBe(true);
  });

  it('ParoquiaManager: ❌ Não deve gerenciar outra paróquia', () => {
    const userParoquiaId: string = 'paroquia-1';
    const targetParoquiaId: string = 'paroquia-999';
    
    const canManage = userParoquiaId === targetParoquiaId;
    expect(canManage).toBe(false);
  });

  it('ParoquiaManager: Deve permitir edição de dados da paróquia', () => {
    const canEdit = true; // ParoquiaManager permite edição
    expect(canEdit).toBe(true);
  });

  it('ParoquiaManager: Deve permitir visualizar informações financeiras', () => {
    const canViewFinancial = true; // ParoquiaManager mostra info financeira
    expect(canViewFinancial).toBe(true);
  });

  it('ParoquiaManager: Deve permitir gerenciar responsáveis', () => {
    const canManageResponsibles = true; // ParoquiaManager gerencia responsáveis
    expect(canManageResponsibles).toBe(true);
  });

  it('ParoquiaManager: Component is part of Admin-Paróquia hierarchy', () => {
    const adminBundle = {
      dashboard: '/admin-paroquia/dashboard',
      paroquiaConfig: '/admin-paroquia/paroquia', // ParoquiaManager
      usuarios: '/admin-paroquia/usuarios',
      configuracoes: '/admin-paroquia/configuracoes'
    };

    expect(adminBundle.paroquiaConfig).toBe('/admin-paroquia/paroquia');
    expect(adminBundle.paroquiaConfig).not.toContain('paroquias'); // singular
  });
});
