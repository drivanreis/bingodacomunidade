import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ADMIN_PATH_PREFIX = '/admin-site';
const OFFLINE_TIMEOUT_MS = 5000;

const clearCookies = () => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
    document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
};

const clearAllStorage = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    clearCookies();
  } catch {
    // no-op
  }
};

const AdminSiteSecurityGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const offlineTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const isAdminSite = location.pathname.startsWith(ADMIN_PATH_PREFIX);
    if (!isAdminSite) {
      return;
    }

    const handleBeforeUnload = () => {
      clearAllStorage();
    };

    const handleOffline = () => {
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
      }
      offlineTimerRef.current = window.setTimeout(() => {
        clearAllStorage();
        navigate('/admin-site/login', { replace: true });
      }, OFFLINE_TIMEOUT_MS);
    };

    const handleOnline = () => {
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (offlineTimerRef.current) {
        window.clearTimeout(offlineTimerRef.current);
      }
    };
  }, [location.pathname, navigate]);

  return null;
};

export default AdminSiteSecurityGuard;
