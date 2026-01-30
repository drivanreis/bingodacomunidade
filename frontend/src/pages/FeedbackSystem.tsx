import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Feedback {
  id: number;
  usuario_nome: string;
  paroquia_nome?: string;
  tipo: 'sugestao' | 'elogio' | 'reclamacao' | 'bug';
  assunto: string;
  mensagem: string;
  satisfacao: number; // 1-5
  status: 'pendente' | 'em_analise' | 'resolvido' | 'arquivado';
  resposta?: string;
  respondido_por?: string;
  criado_em: string;
  respondido_em?: string;
}

const FeedbackSystem: React.FC = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [resposta, setResposta] = useState('');

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      // Simula carregamento de feedbacks
      // Na implementação real, isso viria de um endpoint
      const mockFeedbacks: Feedback[] = [
        {
          id: 1,
          usuario_nome: 'João Silva',
          paroquia_nome: 'São José',
          tipo: 'sugestao',
          assunto: 'Melhorar interface de compra de cartelas',
          mensagem: 'Seria interessante ter uma visualização prévia das cartelas antes da compra.',
          satisfacao: 4,
          status: 'pendente',
          criado_em: new Date().toISOString()
        },
        {
          id: 2,
          usuario_nome: 'Maria Santos',
          tipo: 'elogio',
          assunto: 'Excelente sistema!',
          mensagem: 'Parabéns pelo sistema, muito fácil de usar e intuitivo.',
          satisfacao: 5,
          status: 'resolvido',
          resposta: 'Obrigado pelo feedback! Ficamos felizes que esteja gostando.',
          respondido_por: 'Admin',
          criado_em: new Date(Date.now() - 86400000).toISOString(),
          respondido_em: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          usuario_nome: 'Pedro Costa',
          paroquia_nome: 'São José',
          tipo: 'bug',
          assunto: 'Erro ao finalizar pagamento',
          mensagem: 'Tentei finalizar o pagamento mas recebi erro 500.',
          satisfacao: 2,
          status: 'em_analise',
          criado_em: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 4,
          usuario_nome: 'Ana Paula',
          tipo: 'reclamacao',
          assunto: 'Demora no suporte',
          mensagem: 'Enviei uma mensagem há 3 dias e ainda não obtive resposta.',
          satisfacao: 2,
          status: 'pendente',
          criado_em: new Date(Date.now() - 259200000).toISOString()
        }
      ];

      setFeedbacks(mockFeedbacks);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
      alert('Erro ao carregar feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResposta(feedback.resposta || '');
    setShowModal(true);
  };

  const handleSubmitResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resposta.trim()) {
      alert('Digite uma resposta');
      return;
    }

    try {
      // Simula envio da resposta
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualiza o feedback localmente
      setFeedbacks(feedbacks.map(f => 
        f.id === selectedFeedback?.id 
          ? { 
              ...f, 
              resposta, 
              status: 'resolvido',
              respondido_por: 'Admin',
              respondido_em: new Date().toISOString()
            } 
          : f
      ));
      
      alert('Resposta enviada com sucesso!');
      closeModal();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      alert('Erro ao enviar resposta');
    }
  };

  const handleChangeStatus = async (id: number, newStatus: string) => {
    try {
      // Simula mudança de status
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setFeedbacks(feedbacks.map(f => 
        f.id === id ? { ...f, status: newStatus as Feedback['status'] } : f
      ));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
    setResposta('');
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'sugestao': 'Sugestão',
      'elogio': 'Elogio',
      'reclamacao': 'Reclamação',
      'bug': 'Bug'
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'sugestao': 'primary',
      'elogio': 'success',
      'reclamacao': 'warning',
      'bug': 'danger'
    };
    return colors[tipo] || 'secondary';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'em_analise': 'Em Análise',
      'resolvido': 'Resolvido',
      'arquivado': 'Arquivado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'warning',
      'em_analise': 'info',
      'resolvido': 'success',
      'arquivado': 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="d-inline-flex">
        {[1, 2, 3, 4, 5].map(star => (
          <i 
            key={star}
            className={`bi bi-star${star <= rating ? '-fill' : ''} text-warning`}
          ></i>
        ))}
      </div>
    );
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchStatus = filterStatus === 'todos' || f.status === filterStatus;
    const matchTipo = filterTipo === 'todos' || f.tipo === filterTipo;
    return matchStatus && matchTipo;
  });

  // Estatísticas
  const stats = {
    total: feedbacks.length,
    pendentes: feedbacks.filter(f => f.status === 'pendente').length,
    resolvidos: feedbacks.filter(f => f.status === 'resolvido').length,
    satisfacaoMedia: feedbacks.length > 0 
      ? (feedbacks.reduce((acc, f) => acc + f.satisfacao, 0) / feedbacks.length).toFixed(1)
      : '0'
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
          <h2 className="d-inline-block mb-0">Sistema de Feedback</h2>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={loadFeedbacks}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Atualizar
        </button>
      </div>

      {/* Estatísticas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-primary">{stats.total}</h3>
              <p className="mb-0">Total de Feedbacks</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-warning">{stats.pendentes}</h3>
              <p className="mb-0">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-success">{stats.resolvidos}</h3>
              <p className="mb-0">Resolvidos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-info">{stats.satisfacaoMedia}</h3>
              <p className="mb-0">Satisfação Média</p>
              {renderStars(parseFloat(stats.satisfacaoMedia))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="em_analise">Em Análise</option>
                <option value="resolvido">Resolvido</option>
                <option value="arquivado">Arquivado</option>
              </select>
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <option value="todos">Todos os tipos</option>
                <option value="sugestao">Sugestão</option>
                <option value="elogio">Elogio</option>
                <option value="reclamacao">Reclamação</option>
                <option value="bug">Bug</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Feedbacks */}
      {filteredFeedbacks.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted">Nenhum feedback encontrado</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {filteredFeedbacks.map(feedback => (
            <div key={feedback.id} className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className={`badge bg-${getTipoColor(feedback.tipo)} me-2`}>
                        {getTipoLabel(feedback.tipo)}
                      </span>
                      <span className={`badge bg-${getStatusColor(feedback.status)}`}>
                        {getStatusLabel(feedback.status)}
                      </span>
                    </div>
                    <div>
                      {renderStars(feedback.satisfacao)}
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <h5 className="card-title">{feedback.assunto}</h5>
                  <p className="card-text">{feedback.mensagem}</p>
                  
                  <div className="small text-muted mb-3">
                    <div>
                      <i className="bi bi-person me-1"></i>
                      {feedback.usuario_nome}
                      {feedback.paroquia_nome && ` - ${feedback.paroquia_nome}`}
                    </div>
                    <div>
                      <i className="bi bi-calendar me-1"></i>
                      {new Date(feedback.criado_em).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {feedback.resposta && (
                    <div className="alert alert-info mb-3">
                      <strong>Resposta:</strong>
                      <p className="mb-1">{feedback.resposta}</p>
                      <small className="text-muted">
                        Por {feedback.respondido_por} em {' '}
                        {feedback.respondido_em && new Date(feedback.respondido_em).toLocaleString('pt-BR')}
                      </small>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleResponder(feedback)}
                    >
                      {feedback.resposta ? 'Editar Resposta' : 'Responder'}
                    </button>
                    
                    {feedback.status !== 'resolvido' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleChangeStatus(feedback.id, 'resolvido')}
                      >
                        Marcar como Resolvido
                      </button>
                    )}
                    
                    {feedback.status !== 'arquivado' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleChangeStatus(feedback.id, 'arquivado')}
                      >
                        Arquivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Resposta */}
      {showModal && selectedFeedback && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Responder Feedback</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmitResposta}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label"><strong>Assunto:</strong></label>
                    <p>{selectedFeedback.assunto}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label"><strong>Mensagem:</strong></label>
                    <p>{selectedFeedback.mensagem}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Sua Resposta:</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Enviar Resposta
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

export default FeedbackSystem;
