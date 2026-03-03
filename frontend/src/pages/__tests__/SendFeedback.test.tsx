import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SendFeedback from '../SendFeedback';

const { postMock, mockNavigate } = vi.hoisted(() => ({
  postMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    post: postMock,
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }) => children,
  },
  useAuth: () => ({
    user: { id: 'USR-CTX-1', name: 'Usuário Teste' },
  }),
}));

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'USR-CTX-1', name: 'Usuário Teste' },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SendFeedback', () => {
  beforeEach(() => {
    postMock.mockReset();
    mockNavigate.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('não envia quando campos obrigatórios estão vazios', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SendFeedback />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /enviar feedback/i })).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/resuma seu feedback/i), '   ');
    await user.type(screen.getByPlaceholderText(/descreva detalhadamente/i), '   ');
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    expect(postMock).not.toHaveBeenCalled();
  });

  it('envia feedback com sucesso e mostra confirmação', async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValueOnce({ data: { id: 'FDB-1' } });

    render(
      <MemoryRouter>
        <SendFeedback />
      </MemoryRouter>
    );

    await user.click(screen.getByText(/bug\/erro/i));
    await user.type(screen.getByPlaceholderText(/resuma seu feedback/i), 'Falha no cadastro');
    await user.type(screen.getByPlaceholderText(/descreva detalhadamente/i), 'Ao cadastrar usuário, houve erro visual.');
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledTimes(1);
    });
    expect(postMock.mock.calls[0][0]).toBe('/feedbacks');
    expect(postMock.mock.calls[0][2]?.params).toMatchObject({
      usuario_id: 'USR-CTX-1',
      tipo: 'bug',
      assunto: 'Falha no cadastro',
      satisfacao: 5,
    });

    expect(await screen.findByText(/feedback enviado com sucesso/i)).toBeInTheDocument();
  });

  it('mostra alerta de erro quando API falha', async () => {
    const user = userEvent.setup();
    postMock.mockRejectedValueOnce(new Error('falha api'));

    render(
      <MemoryRouter>
        <SendFeedback />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/resuma seu feedback/i), 'Problema');
    await user.type(screen.getByPlaceholderText(/descreva detalhadamente/i), 'Detalhes do problema');
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro ao enviar feedback. Tente novamente.');
    });
  });

  it('atualiza satisfação no slider e exibe texto correspondente', async () => {
    render(
      <MemoryRouter>
        <SendFeedback />
      </MemoryRouter>
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '3' } });

    expect(screen.getByText(/neutro/i)).toBeInTheDocument();
  });

  it('navega para trás ao clicar em voltar e cancelar', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SendFeedback />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /^← voltar$/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });
});
