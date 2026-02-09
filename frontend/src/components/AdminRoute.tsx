/**
 * Admin Route Protection
 * 
 * Componentes de proteção de rotas administrativas
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * Componente para proteger rotas administrativas
 * Verifica se o usuário está logado E se tem a role correta
 */
export const AdminRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/'
}) => {
  const token = localStorage.getItem('@BingoComunidade:token');
  const userStr = localStorage.getItem('@BingoComunidade:user');

  // Se não está logado, redireciona
  if (!token || !userStr) {
    return <Navigate to={redirectTo} replace />;
  }

  let user;
  let shouldRedirect = false;
  let redirectPath = redirectTo;
  
  try {
    user = JSON.parse(userStr);

    const userRole = user.nivel_acesso || user.tipo;

    // Verificar se a role do usuário está nas roles permitidas
    if (!allowedRoles.includes(userRole)) {
      console.error(`❌ Acesso negado! Role "${userRole}" não autorizada. Permitidas: ${allowedRoles.join(', ')}`);
      
      shouldRedirect = true;
      // Determinar para onde redirecionar baseado no tipo de usuário
      if (userRole === 'admin_site' || userRole === 'super_admin') {
        redirectPath = '/admin-site/dashboard';
      } else if (['admin_paroquia', 'paroquia_admin', 'paroquia_caixa', 'paroquia_recepcao', 'paroquia_bingo'].includes(userRole)) {
        redirectPath = '/admin-paroquia/dashboard';
      } else {
        redirectPath = '/dashboard';
      }
    }
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    shouldRedirect = true;
  }

  if (shouldRedirect) {
    return <Navigate to={redirectPath} replace />;
  }

  // Tudo ok, renderiza o componente
  return children;
};

/**
 * Proteção específica para SUPER_ADMIN
 */
export const SuperAdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return (
    <AdminRoute 
      allowedRoles={['admin_site', 'super_admin']} 
      redirectTo="/admin-site/login"
    >
      {children}
    </AdminRoute>
  );
};

/**
 * Proteção específica para Admins Paroquiais
 */
export const ParishAdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return (
    <AdminRoute 
      allowedRoles={['admin_paroquia', 'paroquia_admin', 'paroquia_caixa', 'paroquia_recepcao', 'paroquia_bingo']}
      redirectTo="/admin-paroquia/login"
    >
      {children}
    </AdminRoute>
  );
};

/**
 * Proteção para área pública (FIELs)
 */
export const PublicUserRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return (
    <AdminRoute 
      allowedRoles={['fiel', 'faithful']}
      redirectTo="/login"
    >
      {children}
    </AdminRoute>
  );
};
