/**
 * Página de Cadastro de Fiel
 * 
 * Permite que novos fiéis se cadastrem no sistema
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    whatsapp: '',
    senha: '',
    confirmarSenha: '',
    chave_pix: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatWhatsApp = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setFormData(prev => ({ ...prev, whatsapp: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      setError('❌ As senhas não coincidem');
      return;
    }

    if (formData.senha.length < 6 || formData.senha.length > 16) {
      setError('❌ A senha deve ter entre 6 e 16 caracteres');
      return;
    }

    // Validar senha forte
    const temMaiuscula = /[A-Z]/.test(formData.senha);
    const temMinuscula = /[a-z]/.test(formData.senha);
    const temNumero = /[0-9]/.test(formData.senha);
    const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.senha);

    if (!temMaiuscula || !temMinuscula || !temNumero || !temEspecial) {
      setError('❌ A senha deve conter: Letra MAIÚSCULA, letra minúscula, número e caractere especial (!@#$%^&*...)');
      return;
    }

    setLoading(true);

    try {
      // Remove formatação do CPF e WhatsApp
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      const whatsappLimpo = '+55' + formData.whatsapp.replace(/\D/g, '');

      await api.post('/auth/signup', {
        nome: formData.nome,
        email: formData.email,
        cpf: cpfLimpo,
        whatsapp: whatsappLimpo,
        senha: formData.senha,
        chave_pix: formData.chave_pix,
      });

      setSuccess('✅ Cadastro realizado com sucesso! Verifique seu email para ativar a conta.');
      
      // Limpar formulário apenas no sucesso
      setFormData({
        nome: '',
        email: '',
        cpf: '',
        whatsapp: '',
        senha: '',
        confirmarSenha: '',
        chave_pix: '',
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: '✅ Cadastro realizado! Faça login com seu CPF e senha.',
            cpf: cpfLimpo
          } 
        });
      }, 2000);
    } catch (err) {
      console.error('❌ Erro ao cadastrar:', err);
      
      let errorMessage = '❌ Erro ao realizar cadastro. Tente novamente.';
      
      // Tipagem adequada para erro do axios
      if (err && typeof err === 'object') {
        const error = err as { 
          response?: { data?: { detail?: string } }; 
          message?: string;
        };
        
        // Tentar extrair a mensagem de erro de diferentes estruturas possíveis
        if (error.response?.data?.detail) {
          // Estrutura padrão do FastAPI
          errorMessage = `❌ ${error.response.data.detail}`;
        } else if (error.message) {
          // Mensagem de erro do axios ou JavaScript
          // Extrair apenas a mensagem após "Error: "
          const cleanMessage = error.message.replace('Error: ', '');
          errorMessage = `❌ ${cleanMessage}`;
        }
      }
      
      console.log('📋 Mensagem final exibida:', errorMessage);
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <div style={styles.header}>
          <h1 style={styles.title}>📝 Criar Conta</h1>
          <p style={styles.subtitle}>Cadastre-se para participar dos bingos</p>
        </div>

        <div style={styles.warningBox}>
          <strong>⚠️ ATENÇÃO AOS PRÊMIOS:</strong><br/>
          A Chave PIX informada <strong>deve pertencer ao mesmo titular</strong> do CPF cadastrado.<br/>
          Caso o cruzamento de dados bancários não confira, o pagamento do prêmio será <strong>bloqueado</strong>.
        </div>
        
        <p style={styles.legend}>* Campos obrigatórios</p>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nome Completo *</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="João da Silva"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="seu.email@exemplo.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>CPF *</label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleCPFChange}
              required
              maxLength={14}
              style={styles.input}
              placeholder="000.000.000-00"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>WhatsApp *</label>
            <input
              type="text"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleWhatsAppChange}
              required
              maxLength={15}
              style={styles.input}
              placeholder="(85) 98888-8888"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Chave PIX *</label>
            <input
              type="text"
              name="chave_pix"
              value={formData.chave_pix}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="CPF, Email, Telefone ou Chave Aleatória"
            />
            <small style={styles.hint}>
              Necessário para receber prêmios em caso de vitória
            </small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Senha *</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                minLength={6}
                maxLength={16}
                style={styles.inputPassword}
                placeholder="6 a 16 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label="Mostrar/ocultar senha"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <small style={styles.hint}>
              ✓ Mínimo 6, máximo 16 caracteres<br/>
              ✓ Pelo menos: 1 MAIÚSCULA, 1 minúscula, 1 número, 1 especial (!@#$%...)
            </small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirmar Senha *</label>
            <div style={styles.passwordContainer}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
                minLength={6}
                style={styles.inputPassword}
                placeholder="Digite a senha novamente"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                aria-label="Mostrar/ocultar confirmação de senha"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Cadastrando...' : '✅ Criar Conta'}
          </button>

          <button 
            type="button"
            onClick={() => navigate('/login')}
            style={styles.secondaryButton}
          >
            Já tenho conta
          </button>

          <button 
            type="button"
            onClick={() => navigate('/')}
            style={styles.backButton}
          >
            ← Voltar
          </button>
        </form>

        <div style={styles.legend}>
          Campos marcados com * são obrigatórios.
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  formCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    color: '#333',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  errorBox: {
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    color: '#c33',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  successBox: {
    background: '#efe',
    border: '1px solid #cfc',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    color: '#363',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  warningBox: {
    background: '#fff3cd',
    borderLeft: '5px solid #ffc107',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
    color: '#856404',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#333',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  passwordContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputPassword: {
    padding: '12px',
    paddingRight: '45px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute' as const,
    right: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic' as const,
    lineHeight: '1.4',
  },
  submitButton: {
    padding: '16px',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '10px',
  },
  secondaryButton: {
    padding: '12px',
    fontSize: '16px',
    color: '#667eea',
    background: 'transparent',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  backButton: {
    padding: '12px',
    fontSize: '14px',
    color: '#999',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  legend: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'right' as const,
    marginTop: '10px',
    fontStyle: 'italic' as const,
  },
};
