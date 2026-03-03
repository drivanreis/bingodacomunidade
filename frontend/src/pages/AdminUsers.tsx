import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { buildBrazilContact, isBrazilContactValid } from '../utils/contactValidation';
import PhoneModule from '../components/form/PhoneModule';
import WhatsAppModule from '../components/form/WhatsAppModule';
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
  telefoneDdd: string;
  telefoneNumero: string;
  whatsappDdd: string;
  whatsappNumero: string;
  senhaTemporaria: string;
  confirmarSenhaTemporaria: string;
}

const INITIAL_FORM: CreateAdminSiteForm = {
  nome: '',
  email: '',
  cpf: '',
  telefoneDdd: '',
  telefoneNumero: '',
  whatsappDdd: '',
  whatsappNumero: '',
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

    if (!formData.email || !isBrazilContactValid(formData.telefoneDdd, formData.telefoneNumero)) {
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

    const telefone = buildBrazilContact(formData.telefoneDdd, formData.telefoneNumero);
    const whatsapp = isBrazilContactValid(formData.whatsappDdd, formData.whatsappNumero)
      ? buildBrazilContact(formData.whatsappDdd, formData.whatsappNumero)
      : telefone;

    try {
      setSaving(true);
      await api.post('/auth/admin-site/criar-admin-site', {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        cpf: normalizeCpf(formData.cpf),
        telefone,
        whatsapp,
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
      <div className="container py-3" style={{ textAlign: 'center', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Carregando usuários do site...</p>
      </div>
    );
  }

  return (
    <div className="container py-3" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <AdminIdentityHeader
        title="👑 Gerenciar Usuários do Site"
        subtitle="Sucessão de Admin-Site, renovação/troca/recuperação de senha e gestão dos pares do site."
        backTo="/admin-site/dashboard"
        rightContent={
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary fw-bold"
          >
            + Novo Usuário do Site (Reserva)
          </button>
        }
      />

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          ⚠️ {error}
        </div>
      )}

      <div className="card mb-4 flex-grow-1">
        <div className="card-body p-0" style={{ overflow: 'auto' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-start">Login</th>
                  <th className="text-start">Email</th>
                  <th className="text-start">Telefone</th>
                  <th className="text-start">Status</th>
                  <th className="text-start">Ações</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="text-start">
                      <button
                        type="button"
                        onClick={() => openDetailsModal(admin)}
                        className="btn btn-link p-0 text-decoration-underline fw-semibold"
                        aria-label={`abrir propriedades de ${admin.login}`}
                      >
                        {admin.login}
                      </button>
                      {admin.is_current && (
                        <span className="badge bg-info ms-2" style={{ fontSize: '10px' }}>
                          você
                        </span>
                      )}
                    </td>
                    <td className="text-start align-middle">{admin.email}</td>
                    <td className="text-start align-middle">{admin.telefone || '-'}</td>
                    <td className="text-start align-middle">
                      <span className={`badge ${admin.ativo ? 'bg-success' : 'bg-secondary'}`}>
                        {admin.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="text-start align-middle">
                      <div className="d-flex gap-2 flex-wrap">
                        {admin.can_resend_initial_password && (
                          <button
                            onClick={() => handleResendPassword(admin)}
                            className="btn btn-sm btn-primary"
                          >
                            Reenviar senha
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          disabled={admin.is_current}
                          className={`btn btn-sm ${admin.ativo ? 'btn-danger' : 'btn-success'}`}
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
        </div>
      </div>

      {admins.length === 0 && (
        <div className="text-center text-muted mt-4">Nenhum usuário do site encontrado.</div>
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

                  <PhoneModule
                    ddd={formData.telefoneDdd}
                    telefone={formData.telefoneNumero}
                    onDddChange={(value) => setFormData((prev) => ({ ...prev, telefoneDdd: value }))}
                    onTelefoneChange={(value) => setFormData((prev) => ({ ...prev, telefoneNumero: value }))}
                    required
                  />

                  <WhatsAppModule
                    ddd={formData.whatsappDdd}
                    telefone={formData.whatsappNumero}
                    onDddChange={(value) => setFormData((prev) => ({ ...prev, whatsappDdd: value }))}
                    onTelefoneChange={(value) => setFormData((prev) => ({ ...prev, whatsappNumero: value }))}
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
                        <th className="text-start" style={{ width: '220px' }}>ID</th>
                        <td className="text-start">{selectedAdmin.id}</td>
                      </tr>
                      <tr>
                        <th className="text-start">Login</th>
                        <td className="text-start">{selectedAdmin.login}</td>
                      </tr>
                      <tr>
                        <th className="text-start">E-mail</th>
                        <td className="text-start">{selectedAdmin.email || '-'}</td>
                      </tr>
                      <tr>
                        <th className="text-start">CPF</th>
                        <td className="text-start">{selectedAdmin.cpf || '-'}</td>
                      </tr>
                      <tr>
                        <th className="text-start">Telefone</th>
                        <td className="text-start">{selectedAdmin.telefone || '-'}</td>
                      </tr>
                      <tr>
                        <th className="text-start">WhatsApp</th>
                        <td className="text-start">{selectedAdmin.whatsapp || '-'}</td>
                      </tr>
                      <tr>
                        <th className="text-start">Status</th>
                        <td className="text-start">{selectedAdmin.ativo ? 'Ativo' : 'Inativo'}</td>
                      </tr>
                      <tr>
                        <th className="text-start">Criado por</th>
                        <td className="text-start">{selectedAdmin.criado_por_id || '-'}</td>
                      </tr>
                      <tr>
                        <th className="text-start">Criado em</th>
                        <td className="text-start">{selectedAdmin.criado_em ? new Date(selectedAdmin.criado_em).toLocaleString('pt-BR') : '-'}</td>
                      </tr>
                      <tr>
                        <th className="text-start">Senha inicial pendente</th>
                        <td className="text-start">{selectedAdmin.can_resend_initial_password ? 'Sim' : 'Não'}</td>
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
              <div className="modal-footer d-flex justify-content-between">
                <div className="d-flex gap-2 flex-wrap">
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
