/**
 * Componente que verifica se o sistema precisa de configuração inicial (primeiro acesso).
 * 
 * ⚠️ DESATIVADO TEMPORARIAMENTE
 * O novo backend usa POST /auth/bootstrap que cuida automaticamente do controle.
 * Este componente será reimplementado quando o backend tiver um endpoint de verificação.
 */
export const FirstAccessChecker: React.FC = () => {
  // TODO: Implementar verificação de primeiro acesso quando backend tiver endpoint
  // Por enquanto, apenas retorna null (não faz nada)
  return null;
};
