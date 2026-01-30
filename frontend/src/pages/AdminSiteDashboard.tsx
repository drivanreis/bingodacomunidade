/**
 * Admin Site Dashboard
 * 
 * Dashboard EXCLUSIVO para SUPER_ADMIN
 * Rota: /admin-site/dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  nome: string;
  email: string;
  tipo: string;
}

const AdminSiteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalUsuariosParoquia: 0,
    totalUsuariosPublicos: 0,
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
      if (userData.tipo !== 'super_admin') {
        alert('❌ Acesso negado! Esta área é exclusiva para Super Administradores.');
        navigate('/');
        return;
      }
      
      setUser(userData);
    } else {
      navigate('/admin-site/login');
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/usuarios');
      const usuarios = response.data;
      
      setStats({
        totalUsuariosParoquia: usuarios.filter((u: { tipo: string }) => 
          u.tipo.includes('paroquia_')
        ).length,
        totalUsuariosPublicos: usuarios.filter((u: { tipo: string }) => 
          u.tipo === 'usuario_publico'
        ).length,
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
    navigate('/admin-site/login');
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
          <h1 style={styles.title}>👑 Admin Site - Dashboard</h1>
          <p style={styles.subtitle}>Gerenciamento Central do Sistema</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.nome}</span>
            <span style={styles.userRole}>Super Admin</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            🚪 Sair
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.totalUsuariosParoquia}</span>
            <span style={styles.statLabel}>Usuários da Paróquia</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🙏</div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.totalUsuariosPublicos}</span>
            <span style={styles.statLabel}>Fiéis Cadastrados</span>
          </div>
        </div>
      </div>

      {/* MAIN ACTIONS */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🛠️ Gerenciamento</h2>
        <div style={styles.actionsGrid}>
          <button style={styles.actionCard} onClick={() => navigate('/admin-site/paroquias')}>
            <div style={styles.actionIcon}>⛪</div>
            <h3 style={styles.actionTitle}>Configurar Paróquia</h3>
            <p style={styles.actionDesc}>Editar dados cadastrais da paróquia</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/admin-site/usuarios')}>
            <div style={styles.actionIcon}>👤</div>
            <h3 style={styles.actionTitle}>Gerenciar Usuários da Paróquia</h3>
            <p style={styles.actionDesc}>Administrar equipe da paróquia (admins, operadores, caixa, vendedores)</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/admin-site/relatorios')}>
            <div style={styles.actionIcon}>📊</div>
            <h3 style={styles.actionTitle}>Relatórios</h3>
            <p style={styles.actionDesc}>Visualizar estatísticas completas do sistema</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/admin-site/configuracoes')}>
            <div style={styles.actionIcon}>⚙️</div>
            <h3 style={styles.actionTitle}>Configurações</h3>
            <p style={styles.actionDesc}>Configurações globais do sistema</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/admin-site/auditoria')}>
            <div style={styles.actionIcon}>🔐</div>
            <h3 style={styles.actionTitle}>Auditoria</h3>
            <p style={styles.actionDesc}>Logs e rastreamento de ações</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/admin-site/feedback')}>
            <div style={styles.actionIcon}>💬</div>
            <h3 style={styles.actionTitle}>Feedback</h3>
            <p style={styles.actionDesc}>Sistema de satisfação e sugestões</p>
          </button>
        </div>
      </div>

      {/* SECURITY NOTICE */}
      <div style={styles.securityNotice}>
        <span style={styles.securityIcon}>🔒</span>
        <div>
          <strong>Área Restrita:</strong> Você está acessando o painel de administração central.
          Todas as ações são registradas e auditadas.
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
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
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
    color: '#1e3c72',
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
    color: '#1e3c72',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  actionDesc: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  securityNotice: {
    margin: '0 40px 40px',
    padding: '20px',
    background: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: '14px',
    color: '#856404',
  } as React.CSSProperties,
  securityIcon: {
    fontSize: '24px',
  },
};

export default AdminSiteDashboard;
