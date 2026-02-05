import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppConfigSync } from '../services/configService';
import api from '../services/api';

const FirstAccessSetup: React.FC = () => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 13) {
      return numbers.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
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
    if (!nome.trim()) {
      setError('Nome completo é obrigatório');
      setLoading(false);
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setError('CPF deve conter 11 dígitos');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Email inválido');
      setLoading(false);
      return;
    }

    const whatsappLimpo = whatsapp.replace(/\D/g, '');
    if (whatsappLimpo.length !== 13) {
      setError('WhatsApp deve estar no formato +55 (DD) 9XXXX-XXXX');
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

    try {
      const response = await api.post('/auth/bootstrap', {
        nome: nome.trim(),
        login: cpfLimpo,
        email: email.trim(),
        senha
      });

      // Salvar dados de autenticação (login automático)
      const { access_token, usuario } = response.data;
      localStorage.setItem('@BingoComunidade:token', access_token);
      localStorage.setItem('@BingoComunidade:user', JSON.stringify(usuario));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Atualizar contexto (UsuarioAdministrativo tem nivel_acesso, não tipo)
      updateUser({
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email || '',
        role: usuario.nivel_acesso,
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎉 Bem-vindo!</h1>
          <p style={styles.subtitle}>Configure sua conta de Desenvolvedor</p>
          <p style={styles.description}>
            Esta é a primeira vez que o sistema está sendo acessado.
            <br />
            Crie sua conta de administrador para começar.
          </p>
        </div>

        {error && (
          <div style={{...styles.error, marginBottom: '20px'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Nome Completo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              placeholder="Seu nome completo"
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              CPF *
            </label>
            <input
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              style={styles.input}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
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

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              WhatsApp *
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={handleWhatsAppChange}
              style={styles.input}
              placeholder="+55 (85) 99999-9999"
              maxLength={19}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
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
            <small style={styles.hint}>
              Deve conter: maiúscula, minúscula, número e caractere especial
            </small>
          </div>

          <div style={styles.inputGroup}>
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
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Configurando...' : '🚀 Criar Conta e Começar'}
          </button>
        </form>

        <div style={styles.footer}>
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
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '15px',
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
  inputGroup: {
    marginBottom: '20px',
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
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  footerText: {
    fontSize: '13px',
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: '1.6',
  },
};

export default FirstAccessSetup;
