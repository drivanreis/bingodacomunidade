"""
===========================================================================
TPIC - Funções Utilitárias
===========================================================================
"""

import os
import sys
import subprocess
import time
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional
from colorama import Fore, Style, init
from config import LOG_FILE, SCREENSHOTS_DIR, REPORTS_DIR

# Inicializar colorama
init(autoreset=True)

# ===========================================================================
# LOGGING
# ===========================================================================

class Logger:
    """Sistema de logging com cores no terminal e arquivo"""
    
    def __init__(self, name: str):
        self.name = name
        self.log_file = LOG_FILE
        self._ensure_log_file()
    
    def _ensure_log_file(self):
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
    
    def _write_log(self, level: str, message: str):
        """Escreve no arquivo de log"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_line = f"[{timestamp}] [{level}] [{self.name}] {message}\n"
        with open(self.log_file, "a") as f:
            f.write(log_line)
    
    def info(self, message: str):
        print(f"{Fore.CYAN}[INFO]{Style.RESET_ALL} {message}")
        self._write_log("INFO", message)
    
    def success(self, message: str):
        print(f"{Fore.GREEN}[✓]{Style.RESET_ALL} {message}")
        self._write_log("SUCCESS", message)
    
    def warning(self, message: str):
        print(f"{Fore.YELLOW}[⚠]{Style.RESET_ALL} {message}")
        self._write_log("WARNING", message)
    
    def error(self, message: str):
        print(f"{Fore.RED}[✗]{Style.RESET_ALL} {message}")
        self._write_log("ERROR", message)
    
    def debug(self, message: str):
        print(f"{Fore.MAGENTA}[DEBUG]{Style.RESET_ALL} {message}")
        self._write_log("DEBUG", message)


# ===========================================================================
# SUBPROCESS
# ===========================================================================

async def run_script(script_path, timeout: int = 300) -> tuple[bool, str]:
    """
    Executa um script de shell de forma assíncrona
    
    Args:
        script_path: Path object ou string com comando (pode incluir argumentos/pipes)
        timeout: timeout em segundos
    
    Returns:
        (success: bool, output: str)
    """
    logger = Logger("utils.run_script")
    
    # Se for string com argumentos, usar diretamente
    if isinstance(script_path, str):
        command = script_path
        # Extrair nome do script de forma melhor (procura por .sh)
        import re
        match = re.search(r'([a-zA-Z0-9_-]+\.sh)', command)
        script_name = match.group(1) if match else command.split()[0] if command.split() else "command"
    else:
        # Se for Path, verificar existência
        if not script_path.exists():
            logger.error(f"Script não encontrado: {script_path}")
            return False, f"Script não encontrado: {script_path}"
        command = f"bash {script_path}"
        script_name = script_path.name
    
    try:
        logger.info(f"Executando: {script_name}")
        
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            logger.error(f"Script expirou (timeout: {timeout}s): {script_name}")
            return False, f"Timeout após {timeout}s"
        
        output = stdout.decode() + stderr.decode()
        
        if process.returncode == 0:
            logger.success(f"Script executado: {script_name}")
            return True, output
        else:
            logger.error(f"Script falhou (exit code: {process.returncode})")
            return False, output
            
    except Exception as e:
        logger.error(f"Erro ao executar script: {str(e)}")
        return False, str(e)


# ===========================================================================
# ESPERAS E WAITS
# ===========================================================================

async def wait_for_service(url: str, timeout: int = 120, max_retries: int = 30) -> bool:
    """
    Aguarda um serviço ficar disponível (health check)
    
    Args:
        url: URL do serviço
        timeout: Tempo total de espera em segundos
        max_retries: Número máximo de tentativas
    
    Returns:
        True se o serviço ficou disponível, False se timeout
    """
    logger = Logger("utils.wait_for_service")
    import aiohttp
    
    logger.info(f"Aguardando serviço: {url}")
    
    retry_delay = timeout / max_retries
    
    for attempt in range(max_retries):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        logger.success(f"Serviço disponível (tentativa {attempt + 1})")
                        return True
        except Exception:
            pass
        
        remaining = max_retries - attempt - 1
        if remaining > 0:
            logger.debug(f"Tentativa {attempt + 1}/{max_retries} - aguardando {retry_delay:.0f}s...")
            await asyncio.sleep(retry_delay)
    
    logger.error(f"Serviço não ficou disponível após {timeout}s")
    return False


# ===========================================================================
# SCREENSHOTS E RELATÓRIOS
# ===========================================================================

async def take_screenshot(page, step_name: str) -> Path:
    """
    Captura screenshot da página atual
    
    Returns:
        Caminho do arquivo de screenshot
    """
    logger = Logger("utils.take_screenshot")
    
    timestamp = datetime.now().strftime("%H%M%S")
    filename = f"{step_name}_{timestamp}.png"
    filepath = SCREENSHOTS_DIR / filename
    
    try:
        await page.screenshot(path=str(filepath))
        logger.debug(f"Screenshot: {filename}")
        return filepath
    except Exception as e:
        logger.error(f"Erro ao capturar screenshot: {str(e)}")
        return None


# ===========================================================================
# VALIDAÇÕES
# ===========================================================================

async def validate_element(page, selector: str, timeout: int = 10000) -> bool:
    """
    Valida se um elemento existe na página
    """
    try:
        await page.wait_for_selector(selector, timeout=timeout)
        return True
    except Exception:
        return False


async def validate_redirect(page, expected_url: str, timeout: int = 10000) -> bool:
    """
    Valida se houve redirecionamento para a URL esperada
    """
    try:
        await page.wait_for_url(expected_url, timeout=timeout)
        return True
    except Exception:
        return False


# ===========================================================================
# RELATÓRIO HTML
# ===========================================================================

def generate_html_report(title: str, steps: list[dict]) -> str:
    """
    Gera HTML com relatório dos testes
    
    Args:
        title: Título do relatório
        steps: Lista de dicts com dados dos steps
               {
                   "name": "Nome do step",
                   "status": "✓" ou "✗",
                   "message": "Descrição",
                   "screenshot": "caminho/relativo"
               }
    """
    steps_html = ""
    
    for step in steps:
        status_color = "green" if step.get("status") == "✓" else "red"
        screenshot_html = ""
        
        if step.get("screenshot"):
            screenshot_html = f'<img src="{step["screenshot"]}" style="max-width: 800px; margin-top: 10px; border: 1px solid #ddd;">'
        
        steps_html += f"""
        <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid {status_color}; background: #f9f9f9;">
            <h3 style="margin: 0 0 10px 0; color: {status_color};">
                [{step.get("status", "?")}] {step.get("name", "Unnamed")}
            </h3>
            <p style="margin: 0; color: #666;">{step.get("message", "")}</p>
            {screenshot_html}
        </div>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{title}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
            }}
            .container {{
                max-width: 1000px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            h1 {{
                color: #333;
                border-bottom: 3px solid #0066cc;
                padding-bottom: 10px;
            }}
            .timestamp {{
                color: #999;
                font-size: 14px;
                margin-top: -10px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>{title}</h1>
            <p class="timestamp">Relatório gerado em {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}</p>
            {steps_html}
        </div>
    </body>
    </html>
    """
    
    return html


def save_html_report(html: str, output_path: Optional[Path] = None) -> Path:
    """Salva o relatório HTML"""
    if output_path is None:
        output_path = REPORTS_DIR / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    
    output_path.write_text(html, encoding="utf-8")
    return output_path
