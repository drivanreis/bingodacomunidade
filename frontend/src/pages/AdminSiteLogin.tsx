/**
 * Admin Site Login
 * 
 * Página de login EXCLUSIVA para SUPER_ADMIN
 * Rota: /admin-site/login
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { clearSessionScope, setSessionScope } from '../utils/sessionScope';
import './AdminSiteLogin.css';

const AdminSiteLogin: React.FC = () => {
  useEffect(() => {
    // Limpar resíduos de sessão anteriores ao entrar no login administrativo
    localStorage.removeItem('@BingoComunidade:token');
    localStorage.removeItem('@BingoComunidade:user');
    localStorage.removeItem('@BingoComunidade:bootstrap');
    clearSessionScope();
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapAvailable, setBootstrapAvailable] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadBootstrapStatus = async () => {
      try {
        const response = await api.get('/auth/bootstrap/status', {
          validateStatus: () => true,
        });

        if (!mounted) {
          return;
        }

        if (response.status >= 200 && response.status < 300) {
          setBootstrapAvailable(Boolean(response.data?.bootstrap_available));
        }
      } catch {
        if (mounted) {
          setBootstrapAvailable(true);
        }
      }
    };

    loadBootstrapStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginInformado = username.trim();
    const isSeedLoginAttempt = loginInformado.toLowerCase() === 'admin';

    if (isSeedLoginAttempt) {
      if (!bootstrapAvailable) {
        setError('O primeiro acesso já foi concluído! Entre com as credenciais que você cadastrou.');
        setLoading(false);
        return;
      }

      try {
        const bootstrapResponse = await api.post(
          '/auth/bootstrap/login',
          {
            login: loginInformado,
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
          setBootstrapAvailable(false);
          setError('O primeiro acesso já foi concluído! Entre com as credenciais que você cadastrou.');
          return;
        }

        const bootstrapDetail = bootstrapResponse.data?.detail;
        if (bootstrapDetail && typeof bootstrapDetail === 'string') {
          setError(bootstrapDetail);
          return;
        }

        setError('Login ou senha incorretos');
        return;
      } catch (err) {
        console.error('Erro ao fazer login bootstrap:', err);
        setError('Erro ao fazer login. Verifique suas credenciais.');
        return;
      } finally {
        setLoading(false);
      }
    }

    try {
      // Chamar endpoint específico de ADMIN_SITE
      const response = await api.post('/auth/admin-site/login', {
        login: loginInformado,
        senha: password
      });

      const { access_token, usuario } = response.data;

      // Verificar se é realmente ADMIN_SITE (normalizar case)
      const nivelAcesso = (usuario?.nivel_acesso || '').toString().toLowerCase();
      const loginUsuario = (usuario?.login || '').toString();
      const isBootstrap = loginUsuario === 'Admin';
      const isAdminSite = nivelAcesso === 'admin_site';

      if (!isAdminSite && !isBootstrap) {
        setError('Acesso negado. Esta área é exclusiva para Administradores do Site.');
        return;
      }

      // Salvar token e usuário
      localStorage.setItem('@BingoComunidade:token', access_token);
      localStorage.setItem('@BingoComunidade:user', JSON.stringify(usuario));
      setSessionScope('admin_site');
      
      // Configurar header de autorização
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Se ainda é bootstrap, forçar primeiro acesso
      if (usuario?.login === 'Admin' && !usuario?.email) {
        setBootstrapAvailable(true);
        navigate('/first-access-setup');
        return;
      }

      // Redirecionar para dashboard administrativo
      navigate('/admin-site/dashboard');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } ; status?: number } };
      if (error.response?.status !== 401) {
        console.error('Erro ao fazer login:', err);
      }
      const detail = error.response?.data?.detail as unknown;

      if (error.response?.status === 428 && detail && typeof detail === 'object' && (detail as any).needs_password_change) {
        navigate('/admin-site/primeira-senha', {
          state: {
            login: username.trim(),
            senhaAtual: password,
          },
        });
        return;
      }

      const mensagem = typeof detail === 'string'
        ? detail
        : 'Erro ao fazer login. Verifique suas credenciais.';

      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asl-container">
      <div className="asl-loginBox">
        <div className="asl-header">
          <h1 className="asl-title">👑 Admin Site</h1>
          <p className="asl-subtitle">Área Exclusiva - Super Administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="asl-form">
          {error && (
            <div className="asl-errorBox">
              <span className="asl-errorIcon">⚠️</span>
              {error}
            </div>
          )}

          <div className="asl-inputGroup">
            <label className="asl-label">Login ou Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="login ou email@dominio.com"
              className="asl-input"
              required
              autoFocus
            />
          </div>

          <div className="asl-inputGroup">
            <label className="asl-label">Senha</label>
            <div className="asl-passwordContainer">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="asl-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="asl-eyeButton"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`asl-button ${loading ? 'asl-buttonDisabled' : ''}`}
            disabled={loading}
          >
            {loading ? '🔄 Autenticando...' : '🔐 Acessar Sistema'}
          </button>
        </form>

        <div className="asl-footer">
          {bootstrapAvailable && (
            <div className="asl-credentialsBox">
              <p className="asl-credentialsTitle">Para o primeiro acesso, utilize:</p>
              <p><strong>Usuário:</strong> Admin</p>
              <p><strong>Senha:</strong> admin123</p>
              <p className="asl-credentialsHint">
                Após o login, complete o cadastro real do Administrador do site em até 30 dias.
              </p>
            </div>
          )}
          <p className="asl-footerText">
            🔒 Área restrita - Apenas Super Administradores
          </p>
          <button
            onClick={() => navigate('/')}
            className="asl-backButton"
          >
            ← Voltar para Home
          </button>
        </div>
      </div>

      <div className="asl-infoBox">
        <h3 className="asl-infoTitle">⚡ Super Admin</h3>
        <ul className="asl-infoList">
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

export default AdminSiteLogin;
