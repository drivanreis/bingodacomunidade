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
  login?: string;
  email: string;
  tipo: string;
}

const AdminSiteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1366,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });
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

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadUserData = () => {
    const storedUser = localStorage.getItem('@BingoComunidade:user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      const role = userData.nivel_acesso || userData.tipo;
      
      // VERIFICAÇÃO DE SEGURANÇA
      if (role !== 'super_admin' && role !== 'admin_site') {
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

  const compactHeight = viewport.height < 860;
  const ultraCompactHeight = viewport.height < 760;
  const compactWidth = viewport.width < 1280;
  const isTabletOrLarger = viewport.width >= 768;

  const actionsColumns = isTabletOrLarger
    ? (compactWidth ? 'repeat(3, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))')
    : 'repeat(2, minmax(0, 1fr))';

  const headerPadding = ultraCompactHeight ? '12px 18px' : compactHeight ? '16px 24px' : '22px 30px';
  const sectionPadding = ultraCompactHeight ? '0 18px 10px' : compactHeight ? '0 24px 14px' : '0 30px 20px';
  const statsPadding = ultraCompactHeight ? '10px 18px' : compactHeight ? '12px 24px' : '16px 30px';
  const noticeMargin = ultraCompactHeight ? '0 18px 10px' : compactHeight ? '0 24px 14px' : '0 30px 20px';
  const cardPadding = ultraCompactHeight ? '12px' : compactHeight ? '14px' : '18px';
  const actionsGap = ultraCompactHeight ? '8px' : compactHeight ? '10px' : '14px';

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={{ ...styles.header, padding: headerPadding }}>
        <div style={styles.headerLeft}>
          <h1 style={{ ...styles.title, fontSize: ultraCompactHeight ? '20px' : compactHeight ? '22px' : '24px', marginBottom: ultraCompactHeight ? 2 : 4 }}>
            👑 Admin Site - Dashboard
          </h1>
          <p style={{ ...styles.subtitle, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Gerenciamento Central do Sistema</p>
        </div>
        <div style={{ ...styles.headerRight, gap: ultraCompactHeight ? '10px' : '14px' }}>
          <div style={styles.userInfo}>
            <span style={{ ...styles.userName, fontSize: ultraCompactHeight ? '13px' : '14px' }}>{user?.nome || user?.login || user?.email}</span>
            <span style={styles.userRole}>{user?.login || user?.email || '-'}</span>
          </div>
          <button onClick={handleLogout} style={{ ...styles.logoutButton, padding: ultraCompactHeight ? '6px 12px' : '7px 14px' }}>
            🚪 Sair
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ ...styles.statsGrid, padding: statsPadding, gap: ultraCompactHeight ? '8px' : '10px' }}>
        <div style={{ ...styles.statCard, padding: cardPadding, gap: ultraCompactHeight ? '10px' : '12px' }}>
          <div style={{ ...styles.statIcon, fontSize: ultraCompactHeight ? '24px' : '28px' }}>👥</div>
          <div style={styles.statContent}>
            <span style={{ ...styles.statValue, fontSize: ultraCompactHeight ? '20px' : '24px' }}>{stats.totalUsuariosParoquia}</span>
            <span style={{ ...styles.statLabel, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Usuários da Paróquia</span>
          </div>
        </div>

        <div style={{ ...styles.statCard, padding: cardPadding, gap: ultraCompactHeight ? '10px' : '12px' }}>
          <div style={{ ...styles.statIcon, fontSize: ultraCompactHeight ? '24px' : '28px' }}>🙏</div>
          <div style={styles.statContent}>
            <span style={{ ...styles.statValue, fontSize: ultraCompactHeight ? '20px' : '24px' }}>{stats.totalUsuariosPublicos}</span>
            <span style={{ ...styles.statLabel, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Fiéis Cadastrados</span>
          </div>
        </div>
      </div>

      {/* MAIN ACTIONS */}
      <div style={{ ...styles.section, padding: sectionPadding }}>
        <h2 style={{ ...styles.sectionTitle, fontSize: ultraCompactHeight ? '16px' : '18px', marginBottom: ultraCompactHeight ? '8px' : '10px' }}>🛠️ Gerenciamento</h2>
        <div style={{ ...styles.actionsGrid, gridTemplateColumns: actionsColumns, gap: actionsGap }}>
          <button style={{ ...styles.actionCard, padding: cardPadding }} onClick={() => navigate('/admin-site/paroquias')}>
            <div style={{ ...styles.actionIcon, fontSize: ultraCompactHeight ? '20px' : '22px', marginBottom: ultraCompactHeight ? '6px' : '8px' }}>⛪</div>
            <h3 style={{ ...styles.actionTitle, fontSize: ultraCompactHeight ? '13px' : '14px', marginBottom: ultraCompactHeight ? '4px' : '5px' }}>Gerenciar Paróquias</h3>
            <p style={{ ...styles.actionDesc, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Administrar todas as paróquias</p>
          </button>

          <button style={{ ...styles.actionCard, padding: cardPadding }} onClick={() => navigate('/admin-paroquia/user-paroquia')}>
            <div style={{ ...styles.actionIcon, fontSize: ultraCompactHeight ? '20px' : '22px', marginBottom: ultraCompactHeight ? '6px' : '8px' }}>👤</div>
            <h3 style={{ ...styles.actionTitle, fontSize: ultraCompactHeight ? '13px' : '14px', marginBottom: ultraCompactHeight ? '4px' : '5px' }}>Gerenciar Usuários da Paróquia</h3>
            <p style={{ ...styles.actionDesc, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Administrar equipe da paróquia</p>
          </button>

          <button style={{ ...styles.actionCard, padding: cardPadding }} onClick={() => navigate('/admin-site/users-admin')}>
            <div style={{ ...styles.actionIcon, fontSize: ultraCompactHeight ? '20px' : '22px', marginBottom: ultraCompactHeight ? '6px' : '8px' }}>👑</div>
            <h3 style={{ ...styles.actionTitle, fontSize: ultraCompactHeight ? '13px' : '14px', marginBottom: ultraCompactHeight ? '4px' : '5px' }}>Gerenciar Usuários do Site</h3>
            <p style={{ ...styles.actionDesc, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Sucessão e gestão dos pares</p>
          </button>

          <button style={{ ...styles.actionCard, padding: cardPadding }} onClick={() => navigate('/admin-site/relatorios')}>
            <div style={{ ...styles.actionIcon, fontSize: ultraCompactHeight ? '20px' : '22px', marginBottom: ultraCompactHeight ? '6px' : '8px' }}>📊</div>
            <h3 style={{ ...styles.actionTitle, fontSize: ultraCompactHeight ? '13px' : '14px', marginBottom: ultraCompactHeight ? '4px' : '5px' }}>Relatórios</h3>
            <p style={{ ...styles.actionDesc, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Visualizar estatísticas completas</p>
          </button>

          <button style={{ ...styles.actionCard, padding: cardPadding }} onClick={() => navigate('/admin-site/configuracoes')}>
            <div style={{ ...styles.actionIcon, fontSize: ultraCompactHeight ? '20px' : '22px', marginBottom: ultraCompactHeight ? '6px' : '8px' }}>⚙️</div>
            <h3 style={{ ...styles.actionTitle, fontSize: ultraCompactHeight ? '13px' : '14px', marginBottom: ultraCompactHeight ? '4px' : '5px' }}>Configurações</h3>
            <p style={{ ...styles.actionDesc, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Configurações globais do sistema</p>
          </button>

          <button style={{ ...styles.actionCard, padding: cardPadding }} onClick={() => navigate('/admin-site/auditoria')}>
            <div style={{ ...styles.actionIcon, fontSize: ultraCompactHeight ? '20px' : '22px', marginBottom: ultraCompactHeight ? '6px' : '8px' }}>🔐</div>
            <h3 style={{ ...styles.actionTitle, fontSize: ultraCompactHeight ? '13px' : '14px', marginBottom: ultraCompactHeight ? '4px' : '5px' }}>Auditoria</h3>
            <p style={{ ...styles.actionDesc, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Logs e rastreamento de ações</p>
          </button>

          <button style={{ ...styles.actionCard, padding: cardPadding }} onClick={() => navigate('/admin-site/feedback')}>
            <div style={{ ...styles.actionIcon, fontSize: ultraCompactHeight ? '20px' : '22px', marginBottom: ultraCompactHeight ? '6px' : '8px' }}>💬</div>
            <h3 style={{ ...styles.actionTitle, fontSize: ultraCompactHeight ? '13px' : '14px', marginBottom: ultraCompactHeight ? '4px' : '5px' }}>Feedback</h3>
            <p style={{ ...styles.actionDesc, fontSize: ultraCompactHeight ? '11px' : '12px' }}>Sistema de satisfação e sugestões</p>
          </button>
        </div>
      </div>

      {/* SECURITY NOTICE */}
      <div style={{ ...styles.securityNotice, margin: noticeMargin, padding: ultraCompactHeight ? '8px 10px' : compactHeight ? '10px 12px' : '12px 14px', fontSize: ultraCompactHeight ? '11px' : '12px' }}>
        <span style={{ ...styles.securityIcon, fontSize: ultraCompactHeight ? '16px' : '18px' }}>🔒</span>
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
    height: '100vh',
    overflow: 'hidden',
    background: '#f5f5f5',
    padding: '0',
    display: 'flex',
    flexDirection: 'column' as const,
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
    fontSize: '24px',
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
    padding: '8px 16px',
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
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    padding: '16px 30px',
  } as React.CSSProperties,
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  statIcon: {
    fontSize: '28px',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1e3c72',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
  },
  section: {
    padding: '0 30px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    minHeight: 0,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '10px',
    flex: 1,
    minHeight: 0,
  } as React.CSSProperties,
  actionCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'left' as const,
    border: '2px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  actionIcon: {
    fontSize: '22px',
    marginBottom: '8px',
  },
  actionTitle: {
    fontSize: '14px',
    color: '#1e3c72',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  actionDesc: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
  },
  securityNotice: {
    margin: '0 30px 20px',
    padding: '12px 14px',
    background: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: '#856404',
  } as React.CSSProperties,
  securityIcon: {
    fontSize: '18px',
  },
};

export default AdminSiteDashboard;
