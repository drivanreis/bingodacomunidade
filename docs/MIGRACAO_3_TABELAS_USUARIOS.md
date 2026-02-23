# Migração para 3 Tabelas de Usuários

## Objetivo

Este documento descreve a mudança estrutural que separa usuários por domínio de negócio em três tabelas independentes:

1. `admins_site` (`AdminSiteUser`)
2. `usuarios_paroquia` (`UsuarioParoquia`)
3. `usuarios` (`UsuarioComum`)

A separação reduz ambiguidade de permissões, elimina sobreposição de papéis e prepara o sistema para regras de segurança específicas por perfil.

---

## Modelo de Dados

### 1) Admin-Site (`admins_site`)

- Responsável por governança global do sistema.
- Não usa role paroquial.
- Cadastro exige `CPF`.
- Campos-chave sem repetição: `email`, `telefone` e `cpf`.
- Operações de sucessão:
  - criar admin-site reserva
  - inativar/reativar conta
  - definir senha de substituto
  - reenviar senha temporária

### 2) Usuário Paroquial (`usuarios_paroquia`)

- Responsável por operação interna da paróquia.
- Usa role explícita via `roles_paroquia`.
- Roles suportadas:
  - `paroquia_admin`
  - `paroquia_caixa`
  - `paroquia_recepcao`
  - `paroquia_bingo`
  - `paroquia_porteiro`

### 3) Usuário Comum (`usuarios`)

- Usuário final (fiel/comprador/participante).
- Sem poderes administrativos do sistema.
- Pode ser gerenciado por rotas administrativas quando necessário.

---

## Regras Funcionais

## Admin-Site sem Role

- `AdminSiteUser` não depende de `roles_paroquia`.
- Permissão é derivada do tipo de conta de site.

## Usuário Paroquial com Role

- `UsuarioParoquia` referencia `role_id` (`roles_paroquia`).
- Permissões operacionais da paróquia devem usar `role.codigo`.

## Usuário Comum separado

- `UsuarioComum` permanece dedicado ao domínio público/comunitário.

---

## Segurança Antifraude de Cadastro Público

Foi adicionada proteção por perfil de dispositivo (não por IP):

- Campo de entrada: `device_fingerprint` no signup público.
- Persistência de tentativas: `tentativas_cadastro_dispositivo`.
- Janela: 20 minutos.
- Limite: 5 tentativas por fingerprint.
- Excedeu o limite: bloqueio com `HTTP 429`.

Isso dificulta abuso com troca de IP e mantém rastreio por dispositivo.

---

## Compatibilidade de Transição

Durante a migração, o backend opera com compatibilidade entre modelo novo e legado em pontos críticos:

- leitura/autorização com fallback
- gestão de admin-site com suporte novo+legado
- CRUD administrativo de usuários com fallback para registros antigos

Objetivo: manter continuidade operacional sem quebra imediata de dados históricos.

---

## Rotas Cobertas

## Administração de usuários

- `POST /usuarios` (criar usuário paroquial)
- `PUT /usuarios/{usuario_id}` (editar/inativar)
- `PUT /usuarios/{usuario_id}/tipo` (trocar papel)
- `DELETE /usuarios/{usuario_id}` (excluir)

## Sucessão Admin-Site

- `GET /auth/admin-site/admins`
- `PUT /auth/admin-site/admins/{admin_id}/status`
- `POST /auth/admin-site/criar-admin-site`
- `POST /auth/admin-site/admins/{admin_id}/definir-senha`
- `POST /auth/admin-site/admins/{admin_id}/reenviar-senha`

## Criação de admin paroquial

- `POST /auth/admin-site/criar-admin-paroquia`
- `POST /auth/admin-paroquia/criar-admin-paroquia`

---

## Testes Automatizados Relacionados

Principais arquivos de teste que validam a mudança:

- `backend/tests/test_admin_routes_misc.py`
  - CRUD de usuários
  - validações de tipo
  - atualização/inativação/exclusão de usuário comum
- `backend/tests/test_admin_routes_paroquias.py`
  - CRUD e regras de exclusão de paróquia
- `backend/tests/test_auth_admin_site.py`
  - login, sucessão, criação de reservas e criação de admin paroquial
- `backend/tests/test_auth_admin_paroquia.py`
  - login e troca inicial de senha para perfil paroquial

---

## Próximos Passos Recomendados

1. Expandir testes E2E cobrindo fluxos completos novo+legado em um mesmo cenário.
2. Reduzir gradualmente dependência de fallback legado após janela de migração.
3. Publicar checklist de descomissionamento do modelo legado quando a operação estiver 100% no modelo novo.
