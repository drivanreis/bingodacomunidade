# 🔧 GUIA DE TROUBLESHOOTING

**Soluções para problemas comuns do sistema**

---

## 🐳 PROBLEMAS COM DOCKER

### ❌ Docker não está rodando

**Sintoma:** Erro ao executar `docker compose up`

**Solução:**
```powershell
# Abrir Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Aguardar 30 segundos
Start-Sleep -Seconds 30

# Verificar se está rodando
docker ps
```

---

### ❌ Porta 8000 ou 5173 já está em uso

**Sintoma:** `Error: bind: address already in use`

**Solução:**
```powershell
# Encontrar processo usando a porta
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <número> /F

# Ou reiniciar containers
docker compose down
docker compose up -d
```

---

### ❌ Containers não sobem

**Sintoma:** Container fica em loop de restart

**Solução:**
```powershell
# Ver logs detalhados
docker compose logs backend
docker compose logs frontend

# Reconstruir imagens
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

### ❌ Volume do banco não persiste dados

**Sintoma:** Dados desaparecem após restart

**Solução:**
```powershell
# Verificar volumes
docker volume ls

# Inspecionar volume
docker volume inspect bingodacomunidade_db_data

# Se necessário, recriar volume
docker compose down -v
docker compose up -d
```

---

## 🔐 PROBLEMAS DE AUTENTICAÇÃO

### ❌ Login não funciona

**Sintoma:** "Unauthorized" ou "Invalid credentials"

**Verificações:**
1. Senha correta? (case-sensitive)
2. Email correto?
3. Backend está rodando? (`http://localhost:8000/docs`)

**Solução:**
```powershell
# Verificar seed do banco
docker compose logs backend | Select-String "Seed"

# Recriar seed
docker compose down
Remove-Item backend\data\bingo.db -Force
docker compose up -d
```

---

### ❌ Token expirado

**Sintoma:** "Token expired" após algum tempo

**Solução:**
```javascript
// No navegador (F12 Console)
localStorage.removeItem('@BingoComunidade:token');
localStorage.removeItem('@BingoComunidade:user');
// Recarregar página
location.reload();
```

---

### ❌ Logout não funciona

**Sintoma:** Ainda consegue acessar páginas após logout

**Solução:**
```javascript
// Limpar todo localStorage
localStorage.clear();
sessionStorage.clear();
location.href = '/login';
```

---

## 🌐 PROBLEMAS DE CONEXÃO

### ❌ Frontend não conecta ao Backend

**Sintoma:** "Network Error" ou "CORS error"

**Verificações:**
1. Backend está rodando? (`docker compose ps`)
2. URL correta no `api.ts`? (http://localhost:8000)
3. CORS configurado no backend?

**Solução:**
```powershell
# Verificar se backend responde
curl http://localhost:8000/ping

# Reiniciar containers
docker compose restart
```

---

### ❌ Erro de CORS

**Sintoma:** "Access-Control-Allow-Origin" error

**Solução:**
Verificar arquivo `backend/src/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📦 PROBLEMAS COM DEPENDÊNCIAS

### ❌ npm install falha

**Sintoma:** Erro durante instalação de pacotes

**Solução:**
```powershell
cd frontend

# Limpar cache
npm cache clean --force

# Deletar node_modules
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force

# Reinstalar
npm install
```

---

### ❌ pip install falha

**Sintoma:** Erro ao instalar requirements.txt

**Solução:**
```powershell
# Entrar no container
docker compose exec backend bash

# Atualizar pip
pip install --upgrade pip

# Reinstalar requirements
pip install -r requirements.txt --no-cache-dir
```

---

## 🎮 PROBLEMAS COM JOGOS

### ❌ Não consigo criar jogo

**Sintoma:** Erro ao submeter formulário

**Verificações:**
1. Soma dos percentuais = 100%?
2. Data no futuro?
3. Campos obrigatórios preenchidos?
4. Usuário é Admin?

**Solução:**
```javascript
// Verificar role no console
console.log(user.role); // deve ser 'super_admin' ou 'parish_admin'
```

---

### ❌ Prêmio não atualiza

**Sintoma:** total_prize não muda ao comprar cartela

**Solução:**
```sql
-- Verificar no banco
SELECT id, title, total_prize, cards_sold FROM games;

-- Recalcular manualmente (se necessário)
UPDATE games SET total_prize = card_price * cards_sold * (prize_percent / 100);
```

---

### ❌ Cartela não é gerada

**Sintoma:** Erro ao comprar cartela

**Verificações:**
1. Usuário está logado?
2. Jogo está ativo/agendado?
3. Limite de cartelas não foi atingido?

**Solução:**
```powershell
# Ver logs do backend
docker compose logs -f backend

# Verificar endpoint
curl -X POST http://localhost:8000/games/{id}/cards \
  -H "Authorization: Bearer {seu-token}"
```

---

## 🎨 PROBLEMAS DE INTERFACE

### ❌ Estilos não carregam

**Sintoma:** Página aparece sem formatação

**Solução:**
```powershell
# Limpar cache do Vite
cd frontend
Remove-Item .vite -Recurse -Force
npm run dev
```

---

### ❌ Componentes não renderizam

**Sintoma:** Tela em branco ou erro no console

**Solução:**
```javascript
// Abrir console do navegador (F12)
// Verificar erros
// Verificar se há typos em imports

// Recarregar aplicação
Ctrl + Shift + R (hard reload)
```

---

### ❌ Hot-reload não funciona

**Sintoma:** Mudanças no código não aparecem

**Solução:**
```powershell
# Frontend
docker compose restart frontend

# Backend
docker compose restart backend

# Se persistir
docker compose down
docker compose up --build -d
```

---

## 📱 PROBLEMAS MOBILE

### ❌ Layout quebrado em mobile

**Sintoma:** Elementos sobrepostos ou fora da tela

**Solução:**
```css
/* Adicionar viewport no index.html */
<meta name="viewport" content="width=device-width, initial-scale=1.0">

/* Verificar media queries no CSS */
@media (max-width: 768px) {
  /* Ajustes mobile */
}
```

---

### ❌ Menu mobile não abre

**Sintoma:** Botão não responde ao toque

**Solução:**
```typescript
// Verificar evento de click no Navbar.tsx
onClick={() => setMenuOpen(!menuOpen)}

// Testar no console
document.querySelector('.mobile-menu-button').click();
```

---

## 🗄️ PROBLEMAS COM BANCO DE DADOS

### ❌ Banco não cria tabelas

**Sintoma:** Erro "table not found"

**Solução:**
```powershell
# Deletar banco e recriar
docker compose down
Remove-Item backend\data\bingo.db -Force
docker compose up -d

# Verificar logs de criação
docker compose logs backend | Select-String "CREATE TABLE"
```

---

### ❌ Dados duplicados

**Sintoma:** Seed cria registros múltiplos

**Solução:**
```python
# Verificar função check_existing_data() no seed.py
# Deve retornar True se dados já existem

# Resetar banco
docker compose exec backend python -c "
from src.db.base import engine
from src.models.models import Base
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
"
```

---

## 🔍 FERRAMENTAS DE DEBUG

### Console do Navegador (F12)
```javascript
// Ver estado do Auth
const authState = JSON.parse(localStorage.getItem('@BingoComunidade:user'));
console.log(authState);

// Verificar token
const token = localStorage.getItem('@BingoComunidade:token');
console.log(token);

// Testar API manualmente
fetch('http://localhost:8000/games', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

### Logs do Docker
```powershell
# Ver logs em tempo real
docker compose logs -f

# Logs de um container específico
docker compose logs -f backend
docker compose logs -f frontend

# Últimas 100 linhas
docker compose logs --tail 100
```

### Swagger UI
```
http://localhost:8000/docs

# Testar endpoints diretamente
# Clicar em "Authorize" e inserir token
```

---

## 🆘 RESET COMPLETO

Se nada funcionar, reset total:

```powershell
# 1. Parar tudo
docker compose down -v

# 2. Limpar Docker
docker system prune -af
docker volume prune -f

# 3. Deletar dados
Remove-Item backend\data\bingo.db -Force -ErrorAction SilentlyContinue
Remove-Item frontend\node_modules -Recurse -Force -ErrorAction SilentlyContinue

# 4. Reinstalar frontend
cd frontend
npm install
cd ..

# 5. Reconstruir
docker compose build --no-cache

# 6. Subir
docker compose up -d

# 7. Verificar logs
docker compose logs -f
```

---

## 📞 SUPORTE

Se o problema persistir:

1. **Verifique os logs:** `docker compose logs -f`
2. **Consulte a documentação:** README.md, START_HERE.md
3. **GitHub Issues:** Abra uma issue descrevendo o problema
4. **Email:** suporte@bingodacomunidade.com.br

**Ao reportar um problema, inclua:**
- Sistema operacional
- Versão do Docker
- Logs relevantes
- Passos para reproduzir
- Mensagens de erro completas
