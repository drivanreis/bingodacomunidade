import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    !token ? 'error' : 'loading'
  );
  const [message, setMessage] = useState(
    !token ? 'Token de verificação não encontrado.' : 'Verificando seu email...'
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Email verificado com sucesso! Sua conta foi ativada.');
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch {
        setStatus('error');
        setMessage('Falha ao verificar email. O link pode ter expirado ou é inválido.');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'loading' ? '⏳ Verificando...' : 
             status === 'success' ? '✅ Sucesso!' : '❌ Erro'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {status === 'success' && (
            <div className="text-center">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Ir para o login agora &rarr;
              </Link>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center">
              <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                Voltar para a página inicial
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
