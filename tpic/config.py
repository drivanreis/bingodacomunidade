"""
===========================================================================
TPIC - Testador Prático de Integração Contínua
Configurações Globais
===========================================================================
"""

import os
from pathlib import Path
from datetime import datetime

# ===========================================================================
# DIRETÓRIOS
# ===========================================================================
TPIC_DIR = Path(__file__).parent
PROJECT_ROOT = TPIC_DIR.parent
REPORTS_DIR = TPIC_DIR / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"
LOGS_DIR = TPIC_DIR / "logs"

# Criar diretórios se não existirem
REPORTS_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# ===========================================================================
# URLS
# ===========================================================================
BASE_URL = "http://localhost:5173"
FRONTEND_URL = BASE_URL
BACKEND_URL = "http://localhost:8000"

# TODAS as rotas do aplicativo
# IMPORTANTE: Use estas APENAS para referência. 
# Para navegar, use CLIQUES em botões/links (como um usuário real faria)
ROUTES = {
    # Rotas Públicas
    "home": f"{BASE_URL}/",
    "login": f"{BASE_URL}/login",
    "signup": f"{BASE_URL}/signup",
    "forgot_password": f"{BASE_URL}/forgot-password",
    "reset_password": f"{BASE_URL}/reset-password",
    "verify_email": f"{BASE_URL}/verify-email",
    
    # Admin Site (Super Admin / Bootstrap)
    "admin_site": f"{BASE_URL}/admin-site",
    "admin_site_login": f"{BASE_URL}/admin-site/login",
    "admin_site_first_access": f"{BASE_URL}/admin-site/first-access-setup",
    "admin_site_dashboard": f"{BASE_URL}/admin-site/dashboard",
    "admin_site_paroquias": f"{BASE_URL}/admin-site/paroquias",
    "admin_site_users": f"{BASE_URL}/admin-site/users-admin",
    "admin_site_relatorios": f"{BASE_URL}/admin-site/relatorios",
    "admin_site_configuracoes": f"{BASE_URL}/admin-site/configuracoes",
    "admin_site_auditoria": f"{BASE_URL}/admin-site/auditoria",
    "admin_site_feedback": f"{BASE_URL}/admin-site/feedback",
    "admin_site_usuarios": f"{BASE_URL}/admin-site/usuarios",
    "admin_site_primeira_senha": f"{BASE_URL}/admin-site/primeira-senha",
    
    # Admin Paróquia
    "admin_paroquia": f"{BASE_URL}/admin-paroquia",
    "admin_paroquia_login": f"{BASE_URL}/admin-paroquia/login",
    "admin_paroquia_dashboard": f"{BASE_URL}/admin-paroquia/dashboard",
    "admin_paroquia_games": f"{BASE_URL}/admin-paroquia/games",
    "admin_paroquia_games_new": f"{BASE_URL}/admin-paroquia/games/new",
    "admin_paroquia_configuracoes": f"{BASE_URL}/admin-paroquia/configuracoes",
    "admin_paroquia_paroquia": f"{BASE_URL}/admin-paroquia/paroquia",
    "admin_paroquia_usuarios": f"{BASE_URL}/admin-paroquia/user-paroquia",
    "admin_paroquia_primeira_senha": f"{BASE_URL}/admin-paroquia/primeira-senha",
    
    # Usuário Comum (Fiel)
    "user_dashboard": f"{BASE_URL}/dashboard",
    "user_games": f"{BASE_URL}/games",
    "user_cartelas": f"{BASE_URL}/minhas-cartelas",
    "user_feedback": f"{BASE_URL}/feedback",
    "user_profile": f"{BASE_URL}/profile",
}

# Seletores para navegação por cliques (como um usuário real faria)
# Estes são botões/links que levam para cada página
NAV_SELECTORS = {
    # Em admin-site/dashboard
    "admin_site_nav_paroquias": "button:has-text('Paroquias'), a:has-text('Paroquias')",
    "admin_site_nav_users": "button:has-text('Usuários do Site'), a:has-text('Usuários')",
    "admin_site_nav_relatorios": "button:has-text('Relatórios'), a:has-text('Relatórios')",
    "admin_site_nav_configuracoes": "button:has-text('Configurações'), a:has-text('Configurações')",
    "admin_site_nav_feedback": "button:has-text('Feedback'), a:has-text('Feedback')",
    
    # Em admin-paroquia/dashboard
    "admin_paroquia_nav_games": "button:has-text('Jogos'), a:has-text('Jogos')",
    "admin_paroquia_nav_configuracoes": "button:has-text('Configurações'), a:has-text('Configurações')",
    "admin_paroquia_nav_paroquia": "button:has-text('Paróquia'), a:has-text('Paróquia')",
    "admin_paroquia_nav_usuarios": "button:has-text('Usuários'), a:has-text('Usuários')",
    
    # Logout (global)
    "logout": "button:has-text('Sair'), button:has-text('🚪'), .logout-button",
    
    # Botões de ação comuns
    "novo_button": "button:has-text('Novo'), button:has-text('Nova'), button:has-text('Criar'), button:has-text('+')",
    "voltar_button": "button:has-text('Voltar'), a:has-text('Voltar'), .back-button",
}

# ===========================================================================
# CREDENCIAIS DE TESTE
# ===========================================================================
ADMIN_DEFAULT = {
    "username": "Admin",
    "password": "admin123"
}

ADMIN_PAROQUIA_TEMP = {
    "username": "admin_paroquia",
    "password": "senha123",
    "email": "admin@paroquia.com"
}

# ===========================================================================
# CONFIGURAÇÕES DO PLAYWRIGHT
# ===========================================================================
BROWSER_CONFIG = {
    "headless": False,  # Visível (não headless)
    "slow_mo": 500,     # Delay de 500ms para visualizar ações
    "args": [
        "--start-maximized",
        "--disable-blink-features=AutomationControlled",
    ]
}

CONTEXT_CONFIG = {
    "viewport": None,  # Viewport full
    "ignore_https_errors": True,
}

# ===========================================================================
# TIMEOUTS
# ===========================================================================
DEFAULT_TIMEOUT = 30000  # 30 segundos
NAVIGATION_TIMEOUT = 60000  # 60 segundos
LOAD_PAGE_TIMEOUT = 45000  # 45 segundos

# ===========================================================================
# LOGS E RELATÓRIOS
# ===========================================================================
LOG_TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
REPORT_FILE = REPORTS_DIR / f"report_{LOG_TIMESTAMP}.html"
LOG_FILE = LOGS_DIR / f"tpic_{LOG_TIMESTAMP}.log"

# ===========================================================================
# PHASES
# ===========================================================================
PHASES = {
    "1": "setup",
    "2": "admin_default",
    "3": "admin_paroquia_create",
    "4": "admin_paroquia_login",
    "5": "user_common",
}

# ===========================================================================
# SCRIPTS DE SETUP
# ===========================================================================
SETUP_SCRIPTS = {
    "clean": PROJECT_ROOT / "limpa.sh",
    "install": PROJECT_ROOT / "install.sh",
    "start": PROJECT_ROOT / "start.sh",
}
