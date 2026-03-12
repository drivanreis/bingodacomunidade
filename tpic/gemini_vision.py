"""
===========================================================================
TPIC - Integração com Google Gemini para Análise Visual
===========================================================================
Alternativa GRATUITA ao Claude. Funciona igual!
"""

import json
import base64
from pathlib import Path
from typing import Optional, Dict, Any
import google.generativeai as genai
from utils import Logger
import os

logger = Logger("gemini_vision")

class GeminiVisionAnalyzer:
    """
    Analisa screenshots usando Google Gemini API (GRÁTIS) com visão.
    Funciona exatamente como ClaudeVisionAnalyzer, mas sem custos!
    """
    
    def __init__(self):
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_GEMINI_API_KEY não está definida em .env")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.conversation_history = []
        logger.success("Gemini Vision Analyzer inicializado (GRÁTIS!)")
    
    def _encode_image_to_base64(self, image_path: str | Path) -> str:
        """Converte imagem PNG em base64"""
        with open(image_path, "rb") as image_file:
            return base64.standard_b64encode(image_file.read()).decode("utf-8")
    
    def _load_image_as_parts(self, image_path: str | Path):
        """Carrega imagem para o formato aceito por Gemini"""
        with open(image_path, "rb") as image_file:
            return {
                "mime_type": "image/png",
                "data": base64.standard_b64encode(image_file.read()).decode()
            }
    
    def analyze_screenshot(
        self,
        screenshot_path: str | Path,
        context: str = "Teste de aplicação web",
        last_action: str = "Página carregada",
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analisa um screenshot usando Gemini com visão gratuita.
        
        Args:
            screenshot_path: Caminho da imagem
            context: Contexto do teste
            last_action: Última ação executada
            custom_prompt: Prompt customizado (opcional)
        
        Returns:
            Dict com análise completa
        """
        try:
            logger.info(f"Analisando screenshot: {Path(screenshot_path).name}")
            
            # Carregar imagem
            image_part = self._load_image_as_parts(screenshot_path)
            
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
- Recomende a próxima ação baseado no contexto do teste"""
            
            # Enviar para Gemini
            response = self.model.generate_content(
                [image_part, prompt],
                generation_config={
                    'temperature': 0.2,  # Mais determinístico
                    'top_p': 0.8,
                    'top_k': 40,
                    'max_output_tokens': 1500
                }
            )
            
            # Extrair resposta
            response_text = response.text
            
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
            logger.error(f"Erro ao fazer parse do JSON: {e}")
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
        """Analisa se a página está no estado esperado"""
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
        """Detecta erros, exceções ou comportamentos inesperados"""
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
        """Extrai informações de formulários visíveis"""
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
