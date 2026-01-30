import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'Super Administrador',
      parish_admin: 'Administrador Paroquial',
      faithful: 'Fiel',
    };
    return roles[role] || role;
  };

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.header}>
        <h1 style={styles.title}>🎉 Dashboard - Bingo da Comunidade</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>👤 Informações do Usuário</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Nome:</span>
              <span style={styles.infoValue}>{user?.name}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email:</span>
              <span style={styles.infoValue}>{user?.email || 'Não informado'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Perfil:</span>
              <span style={styles.infoBadge}>{getRoleName(user?.role || '')}</span>
            </div>
            {user?.cpf && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>CPF:</span>
                <span style={styles.infoValue}>{user.cpf}</span>
              </div>
            )}
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>ID:</span>
              <span style={styles.infoValue}>{user?.id}</span>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} style={styles.linkButton}>
            Editar Perfil →
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🎯 Ações Rápidas</h2>
          <div style={styles.actionsGrid}>
            <button onClick={() => navigate('/games')} style={styles.actionCard}>
              <div style={styles.actionIcon}>🎉</div>
              <h3 style={styles.actionTitle}>Ver Jogos</h3>
              <p style={styles.actionDesc}>Explore e participe dos jogos</p>
            </button>
            
            {(user?.role === 'super_admin' || user?.role === 'parish_admin') && (
              <button onClick={() => navigate('/games/new')} style={styles.actionCard}>
                <div style={styles.actionIcon}>➕</div>
                <h3 style={styles.actionTitle}>Criar Jogo</h3>
                <p style={styles.actionDesc}>Agende um novo bingo</p>
              </button>
            )}
            
            <button onClick={() => navigate('/profile')} style={styles.actionCard}>
              <div style={styles.actionIcon}>👤</div>
              <h3 style={styles.actionTitle}>Meu Perfil</h3>
              <p style={styles.actionDesc}>Edite suas informações</p>
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🚀 Funcionalidades Disponíveis</h2>
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>✅</span>
              <div>
                <h3 style={styles.featureTitle}>Autenticação JWT</h3>
                <p style={styles.featureDesc}>Sistema de login seguro implementado</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>✅</span>
              <div>
                <h3 style={styles.featureTitle}>Perfis de Usuário</h3>
                <p style={styles.featureDesc}>Super Admin, Parish Admin e Fiel</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🔄</span>
              <div>
                <h3 style={styles.featureTitle}>Gestão de Jogos</h3>
                <p style={styles.featureDesc}>Em desenvolvimento</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🔄</span>
              <div>
                <h3 style={styles.featureTitle}>Compra de Cartelas</h3>
                <p style={styles.featureDesc}>Em desenvolvimento</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🔄</span>
              <div>
                <h3 style={styles.featureTitle}>Sistema de Sorteio</h3>
                <p style={styles.featureDesc}>Em desenvolvimento</p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📊 Status do Sistema</h2>
          <div style={styles.statusGrid}>
            <div style={styles.statusItem}>
              <div style={{...styles.statusDot, background: '#4caf50'}}></div>
              <span>Backend API: Operacional</span>
            </div>
            <div style={styles.statusItem}>
              <div style={{...styles.statusDot, background: '#4caf50'}}></div>
              <span>Banco de Dados: Conectado</span>
            </div>
            <div style={styles.statusItem}>
              <div style={{...styles.statusDot, background: '#4caf50'}}></div>
              <span>Autenticação: Ativa</span>
            </div>
            <div style={styles.statusItem}>
              <div style={{...styles.statusDot, background: '#ff9800'}}></div>
              <span>Frontend: Em Desenvolvimento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  header: {
    padding: '40px 40px 20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  content: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginTop: 0,
    marginBottom: '20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
  },
  infoValue: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500',
  },
  infoBadge: {
    fontSize: '14px',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '6px 12px',
    borderRadius: '20px',
    display: 'inline-block',
    fontWeight: '500',
  },
  linkButton: {
    marginTop: '20px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#667eea',
    background: 'transparent',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  actionCard: {
    padding: '30px 20px',
    background: '#f8f9fa',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center' as const,
  },
  actionIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  actionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 10px 0',
  },
  actionDesc: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  featureItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: '24px',
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 4px 0',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#333',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
};

export default Dashboard;
