import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AuditLog from '../AuditLog';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AuditLog', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('carrega logs e exibe tabela com badges e fallback de IP', async () => {
    render(
      <MemoryRouter>
        <AuditLog />
      </MemoryRouter>
    );

    expect(await screen.findByText('Auditoria e Logs')).toBeInTheDocument();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
    expect(screen.getByText('ERRO_SISTEMA')).toBeInTheDocument();
    expect(screen.getByText('Falha ao conectar com serviço externo')).toBeInTheDocument();

    const errorBadge = screen.getByText('error');
    expect(errorBadge).toHaveClass('bg-danger');

    const sistemaRow = screen.getByText('Sistema').closest('tr') as HTMLElement;
    expect(within(sistemaRow).getByText('-')).toBeInTheDocument();
  });

  it('aplica filtros por usuário, ação, nível e intervalo de data', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuditLog />
      </MemoryRouter>
    );

    await screen.findByText('Auditoria e Logs');

    const usuarioInput = screen.getByPlaceholderText('Filtrar por usuário...');
    const acaoInput = screen.getByPlaceholderText('Filtrar por ação...');
    const nivelSelect = screen.getByDisplayValue('Todos os níveis');
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const dataInicioInput = dateInputs[0] as HTMLInputElement;

    await user.type(usuarioInput, 'sistema');
    expect(screen.getByText('ERRO_SISTEMA')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument();

    await user.clear(usuarioInput);
    await user.type(acaoInput, 'bloqueado');
    expect(screen.getByText('EXCLUIR_JOGO')).toBeInTheDocument();
    expect(screen.queryByText('CRIAR_PAROQUIA')).not.toBeInTheDocument();

    await user.clear(acaoInput);
    await user.selectOptions(nivelSelect, 'warning');
    expect(screen.getByText('EXCLUIR_JOGO')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument();

    await user.type(dataInicioInput, '2099-01-01');
    expect(await screen.findByText('Nenhum log encontrado')).toBeInTheDocument();
  });

  it('exporta logs em CSV', async () => {
    const user = userEvent.setup();
    const originalCreateElement = document.createElement.bind(document);
    const createObjectURLMock = vi.fn().mockReturnValue('blob:fake-url');
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      configurable: true,
      value: createObjectURLMock,
    });
    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return {
          href: '',
          download: '',
          click: clickSpy,
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    render(
      <MemoryRouter>
        <AuditLog />
      </MemoryRouter>
    );

    await screen.findByText('Auditoria e Logs');
    await user.click(screen.getByRole('button', { name: /exportar/i }));

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('permite atualizar e voltar ao dashboard', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuditLog />
      </MemoryRouter>
    );

    await screen.findByText('Auditoria e Logs');

    await user.click(screen.getByRole('button', { name: /atualizar/i }));
    await waitFor(() => {
      expect(screen.getByText('LOGIN')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /voltar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });
});
