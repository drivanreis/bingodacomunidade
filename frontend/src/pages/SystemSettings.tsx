import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Configuracao {
  chave: string;
  valor: string;
  tipo: 'number' | 'boolean' | 'string';
  categoria: 'mensagens' | 'seguranca' | 'carrinho' | 'formularios' | 'recuperacao_senha';
  descricao: string;
  alterado_em?: string;
}

interface ConfigsPorCategoria {
  mensagens: Configuracao[];
  seguranca: Configuracao[];
  carrinho: Configuracao[];
  formularios: Configuracao[];
  recuperacao_senha: Configuracao[];
}

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configs, setConfigs] = useState<Configuracao[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/configuracoes');
      setConfigs(response.data);
      
      // Inicializa valores editáveis
      const initialValues: Record<string, string> = {};
      response.data.forEach((config: Configuracao) => {
        initialValues[config.chave] = config.valor;
      });
      setEditedValues(initialValues);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      alert('Erro ao carregar configurações do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (chave: string) => {
    try {
      const valor = editedValues[chave];
      await api.put(`/configuracoes/${chave}`, null, {
        params: { valor }
      });
      
      // Atualiza a lista local
      setConfigs(prev => prev.map(c => 
        c.chave === chave ? { ...c, valor, alterado_em: new Date().toISOString() } : c
      ));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(`Erro ao salvar ${chave}:`, error);
      alert(`Erro ao salvar configuração`);
    }
  };

  const handleChange = (chave: string, valor: string) => {
    setEditedValues(prev => ({ ...prev, [chave]: valor }));
  };

  const groupByCategory = (): ConfigsPorCategoria => {
    const grouped: ConfigsPorCategoria = {
      mensagens: [],
      seguranca: [],
      carrinho: [],
      formularios: [],
      recuperacao_senha: []
    };

    configs.forEach(config => {
      grouped[config.categoria].push(config);
    });

    return grouped;
  };

  const renderConfigField = (config: Configuracao) => {
    const currentValue = editedValues[config.chave] || config.valor;
    const hasChanged = currentValue !== config.valor;

    if (config.tipo === 'boolean') {
      return (
        <div className="mb-4 pb-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={config.chave}
                  checked={currentValue === 'true'}
                  onChange={(e) => handleChange(config.chave, e.target.checked ? 'true' : 'false')}
                />
                <label className="form-check-label fw-bold" htmlFor={config.chave}>
                  {formatLabel(config.chave)}
                </label>
              </div>
              <small className="text-muted d-block ms-4">{config.descricao}</small>
            </div>
            {hasChanged && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleSave(config.chave)}
              >
                <i className="bi bi-check-lg"></i> Salvar
              </button>
            )}
          </div>
        </div>
      );
    }

    if (config.tipo === 'number') {
      return (
        <div className="mb-4 pb-3 border-bottom">
          <label className="form-label fw-bold">{formatLabel(config.chave)}</label>
          <small className="text-muted d-block mb-2">{config.descricao}</small>
          <div className="d-flex gap-2">
            <input
              type="number"
              className="form-control"
              value={currentValue}
              onChange={(e) => handleChange(config.chave, e.target.value)}
              step={config.chave.includes('Duration') ? '0.1' : '1'}
              min="0"
            />
            {hasChanged && (
              <button
                className="btn btn-primary"
                onClick={() => handleSave(config.chave)}
              >
                <i className="bi bi-check-lg"></i> Salvar
              </button>
            )}
          </div>
        </div>
      );
    }

    // string
    return (
      <div className="mb-4 pb-3 border-bottom">
        <label className="form-label fw-bold">{formatLabel(config.chave)}</label>
        <small className="text-muted d-block mb-2">{config.descricao}</small>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            value={currentValue}
            onChange={(e) => handleChange(config.chave, e.target.value)}
          />
          {hasChanged && (
            <button
              className="btn btn-primary"
              onClick={() => handleSave(config.chave)}
            >
              <i className="bi bi-check-lg"></i> Salvar
            </button>
          )}
        </div>
      </div>
    );
  };

  const formatLabel = (chave: string): string => {
    // Converte camelCase para Título Com Espaços
    return chave
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getCategoryTitle = (categoria: string): string => {
    const titles: Record<string, string> = {
      mensagens: 'Mensagens e Notificações',
      seguranca: 'Segurança e Autenticação',
      carrinho: 'Carrinho de Cartelas',
      formularios: 'Formulários e Rascunhos',
      recuperacao_senha: 'Recuperação de Senha'
    };
    return titles[categoria] || categoria;
  };

  const getCategoryIcon = (categoria: string): string => {
    const icons: Record<string, string> = {
      mensagens: 'bi-chat-dots',
      seguranca: 'bi-shield-lock',
      carrinho: 'bi-cart3',
      formularios: 'bi-file-earmark-text',
      recuperacao_senha: 'bi-key'
    };
    return icons[categoria] || 'bi-gear';
  };

  const grouped = groupByCategory();

  if (loading && configs.length === 0) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3">Carregando configurações...</p>
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
          <h2 className="d-inline-block mb-0">Configurações do Sistema</h2>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          Configuração salva com sucesso!
          <button type="button" className="btn-close" onClick={() => setSaved(false)}></button>
        </div>
      )}

      <div className="alert alert-info mb-4">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Configurações Centralizadas:</strong> Todas as alterações são salvas individualmente e aplicadas imediatamente no sistema.
      </div>

      {/* Mensagens e Notificações */}
      {grouped.mensagens.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className={`${getCategoryIcon('mensagens')} me-2`}></i>
              {getCategoryTitle('mensagens')}
            </h5>
          </div>
          <div className="card-body">
            {grouped.mensagens.map(config => (
              <div key={config.chave}>{renderConfigField(config)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Segurança e Autenticação */}
      {grouped.seguranca.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">
              <i className={`${getCategoryIcon('seguranca')} me-2`}></i>
              {getCategoryTitle('seguranca')}
            </h5>
          </div>
          <div className="card-body">
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Configurações de Segurança Nível Bancário:</strong> Altere com cuidado. Estas configurações afetam a segurança de todo o sistema.
            </div>
            {grouped.seguranca.map(config => (
              <div key={config.chave}>{renderConfigField(config)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Carrinho de Cartelas */}
      {grouped.carrinho.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <i className={`${getCategoryIcon('carrinho')} me-2`}></i>
              {getCategoryTitle('carrinho')}
            </h5>
          </div>
          <div className="card-body">
            {grouped.carrinho.map(config => (
              <div key={config.chave}>{renderConfigField(config)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Formulários e Rascunhos */}
      {grouped.formularios.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className={`${getCategoryIcon('formularios')} me-2`}></i>
              {getCategoryTitle('formularios')}
            </h5>
          </div>
          <div className="card-body">
            {grouped.formularios.map(config => (
              <div key={config.chave}>{renderConfigField(config)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Recuperação de Senha */}
      {grouped.recuperacao_senha.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-warning">
            <h5 className="mb-0">
              <i className={`${getCategoryIcon('recuperacao_senha')} me-2`}></i>
              {getCategoryTitle('recuperacao_senha')}
            </h5>
          </div>
          <div className="card-body">
            {grouped.recuperacao_senha.map(config => (
              <div key={config.chave}>{renderConfigField(config)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
