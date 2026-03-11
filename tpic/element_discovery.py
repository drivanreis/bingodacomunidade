"""
==========================================================================
TPIC - Descoberta DINÂMICA de Seletores
==========================================================================

Sistema inteligente que:
1. Descobre botões/links AUTOMATICAMENTE a cada carregamento
2. Encontra elementos por INTENÇÃO (não hardcoded)
3. Adapta-se a mudanças no UI
4. Registra qual seletor funcionou para debug
"""

import asyncio
import re
from typing import Optional, List, Tuple
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout


class DynamicSelectorFinder:
    """
    Descobre seletores dinamicamente baseado em intenção
    
    Exemplo:
        finder = DynamicSelectorFinder(page)
        
        # Encontra elemento que representa "logout"
        selector = await finder.find_by_intent("logout")
        await page.click(selector)
        
        # Encontra elemento que representa "Paroquias"
        selector = await finder.find_by_intent("paroquias")
        await page.click(selector)
    """
    
    def __init__(self, page: Page, logger=None):
        self.page = page
        self.logger = logger
        self.found_selectors = {}  # Cache: intent -> selector que funcionou
    
    async def find_by_intent(self, intent: str, timeout: int = 5000) -> Optional[str]:
        """
        Encontra elemento por intenção (alta nível)
        
        Exemplos de intent:
        - "logout" / "sair"
        - "paroquias" 
        - "novo" / "criar"
        - "voltar"
        - "admin_site" 
        - "admin_paroquia"
        - "dashboard"
        - "games"
        - "usuarios"
        - "configuracoes"
        
        Args:
            intent: Descrição do que procura (ex: "logout")
            timeout: Timeout em ms
            
        Returns:
            Seletor CSS que funciona, ou None se não encontrar
        """
        
        # Normalizar intent
        intent_clean = intent.lower().strip()
        
        # Verificar cache
        if intent_clean in self.found_selectors:
            cached = self.found_selectors[intent_clean]
            self._log(f"✓ Cache: intent '{intent}' -> '{cached}'")
            return cached
        
        self._log(f"🔍 Procurando por: '{intent}'")
        
        # Estratégias de busca (na ordem de confiabilidade)
        strategies = [
            self._find_by_exact_text,
            self._find_by_partial_text,
            self._find_by_aria_label,
            self._find_by_title_attribute,
            self._find_by_class_patterns,
            self._find_by_href_patterns,
        ]
        
        for strategy in strategies:
            try:
                selector = await strategy(intent_clean, timeout)
                if selector:
                    self.found_selectors[intent_clean] = selector
                    self._log(f"✅ Encontrado: '{intent}' -> {selector}")
                    return selector
            except Exception as e:
                self._log(f"  ⚠️  Estratégia falhou: {str(e)[:80]}")
                continue
        
        self._log(f"❌ Não encontrado: '{intent}'")
        return None
    
    async def _find_by_exact_text(self, intent: str, timeout: int) -> Optional[str]:
        """Procura por texto exato em botões/links"""
        
        # Normalizações comuns
        text_variants = [
            intent,  # "logout"
            intent.capitalize(),  # "Logout"
            intent.upper(),  # "LOGOUT"
            intent.replace("_", " "),  # "admin_site" -> "admin site"
            intent.replace("_", " ").title(),  # "Admin Site"
        ]
        
        for text in text_variants:
            # Procurar em botões
            selector = f"button:has-text('{text}')"
            if await self._selector_exists(selector, timeout):
                return selector
            
            # Procurar em links
            selector = f"a:has-text('{text}')"
            if await self._selector_exists(selector, timeout):
                return selector
        
        return None
    
    async def _find_by_partial_text(self, intent: str, timeout: int) -> Optional[str]:
        """Procura por texto parcial (contém a string)"""
        
        # Buscar em botões
        buttons = await self.page.query_selector_all("button")
        
        for button in buttons:
            text = await button.text_content()
            if text and intent.lower() in text.lower().strip():
                # Gerar seletor específico para este botão
                button_text = text.strip()[:50]
                selector = f"button:has-text('{button_text}')"
                
                if await self._selector_exists(selector, timeout):
                    return selector
        
        # Buscar em links
        links = await self.page.query_selector_all("a")
        
        for link in links:
            text = await link.text_content()
            if text and intent.lower() in text.lower().strip():
                link_text = text.strip()[:50]
                selector = f"a:has-text('{link_text}')"
                
                if await self._selector_exists(selector, timeout):
                    return selector
        
        return None
    
    async def _find_by_aria_label(self, intent: str, timeout: int) -> Optional[str]:
        """Procura por aria-label (acessibilidade)"""
        
        selectors = [
            f"button[aria-label*='{intent}']",
            f"a[aria-label*='{intent}']",
            f"[role='button'][aria-label*='{intent}']",
        ]
        
        for selector in selectors:
            if await self._selector_exists(selector, timeout):
                return selector
        
        return None
    
    async def _find_by_title_attribute(self, intent: str, timeout: int) -> Optional[str]:
        """Procura por atributo 'title' (tooltip)"""
        
        selectors = [
            f"button[title*='{intent}']",
            f"a[title*='{intent}']",
            f"[title*='{intent}']",
        ]
        
        for selector in selectors:
            if await self._selector_exists(selector, timeout):
                return selector
        
        return None
    
    async def _find_by_class_patterns(self, intent: str, timeout: int) -> Optional[str]:
        """Procura por padrões de classe comuns"""
        
        patterns = {
            "logout": ["logout-button", "logout-btn", "sign-out", "signout"],
            "sair": ["logout-button", "logout-btn", "sign-out"],
            "novo": ["btn-new", "new-button", "btn-create", "btn-plus"],
            "criar": ["btn-create", "create-button", "btn-new"],
            "voltar": ["btn-back", "back-button", "go-back"],
        }
        
        intent_classes = patterns.get(intent, [])
        
        for class_name in intent_classes:
            selector = f"button.{class_name}, a.{class_name}"
            if await self._selector_exists(selector, timeout):
                return selector
        
        return None
    
    async def _find_by_href_patterns(self, intent: str, timeout: int) -> Optional[str]:
        """Procura por padrões de URL/href"""
        
        # Mapear intent para path likely
        path_patterns = {
            "paroquias": "/paroquias",
            "usuarios": "/users",
            "admin_site": "/admin-site",
            "admin_paroquia": "/admin-paroquia",
            "dashboard": "/dashboard",
            "games": "/games",
            "logout": "/logout",
            "sair": "/logout",
            "configuracoes": "/settings",
            "feedback": "/feedback",
        }
        
        path = path_patterns.get(intent, f"/{intent}")
        
        selectors = [
            f"a[href*='{path}']",
            f"a[href*='{intent}']",
        ]
        
        for selector in selectors:
            if await self._selector_exists(selector, timeout):
                return selector
        
        return None
    
    async def _selector_exists(self, selector: str, timeout: int) -> bool:
        """Verifica se seletor existe na página"""
        try:
            element = await self.page.wait_for_selector(selector, timeout=timeout)
            return element is not None
        except PlaywrightTimeout:
            return False
        except Exception:
            return False
    
    def _log(self, message: str):
        """Log com prefix"""
        if self.logger:
            self.logger.info(f"[SELECTOR] {message}")
        else:
            print(f"[SELECTOR] {message}")
    
    async def discover_all_buttons(self) -> List[dict]:
        """
        Descobre TODOS os botões/links da página (para debugging)
        
        Returns:
            Lista de dicts com info dos elementos
        """
        results = []
        
        buttons = await self.page.query_selector_all("button")
        for i, btn in enumerate(buttons, 1):
            text = await btn.text_content()
            classes = await btn.get_attribute("class")
            
            results.append({
                "type": "button",
                "text": text.strip() if text else "[sem texto]",
                "classes": classes,
                "selector": f"button:has-text('{(text or '').strip()[:30]}')"
            })
        
        links = await self.page.query_selector_all("a")
        for i, link in enumerate(links, 1):
            text = await link.text_content()
            href = await link.get_attribute("href")
            classes = await link.get_attribute("class")
            
            results.append({
                "type": "link",
                "text": text.strip() if text else "[sem texto]",
                "href": href,
                "classes": classes,
                "selector": f"a:has-text('{(text or '').strip()[:30]}')"
            })
        
        return results


async def click_by_intent(
    page: Page,
    intent: str,
    finder: Optional[DynamicSelectorFinder] = None,
    logger=None
) -> bool:
    """
    Clica em elemento por intenção
    
    Exemplo:
        success = await click_by_intent(page, "logout")
        if success:
            print("Clicou em logout!")
    
    Args:
        page: Página Playwright
        intent: O que procura clicar
        finder: DynamicSelectorFinder (cria um se não fornecido)
        logger: Logger para registro
        
    Returns:
        True se conseguiu clicar, False caso contrário
    """
    
    if not finder:
        finder = DynamicSelectorFinder(page, logger)
    
    selector = await finder.find_by_intent(intent)
    
    if not selector:
        if logger:
            logger.error(f"Não conseguiu encontrar seletor para: {intent}")
        return False
    
    try:
        await page.click(selector)
        if logger:
            logger.info(f"✓ Clicou em '{intent}'")
        return True
    except Exception as e:
        if logger:
            logger.error(f"Erro ao clicar em '{intent}': {e}")
        return False


async def fill_form_dynamically(
    page: Page,
    fields: dict,
    logger=None
) -> bool:
    """
    Preenche formulário encontrando campos dinamicamente
    
    Exemplo:
        success = await fill_form_dynamically(page, {
            "username": "Admin",
            "password": "admin123",
            "email": "admin@example.com"
        })
    
    Args:
        page: Página Playwright
        fields: Dict de label/placeholder -> valor
        logger: Logger
        
    Returns:
        True se preencheu tudo, False se falhou em algum
    """
    
    for field_name, value in fields.items():
        # Procurar por label
        labels = await page.query_selector_all("label")
        found = False
        
        for label in labels:
            label_text = await label.text_content()
            if field_name.lower() in label_text.lower():
                # Encontrar input associado
                input_id = await label.get_attribute("for")
                if input_id:
                    selector = f"#{input_id}"
                else:
                    # Buscar input dentro do label
                    selector = f"label:has-text('{(label_text or '').strip()[:30]}') input"
                
                try:
                    await page.fill(selector, str(value))
                    if logger:
                        logger.info(f"✓ Preencheu '{field_name}'")
                    found = True
                    break
                except:
                    pass
        
        # Se não encontrou por label, procurar por placeholder
        if not found:
            inputs = await page.query_selector_all("input")
            for input_elem in inputs:
                placeholder = await input_elem.get_attribute("placeholder")
                input_type = await input_elem.get_attribute("type")
                
                if placeholder and field_name.lower() in placeholder.lower():
                    try:
                        await input_elem.fill(str(value))
                        if logger:
                            logger.info(f"✓ Preencheu '{field_name}'")
                        found = True
                        break
                    except:
                        pass
        
        if not found:
            if logger:
                logger.error(f"Não encontrou campo: {field_name}")
            return False
    
    return True
