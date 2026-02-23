import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ContactModule, { buildBrazilContact, isBrazilContactValid } from '../components/form/ContactModule';
import PasswordField from '../components/form/PasswordField';
import AdminIdentityHeader from '../components/AdminIdentityHeader';

interface AdminSiteUser {
  id: string;
  nome: string;
  login: string;
  email: string;
  cpf?: string;
  telefone?: string;
  whatsapp?: string;
  ativo: boolean;
  criado_por_id?: string | null;
  criado_em?: string | null;
  is_current: boolean;
  can_resend_initial_password?: boolean;
}

interface CreateAdminSiteForm {
  nome: string;
  email: string;
  cpf: string;
  ddd: string;
  telefone: string;
  senhaTemporaria: string;
  confirmarSenhaTemporaria: string;
}

const INITIAL_FORM: CreateAdminSiteForm = {
  nome: '',
  email: '',
  cpf: '',
  ddd: '',
  telefone: '',
  senhaTemporaria: '',
  confirmarSenhaTemporaria: '',
};

const AdminUsers: React.FC = () => {
  const [admins, setAdmins] = useState<AdminSiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateAdminSiteForm>(INITIAL_FORM);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminSiteUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [myPasswordForm, setMyPasswordForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });
  const [targetPasswordForm, setTargetPasswordForm] = useState({
    novaSenha: '',
    confirmarNovaSenha: '',
  });
  const [showMyCurrentPassword, setShowMyCurrentPassword] = useState(false);
  const [showMyNewPassword, setShowMyNewPassword] = useState(false);
  const [showMyConfirmPassword, setShowMyConfirmPassword] = useState(false);
  const [showTargetNewPassword, setShowTargetNewPassword] = useState(false);
  const [showTargetConfirmPassword, setShowTargetConfirmPassword] = useState(false);
  const [showCreateTempPassword, setShowCreateTempPassword] = useState(false);
  const [showCreateTempConfirmPassword, setShowCreateTempConfirmPassword] = useState(false);

  const normalizeCpf = (value: string) => value.replace(/\D/g, '').slice(0, 11);

  const isValidCpf = (cpfRaw: string) => {
    const cpf = normalizeCpf(cpfRaw);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const calcDigit = (base: string) => {
      let sum = 0;
      for (let i = 0; i < base.length; i += 1) {
        sum += Number(base[i]) * (base.length + 1 - i);
      }
      const mod = sum % 11;
      return mod < 2 ? 0 : 11 - mod;
    };

    const d1 = calcDigit(cpf.slice(0, 9));
    const d2 = calcDigit(cpf.slice(0, 10));
    return Number(cpf[9]) === d1 && Number(cpf[10]) === d2;
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/admin-site/admins');
      setAdmins(response.data?.admins || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar Admin-Site:', err);
      setError('Erro ao carregar usuários do site');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(INITIAL_FORM);
    setShowCreateTempPassword(false);
    setShowCreateTempConfirmPassword(false);
  };

  const openDetailsModal = (admin: AdminSiteUser) => {
    setSelectedAdmin(admin);
    setShowDetailsModal(true);
    setMyPasswordForm({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
    setTargetPasswordForm({ novaSenha: '', confirmarNovaSenha: '' });
    setShowMyCurrentPassword(false);
    setShowMyNewPassword(false);
    setShowMyConfirmPassword(false);
    setShowTargetNewPassword(false);
    setShowTargetConfirmPassword(false);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAdmin(null);
    setMyPasswordForm({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
    setTargetPasswordForm({ novaSenha: '', confirmarNovaSenha: '' });
    setShowMyCurrentPassword(false);
    setShowMyNewPassword(false);
    setShowMyConfirmPassword(false);
    setShowTargetNewPassword(false);
    setShowTargetConfirmPassword(false);
  };

  const handleCreateAdminSite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || formData.nome.trim().length < 3) {
      alert('Preencha nome/apelido com pelo menos 3 caracteres');
      return;
    }

    if (!formData.email || !isBrazilContactValid(formData.ddd, formData.telefone)) {
      alert('Preencha e-mail, DDD e telefone válido (9 ou 10 dígitos)');
      return;
    }

    if (!isValidCpf(formData.cpf)) {
      alert('Informe um CPF válido para o usuário do site');
      return;
    }

    if (!formData.senhaTemporaria || !formData.confirmarSenhaTemporaria) {
      alert('Preencha senha temporária e confirmação');
      return;
    }

    if (formData.senhaTemporaria !== formData.confirmarSenhaTemporaria) {
      alert('A confirmação da senha temporária não confere');
      return;
    }

    const contato = buildBrazilContact(formData.ddd, formData.telefone);

    try {
      setSaving(true);
      await api.post('/auth/admin-site/criar-admin-site', {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        cpf: normalizeCpf(formData.cpf),
        telefone: contato,
        whatsapp: contato,
        senha: formData.senhaTemporaria,
      });

      alert('✅ Usuário do site (reserva) criado com sucesso! Entregue a senha temporária ao usuário e peça a troca obrigatória no primeiro login.');
      closeModal();
      await loadAdmins();
    } catch (err) {
      console.error('Erro ao criar usuário do site:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(`❌ Erro ao criar usuário do site: ${detail || 'Falha inesperada'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (admin: AdminSiteUser) => {
    const acao = admin.ativo ? 'inativar' : 'ativar';

    if (!window.confirm(`Confirma ${acao} o usuário do site ${admin.login}?`)) {
      return;
    }

    try {
      await api.put(`/auth/admin-site/admins/${admin.id}/status`, null, {
        params: {
          ativo: !admin.ativo,
        },
      });

      alert(`✅ Status atualizado com sucesso (${!admin.ativo ? 'Ativo' : 'Inativo'})`);
      await loadAdmins();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(`❌ Erro ao atualizar status: ${detail || 'Falha inesperada'}`);
    }
  };

  const handleResendPassword = async (admin: AdminSiteUser) => {
    if (!window.confirm(`Reenviar nova senha temporária para ${admin.email}? A senha anterior deixará de funcionar.`)) {
      return;
    }

    try {
      await api.post(`/auth/admin-site/admins/${admin.id}/reenviar-senha`);
      alert('✅ Nova senha temporária enviada por e-mail com sucesso.');
    } catch (err) {
      console.error('Erro ao reenviar senha:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(`❌ Erro ao reenviar senha: ${detail || 'Falha inesperada'}`);
    }
  };

  const handleChangeMyPassword = async () => {
    if (!selectedAdmin?.is_current) return;

    if (!myPasswordForm.senhaAtual || !myPasswordForm.novaSenha || !myPasswordForm.confirmarNovaSenha) {
      alert('Preencha senha atual, nova senha e confirmação');
      return;
    }

    if (myPasswordForm.novaSenha !== myPasswordForm.confirmarNovaSenha) {
      alert('A confirmação da nova senha não confere');
      return;
    }

    try {
      setPasswordSaving(true);
      await api.post('/auth/admin-site/minha-senha', {
        senha_atual: myPasswordForm.senhaAtual,
        nova_senha: myPasswordForm.novaSenha,
      });

      alert('✅ Sua senha foi alterada com sucesso.');
      setMyPasswordForm({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
      await loadAdmins();
    } catch (err) {
      console.error('Erro ao alterar minha senha:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(`❌ Erro ao alterar sua senha: ${detail || 'Falha inesperada'}`);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSetTargetPassword = async () => {
    if (!selectedAdmin || selectedAdmin.is_current) return;

    if (!targetPasswordForm.novaSenha || !targetPasswordForm.confirmarNovaSenha) {
      alert('Preencha nova senha e confirmação');
      return;
    }

    if (targetPasswordForm.novaSenha !== targetPasswordForm.confirmarNovaSenha) {
      alert('A confirmação da nova senha não confere');
      return;
    }

    try {
      setPasswordSaving(true);
      await api.post(`/auth/admin-site/admins/${selectedAdmin.id}/definir-senha`, {
        nova_senha: targetPasswordForm.novaSenha,
      });

      alert('✅ Senha do usuário atualizada com sucesso. Comunique a nova senha por canal seguro.');
      setTargetPasswordForm({ novaSenha: '', confirmarNovaSenha: '' });
      await loadAdmins();
    } catch (err) {
      console.error('Erro ao definir senha do usuário:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(`❌ Erro ao definir senha do usuário: ${detail || 'Falha inesperada'}`);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Carregando usuários do site...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
      <AdminIdentityHeader
        title="👑 Gerenciar Usuários do Site"
        subtitle="Sucessão de Admin-Site, renovação/troca/recuperação de senha e gestão dos pares do site."
        backTo="/admin-site/dashboard"
        rightContent={
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: '#1e3c72',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            + Novo Usuário do Site (Reserva)
          </button>
        }
      />

      {error && (
        <div style={{ background: '#f8d7da', color: '#842029', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Login</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Telefone</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} style={{ borderTop: '1px solid #ececec' }}>
                <td style={{ padding: '12px' }}>
                  <button
                    type="button"
                    onClick={() => openDetailsModal(admin)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      margin: 0,
                      color: '#0d6efd',
                      cursor: 'pointer',
                      fontWeight: 700,
                      textDecoration: 'underline',
                    }}
                    aria-label={`abrir propriedades de ${admin.login}`}
                  >
                    {admin.login}
                  </button>
                  {admin.is_current && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', background: '#e7f1ff', color: '#084298', padding: '2px 6px', borderRadius: '12px' }}>
                      você
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>{admin.email}</td>
                <td style={{ padding: '12px' }}>{admin.telefone || '-'}</td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'white',
                      background: admin.ativo ? '#198754' : '#6c757d',
                      borderRadius: '12px',
                      padding: '4px 8px',
                    }}
                  >
                    {admin.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {admin.can_resend_initial_password && (
                      <button
                        onClick={() => handleResendPassword(admin)}
                        style={{
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: '#0d6efd',
                          color: 'white',
                        }}
                      >
                        Reenviar senha
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleStatus(admin)}
                      disabled={admin.is_current}
                      style={{
                        padding: '6px 10px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: admin.is_current ? 'not-allowed' : 'pointer',
                        opacity: admin.is_current ? 0.55 : 1,
                        background: admin.ativo ? '#dc3545' : '#198754',
                        color: 'white',
                      }}
                    >
                      {admin.ativo ? 'Inativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {admins.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>Nenhum usuário do site encontrado.</div>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Criar Usuário do Site (Reserva)</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleCreateAdminSite}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="admin-reserva-nome" className="form-label">Nome / apelido *</label>
                    <input
                      id="admin-reserva-nome"
                      type="text"
                      className="form-control"
                      value={formData.nome}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                      required
                      minLength={3}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="admin-reserva-email" className="form-label">E-mail *</label>
                    <input
                      id="admin-reserva-email"
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="admin-reserva-cpf" className="form-label">CPF *</label>
                    <input
                      id="admin-reserva-cpf"
                      type="text"
                      className="form-control"
                      value={formData.cpf}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cpf: normalizeCpf(e.target.value) }))}
                      inputMode="numeric"
                      maxLength={11}
                      required
                    />
                  </div>

                  <ContactModule
                    ddd={formData.ddd}
                    telefone={formData.telefone}
                    onDddChange={(value) => setFormData((prev) => ({ ...prev, ddd: value }))}
                    onTelefoneChange={(value) => setFormData((prev) => ({ ...prev, telefone: value }))}
                    required
                  />

                  <div className="row g-2">
                    <div className="col-md-6">
                      <PasswordField
                        id="admin-reserva-senha-temporaria"
                        label="Senha temporária"
                        name="senhaTemporaria"
                        value={formData.senhaTemporaria}
                        onChange={(e) => setFormData((prev) => ({ ...prev, senhaTemporaria: e.target.value }))}
                        placeholder="Defina a senha temporária"
                        required
                        show={showCreateTempPassword}
                        onToggleShow={() => setShowCreateTempPassword((prev) => !prev)}
                        containerStyle={{}}
                        inputStyle={{ width: '100%', padding: '10px 40px 10px 10px', border: '1px solid #ced4da', borderRadius: 6 }}
                        buttonStyle={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer' }}
                        hint="Mínimo 6 caracteres com letras maiúsculas, minúsculas, número e caractere especial."
                      />
                    </div>
                    <div className="col-md-6">
                      <PasswordField
                        id="admin-reserva-confirmar-senha-temporaria"
                        label="Confirmar senha temporária"
                        name="confirmarSenhaTemporaria"
                        value={formData.confirmarSenhaTemporaria}
                        onChange={(e) => setFormData((prev) => ({ ...prev, confirmarSenhaTemporaria: e.target.value }))}
                        placeholder="Repita a senha temporária"
                        required
                        show={showCreateTempConfirmPassword}
                        onToggleShow={() => setShowCreateTempConfirmPassword((prev) => !prev)}
                        containerStyle={{}}
                        inputStyle={{ width: '100%', padding: '10px 40px 10px 10px', border: '1px solid #ced4da', borderRadius: 6 }}
                        buttonStyle={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="alert alert-info mb-0" role="status">
                    Defina e entregue a senha temporária ao usuário. Ele será obrigado a trocar no primeiro login.
                  </div>
                  <div className="alert alert-warning mt-2 mb-0" role="note">
                    <strong>Importante:</strong> no Admin-Site, o <strong>login é o próprio e-mail</strong>. Não é permitido repetir
                    <strong> e-mail</strong>, <strong>telefone</strong> ou <strong>CPF</strong> entre usuários do site.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Criando...' : 'Criar reserva'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedAdmin && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Propriedades do Usuário do Site</h5>
                <button type="button" className="btn-close" onClick={closeDetailsModal}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-sm table-borderless mb-0">
                    <tbody>
                      <tr>
                        <th style={{ width: '220px' }}>ID</th>
                        <td>{selectedAdmin.id}</td>
                      </tr>
                      <tr>
                        <th>Login</th>
                        <td>{selectedAdmin.login}</td>
                      </tr>
                      <tr>
                        <th>E-mail</th>
                        <td>{selectedAdmin.email || '-'}</td>
                      </tr>
                      <tr>
                        <th>CPF</th>
                        <td>{selectedAdmin.cpf || '-'}</td>
                      </tr>
                      <tr>
                        <th>Telefone</th>
                        <td>{selectedAdmin.telefone || '-'}</td>
                      </tr>
                      <tr>
                        <th>WhatsApp</th>
                        <td>{selectedAdmin.whatsapp || '-'}</td>
                      </tr>
                      <tr>
                        <th>Status</th>
                        <td>{selectedAdmin.ativo ? 'Ativo' : 'Inativo'}</td>
                      </tr>
                      <tr>
                        <th>Criado por</th>
                        <td>{selectedAdmin.criado_por_id || '-'}</td>
                      </tr>
                      <tr>
                        <th>Criado em</th>
                        <td>{selectedAdmin.criado_em ? new Date(selectedAdmin.criado_em).toLocaleString('pt-BR') : '-'}</td>
                      </tr>
                      <tr>
                        <th>Senha inicial pendente</th>
                        <td>{selectedAdmin.can_resend_initial_password ? 'Sim' : 'Não'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="alert alert-secondary mt-3 mb-0" role="status">
                  Ações disponíveis neste usuário: ativar/inativar e reenviar senha temporária (quando permitido).
                </div>

                <div className="mt-3">
                  {selectedAdmin.is_current ? (
                    <>
                      <h6 className="mb-2">Trocar minha senha</h6>
                      <div className="row g-2">
                        <div className="col-12">
                          <PasswordField
                            id="my-password-current"
                            label="Senha atual"
                            name="myPasswordCurrent"
                            value={myPasswordForm.senhaAtual}
                            onChange={(e) => setMyPasswordForm((prev) => ({ ...prev, senhaAtual: e.target.value }))}
                            show={showMyCurrentPassword}
                            onToggleShow={() => setShowMyCurrentPassword((prev) => !prev)}
                            containerStyle={{ marginBottom: 0 }}
                            inputStyle={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                            buttonStyle={{ position: 'absolute', right: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
                          />
                        </div>
                        <div className="col-md-6">
                          <PasswordField
                            id="my-password-new"
                            label="Nova senha"
                            name="myPasswordNew"
                            value={myPasswordForm.novaSenha}
                            onChange={(e) => setMyPasswordForm((prev) => ({ ...prev, novaSenha: e.target.value }))}
                            show={showMyNewPassword}
                            onToggleShow={() => setShowMyNewPassword((prev) => !prev)}
                            containerStyle={{ marginBottom: 0 }}
                            inputStyle={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                            buttonStyle={{ position: 'absolute', right: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
                          />
                        </div>
                        <div className="col-md-6">
                          <PasswordField
                            id="my-password-confirm"
                            label="Confirmar nova senha"
                            name="myPasswordConfirm"
                            value={myPasswordForm.confirmarNovaSenha}
                            onChange={(e) => setMyPasswordForm((prev) => ({ ...prev, confirmarNovaSenha: e.target.value }))}
                            show={showMyConfirmPassword}
                            onToggleShow={() => setShowMyConfirmPassword((prev) => !prev)}
                            containerStyle={{ marginBottom: 0 }}
                            inputStyle={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                            buttonStyle={{ position: 'absolute', right: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <button type="button" className="btn btn-warning" onClick={handleChangeMyPassword} disabled={passwordSaving}>
                          {passwordSaving ? 'Salvando...' : 'Alterar minha senha'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h6 className="mb-2">Definir senha do usuário</h6>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <PasswordField
                            id="target-password-new"
                            label="Nova senha"
                            name="targetPasswordNew"
                            value={targetPasswordForm.novaSenha}
                            onChange={(e) => setTargetPasswordForm((prev) => ({ ...prev, novaSenha: e.target.value }))}
                            show={showTargetNewPassword}
                            onToggleShow={() => setShowTargetNewPassword((prev) => !prev)}
                            containerStyle={{ marginBottom: 0 }}
                            inputStyle={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                            buttonStyle={{ position: 'absolute', right: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
                          />
                        </div>
                        <div className="col-md-6">
                          <PasswordField
                            id="target-password-confirm"
                            label="Confirmar nova senha"
                            name="targetPasswordConfirm"
                            value={targetPasswordForm.confirmarNovaSenha}
                            onChange={(e) => setTargetPasswordForm((prev) => ({ ...prev, confirmarNovaSenha: e.target.value }))}
                            show={showTargetConfirmPassword}
                            onToggleShow={() => setShowTargetConfirmPassword((prev) => !prev)}
                            containerStyle={{ marginBottom: 0 }}
                            inputStyle={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px' }}
                            buttonStyle={{ position: 'absolute', right: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <button type="button" className="btn btn-warning" onClick={handleSetTargetPassword} disabled={passwordSaving}>
                          {passwordSaving ? 'Salvando...' : 'Definir nova senha'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedAdmin.can_resend_initial_password && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={async () => {
                        await handleResendPassword(selectedAdmin);
                      }}
                    >
                      Reenviar senha
                    </button>
                  )}
                  <button
                    type="button"
                    className={selectedAdmin.ativo ? 'btn btn-danger' : 'btn btn-success'}
                    disabled={selectedAdmin.is_current}
                    onClick={async () => {
                      await handleToggleStatus(selectedAdmin);
                      closeDetailsModal();
                    }}
                  >
                    {selectedAdmin.ativo ? 'Inativar' : 'Ativar'}
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={closeDetailsModal}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
