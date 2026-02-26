# 🎱 Briefing — Sistema de Bingo Comunitário

> **Um sistema de bingo não como jogo, mas como espetáculo de fé, transparência e tecnologia.**

Este documento descreve a visão, a filosofia e a arquitetura conceitual do **Sistema de Bingo Comunitário** — uma plataforma digital moldável, projetada para ser doada a paróquias e igrejas, oferecendo **arrecadação segura, engajamento real e risco financeiro zero** para a instituição.

---

## ⛪ 0. MISSÃO EVANGELIZADORA

### 🔥 Evangelizar é Preciso

**Este sistema é ferramenta de evangelização, não produto de entretenimento.**

Em um mundo onde:
- Jogos comunitários são banidos
- Paróquias perdem força de atração
- Famílias se fragmentam
- Fé esfria pelo isolamento

**O Bingo da Comunidade é resposta pastoral concreta:**

```
Bingo → Reunião → Comunidade → Evangelização → Permanência na Fé
```

### Por que Bingo?

Não pelo jogo em si, mas porque:

1. **Atrai**: Pretexto legítimo para famílias se reunirem
2. **Reúne**: Avós, pais, filhos — gerações juntas
3. **Fortalece**: Laços comunitários que sustentam a fé
4. **Financia**: Obras sociais concretas e visíveis
5. **Retém**: Fiel que participa, permanece

> 📖 **"Onde dois ou três estiverem reunidos em meu nome, aí estou eu no meio deles." - Mateus 18:20**

🔗 **[Leia documentação completa: MISSAO_PASTORAL.md](../MISSAO_PASTORAL.md)**

---

## 🌟 1. O Propósito

Criar um **bingo digital de confiança absoluta**, onde:

- O fiel se diverte  
- A paróquia arrecada  
- A tecnologia garante justiça  
- E ninguém pode trapacear  

Tudo isso apresentado como um **show de transparência**, onde cada centavo, cada cartela e cada pedra podem ser auditados.

---

## 🛡️ 2. A Estrutura de Governança  
### *Os Três Pilares*

O sistema separa **fé, dinheiro e tecnologia** de forma clara, para evitar conflitos e garantir integridade.

### 👑 Administrador Master — *O Guardião*
Responsável pela:
- Infraestrutura
- Servidores
- Segurança
- Continuidade técnica

> Ele **não interfere no jogo**.  
> Ele garante que a máquina nunca falhe.

---

### ⛪ Administrador da Paróquia — *O Operador*
Funcionário autorizado pela igreja que:
- Agenda os bingos
- Define o rateio financeiro
- Efetua os pagamentos via PIX

> Ele controla o **ritmo do evento**, mas não pode manipular os resultados.

---

### 🙏 O Fiel — *O Participante*
Cada fiel:
- Cria uma conta (e-mail ou WhatsApp)
- Registra sua chave PIX
- Compra cartelas
- Acompanha o prêmio crescer
- Recebe o valor automaticamente em caso de vitória

> O fiel não joga no escuro. Ele **vê tudo**.

---

## 🎭 3. Dinâmica do Jogo  
### *O Show e o Reinado*

Aqui o bingo deixa de ser só sorteio e vira **espetáculo controlado**.

### ⏳ O Intervalo Sagrado
Cada pedra é sorteada a cada **15 segundos**.  
Tempo suficiente para emoção, análise e suspense.

---

### 🖥️ A Tela é Dividida em Dois Reinos

#### 🔼 Metade Superior — *O Céu*
- Mostra o sorteio
- Animações em tempo real  
- Estilo visual **Lyric**

#### 🔽 Metade Inferior — *A Terra*
- Ranking dinâmico de todos os participantes
- O fiel pode clicar em qualquer nome
- Visualizar a cartela do “vizinho” em tempo real

> Se alguém estiver roubando, **todo mundo vê**.

---

### ⏱️ Vendas de Última Hora
- Cartelas podem ser compradas até **1 minuto antes** do sorteio
- O sistema suporta **vários bingos em sequência**

---

## 💰 4. O Coração Financeiro  
### *Rateio Dinâmico*

Aqui não existe prêmio fixo.

O prêmio cresce conforme a fé e a participação.

### 🔄 Divisão Automatizada
Cada bingo define sua própria regra, por exemplo:

| Destino | Percentual |
|-------|------------|
| Prêmio | 25% |
| Paróquia | 25% |
| Operação / TI | 25% |
| Seguro Operacional | 25% |

---

### 📈 Prêmio Pulsante
O valor do prêmio:
- Cresce em tempo real
- A cada nova cartela comprada
- Visível para todos na tela

---

### 🏆 Vitória Justa
- O sistema detecta automaticamente os vencedores
- Se mais de um fiel ganhar na mesma pedra:
  
> O prêmio é dividido **irmãmente** entre eles

---

## 🔐 5. Integridade & Tecnologia  
### *Single Source of Truth*

Nada depende de pessoas.  
Tudo depende de matemática e tempo.

---

### ⏰ O Relógio Oficial
- O servidor (Fortaleza-CE) é a **única verdade**
- Todos os IDs são baseados em Timestamp:

