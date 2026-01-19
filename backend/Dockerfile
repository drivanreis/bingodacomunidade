# ===========================================================================
# Dockerfile - Sistema de Bingo Comunitário
# ===========================================================================
# Imagem otimizada para produção com multi-stage build

FROM python:3.11-slim

# Metadados
LABEL maintainer="Bingo da Comunidade"
LABEL description="Sistema de Bingo Comunitário - Backend API"

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Diretório de trabalho
WORKDIR /app

# Criar diretório para dados persistentes
RUN mkdir -p /app/data

# Copiar e instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fonte
COPY src/ ./src/

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/ping')"

# Comando de inicialização
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
