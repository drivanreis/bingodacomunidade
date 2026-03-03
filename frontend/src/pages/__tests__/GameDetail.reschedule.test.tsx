import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GameDetail from '../GameDetail';

const { getMock, postMock, mockNavigate } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
    post: postMock,
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }) => children,
  },
  useAuth: () => ({
    user: {
      role: 'admin_paroquia',
    },
  }),
}));

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({
    user: {
      role: 'admin_paroquia',
    },
  }),
}));

vi.mock('../../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock('../../components/FloatingCart', () => ({
  default: () => <div>FloatingCart</div>,
  notifyCartRefresh: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'SOR-DET-1' }),
    useNavigate: () => mockNavigate,
  };
});

describe('GameDetail - remarcação', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    mockNavigate.mockReset();
  });

  it('simula impacto da remarcação em modo single', async () => {
    getMock
      .mockResolvedValueOnce({
        data: {
          id: 'SOR-DET-1',
          title: 'Bingo Matriz',
          description: 'Descrição',
          scheduled_date: '2026-03-10T18:00:00-03:00',
          status: 'scheduled',
          card_price: 10,
          total_prize: 0,
          cards_sold: 0,
          max_cards: null,
          prize_percent: 50,
          parish_percent: 30,
          operation_percent: 15,
          evolution_percent: 5,
          created_at: '2026-03-01T10:00:00-03:00',
        },
      })
      .mockResolvedValueOnce({ data: [] });

    postMock.mockResolvedValueOnce({
      data: {
        mode: 'single',
        delta_minutes: 60,
        conflict_count: 0,
        conflicts: [],
        affected_games: [
          {
            id: 'SOR-DET-1',
            title: 'Bingo Matriz',
            old_draw: '2026-03-10T18:00:00-03:00',
            new_draw: '2026-03-10T19:00:00-03:00',
            shifted: true,
            is_target: true,
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <GameDetail />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const dateInput = await screen.findByLabelText(/nova data e hora do sorteio/i);
    fireEvent.change(dateInput, { target: { value: '2026-03-10T19:00' } });
    await user.click(await screen.findByRole('button', { name: /simular impacto/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/games/SOR-DET-1/reschedule', {
        novo_horario_sorteio: expect.any(String),
        mode: 'single',
        preview: true,
      });
    });

    expect(await screen.findByText(/impacto: 1 jogo\(s\), conflito\(s\): 0/i)).toBeInTheDocument();
  });

  it('não exibe compra de cartela nem carrinho para perfil administrativo', async () => {
    getMock
      .mockResolvedValueOnce({
        data: {
          id: 'SOR-DET-1',
          title: 'Bingo Matriz',
          description: 'Descrição',
          scheduled_date: '2026-03-10T18:00:00-03:00',
          status: 'scheduled',
          card_price: 10,
          total_prize: 0,
          cards_sold: 0,
          max_cards: null,
          prize_percent: 50,
          parish_percent: 30,
          operation_percent: 15,
          evolution_percent: 5,
          created_at: '2026-03-01T10:00:00-03:00',
        },
      })
      .mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <GameDetail />
      </MemoryRouter>
    );

    await screen.findByText('Bingo Matriz');

    expect(screen.queryByText(/comprar cartela/i)).not.toBeInTheDocument();
    expect(screen.queryByText('FloatingCart')).not.toBeInTheDocument();
  });
});
