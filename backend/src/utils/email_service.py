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

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço de envio de emails"""
    
    def __init__(self):
        # Configurações de email (variáveis de ambiente)
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.from_name = os.getenv("FROM_NAME", "Bingo da Comunidade")
        
        # Frontend URL para links
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        
        # Modo de desenvolvimento (não envia email real)
        self.dev_mode = os.getenv("EMAIL_DEV_MODE", "true").lower() == "true"
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
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
        
        # Modo desenvolvimento: apenas loga
        if self.dev_mode:
            logger.info(f"""
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
            """)
            return True
        
        # Modo produção: envia email real
        try:
            # Validar configurações
            if not self.smtp_user or not self.smtp_password:
                logger.error("❌ Configurações de email não definidas (SMTP_USER, SMTP_PASSWORD)")
                return False
            
            # Criar mensagem
            message = MIMEMultipart("alternative")
            message["From"] = f"{self.from_name} <{self.from_email}>"
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
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True,
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
        reset_token: str
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
        
        reset_link = f"{self.frontend_url}/reset-password?token={reset_token}"
        
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
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Bingo da Comunidade</strong>.</p>
            
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            
            <p style="text-align: center;">
                <a href="{reset_link}" class="button">
                    🔑 Redefinir Minha Senha
                </a>
            </p>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">
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
            text_content=text_content
        )
    
    async def send_email_verification(
        self,
        to_email: str,
        user_name: str,
        verification_token: str
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
        
        verification_link = f"{self.frontend_url}/verify-email?token={verification_token}"
        
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
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">
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
            text_content=text_content
        )


# Instância global do serviço
email_service = EmailService()
