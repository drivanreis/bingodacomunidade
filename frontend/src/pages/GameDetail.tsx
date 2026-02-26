import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import FloatingCart, { notifyCartRefresh } from '../components/FloatingCart';

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

  useEffect(() => {
    fetchGameData();
  }, [id]);

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

  const isMobile = viewportWidth < 992;

  const fetchGameData = async () => {
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
  };

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
    } catch (error: any) {
      alert(error?.message || error.response?.data?.detail || 'Erro ao atualizar concurso');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Carregando concurso...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2>❌ Concurso não encontrado</h2>
          <button onClick={() => navigate('/admin-paroquia/games')} style={styles.backButton}>
            Voltar para Concursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ ...styles.container, ...(isMobile ? styles.containerMobile : {}) }}>
        <div style={styles.content}>
        <button onClick={() => navigate('/admin-paroquia/dashboard')} style={styles.backLink}>
          ← Voltar para Dashboard
        </button>

        <div style={{ ...styles.mainCard, ...(isMobile ? styles.mainCardMobile : {}) }}>

          {canManageGames && (
            <div style={styles.settingsPanel}>
              <h3 style={styles.sectionTitle}>⚙️ Editar Concurso</h3>

              <div style={styles.settingsGrid}>
                <div style={styles.settingsField}>
                  <label style={styles.rescheduleLabel}>🎉 Título do Jogo *</label>
                  <input
                    type="text"
                    value={settingsForm.title}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex: Bingo Beneficente 2026"
                    required
                    style={styles.rescheduleInput}
                  />
                </div>

                <div style={styles.settingsField}>
                  <label style={styles.rescheduleLabel}>💰 Preço da Cartela (R$) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={settingsForm.cardPrice}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, cardPrice: event.target.value }))}
                    placeholder="10.00"
                    required
                    style={styles.rescheduleInput}
                  />
                </div>

                <div style={styles.settingsField}>
                  <label style={styles.rescheduleLabel}>🔢 Máximo de Cartelas (vazio = ilimitado)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={settingsForm.maxCards}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, maxCards: event.target.value }))}
                    placeholder="Ex: 100"
                    style={styles.rescheduleInput}
                  />
                </div>

                <div style={styles.settingsField}>
                  <label style={styles.rescheduleLabel}>🏆 Prêmio (%)</label>
                  <input
                    type="number"
                    min="49"
                    max="100"
                    step="0.1"
                    value={settingsForm.prizePercent}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, prizePercent: event.target.value }))}
                    required
                    style={styles.rescheduleInput}
                  />
                </div>

                <div style={styles.settingsField}>
                  <label style={styles.rescheduleLabel}>⛪ Paróquia (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settingsForm.parishPercent}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, parishPercent: event.target.value }))}
                    required
                    style={styles.rescheduleInput}
                  />
                </div>

                <div style={styles.settingsField}>
                  <label style={styles.rescheduleLabel}>⚙️ Operação (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settingsForm.operationPercent}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, operationPercent: event.target.value }))}
                    required
                    style={styles.rescheduleInput}
                  />
                </div>

                <div style={styles.settingsField}>
                  <label style={styles.rescheduleLabel}>🛡️ Seguro Operacional (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={settingsForm.evolutionPercent}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, evolutionPercent: event.target.value }))}
                    required
                    style={styles.rescheduleInput}
                  />
                </div>
                <div style={{marginTop: '8px', fontSize: '13px', color: '#666'}}>
                  Prêmio ≥ 49%, Operação ≥ 1/3 da Paróquia, Seguro Operacional ≥ 1% e soma total = 100%.
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                style={styles.rescheduleApplyButton}
              >
                {savingSettings ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          )}

          {canReschedule && (
            <div style={styles.reschedulePanel}>
              <h3 style={styles.sectionTitle}>🗓️ Remarcar Sorteio</h3>
              <p style={styles.rescheduleDescription}>
                Escolha nova data/hora e decida se remarca apenas este jogo ou também os próximos impactados.
              </p>

              <div style={styles.rescheduleInputRow}>
                <label htmlFor="reschedule-date-input" style={styles.rescheduleLabel}>Nova data e hora do sorteio</label>
                <input
                  id="reschedule-date-input"
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(event) => {
                    setRescheduleDate(event.target.value);
                    setReschedulePreview(null);
                  }}
                  style={styles.rescheduleInput}
                />
              </div>

              <div style={styles.rescheduleInputRow}>
                <label htmlFor="reschedule-mode-input" style={styles.rescheduleLabel}>Modo da remarcação</label>
                <select
                  id="reschedule-mode-input"
                  value={rescheduleMode}
                  onChange={(event) => {
                    setRescheduleMode(event.target.value as 'single' | 'cascade');
                    setReschedulePreview(null);
                  }}
                  style={styles.rescheduleInput}
                >
                  <option value="single">Apenas este jogo</option>
                  <option value="cascade">Este + próximos</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSimulateReschedule}
                disabled={isSimulateRescheduleDisabled}
                title={
                  isSimulateRescheduleDisabled
                    ? 'Escolha uma nova data/hora diferente da atual para simular o impacto.'
                    : 'Simular impacto'
                }
                style={{
                  ...styles.rescheduleSimulateButton,
                  ...(isSimulateRescheduleDisabled ? styles.rescheduleSimulateButtonDisabled : {}),
                }}
              >
                {rescheduling ? 'Processando...' : 'Simular impacto'}
              </button>

              {reschedulePreview && (
                <div style={styles.reschedulePreviewBox}>
                  <p style={styles.reschedulePreviewLine}>
                    Impacto: {reschedulePreview.affected_games.length} jogo(s), conflito(s): {reschedulePreview.conflict_count}
                  </p>

                  {reschedulePreview.conflicts.length > 0 && (
                    <ul style={styles.rescheduleConflictList}>
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
                style={{
                  ...styles.rescheduleApplyButton,
                  ...(isApplyRescheduleDisabled ? styles.rescheduleApplyButtonDisabled : {}),
                }}
              >
                {rescheduling ? 'Aplicando...' : 'Aplicar remarcação'}
              </button>
            </div>
          )}

          {canPurchase() && (
            <div style={styles.purchasePanel}>
              <h3 style={styles.sectionTitle}>🎫 Comprar Cartela</h3>
              <div style={{ ...styles.modeButtons, ...(isMobile ? styles.modeButtonsMobile : {}) }}>
                <button
                  onClick={() => setPurchaseMode('aleatoria')}
                  style={{ ...styles.modeButton, ...(purchaseMode === 'aleatoria' ? styles.modeButtonActive : {}) }}
                  type="button"
                >
                  Aleatória
                </button>
                <button
                  onClick={() => setPurchaseMode('personalizada')}
                  style={{ ...styles.modeButton, ...(purchaseMode === 'personalizada' ? styles.modeButtonActive : {}) }}
                  type="button"
                >
                  Personalizada
                </button>
              </div>

              {purchaseMode === 'personalizada' && (
                <div style={styles.customInputWrapper}>
                  <div style={styles.customHeader}>
                    <label style={styles.customLabel}>Selecione 24 números (01 a 75)</label>
                    <span style={styles.customCounter}>{selectedNumbers.length}/24</span>
                  </div>

                  <div style={{ ...styles.customToolbar, ...(isMobile ? styles.customToolbarMobile : {}) }}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={numberSearch}
                      onChange={(e) => setNumberSearch(e.target.value)}
                      placeholder="Buscar número (ex: 07, 23, 75)"
                      style={styles.searchInput}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedNumbers([])}
                      style={styles.clearSelectionButton}
                      disabled={selectedNumbers.length === 0}
                    >
                      Limpar seleção
                    </button>
                  </div>

                  {selectedNumbers.length > 0 && (
                    <div style={styles.selectedNumbersPanel}>
                      <div style={styles.selectedNumbersHeader}>
                        <strong>Números selecionados</strong>
                        <span>{selectedNumbers.length}/24</span>
                      </div>
                      <div style={styles.selectedNumbersList}>
                        {[...selectedNumbers]
                          .sort((a, b) => Number(a) - Number(b))
                          .map((numberToken) => (
                            <button
                              key={numberToken}
                              type="button"
                              onClick={() => toggleCustomNumber(numberToken)}
                              style={styles.selectedNumberChip}
                              title="Remover número"
                            >
                              {numberToken} ✕
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div style={{ ...styles.numberSelectorGrid, ...(isMobile ? styles.numberSelectorGridMobile : {}) }}>
                    {filteredNumbersPool.map((numberToken) => {
                      const isSelected = selectedNumbers.includes(numberToken);
                      const isDisabled = !isSelected && selectedNumbers.length >= 24;

                      return (
                        <button
                          key={numberToken}
                          type="button"
                          onClick={() => toggleCustomNumber(numberToken)}
                          disabled={isDisabled}
                          style={{
                            ...styles.numberTokenButton,
                            ...(isSelected ? styles.numberTokenButtonSelected : {}),
                            ...(isDisabled ? styles.numberTokenButtonDisabled : {}),
                          }}
                        >
                          {numberToken}
                        </button>
                      );
                    })}
                  </div>

                  {filteredNumbersPool.length === 0 && (
                    <p style={styles.searchEmptyState}>Nenhum número encontrado para o filtro informado.</p>
                  )}
                </div>
              )}

              <button
                onClick={handlePurchaseCard}
                style={styles.purchaseButton}
                disabled={purchasing}
              >
                {purchasing ? 'Comprando...' : `🎫 Comprar Cartela ${purchaseMode === 'aleatoria' ? 'Aleatória' : 'Personalizada'}`}
              </button>
            </div>
          )}

          {!canPurchase() && game.status === 'scheduled' && game.max_cards && game.cards_sold >= game.max_cards && (
            <div style={styles.warningBox}>
              ⚠️ Todas as cartelas foram vendidas
            </div>
          )}

          {game.status === 'finished' && (
            <div style={styles.infoBox}>
              ✓ Este concurso foi finalizado
            </div>
          )}

          {game.status === 'cancelled' && (
            <div style={styles.errorBox}>
              ❌ Este concurso foi cancelado
            </div>
          )}
        </div>

        <div style={{ ...styles.cardsSection, ...(isMobile ? styles.cardsSectionMobile : {}) }}>
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

      {canAccessBuyerFeatures && <FloatingCart onPaymentSuccess={fetchGameData} />}
    </>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '40px 20px',
  },
  containerMobile: {
    padding: '16px 12px 88px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    // Removed styles related to the old cart implementation
    marginTop: '20px',
    marginBottom: '24px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e3e5e8',
  },
  modeButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
  },
  modeButtonsMobile: {
    flexDirection: 'column' as const,
  },
  modeButton: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd2dc',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#334155',
  },
  modeButtonActive: {
    background: '#667eea',
    color: '#fff',
    border: '1px solid #667eea',
  },
  customInputWrapper: {
    marginBottom: '12px',
  },
  customHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  customLabel: {
    display: 'block',
    fontSize: '13px',
    color: '#334155',
  },
  customCounter: {
    fontSize: '12px',
    color: '#475569',
    fontWeight: 600,
  },
  customToolbar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    alignItems: 'center',
  },
  customToolbarMobile: {
    flexDirection: 'column' as const,
    alignItems: 'stretch',
  },
  searchInput: {
    flex: 1,
    height: '34px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    padding: '0 10px',
    fontSize: '13px',
    color: '#334155',
  },
  clearSelectionButton: {
    height: '34px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    fontSize: '12px',
    fontWeight: 600,
    padding: '0 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  selectedNumbersPanel: {
    marginBottom: '10px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  selectedNumbersHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '12px',
    color: '#334155',
  },
  selectedNumbersList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  selectedNumberChip: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  numberSelectorGrid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
    gap: '6px',
  },
  numberSelectorGridMobile: {
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  },
  numberTokenButton: {
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  numberTokenButtonSelected: {
    background: '#667eea',
    border: '1px solid #667eea',
    color: '#fff',
  },
  numberTokenButtonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  searchEmptyState: {
    marginTop: '8px',
    marginBottom: 0,
    fontSize: '12px',
    color: '#64748b',
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
  settingsPanel: {
    marginTop: '20px',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid #d5dbe5',
    background: '#f9fbff',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px',
    marginBottom: '12px',
  },
  settingsField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  reschedulePanel: {
    marginTop: '20px',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid #d5dbe5',
    background: '#f9fbff',
  },
  rescheduleDescription: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#4b5563',
  },
  rescheduleInputRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginBottom: '12px',
  },
  rescheduleLabel: {
    fontSize: '13px',
    color: '#374151',
    fontWeight: 600,
  },
  rescheduleInput: {
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    padding: '0 10px',
    color: '#334155',
    fontSize: '14px',
  },
  rescheduleModes: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
  },
  rescheduleActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  rescheduleSimulateButton: {
    marginTop: '2px',
    marginBottom: '10px',
    width: 'fit-content',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    borderRadius: '8px',
    padding: '8px 12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rescheduleSimulateButtonDisabled: {
    background: '#e2e8f0',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    opacity: 0.8,
    cursor: 'not-allowed',
  },
  rescheduleApplyButton: {
    marginTop: '10px',
    width: 'fit-content',
    border: '1px solid #4f46e5',
    background: '#4f46e5',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  rescheduleApplyButtonDisabled: {
    background: '#cbd5e1',
    border: '1px solid #cbd5e1',
    color: '#64748b',
    opacity: 0.75,
    cursor: 'not-allowed',
  },
  reschedulePreviewBox: {
    marginTop: '12px',
    padding: '10px',
    borderRadius: '8px',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
  },
  reschedulePreviewLine: {
    margin: 0,
    fontSize: '13px',
    color: '#3730a3',
    fontWeight: 600,
  },
  rescheduleConflictList: {
    margin: '8px 0 0 18px',
    color: '#312e81',
    fontSize: '13px',
  },
  cardsSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  cardsSectionMobile: {
    padding: '18px',
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
