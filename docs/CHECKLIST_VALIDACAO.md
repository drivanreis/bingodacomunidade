# ✅ CHECKLIST DE VALIDAÇÃO FINAL

**Data:** 21 de Janeiro de 2026  
**Objetivo:** Validar todas as funcionalidades antes do deploy

---

## 🔐 AUTENTICAÇÃO

- [ ] Login com credenciais corretas funciona
- [ ] Login com credenciais incorretas mostra erro
- [ ] Token JWT é armazenado no localStorage
- [ ] Token é incluído automaticamente nas requisições
- [ ] Logout limpa token e redireciona para login
- [ ] Sessão persiste após reload da página
- [ ] Rotas protegidas redirecionam para login se não autenticado

---

## 🎮 GESTÃO DE JOGOS

### Listagem
- [ ] Todos os jogos aparecem na lista
- [ ] Filtros por status funcionam (Todos, Agendado, Ativo, Finalizado)
- [ ] Cards mostram informações corretas (título, data, preço, prêmio)
- [ ] Status badge tem cor correta
- [ ] Botão "Criar Novo Jogo" aparece apenas para Admins
- [ ] Clicar em um jogo abre a página de detalhes

### Criação (Admin)
- [ ] Formulário valida campos obrigatórios
- [ ] Soma dos percentuais deve ser 100%
- [ ] Data e hora são salvas corretamente
- [ ] Jogo criado aparece na listagem imediatamente
- [ ] Fiéis não conseguem acessar página de criação

### Detalhes
- [ ] Todas as informações do jogo são exibidas
- [ ] Rateio financeiro é mostrado corretamente
- [ ] Botão "Comprar Cartela" aparece para jogos agendados/ativos
- [ ] Botão some quando jogo está finalizado/cancelado
- [ ] Lista de cartelas compradas é atualizada

---

## 🎫 SISTEMA DE CARTELAS

### Compra
- [ ] Comprar cartela cria nova entrada no banco
- [ ] Números são gerados aleatoriamente (15 números)
- [ ] Números estão entre 1 e 75
- [ ] Total de cartelas vendidas é atualizado
- [ ] Prêmio total é recalculado automaticamente
- [ ] Limite de cartelas é respeitado (se configurado)
- [ ] Mensagem de sucesso é exibida

### Visualização
- [ ] Cartelas compradas aparecem na página do jogo
- [ ] Nome do comprador é exibido
- [ ] Data de compra é mostrada
- [ ] Números aparecem em formato de bola
- [ ] Minhas cartelas aparecem em "Perfil" (quando implementado)

---

## 👤 PERFIL DO USUÁRIO

### Visualização
- [ ] Dados do usuário são exibidos corretamente
- [ ] Avatar mostra primeira letra do nome
- [ ] Badge de perfil tem cor correta
- [ ] Informações sensíveis (CPF) aparecem apenas se existirem

### Edição
- [ ] Formulário carrega dados atuais
- [ ] Email não pode ser editado (campo desabilitado)
- [ ] Atualização de nome funciona
- [ ] WhatsApp pode ser adicionado/editado
- [ ] Chave PIX pode ser adicionada/editada
- [ ] Mensagem de sucesso aparece após salvar
- [ ] Erros são exibidos se houver problemas

---

## 🧭 NAVEGAÇÃO

### Navbar
- [ ] Navbar aparece em todas as páginas protegidas
- [ ] Links ativos são destacados
- [ ] Botão "Sair" funciona corretamente
- [ ] Menu mobile funciona em telas pequenas
- [ ] Navbar não aparece em páginas públicas (Home, Login)

### Rotas
- [ ] Todas as rotas estão funcionando
- [ ] Rotas inexistentes redirecionam para home
- [ ] Navegação entre páginas não recarrega app
- [ ] Botão "Voltar" funciona em todas as páginas
- [ ] Redirecionamentos pós-ações funcionam (ex: após criar jogo)

---

## 🎨 INTERFACE

### Design
- [ ] Cores e gradientes estão corretos
- [ ] Fontes são legíveis
- [ ] Espaçamentos são consistentes
- [ ] Cards têm sombras e border-radius
- [ ] Botões têm hover effects

### Responsividade
- [ ] Layout funciona em desktop (1920x1080)
- [ ] Layout funciona em tablet (768x1024)
- [ ] Layout funciona em mobile (375x667)
- [ ] Grids se ajustam corretamente
- [ ] Navbar mobile funciona

### Estados
- [ ] Loading spinners aparecem durante requisições
- [ ] Mensagens de erro são exibidas quando necessário
- [ ] Mensagens de sucesso aparecem após ações
- [ ] Empty states são mostrados quando não há dados
- [ ] Botões ficam disabled durante loading

---

## 🐳 DOCKER

### Containers
- [ ] Backend container sobe sem erros
- [ ] Frontend container sobe sem erros
- [ ] Volumes persistem dados do banco
- [ ] Hot-reload funciona no backend
- [ ] Hot-reload funciona no frontend

### Conectividade
- [ ] Backend responde em localhost:8000
- [ ] Frontend responde em localhost:5173
- [ ] Frontend consegue fazer requisições ao backend
- [ ] CORS está configurado corretamente
- [ ] Swagger docs acessível em /docs

---

## 🔒 SEGURANÇA

### Validações
- [ ] CPF é validado (Módulo 11)
- [ ] Senhas são criptografadas no banco
- [ ] Tokens JWT têm expiração
- [ ] Endpoints protegidos rejeitam requisições sem token
- [ ] Usuários só veem seus próprios dados sensíveis

### Autorização
- [ ] Super Admin tem acesso total
- [ ] Parish Admin pode criar/editar jogos
- [ ] Fiéis só podem comprar cartelas
- [ ] Páginas de admin bloqueiam fiéis
- [ ] Logs não expõem informações sensíveis

---

## 📡 API

### Endpoints
- [ ] GET /ping retorna "pong"
- [ ] POST /auth/login retorna token
- [ ] GET /users/me retorna dados do usuário
- [ ] GET /games retorna lista de jogos
- [ ] POST /games cria novo jogo (Admin)
- [ ] GET /games/{id} retorna detalhes
- [ ] POST /games/{id}/cards cria cartela
- [ ] GET /games/{id}/cards retorna cartelas do jogo

### Respostas
- [ ] Status codes estão corretos (200, 201, 400, 401, 404, etc)
- [ ] Mensagens de erro são claras
- [ ] Formato JSON está correto
- [ ] Timestamps estão no fuso horário de Fortaleza
- [ ] IDs temporais são gerados corretamente

---

## 📊 DADOS

### Seed
- [ ] Super Admin é criado automaticamente
- [ ] Parish Admin é criado automaticamente
- [ ] Paróquia padrão é criada
- [ ] Fiel de exemplo é criado
- [ ] Senhas padrão funcionam
- [ ] Seed é idempotente (não duplica dados)

### Integridade
- [ ] Relacionamentos entre tabelas funcionam
- [ ] Foreign keys são respeitadas
- [ ] Deleção em cascata funciona (se configurado)
- [ ] Campos obrigatórios não aceitam null
- [ ] Validações de formato são aplicadas

---

## 📝 DOCUMENTAÇÃO

- [ ] README.md está atualizado
- [ ] START_HERE.md tem instruções claras
- [ ] APLICACAO_FINALIZADA.md está completo
- [ ] Comentários no código são claros
- [ ] Swagger docs estão acessíveis
- [ ] Credenciais padrão estão documentadas

---

## 🚀 PERFORMANCE

- [ ] Página inicial carrega em < 2s
- [ ] Requisições API respondem em < 500ms
- [ ] Imagens/assets são otimizados
- [ ] Bundle JavaScript não é muito grande

---

## 🛠️ HOTFIXES APLICADOS (18/02/2026)

- [x] Corrigido `NameError: Usuario is not defined` em `get_current_user` (validação de token para `UsuarioAdministrativo`, `UsuarioComum` e legado).
- [x] Mantida compatibilidade das rotas que usam `Depends(get_current_user)` retornando payload JWT (`usuario_atual.get("sub")`).
- [x] Ajustado teste de criação em `/usuarios` para respeitar campo `email` obrigatório no modelo `UsuarioComum`.
- [x] Reforçada a validação pós-instalação para ambiente limpo sem falsos negativos desses dois pontos.
- [ ] Não há memory leaks visíveis
- [ ] Hot-reload é rápido (< 2s)

---

## 🐛 BUGS CONHECIDOS

Liste aqui qualquer bug conhecido que precisa ser corrigido:

1. [ ] _Bug 1: descrição_
2. [ ] _Bug 2: descrição_
3. [ ] _Bug 3: descrição_

---

## ✅ VALIDAÇÃO FINAL

- [ ] **Todos os itens acima foram testados**
- [ ] **Não há erros críticos no console**
- [ ] **Sistema está pronto para uso**

---

**Testado por:** _______________  
**Data:** _______________  
**Assinatura:** _______________

---

## 📌 PRÓXIMOS PASSOS

Após validação completa:

1. [ ] Fazer backup do banco de dados
2. [ ] Preparar ambiente de produção
3. [ ] Configurar domínio e SSL
4. [ ] Deploy em servidor
5. [ ] Monitoramento e logs
6. [ ] Treinamento de usuários
