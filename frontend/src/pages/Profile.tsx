import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.put('/users/me', {
        name,
        whatsapp: whatsapp || undefined,
        pix_key: pixKey || undefined,
      });
      setSuccess('Perfil atualizado com sucesso!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'Super Administrador',
      parish_admin: 'Administrador Paroquial',
      faithful: 'Fiel',
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: '#F44336',
      parish_admin: '#2196F3',
      faithful: '#4CAF50',
    };
    return colors[role] || '#666';
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.content}>
        <button onClick={() => navigate('/dashboard')} style={styles.backLink}>
          ← Voltar para Dashboard
        </button>

        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.avatar}>{user?.name.charAt(0).toUpperCase()}</div>
            <div>
              <h1 style={styles.name}>{user?.name}</h1>
              <span
                style={{
                  ...styles.roleBadge,
                  background: getRoleColor(user?.role || ''),
                }}
              >
                {getRoleName(user?.role || '')}
              </span>
            </div>
          </div>

          {success && <div style={styles.success}>✓ {success}</div>}
          {error && <div style={styles.error}>⚠️ {error}</div>}

          {!editing ? (
            <div style={styles.infoSection}>
              <h2 style={styles.sectionTitle}>📋 Informações</h2>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Email:</span>
                  <span style={styles.infoValue}>{user?.email}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>ID:</span>
                  <span style={styles.infoValue}>{user?.id}</span>
                </div>
                {user?.cpf && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>CPF:</span>
                    <span style={styles.infoValue}>{user.cpf}</span>
                  </div>
                )}
                {user?.parish_id && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Paróquia ID:</span>
                    <span style={styles.infoValue}>{user.parish_id}</span>
                  </div>
                )}
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>WhatsApp:</span>
                  <span style={styles.infoValue}>{whatsapp || 'Não informado'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Chave PIX:</span>
                  <span style={styles.infoValue}>{pixKey || 'Não informado'}</span>
                </div>
              </div>

              <div style={styles.actions}>
                <button onClick={() => setEditing(true)} style={styles.editButton}>
                  ✏️ Editar Perfil
                </button>
                <button onClick={logout} style={styles.logoutButton}>
                  🚪 Sair
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} style={styles.form}>
              <h2 style={styles.sectionTitle}>✏️ Editar Perfil</h2>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email (não editável)</label>
                <input type="email" value={user?.email} disabled style={styles.inputDisabled} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(85) 99999-9999"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Chave PIX</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="CPF, email, telefone ou chave aleatória"
                  style={styles.input}
                />
                <small style={styles.hint}>
                  Necessário para receber prêmios automaticamente
                </small>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(user?.name || '');
                    setError('');
                  }}
                  style={styles.cancelButton}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button type="submit" style={styles.saveButton} disabled={loading}>
                  {loading ? 'Salvando...' : '✓ Salvar'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={styles.statsCard}>
          <h2 style={styles.sectionTitle}>📊 Minhas Estatísticas</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>🎫</div>
              <div style={styles.statValue}>0</div>
              <div style={styles.statLabel}>Cartelas Compradas</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>🏆</div>
              <div style={styles.statValue}>R$ 0,00</div>
              <div style={styles.statLabel}>Total em Prêmios</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>🎉</div>
              <div style={styles.statValue}>0</div>
              <div style={styles.statLabel}>Jogos Participados</div>
            </div>
          </div>
          <p style={styles.comingSoon}>
            ℹ️ Estatísticas detalhadas em breve
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  backLink: {
    background: 'transparent',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: '5px 0',
    fontWeight: '500',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '2px solid #f0f0f0',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 10px 0',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  infoSection: {
    marginTop: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '15px',
    color: '#333',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
  },
  editButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  logoutButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    background: '#F44336',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
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
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box' as const,
  },
  inputDisabled: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: '#f5f5f5',
    color: '#999',
    boxSizing: 'border-box' as const,
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
    display: 'block',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  saveButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  success: {
    background: '#d4edda',
    color: '#155724',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    border: '1px solid #c3e6cb',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    border: '1px solid #fcc',
  },
  statsCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  statItem: {
    textAlign: 'center' as const,
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
  },
  comingSoon: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '14px',
    fontStyle: 'italic' as const,
  },
};

export default Profile;
