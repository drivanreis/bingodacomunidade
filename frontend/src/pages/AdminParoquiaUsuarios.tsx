import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AdminParoquiaUsuarios: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          <button onClick={() => navigate('/admin-paroquia/dashboard')} style={styles.backButton}>
            ← Voltar ao Dashboard
          </button>

          <h1 style={styles.title}>👤 Usuários da Equipe Paroquial</h1>
          <p style={styles.description}>
            Esta página separa a gestão de equipe paroquial das demais configurações. Enquanto o módulo completo não é publicado, use esta área como ponto único para operações de usuários da paróquia.
          </p>

          <div style={styles.actions}>
            <button onClick={() => navigate('/profile')} style={styles.primaryButton}>
              Abrir perfil e permissões atuais
            </button>
            <button onClick={() => navigate('/games')} style={styles.secondaryButton}>
              Voltar para gestão de jogos
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 64px)',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '24px',
  },
  card: {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 12px 0',
    color: '#1f2937',
  },
  description: {
    margin: '0 0 20px 0',
    color: '#4b5563',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  primaryButton: {
    border: '1px solid #4f46e5',
    background: '#4f46e5',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    borderRadius: '8px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};

export default AdminParoquiaUsuarios;
