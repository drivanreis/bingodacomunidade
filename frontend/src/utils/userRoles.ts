const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrador',
  admin_site: 'Administrador do Site',
  usuario_publico: 'Usuário Comum',
  fiel: 'Fiel',
  faithful: 'Fiel',
  parish_admin: 'Administrador Paroquial',
  paroquia_admin: 'Administrador',
  paroquia_caixa: 'Caixa',
  paroquia_recepcao: 'Porteiro / Zelador',
  paroquia_porteiro: 'Porteiro / Zelador',
  paroquia_zelador: 'Porteiro / Zelador',
  paroquia_operador: 'Porteiro / Zelador',
  paroquia_bingo: 'Gerente / Regente',
  paroquia_gerente: 'Gerente / Regente',
  paroquia_vendedor: 'Gerente / Regente',
};

const formatFallbackRole = (value: string) =>
  value
    .replace(/^paroquia_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getHumanRoleLabel = (role: string): string => {
  if (!role) {
    return '';
  }

  const normalizedRole = role.toLowerCase();
  if (ROLE_LABELS[normalizedRole]) {
    return ROLE_LABELS[normalizedRole];
  }

  return formatFallbackRole(normalizedRole);
};
