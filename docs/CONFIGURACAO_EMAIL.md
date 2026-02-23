# 📧 Configuração de Email - Sistema de Bingo

## 🔒 Recuperação de Senha Segura

O sistema agora envia emails com links seguros para recuperação de senha.

### ✅ Modo Desenvolvimento (Padrão)

Por padrão, o sistema opera em **modo desenvolvimento** onde:
- ✅ Emails NÃO são enviados de verdade
- ✅ O conteúdo do email aparece no log do backend
- ✅ Você pode ver o link de recuperação nos logs
- ✅ Não precisa configurar servidor SMTP

**Para ver o email no modo desenvolvimento:**
```bash
docker logs bingo_backend -f
```

Procure por uma caixa com o conteúdo do email:
```
╔════════════════════════════════════════════════════════════════════════════╗
║ 📧 EMAIL (MODO DESENVOLVIMENTO - NÃO ENVIADO)                              ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Para:     usuario@email.com                                                ║
║ Assunto:  🔐 Recuperação de Senha - Bingo da Comunidade                   ║
╠════════════════════════════════════════════════════════════════════════════╣
║ CONTEÚDO:                                                                  ║
...
```

---

## 🚀 Modo Produção (Email Real)

### Opção 1: Gmail (Recomendado para testes)

1. **Habilitar autenticação de 2 fatores** na sua conta Google
2. **Criar senha de app:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Crie uma senha para "Mail"
   - Copie a senha gerada (ex: `abcd efgh ijkl mnop`)

3. **Configurar variáveis de ambiente** no `docker-compose.yml`:

```yaml
environment:
  - EMAIL_DEV_MODE=false
  - SMTP_HOST=smtp.gmail.com
  - SMTP_PORT=587
   - SMTP_SECURITY=tls
  - SMTP_USER=seu_email@gmail.com
   - SMTP_PASSWORD=abcdefghijklmnop  # Senha de app Google (16 dígitos, sem espaços)
  - FROM_EMAIL=seu_email@gmail.com
  - FROM_NAME=Bingo da Comunidade
  - FRONTEND_URL=https://seu-dominio.com.br

# Alternativa Gmail SSL
# - SMTP_PORT=465
# - SMTP_SECURITY=ssl
```

### Opção 2: Outros Provedores SMTP

#### SendGrid
```yaml
- SMTP_HOST=smtp.sendgrid.net
- SMTP_PORT=587
- SMTP_USER=apikey
- SMTP_PASSWORD=SG.sua_api_key_aqui
```

#### Mailgun
```yaml
- SMTP_HOST=smtp.mailgun.org
- SMTP_PORT=587
- SMTP_USER=postmaster@seu-dominio.mailgun.org
- SMTP_PASSWORD=sua_senha_aqui
```

#### Amazon SES
```yaml
- SMTP_HOST=email-smtp.us-east-1.amazonaws.com
- SMTP_PORT=587
- SMTP_USER=AKIAIOSFODNN7EXAMPLE
- SMTP_PASSWORD=sua_senha_ses
```

---

## 🧪 Testando o Sistema

### 1. Modo Desenvolvimento (Padrão)

```bash
# Reiniciar backend
docker compose restart backend

# Ver logs
docker logs bingo_backend -f
```

Acesse `/forgot-password` e:
1. Digite um CPF cadastrado
2. Verifique os logs do backend
3. Copie o link que aparece no log
4. Cole no navegador

### 2. Modo Produção

```bash
# Editar docker-compose.yml
# Mudar EMAIL_DEV_MODE=false e adicionar configurações SMTP

# Rebuild e restart
docker compose down
docker compose up --build -d

# Ver logs
docker logs bingo_backend -f
```

Teste a recuperação de senha:
1. Digite um CPF cadastrado que tenha email
2. Verifique a caixa de entrada do email cadastrado
3. Clique no link recebido
4. Defina nova senha

---

## 🔐 Segurança Implementada

### ✅ Proteções Ativas:

1. **Email obrigatório**: Só envia para usuários com email cadastrado
2. **Token único**: Cada solicitação gera um token diferente
3. **Expiração**: Token expira em 1 hora
4. **Link exclusivo**: Somente quem tem acesso ao email pode usar
5. **Resposta genérica**: Sistema não revela se CPF existe ou não
6. **Sem token na resposta**: Token nunca é mostrado na tela

### ⚠️ Importante:

- ❌ **ANTES**: Qualquer um com seu CPF podia trocar sua senha
- ✅ **AGORA**: Precisa ter acesso ao seu email para trocar a senha

---

## 🛠️ Troubleshooting

### Email não está sendo enviado

1. **Verifique os logs:**
   ```bash
   docker logs bingo_backend | grep "Email"
   ```

2. **Verifique se está em modo produção:**
   ```bash
   docker exec bingo_backend env | grep EMAIL_DEV_MODE
   # Deve mostrar: EMAIL_DEV_MODE=false
   ```

3. **Teste SMTP manualmente:**
   ```bash
   docker exec -it bingo_backend python -c "
   import aiosmtplib
   import asyncio
   
   async def test():
       await aiosmtplib.send(
           'From: test@test.com\nTo: destino@test.com\nSubject: Test\n\nTeste',
           hostname='smtp.gmail.com',
           port=587,
           username='seu_email@gmail.com',
           password='sua_senha_app',
           start_tls=True
       )
   
   asyncio.run(test())
   "
   ```

### Email cai no spam

- Configure SPF, DKIM e DMARC no seu domínio
- Use um serviço profissional (SendGrid, Mailgun, SES)
- Evite palavras como "teste", "grátis", etc no assunto

### Token expirado

- Token expira em 1 hora
- Usuário precisa solicitar novo link

---

## 📝 Exemplos de Email

### Template HTML (enviado automaticamente):

- 🎨 Design profissional com gradiente roxo
- 📱 Responsivo (funciona em mobile)
- 🔘 Botão grande "Redefinir Minha Senha"
- ⚠️ Avisos de segurança destacados
- ⏰ Informação de expiração visível

### Template Texto (fallback):

- 📄 Versão texto plano para clientes de email antigos
- 🔗 Link clicável
- ℹ️ Todas as informações importantes

---

## 🎯 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuário esqueceu a senha                                │
│  2. Acessa /forgot-password                                 │
│  3. Digita CPF                                              │
│  4. Backend valida CPF e email                              │
│  5. Gera token único                                        │
│  6. Envia email com link                                    │
│  7. Usuário recebe email                                    │
│  8. Clica no link (com token na URL)                        │
│  9. Define nova senha                                       │
│ 10. Backend valida token                                    │
│ 11. Atualiza senha                                          │
│ 12. Usuário pode fazer login                                │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Deploy

- [ ] Configurar EMAIL_DEV_MODE=false
- [ ] Configurar SMTP_HOST, SMTP_PORT, SMTP_SECURITY
- [ ] Configurar SMTP_USER, SMTP_PASSWORD
- [ ] Configurar FROM_EMAIL, FROM_NAME
- [ ] Atualizar FRONTEND_URL para URL de produção
- [ ] Testar envio de email
- [ ] Verificar se email não cai em spam
- [ ] Documentar credenciais em local seguro (não no código!)

---

**📞 Precisa de ajuda?**
- Consulte a documentação do seu provedor SMTP
- Verifique os logs do backend
- Teste com diferentes provedores de email (Gmail, Outlook, etc)
