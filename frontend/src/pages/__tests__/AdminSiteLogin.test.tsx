import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSiteLogin from '../AdminSiteLogin';
import { MemoryRouter } from 'react-router-dom';

const { postMock, mockNavigate } = vi.hoisted(() => ({
  postMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    post: postMock,
    defaults: { headers: { common: {} } },
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminSiteLogin', () => {
  it('exibe rótulo e placeholder como CPF ou Email', () => {
    render(
      <MemoryRouter>
        <AdminSiteLogin />
      </MemoryRouter>
    );

    expect(screen.getByText(/cpf ou email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/cpf ou email@dominio\.com/i)).toBeInTheDocument();
  });

  it('redireciona para dashboard após login admin-site válido', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-123',
        usuario: {
          id: 'ADM-1',
          nome: 'Admin Real',
          login: 'admin_real',
          nivel_acesso: 'admin_site',
          tipo: 'usuario_administrativo',
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminSiteLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/cpf ou email@dominio\.com/i), 'admin_real');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(postMock).toHaveBeenCalledWith('/auth/admin-site/login', {
      login: 'admin_real',
      senha: 'Senha@123',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });

  it('mostra mensagem de bootstrap concluído quando /auth/bootstrap/login retorna 404', async () => {
    const user = userEvent.setup();

    postMock.mockImplementation((url: string) => {
      if (url === '/auth/admin-site/login') {
        return Promise.reject({
          response: { data: { detail: 'Login ou senha incorretos' } },
        });
      }
      if (url === '/auth/bootstrap/login') {
        return Promise.resolve({
          status: 404,
          data: {},
        });
      }
      return Promise.reject(new Error('Rota não mockada'));
    });

    render(
      <MemoryRouter>
        <AdminSiteLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/cpf ou email@dominio\.com/i), 'Admin');
    await user.type(screen.getByPlaceholderText('••••••••'), 'admin123');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(
      await screen.findByText(
        /o primeiro acesso já foi concluído! entre com as credenciais que você cadastrou\./i
      )
    ).toBeInTheDocument();
  });
});
