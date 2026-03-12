"""
===========================================================================
TPIC - Fluxo 1: Admin do Site (Super Admin / Bootstrap)
===========================================================================

Este fluxo testa:
1. Acesso à página inicial
2. Navegação para /admin-site
3. Login como Admin/admin123
4. Confirmação do popup "mude sua senha"
5. Preenchimento do cadastro do 1º admin
6. Entrada no painel
"""

import asyncio
from pathlib import Path
from typing import Dict, Any
from browser import SmartTestAgent
from utils import Logger
import config

logger = Logger("test_admin_site")

async def test_admin_site_bootstrap() -> Dict[str, Any]:
    """
    Testa o bootstrap do primeiro admin do site
    
    Returns:
        Dict com resultado do teste
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Fluxo 1 - Admin do Site (Bootstrap)")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Você está testando o processo de bootstrap do administrativo do site (super admin).
    
    FLUXO ESPERADO:
    1. Página inicial carregada com sucesso
    2. Navega para /admin-site (deve redirecionar para /admin-site/login se não logado)
    3. Preenche login: email=Admin, senha=admin123
    4. Clica em "Entrar" ou botão de login
    5. Pode aparecer modal "Você precisa mudar sua senha" - confirmar
    6. Deve estar em /admin-site/first-access-setup
    7. Preenche formulário de cadastro do 1º admin do site:
       - Nome completo
       - Email
       - Telefone (opcional)
       - Paróquia (a paróquia raiz)
    8. Clica em "Continuar" ou "Próximo"
    9. Confirma que está no painel do admin-site
    
    IMPORTANTE:
    - Se houver erros de validação, identifique os campos
    - Se houver modals/popups, recomende confirmar ou fechar
    - Detecte qualquer comportamento inesperado
    - A próxima ação deve ser clara e executável com Playwright
    
    Retorne JSON com análise detalhada e próxima ação específica.
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=config.BASE_URL,
        flow_name="admin_site_bootstrap",
        max_steps=25,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    if result["success"]:
        logger.success(f"✓ Fluxo Admin Site completado!")
        logger.info(f"  Passos executados: {result['steps_executed']}")
        logger.info(f"  Relatório: {result['report_path']}")
    else:
        logger.error(f"✗ Fluxo Admin Site falhou: {result.get('error')}")
    logger.info("=" * 70)
    
    return result


async def test_admin_site_login() -> Dict[str, Any]:
    """
    Testa apenas o login no Admin Site
    """
    logger.info("=" * 70)
    logger.info("INICIANDO: Test Login - Admin Site")
    logger.info("=" * 70)
    
    agent = SmartTestAgent(headless=False)
    
    custom_instructions = """
    Teste simples de login no painel admin-site.
    
    FLUXO:
    1. Acessar /admin-site
    2. Ver formulário de login
    3. Preencher: email=Admin, password=admin123
    4. Clicar em "Entrar"
    5. Aguardar redirecionamento
    
    Detecte e reporte qualquer erro de autenticação.
    """
    
    result = await agent.execute_intelligent_flow(
        start_url=f"{config.BASE_URL}/admin-site",
        flow_name="admin_site_login_test",
        max_steps=10,
        custom_instructions=custom_instructions
    )
    
    logger.info("=" * 70)
    logger.success(f"Login test concluído") if result["success"] else logger.error("Login test falhou")
    logger.info("=" * 70)
    
    return result


async def main():
    """Executa todos os testes do Admin Site"""
    try:
        # Verificar se os serviços estão rodando
        logger.info("Verificando se o servidor está disponível...")
        # Note: Você precisará ter implementado a função wait_for_service
        # Para agora, vamos pular e ir direto aos testes
        
        # Executar testes
        results = []
        
        # Teste 1: Bootstrap completo
        result1 = await test_admin_site_bootstrap()
        results.append(result1)
        
        # Teste 2: Login apenas
        result2 = await test_admin_site_login()
        results.append(result2)
        
        # Resumo final
        logger.info("\n" + "=" * 70)
        logger.info("RESUMO DOS TESTES - ADMIN SITE")
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
