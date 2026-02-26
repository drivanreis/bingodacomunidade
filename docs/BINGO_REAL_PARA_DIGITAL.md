# 🎱 Bingo Real → Modelo Digital Oficial

## 1) Como funciona um Bingo real (referência operacional)

Em um bingo presencial, o fluxo clássico é:
1. A organização define data/hora, prêmio e valor da cartela.
2. Pessoas adquirem cartelas antes do início do sorteio.
3. No horário limite, as vendas encerram.
4. Inicia o sorteio das pedras.
5. Ganha quem cumprir a regra de marcação definida.

Pontos importantes do mundo real:
- Existe separação clara entre **fase de venda** e **fase de sorteio**.
- Cartela só participa se estiver efetivamente comprada.
- Após fechamento das vendas, não entra nova cartela.

---

## 2) Adaptação oficial para o mundo digital

### Regra principal de produto
- A cartela **não é impressa a esmo**.
- O usuário cria a cartela que deseja apostar.
- A cartela fica no **carrinho de compras** até pagamento/compra final.
- Não existe regra de expiração por minutos de reserva (ex.: 15 minutos).
- Quando encerra o prazo de compra, **todos os carrinhos são zerados**.
- Em seguida, o sistema entra na **fase de sorteio**.

---

## 3) Fases do jogo digital

## Fase A — Venda aberta
- Admin cria e publica o jogo.
- Fiel cria cartelas (aleatórias ou personalizadas) e adiciona no carrinho.
- Carrinho é estado temporário (pré-compra).

## Fase B — Fechamento de vendas
- No horário de `fim_vendas`, o sistema bloqueia novas compras imediatamente (corte rígido).
- Carrinhos pendentes são limpos automaticamente.
- Apenas cartelas com compra confirmada permanecem válidas.

## Fase C — Sorteio em execução
- Sistema inicia sorteio de pedras.
- Participam somente cartelas com status de compra concluída.

## Fase D — Encerramento
- Consolidação de vencedores.
- Snapshot + backup + desbloqueio operacional (quando aplicável).

---

## 4) Regras de estado da cartela (modelo funcional)

Estados esperados (canônico de produto):
- `no_carrinho` → cartela criada, ainda não paga
- `paga` → pagamento confirmado, apta ao sorteio
- `cancelada` → invalidada/removida

Transições válidas:
- `no_carrinho` → `paga`
- `no_carrinho` → `cancelada` (ao encerrar vendas)

Transições proibidas:
- `paga` voltar para `no_carrinho`
- `cancelada` participar do sorteio

Regra de borda (checkout aberto no instante do corte):
- se o relógio atingir `fim_vendas`, a confirmação é interrompida imediatamente.
- não há carência para checkout iniciado.

---

## 5) Regra de limpeza no fechamento (obrigatória)

No evento de fechamento de vendas:
1. Ativar lock de escrita de compra (janela de segurança).
2. Marcar como `cancelada` todas cartelas em `no_carrinho`.
3. Zerar/limpar carrinhos pendentes.
4. Confirmar que só `paga` permanece elegível.
5. Iniciar fase de sorteio.

---

## 6) Critérios de aceite para operação

Para considerar correto:
- Durante venda aberta, usuário consegue criar cartela no carrinho.
- Após fechamento, nova compra é bloqueada.
- Carrinhos pendentes são zerados sem afetar cartelas compradas.
- Sorteio roda apenas com cartelas compradas.
- Auditoria operacional registra fechamento + snapshot + backup.

---

## 7) Relacionamento com documentos existentes

- Regras de jogo/cartela: `docs/JOGO_E_CARTELA_GUIA_OFICIAL.md`
- Operação de lock/snapshot/backup: `docs/BACKUP_JOGOS_CARTELAS.md`
- Referência consolidada de cartela: `docs/CARTELA_BINGO.md`

## 8) Endpoints operacionais implementados

- `POST /games/{game_id}/cards` → cria cartela em `no_carrinho`
- `POST /games/{game_id}/cards/{card_id}/pay` → confirma cartela como `paga`
- `POST /games/{game_id}/close-sales` → invalida em lote `no_carrinho` → `cancelada` e prepara sorteio

Este documento é a **fonte oficial de produto** para o fluxo de bingo real adaptado ao digital.
