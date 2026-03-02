import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import UserManagement from '../UserManagement';

const { getMock, postMock, putMock, deleteMock, mockNavigate } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
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
  {
    id: 1,
    nome: 'Admin Site',
    email: 'admin@site.com',
    cpf: '',
    tipo: 'super_admin',
    paroquia_id: null,
    paroquia_nome: null,
    ativo: true,
    is_bootstrap: true,
    criado_em: '2026-02-01T10:00:00Z',
  },
  {
    id: 2,
    nome: 'Admin Paróquia José',
    email: 'adminparoquia@example.com',
    telefone: '+55 (85) 99999-8888',
    cpf: '11144477735',
    tipo: 'paroquia_admin',
    paroquia_id: 10,
    paroquia_nome: 'Paróquia Central',
    ativo: true,
    is_bootstrap: false,
    criado_em: '2026-02-01T10:00:00Z',
  },
];

const paroquiasFixture = [
  { id: 10, nome: 'Paróquia Central' },
];

const mockLoadSuccess = () => {
  getMock.mockImplementation((url: string) => {
    if (url === '/usuarios') return Promise.resolve({ data: usuariosFixture });
    if (url === '/paroquias') return Promise.resolve({ data: paroquiasFixture });
    return Promise.resolve({ data: [] });
  });
};

const getModal = (title: RegExp) =>
  screen.getByRole('heading', { name: title }).closest('.modal-content') as HTMLElement;

const getNomeInput = (modal: HTMLElement) => within(modal).getAllByRole('textbox')[0];

const getSenhaInput = (modal: HTMLElement) =>
  within(modal).getByLabelText(/^senha/i, { selector: 'input' }) as HTMLInputElement;

const getConfirmarSenhaInput = (modal: HTMLElement) =>
  within(modal).getByLabelText(/confirmar senha/i, { selector: 'input' }) as HTMLInputElement;

describe('UserManagement', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    mockNavigate.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('carrega dados iniciais e exibe tabela com usuários', async () => {
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    expect(await screen.findByText('Admin Paróquia José')).toBeInTheDocument();
    expect(screen.queryByText('Admin Site')).not.toBeInTheDocument();
    expect(screen.getByText('111.444.777-35')).toBeInTheDocument();
  });

  it('abre edição ao clicar no nome do usuário', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    const userLink = await screen.findByRole('button', { name: /abrir edição de admin paróquia josé/i });
    await user.click(userLink);

    expect(screen.getByRole('heading', { name: /editar usuário da paróquia/i })).toBeInTheDocument();
    expect(screen.getByText(/cpf é fixo após cadastro/i)).toBeInTheDocument();

    const modal = getModal(/editar usuário da paróquia/i);
    expect(within(modal).getByLabelText('DDD')).toHaveValue('85');
    expect(within(modal).getByLabelText(/telefone \(sms\/whatsapp\)/i)).toHaveValue('999998888');
  });

  it('filtra por busca e por tipo', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Admin Paróquia José');

    await user.type(screen.getByPlaceholderText(/buscar por nome, e-mail ou cpf/i), 'José');
    expect(screen.getByText('Admin Paróquia José')).toBeInTheDocument();

    const tipoSelect = screen.getByDisplayValue('Todas as funções');
    await user.selectOptions(tipoSelect, 'paroquia_admin');
    expect(screen.getByText('Admin Paróquia José')).toBeInTheDocument();
  });

  it('mostra erro quando falha no carregamento inicial', async () => {
    getMock.mockRejectedValueOnce(new Error('erro load'));

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro ao carregar dados');
    });
  });

  it('cria usuário novo com sucesso', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();
    postMock.mockResolvedValueOnce({ data: { id: 3 } });

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Gerenciar Usuários da Paróquia');
    await user.click(screen.getByRole('button', { name: /novo usuário/i }));

    const modal = getModal(/novo usuário da paróquia/i);
    const nomeInput = getNomeInput(modal);
    await user.type(nomeInput, 'Novo Admin Paróquia');

    const cpfInput = within(modal).getByPlaceholderText('000.000.000-00');
    await user.type(cpfInput, '12345678909');

    const emailInput = within(modal).getByPlaceholderText('email@paroquia.com');
    await user.type(emailInput, 'paroquia@example.com');

    await user.selectOptions(within(modal).getByLabelText(/função/i), 'paroquia_caixa');

    await user.selectOptions(within(modal).getByLabelText('DDD'), '85');
    await user.type(within(modal).getByLabelText(/telefone \(sms\/whatsapp\)/i), '999998888');

    const senhaInput = getSenhaInput(modal);
    await user.type(senhaInput, 'Senha@123');
    const confirmarSenhaInput = getConfirmarSenhaInput(modal);
    await user.type(confirmarSenhaInput, 'Senha@123');

    const form = modal.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/usuarios', {
        nome: 'Novo Admin Paróquia',
        email: 'paroquia@example.com',
        cpf: '12345678909',
        telefone: '85999998888',
        whatsapp: '85999998888',
        senha: 'Senha@123',
        tipo: 'paroquia_caixa',
        paroquia_id: '10',
        ativo: true,
      });
    });
    expect(window.alert).toHaveBeenCalledWith('Usuário criado com sucesso!');
  });

  it('valida senha obrigatória em novo usuário', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Gerenciar Usuários da Paróquia');
    await user.click(screen.getByRole('button', { name: /novo usuário/i }));
    const modal = getModal(/novo usuário da paróquia/i);

    await user.type(getNomeInput(modal), 'Sem Senha');
    const cpfInput = within(modal).getByPlaceholderText('000.000.000-00');
    await user.type(cpfInput, '12345678909');
    const emailInput = within(modal).getByPlaceholderText('email@paroquia.com');
    await user.type(emailInput, 'semsenha@example.com');
    await user.selectOptions(within(modal).getByLabelText('DDD'), '85');
    await user.type(within(modal).getByLabelText(/telefone \(sms\/whatsapp\)/i), '999998888');
    const form = modal.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Senha é obrigatória para novos usuários');
    });
    expect(postMock).not.toHaveBeenCalled();
  });

  it('edita usuário e atualiza sem enviar senha vazia', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();
    putMock.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Admin Paróquia José');
    const row = screen.getByText('Admin Paróquia José').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /editar/i }));

    const modal = getModal(/editar usuário/i);
    const nomeInput = getNomeInput(modal);
    await user.clear(nomeInput);
    await user.type(nomeInput, 'Operador José Atualizado');
    await user.selectOptions(within(modal).getByLabelText(/função/i), 'paroquia_bingo');
    await user.click(within(modal).getByRole('button', { name: /atualizar/i }));

    await waitFor(() => {
      const payload = putMock.mock.calls[0][1];
      expect(putMock.mock.calls[0][0]).toBe('/usuarios/2');
      expect(payload.nome).toBe('Operador José Atualizado');
      expect(payload.email).toBe('adminparoquia@example.com');
      expect(payload.cpf).toBeUndefined();
      expect(payload.telefone).toBe('85999998888');
      expect(payload.whatsapp).toBe('85999998888');
      expect(payload.tipo).toBe('paroquia_bingo');
      expect(payload.senha).toBeUndefined();
      expect(payload.senha_atual).toBeUndefined();
      expect(payload.nova_senha).toBeUndefined();
      expect(payload.paroquia_id).toBe('10');
    });
    expect(window.alert).toHaveBeenCalledWith('Usuário atualizado com sucesso!');
  });

  it('permite trocar senha ao editar usuário', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();
    putMock.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Admin Paróquia José');
    const row = screen.getByText('Admin Paróquia José').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /editar/i }));

    const modal = getModal(/editar usuário/i);
    await user.type(within(modal).getByLabelText(/senha atual/i, { selector: 'input' }), 'Senha@123');
    await user.type(within(modal).getByLabelText(/^nova senha/i, { selector: 'input' }), 'NovaSenha@123');
    await user.type(within(modal).getByLabelText(/confirmar nova senha/i, { selector: 'input' }), 'NovaSenha@123');
    await user.click(within(modal).getByRole('button', { name: /atualizar/i }));

    await waitFor(() => {
      const payload = putMock.mock.calls[0][1];
      expect(payload.senha_atual).toBe('Senha@123');
      expect(payload.nova_senha).toBe('NovaSenha@123');
      expect(payload.senha).toBeUndefined();
      expect(payload.telefone).toBe('85999998888');
      expect(payload.whatsapp).toBe('85999998888');
    });
    expect(window.alert).toHaveBeenCalledWith('Usuário atualizado com sucesso!');
  });

  it('valida confirmação de senha no cadastro', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Gerenciar Usuários da Paróquia');
    await user.click(screen.getByRole('button', { name: /novo usuário/i }));

    const modal = getModal(/novo usuário da paróquia/i);
    await user.type(getNomeInput(modal), 'Usuário Teste');
    await user.type(within(modal).getByPlaceholderText('000.000.000-00'), '12345678909');
    await user.type(within(modal).getByPlaceholderText('email@paroquia.com'), 'teste@example.com');
    await user.selectOptions(within(modal).getByLabelText('DDD'), '85');
    await user.type(within(modal).getByLabelText(/telefone \(sms\/whatsapp\)/i), '999998888');
    await user.type(getSenhaInput(modal), 'Senha@123');
    await user.type(getConfirmarSenhaInput(modal), 'Senha@124');

    const form = modal.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Confirmação de senha não confere');
    });
    expect(postMock).not.toHaveBeenCalled();
  });

  it('exclui usuário da paróquia com confirmação', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();
    deleteMock.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Admin Paróquia José');

    const normalRow = screen.getByText('Admin Paróquia José').closest('tr') as HTMLElement;
    await user.click(within(normalRow).getByRole('button', { name: /excluir/i }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledWith('/usuarios/2');
    });
    expect(window.alert).toHaveBeenCalledWith('Usuário excluído com sucesso!');
  });

  it('navega para dashboard ao clicar em voltar', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Gerenciar Usuários da Paróquia');
    await user.click(screen.getByRole('button', { name: /voltar/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });

  it('valida telefone com DDD no cadastro', async () => {
    const user = userEvent.setup();
    mockLoadSuccess();

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    await screen.findByText('Gerenciar Usuários da Paróquia');
    await user.click(screen.getByRole('button', { name: /novo usuário/i }));

    const modal = getModal(/novo usuário da paróquia/i);
    await user.type(getNomeInput(modal), 'Contato Obrigatório');
    await user.type(within(modal).getByPlaceholderText('000.000.000-00'), '12345678909');
    await user.type(within(modal).getByPlaceholderText('email@paroquia.com'), 'contato@example.com');
    await user.selectOptions(within(modal).getByLabelText('DDD'), '85');
    await user.type(within(modal).getByLabelText(/telefone \(sms\/whatsapp\)/i), '123');
    await user.type(getSenhaInput(modal), 'Senha@123');
    await user.type(getConfirmarSenhaInput(modal), 'Senha@123');

    await user.click(within(modal).getByRole('button', { name: /^criar$/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Telefone com DDD é obrigatório e deve ser válido');
    });
    expect(postMock).not.toHaveBeenCalled();
  });

  describe('Context Conditional Logic - Admin-Site vs Admin-Paróquia', () => {
    it('Admin-Site: inicializa com paroquia_admin apenas no dropdown', async () => {
      const user = userEvent.setup();
      mockLoadSuccess();
      
      // Simular context Admin-Site
      localStorage.setItem('@BingoComunidade:session_scope', 'admin_site');

      render(
        <MemoryRouter>
          <UserManagement />
        </MemoryRouter>
      );

      await screen.findByText('Gerenciar Usuários da Paróquia');
      await user.click(screen.getByRole('button', { name: /novo usuário/i }));

      const modal = getModal(/novo usuário da paróquia/i);
      const funcaoSelect = within(modal).getByLabelText(/função/i) as HTMLSelectElement;

      // ✅ Deve ter apenas "Administrador"
      const options = Array.from(funcaoSelect.options).map(opt => opt.value);
      expect(options).toEqual(['paroquia_admin']);
      expect(options).not.toContain('paroquia_caixa');
      expect(options).not.toContain('paroquia_recepcao');
      expect(options).not.toContain('paroquia_bingo');

      localStorage.removeItem('@BingoComunidade:session_scope');
    });

    it('Admin-Paróquia: inicializa com todas as funções no dropdown', async () => {
      const user = userEvent.setup();
      mockLoadSuccess();
      
      // Simular context Admin-Paróquia
      localStorage.setItem('@BingoComunidade:session_scope', 'admin_paroquia');

      render(
        <MemoryRouter>
          <UserManagement />
        </MemoryRouter>
      );

      await screen.findByText('Gerenciar Usuários da Paróquia');
      await user.click(screen.getByRole('button', { name: /novo usuário/i }));

      const modal = getModal(/novo usuário da paróquia/i);
      const funcaoSelect = within(modal).getByLabelText(/função/i) as HTMLSelectElement;

      // ✅ Deve ter todas as 4 funções
      const options = Array.from(funcaoSelect.options).map(opt => opt.value);
      expect(options).toContain('paroquia_admin');
      expect(options).toContain('paroquia_caixa');
      expect(options).toContain('paroquia_recepcao');
      expect(options).toContain('paroquia_bingo');

      localStorage.removeItem('@BingoComunidade:session_scope');
    });

    it('Admin-Site: tipo padrão é paroquia_admin', async () => {
      const user = userEvent.setup();
      mockLoadSuccess();
      
      localStorage.setItem('@BingoComunidade:session_scope', 'admin_site');

      render(
        <MemoryRouter>
          <UserManagement />
        </MemoryRouter>
      );

      await screen.findByText('Gerenciar Usuários da Paróquia');
      await user.click(screen.getByRole('button', { name: /novo usuário/i }));

      const modal = getModal(/novo usuário da paróquia/i);
      const funcaoSelect = within(modal).getByLabelText(/função/i) as HTMLSelectElement;

      // ✅ Valor selecionado por padrão deve ser paroquia_admin
      expect(funcaoSelect.value).toBe('paroquia_admin');

      localStorage.removeItem('@BingoComunidade:session_scope');
    });

    it('Admin-Paróquia: tipo padrão é paroquia_recepcao', async () => {
      const user = userEvent.setup();
      mockLoadSuccess();
      
      localStorage.setItem('@BingoComunidade:session_scope', 'admin_paroquia');

      render(
        <MemoryRouter>
          <UserManagement />
        </MemoryRouter>
      );

      await screen.findByText('Gerenciar Usuários da Paróquia');
      await user.click(screen.getByRole('button', { name: /novo usuário/i }));

      const modal = getModal(/novo usuário da paróquia/i);
      const funcaoSelect = within(modal).getByLabelText(/função/i) as HTMLSelectElement;

      // ✅ Valor selecionado por padrão deve ser paroquia_recepcao
      expect(funcaoSelect.value).toBe('paroquia_recepcao');

      localStorage.removeItem('@BingoComunidade:session_scope');
    });

    it('Admin-Site: rejeita tentativa de fraud ao enviar tipo inválido', async () => {
      const user = userEvent.setup();
      mockLoadSuccess();
      
      localStorage.setItem('@BingoComunidade:session_scope', 'admin_site');

      render(
        <MemoryRouter>
          <UserManagement />
        </MemoryRouter>
      );

      await screen.findByText('Gerenciar Usuários da Paróquia');
      await user.click(screen.getByRole('button', { name: /novo usuário/i }));

      const modal = getModal(/novo usuário da paróquia/i);
      
      // Simular tentativa de fraud via console (adicionar tipo não permitido)
      // Preencher form normalmente
      await user.type(getNomeInput(modal), 'Fraudador');
      await user.type(within(modal).getByPlaceholderText('000.000.000-00'), '12345678909');
      await user.type(within(modal).getByPlaceholderText('email@paroquia.com'), 'fraude@example.com');
      await user.selectOptions(within(modal).getByLabelText('DDD'), '85');
      await user.type(within(modal).getByLabelText(/telefone \(sms\/whatsapp\)/i), '999998888');
      await user.type(getSenhaInput(modal), 'Senha@123');
      await user.type(getConfirmarSenhaInput(modal), 'Senha@123');

      // Tentar manipular via console: alterar valor do select
      const funcaoSelect = within(modal).getByLabelText(/função/i) as HTMLSelectElement;
      funcaoSelect.value = 'paroquia_caixa'; // ❌ Inválido para Admin-Site
      fireEvent.change(funcaoSelect);

      // ✅ Submit deve falhar com mensagem de erro
      const form = modal.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Função inválida para cadastro nesta área');
      });
      expect(postMock).not.toHaveBeenCalled();

      localStorage.removeItem('@BingoComunidade:session_scope');
    });

    it('Admin-Paróquia: permite criar qualquer tipo de usuário', async () => {
      const user = userEvent.setup();
      mockLoadSuccess();
      postMock.mockResolvedValueOnce({ data: { id: 123 } });
      
      localStorage.setItem('@BingoComunidade:session_scope', 'admin_paroquia');

      render(
        <MemoryRouter>
          <UserManagement />
        </MemoryRouter>
      );

      await screen.findByText('Gerenciar Usuários da Paróquia');
      
      // Criar usuário do tipo "Caixa"
      await user.click(screen.getByRole('button', { name: /novo usuário/i }));
      const modal = getModal(/novo usuário da paróquia/i);
      
      await user.type(getNomeInput(modal), 'Operador Caixa');
      await user.type(within(modal).getByPlaceholderText('000.000.000-00'), '12345678909');
      await user.type(within(modal).getByPlaceholderText('email@paroquia.com'), 'caixa@example.com');
      await user.selectOptions(within(modal).getByLabelText(/função/i), 'paroquia_caixa');
      await user.selectOptions(within(modal).getByLabelText('DDD'), '85');
      await user.type(within(modal).getByLabelText(/telefone \(sms\/whatsapp\)/i), '999998888');
      await user.type(getSenhaInput(modal), 'Senha@123');
      await user.type(getConfirmarSenhaInput(modal), 'Senha@123');

      const form = modal.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(postMock).toHaveBeenCalledWith('/usuarios', expect.objectContaining({
          nome: 'Operador Caixa',
          tipo: 'paroquia_caixa',
        }));
      });
      expect(window.alert).toHaveBeenCalledWith('Usuário criado com sucesso!');

      localStorage.removeItem('@BingoComunidade:session_scope');
    });
  });
});
