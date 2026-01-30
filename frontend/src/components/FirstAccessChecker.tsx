import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

/**
 * Componente que verifica se o sistema precisa de configuração inicial (primeiro acesso).
 * 
 * Lógica:
 * - Na inicialização do app, chama GET /auth/first-access
 * - Se needs_setup = true, redireciona para /first-access-setup
 * - Se needs_setup = false, não faz nada (sistema já configurado)
 * 
 * Executado apenas uma vez ao carregar o app.
 */
export const FirstAccessChecker: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkedOnce, setCheckedOnce] = useState(false);

  useEffect(() => {
    // Evitar checagens múltiplas
    if (checkedOnce) return;

    // Se já está na rota de setup, não fazer nada
    if (location.pathname === '/first-access-setup') {
      // Usar setTimeout para evitar setState síncrono no effect
      setTimeout(() => setCheckedOnce(true), 0);
      return;
    }

    const checkFirstAccess = async () => {
      try {
        const response = await api.get('/auth/first-access');
        
        if (response.data.needs_setup === true) {
          // Sistema precisa de configuração, redirecionar
          navigate('/first-access-setup', { replace: true });
        }
        
        // setState após operação assíncrona está OK
        setCheckedOnce(true);
      } catch (error) {
        // Em caso de erro, não faz nada (permite usar o sistema normalmente)
        console.error('Erro ao verificar primeiro acesso:', error);
        setCheckedOnce(true);
      }
    };

    checkFirstAccess();
  }, [checkedOnce, location.pathname, navigate]);

  // Este componente não renderiza nada
  return null;
};
