import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminIdentityHeaderProps {
  title: string;
  backTo: string;
  rightContent?: React.ReactNode;
  subtitle?: string;
}

interface StoredUser {
  nome?: string;
  login?: string;
  email?: string;
}

const AdminIdentityHeader: React.FC<AdminIdentityHeaderProps> = ({ title, backTo, rightContent, subtitle }) => {
  const navigate = useNavigate();

  let user: StoredUser = {};
  try {
    user = JSON.parse(localStorage.getItem('@BingoComunidade:user') || '{}') as StoredUser;
  } catch {
    user = {};
  }

  const displayName = user.nome || user.login || user.email || 'Usuário';
  const displayLogin = user.login || user.email || '-';

  return (
    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <button
          className="btn btn-outline-secondary me-2"
          onClick={() => navigate(backTo)}
        >
          ← Voltar
        </button>
        <h2 className="d-inline-block mb-0">{title}</h2>
        {subtitle && <p className="text-muted mb-0 mt-1">{subtitle}</p>}
      </div>

      <div className="d-flex align-items-center gap-3 ms-auto">
        {rightContent}
        <div className="text-end">
          <div className="fw-bold">{displayName}</div>
          <small className="text-muted">{displayLogin}</small>
        </div>
      </div>
    </div>
  );
};

export default AdminIdentityHeader;
