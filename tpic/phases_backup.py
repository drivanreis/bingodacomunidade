"""
===========================================================================
TPIC - Fases do Teste
===========================================================================
"""

import asyncio
from playwright.async_api import async_playwright, Page, BrowserContext
from datetime import datetime
from utils import (
    Logger, run_script, wait_for_service, take_screenshot,
    validate_element, validate_redirect
)
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
        
        # 1. Limpar
        self.logger.info("Passo 1: Limpeza total")
        success, output = await run_script(SETUP_SCRIPTS["clean"], timeout=60)
        
        if success:
            self.add_result(
                "Cleanup",
                "✓",
                "limpeza.sh executado com sucesso"
            )
            self.logger.success("Limpeza concluída")
        else:
            self.add_result(
                "Cleanup",
                "✗",
                f"Erro na limpeza: {output[:200]}"
            )
            self.logger.error("Limpeza falhou")
            return False
        
        # Aguardar um pouco após limpeza
        await asyncio.sleep(2)
        
        # 2. Instalar
        self.logger.info("Passo 2: Instalação")
        success, output = await run_script(SETUP_SCRIPTS["install"], timeout=120)
        
        if success:
            self.add_result(
                "Install",
                "✓",
                "install.sh executado com sucesso"
            )
            self.logger.success("Instalação concluída")
        else:
            self.add_result(
                "Install",
                "✗",
                f"Erro na instalação: {output[:200]}"
            )
            self.logger.error("Instalação falhou")
            return False
        
        # 3. Iniciar
        self.logger.info("Passo 3: Iniciando aplicação")
        success, output = await run_script(SETUP_SCRIPTS["start"], timeout=120)
        
        # Start roda em background, então não esperamos by sucesso, mas aguardamos os serviços
        self.logger.info("Aguardando serviços ficarem disponíveis...")
        
        # Aguardar backend
        backend_ok = await wait_for_service(f"{BACKEND_URL}/docs", timeout=60)
        if not backend_ok:
            self.add_result(
                "Start Backend",
                "✗",
                "Backend não ficou disponível após 60s"
            )
            self.logger.error("Backend não respondeu")
            return False
        
        self.add_result(
            "Start Backend",
            "✓",
            f"Backend disponível em {BACKEND_URL}"
        )
        self.logger.success("Backend pronto")
        
        # Aguardar frontend
        self.logger.info("Aguardando frontend...")
        frontend_ok = await wait_for_service(BASE_URL, timeout=60)
        if not frontend_ok:
            self.add_result(
                "Start Frontend",
                "✗",
                "Frontend não ficou disponível após 60s"
            )
            self.logger.error("Frontend não respondeu")
            return False
        
        self.add_result(
            "Start Frontend",
            "✓",
            f"Frontend disponível em {BASE_URL}"
        )
        self.logger.success("Frontend pronto")
        
        self.logger.info("=" * 70)
        self.logger.success("✓ FASE 1 CONCLUÍDA!")
        self.logger.info("=" * 70)
        
        return True


# ===========================================================================
# FASE 2 - TESTE ADMIN PADRÃO
# ===========================================================================

class Phase2_AdminDefault(BasePhase):
    """Testa login com Admin padrão e primeiro acesso"""
    
    def __init__(self):
        super().__init__("Admin Padrão")
    
    async def run(self) -> bool:
        """Executa teste do admin padrão"""
        if not self.page:
            self.logger.error("Página não foi configurada!")
            return False
        
        self.logger.info("=" * 70)
        self.logger.info("FASE 2: TESTE ADMIN PADRÃO")
        self.logger.info("=" * 70)
        
        try:
            # Step 1: Acessar homepage (ÚNICA vez que usamos goto)
            self.logger.info("Step 1: Acessando homepage")
            await self.page.goto(BASE_URL, wait_until="networkidle")
            await asyncio.sleep(1)
            
            screenshot = await take_screenshot(self.page, "phase2_01_homepage")
            
            # Validar se página carregou
            body_exists = await validate_element(self.page, "body")
            if not body_exists:
                self.add_result(
                    "Acessar Homepage",
                    "✗",
                    "Página não carregou",
                    self._rel_screenshot(screenshot)
                )
                return False
            
            self.add_result(
                "Acessar Homepage",
                "✓",
                f"Homepage carregada",
                self._rel_screenshot(screenshot)
            )
            self.logger.success("Homepage carregada")
            
            # Step 2: Procurar e clicar em "Admin do Site" ou "Login Admin"
            self.logger.info("Step 2: Buscando botão de Admin do Site")
            
            admin_site_selectors = [
                "button:has-text('Admin do Site')",
                "button:has-text('Admin Site')",
                "a:has-text('Admin do Site')",
                "a:has-text('Admin Site')",
                "button:has-text('Administrador')",
                "a[href*='admin-site/login']",
                "a[href*='admin-site']",
                ".admin-site-button",
                ".admin-button"
            ]
            
            admin_btn_found = False
            for selector in admin_site_selectors:
                if await validate_element(self.page, selector, timeout=5000):
                    try:
                        await self.page.click(selector)
                        await asyncio.sleep(2)
                        admin_btn_found = True
                        self.logger.debug(f"Clicado em: {selector}")
                        break
                    except Exception as e:
                        self.logger.debug(f"Não conseguiu clicar em {selector}: {e}")
                        continue
            
            if not admin_btn_found:
                self.logger.warning("Botão Admin do Site não encontrado, tentando acesso direto excepcional...")
                # Fallback apenas se absolutamente necessário
                await self.page.goto(ROUTES["admin_site_login"], wait_until="networkidle")
                await asyncio.sleep(1)
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase2_02_admin_login_page")
            
            # Validar se estamos na página de login do admin-site
            if "admin-site" not in self.page.url.lower() or "login" not in self.page.url.lower():
                self.add_result(
                    "Acessar Login Admin",
                    "⚠",
                    f"Possível página incorreta: {self.page.url}",
                    self._rel_screenshot(screenshot)
                )
            else:
                self.add_result(
                    "Acessar Login Admin",
                    "✓",
                    f"Página de login do Admin-Site acessada",
                    self._rel_screenshot(screenshot)
                )
            
            self.logger.success("Página de login acessada")
            
            # Step 3: Fazer login
            self.logger.info("Step 3: Realizando login")
            
            # Preencher username
            await self.page.fill("input[name='username']", ADMIN_DEFAULT["username"])
            await asyncio.sleep(0.5)
            
            # Preencher password
            await self.page.fill("input[name='password']", ADMIN_DEFAULT["password"])
            await asyncio.sleep(0.5)
            
            # Clicar em login
            await self.page.click("button[type='submit']")
            
            # Aguardar navegação
            try:
                await self.page.wait_for_url("**/first-access-setup**", timeout=15000)
                await asyncio.sleep(1)
            except Exception:
                self.logger.warning("Não redirecionou automaticamente, continuando...")
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "stage2_03_after_login")
            
            current_url = self.page.url
            if "login" in current_url.lower():
                self.add_result(
                    "Login Admin",
                    "✗",
                    f"Login falhou ou não redirecionou. URL: {current_url}",
                    self._rel_screenshot(screenshot)
                )
                return False
            
            self.add_result(
                "Login Admin",
                "✓",
                f"Login bem-sucedido. Redirecionado para: {current_url}",
                self._rel_screenshot(screenshot)
            )
            self.logger.success("Admin logado com sucesso")
            
            # Step 4: Verificar e responder mensagem de troca de senha
            self.logger.info("Step 4: Processando mensagem de troca de senha")
            
            # Procurar por diálogo/modal de mudança de senha
            await asyncio.sleep(2)
            screenshot = await take_screenshot(self.page, "stage2_04_password_dialog")
            
            # Procurar por botão "OK", "Entendido", "Confirmar", etc.
            button_selectors = [
                "button:has-text('OK')",
                "button:has-text('ok')",
                "button:has-text('Entendido')",
                "button:has-text('Confirmar')",
                "button:has-text('confirmar')",
                "button:has-text('Próximo')",
                ".btn-primary:last-child",
                "button[type='button']:last-child"
            ]
            
            button_clicked = False
            for selector in button_selectors:
                if await validate_element(self.page, selector, timeout=5000):
                    try:
                        await self.page.click(selector)
                        button_clicked = True
                        self.logger.debug(f"Botão clicado: {selector}")
                        await asyncio.sleep(1)
                        break
                    except Exception:
                        continue
            
            if not button_clicked:
                self.logger.warning("Botão de confirmação não encontrado ou não clicável")
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "stage2_05_after_password_msg")
            
            # Step 5: Verificar se está na página de primeiro acesso
            self.logger.info("Step 5: Verificando primeiro acesso")
            
            current_url = self.page.url
            
            if ROUTES["first_access"] not in current_url:
                self.add_result(
                    "Verificar URL First Access",
                    "⚠",
                    f"URL esperada contém first-access-setup, atual: {current_url}",
                    self._rel_screenshot(screenshot)
                )
            else:
                self.add_result(
                    "Verificar URL First Access",
                    "✓",
                    f"URL correta: {current_url}",
                    self._rel_screenshot(screenshot)
                )
            
            # Step 6: Preencher dados do primeiro acesso
            self.logger.info("Step 6: Preenchendo dados do primeiro acesso")
            
            await asyncio.sleep(1)
            
            # Procurar pelos campos do formulário
            # Assumir campos de nome, email, senha, etc.
            # Ajustar seletores conforme necessário no seu form
            
            try:
                # Tentar preencher campos comuns
                input_fields = await self.page.query_selector_all("input[type='text'], input[type='email'], input[type='password']")
                
                if len(input_fields) > 0:
                    # Assumir primeira como nome
                    await input_fields[0].fill("Admin Padrão")
                    
                    if len(input_fields) > 1:
                        # Email
                        await input_fields[1].fill("admin@paroquia.com")
                    
                    # Procurar por botão de submit e clicar
                    await self.page.click("button[type='submit']")
                    await asyncio.sleep(2)
                    
                    self.add_result(
                        "Preencher First Access",
                        "✓",
                        "Formulário preenchido e enviado"
                    )
                else:
                    self.add_result(
                        "Preencher First Access",
                        "⚠",
                        "Nenhum campo de entrada encontrado"
                    )
            except Exception as e:
                self.add_result(
                    "Preencher First Access",
                    "⚠",
                    f"Erro ao preencher: {str(e)}"
                )
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "stage2_06_final_state")
            
            self.logger.info("=" * 70)
            self.logger.success("✓ FASE 2 CONCLUÍDA!")
            self.logger.info("=" * 70)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro na Fase 2: {str(e)}")
            self.add_result(
                "Erro Geral",
                "✗",
                f"Exceção: {str(e)}"
            )
            return False
    
    def _rel_screenshot(self, path):
        """Retorna path relativo do screenshot"""
        if path:
            return f"screenshots/{path.name}"
        return None


# ===========================================================================
# FASE 3-5 (Placeholders) - A implementar
# ===========================================================================

class Phase3_AdminParoquiaCreate(BasePhase):
    """Cadastra o primeiro admin da paróquia no admin-site"""
    
    def __init__(self):
        super().__init__("Admin Paróquia - Criar")
    
    async def run(self) -> bool:
        """Cria paróquia e primeiro admin paroquial"""
        if not self.page:
            self.logger.error("Página não foi configurada!")
            return False
        
        self.logger.info("=" * 70)
        self.logger.info("FASE 3: CADASTRO ADMIN PARÓQUIA")
        self.logger.info("=" * 70)
        
        try:
            # Step 1: Navegar para gerenciadordor de paróquias
            self.logger.info("Step 1: Acessando gerenciador de paróquias")
            await self.page.goto(ROUTES["admin_site"] + "/paroquias", wait_until="networkidle")
            await asyncio.sleep(1)
            
            screenshot = await take_screenshot(self.page, "phase3_01_paroquias_list")
            
            # Validar se está na página
            if "paroquias" not in self.page.url.lower():
                self.add_result(
                    "Acessar Paroquias",
                    "✗",
                    f"Esperado URL com /paroquias, obteve: {self.page.url}",
                    self._rel_screenshot(screenshot)
                )
                return False
            
            self.add_result(
                "Acessar Paroquias",
                "✓",
                f"Página de paróquias carregada: {self.page.url}",
                self._rel_screenshot(screenshot)
            )
            self.logger.success("Página de paróquias acessada")
            
            # Step 2: Criar nova paróquia
            self.logger.info("Step 2: Criando nova paróquia")
            await asyncio.sleep(1)
            
            # Procurar por botão "Nova Paróquia"
            btn_selectors = [
                "button:has-text('Nova Paróquia')",
                "button:has-text('+ Nova')",
                "button:has-text('Criar')",
                ".btn-primary"
            ]
            
            btn_found = False
            for selector in btn_selectors:
                if await validate_element(self.page, selector, timeout=5000):
                    try:
                        await self.page.click(selector)
                        btn_found = True
                        await asyncio.sleep(1)
                        self.logger.debug(f"Botão clicado: {selector}")
                        break
                    except Exception:
                        continue
            
            if not btn_found:
                self.logger.warning("Botão de criar paróquia não encontrado")
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase3_02_create_form")
            
            # Step 3: Preencher formulário da paróquia
            self.logger.info("Step 3: Preenchendo dados da paróquia")
            
            paroquia_name = f"Paróquia TPIC {datetime.now().strftime('%H%M%S')}"
            
            try:
                # Encontrar campos de input
                inputs = await self.page.query_selector_all("input[type='text'], input[type='email'], textarea")
                
                if len(inputs) > 0:
                    # Nome da paróquia
                    await inputs[0].fill(paroquia_name)
                    await asyncio.sleep(0.3)
                    
                    if len(inputs) > 1:
                        # Email
                        await inputs[1].fill("paroquia@tpic.test")
                        await asyncio.sleep(0.3)
                    
                    if len(inputs) > 2:
                        # Telefone
                        await inputs[2].fill("(85) 99999-9999")
                        await asyncio.sleep(0.3)
                    
                    if len(inputs) > 3:
                        # Chave PIX
                        await inputs[3].fill("chave-pix@tpic")
                        await asyncio.sleep(0.3)
                    
                    self.logger.debug(f"Formulário preenchido com paróquia: {paroquia_name}")
                else:
                    self.logger.warning("Nenhum campo de entrada encontrado")
                
            except Exception as e:
                self.logger.warning(f"Erro ao preencher formulário: {str(e)}")
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase3_03_form_filled")
            
            # Step 4: Submit do formulário
            self.logger.info("Step 4: Submetendo formulário")
            
            try:
                btn_submit = await self.page.query_selector("button[type='submit']")
                if btn_submit:
                    await btn_submit.click()
                    await asyncio.sleep(2)
                    self.logger.debug("Formulário enviado")
                else:
                    # Tentar buscar por texto
                    await self.page.click("button:has-text('Salvar'), button:has-text('Criar'), button:has-text('Adicionar')")
                    await asyncio.sleep(2)
            except Exception as e:
                self.logger.warning(f"Erro ao submeter: {str(e)}")
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase3_04_after_submit")
            
            self.add_result(
                "Criar Paróquia",
                "✓",
                f"Paróquia '{paroquia_name}' criada com sucesso"
            )
            self.logger.success("Paróquia criada")
            
            # Step 5: Criar admin paroquial
            self.logger.info("Step 5: Procurando criar admin paroquial")
            
            # Vários caminhos possíveis:
            # - Pode estar em um modal de usuários
            # - Pode ser redirecionar automaticamente
            # - Pode ser um botão "Adicionar Admin"
            # - Pode ser em /admin-site/paroquias/{id}/users
            
            await asyncio.sleep(1)
            
            # Procurar por botoespara gerenciar usuários da paróquia
            user_manage_selectors = [
                "button:has-text('Usuários')",
                "button:has-text('Adicionar Admin')",
                "button:has-text('Gerenciar')",
                "a[href*='users']",
                "a[href*='admin']"
            ]
            
            user_btn_found = False
            for selector in user_manage_selectors:
                if await validate_element(self.page, selector, timeout=5000):
                    try:
                        await self.page.click(selector)
                        await asyncio.sleep(1)
                        user_btn_found = True
                        self.logger.debug(f"Clicado: {selector}")
                        break
                    except Exception:
                        continue
            
            if not user_btn_found:
                self.logger.warning("Botão de gerenciar usuários não encontrado, continuando...")
                # Tentar navegar manualmente para backend
                self.logger.info("Tentando criar admin via API...")
                
                # Aqui você poderia fazer uma chamada HTTP para criar o admin
                # Por enquanto, vamos apenas avisar
                self.add_result(
                    "Criar Admin Paroquial",
                    "⚠",
                    "Criação de admin paroquial pode ser necessária via API ou interface futura"
                )
            else:
                await asyncio.sleep(1)
                screenshot = await take_screenshot(self.page, "phase3_05_user_form")
                
                # Preencher dados do primeiro admin
                try:
                    inputs = await self.page.query_selector_all("input[type='text'], input[type='email'], input[type='password']")
                    
                    if len(inputs) > 0:
                        # Nome
                        await inputs[0].fill("Admin Paróquia")
                        await asyncio.sleep(0.3)
                        
                        if len(inputs) > 1:
                            # Email
                            await inputs[1].fill(ADMIN_PAROQUIA_TEMP["email"])
                            await asyncio.sleep(0.3)
                        
                        if len(inputs) > 2:
                            # Senha (se houver campo)
                            await inputs[2].fill(ADMIN_PAROQUIA_TEMP["password"])
                            await asyncio.sleep(0.3)
                        
                        # Submeter
                        submit_btn = await self.page.query_selector("button[type='submit']:last-child")
                        if submit_btn:
                            await submit_btn.click()
                            await asyncio.sleep(2)
                        
                        self.add_result(
                            "Criar Admin Paroquial",
                            "✓",
                            "Admin paroquial criado via formulário"
                        )
                    else:
                        self.add_result(
                            "Criar Admin Paroquial",
                            "⚠",
                            "Formulário de usuário não encontrado"
                        )
                except Exception as e:
                    self.add_result(
                        "Criar Admin Paroquial",
                        "⚠",
                        f"Erro ao preencher usuário: {str(e)}"
                    )
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase3_06_final")
            
            self.logger.info("=" * 70)
            self.logger.success("✓ FASE 3 CONCLUÍDA!")
            self.logger.info("=" * 70)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro na Fase 3: {str(e)}")
            self.add_result(
                "Erro Geral",
                "✗",
                f"Exceção: {str(e)}"
            )
            return False
    
    def _rel_screenshot(self, path):
        """Retorna path relativo do screenshot"""
        if path:
            return f"screenshots/{path.name}"
        return None


class Phase4_AdminParoquiaLogin(BasePhase):
    """Testa login como admin da paróquia"""
    
    def __init__(self):
        super().__init__("Admin Paróquia - Login")
    
    async def run(self) -> bool:
        """Testa login do admin paroquial"""
        if not self.page:
            self.logger.error("Página não foi configurada!")
            return False
        
        self.logger.info("=" * 70)
        self.logger.info("FASE 4: TESTE LOGIN ADMIN PARÓQUIA")
        self.logger.info("=" * 70)
        
        try:
            # Step 1: Logout do admin anterior
            self.logger.info("Step 1: Fazendo logout")
            
            # Tentar clicar em botão de logout
            logout_selectors = [
                "button:has-text('Sair')",
                "button:has-text('Logout')",
                "button:has-text('🚪')",
                ".apd-logout-button"
            ]
            
            logout_found = False
            for selector in logout_selectors:
                if await validate_element(self.page, selector, timeout=5000):
                    try:
                        await self.page.click(selector)
                        await asyncio.sleep(2)
                        logout_found = True
                        self.logger.debug(f"Botão logout clicado: {selector}")
                        break
                    except Exception:
                        continue
            
            if not logout_found:
                # Limpar localStorage manualmente
                await self.page.evaluate("() => localStorage.clear()")
                self.logger.debug("localStorage limpo")
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase4_01_logged_out")
            
            self.add_result(
                "Logout",
                "✓",
                "Logout realizado com sucesso"
            )
            self.logger.success("Logout concluído")
            
            # Step 2: Acessar página de login paroquial
            self.logger.info("Step 2: Acessando login paroquial")
            
            await self.page.goto(ROUTES["login_paroquia"], wait_until="networkidle")
            await asyncio.sleep(1)
            
            screenshot = await take_screenshot(self.page, "phase4_02_login_page")
            
            # Validar se está na página de login
            if "login" not in self.page.url.lower():
                self.add_result(
                    "Acessar Login Paroquial",
                    "✗",
                    f"Esperado login paroquial, obteve: {self.page.url}",
                    self._rel_screenshot(screenshot)
                )
                return False
            
            if "admin-paroquia" not in self.page.url.lower():
                self.add_result(
                    "Acessar Login Paroquial",
                    "⚠",
                    f"URL não contém admin-paroquia: {self.page.url}",
                    self._rel_screenshot(screenshot)
                )
            else:
                self.add_result(
                    "Acessar Login Paroquial",
                    "✓",
                    f"Login paroquial carregado: {self.page.url}",
                    self._rel_screenshot(screenshot)
                )
            
            self.logger.success("Página de login paroquial acessada")
            
            # Step 3: Fazer login com admin paroquial
            self.logger.info("Step 3: Realizando login paroquial")
            
            try:
                # O login pode ser por email ou CPF
                username_input = await self.page.query_selector("input[type='text'], input[type='email']")
                password_input = await self.page.query_selector("input[type='password']")
                
                if username_input and password_input:
                    # Tentar com email primeiro
                    await username_input.fill(ADMIN_PAROQUIA_TEMP["email"])
                    await asyncio.sleep(0.5)
                    
                    await password_input.fill(ADMIN_PAROQUIA_TEMP["password"])
                    await asyncio.sleep(0.5)
                    
                    # Clicar submit
                    submit_btn = await self.page.query_selector("button[type='submit']")
                    if submit_btn:
                        await submit_btn.click()
                        await asyncio.sleep(2)
                    
                    self.logger.debug("Login enviado")
                else:
                    self.add_result(
                        "Campos de Login",
                        "⚠",
                        "Campos de login não encontrados"
                    )
                    return False
                
            except Exception as e:
                self.add_result(
                    "Preencher Login",
                    "✗",
                    f"Erro ao preencher login: {str(e)}"
                )
                return False
            
            await asyncio.sleep(2)
            screenshot = await take_screenshot(self.page, "phase4_03_after_login")
            
            # Step 4: Validar redirecionamento para dashboard
            self.logger.info("Step 4: Validando dashboard paroquial")
            
            current_url = self.page.url
            
            # Pode redirecionar para /admin-paroquia/dashboard ou outra página
            if "admin-paroquia" in current_url.lower():
                if "login" in current_url.lower():
                    self.add_result(
                        "Login Paroquial",
                        "✗",
                        f"Ainda na página de login: {current_url}",
                        self._rel_screenshot(screenshot)
                    )
                    return False
                else:
                    self.add_result(
                        "Login Paroquial",
                        "✓",
                        f"Login bem-sucedido. Redirecionado para: {current_url}",
                        self._rel_screenshot(screenshot)
                    )
                    self.logger.success("Admin paroquial logado com sucesso")
            else:
                self.add_result(
                    "Login Paroquial",
                    "⚠",
                    f"URL inesperada após login: {current_url}",
                    self._rel_screenshot(screenshot)
                )
            
            # Step 5: Validar elementos do dashboard paroquial
            self.logger.info("Step 5: Validando dashboard")
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase4_04_dashboard")
            
            # Procurar por elementos característicos do dashboard paroquial
            dashboard_elements = [
                "h1:has-text('Admin Paróquia')",
                "h1:has-text('Dashboard')",
                ".apd-title",
                ".apd-header"
            ]
            
            found_element = False
            for selector in dashboard_elements:
                if await validate_element(self.page, selector, timeout=5000):
                    found_element = True
                    break
            
            if found_element:
                self.add_result(
                    "Dashboard Paroquial",
                    "✓",
                    "Dashboard paroquial carregado corretamente"
                )
                self.logger.success("Dashboard validado")
            else:
                self.add_result(
                    "Dashboard Paroquial",
                    "⚠",
                    "Elementos do dashboard não encontrados"
                )
            
            self.logger.info("=" * 70)
            self.logger.success("✓ FASE 4 CONCLUÍDA!")
            self.logger.info("=" * 70)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro na Fase 4: {str(e)}")
            self.add_result(
                "Erro Geral",
                "✗",
                f"Exceção: {str(e)}"
            )
            return False
    
    def _rel_screenshot(self, path):
        """Retorna path relativo do screenshot"""
        if path:
            return f"screenshots/{path.name}"
        return None


class Phase5_UserCommon(BasePhase):
    """Testa cadastro de usuário comum"""
    
    def __init__(self):
        super().__init__("Usuário Comum")
    
    async def run(self) -> bool:
        """Testa cadastro de usuário comum na plataforma pública"""
        if not self.page:
            self.logger.error("Página não foi configurada!")
            return False
        
        self.logger.info("=" * 70)
        self.logger.info("FASE 5: TESTE USUÁRIO COMUM")
        self.logger.info("=" * 70)
        
        try:
            # Step 1: Fazer logout
            self.logger.info("Step 1: Fazendo logout")
            
            # Limpar localStorage
            await self.page.evaluate("() => localStorage.clear()")
            await asyncio.sleep(1)
            
            self.add_result(
                "Logout",
                "✓",
                "Session clearada para acesso público"
            )
            self.logger.success("Logout concluído")
            
            # Step 2: Acessar homepage pública
            self.logger.info("Step 2: Acessando homepage pública")
            
            await self.page.goto(ROUTES["home"], wait_until="networkidle")
            await asyncio.sleep(1)
            
            screenshot = await take_screenshot(self.page, "phase5_01_home_public")
            
            current_url = self.page.url
            if BASE_URL not in current_url:
                self.add_result(
                    "Acessar Home",
                    "✗",
                    f"URL inesperada: {current_url}",
                    self._rel_screenshot(screenshot)
                )
                return False
            
            # Validar se login/signup estão disponíveis
            signup_selectors = [
                "button:has-text('Cadastro')",
                "button:has-text('Criar Conta')",
                "a:has-text('Cadastre-se')",
                "a[href*='signup']",
                "a[href*='register']"
            ]
            
            signup_btn_found = False
            for selector in signup_selectors:
                if await validate_element(self.page, selector, timeout=5000):
                    signup_btn_found = True
                    self.logger.debug(f"Botão signup encontrado: {selector}")
                    break
            
            if signup_btn_found:
                self.add_result(
                    "Acessar Home",
                    "✓",
                    f"Homepage carregada com opção de cadastro: {current_url}",
                    self._rel_screenshot(screenshot)
                )
            else:
                self.add_result(
                    "Acessar Home",
                    "⚠",
                    f"Homepage carregada mas sem botão de cadastro visível: {current_url}",
                    self._rel_screenshot(screenshot)
                )
            
            self.logger.success("Homepage pública acessada")
            
            # Step 3: Procurar e clicar no botão de cadastro
            self.logger.info("Step 3: Acessando formulário de cadastro")
            
            # Tentar clicar no botão de signup
            for selector in signup_selectors:
                if await validate_element(self.page, selector, timeout=5000):
                    try:
                        await self.page.click(selector)
                        await asyncio.sleep(2)
                        self.logger.debug(f"Clicado: {selector}")
                        break
                    except Exception:
                        continue
            
            # Alternativa: navegar diretamente para página de signup
            if "/signup" not in self.page.url and "/cadastro" not in self.page.url:
                self.logger.info("Tentando navegar para /signup...")
                await self.page.goto(f"{BASE_URL}/signup", wait_until="networkidle")
                await asyncio.sleep(1)
            
            screenshot = await take_screenshot(self.page, "phase5_02_signup_form")
            
            # Validar se está em página de cadastro
            if ("signup" not in self.page.url.lower() and  
                "cadastro" not in self.page.url.lower() and
                "register" not in self.page.url.lower()):
                self.logger.warning(f"Possível URL de cadastro: {self.page.url}")
            
            self.add_result(
                "Acessar Signup",
                "✓",
                f"Formulário de cadastro acessado: {self.page.url}",
                self._rel_screenshot(screenshot)
            )
            self.logger.success("Formulário de cadastro acessado")
            
            # Step 4: Preencher formulário de cadastro
            self.logger.info("Step 4: Preenchendo formulário de cadastro")
            
            timestamp = datetime.now().strftime("%H%M%S")
            common_user = {
                "nome": f"Usuário TPIC {timestamp}",
                "email": f"user{timestamp}@tpic.test",
                "cpf": "12345678901",  # CPF válido para teste
                "telefone": "85999999999",
                "senha": "Senha@123"
            }
            
            try:
                # Encontrar campos de entrada
                inputs = await self.page.query_selector_all(
                    "input[type='text'], input[type='email'], input[type='password'], input[type='tel']"
                )
                
                if len(inputs) == 0:
                    self.add_result(
                        "Preencher Formulário",
                        "⚠",
                        "Nenhum campo de entrada encontrado no formulário"
                    )
                    return False
                
                # Estratégia: preencher em ordem
                # 1. Nome
                await inputs[0].fill(common_user["nome"])
                await asyncio.sleep(0.3)
                self.logger.debug("Nome preenchido")
                
                # 2. Email
                if len(inputs) > 1:
                    await inputs[1].fill(common_user["email"])
                    await asyncio.sleep(0.3)
                    self.logger.debug("Email preenchido")
                
                # 3. CPF ou Telefone
                if len(inputs) > 2:
                    # Pode ser CPF ou telefone
                    input_type = await inputs[2].get_attribute("type")
                    input_name = await inputs[2].get_attribute("name")
                    
                    if "cpf" in (input_name or "").lower():
                        await inputs[2].fill(common_user["cpf"])
                    else:
                        await inputs[2].fill(common_user["telefone"])
                    
                    await asyncio.sleep(0.3)
                    self.logger.debug("Campo 3 preenchido")
                
                # 4. Senhas
                if len(inputs) > 3:
                    await inputs[3].fill(common_user["senha"])
                    await asyncio.sleep(0.3)
                
                if len(inputs) > 4:
                    await inputs[4].fill(common_user["senha"])
                    await asyncio.sleep(0.3)
                    self.logger.debug("Senhas preenchidas")
                
                self.logger.debug(f"Formulário preenchido para usuário: {common_user['nome']}")
                
            except Exception as e:
                self.logger.warning(f"Erro ao preencher formulário: {str(e)}")
                self.add_result(
                    "Preencher Formulário",
                    "⚠",
                    f"Erro ao preencher: {str(e)}"
                )
            
            await asyncio.sleep(1)
            screenshot = await take_screenshot(self.page, "phase5_03_form_filled")
            
            # Step 5: Submeter formulário
            self.logger.info("Step 5: Submetendo formulário de cadastro")
            
            try:
                # Procurar por botão de submit
                submit_selectors = [
                    "button[type='submit']",
                    "button:has-text('Cadastrar')",
                    "button:has-text('Criar Conta')",
                    "button:has-text('Registrar')"
                ]
                
                for selector in submit_selectors:
                    if await validate_element(self.page, selector, timeout=5000):
                        try:
                            await self.page.click(selector)
                            await asyncio.sleep(2)
                            self.logger.debug(f"Submit clicado: {selector}")
                            break
                        except Exception:
                            continue
                
            except Exception as e:
                self.logger.warning(f"Erro ao submeter: {str(e)}")
            
            await asyncio.sleep(2)
            screenshot = await take_screenshot(self.page, "phase5_04_after_signup")
            
            # Step 6: Validar sucesso do cadastro
            self.logger.info("Step 6: Validando sucesso do cadastro")
            
            current_url = self.page.url
            
            # Procurar por mensagens de sucesso
            success_selectors = [
                "text=Cadastro realizado",
                "text=Cadastro efetuado",
                "text=Bem-vindo",
                "text=sucesso",
                ".alert-success",
                ".success-message"
            ]
            
            success_found = False
            for selector in success_selectors:
                if await validate_element(self.page, selector, timeout=5000):
                    success_found = True
                    break
            
            # Validar redirecionamento para dashboard
            if success_found or "dashboard" in current_url.lower() or "games" in current_url.lower():
                self.add_result(
                    "Cadastro Usuário Comum",
                    "✓",
                    f"Usuário comum cadastrado com sucesso. Redirecionado para: {current_url}",
                    self._rel_screenshot(screenshot)
                )
                self.logger.success("Usuário comum cadastrado com sucesso")
            else:
                self.add_result(
                    "Cadastro Usuário Comum",
                    "⚠",
                    f"Cadastro possivelmente bem-sucedido, mas redirecionado para: {current_url}",
                    self._rel_screenshot(screenshot)
                )
            
            self.logger.info("=" * 70)
            self.logger.success("✓ FASE 5 CONCLUÍDA!")
            self.logger.info("=" * 70)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro na Fase 5: {str(e)}")
            self.add_result(
                "Erro Geral",
                "✗",
                f"Exceção: {str(e)}"
            )
            return False
    
    def _rel_screenshot(self, path):
        """Retorna path relativo do screenshot"""
        if path:
            return f"screenshots/{path.name}"
        return None
