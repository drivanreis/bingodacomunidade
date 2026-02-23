# 🧾 Changelog Central

**Objetivo:** histórico único e contínuo das mudanças operacionais/técnicas do projeto.

---

## 2026-02-21 — Centralização, SMTP real e recuperação de senha Admin-Site

### Contexto
- Problema recorrente: ausência de documentação centralizada e perda de rastreabilidade.
- Impacto direto: senha inicial de Admin-Site não chegava quando ambiente estava em modo de mock/dev.

### Alterações implementadas

#### 1) Configuração SMTP via painel Admin-Site
- SMTP passou a ser configurável em runtime pelo painel.
- Chaves incluídas no sistema:
  - `emailDevMode`
  - `smtpHost`
  - `smtpPort`
  - `smtpSecurity` (`tls`/`ssl`/`none`)
  - `smtpUser`
  - `smtpPasswordEncrypted`
  - `fromEmail`
  - `fromName`
  - `frontendUrl`
  - `smtpValidatedAt`

#### 2) Segurança de credenciais SMTP
- `smtpPasswordEncrypted` é salvo criptografado no backend.
- Valor sensível é mascarado na listagem de configurações.

#### 3) Validação obrigatória de e-mail real
- Endpoint de teste SMTP adicionado.
- `smtpValidatedAt` é gravado após envio de teste com sucesso.
- Qualquer alteração em parâmetros SMTP invalida essa validação e exige novo teste.

#### 4) Regras de bloqueio para criação de Admin-Site
- Criação de Admin-Site reserva bloqueada quando:
  - `emailDevMode=true`; ou
  - SMTP ainda não validado.

#### 5) Reenvio de senha em produção
- Novo endpoint para reenviar senha de Admin-Site.
- Nova ação na tela Gerenciar Usuários do Site: **Reenviar senha**.
- Backend gera nova senha temporária, envia por e-mail e atualiza hash (invalidando a anterior).

#### 6) Regra de visibilidade do botão Reenviar senha
- O botão agora só aparece para contas com **senha inicial pendente**.
- Foi adicionado indicador no payload de listagem (`can_resend_initial_password`).
- Contas antigas/sem pendência não exibem ação de reenvio na interface.

#### 7) Robustez de entrega com Gmail (SMTP)
- Envio passou a forçar alinhamento de remetente no Gmail (`From` = `SMTP_USER`) quando necessário.
- Logs SMTP operacionais foram ampliados (`host`, `port`, `security`, `user`, `from`, `to`) para facilitar diagnóstico de entrega.
- Timeout explícito de envio foi adicionado para evitar travamento silencioso em rede instável.

#### 8) Criação de Admin-Site com ativação manual posterior
- Novo Admin-Site reserva passa a ser criado como **inativo** por padrão.
- Fluxo operacional: criar conta + enviar senha inicial + validar manualmente e-mail/SMS/WhatsApp + ativar depois.
- Mensagem da UI foi atualizada para refletir esse processo com clareza.

#### 9) Troca de senha operacional (conta atual e substitutos)
- Endpoint para o Admin-Site alterar a própria senha com validação de senha atual.
- Endpoint para o Admin-Site definir nova senha de substitutos diretamente.
- Modal de propriedades do usuário passou a incluir formulários de senha:
  - conta atual: trocar minha senha;
  - substituto: definir nova senha.

#### 10) Coesão de formulário com módulo reutilizável
- Campos de senha no modal de propriedades foram refatorados para usar o componente compartilhado `PasswordField`.
- Objetivo: manter padrão único de UX e evitar divergência entre formulários do sistema.

### Arquivos impactados
- `backend/src/utils/email_service.py`
- `backend/src/routers/admin_routes.py`
- `backend/src/routers/auth_routes.py`
- `backend/src/db/seed.py`
- `frontend/src/pages/SystemSettings.tsx`
- `frontend/src/pages/AdminUsers.tsx`
- `frontend/src/pages/__tests__/AdminUsers.test.tsx`
- `backend/tests/test_auth_admin_site.py`
- `docs/CONFIGURACAO_EMAIL.md`

### Validação registrada
- Frontend: testes de `AdminUsers` e `SystemSettings` executados com sucesso.
- Backend: cobertura de testes atualizada para criação/reenvio/validação SMTP (execução local depende do ambiente com pytest).

### Risco residual
- Sem SMTP válido de provedor (ex.: Gmail App Password), envio real continuará falhando.
- Time deve usar o botão de teste SMTP antes de criar/reenviar senha.

---

## Modelo para próximos registros

```md
## AAAA-MM-DD — Título da mudança
### Contexto
### Alterações implementadas
### Arquivos impactados
### Validação registrada
### Risco residual
```

---

## 2026-02-21 — Diretriz oficial de estilo multi-tenant e mobile-first

### Contexto
- Necessidade de evitar repetição de alinhamentos sobre identidade visual em novas tarefas.
- Definição de prioridade real de dispositivos: 90% celular de entrada, 5% celular premium, 3% outros dispositivos, 2% notebook/PC.

### Alterações implementadas
- Criado documento oficial de diretrizes visuais e UX: `docs/DIRETRIZES_ESTILO_IDENTIDADE_VISUAL.md`.
- Formalizado o princípio de separação entre marca da plataforma (empresa desenvolvedora) e marca do cliente (paróquia/empresa atendida).
- Formalizada regra de produto: dashboard da paróquia deve oferecer personalização de frontend/layout por tenant.
- Formalizada regra de design: ordem obrigatória Smartphone → Mini-tablet → Desktop/Notebook.

### Arquivos impactados
- `docs/DIRETRIZES_ESTILO_IDENTIDADE_VISUAL.md`
- `docs/CENTRAL_DOCUMENTACAO_OPERACIONAL.md`
- `docs/INDICE_DOCUMENTACAO.md`
- `INDICE.md`

### Validação registrada
- Documento criado e indexado nas camadas de governança e índice geral.
- Diretriz registrada em changelog central para rastreabilidade futura.

### Risco residual
- Até a implementação técnica completa da personalização visual por tenant, parte da aplicação pode continuar com estilo padrão.

### Complemento de governança (mesma data)
- O lembrete de branding multi-tenant e prioridade mobile-first também foi incorporado em `docs/DIRETRIZES_IMUTAVEIS_IA.md` para garantir persistência entre sessões futuras e evitar perda de contexto.

---

## 2026-02-21 — Endurecimento do fluxo “Gerenciar Usuários da Paróquia”

### Contexto
- Correção de inconsistências operacionais na tela de cadastro paroquial (tipo indevido, status inicial e vínculo de paróquia).

### Alterações implementadas
- Frontend de `Gerenciar Usuários da Paróquia` passou a aceitar apenas `paroquia_admin` nessa rota/tela.
- Novo usuário paroquial agora nasce sempre **ativo**; status fica editável apenas no modo de edição.
- Removido seletor de paróquia na criação/edição: vínculo automático com a única paróquia seed/editável.
- Adicionado campo **Confirmar senha** no formulário, com validação de conferência.
- Mantido uso de componentes modulares de formulário (`TextField` e `PasswordField`) para padrão visual/coeso.
- Backend reforçado para segurança:
  - rota de usuários desta área permite apenas `paroquia_admin`;
  - vínculo de usuário forçado para a paróquia única;
  - bloqueio de criação de múltiplas paróquias via rota administrativa;
  - exclusão de paróquia bloqueada (somente edição da seed).

### Arquivos impactados
- `frontend/src/pages/UserManagement.tsx`
- `frontend/src/pages/__tests__/UserManagement.test.tsx`
- `backend/src/routers/admin_routes.py`

### Validação registrada
- Frontend: `npx vitest run src/pages/__tests__/UserManagement.test.tsx` com 9/9 passando.

### Risco residual
- Se banco legado possuir mais de uma paróquia, backend retorna erro de configuração inválida até saneamento para paróquia única.

---

## 2026-02-21 — Diretriz oficial de comunicação obrigatória

### Contexto
- Reforço de regra de negócio: sem comunicação não há operação sustentável do aplicativo.

### Alterações implementadas
- Criada diretriz oficial de comunicação e contatos obrigatórios para todos os participantes.
- Regra formalizada: identificação mínima de nome + e-mail + telefone (SMS/voz) + WhatsApp.
- Atualização de diretrizes imutáveis para alinhar Admin-Site com exigência mínima de nome e política de comunicação obrigatória.

### Arquivos impactados
- `docs/DIRETRIZES_COMUNICACAO_E_CONTATOS.md`
- `docs/DIRETRIZES_IMUTAVEIS_IA.md`
- `docs/CENTRAL_DOCUMENTACAO_OPERACIONAL.md`
- `docs/INDICE_DOCUMENTACAO.md`
- `INDICE.md`

### Validação registrada
- Diretriz criada e indexada nas camadas de governança para consulta permanente.

### Risco residual
- Pode existir tela legada ainda sem exigir todos os canais obrigatórios até a adequação completa dos formulários.

### Ajuste de regra (mesma data)
- Definição final consolidada: contato obrigatório deve exigir **apenas 2 dados**:
  - e-mail
  - telefone com DDD
- O telefone único é considerado canal operacional para SMS/WhatsApp/voz.
- Regra atualizada em `DIRETRIZES_COMUNICACAO_E_CONTATOS.md` e sincronizada com `DIRETRIZES_IMUTAVEIS_IA.md`.
