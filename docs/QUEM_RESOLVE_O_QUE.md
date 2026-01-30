# 🎯 QUEM RESOLVE O QUÊ?

## 🧒 Guia Super Simples (Para Crianças!)

Este documento explica **quem você deve procurar** quando algo não funciona.

---

## 👥 AS DUAS PESSOAS IMPORTANTES

### ⛪ Administrador da Paróquia
```
┌─────────────────────────────────┐
│  👤 QUEM É?                      │
│  - Padre                         │
│  - Coordenador da paróquia       │
│  - Pessoa responsável pela igreja│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🔨 O QUE FAZ?                   │
│  - Aprovar cadastros             │
│  - Desativar contas              │
│  - Criar jogos de bingo          │
│  - Adicionar email no cadastro   │
└─────────────────────────────────┘
```

### 👨‍💻 Desenvolvedor do Sistema (eu)
```
┌─────────────────────────────────┐
│  👤 QUEM É?                      │
│  - Programador                   │
│  - Criador do sistema            │
│  - Responsável pelo código       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🔨 O QUE FAZ?                   │
│  - Corrigir bugs                 │
│  - Adicionar funcionalidades     │
│  - Manter o servidor funcionando │
│  - Atualizar o sistema           │
└─────────────────────────────────┘
```

---

## 🚨 PROBLEMAS COMUNS - QUEM PROCURAR?

### ⛪ PROCURE O ADMIN DA PARÓQUIA SE:

#### 1️⃣ "Minha conta está desativada"
```
❌ Mensagem: "Conta desativada. Entre em contato com o administrador da paróquia."

✅ O que aconteceu?
   O administrador desativou sua conta de propósito.

✅ Por que isso acontece?
   - Você violou alguma regra
   - Você não é mais membro da comunidade
   - Erro do administrador (ele apertou o botão errado)

✅ O que fazer?
   📞 Ligar para a paróquia
   💬 Conversar com o padre/coordenador
   📧 Mandar email para a paróquia
```

#### 2️⃣ "Meu cadastro não tem email"
```
❌ Mensagem: "Seu cadastro não possui email. Entre em contato com o administrador."

✅ O que aconteceu?
   Seu cadastro foi feito sem email.

✅ Por que isso acontece?
   - Cadastro antigo (antes do sistema exigir email)
   - O admin criou sua conta manualmente e esqueceu o email

✅ O que fazer?
   📞 Ligar para o admin da paróquia
   💬 Pedir para ele adicionar seu email no sistema
```

#### 3️⃣ "Não recebi o email de verificação"
```
❌ Problema: Email não chegou

✅ Primeiro: Verifique a pasta de SPAM!
   90% das vezes o email está lá.

✅ Se ainda não encontrou:
   📞 Peça ao admin para reenviar o email
   💬 Peça ao admin para ativar sua conta manualmente
```

#### 4️⃣ "Quero criar um jogo mas não consigo"
```
❌ Mensagem: "Apenas administradores podem criar jogos."

✅ O que aconteceu?
   Sua conta é de "Fiel", não de "Administrador".

✅ O que fazer?
   📞 Fale com o admin da paróquia
   💬 Peça para ele te promover a "Admin Paroquial"
   ⚠️ Ele só vai fazer isso se você for de confiança!
```

---

### 👨‍💻 PROCURE O DESENVOLVEDOR SE:

#### 1️⃣ Sistema não abre
```
❌ Problema: Página em branco ou erro de conexão

✅ O que aconteceu?
   O servidor está desligado ou com problema.

✅ O que fazer?
   📧 Avisar o desenvolvedor
   💻 Se você é o desenvolvedor: docker compose up -d
```

#### 2️⃣ Erro 500 (Erro Interno)
```
❌ Mensagem: "Erro interno do servidor."

✅ O que aconteceu?
   Bug no código (programação).

✅ O que fazer?
   📧 Avisar o desenvolvedor
   📋 Copiar a mensagem de erro
   📸 Se possível, tirar print da tela
```

#### 3️⃣ Função nova não existe
```
❌ Exemplo: "Quero poder cancelar um jogo"

✅ O que aconteceu?
   Essa função ainda não foi programada.

✅ O que fazer?
   📧 Pedir ao desenvolvedor para criar essa função
   ⏰ Aguardar atualização do sistema
```

#### 4️⃣ Bug visual ou comportamento estranho
```
❌ Exemplo: "Botão não funciona" / "Texto cortado"

✅ O que aconteceu?
   Erro na programação.

✅ O que fazer?
   📧 Avisar o desenvolvedor
   📋 Explicar exatamente o que fez
   📸 Tirar print da tela
```

---

## 🎯 TABELA RÁPIDA DE DECISÃO

| Problema | Admin da Paróquia | Desenvolvedor |
|----------|-------------------|---------------|
| Conta desativada | ✅ SIM | ❌ NÃO |
| Falta de email no cadastro | ✅ SIM | ❌ NÃO |
| Não recebeu email | ✅ SIM (verificar spam primeiro) | ❌ NÃO |
| Quer criar jogos mas não consegue | ✅ SIM | ❌ NÃO |
| Sistema não abre | ❌ NÃO | ✅ SIM |
| Erro 500 | ❌ NÃO | ✅ SIM |
| Bug visual | ❌ NÃO | ✅ SIM |
| Função nova | ❌ NÃO | ✅ SIM |
| CPF ou senha incorretos | 🤔 VOCÊ MESMO | ❌ NÃO |
| Esqueci minha senha | 🤔 VOCÊ MESMO | ❌ NÃO |

---

## 🧩 ANALOGIA PARA ENTENDER MELHOR

Imagine um parque de diversões:

### 🎡 Admin da Paróquia = Gerente do Parque
- Decide quem pode entrar
- Expulsa quem se comporta mal
- Define os horários
- Decide os preços

### 🔧 Desenvolvedor = Engenheiro dos Brinquedos
- Constrói as montanhas-russas
- Conserta brinquedos quebrados
- Adiciona novos brinquedos
- Garante que tudo funcione

### 🎯 Exemplos:

**Você foi expulso do parque?**
→ Fale com o GERENTE (Admin da Paróquia)

**A montanha-russa quebrou?**
→ Fale com o ENGENHEIRO (Desenvolvedor)

**Você perdeu seu ingresso?**
→ Fale com o GERENTE (Admin da Paróquia)

**O brinquedo novo não funciona?**
→ Fale com o ENGENHEIRO (Desenvolvedor)

---

## 📞 COMO ENTRAR EM CONTATO

### Com o Administrador da Paróquia:
```
1. Indo pessoalmente na paróquia
2. Ligando para o telefone da paróquia
3. Mandando email para a paróquia
4. Após a missa (conversar com o padre)
```

### Com o Desenvolvedor:
```
1. Email: (contato do desenvolvedor)
2. GitHub Issues: (se souber usar)
3. WhatsApp: (se tiver o número)
4. Através do admin da paróquia (ele tem o contato)
```

---

## ⚠️ ERROS COMUNS

### ❌ ERRO #1: Procurar o desenvolvedor quando a conta foi desativada
```
"Minha conta está desativada!"
❌ Avisar o desenvolvedor
✅ Falar com o admin da paróquia
```

### ❌ ERRO #2: Procurar o admin quando há um bug
```
"O botão não funciona!"
❌ Falar com o admin da paróquia
✅ Avisar o desenvolvedor
```

### ❌ ERRO #3: Procurar qualquer um quando esqueceu a senha
```
"Esqueci minha senha!"
❌ Falar com admin ou desenvolvedor
✅ Usar o botão "Esqueci minha senha"
```

---

## ✅ RESUMO FINAL

### 🎯 Regra de Ouro:

**Se é sobre PESSOAS e PERMISSÕES** → Admin da Paróquia
**Se é sobre CÓDIGO e FUNCIONALIDADE** → Desenvolvedor

### 🧩 Lembre-se:

- Admin = Gerente (quem entra, quem sai)
- Desenvolvedor = Engenheiro (o que funciona, o que quebra)

### 💡 Dica Final:

**Na dúvida?** Fale com o Admin da Paróquia primeiro.
Ele conhece o desenvolvedor e pode passar o contato se for problema técnico.

---

## 📋 CHECKLIST: "É problema para o Admin ou para o Dev?"

Responda SIM ou NÃO:

1. [ ] A mensagem diz "Entre em contato com o administrador da paróquia"?
   - ✅ SIM → Admin da Paróquia
   - ❌ NÃO → Continue

2. [ ] É sobre permissão, acesso, conta desativada?
   - ✅ SIM → Admin da Paróquia
   - ❌ NÃO → Continue

3. [ ] É sobre email não cadastrado ou não recebido?
   - ✅ SIM → Admin da Paróquia (mas verifique SPAM primeiro!)
   - ❌ NÃO → Continue

4. [ ] É erro 500 ou sistema não funciona?
   - ✅ SIM → Desenvolvedor
   - ❌ NÃO → Continue

5. [ ] É bug, botão quebrado, tela estranha?
   - ✅ SIM → Desenvolvedor
   - ❌ NÃO → Continue

6. [ ] É função nova que não existe?
   - ✅ SIM → Desenvolvedor
   - ❌ NÃO → Você pode resolver sozinho (ex: esqueci a senha)

---

**Documento criado com ❤️ para evitar confusões!**

**Última atualização:** 24/01/2026
