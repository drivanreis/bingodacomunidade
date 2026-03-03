"""
🔐 Serviço de Envio de Email
Sistema de Bingo da Comunidade

Gerencia o envio de emails para recuperação de senha e notificações.
"""

import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
import base64
import hashlib

from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from src.models.models import Configuracao

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço de envio de emails"""

    def __init__(self):
        # Configurações de email (variáveis de ambiente)
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_security = os.getenv("SMTP_SECURITY", "tls")
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.from_name = os.getenv("FROM_NAME", "Bingo da Comunidade")

        # Frontend URL para links
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

        # Modo de desenvolvimento (não envia email real)
        self.dev_mode = os.getenv("EMAIL_DEV_MODE", "true").lower() == "true"

    @staticmethod
    def _to_bool(value: str | bool | None, default: bool) -> bool:
        if value is None:
            return default
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}

    @staticmethod
    def _to_int(value: str | None, default: int) -> int:
        try:
            return int(str(value).strip()) if value is not None else default
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _normalize_smtp_security(value: str | None, default: str = "tls") -> str:
        security = (value or default).strip().lower()
        if security not in {"tls", "ssl", "none"}:
            return default
        return security

    @staticmethod
    def _sanitize_app_password(value: str | None) -> str:
        if not value:
            return ""
        return value.replace(" ", "").strip()

    @staticmethod
    def _mask_secret() -> str:
        return "********"

    @staticmethod
    def _normalize_secret_seed() -> str:
        return (
            os.getenv("SMTP_CONFIG_SECRET")
            or os.getenv("JWT_SECRET_KEY")
            or "smtp-config-secret-change-in-production"
        )

    def _get_fernet(self) -> Fernet:
        seed = self._normalize_secret_seed().encode("utf-8")
        key = base64.urlsafe_b64encode(hashlib.sha256(seed).digest())
        return Fernet(key)

    def encrypt_secret(self, plain_text: str) -> str:
        if not plain_text:
            return ""
        return self._get_fernet().encrypt(plain_text.encode("utf-8")).decode("utf-8")

    def decrypt_secret(self, encrypted_text: str) -> str:
        if not encrypted_text:
            return ""
        try:
            return self._get_fernet().decrypt(encrypted_text.encode("utf-8")).decode("utf-8")
        except Exception:
            logger.warning("⚠️ Valor de smtpPasswordEncrypted não pôde ser decriptado")
            return ""

    def is_sensitive_config_key(self, key: str) -> bool:
        return key == "smtpPasswordEncrypted"

    def mask_if_sensitive(self, key: str, value: str) -> str:
        if self.is_sensitive_config_key(key):
            return self._mask_secret() if value else ""
        return value

    def _load_runtime_settings(self, db: Optional[Session] = None) -> dict:
        settings = {
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "smtp_security": self._normalize_smtp_security(self.smtp_security),
            "smtp_user": self.smtp_user,
            "smtp_password": self.smtp_password,
            "from_email": self.from_email,
            "from_name": self.from_name,
            "frontend_url": self.frontend_url,
            "dev_mode": self.dev_mode,
        }

        if not db:
            return settings

        try:
            keys = [
                "emailDevMode",
                "smtpHost",
                "smtpPort",
                "smtpSecurity",
                "smtpUser",
                "smtpPasswordEncrypted",
                "fromEmail",
                "fromName",
                "frontendUrl",
            ]
            configs = db.query(Configuracao).filter(Configuracao.chave.in_(keys)).all()
            config_map = {c.chave: c.valor for c in configs}

            settings["dev_mode"] = self._to_bool(
                config_map.get("emailDevMode"), settings["dev_mode"]
            )
            settings["smtp_host"] = config_map.get("smtpHost") or settings["smtp_host"]
            settings["smtp_port"] = self._to_int(config_map.get("smtpPort"), settings["smtp_port"])
            settings["smtp_security"] = self._normalize_smtp_security(
                config_map.get("smtpSecurity"),
                settings["smtp_security"],
            )
            settings["smtp_user"] = config_map.get("smtpUser") or settings["smtp_user"]
            decrypted = self.decrypt_secret(config_map.get("smtpPasswordEncrypted", ""))
            settings["smtp_password"] = decrypted or settings["smtp_password"]
            settings["from_email"] = config_map.get("fromEmail") or settings["from_email"]
            settings["from_name"] = config_map.get("fromName") or settings["from_name"]
            settings["frontend_url"] = config_map.get("frontendUrl") or settings["frontend_url"]
        except Exception as e:
            logger.error(f"❌ Erro ao carregar configurações de e-mail do banco: {str(e)}")

        return settings

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> bool:
        """
        Envia um email

        Args:
            to_email: Email do destinatário
            subject: Assunto do email
            html_content: Conteúdo HTML
            text_content: Conteúdo texto plano (fallback)

        Returns:
            True se enviado com sucesso, False caso contrário
        """

        runtime = self._load_runtime_settings(db)

        # Modo desenvolvimento: apenas loga
        if runtime["dev_mode"]:
            logger.info(
                f"""
╔════════════════════════════════════════════════════════════════════════════╗
║ 📧 EMAIL (MODO DESENVOLVIMENTO - NÃO ENVIADO)                              ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Para:     {to_email:<64} ║
║ Assunto:  {subject:<64} ║
╠════════════════════════════════════════════════════════════════════════════╣
║ CONTEÚDO:                                                                  ║
╠════════════════════════════════════════════════════════════════════════════╣
{text_content or html_content}
╚════════════════════════════════════════════════════════════════════════════╝
            """
            )
            return True

        # Modo produção: envia email real
        try:
            # Validar configurações
            runtime["smtp_password"] = self._sanitize_app_password(runtime["smtp_password"])
            if not runtime["smtp_user"] or not runtime["smtp_password"]:
                logger.error("❌ Configurações de email não definidas (SMTP_USER, SMTP_PASSWORD)")
                return False

            use_tls = runtime["smtp_security"] == "ssl"
            start_tls = runtime["smtp_security"] == "tls"

            effective_from_email = runtime["from_email"]
            effective_from_name = runtime["from_name"]

            is_gmail_smtp = (runtime["smtp_host"] or "").strip().lower() == "smtp.gmail.com"
            if (
                is_gmail_smtp
                and (runtime["smtp_user"] or "").strip().lower()
                != (runtime["from_email"] or "").strip().lower()
            ):
                logger.warning(
                    "⚠️ Gmail exige alinhamento entre SMTP_USER e FROM_EMAIL; ajustando remetente automaticamente para SMTP_USER"  # noqa: E501
                )
                effective_from_email = runtime["smtp_user"]

            logger.info(
                "📨 SMTP envio: host=%s port=%s security=%s user=%s from=%s to=%s",
                runtime["smtp_host"],
                runtime["smtp_port"],
                runtime["smtp_security"],
                runtime["smtp_user"],
                effective_from_email,
                to_email,
            )

            # Criar mensagem
            message = MIMEMultipart("alternative")
            message["From"] = f"{effective_from_name} <{effective_from_email}>"
            message["To"] = to_email
            message["Subject"] = subject

            # Adicionar conteúdo texto plano
            if text_content:
                part1 = MIMEText(text_content, "plain", "utf-8")
                message.attach(part1)

            # Adicionar conteúdo HTML
            part2 = MIMEText(html_content, "html", "utf-8")
            message.attach(part2)

            # Enviar via SMTP
            await aiosmtplib.send(
                message,
                hostname=runtime["smtp_host"],
                port=runtime["smtp_port"],
                username=runtime["smtp_user"],
                password=runtime["smtp_password"],
                use_tls=use_tls,
                start_tls=start_tls,
                timeout=30,
            )

            logger.info(f"✅ Email enviado com sucesso para: {to_email}")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao enviar email para {to_email}: {str(e)}")
            return False

    async def send_password_reset_email(
        self,
        to_email: str,
        user_name: str,
        reset_token: str,
        db: Optional[Session] = None,
    ) -> bool:
        """
        Envia email de recuperação de senha

        Args:
            to_email: Email do usuário
            user_name: Nome do usuário
            reset_token: Token de recuperação

        Returns:
            True se enviado com sucesso
        """

        runtime = self._load_runtime_settings(db)
        reset_link = f"{runtime['frontend_url']}/reset-password?token={reset_token}"

        # Conteúdo HTML
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
        }}
        .content {{
            background: white;
            padding: 30px;
            border-radius: 8px;
        }}
        .button {{
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
        }}
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .footer {{
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <h1>🔐 Recuperação de Senha</h1>

            <p>Olá, <strong>{user_name}</strong>!</p>

            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Bingo da Comunidade</strong>.</p>  # noqa: E501

            <p>Clique no botão abaixo para criar uma nova senha:</p>

            <p style="text-align: center;">
                <a href="{reset_link}" class="button">
                    🔑 Redefinir Minha Senha
                </a>
            </p>

            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">  # noqa: E501
                {reset_link}
            </p>

            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                    <li>Este link expira em <strong>1 hora</strong></li>
                    <li>Se você não solicitou esta recuperação, ignore este email</li>
                    <li>Sua senha atual permanece válida até que você a altere</li>
                </ul>
            </div>

            <p>Se tiver alguma dúvida, entre em contato com o suporte.</p>

            <p>Atenciosamente,<br>
            <strong>Equipe Bingo da Comunidade</strong> 🎉</p>
        </div>

        <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>&copy; 2026 Bingo da Comunidade - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>
        """

        # Conteúdo texto plano (fallback)
        text_content = f"""
🔐 RECUPERAÇÃO DE SENHA - Bingo da Comunidade

Olá, {user_name}!

Recebemos uma solicitação para redefinir a senha da sua conta.

Para redefinir sua senha, acesse o link abaixo:
{reset_link}

⚠️ IMPORTANTE:
- Este link expira em 1 hora
- Se você não solicitou esta recuperação, ignore este email
- Sua senha atual permanece válida até que você a altere

Atenciosamente,
Equipe Bingo da Comunidade 🎉
        """

        return await self.send_email(
            to_email=to_email,
            subject="🔐 Recuperação de Senha - Bingo da Comunidade",
            html_content=html_content,
            text_content=text_content,
            db=db,
        )

    async def send_email_verification(
        self,
        to_email: str,
        user_name: str,
        verification_token: str,
        db: Optional[Session] = None,
    ) -> bool:
        """
        Envia email de verificação de email

        Args:
            to_email: Email do usuário
            user_name: Nome do usuário
            verification_token: Token de verificação

        Returns:
            True se enviado com sucesso
        """

        runtime = self._load_runtime_settings(db)
        verification_link = f"{runtime['frontend_url']}/verify-email?token={verification_token}"

        # Conteúdo HTML
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
        }}
        .content {{
            background: white;
            padding: 30px;
            border-radius: 8px;
        }}
        .button {{
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
        }}
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .footer {{
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <h1>✅ Verifique seu Email</h1>

            <p>Olá, <strong>{user_name}</strong>!</p>

            <p>Bem-vindo ao <strong>Bingo da Comunidade</strong>! 🎉</p>

            <p>Para ativar sua conta, clique no botão abaixo para verificar seu email:</p>

            <p style="text-align: center;">
                <a href="{verification_link}" class="button">
                    ✅ Verificar Meu Email
                </a>
            </p>

            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">  # noqa: E501
                {verification_link}
            </p>

            <div class="warning">
                <strong>⏰ Importante:</strong>
                <ul>
                    <li>Este link expira em <strong>24 horas</strong></li>
                    <li>Você só poderá fazer login após verificar seu email</li>
                    <li>Se você não se cadastrou, ignore este email</li>
                </ul>
            </div>

            <p>Após verificar seu email, você poderá:</p>
            <ul>
                <li>✅ Fazer login na plataforma</li>
                <li>✅ Participar dos bingos</li>
                <li>✅ Gerenciar seu perfil</li>
            </ul>

            <p>Qualquer dúvida, entre em contato com o suporte.</p>

            <p>Atenciosamente,<br>
            <strong>Equipe Bingo da Comunidade</strong> 🎉</p>
        </div>

        <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>&copy; 2026 Bingo da Comunidade - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>
        """

        # Conteúdo texto plano (fallback)
        text_content = f"""
✅ VERIFIQUE SEU EMAIL - Bingo da Comunidade

Olá, {user_name}!

Bem-vindo ao Bingo da Comunidade! 🎉

Para ativar sua conta, acesse o link abaixo:
{verification_link}

⏰ IMPORTANTE:
- Este link expira em 24 horas
- Você só poderá fazer login após verificar seu email
- Se você não se cadastrou, ignore este email

Após verificar seu email, você poderá:
✅ Fazer login na plataforma
✅ Participar dos bingos
✅ Gerenciar seu perfil

Atenciosamente,
Equipe Bingo da Comunidade 🎉
        """

        return await self.send_email(
            to_email=to_email,
            subject="✅ Verifique seu Email - Bingo da Comunidade",
            html_content=html_content,
            text_content=text_content,
            db=db,
        )

    async def send_admin_site_initial_password(
        self,
        to_email: str,
        user_name: str,
        login: str,
        temporary_password: str,
        db: Optional[Session] = None,
    ) -> bool:
        """
        Envia credencial inicial para novo Admin-Site criado por sucessão.
        """

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            padding: 30px;
            border-radius: 10px;
        }}
        .content {{
            background: white;
            padding: 30px;
            border-radius: 8px;
        }}
        .credential {{
            background: #f5f5f5;
            border-left: 4px solid #1e3c72;
            padding: 12px;
            border-radius: 4px;
            margin: 12px 0;
            word-break: break-all;
        }}
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            border-radius: 4px;
            margin: 16px 0;
        }}
        .footer {{
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <h1>👑 Credencial Inicial - Admin-Site</h1>

            <p>Olá, <strong>{user_name}</strong>!</p>

            <p>Seu usuário de reserva para sucessão de Admin-Site foi criado com sucesso.</p>

            <p><strong>Credenciais de acesso:</strong></p>
            <div class="credential"><strong>Login:</strong> {login}</div>
            <div class="credential"><strong>Senha inicial:</strong> {temporary_password}</div>

            <div class="warning">
                <strong>⚠️ Ação obrigatória de segurança:</strong>
                <ul>
                    <li>Faça login e altere sua senha imediatamente</li>
                    <li>Não compartilhe esta senha por nenhum canal</li>
                    <li>Se não reconhecer este cadastro, informe o Admin-Site titular</li>
                </ul>
            </div>

            <p>Atenciosamente,<br>
            <strong>Equipe Bingo da Comunidade</strong></p>
        </div>

        <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>&copy; 2026 Bingo da Comunidade - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>
        """

        text_content = f"""
👑 CREDENCIAL INICIAL - ADMIN-SITE

Olá, {user_name}!

Seu usuário de reserva para sucessão de Admin-Site foi criado com sucesso.

Credenciais de acesso:
- Login: {login}
- Senha inicial: {temporary_password}

⚠️ AÇÃO OBRIGATÓRIA DE SEGURANÇA:
- Faça login e altere sua senha imediatamente
- Não compartilhe esta senha por nenhum canal
- Se não reconhecer este cadastro, informe o Admin-Site titular

Atenciosamente,
Equipe Bingo da Comunidade
        """

        return await self.send_email(
            to_email=to_email,
            subject="👑 Credencial Inicial Admin-Site - Bingo da Comunidade",
            html_content=html_content,
            text_content=text_content,
            db=db,
        )


# Instância global do serviço
email_service = EmailService()
