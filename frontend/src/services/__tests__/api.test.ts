import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createMock,
  getMock,
  postMock,
  instanceMock,
  handlers,
} = vi.hoisted(() => {
  const handlersRef: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestFulfilled?: (config: any) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responseRejected?: (error: any) => Promise<never>;
  } = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestUse = vi.fn((onFulfilled: (config: any) => any) => {
    handlersRef.requestFulfilled = onFulfilled;
    return 0;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseUse = vi.fn((_: unknown, onRejected: (error: any) => Promise<never>) => {
    handlersRef.responseRejected = onRejected;
    return 0;
  });

  const instance = {
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
    get: vi.fn(),
    post: vi.fn(),
  };

  return {
    createMock: vi.fn(() => instance),
    getMock: instance.get,
    postMock: instance.post,
    requestUseMock: requestUse,
    instanceMock: instance,
    handlers: handlersRef,
  };
});

vi.mock('axios', () => ({
  default: {
    create: createMock,
  },
}));

import api, {
  authService,
  cartelaService,
  healthService,
  paroquiaService,
  sorteioService,
} from '../api';

describe('services/api', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('registra interceptors ao criar instância axios', () => {
    expect(handlers.requestFulfilled).toBeTypeOf('function');
    expect(handlers.responseRejected).toBeTypeOf('function');
    expect(api).toBe(instanceMock);
  });

  it('request interceptor injeta token priorizando @BingoComunidade:token', () => {
    localStorage.setItem('@BingoComunidade:token', 'token-novo');
    localStorage.setItem('access_token', 'token-antigo');

    const config = { headers: {} as Record<string, string> };
    const result = handlers.requestFulfilled?.(config);

    expect(result).toBe(config);
    expect(config.headers.Authorization).toBe('Bearer token-novo');
  });

  it('response interceptor em 401 fora de /auth limpa sessão e redireciona por contexto', async () => {
    localStorage.setItem('@BingoComunidade:token', 'abc');
    localStorage.setItem('@BingoComunidade:user', '{"id":"1"}');
    localStorage.setItem('access_token', 'legacy');
    localStorage.setItem('usuario', '{"id":"2"}');
    window.history.pushState({}, '', '/admin-paroquia/dashboard');

    const error = {
      config: { url: '/paroquias', method: 'get' },
      response: { status: 401, data: { detail: 'Não autenticado' } },
      message: 'Request failed',
    };

    await expect(handlers.responseRejected?.(error)).rejects.toBe(error);
    expect(localStorage.getItem('@BingoComunidade:token')).toBeNull();
    expect(localStorage.getItem('@BingoComunidade:user')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(window.location.pathname).toContain('/admin-paroquia');
  });

  it('response interceptor em 401 de /auth mantém sessão e não redireciona', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem('@BingoComunidade:token', 'abc');

    const error = {
      config: { url: '/auth/login', method: 'post' },
      response: { status: 401, data: { detail: 'Credenciais inválidas' } },
      message: 'Request failed',
    };

    await expect(handlers.responseRejected?.(error)).rejects.toBe(error);
    expect(localStorage.getItem('@BingoComunidade:token')).toBe('abc');
    expect(window.location.pathname).toBe('/');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('normaliza mensagem 422 usando lista de validações', async () => {
    const error = {
      config: { url: '/auth/signup', method: 'post' },
      response: {
        status: 422,
        data: {
          detail: [{ msg: 'CPF invalido' }, { msg: 'Email invalido' }],
        },
      },
      message: 'Request failed',
    };

    try {
      await handlers.responseRejected?.(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (caught: any) {
      expect(caught.message).toBe('CPF invalido, Email invalido');
    }
  });

  it('normaliza mensagem de rede quando servidor está indisponível', async () => {
    const error = {
      config: { url: '/health', method: 'get' },
      request: {},
      message: 'Network Error',
    };

    try {
      await handlers.responseRejected?.(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (caught: any) {
      expect(caught.message).toBe('Servidor indisponível ou bloqueio de segurança (CORS).');
    }
  });

  it('authService.login envia email quando identificador for email e salva sessão legacy', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        access_token: 'token-login',
        usuario: { id: 'USR-1', nome: 'Maria' },
      },
    });

    await authService.login(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { login: 'maria@exemplo.com', senha: 'Senha@123' } as any
    );

    expect(postMock).toHaveBeenCalledWith('/auth/login', {
      email: 'maria@exemplo.com',
      senha: 'Senha@123',
    });
    expect(localStorage.getItem('access_token')).toBe('token-login');
    expect(localStorage.getItem('usuario')).toContain('USR-1');
  });

  it('authService.login envia CPF quando identificador não for email', async () => {
    postMock.mockResolvedValueOnce({
      data: { access_token: 'token-cpf', usuario: { id: 'USR-2', nome: 'João' } },
    });

    await authService.login(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { cpf: '11144477735', senha: 'Senha@123' } as any
    );

    expect(postMock).toHaveBeenCalledWith('/auth/login', {
      cpf: '11144477735',
      senha: 'Senha@123',
    });
  });

  it('authService.getCurrentUser retorna null para JSON inválido', () => {
    localStorage.setItem('usuario', '{invalido');
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('serviços de GET/POST retornam response.data', async () => {
    getMock
      .mockResolvedValueOnce({ data: { id: 'PAR-1' } })
      .mockResolvedValueOnce({ data: [{ id: 'SOR-1' }] })
      .mockResolvedValueOnce({ data: { id: 'SOR-2' } })
      .mockResolvedValueOnce({ data: [{ id: 'CAR-1' }] })
      .mockResolvedValueOnce({ data: { message: 'pong' } })
      .mockResolvedValueOnce({ data: { status: 'ok' } });
    postMock.mockResolvedValueOnce({ data: { id: 'CAR-NEW' } });

    await expect(paroquiaService.getParoquiaAtual()).resolves.toEqual({ id: 'PAR-1' });
    await expect(sorteioService.listarSorteios()).resolves.toEqual([{ id: 'SOR-1' }]);
    await expect(sorteioService.obterSorteio('SOR-2')).resolves.toEqual({ id: 'SOR-2' });
    await expect(cartelaService.comprarCartela('SOR-9')).resolves.toEqual({ id: 'CAR-NEW' });
    await expect(cartelaService.minhasCartelas()).resolves.toEqual([{ id: 'CAR-1' }]);
    await expect(healthService.ping()).resolves.toEqual({ message: 'pong' });
    await expect(healthService.health()).resolves.toEqual({ status: 'ok' });

    expect(postMock).toHaveBeenCalledWith('/sorteios/SOR-9/cartelas');
    expect(getMock).toHaveBeenCalledWith('/paroquia/me');
    expect(getMock).toHaveBeenCalledWith('/sorteios');
    expect(getMock).toHaveBeenCalledWith('/sorteios/SOR-2');
    expect(getMock).toHaveBeenCalledWith('/minhas-cartelas');
    expect(getMock).toHaveBeenCalledWith('/ping');
    expect(getMock).toHaveBeenCalledWith('/health');
  });
});
