import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminInitialPasswordChange from '../AdminInitialPasswordChange';

const { postMock, navigateMock, useLocationMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  navigateMock: vi.fn(),
  useLocationMock: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    post: postMock,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => useLocationMock(),
  };
});

describe('AdminInitialPasswordChange', () => {
  beforeEach(() => {
    postMock.mockReset();
    navigateMock.mockReset();
    useLocationMock.mockReset();
    useLocationMock.mockReturnValue({ state: {} });
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('envia troca inicial de senha para admin-site com sucesso', async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValueOnce({ data: { message: 'ok' } });

    useLocationMock.mockReturnValue({
      state: {
        login: 'admin@site.com',
        senhaAtual: 'Temp@123',
      },
    });

    render(
      <MemoryRouter>
        <AdminInitialPasswordChange mode="admin-site" />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Digite a nova senha'), 'Nova@123');
    await user.type(screen.getByPlaceholderText('Repita a nova senha'), 'Nova@123');
    await user.click(screen.getByRole('button', { name: /alterar senha e continuar/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/auth/admin-site/troca-senha-inicial', {
        login: 'admin@site.com',
        senha_atual: 'Temp@123',
        nova_senha: 'Nova@123',
      });
    });

    expect(window.alert).toHaveBeenCalledWith('✅ Senha alterada com sucesso para Admin-Site! Faça login novamente.');
    expect(navigateMock).toHaveBeenCalledWith('/admin-site/login');
  });

  it('bloqueia senha fraca usando validação padrão', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminInitialPasswordChange mode="admin-site" />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Login ou email'), 'admin@site.com');
    await user.type(screen.getByPlaceholderText('Digite a senha temporária'), 'Temp@123');
    await user.type(screen.getByPlaceholderText('Digite a nova senha'), 'abc123');
    await user.type(screen.getByPlaceholderText('Repita a nova senha'), 'abc123');
    await user.click(screen.getByRole('button', { name: /alterar senha e continuar/i }));

    expect(await screen.findByText('Senha deve conter pelo menos uma letra maiúscula')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('usa endpoint admin-paroquia no modo paroquial', async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValueOnce({ data: { message: 'ok' } });

    render(
      <MemoryRouter>
        <AdminInitialPasswordChange mode="admin-paroquia" />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Login ou email'), 'paroquia.admin');
    await user.type(screen.getByPlaceholderText('Digite a senha temporária'), 'Temp@123');
    await user.type(screen.getByPlaceholderText('Digite a nova senha'), 'Nova@123');
    await user.type(screen.getByPlaceholderText('Repita a nova senha'), 'Nova@123');
    await user.click(screen.getByRole('button', { name: /alterar senha e continuar/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/auth/admin-paroquia/troca-senha-inicial', {
        login: 'paroquia.admin',
        senha_atual: 'Temp@123',
        nova_senha: 'Nova@123',
      });
    });

    expect(navigateMock).toHaveBeenCalledWith('/admin-paroquia/login');
  });
});
