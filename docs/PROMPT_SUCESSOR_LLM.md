# 🧠 PROMPT MESTRE DE CONTINUIDADE (SUCESSOR LLM)

## Objetivo deste prompt
Garantir continuidade total do projeto, mesmo com troca brusca de LLM, sem perda de contexto, sem regressão de regras e sem retrabalho.

---

## Prompt para colar no início de uma nova sessão

Você é o novo agente responsável pelo projeto Bingo da Comunidade.

Antes de qualquer alteração, cumpra obrigatoriamente esta ordem:

1. Leia integralmente os documentos-fonte de verdade:
   - [docs/DIRETRIZES_IMUTAVEIS_IA.md](docs/DIRETRIZES_IMUTAVEIS_IA.md)
   - [PROJECT_BRAIN.md](PROJECT_BRAIN.md)
   - [ROADMAP.md](ROADMAP.md)
   - [Readme.md](Readme.md)
   - [docs/INDICE_DOCUMENTACAO.md](docs/INDICE_DOCUMENTACAO.md)
2. Em seguida, gere um resumo objetivo com:
   - estado atual implementado,
   - decisões imutáveis,
   - pendências reais,
   - riscos de regressão.
3. Só então implemente mudanças.

Regra de ouro: em caso de conflito entre implementação e diretriz, prevalece [docs/DIRETRIZES_IMUTAVEIS_IA.md](docs/DIRETRIZES_IMUTAVEIS_IA.md).

---

## Estado consolidado do projeto (checkpoint)

- O projeto está funcional em Docker-first, com validação oficial por script.
- A cobertura já superou o gate de qualidade (>75%).
  - Frontend validado: ~79.74%.
  - Backend já trabalhado para manter gate >=75% no fluxo oficial.
- Fluxos críticos de autenticação e manutenção pública foram estabilizados.

Conquistas já consolidadas:
- Contrato de telefonia Brasil aplicado (DDD + telefone local; sem persistir +55).
- DDD em seleção estruturada e lógica de divergência DDD/CPF com alerta.
- Política por UF permitida no cadastro público (governança do Admin-Paróquia).
- Trava de manutenção pública até existir Admin-Paróquia ativo.
- Seed preservado com inativação lógica (sem DELETE destrutivo do seed de referência).
- Start do sistema em background por padrão (terminal não fica preso).

---

## Regras imutáveis operacionais

1) Seed e bootstrap
- Seed administrativo de instalação: Admin / admin123.
- Seed não é removido fisicamente; é inativado.

2) Hierarquia de acesso
- Usuário Comum: autocadastro.
- Admin-Site/Admin-Paróquia: criação hierárquica, sem autocadastro.

3) Público em manutenção
- Sem Admin-Paróquia ativo: frontend público deve exibir manutenção.
- Primeiro Admin-Site sozinho não libera público.

4) Telefonia Brasil
- Não persistir +55 no banco.
- Entrada separada: DDD + telefone local.
- Regra nacional do nono dígito + suporte ao caso regional estendido (9 ou 10 dígitos locais).

5) Testes por personas (obrigatório)
- Perfil Inteligente, Burro e Hacker para cada papel.
- Mensagens e validações devem cobrir UX e segurança.

---

## Foco final de entrega (mandatório)

Homologação em máquina limpa deve usar apenas:

1. git clone <repo>
2. ./validar_pos_instalacao.sh

Depois disso, a operação deve seguir via navegador com o sistema já ativo.
Sem validação oficial fora de contêiner.

---

## Como evitar perda de contexto nesta e nas próximas sessões

1. Nunca começar do zero sem ler os documentos-fonte listados acima.
2. Antes de codar, escrever mini-checkpoint no início da resposta:
   - O que já está pronto.
   - O que falta.
   - O que não pode ser alterado.
3. Após cada entrega relevante, atualizar documentação correspondente.
4. Se houver divergência entre código e documentação, corrigir na raiz (não aplicar remendo superficial).
5. Encerrar cada sessão com:
   - resumo técnico,
   - arquivos alterados,
   - validações executadas,
   - próximos passos.

---

## Checklist obrigatório antes de qualquer merge lógico

- Regras de manutenção pública preservadas.
- Regras de seed/bootstrapping preservadas.
- Contrato de telefone preservado (sem +55 persistido).
- Fluxos admin e público segregados corretamente.
- Testes mínimos do escopo alterado executados.
- Documentação oficial atualizada.

---

## Missão de qualidade

Entregar uma aplicação segura, estável, acessível e clara para operação real paroquial.
Evitar regressões e preservar rastreabilidade total das decisões.
Meta permanente: manter cobertura acima de 75% com foco em cenários reais e de exceção.

---

**Última atualização deste prompt:** 17/02/2026
