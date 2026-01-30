import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SendFeedback: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const [tipo, setTipo] = useState<'sugestao' | 'elogio' | 'reclamacao' | 'bug'>('sugestao');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [satisfacao, setSatisfacao] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assunto.trim() || !mensagem.trim()) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.post('/feedbacks', null, {
        params: {
          usuario_id: user?.id,
          tipo,
          assunto: assunto.trim(),
          mensagem: mensagem.trim(),
          satisfacao,
          user_agent: navigator.userAgent,
          url_origem: window.location.href
        }
      });
      
      setSent(true);
      
      // Reseta formulário
      setTimeout(() => {
        setAssunto('');
        setMensagem('');
        setTipo('sugestao');
        setSatisfacao(5);
        setSent(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      alert('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipoFeedback: string) => {
    const icons: Record<string, string> = {
      sugestao: 'bi-lightbulb',
      elogio: 'bi-heart',
      reclamacao: 'bi-exclamation-triangle',
      bug: 'bi-bug'
    };
    return icons[tipoFeedback] || 'bi-chat-dots';
  };

  const getTipoColor = (tipoFeedback: string) => {
    const colors: Record<string, string> = {
      sugestao: 'primary',
      elogio: 'success',
      reclamacao: 'warning',
      bug: 'danger'
    };
    return colors[tipoFeedback] || 'secondary';
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="d-flex align-items-center mb-4">
            <button 
              className="btn btn-outline-secondary me-3"
              onClick={() => navigate(-1)}
            >
              ← Voltar
            </button>
            <h2 className="mb-0">Enviar Feedback</h2>
          </div>

          {sent && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              <strong>Feedback enviado com sucesso!</strong> Obrigado por nos ajudar a melhorar.
              <button type="button" className="btn-close" onClick={() => setSent(false)}></button>
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle me-2"></i>
                Seu feedback é muito importante para nós! Ele nos ajuda a melhorar constantemente o sistema e proporcionar a melhor experiência possível.
              </div>

              <form onSubmit={handleSubmit}>
                {/* Tipo de Feedback */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Tipo de Feedback</label>
                  <div className="row g-3">
                    {[
                      { value: 'sugestao', label: 'Sugestão', desc: 'Ideias de melhoria' },
                      { value: 'elogio', label: 'Elogio', desc: 'Algo que você gostou' },
                      { value: 'reclamacao', label: 'Reclamação', desc: 'Algo que precisa melhorar' },
                      { value: 'bug', label: 'Bug/Erro', desc: 'Problema técnico' }
                    ].map((opcao) => (
                      <div key={opcao.value} className="col-6">
                        <div 
                          className={`card h-100 cursor-pointer ${tipo === opcao.value ? `border-${getTipoColor(opcao.value)} border-3` : ''}`}
                          onClick={() => setTipo(opcao.value as any)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body text-center">
                            <i className={`${getTipoIcon(opcao.value)} fs-1 text-${getTipoColor(opcao.value)}`}></i>
                            <h6 className="mt-2 mb-1">{opcao.label}</h6>
                            <small className="text-muted">{opcao.desc}</small>
                            {tipo === opcao.value && (
                              <div className="mt-2">
                                <i className="bi bi-check-circle-fill text-success"></i>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assunto */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Assunto <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    placeholder="Resuma seu feedback em uma frase"
                    maxLength={200}
                    required
                  />
                  <small className="text-muted">{assunto.length}/200 caracteres</small>
                </div>

                {/* Mensagem */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Mensagem <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Descreva detalhadamente seu feedback..."
                    rows={6}
                    required
                  />
                  <small className="text-muted">
                    Quanto mais detalhes, melhor poderemos entender e agir sobre seu feedback.
                  </small>
                </div>

                {/* Avaliação de Satisfação */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Como você avalia sua experiência geral?
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="flex-grow-1">
                      <input
                        type="range"
                        className="form-range"
                        min="1"
                        max="5"
                        value={satisfacao}
                        onChange={(e) => setSatisfacao(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="text-center" style={{ minWidth: '150px' }}>
                      <div className="fs-4">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi ${i < satisfacao ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
                          ></i>
                        ))}
                      </div>
                      <small className="text-muted">
                        {satisfacao === 1 && 'Muito insatisfeito'}
                        {satisfacao === 2 && 'Insatisfeito'}
                        {satisfacao === 3 && 'Neutro'}
                        {satisfacao === 4 && 'Satisfeito'}
                        {satisfacao === 5 && 'Muito satisfeito'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Informação sobre IA */}
                <div className="alert alert-light border mb-4">
                  <i className="bi bi-robot me-2"></i>
                  <small>
                    <strong>Análise Inteligente:</strong> Seu feedback será analisado por inteligência artificial para identificar padrões e priorizar melhorias.
                  </small>
                </div>

                {/* Botões */}
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-${getTipoColor(tipo)}`}
                    disabled={loading || !assunto.trim() || !mensagem.trim()}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Enviar Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Estatísticas de Feedback */}
          <div className="card mt-4 border-0 bg-light">
            <div className="card-body">
              <h6 className="mb-3">
                <i className="bi bi-graph-up me-2"></i>
                Por que seu feedback é importante?
              </h6>
              <div className="row text-center">
                <div className="col-4">
                  <div className="h2 text-primary mb-0">🎯</div>
                  <small className="text-muted">Melhoria Contínua</small>
                </div>
                <div className="col-4">
                  <div className="h2 text-success mb-0">🤖</div>
                  <small className="text-muted">Análise por IA</small>
                </div>
                <div className="col-4">
                  <div className="h2 text-warning mb-0">⭐</div>
                  <small className="text-muted">Priorização</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendFeedback;
