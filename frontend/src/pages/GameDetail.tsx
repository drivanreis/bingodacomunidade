import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  max_cards: number | null;
  prize_percent: number;
  parish_percent: number;
  operation_percent: number;
  evolution_percent: number;
  created_at: string;
}

interface Card {
  id: string;
  numbers: number[];
  purchase_date: string;
  owner_name: string;
}

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGameData();
  }, [id]);

  const fetchGameData = async () => {
    try {
      const [gameResponse, cardsResponse] = await Promise.all([
        api.get(`/games/${id}`),
        api.get(`/games/${id}/cards`),
      ]);
      setGame(gameResponse.data);
      setCards(cardsResponse.data);
    } catch (error) {
      console.error('Erro ao buscar dados do jogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCard = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setPurchasing(true);
    try {
      await api.post(`/games/${id}/cards`);
      await fetchGameData();
      alert('Cartela comprada com sucesso! 🎉');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao comprar cartela');
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
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

  const canPurchase = () => {
    if (!game) return false;
    if (game.status !== 'scheduled' && game.status !== 'active') return false;
    if (game.max_cards && game.cards_sold >= game.max_cards) return false;
    return true;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Carregando jogo...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2>❌ Jogo não encontrado</h2>
          <button onClick={() => navigate('/games')} style={styles.backButton}>
            Voltar para Jogos
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.content}>
        <button onClick={() => navigate('/games')} style={styles.backLink}>
          ← Voltar para Jogos
        </button>

        <div style={styles.mainCard}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>{game.title}</h1>
              <span
                style={{
                  ...styles.statusBadge,
                  background: getStatusColor(game.status),
                }}
              >
                {getStatusText(game.status)}
              </span>
            </div>
          </div>

          <p style={styles.description}>{game.description}</p>

          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>📅</div>
              <div>
                <div style={styles.infoLabel}>Data e Hora</div>
                <div style={styles.infoValue}>{formatDate(game.scheduled_date)}</div>
              </div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>💰</div>
              <div>
                <div style={styles.infoLabel}>Valor da Cartela</div>
                <div style={styles.infoValue}>{formatCurrency(game.card_price)}</div>
              </div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>🏆</div>
              <div>
                <div style={styles.infoLabel}>Prêmio Total</div>
                <div style={styles.infoPrize}>{formatCurrency(game.total_prize)}</div>
              </div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>🎫</div>
              <div>
                <div style={styles.infoLabel}>Cartelas Vendidas</div>
                <div style={styles.infoValue}>
                  {game.cards_sold} {game.max_cards && `/ ${game.max_cards}`}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.rateioSection}>
            <h3 style={styles.sectionTitle}>💸 Distribuição do Valor</h3>
            <div style={styles.rateioGrid}>
              <div style={styles.rateioItem}>
                <span>🏆 Prêmio</span>
                <strong>{game.prize_percent}%</strong>
              </div>
              <div style={styles.rateioItem}>
                <span>⛪ Paróquia</span>
                <strong>{game.parish_percent}%</strong>
              </div>
              <div style={styles.rateioItem}>
                <span>⚙️ Operação</span>
                <strong>{game.operation_percent}%</strong>
              </div>
              <div style={styles.rateioItem}>
                <span>🚀 Evolução</span>
                <strong>{game.evolution_percent}%</strong>
              </div>
            </div>
          </div>

          {canPurchase() && (
            <button
              onClick={handlePurchaseCard}
              style={styles.purchaseButton}
              disabled={purchasing}
            >
              {purchasing ? 'Comprando...' : '🎫 Comprar Cartela'}
            </button>
          )}

          {!canPurchase() && game.status === 'scheduled' && game.max_cards && game.cards_sold >= game.max_cards && (
            <div style={styles.warningBox}>
              ⚠️ Todas as cartelas foram vendidas
            </div>
          )}

          {game.status === 'finished' && (
            <div style={styles.infoBox}>
              ✓ Este jogo foi finalizado
            </div>
          )}

          {game.status === 'cancelled' && (
            <div style={styles.errorBox}>
              ❌ Este jogo foi cancelado
            </div>
          )}
        </div>

        <div style={styles.cardsSection}>
          <h2 style={styles.sectionTitle}>🎫 Cartelas Compradas ({cards.length})</h2>
          {cards.length === 0 ? (
            <div style={styles.emptyState}>
              <p>Nenhuma cartela comprada ainda.</p>
            </div>
          ) : (
            <div style={styles.cardsGrid}>
              {cards.map((card) => (
                <div key={card.id} style={styles.cardItem}>
                  <div style={styles.cardHeader}>
                    <strong>{card.owner_name}</strong>
                    <span style={styles.cardDate}>
                      {new Date(card.purchase_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div style={styles.cardNumbers}>
                    {card.numbers.map((num, idx) => (
                      <span key={idx} style={styles.numberBall}>
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  backLink: {
    background: 'transparent',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: '5px 0',
    fontWeight: '500',
  },
  mainCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 15px 0',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  description: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '30px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  infoCard: {
    display: 'flex',
    gap: '15px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  infoIcon: {
    fontSize: '32px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  },
  infoValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  infoPrize: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rateioSection: {
    marginBottom: '30px',
    padding: '25px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  rateioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
  },
  rateioItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: 'white',
    borderRadius: '8px',
  },
  purchaseButton: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  warningBox: {
    padding: '15px',
    background: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    color: '#856404',
    textAlign: 'center' as const,
    fontWeight: '500',
  },
  infoBox: {
    padding: '15px',
    background: '#d1ecf1',
    border: '2px solid #0dcaf0',
    borderRadius: '8px',
    color: '#055160',
    textAlign: 'center' as const,
    fontWeight: '500',
  },
  errorBox: {
    padding: '15px',
    background: '#f8d7da',
    border: '2px solid #f44336',
    borderRadius: '8px',
    color: '#721c24',
    textAlign: 'center' as const,
    fontWeight: '500',
  },
  cardsSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  cardItem: {
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    fontSize: '14px',
  },
  cardDate: {
    color: '#666',
    fontSize: '12px',
  },
  cardNumbers: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
  },
  numberBall: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '1',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '50%',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666',
  },
  errorCard: {
    maxWidth: '500px',
    margin: '100px auto',
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center' as const,
  },
  backButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px',
  },
};

export default GameDetail;
