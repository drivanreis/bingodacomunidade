/**
 * Admin Paróquia Login
 * 
 * Página de login para Administradores Paroquiais
 * Rota: /admin-paroquia/login
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { clearSessionScope, setSessionScope } from '../utils/sessionScope';
import './AdminParoquiaLogin.css';

const AdminParoquiaLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('@BingoComunidade:token');
    localStorage.removeItem('@BingoComunidade:user');
    localStorage.removeItem('@BingoComunidade:bootstrap');
    clearSessionScope();
  }, []);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes('@') || /[a-zA-Z]/.test(value)) {
      setIdentifier(value);
      return;
    }
    const formatted = formatCPF(value);
    setIdentifier(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginValue = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : identifier.replace(/\D/g, '');

      // Chamar endpoint específico de Admin Paroquial
      const response = await api.post('/auth/admin-paroquia/login', {
        login: loginValue,
        senha: password
      });

      const { access_token, usuario } = response.data;

      // Verificar se é administrador paroquial
      const paroquialRoles = ['paroquia_admin', 'paroquia_caixa', 'paroquia_recepcao', 'paroquia_bingo', 'usuario_administrativo', 'usuario_administrador'];
      const tipoUsuario = (usuario?.tipo || '').toString().toLowerCase();
      const nivelAcesso = (usuario?.nivel_acesso || '').toString().toLowerCase();
      const isAdminSiteProfile = nivelAcesso === 'admin_site' || tipoUsuario === 'admin_site';
      if (isAdminSiteProfile || (nivelAcesso !== 'admin_paroquia' && !paroquialRoles.includes(tipoUsuario))) {
        setError('Acesso negado. Esta área é exclusiva para administradores paroquiais.');
        return;
      }

      // Salvar token e usuário
      localStorage.setItem('@BingoComunidade:token', access_token);
      localStorage.setItem('@BingoComunidade:user', JSON.stringify(usuario));
      setSessionScope('admin_paroquia');
      
      // Configurar header de autorização
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Redirecionar para dashboard paroquial
      navigate('/admin-paroquia/dashboard');
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      const error = err as { response?: { status?: number; data?: { detail?: unknown } } };
      const detail = error.response?.data?.detail;

      if (error.response?.status === 428 && detail && typeof detail === 'object' && (detail as any).needs_password_change) {
        navigate('/admin-paroquia/primeira-senha', {
          state: {
            login: identifier.includes('@') ? identifier.trim().toLowerCase() : identifier.replace(/\D/g, ''),
            senhaAtual: password,
          },
        });
        return;
      }

      setError(typeof detail === 'string' ? detail : 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apl-container">
      <div className="apl-loginBox">
        <div className="apl-header">
          <h1 className="apl-title">⛪ Admin Paróquia</h1>
          <p className="apl-subtitle">Área Administrativa - Paróquia</p>
        </div>

        <form onSubmit={handleSubmit} className="apl-form">
          {error && (
            <div className="apl-errorBox">
              <span className="apl-errorIcon">⚠️</span>
              {error}
            </div>
          )}

          <div className="apl-inputGroup">
            <label className="apl-label">Login ou Email</label>
            <input
              type="text"
              value={identifier}
              onChange={handleIdentifierChange}
              placeholder="login ou email@dominio.com"
              className="apl-input"
              required
              autoFocus
            />
          </div>

          <div className="apl-inputGroup">
            <label className="apl-label">Senha</label>
            <div className="apl-passwordContainer">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="apl-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="apl-eyeButton"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`apl-button ${loading ? 'apl-buttonDisabled' : ''}`}
            disabled={loading}
          >
            {loading ? '🔄 Autenticando...' : '🔐 Acessar Sistema'}
          </button>
        </form>

        <div className="apl-footer">
          <p className="apl-footerText">
            🔒 Área restrita - Administradores Paroquiais
          </p>
          <button
            onClick={() => navigate('/')}
            className="apl-backButton"
          >
            ← Voltar para Home
          </button>
        </div>
      </div>

      <div className="apl-infoBox">
        <h3 className="apl-infoTitle">⛪ Admin Paroquial</h3>
        <ul className="apl-infoList">
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

export default AdminParoquiaLogin;
