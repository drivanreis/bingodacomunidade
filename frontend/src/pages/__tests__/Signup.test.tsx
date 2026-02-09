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
      whatsapp: string;
      chavePix: string;
      senha: string;
      confirmarSenha: string;
    }>
  ) => {
    const valores = {
      nome: signupSuccessData.nome,
      email: signupSuccessData.email,
      cpf: signupSuccessData.cpfFormatado,
      whatsapp: signupSuccessData.whatsappEntrada,
      chavePix: signupSuccessData.chavePix,
      senha: signupSuccessData.senha,
      confirmarSenha: signupSuccessData.senha,
      ...overrides,
    };

    await user.type(screen.getByPlaceholderText('João da Silva'), valores.nome);
    await user.type(screen.getByPlaceholderText('seu.email@exemplo.com'), valores.email);
    await user.type(screen.getByPlaceholderText('000.000.000-00'), valores.cpf);
    await user.type(screen.getByPlaceholderText('(85) 98888-8888'), valores.whatsapp);
    await user.type(
      screen.getByPlaceholderText('CPF, Email, Telefone ou Chave Aleatória'),
      valores.chavePix
    );
    await user.type(screen.getByPlaceholderText('6 a 16 caracteres'), valores.senha);
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), valores.confirmarSenha);
  };

  it('impede envio quando senhas não coincidem', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('João da Silva'), 'João da Silva');
    await user.type(screen.getByPlaceholderText('seu.email@exemplo.com'), 'joao@example.com');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.789-09');
    await user.type(screen.getByPlaceholderText('(85) 98888-8888'), '(85) 98888-8888');
    await user.type(
      screen.getByPlaceholderText('CPF, Email, Telefone ou Chave Aleatória'),
      'joao@example.com'
    );
    await user.type(screen.getByPlaceholderText('6 a 16 caracteres'), 'Senha@123');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'Senha@124');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/senhas não coincidem/i)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      nome: 'Ana',
      mensagem: 'Nome completo deve ter pelo menos duas palavras com 3 letras',
    },
    {
      nome: 'Ana E',
      mensagem: 'Nome completo deve ter pelo menos duas palavras com 3 letras',
    },
    {
      nome: 'Leo de Eva 33ª',
      mensagem: 'Nome completo permite no máximo um número e um caractere especial (º ou ª)',
    },
    {
      nome: 'Ana de Leoº!',
      mensagem: 'Nome completo permite apenas º ou ª como caractere especial',
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
      mensagem: 'Email inválido',
    },
    {
      email: 'ana@',
      mensagem: 'Email inválido',
    },
    {
      email: 'ana@exemplo',
      mensagem: 'Email inválido',
    },
    {
      email: '@exemplo.com',
      mensagem: 'Email inválido',
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
      cpf: '123.456.789',
      mensagem: 'CPF deve ter 11 dígitos',
    },
    {
      cpf: '123.456.789-000',
      mensagem: 'CPF deve ter 11 dígitos',
    },
    {
      cpf: '123.456.789-01',
      mensagem: 'CPF inválido',
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
      whatsapp: '8598765432',
      mensagem: 'WhatsApp deve conter DDD e 9 ou 10 números',
    },
    {
      whatsapp: '859876543210',
      mensagem: 'WhatsApp deve conter DDD e 9 ou 10 números',
    },
    {
      whatsapp: '85AB98765432',
      mensagem: 'WhatsApp deve conter apenas números',
    },
  ])('valida WhatsApp inválido: $whatsapp', async ({ whatsapp, mensagem }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, { whatsapp });
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(new RegExp(mensagem, 'i'))).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      senha: 'Aa1@',
      confirmarSenha: 'Aa1@',
      mensagem: 'Senha deve ter no mínimo 6 caracteres',
    },
    {
      senha: 'SenhaMuitoLonga@123',
      confirmarSenha: 'SenhaMuitoLonga@123',
      mensagem: 'Senha deve ter no máximo 16 caracteres',
    },
    {
      senha: 'senha@123',
      confirmarSenha: 'senha@123',
      mensagem: 'Senha deve conter pelo menos uma letra maiúscula',
    },
    {
      senha: 'SENHA@123',
      confirmarSenha: 'SENHA@123',
      mensagem: 'Senha deve conter pelo menos uma letra minúscula',
    },
    {
      senha: 'Senha@aaa',
      confirmarSenha: 'Senha@aaa',
      mensagem: 'Senha deve conter pelo menos um número',
    },
    {
      senha: 'Senha1234',
      confirmarSenha: 'Senha1234',
      mensagem: 'Senha deve conter pelo menos um caractere especial',
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
      campo: 'nome',
      override: { nome: "Ana'; DROP TABLE users; --" },
    },
    {
      campo: 'email',
      override: { email: "ana@exemplo.com' OR '1'='1" },
    },
    {
      campo: 'cpf',
      override: { cpf: "111.444.777-35' OR 1=1 --" },
    },
    {
      campo: 'whatsapp',
      override: { whatsapp: "85987654321' OR 1=1 --" },
    },
    {
      campo: 'chave_pix',
      override: { chavePix: "ana@exemplo.com'; SELECT * FROM users; --" },
    },
    {
      campo: 'senha',
      override: { senha: "Senha@123' OR 1=1 --", confirmarSenha: "Senha@123' OR 1=1 --" },
    },
  ])('bloqueia tentativa de SQL injection no campo $campo', async ({ override }) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await preencherFormularioValido(user, override);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/entrada inválida|caracteres inválidos|injeção/i)).toBeInTheDocument();
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
      whatsapp: signupSuccessData.whatsappNormalizado,
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
});
