/**
 * Hook de Inatividade - Segurança Nível Bancário
 * 
 * Monitora atividade do usuário e faz logout automático após período de inatividade.
 * Similar ao comportamento de aplicativos bancários.
 * 
 * Eventos monitorados:
 * - Movimento do mouse
 * - Cliques
 * - Teclas pressionadas
 * - Scroll da página
 * - Touch (mobile)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getAppConfigSync } from '../services/configService';

interface UseInactivityTimeoutProps {
  onTimeout: () => void;
  onWarning?: () => void;
}

export const useInactivityTimeout = ({ onTimeout, onWarning }: UseInactivityTimeoutProps) => {
  const config = getAppConfigSync();
  
  const timeoutIdRef = useRef<number | null>(null);
  const warningIdRef = useRef<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Limpar timers
  const clearTimers = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (warningIdRef.current) {
      clearTimeout(warningIdRef.current);
      warningIdRef.current = null;
    }
    setShowWarning(false);
  }, []);

  // Resetar timer de inatividade
  const resetTimer = useCallback(() => {
    clearTimers();

    // Calcular tempos em milissegundos
    const timeoutMs = config.inactivityTimeout * 60 * 1000;
    const warningMs = config.inactivityWarningMinutes * 60 * 1000;
    const warningStartMs = timeoutMs - warningMs;

    // Timer de aviso (mostra antes de deslogar)
    warningIdRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(config.inactivityWarningMinutes * 60);
      
      if (onWarning) {
        onWarning();
      }

      // Countdown do tempo restante
      const countdownInterval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }, warningStartMs);

    // Timer de logout
    timeoutIdRef.current = setTimeout(() => {
      onTimeout();
      clearTimers();
    }, timeoutMs);
  }, [config.inactivityTimeout, config.inactivityWarningMinutes, onTimeout, onWarning, clearTimers]);

  // Eventos que resetam o timer (indicam atividade)
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Adicionar listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Iniciar timer apenas uma vez
    const initialTimer = setTimeout(() => {
      resetTimer();
    }, 0);

    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      clearTimers();
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer, clearTimers]);

  return {
    showWarning,
    timeRemaining,
    resetTimer,
    clearTimers,
  };
};
