import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSiteLogin from '../AdminSiteLogin';
import { MemoryRouter } from 'react-router-dom';

const { postMock, getMock, mockNavigate } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
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
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    mockNavigate.mockReset();

    getMock.mockResolvedValue({
      status: 200,
      data: { bootstrap_available: true },
    });
  });

  it('exibe rótulo e placeholder como Login ou Email', () => {
    render(
      <MemoryRouter>
        <AdminSiteLogin />
      </MemoryRouter>
    );

    expect(screen.getByText(/login ou email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/login ou email@dominio\.com/i)).toBeInTheDocument();
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

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'admin_real');
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

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'Admin');
    await user.type(screen.getByPlaceholderText('••••••••'), 'admin123');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(
      await screen.findByText(
        /o primeiro acesso já foi concluído! entre com as credenciais que você cadastrou\./i
      )
    ).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalledWith('/auth/admin-site/login', expect.anything());
  });

  it('oculta credenciais de primeiro acesso quando bootstrap está concluído', async () => {
    getMock.mockResolvedValueOnce({
      status: 200,
      data: { bootstrap_available: false },
    });

    render(
      <MemoryRouter>
        <AdminSiteLogin />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/área restrita - apenas super administradores/i)
    ).toBeInTheDocument();

    expect(screen.queryByText(/para o primeiro acesso, utilize:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/usuário:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/senha: admin123/i)).not.toBeInTheDocument();
  });

  it('Perfil Admin-Site Burro (UX/Resiliência): senha errada deve retornar erro amigável', async () => {
    const user = userEvent.setup();

    postMock.mockRejectedValueOnce({
      response: { status: 401, data: { detail: 'Login ou senha incorretos' } },
    });

    render(
      <MemoryRouter>
        <AdminSiteLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'admin_real');
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
            nivel_acesso: 'admin_site',
          },
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminSiteLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'admin_real');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Temp@123');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/primeira-senha', {
      state: {
        login: 'admin_real',
        senhaAtual: 'Temp@123',
      },
    });
  });

  it('Perfil Admin-Site Hacker (Segurança/PenTest): login sem permissão deve bloquear com acesso negado', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-403',
        usuario: {
          id: 'ADM-PAROQ-1',
          nome: 'Admin Paroquia',
          login: 'admin_paroquia',
          nivel_acesso: 'admin_paroquia',
          tipo: 'usuario_administrativo',
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminSiteLogin />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/login ou email@dominio\.com/i), 'admin_paroquia');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /acessar sistema/i }));

    expect(await screen.findByText(/acesso negado/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
