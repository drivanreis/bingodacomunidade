/**
 * Página de Cadastro de Fiel
 * 
 * Permite que novos fiéis se cadastrem no sistema
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TextField from '../components/form/TextField';
import PasswordField from '../components/form/PasswordField';
import ContactModule from '../components/form/ContactModule';
import { getDddCpfMismatchWarning, isValidBrazilDdd } from '../utils/dddUf';

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
    ddd: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    chave_pix: '',
  });
  const [cpfRaw, setCpfRaw] = useState('');
  const [dddRaw, setDddRaw] = useState('');
  const [telefoneRaw, setTelefoneRaw] = useState('');

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

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCpfRaw(value);
    if (/[a-zA-Z'";]/.test(value)) {
      setFormData(prev => ({ ...prev, cpf: value }));
      return;
    }
    const formatted = formatCPF(value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const handleDDDChange = (value: string) => {
    setDddRaw(value);
    setFormData(prev => ({ ...prev, ddd: value }));
  };

  const handleTelefoneChange = (value: string, rawValue?: string) => {
    setTelefoneRaw(rawValue ?? value);
    setFormData(prev => ({ ...prev, telefone: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const hasSuspiciousInput = (value: string) => {
      return /['";]|--|\/\*|\*\/|\b(or|select|drop|insert|delete|update|uuid|guid)\b/i.test(value);
    };

    const validateNomeCompleto = (nome: string): string | null => {
      if (!nome.trim()) {
        return 'Nome Completo invalido';
      }
      if (hasSuspiciousInput(nome)) {
        return 'Nome Completo invalido';
      }
      if (/\d/.test(nome)) {
        return 'Nome Completo invalido';
      }
      const palavras = nome.trim().split(/\s+/);
      if (palavras.length < 2) {
        return 'Nome Completo invalido';
      }
      const palavraCurta = palavras.some((palavra) => palavra.replace(/[^\p{L}]/gu, '').length < 3);
      if (palavraCurta) {
        return 'Nome Completo invalido';
      }
      return null;
    };

    const validateEmail = (email: string): string | null => {
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!email.trim()) {
        return 'Email invalido';
      }
      if (hasSuspiciousInput(email)) {
        return 'Email invalido';
      }
      if (!emailRegex.test(email)) {
        return 'Email invalido';
      }
      return null;
    };

    const validateCPFLocal = (cpf: string, rawCpf?: string): string | null => {
      const rawValue = rawCpf ?? cpf;
      if (!rawValue.trim()) {
        return 'CPF invalido';
      }
      if (hasSuspiciousInput(rawValue)) {
        return 'CPF invalido';
      }
      if (/[a-zA-Z]/.test(rawValue)) {
        return 'CPF invalido';
      }
      const cpfLimpoRaw = rawValue.replace(/\D/g, '');
      if (cpfLimpoRaw.length !== 11) {
        return 'CPF invalido';
      }
      const cpfLimpo = cpfLimpoRaw;
      if (/^(\d)\1{10}$/.test(cpfLimpo)) {
        return 'CPF invalido';
      }

      const calcDigito = (base: string) => {
        let soma = 0;
        for (let i = 0; i < base.length; i += 1) {
          const peso = base.length + 1 - i;
          soma += parseInt(base[i], 10) * peso;
        }
        const resto = soma % 11;
        return resto < 2 ? '0' : String(11 - resto);
      };

      const digito1 = calcDigito(cpfLimpo.substring(0, 9));
      const digito2 = calcDigito(cpfLimpo.substring(0, 10));

      if (cpfLimpo[9] !== digito1 || cpfLimpo[10] !== digito2) {
        return 'CPF invalido';
      }

      return null;
    };

    const validateDDD = (ddd: string, rawValue?: string): string | null => {
      const value = rawValue ?? ddd;
      if (!value.trim()) {
        return 'DDD invalido';
      }
      if (hasSuspiciousInput(value)) {
        return 'DDD invalido';
      }
      if (/\D/.test(value)) {
        return 'DDD invalido';
      }
      if (!isValidBrazilDdd(value)) {
        return 'DDD invalido';
      }
      return null;
    };

    const validateTelefone = (telefone: string, rawValue?: string): string | null => {
      const value = rawValue ?? telefone;
      if (!value.trim()) {
        return 'Telefone invalido';
      }
      if (hasSuspiciousInput(value)) {
        return 'Telefone invalido';
      }
      if (/\D/.test(value)) {
        return 'Telefone invalido';
      }
      if (value.length < 9 || value.length > 10) {
        return 'Telefone invalido';
      }
      if (/^(\d)\1+$/.test(value)) {
        return 'Telefone invalido';
      }
      return null;
    };

    const validateChavePix = (chavePix: string, cpfLimpo: string): string | null => {
      const valor = chavePix.trim();
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!valor) {
        return 'Chave PIX invalido';
      }
      if (hasSuspiciousInput(valor)) {
        return 'Chave PIX invalido';
      }
      if (emailRegex.test(valor)) {
        return null;
      }
      const digits = valor.replace(/\D/g, '');
      if (digits.length === 11) {
        if (digits !== cpfLimpo) {
          return 'Chave PIX invalido';
        }
        return null;
      }
      if (digits.length === 10 || digits.length === 11) {
        return null;
      }
      return 'Chave PIX invalido';
    };

    const nomeError = validateNomeCompleto(formData.nome);
    if (nomeError) {
      setError(`❌ ${nomeError}`);
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(`❌ ${emailError}`);
      return;
    }

    const cpfError = validateCPFLocal(formData.cpf, cpfRaw);
    if (cpfError) {
      setError(`❌ ${cpfError}`);
      return;
    }

    const dddError = validateDDD(formData.ddd, dddRaw);
    if (dddError) {
      setError(`❌ ${dddError}`);
      return;
    }

    const telefoneError = validateTelefone(formData.telefone, telefoneRaw);
    if (telefoneError) {
      setError(`❌ ${telefoneError}`);
      return;
    }

    const cpfLimpo = (cpfRaw || formData.cpf).replace(/\D/g, '');
    const chavePixError = validateChavePix(formData.chave_pix, cpfLimpo);
    if (chavePixError) {
      setError(`❌ ${chavePixError}`);
      return;
    }

    // Validações
    if (!formData.senha) {
      setError('❌ Senha invalido');
      return;
    }

    if (formData.senha.length < 6 || formData.senha.length > 16) {
      setError('❌ Senha invalido');
      return;
    }

    if (!/[A-Z]/.test(formData.senha) || !/[0-9]/.test(formData.senha) || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.senha)) {
      setError('❌ Senha invalido');
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError('❌ Senha invalido');
      return;
    }

    setLoading(true);

    try {
      // Remove formatação do CPF e WhatsApp
      const whatsappLimpo = `${formData.ddd.replace(/\D/g, '')}${formData.telefone.replace(/\D/g, '')}`;

      await api.post('/auth/signup', {
        nome: formData.nome,
        email: formData.email,
        cpf: cpfLimpo,
        telefone: whatsappLimpo,
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
        ddd: '',
        telefone: '',
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

  const alertaDddCpf = getDddCpfMismatchWarning(formData.ddd, cpfRaw || formData.cpf);

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

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <TextField
            label="Nome Completo"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            style={styles.formGroup}
            inputStyle={styles.input}
            placeholder="João da Silva"
          />

          <TextField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={styles.formGroup}
            inputStyle={styles.input}
            type="email"
            placeholder="seu.email@exemplo.com"
          />

          <TextField
            label="CPF"
            name="cpf"
            value={formData.cpf}
            onChange={handleCPFChange}
            required
            style={styles.formGroup}
            inputStyle={styles.input}
            placeholder="000.000.000-00"
          />

          <div style={styles.formGroup}>
            <ContactModule
              label="WhatsApp"
              ddd={formData.ddd}
              telefone={formData.telefone}
              onDddChange={handleDDDChange}
              onTelefoneChange={handleTelefoneChange}
              required
            />
            {alertaDddCpf && (
              <small style={styles.warningHint}>
                ⚠️ {alertaDddCpf}
              </small>
            )}
          </div>

          <TextField
            label="Chave PIX"
            name="chave_pix"
            value={formData.chave_pix}
            onChange={handleChange}
            required
            style={styles.formGroup}
            inputStyle={styles.input}
            placeholder="CPF, Email, Telefone ou Chave Aleatória"
            hint="Necessário para receber prêmios em caso de vitória"
          />

          <PasswordField
            label="Senha"
            name="senha"
            value={formData.senha}
            onChange={handleChange}
            required
            show={showPassword}
            onToggleShow={() => setShowPassword(!showPassword)}
            containerStyle={styles.formGroup}
            inputStyle={styles.inputPassword}
            buttonStyle={styles.eyeButton}
            placeholder="6 a 16 caracteres"
            hint={`✓ Mínimo 6, máximo 16 caracteres\n✓ Pelo menos: 1 MAIÚSCULA, 1 minúscula, 1 número, 1 especial (!@#$%...)`}
          />

          <PasswordField
            label="Confirmar Senha"
            name="confirmarSenha"
            value={formData.confirmarSenha}
            onChange={handleChange}
            required
            show={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            containerStyle={styles.formGroup}
            inputStyle={styles.inputPassword}
            buttonStyle={styles.eyeButton}
            placeholder="Digite a senha novamente"
          />

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
  warningHint: {
    marginTop: '8px',
    display: 'block',
    fontSize: '12px',
    color: '#b26a00',
    lineHeight: '1.4',
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
