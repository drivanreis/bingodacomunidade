import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Dados do formulário
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [chavePix, setChavePix] = useState('');
  
  // Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carregar dados completos do usuário ao montar o componente
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.cpf) {
        setLoadingData(false);
        return;
      }

      try {
        const cpfLimpo = user.cpf.replace(/\D/g, '');
        const response = await api.get(`/auth/profile/${cpfLimpo}`);
        
        const userData = response.data;
        setNome(userData.nome || '');
        setCpf(userData.cpf || '');
        setEmail(userData.email || '');
        
        // Formatar WhatsApp se existir
        if (userData.whatsapp) {
          const whatsappNumeros = userData.whatsapp.replace(/\D/g, '');
          if (whatsappNumeros.length >= 13) {
            // Remove +55 e formata
            const semPrefixo = whatsappNumeros.substring(2);
            setWhatsapp(formatWhatsApp(semPrefixo));
          }
        }
        
        setChavePix(userData.chave_pix || '');
      } catch (err) {
        console.error('Erro ao carregar dados do perfil:', err);
        // Se der erro, usa os dados do contexto mesmo
        if (user) {
          setNome(user.name || '');
          setCpf(user.cpf || '');
          setEmail(user.email || '');
        }
      } finally {
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user]);

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 13) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };
  const handleCancel = () => {
    setEditing(false);
    setChangingPassword(false);
    setNome(user?.name || '');
    setEmail(user?.email || '');
    setWhatsapp('');
    setChavePix('');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (nome.trim().length < 3) {
      setError('❌ Nome deve ter pelo menos 3 caracteres');
      return;
    }

    if (changingPassword) {
      if (!senhaAtual || !novaSenha) {
        setError('❌ Preencha a senha atual e a nova senha');
        return;
      }

      if (novaSenha !== confirmarSenha) {
        setError('❌ As senhas não coincidem');
        return;
      }

      if (novaSenha.length < 6 || novaSenha.length > 16) {
        setError('❌ Senha deve ter entre 6 e 16 caracteres');
        return;
      }
    }

    setLoading(true);

    try {
      const whatsappLimpo = whatsapp ? whatsapp.replace(/\D/g, '') : undefined;
      
      const payload: {
        nome: string;
        email?: string;
        whatsapp?: string;
        chave_pix?: string;
        senha_atual?: string;
        nova_senha?: string;
      } = {
        nome: nome.trim()
      };

      if (email && email.trim()) {
        payload.email = email.trim();
      }

      if (whatsappLimpo && whatsappLimpo.length === 11) {
        payload.whatsapp = `+55${whatsappLimpo}`;
      }

      if (chavePix && chavePix.trim()) {
        payload.chave_pix = chavePix.trim();
      }

      if (changingPassword && senhaAtual && novaSenha) {
        payload.senha_atual = senhaAtual;
        payload.nova_senha = novaSenha;
      }

      const cpfLimpo = cpf.replace(/\D/g, '');
      await api.put(`/auth/profile/${cpfLimpo}`, payload);

      // Atualizar contexto com os novos dados
      updateUser({
        name: payload.nome,
        email: payload.email || user?.email || ''
      });

      setSuccess('✅ Perfil atualizado com sucesso!');
      setEditing(false);
      setChangingPassword(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Erro ao atualizar perfil:', err);
      
      let errorMessage = '❌ Erro ao atualizar perfil. Tente novamente.';
      
      if (err && typeof err === 'object') {
        const error = err as { 
          response?: { data?: { detail?: string } }; 
          message?: string;
        };
        
        if (error.response?.data?.detail) {
          errorMessage = `❌ ${error.response.data.detail}`;
        } else if (error.message) {
          const cleanMessage = error.message.replace('Error: ', '');
          errorMessage = `❌ ${cleanMessage}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    if (!user) return '';
    const roles: Record<string, string> = {
      super_admin: 'Super Admin',
      parish_admin: 'Admin Paroquial',
      fiel: 'Fiel'
    };
    return roles[user.role] || user.role;
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        {loadingData ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Carregando dados do perfil...</p>
          </div>
        ) : (
          <>
            <div style={styles.header}>
              <div style={styles.avatarSection}>
                <div style={styles.avatar}>
                  {nome.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 style={styles.title}>{nome || 'Usuário'}</h1>
                  <span style={styles.badge}>{getRoleLabel()}</span>
                </div>
              </div>
            </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            {success}
          </div>
        )}

        {!editing ? (
          <div style={styles.viewMode}>
            <h2 style={styles.sectionTitle}>📋 Editar Perfil</h2>
            <p style={styles.subtitle}>Você pode atualizar suas informações pessoais</p>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Nome Completo:</span>
                <span style={styles.infoValue}>{nome || 'Não informado'}</span>
              </div>

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>CPF:</span>
                <span style={styles.infoValue}>{cpf || 'Não informado'}</span>
                <span style={styles.infoNote}>⚠️ CPF não pode ser alterado</span>
              </div>

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Email:</span>
                <span style={styles.infoValue}>{email || 'Não informado'}</span>
              </div>

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>WhatsApp:</span>
                <span style={styles.infoValue}>{whatsapp || 'Não informado'}</span>
              </div>

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Chave PIX:</span>
                <span style={styles.infoValue}>{chavePix || 'Não informado'}</span>
              </div>
            </div>

            <button
              onClick={() => setEditing(true)}
              style={styles.editButton}
            >
              ✏️ Editar Perfil
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              style={styles.backButton}
            >
              ← Voltar para Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <h2 style={styles.sectionTitle}>✏️ Editar Perfil</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Nome Completo <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                style={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                CPF <span style={styles.readOnly}>(não editável)</span>
              </label>
              <input
                type="text"
                value={cpf}
                style={{...styles.input, ...styles.inputDisabled}}
                disabled
              />
              <p style={styles.hint}>
                ⚠️ O CPF é sua identidade única e não pode ser alterado
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={styles.input}
                disabled={loading}
              />
              <p style={styles.hint}>
                Email para receber notificações
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                WhatsApp
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={handleWhatsAppChange}
                placeholder="(85) 99999-9999"
                maxLength={15}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Chave PIX
              </label>
              <input
                type="text"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                placeholder="CPF, email, telefone ou chave aleatória"
                style={styles.input}
                disabled={loading}
              />
              <p style={styles.hint}>
                Necessário para receber prêmios automaticamente
              </p>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.passwordSection}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={changingPassword}
                  onChange={(e) => setChangingPassword(e.target.checked)}
                  disabled={loading}
                />
                <span>Quero trocar minha senha</span>
              </label>
            </div>

            {changingPassword && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Senha Atual <span style={styles.required}>*</span>
                  </label>
                  <div style={styles.passwordContainer}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Digite sua senha atual"
                      style={styles.input}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      {showCurrentPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Nova Senha <span style={styles.required}>*</span>
                  </label>
                  <div style={styles.passwordContainer}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Digite sua nova senha"
                      style={styles.input}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <p style={styles.hint}>
                    Mínimo 6 caracteres: maiúscula, minúscula, número e especial
                  </p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Confirmar Nova Senha <span style={styles.required}>*</span>
                  </label>
                  <div style={styles.passwordContainer}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Digite novamente a nova senha"
                      style={styles.input}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div style={styles.buttonGroup}>
              <button
                type="submit"
                style={{
                  ...styles.saveButton,
                  ...(loading ? styles.buttonDisabled : {})
                }}
                disabled={loading}
              >
                {loading ? '⏳ Salvando...' : '💾 Salvar Alterações'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                style={styles.cancelButton}
                disabled={loading}
              >
                ✖️ Cancelar
              </button>
            </div>
          </form>
        )}
        </>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  spinner: {
    width: '50px',
    height: '50px',
    margin: '0 auto 20px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  formCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  header: {
    marginBottom: '30px'
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: '#4CAF50',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  errorBox: {
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    color: '#c33',
    fontSize: '14px'
  },
  successBox: {
    background: '#efe',
    border: '1px solid #cfc',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    color: '#3c3',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  viewMode: {
    marginTop: '20px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500'
  },
  infoNote: {
    fontSize: '11px',
    color: '#f59e0b',
    marginTop: '5px'
  },
  editButton: {
    width: '100%',
    padding: '14px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  backButton: {
    width: '100%',
    padding: '12px',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  form: {
    marginTop: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  required: {
    color: '#ef4444'
  },
  readOnly: {
    color: '#999',
    fontSize: '12px',
    fontWeight: 'normal'
  },
  input: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border 0.3s',
    boxSizing: 'border-box'
  },
  inputDisabled: {
    background: '#f5f5f5',
    color: '#999',
    cursor: 'not-allowed'
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '5px'
  },
  divider: {
    height: '1px',
    background: '#e0e0e0',
    margin: '30px 0'
  },
  passwordSection: {
    marginBottom: '20px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    userSelect: 'none'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '30px'
  },
  saveButton: {
    flex: 1,
    padding: '14px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};

export default Profile;
