import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const identificador = cpf.trim();
    const isEmail = identificador.includes('@');
    const cpfLimpo = identificador.replace(/\D/g, '');
    
    if (!isEmail && cpfLimpo.length !== 11) {
      setError('❌ CPF deve ter 11 dígitos');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password',
        isEmail
          ? { email: identificador }
          : { cpf: cpfLimpo }
      );

      setSuccess('✅ Token de recuperação gerado com sucesso!');
      
      // Extrair token da mensagem (desenvolvimento)
      // Sucesso - mostrar mensagem
      setSuccess(response.data.message);
      setCpf('');
      
      // Não extrair token da resposta - usuário deve receber por email
    } catch (err) {
      console.error('❌ Erro ao solicitar recuperação:', err);
      
      let errorMessage = '❌ Erro ao solicitar recuperação. Tente novamente.';
      
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
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔑 Recuperar Senha</h1>
          <p style={styles.subtitle}>Informe seu CPF ou Email para receber o token de recuperação</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <p style={{margin: 0, marginBottom: '10px'}}>{success}</p>
            <p style={{margin: 0, fontSize: '14px', color: '#155724'}}>
              📧 Verifique seu email (inclusive na caixa de spam) para continuar a recuperação.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              CPF ou Email <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              style={styles.input}
              required
              disabled={loading || !!success}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...((loading || !!success) ? styles.buttonDisabled : {})
            }}
            disabled={loading || !!success}
          >
            {loading ? '⏳ Enviando email...' : '📧 Enviar Link de Recuperação'}
          </button>

          <div style={styles.linksContainer}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={styles.linkButton}
              disabled={loading}
            >
              ← Voltar para Login
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              style={styles.linkButton}
              disabled={loading}
            >
              Já tenho o link do email →
            </button>
          </div>
        </form>
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
  tokenBox: {
    background: '#f0f9ff',
    border: '2px solid #0ea5e9',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '20px',
    textAlign: 'center'
  },
  tokenLabel: {
    fontSize: '14px',
    color: '#0369a1',
    marginBottom: '10px',
    fontWeight: '600'
  },
  tokenCode: {
    display: 'block',
    background: '#fff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '15px',
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#0c4a6e',
    marginBottom: '10px',
    wordBreak: 'break-all',
    userSelect: 'all'
  },
  tokenWarning: {
    fontSize: '13px',
    color: '#f59e0b',
    marginBottom: '15px'
  },
  resetButton: {
    width: '100%',
    padding: '12px',
    background: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s'
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
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border 0.3s',
    boxSizing: 'border-box'
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
  }
};

export default ForgotPassword;
