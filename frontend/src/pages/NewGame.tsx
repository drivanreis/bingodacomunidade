import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const NewGame: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [cardPrice, setCardPrice] = useState('');
  const [maxCards, setMaxCards] = useState('');
  const [prizePercent, setPrizePercent] = useState('50');
  const [parishPercent, setParishPercent] = useState('30');
  const [operationPercent, setOperationPercent] = useState('15');
  const [evolutionPercent, setEvolutionPercent] = useState('5');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    const totalPercent =
      parseFloat(prizePercent) +
      parseFloat(parishPercent) +
      parseFloat(operationPercent) +
      parseFloat(evolutionPercent);

    if (Math.abs(totalPercent - 100) > 0.01) {
      setError('A soma dos percentuais deve ser exatamente 100%');
      return;
    }

    setLoading(true);

    try {
      const gameData = {
        title,
        description,
        scheduled_date: new Date(scheduledDate).toISOString(),
        card_price: parseFloat(cardPrice),
        max_cards: maxCards ? parseInt(maxCards) : null,
        prize_percent: parseFloat(prizePercent),
        parish_percent: parseFloat(parishPercent),
        operation_percent: parseFloat(operationPercent),
        evolution_percent: parseFloat(evolutionPercent),
      };

      await api.post('/games', gameData);
      navigate('/games');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar jogo');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'super_admin' && user?.role !== 'parish_admin') {
    return (
      <>
        <Navbar />
        <div style={styles.container}>
          <div style={styles.errorCard}>
          <h2>⚠️ Acesso Negado</h2>
          <p>Apenas administradores podem criar jogos.</p>
          <button onClick={() => navigate('/games')} style={styles.backButton}>
            Voltar para Jogos
          </button>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate('/games')} style={styles.backLink}>
            ← Voltar
          </button>
          <h1 style={styles.title}>🎉 Criar Novo Jogo</h1>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
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
              <label style={styles.label}>Descrição *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o jogo e sua finalidade..."
                required
                rows={4}
                style={{ ...styles.input, resize: 'vertical' as const }}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Data e Hora *</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
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
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Máximo de Cartelas (deixe vazio para ilimitado)
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
              Defina como o valor arrecadado será distribuído. A soma deve ser 100%.
            </p>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>🏆 Prêmio (%)</label>
                <input
                  type="number"
                  value={prizePercent}
                  onChange={(e) => setPrizePercent(e.target.value)}
                  step="0.1"
                  min="0"
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

            <div style={styles.row}>
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
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>🚀 Evolução (%)</label>
                <input
                  type="number"
                  value={evolutionPercent}
                  onChange={(e) => setEvolutionPercent(e.target.value)}
                  step="0.1"
                  min="0"
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
                    Math.abs(
                      parseFloat(prizePercent || '0') +
                        parseFloat(parishPercent || '0') +
                        parseFloat(operationPercent || '0') +
                        parseFloat(evolutionPercent || '0') -
                        100
                    ) < 0.01
                      ? '#4CAF50'
                      : '#F44336',
                }}
              >
                {(
                  parseFloat(prizePercent || '0') +
                  parseFloat(parishPercent || '0') +
                  parseFloat(operationPercent || '0') +
                  parseFloat(evolutionPercent || '0')
                ).toFixed(1)}
                %
              </span>
            </div>
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/games')}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" style={styles.submitButton} disabled={loading}>
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
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '40px 20px',
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
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
    marginBottom: '30px',
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
    gap: '30px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
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
    margin: '-10px 0 0 0',
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
  row: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
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
