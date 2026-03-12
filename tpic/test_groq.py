"""
Script de teste para Groq API GRÁTIS e SUPER RÁPIDO!
"""

from dotenv import load_dotenv
import os
from groq import Groq

print("=" * 70)
print("🚀 TESTE DE CONFIGURAÇÃO - Groq API (GRÁTIS & RÁPIDO!)")
print("=" * 70)
print()

# 1. Carregar variáveis de ambiente
print("1️⃣  Carregando arquivo .env...")
from pathlib import Path
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)
api_key = os.getenv("GROQ_API_KEY")

# 2. Verificar se a chave foi carregada
print()
if api_key:
    print("✅ Chave Groq carregada com sucesso!")
    print(f"   Primeiros 15 caracteres: {api_key[:15]}...")
    print(f"   Últimos 5 caracteres: ...{api_key[-5:]}")
    print(f"   Comprimento total: {len(api_key)} caracteres")
else:
    print("❌ Chave NÃO encontrada!")
    print("   Verifique se .env foi criado corretamente")
    print()
    print("   Você pode gerar uma chave gratuita em:")
    print("   → https://console.groq.com/keys")
    exit(1)

# 3. Testar conexão com API
print()
print("2️⃣  Testando conexão com Groq API...")
print()

try:
    client = Groq(api_key=api_key)
    
    print("   Modelos disponíveis na Groq:")
    print("   • llama-3.3-70b-versatile (Mais rápido e poderoso)")
    print("   • llama-3.1-8b-instant (Leve e rápido)")
    print("   • gemma2-9b-it (Compacto)")
    print()
    print("   Enviando mensagem de teste...")
    
    message = client.chat.completions.create(
        messages=[
            {"role": "user", "content": "Diga apenas a palavra 'Funcionando!' nada mais"}
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        max_tokens=100
    )
    
    response_text = message.choices[0].message.content
    print()
    print("✅ Groq API está FUNCIONANDO PERFEITAMENTE!")
    print(f"   Resposta: {response_text}")
    print()
    print("⚡ VELOCIDADE: Esta foi uma das APIs mais rápidas!")
    print("   • Tempo de resposta: ~200-500ms")
    print("   • Grátis e sem limites severos")
    print("   • Modelos de código aberto (Llama, Mixtral)")
    print()
    print("=" * 70)
    print("✓ TUDO OK! Você pode rodar os testes agora:")
    print()
    print("   bash run_tpic.sh")
    print()
    print("   OU verificar ambiente:")
    print()
    print("   bash verify_tpic.sh")
    print()
    print("=" * 70)
    
except Exception as e:
    print()
    print(f"❌ ERRO ao conectar com Groq: {e}")
    print()
    print("=" * 70)
    print("💡 POSSÍVEIS SOLUÇÕES:")
    print()
    
    error_str = str(e).lower()
    
    if "api key" in error_str or "invalid" in error_str or "unauthorized" in error_str:
        print("  1. ❌ Chave inválida ou não encontrada")
        print("     → Gerar chave em: https://console.groq.com/keys")
        print("     → Adicionar em .env: GROQ_API_KEY=gsk_...")
    
    elif "rate limit" in error_str or "quota" in error_str:
        print("  1. ⏱️ Rate limit atingido (improvável na Groq)")
        print("     → Aguarde alguns minutos")
        print("     → Tente novamente")
    
    elif "connection" in error_str or "network" in error_str:
        print("  1. 🌐 Problema de conexão de rede")
        print("     → Verifique sua conexão internet")
        print("     → Tente novamente")
    
    elif "model" in error_str:
        print("  1. 🤖 Modelo não disponível")
        print("     → Tente com: 'llama-3.3-70b-versatile' ou 'llama-3.1-8b-instant'")
    
    print()
    print("=" * 70)
    exit(1)
