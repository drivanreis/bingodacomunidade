import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  tipo: 'super_admin' | 'parish_admin' | 'paroquia_admin' | 'faithful';
  paroquia_id?: string;
  paroquia_nome?: string;
  criado_em: string;
}

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (usuarioId: string, novoTipo: string) => {
    try {
      await api.put(`/usuarios/${usuarioId}/tipo`, { tipo: novoTipo });
      
      // Atualizar lista
      loadUsuarios();
      setShowModal(false);
      setSelectedUser(null);
      alert('✅ Usuário promovido com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      alert('❌ Erro ao atualizar usuário: ' + (err.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const getRoleBadge = (tipo: string) => {
    const roleConfig: { [key: string]: { label: string; color: string } } = {
      'super_admin': { label: '👑 Super Admin', color: '#d4af37' },
      'parish_admin': { label: '👨‍💼 Admin Paróquia', color: '#1e90ff' },
      'paroquia_admin': { label: '👨‍💼 Admin Paróquia', color: '#1e90ff' },
      'faithful': { label: '👤 Fiel', color: '#6c757d' },
    };
    const config = roleConfig[tipo] || { label: tipo, color: '#6c757d' };
    return (
      <span style={{
        background: config.color,
        color: 'white',
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '40px' }}>
        <h1>👥 Gerenciar Usuários do Admin</h1>
        <p style={{ color: '#666', marginTop: '5px' }}>
          Promova usuários para Super Admin ou remova privilégios administrativos
        </p>
      </div>

      {/* Botão voltar */}
      <button
        onClick={() => navigate('/admin-site/feedback')}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ← Voltar
      </button>

      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tabela de usuários */}
      <div style={{
        overflowX: 'auto',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>CPF</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Tipo</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '15px' }}>{usuario.nome}</td>
                <td style={{ padding: '15px' }}>{usuario.email || '-'}</td>
                <td style={{ padding: '15px' }}>
                  <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>
                    {usuario.cpf.slice(0, 3)}.***.***-{usuario.cpf.slice(-2)}
                  </code>
                </td>
                <td style={{ padding: '15px' }}>{getRoleBadge(usuario.tipo)}</td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setSelectedUser(usuario);
                      setNewRole(usuario.tipo);
                      setShowModal(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    ⚙️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {usuarios.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#999'
        }}>
          Nenhum usuário encontrado
        </div>
      )}

      {/* Modal de edição */}
      {showModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h2>Editar Usuário</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              <strong>{selectedUser.nome}</strong>
              <br />
              {selectedUser.email}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Tipo de Conta:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                <option value="faithful">👤 Fiel (Usuário comum)</option>
                <option value="paroquia_admin">👨‍💼 Admin de Paróquia</option>
                <option value="super_admin">👑 Super Admin (Sistema todo)</option>
              </select>
            </div>

            {newRole === 'super_admin' && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                padding: '12px',
                borderRadius: '5px',
                marginBottom: '20px',
                fontSize: '12px',
                color: '#664d03'
              }}>
                ⚠️ <strong>Atenção!</strong> Super Admins têm acesso total ao sistema. Use com cuidado!
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePromote(selectedUser.id, newRole)}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                💾 Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;
