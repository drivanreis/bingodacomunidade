import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Usuario {
  id: number;
  nome: string;
  email?: string;
  cpf?: string;
  tipo: string;
  paroquia_id?: number;
  paroquia_nome?: string;
  ativo: boolean;
  is_bootstrap: boolean;
  criado_em: string;
}

interface Paroquia {
  id: number;
  nome: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    senha: '',
    tipo: 'usuario_publico',
    paroquia_id: '',
    ativo: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usuariosRes, paroquiasRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/paroquias')
      ]);
      setUsuarios(usuariosRes.data);
      setParoquias(paroquiasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome) {
      alert('Nome é obrigatório');
      return;
    }

    // Validação específica por tipo
    if (formData.tipo === 'super_admin' && !formData.email) {
      alert('E-mail é obrigatório para Super Admin');
      return;
    }

    if (formData.tipo !== 'super_admin' && !formData.cpf) {
      alert('CPF é obrigatório para este tipo de usuário');
      return;
    }

    if (formData.tipo.includes('paroquia_') && !formData.paroquia_id) {
      alert('Selecione uma paróquia');
      return;
    }

    try {
      const payload = {
        ...formData,
        paroquia_id: formData.paroquia_id ? parseInt(formData.paroquia_id) : null
      };

      if (editingId) {
        // Na edição, só envia senha se foi preenchida
        const updatePayload: Partial<typeof payload> = { ...payload };
        if (!updatePayload.senha) {
          delete updatePayload.senha;
        }
        await api.put(`/usuarios/${editingId}`, updatePayload);
        alert('Usuário atualizado com sucesso!');
      } else {
        if (!formData.senha) {
          alert('Senha é obrigatória para novos usuários');
          return;
        }
        await api.post('/usuarios', payload);
        alert('Usuário criado com sucesso!');
      }
      
      closeModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingId(usuario.id);
    setFormData({
      nome: usuario.nome,
      email: usuario.email || '',
      cpf: usuario.cpf || '',
      senha: '', // Não carrega a senha
      tipo: usuario.tipo,
      paroquia_id: usuario.paroquia_id?.toString() || '',
      ativo: usuario.ativo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, usuario: Usuario) => {
    if (usuario.is_bootstrap) {
      alert('Não é possível excluir o usuário bootstrap');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      await api.delete(`/usuarios/${id}`);
      alert('Usuário excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nome: '',
      email: '',
      cpf: '',
      senha: '',
      tipo: 'usuario_publico',
      paroquia_id: '',
      ativo: true
    });
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'paroquia_admin': 'Admin Paróquia',
      'paroquia_operador': 'Operador',
      'paroquia_vendedor': 'Vendedor',
      'paroquia_caixa': 'Caixa',
      'usuario_publico': 'Usuário Público'
    };
    return labels[tipo] || tipo;
  };

  const filteredUsuarios = usuarios.filter(u => {
    const matchSearch = 
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.cpf && u.cpf.includes(searchTerm));
    
    const matchTipo = filterTipo === 'todos' || u.tipo === filterTipo;
    
    return matchSearch && matchTipo;
  });

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button 
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate('/admin-site/dashboard')}
          >
            ← Voltar
          </button>
          <h2 className="d-inline-block mb-0">Gerenciar Usuários</h2>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Novo Usuário
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nome, e-mail ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <option value="todos">Todos os tipos</option>
                <option value="super_admin">Super Admin</option>
                <option value="paroquia_admin">Admin Paróquia</option>
                <option value="paroquia_operador">Operador</option>
                <option value="paroquia_vendedor">Vendedor</option>
                <option value="paroquia_caixa">Caixa</option>
                <option value="usuario_publico">Usuário Público</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Identificação</th>
                    <th>Paróquia</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map(usuario => (
                    <tr key={usuario.id}>
                      <td>
                        {usuario.nome}
                        {usuario.is_bootstrap && (
                          <span className="badge bg-warning text-dark ms-2">Bootstrap</span>
                        )}
                      </td>
                      <td>{getTipoLabel(usuario.tipo)}</td>
                      <td>
                        {usuario.email && <div className="small">{usuario.email}</div>}
                        {usuario.cpf && <div className="small">{formatCPF(usuario.cpf)}</div>}
                      </td>
                      <td>{usuario.paroquia_nome || '-'}</td>
                      <td>
                        <span className={`badge ${usuario.ativo ? 'bg-success' : 'bg-secondary'}`}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(usuario)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(usuario.id, usuario)}
                          disabled={usuario.is_bootstrap}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingId ? 'Editar Usuário' : 'Novo Usuário'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label className="form-label">Nome *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.ativo ? 'true' : 'false'}
                        onChange={(e) => setFormData({...formData, ativo: e.target.value === 'true'})}
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tipo de Usuário *</label>
                    <select
                      className="form-select"
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value, paroquia_id: ''})}
                      required
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="paroquia_admin">Admin Paróquia</option>
                      <option value="paroquia_operador">Operador</option>
                      <option value="paroquia_vendedor">Vendedor</option>
                      <option value="paroquia_caixa">Caixa</option>
                      <option value="usuario_publico">Usuário Público</option>
                    </select>
                  </div>

                  {formData.tipo === 'super_admin' ? (
                    <div className="mb-3">
                      <label className="form-label">E-mail *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="form-label">CPF *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cpf}
                        onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                  )}

                  {formData.tipo.includes('paroquia_') && (
                    <div className="mb-3">
                      <label className="form-label">Paróquia *</label>
                      <select
                        className="form-select"
                        value={formData.paroquia_id}
                        onChange={(e) => setFormData({...formData, paroquia_id: e.target.value})}
                        required
                      >
                        <option value="">Selecione uma paróquia</option>
                        {paroquias.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">
                      Senha {editingId ? '(deixe em branco para não alterar)' : '*'}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.senha}
                      onChange={(e) => setFormData({...formData, senha: e.target.value})}
                      required={!editingId}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
