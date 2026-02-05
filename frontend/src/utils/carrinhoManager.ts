/**
 * Gerenciador de Carrinho de Cartelas
 * 
 * Analogia com Leilão: Quando o martelo bate, acabou para todos!
 * 
 * Regras:
 * 1. Cartelas PAGAS → Salvam no banco de dados
 * 2. Cartelas NÃO PAGAS de jogos futuros → Ficam no localStorage
 * 3. Cartelas de jogos que JÁ INICIARAM → Limpas automaticamente
 * 4. Cartelas de jogos FINALIZADOS → Limpas automaticamente
 * 5. Cartelas não pagas expiram após 30 minutos no carrinho
 */

import { getAppConfigSync } from '../services/configService';

export interface CartelaCarrinho {
  id: string;
  jogoId: number;
  jogoNome: string;
  jogoStatus: 'scheduled' | 'active' | 'finished';
  jogoDataInicio: string;
  numeroCartela: number;
  valor: number;
  adicionadoEm: string; // ISO timestamp
  expiraEm: string; // ISO timestamp
}

export interface Carrinho {
  itens: CartelaCarrinho[];
  ultimaAtualizacao: string;
}

const CARRINHO_KEY = '@BingoComunidade:carrinho';

/**
 * Obter carrinho do localStorage
 */
export const getCarrinho = (): Carrinho => {
  try {
    const stored = localStorage.getItem(CARRINHO_KEY);
    if (!stored) {
      return { itens: [], ultimaAtualizacao: new Date().toISOString() };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('❌ Erro ao carregar carrinho:', error);
    return { itens: [], ultimaAtualizacao: new Date().toISOString() };
  }
};

/**
 * Salvar carrinho no localStorage
 */
export const salvarCarrinho = (carrinho: Carrinho): void => {
  try {
    carrinho.ultimaAtualizacao = new Date().toISOString();
    localStorage.setItem(CARRINHO_KEY, JSON.stringify(carrinho));
  } catch (error) {
    console.error('❌ Erro ao salvar carrinho:', error);
  }
};

/**
 * Adicionar cartela ao carrinho
 */
export const adicionarAoCarrinho = (cartela: Omit<CartelaCarrinho, 'id' | 'adicionadoEm' | 'expiraEm'>): void => {
  const config = getAppConfigSync();
  const carrinho = getCarrinho();
  
  const agora = new Date();
  const expiracao = new Date(agora.getTime() + config.cartExpirationMinutes * 60 * 1000);

  const novaCartela: CartelaCarrinho = {
    ...cartela,
    id: `${cartela.jogoId}-${cartela.numeroCartela}-${Date.now()}`,
    adicionadoEm: agora.toISOString(),
    expiraEm: expiracao.toISOString(),
  };

  carrinho.itens.push(novaCartela);
  salvarCarrinho(carrinho);
};

/**
 * Remover cartela do carrinho
 */
export const removerDoCarrinho = (cartelaId: string): void => {
  const carrinho = getCarrinho();
  carrinho.itens = carrinho.itens.filter((item) => item.id !== cartelaId);
  salvarCarrinho(carrinho);
};

/**
 * Limpar carrinho inteiro
 */
export const limparCarrinho = (): void => {
  const carrinhoVazio: Carrinho = {
    itens: [],
    ultimaAtualizacao: new Date().toISOString(),
  };
  salvarCarrinho(carrinhoVazio);
};

/**
 * Limpar itens expirados do carrinho
 * 
 * Remove:
 * 1. Cartelas que passaram do tempo limite (30 min por padrão)
 * 2. Cartelas de jogos que já iniciaram (se autoCleanExpiredCarts = true)
 * 3. Cartelas de jogos finalizados (se autoCleanFinishedGameCarts = true)
 */
export const limparItensExpirados = (): void => {
  const config = getAppConfigSync();
  const carrinho = getCarrinho();
  const agora = new Date();

  const itensValidos = carrinho.itens.filter((item) => {
    // 1. Verificar se expirou por tempo
    const expirou = new Date(item.expiraEm) < agora;
    if (expirou) {
      console.log(`🧹 Removendo cartela expirada: ${item.jogoNome} - Cartela ${item.numeroCartela}`);
      return false;
    }

    // 2. Verificar se jogo já iniciou (LEILÃO: martelo bateu!)
    if (config.autoCleanExpiredCarts && item.jogoStatus === 'active') {
      console.log(`🔨 Removendo cartela de jogo que já iniciou: ${item.jogoNome}`);
      return false;
    }

    // 3. Verificar se jogo já finalizou
    if (config.autoCleanFinishedGameCarts && item.jogoStatus === 'finished') {
      console.log(`🏁 Removendo cartela de jogo finalizado: ${item.jogoNome}`);
      return false;
    }

    // 4. Verificar se data de início do jogo já passou
    const dataInicio = new Date(item.jogoDataInicio);
    if (dataInicio < agora) {
      console.log(`⏰ Removendo cartela de jogo que já deveria ter começado: ${item.jogoNome}`);
      return false;
    }

    return true;
  });

  // Salvar apenas itens válidos
  if (itensValidos.length !== carrinho.itens.length) {
    carrinho.itens = itensValidos;
    salvarCarrinho(carrinho);
    console.log(`✅ Carrinho limpo: ${carrinho.itens.length - itensValidos.length} itens removidos`);
  }
};

/**
 * Obter total do carrinho
 */
export const getTotalCarrinho = (): number => {
  const carrinho = getCarrinho();
  return carrinho.itens.reduce((total, item) => total + item.valor, 0);
};

/**
 * Obter quantidade de itens no carrinho
 */
export const getQuantidadeCarrinho = (): number => {
  const carrinho = getCarrinho();
  return carrinho.itens.length;
};

/**
 * Hook para usar no React
 * 
 * Uso:
 * ```tsx
 * import { useEffect } from 'react';
 * import { limparItensExpirados } from '../utils/carrinhoManager';
 * 
 * useEffect(() => {
 *   // Limpar ao carregar página
 *   limparItensExpirados();
 *   
 *   // Limpar a cada 1 minuto
 *   const interval = setInterval(limparItensExpirados, 60000);
 *   
 *   return () => clearInterval(interval);
 * }, []);
 * ```
 */
