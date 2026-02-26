# 🎯 Guia Oficial — Jogo e Cartela

## 1) Objetivo

Este é o documento oficial para responder, sem ambiguidade:
- **Quem cria o jogo?**
- **Quem cria a cartela?**
- **Quais endpoints e regras devem ser usados?**

Para fluxo operacional completo de produto (**bingo real adaptado ao digital**, com carrinho, limpeza no fechamento e entrada em sorteio), consulte também:
- `docs/BINGO_REAL_PARA_DIGITAL.md`

---

## 2) Papéis e Responsabilidades

### Quem cria o jogo
- **Admin da Paróquia** (e também Admin-Site, quando aplicável) cria o jogo.
- O jogo define:
  - título
  - data/hora de início das vendas
  - data/hora do sorteio
  - valor da cartela
  - rateio financeiro

### Quem cria a cartela
- **Somente o Fiel (Usuário Comum)** cria cartela.
- Cartela é gerada **sob demanda** (não é pré-gerada pelo administrador).

---

## 3) Fluxo Funcional Oficial

1. Admin acessa **Criar Novo Jogo**.
2. Admin informa os dados do jogo (incluindo calendário de início de vendas e sorteio).
3. Fiel entra em um jogo disponível.
4. Fiel escolhe:
   - **Cartela Aleatória** (sistema gera), ou
   - **Cartela Personalizada** (fiel informa os 24 números).
5. Backend valida unicidade da cartela no jogo.
6. Compra confirmada atualiza contadores do jogo (cartelas vendidas e prêmio).

---

## 4) Contratos de API (Canônico)

## Jogos
- `GET /games` — Listar jogos
- `POST /games` — Criar novo jogo (somente Admin)
- `GET /games/{id}` — Detalhes de jogo

## Cartelas
- `GET /games/{id}/cards` — Listar cartelas do jogo
- `POST /games/{id}/cards` — Criar cartela sob demanda no carrinho (`no_carrinho`) (somente Fiel)
- `POST /games/{id}/cards/{card_id}/pay` — Confirmar pagamento da cartela (`paga`) (somente Fiel dono da cartela)
- `GET /users/me/cards` — Listar minhas cartelas (Fiel autenticado)

## Fechamento de vendas
- `POST /games/{id}/close-sales` — Encerra vendas do jogo, invalida carrinhos (`cancelada`) e opcionalmente inicia sorteio

## Compatibilidade legada (mantida)
- `GET /sorteios`
- `GET /sorteios/{id}`
- `POST /sorteios/{id}/cartelas`
- `GET /minhas-cartelas`

---

## 5) Regras de Negócio de Jogo

1. Somente perfil administrativo cria jogo.
2. `data_inicio_vendas` deve ser anterior a `data_sorteio`.
3. O fim de vendas é calculado como **1 minuto antes** do sorteio.
4. A soma dos percentuais de rateio deve ser **100%**.
5. **Prêmio** não pode ser menor que **49%**.
6. **Operação** não pode ser menor que **1/3** do percentual da **Paróquia**.
7. **Seguro Operacional** (campo técnico `evolution_percent`) não pode ser menor que **1%**.

### Glossário do Rateio Financeiro

- **Prêmio**: percentual destinado ao prêmio do bingo.
- **Paróquia**: percentual que fica para a paróquia.
- **Operação**: percentual destinado à operação/manutenção do sistema.
- **Seguro Operacional**: reserva para custos inesperados, revisão de código, documentação e melhorias de sustentação.

---

## 6) Regras de Negócio de Cartela

1. Cartela tem **24 números**.
2. Cada número deve estar entre `01` e `75`.
3. Não pode repetir número dentro da mesma cartela.
4. Cartela só pode ser criada por Fiel.
5. Cartela só pode ser criada com jogo válido para venda (status e janela de tempo).
6. Cartela não pode repetir no mesmo jogo (unicidade por assinatura dos 24 campos no escopo do jogo).
7. Não existe expiração por temporizador de reserva (sem regra de 15 minutos).
8. Ao atingir `fim_vendas`, aplica-se corte rígido: bloqueio imediato de novas confirmações.
9. No fechamento, cartelas `no_carrinho` são invalidadas (`cancelada`) e só `paga` segue para sorteio.
10. Totais financeiros do jogo (`total_cartelas_vendidas`, `total_arrecadado`, `total_premio`) são atualizados no pagamento, não na criação do carrinho.

---

## 7) Formato de Dados da Cartela (atual)

- Cada cartela persiste os 24 números como string de 2 dígitos (`"01" ... "75"`).
- A unicidade por jogo é garantida pela assinatura da sequência de 24 números no backend.

> Observação: a forma física de armazenamento pode evoluir (ex.: índice/constraint composto em banco), mantendo o mesmo contrato funcional.

---

## 8) Frontend — Comportamento Esperado

### Admin da Paróquia
- Botão **Criar Novo Jogo** direciona para tela de cadastro com calendário.
- Preenche título, início das vendas, sorteio e rateio.

### Fiel
- Em detalhes do jogo, vê duas opções:
  - Comprar cartela aleatória
  - Comprar cartela personalizada
- Recebe mensagem clara quando cartela duplicada for rejeitada.

---

## 9) Checklist de Validação Rápida

- [ ] Admin cria jogo com sucesso em `POST /games`
- [ ] Fiel consegue comprar cartela aleatória
- [ ] Fiel consegue comprar cartela personalizada com 24 números válidos
- [ ] Cartela duplicada no mesmo jogo é bloqueada
- [ ] Contadores de venda/prêmio são atualizados após compra
- [ ] Regras de perfil são respeitadas (Admin cria jogo; Fiel cria cartela)

---

## 10) Fonte do Código

- Backend: `backend/src/routers/games_routes.py`
- Frontend (jogos): `frontend/src/pages/NewGame.tsx`, `frontend/src/pages/Games.tsx`
- Frontend (cartelas): `frontend/src/pages/GameDetail.tsx`
- Dashboard paroquial: `frontend/src/pages/AdminParoquiaDashboard.tsx`
