/**
 * Admin Paróquia Dashboard
 * 
 * Dashboard para Administradores Paroquiais
 * Rota: /admin-paroquia/dashboard
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getHumanRoleLabel } from '../utils/userRoles';

interface DashboardLocationState {
  gameCreated?: boolean;
  createdGameTitle?: string;
}

interface User {
  id: string;
  nome: string;
  login?: string;
  email: string;
  tipo: string;
  nivel_acesso?: string;
  paroquia_id: string;
}

const normalizeRole = (value: unknown): string => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const AdminParoquiaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    jogos: 0,
    jogosFinalizados: 0,
    totalVendas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const normalizedTipo = normalizeRole(user?.tipo);
  const normalizedNivelAcesso = normalizeRole(user?.nivel_acesso);
  const canViewAdminSection = normalizedNivelAcesso === 'admin_paroquia' || [
    'paroquia_admin',
    'paroquia_caixa',
    'paroquia_recepcao',
    'paroquia_bingo',
    'usuario_administrativo',
    'usuario_administrador',
  ].includes(normalizedTipo);

  useEffect(() => {
    loadUserData();
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const state = location.state as DashboardLocationState | null;
    if (!state?.gameCreated) {
      return;
    }

    const title = (state.createdGameTitle || '').trim();
    const baseMessage = title
      ? `✅ Jogo "${title}" criado com sucesso!`
      : '✅ Jogo criado com sucesso!';

    setSuccessMessage(`${baseMessage} Ele já está disponível em “Jogos”.`);
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

  const loadUserData = () => {
    const storedUser = localStorage.getItem('@BingoComunidade:user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      
      // VERIFICAÇÃO DE SEGURANÇA
      const paroquialRoles = ['paroquia_admin', 'paroquia_caixa', 'paroquia_recepcao', 'paroquia_bingo', 'usuario_administrativo', 'usuario_administrador'];
      const tipoUsuario = (userData?.tipo || '').toString().toLowerCase();
      const nivelAcesso = (userData?.nivel_acesso || '').toString().toLowerCase();
      if (nivelAcesso !== 'admin_paroquia' && !paroquialRoles.includes(tipoUsuario)) {
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
      const response = await api.get('/games');
      const games = Array.isArray(response.data) ? response.data : [];

      const normalizeStatus = (status: unknown) => String(status || '').trim().toLowerCase();
      const isActiveStatus = (status: string) => status === 'active' || status === 'em_andamento';
      const isScheduledStatus = (status: string) => status === 'scheduled' || status === 'agendado';
      const isFinishedStatus = (status: string) => status === 'finished' || status === 'finalizado';

      const jogos = games.filter((game: any) => {
        const status = normalizeStatus(game?.status);
        return isActiveStatus(status) || isScheduledStatus(status);
      }).length;
      const jogosFinalizados = games.filter((game: any) => isFinishedStatus(normalizeStatus(game?.status))).length;
      const totalVendas = games.reduce((acc: number, game: any) => {
        const value = Number(game?.total_arrecadado ?? 0);
        return acc + (Number.isFinite(value) ? value : 0);
      }, 0);

      setStats({
        jogos,
        jogosFinalizados,
        totalVendas,
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
    return getHumanRoleLabel(tipo);
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
            <span style={styles.userName}>{user?.nome || user?.login || user?.email}</span>
            <span style={styles.userRole}>{user?.tipo ? getRoleName(user.tipo) : '-'}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            🚪 Sair
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      {successMessage && (
        <div style={styles.successBanner}>
          <span>{successMessage}</span>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎉</div>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{stats.jogos}</span>
            <span style={styles.statLabel}>Jogos</span>
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
          <button style={styles.actionCard} onClick={() => navigate('/games')}>
            <div style={styles.actionIcon}>🎉</div>
            <h3 style={styles.actionTitle}>Jogos</h3>
            <p style={styles.actionDesc}>Ver e gerenciar jogos em andamento e futuros</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/games')}>
            <div style={styles.actionIcon}>💳</div>
            <h3 style={styles.actionTitle}>Controle de Caixa</h3>
            <p style={styles.actionDesc}>Gerenciar vendas e pagamentos</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/games')}>
            <div style={styles.actionIcon}>📊</div>
            <h3 style={styles.actionTitle}>Relatórios</h3>
            <p style={styles.actionDesc}>Estatísticas da paróquia</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/games')}>
            <div style={styles.actionIcon}>🎫</div>
            <h3 style={styles.actionTitle}>Cartelas</h3>
            <p style={styles.actionDesc}>Gerenciar cartelas vendidas</p>
          </button>

          <button style={styles.actionCard} onClick={() => navigate('/games')}>
            <div style={styles.actionIcon}>👥</div>
            <h3 style={styles.actionTitle}>Participantes</h3>
            <p style={styles.actionDesc}>Lista de fiéis cadastrados</p>
          </button>
        </div>
      </div>

      {/* ROLE-SPECIFIC ACTIONS */}
      {canViewAdminSection && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔧 Administração</h2>
          <div style={styles.actionsGrid}>
            <button style={styles.actionCard} onClick={() => navigate('/admin-paroquia/configuracoes')}>
              <div style={styles.actionIcon}>⚙️</div>
              <h3 style={styles.actionTitle}>Configurações</h3>
              <p style={styles.actionDesc}>Configurar paróquia e rateios</p>
            </button>

            <button style={styles.actionCard} onClick={() => navigate('/admin-paroquia/usuarios')}>
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
    background: '#f5f6fa',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    color: '#334155',
    gap: '10px',
  },
  spinner: {
    fontSize: '28px',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '18px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  title: {
    margin: 0,
    fontSize: '36px',
    lineHeight: 1.1,
    fontWeight: 'bold',
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    opacity: 0.95,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '2px',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  userRole: {
    fontSize: '12px',
    opacity: 0.85,
  },
  logoutButton: {
    border: '1px solid rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 600,
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '14px',
    padding: '20px 28px',
  } as React.CSSProperties,
  successBanner: {
    background: '#edf9f0',
    color: '#1d6f42',
    border: '1px solid #c8ead4',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  statIcon: {
    fontSize: '36px',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
  },
  section: {
    padding: '0 28px 20px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '12px',
    fontWeight: 'bold',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,
  actionCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'left' as const,
    border: '2px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  actionIcon: {
    fontSize: '30px',
    marginBottom: '8px',
  },
  actionTitle: {
    fontSize: '16px',
    color: '#667eea',
    marginBottom: '6px',
    fontWeight: 'bold',
  },
  actionDesc: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  infoNotice: {
    margin: '0 28px 16px',
    padding: '14px',
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
    fontSize: '20px',
  },
};

export default AdminParoquiaDashboard;
