# ============================================================================
# Dockerfile - Frontend (Vite + React + TypeScript)
# ============================================================================
# Ambiente de desenvolvimento com hot-reload
# Porta: 5173 (padrão do Vite)

FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Metadados
LABEL maintainer="Sistema de Bingo Comunitário"
LABEL description="Frontend Vite + React + TypeScript para desenvolvimento"

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o código-fonte
COPY . .

# Expõe porta do Vite
EXPOSE 5173

# Comando para iniciar o servidor de desenvolvimento
# --host 0.0.0.0 permite acesso de fora do container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
