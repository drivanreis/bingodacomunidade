"""
===========================================================================
TPIC - Fluxo 3: Usuário Comum (Fiel)
===========================================================================

Este fluxo testa:
1. Acesso à página inicial (home)
2. Cadastro de novo usuário
3. Verificação de email
4. Login como usuário comum
5. Acesso ao painel do usuário
"""

import asyncio
from pathlib import Path
from typing import Dict, Any
from browser import SmartTestAgent
from utils import Logger
import config

logger = Logger("test_usuario_comum")

async def test_usuario_cadastro() -> Dict[str, Any]:
    """
    Testa o cadastro de um novo usuário comum
    
    Returns:
        Dict com resultado do teste
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Fluxo 3 - Cadastro Usuário Comum")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Você está testando o processo de cadastro de um usuário comum (fiel).
    
    FLUXO ESPERADO:
    1. Página inicial carregada (/)
    2. Procura por opção "Cadastro", "Registrar" ou "Criar Conta"
    3. Clica para abrir formulário de cadastro
    4. Preenche:
       - Nome completo
       - Email (novo, não existente)
       - Senha (com requisitos: maiúscula, minúscula, número, caractere especial, mínimo 8 caracteres)
       - Confirmação de senha
       - Termo de aceitar (se houver)
       - CAPTCHA (se houver)
    5. Clica em "Cadastrar" ou "Registrar"
    6. Pode receber mensagem pedindo confirmação de email
    7. Pode:
       - Redirecionar para página de verificação de email
       - Mostrar mensagem de sucesso
       - Enviar email de confirmação
    
    IMPORTANTE:
    - Use um email único (ex: usuario_TIMESTAMP@test.com)
    - Siga os requisitos de senha exatamente
    - Detecte claramente se o cadastro foi bem-sucedido
    - Se houver erros de validação, identifique-os
    - Não é necessário confirmar email neste fluxo, mas detecte se foi pedido
    
    Retorne JSON com análise e próxima ação.
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=config.BASE_URL,
        flow_name="usuario_comum_cadastro",
        max_steps=20,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    if result["success"]:
        logger.success(f"✓ Fluxo Cadastro Usuário completado!")
        logger.info(f"  Passos executados: {result['steps_executed']}")
        logger.info(f"  Relatório: {result['report_path']}")
    else:
        logger.error(f"✗ Fluxo Cadastro Usuário falhou: {result.get('error')}")
    logger.info("=" * 70)
    
    return result


async def test_usuario_login() -> Dict[str, Any]:
    """
    Testa o login de um usuário comum
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Test Login - Usuário Comum")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Teste simples de login para usuário comum.
    
    FLUXO:
    1. Acessa página inicial (/)
    2. Procura por opção de login ou "Entrar"
    3. Clica para abrir formulário de login
    4. Vê campos de email e senha
    5. Preenche credenciais válidas
    6. Clica em "Entrar" ou "Acessar"
    7. Aguarda redirecionamento
    
    IMPORTANTE:
    - Use credenciais que já foram cadastradas no sistema
    - Detecte se o login foi bem-sucedido
    - Reporte qualquer erro de autenticação
    - Verifique se redirecionou para o dashboard do usuário
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=config.BASE_URL,
        flow_name="usuario_comum_login",
        max_steps=10,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    logger.success(f"Login test concluído") if result["success"] else logger.error("Login test falhou")
    logger.info("=" * 70)
    
    return result


async def test_usuario_jogar_bingo() -> Dict[str, Any]:
    """
    Testa o fluxo de jogar bingo como usuário comum
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Test Jogar Bingo - Usuário Comum")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Teste de jogo de bingo como usuário comum.
    
    FLUXO ESPERADO:
    1. Estar logado como usuário comum
    2. Navega para "Jogos" ou "Partidas Disponíveis"
    3. Vê lista de jogos/partidas em andamento ou próximas
    4. Clica em uma partida para participar
    5. Vê suas cartelas para esse jogo
    6. Pode:
       - Visualizar cartela em grande
       - Marcar números conforme são sorteados
       - Ver placar/ranking
       - Verificar premio/resultado
    7. Testa marcar alguns números (se a partida permitir)
    
    IMPORTANTE:
    - Detecte o estado da partida (em andamento, não iniciada, finalizada)
    - Verifique se as cartelas estão sendo carregadas corretamente
    - Teste a interface de marcar números
    - Detecte qualquer erro na sincronização com servidor
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=f"{config.BASE_URL}/games",
        flow_name="usuario_comum_jogar",
        max_steps=15,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    if result["success"]:
        logger.success(f"✓ Game join test completado!")
    else:
        logger.error(f"✗ Game join test falhou: {result.get('error')}")
    logger.info("=" * 70)
    
    return result


async def test_usuario_perfil() -> Dict[str, Any]:
    """
    Testa a página de perfil do usuário comum
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Test Perfil - Usuário Comum")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Teste da página de perfil do usuário comum.
    
    FLUXO ESPERADO:
    1. Estar logado como usuário comum
    2. Acessa /profile ou clica em "Meu Perfil"
    3. Vê informações do usuário:
       - Nome completo
       - Email
       - Data de cadastro
       - Paróquia
       - Status
    4. Pode haver opções para:
       - Editar perfil
       - Mudar senha
       - Excluir conta
       - Gerenciar notificações
    5. Testa a edição de dados (se permitido)
    
    IMPORTANTE:
    - Verifique se os dados carregaram corretamente
    - Detecte se há campos de edição disponíveis
    - Reporte qualquer erro no carregamento
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=f"{config.BASE_URL}/profile",
        flow_name="usuario_comum_perfil",
        max_steps=10,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    if result["success"]:
        logger.success(f"✓ Profile test completado!")
    else:
        logger.error(f"✗ Profile test falhou: {result.get('error')}")
    logger.info("=" * 70)
    
    return result


async def main():
    """Executa todos os testes de usuário comum"""
    try:
        logger.info("Verificando se o servidor está disponível...")
        
        results = []
        
        # Teste 1: Cadastro
        result1 = await test_usuario_cadastro()
        results.append(result1)
        
        # Teste 2: Login
        result2 = await test_usuario_login()
        results.append(result2)
        
        # Teste 3: Jogar
        result3 = await test_usuario_jogar_bingo()
        results.append(result3)
        
        # Teste 4: Perfil
        result4 = await test_usuario_perfil()
        results.append(result4)
        
        # Resumo final
        logger.info("\n" + "=" * 70)
        logger.info("RESUMO DOS TESTES - USUÁRIO COMUM")
        logger.info("=" * 70)
        
        successes = sum(1 for r in results if r.get("success"))
        logger.info(f"Total de fluxos: {len(results)}")
        logger.info(f"Fluxos com sucesso: {successes}")
        logger.info(f"Fluxos com falha: {len(results) - successes}")
        
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error(f"Erro na execução dos testes: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
