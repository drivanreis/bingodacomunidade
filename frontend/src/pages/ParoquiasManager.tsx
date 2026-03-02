import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminIdentityHeader from '../components/AdminIdentityHeader';

interface Paroquia {
  id: string;
  nome: string;
  cnpj?: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  chave_pix: string;
  responsavel_nome?: string;
  criado_em: string;
}

const ParoquiasManager: React.FC = () => {
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedParoquia, setSelectedParoquia] = useState<Paroquia | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: 'CE',
    cep: '',
    chave_pix: '',
  });

  useEffect(() => {
    loadParoquias();
  }, []);

  const loadParoquias = async () => {
    try {
      const response = await api.get('/paroquias');
      setParoquias(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar paróquias:', error);
      alert('Erro ao carregar paróquias');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paroquia: Paroquia) => {
    setSelectedParoquia(paroquia);
    setFormData({
      nome: paroquia.nome,
      cnpj: paroquia.cnpj || '',
      email: paroquia.email,
      telefone: paroquia.telefone || '',
      endereco: paroquia.endereco || '',
      cidade: paroquia.cidade || '',
      estado: paroquia.estado || 'CE',
      cep: paroquia.cep || '',
      chave_pix: paroquia.chave_pix || '',
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedParoquia(null);
    setFormData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: 'Fortaleza',
      estado: 'CE',
      cep: '',
      chave_pix: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.email || !formData.chave_pix) {
      alert('Nome, e-mail e chave PIX são obrigatórios');
      return;
    }

    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        chave_pix: formData.chave_pix,
      };

      if (selectedParoquia) {
        await api.put(`/paroquias/${selectedParoquia.id}`, payload);
        alert('Paróquia atualizada com sucesso!');
      } else {
        await api.post('/paroquias', payload);
        alert('Paróquia cadastrada com sucesso!');
      }

      closeModal();
      loadParoquias();
    } catch (error) {
      console.error('Erro ao salvar paróquia:', error);
      alert('Erro ao salvar paróquia');
    }
  };

  const handleDelete = async (parroquiaId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta paróquia?')) {
      return;
    }

    try {
      await api.delete(`/paroquias/${parroquiaId}`);
      alert('Paróquia deletada com sucesso!');
      loadParoquias();
    } catch (error) {
      console.error('Erro ao deletar paróquia:', error);
      alert('Erro ao deletar paróquia');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedParoquia(null);
  };

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
    <div className="container py-3" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <AdminIdentityHeader
        title="🏘️ Gerenciar Paróquias"
        subtitle="Administração de todas as paróquias cadastradas no sistema"
        backTo="/admin-site/dashboard"
        rightContent={
          <button
            onClick={handleCreate}
            className="btn btn-primary fw-bold"
          >
            + Nova Paróquia
          </button>
        }
      />

      <div className="card mb-4 flex-grow-1">
        <div className="card-body p-0" style={{ overflow: 'auto' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-start">Nome</th>
                  <th className="text-start">E-mail</th>
                  <th className="text-start">Telefone</th>
                  <th className="text-start">Cidade</th>
                  <th className="text-start">Criada em</th>
                  <th className="text-start">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paroquias.map((paroquia) => (
                  <tr key={paroquia.id}>
                    <td className="text-start align-middle fw-semibold">{paroquia.nome}</td>
                    <td className="text-start align-middle">{paroquia.email}</td>
                    <td className="text-start align-middle">{paroquia.telefone || '-'}</td>
                    <td className="text-start align-middle">{paroquia.cidade || '-'}</td>
                    <td className="text-start align-middle">
                      <small className="text-muted">
                        {new Date(paroquia.criado_em).toLocaleDateString('pt-BR')}
                      </small>
                    </td>
                    <td className="text-start align-middle">
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleEdit(paroquia)}
                          className="btn btn-sm btn-outline-primary"
                          title="Editar paróquia"
                        >
                          <i className="bi bi-pencil"></i> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(paroquia.id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Deletar paróquia"
                        >
                          <i className="bi bi-trash"></i> Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {paroquias.length === 0 && (
        <div className="text-center text-muted mt-4">
          Nenhuma paróquia cadastrada. Clique em "+ Nova Paróquia" para criar a primeira.
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedParoquia ? 'Editar Paróquia' : 'Criar Nova Paróquia'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label className="form-label">Nome da Paróquia *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">CNPJ</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">E-mail *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Telefone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(85) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Endereço Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-5 mb-3">
                      <label className="form-label">Cidade</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Estado (UF)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                        maxLength={2}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">CEP</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Chave PIX *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.chave_pix}
                      onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                      required
                      placeholder="CNPJ, e-mail, telefone ou chave aleatória"
                    />
                    <small className="text-muted">
                      Esta chave será usada para receber apostas e doações
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-save me-2"></i>
                    {selectedParoquia ? 'Atualizar' : 'Criar'} Paróquia
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

export default ParoquiasManager;
