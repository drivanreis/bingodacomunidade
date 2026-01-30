import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

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

const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: '#2196F3',
      active: '#4CAF50',
      finished: '#9E9E9E',
      cancelled: '#F44336',
    };
    return colors[status] || '#9E9E9E';
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Carregando jogos...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Voltar para Dashboard
        </button>
        
        <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🎉 Jogos de Bingo</h1>
          <p style={styles.subtitle}>
            {filteredGames.length} {filteredGames.length === 1 ? 'jogo' : 'jogos'}
          </p>
        </div>
        {(user?.role === 'super_admin' || user?.role === 'parish_admin') && (
          <button onClick={() => navigate('/games/new')} style={styles.createButton}>
            + Criar Novo Jogo
          </button>
        )}
      </div>

      <div style={styles.filters}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...styles.filterButton,
            ...(filter === 'all' ? styles.filterButtonActive : {}),
          }}
        >
          Todos ({games.length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          style={{
            ...styles.filterButton,
            ...(filter === 'scheduled' ? styles.filterButtonActive : {}),
          }}
        >
          Agendados ({games.filter((g) => g.status === 'scheduled').length})
        </button>
        <button
          onClick={() => setFilter('active')}
          style={{
            ...styles.filterButton,
            ...(filter === 'active' ? styles.filterButtonActive : {}),
          }}
        >
          Ativos ({games.filter((g) => g.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('finished')}
          style={{
            ...styles.filterButton,
            ...(filter === 'finished' ? styles.filterButtonActive : {}),
          }}
        >
          Finalizados ({games.filter((g) => g.status === 'finished').length})
        </button>
      </div>

      {filteredGames.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>🎲</p>
          <h3 style={styles.emptyTitle}>Nenhum jogo encontrado</h3>
          <p style={styles.emptyText}>
            {filter === 'all'
              ? 'Ainda não há jogos cadastrados.'
              : `Não há jogos com status "${getStatusText(filter)}".`}
          </p>
          {(user?.role === 'super_admin' || user?.role === 'parish_admin') && filter === 'all' && (
            <button onClick={() => navigate('/games/new')} style={styles.emptyButton}>
              Criar Primeiro Jogo
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredGames.map((game) => (
            <div key={game.id} style={styles.card} onClick={() => navigate(`/games/${game.id}`)}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{game.title}</h3>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: getStatusColor(game.status),
                  }}
                >
                  {getStatusText(game.status)}
                </span>
              </div>

              <p style={styles.cardDescription}>{game.description}</p>

              <div style={styles.cardInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>📅 Data:</span>
                  <span style={styles.infoValue}>{formatDate(game.scheduled_date)}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>💰 Valor da Cartela:</span>
                  <span style={styles.infoValue}>{formatCurrency(game.card_price)}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>🏆 Prêmio Total:</span>
                  <span style={styles.infoPrize}>{formatCurrency(game.total_prize)}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>🎫 Cartelas Vendidas:</span>
                  <span style={styles.infoValue}>
                    {game.cards_sold} / {game.max_cards || '∞'}
                  </span>
                </div>
              </div>

              <button style={styles.viewButton}>Ver Detalhes →</button>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '40px 20px',
  },
  backButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#667eea',
    background: 'white',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '5px 0 0 0',
  },
  createButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
  },
  filterButton: {
    padding: '10px 20px',
    fontSize: '14px',
    color: '#666',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderColor: 'transparent',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    gap: '10px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
    flex: 1,
  },
  statusBadge: {
    padding: '5px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
  },
  cardDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#666',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  infoPrize: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  viewButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#667eea',
    background: 'transparent',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    background: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  emptyIcon: {
    fontSize: '64px',
    margin: '0 0 20px 0',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 10px 0',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 30px 0',
  },
  emptyButton: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default Games;
