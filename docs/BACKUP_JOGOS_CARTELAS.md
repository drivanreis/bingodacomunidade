# 🛡️ Backup e Manutenção — Jogos e Cartelas

## Objetivo
Garantir consistência no encerramento de jogos:
1. Lock de escrita (manutenção)
2. Snapshot rápido dos resultados
3. Backup completo do banco
4. Unlock

---

## Script Oficial
Arquivo: `backend/scripts/jogos_cartelas_maintenance.py`

### Comandos

### 1) Ativar manutenção
`python3 backend/scripts/jogos_cartelas_maintenance.py lock --minutes 5 --reason "Processamento de resultados"`

### 2) Snapshot de um jogo
`python3 backend/scripts/jogos_cartelas_maintenance.py snapshot --game-id SOR_20260223190000`

### 3) Backup completo
`python3 backend/scripts/jogos_cartelas_maintenance.py backup`

### 4) Desativar manutenção
`python3 backend/scripts/jogos_cartelas_maintenance.py unlock`

### 5) Ciclo completo automático
`python3 backend/scripts/jogos_cartelas_maintenance.py close-cycle --game-id SOR_20260223190000 --minutes 5`

### 6) Simulação operacional (4 pontos críticos)
`python3 backend/scripts/jogos_cartelas_maintenance.py drill --game-id SOR_20260223190000 --faithful-token "SEU_JWT_USUARIO_COMUM" --base-url "http://localhost:8000" --minutes 5`

---

## Lock de Escrita (regra)
Durante manutenção, rotas de escrita de Jogos/Cartelas retornam bloqueio (`423 Locked`) com mensagem amigável.

Chaves de configuração usadas:
- `maintenance_mode`
- `maintenance_reason`
- `maintenance_lock_until`

---

## Snapshot
O snapshot grava JSON em:
- `backend/data/snapshots/` (ambiente local)
- `/app/data/snapshots/` (container)

Inclui:
- dados consolidados do jogo
- cartelas vencedoras

---

## Backup
- SQLite: cópia consistente do arquivo `.db`
- PostgreSQL: `pg_dump`

Após backup, o script agora executa validação de restore em base temporária para confirmar:
- existência das 24 colunas `n1..n24` em `cartelas`
- existência do índice único composto (`sorteio_id + n1..n24`)

---

## Critérios de Teste (obrigatórios)

### 1) Integridade do Lock
Durante lock, o `drill` tenta comprar cartela via API (`/games/{id}/cards`) usando token de usuário comum.
Critério de aprovação: retorno `HTTP 423 Locked` (erro controlado).

### 2) Velocidade do Snapshot
O `drill` cronometra o snapshot e imprime o tempo total em segundos.
Critério de aprovação: tempo mensurável e estável dentro da janela operacional definida pela equipe.

### 3) Consistência do Backup
O `drill` gera backup e executa restore-check em base temporária.
Critério de aprovação: restore válido com as 24 colunas e índice único composto preservados.

### 4) Auto-Unlock (failsafe)
Se snapshot/backup/restore falhar, o script executa unlock automático e registra alerta.
Critério de aprovação: sistema não permanece travado; alerta salvo em `backend/data/alerts/`.

---

## Observação de Migração
Como houve refatoração de schema da cartela (24 colunas `CHAR(2)` + unique constraint), em bases já existentes é necessário executar migração de banco antes de operar em produção.

### Script de Migração (bases existentes)
Arquivo: `backend/scripts/migrate_jogos_cartelas_schema.py`

Comando:
`python3 backend/scripts/migrate_jogos_cartelas_schema.py`

O script:
- adiciona `sorteios.max_cards` se faltar
- adiciona `cartelas.n1..n24` se faltar
- migra dados legados de `cartelas.numeros`
- normaliza status legado (`ativa` -> `paga`)
- detecta duplicatas e cria índice único composto
