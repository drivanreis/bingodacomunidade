import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../Signup';
import { signupSuccessData } from '../../test/fixtures/signupSuccess';

const { postMock, mockNavigate } = vi.hoisted(() => ({
  postMock: vi.fn(),
  mockNavigate: vi.fn(),
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
    useNavigate: () => mockNavigate,
  };
});

describe('Signup (público)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const preencherFormularioValido = async (
    user: ReturnType<typeof userEvent.setup>,
    overrides?: Partial<{
      nome: string;
      email: string;
      cpf: string;
      ddd: string;
      telefone: string;
      chavePix: string;
      senha: string;
      confirmarSenha: string;
    }>
  ) => {
    const valores = {
      nome: signupSuccessData.nome,
      email: signupSuccessData.email,
      cpf: signupSuccessData.cpfFormatado,
      ddd: signupSuccessData.ddd,
      telefone: signupSuccessData.telefone,
      chavePix: signupSuccessData.chavePix,
      senha: signupSuccessData.senha,
      confirmarSenha: signupSuccessData.senha,
      ...overrides,
    };

    const preencherCampo = async (placeholder: string, valor: string) => {
      const input = screen.getByPlaceholderText(placeholder);
      await user.clear(input);
      if (valor) {
        await user.type(input, valor);
      }
    };

    await preencherCampo('João da Silva', valores.nome);
    await preencherCampo('seu.email@exemplo.com', valores.email);
    await preencherCampo('000.000.000-00', valores.cpf);
    await user.selectOptions(screen.getByRole('combobox', { name: /ddd/i }), valores.ddd);
    await preencherCampo('Número', valores.telefone);
    await preencherCampo('CPF, Email, Telefone ou Chave Aleatória', valores.chavePix);
    await preencherCampo('6 a 16 caracteres', valores.senha);
    await preencherCampo('Digite a senha novamente', valores.confirmarSenha);
  };

  it('impede envio quando senhas não coincidem', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('João da Silva'), signupSuccessData.nome);
    await user.type(screen.getByPlaceholderText('seu.email@exemplo.com'), 'joao@example.com');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), signupSuccessData.cpfFormatado);
    await user.selectOptions(screen.getByRole('combobox', { name: /ddd/i }), '85');
    await user.type(screen.getByPlaceholderText('Número'), '988888888');
    await user.type(
      screen.getByPlaceholderText('CPF, Email, Telefone ou Chave Aleatória'),
      'joao@example.com'
    );
    await user.type(screen.getByPlaceholderText('6 a 16 caracteres'), 'Senha@123');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'Senha@124');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/senha invalido/i)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      nome: '',
      mensagem: 'Nome Completo invalido',
    },
    {
      nome: 'Ana',
      mensagem: 'Nome Completo invalido',
    },
    {
      nome: 'Ana E',
      mensagem: 'Nome Completo invalido',
    },
    {
      mensagem: 'Nome Completo invalido',
      nome: 'Ivan Reis 1978',
    },
  ])('valida nome completo inválido: $nome', async ({ nome, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { nome });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      email: 'anaexemplo.com',
      mensagem: 'Email invalido',
    },
    {
      email: '',
      mensagem: 'Email invalido',
    },
    {
      email: 'ana@',
      mensagem: 'Email invalido',
    },
    {
      email: '@https://www.google.com/search?q=dominio.com',
      mensagem: 'Email invalido',
    },
  ])('valida email inválido: $email', async ({ email, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { email });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      cpf: '',
      mensagem: 'CPF invalido',
    },
    {
      cpf: '123.456.789',
      mensagem: 'CPF invalido',
    },
    {
      cpf: '123.456.789-01',
      mensagem: 'CPF invalido',
    },
  ])('valida CPF inválido: $cpf', async ({ cpf, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { cpf });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      ddd: '',
      mensagem: 'DDD invalido',
    },
  ])('valida DDD inválido: $ddd', async ({ ddd, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { ddd });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      telefone: '',
      mensagem: 'Telefone invalido',
    },
    {
      telefone: '9876543',
      mensagem: 'Telefone invalido',
    },
    {
      telefone: '98765432101',
      mensagem: 'Telefone invalido',
    },
  ])('valida Telefone inválido: $telefone', async ({ telefone, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { telefone });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      chavePix: '',
      mensagem: 'Chave PIX invalido',
    },
    {
      chavePix: '1234',
      mensagem: 'Chave PIX invalido',
    },
    {
      chavePix: '123.456.789-00',
      mensagem: 'Chave PIX invalido',
    },
  ])('valida Chave PIX inválida: $chavePix', async ({ chavePix, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { chavePix });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      senha: '',
      confirmarSenha: '',
      mensagem: 'Senha invalido',
    },
    {
      senha: 'Aa1@',
      confirmarSenha: 'Aa1@',
      mensagem: 'Senha invalido',
    },
    {
      senha: 'SenhaMuitoLonga@123',
      confirmarSenha: 'SenhaMuitoLonga@123',
      mensagem: 'Senha invalido',
    },
    {
      senha: 'senha1234',
      confirmarSenha: 'senha1234',
      mensagem: 'Senha invalido',
    },
  ])('valida senha inválida: $senha', async ({ senha, confirmarSenha, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { senha, confirmarSenha });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      campo: 'cpf',
      override: { cpf: "111.111.111-11' OR 1=1 --" },
      mensagem: 'CPF invalido',
    },
    {
      campo: 'telefone',
      override: { telefone: "99999999' OR 1=1 --" },
      mensagem: 'Telefone invalido',
    },
    {
      campo: 'chave_pix',
      override: { chavePix: "chave_aleatoria_invalida'; SELECT * FROM users; --" },
      mensagem: 'Chave PIX invalido',
    },
    {
      campo: 'email',
      override: { email: "ana @exemplo.com' OR '1'='1" },
      mensagem: 'Email invalido',
    },
  ])('bloqueia tentativa de SQL injection no campo $campo', async ({ override, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, override);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('envia cadastro e redireciona após sucesso', async () => {
    const user = userEvent.setup();

    postMock.mockResolvedValueOnce({ data: { access_token: 'token' } });

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user);

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(postMock).toHaveBeenCalledWith('/auth/signup', {
      nome: signupSuccessData.nome,
      email: signupSuccessData.email,
      cpf: signupSuccessData.cpfLimpo,
      telefone: signupSuccessData.telefoneCompleto,
      whatsapp: signupSuccessData.telefoneCompleto,
      senha: signupSuccessData.senha,
      chave_pix: signupSuccessData.chavePix,
    });

    await new Promise((resolve) => setTimeout(resolve, 2100));

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: {
        message: '✅ Cadastro realizado! Faça login com seu CPF e senha.',
        cpf: signupSuccessData.cpfLimpo,
      },
    });
  });

  it('Perfil Usuário Comum Inteligente (Caminho Feliz): envia fluxo válido completo', async () => {
    const user = userEvent.setup();
    postMock.mockReset();
    mockNavigate.mockReset();

    postMock.mockResolvedValueOnce({ data: { access_token: 'token-inteligente' } });

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(postMock).toHaveBeenCalledWith('/auth/signup', {
      nome: signupSuccessData.nome,
      email: signupSuccessData.email,
      cpf: signupSuccessData.cpfLimpo,
      telefone: signupSuccessData.telefoneCompleto,
      whatsapp: signupSuccessData.telefoneCompleto,
      senha: signupSuccessData.senha,
      chave_pix: signupSuccessData.chavePix,
    });
  });

  it('Perfil Usuário Comum Burro (UX/Resiliência): tenta cadastrar duas vezes e recebe orientação clara', async () => {
    const user = userEvent.setup();
    postMock.mockReset();

    postMock.mockRejectedValueOnce({
      response: { data: { detail: 'CPF já cadastrado no sistema' } },
    });

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/cpf já cadastrado no sistema/i)).toBeInTheDocument();
  });

  it('Perfil Usuário Comum Hacker (Segurança/PenTest): bloqueia script injection no nome antes de enviar', async () => {
    const user = userEvent.setup();
    postMock.mockReset();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { nome: "<script>alert('xss')</script>" });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/nome completo invalido/i)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });
});
