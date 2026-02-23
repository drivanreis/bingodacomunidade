import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AuthProvider, useAuth } from '../AuthContext';

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    post: postMock,
    defaults: { headers: { common: {} } },
  },
}));

vi.mock('../../hooks/useInactivityTimeout', () => ({
  useInactivityTimeout: () => ({
    showWarning: false,
    timeRemaining: 0,
    resetTimer: vi.fn(),
    clearTimers: vi.fn(),
  }),
}));

vi.mock('../../utils/carrinhoManager', () => ({
  limparItensExpirados: vi.fn(),
}));

const Probe = () => {
  const auth = useAuth();
  const [loginResult, setLoginResult] = useState('');

  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="username">{auth.user?.name || ''}</div>
      <div data-testid="userrole">{auth.user?.role || ''}</div>
      <div data-testid="login-result">{loginResult}</div>

      <button
        onClick={async () => {
          const user = await auth.login('joao@example.com', 'Senha@123');
          setLoginResult(user.role);
        }}
      >
        login-email
      </button>

      <button
        onClick={async () => {
          const user = await auth.login('11144477735', 'Senha@123');
          setLoginResult(user.role);
        }}
      >
        login-cpf
      </button>

      <button onClick={() => auth.updateUser({ name: 'Nome Atualizado' })}>update-user</button>
    </div>
  );
};

describe('AuthContext', () => {
  const SESSION_MARKER = '@BingoComunidade:session-active';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    postMock.mockReset();
  });

  it('hidrata sessão existente do localStorage', async () => {
    sessionStorage.setItem(SESSION_MARKER, '1');
    localStorage.setItem('@BingoComunidade:token', 'token-1');
    localStorage.setItem(
      '@BingoComunidade:user',
      JSON.stringify({
        id: 'USR-1',
        nome: 'Usuário Teste',
        email: 'user@example.com',
        tipo: 'fiel',
        cpf: '11144477735',
        paroquia_id: 'PAR-1',
      })
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(await screen.findByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('Usuário Teste');
    expect(screen.getByTestId('userrole')).toHaveTextContent('fiel');
  });

  it('realiza login por email e persiste token/user', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-email',
        usuario: {
          id: 'USR-2',
          nome: 'João',
          email: 'joao@example.com',
          tipo: 'fiel',
          cpf: '11144477735',
          paroquia_id: 'PAR-1',
        },
      },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: 'login-email' }));

    expect(postMock).toHaveBeenCalledWith('/auth/login', {
      email: 'joao@example.com',
      senha: 'Senha@123',
    });
    expect(screen.getByTestId('login-result')).toHaveTextContent('fiel');
    expect(localStorage.getItem('@BingoComunidade:token')).toBe('token-email');
  });

  it('realiza login por cpf quando identificador não contém @', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-cpf',
        usuario: {
          id: 'USR-3',
          nome: 'Maria',
          email: 'maria@example.com',
          tipo: 'fiel',
          cpf: '11144477735',
          paroquia_id: 'PAR-1',
        },
      },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: 'login-cpf' }));

    expect(postMock).toHaveBeenCalledWith('/auth/login', {
      cpf: '11144477735',
      senha: 'Senha@123',
    });
    expect(screen.getByTestId('login-result')).toHaveTextContent('fiel');
  });

  it('updateUser atualiza localStorage com formato em português', async () => {
    const user = userEvent.setup();

    sessionStorage.setItem(SESSION_MARKER, '1');
    localStorage.setItem('@BingoComunidade:token', 'token-1');
    localStorage.setItem(
      '@BingoComunidade:user',
      JSON.stringify({
        id: 'USR-1',
        nome: 'Nome Antigo',
        email: 'user@example.com',
        tipo: 'fiel',
        cpf: '11144477735',
        paroquia_id: 'PAR-1',
      })
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: 'update-user' }));

    const persisted = JSON.parse(localStorage.getItem('@BingoComunidade:user') || '{}');
    expect(persisted.nome).toBe('Nome Atualizado');
    expect(persisted.tipo).toBe('fiel');
  });
});
