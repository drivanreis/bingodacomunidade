import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminParoquiaConfiguracoes from '../AdminParoquiaConfiguracoes';

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

vi.mock('../../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminParoquiaConfiguracoes', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
    mockNavigate.mockReset();

    getMock.mockResolvedValue({ data: [] });
  });

  it('bloqueia salvar rateios quando soma não é 100%', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminParoquiaConfiguracoes />
      </MemoryRouter>
    );

    await screen.findByText(/rateios padrão por tipo de jogo/i);

    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '50');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '30');
    await user.clear(inputs[2]);
    await user.type(inputs[2], '10');
    await user.clear(inputs[3]);
    await user.type(inputs[3], '5');

    await user.click(screen.getByRole('button', { name: /salvar rateios padrão/i }));

    expect(await screen.findByText(/a soma dos rateios deve ser exatamente 100%/i)).toBeInTheDocument();
    expect(putMock).not.toHaveBeenCalledWith('/configuracoes/default_rateio_premio', expect.anything(), expect.anything());
  });

  it('salva rateios quando regras de negócio são válidas', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminParoquiaConfiguracoes />
      </MemoryRouter>
    );

    await screen.findByText(/rateios padrão por tipo de jogo/i);

    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '50');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '30');
    await user.clear(inputs[2]);
    await user.type(inputs[2], '15');
    await user.clear(inputs[3]);
    await user.type(inputs[3], '5');

    putMock.mockResolvedValue({ data: {} });

    await user.click(screen.getByRole('button', { name: /salvar rateios padrão/i }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/configuracoes/default_rateio_premio', null, { params: { valor: '50' } });
      expect(putMock).toHaveBeenCalledWith('/configuracoes/default_rateio_paroquia', null, { params: { valor: '30' } });
      expect(putMock).toHaveBeenCalledWith('/configuracoes/default_rateio_operacao', null, { params: { valor: '15' } });
      expect(putMock).toHaveBeenCalledWith('/configuracoes/default_rateio_evolucao', null, { params: { valor: '5' } });
    });

    expect(await screen.findByText(/rateios padrão salvos com sucesso/i)).toBeInTheDocument();
  });

  it('bloqueia salvar quando prêmio é menor que 49%', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminParoquiaConfiguracoes />
      </MemoryRouter>
    );

    await screen.findByText(/rateios padrão por tipo de jogo/i);

    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '48');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '30');
    await user.clear(inputs[2]);
    await user.type(inputs[2], '17');
    await user.clear(inputs[3]);
    await user.type(inputs[3], '5');

    await user.click(screen.getByRole('button', { name: /salvar rateios padrão/i }));

    expect(await screen.findByText(/prêmio não pode ser menor que 49%/i)).toBeInTheDocument();
    expect(putMock).not.toHaveBeenCalledWith('/configuracoes/default_rateio_premio', expect.anything(), expect.anything());
  });

  it('bloqueia salvar quando operação é menor que 1\/3 da paróquia', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminParoquiaConfiguracoes />
      </MemoryRouter>
    );

    await screen.findByText(/rateios padrão por tipo de jogo/i);

    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '59');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '30');
    await user.clear(inputs[2]);
    await user.type(inputs[2], '9');
    await user.clear(inputs[3]);
    await user.type(inputs[3], '2');

    await user.click(screen.getByRole('button', { name: /salvar rateios padrão/i }));

    expect(await screen.findByText(/operação não pode ser menor que 1\/3 da paróquia/i)).toBeInTheDocument();
    expect(putMock).not.toHaveBeenCalledWith('/configuracoes/default_rateio_operacao', expect.anything(), expect.anything());
  });

  it('bloqueia salvar quando seguro operacional é menor que 1%', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminParoquiaConfiguracoes />
      </MemoryRouter>
    );

    await screen.findByText(/rateios padrão por tipo de jogo/i);

    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '50');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '30');
    await user.clear(inputs[2]);
    await user.type(inputs[2], '19.5');
    await user.clear(inputs[3]);
    await user.type(inputs[3], '0.5');

    await user.click(screen.getByRole('button', { name: /salvar rateios padrão/i }));

    expect(await screen.findByText(/seguro operacional não pode ser menor que 1%/i)).toBeInTheDocument();
    expect(putMock).not.toHaveBeenCalledWith('/configuracoes/default_rateio_evolucao', expect.anything(), expect.anything());
  });

  it('salva canais de comunicação combinados como CSV (whatsapp,sms)', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminParoquiaConfiguracoes />
      </MemoryRouter>
    );

    await screen.findByText(/preferências de comunicação operacional/i);

    await user.click(screen.getByRole('checkbox', { name: /e-mail/i }));
    await user.click(screen.getByRole('checkbox', { name: /sms/i }));

    putMock.mockResolvedValue({ data: {} });

    await user.click(screen.getByRole('button', { name: /salvar comunicação operacional/i }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/configuracoes/comunicacao_operacional_canal', null, {
        params: { valor: 'whatsapp,sms' },
      });
    });

    expect(await screen.findByText(/preferências de comunicação operacional salvas com sucesso/i)).toBeInTheDocument();
  });
});
