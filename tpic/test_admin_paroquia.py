"""
===========================================================================
TPIC - Fluxo 2: Admin da Paróquia
===========================================================================

Este fluxo testa:
1. Logout (se necessário)
2. Acesso a /admin-paroquia
3. Login como admin da paróquia
4. Cadastro do 1º admin da paróquia
5. Acesso ao painel
"""

import asyncio
from pathlib import Path
from typing import Dict, Any
from browser import SmartTestAgent
from utils import Logger
import config

logger = Logger("test_admin_paroquia")

async def test_admin_paroquia_bootstrap() -> Dict[str, Any]:
    """
    Testa o bootstrap do primeiro admin da paróquia
    
    Returns:
        Dict com resultado do teste
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Fluxo 2 - Admin da Paróquia (Bootstrap)")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Você está testando o processo de bootstrap do administrativo de paróquia.
    
    FLUXO ESPERADO:
    1. Acessa /admin-paroquia (deve redirecionar para /admin-paroquia/login se não logado)
    2. Vê formulário de login ou seleção de paróquia
    3. Se houver seleção de paróquia:
       - Seleciona a paróquia (provavelmente a padrão/única criada)
       - Preenche credenciais
    4. Preenche login: email do admin da paróquia, senha
    5. Pode aparecer modal de confirmação ou mudança de senha - confirmar/mudar conforme necessário
    6. Deve estar em /admin-paroquia/dashboard ou /admin-paroquia/first-access-setup
    7. Se em first-access-setup, preenche:
       - Nome completo do admin
       - Email
       - Telefone
       - Confirmação de dados
    8. Entra no painel do admin-paroquia
    
    IMPORTANTE:
    - Admin da paróquia é diferente do Admin do Site
    - Pode haver mais de uma paróquia no sistema
    - Detecte claramente a paróquia selecionada
    - Reporte qualquer erro de seleção ou autenticação
    
    Retorne JSON com análise detalhada.
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=f"{config.BASE_URL}/admin-paroquia",
        flow_name="admin_paroquia_bootstrap",
        max_steps=25,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    if result["success"]:
        logger.success(f"✓ Fluxo Admin Paróquia completado!")
        logger.info(f"  Passos executados: {result['steps_executed']}")
        logger.info(f"  Relatório: {result['report_path']}")
    else:
        logger.error(f"✗ Fluxo Admin Paróquia falhou: {result.get('error')}")
    logger.info("=" * 70)
    
    return result


async def test_admin_paroquia_login() -> Dict[str, Any]:
    """
    Testa apenas o login no painel Admin da Paróquia
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Test Login - Admin Paróquia")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Teste simples de login no painel admin-paroquia.
    
    FLUXO:
    1. Acessa /admin-paroquia
    2. Se houver seleção de paróquia, seleciona
    3. Vê formulário de login
    4. Preenche credenciais válidas
    5. Clica em "Entrar" ou "Confirmar"
    6. Aguarda redirecionamento para dashboard
    
    Detecte:
    - Qual paróquia foi selecionada
    - Se o login foi bem-sucedido
    - Qualquer erro na autenticação
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=f"{config.BASE_URL}/admin-paroquia",
        flow_name="admin_paroquia_login_test",
        max_steps=10,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    logger.success(f"Login test concluído") if result["success"] else logger.error("Login test falhou")
    logger.info("=" * 70)
    
    return result


async def test_admin_paroquia_game_creation() -> Dict[str, Any]:
    """
    Testa a criação de um novo jogo/partida no painel da paróquia
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Test Game Creation - Admin Paróquia")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Teste de criação de novo jogo/partida no painel admin-paroquia.
    
    FLUXO ESPERADO:
    1. Estar logado no painel admin-paroquia
    2. Navega para "Jogos" ou "Partidas"
    3. Clica em "Novo Jogo", "Criar Partida" ou similar
    4. Vê formulário de criação
    5. Preenche:
       - Nome do jogo
       - Descrição (opcional)
       - Data/hora (se necessário)
       - Número de cartelas
       - Outros campos visíveis
    6. Clica em "Criar" ou "Salvar"
    7. Confirma sucesso na página de jogos
    
    IMPORTANTE:
    - Detecte claramente qual é o novo jogo criado
    - Verifique se as cartelas foram geradas
    - Reporte qualquer erro na criação
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=f"{config.BASE_URL}/admin-paroquia/games",
        flow_name="admin_paroquia_game_creation",
        max_steps=20,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    if result["success"]:
        logger.success(f"✓ Game creation test completado!")
    else:
        logger.error(f"✗ Game creation test falhou: {result.get('error')}")
    logger.info("=" * 70)
    
    return result


async def main():
    """Executa todos os testes do Admin Paróquia"""
    try:
        logger.info("Verificando se o servidor está disponível...")
        
        results = []
        
        # Teste 1: Bootstrap completo
        result1 = await test_admin_paroquia_bootstrap()
        results.append(result1)
        
        # Teste 2: Login apenas
        result2 = await test_admin_paroquia_login()
        results.append(result2)
        
        # Teste 3: Criação de jogo
        result3 = await test_admin_paroquia_game_creation()
        results.append(result3)
        
        # Resumo final
        logger.info("\n" + "=" * 70)
        logger.info("RESUMO DOS TESTES - ADMIN PAROQUIA")
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
