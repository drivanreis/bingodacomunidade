import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import { limparItensExpirados } from '../utils/carrinhoManager';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'parish_admin' | 'faithful';
  cpf?: string;
  parish_id?: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identificador: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  showInactivityWarning: boolean;
  timeRemaining: number;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveLogoutRedirect = () => {
    const currentPath = window.location.pathname || '/';

    if (currentPath.startsWith('/admin-site')) {
      return '/admin-site/login';
    }

    if (currentPath.startsWith('/admin-paroquia')) {
      return '/admin-paroquia/login';
    }

    return '/login';
  };

  const logout = () => {
    console.log('🔒 Executando logout completo...');
    
    // 1. Limpar estado do React
    setUser(null);
    setToken(null);
    
    // 2. Limpar COMPLETAMENTE localStorage
    localStorage.removeItem('@BingoComunidade:token');
    localStorage.removeItem('@BingoComunidade:user');
    // Limpar qualquer outro item relacionado
    Object.keys(localStorage).forEach(key => {
      if (key.includes('@BingoComunidade') || key.includes('carrinho')) {
        localStorage.removeItem(key);
      }
    });
    
    // 3. Limpar COMPLETAMENTE sessionStorage
    sessionStorage.clear();
    
    // 4. Remover header de autorização da API
    delete api.defaults.headers.common['Authorization'];
    
    // 5. Limpar cookies (se houver)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // 6. Forçar reload completo (limpa cache do navegador)
    console.log('✅ Logout concluído - redirecionando...');
    window.location.replace(resolveLogoutRedirect());
  };

  // Monitoramento de inatividade (apenas se estiver autenticado)
  const { showWarning: showInactivityWarning, timeRemaining } = useInactivityTimeout({
    onTimeout: () => {
      const hasSession = !!localStorage.getItem('@BingoComunidade:token');
      if (!hasSession) {
        return;
      }
      console.log('🔒 Logout por inatividade');
      logout();
    },
    onWarning: () => {
      console.warn('⚠️ Aviso: você será desconectado em breve por inatividade');
    },
  });

  useEffect(() => {
    // Recuperar token do localStorage ao iniciar
    const storedToken = localStorage.getItem('@BingoComunidade:token');
    const storedUser = localStorage.getItem('@BingoComunidade:user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      
      // Converter dados do backend (português) para o formato do contexto (inglês)
      const usuarioData = JSON.parse(storedUser);
      setUser({
        id: usuarioData.id,
        name: usuarioData.nome || '',
        email: usuarioData.email || '',
        role: usuarioData.tipo,
        cpf: usuarioData.cpf,
        parish_id: usuarioData.paroquia_id
      });
      
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    setLoading(false);

    // Limpar carrinho de itens expirados ao iniciar
    limparItensExpirados();

    // Limpar carrinho a cada 1 minuto
    const carrinhoInterval = setInterval(limparItensExpirados, 60000);

    return () => clearInterval(carrinhoInterval);
  }, []);

  const login = async (identificador: string, password: string) => {
    try {
      const payload = identificador.includes('@')
        ? { email: identificador, senha: password }
        : { cpf: identificador, senha: password };

      const response = await api.post('/auth/login', payload);

      const { access_token, usuario } = response.data;

      // Salvar no estado e localStorage
      setToken(access_token);
      setUser({
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email || '',
        role: usuario.tipo,
        cpf: usuario.cpf,
        parish_id: usuario.paroquia_id
      });
      
      localStorage.setItem('@BingoComunidade:token', access_token);
      localStorage.setItem('@BingoComunidade:user', JSON.stringify(usuario));
      
      // Configurar token para próximas requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      throw new Error(error.response?.data?.detail || 'Erro ao fazer login');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Atualizar localStorage com os dados em português
      const usuarioData = {
        id: updatedUser.id,
        nome: updatedUser.name,
        email: updatedUser.email,
        tipo: updatedUser.role,
        cpf: updatedUser.cpf,
        paroquia_id: updatedUser.parish_id
      };
      localStorage.setItem('@BingoComunidade:user', JSON.stringify(usuarioData));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token,
        showInactivityWarning: (!!token || !!localStorage.getItem('@BingoComunidade:token')) && showInactivityWarning,
        timeRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
