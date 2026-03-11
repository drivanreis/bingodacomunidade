"""
===========================================================================
TPIC - Testador Prático de Integração Contínua
Script Principal
===========================================================================
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime
from typing import List

from playwright.async_api import async_playwright

from utils import Logger, generate_html_report, save_html_report
from phases import (
    Phase1_Setup,
    Phase2_AdminDefault,
    Phase3_AdminParoquiaCreate,
    Phase4_AdminParoquiaLogin,
    Phase5_UserCommon,
)
from config import BROWSER_CONFIG, CONTEXT_CONFIG


class TPIC:
    """Orquestrador do Teste Prático de Integração Contínua"""
    
    def __init__(self):
        self.logger = Logger("TPIC")
        self.phases = []
        self.all_results = []
        self.start_time = None
        self.end_time = None
    
    async def run_all_phases(self, phases_to_run: List[int] = None):
        """
        Executa todas as fases do teste
        
        Args:
            phases_to_run: Lista de números das fases a executar (1-5)
                          Se None, executa todas
        """
        self.start_time = datetime.now()
        
        if phases_to_run is None:
            phases_to_run = [1, 2, 3, 4, 5]
        
        self.logger.info("🚀 INICIANDO TPIC 🚀")
        self.logger.info(f"Fases a executar: {phases_to_run}")
        self.logger.info("=" * 70)
        
        # Fase 1: Setup (não precisa de browser)
        if 1 in phases_to_run:
            phase1 = Phase1_Setup()
            success = await phase1.run()
            self.all_results.extend(phase1.results)
            
            if not success:
                self.logger.error("Setup falhou, abortando!")
                return False
            
            self.logger.info("Aguardando 5 segundos antes de abrir o navegador...")
            await asyncio.sleep(5)
        
        # Fases 2-5: Requerem browser
        if any(phase in phases_to_run for phase in [2, 3, 4, 5]):
            async with async_playwright() as p:
                # Usar Chrome/Chromium
                browser = await p.chromium.launch(**BROWSER_CONFIG)
                context = await browser.new_context(**CONTEXT_CONFIG)
                page = await context.new_page()
                
                # Executar Fases 2-5
                phases_to_run_browser = [
                    (2, Phase2_AdminDefault()),
                    (3, Phase3_AdminParoquiaCreate()),
                    (4, Phase4_AdminParoquiaLogin()),
                    (5, Phase5_UserCommon()),
                ]
                
                for phase_num, phase_obj in phases_to_run_browser:
                    if phase_num not in phases_to_run:
                        continue
                    
                    await phase_obj.setup_browser(page, context)
                    success = await phase_obj.run()
                    self.all_results.extend(phase_obj.results)
                    
                    if not success:
                        self.logger.warning(f"Fase {phase_num} falhou, continuando...")
                
                await context.close()
                await browser.close()
        
        self.end_time = datetime.now()
        
        # Gerar relatório
        self._generate_report()
        
        self.logger.info("=" * 70)
        self.logger.success("✓ TPIC CONCLUÍDO!")
        self.logger.info("=" * 70)
        
        return True
    
    def _generate_report(self):
        """Gera e salva o relatório HTML"""
        duration = (self.end_time - self.start_time).total_seconds()
        
        total_steps = len(self.all_results)
        success_steps = sum(1 for r in self.all_results if r.get("status") == "✓")
        failed_steps = sum(1 for r in self.all_results if r.get("status") == "✗")
        warning_steps = sum(1 for r in self.all_results if r.get("status") == "⚠")
        
        summary = f"""
        <div style="margin-bottom: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
            <h2>Resumo da Execução</h2>
            <ul style="font-size: 16px;">
                <li><strong>Tempo de execução:</strong> {duration:.1f}s</li>
                <li style="color: green;"><strong>✓ Sucessos:</strong> {success_steps}</li>
                <li style="color: red;"><strong>✗ Falhas:</strong> {failed_steps}</li>
                <li style="color: orange;"><strong>⚠ Avisos:</strong> {warning_steps}</li>
                <li><strong>Total de steps:</strong> {total_steps}</li>
            </ul>
        </div>
        """
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório TPIC</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }}
                .container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                }}
                h1 {{
                    color: #333;
                    text-align: center;
                    margin-bottom: 10px;
                    border-bottom: 4px solid #667eea;
                    padding-bottom: 20px;
                }}
                .timestamp {{
                    text-align: center;
                    color: #999;
                    font-size: 14px;
                    margin-bottom: 30px;
                }}
                .step {{
                    margin-bottom: 20px;
                    padding: 20px;
                    border-left: 5px solid #ddd;
                    background: #fafafa;
                    border-radius: 4px;
                }}
                .step.success {{
                    border-left-color: #28a745;
                    background: #f0fff4;
                }}
                .step.failed {{
                    border-left-color: #dc3545;
                    background: #fff5f5;
                }}
                .step.warning {{
                    border-left-color: #ffc107;
                    background: #fffbf0;
                }}
                .step-name {{
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 8px;
                }}
                .step-message {{
                    color: #666;
                    margin-bottom: 12px;
                }}
                .step img {{
                    max-width: 100%;
                    height: auto;
                    margin-top: 15px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }}
                .step img:hover {{
                    transform: scale(1.02);
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 TPIC - Relatório de Integração Contínua</h1>
                <p class="timestamp">Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}</p>
                
                {summary}
                
                <h2>Detalhes dos Steps</h2>
        """
        
        for result in self.all_results:
            status = result.get("status", "?")
            status_class = "success" if status == "✓" else ("failed" if status == "✗" else "warning")
            
            screenshot_html = ""
            if result.get("screenshot"):
                screenshot_html = f'<img src="{result["screenshot"]}" alt="Screenshot">'
            
            html += f"""
                <div class="step {status_class}">
                    <div class="step-name">[{status}] {result.get('name', 'Unnamed')}</div>
                    <div class="step-message">{result.get('message', '')}</div>
                    {screenshot_html}
                </div>
            """
        
        html += """
            </div>
            <script>
                // Clique em imagem para expandir em lightbox
                document.querySelectorAll('.step img').forEach(img => {
                    img.addEventListener('click', function() {
                        const fullImg = document.createElement('div');
                        fullImg.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0,0,0,0.95);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 9999;
                            cursor: pointer;
                        `;
                        
                        const img2 = document.createElement('img');
                        img2.src = this.src;
                        img2.style.cssText = `
                            max-width: 90%;
                            max-height: 90%;
                            border-radius: 8px;
                        `;
                        
                        fullImg.appendChild(img2);
                        fullImg.addEventListener('click', () => fullImg.remove());
                        document.body.appendChild(fullImg);
                    });
                });
            </script>
        </body>
        </html>
        """
        
        report_path = save_html_report(html)
        self.logger.success(f"Relatório gerado: {report_path}")
        self.logger.info(f"Abra no navegador: file://{report_path.absolute()}")


async def main():
    """Função principal"""
    
    # Parsing de argumentos simples
    phases_to_run = None
    
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        
        if arg in ["--help", "-h"]:
            print("""
TPIC - Testador Prático de Integração Contínua

Uso:
    python main.py              # Executa todas as fases (1-5)
    python main.py --phase 1    # Executa apenas fase 1
    python main.py --phase 2    # Executa apenas fase 2
    python main.py --phase 1,2  # Executa fases 1 e 2
    python main.py --help       # Mostra esta ajuda

Fases:
    1 - Setup automático (limpa, instala, inicia)
    2 - Teste Admin padrão (login e primeiro acesso)
    3 - Cadastro Admin Paróquia (não implementado)
    4 - Teste Admin Paróquia (não implementado)
    5 - Teste Usuário Comum (não implementado)
            """)
            return
        
        if arg.startswith("--phase"):
            # Extrair número da fase
            phase_str = sys.argv[2] if len(sys.argv) > 2 else arg.split("=")[1]
            
            # Suportar: 1, 1,2, 1-2
            if "," in phase_str:
                phases_to_run = [int(p.strip()) for p in phase_str.split(",")]
            elif "-" in phase_str:
                start, end = phase_str.split("-")
                phases_to_run = list(range(int(start), int(end) + 1))
            else:
                phases_to_run = [int(phase_str)]
    
    # Executar TPIC
    tpic = TPIC()
    await tpic.run_all_phases(phases_to_run)


if __name__ == "__main__":
    asyncio.run(main())
