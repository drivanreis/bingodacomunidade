import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminUsers from '../AdminUsers';

const { getMock, postMock, putMock, mockNavigate } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
    post: postMock,
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

describe('AdminUsers', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    mockNavigate.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('carrega e renderiza lista de usuários do site com status e marcador de usuário atual', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        admins: [
          {
            id: 'ADM-1',
            nome: 'Admin Atual',
            login: 'admin.atual',
            email: 'atual@example.com',
            telefone: '85999990000',
            ativo: true,
            is_current: true,
            can_resend_initial_password: false,
          },
          {
            id: 'ADM-2',
            nome: 'Admin Reserva',
            login: 'admin.reserva',
            email: 'reserva@example.com',
            telefone: '85999990001',
            ativo: false,
            is_current: false,
            can_resend_initial_password: true,
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    expect(await screen.findByText('admin.atual')).toBeInTheDocument();
    expect(screen.getByText('admin.reserva')).toBeInTheDocument();
    expect(screen.getByText('você')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('cria usuário do site (reserva) com sucesso', async () => {
    const user = userEvent.setup();

    getMock
      .mockResolvedValueOnce({ data: { admins: [] } })
      .mockResolvedValueOnce({
        data: {
          admins: [
            {
              id: 'ADM-NEW',
              nome: 'Admin Site',
              login: 'reserva@example.com',
              email: 'reserva@example.com',
              telefone: '85999990000',
              ativo: false,
              is_current: false,
              can_resend_initial_password: true,
            },
          ],
        },
      });

    postMock.mockResolvedValueOnce({ data: { message: 'ok' } });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await screen.findByText(/nenhum usuário do site encontrado/i);
    await user.click(screen.getByRole('button', { name: /novo usuário do site/i }));

    await user.type(screen.getByLabelText(/nome \/ apelido/i), 'Reserva Site');
    await user.type(screen.getByLabelText(/e-mail/i), 'reserva@example.com');
    await user.type(screen.getByLabelText(/cpf/i), '11144477735');
    await user.selectOptions(screen.getByRole('combobox', { name: /ddd/i }), '85');
    await user.type(screen.getByLabelText(/telefone \(sms\/whatsapp\)/i), '999990000');
    await user.type(screen.getByLabelText(/^senha temporária/i, { selector: 'input' }), 'Temp@1234');
    await user.type(screen.getByLabelText(/confirmar senha temporária/i, { selector: 'input' }), 'Temp@1234');

    await user.click(screen.getByRole('button', { name: /criar reserva/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith(
        '/auth/admin-site/criar-admin-site',
        expect.objectContaining({
          nome: 'Reserva Site',
          email: 'reserva@example.com',
          cpf: '11144477735',
          telefone: '85999990000',
          whatsapp: '85999990000',
        })
      );
    });

    const payload = postMock.mock.calls[0][1];
    expect(payload.senha).toBe('Temp@1234');

    expect(window.alert).toHaveBeenCalledWith(
      '✅ Usuário do site (reserva) criado com sucesso! Entregue a senha temporária ao usuário e peça a troca obrigatória no primeiro login.'
    );
  });

  it('inativa admin de reserva com sucesso', async () => {
    const user = userEvent.setup();

    getMock
      .mockResolvedValueOnce({
        data: {
          admins: [
            {
              id: 'ADM-2',
              nome: 'Admin Reserva',
              login: 'admin.reserva',
              email: 'reserva@example.com',
              telefone: '85999990001',
              ativo: true,
              is_current: false,
              can_resend_initial_password: true,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          admins: [
            {
              id: 'ADM-2',
              nome: 'Admin Reserva',
              login: 'admin.reserva',
              email: 'reserva@example.com',
              telefone: '85999990001',
              ativo: false,
              is_current: false,
              can_resend_initial_password: true,
            },
          ],
        },
      });

    putMock.mockResolvedValueOnce({ data: { ativo: false } });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await screen.findByText('admin.reserva');
    await user.click(screen.getByRole('button', { name: /inativar/i }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/auth/admin-site/admins/ADM-2/status', null, {
        params: { ativo: false },
      });
    });

    expect(window.alert).toHaveBeenCalledWith('✅ Status atualizado com sucesso (Inativo)');
  });

  it('reenvia senha temporária com sucesso', async () => {
    const user = userEvent.setup();

    getMock.mockResolvedValueOnce({
      data: {
        admins: [
          {
            id: 'ADM-2',
            nome: 'Admin Reserva',
            login: 'admin.reserva',
            email: 'reserva@example.com',
            telefone: '85999990001',
            ativo: true,
            is_current: false,
            can_resend_initial_password: true,
          },
        ],
      },
    });

    postMock.mockResolvedValueOnce({ data: { email_sent: true } });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await screen.findByText('admin.reserva');
    await user.click(screen.getByRole('button', { name: /reenviar senha/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/auth/admin-site/admins/ADM-2/reenviar-senha');
    });

    expect(window.alert).toHaveBeenCalledWith('✅ Nova senha temporária enviada por e-mail com sucesso.');
  });

  it('oculta botão de reenviar senha para usuário sem senha inicial pendente', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        admins: [
          {
            id: 'ADM-9',
            nome: 'Admin Antigo',
            login: 'admin.antigo',
            email: 'antigo@example.com',
            telefone: '85999990009',
            ativo: true,
            is_current: false,
            can_resend_initial_password: false,
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await screen.findByText('admin.antigo');
    expect(screen.queryByRole('button', { name: /reenviar senha/i })).not.toBeInTheDocument();
  });

  it('abre propriedades do usuário ao clicar no login', async () => {
    const user = userEvent.setup();

    getMock.mockResolvedValueOnce({
      data: {
        admins: [
          {
            id: 'ADM-10',
            nome: 'Admin Propriedades',
            login: 'admin.propriedades',
            email: 'admin.prop@example.com',
            telefone: '85999990010',
            whatsapp: '85999990010',
            ativo: true,
            criado_por_id: 'ADM-ROOT',
            criado_em: '2026-02-21T05:30:00',
            is_current: false,
            can_resend_initial_password: true,
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await screen.findByText('admin.propriedades');
    await user.click(screen.getByRole('button', { name: /abrir propriedades de admin\.propriedades/i }));

    expect(await screen.findByText(/propriedades do usuário do site/i)).toBeInTheDocument();
    const modal = screen.getByText(/propriedades do usuário do site/i).closest('.modal-content') as HTMLElement;
    expect(within(modal).getByText('ADM-10')).toBeInTheDocument();
    expect(within(modal).getByText('admin.prop@example.com')).toBeInTheDocument();
    expect(within(modal).getByText('ADM-ROOT')).toBeInTheDocument();
  });

  it('altera a própria senha pelo modal de propriedades', async () => {
    const user = userEvent.setup();

    getMock
      .mockResolvedValueOnce({
        data: {
          admins: [
            {
              id: 'ADM-ME',
              nome: 'Eu',
              login: 'admin.eu',
              email: 'eu@example.com',
              telefone: '85999990111',
              ativo: true,
              is_current: true,
              can_resend_initial_password: false,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          admins: [
            {
              id: 'ADM-ME',
              nome: 'Eu',
              login: 'admin.eu',
              email: 'eu@example.com',
              telefone: '85999990111',
              ativo: true,
              is_current: true,
              can_resend_initial_password: false,
            },
          ],
        },
      });

    postMock.mockResolvedValueOnce({ data: { message: 'ok' } });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await screen.findByText('admin.eu');
    await user.click(screen.getByRole('button', { name: /abrir propriedades de admin\.eu/i }));

    await user.type(screen.getByLabelText(/senha atual/i, { selector: 'input' }), 'Atual@123');
    await user.type(screen.getByLabelText(/^nova senha$/i, { selector: 'input' }), 'Nova@1234');
    await user.type(screen.getByLabelText(/confirmar nova senha/i, { selector: 'input' }), 'Nova@1234');
    await user.click(screen.getByRole('button', { name: /alterar minha senha/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/auth/admin-site/minha-senha', {
        senha_atual: 'Atual@123',
        nova_senha: 'Nova@1234',
      });
    });
  });

  it('define senha de substituto pelo modal de propriedades', async () => {
    const user = userEvent.setup();

    getMock
      .mockResolvedValueOnce({
        data: {
          admins: [
            {
              id: 'ADM-TARGET',
              nome: 'Substituto',
              login: 'admin.sub',
              email: 'sub@example.com',
              telefone: '85999990122',
              ativo: false,
              is_current: false,
              can_resend_initial_password: true,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          admins: [
            {
              id: 'ADM-TARGET',
              nome: 'Substituto',
              login: 'admin.sub',
              email: 'sub@example.com',
              telefone: '85999990122',
              ativo: false,
              is_current: false,
              can_resend_initial_password: true,
            },
          ],
        },
      });

    postMock.mockResolvedValueOnce({ data: { message: 'ok' } });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await screen.findByText('admin.sub');
    await user.click(screen.getByRole('button', { name: /abrir propriedades de admin\.sub/i }));

    await user.type(screen.getByLabelText(/^nova senha$/i, { selector: 'input' }), 'Sub@12345');
    await user.type(screen.getByLabelText(/confirmar nova senha/i, { selector: 'input' }), 'Sub@12345');
    await user.click(screen.getByRole('button', { name: /definir nova senha/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/auth/admin-site/admins/ADM-TARGET/definir-senha', {
        nova_senha: 'Sub@12345',
      });
    });
  });

  it('navega para dashboard ao clicar em voltar', async () => {
    const user = userEvent.setup();
    getMock.mockResolvedValueOnce({ data: { admins: [] } });

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await screen.findByText(/nenhum usuário do site encontrado/i);
    await user.click(screen.getByRole('button', { name: /voltar/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });
});
