import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../Profile';

const { getMock, putMock, mockNavigate, updateUserMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
  mockNavigate: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
    put: putMock,
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }) => children,
  },
  useAuth: () => ({
    user: {
      id: 'USR-1',
      name: 'João da Silva',
      email: 'joao@example.com',
      role: 'fiel',
      cpf: '11144477735',
    },
    updateUser: updateUserMock,
  }),
}));

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'USR-1',
      name: 'João da Silva',
      email: 'joao@example.com',
      role: 'fiel',
      cpf: '11144477735',
    },
    updateUser: updateUserMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Profile', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
    mockNavigate.mockReset();
    updateUserMock.mockReset();

    getMock.mockResolvedValue({
      data: {
        nome: 'João da Silva',
        cpf: '11144477735',
        email: 'joao@example.com',
        whatsapp: '+5585988887777',
        chave_pix: 'joao@example.com',
      },
    });

    putMock.mockResolvedValue({ data: {} });
  });

  it('carrega WhatsApp legado com +55 e mostra no modo leitura', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(await screen.findByText(/\(85\) 98888-7777/i)).toBeInTheDocument();
  });

  it('envia whatsapp como DDD+telefone sem +55 e exibe alerta de divergência DDD x CPF', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await screen.findByRole('button', { name: /editar perfil/i });
    await user.click(screen.getByRole('button', { name: /editar perfil/i }));

    const telefoneInput = screen.getByLabelText(/telefone \(sms\/whatsapp\)/i);
    await user.clear(telefoneInput);
    await user.type(telefoneInput, '988887777');

    expect(screen.getByText(/não corresponde à região fiscal do cpf/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(putMock).toHaveBeenCalledWith('/auth/profile/11144477735', expect.objectContaining({
      whatsapp: '85988887777',
    }));
    expect(updateUserMock).toHaveBeenCalled();
  });
});
