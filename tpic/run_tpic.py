"""
===========================================================================
TPIC - Teste Prático de Integração Contínua
Orquestrador Principal
===========================================================================

Executa todos os fluxos de teste:
1. Setup (limpa, instala, inicia serviços)
2. Admin Site (Bootstrap)
3. Admin Paróquia (Bootstrap)
4. Usuário Comum (Cadastro, Login, Jogar)

Gera relatórios consolidados com análise visual do Claude.
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from colorama import Fore, Style

import config
from utils import Logger, run_script
from test_admin_site import test_admin_site_bootstrap, test_admin_site_login
from test_admin_paroquia import test_admin_paroquia_bootstrap, test_admin_paroquia_login, test_admin_paroquia_game_creation
from test_usuario_comum import test_usuario_cadastro, test_usuario_login, test_usuario_jogar_bingo, test_usuario_perfil

logger = Logger("run_tpic")

class TPICOrchestrator:
    """Orquestra a execução completa do TPIC"""
    
    def __init__(self):
        self.results = []
        self.start_time = datetime.now()
        self.execution_log = []
    
    async def setup_environment(self) -> bool:
        """
        Configura o ambiente executando scripts de setup
        
        Returns:
            True se bem-sucedido
        """
        logger.info("\n" + "=" * 70)
        logger.info("ETAPA 1: Configuração do Ambiente")
        logger.info("=" * 70)
        
        try:
            project_root = config.PROJECT_ROOT
            
            # Script de limpeza
            logger.info("Executando: limpa.sh")
            limpa_script = project_root / "limpa.sh"
            if limpa_script.exists():
                success, output = await run_script(limpa_script, timeout=60)
                if success:
                    logger.success("limpa.sh executado com sucesso")
                    self.execution_log.append("✓ limpa.sh")
                else:
                    logger.warning(f"limpa.sh retornou erro: {output[:200]}")
                    self.execution_log.append(f"⚠ limpa.sh: {output[:100]}")
            else:
                logger.warning("Script limpa.sh não encontrado")
            
            # Script de instalação
            logger.info("Executando: install.sh")
            install_script = project_root / "install.sh"
            if install_script.exists():
                success, output = await run_script(install_script, timeout=300)
                if success:
                    logger.success("install.sh executado com sucesso")
                    self.execution_log.append("✓ install.sh")
                else:
                    logger.warning(f"install.sh retornou erro")
                    self.execution_log.append("⚠ install.sh")
            else:
                logger.warning("Script install.sh não encontrado")
            
            # Script de inicialização
            logger.info("Executando: start.sh")
            start_script = project_root / "start.sh"
            if start_script.exists():
                success, output = await run_script(start_script, timeout=120)
                if success:
                    logger.success("start.sh executado com sucesso")
                    self.execution_log.append("✓ start.sh")
                    # Aguardar servidor ficar pronto
                    logger.info("Aguardando servidor ficar disponível...")
                    # Note: Implementar wait_for_service aqui se necessário
                    await asyncio.sleep(5)
                    return True
                else:
                    logger.error(f"start.sh falhou: {output[:200]}")
                    self.execution_log.append("✗ start.sh")
                    return False
            else:
                logger.warning("Script start.sh não encontrado")
                logger.warning("Continuando mesmo sem start.sh...")
                return True
        
        except Exception as e:
            logger.error(f"Erro na configuração do ambiente: {e}")
            self.execution_log.append(f"✗ Setup: {str(e)}")
            return False
    
    async def run_admin_site_tests(self) -> List[Dict[str, Any]]:
        """Executa testes do Admin Site"""
        logger.info("\n" + "=" * 70)
        logger.info("ETAPA 2: Testes Admin Site")
        logger.info("=" * 70)
        
        results = []
        
        try:
            # Teste 1: Bootstrap
            result1 = await test_admin_site_bootstrap()
            results.append({
                "name": "Admin Site - Bootstrap",
                "result": result1,
                "icon": "✓" if result1.get("success") else "✗"
            })
            
            # Teste 2: Login apenas
            result2 = await test_admin_site_login()
            results.append({
                "name": "Admin Site - Login",
                "result": result2,
                "icon": "✓" if result2.get("success") else "✗"
            })
            
            self.execution_log.append(f"Admin Site Tests: {sum(1 for r in results if r['result'].get('success'))}/{len(results)}")
        
        except Exception as e:
            logger.error(f"Erro nos testes Admin Site: {e}")
            self.execution_log.append(f"✗ Admin Site Tests: {str(e)}")
        
        return results
    
    async def run_admin_paroquia_tests(self) -> List[Dict[str, Any]]:
        """Executa testes do Admin Paróquia"""
        logger.info("\n" + "=" * 70)
        logger.info("ETAPA 3: Testes Admin Paróquia")
        logger.info("=" * 70)
        
        results = []
        
        try:
            # Teste 1: Bootstrap
            result1 = await test_admin_paroquia_bootstrap()
            results.append({
                "name": "Admin Paróquia - Bootstrap",
                "result": result1,
                "icon": "✓" if result1.get("success") else "✗"
            })
            
            # Teste 2: Login
            result2 = await test_admin_paroquia_login()
            results.append({
                "name": "Admin Paróquia - Login",
                "result": result2,
                "icon": "✓" if result2.get("success") else "✗"
            })
            
            # Teste 3: Criação de jogo
            result3 = await test_admin_paroquia_game_creation()
            results.append({
                "name": "Admin Paróquia - Criar Jogo",
                "result": result3,
                "icon": "✓" if result3.get("success") else "✗"
            })
            
            self.execution_log.append(f"Admin Paroquia Tests: {sum(1 for r in results if r['result'].get('success'))}/{len(results)}")
        
        except Exception as e:
            logger.error(f"Erro nos testes Admin Paróquia: {e}")
            self.execution_log.append(f"✗ Admin Paroquia Tests: {str(e)}")
        
        return results
    
    async def run_usuario_comum_tests(self) -> List[Dict[str, Any]]:
        """Executa testes do Usuário Comum"""
        logger.info("\n" + "=" * 70)
        logger.info("ETAPA 4: Testes Usuário Comum")
        logger.info("=" * 70)
        
        results = []
        
        try:
            # Teste 1: Cadastro
            result1 = await test_usuario_cadastro()
            results.append({
                "name": "Usuário Comum - Cadastro",
                "result": result1,
                "icon": "✓" if result1.get("success") else "✗"
            })
            
            # Teste 2: Login
            result2 = await test_usuario_login()
            results.append({
                "name": "Usuário Comum - Login",
                "result": result2,
                "icon": "✓" if result2.get("success") else "✗"
            })
            
            # Teste 3: Jogar
            result3 = await test_usuario_jogar_bingo()
            results.append({
                "name": "Usuário Comum - Jogar Bingo",
                "result": result3,
                "icon": "✓" if result3.get("success") else "✗"
            })
            
            # Teste 4: Perfil
            result4 = await test_usuario_perfil()
            results.append({
                "name": "Usuário Comum - Perfil",
                "result": result4,
                "icon": "✓" if result4.get("success") else "✗"
            })
            
            self.execution_log.append(f"Usuário Comum Tests: {sum(1 for r in results if r['result'].get('success'))}/{len(results)}")
        
        except Exception as e:
            logger.error(f"Erro nos testes Usuário Comum: {e}")
            self.execution_log.append(f"✗ Usuário Comum Tests: {str(e)}")
        
        return results
    
    def generate_summary_report(self, all_results: List[Dict[str, Any]]) -> str:
        """
        Gera relatório final consolidado
        
        Args:
            all_results: Todos os resultados dos testes
        
        Returns:
            String HTML do relatório
        """
        total_tests = len(all_results)
        successful_tests = sum(1 for r in all_results if r["result"].get("success"))
        duration = (datetime.now() - self.start_time).total_seconds()
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório TPIC - {datetime.now().strftime('%d/%m/%Y %H:%M')}</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                    color: #333;
                }}
                .container {{ 
                    max-width: 1200px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 12px; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    text-align: center;
                }}
                .header h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
                .header p {{ font-size: 1.1em; opacity: 0.9; }}
                .stats {{
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    padding: 30px 40px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e0e0e0;
                }}
                .stat-box {{
                    text-align: center;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }}
                .stat-box.success {{ border-left-color: #10b981; }}
                .stat-box.warning {{ border-left-color: #f59e0b; }}
                .stat-box number {{ 
                    font-size: 2em; 
                    font-weight: bold; 
                    display: block;
                    margin: 10px 0;
                }}
                .stat-box label {{ 
                    color: #666; 
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }}
                .content {{ padding: 40px; }}
                .test-category {{
                    margin-bottom: 40px;
                }}
                .test-category h2 {{
                    color: #667eea;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    font-size: 1.5em;
                }}
                .test-result {{
                    padding: 20px;
                    margin-bottom: 15px;
                    border-left: 4px solid #e0e0e0;
                    background: #f9f9f9;
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}
                .test-result.success {{
                    border-left-color: #10b981;
                    background: #f0fdf4;
                }}
                .test-result.fail {{
                    border-left-color: #ef4444;
                    background: #fef2f2;
                }}
                .test-name {{
                    font-weight: 600;
                    font-size: 1.1em;
                }}
                .test-status {{
                    font-weight: bold;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 0.9em;
                }}
                .test-status.success {{
                    background: #10b981;
                    color: white;
                }}
                .test-status.fail {{
                    background: #ef4444;
                    color: white;
                }}
                .footer {{
                    background: #f0f0f0;
                    padding: 30px 40px;
                    text-align: center;
                    color: #666;
                    border-top: 1px solid #e0e0e0;
                }}
                .footer strong {{ color: #333; }}
                .log-section {{
                    background: #272822;
                    color: #f8f8f2;
                    padding: 20px;
                    border-radius: 8px;
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 0.9em;
                    margin-top: 20px;
                    max-height: 300px;
                    overflow-y: auto;
                }}
                .log-item {{ margin: 5px 0; }}
                @media (max-width: 768px) {{
                    .stats {{ grid-template-columns: repeat(2, 1fr); }}
                    .test-result {{ flex-direction: column; align-items: flex-start; }}
                    .test-status {{ margin-top: 10px; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Relatório TPIC</h1>
                    <p>Teste Prático de Integração Contínua - Bingo da Comunidade</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">{datetime.now().strftime('%d de %B de %Y às %H:%M:%S')}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-box success">
                        <label>Total de Testes</label>
                        <number>{total_tests}</number>
                    </div>
                    <div class="stat-box success">
                        <label>Sucessos</label>
                        <number style="color: #10b981;">{successful_tests}</number>
                    </div>
                    <div class="stat-box warning">
                        <label>Falhas</label>
                        <number style="color: #ef4444;">{total_tests - successful_tests}</number>
                    </div>
                    <div class="stat-box">
                        <label>Taxa de Sucesso</label>
                        <number style="color: #667eea;">{(successful_tests/total_tests*100):.0f}%</number>
                    </div>
                </div>
                
                <div class="content">
        """
        
        # Agrupar resultados por categoria
        current_category = None
        for result in all_results:
            category = result["name"].split(" - ")[0]
            if category != current_category:
                if current_category:
                    html += "</div>"
                current_category = category
                html += f'<div class="test-category"><h2>{category}</h2>'
            
            status = "success" if result["result"].get("success") else "fail"
            status_text = "✓ Sucesso" if result["result"].get("success") else "✗ Falha"
            
            html += f"""
                    <div class="test-result {status}">
                        <span class="test-name">{result['name']}</span>
                        <span class="test-status {status}">{status_text}</span>
                    </div>
            """
        
        if current_category:
            html += "</div>"
        
        # Log de execução
        html += """
                    <div class="log-section">
                        <strong>Log de Execução:</strong><br>
        """
        for log_item in self.execution_log:
            html += f'<div class="log-item">{log_item}</div>'
        
        html += f"""
                    </div>
                </div>
                
                <div class="footer">
                    <p>Duração total: <strong>{duration:.0f}s</strong></p>
                    <p style="margin-top: 10px; font-size: 0.9em;">
                        Screenshots e análises detalhadas estão em: <code>{config.SCREENSHOTS_DIR}</code>
                    </p>
                    <p style="margin-top: 10px; font-size: 0.9em;">
                        Logs completos em: <code>{config.LOGS_DIR}</code>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    async def run(self):
        """Executa o TPIC completo"""
        logger.info("\n")
        print(f"{Fore.MAGENTA}{'=' * 70}")
        print(f"{Style.RESET_ALL}  TPIC - Teste Prático de Integração Contínua")
        print(f"  Bingo da Comunidade com Claude Haiku 4.5 + Playwright")
        print(f"{Fore.MAGENTA}{'=' * 70}{Style.RESET_ALL}\n")
        
        try:
            # Etapa 1: Setup
            setup_ok = await self.setup_environment()
            if not setup_ok:
                logger.warning("Setup incompleto, mas continuando com testes...")
            
            # Etapa 2-4: Testes
            all_results = []
            
            admin_site_results = await self.run_admin_site_tests()
            all_results.extend(admin_site_results)
            
            admin_paroquia_results = await self.run_admin_paroquia_tests()
            all_results.extend(admin_paroquia_results)
            
            usuario_comum_results = await self.run_usuario_comum_tests()
            all_results.extend(usuario_comum_results)
            
            # Gerar relatório consolidado
            logger.info("\n" + "=" * 70)
            logger.info("GERANDO RELATÓRIO FINAL")
            logger.info("=" * 70)
            
            report_html = self.generate_summary_report(all_results)
            report_file = config.REPORTS_DIR / f"tpic_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            report_file.write_text(report_html, encoding="utf-8")
            
            logger.success(f"Relatório gerado: {report_file}")
            
            # Resumo final no terminal
            successful = sum(1 for r in all_results if r["result"].get("success"))
            print(f"\n{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}✓ TPIC CONCLUÍDO{Style.RESET_ALL}")
            print(f"{Fore.CYAN}  Total: {len(all_results)} testes")
            print(f"{Fore.GREEN}  Sucesso: {successful}")
            print(f"{Fore.RED}  Falhas: {len(all_results) - successful}{Style.RESET_ALL}")
            print(f"{Fore.BLUE}  Relatório: {report_file}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}\n")
            
            return True
        
        except Exception as e:
            logger.error(f"Erro crítico na execução do TPIC: {e}")
            import traceback
            traceback.print_exc()
            return False


async def main():
    """Função principal"""
    orchestrator = TPICOrchestrator()
    success = await orchestrator.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
