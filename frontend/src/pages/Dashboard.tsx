import React from 'react';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FloatingCart from '../components/FloatingCart';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const normalizedRole = String(user?.role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const isFaithful = ['faithful', 'fiel', 'usuario_comum'].includes(normalizedRole);

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'Super Administrador',
      parish_admin: 'Administrador Paroquial',
      faithful: 'Fiel',
      fiel: 'Fiel',
      usuario_comum: 'Fiel',
    };
    return roles[role] || role;
  };

  return (
    <div className="db-container">
      <Navbar />
      <div className="db-header">
        <h1 className="db-title">🎉 Dashboard - Bingo da Comunidade</h1>
      </div>

      <div className="db-subHeader">
        <div className="db-subHeaderInfo">
          <div className="db-subItem">
            <span className="db-subLabel">Nome</span>
            <span className="db-subValue">{user?.name || '—'}</span>
          </div>
          <div className="db-subItem">
            <span className="db-subLabel">Email</span>
            <span className="db-subValue">{user?.email || 'Não informado'}</span>
          </div>
          <div className="db-subItem">
            <span className="db-subLabel">Perfil</span>
            <span className="db-subBadge">{getRoleName(user?.role || '')}</span>
          </div>
          {user?.cpf && (
            <div className="db-subItem">
              <span className="db-subLabel">CPF</span>
              <span className="db-subValue">{user.cpf}</span>
            </div>
          )}
          <div className="db-subItem">
            <span className="db-subLabel">ID</span>
            <span className="db-subValue">{user?.id}</span>
          </div>
        </div>
        <button onClick={() => navigate('/profile')} className="db-linkButton db-subHeaderButton">
          Editar Perfil →
        </button>
      </div>

      <div className="db-content">

        <div className="db-card">
          <h2 className="db-cardTitle">🎯 Ações Rápidas</h2>
          <div className="db-actionsGrid">
            <button onClick={() => navigate('/games')} className="db-actionCard">
              <div className="db-actionIcon">🎉</div>
              <h3 className="db-actionTitle">Lotérica: Comprar Cartelas</h3>
              <p className="db-actionDesc">Escolha um concurso e compre sua cartela</p>
            </button>

            {isFaithful && (
              <button onClick={() => navigate('/minhas-cartelas')} className="db-actionCard">
                <div className="db-actionIcon">🎟️</div>
                <h3 className="db-actionTitle">Minha Área de Cartelas</h3>
                <p className="db-actionDesc">Veja, pague e acompanhe seus bilhetes</p>
              </button>
            )}
            
            {(user?.role === 'super_admin' || user?.role === 'parish_admin') && (
              <button onClick={() => navigate('/admin-paroquia/games/new')} className="db-actionCard">
                <div className="db-actionIcon">➕</div>
                <h3 className="db-actionTitle">Criar Jogo</h3>
                <p className="db-actionDesc">Agende um novo bingo</p>
              </button>
            )}
            
            <button onClick={() => navigate('/profile')} className="db-actionCard">
              <div className="db-actionIcon">👤</div>
              <h3 className="db-actionTitle">Meu Perfil</h3>
              <p className="db-actionDesc">Edite suas informações</p>
            </button>

            <button onClick={() => navigate('/feedback')} className="db-actionCard">
              <div className="db-actionIcon">💬</div>
              <h3 className="db-actionTitle">Enviar Feedback</h3>
              <p className="db-actionDesc">Compartilhe sua opinião</p>
            </button>
          </div>
        </div>

        <div className="db-card">
          <h2 className="db-cardTitle">🚀 Funcionalidades Disponíveis</h2>
          <div className="db-featuresList">
            <div className="db-featureItem">
              <span className="db-featureIcon">✅</span>
              <div>
                <h3 className="db-featureTitle">Autenticação JWT</h3>
                <p className="db-featureDesc">Sistema de login seguro implementado</p>
              </div>
            </div>
            <div className="db-featureItem">
              <span className="db-featureIcon">✅</span>
              <div>
                <h3 className="db-featureTitle">Perfis de Usuário</h3>
                <p className="db-featureDesc">Super Admin, Parish Admin e Fiel</p>
              </div>
            </div>
            <div className="db-featureItem">
              <span className="db-featureIcon">🔄</span>
              <div>
                <h3 className="db-featureTitle">Gestão de Jogos</h3>
                <p className="db-featureDesc">Em desenvolvimento</p>
              </div>
            </div>
            <div className="db-featureItem">
              <span className="db-featureIcon">🔄</span>
              <div>
                <h3 className="db-featureTitle">Compra de Cartelas</h3>
                <p className="db-featureDesc">Área lotérica para o fiel comprar cartelas por concurso</p>
              </div>
            </div>
            <div className="db-featureItem">
              <span className="db-featureIcon">🔄</span>
              <div>
                <h3 className="db-featureTitle">Sistema de Sorteio</h3>
                <p className="db-featureDesc">Em desenvolvimento</p>
              </div>
            </div>
          </div>
        </div>

        <div className="db-card">
          <h2 className="db-cardTitle">📊 Status do Sistema</h2>
          <div className="db-statusGrid">
            <div className="db-statusItem">
              <div className="db-statusDot db-statusDotGreen"></div>
              <span>Backend API: Operacional</span>
            </div>
            <div className="db-statusItem">
              <div className="db-statusDot db-statusDotGreen"></div>
              <span>Banco de Dados: Conectado</span>
            </div>
            <div className="db-statusItem">
              <div className="db-statusDot db-statusDotGreen"></div>
              <span>Autenticação: Ativa</span>
            </div>
            <div className="db-statusItem">
              <div className="db-statusDot db-statusDotOrange"></div>
              <span>Frontend: Em Desenvolvimento</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Botão Flutuante de Feedback */}
      <button 
        onClick={() => navigate('/feedback')}
        className="db-feedbackButton"
        title="Enviar Feedback"
      >
        💬
      </button>
      <FloatingCart />
    </div>
  );
};

export default Dashboard;
