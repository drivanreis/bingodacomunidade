import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { resolveDashboardPath, resolveGamesPath } from '../utils/sessionScope';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!user) return null;
  const normalizedRole = String(user.role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const effectiveRole = ['fiel', 'usuario_comum'].includes(normalizedRole) ? 'faithful' : normalizedRole;

  const dashboardPath = resolveDashboardPath(user.role);
  const gamesPath = resolveGamesPath(user.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: dashboardPath, label: '🏠 Dashboard', roles: ['super_admin', 'parish_admin', 'faithful'] },
    { path: gamesPath, label: '🎉 Jogos', roles: ['super_admin', 'parish_admin', 'faithful'] },
    { path: '/minhas-cartelas', label: '🎟️ Minhas Cartelas', roles: ['faithful'] },
    { path: '/profile', label: '👤 Perfil', roles: ['super_admin', 'parish_admin', 'faithful'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(effectiveRole));

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.brand} onClick={() => navigate(dashboardPath)}>
          🎉 Bingo da Comunidade
        </div>

        {/* Desktop Menu */}
        <div style={{...styles.desktopMenu, display: isMobile ? 'none' : 'flex'}}>
          {filteredItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navButton,
                ...(isActive(item.path) ? styles.navButtonActive : {}),
              }}
            >
              {item.label}
            </button>
          ))}
          <button onClick={handleLogout} style={styles.logoutButton}>
            🚪 Sair
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          style={{...styles.mobileMenuButton, display: isMobile ? 'block' : 'none'}}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && isMobile && (
        <div style={{...styles.mobileMenu, display: 'flex'}}>
          {filteredItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMenuOpen(false);
              }}
              style={{
                ...styles.mobileNavButton,
                ...(isActive(item.path) ? styles.mobileNavButtonActive : {}),
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            style={styles.mobileLogoutButton}
          >
            🚪 Sair
          </button>
        </div>
      )}
    </nav>
  );
};

const styles = {
  navbar: {
    background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  desktopMenu: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  navButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  logoutButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    background: '#F44336',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginLeft: '10px',
  },
  mobileMenuButton: {
    display: 'none',
    padding: '10px 15px',
    fontSize: '24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#333',
  },
  mobileMenu: {
    flexDirection: 'column' as const,
    gap: '5px',
    padding: '10px 20px',
    borderTop: '1px solid #e0e0e0',
  },
  mobileNavButton: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  mobileNavButtonActive: {
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  mobileLogoutButton: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    background: '#F44336',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    marginTop: '5px',
  },
};

export default Navbar;
