import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppConfigSync } from '../services/configService';
import { resolveDashboardPath } from '../utils/sessionScope';
import './Login.css';

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
  const appConfig = getAppConfigSync();

  // Auto-ocultar mensagem de erro após o tempo configurado
  useEffect(() => {
    if (error) {
      const durationMs = (appConfig.errorMessageDuration ?? 3) * 1000;
      const timer = setTimeout(() => {
        setError('');
      }, durationMs); // Converter para milissegundos

      return () => clearTimeout(timer);
    }
  }, [error, appConfig.errorMessageDuration]);

  // Auto-ocultar mensagem de sucesso após o tempo configurado
  useEffect(() => {
    if (success) {
      const durationMs = (appConfig.successMessageDuration ?? 2) * 1000;
      const timer = setTimeout(() => {
        setSuccess('');
      }, durationMs);

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
    const value = e.target.value;
    if (/[a-zA-Z@]/.test(value)) {
      setCpf(value);
      return;
    }
    const formatted = formatCPF(value);
    setCpf(formatted);
  };

  const handleSubmit = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    const identificador = cpf.trim();
    const senhaLimpa = password.trim();


    if (!identificador) {
      flushSync(() => {
        setError('CPF é obrigatório');
      });
      return;
    }

    if (!senhaLimpa) {
      flushSync(() => {
        setError('Senha é obrigatória');
      });
      return;
    }

    setLoading(true);
    const cpfLimpo = identificador.replace(/\D/g, '');
    const loginValue = identificador.includes('@') ? identificador : cpfLimpo;

    void (async () => {
      try {
        const authenticatedUser = await login(loginValue, password);
        navigate(resolveDashboardPath(authenticatedUser.role));
      } catch (err: any) {
        // Capturamos a mensagem real do erro (que vem da API ou do interceptor)
        const mensagemErro = err.message || "Erro ao tentar fazer login. Verifique suas credenciais.";
        
        // Exibimos a mensagem na UI em vez de usar alert()
        setError(mensagemErro);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="lg-container">
      <div className="lg-card">
        <div className="lg-header">
          <h1 className="lg-title">🎉 Bingo da Comunidade</h1>
          <p className="lg-subtitle">Sistema de Gestão Paroquial</p>
        </div>

        {success && (
          <div className="lg-success">
            {success}
          </div>
        )}

        {error && <div className="lg-error lg-errorSpaced">{error}</div>}

        <form onSubmit={(e) => handleSubmit(e)} className="lg-form" noValidate>
          <div className="lg-inputGroup">
            <label className="lg-label">CPF ou Email</label>
            <input
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              className="lg-input"
              disabled={loading}
            />
          </div>

          <div className="lg-inputGroup">
            <label className="lg-label">Senha</label>
            <div className="lg-passwordContainer">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="lg-input"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="lg-eyeButton"
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>


          <button
            type="button"
            onClick={() => handleSubmit()}
            className={`lg-button ${loading ? 'lg-buttonDisabled' : ''}`}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="lg-links">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="lg-linkButton"
              disabled={loading}
            >
              🔑 Esqueci minha senha
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="lg-linkButton"
              disabled={loading}
            >
              Criar conta →
            </button>
          </div>
        </form>

        <div className="lg-footer" />
      </div>
    </div>
  );
};

export default Login;
