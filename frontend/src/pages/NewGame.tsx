import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

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
        <div style={styles.container}>
          <div style={styles.errorCard}>
          <h2>⚠️ Acesso Negado</h2>
          <p>Apenas administradores podem criar jogos.</p>
          <button onClick={() => navigate('/admin-paroquia/dashboard')} style={styles.backButton}>
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
      <div style={{ ...styles.container, ...(isMobile ? styles.containerMobile : styles.containerDesktop) }}>
      <div style={{ ...styles.card, ...(isMobile ? styles.cardMobile : styles.cardDesktop) }}>
        <div style={styles.header}>
          <button onClick={() => navigate('/admin-paroquia/dashboard')} style={styles.backLink}>
            ← Voltar
          </button>
          <h1 style={styles.title}>🎉 Criar Novo Jogo</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ ...styles.form, ...(isMobile ? styles.formMobile : styles.formDesktop) }}>
          <div style={{ ...styles.columns, ...(isMobile ? styles.columnsMobile : styles.columnsDesktop) }}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Informações Básicas</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Título do Jogo *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Bingo Beneficente 2026"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Início da Venda de Cartelas *</label>
                <input
                  type="datetime-local"
                  value={salesStartDate}
                  onChange={(e) => setSalesStartDate(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Data e Hora do Sorteio *</label>
                <input
                  type="datetime-local"
                  value={drawDate}
                  onChange={(e) => setDrawDate(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Valor da Cartela (R$) *</label>
                <input
                  type="number"
                  value={cardPrice}
                  onChange={(e) => setCardPrice(e.target.value)}
                  placeholder="10.00"
                  step="0.01"
                  min="0.01"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Máximo de Cartelas (vazio = ilimitado)
                </label>
                <input
                  type="number"
                  value={maxCards}
                  onChange={(e) => setMaxCards(e.target.value)}
                  placeholder="Ex: 100"
                  min="1"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Rateio Financeiro</h3>
              <p style={styles.sectionDescription}>
                Prêmio ≥ 49%, Operação ≥ 1/3 da Paróquia, Seguro Operacional ≥ 1% e soma total = 100%.
              </p>

              <div style={{ ...styles.row, ...(isMobile ? styles.rowMobile : {}) }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>🏆 Prêmio (%)</label>
                  <input
                    type="number"
                    value={prizePercent}
                    onChange={(e) => setPrizePercent(e.target.value)}
                    step="0.1"
                    min="49"
                    max="100"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>⛪ Paróquia (%)</label>
                  <input
                    type="number"
                    value={parishPercent}
                    onChange={(e) => setParishPercent(e.target.value)}
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ ...styles.row, ...(isMobile ? styles.rowMobile : {}) }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>⚙️ Operação (%)</label>
                  <input
                    type="number"
                    value={operationPercent}
                    onChange={(e) => setOperationPercent(e.target.value)}
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    style={styles.input}
                  />
                  <small style={styles.hintText}>Mínimo atual: {operationMinimum.toFixed(2)}%</small>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>🛡️ Seguro Operacional (%)</label>
                  <input
                    type="number"
                    value={evolutionPercent}
                    onChange={(e) => setEvolutionPercent(e.target.value)}
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.totalPercent}>
                <strong>Total:</strong>
                <span
                  style={{
                    color:
                      Math.abs(totalPercent - 100) < 0.01
                        ? '#4CAF50'
                        : '#F44336',
                  }}
                >
                  {totalPercent.toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <div style={{ ...styles.actions, ...(isMobile ? styles.actionsMobile : styles.actionsDesktop) }}>
            <button
              type="button"
              onClick={() => navigate('/admin-paroquia/dashboard')}
              style={{ ...styles.cancelButton, ...(isMobile ? styles.actionButtonMobile : {}) }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" style={{ ...styles.submitButton, ...(isMobile ? styles.actionButtonMobile : {}) }} disabled={loading}>
              {loading ? 'Criando...' : '✓ Criar Jogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

const styles = {
  container: {
    height: 'calc(100vh - 64px)',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '16px',
  },
  containerDesktop: {
    overflow: 'hidden' as const,
  },
  containerMobile: {
    height: 'auto',
    minHeight: 'calc(100vh - 64px)',
    overflowY: 'auto' as const,
  },
  card: {
    maxWidth: '1100px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardDesktop: {
    height: '100%',
    marginBottom: 0,
    overflow: 'hidden' as const,
  },
  cardMobile: {
    marginBottom: '16px',
    overflow: 'visible' as const,
  },
  errorCard: {
    maxWidth: '500px',
    margin: '100px auto',
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center' as const,
  },
  header: {
    marginBottom: '12px',
  },
  backLink: {
    background: 'transparent',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '10px',
    padding: '5px 0',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  formDesktop: {
    flex: 1,
    minHeight: 0,
  },
  formMobile: {},
  columns: {
    display: 'grid',
    gap: '16px',
    minHeight: 0,
  },
  columnsDesktop: {
    gridTemplateColumns: '1fr 1fr',
    flex: 1,
    overflow: 'hidden' as const,
  },
  columnsMobile: {
    gridTemplateColumns: '1fr',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#666',
    margin: '0',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flex: 1,
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px 16px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  hintText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  row: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  rowMobile: {
    gap: '10px',
  },
  totalPercent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #fcc',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
    marginTop: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #eee',
    flexWrap: 'wrap' as const,
  },
  actionsDesktop: {
    marginTop: 'auto',
  },
  actionsMobile: {
    justifyContent: 'stretch',
  },
  actionButtonMobile: {
    width: '100%',
  },
  cancelButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#666',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
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

export default NewGame;
