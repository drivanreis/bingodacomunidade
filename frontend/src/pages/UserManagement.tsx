import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminIdentityHeader from '../components/AdminIdentityHeader';
import TextField from '../components/form/TextField';
import PasswordField from '../components/form/PasswordField';
import ContactModule, { buildBrazilContact, isBrazilContactValid } from '../components/form/ContactModule';
import { getHumanRoleLabel } from '../utils/userRoles';
import { getSessionScope } from '../utils/sessionScope';

interface Usuario {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
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
  // Detectar contexto: Admin-Site ou Admin-Paróquia
  const sessionScope = getSessionScope();
  const isAdminSite = sessionScope === 'admin_site';
  
  // Admin-Site: só pode criar Admins de Paróquia
  // Admin-Paróquia: pode criar qualquer tipo de usuário
  const ALLOWED_TYPES = isAdminSite 
    ? ['paroquia_admin'] as const
    : ['paroquia_admin', 'paroquia_caixa', 'paroquia_recepcao', 'paroquia_bingo'] as const;
  
  const ROLE_OPTIONS: Array<{ value: typeof ALLOWED_TYPES[number]; label: string }> = isAdminSite
    ? [{ value: 'paroquia_admin', label: getHumanRoleLabel('paroquia_admin') }]
    : [
        { value: 'paroquia_admin', label: getHumanRoleLabel('paroquia_admin') },
        { value: 'paroquia_caixa', label: getHumanRoleLabel('paroquia_caixa') },
        { value: 'paroquia_recepcao', label: getHumanRoleLabel('paroquia_recepcao') },
        { value: 'paroquia_bingo', label: getHumanRoleLabel('paroquia_bingo') },
      ];
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    senha: '',
    confirmarSenha: '',
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
    tipo: isAdminSite ? 'paroquia_admin' : 'paroquia_recepcao',
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
      if (paroquiasRes.data?.length > 0) {
        setFormData((prev) => ({ ...prev, paroquia_id: String(paroquiasRes.data[0].id) }));
      }
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

    if (!ALLOWED_TYPES.includes(formData.tipo as typeof ALLOWED_TYPES[number])) {
      alert('Função inválida para cadastro nesta área');
      return;
    }

    if (!formData.cpf) {
      alert('CPF é obrigatório para usuário da paróquia');
      return;
    }

    if (!formData.email.trim()) {
      alert('E-mail é obrigatório');
      return;
    }

    if (!isBrazilContactValid(ddd, telefone)) {
      alert('Telefone com DDD é obrigatório e deve ser válido');
      return;
    }

    const paroquiaUnica = paroquias[0];
    if (!paroquiaUnica?.id) {
      alert('Paróquia não encontrada. Edite a paróquia seed antes de cadastrar usuários.');
      return;
    }

    if (!editingId && formData.senha !== formData.confirmarSenha) {
      alert('Confirmação de senha não confere');
      return;
    }

    if (editingId) {
      const hasCurrentPassword = !!formData.senhaAtual;
      const hasNewPassword = !!formData.novaSenha;
      const hasNewPasswordConfirmation = !!formData.confirmarNovaSenha;
      const wantsChangePassword = hasCurrentPassword || hasNewPassword || hasNewPasswordConfirmation;

      if (wantsChangePassword && (!hasCurrentPassword || !hasNewPassword || !hasNewPasswordConfirmation)) {
        alert('Para trocar a senha, preencha senha atual, nova senha e confirmação');
        return;
      }

      if (wantsChangePassword && formData.novaSenha !== formData.confirmarNovaSenha) {
        alert('A confirmação da nova senha não confere');
        return;
      }
    }

    try {
      const contato = buildBrazilContact(ddd, telefone);
      const payload = {
        nome: formData.nome,
        email: formData.email.trim(),
        cpf: formData.cpf,
        telefone: contato,
        whatsapp: contato,
        senha: formData.senha,
        tipo: formData.tipo,
        ativo: editingId ? formData.ativo : true,
        paroquia_id: String(paroquiaUnica.id)
      };

      if (editingId) {
        // Na edição, só envia senha se foi preenchida
        const updatePayload: Partial<typeof payload> = { ...payload };
        delete updatePayload.cpf;
        if (!updatePayload.senha) {
          delete updatePayload.senha;
        }
        if (formData.senhaAtual && formData.novaSenha) {
          (updatePayload as Partial<typeof payload> & { senha_atual?: string; nova_senha?: string }).senha_atual = formData.senhaAtual;
          (updatePayload as Partial<typeof payload> & { senha_atual?: string; nova_senha?: string }).nova_senha = formData.novaSenha;
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
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(detail || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    const parseStoredContact = (rawContact?: string) => {
      const onlyDigits = String(rawContact || '').replace(/\D/g, '');
      const withoutCountryCode = onlyDigits.startsWith('55') && onlyDigits.length >= 12
        ? onlyDigits.slice(2)
        : onlyDigits;

      if (withoutCountryCode.length < 10) {
        return { ddd: '', telefone: '' };
      }

      const telefoneLimpo = withoutCountryCode.slice(2);
      const telefoneAjustado = telefoneLimpo.length > 10 ? telefoneLimpo.slice(0, 10) : telefoneLimpo;

      return {
        ddd: withoutCountryCode.slice(0, 2),
        telefone: telefoneAjustado,
      };
    };

    setEditingId(usuario.id);
    setShowPassword(false);
    setFormData({
      nome: usuario.nome,
      email: usuario.email || '',
      cpf: usuario.cpf || '',
      senha: '', // Não carrega a senha
      confirmarSenha: '',
      senhaAtual: '',
      novaSenha: '',
      confirmarNovaSenha: '',
      tipo: (ALLOWED_TYPES.includes(usuario.tipo as typeof ALLOWED_TYPES[number])
        ? (usuario.tipo as typeof ALLOWED_TYPES[number])
        : 'paroquia_recepcao'),
      paroquia_id: String(paroquias[0]?.id || usuario.paroquia_id || ''),
      ativo: usuario.ativo
    });
    const contatoAtual = parseStoredContact(usuario.telefone || usuario.whatsapp);
    setDdd(contatoAtual.ddd);
    setTelefone(contatoAtual.telefone);
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
    setShowPassword(false);
    setShowConfirmPassword(false);
    setDdd('');
    setTelefone('');
    setFormData({
      nome: '',
      email: '',
      cpf: '',
      senha: '',
      confirmarSenha: '',
      senhaAtual: '',
      novaSenha: '',
      confirmarNovaSenha: '',
      tipo: 'paroquia_recepcao',
      paroquia_id: String(paroquias[0]?.id || ''),
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
    return getHumanRoleLabel(tipo);
  };

  const filteredUsuarios = usuarios.filter((u) => u.tipo.startsWith('paroquia_')).filter(u => {
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
    <div
      className="container py-3"
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AdminIdentityHeader
        title="Gerenciar Usuários da Paróquia"
        backTo="/admin-site/dashboard"
        rightContent={
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Novo Usuário da Paróquia
          </button>
        }
      />

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
                <option value="todos">Todas as funções</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="card-body" style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Função</th>
                    <th>Contato / CPF</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map(usuario => (
                    <tr key={usuario.id}>
                      <td>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-underline fw-semibold"
                          onClick={() => handleEdit(usuario)}
                          aria-label={`abrir edição de ${usuario.nome}`}
                        >
                          {usuario.nome}
                        </button>
                        {usuario.is_bootstrap && (
                          <span className="badge bg-warning text-dark ms-2">Bootstrap</span>
                        )}
                      </td>
                      <td>{getTipoLabel(usuario.tipo)}</td>
                      <td>
                        {usuario.email && <div className="small">{usuario.email}</div>}
                        {usuario.cpf && <div className="small">{formatCPF(usuario.cpf)}</div>}
                      </td>
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
                  {editingId ? 'Editar Usuário da Paróquia' : 'Novo Usuário da Paróquia'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className={editingId ? 'col-md-8 mb-3' : 'col-md-12 mb-3'}>
                      <label className="form-label">Nome *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        required
                      />
                    </div>
                    {editingId && (
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
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="user-role" className="form-label">Função *</label>
                    <select
                      id="user-role"
                      className="form-select"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      required
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <TextField
                      label="E-mail"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@paroquia.com"
                      required
                      style={{ marginBottom: 0 }}
                      inputStyle={{
                        width: '100%',
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #ced4da',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                      }}
                      hint="Obrigatório para comunicação e recuperação de acesso."
                    />
                  </div>

                  <ContactModule
                    ddd={ddd}
                    telefone={telefone}
                    onDddChange={setDdd}
                    onTelefoneChange={(value) => setTelefone(value)}
                    required
                    label="Telefone (SMS/WhatsApp/voz)"
                  />

                  <div className="mb-3">
                    <label className="form-label">CPF *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                      placeholder="000.000.000-00"
                      readOnly={!!editingId}
                      required
                    />
                    {editingId && (
                      <small className="text-muted">CPF é fixo após cadastro e não pode ser alterado.</small>
                    )}
                  </div>

                  {!editingId ? (
                    <>
                      <div className="mb-3">
                        <PasswordField
                          id="paroquia-user-password"
                          label="Senha"
                          name="senha"
                          value={formData.senha}
                          onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                          required
                          show={showPassword}
                          onToggleShow={() => setShowPassword((prev) => !prev)}
                          placeholder="Digite a senha"
                          containerStyle={{ marginBottom: 0 }}
                          inputStyle={{
                            width: '100%',
                            padding: '0.375rem 2.25rem 0.375rem 0.75rem',
                            border: '1px solid #ced4da',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                          }}
                          buttonStyle={{
                            position: 'absolute',
                            right: '8px',
                            border: 'none',
                            padding: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <PasswordField
                          id="paroquia-user-confirm-password"
                          label="Confirmar senha"
                          name="confirmarSenha"
                          value={formData.confirmarSenha}
                          onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                          required
                          show={showConfirmPassword}
                          onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
                          placeholder="Repita a senha"
                          containerStyle={{ marginBottom: 0 }}
                          inputStyle={{
                            width: '100%',
                            padding: '0.375rem 2.25rem 0.375rem 0.75rem',
                            border: '1px solid #ced4da',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                          }}
                          buttonStyle={{
                            position: 'absolute',
                            right: '8px',
                            border: 'none',
                            padding: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-3">
                        <PasswordField
                          id="paroquia-user-current-password"
                          label="Senha atual (opcional)"
                          name="senhaAtual"
                          value={formData.senhaAtual}
                          onChange={(e) => setFormData({ ...formData, senhaAtual: e.target.value })}
                          show={showPassword}
                          onToggleShow={() => setShowPassword((prev) => !prev)}
                          placeholder="Digite a senha atual"
                          containerStyle={{ marginBottom: 0 }}
                          inputStyle={{
                            width: '100%',
                            padding: '0.375rem 2.25rem 0.375rem 0.75rem',
                            border: '1px solid #ced4da',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                          }}
                          buttonStyle={{
                            position: 'absolute',
                            right: '8px',
                            border: 'none',
                            padding: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <PasswordField
                          id="paroquia-user-new-password"
                          label="Nova senha (opcional)"
                          name="novaSenha"
                          value={formData.novaSenha}
                          onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                          show={showConfirmPassword}
                          onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
                          placeholder="Digite a nova senha"
                          containerStyle={{ marginBottom: 0 }}
                          inputStyle={{
                            width: '100%',
                            padding: '0.375rem 2.25rem 0.375rem 0.75rem',
                            border: '1px solid #ced4da',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                          }}
                          buttonStyle={{
                            position: 'absolute',
                            right: '8px',
                            border: 'none',
                            padding: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <PasswordField
                          id="paroquia-user-confirm-new-password"
                          label="Confirmar nova senha (opcional)"
                          name="confirmarNovaSenha"
                          value={formData.confirmarNovaSenha}
                          onChange={(e) => setFormData({ ...formData, confirmarNovaSenha: e.target.value })}
                          show={showConfirmPassword}
                          onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
                          placeholder="Repita a nova senha"
                          containerStyle={{ marginBottom: 0 }}
                          inputStyle={{
                            width: '100%',
                            padding: '0.375rem 2.25rem 0.375rem 0.75rem',
                            border: '1px solid #ced4da',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                          }}
                          buttonStyle={{
                            position: 'absolute',
                            right: '8px',
                            border: 'none',
                            padding: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    </>
                  )}
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
