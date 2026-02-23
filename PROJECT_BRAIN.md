# RESUMO SESSIONS CHAT — BASE OPERACIONAL (IMUTÁVEL)

Este documento substitui resumos genéricos e define as regras centrais de operação do projeto para implementação, manutenção e testes.

## 1) Estado Zero e Imortalidade (ID 1)

### Seed obrigatório (`install.sh`)
- O banco inicia com **ID 1 fixo** para:
	- Paróquia Placeholder
	- Admin do Site
- Credenciais iniciais de referência para bootstrap/testes:
	- Login: `Admin`
	- Senha: `admin123`

### Regra de Ouro (integridade)
- **Nunca usar `DELETE` no ID 1**.
- Em substituição de liderança/conta raiz, aplicar **`is_active = False`**.
- Objetivo: preservar referência estável para execução repetível dos testes e reinicialização confiável do ambiente.

## 2) Arquitetura de Usuários e Hierarquia

### Usuários Comuns (Apostadores)
- São os **únicos** com autocadastro.
- Exigem `ddd` e `telefone` em campos separados.
- `whatsapp` é obrigatório (fluxos críticos: 2FA e premiação).
- Não podem possuir cargos administrativos.

### Administradores (Site/Paróquia)
- Não possuem autocadastro.
- São criados **somente por hierarquia superior**.
- Não podem participar de jogos/cartelas.

### Diferencial chave
- Distinção de perfis baseada em:
	- Método de entrada: autocadastro vs criação hierárquica.
	- Elegibilidade de participação no jogo.

## 3) Modo de Manutenção (Feature Toggle)

### Trava pós-deploy
- Após `start.sh`, o frontend de Usuários Comuns deve iniciar bloqueado com estado **Em Manutenção**.

### Liberação controlada
- O sistema só é liberado após a configuração do **primeiro Admin-Paróquia real** via fluxo associado ao ID 1.

## 4) Protocolo de Testes (Vitest — Revezamento de Erros)

### Estratégia principal
- Validar campos **um por vez**.
- Em cada caso de teste: manter todos os demais campos válidos e invalidar apenas o alvo.

### Padrão de erro
- Mensagem deve seguir exatamente: **`[Nome do Campo] invalido`**.

### Cenários mínimos obrigatórios
- **Nome completo**:
	- vazio
	- apenas uma palavra
	- contendo números
- **Contato**:
	- validar `ddd` (2 dígitos)
	- validar `telefone` separadamente

### Foco de segurança
- Priorizar testes nos arquivos de teste, garantindo validação rigorosa no Front e no Back contra preenchimento em massa e inputs maliciosos.

## 5) Ciclo de Vida do Admin (Troca de Bastão)

- Fluxo de teste inicia com `Admin/admin123`.
- No primeiro acesso, o sistema exige cadastro completo.
- Um novo líder é criado.
- O ID 1 original é desativado com `is_active = False` (sem exclusão).
- O seed permanece intacto para permitir reexecução do ciclo de testes a partir do estado zero, sempre que necessário.

## 6) Status Atual do Desenvolvimento

### Implementado com sucesso (evidência em código/testes)
- Fluxo bootstrap funcional com desativação do admin seed após criação do líder real (`/auth/bootstrap` + `/auth/bootstrap/login`).
- Trava de manutenção pública funcional: signup/login público bloqueados até existir Admin-Paróquia ativo (`/auth/public-status`, `ensure_public_access_enabled`).
- Separação de autenticação administrativa em rotas distintas (Admin-Site e Admin-Paróquia) com bloqueio cruzado por nível de acesso.
- Frontend com suíte Vitest robusta no cadastro público, incluindo validação de DDD, telefone, erro por campo e cenários de payload malicioso (SQL injection em campos críticos).

### Impedimentos (bloqueado por falta de clareza de regra)
- **Identidade canônica dos registros de referência**: parte da documentação impõe ID 1 fixo/imortal, enquanto outra parte ancora arquitetura em IDs temporais para entidades-chave.
- **Contrato de contato do usuário comum**: regra vigente consolidada para Brasil com `ddd + telefone` separados, `+55` apenas no envio e validação de 9º dígito.
- **Modelo de tenancy/paróquia**: há documentos descrevendo “uma paróquia por instalação” e outros descrevendo “múltiplas paróquias independentes”.

### Próximos 3 passos imediatos (Backend FastAPI + Vitest)
1. **Congelar contratos de domínio no backend**: padronizar definitivamente Signup/validação para `ddd`, `telefone`, `whatsapp` obrigatório e mensagens no padrão `[Nome do Campo] invalido`.
2. **Aplicar regra de imortalidade do seed no fluxo de bootstrap**: blindar tecnicamente o registro de referência para nunca sofrer deleção física e sempre usar desativação lógica.
3. **Expandir testes de contrato em revezamento de erros**: espelhar no backend (pytest) os mesmos cenários já cobertos no Vitest, garantindo paridade Front/Back e bloqueio a preenchimento em massa.

## 7) Infraestrutura e Execução de Testes

### Ambiente
- O projeto é **100% baseado em Docker**.
- Não utilizamos ambientes virtuais (`.venv`) ou `pipenv/poetry` fora do contêiner.

### Execução global
- Todas as dependências Python devem ser instaladas **globalmente no Python do contêiner**.

### Proibição operacional
- Nunca sugerir `source .venv/bin/activate`.
- Nunca sugerir criação de novo ambiente virtual para este projeto.
- Testes com `pytest` e `vitest` devem rodar diretamente por comando no terminal do contêiner ou via `docker exec`.

### Justificativa
- Simplicidade operacional.
- Paridade entre desenvolvimento e execução.

## Prompt de Foco (para continuidade)

Sempre considerar este contexto como referência operacional prioritária:

1. Estado Zero e Imortalidade (ID 1)
2. Arquitetura de Usuários e Hierarquia
3. Modo de Manutenção (Feature Toggle)
4. Protocolo de Testes (Vitest — Revezamento de Erros)
5. Ciclo de Vida do Admin (Troca de Bastão)

Se houver conflito entre instruções genéricas e estes pilares, prevalecem estes pilares.

Ao iniciar um novo chat, a primeira tarefa obrigatória é ler este arquivo (`PROJECT_BRAIN.md`) antes de qualquer alteração de código/documentação.
