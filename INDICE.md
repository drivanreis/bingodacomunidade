# 📚 ÍNDICE DE DOCUMENTAÇÃO - Sistema de Bingo Comunitário

> **Guia rápido:** Toda documentação técnica está organizada na pasta [`docs/`](docs/)

> **Ponto único obrigatório:** antes de qualquer operação ou manutenção, leia [`docs/CENTRAL_DOCUMENTACAO_OPERACIONAL.md`](docs/CENTRAL_DOCUMENTACAO_OPERACIONAL.md) e depois [`docs/CHANGELOG_CENTRAL.md`](docs/CHANGELOG_CENTRAL.md).

---

## 🧭 GOVERNANÇA CENTRAL

- **[Central de Documentação Operacional](docs/CENTRAL_DOCUMENTACAO_OPERACIONAL.md)** - Regras oficiais, precedência e fluxo de documentação
- **[Changelog Central](docs/CHANGELOG_CENTRAL.md)** - Histórico único das mudanças do projeto (inclui alterações de hoje)
- **[Diretrizes de Estilo e Identidade Visual](docs/DIRETRIZES_ESTILO_IDENTIDADE_VISUAL.md)** - Branding multi-tenant + prioridade mobile-first (obrigatório)
- **[Diretrizes de Comunicação e Contatos](docs/DIRETRIZES_COMUNICACAO_E_CONTATOS.md)** - Comunicação obrigatória para todos os participantes

---

## 🚀 INÍCIO RÁPIDO

### ⛪ Para Párocos e Líderes Comunitários:
1. **[MISSÃO PASTORAL](MISSAO_PASTORAL.md)** ⭐ - **LEIA PRIMEIRO**: O bingo como ferramenta de evangelização
2. **[SUGESTÕES FUTURAS](SUGESTOES_FUTURAS_PASTORAL.md)** 💡 - Melhorias opcionais para implementar

### Para Desenvolvedores:
1. **[Como Usar](docs/COMO_USAR.md)** - Guia prático de uso do sistema
2. **[Comandos Rápidos](docs/COMANDOS_RAPIDOS.md)** - Lista de comandos úteis
3. **[Docker Quickstart](docs/DOCKER_QUICKSTART.md)** - Início rápido com Docker

### Para Novos no Projeto:
1. **[START HERE](docs/START_HERE.md)** - Ponto de partida obrigatório
2. **[Briefing](docs/Briefing.md)** - Visão geral do projeto
3. **[Estrutura do Projeto](docs/ESTRUTURA_PROJETO.md)** - Organização de pastas

---

## 📖 DOCUMENTAÇÃO PRINCIPAL

### 🏗️ Arquitetura e Desenvolvimento
- **[Dev. Guide](docs/Dev.%20Guide.md)** - Guia completo do desenvolvedor
- **[Status Report Completo](docs/STATUS_REPORT_COMPLETO.md)** - Estado atual do sistema
- **[Resumo Executivo](docs/RESUMO_EXECUTIVO.md)** - Visão executiva do projeto

### 🔐 Autenticação e Segurança
- **[Implementação Autenticação](docs/IMPLEMENTACAO_AUTENTICACAO.md)** - Sistema de login completo
- **[Autenticação Frontend](docs/AUTENTICACAO_FRONTEND.md)** - Integração frontend
- **[Fase 2 Autenticação](docs/FASE2_AUTENTICACAO.md)** - Segunda fase do sistema
- **[Validação CPF](docs/VALIDACAO_CPF.md)** - Validador de CPF com Módulo 11

### 🔍 Análises Técnicas
- **[Análise Lógica Operacional](docs/ANALISE_LOGICA_OPERACIONAL.md)** - Validação de fluxos e capacidade
- **[Análise Segurança e Modularização](docs/ANALISE_SEGURANCA_MODULARIZACAO.md)** - Auditoria completa de segurança

### 🐳 Docker e Infraestrutura
- **[Integração Frontend Docker](docs/INTEGRACAO_FRONTEND_DOCKER.md)** - Containerização completa
- **[Resumo Integração](docs/RESUMO_INTEGRACAO.md)** - Integração de componentes

---

## ✅ CHECKLISTS E VALIDAÇÃO

- **[Checklist Completo](docs/CHECKLIST_COMPLETO.md)** - Lista completa de validações
- **[Checklist Validação](docs/CHECKLIST_VALIDACAO.md)** - Validações finais
- **[Testes do Sistema](docs/TESTES_SISTEMA.md)** - Testes manuais e automatizados

---

## 🎯 STATUS E ENTREGAS

- **[Aplicação Finalizada](docs/APLICACAO_FINALIZADA.md)** - Marco de conclusão
- **[Fase 2 Iniciada](docs/FASE2_INICIADA.md)** - Início da segunda fase
- **[Revisão Código Frontend](docs/REVISAO_CODIGO_FRONTEND.md)** - Análise de código

---

## 🔧 TROUBLESHOOTING

- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Solução de problemas comuns
- **[Índice Documentação](docs/INDICE_DOCUMENTACAO.md)** - Índice detalhado (legado)

---

## 📝 ARQUIVO PRINCIPAL

- **[README.md](Readme.md)** - Documentação principal do projeto
- **[README_NEW.md](docs/README_NEW.md)** - Versão atualizada do README

---

## 🗂️ ESTRUTURA DE PASTAS

```
bingodacomunidade/
├── README.md              # Documentação principal
├── INDICE.md             # Este arquivo (índice geral)
├── docs/                 # 📚 Toda documentação técnica
│   ├── COMO_USAR.md
│   ├── START_HERE.md
│   ├── Dev. Guide.md
│   └── ... (26 documentos)
├── backend/              # 🐍 API FastAPI
├── frontend/             # ⚛️ Interface React
├── docker-compose.yml    # 🐳 Orquestração
├── install.ps1           # 📦 Instalação Windows
├── start.ps1             # 🚀 Inicialização Windows
├── limpa.sh              # 🧹 Limpeza Linux
└── start.sh              # 🚀 Inicialização Linux
```

---

## 🎯 BUSCA RÁPIDA

| Procurando por... | Veja este documento |
|-------------------|---------------------|
| Como instalar? | [COMO_USAR.md](docs/COMO_USAR.md) |
| Como rodar? | [Docker Quickstart](docs/DOCKER_QUICKSTART.md) |
| Problemas? | [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |
| Arquitetura? | [Dev. Guide.md](docs/Dev.%20Guide.md) |
| Status atual? | [STATUS_REPORT_COMPLETO.md](docs/STATUS_REPORT_COMPLETO.md) |
| Segurança? | [Análise Segurança](docs/ANALISE_SEGURANCA_MODULARIZACAO.md) |
| Testes? | [TESTES_SISTEMA.md](docs/TESTES_SISTEMA.md) |
| Autenticação? | [IMPLEMENTACAO_AUTENTICACAO.md](docs/IMPLEMENTACAO_AUTENTICACAO.md) |

---

## 📌 DOCUMENTOS MAIS IMPORTANTES

1. **[START_HERE.md](docs/START_HERE.md)** - Comece aqui se é novo no projeto
2. **[Dev. Guide.md](docs/Dev.%20Guide.md)** - Guia técnico completo
3. **[STATUS_REPORT_COMPLETO.md](docs/STATUS_REPORT_COMPLETO.md)** - Estado atual detalhado
4. **[ANALISE_SEGURANCA_MODULARIZACAO.md](docs/ANALISE_SEGURANCA_MODULARIZACAO.md)** - Auditoria de segurança

---

## 📂 DOCUMENTOS ADICIONAIS

### 🎯 Primeiro Acesso e Configuração
- **[Leia Isto Primeiro](docs/LEIA_ISTO_PRIMEIRO.md)** - Informações iniciais importantes
- **[Início Rápido](docs/INICIO_RAPIDO.md)** - Guia de início rápido
- **[Sistema Primeiro Acesso](docs/SISTEMA_PRIMEIRO_ACESSO.md)** - Sistema de onboarding
- **[Conclusão Primeiro Acesso](docs/CONCLUSAO_PRIMEIRO_ACESSO.md)** - Finalização do setup
- **[Teste Manual Primeiro Acesso](docs/TESTE_MANUAL_PRIMEIRO_ACESSO.md)** - Testes do onboarding

### 🔐 Segurança e Recuperação
- **[Segurança Nível Bancário](docs/SEGURANCA_NIVEL_BANCARIO.md)** - Segurança avançada
- **[Recuperação de Senha](docs/RECUPERACAO_SENHA.md)** - Sistema de recuperação
- **[Configuração Email](docs/CONFIGURACAO_EMAIL.md)** - Setup de envio de emails

### 🚀 Deploy e Produção
- **[Deploy Produção](docs/DEPLOY_PRODUCAO.md)** - Guia de deploy
- **[Status Atual Linux](docs/STATUS_ATUAL_LINUX.md)** - Estado em ambiente Linux
- **[Migração Concluída](docs/MIGRACAO_CONCLUIDA.md)** - Histórico de migração
- **[Projeto Concluído](docs/PROJETO_CONCLUIDO.md)** - Marco de conclusão

### 🛠️ Suporte e Operação
- **[Fluxograma Suporte](docs/FLUXOGRAMA_SUPORTE.md)** - Fluxo de atendimento
- **[Quem Resolve o Quê](docs/QUEM_RESOLVE_O_QUE.md)** - Matriz de responsabilidades
- **[Mensagens de Erro](docs/MENSAGENS_ERRO.md)** - Catálogo de erros
- **[Scripts Utilitários](docs/SCRIPTS_UTILITARIOS.md)** - Scripts auxiliares

---

## 🔄 ÚLTIMA ATUALIZAÇÃO

**Data:** 26 de Janeiro de 2026  
**Versão:** 1.0.0  
**Documentos:** 42 arquivos na pasta docs/

---

**💡 Dica:** Use Ctrl+F (ou Cmd+F no Mac) para buscar palavras-chave neste índice!
