import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: '🏠 Dashboard', roles: ['super_admin', 'parish_admin', 'faithful'] },
    { path: '/games', label: '🎉 Jogos', roles: ['super_admin', 'parish_admin', 'faithful'] },
    { path: '/profile', label: '👤 Perfil', roles: ['super_admin', 'parish_admin', 'faithful'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.brand} onClick={() => navigate('/dashboard')}>
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
