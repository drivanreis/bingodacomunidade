import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ReportData {
  usuarios_paroquia: {
    total: number;
    admins: number;
    operadores: number;
    vendedores: number;
    caixa: number;
  };
  fieis: {
    total: number;
    ativos: number;
    banidos: number;
    inativos: number;
  };
  receita: {
    total: number;
    apostas: number;
    doacoes: number;
  };
  engajamento: {
    usuarios_online: number;
    visitas_hoje: number;
    visitas_semana: number;
    visitas_mes: number;
  };
  jogos: {
    total: number;
    em_andamento: number;
    finalizados: number;
    cancelados: number;
  };
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    usuarios_paroquia: {
      total: 0,
      admins: 0,
      operadores: 0,
      vendedores: 0,
      caixa: 0
    },
    fieis: {
      total: 0,
      ativos: 0,
      banidos: 0,
      inativos: 0
    },
    receita: {
      total: 0,
      apostas: 0,
      doacoes: 0
    },
    engajamento: {
      usuarios_online: 0,
      visitas_hoje: 0,
      visitas_semana: 0,
      visitas_mes: 0
    },
    jogos: {
      total: 0,
      em_andamento: 0,
      finalizados: 0,
      cancelados: 0
    }
  });
  const [dateRange, setDateRange] = useState({
    inicio: '',
    fim: ''
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      // Carrega dados reais da API
      const [usuariosRes, jogosRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/jogos')
      ]);

      const usuarios = usuariosRes.data;
      const jogos = jogosRes.data;

      // Filtra usuários da paróquia (exclui super_admin e usuario_publico)
      const usuariosParoquia = usuarios.filter((u: { tipo: string }) => 
        u.tipo.includes('paroquia_')
      );

      // Conta por tipo
      const admins = usuariosParoquia.filter((u: { tipo: string }) => u.tipo === 'paroquia_admin').length;
      const operadores = usuariosParoquia.filter((u: { tipo: string }) => u.tipo === 'paroquia_operador').length;
      const vendedores = usuariosParoquia.filter((u: { tipo: string }) => u.tipo === 'paroquia_vendedor').length;
      const caixa = usuariosParoquia.filter((u: { tipo: string }) => u.tipo === 'paroquia_caixa').length;

      // Fiéis (usuários públicos)
      const fieis = usuarios.filter((u: { tipo: string }) => u.tipo === 'usuario_publico');
      const fieisAtivos = fieis.filter((u: { ativo: boolean }) => u.ativo).length;
      const fieisBanidos = fieis.filter((u: { ativo: boolean, banido?: boolean }) => u.banido === true).length;

      setData({
        usuarios_paroquia: {
          total: usuariosParoquia.length,
          admins,
          operadores,
          vendedores,
          caixa
        },
        fieis: {
          total: fieis.length,
          ativos: fieisAtivos,
          banidos: fieisBanidos,
          inativos: fieis.length - fieisAtivos - fieisBanidos
        },
        receita: {
          total: 0, // TODO: Implementar endpoint de receita
          apostas: 0,
          doacoes: 0
        },
        engajamento: {
          usuarios_online: 1, // TODO: Implementar rastreamento de sessões
          visitas_hoje: 15, // TODO: Implementar analytics
          visitas_semana: 87,
          visitas_mes: 342
        },
        jogos: {
          total: jogos.length,
          em_andamento: jogos.filter((j: { status: string }) => j.status === 'em_andamento').length,
          finalizados: jogos.filter((j: { status: string }) => j.status === 'finalizado').length,
          cancelados: jogos.filter((j: { status: string }) => j.status === 'cancelado').length
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      alert('Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Métrica', 'Valor'],
      ['', ''],
      ['=== EQUIPE DA PARÓQUIA ===', ''],
      ['Total de Funcionários', data.usuarios_paroquia.total],
      ['Administradores', data.usuarios_paroquia.admins],
      ['Operadores', data.usuarios_paroquia.operadores],
      ['Vendedores', data.usuarios_paroquia.vendedores],
      ['Caixa', data.usuarios_paroquia.caixa],
      ['', ''],
      ['=== FIÉIS CADASTRADOS ===', ''],
      ['Total de Fiéis', data.fieis.total],
      ['Fiéis Ativos', data.fieis.ativos],
      ['Fiéis Inativos', data.fieis.inativos],
      ['Fiéis Banidos', data.fieis.banidos],
      ['', ''],
      ['=== RECEITA ===', ''],
      ['Receita Total', `R$ ${data.receita.total.toFixed(2)}`],
      ['Receita de Apostas', `R$ ${data.receita.apostas.toFixed(2)}`],
      ['Doações', `R$ ${data.receita.doacoes.toFixed(2)}`],
      ['', ''],
      ['=== ENGAJAMENTO ===', ''],
      ['Usuários Online Agora', data.engajamento.usuarios_online],
      ['Visitas Hoje', data.engajamento.visitas_hoje],
      ['Visitas esta Semana', data.engajamento.visitas_semana],
      ['Visitas este Mês', data.engajamento.visitas_mes],
      ['', ''],
      ['=== JOGOS ===', ''],
      ['Total de Jogos', data.jogos.total],
      ['Em Andamento', data.jogos.em_andamento],
      ['Finalizados', data.jogos.finalizados],
      ['Cancelados', data.jogos.cancelados]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
          <h2 className="d-inline-block mb-0">Relatórios e Estatísticas</h2>
        </div>
        <button 
          className="btn btn-success"
          onClick={exportToCSV}
        >
          <i className="bi bi-download me-2"></i>
          Exportar CSV
        </button>
      </div>

      {/* Filtros de Data */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-4">
              <label className="form-label">Data Início</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.inicio}
                onChange={(e) => setDateRange({...dateRange, inicio: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Data Fim</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.fim}
                onChange={(e) => setDateRange({...dateRange, fim: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <button 
                className="btn btn-primary w-100"
                onClick={loadReportData}
              >
                Atualizar Dados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Principal */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center border-primary">
            <div className="card-body">
              <h3 className="text-primary">{data.usuarios_paroquia.total}</h3>
              <p className="mb-0">Equipe da Paróquia</p>
              <small className="text-muted">
                {data.usuarios_paroquia.admins} admins, {data.usuarios_paroquia.operadores} operadores
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-success">
            <div className="card-body">
              <h3 className="text-success">{data.fieis.total}</h3>
              <p className="mb-0">Fiéis Cadastrados</p>
              <small className="text-muted">
                {data.fieis.ativos} ativos / {data.fieis.banidos} banidos
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-warning">
            <div className="card-body">
              <h3 className="text-warning">R$ {data.receita.total.toFixed(2)}</h3>
              <p className="mb-0">Receita Total</p>
              <small className="text-muted">
                Apostas + Doações
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-info">
            <div className="card-body">
              <h3 className="text-info">{data.engajamento.usuarios_online}</h3>
              <p className="mb-0">Usuários Online</p>
              <small className="text-muted">
                Agora
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento */}
      <div className="row mb-4">
        {/* Receita Detalhada */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0"><i className="bi bi-cash-stack me-2"></i>Receita Detalhada</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span>Venda de Cartelas (Apostas)</span>
                  <strong className="text-success">R$ {data.receita.apostas.toFixed(2)}</strong>
                </div>
                <div className="progress mt-2" style={{ height: '25px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ 
                      width: data.receita.total > 0 ? `${(data.receita.apostas / data.receita.total) * 100}%` : '0%'
                    }}
                  >
                    {data.receita.total > 0 ? Math.round((data.receita.apostas / data.receita.total) * 100) : 0}%
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span>Doações</span>
                  <strong className="text-info">R$ {data.receita.doacoes.toFixed(2)}</strong>
                </div>
                <div className="progress mt-2" style={{ height: '25px' }}>
                  <div 
                    className="progress-bar bg-info" 
                    style={{ 
                      width: data.receita.total > 0 ? `${(data.receita.doacoes / data.receita.total) * 100}%` : '0%'
                    }}
                  >
                    {data.receita.total > 0 ? Math.round((data.receita.doacoes / data.receita.total) * 100) : 0}%
                  </div>
                </div>
              </div>

              <hr />
              
              <div className="d-flex justify-content-between align-items-center">
                <strong>Total</strong>
                <h4 className="text-warning mb-0">R$ {data.receita.total.toFixed(2)}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Engajamento */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0"><i className="bi bi-graph-up-arrow me-2"></i>Engajamento e Visitas</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="bg-light p-3 rounded">
                    <h4 className="text-primary mb-0">{data.engajamento.visitas_hoje}</h4>
                    <small className="text-muted">Visitas Hoje</small>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="bg-light p-3 rounded">
                    <h4 className="text-success mb-0">{data.engajamento.visitas_semana}</h4>
                    <small className="text-muted">Esta Semana</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-light p-3 rounded">
                    <h4 className="text-warning mb-0">{data.engajamento.visitas_mes}</h4>
                    <small className="text-muted">Este Mês</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-light p-3 rounded">
                    <h4 className="text-info mb-0">{data.engajamento.usuarios_online}</h4>
                    <small className="text-muted">Online Agora</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visão Geral em Círculos */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Visão Geral do Sistema</h5>
        </div>
        <div className="card-body">
          <div className="row text-center">
            <div className="col-md-3">
              <div className="mb-3">
                <div 
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center"
                  style={{ width: '100px', height: '100px', fontSize: '28px', fontWeight: 'bold' }}
                >
                  {data.usuarios_paroquia.total}
                </div>
                <p className="mt-3 mb-0 fw-bold">Equipe Paróquia</p>
                <small className="text-muted">Funcionários</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <div 
                  className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center"
                  style={{ width: '100px', height: '100px', fontSize: '28px', fontWeight: 'bold' }}
                >
                  {data.fieis.ativos}
                </div>
                <p className="mt-3 mb-0 fw-bold">Fiéis Ativos</p>
                <small className="text-muted">De {data.fieis.total} total</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <div 
                  className="rounded-circle bg-warning text-white d-inline-flex align-items-center justify-content-center"
                  style={{ width: '100px', height: '100px', fontSize: '20px', fontWeight: 'bold' }}
                >
                  {data.jogos.em_andamento}
                </div>
                <p className="mt-3 mb-0 fw-bold">Jogos Ativos</p>
                <small className="text-muted">Em andamento</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mb-3">
                <div 
                  className="rounded-circle bg-info text-white d-inline-flex align-items-center justify-content-center"
                  style={{ width: '100px', height: '100px', fontSize: '28px', fontWeight: 'bold' }}
                >
                  {data.engajamento.visitas_hoje}
                </div>
                <p className="mt-3 mb-0 fw-bold">Visitas Hoje</p>
                <small className="text-muted">Tráfego</small>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          {/* Indicadores de Marketing */}
          <div className="alert alert-info">
            <h6 className="alert-heading"><i className="bi bi-graph-up me-2"></i>Insights para Marketing</h6>
            <ul className="mb-0">
              <li><strong>Taxa de Conversão:</strong> {data.fieis.total > 0 ? ((data.fieis.ativos / data.fieis.total) * 100).toFixed(1) : 0}% dos cadastrados estão ativos</li>
              <li><strong>Engajamento:</strong> {data.engajamento.visitas_mes} visitas este mês ({Math.round(data.engajamento.visitas_mes / 30)} média/dia)</li>
              <li><strong>Receita Média:</strong> R$ {data.jogos.total > 0 ? (data.receita.total / data.jogos.total).toFixed(2) : '0.00'} por jogo</li>
              <li><strong>Momento Atual:</strong> {data.engajamento.usuarios_online} usuário(s) online agora</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
