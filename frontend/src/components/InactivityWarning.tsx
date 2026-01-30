/**
 * Modal de Aviso de Inatividade
 * 
 * Avisa o usuário antes de fazer logout automático por inatividade.
 * Similar ao comportamento de aplicativos bancários.
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const InactivityWarning: React.FC = () => {
  const { showInactivityWarning, timeRemaining } = useAuth();

  if (!showInactivityWarning) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.icon}>⚠️</div>
        <h2 style={styles.title}>Sessão Expirando</h2>
        <p style={styles.message}>
          Por segurança, você será desconectado automaticamente em:
        </p>
        <div style={styles.countdown}>{formatTime(timeRemaining)}</div>
        <p style={styles.hint}>
          Mova o mouse ou pressione qualquer tecla para continuar conectado.
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
  },
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  countdown: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: '20px',
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
  },
};
