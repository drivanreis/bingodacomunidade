/**
 * Página Home
 * 
 * Página pública inicial do sistema
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>🎉 Bingo da Comunidade</h1>
        <p style={styles.subtitle}>
          Sistema completo de gestão de bingos para paróquias
        </p>
        <p style={styles.description}>
          Transparência, segurança e facilidade para sua comunidade
        </p>
        
        <div style={styles.buttonGroup}>
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')} 
              style={styles.primaryButton}
            >
              Ir para Dashboard
            </button>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')} 
                style={styles.primaryButton}
              >
                Fazer Login
              </button>
              <button 
                onClick={() => alert('Funcionalidade em desenvolvimento')} 
                style={styles.secondaryButton}
              >
                Criar Conta
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.features}>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>🔒</div>
          <h3 style={styles.featureTitle}>Segurança</h3>
          <p style={styles.featureText}>Autenticação JWT e criptografia de dados</p>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>👁️</div>
          <h3 style={styles.featureTitle}>Transparência</h3>
          <p style={styles.featureText}>Todos podem verificar os resultados</p>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>💰</div>
          <h3 style={styles.featureTitle}>Risco Zero</h3>
          <p style={styles.featureText}>Sistema de pagamento seguro via PIX</p>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>⚡</div>
          <h3 style={styles.featureTitle}>Tempo Real</h3>
          <p style={styles.featureText}>Acompanhe prêmios crescendo ao vivo</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '100px 20px',
    color: 'white',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  subtitle: {
    fontSize: '24px',
    margin: '0 0 10px 0',
    opacity: 0.95,
  },
  description: {
    fontSize: '18px',
    margin: '0 0 40px 0',
    opacity: 0.9,
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  primaryButton: {
    padding: '16px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#667eea',
    background: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  secondaryButton: {
    padding: '16px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    background: 'transparent',
    border: '2px solid white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, background 0.2s',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 20px',
  },
  feature: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center' as const,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 10px 0',
  },
  featureText: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    lineHeight: '1.6',
  },
}

export default Home

