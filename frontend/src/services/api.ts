/**
 * Serviço de API - Cliente HTTP para comunicação com Backend
 * 
 * Sistema Monolítico: Uma paróquia por instalação
 * Backend: FastAPI rodando em http://localhost:8000
 */

import axios, { AxiosError } from 'axios'
import type { AxiosInstance } from 'axios'
import type {
  Paroquia,
  Usuario,
  SignupRequest,
  LoginRequest,
  TokenResponse,
  Sorteio,
  Cartela,
  HealthCheckResponse,
  ApiError,
} from '../types'

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Cria instância do Axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================================
// INTERCEPTORS
// ============================================================================

// Request Interceptor: Adiciona token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Log detalhado para o administrador (Console do Navegador)
    console.error('❌ [API Error Interceptor]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Se 401 Unauthorized, limpa token e redireciona conforme contexto (exceto endpoints de auth)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAuthEndpoint = requestUrl.includes('/auth/')

      if (!isAuthEndpoint) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('usuario')

        const currentPath = window.location.pathname || '/'
        if (currentPath.startsWith('/admin-site')) {
          window.location.href = '/admin-site/login'
        } else if (currentPath.startsWith('/admin-paroquia')) {
          window.location.href = '/admin-paroquia/login'
        } else {
          window.location.href = '/login'
        }
      }
    }

    let errorMessage = 'Ocorreu um erro inesperado.';

    if (error.response) {
      // O servidor respondeu com um status fora da faixa 2xx
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 500) {
        errorMessage = 'Erro interno do servidor. Nossa equipe técnica foi notificada.';
        if (detail && typeof detail === 'string') {
           // Em homologação, o backend pode enviar detalhes do erro 500
           errorMessage = detail; 
        }
      } else if (status === 422) {
        errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
        if (Array.isArray(detail)) {
          // Erros de validação do Pydantic
          errorMessage = detail.map((e: any) => e.msg).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (detail && typeof detail === 'string') {
        // Outros erros com mensagem clara do backend (400, 403, 404...)
        errorMessage = detail;
      } else {
        errorMessage = `Erro ${status}: Não foi possível processar sua solicitação.`;
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta (Erro de Rede / CORS)
      errorMessage = 'Erro de conexão. Verifique sua internet ou se o servidor está online.';
      if (error.message === 'Network Error') {
         errorMessage = 'Servidor indisponível ou bloqueio de segurança (CORS).';
      }
    } else {
      // Algo aconteceu ao configurar a requisição
      errorMessage = error.message || 'Erro ao configurar requisição.';
    }

    return Promise.reject(new Error(errorMessage))
  }
)

// ============================================================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================================================

export const authService = {
  /**
   * Cadastro público de fiéis
   */
  signup: async (data: SignupRequest): Promise<Usuario> => {
    const response = await api.post<Usuario>('/auth/signup', data)
    return response.data
  },

  /**
   * Login com CPF e senha
   */
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const payload = data.email || data.login
      ? { email: data.email || data.login, senha: data.senha }
      : { cpf: data.cpf, senha: data.senha }

    const response = await api.post<TokenResponse>('/auth/login', payload)
    const { access_token, usuario } = response.data

    // Salva token e dados do usuário no localStorage
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('usuario', JSON.stringify(usuario))

    return response.data
  },

  /**
   * Verifica email com token
   */
  verifyEmail: async (token: string): Promise<void> => {
    await api.get(`/auth/verify-email`, { params: { token } })
  },

  /**
   * Logout (limpa dados locais)
   */
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')
    window.location.href = '/login'
  },

  /**
   * Obtém usuário atual do localStorage
   */
  getCurrentUser: (): Usuario | null => {
    const usuarioJson = localStorage.getItem('usuario')
    if (!usuarioJson) return null

    try {
      return JSON.parse(usuarioJson) as Usuario
    } catch {
      return null
    }
  },

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token')
  },
}

// ============================================================================
// FUNÇÕES DE PARÓQUIA
// ============================================================================

export const paroquiaService = {
  /**
   * Obtém dados da paróquia única do sistema
   * (Sistema monolítico - sempre retorna a mesma paróquia)
   */
  getParoquiaAtual: async (): Promise<Paroquia> => {
    const response = await api.get<Paroquia>('/paroquia/me')
    return response.data
  },
}

// ============================================================================
// FUNÇÕES DE SORTEIOS
// ============================================================================

export const sorteioService = {
  /**
   * Lista todos os sorteios
   */
  listarSorteios: async (): Promise<Sorteio[]> => {
    const response = await api.get<Sorteio[]>('/sorteios')
    return response.data
  },

  /**
   * Obtém detalhes de um sorteio específico
   */
  obterSorteio: async (id: string): Promise<Sorteio> => {
    const response = await api.get<Sorteio>(`/sorteios/${id}`)
    return response.data
  },
}

// ============================================================================
// FUNÇÕES DE CARTELAS
// ============================================================================

export const cartelaService = {
  /**
   * Compra uma cartela para um sorteio
   */
  comprarCartela: async (sorteioId: string): Promise<Cartela> => {
    const response = await api.post<Cartela>(`/sorteios/${sorteioId}/cartelas`)
    return response.data
  },

  /**
   * Lista cartelas do usuário autenticado
   */
  minhasCartelas: async (): Promise<Cartela[]> => {
    const response = await api.get<Cartela[]>('/minhas-cartelas')
    return response.data
  },
}

// ============================================================================
// FUNÇÕES DE HEALTH CHECK
// ============================================================================

export const healthService = {
  /**
   * Verifica se a API está online
   */
  ping: async (): Promise<{ message: string }> => {
    const response = await api.get<{ message: string }>('/ping')
    return response.data
  },

  /**
   * Health check completo
   */
  health: async (): Promise<HealthCheckResponse> => {
    const response = await api.get<HealthCheckResponse>('/health')
    return response.data
  },
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default api
