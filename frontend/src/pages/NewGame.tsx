import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import './NewGame.css';

const normalizeRole = (role: unknown): string => {
  return String(role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const NewGame: React.FC = () => {
  const [title, setTitle] = useState('');
  const [salesStartDate, setSalesStartDate] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [cardPrice, setCardPrice] = useState('');
  const [maxCards, setMaxCards] = useState('');
  const [prizePercent, setPrizePercent] = useState('50');
  const [parishPercent, setParishPercent] = useState('30');
  const [operationPercent, setOperationPercent] = useState('15');
  const [evolutionPercent, setEvolutionPercent] = useState('5');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth);
  const { user } = useAuth();
  const navigate = useNavigate();
  const persistedUserRaw = localStorage.getItem('@BingoComunidade:user');
  const persistedUser = persistedUserRaw ? JSON.parse(persistedUserRaw) : null;
  const resolvedRole = normalizeRole(user?.role || persistedUser?.nivel_acesso || persistedUser?.tipo);
  const canCreateGame = [
    'admin_paroquia',
    'parish_admin',
    'paroquia_admin',
    'paroquia_caixa',
    'paroquia_recepcao',
    'paroquia_bingo',
    'usuario_administrativo',
    'usuario_administrador',
  ].includes(resolvedRole);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewportWidth < 992;

  const prizeValue = parseFloat(prizePercent || '0');
  const parishValue = parseFloat(parishPercent || '0');
  const operationValue = parseFloat(operationPercent || '0');
  const insuranceValue = parseFloat(evolutionPercent || '0');
  const totalPercent = prizeValue + parishValue + operationValue + insuranceValue;
  const operationMinimum = parishValue / 3;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    const totalPercent = prizeValue + parishValue + operationValue + insuranceValue;

    if (prizeValue < 49) {
      setError('Prêmio não pode ser menor que 49%.');
      return;
    }

    if (insuranceValue < 1) {
      setError('Seguro operacional não pode ser menor que 1%.');
      return;
    }

    if (operationValue + 0.0001 < operationMinimum) {
      setError(`Operação não pode ser menor que 1/3 da Paróquia (${operationMinimum.toFixed(2)}%).`);
      return;
    }

    if (Math.abs(totalPercent - 100) > 0.01) {
      setError('A soma dos percentuais deve ser exatamente 100%');
      return;
    }

    setLoading(true);

    try {
      const gameData = {
        title,
        data_inicio_vendas: new Date(salesStartDate).toISOString(),
        data_sorteio: new Date(drawDate).toISOString(),
        card_price: parseFloat(cardPrice),
        max_cards: maxCards ? parseInt(maxCards) : null,
        prize_percent: parseFloat(prizePercent),
        parish_percent: parseFloat(parishPercent),
        operation_percent: parseFloat(operationPercent),
        evolution_percent: parseFloat(evolutionPercent),
      };

      const response = await api.post('/games', gameData);
      navigate('/admin-paroquia/dashboard', {
        state: {
          gameCreated: true,
          createdGameTitle: response?.data?.title || title,
        },
      });
    } catch (err: any) {
      setError(err?.message || err.response?.data?.detail || 'Erro ao criar jogo');
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateGame) {
    return (
      <>
        <Navbar />
        <div className="ng-container">
          <div className="ng-errorCard">
          <h2>⚠️ Acesso Negado</h2>
          <p>Apenas administradores podem criar jogos.</p>
          <button onClick={() => navigate('/admin-paroquia/dashboard')} className="ng-backButton">
            Voltar para Dashboard
          </button>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`ng-container ${isMobile ? 'ng-containerMobile' : 'ng-containerDesktop'}`}>
      <div className={`ng-card ${isMobile ? 'ng-cardMobile' : 'ng-cardDesktop'}`}>
        <div className="ng-header">
          <button onClick={() => navigate('/admin-paroquia/dashboard')} className="ng-backLink">
            ← Voltar
          </button>
          <h1 className="ng-title">🎉 Criar Novo Jogo</h1>
        </div>

        <form onSubmit={handleSubmit} className={`ng-form ${isMobile ? 'ng-formMobile' : 'ng-formDesktop'}`}>
          <div className={`ng-columns ${isMobile ? 'ng-columnsMobile' : 'ng-columnsDesktop'}`}>
            <div className="ng-section">
              <h3 className="ng-sectionTitle">Informações Básicas</h3>

              <div className="ng-inputGroup">
                <label className="ng-label">Título do Jogo *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Bingo Beneficente 2026"
                  required
                  className="ng-input"
                />
              </div>

              <div className="ng-inputGroup">
                <label className="ng-label">Início da Venda de Cartelas *</label>
                <input
                  type="datetime-local"
                  value={salesStartDate}
                  onChange={(e) => setSalesStartDate(e.target.value)}
                  required
                  className="ng-input"
                />
              </div>

              <div className="ng-inputGroup">
                <label className="ng-label">Data e Hora do Sorteio *</label>
                <input
                  type="datetime-local"
                  value={drawDate}
                  onChange={(e) => setDrawDate(e.target.value)}
                  required
                  className="ng-input"
                />
              </div>

              <div className="ng-inputGroup">
                <label className="ng-label">Valor da Cartela (R$) *</label>
                <input
                  type="number"
                  value={cardPrice}
                  onChange={(e) => setCardPrice(e.target.value)}
                  placeholder="10.00"
                  step="0.01"
                  min="0.01"
                  required
                  className="ng-input"
                />
              </div>

              <div className="ng-inputGroup">
                <label className="ng-label">
                  Máximo de Cartelas (vazio = ilimitado)
                </label>
                <input
                  type="number"
                  value={maxCards}
                  onChange={(e) => setMaxCards(e.target.value)}
                  placeholder="Ex: 100"
                  min="1"
                  className="ng-input"
                />
              </div>
            </div>

            <div className="ng-section">
              <h3 className="ng-sectionTitle">Rateio Financeiro</h3>
              <p className="ng-sectionDescription">
                Prêmio ≥ 49%, Operação ≥ 1/3 da Paróquia, Seguro Operacional ≥ 1% e soma total = 100%.
              </p>

              <div className={`ng-row ${isMobile ? 'ng-rowMobile' : ''}`}>
                <div className="ng-inputGroup">
                  <label className="ng-label">🏆 Prêmio (%)</label>
                  <input
                    type="number"
                    value={prizePercent}
                    onChange={(e) => setPrizePercent(e.target.value)}
                    step="0.1"
                    min="49"
                    max="100"
                    required
                    className="ng-input"
                  />
                </div>

                <div className="ng-inputGroup">
                  <label className="ng-label">⛪ Paróquia (%)</label>
                  <input
                    type="number"
                    value={parishPercent}
                    onChange={(e) => setParishPercent(e.target.value)}
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    className="ng-input"
                  />
                </div>
              </div>

              <div className={`ng-row ${isMobile ? 'ng-rowMobile' : ''}`}>
                <div className="ng-inputGroup">
                  <label className="ng-label">⚙️ Operação (%)</label>
                  <input
                    type="number"
                    value={operationPercent}
                    onChange={(e) => setOperationPercent(e.target.value)}
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    className="ng-input"
                  />
                  <small className="ng-hintText">Mínimo atual: {operationMinimum.toFixed(2)}%</small>
                </div>

                <div className="ng-inputGroup">
                  <label className="ng-label">🛡️ Seguro Operacional (%)</label>
                  <input
                    type="number"
                    value={evolutionPercent}
                    onChange={(e) => setEvolutionPercent(e.target.value)}
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    className="ng-input"
                  />
                </div>
              </div>

              <div className="ng-totalPercent">
                <strong>Total:</strong>
                <span className={Math.abs(totalPercent - 100) < 0.01 ? 'ng-totalPercentValueOk' : 'ng-totalPercentValueError'}>
                  {totalPercent.toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>

          {error && <div className="ng-error">⚠️ {error}</div>}

          <div className={`ng-actions ${isMobile ? 'ng-actionsMobile' : 'ng-actionsDesktop'}`}>
            <button
              type="button"
              onClick={() => navigate('/admin-paroquia/dashboard')}
              className={`ng-cancelButton ${isMobile ? 'ng-actionButtonMobile' : ''}`}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className={`ng-submitButton ${isMobile ? 'ng-actionButtonMobile' : ''}`} disabled={loading}>
              {loading ? 'Criando...' : '✓ Criar Jogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default NewGame;
