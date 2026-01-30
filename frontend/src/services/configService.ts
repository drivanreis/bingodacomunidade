/**
 * Serviço de Configurações do Sistema
 * 
 * Busca configurações dinâmicas do backend e fornece
 * interface para o restante da aplicação acessá-las.
 */

import api from './api';

interface ConfiguracaoBackend {
  chave: string;
  valor: string;
  tipo: 'number' | 'boolean' | 'string';
  categoria: string;
  descricao: string;
}

interface AppConfig {
  // MENSAGENS E NOTIFICAÇÕES
  errorMessageDuration: number;
  successMessageDuration: number;
  
  // SEGURANÇA E AUTENTICAÇÃO
  maxLoginAttempts: number;
  lockoutDuration: number;
  tokenExpirationHours: number;
  inactivityTimeout: number;
  inactivityWarningMinutes: number;
  
  // CARRINHO DE CARTELAS
  cartExpirationMinutes: number;
  autoCleanExpiredCarts: boolean;
  autoCleanFinishedGameCarts: boolean;
  
  // FORMULÁRIOS E RASCUNHOS
  warnOnUnsavedForm: boolean;
  autoSaveDraftSeconds: number;
  
  // RECUPERAÇÃO DE SENHA
  passwordResetTokenMinutes: number;
  emailVerificationTokenHours: number;
}

let cachedConfig: AppConfig | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60000; // 1 minuto

/**
 * Valores padrão de fallback
 * Usados se o backend estiver indisponível
 */
const defaultConfig: AppConfig = {
  errorMessageDuration: 3.0,
  successMessageDuration: 2.0,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  tokenExpirationHours: 16,
  inactivityTimeout: 15,
  inactivityWarningMinutes: 2,
  cartExpirationMinutes: 30,
  autoCleanExpiredCarts: true,
  autoCleanFinishedGameCarts: true,
  warnOnUnsavedForm: true,
  autoSaveDraftSeconds: 0,
  passwordResetTokenMinutes: 30,
  emailVerificationTokenHours: 24,
};

/**
 * Converte valor string do backend para o tipo correto
 */
function parseValue(valor: string, tipo: string): any {
  switch (tipo) {
    case 'number':
      return parseFloat(valor);
    case 'boolean':
      return valor === 'true';
    default:
      return valor;
  }
}

/**
 * Busca configurações do backend
 */
export async function fetchConfig(): Promise<AppConfig> {
  try {
    const response = await api.get('/configuracoes');
    const configs: ConfiguracaoBackend[] = response.data;
    
    const parsedConfig: any = {};
    
    configs.forEach(config => {
      parsedConfig[config.chave] = parseValue(config.valor, config.tipo);
    });
    
    // Mescla com valores padrão (caso alguma config esteja faltando)
    return { ...defaultConfig, ...parsedConfig };
  } catch (error) {
    console.warn('Erro ao buscar configurações do backend, usando valores padrão:', error);
    return defaultConfig;
  }
}

/**
 * Obtém configurações (com cache)
 */
export async function getAppConfig(): Promise<AppConfig> {
  const now = Date.now();
  
  // Se tem cache válido, retorna
  if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedConfig;
  }
  
  // Busca do backend
  cachedConfig = await fetchConfig();
  lastFetchTime = now;
  
  return cachedConfig;
}

/**
 * Invalida o cache (força nova busca na próxima chamada)
 */
export function invalidateConfigCache(): void {
  cachedConfig = null;
  lastFetchTime = 0;
}

/**
 * Obtém configurações de forma síncrona (retorna cache ou default)
 * Use apenas quando não puder esperar pela Promise
 */
export function getAppConfigSync(): AppConfig {
  return cachedConfig || defaultConfig;
}
