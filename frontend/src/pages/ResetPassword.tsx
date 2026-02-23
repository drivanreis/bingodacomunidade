import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Pegar token da URL ou do state
  const urlToken = searchParams.get('token');
  const stateToken = location.state?.token;
  const initialToken = urlToken ?? stateToken ?? '';
  
  const [token, setToken] = useState(initialToken);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenInvalid, setTokenInvalid] = useState(!initialToken);

  // Carregar token da URL ao montar o componente
  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
      setTokenInvalid(false);
      return;
    }

    if (stateToken) {
      setToken(stateToken);
      setTokenInvalid(false);
      return;
    }

    setToken('');
    setTokenInvalid(true);
    setError('');
  }, [urlToken, stateToken]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
    if (password.length > 16) return 'Senha deve ter no máximo 16 caracteres';
    if (!/[A-Z]/.test(password)) return 'Senha deve conter pelo menos uma letra maiúscula';
    if (!/[a-z]/.test(password)) return 'Senha deve conter pelo menos uma letra minúscula';
    if (!/[0-9]/.test(password)) return 'Senha deve conter pelo menos um número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Senha deve conter pelo menos um caractere especial';
    return null;
  };

  const handleSubmit = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (!token.trim()) {
      setError('❌ Token de recuperação é obrigatório');
      return;
    }

    const passwordError = validatePassword(novaSenha);
    if (passwordError) {
      setError(`❌ ${passwordError}`);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('❌ As senhas não coincidem');
      return;
    }

    setLoading(true);

    void (async () => {
      try {
        await api.post('/auth/reset-password', {
          token: token.trim(),
          nova_senha: novaSenha
        });

        setSuccess('✅ Senha redefinida com sucesso! Redirecionando para login...');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: '✅ Senha alterada! Faça login com sua nova senha.'
            } 
          });
        }, 2000);
      } catch (err) {
        console.error('❌ Erro ao redefinir senha:', err);
        
        let errorMessage = '❌ Erro ao redefinir senha. Tente novamente.';
        
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
    })();
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔐 Redefinir Senha</h1>
          <p style={styles.subtitle}>Digite sua nova senha abaixo</p>
        </div>

        {error && !tokenInvalid && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            {success}
          </div>
        )}

        {tokenInvalid ? (
          <div style={styles.invalidTokenContainer}>
            <p style={styles.invalidTokenIcon}>⚠️</p>
            <h2 style={styles.invalidTokenTitle}>Link Inválido ou Expirado</h2>
            <p style={styles.invalidTokenText}>
              O link de recuperação que você tentou acessar não é válido ou já expirou.
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              style={styles.button}
            >
              Solicitar Novo Link
            </button>
            <button
              onClick={() => navigate('/login')}
              style={styles.linkButton}
            >
              Voltar para Login
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e)} style={styles.form} noValidate>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Nova Senha <span style={styles.required}>*</span>
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                style={styles.input}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
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
                required
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

          <button
            type="button"
            onClick={() => handleSubmit()}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? '⏳ Redefinindo senha...' : '🔐 Redefinir Senha'}
          </button>

          <div style={styles.links}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={styles.linkButton}
              disabled={loading}
            >
              ← Voltar para Login
            </button>
          </div>
        </form>
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
  formCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '500px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666'
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
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
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
  button: {
    width: '100%',
    padding: '14px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
    marginBottom: '20px'
  },
  buttonDisabled: {
    background: '#999',
    cursor: 'not-allowed'
  },
  links: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '5px'
  },
  invalidTokenContainer: {
    textAlign: 'center',
    padding: '20px'
  },
  invalidTokenIcon: {
    fontSize: '64px',
    margin: '0 0 20px 0'
  },
  invalidTokenTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 15px 0'
  },
  invalidTokenText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '30px'
  }
};

export default ResetPassword;
