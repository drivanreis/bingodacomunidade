import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';

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

describe('ForgotPassword (público)', () => {
  beforeEach(() => {
    postMock.mockReset();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra erro quando CPF é inválido e mantém a mensagem por pelo menos 5 segundos', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.78');
    await user.click(screen.getByRole('button', { name: /enviar link de recuperação/i }));

    const error = await screen.findByText(/cpf deve ter 11 dígitos/i);
    expect(error).toBeInTheDocument();

    vi.advanceTimersByTime(5000);
    expect(screen.queryByText(/cpf deve ter 11 dígitos/i)).toBeInTheDocument();
  });

  it('envia recuperação por email (desejado)', async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValueOnce({ data: { message: 'Se o email está registrado, você receberá um link de recuperação' } });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), 'joao@example.com');
    await user.click(screen.getByRole('button', { name: /enviar link de recuperação/i }));

    expect(postMock).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'joao@example.com',
    });
  });

  it('exibe erro quando CPF/Email não está cadastrado', async () => {
    const user = userEvent.setup();
    postMock.mockRejectedValueOnce({
      response: { data: { detail: 'CPF ou Email não encontrado' } },
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.789-09');
    await user.click(screen.getByRole('button', { name: /enviar link de recuperação/i }));

    expect(await screen.findByText(/cpf ou email não encontrado/i)).toBeInTheDocument();
  });

  it('exibe mensagem de sucesso e desabilita o formulário', async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValueOnce({
      data: { message: 'Se o email está registrado, você receberá um link de recuperação' },
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.789-09');
    await user.click(screen.getByRole('button', { name: /enviar link de recuperação/i }));

    expect(await screen.findByText(/verifique seu email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeDisabled();
  });
});
