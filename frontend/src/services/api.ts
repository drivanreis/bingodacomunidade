/**
 * Serviço de API - Cliente HTTP para comunicação com Backend
 * 
 * Sistema Monolítico: Uma paróquia por instalação
 * Backend: FastAPI rodando em http://localhost:8000
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
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
    // Se 401 Unauthorized, limpa token e redireciona para login
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }

    // Retorna mensagem de erro estruturada
    const errorMessage = error.response?.data?.detail || 'Erro desconhecido'
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
    const response = await api.post<TokenResponse>('/auth/login', data)
    const { access_token, usuario } = response.data

    // Salva token e dados do usuário no localStorage
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('usuario', JSON.stringify(usuario))

    return response.data
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
