import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminParoquiaLogin from '../AdminParoquiaLogin';

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

describe('AdminParoquiaLogin', () => {
  beforeEach(() => {
    postMock.mockReset();
    mockNavigate.mockReset();
  });

  it('Perfil Admin-Paróquia Inteligente (Caminho Feliz): autentica e redireciona para dashboard', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-paroq-1',
        usuario: {
          id: 'ADM-P-1',
          nome: 'Admin Paróquia',
          login: 'admin.paroquia@exemplo.com',
          nivel_acesso: 'admin_paroquia',
          tipo: 'usuario_administrativo',
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminParoquiaLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'admin.paroquia@exemplo.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(postMock).toHaveBeenCalledWith('/auth/admin-paroquia/login', {
      login: 'admin.paroquia@exemplo.com',
      senha: 'Senha@123',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/admin-paroquia/dashboard');
  });

  it('Perfil Admin-Paróquia Burro (UX/Resiliência): senha incorreta retorna erro amigável', async () => {
    const user = userEvent.setup();

    postMock.mockRejectedValueOnce({
      response: { data: { detail: 'Login ou senha incorretos' } },
    });

    render(
      <MemoryRouter>
        <AdminParoquiaLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'admin.paroquia@exemplo.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'senha_errada');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(await screen.findByText(/login ou senha incorretos/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redireciona para troca inicial quando backend exigir mudança de senha temporária', async () => {
    const user = userEvent.setup();

    postMock.mockRejectedValueOnce({
      response: {
        status: 428,
        data: {
          detail: {
            needs_password_change: true,
            nivel_acesso: 'admin_paroquia',
          },
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminParoquiaLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'admin.paroquia@exemplo.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Temp@123');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin-paroquia/primeira-senha', {
      state: {
        login: 'admin.paroquia@exemplo.com',
        senhaAtual: 'Temp@123',
      },
    });
  });

  it('Perfil Admin-Paróquia Hacker (Segurança/PenTest): usuário admin-site é bloqueado', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-hacker',
        usuario: {
          id: 'ADM-S-1',
          nome: 'Admin Site',
          login: 'admin.site@exemplo.com',
          nivel_acesso: 'admin_site',
          tipo: 'usuario_administrativo',
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminParoquiaLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'admin.site@exemplo.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(await screen.findByText(/acesso negado/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
