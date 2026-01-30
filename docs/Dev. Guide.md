# 🛠️ Dev Guide — Sistema de Bingo Comunitário

> **Este não é um app. É uma máquina de confiança, entretenimento e arrecadação.**  
> Este guia descreve como essa máquina é construída, fase por fase.

---

## 🧱 Fase 1 — A Fundação do **Concentrador**  
*(Backend & Banco de Dados)*

Aqui nasce o **núcleo da verdade**.  
Tudo que existir no sistema depende desta base.

### 🎯 Objetivo
Criar:
- O banco de dados
- A identidade temporal dos objetos
- As regras de acesso

Nada mais funciona se isso falhar.

---

### ⚙️ Ações

#### 🗄️ Setup do Banco (PostgreSQL)
- Todas as tabelas usam **timezone fixo (Fortaleza-CE)**
- Nenhum dado depende do horário do cliente

> O servidor define o tempo. Sempre.

---

#### 🕒 Lógica de IDs Temporais
Implementar um gerador de IDs baseado em:

