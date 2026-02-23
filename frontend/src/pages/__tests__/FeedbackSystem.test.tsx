import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FeedbackSystem from '../FeedbackSystem';

const { getMock, putMock, mockNavigate, mockUseAuth } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
  mockNavigate: vi.fn(),
  mockUseAuth: vi.fn(() => ({ user: { id: 'admin-1' } })),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
    put: putMock,
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const feedbacksFixture = [
  {
    id: 'f1',
    usuario_id: 'u1',
    usuario_nome: 'Maria',
    paroquia_nome: 'Paróquia Central',
    tipo: 'sugestao',
    assunto: 'Melhorar layout',
    mensagem: 'Poderia ter contraste maior.',
    satisfacao: 4,
    status: 'pendente',
    criado_em: '2026-02-15T10:00:00Z',
  },
  {
    id: 'f2',
    usuario_id: 'u2',
    usuario_nome: 'João',
    tipo: 'elogio',
    assunto: 'Atendimento ótimo',
    mensagem: 'Equipe muito atenciosa.',
    satisfacao: 5,
    status: 'resolvido',
    resposta: 'Obrigado pelo retorno!',
    respondido_por: 'Admin',
    respondido_em: '2026-02-16T08:00:00Z',
    criado_em: '2026-02-15T09:00:00Z',
  },
  {
    id: 'f3',
    usuario_id: 'u3',
    usuario_nome: 'Carlos',
    tipo: 'bug',
    assunto: 'Erro no envio',
    mensagem: 'Botão não responde às vezes.',
    satisfacao: 2,
    status: 'em_analise',
    criado_em: '2026-02-14T12:00:00Z',
  },
  {
    id: 'f4',
    usuario_id: 'u4',
    usuario_nome: 'Ana',
    tipo: 'reclamacao',
    assunto: 'Demora na resposta',
    mensagem: 'Leva muito tempo.',
    satisfacao: 1,
    status: 'arquivado',
    criado_em: '2026-02-13T14:00:00Z',
  },
];

const mockLoadSuccess = () => {
  getMock.mockResolvedValue({ data: feedbacksFixture });
};

describe('FeedbackSystem', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
    mockNavigate.mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: { id: 'admin-1' } });
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('carrega feedbacks e exibe estatísticas e resposta existente', async () => {
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <FeedbackSystem />
      </MemoryRouter>
    );

    expect(await screen.findByText('Sistema de Feedback')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3.0')).toBeInTheDocument();

    expect(screen.getByText('Melhorar layout')).toBeInTheDocument();
    expect(screen.getByText('Atendimento ótimo')).toBeInTheDocument();
    expect(screen.getByText('Resposta:')).toBeInTheDocument();
    expect(screen.getByText('Obrigado pelo retorno!')).toBeInTheDocument();
  });

  it('filtra por status e tipo, incluindo estado vazio', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <FeedbackSystem />
      </MemoryRouter>
    );

    await screen.findByText('Sistema de Feedback');

    await user.selectOptions(screen.getByDisplayValue('Todos os status'), 'resolvido');
    expect(screen.getByText('Atendimento ótimo')).toBeInTheDocument();
    expect(screen.queryByText('Melhorar layout')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByDisplayValue('Todos os tipos'), 'bug');
    expect(await screen.findByText('Nenhum feedback encontrado')).toBeInTheDocument();
  });

  it('responde feedback com sucesso', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();
    putMock.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <MemoryRouter>
        <FeedbackSystem />
      </MemoryRouter>
    );

    await screen.findByText('Melhorar layout');

    const card = screen.getByText('Melhorar layout').closest('.card') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: /responder/i }));

    const modal = screen.getByRole('heading', { name: /responder feedback/i }).closest('.modal-content') as HTMLElement;
    const textarea = modal.querySelector('textarea') as HTMLTextAreaElement;
    await user.type(textarea, 'Vamos avaliar essa melhoria.');
    await user.click(within(modal).getByRole('button', { name: /enviar resposta/i }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/feedbacks/f1/responder', null, {
        params: {
          resposta: 'Vamos avaliar essa melhoria.',
          respondido_por_id: 'admin-1',
        },
      });
    });

    expect(window.alert).toHaveBeenCalledWith('Resposta enviada com sucesso!');
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it('valida resposta obrigatória e altera status', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();
    putMock.mockResolvedValue({ data: { ok: true } });

    render(
      <MemoryRouter>
        <FeedbackSystem />
      </MemoryRouter>
    );

    await screen.findByText('Melhorar layout');

    const card = screen.getByText('Melhorar layout').closest('.card') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: /responder/i }));

    const modal = screen.getByRole('heading', { name: /responder feedback/i }).closest('.modal-content') as HTMLElement;
    const form = modal.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(window.alert).toHaveBeenCalledWith('Digite uma resposta');
    expect(putMock).not.toHaveBeenCalled();

    await user.click(within(card).getByRole('button', { name: /marcar como resolvido/i }));
    await user.click(within(card).getByRole('button', { name: /arquivar/i }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/feedbacks/f1/status', null, {
        params: { novo_status: 'resolvido' },
      });
      expect(putMock).toHaveBeenCalledWith('/feedbacks/f1/status', null, {
        params: { novo_status: 'arquivado' },
      });
    });
  });

  it('navega para admins e dashboard', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <FeedbackSystem />
      </MemoryRouter>
    );

    await screen.findByText('Sistema de Feedback');

    await user.click(screen.getByRole('button', { name: /gerenciar admins/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/admins');

    await user.click(screen.getByRole('button', { name: /voltar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });
});
