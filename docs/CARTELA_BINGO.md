# 🎫 Cartela do Bingo — Referência Operacional

> Documento complementar. Para visão completa (incluindo **quem cria jogo** e **quem cria cartela**), consulte primeiro: `docs/JOGO_E_CARTELA_GUIA_OFICIAL.md`.

## 1) Objetivo

Este documento consolida, em um único lugar, o que deve ser considerado referência para **criação/compra de cartela** no projeto.

---

## 2) Estado de referência (fev/2026)

### 2.1 Fluxo funcional esperado para o Fiel
1. Entrar em **Jogos**.
2. Selecionar um jogo/sorteio disponível.
3. Clicar em **Comprar Cartela**.
4. Sistema gera cartela automaticamente.

Fontes:
- `docs/README_NEW.md`
- `docs/APLICACAO_FINALIZADA.md`
- `docs/CHECKLIST_VALIDACAO.md`

### 2.2 Contrato de API canônico
- `POST /games/{id}/cards` → criar/comprar cartela
- `GET /games/{id}/cards` → listar cartelas do jogo
- `GET /users/me/cards` → listar cartelas do fiel autenticado

Fontes:
- `docs/README_NEW.md`
- `docs/APLICACAO_FINALIZADA.md`
- `docs/CHECKLIST_VALIDACAO.md`

### 2.3 Compatibilidade legada (mantida)
- `POST /sorteios/{id}/cartelas`
- `GET /minhas-cartelas`

---

## 3) Regras de negócio para criação de cartela

As regras abaixo são as que aparecem de forma recorrente na documentação funcional e de validação:

1. **Compra cria registro novo de cartela** no banco.
2. **Números da cartela devem ser aleatórios**.
3. **Faixa de números válida do bingo: 1 a 75**.
4. **Total de cartelas vendidas** deve ser incrementado.
5. **Prêmio total** deve ser recalculado após compra.
6. **Limite de cartelas** (quando configurado) deve ser respeitado.
7. Compra só deve acontecer quando o jogo estiver em estado válido (agendado/ativo e dentro da janela de venda).

Fonte principal:
- `docs/CHECKLIST_VALIDACAO.md`
- `docs/TROUBLESHOOTING.md`

---

## 4) Estrutura de dados da cartela (modelo)

No backend, o modelo e schema da cartela apontam para formato de **matriz 5x5** armazenada em JSON:

- `numeros: List[List[int]]` (matriz 5x5)
- `numeros_marcados: List[int]`
- `status` (`ativa`, `vencedora`, `perdedora`)

Fontes:
- `backend/src/models/models.py`
- `backend/src/schemas/schemas.py`
- `frontend/src/types/index.ts`

> Observação: em parte dos checklists funcionais aparece também a regra de “15 números”. Essa divergência precisa ser tratada como decisão de produto (ver seção 6).

---

## 5) Responsabilidade oficial

1. **Quem cria jogo**: Admin da Paróquia (e Admin-Site quando aplicável).
2. **Quem cria cartela**: Fiel (usuário comum), sob demanda.

---

## 6) Checklist rápido para validar criação de cartela

- Endpoint de compra responde sucesso para usuário autenticado.
- Compra inválida retorna erro claro (não logado, jogo inválido, limite atingido, janela fechada).
- Cartela gravada com dados estruturados corretamente.
- Contadores financeiros e de venda atualizados.
- Cartela aparece na listagem do jogo e na listagem do usuário.

---

## 7) Fontes consultadas nesta consolidação

- `docs/README_NEW.md`
- `docs/APLICACAO_FINALIZADA.md`
- `docs/CHECKLIST_VALIDACAO.md`
- `docs/TROUBLESHOOTING.md`
- `docs/FASE2_AUTENTICACAO.md`
- `docs/FASE2_INICIADA.md`
- `docs/STATUS_REPORT_COMPLETO.md`
- `frontend/src/services/api.ts`
- `backend/src/models/models.py`
- `backend/src/schemas/schemas.py`
- `backend/src/main.py`
- `backend/src/routers/admin_routes.py`
