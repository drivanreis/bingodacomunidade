import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import Navbar from '../components/Navbar';
import api from '../services/api';
import FloatingCart from '../components/FloatingCart';
import { notifyCartRefresh } from '../utils/cartRefresh';
import { resolveDashboardPath, resolveGamesPath } from '../utils/sessionScope';
import './GameDetail.css';

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
  numbers: string[];
  purchase_date: string;
  owner_name: string;
}

interface RescheduleConflict {
  id: string;
  title: string;
  draw_date: string;
  reason: string;
}

interface RescheduleAffectedGame {
  id: string;
  title: string;
  old_draw: string;
  new_draw: string;
  shifted: boolean;
  is_target: boolean;
}

interface ReschedulePreview {
  mode: 'single' | 'cascade';
  delta_minutes: number;
  conflict_count: number;
  conflicts: RescheduleConflict[];
  affected_games: RescheduleAffectedGame[];
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

const toDateTimeLocalInput = (isoDate: string) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toApiDateTimeLocal = (localDateTimeValue: string): string => {
  if (!localDateTimeValue) return localDateTimeValue;
  if (localDateTimeValue.length === 16) {
    return `${localDateTimeValue}:00`;
  }
  return localDateTimeValue;
};

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<'aleatoria' | 'personalizada'>('aleatoria');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [numberSearch, setNumberSearch] = useState('');
  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleMode, setRescheduleMode] = useState<'single' | 'cascade'>('single');
  const [reschedulePreview, setReschedulePreview] = useState<ReschedulePreview | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    cardPrice: '',
    maxCards: '',
    prizePercent: '',
    parishPercent: '',
    operationPercent: '',
    evolutionPercent: '',
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const persistedUserRaw = localStorage.getItem('@BingoComunidade:user');
  const persistedUser = persistedUserRaw ? JSON.parse(persistedUserRaw) : null;
  const resolvedRole = normalizeRole(user?.role || persistedUser?.nivel_acesso || persistedUser?.tipo);
  const canManageGames = [
    'admin_paroquia',
    'parish_admin',
    'paroquia_admin',
    'paroquia_caixa',
    'paroquia_recepcao',
    'paroquia_bingo',
    'usuario_administrativo',
    'usuario_administrador',
    'admin_site',
    'super_admin',
  ].includes(resolvedRole);
  const canAccessBuyerFeatures = !canManageGames;
  const canManageSchedule = [
    'admin_paroquia',
    'parish_admin',
    'paroquia_admin',
    'usuario_administrativo',
    'usuario_administrador',
    'admin_site',
    'super_admin',
  ].includes(resolvedRole);
  const numbersPool = Array.from({ length: 75 }, (_, index) => String(index + 1).padStart(2, '0'));
  const normalizedSearch = numberSearch.replace(/\D/g, '').slice(0, 2);
  const filteredNumbersPool = normalizedSearch
    ? numbersPool.filter((numberToken) => numberToken.includes(normalizedSearch))
    : numbersPool;

  const isMobile = viewportWidth < 992;

  const fetchGameData = useCallback(async () => {
    try {
      const [gameResponse, cardsResponse] = await Promise.all([
        api.get(`/games/${id}`),
        api.get(`/games/${id}/cards`),
      ]);
      setGame(gameResponse.data);
      setCards(cardsResponse.data);
    } catch (error) {
      console.error('Erro ao buscar dados do concurso:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGameData();
  }, [id, fetchGameData]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!game?.scheduled_date) {
      return;
    }
    setRescheduleDate(toDateTimeLocalInput(game.scheduled_date));
    setReschedulePreview(null);
  }, [game?.scheduled_date]);

  useEffect(() => {
    if (!game) {
      return;
    }

    setSettingsForm({
      title: game.title || '',
      cardPrice: String(game.card_price ?? ''),
      maxCards: game.max_cards == null ? '' : String(game.max_cards),
      prizePercent: String(game.prize_percent ?? ''),
      parishPercent: String(game.parish_percent ?? ''),
      operationPercent: String(game.operation_percent ?? ''),
      evolutionPercent: String(game.evolution_percent ?? ''),
    });
  }, [game]);

  const toggleCustomNumber = (numberToken: string) => {
    setSelectedNumbers((current) => {
      if (current.includes(numberToken)) {
        return current.filter((item) => item !== numberToken);
      }

      if (current.length >= 24) {
        return current;
      }

      return [...current, numberToken];
    });
  };

  const handlePurchaseCard = async () => {
    if (!canAccessBuyerFeatures) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setPurchasing(true);
    try {
      if (purchaseMode === 'personalizada' && selectedNumbers.length !== 24) {
        alert('Selecione exatamente 24 números para a cartela personalizada.');
        setPurchasing(false);
        return;
      }

      const payload = purchaseMode === 'personalizada'
        ? { modo: 'personalizada', numeros: selectedNumbers }
        : { modo: 'aleatoria' };

      await api.post(`/games/${id}/cards`, payload);
      await fetchGameData();
      notifyCartRefresh();
      if (purchaseMode === 'personalizada') {
        setSelectedNumbers([]);
      }
      alert('Cartela adicionada ao carrinho com sucesso! 🎉');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error?.message || error.response?.data?.detail || 'Erro ao comprar cartela');
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

  const canPurchase = () => {
    if (!game) return false;
    if (!canAccessBuyerFeatures) return false;
    if (game.status !== 'scheduled' && game.status !== 'active') return false;
    if (game.max_cards && game.cards_sold >= game.max_cards) return false;
    return true;
  };

  const canReschedule = !!game && canManageSchedule && game.status !== 'finished' && game.status !== 'cancelled';
  const currentRescheduleDate = game?.scheduled_date ? toDateTimeLocalInput(game.scheduled_date) : '';
  const hasRescheduleDateChanged = !!rescheduleDate && rescheduleDate !== currentRescheduleDate;
  const hasValidReschedulePreview = !!reschedulePreview && reschedulePreview.mode === rescheduleMode;
  const isSimulateRescheduleDisabled = rescheduling || !hasRescheduleDateChanged;
  const isApplyRescheduleDisabled = rescheduling || !hasRescheduleDateChanged || !hasValidReschedulePreview;

  const handleSimulateReschedule = async () => {
    if (!id || !rescheduleDate) {
      alert('Informe a nova data/hora do sorteio para simular.');
      return;
    }

    if (!hasRescheduleDateChanged) {
      alert('A nova data/hora deve ser diferente da data/hora atual do sorteio.');
      return;
    }

    setRescheduling(true);
    try {
      const response = await api.post(`/games/${id}/reschedule`, {
        novo_horario_sorteio: toApiDateTimeLocal(rescheduleDate),
        mode: rescheduleMode,
        preview: true,
      });
      setReschedulePreview(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error?.message || error.response?.data?.detail || 'Erro ao simular remarcação');
    } finally {
      setRescheduling(false);
    }
  };

  const handleApplyReschedule = async () => {
    if (!id || !rescheduleDate) {
      alert('Informe a nova data/hora do sorteio.');
      return;
    }

    if (!reschedulePreview || reschedulePreview.mode !== rescheduleMode) {
      await handleSimulateReschedule();
      alert('Simulação atualizada. Revise o impacto e clique novamente em aplicar.');
      return;
    }

    const confirmed = window.confirm(
      rescheduleMode === 'cascade'
        ? 'Confirmar remarcação deste jogo e dos próximos jogos impactados?'
        : 'Confirmar remarcação somente deste jogo?'
    );

    if (!confirmed) {
      return;
    }

    setRescheduling(true);
    try {
      const response = await api.post(`/games/${id}/reschedule`, {
        novo_horario_sorteio: toApiDateTimeLocal(rescheduleDate),
        mode: rescheduleMode,
        preview: false,
      });
      setReschedulePreview(response.data);
      await fetchGameData();
      alert('✅ Remarcação aplicada com sucesso.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (detail?.message) {
        alert(detail.message);
      } else {
        alert(error?.message || 'Erro ao aplicar remarcação');
      }
    } finally {
      setRescheduling(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!id) {
      return;
    }

    const cardPrice = Number(settingsForm.cardPrice);
    const prizePercent = Number(settingsForm.prizePercent);
    const parishPercent = Number(settingsForm.parishPercent);
    const operationPercent = Number(settingsForm.operationPercent);
    const evolutionPercent = Number(settingsForm.evolutionPercent);

    if (
      Number.isNaN(cardPrice)
      || Number.isNaN(prizePercent)
      || Number.isNaN(parishPercent)
      || Number.isNaN(operationPercent)
      || Number.isNaN(evolutionPercent)
    ) {
      alert('Preencha preço e percentuais com valores numéricos válidos.');
      return;
    }

    const payload = {
      title: settingsForm.title.trim(),
      card_price: cardPrice,
      max_cards: settingsForm.maxCards.trim() === '' ? undefined : Number(settingsForm.maxCards),
      prize_percent: prizePercent,
      parish_percent: parishPercent,
      operation_percent: operationPercent,
      evolution_percent: evolutionPercent,
    };

    setSavingSettings(true);
    try {
      await api.put(`/games/${id}`, payload);
      await fetchGameData();
      alert('✅ Dados do concurso atualizados com sucesso.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error?.message || error.response?.data?.detail || 'Erro ao atualizar concurso');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="gd-loadingContainer">
        <div className="gd-spinner"></div>
        <p>Carregando concurso...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="gd-container">
        <div className="gd-errorCard">
          <h2>❌ Concurso não encontrado</h2>
          <button onClick={() => navigate(resolveGamesPath(resolvedRole))} className="gd-backButton">
            Voltar para Concursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`gd-container ${isMobile ? 'gd-containerMobile' : ''}`}>
        <div className="gd-content">
        <button onClick={() => navigate(resolveDashboardPath(resolvedRole))} className="gd-backLink">
          ← Voltar para Dashboard
        </button>

        <div className={`gd-mainCard ${isMobile ? 'gd-mainCardMobile' : ''}`}>
          <h1 className="gd-gameTitleInline">{game.title}</h1>

          {canManageGames && (
            <div className="gd-settingsPanel">
              <h3 className="gd-sectionTitle">⚙️ Editar Concurso</h3>

              <div className="gd-settingsGrid">
                <div className="gd-settingsField">
                  <label className="gd-rescheduleLabel">🎉 Título do Jogo *</label>
                  <input
                    type="text"
                    value={settingsForm.title}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex: Bingo Beneficente 2026"
                    required
                    className="gd-rescheduleInput"
                  />
                </div>

                <div className="gd-settingsField">
                  <label className="gd-rescheduleLabel">💰 Preço da Cartela (R$) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={settingsForm.cardPrice}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, cardPrice: event.target.value }))}
                    placeholder="10.00"
                    required
                    className="gd-rescheduleInput"
                  />
                </div>

                <div className="gd-settingsField">
                  <label className="gd-rescheduleLabel">🔢 Máximo de Cartelas (vazio = ilimitado)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={settingsForm.maxCards}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, maxCards: event.target.value }))}
                    placeholder="Ex: 100"
                    className="gd-rescheduleInput"
                  />
                </div>

                <div className="gd-settingsField">
                  <label className="gd-rescheduleLabel">🏆 Prêmio (%)</label>
                  <input
                    type="number"
                    min="49"
                    max="100"
                    step="0.1"
                    value={settingsForm.prizePercent}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, prizePercent: event.target.value }))}
                    required
                    className="gd-rescheduleInput"
                  />
                </div>

                <div className="gd-settingsField">
                  <label className="gd-rescheduleLabel">⛪ Paróquia (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settingsForm.parishPercent}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, parishPercent: event.target.value }))}
                    required
                    className="gd-rescheduleInput"
                  />
                </div>

                <div className="gd-settingsField">
                  <label className="gd-rescheduleLabel">⚙️ Operação (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settingsForm.operationPercent}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, operationPercent: event.target.value }))}
                    required
                    className="gd-rescheduleInput"
                  />
                </div>

                <div className="gd-settingsField">
                  <label className="gd-rescheduleLabel">🛡️ Seguro Operacional (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={settingsForm.evolutionPercent}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, evolutionPercent: event.target.value }))}
                    required
                    className="gd-rescheduleInput"
                  />
                </div>
                <div className="gd-settingsHint">
                  Prêmio ≥ 49%, Operação ≥ 1/3 da Paróquia, Seguro Operacional ≥ 1% e soma total = 100%.
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="gd-rescheduleApplyButton"
              >
                {savingSettings ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          )}

          {canReschedule && (
            <div className="gd-reschedulePanel">
              <h3 className="gd-sectionTitle">🗓️ Remarcar Sorteio</h3>
              <p className="gd-rescheduleDescription">
                Escolha nova data/hora e decida se remarca apenas este jogo ou também os próximos impactados.
              </p>

              <div className="gd-rescheduleInputRow">
                <label htmlFor="reschedule-date-input" className="gd-rescheduleLabel">Nova data e hora do sorteio</label>
                <input
                  id="reschedule-date-input"
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(event) => {
                    setRescheduleDate(event.target.value);
                    setReschedulePreview(null);
                  }}
                  className="gd-rescheduleInput"
                />
              </div>

              <div className="gd-rescheduleInputRow">
                <label htmlFor="reschedule-mode-input" className="gd-rescheduleLabel">Modo da remarcação</label>
                <select
                  id="reschedule-mode-input"
                  value={rescheduleMode}
                  onChange={(event) => {
                    setRescheduleMode(event.target.value as 'single' | 'cascade');
                    setReschedulePreview(null);
                  }}
                  className="gd-rescheduleInput"
                >
                  <option value="single">Apenas este jogo</option>
                  <option value="cascade">Este + próximos</option>
                </select>
              </div>

              <div className="gd-rescheduleActions">
                <button
                  type="button"
                  onClick={handleSimulateReschedule}
                  disabled={isSimulateRescheduleDisabled}
                  title={
                    isSimulateRescheduleDisabled
                      ? 'Escolha uma nova data/hora diferente da atual para simular o impacto.'
                      : 'Simular impacto'
                  }
                  className={`gd-rescheduleSimulateButton ${isSimulateRescheduleDisabled ? 'gd-rescheduleSimulateButtonDisabled' : ''}`}
                >
                  {rescheduling ? 'Processando...' : 'Simular impacto'}
                </button>

              {reschedulePreview && (
                <div className="gd-reschedulePreviewBox">
                  <p className="gd-reschedulePreviewLine">
                    Impacto: {reschedulePreview.affected_games.length} jogo(s), conflito(s): {reschedulePreview.conflict_count}
                  </p>

                  {reschedulePreview.conflicts.length > 0 && (
                    <ul className="gd-rescheduleConflictList">
                      {reschedulePreview.conflicts.map((conflict) => (
                        <li key={conflict.id}>
                          {conflict.title} — {formatDate(conflict.draw_date)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

                <button
                  type="button"
                  onClick={handleApplyReschedule}
                  disabled={isApplyRescheduleDisabled}
                  title={
                    isApplyRescheduleDisabled
                      ? 'Escolha nova data/hora e simule o impacto com a configuração atual para habilitar a aplicação da remarcação.'
                      : 'Aplicar remarcação'
                  }
                  className={`gd-rescheduleApplyButton ${isApplyRescheduleDisabled ? 'gd-rescheduleApplyButtonDisabled' : ''}`}
                >
                  {rescheduling ? 'Aplicando...' : 'Aplicar remarcação'}
                </button>
              </div>
            </div>
          )}

          {canPurchase() && (
            <div className="gd-purchasePanel">
              <h3 className="gd-sectionTitle">🎫 Comprar Cartela</h3>
              <div className={`gd-modeButtons ${isMobile ? 'gd-modeButtonsMobile' : ''}`}>
                <button
                  onClick={() => setPurchaseMode('aleatoria')}
                  className={`gd-modeButton ${purchaseMode === 'aleatoria' ? 'gd-modeButtonActive' : ''}`}
                  type="button"
                >
                  Aleatória
                </button>
                <button
                  onClick={() => setPurchaseMode('personalizada')}
                  className={`gd-modeButton ${purchaseMode === 'personalizada' ? 'gd-modeButtonActive' : ''}`}
                  type="button"
                >
                  Personalizada
                </button>
              </div>

              {purchaseMode === 'personalizada' && (
                <div className="gd-customInputWrapper">
                  <div className="gd-customHeader">
                    <label className="gd-customLabel">Selecione 24 números (01 a 75)</label>
                    <span className="gd-customCounter">{selectedNumbers.length}/24</span>
                  </div>

                  <div className={`gd-customToolbar ${isMobile ? 'gd-customToolbarMobile' : ''}`}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={numberSearch}
                      onChange={(e) => setNumberSearch(e.target.value)}
                      placeholder="Buscar número (ex: 07, 23, 75)"
                      className="gd-searchInput"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedNumbers([])}
                      className="gd-clearSelectionButton"
                      disabled={selectedNumbers.length === 0}
                    >
                      Limpar seleção
                    </button>
                  </div>

                  {selectedNumbers.length > 0 && (
                    <div className="gd-selectedNumbersPanel">
                      <div className="gd-selectedNumbersHeader">
                        <strong>Números selecionados</strong>
                        <span>{selectedNumbers.length}/24</span>
                      </div>
                      <div className="gd-selectedNumbersList">
                        {[...selectedNumbers]
                          .sort((a, b) => Number(a) - Number(b))
                          .map((numberToken) => (
                            <button
                              key={numberToken}
                              type="button"
                              onClick={() => toggleCustomNumber(numberToken)}
                              className="gd-selectedNumberChip"
                              title="Remover número"
                            >
                              {numberToken} ✕
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className={`gd-numberSelectorGrid ${isMobile ? 'gd-numberSelectorGridMobile' : ''}`}>
                    {filteredNumbersPool.map((numberToken) => {
                      const isSelected = selectedNumbers.includes(numberToken);
                      const isDisabled = !isSelected && selectedNumbers.length >= 24;

                      return (
                        <button
                          key={numberToken}
                          type="button"
                          onClick={() => toggleCustomNumber(numberToken)}
                          disabled={isDisabled}
                          className={`gd-numberTokenButton ${isSelected ? 'gd-numberTokenButtonSelected' : ''} ${isDisabled ? 'gd-numberTokenButtonDisabled' : ''}`}
                        >
                          {numberToken}
                        </button>
                      );
                    })}
                  </div>

                  {filteredNumbersPool.length === 0 && (
                    <p className="gd-searchEmptyState">Nenhum número encontrado para o filtro informado.</p>
                  )}
                </div>
              )}

              <button
                onClick={handlePurchaseCard}
                className="gd-purchaseButton"
                disabled={purchasing}
              >
                {purchasing ? 'Comprando...' : `🎫 Comprar Cartela ${purchaseMode === 'aleatoria' ? 'Aleatória' : 'Personalizada'}`}
              </button>
            </div>
          )}

          {!canPurchase() && game.status === 'scheduled' && game.max_cards && game.cards_sold >= game.max_cards && (
            <div className="gd-warningBox">
              ⚠️ Todas as cartelas foram vendidas
            </div>
          )}

          {game.status === 'finished' && (
            <div className="gd-infoBox">
              ✓ Este concurso foi finalizado
            </div>
          )}

          {game.status === 'cancelled' && (
            <div className="gd-errorBox">
              ❌ Este concurso foi cancelado
            </div>
          )}
        </div>

        <div className={`gd-cardsSection ${isMobile ? 'gd-cardsSectionMobile' : ''}`}>
          <h2 className="gd-sectionTitle">🎫 Cartelas Compradas ({cards.length})</h2>
          {cards.length === 0 ? (
            <div className="gd-emptyState">
              <p>Nenhuma cartela comprada ainda.</p>
            </div>
          ) : (
            <div className="gd-cardsGrid">
              {cards.map((card) => (
                <div key={card.id} className="gd-cardItem">
                  <div className="gd-cardHeader">
                    <strong>{card.owner_name}</strong>
                    <span className="gd-cardDate">
                      {new Date(card.purchase_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="gd-cardNumbers">
                    {card.numbers.map((num, idx) => (
                      <span key={idx} className="gd-numberBall">
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

      {canAccessBuyerFeatures && <FloatingCart onPaymentSuccess={fetchGameData} />}
    </>
  );
};

export default GameDetail;
