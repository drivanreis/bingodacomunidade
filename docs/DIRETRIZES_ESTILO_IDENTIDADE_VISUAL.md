# 🎨 Diretrizes de Estilo, Identidade Visual e Mobile-First

**Status:** obrigatório para todo desenvolvimento de frontend e UX.  
**Última atualização:** 21/02/2026

---

## 1) Objetivo

Este sistema é desenvolvido por uma empresa (plataforma base), mas entregue para múltiplas instituições (ex.: paróquias), cada uma com cultura e identidade visual próprias.

Portanto, o produto deve seguir um modelo **multi-tenant com personalização visual por cliente**, sem perder consistência técnica.

---

## 2) Princípio de marca (plataforma x cliente)

### 2.1 Marca da plataforma (empresa desenvolvedora)
- Define arquitetura, componentes-base, padrões de acessibilidade e engenharia.
- **Não deve impor aparência final fixa** para o cliente institucional.

### 2.2 Marca do cliente (paróquia/empresa atendida)
- Define logo, paleta, tipografia e linguagem visual da experiência final.
- Deve ser aplicada no frontend do tenant de forma configurável.

### 2.3 Regra mandatória
- O Dashboard da Paróquia deve oferecer opção de customizar frontend/layout para refletir a identidade da instituição cliente.

---

## 3) Mobile-first obrigatório (distribuição real de uso)

Base operacional informada:
- **90%**: celulares de entrada (baixo custo)
- **5%**: celulares premium
- **3%**: outros dispositivos
- **2%**: notebook/PC

### Ordem obrigatória de design
1. Smartphone (prioridade máxima)
2. Mini-tablet
3. Desktop/Notebook

### Decisão de produto
- Qualquer decisão visual/UX deve ser aprovada primeiro no cenário de celular de entrada.
- Desktop é adaptação final, não ponto de partida.

---

## 4) Requisitos mínimos de customização por tenant

O painel administrativo da paróquia deve permitir, no mínimo:
- Upload/definição de logo da instituição.
- Definição de paleta principal (cor primária, secundária e destaque).
- Definição de cores de feedback (sucesso, aviso, erro, informação).
- Definição de cor de fundo e texto principal.
- Seleção de tipografia entre opções aprovadas do sistema.
- Pré-visualização antes de salvar.
- Ação de restaurar padrão da plataforma.

---

## 5) Diretrizes técnicas de implementação

- Implementar tema por tenant via tokens (ex.: variáveis CSS), evitando hardcode de cor em páginas.
- Centralizar tokens visuais para que páginas administrativas e públicas consumam a mesma fonte de verdade.
- Persistir configuração visual por tenant no backend.
- Aplicar fallback seguro quando tenant não tiver personalização definida.
- Garantir contraste mínimo e legibilidade em qualquer paleta aplicada.

---

## 6) Diretrizes de UX para celular de entrada

- Priorizar telas leves, com baixo custo de renderização.
- Evitar animações pesadas e efeitos visuais desnecessários.
- Usar áreas de toque confortáveis (botões e ações fáceis no polegar).
- Minimizar steps longos em formulários; preferir fluxo curto e objetivo.
- Garantir leitura clara com tipografia simples e espaçamento adequado.

---

## 7) Critérios de aceite (Definition of Done)

Uma entrega de frontend só é considerada pronta quando:
- Respeita o modelo multi-tenant de identidade visual.
- Funciona primeiro em smartphone de entrada.
- Mantém usabilidade em mini-tablet.
- Mantém compatibilidade em desktop/notebook.
- Não quebra acessibilidade e legibilidade ao trocar tema.
- Está registrada no changelog central.

---

## 8) Regra de governança

- Esta diretriz passa a ser referência obrigatória para decisões de UI/UX.
- Em conflito com decisões locais de tela, este documento prevalece até deliberação explícita.
- Toda mudança relacionada a tema/estilo deve atualizar esta diretriz e o changelog central.
