import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InactivityWarning } from './components/InactivityWarning';
import { FirstAccessChecker } from './components/FirstAccessChecker';
import AdminSiteSecurityGuard from './components/AdminSiteSecurityGuard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import FirstAccessSetup from './pages/FirstAccessSetup';
import Dashboard from './pages/Dashboard';

// Páginas Administrativas
import AdminSiteLogin from './pages/AdminSiteLogin';
import AdminSiteDashboard from './pages/AdminSiteDashboard';
import AdminParoquiaLogin from './pages/AdminParoquiaLogin';
import AdminParoquiaDashboard from './pages/AdminParoquiaDashboard';
import AdminInitialPasswordChange from './pages/AdminInitialPasswordChange';
import AdminParoquiaConfiguracoes from './pages/AdminParoquiaConfiguracoes';
import AdminParoquiaUsuarios from './pages/AdminParoquiaUsuarios';

// Páginas de Gerenciamento Admin
import ParishManagement from './pages/ParishManagement';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import SystemSettings from './pages/SystemSettings';
import AuditLog from './pages/AuditLog';
import FeedbackSystem from './pages/FeedbackSystem';
import SendFeedback from './pages/SendFeedback';
import AdminUsers from './pages/AdminUsers';

import Home from './pages/Home';
import Games from './pages/Games';
import NewGame from './pages/NewGame';
import GameDetail from './pages/GameDetail';
import Profile from './pages/Profile';
import MyCards from './pages/MyCards';
import { SuperAdminRoute, ParishAdminRoute, PublicUserRoute } from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AdminSiteSecurityGuard />
        <FirstAccessChecker />
        <InactivityWarning />
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Rotas Públicas */}
          <Route path="/first-access-setup" element={<FirstAccessSetup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Rotas Administrativas - SUPER_ADMIN */}
          <Route path="/admin-site" element={<Navigate to="/admin-site/login" replace />} />
          <Route path="/admin-site/login" element={<AdminSiteLogin />} />
          <Route path="/admin-site/primeira-senha" element={<AdminInitialPasswordChange mode="admin-site" />} />
          <Route
            path="/admin-site/dashboard"
            element={
              <SuperAdminRoute>
                <AdminSiteDashboard />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin-site/paroquias"
            element={
              <SuperAdminRoute>
                <ParishManagement />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin-site/usuarios"
            element={
              <SuperAdminRoute>
                <UserManagement />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin-site/admins"
            element={
              <SuperAdminRoute>
                <AdminUsers />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin-site/relatorios"
            element={
              <SuperAdminRoute>
                <Reports />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin-site/configuracoes"
            element={
              <SuperAdminRoute>
                <SystemSettings />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin-site/auditoria"
            element={
              <SuperAdminRoute>
                <AuditLog />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin-site/feedback"
            element={
              <SuperAdminRoute>
                <FeedbackSystem />
              </SuperAdminRoute>
            }
          />
          
          {/* Rotas Administrativas - PARÓQUIA */}
          <Route path="/admin-paroquia" element={<Navigate to="/admin-paroquia/login" replace />} />
          <Route path="/admin-paroquia/login" element={<AdminParoquiaLogin />} />
          <Route path="/admin-paroquia/primeira-senha" element={<AdminInitialPasswordChange mode="admin-paroquia" />} />
          <Route
            path="/admin-paroquia/dashboard"
            element={
              <ParishAdminRoute>
                <AdminParoquiaDashboard />
              </ParishAdminRoute>
            }
          />
          <Route
            path="/admin-paroquia/games"
            element={
              <ParishAdminRoute>
                <Games />
              </ParishAdminRoute>
            }
          />
          <Route
            path="/admin-paroquia/games/:id"
            element={
              <ParishAdminRoute>
                <GameDetail />
              </ParishAdminRoute>
            }
          />
          <Route
            path="/admin-paroquia/games/new"
            element={
              <ParishAdminRoute>
                <NewGame />
              </ParishAdminRoute>
            }
          />
          <Route
            path="/admin-paroquia/configuracoes"
            element={
              <ParishAdminRoute>
                <AdminParoquiaConfiguracoes />
              </ParishAdminRoute>
            }
          />
          <Route
            path="/admin-paroquia/usuarios"
            element={
              <ParishAdminRoute>
                <AdminParoquiaUsuarios />
              </ParishAdminRoute>
            }
          />
          
          {/* Rotas Protegidas - Área Pública (FIELs) */}
          <Route
            path="/dashboard"
            element={
              <PublicUserRoute>
                <Dashboard />
              </PublicUserRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <PublicUserRoute>
                <SendFeedback />
              </PublicUserRoute>
            }
          />
          <Route
            path="/games"
            element={
              <PublicUserRoute>
                <Games />
              </PublicUserRoute>
            }
          />
          <Route path="/games/new" element={<Navigate to="/" replace />} />
          <Route
            path="/games/:id"
            element={
              <PublicUserRoute>
                <GameDetail />
              </PublicUserRoute>
            }
          />
          <Route
            path="/minhas-cartelas"
            element={
              <PublicUserRoute>
                <MyCards />
              </PublicUserRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PublicUserRoute>
                <Profile />
              </PublicUserRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
