# ROADMAP — Bingo da Comunidade (v1 restaurada do legado)

Este roadmap é a versão inicial reconstruída a partir de documentação legada, alinhada às diretrizes atuais (`PROJECT_BRAIN.md` e `docs/DIRETRIZES_IMUTAVEIS_IA.md`).

## Regra operacional obrigatória
- Não iniciar uma nova funcionalidade enquanto a anterior em execução não estiver marcada como `[CONCLUÍDO]`.
- Prioridade de execução sempre respeita: `ALTA > MÉDIA > BAIXA`.
- Em caso de conflito de regra, prevalece o `PROJECT_BRAIN.md`.

## Decisões de design consolidadas (vigentes)
- Paróquia: arquitetura monolítica por instalação/container (`1 instalação = 1 paróquia real + placeholder ID 1`).
- Contato do usuário comum: `DDD` e `telefone` separados; `whatsapp` obrigatório.
- Escopo Brasil: `+55` não é armazenado; é adicionado apenas no envio da mensagem.
- Entrada de contato: `DDD` em drop-list com DDD + estado (ex.: `85 - Ceará`, `11 - São Paulo`) e `telefone` com 9/10 dígitos.
- Regra de telefonia móvel nacional: considerar nono dígito (9NNNN-NNNN), transição concluída em 2016.
- Observabilidade de fraude/inconsistência: alertar Admin-Paróquia quando DDD informado divergir da UF de referência do CPF no cadastro de Usuário Comum.
- Seed ID 1: fixo e imortal (sem `DELETE`, apenas inativação lógica).
- Admin Site: sem CPF e sem Nome Completo como requisito mínimo; autenticação com email, telefone (2FA) e senha.

## Quadro de execução

| [STATUS] | [PRIORIDADE] | [FUNCIONALIDADE] |
|---|---|---|
| [EM ANDAMENTO] | ALTA | **Tarefa #1:** Criação do Admin-Paróquia real + inativação do Seed ID 1 + saída do modo de manutenção |
| [CONCLUÍDO] | ALTA | Autenticação segmentada por perfil (público, admin-site, admin-paróquia) |
| [CONCLUÍDO] | ALTA | Trava de manutenção pública até primeiro Admin Paróquia real |
| [CONCLUÍDO] | MÉDIA | Base de testes frontend por rotas e validações críticas |
| [EM ANDAMENTO] | ALTA | Congelamento final do contrato de cadastro público (DDD, telefone, WhatsApp, padrão de erro) |
| [EM ANDAMENTO] | ALTA | Paridade de testes Front/Back no protocolo campo-a-campo |
| [PENDENTE] | ALTA | Dashboard funcional completo do Admin Site (gestão operacional com ações reais) |
| [PENDENTE] | ALTA | Dashboard funcional completo do Admin Paróquia |
| [PENDENTE] | ALTA | Módulo de Bingo ponta a ponta (criação, venda de cartela, sorteio, fechamento) |
| [PENDENTE] | ALTA | Fluxo financeiro operacional (rateio, fechamento, prestação de contas) |
| [PENDENTE] | MÉDIA | Recuperação de senha e verificação de email com experiência completa no frontend |
| [PENDENTE] | MÉDIA | Auditoria administrativa e trilhas de ação visíveis para gestão |
| [PENDENTE] | MÉDIA | Relatórios gerenciais (admin-site e admin-paróquia) |
| [PENDENTE] | BAIXA | Melhorias pastorais opcionais (rodapé evangelizador, relatórios pastorais estendidos, calendário paroquial) |
| [PENDENTE] | BAIXA | App mobile e recursos de engajamento avançado |

## Checklist de Aceite — Tarefa #1 (Gate obrigatório da Sprint 1)

### Objetivo
Garantir que o sistema execute corretamente o primeiro acesso administrativo: criação do Admin-Paróquia real, inativação lógica do seed ID 1 e liberação do modo de manutenção pública.

### Checklist de implementação (deve estar 100% verde)
- [ ] Endpoint de bootstrap cria o primeiro Admin-Paróquia real com sucesso (`201`).
- [ ] Registro seed ID 1 permanece existente após bootstrap (nenhuma deleção física).
- [ ] Seed ID 1 é inativado logicamente (`ativo=false` ou `is_active=false`).
- [ ] Login bootstrap (`/auth/bootstrap/login`) retorna `404` após conclusão da troca de bastão.
- [ ] Existe ao menos um Admin-Paróquia real ativo após setup.
- [ ] `/auth/public-status` passa a indicar manutenção desativada (`maintenance_mode=false`) após existência do Admin-Paróquia ativo.
- [ ] Rotas públicas críticas (signup/login público) deixam de responder bloqueio de manutenção após liberação.
- [ ] Fluxo do frontend de primeiro acesso redireciona corretamente para área administrativa após sucesso.
- [ ] Mensagens de erro de validação seguem padrão canônico (`Nome do Campo invalido`) onde aplicável.

### Checklist de testes Vitest (gate de avanço)
- [ ] Executar Vitest no container frontend sem falhas.
- [ ] Cobrir especificamente o fluxo de primeiro acesso em `frontend/src/pages/__tests__/FirstAccessSetup.test.tsx`.
- [ ] Cobrir estado de bootstrap concluído em `frontend/src/pages/__tests__/AdminSiteLogin.test.tsx`.
- [ ] Cobrir navegação/roteamento relacionado em `frontend/src/__tests__/routes.test.tsx`.

### Comando oficial de validação (Docker)
- [ ] `docker compose exec frontend npm run test -- --run`

### Regra de avanço
- Sprint 1 só pode iniciar quando **todos os itens acima** estiverem marcados e o Vitest no container Docker estiver 100% verde.

## Janela de foco atual (execução em série)
1. Finalizar contrato de cadastro público (backend + frontend + mensagens).
2. Fechar paridade de testes Front/Back no protocolo de validação.
3. Entregar dashboard Admin Site operacional.
4. Entregar dashboard Admin Paróquia operacional.
5. Entrar no módulo Bingo ponta a ponta.

## Conflitos de design (resolvidos nesta revisão)

### 1) Multi-paróquia vs monolítico por instalação
- **Resolvido:** manter monolítico por instalação/container.

### 2) Contrato de contato do fiel
- **Resolvido:** `DDD` + `telefone` separados e `whatsapp` obrigatório.

### 3) Identidade canônica (ID temporal vs ID seed fixo)
- **Resolvido:** seed ID 1 fixo e imortal (inativação sem deleção).

### 4) Escopo de dados para admin-site
- **Resolvido:** Admin Site autentica por email + telefone (2FA) + senha, sem CPF/Nome Completo obrigatório.

## Definição de status
- `[CONCLUÍDO]`: funcionalidade implementada, validada e sem bloqueio aberto.
- `[EM ANDAMENTO]`: desenvolvimento ativo, ainda sem fechamento completo.
- `[PENDENTE]`: item priorizado, ainda não iniciado.
- `[BLOQUEADO]`: item parado por dependência externa ou decisão de produto.
