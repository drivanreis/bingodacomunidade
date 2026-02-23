import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SystemSettings from '../SystemSettings';

const { getMock, putMock, mockNavigate } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
    put: putMock,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const configsFixture = [
  {
    chave: 'errorMessageDuration',
    valor: '3',
    tipo: 'number',
    categoria: 'mensagens',
    descricao: 'Duração da mensagem de erro',
  },
  {
    chave: 'maxLoginAttempts',
    valor: '5',
    tipo: 'number',
    categoria: 'seguranca',
    descricao: 'Máximo de tentativas',
  },
  {
    chave: 'inactivityTimeoutEnabled',
    valor: 'true',
    tipo: 'boolean',
    categoria: 'seguranca',
    descricao: 'Ativa timeout por inatividade',
  },
  {
    chave: 'cartReservationMinutes',
    valor: '10',
    tipo: 'number',
    categoria: 'carrinho',
    descricao: 'Reserva de carrinho',
  },
  {
    chave: 'autosaveDraftEnabled',
    valor: 'false',
    tipo: 'boolean',
    categoria: 'formularios',
    descricao: 'Auto salvar rascunho',
  },
  {
    chave: 'resetTokenExpiryMinutes',
    valor: '60',
    tipo: 'number',
    categoria: 'recuperacao_senha',
    descricao: 'Expiração do token',
  },
  {
    chave: 'supportMessage',
    valor: 'Fale com o suporte',
    tipo: 'string',
    categoria: 'mensagens',
    descricao: 'Mensagem padrão de suporte',
  },
];

describe('SystemSettings', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
    mockNavigate.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('carrega configurações e exibe categorias', async () => {
    getMock.mockResolvedValueOnce({ data: configsFixture });

    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>
    );

    expect(await screen.findByText(/configurações do sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/mensagens e notificações/i)).toBeInTheDocument();
    expect(screen.getByText(/segurança e autenticação/i)).toBeInTheDocument();
    expect(screen.getByText(/carrinho de cartelas/i)).toBeInTheDocument();
    expect(screen.getByText(/formulários e rascunhos/i)).toBeInTheDocument();
    expect(screen.getByText(/recuperação de senha/i)).toBeInTheDocument();
  });

  it('exibe spinner durante carregamento inicial', async () => {
    let resolver: (value: any) => void = () => undefined;
    getMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolver = resolve;
      })
    );

    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>
    );

    expect(screen.getByText(/carregando configurações/i)).toBeInTheDocument();
    resolver({ data: configsFixture });
    expect(await screen.findByText(/configurações do sistema/i)).toBeInTheDocument();
  });

  it('mostra alerta quando falha ao carregar configurações', async () => {
    getMock.mockRejectedValueOnce(new Error('erro de rede'));

    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro ao carregar configurações do sistema');
    });
  });

  it('salva configuração numérica com sucesso', async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValueOnce({ data: configsFixture });
    putMock.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>
    );

    await screen.findByText(/configurações do sistema/i);

    const numberInput = screen.getByDisplayValue('3');
    fireEvent.change(numberInput, { target: { value: '4' } });
    const numberContainer = numberInput.closest('.d-flex') as HTMLElement;
    await user.click(within(numberContainer).getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/configuracoes/errorMessageDuration', null, {
        params: { valor: '4' },
      });
    });
    expect(await screen.findByText(/configuração salva com sucesso/i)).toBeInTheDocument();
  });

  it('salva configuração booleana e string', async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValueOnce({ data: configsFixture });
    putMock.mockResolvedValue({ data: { ok: true } });

    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>
    );

    await screen.findByText(/configurações do sistema/i);

    const toggle = screen.getByLabelText('Inactivity Timeout Enabled');
    fireEvent.click(toggle);
    const toggleContainer = toggle.closest('.d-flex') as HTMLElement;
    await user.click(within(toggleContainer).getByRole('button', { name: /salvar/i }));

    const stringInput = screen.getByDisplayValue('Fale com o suporte');
    fireEvent.change(stringInput, { target: { value: 'Contato atualizado' } });
    const stringContainer = stringInput.closest('.d-flex') as HTMLElement;
    await user.click(within(stringContainer).getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/configuracoes/inactivityTimeoutEnabled', null, {
        params: { valor: 'false' },
      });
    });
    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/configuracoes/supportMessage', null, {
        params: { valor: 'Contato atualizado' },
      });
    });
  });

  it('mostra alerta quando salvar configuração falha', async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValueOnce({ data: configsFixture });
    putMock.mockRejectedValueOnce(new Error('falha ao salvar'));

    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>
    );

    await screen.findByText(/configurações do sistema/i);

    const numberInput = screen.getByDisplayValue('3');
    fireEvent.change(numberInput, { target: { value: '8' } });
    const numberContainer = numberInput.closest('.d-flex') as HTMLElement;
    await user.click(within(numberContainer).getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro ao salvar configuração');
    });
  });

  it('navega de volta ao dashboard admin-site', async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValueOnce({ data: configsFixture });

    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>
    );

    await screen.findByText(/configurações do sistema/i);
    await user.click(screen.getByRole('button', { name: /voltar/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });
});
