/**
 * Tipos TypeScript para o Sistema de Bingo Comunitário
 * Reflete os schemas do backend (FastAPI + Pydantic)
 */

// ============================================================================
// TIPOS
// ============================================================================

export type TipoUsuario = 'super_admin' | 'parish_admin' | 'fiel';

export const TipoUsuario = {
  SUPER_ADMIN: 'super_admin' as const,
  PARISH_ADMIN: 'parish_admin' as const,
  FIEL: 'fiel' as const,
};

export type StatusSorteio = 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';

export const StatusSorteio = {
  AGENDADO: 'agendado' as const,
  EM_ANDAMENTO: 'em_andamento' as const,
  FINALIZADO: 'finalizado' as const,
  CANCELADO: 'cancelado' as const,
};

export type StatusCartela = 'ativa' | 'vencedora' | 'perdedora';

export const StatusCartela = {
  ATIVA: 'ativa' as const,
  VENCEDORA: 'vencedora' as const,
  PERDEDORA: 'perdedora' as const,
};

// ============================================================================
// INTERFACES - PARÓQUIA
// ============================================================================

export interface Paroquia {
  id: string
  nome: string
  email: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  chave_pix: string
  ativa: boolean
  criado_em: string
  atualizado_em: string
}

// ============================================================================
// INTERFACES - USUÁRIO
// ============================================================================

export interface Usuario {
  id: string
  nome: string
  cpf?: string
  email?: string
  whatsapp?: string
  tipo: TipoUsuario
  paroquia_id?: string
  chave_pix?: string
  ativo: boolean
  criado_em: string
  ultimo_acesso?: string
}

export interface SignupRequest {
  nome: string
  cpf: string
  whatsapp: string
  chave_pix: string
  senha: string
}

export interface LoginRequest {
  cpf?: string
  email?: string
  login?: string
  senha: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  usuario: Usuario
}

// ============================================================================
// INTERFACES - SORTEIO (BINGO)
// ============================================================================

export interface Sorteio {
  id: string
  paroquia_id: string
  titulo: string
  descricao?: string
  valor_cartela: number
  rateio_premio: number
  rateio_paroquia: number
  rateio_operacao: number
  rateio_evolucao: number
  status: StatusSorteio
  total_arrecadado: number
  total_premio: number
  total_cartelas_vendidas: number
  inicio_vendas: string
  fim_vendas: string
  horario_sorteio: string
  pedras_sorteadas?: number[]
  hash_integridade?: string
  vencedores_ids: string[]
  criado_em: string
  atualizado_em: string
  iniciado_em?: string
  finalizado_em?: string
}

export interface SorteioCreate {
  paroquia_id: string
  titulo: string
  descricao?: string
  valor_cartela: number
  rateio_premio: number
  rateio_paroquia: number
  rateio_operacao: number
  rateio_evolucao: number
  inicio_vendas: string
  fim_vendas: string
  horario_sorteio: string
}

// ============================================================================
// INTERFACES - CARTELA
// ============================================================================

export interface Cartela {
  id: string
  sorteio_id: string
  usuario_id: string
  numeros: number[][]  // Matriz 5x5
  numeros_marcados: number[]
  status: StatusCartela
  valor_premio?: number
  criado_em: string
}

// ============================================================================
// INTERFACES - API RESPONSES
// ============================================================================

export interface HealthCheckResponse {
  status: string
  timestamp_fortaleza: string
  timezone: string
}

export interface ApiError {
  detail: string
}
