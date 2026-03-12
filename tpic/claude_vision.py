"""
===========================================================================
TPIC - Integração com Claude Haiku 4.5 para Análise Visual
===========================================================================
"""

import json
import base64
from pathlib import Path
from typing import Optional, Dict, Any
from anthropic import Anthropic
from utils import Logger
import os

logger = Logger("claude_vision")

class ClaudeVisionAnalyzer:
    """
    Analisa screenshots usando Claude Haiku 4.5 API com visão computacional.
    Toma decisões inteligentes sobre as próximas ações no teste.
    """
    
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY não está definida em .env")
        
        self.client = Anthropic()
        self.model = "claude-3-5-sonnet-20241022"  # Modelo mais novo (haiku deprecado)
        self.conversation_history = []
        logger.success("Claude Vision Analyzer inicializado")
    
    def _encode_image_to_base64(self, image_path: str | Path) -> str:
        """Converte imagem PNG em base64 para envio à API"""
        with open(image_path, "rb") as image_file:
            return base64.standard_b64encode(image_file.read()).decode("utf-8")
    
    def analyze_screenshot(
        self,
        screenshot_path: str | Path,
        context: str = "Teste de aplicação web",
        last_action: str = "Página carregada",
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analisa um screenshot usando Claude com visão computacional.
        
        Args:
            screenshot_path: Caminho da imagem(screenshot)
            context: Contexto do teste (qual fluxo/etapa)
            last_action: Última ação executada
            custom_prompt: Prompt customizado (opcional)
        
        Returns:
            Dict com análise e próximas ações recomendadas
        """
        try:
            logger.info(f"Analisando screenshot: {Path(screenshot_path).name}")
            
            # Codificar imagem
            image_data = self._encode_image_to_base64(screenshot_path)
            
            # Construir prompt
            if custom_prompt:
                prompt = custom_prompt
            else:
                prompt = f"""Você é um agente inteligente de teste de interface de usuário.
Analise esta screenshot de uma aplicação web e responda em JSON.

**CONTEXTO:** {context}
**ÚLTIMA AÇÃO:** {last_action}

Analise e retorne APENAS um JSON válido (sem markdown, sem comentários) com esta estrutura:
{{
    "page_loaded": true/false,
    "current_page": "identificação da página/rota",
    "page_title": "título ou heading visible",
    "errors": ["lista de erros ou mensagens de erro visíveis"],
    "warnings": ["lista de avisos ou mensagens de alerta"],
    "info_messages": ["lista de mensagens informativas"],
    "visible_elements": {{
        "buttons": ["lista de botões visíveis com seus textos"],
        "input_fields": ["lista de campos de entrada visíveis"],
        "links": ["lista de links visíveis"],
        "modals": ["se há modais/popups abertos"]
    }},
    "form_fields": {{
        "field_name": {{
            "type": "text/email/password/select/checkbox/radio",
            "label": "rótulo do campo",
            "required": true/false,
            "visible": true/false
        }}
    }},
    "next_recommended_action": {{
        "type": "click|fill|select|wait|scroll|navigate",
        "target": "seletor CSS ou descrição do elemento",
        "value": "valor a preencher (se aplicável)",
        "reasoning": "por que esta ação é recomendada"
    }},
    "issues_detected": ["problemas de UX, erros, comportamentos inesperados"],
    "success_indicators": ["sinais de sucesso ou progresso"],
    "observations": "observações gerais importantes"
}}

IMPORTANTE:
- Retorne APENAS JSON válido
- Identifique campos de formulário de forma inteligente
- Detecte erros de validação, mensagens de erro sistemáticas
- Se houver modal, popup ou confirmação, identifique
- Recomende a próxima ação baseado no contexto do teste
- Verificando mensagens de erro ou validação"""
            
            # Chamar Claude com visão
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/png",
                                    "data": image_data,
                                },
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ],
                    }
                ],
            )
            
            # Extrair resposta
            response_text = message.content[0].text
            
            # Limpar resposta se estiver envolvida em markdown
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            # Parse JSON
            analysis = json.loads(response_text)
            
            logger.success(f"Screenshot analisado - Página: {analysis.get('current_page', 'desconhecida')}")
            
            if analysis.get("errors"):
                logger.warning(f"Erros detectados: {analysis['errors']}")
            
            if analysis.get("issues_detected"):
                logger.warning(f"Problemas de UX: {analysis['issues_detected']}")
            
            return analysis
        
        except json.JSONDecodeError as e:
            logger.error(f"Erro ao fazer parse do JSON da resposta: {e}")
            return self._default_analysis("Erro ao analisar screenshot")
        except Exception as e:
            logger.error(f"Erro ao analisar screenshot: {e}")
            return self._default_analysis(f"Erro: {str(e)}")
    
    def analyze_page_state(
        self,
        screenshot_path: str | Path,
        expected_page: str,
        validation_rules: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analisa se a página está no estado esperado.
        Útil para validações após ações.
        
        Args:
            screenshot_path: Caminho do screenshot
            expected_page: Qual página deveria estar carregada
            validation_rules: Regras customizadas de validação
        
        Returns:
            Dict com resultado da validação
        """
        prompt = f"""Analise este screenshot e valide:

PÁGINA ESPERADA: {expected_page}
{f'REGRAS DE VALIDAÇÃO: {validation_rules}' if validation_rules else ''}

Retorne JSON:
{{
    "is_correct_page": true/false,
    "current_page": "página identificada",
    "matches_expected": true/false,
    "validation_passed": true/false,
    "issues": ["lista de problemas encontrados"],
    "evidence": "descrição do que vê na tela que comprova ou refuta",
    "recommendation": "ação recomendada"
}}

Retorne APENAS JSON válido."""
        
        return self.analyze_screenshot(
            screenshot_path,
            context=f"Validação da página: {expected_page}",
            custom_prompt=prompt
        )
    
    def detect_errors(self, screenshot_path: str | Path) -> Dict[str, Any]:
        """
        Detecta erros, exceções ou comportamentos inesperados.
        
        Args:
            screenshot_path: Caminho do screenshot
        
        Returns:
            Dict com erros detectados
        """
        prompt = """Analise este screenshot procurando por:
1. Mensagens de erro ou exceção
2. Stack traces ou erros técnicos
3. Comportamentos inesperados
4. Elementos quebrados ou mal renderizados
5. Problemas de segurança visíveis
6. Timeouts ou mensagens de carregamento duradouro

Retorne JSON:
{
    "has_errors": true/false,
    "error_types": ["tipos de erros encontrados"],
    "error_details": ["descrição detalhada de cada erro"],
    "critical": true/false,
    "affected_functionality": "qual funcionalidade é afetada",
    "suggested_fix": "sugestão de correção",
    "screenshots_evidence": "descrição do que comprova o erro"
}

Retorne APENAS JSON válido."""
        
        return self.analyze_screenshot(
            screenshot_path,
            context="Detecção de erros",
            custom_prompt=prompt
        )
    
    def extract_form_data(self, screenshot_path: str | Path) -> Dict[str, Any]:
        """
        Extrai informações de formulários visíveis.
        
        Args:
            screenshot_path: Caminho do screenshot
        
        Returns:
            Dict com estrutura do formulário
        """
        prompt = """Analise este screenshot e extraia informações sobre formulários:

Retorne JSON:
{
    "has_form": true/false,
    "form_type": "login|signup|contact|feedback|game|etc",
    "fields": {
        "field_name": {
            "type": "text|email|password|select|checkbox|radio|textarea",
            "label": "rótulo",
            "placeholder": "placeholder de exemplo",
            "required": true/false,
            "validation_hints": "dicas de validação visíveis"
        }
    },
    "submit_button": {
        "text": "texto do botão",
        "visible": true/false,
        "enabled": true/false
    },
    "validation_messages": "mensagens de validação visíveis"
}

Retorne APENAS JSON válido."""
        
        return self.analyze_screenshot(
            screenshot_path,
            context="Extração de dados de formulário",
            custom_prompt=prompt
        )
    
    def _default_analysis(self, error_message: str) -> Dict[str, Any]:
        """Retorna análise padrão em caso de erro"""
        return {
            "page_loaded": False,
            "current_page": "desconhecida",
            "errors": [error_message],
            "next_recommended_action": {
                "type": "wait",
                "target": "body",
                "reasoning": "Aguardando recuperação de erro"
            },
            "issues_detected": [error_message],
            "observations": f"Erro na análise: {error_message}"
        }


class VisionTestFlow:
    """
    Fluxo de teste completo usando análise visual com Claude.
    Orquestra múltiplas análises para simular comportamento humano.
    """
    
    def __init__(self):
        self.analyzer = ClaudeVisionAnalyzer()
        self.analysis_history = []
        logger.success("VisionTestFlow inicializado")
    
    def record_analysis(self, analysis: Dict[str, Any], screenshot_path: str | Path):
        """Registra análise no histórico"""
        self.analysis_history.append({
            "timestamp": Path(screenshot_path).stem,
            "screenshot": str(screenshot_path),
            "analysis": analysis
        })
    
    def generate_report(self, output_file: Optional[Path] = None) -> str:
        """
        Gera relatório em HTML das análises.
        
        Args:
            output_file: Arquivo para salvar relatório (opcional)
        
        Returns:
            String HTML do relatório
        """
        html = """
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Testes TPIC</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
                .analysis { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #007bff; border-radius: 4px; }
                .analysis.error { border-left-color: #dc3545; }
                .analysis.warning { border-left-color: #ffc107; }
                .analysis.success { border-left-color: #28a745; }
                .screenshot { max-width: 100%; margin: 10px 0; border-radius: 4px; border: 1px solid #ddd; }
                .json-block { background: #272822; color: #f8f8f2; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
                .summary { background: #e8f4f8; padding: 15px; border-radius: 4px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📊 Relatório de Testes TPIC</h1>
                <div class="summary">
                    <h3>Resumo</h3>
                    <p>Total de análises: <strong>{total}</strong></p>
                    <p>Erros detectados: <strong>{errors}</strong></p>
                    <p>Avisos: <strong>{warnings}</strong></p>
                </div>
        """.format(
            total=len(self.analysis_history),
            errors=sum(1 for a in self.analysis_history if a["analysis"].get("errors")),
            warnings=sum(1 for a in self.analysis_history if a["analysis"].get("issues_detected"))
        )
        
        for entry in self.analysis_history:
            analysis = entry["analysis"]
            status = "error" if analysis.get("errors") else "warning" if analysis.get("issues_detected") else "success"
            
            html += f"""
            <div class="analysis {status}">
                <h3>{entry['timestamp']}</h3>
                <p><strong>Página:</strong> {analysis.get('current_page', 'desconhecida')}</p>
                <p><strong>Carregada:</strong> {'✓' if analysis.get('page_loaded') else '✗'}</p>
                
                {f'<p><strong>Erros:</strong> {", ".join(analysis["errors"])}</p>' if analysis.get('errors') else ''}
                {f'<p><strong>Avisos:</strong> {", ".join(analysis["issues_detected"])}</p>' if analysis.get('issues_detected') else ''}
                
                <p><strong>Próxima ação:</strong> {analysis.get('next_recommended_action', {}).get('type', 'N/A')}</p>
                
                <details>
                    <summary>Ver análise completa</summary>
                    <div class="json-block"><pre>{json.dumps(analysis, indent=2, ensure_ascii=False)}</pre></div>
                </details>
            </div>
            """
        
        html += """
            </div>
        </body>
        </html>
        """
        
        if output_file:
            output_file.write_text(html, encoding="utf-8")
            logger.success(f"Relatório gerado: {output_file}")
        
        return html
