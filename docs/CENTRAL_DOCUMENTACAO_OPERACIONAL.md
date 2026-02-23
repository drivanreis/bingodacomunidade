# 📌 Central de Documentação Operacional

**Versão:** 1.0.0  
**Última atualização:** 21/02/2026  
**Objetivo:** ser o ponto único e oficial de operação, mudanças e decisões do projeto.

---

## 🎯 Por que este documento existe

Após meses de evolução, ficou claro que a falta de centralização gera retrabalho, regressão e perda de contexto.

Este arquivo define:
- onde consultar a verdade oficial do sistema;
- quais documentos são obrigatórios por perfil;
- como registrar mudanças para nunca perder histórico;
- como operar fluxos críticos (ex.: criação/reenvio de senha de Admin-Site).

---

## ✅ Fonte oficial (Single Source of Truth)

A ordem de precedência é:
1. `docs/DIRETRIZES_IMUTAVEIS_IA.md`
2. `docs/CENTRAL_DOCUMENTACAO_OPERACIONAL.md` (este arquivo)
3. `docs/CHANGELOG_CENTRAL.md`
4. `docs/INDICE_DOCUMENTACAO.md`

Se houver conflito entre documentos, siga essa ordem.

---

## 📚 Leitura obrigatória por tema

### Operação diária
- `docs/COMANDOS_RAPIDOS.md`
- `docs/TROUBLESHOOTING.md`
- `docs/QUEM_RESOLVE_O_QUE.md`

### Segurança e autenticação
- `docs/SEGURANCA_NIVEL_BANCARIO.md`
- `docs/IMPLEMENTACAO_AUTENTICACAO.md`
- `docs/SISTEMA_PRIMEIRO_ACESSO.md`

### UX, estilo e identidade visual
- `docs/DIRETRIZES_ESTILO_IDENTIDADE_VISUAL.md`

### Comunicação e contato obrigatório
- `docs/DIRETRIZES_COMUNICACAO_E_CONTATOS.md`

### E-mail e credenciais administrativas
- `docs/CONFIGURACAO_EMAIL.md`
- `docs/CHANGELOG_CENTRAL.md` (seção de 21/02/2026)

---

## 🔐 Fluxo crítico: senha de Admin-Site

### Pré-requisitos obrigatórios
1. Configurar SMTP real no painel de configurações.
2. Garantir `emailDevMode=false`.
3. Executar teste de envio no botão **Testar e-mail**.
4. Confirmar que `smtpValidatedAt` está válido (feito automaticamente após teste bem-sucedido).

### Criação de novo Admin-Site (reserva)
- A API bloqueia criação se SMTP não estiver validado.
- A senha inicial é gerada e enviada por e-mail.

### Reenvio de senha
- Existe ação de **Reenviar senha** em Gerenciar Usuários do Site.
- O backend gera nova senha temporária, envia por e-mail e invalida a senha anterior.

---

## 🧭 Processo obrigatório para qualquer mudança

Sempre que alterar backend/frontend/infra:
1. Atualizar `docs/CHANGELOG_CENTRAL.md` no mesmo dia.
2. Incluir o que mudou, risco operacional e validação executada.
3. Se alterar fluxo crítico, atualizar também este documento.
4. Atualizar índices (`INDICE.md` e `docs/INDICE_DOCUMENTACAO.md`) se houver novo documento central.

---

## 🧪 Checklist de publicação interna

Antes de anunciar uma entrega:
- [ ] Mudança registrada no changelog central
- [ ] Fluxo validado (teste automatizado ou manual com evidência)
- [ ] Mensagens de erro e operação documentadas
- [ ] Impactos para Admin-Site claros

---

## 👥 Regra de equipe

Ninguém fecha tarefa sem documentação mínima.

**Definição de pronto inclui:**
- código funcionando;
- teste executado;
- documentação central atualizada.
