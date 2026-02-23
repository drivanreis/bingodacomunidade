# 📣 Diretrizes de Comunicação e Contatos Obrigatórios

**Status:** obrigatório para produto, backend, frontend e suporte.  
**Última atualização:** 21/02/2026

---

## 1) Princípio inegociável

Comunicação é imprescindível para a operação do aplicativo.

Sem comunicação fluida não existe:
- suporte;
- recuperação de acesso;
- avisos de operação;
- continuidade de serviço.

---

## 2) Regra global de cadastro (todos os participantes)

Para qualquer pessoa participante do aplicativo, o cadastro deve garantir:

1. **Identificação mínima de nome**
   - nome completo, ou
   - nome social, ou
   - apelido operacional.

2. **Dados de contato obrigatórios (somente 2)**
   - e-mail;
   - telefone com DDD.

> O telefone único é o canal operacional para SMS/WhatsApp/voz.

> Objetivo: garantir que a plataforma sempre tenha mais de um caminho de contato funcional.

---

## 3) Política operacional de contato

- Nenhum usuário operacional deve permanecer sem os 2 dados de contato válidos (e-mail + telefone com DDD).
- Alterações de dados de contato devem preservar rastreabilidade (auditoria).
- Cadastro incompleto em contato deve ser bloqueado no backend.
- Mensagens de erro devem orientar exatamente o campo ausente/inválido.

---

## 4) Regras de UX e formulário

- O formulário deve ser claro sobre obrigatoriedade de comunicação.
- Campos de contato devem seguir módulos padronizados do sistema (evitar variações manuais por tela).
- O fluxo deve priorizar simplicidade mobile-first, sem esconder campos obrigatórios de comunicação.

---

## 5) Segurança e recuperação

- E-mail e telefone com DDD (usado para SMS/WhatsApp/voz) são base de recuperação de acesso e notificações críticas.
- Não permitir redução de contato para um estado sem capacidade real de comunicação.

---

## 6) Critério de aceite (DoD)

Uma funcionalidade de cadastro/edição só está pronta quando:
- exige identificação mínima de nome;
- exige e-mail + telefone com DDD;
- valida esses campos no frontend e no backend;
- registra a regra na documentação central/changelog quando houver mudança.
