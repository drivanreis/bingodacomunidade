import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FloatingCart from '../components/FloatingCart';
import api from '../services/api';
import { resolveDashboardPath, resolveGameDetailPath } from '../utils/sessionScope';
import './Games.css';

interface Game {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  status: 'scheduled' | 'active' | 'finished' | 'cancelled';
  card_price: number;
  total_prize: number;
  cards_sold: number;
  max_cards: number;
}

const normalizeRole = (role: unknown): string => {
  return String(role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();
  const persistedUserRaw = localStorage.getItem('@BingoComunidade:user');
  const persistedUser = persistedUserRaw ? JSON.parse(persistedUserRaw) : null;
  const resolvedRole = normalizeRole(persistedUser?.nivel_acesso || persistedUser?.tipo);
  const canManageGames = [
    'admin_paroquia',
    'paroquia_admin',
    'paroquia_caixa',
    'paroquia_recepcao',
    'paroquia_bingo',
    'usuario_administrativo',
    'usuario_administrador',
    'admin_site',
    'super_admin',
  ].includes(resolvedRole);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await api.get('/games');
      setGames(response.data);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      scheduled: 'Agendado',
      active: 'Ativo',
      finished: 'Finalizado',
      cancelled: 'Cancelado',
    };
    return texts[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      scheduled: 'gm-statusBadgeScheduled',
      active: 'gm-statusBadgeActive',
      finished: 'gm-statusBadgeFinished',
      cancelled: 'gm-statusBadgeCancelled',
    };
    return classes[status] || 'gm-statusBadgeDefault';
  };

  const filteredGames = games.filter((game) => {
    if (filter === 'all') return true;
    return game.status === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="gm-loadingContainer">
        <div className="gm-spinner"></div>
        <p>Carregando jogos...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="gm-container">
        <button onClick={() => navigate(resolveDashboardPath(resolvedRole))} className="gm-backButton">
          ← Voltar para Dashboard
        </button>
        
        <div className="gm-header">
        <div>
          <h1 className="gm-title">🎉 Concursos Disponíveis</h1>
          <p className="gm-subtitle">
            {filteredGames.length} {filteredGames.length === 1 ? 'concurso' : 'concursos'} para compra de cartela
          </p>
        </div>
        {canManageGames && (
          <button className="gm-createButton" onClick={() => navigate('/admin-paroquia/games/new')}>
            ➕ Criar Novo Jogo
          </button>
        )}
      </div>

      <div className="gm-filters">
        <button
          onClick={() => setFilter('all')}
          className={`gm-filterButton ${filter === 'all' ? 'gm-filterButtonActive' : ''}`}
        >
          Todos ({games.length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          className={`gm-filterButton ${filter === 'scheduled' ? 'gm-filterButtonActive' : ''}`}
        >
          Agendados ({games.filter((g) => g.status === 'scheduled').length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`gm-filterButton ${filter === 'active' ? 'gm-filterButtonActive' : ''}`}
        >
          Ativos ({games.filter((g) => g.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('finished')}
          className={`gm-filterButton ${filter === 'finished' ? 'gm-filterButtonActive' : ''}`}
        >
          Finalizados ({games.filter((g) => g.status === 'finished').length})
        </button>
      </div>

      {filteredGames.length === 0 ? (
        <div className="gm-emptyState">
          <p className="gm-emptyIcon">🎲</p>
          <h3 className="gm-emptyTitle">Nenhum jogo encontrado</h3>
          <p className="gm-emptyText">
            {filter === 'all'
              ? 'Ainda não há concursos disponíveis para compra de cartela.'
              : `Não há concursos com status "${getStatusText(filter)}".`}
          </p>
        </div>
      ) : (
        <div className="gm-grid">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="gm-card"
              onClick={() => navigate(resolveGameDetailPath(resolvedRole, game.id))}
            >
              <div className="gm-cardHeader">
                <h3 className="gm-cardTitle">{game.title}</h3>
                <span className={`gm-statusBadge ${getStatusBadgeClass(game.status)}`}>
                  {getStatusText(game.status)}
                </span>
              </div>

              <p className="gm-cardDescription">{game.description}</p>

              <div className="gm-cardInfo">
                <div className="gm-infoRow">
                  <span className="gm-infoLabel">📅 Data:</span>
                  <span className="gm-infoValue">{formatDate(game.scheduled_date)}</span>
                </div>
                <div className="gm-infoRow">
                  <span className="gm-infoLabel">💰 Valor da Cartela:</span>
                  <span className="gm-infoValue">{formatCurrency(game.card_price)}</span>
                </div>
                <div className="gm-infoRow">
                  <span className="gm-infoLabel">🏆 Prêmio Total:</span>
                  <span className="gm-infoPrize">{formatCurrency(game.total_prize)}</span>
                </div>
                <div className="gm-infoRow">
                  <span className="gm-infoLabel">🎫 Cartelas Vendidas:</span>
                  <span className="gm-infoValue">
                    {game.cards_sold} / {game.max_cards || '∞'}
                  </span>
                </div>
              </div>

              <button className="gm-viewButton">{canManageGames ? 'Gerenciar Concurso →' : 'Ver Concurso / Comprar Cartela →'}</button>
            </div>
          ))}
        </div>
      )}
      </div>
      {!canManageGames && <FloatingCart />}
    </>
  );
};

export default Games;
