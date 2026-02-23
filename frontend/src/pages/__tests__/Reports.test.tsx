import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Reports from '../Reports';

const { getMock, mockNavigate } = vi.hoisted(() => ({
  getMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const usuariosFixture = [
  { id: 1, tipo: 'super_admin', ativo: true },
  { id: 2, tipo: 'paroquia_admin', ativo: true },
  { id: 3, tipo: 'paroquia_recepcao', ativo: true },
  { id: 4, tipo: 'paroquia_bingo', ativo: true },
  { id: 5, tipo: 'paroquia_caixa', ativo: true },
  { id: 6, tipo: 'usuario_publico', ativo: true },
  { id: 7, tipo: 'usuario_publico', ativo: false },
  { id: 8, tipo: 'usuario_publico', ativo: false, banido: true },
];

const jogosFixture = [
  { id: 1, status: 'em_andamento' },
  { id: 2, status: 'em_andamento' },
  { id: 3, status: 'finalizado' },
  { id: 4, status: 'cancelado' },
];

const mockApiSuccess = () => {
  getMock.mockImplementation((url: string) => {
    if (url === '/usuarios') return Promise.resolve({ data: usuariosFixture });
    if (url === '/jogos') return Promise.resolve({ data: jogosFixture });
    return Promise.resolve({ data: [] });
  });
};

describe('Reports', () => {
  beforeEach(() => {
    getMock.mockReset();
    mockNavigate.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('carrega dados e calcula métricas de usuários, fiéis e jogos', async () => {
    mockApiSuccess();

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    expect(await screen.findByText('Relatórios e Estatísticas')).toBeInTheDocument();

    const equipeCard = screen.getByText('Equipe da Paróquia').closest('.card-body') as HTMLElement;
    expect(within(equipeCard).getByText('4')).toBeInTheDocument();
    expect(within(equipeCard).getByText('1 administradores, 1 caixas')).toBeInTheDocument();

    const fieisCard = screen.getByText('Fiéis Cadastrados').closest('.card-body') as HTMLElement;
    expect(within(fieisCard).getByText('3')).toBeInTheDocument();
    expect(within(fieisCard).getByText('1 ativos / 1 banidos')).toBeInTheDocument();

    expect(screen.getByText('Jogos Ativos')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText(/33\.3% dos cadastrados estão ativos/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 0\.00 por jogo/i)).toBeInTheDocument();
  });

  it('mostra alerta quando falha no carregamento', async () => {
    getMock.mockRejectedValueOnce(new Error('falha api'));

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro ao carregar dados do relatório');
    });
  });

  it('permite atualizar dados com filtro de data e voltar ao dashboard', async () => {
    const user = userEvent.setup();
    mockApiSuccess();

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    await screen.findByText('Relatórios e Estatísticas');

    const dateInputs = document.querySelectorAll('input[type="date"]');
    await user.type(dateInputs[0] as HTMLInputElement, '2026-01-01');
    await user.type(dateInputs[1] as HTMLInputElement, '2026-01-31');

    await user.click(screen.getByRole('button', { name: /atualizar dados/i }));

    await waitFor(() => {
      expect(getMock).toHaveBeenCalledTimes(4);
    });

    await user.click(screen.getByRole('button', { name: /voltar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });

  it('exporta relatório em CSV', async () => {
    const user = userEvent.setup();
    mockApiSuccess();

    const originalCreateElement = document.createElement.bind(document);
    const createObjectURLMock = vi.fn().mockReturnValue('blob:reports-csv');
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
        <Reports />
      </MemoryRouter>
    );

    await screen.findByText('Relatórios e Estatísticas');
    await user.click(screen.getByRole('button', { name: /exportar csv/i }));

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });
});
