# 📋 GUIA DE MENSAGENS DE ERRO DO SISTEMA

## 🎯 Objetivo deste Documento

Este documento explica **todas as mensagens de erro** do sistema de forma clara e simples, para que até uma criança possa entender.

---

## 🧒 Como Ler Este Documento

### Estrutura das Mensagens:

Cada mensagem de erro tem 3 partes importantes:

1. **🏷️ CÓDIGO HTTP**: Número que o sistema usa internamente (ex: 404, 403, 401)
2. **📱 MENSAGEM MOSTRADA**: O que o usuário vê na tela
3. **🎯 QUANDO ACONTECE**: Por que a mensagem aparece
4. **✅ SOLUÇÃO**: O que fazer para resolver

---

## 🔐 AUTENTICAÇÃO - LOGIN

### 1. CPF ou Senha Incorretos

- **🏷️ Código:** 401 (Não Autorizado)
- **📱 Mensagem:** "CPF ou senha incorretos"
- **🎯 Quando:** Usuário digitou CPF ou senha errada
- **✅ Solução:** Digite novamente com atenção
- **⚠️ Atenção:** Após 5 tentativas erradas, a conta é bloqueada por 15 minutos

### 2. Conta Bloqueada por Tentativas

- **🏷️ Código:** 403 (Proibido)
- **📱 Mensagem:** "Muitas tentativas incorretas. Sua conta foi bloqueada por 15 minutos."
- **🎯 Quando:** Usuário errou a senha 5 vezes seguidas
- **✅ Solução:** Aguarde 15 minutos e tente novamente
- **💡 Dica:** Se não lembra a senha, use "Esqueci minha senha"

### 3. Email Não Verificado

- **🏷️ Código:** 403 (Proibido)
- **📱 Mensagem:** "Email não verificado. Verifique seu email para ativar sua conta."
- **🎯 Quando:** Usuário se cadastrou mas não clicou no link do email
- **✅ Solução:** Abra seu email e clique no link de verificação
- **📧 Onde procurar:** Caixa de entrada OU pasta de spam

### 4. Conta Desativada pelo Administrador

- **🏷️ Código:** 403 (Proibido)
- **📱 Mensagem:** "Conta desativada. Entre em contato com o administrador da paróquia."
- **🎯 Quando:** O administrador da paróquia desativou sua conta
- **✅ Solução:** Fale com o administrador da sua paróquia
- **❌ NÃO É:** Um problema técnico (é uma ação proposital do admin)
- **❌ NÃO FALE COM:** O desenvolvedor do sistema (eu)
- **✅ FALE COM:** O padre/coordenador da sua paróquia

---

## 🔑 RECUPERAÇÃO DE SENHA

### 5. CPF Não Cadastrado

- **🏷️ Código:** 404 (Não Encontrado)
- **📱 Mensagem:** "CPF não cadastrado no sistema. Verifique se digitou corretamente ou cadastre-se."
- **🎯 Quando:** O CPF digitado não existe no banco de dados
- **✅ Solução:** Verifique se digitou certo OU crie uma nova conta

### 6. Conta Desativada na Recuperação

- **🏷️ Código:** 403 (Proibido)
- **📱 Mensagem:** "Conta desativada. Entre em contato com o administrador da paróquia."
- **🎯 Quando:** Tentou recuperar senha de uma conta desativada
- **✅ Solução:** Fale com o administrador da paróquia
- **⚠️ Importante:** Mesmo se conseguir uma nova senha, não vai conseguir entrar

### 7. Cadastro Sem Email

- **🏷️ Código:** 400 (Requisição Inválida)
- **📱 Mensagem:** "Seu cadastro não possui email. Entre em contato com o administrador para atualizar."
- **🎯 Quando:** Sua conta foi criada sem email cadastrado
- **✅ Solução:** Peça ao administrador para adicionar seu email
- **💡 Por que:** Sem email, não tem como enviar o link de recuperação

### 8. Token de Recuperação Inválido ou Expirado

- **🏷️ Código:** 400 (Requisição Inválida)
- **📱 Mensagem:** "Token inválido ou expirado. Solicite um novo link de recuperação."
- **🎯 Quando:** 
  - O link de recuperação tem mais de **30 minutos**
  - O link foi usado em outro dispositivo
  - O link foi modificado/corrompido
- **✅ Solução:** Volte para "Esqueci minha senha" e peça um novo link

### 9. Email de Recuperação Enviado

- **🏷️ Código:** 200 (Sucesso)
- **📱 Mensagem:** "✅ Link de recuperação enviado para joa***@gmail.com. Verifique sua caixa de entrada e spam."
- **🎯 Quando:** Sistema enviou o email com sucesso
- **✅ O que fazer:** 
  1. Abra seu email
  2. Procure na caixa de entrada
  3. Se não encontrar, olhe na pasta SPAM
  4. Clique no link (válido por **30 minutos**)

---

## ✉️ VERIFICAÇÃO DE EMAIL

### 10. Token de Verificação Inválido ou Expirado

- **🏷️ Código:** 400 (Requisição Inválida)
- **📱 Mensagem:** "Token de verificação inválido ou expirado."
- **🎯 Quando:** 
  - O link de verificação tem mais de 24 horas
  - O email já foi verificado antes
  - O link foi modificado
- **✅ Solução:** Entre em contato com o administrador para reenviar

---

## 📝 CADASTRO (SIGNUP)

### 11. CPF Já Cadastrado

- **🏷️ Código:** 400 (Requisição Inválida)
- **📱 Mensagem:** "CPF já cadastrado no sistema"
- **🎯 Quando:** Já existe uma conta com este CPF
- **✅ Solução:** Use "Esqueci minha senha" para recuperar acesso

### 12. Email Já Cadastrado

- **🏷️ Código:** 400 (Requisição Inválida)
- **📱 Mensagem:** "Email já cadastrado no sistema"
- **🎯 Quando:** Já existe uma conta com este email
- **✅ Solução:** Use "Esqueci minha senha" para recuperar acesso

### 13. CPF Inválido

- **🏷️ Código:** 400 (Requisição Inválida)
- **📱 Mensagem:** "CPF inválido"
- **🎯 Quando:** O CPF não passa na validação matemática
- **✅ Solução:** Digite um CPF válido (11 dígitos)
- **💡 Dica:** Sistema aceita com ou sem pontos/traços

### 14. Senha Fraca

- **🏷️ Código:** 422 (Entidade Não Processável)
- **📱 Mensagem:** "A senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos"
- **🎯 Quando:** A senha não atende aos requisitos de segurança
- **✅ Requisitos:**
  - Mínimo 8 caracteres
  - Pelo menos 1 letra maiúscula (A-Z)
  - Pelo menos 1 letra minúscula (a-z)
  - Pelo menos 1 número (0-9)
  - Pelo menos 1 símbolo (@, #, $, etc)
- **💡 Exemplo válido:** `Senha@2026`

---

## 🌐 ERROS DE CONEXÃO

### 15. Servidor Indisponível

- **🏷️ Código:** Sem código (erro de rede)
- **📱 Mensagem:** "Servidor indisponível ou bloqueio de segurança (CORS)."
- **🎯 Quando:** 
  - Servidor backend está desligado
  - Problema de internet
  - Firewall bloqueando
- **✅ Solução (Usuário):** Aguarde alguns minutos
- **✅ Solução (Admin):** Verifique se o Docker está rodando

### 16. Erro 500 (Erro Interno do Servidor)

- **🏷️ Código:** 500 (Erro Interno)
- **📱 Mensagem:** "Erro interno do servidor. Nossa equipe técnica foi notificada."
- **🎯 Quando:** Bug no código do backend
- **✅ Solução (Usuário):** Aguarde correção
- **✅ Solução (Admin):** Verifique logs do Docker: `docker compose logs backend`

---

## 🚫 ERROS DE PERMISSÃO

### 17. Token Expirado ou Inválido

- **🏷️ Código:** 401 (Não Autorizado)
- **📱 Mensagem:** Redireciona para tela de login automaticamente
- **🎯 Quando:** 
  - Usuário ficou muito tempo sem usar o sistema
  - Token JWT expirou
- **✅ Solução:** Faça login novamente

### 18. Acesso Negado (Sem Permissão)

- **🏷️ Código:** 403 (Proibido)
- **📱 Mensagem:** "Você não tem permissão para acessar este recurso"
- **🎯 Quando:** Usuário tentou acessar área de administrador
- **✅ Solução:** Use apenas as áreas permitidas para seu tipo de conta
- **💡 Exemplo:** Um "Fiel" não pode criar jogos (só admins podem)

---

## 🎲 ERROS DE JOGOS

### 19. Jogo Não Encontrado

- **🏷️ Código:** 404 (Não Encontrado)
- **📱 Mensagem:** "Jogo não encontrado"
- **🎯 Quando:** Tentou acessar um jogo que não existe ou foi deletado
- **✅ Solução:** Volte para lista de jogos

### 20. Jogo Já Iniciado

- **🏷️ Código:** 400 (Requisição Inválida)
- **📱 Mensagem:** "Não é possível editar um jogo que já iniciou"
- **🎯 Quando:** Tentou modificar um jogo em andamento
- **✅ Solução:** Apenas jogos com status "Não Iniciado" podem ser editados

---

## 📊 TABELA RESUMO - REFERÊNCIA RÁPIDA

| Código | Tipo | Mensagem Resumida | Quem Resolve |
|--------|------|-------------------|--------------|
| 401 | Login | CPF ou senha incorretos | Usuário |
| 403 | Bloqueio | Conta bloqueada por tentativas | Aguardar 15min |
| 403 | Email | Email não verificado | Usuário (verificar email) |
| 403 | Admin | Conta desativada | Admin da Paróquia |
| 404 | Cadastro | CPF não encontrado | Usuário (cadastrar) |
| 400 | Recuperação | Sem email cadastrado | Admin da Paróquia |
| 400 | Token | Link expirado ou inválido | Usuário (pedir novo) |
| 422 | Validação | Senha fraca | Usuário (senha forte) |
| 500 | Servidor | Erro interno | Desenvolvedor |

---

## ✅ MENSAGENS DE SUCESSO

### Cadastro Realizado

- **📱 Mensagem:** "✅ Cadastro realizado! Verifique seu email para ativar sua conta. Não esqueça de verificar a pasta de spam!"
- **🎯 Próximo passo:** Abrir email e clicar no link

### Email Verificado

- **📱 Mensagem:** "✅ Email verificado com sucesso! Você já pode fazer login."
- **🎯 Próximo passo:** Fazer login na página inicial

### Senha Alterada

- **📱 Mensagem:** "✅ Senha alterada! Faça login com sua nova senha."
- **🎯 Próximo passo:** Login com a nova senha

### Perfil Atualizado

- **📱 Mensagem:** "✅ Perfil atualizado com sucesso!"
- **🎯 Confirmação:** Dados salvos no banco de dados

---

## 🎯 DIFERENÇA IMPORTANTE: Admin vs Desenvolvedor

### ⛪ Administrador da Paróquia
- **Quem é:** Padre, coordenador ou pessoa responsável pela paróquia
- **O que faz:** 
  - Aprovar/desaprovar cadastros
  - Ativar/desativar contas de fiéis
  - Criar jogos de bingo
  - Gerenciar prêmios
- **Quando procurar:** Problemas com conta desativada, falta de email no cadastro

### 👨‍💻 Desenvolvedor do Sistema (eu)
- **Quem é:** Pessoa que programou o sistema
- **O que faz:**
  - Corrigir bugs
  - Adicionar novas funcionalidades
  - Manutenção do servidor
- **Quando procurar:** Sistema não funciona, erro 500, problemas técnicos gerais

### 🚨 IMPORTANTE
**Conta desativada = Problema com o Admin da Paróquia (NÃO é comigo!)**
**Sistema quebrado = Problema com o Desenvolvedor (SOU EU!)**

---

## 📚 PARA DESENVOLVEDORES

### Como Adicionar uma Nova Mensagem de Erro

1. **Backend** (`backend/src/main.py`):
```python
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Mensagem clara e objetiva"
)
```

2. **Frontend** (`frontend/src/services/api.ts`):
```typescript
// A mensagem já é capturada automaticamente pelo interceptor
// Basta garantir que o backend retorne { "detail": "mensagem" }
```

3. **Atualizar este documento** com:
   - Código HTTP
   - Mensagem exibida
   - Quando acontece
   - Como resolver

### Padrão de Mensagens

✅ **BOM:** "Conta desativada. Entre em contato com o administrador da paróquia."
- Clara
- Diz o problema
- Diz quem pode resolver

❌ **RUIM:** "Erro de autenticação"
- Vago
- Não diz o que fazer
- Não ajuda o usuário

---

## 🔄 HISTÓRICO DE ATUALIZAÇÕES

| Data | Alteração | Motivo |
|------|-----------|--------|
| 24/01/2026 | Criação do documento | Padronizar mensagens de erro |
| 24/01/2026 | Esclarecimento "Admin da Paróquia" | Evitar confusão sobre quem resolver |

---

## 📞 PRECISA DE AJUDA?

### Para Usuários Finais:
1. Leia a mensagem de erro
2. Procure neste documento
3. Siga a solução indicada
4. Se não resolver, fale com o administrador da sua paróquia

### Para Administradores:
1. Verifique se é problema de permissão
2. Consulte o manual do administrador
3. Se for erro técnico, contacte o desenvolvedor

### Para Desenvolvedores:
1. Verifique os logs: `docker compose logs backend`
2. Teste localmente: `curl http://localhost:8000/health`
3. Consulte a documentação da API: `http://localhost:8000/docs`

---

**Documento criado com ❤️ para facilitar a vida de todos!**
