/**
 * Admin Paróquia Login
 * 
 * Página de login para Administradores Paroquiais
 * Rota: /admin-paroquia/login
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminParoquiaLogin: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Remover formatação do CPF
      const cleanCPF = cpf.replace(/\D/g, '');

      // Chamar endpoint específico de Admin Paroquial
      const response = await api.post('/auth/admin-paroquia/login', {
        cpf: cleanCPF,
        senha: password
      });

      const { access_token, usuario } = response.data;

      // Verificar se é administrador paroquial
      const paroquialRoles = ['paroquia_admin', 'paroquia_caixa', 'paroquia_recepcao', 'paroquia_bingo'];
      if (!paroquialRoles.includes(usuario.tipo)) {
        setError('Acesso negado. Esta área é exclusiva para administradores paroquiais.');
        return;
      }

      // Salvar token e usuário
      localStorage.setItem('@BingoComunidade:token', access_token);
      localStorage.setItem('@BingoComunidade:user', JSON.stringify(usuario));
      
      // Configurar header de autorização
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Redirecionar para dashboard paroquial
      navigate('/admin-paroquia/dashboard');
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>⛪ Admin Paróquia</h1>
          <p style={styles.subtitle}>Área Administrativa - Paróquia</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              style={styles.input}
              required
              autoFocus
              maxLength={14}
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
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
            disabled={loading}
          >
            {loading ? '🔄 Autenticando...' : '🔐 Acessar Sistema'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            🔒 Área restrita - Administradores Paroquiais
          </p>
          <button
            onClick={() => navigate('/')}
            style={styles.backButton}
          >
            ← Voltar para Home
          </button>
        </div>
      </div>

      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>⛪ Admin Paroquial</h3>
        <ul style={styles.infoList}>
          <li>Gerenciamento de jogos da paróquia</li>
          <li>Controle de vendas e caixa</li>
          <li>Recepção e validação de cartelas</li>
          <li>Coordenação de sorteios</li>
          <li>Relatórios paroquiais</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    gap: '40px',
  } as React.CSSProperties,
  loginBox: {
    background: 'white',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    color: '#667eea',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  errorBox: {
    background: '#fee',
    color: '#c00',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #fcc',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  } as React.CSSProperties,
  errorIcon: {
    fontSize: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '12px 15px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border 0.3s',
  } as React.CSSProperties,
  passwordContainer: {
    position: 'relative' as const,
  },
  eyeButton: {
    position: 'absolute' as const,
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
  },
  button: {
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '10px',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '15px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'underline',
  } as React.CSSProperties,
  infoBox: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '300px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  } as React.CSSProperties,
  infoTitle: {
    fontSize: '20px',
    color: '#667eea',
    marginBottom: '15px',
    fontWeight: 'bold',
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '14px',
    color: '#555',
    lineHeight: '2',
  } as React.CSSProperties,
};

export default AdminParoquiaLogin;
