import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppConfigSync } from '../services/configService';
import api from '../services/api';
import ContactModule from '../components/form/ContactModule';
import { getDddCpfMismatchWarning, isValidBrazilDdd } from '../utils/dddUf';
import { setSessionScope } from '../utils/sessionScope';

const FirstAccessSetup: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [compactMode, setCompactMode] = useState<boolean>(() => window.innerHeight <= 840);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  // Obter configurações
  const appConfig = getAppConfigSync();

  // Auto-ocultar mensagem de erro após o tempo configurado
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, appConfig.errorMessageDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [error, appConfig.errorMessageDuration]);

  useEffect(() => {
    const onResize = () => setCompactMode(window.innerHeight <= 840);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const normalizeCpf = (value: string) => value.replace(/\D/g, '').slice(0, 11);

  const isValidCpf = (cpfRaw: string): boolean => {
    const cpfLimpo = normalizeCpf(cpfRaw);
    if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) return false;

    const calcDigit = (base: string) => {
      let sum = 0;
      for (let i = 0; i < base.length; i += 1) {
        sum += Number(base[i]) * (base.length + 1 - i);
      }
      const rest = sum % 11;
      return rest < 2 ? 0 : 11 - rest;
    };

    const d1 = calcDigit(cpfLimpo.slice(0, 9));
    const d2 = calcDigit(cpfLimpo.slice(0, 10));
    return Number(cpfLimpo[9]) === d1 && Number(cpfLimpo[10]) === d2;
  };

  const handleDddChange = (value: string) => {
    setDdd(value);
  };

  const handleTelefoneChange = (value: string) => {
    setTelefone(value);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Senha deve ter no mínimo 6 caracteres';
    }
    if (password.length > 16) {
      return 'Senha deve ter no máximo 16 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Senha deve conter pelo menos uma letra maiúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'Senha deve conter pelo menos uma letra minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'Senha deve conter pelo menos um número';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Senha deve conter pelo menos um caractere especial';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações locais
    if (!nome.trim() || nome.trim().length < 3) {
      setError('Nome/apelido deve ter pelo menos 3 caracteres');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Email inválido');
      setLoading(false);
      return;
    }

    if (!isValidCpf(cpf)) {
      setError('CPF inválido');
      setLoading(false);
      return;
    }

    if (!isValidBrazilDdd(ddd)) {
      setError('DDD inválido');
      setLoading(false);
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (!/^\d{9,10}$/.test(telefoneLimpo)) {
      setError('Telefone inválido para SMS/WhatsApp');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(senha);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    const telefoneCompleto = `${ddd}${telefoneLimpo}`;

    try {
      const response = await api.post('/auth/bootstrap', {
        nome: nome.trim(),
        email: email.trim(),
        cpf: normalizeCpf(cpf),
        telefone: telefoneCompleto,
        senha
      });

      // Salvar dados de autenticação (login automático)
      const { access_token, usuario } = response.data;
      const role = usuario.nivel_acesso || usuario.tipo;
      const usuarioNormalizado = {
        ...usuario,
        tipo: role,
        nivel_acesso: role,
      };
      localStorage.setItem('@BingoComunidade:token', access_token);
      localStorage.setItem('@BingoComunidade:user', JSON.stringify(usuarioNormalizado));
      setSessionScope('admin_site');
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Atualizar contexto (UsuarioAdministrativo tem nivel_acesso, não tipo)
      updateUser({
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email || '',
        role,
        cpf: usuario.cpf || '',
        parish_id: usuario.paroquia_id || null
      });

      // Redirecionar para dashboard
      navigate('/admin-site/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const mensagemErro = error.response?.data?.detail || error.message || "Erro ao configurar primeiro acesso";
      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const alertaDddCpf = getDddCpfMismatchWarning(ddd, cpf);

  return (
    <div style={styles.container}>
      <div style={compactMode ? { ...styles.card, ...styles.cardCompact } : styles.card}>
        <div style={compactMode ? { ...styles.header, ...styles.headerCompact } : styles.header}>
          <h1 style={compactMode ? { ...styles.title, ...styles.titleCompact } : styles.title}>🎉 Bem-vindo!</h1>
          <p style={compactMode ? { ...styles.subtitle, ...styles.subtitleCompact } : styles.subtitle}>Configure sua conta de Admin-Site</p>
          {!compactMode && (
            <p style={styles.description}>
            Esta é a primeira vez que o sistema está sendo acessado.
            <br />
            Crie sua conta de administrador para começar.
            </p>
          )}
        </div>

        {error && (
          <div style={{...styles.error, marginBottom: '20px'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={compactMode ? { ...styles.form, ...styles.formCompact } : styles.form}>
          <div style={compactMode ? { ...styles.inputGroup, ...styles.inputGroupCompact } : styles.inputGroup}>
            <label style={styles.label}>
              Nome / apelido *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              placeholder="Seu nome"
              required
              minLength={3}
              disabled={loading}
            />
          </div>

          <div style={compactMode ? { ...styles.inputGroup, ...styles.inputGroupCompact } : styles.inputGroup}>
            <label style={styles.label}>
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div style={compactMode ? { ...styles.inputGroup, ...styles.inputGroupCompact } : styles.inputGroup}>
            <label style={styles.label}>
              CPF *
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(normalizeCpf(e.target.value))}
              style={styles.input}
              placeholder="Somente números"
              required
              maxLength={11}
              inputMode="numeric"
              disabled={loading}
            />
          </div>

          <div style={compactMode ? { ...styles.inputGroup, ...styles.inputGroupCompact } : styles.inputGroup}>
            <ContactModule
              ddd={ddd}
              telefone={telefone}
              onDddChange={handleDddChange}
              onTelefoneChange={handleTelefoneChange}
              required
              disabled={loading}
            />
            {alertaDddCpf && (
              <small style={styles.warningHint}>
                ⚠️ {alertaDddCpf}
              </small>
            )}
          </div>

          <div style={compactMode ? { ...styles.infoAlert, ...styles.infoAlertCompact } : styles.infoAlert}>
            <strong>Importante:</strong> no Admin-Site, o <strong>login é o próprio e-mail</strong>. Não é permitido repetir
            <strong> e-mail</strong>, <strong>telefone</strong> ou <strong>CPF</strong> entre usuários do site.
          </div>

          <div style={compactMode ? { ...styles.inputGroup, ...styles.inputGroupCompact } : styles.inputGroup}>
            <label style={styles.label}>
              Senha *
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={{...styles.input, paddingRight: '40px'}}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small style={compactMode ? { ...styles.hint, ...styles.hintCompact } : styles.hint}>
              Deve conter: maiúscula, minúscula, número e caractere especial
            </small>
          </div>

          <div style={compactMode ? { ...styles.inputGroup, ...styles.inputGroupCompact } : styles.inputGroup}>
            <label style={styles.label}>
              Confirmar Senha *
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                style={{...styles.input, paddingRight: '40px'}}
                placeholder="Digite a senha novamente"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={compactMode ? { ...styles.button, ...styles.buttonCompact } : styles.button}
            disabled={loading}
          >
            {loading ? 'Configurando...' : '🚀 Criar Conta e Começar'}
          </button>
        </form>

        <div style={compactMode ? { ...styles.footer, ...styles.footerCompact } : styles.footer}>
          <p style={styles.footerText}>
            ⚠️ Esta tela aparece apenas uma vez.
            <br />
            Guarde suas credenciais em local seguro!
          </p>
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
    maxWidth: '500px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  cardCompact: {
    padding: '20px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  headerCompact: {
    marginBottom: '12px',
  },
  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  titleCompact: {
    fontSize: '28px',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '15px',
  },
  subtitleCompact: {
    fontSize: '16px',
    marginBottom: '8px',
  },
  description: {
    fontSize: '14px',
    color: '#888',
    lineHeight: '1.6',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '6px',
    color: '#c33',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  form: {
    marginTop: '20px',
  },
  formCompact: {
    marginTop: '8px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  inputGroupCompact: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#555',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.3s',
  },
  phoneRow: {
    display: 'flex',
    gap: '10px',
  },
  dddInput: {
    width: '120px',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.3s',
  },
  phoneInput: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.3s',
  },
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
  hint: {
    display: 'block',
    marginTop: '5px',
    fontSize: '12px',
    color: '#999',
  },
  hintCompact: {
    marginTop: '3px',
  },
  warningHint: {
    display: 'block',
    marginTop: '6px',
    fontSize: '12px',
    color: '#b26a00',
    lineHeight: '1.4',
  },
  infoAlert: {
    backgroundColor: '#fff3cd',
    color: '#664d03',
    border: '1px solid #ffecb5',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '18px',
    fontSize: '14px',
    lineHeight: '1.4',
  },
  infoAlertCompact: {
    fontSize: '13px',
    padding: '8px 10px',
    marginBottom: '12px',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '10px',
  buttonCompact: {
    padding: '12px',
  },
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  footerCompact: {
    marginTop: '14px',
    paddingTop: '12px',
  },
  footerText: {
    fontSize: '13px',
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: '1.6',
  },
};

export default FirstAccessSetup;
