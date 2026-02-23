# 🧭 Diretrizes Imutáveis (IA + Time)

**Objetivo:** evitar regressões, loops de correção e perda de contexto entre sessões.

---

## 1) Estado Zero (instalação)

- O sistema inicia via scripts de instalação com dois registros seed obrigatórios.
- Seed administrativo: login **Admin** e senha **admin123**.
- A referência seed deve continuar existindo para manter previsibilidade de instalação e testes.

---

## 2) Imortalidade dos Seeds (sem DELETE)

- **Nunca remover registros seed de referência.**
- Em substituição de titular/uso, aplicar inativação lógica:
  - `ativo = False` (ou `is_active = False` conforme modelo).
- Regra vale especialmente para:
  - seed de administração inicial;
  - referência de paróquia placeholder usada por integridade relacional.

---

## 3) Muralha de Perfis (3 tipos)

### Usuário Comum
- Entrada: **autocadastro**.
- Campos de contato obrigatórios para segurança/recuperação:
  - email;
  - DDD;
  - telefone.
- O telefone único é utilizado como canal de SMS/WhatsApp/voz.
- Ações: participação pública (cartelas, perfil).

### Contrato de Telefonia Brasil (obrigatório)
- Escopo nacional: somente números do Brasil.
- `+55` (DDI) **não deve ser armazenado** no banco; deve ser concatenado via código apenas no envio da mensagem.
- Entrada de telefone deve ser separada em dois campos:
  - `DDD`: seleção em lista (drop-list) com DDD + estado (ex.: `85 - Ceará`, `11 - São Paulo`);
  - `telefone`: número local com 9 dígitos na regra nacional e 10 dígitos nas exceções regionais permitidas.
- Regra nacional do nono dígito deve ser respeitada (9NNNN-NNNN), concluída no Brasil em 2016, mantendo suporte ao caso regional estendido de 10 dígitos locais.
- Para Usuário Comum, deve existir sinalização para Admin-Paróquia quando houver possível divergência entre UF do DDD informado e UF de referência do CPF.
- O Admin-Paróquia deve conseguir definir no dashboard quais UFs são permitidas para cadastro público da sua paróquia (checkbox por UF).
- Cadastro público deve ser bloqueado no backend quando o DDD informado mapear para UF não permitida na configuração da paróquia.

### Administradores (Site e Paróquia)
- Entrada: **somente via hierarquia** (sem autocadastro).
- Fluxo:
  - Admin-Site cria Admin-Site e Admin-Paróquia;
  - Admin-Paróquia cria subordinados paroquiais.
- Participação em jogo público: **proibida**.

### Regra específica: Admin-Site (obrigatória)
- Para autenticação/primeiro acesso do Admin-Site, os dados mínimos são:
  - nome completo, nome social ou apelido operacional;
  - email (fator 1);
  - DDD + telefone (fator 2, canal de SMS/WhatsApp/voz);
  - senha.
- CPF não é obrigatório para Admin-Site.
- CPF permanece requisito de Usuário Comum, não de administrador do site.
- Para tentativa explícita de login seed (`Admin`), o frontend deve consultar diretamente o endpoint de bootstrap, evitando tentativa prévia em endpoint administrativo padrão (reduz ruído e superfície de engenharia reversa por respostas diferenciais).

---

## 4) Trava de Manutenção (público)

- O frontend público deve permanecer bloqueado em manutenção até existir o **primeiro Admin-Paróquia real ativo**.
- A trava deve existir em dois níveis:
  - backend (bloqueio real de rotas públicas sensíveis);
  - frontend (mensagem clara de manutenção).
- A mesma chave deve ser reutilizável para manutenções programadas.

---

## 5) Primeiro Acesso e Troca de Bastão

- Login seed (Admin/admin123) inicia setup obrigatório.
- Ao concluir setup:
  - cria-se novo líder real;
  - seed administrativo é **inativado** (`ativo=False`), não removido.
- Resultado esperado:
  - instalação/testes continuam encontrando a referência seed;
  - operação passa ao novo líder real.

---

## 6) Validação de Campos (padrão de erro)

- Estratégia de teste: **revezamento campo-a-campo**.
- Em cada cenário de erro:
  - 1 campo inválido;
  - todos os demais válidos.
- Padrão de mensagem:
  - `Nome do Campo invalido`.
- Cobrir obrigatoriamente casos de entrada maliciosa/automação abusiva no frontend e backend.

---

## 7) Infraestrutura e Execução de Testes (Docker-First)

- Proibição de `.venv`: não utilizar ambientes virtuais Python dentro ou fora dos containers. As dependências são globais ao sistema do container.
- Execução: testes e comandos Python devem ser executados diretamente (ex: `pytest` ou `fastapi dev`), sem ativação de ambiente.
- Scripts de Automação: `install.sh` e `start.sh` devem gerenciar dependências via `pip install` direto, garantindo que o ambiente Docker seja a única fonte de verdade.

### Política de sessão (padrão bancário)

- Em caso de reinício inesperado do navegador ou restauração abrupta de páginas, a aplicação deve invalidar sessão local persistida e exigir novo login.
- O usuário deve sempre reautenticar quando a sessão de navegador não for considerada ativa/íntegra.
- Não confiar em cache/restauração automática do navegador como garantia de sessão válida.

### Foco final de homologação (mandatório)

- O teste final de aceitação em máquina limpa deve usar apenas **dois comandos**:
  1. `git clone <repo>`
  2. `./validar_pos_instalacao.sh`
- Não executar validações manuais fora dos contêineres.
- Após a validação, toda configuração operacional deve ser feita via navegador com a aplicação já em execução.
- Esta regra é o padrão oficial de entrega e validação final (“padrão Lyric”).

---

## 8) Regra Operacional para Sessões de IA

- Antes de qualquer alteração grande:
  - confirmar essas diretrizes;
  - validar impacto em seed/bootstrap/manutenção/hierarquia.
- Em caso de conflito entre implementação e este documento:
  - este documento prevalece até deliberação explícita do time.

---

## 9) Matriz de Identidades do Usuário (O Arquiteto)

- Sempre que o solicitante usar primeira pessoa (`eu`), o contexto deve ser resolvido pelo sufixo da identidade informada.
- A implementação e os testes automatizados devem respeitar estritamente a persona ativa.

### Personas oficiais

- **Eu (Admin-Site):** dono da plataforma. Responsável por setup inicial e gestão de paróquias. CPF não obrigatório; autenticação por nome + email + telefone + senha.
- **Eu (Admin-Paróquia):** gestor da unidade. Responsável por criar colaboradores e gerenciar jogos.
- **Eu (Usuário Comum):** apostador/fiel. Único com autocadastro, CPF e fluxo de compra de cartelas.
- **Eu (Colaborador):** usuário operacional da paróquia (ex.: vendedor/validador), subordinado ao Admin-Paróquia.

### Diretriz de Teste Automatizado

- Para alcançar cobertura >75%, as suítes Vitest/Pytest devem simular alternância entre as quatro identidades.
- Regra mandatória de isolamento: `Eu (Usuário Comum)` jamais pode acessar rotas de `Eu (Admin-Site)`.
- Casos de sucesso de login devem validar redirecionamento para o dashboard correto conforme identidade.

---

## 10) Protocolo de Comportamento de Teste (Personas de Stress)

- Sempre que criarmos ou revisarmos suítes no Vitest/Pytest, cada funcionalidade deve ser testada sob três mentalidades para cada nível de acesso (Usuário Comum, Admin-Site e Admin-Paróquia).

### Perfil [NOME_DO_CARGO] Inteligente (Caminho Feliz)

- Ação: executa fluxos perfeitos, sem erro de digitação e sem desvio de lógica.
- Expectativa:
  - respostas de sucesso (`200`/`201`);
  - persistência correta no banco;
  - navegação/redirecionamento fluido para a área correta.

### Perfil [NOME_DO_CARGO] Burro (UX/Resiliência)

- Ação: tenta cadastrar duas vezes, recuperar senha sem conta, enviar campos em branco e ignorar validações (DDD/telefone etc.).
- Expectativa:
  - nunca retornar erro interno (`500`) para erro de usuário;
  - responder com mensagens amigáveis e consistentes no padrão `Nome do Campo invalido` quando aplicável;
  - oferecer orientação clara de fluxo quando não for erro de campo.

### Perfil [NOME_DO_CARGO] Hacker (Segurança/PenTest)

- Ação: tenta força bruta, uso de CPF/email de terceiros, acesso a rota administrativa sem permissão e injeção de script/payload malicioso.
- Expectativa:
  - bloqueio imediato com `401`/`403` quando aplicável;
  - registro de tentativa suspeita em logs/auditoria;
  - validação mandatória no backend mesmo se o frontend falhar.

### Ação imediata obrigatória (gate de cobertura)

- Revisar continuamente as suítes de Login e Recuperação de Senha para incluir cenários de exceção por persona.
- Cenários mínimos mandatórios:
  - `Usuário Comum Burro`: tentativa de recuperação com email inexistente;
  - `Usuário Comum Hacker`: tentativa de reset com token de recuperação expirado.
- Esses cenários são obrigatórios para o gate de cobertura `>75%`.

---

## 11) Lembrete Permanente: Estilo, Marca e Prioridade de Dispositivo

- A plataforma é da empresa desenvolvedora, mas o frontend entregue deve respeitar a identidade visual do cliente (paróquia/empresa atendida).
- O Dashboard da Paróquia deve manter suporte a personalização visual por tenant (logo, paleta, tipografia e layout dentro dos padrões do sistema).
- Prioridade obrigatória de UX/UI por dispositivo:
  1. Smartphone de entrada (foco principal)
  2. Mini-tablet
  3. Desktop/Notebook
- Distribuição operacional de uso a considerar em decisões de produto:
  - 90% celular de entrada
  - 5% celular premium
  - 3% outros dispositivos
  - 2% notebook/PC
- Em qualquer dúvida de design, otimizar primeiro para celular barato e somente depois expandir para telas maiores.
- Referência oficial complementar: `docs/DIRETRIZES_ESTILO_IDENTIDADE_VISUAL.md`.

---

## 12) Lembrete Permanente: Comunicação Obrigatória

- Comunicação é requisito de negócio e operação, não opcional.
- Todos os participantes do aplicativo devem ter identificação mínima de nome (nome completo, nome social ou apelido operacional).
- Todos os participantes devem ter canais de contato obrigatórios:
  - e-mail;
  - telefone com DDD.
- O telefone único cobre SMS/WhatsApp/voz na operação.
- Formulários de cadastro/edição devem bloquear salvamento quando faltar canal de contato obrigatório.
- Frontend e backend devem validar esses campos de forma consistente.
- Referência oficial complementar: `docs/DIRETRIZES_COMUNICACAO_E_CONTATOS.md`.

---

**Última atualização:** 21/02/2026
