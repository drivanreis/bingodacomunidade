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
  it('valida DDD e telefone obrigatórios para 2FA', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FirstAccessSetup />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Seu nome'), 'Admin Inicial');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'admin@exemplo.com');
    await user.type(screen.getByPlaceholderText(/somente números/i), '11144477735');
    await user.type(screen.getByLabelText(/telefone \(sms\/whatsapp\)/i), '999');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Senha@123');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'Senha@123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(postMock).not.toHaveBeenCalled();
  });

  it('envia bootstrap e redireciona para dashboard', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-123',
        usuario: {
          id: 'ADM-1',
          nome: 'Admin Site',
          login: 'admin@exemplo.com',
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

    await user.type(screen.getByPlaceholderText('Seu nome'), 'Admin Inicial');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'admin@exemplo.com');
    await user.type(screen.getByPlaceholderText(/somente números/i), '11144477735');
    await user.selectOptions(screen.getByRole('combobox', { name: /ddd/i }), '85');
    await user.type(screen.getByLabelText(/telefone \(sms\/whatsapp\)/i), '999999999');
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Senha@123');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'Senha@123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(postMock).toHaveBeenCalledWith('/auth/bootstrap', {
      nome: 'Admin Inicial',
      email: 'admin@exemplo.com',
      cpf: '11144477735',
      telefone: '85999999999',
      senha: 'Senha@123',
    });

    expect(updateUserMock).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });
});
