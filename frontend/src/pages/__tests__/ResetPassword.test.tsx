import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';

const postMock = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../services/api', () => ({
  default: {
    post: postMock,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ResetPassword (público)', () => {
  beforeEach(() => {
    postMock.mockReset();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra erro quando não há token na URL', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(await screen.findByText(/link inválido ou expirado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /solicitar novo link/i })).toBeInTheDocument();
  });

  it('valida senha fraca antes de enviar', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/reset-password?token=abc123']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/digite sua nova senha/i), 'senha123');
    await user.type(screen.getByPlaceholderText(/digite novamente a nova senha/i), 'senha123');
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/letra maiúscula/i)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('rejeita senhas diferentes', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/reset-password?token=abc123']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/digite sua nova senha/i), 'Senha@123');
    await user.type(screen.getByPlaceholderText(/digite novamente a nova senha/i), 'Senha@124');
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/senhas não coincidem/i)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('envia reset com token válido e redireciona', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    postMock.mockResolvedValueOnce({ data: { message: 'Senha atualizada com sucesso!' } });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=token123']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/digite sua nova senha/i), 'Senha@123');
    await user.type(screen.getByPlaceholderText(/digite novamente a nova senha/i), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(postMock).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'token123',
      nova_senha: 'Senha@123',
    });

    vi.advanceTimersByTime(2000);
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { message: '✅ Senha alterada! Faça login com sua nova senha.' },
    });
  });

  it('exibe erro quando token é inválido (link interceptado)', async () => {
    const user = userEvent.setup();
    postMock.mockRejectedValueOnce({
      response: { data: { detail: 'Token inválido' } },
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=token_interceptado']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/digite sua nova senha/i), 'Senha@123');
    await user.type(screen.getByPlaceholderText(/digite novamente a nova senha/i), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/token inválido/i)).toBeInTheDocument();
  });
});
