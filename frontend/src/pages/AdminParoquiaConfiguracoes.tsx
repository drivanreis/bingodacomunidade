import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { UF_OPTIONS } from '../utils/dddUf';

type CanalOperacional = 'whatsapp' | 'email' | 'sms';
const CANAIS_OPERACIONAIS: CanalOperacional[] = ['whatsapp', 'email', 'sms'];

const AdminParoquiaConfiguracoes: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [savingRateio, setSavingRateio] = React.useState(false);
  const [savingRemarcacao, setSavingRemarcacao] = React.useState(false);
  const [savingComunicacao, setSavingComunicacao] = React.useState(false);
  const [savingUf, setSavingUf] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState<'success' | 'error'>('success');

  const [allowedUfs, setAllowedUfs] = React.useState<string[]>([]);

  const [rateioPremio, setRateioPremio] = React.useState('50');
  const [rateioParoquia, setRateioParoquia] = React.useState('30');
  const [rateioOperacao, setRateioOperacao] = React.useState('15');
  const [rateioEvolucao, setRateioEvolucao] = React.useState('5');

  const [remarcacaoModo, setRemarcacaoModo] = React.useState<'single' | 'cascade' | 'assistida'>('assistida');
  const [remarcacaoJanelaDias, setRemarcacaoJanelaDias] = React.useState('7');

  const [canaisComunicacao, setCanaisComunicacao] = React.useState<CanalOperacional[]>(['whatsapp', 'email']);
  const [alertaConflito, setAlertaConflito] = React.useState(true);
  const [resumoDiario, setResumoDiario] = React.useState(false);

  const parsePercent = (value: string) => Number.parseFloat(value || '0');
  const premioValue = parsePercent(rateioPremio);
  const paroquiaValue = parsePercent(rateioParoquia);
  const operacaoValue = parsePercent(rateioOperacao);
  const evolucaoValue = parsePercent(rateioEvolucao);
  const totalRateio = premioValue + paroquiaValue + operacaoValue + evolucaoValue;
  const operacaoMinima = paroquiaValue / 3;

  const showError = (text: string) => {
    setMessageType('error');
    setMessage(text);
  };

  const showSuccess = (text: string) => {
    setMessageType('success');
    setMessage(text);
  };

  const parseCanaisComunicacao = (rawValue: string): CanalOperacional[] => {
    const normalized = String(rawValue || '').trim().toLowerCase();

    if (normalized === 'todos') {
      return [...CANAIS_OPERACIONAIS];
    }

    if (normalized === 'ambos') {
      return ['whatsapp', 'email'];
    }

    if (CANAIS_OPERACIONAIS.includes(normalized as CanalOperacional)) {
      return [normalized as CanalOperacional];
    }

    const parsed = normalized
      .split(',')
      .map((value) => value.trim())
      .filter((value): value is CanalOperacional => CANAIS_OPERACIONAIS.includes(value as CanalOperacional));

    return parsed.length > 0 ? Array.from(new Set(parsed)) : ['whatsapp', 'email'];
  };

  const toggleCanalComunicacao = (canal: CanalOperacional) => {
    setCanaisComunicacao((current) => {
      if (current.includes(canal)) {
        return current.filter((item) => item !== canal);
      }

      return [...current, canal];
    });
  };

  React.useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const response = await api.get('/configuracoes');
        const list = Array.isArray(response.data) ? response.data : [];
        const map = new Map<string, string>();
        list.forEach((item: { chave: string; valor: string }) => {
          map.set(item.chave, String(item.valor ?? ''));
        });

        const ufValue = map.get('signup_ufs_permitidas') || 'ALL';
        if (ufValue === 'ALL') {
          setAllowedUfs(UF_OPTIONS.map((item) => item.uf));
        } else {
          const parsed = ufValue
            .split(',')
            .map((value) => value.trim().toUpperCase())
            .filter(Boolean);
          setAllowedUfs(parsed.length > 0 ? parsed : UF_OPTIONS.map((item) => item.uf));
        }

        setRateioPremio(map.get('default_rateio_premio') || '50');
        setRateioParoquia(map.get('default_rateio_paroquia') || '30');
        setRateioOperacao(map.get('default_rateio_operacao') || '15');
        setRateioEvolucao(map.get('default_rateio_evolucao') || '5');

        const modo = (map.get('politica_remarcacao_modo') || 'assistida').toLowerCase();
        if (modo === 'single' || modo === 'cascade' || modo === 'assistida') {
          setRemarcacaoModo(modo);
        }
        setRemarcacaoJanelaDias(map.get('politica_remarcacao_janela_dias') || '7');

        setCanaisComunicacao(parseCanaisComunicacao(map.get('comunicacao_operacional_canal') || 'ambos'));

        setAlertaConflito((map.get('comunicacao_operacional_alerta_conflito') || 'true').toLowerCase() === 'true');
        setResumoDiario((map.get('comunicacao_operacional_resumo_diario') || 'false').toLowerCase() === 'true');
      } catch {
        showError('Não foi possível carregar configurações. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const toggleAllowedUf = (uf: string) => {
    setAllowedUfs((current) => {
      if (current.includes(uf)) {
        return current.filter((item) => item !== uf);
      }
      return [...current, uf];
    });
  };

  const saveUfConfig = async () => {
    if (allowedUfs.length === 0) {
      showError('Selecione pelo menos 1 estado permitido para cadastro público.');
      return;
    }

    setSavingUf(true);
    try {
      const allSelected = allowedUfs.length === UF_OPTIONS.length;
      const valor = allSelected ? 'ALL' : [...allowedUfs].sort().join(',');

      await api.put('/configuracoes/signup_ufs_permitidas', null, {
        params: { valor },
      });

      showSuccess('Estados permitidos salvos com sucesso.');
    } catch {
      showError('Falha ao salvar estados permitidos.');
    } finally {
      setSavingUf(false);
    }
  };

  const saveRateio = async () => {
    if (![premioValue, paroquiaValue, operacaoValue, evolucaoValue].every((n) => Number.isFinite(n))) {
      showError('Preencha os quatro rateios com números válidos.');
      return;
    }

    if (premioValue < 49) {
      showError('Prêmio não pode ser menor que 49%.');
      return;
    }

    if (evolucaoValue < 1) {
      showError('Seguro operacional não pode ser menor que 1%.');
      return;
    }

    if (operacaoValue + 0.0001 < operacaoMinima) {
      showError(`Operação não pode ser menor que 1/3 da Paróquia (${operacaoMinima.toFixed(2)}%).`);
      return;
    }

    if (Math.abs(totalRateio - 100) > 0.01) {
      showError('A soma dos rateios deve ser exatamente 100%.');
      return;
    }

    setSavingRateio(true);
    try {
      await Promise.all([
        api.put('/configuracoes/default_rateio_premio', null, { params: { valor: rateioPremio } }),
        api.put('/configuracoes/default_rateio_paroquia', null, { params: { valor: rateioParoquia } }),
        api.put('/configuracoes/default_rateio_operacao', null, { params: { valor: rateioOperacao } }),
        api.put('/configuracoes/default_rateio_evolucao', null, { params: { valor: rateioEvolucao } }),
      ]);
      showSuccess('Rateios padrão salvos com sucesso.');
    } catch {
      showError('Falha ao salvar rateios padrão.');
    } finally {
      setSavingRateio(false);
    }
  };

  const saveRemarcacao = async () => {
    setSavingRemarcacao(true);
    try {
      await Promise.all([
        api.put('/configuracoes/politica_remarcacao_modo', null, { params: { valor: remarcacaoModo } }),
        api.put('/configuracoes/politica_remarcacao_janela_dias', null, { params: { valor: remarcacaoJanelaDias } }),
      ]);
      showSuccess('Política de remarcação salva com sucesso.');
    } catch {
      showError('Falha ao salvar política de remarcação.');
    } finally {
      setSavingRemarcacao(false);
    }
  };

  const saveComunicacao = async () => {
    if (canaisComunicacao.length === 0) {
      showError('Selecione pelo menos 1 canal operacional.');
      return;
    }

    const ordered = CANAIS_OPERACIONAIS.filter((canal) => canaisComunicacao.includes(canal));
    let valorCanal = ordered.join(',');

    if (ordered.length === 3) {
      valorCanal = 'todos';
    } else if (ordered.length === 2 && ordered.includes('whatsapp') && ordered.includes('email')) {
      valorCanal = 'ambos';
    }

    setSavingComunicacao(true);
    try {
      await Promise.all([
        api.put('/configuracoes/comunicacao_operacional_canal', null, { params: { valor: valorCanal } }),
        api.put('/configuracoes/comunicacao_operacional_alerta_conflito', null, { params: { valor: String(alertaConflito) } }),
        api.put('/configuracoes/comunicacao_operacional_resumo_diario', null, { params: { valor: String(resumoDiario) } }),
      ]);
      showSuccess('Preferências de comunicação operacional salvas com sucesso.');
    } catch {
      showError('Falha ao salvar preferências de comunicação.');
    } finally {
      setSavingComunicacao(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          <button onClick={() => navigate('/admin-paroquia/dashboard')} style={styles.backButton}>
            ← Voltar ao Dashboard
          </button>

          <h1 style={styles.title}>⚙️ Configurações da Paróquia</h1>
          <p style={styles.description}>
            Esta área centraliza configurações operacionais da paróquia.
          </p>

          {loading && <p style={styles.loadingText}>Carregando configurações...</p>}

          {!loading && (
            <>
              <div style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>Cadastro Público por Estado</h2>
                <p style={styles.sectionDescription}>
                  Defina os estados (UF) permitidos para cadastro público de Usuário Comum.
                </p>

                <div style={styles.ufCheckboxGrid}>
                  {UF_OPTIONS.map((item) => (
                    <label key={item.uf} style={styles.ufCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={allowedUfs.includes(item.uf)}
                        onChange={() => toggleAllowedUf(item.uf)}
                        disabled={savingUf}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>

                <button onClick={saveUfConfig} style={styles.primaryButton} disabled={savingUf}>
                  {savingUf ? 'Salvando...' : 'Salvar Estados Permitidos'}
                </button>
              </div>

              <div style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>Rateios padrão por tipo de jogo</h2>
                <p style={styles.sectionDescription}>
                  Valores padrão aplicados ao criar novos jogos (podem ser ajustados caso a caso).
                </p>

                <div style={styles.grid4}>
                  <label style={styles.field}>
                    <span>Prêmio (%)</span>
                    <input type="number" value={rateioPremio} onChange={(e) => setRateioPremio(e.target.value)} style={styles.input} min="0" max="100" step="0.1" />
                  </label>
                  <label style={styles.field}>
                    <span>Paróquia (%)</span>
                    <input type="number" value={rateioParoquia} onChange={(e) => setRateioParoquia(e.target.value)} style={styles.input} min="0" max="100" step="0.1" />
                  </label>
                  <label style={styles.field}>
                    <span>Operação (%)</span>
                    <input type="number" value={rateioOperacao} onChange={(e) => setRateioOperacao(e.target.value)} style={styles.input} min="0" max="100" step="0.1" />
                  </label>
                  <label style={styles.field}>
                    <span>Seguro Operacional (%)</span>
                    <input type="number" value={rateioEvolucao} onChange={(e) => setRateioEvolucao(e.target.value)} style={styles.input} min="0" max="100" step="0.1" />
                  </label>
                </div>

                <p style={styles.rateioHint}>
                  Soma atual: <strong>{totalRateio.toFixed(2)}%</strong> · Operação mínima: <strong>{operacaoMinima.toFixed(2)}%</strong>
                </p>

                <button onClick={saveRateio} style={styles.primaryButton} disabled={savingRateio}>
                  {savingRateio ? 'Salvando...' : 'Salvar Rateios Padrão'}
                </button>
              </div>

              <div style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>Política de remarcação e conflitos</h2>
                <p style={styles.sectionDescription}>
                  Defina o comportamento padrão ao adiar sorteios e a janela de impacto para sugerir cascata.
                </p>

                <div style={styles.grid2}>
                  <label style={styles.field}>
                    <span>Modo padrão</span>
                    <select value={remarcacaoModo} onChange={(e) => setRemarcacaoModo(e.target.value as 'single' | 'cascade' | 'assistida')} style={styles.input}>
                      <option value="assistida">Assistida (recomendado)</option>
                      <option value="single">Somente este jogo</option>
                      <option value="cascade">Este jogo + próximos</option>
                    </select>
                  </label>

                  <label style={styles.field}>
                    <span>Janela para sugerir cascata (dias)</span>
                    <input type="number" value={remarcacaoJanelaDias} onChange={(e) => setRemarcacaoJanelaDias(e.target.value)} style={styles.input} min="0" max="60" step="1" />
                  </label>
                </div>

                <button onClick={saveRemarcacao} style={styles.primaryButton} disabled={savingRemarcacao}>
                  {savingRemarcacao ? 'Salvando...' : 'Salvar Política de Remarcação'}
                </button>
              </div>

              <div style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>Preferências de comunicação operacional</h2>
                <p style={styles.sectionDescription}>
                  Configure como a equipe recebe alertas e resumos operacionais.
                </p>

                <div style={styles.grid2}>
                  <div style={styles.field}>
                    <span>Canais operacionais</span>
                    <label style={styles.checkboxLine}>
                      <input
                        type="checkbox"
                        checked={canaisComunicacao.includes('whatsapp')}
                        onChange={() => toggleCanalComunicacao('whatsapp')}
                      />
                      <span>WhatsApp</span>
                    </label>
                    <label style={styles.checkboxLine}>
                      <input
                        type="checkbox"
                        checked={canaisComunicacao.includes('email')}
                        onChange={() => toggleCanalComunicacao('email')}
                      />
                      <span>E-mail</span>
                    </label>
                    <label style={styles.checkboxLine}>
                      <input
                        type="checkbox"
                        checked={canaisComunicacao.includes('sms')}
                        onChange={() => toggleCanalComunicacao('sms')}
                      />
                      <span>SMS</span>
                    </label>
                  </div>

                  <div style={styles.field}>
                    <span>Alertas</span>
                    <label style={styles.checkboxLine}>
                      <input type="checkbox" checked={alertaConflito} onChange={(e) => setAlertaConflito(e.target.checked)} />
                      <span>Notificar conflito de cronograma</span>
                    </label>
                    <label style={styles.checkboxLine}>
                      <input type="checkbox" checked={resumoDiario} onChange={(e) => setResumoDiario(e.target.checked)} />
                      <span>Resumo diário operacional</span>
                    </label>
                  </div>
                </div>

                <button onClick={saveComunicacao} style={styles.primaryButton} disabled={savingComunicacao}>
                  {savingComunicacao ? 'Salvando...' : 'Salvar Comunicação Operacional'}
                </button>
              </div>
            </>
          )}

          {message && <div style={{ ...styles.messageBox, ...(messageType === 'error' ? styles.messageBoxError : {}) }}>{message}</div>}
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 64px)',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '24px',
  },
  card: {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 12px 0',
    color: '#1f2937',
  },
  description: {
    margin: '0 0 16px 0',
    color: '#4b5563',
    lineHeight: 1.5,
  },
  loadingText: {
    color: '#475569',
    marginBottom: '12px',
  },
  sectionCard: {
    border: '1px solid #dbeafe',
    background: '#f8fbff',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '12px',
  },
  sectionTitle: {
    margin: '0 0 6px 0',
    color: '#1e3a8a',
    fontSize: '17px',
  },
  sectionDescription: {
    margin: '0 0 10px 0',
    color: '#334155',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  ufCheckboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px 12px',
    marginBottom: '12px',
  },
  ufCheckboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#0f172a',
    background: '#ffffff',
    border: '1px solid #dbeafe',
    borderRadius: '8px',
    padding: '8px 10px',
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    marginBottom: '12px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px',
    marginBottom: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    fontSize: '13px',
    color: '#334155',
  },
  input: {
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    padding: '0 10px',
    fontSize: '14px',
    color: '#1f2937',
    background: '#fff',
  },
  checkboxLine: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '4px',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    color: '#ffffff',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rateioHint: {
    margin: '0 0 10px 0',
    fontSize: '13px',
    color: '#334155',
  },
  messageBox: {
    border: '1px solid #c7f0d8',
    background: '#f0fff7',
    borderRadius: '10px',
    padding: '10px',
    color: '#166534',
    fontWeight: 600,
  },
  messageBoxError: {
    border: '1px solid #fbcaca',
    background: '#fff1f2',
    color: '#991b1b',
  },
};

export default AdminParoquiaConfiguracoes;
