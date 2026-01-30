import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Settings {
  sistema_nome: string;
  sistema_descricao: string;
  manutencao_ativo: boolean;
  manutencao_mensagem: string;
  email_notificacoes: string;
  max_cartelas_por_jogo: number;
  valor_minimo_cartela: number;
  tempo_confirmacao_pagamento: number;
  permitir_cadastro_publico: boolean;
  requer_confirmacao_email: boolean;
}

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    sistema_nome: 'Bingo da Comunidade',
    sistema_descricao: 'Sistema de gerenciamento de bingos paroquiais',
    manutencao_ativo: false,
    manutencao_mensagem: 'Sistema em manutenção. Voltamos em breve!',
    email_notificacoes: '',
    max_cartelas_por_jogo: 100,
    valor_minimo_cartela: 5.0,
    tempo_confirmacao_pagamento: 30,
    permitir_cadastro_publico: true,
    requer_confirmacao_email: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Simula carregamento de configurações
      // Na implementação real, isso viria de um endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Por enquanto, mantém os valores padrão
      console.log('Configurações carregadas');
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      // Simula salvamento
      // Na implementação real, isso enviaria para um endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Configurações salvas:', settings);
      setSaved(true);
      
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      return;
    }

    setSettings({
      sistema_nome: 'Bingo da Comunidade',
      sistema_descricao: 'Sistema de gerenciamento de bingos paroquiais',
      manutencao_ativo: false,
      manutencao_mensagem: 'Sistema em manutenção. Voltamos em breve!',
      email_notificacoes: '',
      max_cartelas_por_jogo: 100,
      valor_minimo_cartela: 5.0,
      tempo_confirmacao_pagamento: 30,
      permitir_cadastro_publico: true,
      requer_confirmacao_email: false
    });
  };

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
          <h2 className="d-inline-block mb-0">Configurações do Sistema</h2>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          Configurações salvas com sucesso!
          <button type="button" className="btn-close" onClick={() => setSaved(false)}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Informações Gerais */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Informações Gerais</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Nome do Sistema</label>
              <input
                type="text"
                className="form-control"
                value={settings.sistema_nome}
                onChange={(e) => setSettings({...settings, sistema_nome: e.target.value})}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Descrição</label>
              <textarea
                className="form-control"
                rows={3}
                value={settings.sistema_descricao}
                onChange={(e) => setSettings({...settings, sistema_descricao: e.target.value})}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">E-mail para Notificações</label>
              <input
                type="email"
                className="form-control"
                value={settings.email_notificacoes}
                onChange={(e) => setSettings({...settings, email_notificacoes: e.target.value})}
                placeholder="admin@exemplo.com"
              />
              <small className="text-muted">E-mail que receberá notificações do sistema</small>
            </div>
          </div>
        </div>

        {/* Modo de Manutenção */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Modo de Manutenção</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="manutencaoSwitch"
                  checked={settings.manutencao_ativo}
                  onChange={(e) => setSettings({...settings, manutencao_ativo: e.target.checked})}
                />
                <label className="form-check-label" htmlFor="manutencaoSwitch">
                  Ativar Modo de Manutenção
                </label>
              </div>
              <small className="text-muted">
                Quando ativo, apenas administradores poderão acessar o sistema
              </small>
            </div>
            {settings.manutencao_ativo && (
              <div className="mb-3">
                <label className="form-label">Mensagem de Manutenção</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={settings.manutencao_mensagem}
                  onChange={(e) => setSettings({...settings, manutencao_mensagem: e.target.value})}
                />
              </div>
            )}
          </div>
        </div>

        {/* Configurações de Jogos */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Configurações de Jogos</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Máximo de Cartelas por Jogo</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.max_cartelas_por_jogo}
                  onChange={(e) => setSettings({...settings, max_cartelas_por_jogo: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Valor Mínimo da Cartela (R$)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.valor_minimo_cartela}
                  onChange={(e) => setSettings({...settings, valor_minimo_cartela: parseFloat(e.target.value)})}
                  min="0"
                  step="0.50"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Tempo Confirmação Pagamento (min)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.tempo_confirmacao_pagamento}
                  onChange={(e) => setSettings({...settings, tempo_confirmacao_pagamento: parseInt(e.target.value)})}
                  min="5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configurações de Usuários */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Configurações de Usuários</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="cadastroPublico"
                  checked={settings.permitir_cadastro_publico}
                  onChange={(e) => setSettings({...settings, permitir_cadastro_publico: e.target.checked})}
                />
                <label className="form-check-label" htmlFor="cadastroPublico">
                  Permitir Cadastro Público
                </label>
              </div>
              <small className="text-muted">
                Permite que usuários se cadastrem sem aprovação prévia
              </small>
            </div>
            <div className="mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="confirmarEmail"
                  checked={settings.requer_confirmacao_email}
                  onChange={(e) => setSettings({...settings, requer_confirmacao_email: e.target.checked})}
                />
                <label className="form-check-label" htmlFor="confirmarEmail">
                  Requerer Confirmação de E-mail
                </label>
              </div>
              <small className="text-muted">
                Usuários precisam confirmar o e-mail antes de usar o sistema
              </small>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between">
              <button 
                type="button" 
                className="btn btn-outline-warning"
                onClick={handleReset}
                disabled={loading}
              >
                Restaurar Padrões
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;
