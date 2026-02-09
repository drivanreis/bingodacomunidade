# 📍 ROTAS DO SISTEMA (Frontend)

Este documento lista **todas as rotas disponíveis** atualmente e aponta **quais testes existem** para cada uma.

> **Regra:** cada rota deve ter pelo menos 1 teste (smoke ou funcional).

---

## ✅ Rotas Públicas

| Rota | Componente | Objetivo | Testes existentes | Versão |
| --- | --- | --- | --- | --- |
| `/` | `Home` | Página inicial | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/first-access-setup` | `FirstAccessSetup` | Configuração do primeiro acesso | `frontend/src/pages/__tests__/FirstAccessSetup.test.tsx`, `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/login` | `Login` | Login público (fiel/jogador) | `frontend/src/pages/__tests__/Login.test.tsx`, `frontend/src/__tests__/routes.test.tsx` | 1 |
| `/signup` | `Signup` | Cadastro público | `frontend/src/pages/__tests__/Signup.test.tsx`, `frontend/src/__tests__/routes.test.tsx` | 1 |
| `/forgot-password` | `ForgotPassword` | Solicitar recuperação de senha | `frontend/src/__tests__/routes.test.tsx` | 1 |
| `/reset-password` | `ResetPassword` | Redefinição de senha | `frontend/src/__tests__/routes.test.tsx` | 1 |
| `/verify-email` | `VerifyEmail` | Verificar email | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site` | `Navigate → /admin-site/login` | Atalho para login admin | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site/login` | `AdminSiteLogin` | Login do Admin Site | `frontend/src/pages/__tests__/AdminSiteLogin.test.tsx`, `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-paroquia/login` | `AdminParoquiaLogin` | Login do Admin Paróquia | `frontend/src/__tests__/routes.test.tsx` | 0 |

---

## 🔒 Rotas Protegidas (Admin Site)

| Rota | Componente | Regra de Acesso | Testes existentes | Versão |
| --- | --- | --- | --- | --- |
| `/admin-site/dashboard` | `AdminSiteDashboard` | `SuperAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site/paroquias` | `ParishManagement` | `SuperAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site/usuarios` | `UserManagement` | `SuperAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site/admins` | `AdminUsers` | `SuperAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site/relatorios` | `Reports` | `SuperAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site/configuracoes` | `SystemSettings` | `SuperAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site/auditoria` | `AuditLog` | `SuperAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/admin-site/feedback` | `FeedbackSystem` | `SuperAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |

---

## 🔒 Rotas Protegidas (Admin Paróquia)

| Rota | Componente | Regra de Acesso | Testes existentes | Versão |
| --- | --- | --- | --- | --- |
| `/admin-paroquia/dashboard` | `AdminParoquiaDashboard` | `ParishAdminRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |

---

## 🔒 Rotas Protegidas (Público autenticado / Fiel)

| Rota | Componente | Regra de Acesso | Testes existentes | Versão |
| --- | --- | --- | --- | --- |
| `/dashboard` | `Dashboard` | `PrivateRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/feedback` | `SendFeedback` | `PrivateRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/games` | `Games` | `PrivateRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/games/new` | `NewGame` | `PrivateRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/games/:id` | `GameDetail` | `PrivateRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |
| `/profile` | `Profile` | `PrivateRoute` | `frontend/src/__tests__/routes.test.tsx` | 0 |

---

## 🔁 Rota de fallback

| Rota | Comportamento | Testes existentes | Versão |
| --- | --- | --- | --- |
| `*` | Redireciona para `/` | `frontend/src/__tests__/routes.test.tsx` | 0 |

---

## 🧪 Plano de testes por rota

- **Smoke tests**: garantem que a rota existe e redireciona corretamente.
- **Testes funcionais**: validam comportamento do formulário, mensagens e fluxos.

✅ **Status atual:** todas as rotas acima têm **pelo menos 1 smoke test** em `routes.test.tsx`.

---

## 📌 Próximos passos (opcionais)

1. Criar testes funcionais para:
   - `ForgotPassword`, `ResetPassword`, `VerifyEmail`
   - Rotas AdminSite (dashboard e management)
   - Rotas públicas com navegação cruzada
2. Criar testes com **usuário autenticado** (simular tokens no `localStorage`).

---

**Última atualização:** 09/02/2026
