import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InactivityWarning } from './components/InactivityWarning';
import { FirstAccessChecker } from './components/FirstAccessChecker';
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

// Páginas de Gerenciamento Admin
import ParishManagement from './pages/ParishManagement';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import SystemSettings from './pages/SystemSettings';
import AuditLog from './pages/AuditLog';
import FeedbackSystem from './pages/FeedbackSystem';
import SendFeedback from './pages/SendFeedback';

import Home from './pages/Home';
import Games from './pages/Games';
import NewGame from './pages/NewGame';
import GameDetail from './pages/GameDetail';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import { SuperAdminRoute, ParishAdminRoute } from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
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
          <Route path="/admin-site/login" element={<AdminSiteLogin />} />
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
          <Route path="/admin-paroquia/login" element={<AdminParoquiaLogin />} />
          <Route
            path="/admin-paroquia/dashboard"
            element={
              <ParishAdminRoute>
                <AdminParoquiaDashboard />
              </ParishAdminRoute>
            }
          />
          
          {/* Rotas Protegidas - Área Pública (FIELs) */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <PrivateRoute>
                <SendFeedback />
              </PrivateRoute>
            }
          />
          <Route
            path="/games"
            element={
              <PrivateRoute>
                <Games />
              </PrivateRoute>
            }
          />
          <Route
            path="/games/new"
            element={
              <PrivateRoute>
                <NewGame />
              </PrivateRoute>
            }
          />
          <Route
            path="/games/:id"
            element={
              <PrivateRoute>
                <GameDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

