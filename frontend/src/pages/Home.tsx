/**
 * Página Home - Portal da Comunidade
 * 
 * Foco: Família, União, Pertencimento
 */

import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { resolveDashboardPath } from '../utils/sessionScope';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    let active = true;

    const carregarStatusPublico = async () => {
      try {
        const response = await api.get('/auth/public-status');
        if (!active) return;
        setMaintenanceMode(!!response.data?.maintenance_mode);
      } catch {
        if (!active) return;
        setMaintenanceMode(false);
      }
    };

    void carregarStatusPublico();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const normalizedRole = (user?.role || '').toLowerCase();
  const isAdminSession = [
    'admin_site',
    'super_admin',
    'admin_paroquia',
    'parish_admin',
    'paroquia_admin',
    'paroquia_caixa',
    'paroquia_recepcao',
    'paroquia_bingo',
    'usuario_administrativo',
  ].includes(normalizedRole);

  const shouldBlockPublicHome = maintenanceMode && !isAdminSession;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!maintenanceMode || !isAuthenticated || isAdminSession) {
      return;
    }

    localStorage.removeItem('@BingoComunidade:token');
    localStorage.removeItem('@BingoComunidade:user');
    delete api.defaults.headers.common.Authorization;

    window.location.replace('/');
  }, [loading, maintenanceMode, isAuthenticated, isAdminSession]);

  return (
    <div style={styles.container}>
      {/* HERO: Família em Primeiro Lugar */}
      <div style={styles.hero}>
        <h1 style={styles.mainTitle}>Sua Paróquia, Sua Comunidade, Sua Festa!</h1>
        <p style={styles.heroSubtitle}>
          Mais que um jogo: uma ferramenta de evangelização que reúne famílias, fortalece laços e apoia sua paróquia
        </p>
        
        <div style={styles.heroButtons}>
          {shouldBlockPublicHome ? (
            <div style={styles.maintenanceBox}>
              ⚠️ Sistema em manutenção para público até configuração do primeiro Admin-Paróquia.
            </div>
          ) : isAuthenticated ? (
              <button 
                onClick={() => navigate(resolveDashboardPath(user?.role))} 
                style={styles.primaryButton}
              >
                🏠 Acessar Minha Conta
            </button>
          ) : (
            <>
              <button 
                onClick={() => navigate('/signup')} 
                style={styles.primaryButton}
              >
                🎉 Participar Agora
              </button>
              <button 
                onClick={() => navigate('/login')} 
                style={styles.secondaryButton}
              >
                Já Participo
              </button>
            </>
          )}
        </div>
      </div>

      {/* SEÇÃO: Para a Comunidade */}
      <div style={styles.communitySection}>
        <h2 style={styles.sectionTitle}>✨ Mais que um Bingo, uma Comunidade</h2>
        
        <div style={styles.benefitsGrid}>
          <div style={styles.benefitCard}>
            <div style={styles.benefitIcon}>💒</div>
            <h3 style={styles.benefitTitle}>Evangeliza e Une</h3>
            <p style={styles.benefitText}>
              Ferramenta de retenção de fé que reúne famílias, fortalece comunidade e mantém viva a tradição cristã
            </p>
          </div>

          <div style={styles.benefitCard}>
            <div style={styles.benefitIcon}>🎊</div>
            <h3 style={styles.benefitTitle}>Diversão para Todos</h3>
            <p style={styles.benefitText}>
              Eventos que unem gerações: avós, pais, filhos e netos, todos juntos!
            </p>
          </div>

          <div style={styles.benefitCard}>
            <div style={styles.benefitIcon}>⛪</div>
            <h3 style={styles.benefitTitle}>Ajuda Real</h3>
            <p style={styles.benefitText}>
              Cada cartela apoia projetos da sua paróquia: reformas, eventos, ações sociais
            </p>
          </div>

          <div style={styles.benefitCard}>
            <div style={styles.benefitIcon}>🏆</div>
            <h3 style={styles.benefitTitle}>Prêmios Incríveis</h3>
            <p style={styles.benefitText}>
              Concorra a prêmios enquanto apoia sua comunidade. Todo mundo ganha!
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO: Como Funciona */}
      <div style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>📋 Como Participar</h2>
        
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Cadastre-se</h3>
            <p style={styles.stepText}>Simples e rápido, em menos de 2 minutos</p>
          </div>

          <div style={styles.stepArrow}>→</div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Escolha sua Cartela</h3>
            <p style={styles.stepText}>Várias opções de jogos disponíveis</p>
          </div>

          <div style={styles.stepArrow}>→</div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Participe do Sorteio</h3>
            <p style={styles.stepText}>Acompanhe ao vivo com a comunidade</p>
          </div>

          <div style={styles.stepArrow}>→</div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>4</div>
            <h3 style={styles.stepTitle}>Ganhe e Ajude!</h3>
            <p style={styles.stepText}>Prêmios para você, recursos para a paróquia</p>
          </div>
        </div>

        <div style={styles.ctaContainer}>
          {!shouldBlockPublicHome && (
            <button 
              onClick={() => navigate('/signup')} 
              style={styles.ctaButton}
            >
              Começar Agora - É Grátis! 🎉
            </button>
          )}
        </div>
      </div>

      {/* SEÇÃO: Depoimentos */}
      <div style={styles.testimonialsSection}>
        <h2 style={styles.sectionTitle}>💬 O que nossa comunidade diz</h2>
        
        <div style={styles.testimonialsGrid}>
          <div style={styles.testimonialCard}>
            <p style={styles.testimonialText}>
              "Participar do bingo da paróquia virou tradição na nossa família. 
              É um momento de união e ainda ajudamos nas obras da igreja!"
            </p>
            <p style={styles.testimonialAuthor}>— Maria Silva, Paroquiana há 15 anos</p>
          </div>

          <div style={styles.testimonialCard}>
            <p style={styles.testimonialText}>
              "Conheci pessoas maravilhosas nos eventos. Agora temos um grupo 
              de amigos que se encontra toda semana!"
            </p>
            <p style={styles.testimonialAuthor}>— João Santos, Novo na comunidade</p>
          </div>

          <div style={styles.testimonialCard}>
            <p style={styles.testimonialText}>
              "É emocionante ver a paróquia crescer com a ajuda de todos. 
              Cada bingo é uma celebração da nossa fé e união."
            </p>
            <p style={styles.testimonialAuthor}>— Padre Roberto, Pároco</p>
          </div>
        </div>
      </div>

      {/* RODAPÉ: Segurança (discreto) */}
      <div style={styles.securityFooter}>
        <div style={styles.securityContent}>
          <h3 style={styles.securityTitle}>🔒 Ambiente Seguro e Confiável</h3>
          <div style={styles.securityBadges}>
            <span style={styles.badge}>✓ Transações Protegidas</span>
            <span style={styles.badge}>✓ Dados Criptografados</span>
            <span style={styles.badge}>✓ Transparência Total</span>
            <span style={styles.badge}>✓ Suporte Dedicado</span>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          💙 Feito com amor para nossa comunidade
        </p>
        <p style={styles.footerSubtext}>
          © 2026 Bingo da Comunidade - Unindo famílias, fortalecendo paróquias
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  
  // HERO SECTION
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '100px 20px 80px',
    textAlign: 'center' as const,
    color: 'white',
  },
  mainTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '1.2',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
  },
  heroSubtitle: {
    fontSize: '22px',
    marginBottom: '40px',
    opacity: 0.95,
    maxWidth: '800px',
    margin: '0 auto 40px',
    lineHeight: '1.5',
  },
  heroButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  maintenanceBox: {
    background: 'rgba(255, 243, 205, 0.95)',
    border: '2px solid #ffc107',
    color: '#856404',
    borderRadius: '14px',
    padding: '14px 20px',
    fontWeight: 'bold',
    maxWidth: '680px',
  },
  primaryButton: {
    padding: '18px 45px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#667eea',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    transition: 'all 0.3s',
  },
  secondaryButton: {
    padding: '18px 45px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'transparent',
    border: '3px solid white',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },

  // COMMUNITY SECTION
  communitySection: {
    padding: '80px 20px',
    backgroundColor: 'white',
  },
  sectionTitle: {
    textAlign: 'center' as const,
    fontSize: '36px',
    color: '#333',
    marginBottom: '60px',
    fontWeight: 'bold',
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  benefitCard: {
    textAlign: 'center' as const,
    padding: '30px',
  },
  benefitIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  benefitTitle: {
    fontSize: '24px',
    color: '#667eea',
    marginBottom: '15px',
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.8',
  },

  // HOW IT WORKS
  howItWorksSection: {
    padding: '80px 20px',
    backgroundColor: '#f8f9fa',
  },
  stepsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto 60px',
  },
  step: {
    textAlign: 'center' as const,
    maxWidth: '200px',
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    fontSize: '28px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 15px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
  },
  stepTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: '14px',
    color: '#666',
  },
  stepArrow: {
    fontSize: '32px',
    color: '#667eea',
    fontWeight: 'bold',
  },
  ctaContainer: {
    textAlign: 'center' as const,
  },
  ctaButton: {
    padding: '20px 60px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s',
  },

  // TESTIMONIALS
  testimonialsSection: {
    padding: '80px 20px',
    backgroundColor: 'white',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  testimonialCard: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '15px',
    borderLeft: '5px solid #667eea',
  },
  testimonialText: {
    fontSize: '16px',
    color: '#333',
    fontStyle: 'italic',
    lineHeight: '1.8',
    marginBottom: '15px',
  },
  testimonialAuthor: {
    fontSize: '14px',
    color: '#667eea',
    fontWeight: 'bold',
  },

  // SECURITY FOOTER
  securityFooter: {
    backgroundColor: '#2d3748',
    padding: '40px 20px',
    color: 'white',
  },
  securityContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  securityTitle: {
    fontSize: '20px',
    marginBottom: '20px',
    opacity: 0.9,
  },
  securityBadges: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  badge: {
    padding: '8px 20px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '20px',
    fontSize: '14px',
  },

  // FOOTER
  footer: {
    textAlign: 'center' as const,
    padding: '30px 20px',
    backgroundColor: '#1a202c',
    color: 'white',
  },
  footerText: {
    fontSize: '18px',
    marginBottom: '10px',
  },
  footerSubtext: {
    fontSize: '14px',
    opacity: 0.7,
  },
}
