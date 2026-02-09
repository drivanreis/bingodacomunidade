/**
 * Admin Site Login
 * 
 * Página de login EXCLUSIVA para SUPER_ADMIN
 * Rota: /admin-site/login
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminSiteLogin: React.FC = () => {
  useEffect(() => {
    // Limpar resíduos de sessão anteriores ao entrar no login administrativo
    localStorage.removeItem('@BingoComunidade:token');
    localStorage.removeItem('@BingoComunidade:user');
    localStorage.removeItem('@BingoComunidade:bootstrap');
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Chamar endpoint específico de ADMIN_SITE
      const response = await api.post('/auth/admin-site/login', {
        login: username,
        senha: password
      });

      const { access_token, usuario } = response.data;

      // Verificar se é realmente ADMIN_SITE (normalizar case)
      const nivelAcesso = (usuario?.nivel_acesso || '').toString().toLowerCase();
      const loginUsuario = (usuario?.login || '').toString();
      const tipoUsuario = (usuario?.tipo || '').toString().toLowerCase();
      if (nivelAcesso !== 'admin_site' && loginUsuario !== 'Admin' && tipoUsuario !== 'usuario_administrativo') {
        setError('Acesso negado. Esta área é exclusiva para Administradores do Site.');
        return;
      }

      // Salvar token e usuário
      localStorage.setItem('@BingoComunidade:token', access_token);
      localStorage.setItem('@BingoComunidade:user', JSON.stringify(usuario));
      
      // Configurar header de autorização
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Se ainda é bootstrap, forçar primeiro acesso
      if (usuario?.login === 'Admin' && !usuario?.email) {
        navigate('/first-access-setup');
        return;
      }

      // Redirecionar para dashboard administrativo
      navigate('/admin-site/dashboard');
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      const error = err as { response?: { data?: { detail?: string } ; status?: number } };
      const mensagem = error.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.';

      // Tentar login bootstrap (Admin/admin123)
      if (username.trim().toLowerCase() === 'admin') {
        const bootstrapResponse = await api.post(
          '/auth/bootstrap/login',
          {
            login: username,
            senha: password,
          },
          {
            validateStatus: () => true,
          }
        );

        if (bootstrapResponse.status >= 200 && bootstrapResponse.status < 300 && bootstrapResponse.data?.bootstrap) {
          localStorage.setItem('@BingoComunidade:bootstrap', 'true');
          navigate('/first-access-setup');
          return;
        }

        if (bootstrapResponse.status === 404) {
          setError('O primeiro acesso já foi concluído! Entre com as credenciais que você cadastrou.');
          return;
        }

        const bootstrapDetail = bootstrapResponse.data?.detail;
        if (bootstrapDetail && typeof bootstrapDetail === 'string') {
          setError(bootstrapDetail);
          return;
        }
      }

      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>👑 Admin Site</h1>
          <p style={styles.subtitle}>Área Exclusiva - Super Administrador</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>CPF ou Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="CPF ou email@dominio.com"
              style={styles.input}
              required
              autoFocus
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
          <div style={styles.credentialsBox}>
            <p style={styles.credentialsTitle}>Para o primeiro acesso, utilize:</p>
            <p><strong>Usuário:</strong> Admin</p>
            <p><strong>Senha:</strong> admin123</p>
            <p style={styles.credentialsHint}>
              Após o login, complete o cadastro real do Administrador do site em até 30 dias.
            </p>
          </div>
          <p style={styles.footerText}>
            🔒 Área restrita - Apenas Super Administradores
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
        <h3 style={styles.infoTitle}>⚡ Super Admin</h3>
        <ul style={styles.infoList}>
          <li>Gerenciamento completo do sistema</li>
          <li>Controle de paróquias</li>
          <li>Gestão de usuários administrativos</li>
          <li>Configurações globais</li>
          <li>Relatórios e auditoria</li>
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
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
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
    color: '#1e3c72',
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
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
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
  credentialsBox: {
    background: '#f5f5f5',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  credentialsTitle: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '10px',
    textAlign: 'center' as const,
  },
  credentialsHint: {
    fontSize: '12px',
    color: '#888',
  },
  footerText: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '15px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#1e3c72',
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
    color: '#1e3c72',
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

export default AdminSiteLogin;
