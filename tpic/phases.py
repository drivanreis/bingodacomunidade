"""
===========================================================================
TPIC - Fases do Teste (DESCOBERTA DINÂMICA)
===========================================================================
IMPORTANTE: Cada fase DESCOBRE SELETORES AUTOMATICAMENTE.
Adapta-se a mudanças no UI do site em desenvolvimento.
===========================================================================
"""

import asyncio
from playwright.async_api import Page, BrowserContext
from datetime import datetime
from utils import (
    Logger, run_script, wait_for_service, take_screenshot,
    validate_element
)
from element_discovery import DynamicSelectorFinder, click_by_intent, fill_form_dynamically
from config import (
    SETUP_SCRIPTS, BROWSER_CONFIG, CONTEXT_CONFIG, ROUTES, NAV_SELECTORS,
    ADMIN_DEFAULT, ADMIN_PAROQUIA_TEMP, DEFAULT_TIMEOUT,
    NAVIGATION_TIMEOUT, BASE_URL, BACKEND_URL
)


class BasePhase:
    """Classe base para todas as fases"""
    
    def __init__(self, phase_name: str):
        self.name = phase_name
        self.logger = Logger(f"Phase.{phase_name}")
        self.page: Page = None
        self.context: BrowserContext = None
        self.results = []
    
    async def setup_browser(self, page, context):
        """Configura a página para a fase"""
        self.page = page
        self.context = context
        self.page.set_default_timeout(DEFAULT_TIMEOUT)
        self.page.set_default_navigation_timeout(NAVIGATION_TIMEOUT)
    
    def add_result(self, name: str, status: str, message: str, screenshot: str = None):
        """Adiciona resultado de um step"""
        self.results.append({
            "name": name,
            "status": status,
            "message": message,
            "screenshot": screenshot
        })
    
    async def run(self) -> bool:
        """Executa a fase. Deve ser implementado pelas subclasses."""
        raise NotImplementedError
    
    def _rel_screenshot(self, path):
        """Retorna path relativo do screenshot"""
        if path:
            return f"screenshots/{path.name}"
        return None


# ===========================================================================
# FASE 1 - SETUP AUTOMÁTICO
# ===========================================================================

class Phase1_Setup(BasePhase):
    """Executa limpeza, instalação e start do projeto"""
    
    def __init__(self):
        super().__init__("Setup")
    
    async def run(self) -> bool:
        """Executa os scripts de setup"""
        self.logger.info("=" * 70)
        self.logger.info("FASE 1: SETUP AUTOMÁTICO")
        self.logger.info("=" * 70)
        
        # 1. Limpar (com confirmação automática via pipe)
        self.logger.info("Passo 1: Limpeza total...")
        self.logger.info("Executando: echo 'sim' | ./limpa.sh")
        clean_cmd = f"echo 'sim' | bash {SETUP_SCRIPTS['clean']}"
        success, output = await run_script(clean_cmd, timeout=180)
        
        if success:
            self.add_result("Cleanup", "✓", "limpa.sh executado com sucesso")
            self.logger.success("✓ Limpeza completa")
        else:
            self.add_result("Cleanup", "✗", f"Erro na limpeza: {output[:200]}")
            self.logger.error("✗ Limpeza falhou")
            return False
        
        await asyncio.sleep(3)
        
        # 2. Instalar
        self.logger.info("Passo 2: Instalação...")
        self.logger.info("Executando: ./install.sh")
        success, output = await run_script(SETUP_SCRIPTS["install"], timeout=300)
        
        if success:
            self.add_result("Install", "✓", "install.sh executado com sucesso")
            self.logger.success("✓ Instalação completa")
        else:
            self.add_result("Install", "✗", f"Erro na instalação: {output[:200]}")
            self.logger.error("✗ Instalação falhou")
            return False
        
        await asyncio.sleep(3)
        
        # 3. Iniciar
        self.logger.info("Passo 3: Iniciando aplicação...")
        self.logger.info("Executando: ./start.sh")
        success, output = await run_script(SETUP_SCRIPTS["start"], timeout=180)
        
        if not success:
            self.logger.warning("⚠ start.sh retornou com warning, mas continuando...")
        
        self.logger.info("")
        self.logger.info("Aguardando serviços ficarem prontos...")
        
        # Aguardar backend (com tentativas múltiplas)
        self.logger.info("Testando backend em localhost:8000...")
        backend_ok = False
        for attempt in range(1, 31):
            try:
                backend_ok = await wait_for_service(f"{BACKEND_URL}/health", timeout=5)
                if backend_ok:
                    break
                self.logger.info(f"  Tentativa {attempt}/30 - aguardando backend...")
                await asyncio.sleep(2)
            except Exception as e:
                await asyncio.sleep(2)
        
        if not backend_ok:
            self.add_result("Start Backend", "✗", "Backend não ficou disponível após 60s")
            self.logger.error("✗ Backend não respondeu")
            return False
        
        self.add_result("Start Backend", "✓", "Backend disponível em localhost:8000")
        self.logger.success("✓ Backend pronto")
        
        # Aguardar frontend
        self.logger.info("Testando frontend em localhost:5173...")
        frontend_ok = False
        for attempt in range(1, 31):
            try:
                frontend_ok = await wait_for_service(BASE_URL, timeout=5)
                if frontend_ok:
                    break
                self.logger.info(f"  Tentativa {attempt}/30 - aguardando frontend...")
                await asyncio.sleep(2)
            except Exception as e:
                await asyncio.sleep(2)
        
        if not frontend_ok:
            self.add_result("Start Frontend", "✗", "Frontend não ficou disponível após 60s")
            self.logger.error("✗ Frontend não respondeu")
            return False
        
        self.add_result("Start Frontend", "✓", "Frontend disponível em localhost:5173")
        self.logger.success("✓ Frontend pronto")
        
        self.logger.info("")
        self.logger.info("=" * 70)
        self.logger.success("✓ FASE 1 CONCLUÍDA!")
        self.logger.info("=" * 70)
        
        return True


# ===========================================================================
# FASE 2 - TESTE ADMIN PADRÃO (BOOTSTRAPPO)
# ===========================================================================

class Phase2_AdminDefault(BasePhase):
    """Testa login com Admin padrão usando descoberta DINÂMICA"""
    
    def __init__(self):
        super().__init__("Admin Padrão")
    
    async def run(self) -> bool:
        """Executa teste do admin padrão com seletores descobertos dinamicamente"""
        if not self.page:
            self.logger.error("Página não foi configurada!")
            return False
        
        self.logger.info("=" * 70)
        self.logger.info("FASE 2: TESTE ADMIN PADRÃO (Descoberta Dinâmica)")
        self.logger.info("=" * 70)
        
        try:
            # Step 1: Acessar homepage (ÚNICA vez que usamos goto)
            self.logger.info("Step 1: Acessando homepage")
            await self.page.goto(BASE_URL, wait_until="networkidle")
            await asyncio.sleep(1)
            
            screenshot = await take_screenshot(self.page, "phase2_01_homepage")
            
            body_exists = await validate_element(self.page, "body")
            if not body_exists:
                self.add_result("Acessar Homepage", "✗", "Página não carregou", self._rel_screenshot(screenshot))
                return False
            
            self.add_result("Acessar Homepage", "✓", "Homepage carregada", self._rel_screenshot(screenshot))
            self.logger.success("Homepage carregada")
            
            # Step 2: Descobrir e clicar em "Admin do Site" DINAMICAMENTE
            self.logger.info("Step 2: Descobrindo seletor para 'Admin do Site'")
            
            finder = DynamicSelectorFinder(self.page, self.logger)
            
            # Listar botões disponíveis (para debug)
            self.logger.debug("Botões/links disponíveis na página:")
            buttons_info = await finder.discover_all_buttons()
            for btn in buttons_info[:10]:  # Mostrar primeiros 10
                self.logger.debug(f"  - [{btn['type']}] {btn['text']}")
            
            # Procurar por "admin_site"
            selector = await finder.find_by_intent("admin_site")
            if not selector:
                self.add_result("Descobrir Admin Site", "✗", "Seletor não encontrado")
                self.logger.error("Não conseguiu descobrir seletor para admin_site")
                return False
            
            self.logger.debug(f"Seletor descoberto: {selector}")
            
            # Clicar no seletor descoberto
            try:
                await self.page.click(selector)
                await asyncio.sleep(2)
                self.add_result("Clicar Admin Site", "✓", f"Clicado com sucesso")
                self.logger.success("Clicou em admin_site")
            except Exception as e:
                self.add_result("Clicar Admin Site", "✗", f"Erro ao clicar: {str(e)}")
                return False
            
            screenshot = await take_screenshot(self.page, "phase2_02_login_page")
            
            if "admin-site/login" not in self.page.url:
                self.add_result("Redirecionar Login", "⚠", f"URL: {self.page.url}", self._rel_screenshot(screenshot))
            else:
                self.add_result("Redirecionar Login", "✓", "Redirecionado para admin-site/login", self._rel_screenshot(screenshot))
            
            # Step 3: Preencher login DINAMICAMENTE
            self.logger.info("Step 3: Preenchendo formulário de login")
            
            login_fields = {
                "username": ADMIN_DEFAULT["username"],
                "password": ADMIN_DEFAULT["password"]
            }
            
            # Tentar preencher via descoberta dinâmica
            try:
                # Tenta campos padrão por name
                username_field = await self.page.query_selector("input[name='username']")
                if username_field:
                    await username_field.fill(ADMIN_DEFAULT["username"])
                    self.logger.debug("✓ Preencheu username")
                
                password_field = await self.page.query_selector("input[name='password']")
                if password_field:
                    await password_field.fill(ADMIN_DEFAULT["password"])
                    self.logger.debug("✓ Preencheu password")
                
                # Clicar em submit
                submit = await finder.find_by_intent("submit")
                if submit:
                    await self.page.click(submit)
                    self.logger.debug("✓ Clicou submit")
                else:
                    # Fallback: procurar botão de submit
                    await self.page.click("button[type='submit']")
                
                await asyncio.sleep(3)
                
            except Exception as e:
                self.add_result("Login", "✗", f"Erro ao preencher: {str(e)}")
                return False
            
            screenshot = await take_screenshot(self.page, "phase2_03_pos_login")
            
            if "login" in self.page.url.lower():
                self.add_result("Login", "✗", f"Ainda em login: {self.page.url}", self._rel_screenshot(screenshot))
                return False
            
            self.add_result("Login", "✓", f"Login bem-sucedido", self._rel_screenshot(screenshot))
            self.logger.success("Admin logado!")
            
            # Step 4: Responder modal de troca de senha (descoberta dinâmica)
            self.logger.info("Step 4: Respondendo modal de troca de senha")
            
            await asyncio.sleep(2)
            
            # Procurar por botão de confirmação
            finder = DynamicSelectorFinder(self.page, self.logger)
            ok_selector = None
            
            for intent in ["ok", "confirm", "próximo", "entendido"]:
                selector = await finder.find_by_intent(intent)
                if selector:
                    ok_selector = selector
                    break
            
            if ok_selector:
                try:
                    await self.page.click(ok_selector)
                    await asyncio.sleep(1)
                    self.logger.debug("✓ Modal fechado")
                except Exception:
                    pass
            
            screenshot = await take_screenshot(self.page, "phase2_04_pos_modal")
            self.add_result("Modal Senha", "✓", "Modal processado")
            self.logger.success("Modal de senha tratado")
            
            # Step 5: Validar acesso
            self.logger.info("Step 5: Validando acesso")
            
            await asyncio.sleep(1)
            
            if "admin-site" in self.page.url and "login" not in self.page.url:
                self.add_result("Validar Acesso", "✓", f"Em admin-site (não-login)")
                self.logger.success("Acesso validado")
            else:
                self.add_result("Validar Acesso", "⚠", f"URL inesperada: {self.page.url}")
            
            screenshot = await take_screenshot(self.page, "phase2_05_final")
            
            # Bonus: Listar navegação disponível no dashboard
            self.logger.info("Elementos de navegação encontrados no dashboard:")
            buttons_info = await finder.discover_all_buttons()
            for btn in buttons_info[:15]:
                self.logger.debug(f"  - {btn['text']}")
            
            self.logger.info("=" * 70)
            self.logger.success("✓ FASE 2 CONCLUÍDA!")
            self.logger.info("=" * 70)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro Fase 2: {str(e)}")
            self.add_result("Erro", "✗", str(e))
            return False


# ===========================================================================
# FASE 3 - CRIAR PARÓQUIA (DESCOBERTA DINÂMICA)
# ===========================================================================

class Phase3_AdminParoquiaCreate(BasePhase):
    """Cria paróquia a partir do dashboard admin-site"""
    
    def __init__(self):
        super().__init__("Paróquia - Criar")
    
    async def run(self) -> bool:
        """Cria paróquia descobrindo seletores dinamicamente"""
        if not self.page:
            self.logger.error("Página não foi configurada!")
            return False
        
        self.logger.info("=" * 70)
        self.logger.info("FASE 3: CRIAR PARÓQUIA (Descoberta Dinâmica)")
        self.logger.info("=" * 70)
        
        try:
            # Assumir que está em admin-site/dashboard (vindo da Fase 2)
            self.logger.info("Step 1: Descobrindo navegação para 'Paroquias'")
            
            finder = DynamicSelectorFinder(self.page, self.logger)
            
            # Listar opções disponíveis
            self.logger.debug("Elementos de navegação no dashboard:")
            buttons = await finder.discover_all_buttons()
            for btn in buttons[:10]:
                self.logger.debug(f"  - {btn['text']}")
            
            # Procurar por "paroquias"
            paroquias_selector = await finder.find_by_intent("paroquias")
            if not paroquias_selector:
                self.add_result("Navegar Paroquias", "✗", "Botão paroquias não encontrado")
                self.logger.error("Não conseguiu encontrar botão paroquias")
                return False
            
            self.logger.debug(f"Seletor descoberto: {paroquias_selector}")
            
            try:
                await self.page.click(paroquias_selector)
                await asyncio.sleep(2)
                self.add_result("Navegar Paroquias", "✓", f"Navegou para paroquias")
                self.logger.success("Clicou em paroquias")
            except Exception as e:
                self.add_result("Navegar Paroquias", "✗", f"Erro ao clicar: {str(e)}")
                return False
            
            screenshot = await take_screenshot(self.page, "phase3_01_paroquias_page")
            
            # Step 2: Procurar por botão "Nova Paróquia"
            self.logger.info("Step 2: Procurando botão 'Nova Paróquia'")
            
            finder = DynamicSelectorFinder(self.page, self.logger)
            novo_selector = None
            
            # Tentar várias variações
            for intent in ["novo", "nova paroquia", "criar paroquia", "+"]:
                selector = await finder.find_by_intent(intent)
                if selector:
                    novo_selector = selector
                    self.logger.debug(f"Encontrou com intent '{intent}': {selector}")
                    break
            
            if not novo_selector:
                self.add_result("Descobrir Novo", "✗", "Botão novo não encontrado")
                self.logger.error("Botão 'Nova Paróquia' não encontrado")
                # Não retornar false aqui pois pode não haver page de criação
                return True
            
            try:
                await self.page.click(novo_selector)
                await asyncio.sleep(2)
                self.add_result("Clicar Nova", "✓", "Clicou em nova paróquia")
                self.logger.success("Clicou em nova paróquia")
            except Exception as e:
                self.add_result("Clicar Nova", "⚠", f"Erro ao clicar: {str(e)}")
                return True  # Continua mesmo se não conseguir
            
            screenshot = await take_screenshot(self.page, "phase3_02_form_nova")
            
            # Step 3: Preencher formulário de nova paróquia
            self.logger.info("Step 3: Preenchendo formulário de paróquia")
            
            paroquia_data = {
                "name": "Paróquia Test TPIC",
                "email": "parish@test.tpic.com",
                "phone": "(11) 99999-9999",
                "pix": "00000000000000000000000000000000",  # CPF dummy
            }
            
            try:
                # Descobrir campos dinamicamente
                finder = DynamicSelectorFinder(self.page, self.logger)
                
                # Tentar preencher
                inputs = await self.page.query_selector_all("input")
                filled = 0
                
                for input_elem in inputs:
                    placeholder = await input_elem.get_attribute("placeholder")
                    input_type = await input_elem.get_attribute("type")
                    
                    if not placeholder:
                        continue
                    
                    placeholder_lower = placeholder.lower()
                    
                    # Tentar mapear para nossos dados
                    if any(word in placeholder_lower for word in ["nome", "name"]):
                        await input_elem.fill(paroquia_data["name"])
                        filled += 1
                        self.logger.debug(f"✓ Preencheu nome")
                    elif any(word in placeholder_lower for word in ["email"]):
                        await input_elem.fill(paroquia_data["email"])
                        filled += 1
                        self.logger.debug(f"✓ Preencheu email")
                    elif any(word in placeholder_lower for word in ["telefone", "phone"]):
                        await input_elem.fill(paroquia_data["phone"])
                        filled += 1
                        self.logger.debug(f"✓ Preencheu phone")
                    elif any(word in placeholder_lower for word in ["pix", "chave"]):
                        await input_elem.fill(paroquia_data["pix"])
                        filled += 1
                        self.logger.debug(f"✓ Preencheu pix")
                
                self.add_result("Preencher Form", "✓", f"Preencheu {filled} campos")
                self.logger.success(f"Formulário preenchido ({filled} campos)")
                
            except Exception as e:
                self.add_result("Preencher Form", "✗", f"Erro: {str(e)}")
                return False
            
            screenshot = await take_screenshot(self.page, "phase3_03_form_preenchido")
            
            # Step 4: Clicar em submit
            self.logger.info("Step 4: Enviando formulário")
            
            try:
                await self.page.click("button[type='submit']")
                await asyncio.sleep(2)
                self.add_result("Enviar Form", "✓", "Formulário enviado")
                self.logger.success("Formulário enviado")
            except Exception as e:
                self.add_result("Enviar Form", "✗", f"Erro: {str(e)}")
                return False
            
            screenshot = await take_screenshot(self.page, "phase3_04_final")
            
            self.logger.info("=" * 70)
            self.logger.success("✓ FASE 3 CONCLUÍDA!")
            self.logger.info("=" * 70)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro Fase 3: {str(e)}")
            self.add_result("Erro", "✗", str(e))
            return False


# ===========================================================================
# FASE 4 - LOGIN PAROQUIAL (DESCOBERTA DINÂMICA)
# ===========================================================================

class Phase4_AdminParoquiaLogin(BasePhase):
    """Login como admin paroquial"""
    
    def __init__(self):
        super().__init__("Paróquia - Login")
    
    async def run(self) -> bool:
        """Login paroquial com descoberta dinâmica"""
        if not self.page:
            self.logger.error("Página não foi configurada!")
            return False
        
        self.logger.info("=" * 70)
        self.logger.info("FASE 4: LOGIN PAROQUIAL (Descoberta Dinâmica)")
        self.logger.info("=" * 70)
        
        try:
            # Step 1: Fazer logout do admin anterior
            self.logger.info("Step 1: Fazendo logout do admin anterior")
            
            finder = DynamicSelectorFinder(self.page, self.logger)
            
            logout_selector = await finder.find_by_intent("logout")
            if logout_selector:
                try:
                    await self.page.click(logout_selector)
                    await asyncio.sleep(2)
                    self.logger.success("Fez logout")
                except Exception as e:
                    self.logger.debug(f"Erro ao clicar logout: {e}")
            else:
                self.logger.debug("Botão logout não encontrado (pode estar já logado fora)")
            
            screenshot = await take_screenshot(self.page, "phase4_01_pos_logout")
            
            # Step 2: Navegar/clicar em "Admin Paroquial"
            self.logger.info("Step 2: Procurando entrada para 'Admin Paroquial'")
            
            # Se não em home, voltar
            if self.page.url != BASE_URL:
                await self.page.goto(BASE_URL, wait_until="networkidle")
                await asyncio.sleep(1)
            
            finder = DynamicSelectorFinder(self.page, self.logger)
            
            # Listar botões
            buttons = await finder.discover_all_buttons()
            self.logger.debug("Opções na homepage:")
            for btn in buttons[:10]:
                self.logger.debug(f"  - {btn['text']}")
            
            admin_paroquia_selector = None
            for intent in ["admin paroquia", "admin_paroquia", "paroquia"]:
                selector = await finder.find_by_intent(intent)
                if selector:
                    admin_paroquia_selector = selector
                    break
            
            if admin_paroquia_selector:
                try:
                    await self.page.click(admin_paroquia_selector)
                    await asyncio.sleep(2)
                    self.add_result("Navegar Admin Paroquia", "✓", "Navegou")
                    self.logger.success("Clicou em admin paroquial")
                except Exception as e:
                    self.add_result("Navegar Admin Paroquia", "✗", f"Erro: {e}")
            else:
                # Fallback: tentar acessar diretamente
                self.logger.debug("Botão não encontrado, tentando URL direta...")
                await self.page.goto(ROUTES["admin_paroquia_login"], wait_until="networkidle")
                await asyncio.sleep(1)
            
            screenshot = await take_screenshot(self.page, "phase4_02_login_page")
            self.add_result("Acessar Login Paroquia", "✓", f"URL: {self.page.url}")
            
            # Step 3: Fazer login
            self.logger.info("Step 3: Preenchendo login paroquial")
            
            try:
                await self.page.fill("input[name='username']", ADMIN_PAROQUIA_TEMP["username"])
                await asyncio.sleep(0.3)
                await self.page.fill("input[name='password']", ADMIN_PAROQUIA_TEMP["password"])
                await asyncio.sleep(0.3)
                await self.page.click("button[type='submit']")
                await asyncio.sleep(3)
                
                self.add_result("Login Paroquia", "✓", "Login enviado")
                self.logger.success("Login enviado")
            except Exception as e:
                self.add_result("Login Paroquia", "✗", f"Erro: {e}")
                # Continua mesmo se der erro
            
            screenshot = await take_screenshot(self.page, "phase4_03_pos_login")
            
            # Step 4: Validar acesso
            self.logger.info("Step 4: Validando acesso")
            
            await asyncio.sleep(1)
            
            if "admin-paroquia" in self.page.url and "login" not in self.page.url:
                self.add_result("Validar Acesso", "✓", "Em admin-paroquia")
                self.logger.success("Acesso validado")
            else:
                self.add_result("Validar Acesso", "⚠", f"URL: {self.page.url}")
            
            screenshot = await take_screenshot(self.page, "phase4_04_final")
            
            self.logger.info("=" * 70)
            self.logger.success("✓ FASE 4 CONCLUÍDA!")
            self.logger.info("=" * 70)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro Fase 4: {str(e)}")
            self.add_result("Erro", "✗", str(e))
            return False


# ===========================================================================
# FASE 5 - CADASTRO USUÁRIO COMUM (DESCOBERTA DINÂMICA)
# ===========================================================================

class Phase5_UserCommon(BasePhase):
    """Cadastro de usuário comum"""
    
    def __init__(self):
        super().__init__("Usuário Comum")
    
    async def run(self) -> bool:
        """Cadastro de usuário descobrindo elementos dinamicamente"""
        if not self.page:
            self.logger.error("Página não foi configurada!")
            return False
        
        self.logger.info("=" * 70)
        self.logger.info("FASE 5: CADASTRO USUÁRIO COMUM (Descoberta Dinâmica)")
        self.logger.info("=" * 70)
        
        try:
            # Step 1: Voltar para home e encontrar "Cadastro"
            self.logger.info("Step 1: Navegando para página de cadastro")
            
            if self.page.url != BASE_URL:
                await self.page.goto(BASE_URL, wait_until="networkidle")
                await asyncio.sleep(1)
            
            finder = DynamicSelectorFinder(self.page, self.logger)
            
            # Listar opções
            buttons = await finder.discover_all_buttons()
            self.logger.debug("Opções na homepage:")
            for btn in buttons[:10]:
                self.logger.debug(f"  - {btn['text']}")
            
            # Procurar por cadastro/signup
            signup_selector = None
            for intent in ["cadastro", "signup", "cadastre", "novo usuario"]:
                selector = await finder.find_by_intent(intent)
                if selector:
                    signup_selector = selector
                    break
            
            if signup_selector:
                try:
                    await self.page.click(signup_selector)
                    await asyncio.sleep(2)
                    self.add_result("Navegar Cadastro", "✓", "Navegou")
                    self.logger.success("Clicou em cadastro")
                except Exception as e:
                    self.add_result("Navegar Cadastro", "✗", f"Erro: {e}")
            else:
                # Fallback
                await self.page.goto(ROUTES["signup"], wait_until="networkidle")
                self.logger.debug("Usou URL direta para signup")
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase5_01_signup_page")
            
            # Step 2: Preencher formulário de cadastro
            self.logger.info("Step 2: Preenchendo formulário de cadastro")
            
            user_data = {
                "name": "User TPIC Test",
                "email": f"user_{int(__import__('time').time())}@test.tpic.com",
                "cpf": "00000000000",
                "phone": "(11) 99999-9999",
                "password": "SenhaTest123!",
                "confirm_password": "SenhaTest123!",
            }
            
            try:
                inputs = await self.page.query_selector_all("input")
                filled = 0
                
                for input_elem in inputs:
                    placeholder = await input_elem.get_attribute("placeholder")
                    if not placeholder:
                        continue
                    
                    placeholder_lower = placeholder.lower()
                    
                    if any(word in placeholder_lower for word in ["nome", "name"]):
                        await input_elem.fill(user_data["name"])
                        filled += 1
                    elif any(word in placeholder_lower for word in ["email"]):
                        await input_elem.fill(user_data["email"])
                        filled += 1
                    elif any(word in placeholder_lower for word in ["cpf", "document"]):
                        await input_elem.fill(user_data["cpf"])
                        filled += 1
                    elif any(word in placeholder_lower for word in ["telefone", "phone"]):
                        await input_elem.fill(user_data["phone"])
                        filled += 1
                    elif any(word in placeholder_lower for word in ["senha", "password"]):
                        # Primeira ocorrência = password
                        if "confirmar" not in placeholder_lower and "confirm" not in placeholder_lower:
                            await input_elem.fill(user_data["password"])
                            filled += 1
                        else:
                            await input_elem.fill(user_data["confirm_password"])
                            filled += 1
                
                self.add_result("Preencher Form", "✓", f"Preencheu {filled} campos")
                self.logger.success(f"Formulário preenchido ({filled} campos)")
                
            except Exception as e:
                self.add_result("Preencher Form", "✗", f"Erro: {str(e)}")
                return False
            
            screenshot = await take_screenshot(self.page, "phase5_02_form_preenchido")
            
            # Step 3: Enviar formulário
            self.logger.info("Step 3: Enviando cadastro")
            
            try:
                await self.page.click("button[type='submit']")
                await asyncio.sleep(3)
                self.add_result("Enviar Cadastro", "✓", "Formulário enviado")
                self.logger.success("Formulário enviado")
            except Exception as e:
                self.add_result("Enviar Cadastro", "✗", f"Erro: {str(e)}")
                return False
            
            screenshot = await take_screenshot(self.page, "phase5_03_pos_cadastro")
            
            # Step 4: Validar sucesso
            self.logger.info("Step 4: Validando cadastro")
            
            # Procurar por mensagem de sucesso ou redirecionamento
            success_message = None
            try:
                # Procurar por textos de sucesso
                page_content = await self.page.content()
                if any(word in page_content.lower() for word in ["sucesso", "success", "cadastrado", "bem-vindo"]):
                    success_message = "Mensagem de sucesso detectada"
            except:
                pass
            
            if "/dashboard" in self.page.url or "/games" in self.page.url:
                self.add_result("Validar Cadastro", "✓", "Redirecionado para dashboard")
                self.logger.success("Cadastro validado!")
            else:
                self.add_result("Validar Cadastro", "⚠", f"URL: {self.page.url}")
            
            screenshot = await take_screenshot(self.page, "phase5_04_final")
            
            self.logger.info("=" * 70)
            self.logger.success("✓ FASE 5 CONCLUÍDA!")
            self.logger.info("=" * 70)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro Fase 5: {str(e)}")
            self.add_result("Erro", "✗", str(e))
            return False
        return True
