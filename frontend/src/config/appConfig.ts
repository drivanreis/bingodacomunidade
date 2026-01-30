/**
 * Configurações Globais da Aplicação
 * 
 * Sistema de Bingo Comunitário - Segurança Nível Bancário
 * 
 * NOTA: As configurações agora são carregadas do banco de dados
 * através do serviço configService. Este arquivo mantém apenas
 * os tipos e valores padrão de fallback.
 */

export interface AppConfig {
  // ============================================================================
  // MENSAGENS E NOTIFICAÇÕES
  // ============================================================================
  
  /** Duração de exibição de mensagens de erro (em segundos) */
  errorMessageDuration: number;
  
  /** Duração de exibição de mensagens de sucesso (em segundos) */
  successMessageDuration: number;
  
  // ============================================================================
  // SEGURANÇA E AUTENTICAÇÃO (Nível Bancário)
  // ============================================================================
  
  /** Máximo de tentativas de login antes de bloquear temporariamente */
  maxLoginAttempts: number;
  
  /** Tempo de bloqueio após exceder tentativas (em minutos) */
  lockoutDuration: number;
  
  /** Tempo de validade do token JWT (em horas) - Máximo 16 horas */
  tokenExpirationHours: number;
  
  /** Tempo de inatividade antes de logout automático (em minutos) */
  inactivityTimeout: number;
  
  /** Avisar usuário X minutos antes de logout por inatividade */
  inactivityWarningMinutes: number;
  
  // ============================================================================
  // CARRINHO DE CARTELAS
  // ============================================================================
  
  /** Tempo máximo que cartelas não pagas ficam no carrinho (em minutos) */
  cartExpirationMinutes: number;
  
  /** Limpar automaticamente carrinhos de jogos que já iniciaram */
  autoCleanExpiredCarts: boolean;
  
  /** Limpar automaticamente carrinhos de jogos finalizados */
  autoCleanFinishedGameCarts: boolean;
  
  // ============================================================================
  // FORMULÁRIOS E RASCUNHOS
  // ============================================================================
  
  /** Avisar ao sair de formulário não salvo */
  warnOnUnsavedForm: boolean;
  
  /** Salvar rascunho automaticamente a cada X segundos (0 = desabilitado) */
  autoSaveDraftSeconds: number;
  
  // ============================================================================
  // RECUPERAÇÃO DE SENHA
  // ============================================================================
  
  /** Tempo de validade do token de recuperação de senha (em minutos) */
  passwordResetTokenMinutes: number;
  
  /** Tempo de validade do token de verificação de email (em horas) */
  emailVerificationTokenHours: number;
}

/**
 * Configurações padrão do sistema - SEGURANÇA NÍVEL BANCÁRIO
 * 
 * Estas configurações servem como fallback caso o backend esteja indisponível.
 * As configurações reais são carregadas do banco de dados via API.
 * 
 * IMPORTANTE: Para alterar configurações, use o painel de administração
 * em /admin-site/settings (apenas Super Admin tem acesso).
 */
export const defaultConfig: AppConfig = {
  // ============================================================================
  // MENSAGENS E NOTIFICAÇÕES
  // ============================================================================
  
  errorMessageDuration: 3.0,  // 3 segundos
  successMessageDuration: 2.0,  // 2 segundos
  
  // ============================================================================
  // SEGURANÇA E AUTENTICAÇÃO (Nível Bancário)
  // ============================================================================
  
  maxLoginAttempts: 5,  // Após 5 tentativas erradas, bloqueia
  lockoutDuration: 15,  // Bloqueio de 15 minutos (padrão bancário)
  
  tokenExpirationHours: 16,  // Token JWT válido por 16 horas (máximo seguro)
  
  inactivityTimeout: 15,  // Logout após 15 minutos de inatividade
  inactivityWarningMinutes: 2,  // Avisa 2 minutos antes de deslogar
  
  // ============================================================================
  // CARRINHO DE CARTELAS
  // ============================================================================
  
  cartExpirationMinutes: 30,  // Cartelas não pagas expiram em 30 minutos
  
  autoCleanExpiredCarts: true,  // Limpa carrinhos de jogos que já iniciaram
  autoCleanFinishedGameCarts: true,  // Limpa carrinhos de jogos finalizados
  
  // ============================================================================
  // FORMULÁRIOS E RASCUNHOS
  // ============================================================================
  
  warnOnUnsavedForm: true,  // Avisa "Tem certeza que quer sair?"
  autoSaveDraftSeconds: 0,  // Desabilitado (0) - não salva rascunho auto
  
  // ============================================================================
  // RECUPERAÇÃO DE SENHA
  // ============================================================================
  
  passwordResetTokenMinutes: 30,  // Token de recuperação válido por 30 min
  emailVerificationTokenHours: 24,  // Token de email válido por 24 horas
};

/**
 * Obtém a configuração atual
 * 
 * IMPORTANTE: Esta função agora apenas retorna o fallback.
 * Use configService.getAppConfig() para buscar do backend.
 * 
 * @deprecated Use configService.getAppConfig() para buscar configurações do backend
 */
export const getAppConfig = (): AppConfig => {
  console.warn('appConfig.getAppConfig() está deprecated. Use configService.getAppConfig()');
  return defaultConfig;
};

/**
 * Atualiza configurações (DEPRECATED)
 * 
 * @deprecated As configurações agora são gerenciadas via API backend.
 * Use o painel de administração em /admin-site/settings
 */
export const updateAppConfig = (newConfig: Partial<AppConfig>): void => {
  console.error('updateAppConfig() está deprecated. Use o painel de administração /admin-site/settings');
};
