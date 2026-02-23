import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PasswordField from '../components/form/PasswordField';

interface AdminInitialPasswordChangeProps {
  mode: 'admin-site' | 'admin-paroquia';
}

interface LocationState {
  login?: string;
  senhaAtual?: string;
}

const AdminInitialPasswordChange: React.FC<AdminInitialPasswordChangeProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [login, setLogin] = useState(state.login || '');
  const [senhaAtual, setSenhaAtual] = useState(state.senhaAtual || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarNovaSenha, setShowConfirmarNovaSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const isAdminSite = mode === 'admin-site';
  const perfilLabel = isAdminSite ? 'Admin-Site' : 'Admin-Paróquia';
  const titulo = isAdminSite ? '👑 Primeira troca de senha (Admin-Site)' : '⛪ Primeira troca de senha (Admin-Paróquia)';
  const endpoint = isAdminSite ? '/auth/admin-site/troca-senha-inicial' : '/auth/admin-paroquia/troca-senha-inicial';
  const rotaLogin = isAdminSite ? '/admin-site/login' : '/admin-paroquia/login';

  const mapApiErrorMessage = (detail: unknown): string => {
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (detail && typeof detail === 'object') {
      const maybeDetail = detail as { message?: string; detail?: string };
      if (typeof maybeDetail.message === 'string' && maybeDetail.message.trim()) {
        return maybeDetail.message;
      }
      if (typeof maybeDetail.detail === 'string' && maybeDetail.detail.trim()) {
        return maybeDetail.detail;
      }
    }
    return 'Erro ao alterar senha temporária.';
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Senha deve ter no mínimo 6 caracteres';
    }
    if (password.length > 64) {
      return 'Senha deve ter no máximo 64 caracteres';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!login.trim() || !senhaAtual || !novaSenha || !confirmarNovaSenha) {
      setErro('Preencha todos os campos.');
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setErro('Confirmação da nova senha não confere.');
      return;
    }

    if (novaSenha === senhaAtual) {
      setErro('A nova senha deve ser diferente da senha temporária.');
      return;
    }

    const passwordError = validatePassword(novaSenha);
    if (passwordError) {
      setErro(passwordError);
      return;
    }

    setLoading(true);
    try {
      await api.post(endpoint, {
        login: login.trim(),
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      });

      alert(`✅ Senha alterada com sucesso para ${perfilLabel}! Faça login novamente.`);
      navigate(rotaLogin);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: unknown } } };
      setErro(mapApiErrorMessage(error.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{titulo}</h1>
        <p style={styles.subtitle}>Por segurança, troque a senha temporária antes de acessar o sistema.</p>
        <div style={styles.infoBox}>
          <strong>Fluxo obrigatório:</strong> informe a senha temporária recebida, defina uma nova senha forte e faça novo login.
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {erro && <div style={styles.error}>{erro}</div>}

          <input
            type="text"
            placeholder="Login ou email"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            style={styles.input}
            autoComplete="username"
            required
          />

          <PasswordField
            id="senha-temporaria"
            label="Senha temporária"
            name="senhaTemporaria"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            placeholder="Digite a senha temporária"
            required
            disabled={loading}
            show={showSenhaAtual}
            onToggleShow={() => setShowSenhaAtual((prev) => !prev)}
            containerStyle={styles.fieldContainer}
            inputStyle={styles.input}
            buttonStyle={styles.eyeButton}
          />

          <PasswordField
            id="nova-senha"
            label="Nova senha"
            name="novaSenha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Digite a nova senha"
            required
            disabled={loading}
            show={showNovaSenha}
            onToggleShow={() => setShowNovaSenha((prev) => !prev)}
            containerStyle={styles.fieldContainer}
            inputStyle={styles.input}
            buttonStyle={styles.eyeButton}
            hint="Mínimo 6 caracteres com letras maiúsculas, minúsculas, número e caractere especial."
          />

          <PasswordField
            id="confirmar-nova-senha"
            label="Confirmar nova senha"
            name="confirmarNovaSenha"
            value={confirmarNovaSenha}
            onChange={(e) => setConfirmarNovaSenha(e.target.value)}
            placeholder="Repita a nova senha"
            required
            disabled={loading}
            show={showConfirmarNovaSenha}
            onToggleShow={() => setShowConfirmarNovaSenha((prev) => !prev)}
            containerStyle={styles.fieldContainer}
            inputStyle={styles.input}
            buttonStyle={styles.eyeButton}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Salvando...' : 'Alterar senha e continuar'}
          </button>

          <button type="button" style={styles.linkButton} onClick={() => navigate(rotaLogin)}>
            Voltar ao login
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#f5f7ff',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    padding: '24px',
  },
  title: {
    fontSize: '22px',
    margin: '0 0 8px 0',
    color: '#1f2937',
  },
  subtitle: {
    margin: '0 0 16px 0',
    color: '#4b5563',
    fontSize: '14px',
  },
  infoBox: {
    margin: '0 0 14px 0',
    fontSize: '13px',
    color: '#0f5132',
    background: '#d1e7dd',
    border: '1px solid #badbcc',
    borderRadius: '8px',
    padding: '10px 12px',
    lineHeight: 1.4,
  },
  form: {
    display: 'grid',
    gap: '10px',
  },
  fieldContainer: {
    display: 'grid',
    gap: '6px',
  },
  input: {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '11px 40px 11px 12px',
    fontSize: '14px',
    width: '100%',
  },
  button: {
    marginTop: '6px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '11px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  linkButton: {
    background: 'transparent',
    border: 'none',
    color: '#4f46e5',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '4px',
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
  },
};

export default AdminInitialPasswordChange;
