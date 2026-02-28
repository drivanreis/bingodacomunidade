import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FloatingCart, { notifyCartRefresh } from '../components/FloatingCart';
import api from '../services/api';
import './MyCards.css';

interface CardItem {
  id: string;
  game_id: string;
  numbers: string[];
  status: string;
  purchase_date: string | null;
}

interface GameItem {
  id: string;
  title: string;
  scheduled_date?: string;
}

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Sem data';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sem data';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusLabel: Record<string, string> = {
  no_carrinho: 'No carrinho',
  paga: 'Paga',
  ativa: 'Ativa',
  cancelada: 'Cancelada',
};

const canPayStatus = new Set(['no_carrinho']);

const MyCards: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [games, setGames] = useState<Record<string, GameItem>>({});
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cardsResponse, gamesResponse] = await Promise.all([
        api.get<CardItem[]>('/users/me/cards'),
        api.get<GameItem[]>('/games'),
      ]);

      const gamesMap = (gamesResponse.data || []).reduce<Record<string, GameItem>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      setGames(gamesMap);
      setCards((cardsResponse.data || []).sort((a, b) => {
        const aTime = new Date(a.purchase_date || 0).getTime();
        const bTime = new Date(b.purchase_date || 0).getTime();
        return bTime - aTime;
      }));
    } catch (error: any) {
      alert(error?.response?.data?.detail || 'Não foi possível carregar suas cartelas.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(() => {
    const total = cards.length;
    const inCart = cards.filter((item) => item.status === 'no_carrinho').length;
    const paid = cards.filter((item) => item.status === 'paga' || item.status === 'ativa').length;
    return { total, inCart, paid };
  }, [cards]);

  const handlePay = async (card: CardItem) => {
    try {
      setPayingId(card.id);
      await api.post(`/games/${card.game_id}/cards/${card.id}/pay`);
      notifyCartRefresh();
      await loadData();
      alert('Pagamento confirmado com sucesso.');
    } catch (error: any) {
      alert(error?.message || error?.response?.data?.detail?.leigo || error?.response?.data?.detail || 'Erro ao pagar cartela.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="mc-container">
        <div className="mc-header">
          <div>
            <h1 className="mc-title">🎟️ Minhas Cartelas</h1>
            <p className="mc-subtitle">Área do fiel para acompanhar, pagar e acessar seus bilhetes de jogo.</p>
          </div>
          <div className="mc-actions">
            <button type="button" className="mc-button mc-buttonSecondary" onClick={() => navigate('/dashboard')}>
              ← Dashboard
            </button>
            <button type="button" className="mc-button" onClick={() => navigate('/games')}>
              + Comprar nova cartela
            </button>
          </div>
        </div>

        <div className="mc-statsGrid">
          <article className="mc-statCard">
            <span className="mc-statLabel">Total de cartelas</span>
            <strong className="mc-statValue">{stats.total}</strong>
          </article>
          <article className="mc-statCard">
            <span className="mc-statLabel">Pendentes de pagamento</span>
            <strong className="mc-statValue">{stats.inCart}</strong>
          </article>
          <article className="mc-statCard">
            <span className="mc-statLabel">Pagas/ativas</span>
            <strong className="mc-statValue">{stats.paid}</strong>
          </article>
        </div>

        {loading ? (
          <div className="mc-emptyBox">Carregando cartelas...</div>
        ) : cards.length === 0 ? (
          <div className="mc-emptyBox">
            <p>Você ainda não possui cartelas.</p>
            <button type="button" className="mc-button" onClick={() => navigate('/games')}>
              Ver concursos
            </button>
          </div>
        ) : (
          <div className="mc-cardsGrid">
            {cards.map((card) => {
              const game = games[card.game_id];
              const status = statusLabel[card.status] || card.status;
              const isPaying = payingId === card.id;

              return (
                <article key={card.id} className="mc-cardItem">
                  <header className="mc-cardHeader">
                    <h2 className="mc-cardTitle">{game?.title || `Concurso ${card.game_id}`}</h2>
                    <span className={`mc-status mc-status-${card.status}`}>{status}</span>
                  </header>

                  <div className="mc-meta">
                    <span><strong>Concurso:</strong> {card.game_id}</span>
                    <span><strong>Cartela:</strong> {card.id}</span>
                    <span><strong>Reserva:</strong> {formatDate(card.purchase_date)}</span>
                    {game?.scheduled_date && <span><strong>Sorteio:</strong> {formatDate(game.scheduled_date)}</span>}
                  </div>

                  <div className="mc-numbers">
                    {card.numbers.map((number, index) => (
                      <span key={`${card.id}-${number}-${index}`} className="mc-numberBadge">{number}</span>
                    ))}
                  </div>

                  <div className="mc-cardActions">
                    <button
                      type="button"
                      className="mc-button mc-buttonSecondary"
                      onClick={() => navigate(`/games/${card.game_id}`)}
                    >
                      Ver concurso
                    </button>
                    {canPayStatus.has(card.status) && (
                      <button
                        type="button"
                        className="mc-button"
                        onClick={() => handlePay(card)}
                        disabled={isPaying}
                      >
                        {isPaying ? 'Processando...' : 'Pagar cartela'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <FloatingCart onPaymentSuccess={loadData} />
    </>
  );
};

export default MyCards;
