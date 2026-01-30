import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: number;
  usuario_nome: string;
  acao: string;
  detalhes: string;
  ip_address?: string;
  data_hora: string;
  nivel: 'info' | 'warning' | 'error' | 'success';
}

const AuditLog: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    usuario: '',
    acao: '',
    nivel: 'todos',
    dataInicio: '',
    dataFim: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Simula carregamento de logs
      // Na implementação real, isso viria de um endpoint
      const mockLogs: LogEntry[] = [
        {
          id: 1,
          usuario_nome: 'Admin',
          acao: 'LOGIN',
          detalhes: 'Login realizado com sucesso',
          ip_address: '192.168.1.100',
          data_hora: new Date().toISOString(),
          nivel: 'success'
        },
        {
          id: 2,
          usuario_nome: 'Admin',
          acao: 'CRIAR_PAROQUIA',
          detalhes: 'Paróquia "São José" criada',
          ip_address: '192.168.1.100',
          data_hora: new Date(Date.now() - 3600000).toISOString(),
          nivel: 'info'
        },
        {
          id: 3,
          usuario_nome: 'Sistema',
          acao: 'ERRO_SISTEMA',
          detalhes: 'Falha ao conectar com serviço externo',
          data_hora: new Date(Date.now() - 7200000).toISOString(),
          nivel: 'error'
        },
        {
          id: 4,
          usuario_nome: 'Admin',
          acao: 'EDITAR_USUARIO',
          detalhes: 'Usuário "João Silva" atualizado',
          ip_address: '192.168.1.100',
          data_hora: new Date(Date.now() - 10800000).toISOString(),
          nivel: 'info'
        },
        {
          id: 5,
          usuario_nome: 'Admin',
          acao: 'EXCLUIR_JOGO',
          detalhes: 'Tentativa de excluir jogo ativo - bloqueado',
          ip_address: '192.168.1.100',
          data_hora: new Date(Date.now() - 14400000).toISOString(),
          nivel: 'warning'
        }
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      alert('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR');
  };

  const getNivelBadge = (nivel: string) => {
    const badges: Record<string, string> = {
      'info': 'bg-info',
      'success': 'bg-success',
      'warning': 'bg-warning text-dark',
      'error': 'bg-danger'
    };
    return badges[nivel] || 'bg-secondary';
  };

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Ação', 'Detalhes', 'IP', 'Nível'],
      ...filteredLogs.map(log => [
        formatDateTime(log.data_hora),
        log.usuario_nome,
        log.acao,
        log.detalhes,
        log.ip_address || '-',
        log.nivel
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredLogs = logs.filter(log => {
    const matchUsuario = !filters.usuario || 
      log.usuario_nome.toLowerCase().includes(filters.usuario.toLowerCase());
    
    const matchAcao = !filters.acao || 
      log.acao.toLowerCase().includes(filters.acao.toLowerCase()) ||
      log.detalhes.toLowerCase().includes(filters.acao.toLowerCase());
    
    const matchNivel = filters.nivel === 'todos' || log.nivel === filters.nivel;
    
    let matchData = true;
    if (filters.dataInicio) {
      matchData = matchData && new Date(log.data_hora) >= new Date(filters.dataInicio);
    }
    if (filters.dataFim) {
      matchData = matchData && new Date(log.data_hora) <= new Date(filters.dataFim + 'T23:59:59');
    }
    
    return matchUsuario && matchAcao && matchNivel && matchData;
  });

  // Paginação
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

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
          <h2 className="d-inline-block mb-0">Auditoria e Logs</h2>
        </div>
        <div>
          <button 
            className="btn btn-outline-primary me-2"
            onClick={loadLogs}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Atualizar
          </button>
          <button 
            className="btn btn-success"
            onClick={exportLogs}
          >
            <i className="bi bi-download me-2"></i>
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3 mb-md-0">
              <input
                type="text"
                className="form-control"
                placeholder="Filtrar por usuário..."
                value={filters.usuario}
                onChange={(e) => setFilters({...filters, usuario: e.target.value})}
              />
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <input
                type="text"
                className="form-control"
                placeholder="Filtrar por ação..."
                value={filters.acao}
                onChange={(e) => setFilters({...filters, acao: e.target.value})}
              />
            </div>
            <div className="col-md-2 mb-3 mb-md-0">
              <select
                className="form-select"
                value={filters.nivel}
                onChange={(e) => setFilters({...filters, nivel: e.target.value})}
              >
                <option value="todos">Todos os níveis</option>
                <option value="info">Info</option>
                <option value="success">Sucesso</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={filters.dataInicio}
                onChange={(e) => setFilters({...filters, dataInicio: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={filters.dataFim}
                onChange={(e) => setFilters({...filters, dataFim: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="card">
        <div className="card-body">
          {currentLogs.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Nenhum log encontrado</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Data/Hora</th>
                      <th>Usuário</th>
                      <th>Ação</th>
                      <th>Detalhes</th>
                      <th>IP</th>
                      <th>Nível</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map(log => (
                      <tr key={log.id}>
                        <td className="small">{formatDateTime(log.data_hora)}</td>
                        <td>{log.usuario_nome}</td>
                        <td>
                          <code className="small">{log.acao}</code>
                        </td>
                        <td className="small">{log.detalhes}</td>
                        <td className="small">{log.ip_address || '-'}</td>
                        <td>
                          <span className={`badge ${getNivelBadge(log.nivel)}`}>
                            {log.nivel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li 
                        key={i + 1} 
                        className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próximo
                      </button>
                    </li>
                  </ul>
                </nav>
              )}

              <div className="text-center text-muted small mt-3">
                Mostrando {indexOfFirstLog + 1} - {Math.min(indexOfLastLog, filteredLogs.length)} de {filteredLogs.length} registros
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
