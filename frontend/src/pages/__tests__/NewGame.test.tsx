import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NewGame from '../NewGame';

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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NewGame', () => {
  beforeEach(() => {
    postMock.mockReset();
    mockNavigate.mockReset();
    localStorage.clear();
  });

  const fillRequiredFields = async () => {
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/bingo beneficente/i), 'Bingo Teste Paroquial');
    await user.type(screen.getByPlaceholderText('10.00'), '12.5');

    const datetimeInputs = document.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(datetimeInputs[0], { target: { value: '2026-03-01T10:00' } });
    fireEvent.change(datetimeInputs[1], { target: { value: '2026-03-01T12:00' } });

    return user;
  };

  it('envia formulário e redireciona com feedback de sucesso', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        title: 'Bingo Teste Paroquial',
      },
    });

    render(
      <MemoryRouter>
        <NewGame />
      </MemoryRouter>
    );

    const user = await fillRequiredFields();
    await user.click(screen.getByRole('button', { name: /criar jogo/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/games', expect.objectContaining({
        title: 'Bingo Teste Paroquial',
        card_price: 12.5,
        prize_percent: 50,
        parish_percent: 30,
        operation_percent: 15,
        evolution_percent: 5,
      }));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin-paroquia/dashboard', {
      state: {
        gameCreated: true,
        createdGameTitle: 'Bingo Teste Paroquial',
      },
    });
  });

  it('exibe erro e não redireciona quando API falha', async () => {
    postMock.mockRejectedValueOnce({
      message: 'Falha ao criar jogo',
    });

    render(
      <MemoryRouter>
        <NewGame />
      </MemoryRouter>
    );

    const user = await fillRequiredFields();
    await user.click(screen.getByRole('button', { name: /criar jogo/i }));

    expect(await screen.findByText(/falha ao criar jogo/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
