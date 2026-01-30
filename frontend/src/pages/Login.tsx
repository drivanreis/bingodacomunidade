import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppConfig } from '../config/appConfig';

const Login: React.FC = () => {
  const location = useLocation();
  const [cpf, setCpf] = useState(location.state?.cpf || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Obter configurações
  const appConfig = getAppConfig();

  // Auto-ocultar mensagem de erro após o tempo configurado
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, appConfig.errorMessageDuration * 1000); // Converter para milissegundos

      return () => clearTimeout(timer);
    }
  }, [error, appConfig.errorMessageDuration]);

  // Auto-ocultar mensagem de sucesso após o tempo configurado
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, appConfig.successMessageDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [success, appConfig.successMessageDuration]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Limpar CPF (remover pontos e traço)
    const cpfLimpo = cpf.replace(/\D/g, '');

    try {
      await login(cpfLimpo, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Capturamos a mensagem real do erro (que vem da API ou do interceptor)
      const mensagemErro = err.message || "Erro ao tentar fazer login. Verifique suas credenciais.";
      
      // Exibimos a mensagem na UI em vez de usar alert()
      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎉 Bingo da Comunidade</h1>
          <p style={styles.subtitle}>Sistema de Gestão Paroquial</p>
        </div>

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        {error && (
          <div style={{...styles.error, marginBottom: '20px'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
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
          </div>

          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div style={styles.links}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={styles.linkButton}
              disabled={loading}
            >
              🔑 Esqueci minha senha
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/signup')}
              style={styles.linkButton}
              disabled={loading}
            >
              Criar conta →
            </button>
          </div>
        </form>

        <div style={styles.footer}>
          <p style={styles.credentialsTitle}>Credenciais padrão para teste:</p>
          <div style={styles.credentialsBox}>
            <p><strong>Super Admin:</strong> admin@bingodacomunidade.com.br</p>
            <p><strong>Parish Admin:</strong> admin@paroquiasaojose.com.br</p>
            <p><strong>Senha:</strong> Admin@2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    padding: '40px',
    maxWidth: '450px',
    width: '100%',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  form: {
    marginBottom: '30px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    paddingRight: '45px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box' as const,
  },
  passwordContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute' as const,
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    marginTop: '10px',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  links: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '15px',
    gap: '10px',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '5px',
  },
  error: {
    backgroundColor: '#ffcdd2',
    color: '#d32f2f',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center' as const,
    fontSize: '0.9rem',
  },
  success: {
    background: '#efe',
    color: '#3c3',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    border: '1px solid #cfc',
    fontWeight: 'bold' as const,
  },
  footer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
  },
  credentialsTitle: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '10px',
    textAlign: 'center' as const,
  },
  credentialsBox: {
    background: '#f5f5f5',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: '1.6',
  },
};

export default Login;
