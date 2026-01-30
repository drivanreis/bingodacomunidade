import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Log para debug
console.log('🚀 main.tsx carregado!');

const rootElement = document.getElementById('root');
console.log('📦 Root element:', rootElement);

if (!rootElement) {
  document.body.innerHTML = '<h1 style="color:red;padding:50px;">ERRO: Elemento root não encontrado!</h1>';
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('✅ App renderizado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao renderizar:', error);
  document.body.innerHTML = `<h1 style="color:red;padding:50px;">ERRO: ${error}</h1>`;
}

