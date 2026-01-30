import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
  responsavel_id?: string;
  responsavel_nome?: string;
  criado_em: string;
}

interface AdminParoquia {
  id: string;
  nome: string;
}

const ParishManagement: React.FC = () => {
  const navigate = useNavigate();
  const [paroquia, setParoquia] = useState<Paroquia | null>(null);
  const [admins, setAdmins] = useState<AdminParoquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    responsavel_id: ''
  });

  useEffect(() => {
    loadParoquia();
    loadAdmins();
  }, []);

  const loadParoquia = async () => {
    try {
      const response = await api.get('/paroquias');
      // Assume que só existe UMA paróquia
      if (response.data && response.data.length > 0) {
        setParoquia(response.data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar paróquia:', error);
      alert('Erro ao carregar paróquia');
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await api.get('/usuarios');
      // Filtra apenas admins da paróquia
      const adminsList = response.data.filter((u: { tipo: string }) => 
        u.tipo === 'paroquia_admin'
      );
      setAdmins(adminsList);
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.chave_pix) {
      alert('Nome, e-mail e chave PIX são obrigatórios');
      return;
    }

    try {
      if (paroquia) {
        await api.put(`/paroquias/${paroquia.id}`, formData);
        alert('Paróquia atualizada com sucesso!');
      }
      
      closeModal();
      loadParoquia();
    } catch (error) {
      console.error('Erro ao salvar paróquia:', error);
      alert('Erro ao salvar paróquia');
    }
  };

  const handleEdit = () => {
    if (!paroquia) return;
    
    setFormData({
      nome: paroquia.nome,
      cnpj: paroquia.cnpj || '',
      email: paroquia.email,
      telefone: paroquia.telefone || '',
      endereco: paroquia.endereco || '',
      cidade: paroquia.cidade || '',
      estado: paroquia.estado || 'CE',
      cep: paroquia.cep || '',
      chave_pix: paroquia.chave_pix,
      responsavel_id: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: 'CE',
      cep: '',
      chave_pix: '',
      responsavel_id: ''
    });
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
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button 
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate('/admin-site/dashboard')}
          >
            ← Voltar
          </button>
          <h2 className="d-inline-block mb-0">Configurações da Paróquia</h2>
        </div>
        {paroquia && (
          <button 
            className="btn btn-primary"
            onClick={handleEdit}
          >
            <i className="bi bi-pencil me-2"></i>
            Editar Informações
          </button>
        )}
      </div>

      {!paroquia ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted">Nenhuma paróquia cadastrada no sistema</p>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Informações Gerais</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label text-muted small">Nome da Paróquia</label>
                    <p className="fw-bold">{paroquia.nome}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">CNPJ</label>
                    <p className="fw-bold">{paroquia.cnpj || '-'}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Responsável</label>
                    <p className="fw-bold">{paroquia.responsavel_nome || '-'}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">E-mail</label>
                    <p className="fw-bold">{paroquia.email}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Telefone</label>
                    <p className="fw-bold">{paroquia.telefone || '-'}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted small">Endereço Completo</label>
                  <p className="fw-bold">{paroquia.endereco || '-'}</p>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Cidade</label>
                    <p className="fw-bold">{paroquia.cidade || '-'}</p>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted small">Estado</label>
                    <p className="fw-bold">{paroquia.estado || '-'}</p>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted small">CEP</label>
                    <p className="fw-bold">{paroquia.cep || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-wallet2 me-2"></i>
                  Dados Financeiros
                </h5>
              </div>
              <div className="card-body">
                <label className="form-label text-muted small">Chave PIX</label>
                <p className="fw-bold">{paroquia.chave_pix}</p>
                <small className="text-muted">
                  Usada para receber apostas e doações
                </small>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Informações do Sistema</h5>
              </div>
              <div className="card-body">
                <label className="form-label text-muted small">Cadastrada em</label>
                <p className="fw-bold">{new Date(paroquia.criado_em).toLocaleDateString('pt-BR')}</p>
                <label className="form-label text-muted small">Status</label>
                <p>
                  <span className="badge bg-success">Ativa</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Informações da Paróquia</h5>
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
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">CNPJ</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Telefone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Estado (UF)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                        maxLength={2}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">CEP</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cep}
                        onChange={(e) => setFormData({...formData, cep: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, chave_pix: e.target.value})}
                      required
                      placeholder="CNPJ, e-mail, telefone ou chave aleatória"
                    />
                    <small className="text-muted">
                      Esta chave será usada para receber apostas e doações
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Responsável pela Paróquia</label>
                    <select
                      className="form-select"
                      value={formData.responsavel_id}
                      onChange={(e) => setFormData({...formData, responsavel_id: e.target.value})}
                    >
                      <option value="">Selecione um administrador</option>
                      {admins.map(admin => (
                        <option key={admin.id} value={admin.id}>
                          {admin.nome}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      {admins.length === 0 
                        ? 'Nenhum administrador cadastrado. Cadastre um usuário com perfil "Admin Paróquia".'
                        : 'Selecione o administrador principal da paróquia'}
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-save me-2"></i>
                    Salvar Alterações
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

export default ParishManagement;
