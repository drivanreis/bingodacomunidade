import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

const { mockNavigate, mockLogin } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }) => children,
  },
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login (público)', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogin.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('faz login com CPF limpo e redireciona para /dashboard', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ role: 'fiel' });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), '111.444.777-35');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(mockLogin).toHaveBeenCalledWith('11144477735', 'Senha@123');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it.each([
    {
      persona: 'Eu (Admin-Site)',
      identificador: 'admin.site@exemplo.com',
      role: 'admin_site',
      redirect: '/admin-site/dashboard',
    },
    {
      persona: 'Eu (Admin-Paróquia)',
      identificador: 'admin.paroquia@exemplo.com',
      role: 'admin_paroquia',
      redirect: '/admin-paroquia/dashboard',
    },
    {
      persona: 'Eu (Usuário Comum)',
      identificador: '111.444.777-35',
      role: 'fiel',
      redirect: '/dashboard',
    },
    {
      persona: 'Eu (Colaborador)',
      identificador: 'colaborador@paroquia.com',
      role: 'paroquia_caixa',
      redirect: '/admin-paroquia/dashboard',
    },
  ])('redireciona corretamente para %s', async ({ identificador, role, redirect }) => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ role });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), identificador);
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(redirect);
    });
  });

  it('exibe erro vindo do login', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('CPF ou senha incorretos'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), '111.444.777-35');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    const errors = await screen.findAllByText(/cpf ou senha incorretos/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('exibe erro para campos vazios', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    const message = await screen.findByText(/cpf é obrigatório/i);
    expect(message).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('exibe erro quando CPF está em formato inválido', async () => {
    const user = userEvent.setup();

    mockLogin.mockImplementationOnce(async (cpf: string) => {
      if (cpf.length !== 11) {
        throw new Error('CPF inválido');
      }
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.78');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/cpf inválido/i)).toBeInTheDocument();
  });

  it('permite login com email (desejado)', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ role: 'fiel' });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), 'joao@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(mockLogin).toHaveBeenCalledWith('joao@example.com', 'Senha@123');
  });

  it('exibe erro quando CPF/Email não existe no banco', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('CPF ou Email não encontrado'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.789-09');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/cpf ou email não encontrado/i)).toBeInTheDocument();
  });

  it('bloqueia após 5 tentativas com credenciais válidas (formato) e senha errada', async () => {
    const user = userEvent.setup();
    let attempts = 0;

    mockLogin.mockImplementation(async () => {
      attempts += 1;
      if (attempts >= 5) {
        throw new Error('Muitas tentativas. Tente novamente em 5 minutos.');
      }
      throw new Error('CPF ou senha incorretos');
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    for (let i = 0; i < 5; i += 1) {
      await user.clear(screen.getByPlaceholderText('000.000.000-00'));
      await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.789-09');
      await user.clear(screen.getByPlaceholderText('••••••••'));
      await user.type(screen.getByPlaceholderText('••••••••'), 'Senha@123');
      await user.click(screen.getByRole('button', { name: /entrar/i }));
    }

    expect(
      await screen.findByText(/muitas tentativas\. tente novamente em 5 minutos/i)
    ).toBeInTheDocument();
  });

  it('Usuário Comum Burro: tenta login sem preencher senha e recebe erro amigável', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), '111.444.777-35');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/senha é obrigatória/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('Usuário Comum Hacker: recebe bloqueio após múltiplas tentativas de força bruta', async () => {
    const user = userEvent.setup();
    let attempts = 0;

    mockLogin.mockImplementation(async () => {
      attempts += 1;
      if (attempts >= 5) {
        throw new Error('Muitas tentativas. Tente novamente em 5 minutos.');
      }
      throw new Error('CPF ou senha incorretos');
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    for (let i = 0; i < 5; i += 1) {
      fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), { target: { value: '111.444.777-35' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Senha@123' } });
      await user.click(screen.getByRole('button', { name: /entrar/i }));
    }

    expect(await screen.findByText(/muitas tentativas/i)).toBeInTheDocument();
  });
});
