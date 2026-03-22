# Sincronização de Tempo (Frontend ↔ Backend)

## Objetivo

Garantir que todas as partes da aplicação (frontend e backend) tomem como verdade o mesmo **relógio de Fortaleza-CE**. Isso evita distorções de data/hora nas telas de jogos, vendas e sorteios.

## Backend

1. Um único ponto expondo a hora oficial: `GET /info/time` retorna:
   - `now`: ISO 8601 com timezone de Fortaleza;
   - `timezone`: string `"America/Fortaleza"`;
   - `epoch_ms`: timestamp em milissegundos (útil para calcular offset no cliente).
2. Todos os `datetime` críticos continuam vindo de `src.utils.time_manager.get_fortaleza_time()`.

## Frontend

1. Durante o bootstrap (`frontend/src/main.tsx`), chamamos `syncServerTime()` antes de montar o app.
2. `timeService` calcula o deslocamento entre o relógio do navegador e o servidor e expõe:
   - `getServerNow()`: nova `Date` com o mesmo instante do backend;
   - `formatServerDateTime(...)`: formata qualquer string ISO usando `pt-BR` + timezone de Fortaleza.
3. Componentes que exibem datas sensíveis (ex.: `admin-paroquia/games`) devem usar esse formatter (`formatServerDateTime`).

## Validação

1. **Documentado aqui** para referência dos times de QA.
2. Testes automatizados:
   - Verifique `GET /info/time` retorna timezone + `epoch_ms` numérico (backend).
   - Adicione um teste de impacto no frontend eventualmente simulando offset.

