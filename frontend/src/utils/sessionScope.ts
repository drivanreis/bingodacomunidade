export type SessionScope = 'public' | 'admin_site' | 'admin_paroquia';

const SESSION_SCOPE_KEY = '@BingoComunidade:session_scope';

const normalizeToken = (value: unknown): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const setSessionScope = (scope: SessionScope) => {
  localStorage.setItem(SESSION_SCOPE_KEY, scope);
};

export const getSessionScope = (): SessionScope | null => {
  const raw = localStorage.getItem(SESSION_SCOPE_KEY);
  if (raw === 'public' || raw === 'admin_site' || raw === 'admin_paroquia') {
    return raw;
  }
  return null;
};

export const clearSessionScope = () => {
  localStorage.removeItem(SESSION_SCOPE_KEY);
};

export const resolveScopeFromRole = (role: unknown): SessionScope => {
  const normalized = normalizeToken(role);

  if (normalized === 'admin_site' || normalized === 'super_admin') {
    return 'admin_site';
  }

  if (
    [
      'admin_paroquia',
      'parish_admin',
      'paroquia_admin',
      'paroquia_caixa',
      'paroquia_recepcao',
      'paroquia_bingo',
      'usuario_administrativo',
      'usuario_administrador',
    ].includes(normalized)
  ) {
    return 'admin_paroquia';
  }

  return 'public';
};

export const resolveDashboardPath = (role: unknown, fallbackScope?: SessionScope | null): string => {
  const scope = fallbackScope || resolveScopeFromRole(role);

  if (scope === 'admin_site') {
    return '/admin-site/dashboard';
  }
  if (scope === 'admin_paroquia') {
    return '/admin-paroquia/dashboard';
  }
  return '/dashboard';
};

export const resolveGamesPath = (role: unknown, fallbackScope?: SessionScope | null): string => {
  const scope = fallbackScope || resolveScopeFromRole(role);
  if (scope === 'admin_paroquia') {
    return '/admin-paroquia/games';
  }
  return '/games';
};

export const resolveGameDetailPath = (
  role: unknown,
  gameId: string,
  fallbackScope?: SessionScope | null
): string => {
  const basePath = resolveGamesPath(role, fallbackScope);
  return `${basePath}/${gameId}`;
};
