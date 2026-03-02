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
import './AdminParoquiaDashboard.css';

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
      <div className="apd-loading-container">
        <div className="apd-spinner">🔄</div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="apd-container">
      {/* HEADER */}
      <div className="apd-header">
        <div className="apd-header-left">
          <h1 className="apd-title">⛪ Admin Paróquia - Dashboard</h1>
          <p className="apd-subtitle">Gerenciamento Paroquial</p>
        </div>
        <div className="apd-header-right">
          <div className="apd-user-info">
            <span className="apd-user-name">{user?.nome || user?.login || user?.email}</span>
            <span className="apd-user-role">{user?.tipo ? getRoleName(user.tipo) : '-'}</span>
          </div>
          <button onClick={handleLogout} className="apd-logout-button">
            🚪 Sair
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      {successMessage && (
        <div className="apd-success-banner">
          <span>{successMessage}</span>
        </div>
      )}

      <div className="apd-stats-grid">
        <div className="apd-stat-card">
          <div className="apd-stat-icon">🎉</div>
          <div className="apd-stat-content">
            <span className="apd-stat-value">{stats.jogos}</span>
            <span className="apd-stat-label">Jogos</span>
          </div>
        </div>

        <div className="apd-stat-card">
          <div className="apd-stat-icon">✅</div>
          <div className="apd-stat-content">
            <span className="apd-stat-value">{stats.jogosFinalizados}</span>
            <span className="apd-stat-label">Jogos Finalizados</span>
          </div>
        </div>

        <div className="apd-stat-card">
          <div className="apd-stat-icon">💰</div>
          <div className="apd-stat-content">
            <span className="apd-stat-value">R$ {stats.totalVendas.toFixed(2)}</span>
            <span className="apd-stat-label">Total em Vendas</span>
          </div>
        </div>
      </div>

      {/* MAIN ACTIONS */}
      <div className="apd-section">
        <h2 className="apd-section-title">🎯 Ações Rápidas</h2>
        <div className="apd-actions-grid">
          <button className="apd-action-card" onClick={() => navigate('/admin-paroquia/games')}>
            <div className="apd-action-icon">🎉</div>
            <h3 className="apd-action-title">Jogos</h3>
            <p className="apd-action-desc">Ver e gerenciar jogos em andamento e futuros</p>
          </button>

          <button className="apd-action-card" onClick={() => navigate('/admin-paroquia/games')}>
            <div className="apd-action-icon">💳</div>
            <h3 className="apd-action-title">Controle de Caixa</h3>
            <p className="apd-action-desc">Gerenciar vendas e pagamentos</p>
          </button>

          <button className="apd-action-card" onClick={() => navigate('/admin-paroquia/games')}>
            <div className="apd-action-icon">📊</div>
            <h3 className="apd-action-title">Relatórios</h3>
            <p className="apd-action-desc">Estatísticas da paróquia</p>
          </button>

          <button className="apd-action-card" onClick={() => navigate('/admin-paroquia/games')}>
            <div className="apd-action-icon">🎫</div>
            <h3 className="apd-action-title">Cartelas</h3>
            <p className="apd-action-desc">Gerenciar cartelas vendidas</p>
          </button>

          <button className="apd-action-card" onClick={() => navigate('/admin-paroquia/games')}>
            <div className="apd-action-icon">👥</div>
            <h3 className="apd-action-title">Participantes</h3>
            <p className="apd-action-desc">Lista de fiéis cadastrados</p>
          </button>
        </div>
      </div>

      {/* ROLE-SPECIFIC ACTIONS */}
      {canViewAdminSection && (
        <div className="apd-section">
          <h2 className="apd-section-title">🔧 Administração</h2>
          <div className="apd-actions-grid">
            <button className="apd-action-card" onClick={() => navigate('/admin-paroquia/paroquia')}>
              <div className="apd-action-icon">⚙️</div>
              <h3 className="apd-action-title">Configurar Paróquia</h3>
              <p className="apd-action-desc">Dados, contato e financeiro</p>
            </button>

            <button className="apd-action-card" onClick={() => navigate('/admin-paroquia/configuracoes')}>
              <div className="apd-action-icon">⚙️</div>
              <h3 className="apd-action-title">Configurações</h3>
              <p className="apd-action-desc">Rateios e políticas</p>
            </button>

            <button className="apd-action-card" onClick={() => navigate('/admin-paroquia/user-paroquia')}>
              <div className="apd-action-icon">👤</div>
              <h3 className="apd-action-title">Usuários</h3>
              <p className="apd-action-desc">Gerenciar equipe paroquial</p>
            </button>
          </div>
        </div>
      )}

      {/* INFO NOTICE */}
      <div className="apd-info-notice">
        <span className="apd-info-icon">ℹ️</span>
        <div>
          <strong>Paróquia:</strong> Você está gerenciando a paróquia ID: {user?.paroquia_id}
        </div>
      </div>
    </div>
  );
};

export default AdminParoquiaDashboard;
