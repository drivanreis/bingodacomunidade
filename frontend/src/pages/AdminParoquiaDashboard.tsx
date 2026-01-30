/**
 * Admin Paróquia Dashboard
 * 
 * Dashboard para Administradores Paroquiais
 * Rota: /admin-paroquia/dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  paroquia_id: string;
}

const AdminParoquiaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    jogosAtivos: 0,
    jogosFinalizados: 0,
    totalVendas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = () => {
    const storedUser = localStorage.getItem('@BingoComunidade:user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      
      // VERIFICAÇÃO DE SEGURANÇA
      const paroquialRoles = ['paroquia_admin', 'paroquia_caixa', 'paroquia_recepcao', 'paroquia_bingo'];
      if (!paroquialRoles.includes(userData.tipo)) {
        alert('❌ Acesso negado! Esta área é exclusiva para administradores paroquiais.');
        navigate('/');
        return;
      }
      
      setUser(userData);
    } else {
      navigate('/admin-paroquia/login');
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Implementar endpoints de estatísticas
      setStats({
        jogosAtivos: 0,
        jogosFinalizados: 0,
        totalVendas: 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@BingoComunidade:token');
    localStorage.removeItem('@BingoComunidade:user');
    sessionStorage.clear();
    delete api.defaults.headers.common['Authorization'];
    navigate('/admin-paroquia/login');
  };

  const getRoleName = (tipo: string) => {
    const roles: Record<string, string> = {
      paroquia_admin: 'Administrador',
      paroquia_caixa: 'Caixa',
      paroquia_recepcao: 'Recepção',
      paroquia_bingo: 'Coordenador de Bingo',
    };
    return roles[tipo] || tipo;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>🔄</div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>⛪ Admin Paróquia - Dashboard</h1>
          <p style={styles.subtitle}>Gerenciamento Paroquial</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.nome}</span>
            <span style={styles.userRole}>{getRoleName(user?.tipo || '')}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            🚪 Sair
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎉</div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.jogosAtivos}</span>
            <span style={styles.statLabel}>Jogos Ativos</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.jogosFinalizados}</span>
            <span style={styles.statLabel}>Jogos Finalizados</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>R$ {stats.totalVendas.toFixed(2)}</span>
            <span style={styles.statLabel}>Total em Vendas</span>
          </div>
        </div>
      </div>

      {/* MAIN ACTIONS */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎯 Ações Rápidas</h2>
        <div style={styles.actionsGrid}>
          <button style={styles.actionCard} onClick={() => alert('Em desenvolvimento')}>
            <div style={styles.actionIcon}>➕</div>
            <h3 style={styles.actionTitle}>Criar Novo Jogo</h3>
            <p style={styles.actionDesc}>Agendar um novo bingo</p>
          </button>

          <button style={styles.actionCard} onClick={() => alert('Em desenvolvimento')}>
            <div style={styles.actionIcon}>🎉</div>
            <h3 style={styles.actionTitle}>Jogos Ativos</h3>
            <p style={styles.actionDesc}>Ver e gerenciar jogos em andamento</p>
          </button>

          <button style={styles.actionCard} onClick={() => alert('Em desenvolvimento')}>
            <div style={styles.actionIcon}>💳</div>
            <h3 style={styles.actionTitle}>Controle de Caixa</h3>
            <p style={styles.actionDesc}>Gerenciar vendas e pagamentos</p>
          </button>

          <button style={styles.actionCard} onClick={() => alert('Em desenvolvimento')}>
            <div style={styles.actionIcon}>📊</div>
            <h3 style={styles.actionTitle}>Relatórios</h3>
            <p style={styles.actionDesc}>Estatísticas da paróquia</p>
          </button>

          <button style={styles.actionCard} onClick={() => alert('Em desenvolvimento')}>
            <div style={styles.actionIcon}>🎫</div>
            <h3 style={styles.actionTitle}>Cartelas</h3>
            <p style={styles.actionDesc}>Gerenciar cartelas vendidas</p>
          </button>

          <button style={styles.actionCard} onClick={() => alert('Em desenvolvimento')}>
            <div style={styles.actionIcon}>👥</div>
            <h3 style={styles.actionTitle}>Participantes</h3>
            <p style={styles.actionDesc}>Lista de fiéis cadastrados</p>
          </button>
        </div>
      </div>

      {/* ROLE-SPECIFIC ACTIONS */}
      {user?.tipo === 'paroquia_admin' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔧 Administração</h2>
          <div style={styles.actionsGrid}>
            <button style={styles.actionCard} onClick={() => alert('Em desenvolvimento')}>
              <div style={styles.actionIcon}>⚙️</div>
              <h3 style={styles.actionTitle}>Configurações</h3>
              <p style={styles.actionDesc}>Configurar paróquia e rateios</p>
            </button>

            <button style={styles.actionCard} onClick={() => alert('Em desenvolvimento')}>
              <div style={styles.actionIcon}>👤</div>
              <h3 style={styles.actionTitle}>Usuários</h3>
              <p style={styles.actionDesc}>Gerenciar equipe paroquial</p>
            </button>
          </div>
        </div>
      )}

      {/* INFO NOTICE */}
      <div style={styles.infoNotice}>
        <span style={styles.infoIcon}>ℹ️</span>
        <div>
          <strong>Paróquia:</strong> Você está gerenciando a paróquia ID: {user?.paroquia_id}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '0',
  } as React.CSSProperties,
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
  spinner: {
    fontSize: '48px',
    animation: 'spin 2s linear infinite',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '30px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  } as React.CSSProperties,
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '5px',
  },
  userName: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: '12px',
    opacity: 0.8,
  },
  logoutButton: {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid white',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    padding: '40px',
  } as React.CSSProperties,
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  statIcon: {
    fontSize: '48px',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  section: {
    padding: '0 40px 40px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  actionCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    textAlign: 'left' as const,
    border: '2px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  actionIcon: {
    fontSize: '40px',
    marginBottom: '15px',
  },
  actionTitle: {
    fontSize: '18px',
    color: '#667eea',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  actionDesc: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  infoNotice: {
    margin: '0 40px 40px',
    padding: '20px',
    background: '#e3f2fd',
    border: '2px solid #2196f3',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: '14px',
    color: '#0d47a1',
  } as React.CSSProperties,
  infoIcon: {
    fontSize: '24px',
  },
};

export default AdminParoquiaDashboard;
