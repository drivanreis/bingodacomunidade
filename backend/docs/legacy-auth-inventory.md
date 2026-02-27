# Inventário de dependências legadas (`usuarios_administrativos` / `usuarios_legado`)

Data: 2026-02-27

## Contexto
O projeto já possui tabelas separadas para o modelo novo:
- `admins_site`
- `usuarios_paroquia`
- `usuarios_comuns`

Ainda existem dependências do legado em pontos críticos. Este documento registra o estado atual após remover as escritas de espelho em `auth_routes.py`.

## Mudança aplicada agora
Arquivo: `backend/src/routers/auth_routes.py`
- Removida criação de espelho legado no cadastro de novo `ADMIN_SITE`.
- Removida criação de espelho legado no bootstrap do primeiro `ADMIN_SITE` (2 fluxos).

Resultado: novos admins site não são mais inseridos em `usuarios_administrativos` nesses fluxos.

## Dependências legadas restantes (principais)
1. Modelo ainda definido
- `backend/src/models/models.py`
  - classe `UsuarioAdministrativo` (`__tablename__ = "usuarios_administrativos"`)
  - classe `UsuarioLegado` (`__tablename__ = "usuarios_legado"`, marcada como antiga)

2. FKs ainda apontando para `usuarios_legado`
- `backend/src/models/models.py:827`
- `backend/src/models/models.py:842`

3. Rotas de autenticação com fallback/consulta legado
- `backend/src/routers/auth_routes.py` (múltiplos trechos: login, bootstrap, listagem e sincronizações)
- `backend/src/routers/auth_novo_routes.py`

4. Seed ainda cria/lê legado
- `backend/src/db/seed.py`

5. Utilitários ainda consultam legado
- `backend/src/utils/auth.py`
- `backend/src/utils/permissions.py`
- `backend/src/routers/user_management.py`

## Interpretação
As tabelas legadas ainda não podem ser removidas sem uma migração em etapas, porque há dependências diretas em autenticação, seed e relações de banco.

## Próxima sequência recomendada
1. Eliminar leituras/fallback de `UsuarioAdministrativo` nas rotas novas (`auth_routes.py` / `auth_novo_routes.py`).
2. Atualizar `seed.py` para criar apenas entidades do modelo novo.
3. Migrar FKs que ainda usam `usuarios_legado` para entidades novas equivalentes.
4. Só então remover classes/tabelas legadas e migration de drop.
