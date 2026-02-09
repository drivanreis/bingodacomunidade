import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FirstAccessSetup from '../FirstAccessSetup';

const { postMock, mockNavigate, updateUserMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  mockNavigate: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    post: postMock,
    defaults: { headers: { common: {} } },
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
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

describe('FirstAccessSetup', () => {
  it('valida CPF com 11 dígitos', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FirstAccessSetup />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Seu nome completo'), 'Admin Real');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.789');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'admin@exemplo.com');
    await user.type(screen.getByPlaceholderText('+55 (85) 99999-9999'), '+55 (85) 99999-9999');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Senha@123');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'Senha@123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/cpf deve conter 11 dígitos/i)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('envia bootstrap e redireciona para dashboard', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-123',
        usuario: {
          id: 'ADM-1',
          nome: 'Admin Real',
          login: '75568241368',
          email: 'admin@exemplo.com',
          nivel_acesso: 'admin_site',
          paroquia_id: null,
        },
      },
    });

    render(
      <MemoryRouter>
        <FirstAccessSetup />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Seu nome completo'), 'Admin Real');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '755.682.413-68');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'admin@exemplo.com');
    await user.type(screen.getByPlaceholderText('+55 (85) 99999-9999'), '+55 (85) 99999-9999');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Senha@123');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'Senha@123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(postMock).toHaveBeenCalledWith('/auth/bootstrap', {
      nome: 'Admin Real',
      login: '75568241368',
      email: 'admin@exemplo.com',
      senha: 'Senha@123',
    });

    expect(updateUserMock).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });
});
