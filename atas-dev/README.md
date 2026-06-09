# ATAS-DEV

## Objetivo

Esta pasta deve ser a memória operacional do projeto.

Quando houver troca de:
- LLM
- extensão
- desenvolvedor
- sessão de trabalho

o ponto de partida deve estar aqui.

## Regra Principal

Cada ata precisa ser forte o suficiente para que a próxima pessoa ou IA consiga continuar o trabalho sem depender da conversa anterior.

Em outras palavras:

- a verdade deve estar na ata
- a continuidade deve estar na ata
- as decisões devem estar na ata
- os problemas devem estar na ata
- os próximos passos devem estar na ata
- o ponto de retomada deve estar na ata

## O Que Uma Ata Precisa Conter

Toda reunião ou sessão relevante deve gerar uma ata com contexto suficiente para retomada.

No mínimo, a ata precisa registrar:

1. O que foi discutido
2. Quais problemas foram identificados
3. Quais decisões foram tomadas
4. O que foi implementado
5. O que NÃO foi implementado
6. Impacto em banco, backend, frontend e processo
7. O que foi testado
8. O que ainda está pendente
9. Quais são os próximos passos
10. De onde a próxima sessão deve continuar
11. O que precisa ser documentado antes de encerrar a sessão

## Princípio de Continuidade

Se uma nova IA abrir este projeto sem conhecer nada antes, ela deve conseguir:

- ler as atas
- entender o contexto atual
- entender o histórico recente
- identificar o estado do projeto
- continuar sem inventar contexto

Se isso não for possível, a ata está fraca.

## Relação com a Pasta docs

- `atas-dev/` guarda o histórico operacional e decisório
- `docs/` guarda a documentação técnica e funcional do sistema

Resumo:

- `atas-dev` responde: "como chegamos até aqui e o que fazer agora?"
- `docs` responde: "como o sistema funciona e como deve funcionar?"

As duas pastas são complementares.

## Sobre Arquivos de Prompt

Arquivos de prompt podem existir como apoio, mas não podem ser a única fonte de contexto.

Se houver conflito entre:

- conversa
- prompt
- memória informal
- ata

a ata deve prevalecer como registro histórico da sessão.

## Nome dos Arquivos

Use o padrão:

`YYYY-MM-DD.md`

Exemplos:

- `2026-03-17.md`
- `2026-03-22.md`

## Critério de Qualidade

Uma ata boa:

- não é genérica
- não omite problemas
- não mistura discutido com implementado
- não depende da memória de quem participou
- permite retomada real
- empurra a próxima ata adiante

## Modelo Base de Ata

Use este modelo como estrutura mínima para novas atas.

O objetivo do modelo é impedir o problema mais perigoso de continuidade:

- uma ata decidir algo
- a sessão seguinte não executar nem verificar aquilo
- a próxima ata ter que corrigir a anterior
- o histórico virar remendo em vez de trilha

### Regra de Abertura Obrigatória

Toda nova ata deve começar verificando a ata anterior.

Antes de registrar qualquer tema novo, a ata precisa responder:

1. qual era o ponto de retomada deixado pela ata anterior
2. o que foi implantado antes desta nova sessão
3. o que não foi implantado
4. se a sessão atual está continuando o plano anterior ou mudando a prioridade
5. por que houve essa mudança, se houver

Se isso não estiver explícito, a continuidade quebrou.

### Template

```md
# ATA DE DESENVOLVIMENTO - YYYY-MM-DD

**Data:** YYYY-MM-DD
**Local:** ...
**Participantes:** ...
**Projeto:** Bingo da Comunidade
**Tipo de sessão:** decisão | implantação | correção | revisão | processo

## 1. Conexão com a Ata Anterior

**Ata anterior:** `YYYY-MM-DD.md`

### Ponto de retomada herdado

- ...

### Status antes desta sessão

- ✅ O que foi implantado desde a ata anterior
- ❌ O que deveria ter sido implantado e não foi
- ⚠️ O que ficou parcial

### Impacto no fluxo

- Explicar se a sessão atual continua o plano anterior ou se precisou corrigir desvio.

## 2. O que Foi Discutido

- ...

## 3. Problemas Identificados

- ...

## 4. Decisões Tomadas

- ...

## 5. Implementações Realizadas Nesta Sessão

- Arquivo / área:
- Mudança:
- Resultado:

## 6. O que NÃO Foi Implementado

- ...

## 7. Impacto por Área

- Banco:
- Backend:
- Frontend:
- Processo / documentação:

## 8. Testes e Validação

- O que foi testado:
- O que não foi testado:
- Resultado:

## 9. Pendências Reais ao Encerrar

- ...

## 10. Próximos Passos

1. ...
2. ...
3. ...

## 11. Ponto de Retomada Imediato

Se a próxima sessão começar daqui, deve iniciar por:

1. ...
2. ...
3. ...

## 12. Registro de Sobrevivência da Sessão

- O estado real ao encerrar é:
- A decisão que continua valendo é:
- O risco aberto é:
- A próxima sessão não deve reabrir:
```

### Regra de Ouro do Modelo

Uma ata nova não pode apenas registrar o presente.

Ela precisa:

- confirmar o que herdou
- declarar o que entregou
- admitir o que não entregou
- deixar a próxima sessão pronta

## Ideia de Locomotiva

Pense `atas-dev` como uma locomotiva de desenvolvimento.

Isso significa:

- cada ata deve se conectar com a anterior
- cada ata deve deixar claro o estado do projeto ao final da sessão
- cada ata deve deixar o próximo passo pronto para a próxima sessão

Se uma ata não consegue empurrar a próxima, ela ainda está fraca.

## Regra de Sobrevivência da Sessão

Mesmo que a LLM, IA, extensão ou sessão de trabalho seja interrompida, encerrada ou "morra" no meio do caminho, o estado atual do trabalho precisa estar documentado na ata mais recente.

Isso significa:

- não deixar contexto importante só na conversa
- não deixar a lista de tarefas só na memória
- não deixar decisão técnica só implícita
- registrar o ponto exato de retomada antes de encerrar

## Regra Final

Se tiver dúvida entre:

- escrever mais contexto na ata
- ou confiar que a próxima IA "vai entender"

escreva mais contexto na ata.
