"""
===========================================================================
TPIC - Automação com Playwright + Análise Visual Groq
===========================================================================
SUPER RÁPIDO, GRÁTIS, SEM CARTÃO DE CRÉDITO!
"""

import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from groq_vision import GroqVisionAnalyzer
from utils import Logger, take_screenshot, wait_for_service
import config
import json

logger = Logger("playwright_automation")

class VisionTestFlow:
    """Compatibilidade com fluxo de testes visual"""
    
    def __init__(self):
        self.analysis_history = []
        logger.success("VisionTestFlow inicializado")
    
    def record_analysis(self, analysis: Dict[str, Any], screenshot_path: str):
        """Registra análise no histórico"""
        self.analysis_history.append({
            "timestamp": Path(screenshot_path).stem,
            "screenshot": str(screenshot_path),
            "analysis": analysis
        })
    
    def generate_report(self, output_file: Optional[Path] = None) -> str:
        """Gera relatório em HTML"""
        total = len(self.analysis_history)
        errors = sum(1 for a in self.analysis_history if a["analysis"].get("errors"))
        
        html = f"""<html><head><meta charset="UTF-8"><title>Relatório TPIC</title>
<style>
body {{ font-family: Arial; margin: 20px; background: #f5f5f5; }}
.container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; }}
h1 {{ color: #333; border-bottom: 3px solid #007bff; }}
.stat {{ display: inline-block; margin: 10px 20px 10px 0; }}
.analysis {{ margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #007bff; }}
</style></head><body>
<div class="container">
<h1>📊 Relatório de Testes TPIC - Groq</h1>
<div class="stat"><strong>Total:</strong> {total}</div>
<div class="stat"><strong>Erros:</strong> {errors}</div>
<h2>Análises</h2>
"""
        
        for entry in self.analysis_history:
            analysis = entry["analysis"]
            html += f"""<div class="analysis">
<h3>{entry['timestamp']}</h3>
<p><strong>Página:</strong> {analysis.get('current_page', 'desconhecida')}</p>
<p><strong>Carregada:</strong> {'✓' if analysis.get('page_loaded') else '✗'}</p>
</div>"""
        
        html += "</div></body></html>"
        
        if output_file:
            output_file.write_text(html, encoding="utf-8")
            logger.success(f"Relatório gerado: {output_file}")
        
        return html

class PlaywrightBrowser:
    """
    Gerenciador de browser Playwright com integração Groq Vision
    """
    
    def __init__(self, headless: bool = False):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.vision_analyzer = GroqVisionAnalyzer()
        self.test_flow = VisionTestFlow()
    
    async def launch(self):
        """Inicia o browser"""
        try:
            logger.info("Iniciando Playwright...")
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(headless=self.headless)
            self.context = await self.browser.new_context(
                viewport=config.CONTEXT_CONFIG.get("viewport"),
                ignore_https_errors=True
            )
            self.page = await self.context.new_page()
            logger.success("Playwright iniciado com sucesso")
            return True
        except Exception as e:
            logger.error(f"Erro ao iniciar Playwright: {e}")
            return False
    
    async def close(self):
        """Fecha o browser"""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            logger.success("Playwright fechado")
        except Exception as e:
            logger.error(f"Erro ao fechar Playwright: {e}")
    
    async def goto(self, url: str, wait_until: str = "networkidle"):
        """
        Navega para uma URL
        
        Args:
            url: URL para navegar
            wait_until: 'load', 'domcontentloaded', 'networkidle'
        """
        try:
            logger.info(f"Navegando para: {url}")
            await self.page.goto(url, wait_until=wait_until, timeout=config.NAVIGATION_TIMEOUT)
            await asyncio.sleep(1)  # Esperar um pouco para renderização
            logger.success(f"Página carregada: {url}")
            return True
        except Exception as e:
            logger.error(f"Erro ao navegar para {url}: {e}")
            return False
    
    async def take_screenshot_and_analyze(
        self,
        step_name: str,
        context: str = "Teste",
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Captura screenshot e analisa com Claude imediatamente
        
        Args:
            step_name: Nome do passo (para nomear arquivo)
            context: Contexto do teste
            custom_prompt: Prompt customizado (opcional)
        
        Returns:
            Análise do Claude
        """
        try:
            # Capturar screenshot
            timestamp = datetime.now().strftime("%H%M%S")
            screenshot_name = f"{step_name}_{timestamp}"
            screenshot_path = config.SCREENSHOTS_DIR / f"{screenshot_name}.png"
            
            logger.info(f"Capturando screenshot: {screenshot_name}")
            await self.page.screenshot(path=str(screenshot_path))
            
            # Analisar com Claude
            logger.info("Analisando com Claude Haiku 4.5...")
            analysis = self.vision_analyzer.analyze_screenshot(
                screenshot_path,
                context=context,
                last_action=step_name,
                custom_prompt=custom_prompt
            )
            
            # Registrar no histórico
            self.test_flow.record_analysis(analysis, screenshot_path)
            
            return analysis
        except Exception as e:
            logger.error(f"Erro ao capturar e analisar screenshot: {e}")
            return {}
    
    async def fill_form(
        self,
        form_data: Dict[str, str],
        selectors: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Preenche um formulário com dados
        
        Args:
            form_data: Dicionário com pares chave-valor
            selectors: Dict mapeando chaves para seletores CSS (opcional)
        
        Returns:
            True se bem-sucedido
        """
        try:
            logger.info("Preenchendo formulário...")
            for field_name, field_value in form_data.items():
                if selectors and field_name in selectors:
                    selector = selectors[field_name]
                else:
                    # Tentar encontrar por name attribute
                    selector = f"input[name='{field_name}'], textarea[name='{field_name}']"
                
                logger.debug(f"Preenchendo {field_name} = {field_value}")
                await self.page.fill(selector, field_value)
                await asyncio.sleep(0.5)
            
            logger.success("Formulário preenchido")
            return True
        except Exception as e:
            logger.error(f"Erro ao preencher formulário: {e}")
            return False
    
    async def click_button(self, selector: str, button_name: str = "Botão") -> bool:
        """
        Clica em um botão ou link
        
        Args:
            selector: Seletor CSS do elemento
            button_name: Nome amigável do botão (para logging)
        
        Returns:
            True se bem-sucedido
        """
        try:
            logger.info(f"Clicando em: {button_name}")
            await self.page.click(selector)
            await asyncio.sleep(1)
            logger.success(f"Clicado: {button_name}")
            return True
        except Exception as e:
            logger.error(f"Erro ao clicar em {button_name}: {e}")
            return False
    
    async def wait_for_navigation(self, timeout: int = 30000) -> bool:
        """
        Aguarda navegação
        
        Args:
            timeout: Timeout em ms
        
        Returns:
            True se navegação ocorreu
        """
        try:
            await self.page.wait_for_load_state("networkidle", timeout=timeout)
            await asyncio.sleep(1)
            return True
        except Exception as e:
            logger.error(f"Erro ao aguardar navegação: {e}")
            return False
    
    async def wait_for_selector(self, selector: str, timeout: int = 30000) -> bool:
        """
        Aguarda um elemento aparecer
        
        Args:
            selector: Seletor CSS
            timeout: Timeout em ms
        
        Returns:
            True se elemento apareceu
        """
        try:
            await self.page.wait_for_selector(selector, timeout=timeout)
            return True
        except Exception as e:
            logger.error(f"Elemento {selector} não encontrado: {e}")
            return False
    
    async def get_text(self, selector: str) -> Optional[str]:
        """
        Obtém texto de um elemento
        
        Args:
            selector: Seletor CSS
        
        Returns:
            Texto do elemento ou None
        """
        try:
            return await self.page.text_content(selector)
        except Exception as e:
            logger.error(f"Erro ao obter texto de {selector}: {e}")
            return None
    
    async def check_element_visible(self, selector: str) -> bool:
        """
        Verifica se um elemento está visível
        
        Args:
            selector: Seletor CSS
        
        Returns:
            True se visível
        """
        try:
            return await self.page.is_visible(selector)
        except Exception:
            return False
    
    async def handle_modal_confirm(self, confirmation_text: str = "Confirmar") -> bool:
        """
        Trata modais de confirmação
        
        Args:
            confirmation_text: Texto do botão de confirmação
        
        Returns:
            True se confirmado
        """
        try:
            logger.info("Detectado modal de confirmação")
            await self.page.click(f"button:has-text('{confirmation_text}')")
            await asyncio.sleep(1)
            logger.success("Modal confirmado")
            return True
        except Exception as e:
            logger.error(f"Erro ao confirmar modal: {e}")
            return False
    
    async def generate_report(self, output_file: Optional[Path] = None) -> str:
        """
        Gera relatório final de testes
        
        Args:
            output_file: Caminho para salvar HTML
        
        Returns:
            HTML do relatório
        """
        logger.info("Gerando relatório...")
        return self.test_flow.generate_report(output_file)


class SmartTestAgent:
    """
    Agente inteligente que usa Claude para decide o que fazer baseado na tela.
    Simula comportamento de um usuário real fazendo testes.
    """
    
    def __init__(self, headless: bool = False):
        self.browser_manager = PlaywrightBrowser(headless=headless)
        self.vision_analyzer = ClaudeVisionAnalyzer()
    
    async def execute_intelligent_flow(
        self,
        start_url: str,
        flow_name: str,
        max_steps: int = 20,
        custom_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executa um fluxo inteligente onde Claude decide as ações
        
        Args:
            start_url: URL inicial
            flow_name: Nome do fluxo
            max_steps: Número máximo de passos
            custom_instructions: Instruções adicionais para Claude
        
        Returns:
            Resultado do fluxo
        """
        logger.info(f"Iniciando fluxo inteligente: {flow_name}")
        
        if not await self.browser_manager.launch():
            return {"success": False, "error": "Falha ao iniciar browser"}
        
        try:
            # Navegar para início
            if not await self.browser_manager.goto(start_url):
                return {"success": False, "error": f"Falha ao acessar {start_url}"}
            
            # Loop de ações inteligentes
            step = 0
            while step < max_steps:
                step += 1
                logger.info(f"Passo {step}/{max_steps}")
                
                # Capturar screenshot e analisar
                analysis = await self.browser_manager.take_screenshot_and_analyze(
                    f"{flow_name}_step{step}",
                    context=f"Fluxo: {flow_name} - Passo {step}",
                    custom_prompt=custom_instructions
                )
                
                if not analysis:
                    logger.warning("Análise vazia, aborting")
                    break
                
                # Verificar se há erros críticos
                if analysis.get("errors"):
                    logger.error(f"Erros detectados: {analysis['errors']}")
                    if analysis.get("critical"):
                        logger.error("Erro crítico, abortando fluxo")
                        break
                
                # Executar próxima ação recomendada
                next_action = analysis.get("next_recommended_action", {})
                action_type = next_action.get("type")
                target = next_action.get("target")
                value = next_action.get("value")
                
                logger.info(f"Próxima ação: {action_type} - {target}")
                
                if action_type == "click":
                    success = await self.browser_manager.click_button(target, button_name=target)
                    if success:
                        await self.browser_manager.wait_for_navigation()
                
                elif action_type == "fill":
                    success = await self.browser_manager.page.fill(target, value)
                    logger.success(f"Preenchido: {target} = {value}")
                
                elif action_type == "select":
                    await self.browser_manager.page.select_option(target, value)
                    logger.success(f"Selecionado em {target}: {value}")
                
                elif action_type == "navigate":
                    await self.browser_manager.goto(value)
                
                elif action_type == "wait":
                    logger.info(f"Aguardando {next_action.get('timeout', 5)}s...")
                    await asyncio.sleep(next_action.get('timeout', 5))
                
                elif action_type == "complete":
                    logger.success(f"Fluxo completado no passo {step}")
                    break
                
                elif action_type == "stop":
                    logger.info(f"Parando fluxo conforme instruído")
                    break
                
                else:
                    logger.warning(f"Ação desconhecida: {action_type}")
                    break
                
                await asyncio.sleep(0.5)  # Pequeno delay entre ações
            
            # Gerar relatório
            logger.info("Gerando relatório final...")
            report_path = config.REPORTS_DIR / f"report_{flow_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            report_html = await self.browser_manager.generate_report(report_path)
            
            return {
                "success": True,
                "flow": flow_name,
                "steps_executed": step,
                "report_path": str(report_path),
                "analysis_count": len(self.browser_manager.test_flow.analysis_history)
            }
        
        except Exception as e:
            logger.error(f"Erro durante fluxo: {e}")
            return {"success": False, "error": str(e)}
        
        finally:
            await self.browser_manager.close()
