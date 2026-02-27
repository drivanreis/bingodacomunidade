import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSessionScope, resolveDashboardPath } from '../utils/sessionScope';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const persistedToken = localStorage.getItem('@BingoComunidade:token');
  const persistedUserRaw = localStorage.getItem('@BingoComunidade:user');
  let persistedUser: any = null;
  try {
    persistedUser = persistedUserRaw ? JSON.parse(persistedUserRaw) : null;
  } catch {
    persistedUser = null;
  }
  const hasAuthenticatedSession = isAuthenticated || !!persistedToken;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!hasAuthenticatedSession) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/dashboard') {
    const role = persistedUser?.tipo || persistedUser?.nivel_acesso;
    const sessionScope = getSessionScope();
    const expectedDashboard = resolveDashboardPath(role, sessionScope);
    if (expectedDashboard !== '/dashboard') {
      return <Navigate to={expectedDashboard} replace />;
    }
  }

  return <>{children}</>;
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default PrivateRoute;
